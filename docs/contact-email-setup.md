# Contact form and Gmail setup

## Confirmed workflow

- Visitors submit a name, email, optional **exactly 10-digit** phone, subject and message.
- The server saves the enquiry and an email-outbox record in one transaction.
- A Gmail notification is sent **from and to `ramalayamkyp@gmail.com`**. The visitor's validated address is its Reply-To, so the admin's Reply goes to the visitor.
- Existing enquiries remain visible in the admin dashboard.
- A failed email is retried by a protected worker, up to five claimed attempts. Delivery has at-least-once semantics: a send that succeeds just before a timeout/status-write failure can result in a duplicate notification. Reference IDs help identify duplicates.
- Automatic visitor responses and the human escalation workflow are **not implemented yet**; those are the owner's later n8n phase.

The website does not need a new mail domain for this Gmail API implementation. However, owning the Gmail account alone is insufficient: a Google Cloud OAuth client and sending authorization must be configured first. OAuth here is for the website's server to send through the temple Gmail account, not external AI access to the website.

## Google account configuration

1. In the temple's Google Cloud project, enable Gmail API and configure an OAuth consent screen/client for a web application.
2. Authorize **`ramalayamkyp@gmail.com`**, requesting the minimum sending scope `https://www.googleapis.com/auth/gmail.send` and offline access. Keep the resulting refresh token private.
3. Use Google's documented web-server OAuth flow. For initial manual provisioning, Google's OAuth Playground can use your own OAuth client with its documented redirect URI. Do not paste tokens, client secrets or passwords into a chat, repository or frontend environment file.
4. Configure publishing/test-user status appropriate to the temple's own account. External OAuth apps left in Testing can issue Gmail refresh tokens that expire after seven days; prepare production authorization and monitor revoked/expired credentials rather than assuming a permanent token.

References: [Gmail server authorization](https://developers.google.com/workspace/gmail/api/auth/web-server), [Google OAuth lifecycle](https://developers.google.com/identity/protocols/oauth2/), [Gmail sending](https://developers.google.com/workspace/gmail/api/guides/sending).

## Supabase configuration

Configure these **backend secrets** in Supabase Edge Functions:

| Secret | Value |
|---|---|
| `GMAIL_CLIENT_ID` | Temple's Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Its private client secret |
| `GMAIL_REFRESH_TOKEN` | Refresh token authorized by the temple Gmail account |
| `CONTACT_ALLOWED_ORIGINS` | `https://sree-sitaramalayam.vercel.app` plus explicitly approved preview/local origins, comma-separated without trailing slashes |
| `CONTACT_WORKER_SECRET` | A randomly generated secret of at least 32 characters; server/scheduler only |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be available to the Edge runtime. The service-role key must never be placed in a `VITE_` variable or sent to visitors.

Apply the new migrations in order:

1. `20261014000100_messages_phone_digits_only.sql`
2. `20261014000200_contact_email_outbox.sql`

The phone trigger validates inserted/changed phone values but does not rewrite old enquiries or block an unrelated mark-as-read update. The outbox migration temporarily preserves the existing anonymous insert policy so the old live frontend keeps saving enquiries during deployment. Only submissions through the new endpoint create email jobs; old-form submissions remain dashboard-only during this transition. The RPC functions are executable only by the backend service role, and personal enquiries retain the existing admin-only read policy. Older enquiries are not retroactively emailed.

Deploy `submit-contact` and `contact-email-worker` with the included function configuration. JWT verification is disabled intentionally for the public form endpoint and worker; the worker instead requires its private bearer secret. Public submission validates inputs and origins and enforces a database rate limit of five new enquiries per email address in 15 minutes. Origin checking is a browser boundary, **not** proof that a caller is human. Add a bot challenge and broader gateway rate limits before exposing the endpoint to significant untrusted traffic.

Create a Supabase Cron job to POST to:

`https://xdtqbxgjskmvffbsmrtn.supabase.co/functions/v1/contact-email-worker`

Use `Authorization: Bearer <CONTACT_WORKER_SECRET>` and store the secret in Supabase Vault rather than embedding it in a public script. A once-per-minute job is a reasonable starting configuration; the worker processes one eligible email per call. Monitor queue age and adjust frequency/concurrency if needed. Enable the required Cron/pg_net extensions through the Supabase setup. [Supabase scheduling guidance](https://supabase.com/docs/guides/functions/schedule-functions).

Deployment order matters: configure secrets, apply migrations, deploy functions and the worker schedule, verify the preview, then deploy the updated frontend. Include the actual preview origin in `CONTACT_ALLOWED_ORIGINS` for testing. Do not publish the frontend before its endpoint is ready. After confirming a real production enquiry in both the dashboard and Gmail, manually execute `supabase/rollout/finalize-contact-cutover.sql` to remove direct anonymous inserts. This file is outside automatic migrations deliberately: running it before the new frontend is live blocks the old form. Until final cutover, the old direct-insert path retains its existing validation/rate-limit limitations. After cutover, restoring the old frontend alone is not a valid rollback; it would require a reviewed database-policy rollback too.

## Verification before production

- Optional phone blank: accepted; valid 10 digits: accepted; letters and other lengths: rejected server-side.
- Submit a staging enquiry and confirm **both** the dashboard record and the message in the temple Gmail inbox.
- Click Reply in Gmail and confirm it targets the visitor, not the temple account.
- Use Telugu content and verify it remains readable.
- Reuse the same submission reference and unchanged content: one record/outbox job. A conflicting payload with that reference must be rejected.
- Simulate revoked Gmail authorization: enquiry remains stored, pending/failed delivery is visible to admins in `contact_email_outbox`; worker retries after the backoff time.
- During staged rollout, the old form still saves enquiries and does not email them. After final cutover, anonymous callers cannot directly insert/read messages or execute the RPCs; unauthorized worker requests fail.
- Check alerts or an operational dashboard for failed/aging notifications. A queued acknowledgement is not an assertion that Gmail has delivered the email.

## n8n phase

When n8n is ready, connect the Gmail account using n8n's own supported authentication. Recognize the initial notification by its `[Temple enquiry]` subject/reference, and send the response to the validated Reply-To visitor address, **not** the notification's From address (which is the temple itself). Send visitor responses from the temple account and keep replies addressed to the temple.

Use a processed-reference store so polling/retries do not send repeated automatic responses. Do not automatically answer a visitor's subsequent reply: flag it for the admin's personal response. Exclude outgoing auto-responses and already-processed threads to prevent reply loops. Draft responses only from verified temple information; route uncertainty to the admin instead of inventing timings or religious details. Keep personal information out of automation execution logs where possible.

## Current limitations

Code and tests are prepared; production Gmail authorization, Supabase deployment/migrations, scheduler configuration and a real inbox-delivery test still require access to the owner's accounts. No Gmail credentials are included. Browser visual tests were not performed for this change. Automated tests use mocked provider responses and do not prove real email deliverability.
