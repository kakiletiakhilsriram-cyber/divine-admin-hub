# Administrator login enhancements

## Scope and current deployment state

Branch: `feat/login-enhancements`. Visitors need no account. There is no registration page or new administrator-management system. Existing administrator roles are unchanged. No account has been enrolled in MFA, no password has been changed and no recovery email has been sent during implementation.

The changes are source code plus a pending migration. They are not proof that Lovable Cloud Auth has been configured or that the production website has been deployed. Preview and production currently share the same backend.

## Implemented behavior

- Sign-in waits for server identity, administrator-role and authenticator-assurance checks. Loading and failures keep private pages closed. Slow checks time out; retry is available. Stale checks cannot restore access after logout.
- Email/password fields support password managers, show/hide controls, Caps Lock guidance, validation, keyboard focus and readable errors. The layout uses normal document flow, mobile-sized controls and reduced-motion transitions.
- Sign-in errors do not reveal whether an email has an account. Requests cannot be submitted twice while pending. A browser cooldown supplements the provider's rate limits; it is not an abuse-control boundary.
- Default sessions use the current tab's session storage. The optional trusted-device checkbox uses local storage. Authentication storage no longer uses the Lovable cross-preview session broker. Both stores still hold JavaScript-accessible tokens: this change does not create HttpOnly cookies or eliminate XSS risk.
- The new storage key causes a fresh sign-in when this version is first deployed. Older tokens may remain valid until revoked or expired; changing a browser storage key does not revoke them.
- Password recovery uses PKCE, an account-neutral confirmation, a one-time callback code removed from the address bar, and a recovery-only screen. The email link must be opened in the same browser profile/device that requested it. A reset permits a unique passphrase of at least 12 characters, capped at 72 UTF-8 bytes for bcrypt compatibility. Existing sign-in passwords are not subjected to this new form rule.
- Reset success requests global sign-out and clears password fields. Access JWTs already issued by the provider may remain valid until expiry. Failed revocation is reported rather than claimed successful.
- `/#/admin/security` supports TOTP QR/manual-key enrolment, six-digit verification, cancellation/discard of unfinished setup, fresh verification before removal, and global sign-out. QR/keys are rendered locally from the provider's response, not sent to a QR-image service or stored in application tables/logs.
- Enrolment is disabled unless the frontend build has `VITE_ADMIN_MFA_ENABLED=true`. This is a rollout switch, not an authorization boundary. Already-enrolled accounts still require a code regardless of this switch.
- The unused external-app OAuth consent route and path bridge have been removed. This does not itself disable the backend OAuth server or revoke existing grants; the owner must verify those settings separately.

## Database enforcement

Use one migration copy only:

- Normal Lovable/Drizzle route: `drizzle/migrations/0004_admin_mfa_assurance.sql` and its journal entry.
- Supabase alternative: `supabase/migrations/20261015000200_admin_mfa_assurance.sql`.

Do not apply both or edit an already-applied migration. This is a custom SQL migration; existing Drizzle snapshots intentionally do not model the hosted schema. Do not generate a destructive schema diff against `drizzle/schema.ts`.

`public.has_role` continues checking membership, then requires an own-user `aal2` JWT for administrators with any verified factor in `auth.mfa_factors`. Administrators without verified factors retain password sign-in during rollout. Missing assurance claims fail closed. The existing own-role SELECT policy stays available at AAL1 for login verification. Current content/storage editing policies and private enquiry RPCs call this helper. The migration neither creates users nor grants roles, enrols factors or sends mail.

The migration owner must be able to read `auth.mfa_factors`; a read-only database login cannot apply it. Verify this capability through Lovable's supported backend tooling. Do not bypass restrictions or copy service keys into the browser. Future privileged APIs must enforce the same assurance requirement rather than trusting a client flag. Service-role contact delivery remains a separate server-only permission path.

## Owner deployment order

