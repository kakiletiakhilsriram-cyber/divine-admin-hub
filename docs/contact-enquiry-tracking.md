# Contact enquiry tracking

## What changes

The admin Messages section becomes an enquiry inbox with parameterized server-side search, status/email/date filters, 25-row pagination, a full readable detail panel on narrow screens, and an event timeline. Queries refresh every 30 seconds. Failures are shown as errors rather than an empty inbox. Closing retains the enquiry; it can be reopened.

Follow-up status is separate from email outcome:

- **New** is the initial tracking status, including existing records whose past handling is unknown.
- **Awaiting admin** is set when the tracked workflow claims an unmatched enquiry, or cannot confirm a send. It never overrides Replied or Closed.
- **Replied** is set explicitly by the admin after sending a personal reply in Gmail. Clicking Open email reply opens the email application and never marks an enquiry as replied.
- **Closed** is an admin decision. Automatic FAQ acceptance does not close an enquiry or claim a personal response.

Gmail acceptance means the provider accepted the request. It does not prove inbox delivery, reading, or a human reply. Old n8n responses show **Automation not recorded**. No historic outcomes are reconstructed. The original website outbox's current status remains available; its future transitions produce timeline events.

## Deployment order (shared backend)

This repository uses one Lovable/Supabase backend for preview and live. Applying a migration affects both. No cutover SQL, existing messages, existing outbox rows, or live n8n workflow need to be deleted.

1. Apply **one copy** of `supabase/migrations/20261015000100_contact_enquiry_tracking.sql` through the backend owner/deployment tool. The identical Drizzle migration is `drizzle/migrations/0003_contact_enquiry_tracking.sql` and its journal entry; use the project's normal migration runner. **Do not execute both copies**. Existing migrations used empty Drizzle snapshots/schema; preserve the manual SQL migration history, rather than generating schema diffs against a blank schema.
2. Create a fresh random server secret of at least 32 characters, named `CONTACT_AUTOMATION_SECRET`, in Lovable Cloud Secrets. This is separate from CONTACT_WORKER_SECRET and all Google secrets. Do not paste its value into chat, source, SQL, workflow JSON, or logs.
3. Deploy `contact-automation-event` with the settings in `supabase/config.toml`. The platform JWT check is disabled because this server-to-server endpoint validates its own dedicated bearer secret. Anonymous requests must get 401; GET must get 405. There is deliberately no browser CORS. The Supabase service-role key stays solely in the backend environment.
4. Review the new dashboard in a preview after the migration. No frontend secrets are required. Verify the admin role can read/update, and a non-admin cannot access the RPC/history.
5. In n8n create an **HTTP Header Auth** credential: Name `Authorization`, Value `Bearer ` followed by the secret entered privately. Import `automation/n8n/temple-faq-tracked-workflow.json` as a **separate unpublished** workflow. Select the existing Gmail credential for the trigger and both send nodes, and select this Header Auth credential for **all five HTTP Request nodes**. The import contains no credentials, delivery is off, both sends are disabled, and the original workflow is unaffected.
6. Run a controlled preview first, then test one FAQ and one unmatched enquiry against an owner-controlled recipient. Set DELIVERY to test mode with that address and a fresh ISO startAfter time. Temporarily unpublish the old workflow during the controlled send tests, so both workflows never answer the same enquiry. Enable only the route being tested. Check the dashboard timeline and outcome. Confirm replay returns allowed:false and sends nothing. Never clear the durable claim table to replay an uncertain email.
7. After checking both routes, set DELIVERY to live with a fresh startAfter timestamp, enable both sends, and publish the replacement. Keep the old workflow unpublished. Leave templates committed to Git in disabled preview mode. Publish the frontend through the user's normal preview/production process after its checks. This document does not authorize a main-branch merge or production site publication.

If only the migration/dashboard are deployed, website notification history and manual statuses work, but n8n outcomes stay unrecorded until the replacement workflow is configured. The previously tested n8n workflow continues replying as before.

## Delivery and failure behavior

The endpoint accepts only begin/finish events with a valid enquiry/attempt UUID and known route/outcome. A begin call checks the visitor email against the stored enquiry, locks the enquiry, and creates a unique durable claim. Concurrent or repeated claims return allowed:false, so the new workflow drops them before sending. PostgreSQL permissions restrict claim/finish RPCs to service_role; only the backend endpoint uses them.

A successful Gmail node calls finish with the provider's message ID. An error-output branch records **uncertain**, since a timeout can happen after a provider accepted an email. Gmail Send is never automatically retried. Result callbacks are idempotent and can retry up to three times. If a callback fails after Gmail accepted a message, execution fails visibly in n8n; a processing claim older than ten minutes appears as unconfirmed in the dashboard's Needs attention filter. It does not get reclaimed for another send. Admins must inspect Gmail Sent and the n8n execution before any manual follow-up. A begin/callback outage requires investigation; this workflow does not promise automatic recovery or exactly-once delivery.

Known boundary: visitor replies arrive in the temple's Gmail inbox for personal handling. They are not ingested into the website timeline, and human replies sent outside the dashboard are not detected. Mark Replied manually. Adding a verified Gmail conversation sync is a separate enhancement.

## Verification

After installing dependencies:

```text
npm test
npm run test:contact-db
npm run test:faq
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

The database check creates an in-memory PostgreSQL database through PGlite with simulated Supabase roles. It tests real SQL migration/RLS behavior, claims, result idempotency, legacy preservation, filtering, pagination, status history and uncertain-send visibility. It never contacts the live backend or Gmail. `CONTACT_TEST_PGLITE` optionally points to a preinstalled PGlite package in a local verification environment. API payload tests and React tests cover unsafe results, failure states, full message access, filtering, explicit status updates and opening drafts without falsely marking replies.

## Windows startup

The current local installation still needs an awake, online computer. In the chat's `outputs/n8n-local` folder, `Enable-autostart.cmd` creates one removable per-user Startup shortcut pointing to a hidden launcher. No new credentials, public network binding or software installation is involved. It leaves an existing listener on port 5678 alone; on the next sign-in it starts n8n only if the port is free. Logs remain in the private runtime folder and rotate at 5 MB. This is sign-in startup, not a Windows service or a guarantee that a sleeping/offline computer can respond.
