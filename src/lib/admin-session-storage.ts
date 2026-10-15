const preferenceKey = "temple-admin-trusted-device";
export const ADMIN_SESSION_KEY = "temple-admin-session-v1";
// PKCE verifiers survive opening the recovery email in another tab on this browser.
export function adminSessionStorage(persistent: Storage, temporary: Storage) {
  const target = (key: string) =>
    key.endsWith("-code-verifier") ||
    persistent.getItem(preferenceKey) === "yes"
      ? persistent
      : temporary;
  return {
    getItem: (key: string) => target(key).getItem(key),
    setItem: (key: string, value: string) => {
      const chosen = target(key);
      (chosen === persistent ? temporary : persistent).removeItem(key);
      chosen.setItem(key, value);
    },
    removeItem: (key: string) => {
      persistent.removeItem(key);
      temporary.removeItem(key);
    },
  };
}
export function setTrustedAdminDevice(trusted: boolean) {
  if (trusted) localStorage.setItem(preferenceKey, "yes");
  else localStorage.removeItem(preferenceKey);
}
export function clearAdminStorage() {
  for (const key of [ADMIN_SESSION_KEY, `${ADMIN_SESSION_KEY}-user`]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