1. Load this branch in a preview with enrolment disabled. Build using the normal project configuration on the host. Check the visual layout at 320/375/768px and desktop, keyboard operation, zoom and password-manager autofill. Verify the current admin password signs in and all four dashboard modules load. No MFA enrolment yet.
2. Inspect existing factors without printing any keys. If the current admin already has a verified factor, verify access to its authenticator and use a compatible MFA frontend before applying the migration. Otherwise apply exactly one migration copy through the normal privileged migration process. Confirm roles, enquiries and outbox rows are unchanged. Applying it affects the shared live backend.
3. In the actual hosted Auth settings, disable public user signup and anonymous signup; keep email/password sign-in for the existing admin. Verify the OAuth authorization server/external application grants are disabled or explicitly owner-approved. A hidden registration page is not backend signup protection. Do not delete existing users or change their roles.
4. Verify TOTP is supported/enabled in this Lovable-backed project. Supabase documents its TOTP API as free. No SMS factor, paid add-on or provider subscription should be enabled for this feature. If the platform cannot provide the required capability, leave enrolment disabled and retain password-only sign-in.
5. Configure the Auth Site URL for the production Vercel origin and allow these exact recovery redirects as applicable:
   - `https://sree-sitaramalayam.vercel.app/?auth_callback=recovery`
   - `https://preview--sree-seetharamachandra-swamy.lovable.app/?auth_callback=recovery`
   - Add the exact current preview/deployment origin separately if it differs; do not add a broad wildcard or any login receipt/token.
6. Verify Auth email delivery is configured. The contact form's Gmail API/n8n setup does not provide Supabase Auth password-reset delivery. Inspect the actual Lovable Auth mail feature or supported SMTP configuration; do not assume the standard Supabase default sender will deliver to arbitrary accounts. Do not purchase a mail plan without owner approval. Keep credentials in the provider's secure form.
7. With owner participation, test one password-reset email for the existing admin, same-browser link handling, expiry/used-link behavior and a fresh sign-in after reset. The owner enters and submits any new password privately. Verify the live backend's throttling and review available Auth audit logs; browser cooldowns are bypassable. Session lifetime, inactivity limits, CAPTCHA and mail rate limits depend on actual provider settings and are not asserted to be configured here.
8. Publish the compatible frontend to Vercel only after the preview and recovery checks and the owner's deployment approval. Keep production on its existing branch until then. Do not merge into main as part of backend setup.
9. Arrange an owner-assisted recovery path before enrolling the sole admin. Confirm who can securely remove a lost factor using the supported backend Auth administration mechanism. A password-reset email cannot remove MFA. The app does not invent or claim to issue recovery codes. Privately secure the authenticator's supported backup or a second device.
10. Enable `VITE_ADMIN_MFA_ENABLED=true` only after the backend migration/capability checks and a compatible frontend are ready. This is a public build flag, not a secret. The owner scans the QR privately, enters the current code, and confirms backup preparation. Never share QR images, setup keys, OTPs or recovery URLs in chat or logs.
11. Verify a fresh password-only session cannot query enquiries, mutate content/upload media or call the private inbox RPC; verify the TOTP session can. Check wrong/expired codes and logout. Enrolment on this shared backend immediately affects production too: an old production login will be unable to open private data once a factor is verified.
12. Recheck the existing contact form and n8n replies after rollout, using owner-controlled test recipients only when explicitly authorized. No contact workflow changes are required by this feature.

## Recovery and rollback

If enrolment is unfinished, cancel/discard that unverified setup and begin again. If a verified authenticator is lost, the owner first verifies the administrator's identity through an established channel, then uses supported privileged Auth tooling to remove the specific lost factor and revoke compromised sessions. Do not relax RLS, grant an anonymous role, publish a service key or silently bypass the code challenge. Once access is recovered, enrol and verify a replacement privately.

Setting the setup flag to false prevents new UI enrolments; it does not turn off protection for existing factors. Restoring the previous frontend after enrolling MFA can strand the old login screen at AAL1. Restore a compatible MFA frontend first. Reverting the migration would weaken backend protection and requires a deliberate owner decision; it is not an automatic rollback action.

A browser-stored session is not a server-enforced inactivity limit. Trusted-device sessions follow provider refresh/expiry rules. Sign out on shared computers; closing a tab is not guaranteed revocation because browsers can restore tab storage. Future mobile clients should reuse the same Auth/RLS contract and use platform secure storage instead of WebView local storage. Native recovery links require a separate deep-link/PKCE implementation; current callbacks are for the web deployment.

## Verification

Automated UI tests cover delayed roles, stale/logout races, server-identity mismatch, MFA gating, recovery validation, single-use callbacks, private routing, password-manager attributes, duplicate submission, and fresh proof before factor removal. `scripts/verify-admin-mfa.mjs` exercises the actual migration/policies in ephemeral PostgreSQL, including missing assurance claims, storage writes and unchanged server-only contact automation. It never connects to the live backend.

Run `npm test`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, `npm run test:admin-db`, `npm run test:contact-db`, and `npm run test:faq`. Keep real-account recovery/enrolment and live preview checks separate from mocked/isolated checks.

References: [Supabase TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [password recovery](https://supabase.com/docs/guides/auth/passwords), [password security](https://supabase.com/docs/guides/auth/password-security), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits).
