import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import {
  ForgotPasswordPage,
  RecoveryCallbackPage,
  ResetPasswordPage,
} from "./PasswordRecovery";
import MfaVerifyPage from "./MfaVerifyPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
const mocks = vi.hoisted(() => ({
  auth: {
    status: "signed_out",
    loading: false,
    isAdmin: false,
    error: null as null | string,
    signIn: vi.fn(),
    signOut: vi.fn(),
    retry: vi.fn(),
    prepareRecovery: vi.fn(),
  },
  reset: vi.fn(),
  update: vi.fn(),
  exchange: vi.fn(),
  list: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mocks.reset,
      updateUser: mocks.update,
      exchangeCodeForSession: mocks.exchange,
      mfa: { listFactors: mocks.list, challengeAndVerify: mocks.verify },
    },
  },
}));
function mount(element: React.ReactNode, path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<p>Verified dashboard</p>} />
        <Route path="/login/verify" element={<MfaVerifyPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}
function fillLogin() {
  fireEvent.change(screen.getByLabelText("Admin email"), {
    target: { value: "admin@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: " pass phrase " },
  });
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(mocks.auth, {
    status: "signed_out",
    loading: false,
    isAdmin: false,
    error: null,
  });
  mocks.auth.signIn.mockResolvedValue({ error: null });
  mocks.auth.signOut.mockResolvedValue(undefined);
  mocks.auth.retry.mockResolvedValue(undefined);
  mocks.reset.mockResolvedValue({ error: null });
  mocks.update.mockResolvedValue({ error: null });
  mocks.list.mockResolvedValue({
    data: { totp: [{ id: "factor-1", status: "verified" }] },
    error: null,
  });
  mocks.verify.mockResolvedValue({ error: null });
});
describe("admin-only login UI", () => {
  it("provides autofill, accessible visibility, recovery and no registration", () => {
    mount(<LoginPage />);
    expect(screen.getByLabelText("Admin email")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.queryByText(/sign up|register/i)).toBeNull();
  });
  it("focuses invalid inputs without contacting authentication", () => {
    mount(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByLabelText("Admin email")).toHaveFocus();
    expect(mocks.auth.signIn).not.toHaveBeenCalled();
  });
  it("preserves password spaces and waits for role verification before navigation", async () => {
    mount(<LoginPage />);
    fillLogin();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(mocks.auth.signIn).toHaveBeenCalledWith(
        "admin@example.com",
        " pass phrase ",
        false,
      ),
    );
    expect(screen.queryByText("Verified dashboard")).toBeNull();
  });
  it("blocks duplicate submits while a request is pending", async () => {
    mocks.auth.signIn.mockReturnValue(new Promise(() => {}));
    mount(<LoginPage />);
    fillLogin();
    const button = screen.getByRole("button", { name: "Sign in" });
    fireEvent.click(button);
    fireEvent.submit(button.closest("form")!);
    expect(mocks.auth.signIn).toHaveBeenCalledTimes(1);
  });
  it("recovers from unexpected errors and lets the admin retry", async () => {
    mocks.auth.signIn.mockRejectedValueOnce(new Error("network detail"));
    mount(<LoginPage />);
    fillLogin();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "check your connection",
      ),
    );
    expect(screen.getByRole("alert")).toHaveFocus();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });
  it("blocks dashboard content during permission errors", () => {
    Object.assign(mocks.auth, { status: "error", error: "Unavailable" });
    mount(
      <ProtectedRoute>
        <p>Private content</p>
      </ProtectedRoute>,
    );
    expect(screen.queryByText("Private content")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Retry access check" }),
    ).toBeInTheDocument();
  });
  it("routes AAL1 sessions to MFA instead of rendering private content", async () => {
    Object.assign(mocks.auth, { status: "mfa_required" });
    mount(
      <ProtectedRoute>
        <p>Private content</p>
      </ProtectedRoute>,
    );
    expect(screen.queryByText("Private content")).toBeNull();
    await screen.findByLabelText("Six-digit code");
  });
});
describe("password recovery", () => {
  it("uses a generic response and the PKCE callback URL", async () => {
    mount(<ForgotPasswordPage />, "/forgot-password");
    fireEvent.change(screen.getByLabelText("Admin email"), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "If this address has an account",
      ),
    );
    expect(mocks.reset).toHaveBeenCalledWith("unknown@example.com", {
      redirectTo: window.location.origin + "/?auth_callback=recovery",
    });
  });
  it("allows retry after a network failure", async () => {
    mocks.reset.mockRejectedValueOnce(new Error("offline"));
    mount(<ForgotPasswordPage />);
    fireEvent.change(screen.getByLabelText("Admin email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await screen.findByRole("alert");
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeEnabled();
  });
  it("never treats an expired recovery callback as authenticated", async () => {
    mocks.exchange.mockResolvedValue({
      data: { session: null },
      error: new Error("expired"),
    });
    mount(
      <RecoveryCallbackPage
        callback={{ code: "expired-test-code", failed: false }}
        onComplete={vi.fn()}
      />,
    );
    await screen.findByText("Recovery link unavailable");
    expect(mocks.auth.prepareRecovery).not.toHaveBeenCalled();
  });
  it("does not show password fields for an ordinary sign-in", () => {
    mount(<ResetPasswordPage />);
    expect(screen.getByText("A recovery link is required")).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
  it("rejects mismatched passwords before calling the API", () => {
    mocks.auth.status = "recovery";
    mount(<ResetPasswordPage />);
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "long passphrase one" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "long passphrase two" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Update password and sign out" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("do not match");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("clears password fields and requests global sign-out after success", async () => {
    mocks.auth.status = "recovery";
    mount(<ResetPasswordPage />);
    for (const label of ["New password", "Confirm new password"])
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: "long unique passphrase" },
      });
    fireEvent.click(
      screen.getByRole("button", { name: "Update password and sign out" }),
    );
    await screen.findByText("Password updated");
    expect(mocks.auth.signOut).toHaveBeenCalledWith(true);
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
});
describe("authenticator verification", () => {
  it("accepts only six digits and verifies the selected factor", async () => {
    mocks.auth.status = "mfa_required";
    mount(<MfaVerifyPage />);
    const input = await screen.findByLabelText("Six-digit code");
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "12abc" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );
    expect(mocks.verify).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );
    await waitFor(() =>
      expect(mocks.verify).toHaveBeenCalledWith({
        factorId: "factor-1",
        code: "123456",
      }),
    );
    expect(mocks.auth.retry).toHaveBeenCalled();
  });
  it("keeps a failed code out of the dashboard and permits another attempt", async () => {
    mocks.auth.status = "mfa_required";
    mocks.verify.mockResolvedValue({ error: { status: 400 } });
    mount(<MfaVerifyPage />);
    const input = screen.getByLabelText("Six-digit code");
    await waitFor(() => expect(input).toBeEnabled());
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );
    await screen.findByRole("alert");
    expect(input).toHaveValue("");
    expect(screen.queryByText("Verified dashboard")).toBeNull();
    expect(mocks.auth.retry).not.toHaveBeenCalled();
  });
});
