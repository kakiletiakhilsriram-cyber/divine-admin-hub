import { supabase } from "@/integrations/supabase/client";
export interface RecoveryCallback {
  code: string | null;
  failed: boolean;
}
export function consumeRecoveryCallback(
  location: Pick<Location, "search" | "pathname">,
  history: Pick<History, "replaceState">,
): RecoveryCallback | null {
  const params = new URLSearchParams(location.search);
  if (params.get("auth_callback") !== "recovery") return null;
  const callback = {
    code: params.get("code"),
    failed: params.has("error") || params.has("error_code"),
  };
  // Remove the one-time code from the address bar before rendering recovery UI.
  history.replaceState(null, "", `${location.pathname}#/reset-password`);
  return callback;
}
const exchanges = new Map<
  string,
  ReturnType<typeof supabase.auth.exchangeCodeForSession>
>();
export function exchangeRecoveryCode(code: string) {
  // React remounts must not consume a single-use code twice. Never log or persist it.
  if (!exchanges.has(code))
    exchanges.set(code, supabase.auth.exchangeCodeForSession(code));
  return exchanges.get(code)!;
}
