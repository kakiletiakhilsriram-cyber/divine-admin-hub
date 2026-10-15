import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminAuthLayout,
  authButtonClass,
} from "@/components/auth/AdminAuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { adminDestination } from "@/lib/admin-auth";

export default function LoginPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trusted, setTrusted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [waiting, setWaiting] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(cooldownTimer.current), []);
  const submitted = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  if (auth.status === "admin")
    return <Navigate to={adminDestination(params.get("next"))} replace />;
  if (auth.status === "mfa_required")
    return <Navigate to="/login/verify" replace />;
  if (auth.status === "recovery")
    return <Navigate to="/reset-password" replace />;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitted.current || auth.loading || waiting) return;
    setError("");
    const errors = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? ""
        : "Enter a valid email address.",
      password: password.length ? "" : "Enter your password.",
    };
    setFieldErrors(errors);
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }
    submitted.current = true;
    setBusy(true);
    try {
      const result = await auth.signIn(email, password, trusted);
      if (result.error) {
        setError(result.error);
        if (result.error.startsWith("Too many")) {
          setWaiting(true);
          cooldownTimer.current = setTimeout(() => setWaiting(false), 60000);
        }
      } else setPassword("");
    } catch {
      setError(
        "Unable to sign in. Please check your connection and try again.",
      );
    } finally {
      submitted.current = false;
      setBusy(false);
    }
  };
  const block = auth.status === "denied" || auth.status === "error";
  return (
    <AdminAuthLayout
      title="Administrator sign in"
      description="Manage temple information, events and enquiries."
    >
      {block ? (
        <div className="space-y-4">
          <div role="alert">
            <h2 className="font-semibold">
              {auth.status === "denied"
                ? "Administrator access required"
                : "Access could not be verified"}
            </h2>
            <p className="mt-2 text-sm">
              {auth.status === "denied"
                ? "This account has no administrator permission. Contact the temple owner if you believe this is a mistake."
                : auth.error}
            </p>
          </div>
          {auth.status === "error" && (
            <Button
              className={authButtonClass}
              onClick={() => void auth.retry()}
            >
              Retry access check
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              void auth
                .signOut()
                .catch(() =>
                  setError(
                    "Signed out on this device. Please reconnect before signing in again.",
                  ),
                )
            }
          >
            Sign out and use another account
          </Button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="space-y-5"
          aria-busy={busy || auth.loading}
        >
          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="rounded-lg border border-destructive bg-destructive/5 p-3 text-sm"
            >
              {error}
            </div>
          )}
          {auth.loading && (
            <p role="status" className="text-sm">
              Checking your session and administrator access…
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Admin email</Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              disabled={busy || auth.loading}
              className="h-11"
              placeholder="Enter your admin email"
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <PasswordField
            ref={passwordRef}
            id="password"
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy || auth.loading}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
          />
          {fieldErrors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {fieldErrors.password}
            </p>
          )}
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              className="mt-1 h-4 w-4"
              type="checkbox"
              checked={trusted}
              disabled={busy || auth.loading}
              onChange={(e) => setTrusted(e.target.checked)}
            />
            <span>
              Keep me signed in on this trusted device
              <span className="mt-1 block text-xs text-muted-foreground">
                Leave unchecked on a shared computer.
              </span>
            </span>
          </label>
          <Button
            type="submit"
            className={authButtonClass}
            disabled={busy || auth.loading || waiting}
          >
            {busy
              ? "Signing in…"
              : waiting
                ? "Please wait before retrying"
                : "Sign in"}
          </Button>
          <Link
            className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </form>
      )}
    </AdminAuthLayout>
  );
}
