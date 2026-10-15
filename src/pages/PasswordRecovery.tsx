import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AdminAuthLayout,
  authButtonClass,
} from "@/components/auth/AdminAuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authErrorMessage,
  passwordProblem,
  recoveryRedirectUrl,
} from "@/lib/admin-auth";
import {
  exchangeRecoveryCode,
  type RecoveryCallback,
} from "@/lib/recovery-callback";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  // Timestamp-based cooldown; it is only UX. Auth's backend rate limits enforce abuse protection.
  const [until, setUntil] = useState(0);
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      if (Date.now() >= until) setUntil(0);
    }, 1000);
    return () => clearInterval(timer);
  }, [until]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || until > Date.now()) return;
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid admin email address.");
      emailRef.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: recoveryRedirectUrl() },
      );
      if (error) {
        setError(
          error.status === 429
            ? authErrorMessage(error)
            : "The recovery request could not be completed. Please retry or contact the temple owner.",
        );
        if (error.status === 429) setUntil(Date.now() + 60000);
      } else {
        setSent(true);
        setUntil(Date.now() + 60000);
      }
    } catch {
      setError(
        "The request could not be sent. Check your connection and try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <AdminAuthLayout
      title="Reset your password"
      description="Request a recovery link for your administrator account."
    >
      <form onSubmit={submit} noValidate className="space-y-4" aria-busy={busy}>
        {sent && (
          <p role="status" className="rounded-lg border bg-muted p-3 text-sm">
            If this address has an account, you will receive a password-reset
            email. Check your inbox and spam folder. Open it in this browser on
            this device.
          </p>
        )}
        {error && (
          <p
            id="recovery-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Admin email</Label>
          <Input
            ref={emailRef}
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            required
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? "recovery-error" : undefined}
            className="h-11"
          />
        </div>
        <Button
          type="submit"
          className={authButtonClass}
          disabled={busy || until > Date.now()}
        >
          {busy
            ? "Sending request…"
            : until > Date.now()
              ? "Wait one minute to request another link"
              : "Send reset link"}
        </Button>
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center text-sm underline"
        >
          Back to sign in
        </Link>
      </form>
    </AdminAuthLayout>
  );
}

export function RecoveryCallbackPage({
  callback,
  onComplete,
}: {
  callback: RecoveryCallback;
  onComplete: () => void;
}) {
  const { prepareRecovery, retry } = useAuth();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (callback.failed || !callback.code)
          throw new Error("Invalid callback");
        const { data, error } = await exchangeRecoveryCode(callback.code);
        if (error || !data.session) throw new Error("Invalid recovery");
        if (!active) return;
        prepareRecovery(data.session.user.id);
        await retry();
        if (active) onComplete();
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [callback, onComplete, prepareRecovery, retry]);
  return (
    <AdminAuthLayout
      title={failed ? "Recovery link unavailable" : "Verifying recovery link"}
      description={
        failed
          ? "The link may have expired, already been used, or been opened in a different browser."
          : "Please wait while your one-time link is verified."
      }
    >
      {failed ? (
        <Link className="underline" to="/forgot-password" onClick={onComplete}>
          Request a new reset link
        </Link>
      ) : (
        <p role="status">Verifying the link…</p>
      )}
    </AdminAuthLayout>
  );
}

export function ResetPasswordPage() {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const lock = useRef(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  if (done)
    return (
      <AdminAuthLayout
        title="Password updated"
        description="Sign in again with your new password."
      >
        {warning && (
          <p role="status" className="mb-3 text-sm">
            {warning}
          </p>
        )}
        <Link to="/login" className="underline">
          Go to sign in
        </Link>
      </AdminAuthLayout>
    );
  if (auth.loading)
    return (
      <AdminAuthLayout
        title="Checking recovery session"
        description="Verifying administrator access."
      >
        <p role="status">Please wait…</p>
      </AdminAuthLayout>
    );
  if (auth.status === "mfa_required")
    return <Navigate to="/login/verify" replace />;
  if (auth.status !== "recovery")
    return (
      <AdminAuthLayout
        title="A recovery link is required"
        description="Request a fresh link to reset your administrator password."
      >
        <Link to="/forgot-password" className="underline">
          Request a reset link
        </Link>
      </AdminAuthLayout>
    );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    setError("");
    const problem =
      passwordProblem(password) ||
      (password !== confirm ? "The two passwords do not match." : "");
    if (problem) {
      setError(problem);
      passwordRef.current?.focus();
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(
          error.code === "weak_password"
            ? "Choose a stronger, unique password that meets the account policy."
            : "The password could not be updated. Request a fresh recovery link and try again.",
        );
        return;
      }
      setPassword("");
      setConfirm("");
      setDone(true);
      try {
        await auth.signOut(true);
      } catch {
        setWarning(
          "The password was changed, but other sessions could not be signed out. Contact the temple owner to review active sessions.",
        );
      }
    } catch {
      setError(
        "The password could not be updated. Check your connection and try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <AdminAuthLayout
      title="Choose a new password"
      description="Use a unique passphrase for temple administration."
    >
      <form onSubmit={submit} noValidate className="space-y-5" aria-busy={busy}>
        {error && (
          <p
            id="new-password-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <PasswordField
          ref={passwordRef}
          id="new-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          required
          aria-describedby={`new-password-guidance${error ? " new-password-error" : ""}`}
        />
        <p id="new-password-guidance" className="text-xs text-muted-foreground">
          Use at least 12 characters, up to 72 UTF-8 bytes. Spaces and
          password-manager generated passwords are welcome.
        </p>
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={busy}
          required
        />
        <Button type="submit" className={authButtonClass} disabled={busy}>
          {busy ? "Updating password…" : "Update password and sign out"}
        </Button>
      </form>
    </AdminAuthLayout>
  );
}
