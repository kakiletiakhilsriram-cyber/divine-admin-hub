import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AdminSecurityPage from "./AdminSecurityPage";
const m = vi.hoisted(() => ({
  list: vi.fn(),
  enroll: vi.fn(),
  verify: vi.fn(),
  unenroll: vi.fn(),
  retry: vi.fn(),
  out: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { email: "admin@example.com" },
    retry: m.retry,
    signOut: m.out,
  }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: m.list,
        enroll: m.enroll,
        challengeAndVerify: m.verify,
        unenroll: m.unenroll,
      },
    },
  },
}));
function mount() {
  render(
    <MemoryRouter>
      <AdminSecurityPage />
    </MemoryRouter>,
  );
}
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_ADMIN_MFA_ENABLED", "false");
  m.list.mockResolvedValue({
    data: {
      all: [],
      totp: [
        { id: "verified-factor", status: "verified", friendly_name: "My app" },
      ],
    },
    error: null,
  });
  m.verify.mockResolvedValue({ error: null });
  m.unenroll.mockResolvedValue({ error: null });
  m.retry.mockResolvedValue(undefined);
});
it("does not enroll anyone automatically and gates new setup on backend readiness", async () => {
  mount();
  await screen.findByText(/Verified · My app/);
  expect(m.enroll).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Set up an authenticator" }),
  ).toBeDisabled();
});
it("requires a current code and explicit confirmation before removing protection", async () => {
  mount();
  await screen.findByText(/Verified · My app/);
  fireEvent.click(screen.getByRole("button", { name: "Remove authenticator" }));
  fireEvent.click(screen.getByRole("button", { name: "Verify and remove" }));
  expect(m.verify).not.toHaveBeenCalled();
  expect(m.unenroll).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Verify and remove" }),
    ).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText("Current six-digit code"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Verify and remove" }));
  await waitFor(() =>
    expect(m.unenroll).toHaveBeenCalledWith({ factorId: "verified-factor" }),
  );
  expect(m.verify).toHaveBeenCalledWith({
    factorId: "verified-factor",
    code: "123456",
  });
  expect(m.verify.mock.invocationCallOrder[0]).toBeLessThan(
    m.unenroll.mock.invocationCallOrder[0],
  );
});
it("does not remove the factor when fresh verification fails", async () => {
  m.verify.mockResolvedValue({ error: { status: 400 } });
  mount();
  await screen.findByText(/Verified · My app/);
  fireEvent.click(screen.getByRole("button", { name: "Remove authenticator" }));
  fireEvent.change(screen.getByLabelText("Current six-digit code"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Verify and remove" }));
  await screen.findByText("The code could not be verified.");
  expect(m.unenroll).not.toHaveBeenCalled();
});
it("does not misreport unavailable settings as an unenrolled account", async () => {
  m.list.mockResolvedValue({ data: null, error: new Error("offline") });
  mount();
  await screen.findByRole("alert");
  expect(screen.queryByText(/No authenticator is enrolled/)).toBeNull();
  expect(
    screen.getByRole("button", { name: "Set up an authenticator" }),
  ).toBeDisabled();
});

it("supports private QR setup and verifies a code only after recovery acknowledgement", async () => {
  vi.stubEnv("VITE_ADMIN_MFA_ENABLED", "true");
  m.list.mockResolvedValue({ data: { all: [], totp: [] }, error: null });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  m.enroll.mockResolvedValue({
    data: {
      id: "new-factor",
      totp: {
        qr_code: "data:image/svg+xml;utf-8," + svg,
        secret: "TEST_ONLY_SETUP_KEY",
      },
    },
    error: null,
  });
  mount();
  const button = screen.getByRole("button", {
    name: "Set up an authenticator",
  });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  const image = await screen.findByRole("img", {
    name: "Authenticator setup QR code",
  });
  const src = image.getAttribute("src")!;
  expect(decodeURIComponent(src.slice(src.indexOf(",") + 1))).toBe(svg);
  fireEvent.change(screen.getByLabelText("Six-digit verification code"), {
    target: { value: "123456" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Verify and enable authenticator" }),
  );
  await screen.findByRole("alert");
  expect(m.verify).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Verify and enable authenticator" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Verify and enable authenticator" }),
  );
  await waitFor(() =>
    expect(m.verify).toHaveBeenCalledWith({
      factorId: "new-factor",
      code: "123456",
    }),
  );
  expect(screen.queryByText("TEST_ONLY_SETUP_KEY")).toBeNull();
});
