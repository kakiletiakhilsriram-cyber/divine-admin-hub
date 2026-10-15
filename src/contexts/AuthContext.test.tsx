import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "./AuthContext";
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUser: vi.fn(),
  role: vi.fn(),
  level: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  listener: null as null | ((event: string, session: unknown) => void),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      getUser: mocks.getUser,
      signInWithPassword: mocks.signIn,
      signOut: mocks.signOut,
      onAuthStateChange: (fn: typeof mocks.listener) => {
        mocks.listener = fn;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      mfa: { getAuthenticatorAssuranceLevel: mocks.level },
    },
    from: () => ({
      select: () => ({
        eq: () => ({ eq: () => ({ maybeSingle: mocks.role }) }),
      }),
    }),
  },
}));
const session = {
  access_token: "test-token",
  user: { id: "admin-1", email: "admin@example.com" },
} as Session;
function Probe() {
  const auth = useAuth();
  return (
    <>
      <p data-testid="state">{auth.status}</p>
      <p data-testid="allowed">{String(auth.isAdmin)}</p>
      <button onClick={() => void auth.signOut()}>Logout</button>
      <button onClick={() => void auth.retry()}>Retry</button>
    </>
  );
}
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(["private"], { secret: "cached" });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  mocks.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.getUser.mockResolvedValue({
    data: { user: session.user },
    error: null,
  });
  mocks.role.mockResolvedValue({ data: { role: "admin" }, error: null });
  mocks.level.mockResolvedValue({
    data: { currentLevel: "aal1", nextLevel: "aal1" },
    error: null,
  });
  mocks.signOut.mockResolvedValue({ error: null });
});
describe("administrator session verification", () => {
  it("keeps access closed until the role lookup finishes", async () => {
    const role = deferred<unknown>();
    mocks.role.mockReturnValue(role.promise);
    mount();
    await waitFor(() => expect(mocks.role).toHaveBeenCalled());
    expect(screen.getByTestId("state")).toHaveTextContent("loading");
    expect(screen.getByTestId("allowed")).toHaveTextContent("false");
    await act(async () =>
      role.resolve({ data: { role: "admin" }, error: null }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("admin"),
    );
  });
  it("does not let a late role result restore a logged-out session", async () => {
    const role = deferred<unknown>();
    mocks.role.mockReturnValue(role.promise);
    const client = mount();
    await waitFor(() => expect(mocks.role).toHaveBeenCalled());
    await act(async () => screen.getByText("Logout").click());
    await act(async () =>
      role.resolve({ data: { role: "admin" }, error: null }),
    );
    expect(screen.getByTestId("state")).toHaveTextContent("signed_out");
    expect(client.getQueryData(["private"])).toBeUndefined();
  });
  it("requires MFA before granting enrolled administrators access", async () => {
    mocks.level.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("mfa_required"),
    );
    expect(screen.getByTestId("allowed")).toHaveTextContent("false");
  });
  it("accepts a verified AAL2 administrator", async () => {
    mocks.level.mockResolvedValue({
      data: { currentLevel: "aal2", nextLevel: "aal2" },
      error: null,
    });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("allowed")).toHaveTextContent("true"),
    );
  });
  it("denies a signed-in account without an admin role", async () => {
    mocks.role.mockResolvedValue({ data: null, error: null });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("denied"),
    );
    expect(mocks.level).not.toHaveBeenCalled();
  });
  it("fails closed on a role error and supports retry", async () => {
    mocks.role.mockResolvedValueOnce({
      data: null,
      error: new Error("offline"),
    });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("error"),
    );
    expect(screen.getByTestId("allowed")).toHaveTextContent("false");
    await act(async () => screen.getByText("Retry").click());
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("admin"),
    );
  });
  it("rejects a mismatching server identity", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "different" } },
      error: null,
    });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("error"),
    );
    expect(mocks.role).not.toHaveBeenCalled();
  });
  it("does not restore a stale initial session after a newer sign-out event", async () => {
    const initial = deferred<unknown>();
    mocks.getSession.mockReturnValue(initial.promise);
    mount();
    await act(async () => mocks.listener?.("SIGNED_OUT", null));
    await act(async () => initial.resolve({ data: { session }, error: null }));
    expect(screen.getByTestId("state")).toHaveTextContent("signed_out");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("does not run a queued sign-in event after sign-out", async () => {
    mocks.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("signed_out"),
    );
    await act(async () => {
      mocks.listener?.("SIGNED_IN", session);
      mocks.listener?.("SIGNED_OUT", null);
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(screen.getByTestId("state")).toHaveTextContent("signed_out");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("binds a recovery marker to the account and its expiration", async () => {
    sessionStorage.setItem(
      "temple-admin-recovery",
      JSON.stringify({ id: "different", expires: Date.now() + 10000 }),
    );
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("admin"),
    );
  });
  it("keeps recovery sessions out of the dashboard", async () => {
    sessionStorage.setItem(
      "temple-admin-recovery",
      JSON.stringify({ id: session.user.id, expires: Date.now() + 10000 }),
    );
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("state")).toHaveTextContent("recovery"),
    );
    expect(screen.getByTestId("allowed")).toHaveTextContent("false");
  });
});
