import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAdminStorage,
  setTrustedAdminDevice,
} from "@/lib/admin-session-storage";
import {
  authDeadline,
  authErrorMessage,
  type AdminAuthStatus,
} from "@/lib/admin-auth";

interface AuthState {
  user: User | null;
  session: Session | null;
  status: AdminAuthStatus;
  error: string | null;
}
interface AuthContextType extends AuthState {
  isAdmin: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    trusted?: boolean,
  ) => Promise<{ error: string | null }>;
  signOut: (allDevices?: boolean) => Promise<void>;
  retry: () => Promise<void>;
  prepareRecovery: (userId: string) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const signedOut: AuthState = {
  user: null,
  session: null,
  status: "signed_out",
  error: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...signedOut,
    status: "loading",
  });
  const generation = useRef(0);
  const currentUser = useRef<string | null>(null);
  const recovery = useRef(false);
  const mounted = useRef(true);
  const queryClient = useQueryClient();
  const resolve = useCallback(
    async (session: Session | null, recoveryEvent = false) => {
      const version = ++generation.current;
      if (currentUser.current !== (session?.user.id || null)) {
        queryClient.clear();
        currentUser.current = session?.user.id || null;
      }
      if (!session) {
        recovery.current = false;
        sessionStorage.removeItem("temple-admin-recovery");
        if (mounted.current) setState(signedOut);
        return;
      }
      const pending: AuthState = {
        user: session.user,
        session,
        status: "loading",
        error: null,
      };
      const recoveryRecord = sessionStorage.getItem("temple-admin-recovery");
      recovery.current = recoveryEvent;
      if (recoveryRecord) {
        try {
          const r = JSON.parse(recoveryRecord);
          recovery.current = r.id === session.user.id && r.expires > Date.now();
        } catch {
          sessionStorage.removeItem("temple-admin-recovery");
        }
      }
      if (mounted.current) setState(pending);
      try {
        const identity = await authDeadline(
          supabase.auth.getUser(session.access_token),
        );
        if (identity.error || identity.data.user?.id !== session.user.id)
          throw identity.error || new Error("Identity mismatch");
        const role = await authDeadline(
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle(),
        );
        if (role.error) throw role.error;
        let status: AdminAuthStatus = "denied";
        if (role.data) {
          const level = await authDeadline(
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(
              session.access_token,
            ),
          );
          if (level.error || !level.data)
            throw level.error || new Error("Assurance unavailable");
          status =
            level.data.nextLevel === "aal2" &&
            level.data.currentLevel !== "aal2"
              ? "mfa_required"
              : recovery.current
                ? "recovery"
                : "admin";
        }
        if (mounted.current && version === generation.current)
          setState({ ...pending, user: identity.data.user, status });
      } catch {
        if (mounted.current && version === generation.current)
          setState({
            ...pending,
            status: "error",
            error: "We could not verify administrator access. Please retry.",
          });
      }
    },
    [queryClient],
  );

  useEffect(() => {
    mounted.current = true;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const eventVersion = ++generation.current;
      if (event === "PASSWORD_RECOVERY" && session) {
        recovery.current = true;
        sessionStorage.setItem(
          "temple-admin-recovery",
          JSON.stringify({
            id: session.user.id,
            expires: Date.now() + 15 * 60_000,
          }),
        );
      }
      if (!session) {
        void resolve(null);
        return;
      }
      setState({ user: session.user, session, status: "loading", error: null });
      // SDK calls must be outside the auth-event callback's internal lock.
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (mounted.current && generation.current === eventVersion)
          void resolve(session);
      }, 0);
      timers.add(timer);
    });
    const initialVersion = generation.current;
    void authDeadline(supabase.auth.getSession())
      .then(({ data, error }) => {
        if (!mounted.current || generation.current !== initialVersion) return;
        if (error)
          setState({
            ...signedOut,
            status: "error",
            error: "Your session could not be restored. Please retry.",
          });
        else void resolve(data.session);
      })
      .catch(() => {
        if (mounted.current && generation.current === initialVersion)
          setState({
            ...signedOut,
            status: "error",
            error: "Your session could not be restored. Please retry.",
          });
      });
    return () => {
      mounted.current = false;
      ++generation.current;
      subscription.unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, [resolve]);

  const signIn = async (email: string, password: string, trusted = false) => {
    try {
      setTrustedAdminDevice(trusted);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error: authErrorMessage(error) };
      if (!data.session)
        return { error: "Sign-in could not be completed. Please try again." };
      return { error: null };
    } catch (error) {
      return { error: authErrorMessage(error) };
    }
  };
  const signOut = async (allDevices = false) => {
    ++generation.current;
    recovery.current = false;
    queryClient.clear();
    setState(signedOut);
    sessionStorage.removeItem("temple-admin-recovery");
    try {
      const { error } = await authDeadline(
        supabase.auth.signOut({ scope: allDevices ? "global" : "local" }),
      );
      if (error)
        throw new Error(
          "Local sign-out completed. Server session revocation could not be confirmed.",
        );
    } finally {
      clearAdminStorage();
    }
  };
  const retry = useCallback(async () => {
    const version = generation.current;
    try {
      const { data, error } = await authDeadline(supabase.auth.getSession());
      if (!mounted.current || version !== generation.current) return;
      if (error) throw error;
      await resolve(data.session);
    } catch {
      if (mounted.current && version === generation.current)
        setState({
          ...signedOut,
          status: "error",
          error: "Unable to check your session. Please try again.",
        });
    }
  }, [resolve]);
  const prepareRecovery = useCallback((userId: string) => {
    recovery.current = true;
    sessionStorage.setItem(
      "temple-admin-recovery",
      JSON.stringify({ id: userId, expires: Date.now() + 15 * 60_000 }),
    );
  }, []);
  return (
    <AuthContext.Provider
      value={{
        ...state,
        loading: state.status === "loading",
        isAdmin: state.status === "admin",
        signIn,
        signOut,
        retry,
        prepareRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
