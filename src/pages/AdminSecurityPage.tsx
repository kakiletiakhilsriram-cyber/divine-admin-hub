import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminAuthLayout,
  authButtonClass,
} from "@/components/auth/AdminAuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticatorQrSource } from "@/lib/admin-auth";
type Setup = { id: string; qr: string; secret: string };
export default function AdminSecurityPage() {
  const setupEnabled = import.meta.env.VITE_ADMIN_MFA_ENABLED === "true";
  const auth = useAuth();
  const [factors, setFactors] = useState<
    { id: string; friendly_name?: string }[]
  >([]);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [code, setCode] = useState("");
  const [backedUp, setBackedUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const [removeId, setRemoveId] = useState("");
  const [removeCode, setRemoveCode] = useState("");
  const [removeConfirmed, setRemoveConfirmed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [unfinished, setUnfinished] = useState<{ id: string }[]>([]);
  useEffect(() => {
    let active = true;
    void supabase.auth.mfa
      .listFactors()
      .then(({ data, error }) => {
        if (active) {
          if (error) setError("Authenticator settings could not be loaded.");
          else {
            setFactors(data.totp.filter((f) => f.status === "verified"));
            setUnfinished(
              data.all.filter(
                (f) => f.factor_type === "totp" && f.status !== "verified",
              ),
            );
            setLoaded(true);
          }
        }
      })
      .catch(() => {
        if (active) setError("Authenticator settings could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch {
      setError(
        "The security change could not be completed. Check your connection and try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const enroll = () =>
    run(async () => {
      if (!setupEnabled || !loaded) return;
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Sri Ramalayam",
        friendlyName: `Temple authenticator ${new Date().toLocaleDateString()} ${Date.now()}`,
      });
      if (error || !data) throw error;
      setSetup({
        id: data.id,
        qr: authenticatorQrSource(data.totp.qr_code),
        secret: data.totp.secret,
      });
      setCode("");
      setBackedUp(false);
    });
  const verify = () =>
    run(async () => {
      if (!setup || !/^\d{6}$/.test(code) || !backedUp) {
        setError(
          "Enter the six-digit code and confirm your recovery preparation.",
        );
        return;
      }
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: setup.id,
        code,
      });
      if (error) {
        setCode("");
        setError(
          "The code could not be verified. Use the latest code from your app.",
        );
        return;
      }
      setSetup(null);
      setCode("");
      setNotice("Authenticator verified. Future sign-ins will require a code.");
      await auth.retry();
    });
  const cancel = () =>
    run(async () => {
      if (!setup) return;
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: setup.id,
      });
      if (error) throw error;
      setSetup(null);
      setCode("");
    });
  const remove = () =>
    run(async () => {
      if (!removeConfirmed || !/^\d{6}$/.test(removeCode)) {
        setError("Confirm removal and enter a current authenticator code.");
        return;
      }
      const challenge = await supabase.auth.mfa.challengeAndVerify({
        factorId: removeId,
        code: removeCode,
      });
      if (challenge.error) {
        setRemoveCode("");
        setError("The code could not be verified.");
        return;
      }
      const result = await supabase.auth.mfa.unenroll({ factorId: removeId });
      if (result.error) throw result.error;
      setRemoveId("");
      setRemoveCode("");
      setRemoveConfirmed(false);
      await auth.retry();
    });
  return (
    <AdminAuthLayout
      title="Account security"
      description="Manage your own administrator sign-in protection."
    >
      <div className="space-y-5" aria-busy={busy}>
        <Link
          to="/admin"
          className="inline-flex min-h-11 items-center text-sm underline"
        >
          Back to dashboard
        </Link>
        <p className="break-all text-sm">Signed in as {auth.user?.email}</p>
        {error && (
          <p
            role="alert"
            className="rounded border border-destructive p-3 text-sm"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded border p-3 text-sm">
            {notice}
          </p>
        )}
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            Authenticator app
          </h2>
          <p className="text-sm text-muted-foreground">
            Use free app-generated codes. No SMS or paid authenticator
            subscription is needed.
          </p>
          {factors.map((factor, index) => (
            <div
              key={factor.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm"
            >
              <span>
                Verified ·{" "}
                {factor.friendly_name || `Authenticator ${index + 1}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || !!setup}
                onClick={() => {
                  setRemoveId(factor.id);
                  setRemoveCode("");
                  setRemoveConfirmed(false);
                }}
              >
                Remove authenticator
              </Button>
            </div>
          ))}
          {!loaded && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void auth.retry()}
            >
              Reload authenticator settings
            </Button>
          )}
          {loaded && !factors.length && !setup && (
            <p className="text-sm">
              No authenticator is enrolled yet. Your account currently uses its
              password.
            </p>
          )}
          {!setupEnabled && (
            <p className="text-sm">
              Authenticator setup will be available after the temple owner
              verifies the backend configuration.
            </p>
          )}
          {!setup && !removeId && (
            <Button
              className={authButtonClass}
              disabled={busy || !loaded || !setupEnabled || !!unfinished.length}
              onClick={enroll}
            >
              Set up an authenticator
            </Button>
          )}
          {unfinished.map((factor) => (
            <div
              key={factor.id}
              className="space-y-2 rounded border p-3 text-sm"
            >
              <p>
                An earlier authenticator setup was not completed. Discard it
                before starting again.
              </p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const { error } = await supabase.auth.mfa.unenroll({
                      factorId: factor.id,
                    });
                    if (error) throw error;
                    setUnfinished((current) =>
                      current.filter((f) => f.id !== factor.id),
                    );
                  })
                }
              >
                Discard unfinished setup
              </Button>
            </div>
          ))}
          {setup && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm">
                Scan this QR code with your authenticator app. Keep the setup
                key private.
              </p>
              <img
                src={setup.qr}
                alt="Authenticator setup QR code"
                className="mx-auto h-48 w-48 max-w-full bg-white"
              />
              <details>
                <summary className="cursor-pointer text-sm underline">
                  Use a setup key instead
                </summary>
                <code className="mt-2 block break-all text-sm">
                  {setup.secret}
                </code>
              </details>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={backedUp}
                  onChange={(e) => setBackedUp(e.target.checked)}
                />
                I have secured my authenticator backup and understand that
                losing it may require the temple owner’s help.
              </label>
              <div>
                <Label htmlFor="enroll-code">Six-digit verification code</Label>
                <Input
                  id="enroll-code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={busy}
                />
              </div>
              <Button
                className={authButtonClass}
                disabled={busy}
                onClick={verify}
              >
                Verify and enable authenticator
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={cancel}
              >
                Cancel setup
              </Button>
            </div>
          )}
          {removeId && (
            <div className="space-y-3 rounded border p-4">
              <p className="text-sm">
                Verify a current code before removing this authenticator.
              </p>
              <Label htmlFor="remove-code">Current six-digit code</Label>
              <Input
                id="remove-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={removeCode}
                maxLength={6}
                onChange={(e) =>
                  setRemoveCode(e.target.value.replace(/\D/g, ""))
                }
              />
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={removeConfirmed}
                  onChange={(e) => setRemoveConfirmed(e.target.checked)}
                />
                I understand that removing the last authenticator leaves
                password-only sign-in.
              </label>
              <Button variant="destructive" disabled={busy} onClick={remove}>
                Verify and remove
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setRemoveId("")}
              >
                Cancel removal
              </Button>
            </div>
          )}
        </section>
        <section className="space-y-3 border-t pt-4">
          <h2 className="font-display text-lg font-semibold">Sessions</h2>
          <p className="text-sm text-muted-foreground">
            If a device is lost or shared, sign out all sessions. Already-issued
            access tokens can remain valid until they expire.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => run(() => auth.signOut(true))}
          >
            Sign out on all devices
          </Button>
        </section>
      </div>
    </AdminAuthLayout>
  );
}
