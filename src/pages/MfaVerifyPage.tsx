import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminAuthLayout,
  authButtonClass,
} from "@/components/auth/AdminAuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export default function MfaVerifyPage() {
  const auth = useAuth();
  const [factors, setFactors] = useState<
    { id: string; friendly_name?: string }[]
  >([]);
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (auth.status !== "mfa_required") return;
    let active = true;
    void supabase.auth.mfa
      .listFactors()
      .then(({ data, error }) => {
        if (!active) return;
        const verified =
          data?.totp.filter((f) => f.status === "verified") || [];
        if (error || !verified.length) {
          setError(
            "No available authenticator was found. Contact the temple owner for account recovery.",
          );
          return;
        }
        setFactors(verified);
        setFactorId(verified[0].id);
        codeRef.current?.focus();
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load your authenticator. Please reconnect and try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [auth.status]);
  if (auth.status === "admin") return <Navigate to="/admin" replace />;
  if (auth.status === "recovery")
    return <Navigate to="/reset-password" replace />;
  if (auth.status === "signed_out" || auth.status === "denied")
    return <Navigate to="/login" replace />;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      codeRef.current?.focus();
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (error) {
        setCode("");
        setError(
          error.status === 429
            ? "Too many attempts. Wait a minute before trying again."
            : "The code could not be verified. Try the latest code and check that your phone time is automatic.",
        );
        return;
      }
      setCode("");
      await auth.retry();
    } catch {
      setError(
        "Could not verify the code. Check your connection and try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <AdminAuthLayout
      title="Verify your authenticator"
      description="Enter the current code from your authenticator app."
    >
      <form
        onSubmit={submit}
        className="space-y-4"
        noValidate
        aria-busy={busy || auth.loading}
      >
        {error && (
          <p role="alert" id="mfa-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {auth.status === "error" && (
          <p role="alert">
            {auth.error}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void auth.retry()}
            >
              Retry access check
            </button>
          </p>
        )}
        {factors.length > 1 && (
          <div>
            <Label htmlFor="factor">Authenticator</Label>
            <select
              id="factor"
              className="h-11 w-full rounded border p-2"
              value={factorId}
              onChange={(e) => setFactorId(e.target.value)}
            >
              {factors.map((factor, index) => (
                <option key={factor.id} value={factor.id}>
                  {factor.friendly_name || `Authenticator ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Six-digit code</Label>
          <Input
            ref={codeRef}
            id="mfa-code"
            name="one-time-code"
            type="text"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-describedby={error ? "mfa-error" : undefined}
            disabled={busy || auth.loading || !factorId}
            className="h-11 tracking-widest"
          />
        </div>
        <Button
          type="submit"
          className={authButtonClass}
          disabled={busy || auth.loading || !factorId}
        >
          {busy || auth.loading ? "Verifying…" : "Verify and continue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            void auth
              .signOut()
              .catch(() =>
                setError(
                  "Signed out locally. Please reconnect before signing in again.",
                ),
              )
          }
        >
          Cancel and sign out
        </Button>
        <p className="text-xs text-muted-foreground">
          Lost access to your app? Contact the temple owner for
          identity-verified recovery. A password-reset email does not remove
          your authenticator.
        </p>
      </form>
    </AdminAuthLayout>
  );
}
