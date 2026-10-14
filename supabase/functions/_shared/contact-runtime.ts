import { createClient } from 'npm:@supabase/supabase-js@2.99.3';
import { sendGmail, type Enquiry } from './contact.ts';

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

export function serviceClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function gmailCredentials() {
  return {
    clientId: requiredEnv('GMAIL_CLIENT_ID'),
    clientSecret: requiredEnv('GMAIL_CLIENT_SECRET'),
    refreshToken: requiredEnv('GMAIL_REFRESH_TOKEN'),
  };
}

export async function deliverOne(messageId?: string): Promise<boolean> {
  const credentials = gmailCredentials();
  const db = serviceClient();
  const { data: jobs, error: claimError } = await db.rpc('claim_contact_email', { p_message_id: messageId ?? null });
  if (claimError) throw new Error('Could not claim notification');
  const job = jobs?.[0];
  if (!job) return false;
  try {
    const { data: row, error } = await db.from('messages').select('id,name,email,phone,subject,message').eq('id', job.message_id).single();
    if (error || !row) throw new Error('Enquiry could not be loaded');
    const enquiry: Enquiry = { ...row, request_id: row.id };
    const gmailId = await sendGmail(enquiry, credentials);
    const { error: updateError } = await db.from('contact_email_outbox').update({
      status: 'sent', gmail_message_id: gmailId, sent_at: new Date().toISOString(), locked_until: null, last_error: null,
    }).eq('message_id', job.message_id);
    if (updateError) throw new Error('Delivery status could not be saved');
  } catch (error) {
    // Errors deliberately omit provider responses, tokens and enquiry bodies.
    const reason = error instanceof Error ? error.message : 'Notification failed';
    const terminal = job.attempts >= 5;
    const { error: updateError } = await db.from('contact_email_outbox').update({
      status: terminal ? 'failed' : 'pending',
      locked_until: null,
      next_attempt_at: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts)).toISOString(),
      last_error: reason,
    }).eq('message_id', job.message_id);
    if (updateError) console.error('Notification retry could not be recorded', job.message_id);
    console.error('Contact notification failed', job.message_id, reason);
  }
  return true;
}
