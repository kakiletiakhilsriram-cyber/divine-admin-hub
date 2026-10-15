# Temple enquiry FAQ automation

Status: prepared and tested as an unpublished local n8n 2.43.5 draft on 15 October 2026. It is not sending automatic replies yet.

The temple owner approved the four English answers in `approved-faq.json`: visiting hours, entry fee, special pujas and prasadam. There is no AI integration or AI usage charge. Matching is deliberately conservative: additional conditions, unsupported wording, non-English questions and unknown subject context require admin review.

## Workflow

Gmail Trigger → validate notification and match FAQ → delivery gate → persistent reference deduplication → FAQ/admin branch → visitor answer or admin review notification.

The Gmail trigger polls every minute for the website's own notification emails, including read messages. Full message parsing is required for the visitor's Reply-To and enquiry text. The router checks the original subject/reference, sender/recipient, known body format and a single Reply-To matching the body email. These are input checks, not a cryptographic attestation. The Gmail account remains the trust boundary.

Matched replies contain only the approved answer(s), disclose that they are automatic, and invite the visitor to reply for personal help. The recipient is the validated visitor Reply-To, never the notification's From address. An unmatched enquiry instead creates an `[Admin review]` email to `ramalayamkyp@gmail.com`, with the original question and reference. The original website notification remains available for a personal reply. Follow-up visitor emails and outgoing automatic responses do not match the trigger's original-notification filter.

## Files and verification

- `faq-router.cjs`: approved answers, conservative question matching, notification checks and delivery-mode rules.
- `approved-faq.json`: readable approved questions and answers.
- `temple-faq-workflow.json`: portable preview export; no credentials, local account identifiers or pinned data.
- `build-workflow.cjs`: regenerates the export after router changes, always with delivery off and outgoing nodes disabled.
- `verify-faq.cjs`: meaningful offline tests using synthetic messages.

From the repository root, with Node.js available:

```text
node automation/n8n/build-workflow.cjs
node --test automation/n8n/verify-faq.cjs
```

Do not install n8n in the website's frontend dependency tree. Run it separately, and import the JSON into n8n. Select the temple's locally configured Gmail credential on the trigger and both Gmail action nodes. OAuth needs `gmail.readonly` and `gmail.send`; no token, secret, runtime database or credential export belongs in this repository.

The local UI tests used seven synthetic inputs: all four approved questions, one unsupported question, one duplicate and one reply. The router produced five previews (four FAQ and one admin). With outgoing Gmail nodes disabled, routing selected four visitor items and one admin item. A fresh replay stopped at the persistent deduplication node. Temporary pinned data was removed and the unpublished draft was checked after reload. Actual outgoing automatic email delivery is still unverified.

## Controlled test and release

1. Keep the workflow unpublished while preparing a controlled test.
2. Run the instance with `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` before enabling production delivery. This serializes production executions for this small single-instance setup; do not run parallel manual executions or another copy of this workflow. Restart the instance after changing its environment.
3. In the router's `DELIVERY` object, select `deliveryMode: 'test'`, set `testRecipient` to another email address controlled by the owner, and set `startAfter` to the current UTC ISO timestamp before submitting a new test enquiry. Missing/invalid timestamps fail closed. Test mode permits only the nominated visitor address. Old notifications are not eligible.
4. Enable the sending nodes only for this controlled test, and submit a fresh enquiry through the website preview. Confirm the exact response, recipient, reference and Reply-To in the received email. Test one unmatched enquiry and the admin notification. Then verify that a visitor reply does not receive another automatic reply and a replay does not send again.
5. Review the resulting behavior with the owner before changing to `deliveryMode: 'live'`, setting a fresh cutover timestamp and publishing. Check that all temporary pinned inputs are removed. Do not enable another copy of the workflow.
6. For routine local use, keep the computer awake and n8n running. A local instance is not always-on hosting. Move to managed server infrastructure, backups and monitoring before depending on continuous availability.

The delivery gate is separate from n8n's publish state: publishing a fresh export alone cannot send emails. The exported Gmail sending nodes are also disabled. Manual execution of an individual sending node can bypass upstream conditions after that node is enabled, so use complete controlled test runs.

## Deduplication and recovery limits

The built-in Remove Duplicates node remembers attempted references in n8n's database, up to a configured 10,000 entries. Batch duplicates are also removed by the router. Sequential replay was verified; this does not provide an exactly-once delivery guarantee or an atomic distributed claim. Serialize executions as described above. Monitor history capacity; do not clear it casually.

References are recorded before sending. A failed or uncertain Gmail send therefore needs manual review: check Gmail Sent for the reference before retrying the failed sending step. Re-running the whole workflow deliberately does not send another automatic response for a remembered reference. Automated retries are disabled on Gmail action nodes to avoid blind duplicate sends. The website-to-admin notification's separate durable retry worker is unaffected.

Back up the local n8n database and its credential-encryption key together while the instance is stopped. Limit execution-data retention. Configure failure alerts before production use. Google OAuth credentials left in External Testing can expire after seven days; resolve authorization lifecycle before continuous use.

## Updating answers

Obtain owner approval first. Update the FAQ list and supported patterns in `faq-router.cjs`, add tests for intended matches and important exceptions, then regenerate and verify the export. The standalone JSON file does not live-sync into an already imported n8n workflow. Reimport/update the unpublished draft deliberately and repeat preview and controlled-delivery checks.

References: [n8n Gmail setup](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/), [Remove Duplicates behavior](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.removeduplicates/).
