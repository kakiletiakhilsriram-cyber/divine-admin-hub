import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminSessionStorage,
  ADMIN_SESSION_KEY,
  setTrustedAdminDevice,
} from "./admin-session-storage";
import {
  adminDestination,
  authErrorMessage,
  passwordProblem,
  authDeadline,
  authenticatorQrSource,
} from "./admin-auth";
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));
import {
  consumeRecoveryCallback,
  exchangeRecoveryCode,
} from "./recovery-callback";
import { supabase } from "@/integrations/supabase/client";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
it("renders the SDK-prefixed SVG once, without an external QR service", () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000"/></svg>';
  const source = authenticatorQrSource(`data:image/svg+xml;utf-8,${svg}`);
  expect(decodeURIComponent(source.slice(source.indexOf(",") + 1))).toBe(svg);
  expect(authenticatorQrSource(svg)).toBe(source);
});
describe("administrator browser storage and recovery", () => {
  it("keeps default sign-in in the current tab", () => {
    const s = adminSessionStorage(localStorage, sessionStorage);
    s.setItem(ADMIN_SESSION_KEY, "token");
    expect(localStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(ADMIN_SESSION_KEY)).toBe("token");
  });
  it("persists only when trusted-device is selected and removes old copies", () => {
    const s = adminSessionStorage(localStorage, sessionStorage);
    s.setItem(ADMIN_SESSION_KEY, "old");
    setTrustedAdminDevice(true);
    s.setItem(ADMIN_SESSION_KEY, "trusted");
    expect(localStorage.getItem(ADMIN_SESSION_KEY)).toBe("trusted");
    expect(sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
    s.removeItem(ADMIN_SESSION_KEY);
    expect(s.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });
  it("keeps the one-time PKCE verifier available to the email link tab", () => {
    const s = adminSessionStorage(localStorage, sessionStorage);
    s.setItem(ADMIN_SESSION_KEY + "-code-verifier", "verifier");
    expect(localStorage.getItem(ADMIN_SESSION_KEY + "-code-verifier")).toBe(
      "verifier",
    );
  });
  it("strips the recovery code from the URL without logging it", () => {
    const replaceState = vi.fn();
    expect(
      consumeRecoveryCallback(
        {
          search: "?auth_callback=recovery&code=one-time-test-code",
          pathname: "/",
        },
        { replaceState },
      ),
    ).toEqual({ code: "one-time-test-code", failed: false });
    expect(replaceState).toHaveBeenCalledWith(null, "", "/#/reset-password");
  });
  it("ignores ordinary page queries", () => {
    expect(
      consumeRecoveryCallback(
        { search: "?code=other", pathname: "/" },
        { replaceState: vi.fn() },
      ),
    ).toBeNull();
  });
  it("does not exchange the same one-time code twice", async () => {
    await Promise.all([
      exchangeRecoveryCode("test-only"),
      exchangeRecoveryCode("test-only"),
    ]);
    expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  });
  it("does not permit an external or consent return destination", () => {
    expect(adminDestination("https://other.test")).toBe("/admin");
    expect(adminDestination("/oauth-consent")).toBe("/admin");
    expect(adminDestination("/admin/security")).toBe("/admin/security");
  });
  it("does not expose backend credential details", () => {
    expect(
      authErrorMessage({
        code: "invalid_credentials",
        message: "secret provider detail",
      }),
    ).not.toContain("secret");
    expect(authErrorMessage({ status: 429 })).toMatch("wait a minute");
  });
  it("allows passphrases and rejects short or overlong UTF-8 passwords", () => {
    expect(passwordProblem("a long passphrase")).toBe("");
    expect(passwordProblem("short")).toMatch("at least 12");
    expect(passwordProblem("a".repeat(73))).toMatch("72");
    expect(passwordProblem("రా".repeat(30))).toMatch("72");
  });
  it("bounds stalled authentication checks", async () => {
    vi.useFakeTimers();
    const promise = expect(authDeadline(new Promise(() => {}))).rejects.toThrow(
      "timed out",
    );
    await vi.advanceTimersByTimeAsync(15001);
    await promise;
    vi.useRealTimers();
  });
});
