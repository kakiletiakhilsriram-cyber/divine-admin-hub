export type AdminAuthStatus =
  | "loading"
  | "signed_out"
  | "admin"
  | "denied"
  | "mfa_required"
  | "recovery"
  | "error";
export function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; status?: number } | null;
  if (
    e?.status === 429 ||
    ["over_request_rate_limit", "over_email_send_rate_limit"].includes(
      e?.code || "",
    )
  )
    return "Too many attempts. Please wait a minute before trying again.";
  if (
    e?.code === "invalid_credentials" ||
    e?.status === 400 ||
    e?.code === "email_not_confirmed"
  )
    return "Unable to sign in with those details. Check your email and password.";
  return "Unable to connect securely. Check your internet connection and try again.";
}
export function adminDestination(value: string | null) {
  return value === "/admin/security" ? value : "/admin";
}
export function passwordProblem(password: string) {
  return password.length < 12
    ? "Use at least 12 characters. A long, unique passphrase is recommended."
    : new TextEncoder().encode(password).length > 72
      ? "Use no more than 72 UTF-8 bytes (72 plain English characters)."
      : "";
}
export const recoveryRedirectUrl = () =>
  `${window.location.origin}/?auth_callback=recovery`;

export function authenticatorQrSource(qr: string) {
  // auth-js already prefixes the raw SVG. Strip it before safe URL encoding.
  const svg = qr.replace(/^data:image\/svg\+xml;utf-8,/, "");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function authDeadline<T>(request: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Auth request timed out")),
          15_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
