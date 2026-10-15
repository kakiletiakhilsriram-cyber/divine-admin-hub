import { requiredEnv, serviceClient } from '../_shared/contact-runtime.ts';
import { validAutomationSecret, validateAutomationEvent } from '../_shared/contact-automation.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not permitted' }, { status: 405 });
  let secret: string;
  try { secret = requiredEnv('CONTACT_AUTOMATION_SECRET'); }
  catch { return Response.json({ error: 'Automation tracking is not configured' }, { status: 503 }); }
  if (!await validAutomationSecret(request.headers.get('Authorization')?.replace(/^Bearer /, '') || '', secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // No browser CORS; only n8n's server-side HTTP node calls this endpoint.
  let event: ReturnType<typeof validateAutomationEvent>;
  try {
    if (Number(request.headers.get('Content-Length') || 0) > 4096) throw new Error('Too large');
    const text = await request.text();
    if (text.length > 4096) throw new Error('Too large');
    event = validateAutomationEvent(JSON.parse(text));
  } catch { return Response.json({ error: 'Invalid event' }, { status: 400 }); }
  try {
    const db = serviceClient();
    const result = event.action === 'begin'
      ? await db.rpc('begin_contact_automation', { p_message_id: event.reference, p_attempt_id: event.attemptId,
        p_route: event.route, p_visitor_email: event.visitorEmail })
      : await db.rpc('finish_contact_automation', { p_message_id: event.reference, p_attempt_id: event.attemptId,
        p_outcome: event.outcome, p_provider_message_id: event.providerMessageId ?? null });
    if (result.error) return Response.json({ error: 'Event could not be recorded' }, { status: 409 });
    return Response.json({ allowed: result.data === true });
  } catch { return Response.json({ error: 'Tracking service unavailable' }, { status: 503 }); }
});
