import { validateEnquiry } from '../_shared/contact.ts';
import { deliverOne, gmailCredentials, requiredEnv, serviceClient } from '../_shared/contact-runtime.ts';

Deno.serve(async (request) => {
  let allowedOrigins: string[];
  try {
    allowedOrigins = requiredEnv('CONTACT_ALLOWED_ORIGINS').split(',').map((origin) => origin.trim());
  } catch {
    return Response.json({ error: 'Contact service is not configured' }, { status: 503 });
  }
  const origin = request.headers.get('Origin') || '';
  const allowed = allowedOrigins.includes(origin);
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (allowed) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (body: unknown, status: number) => Response.json(body, { status, headers });
  if (!allowed) return reply({ error: 'Origin not permitted' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: 'Method not permitted' }, 405);
  let enquiry;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 16384) return reply({ error: 'Enquiry too large' }, 413);
    enquiry = validateEnquiry(JSON.parse(body));
  } catch {
    return reply({ error: 'Invalid enquiry. Check the required fields and optional 10-digit phone.' }, 400);
  }
  try {
    gmailCredentials(); // Fail before accepting enquiries if sender credentials are absent.
    const db = serviceClient();
    const { data, error } = await db.rpc('enqueue_contact_enquiry', {
      p_request_id: enquiry.request_id, p_name: enquiry.name, p_email: enquiry.email,
      p_phone: enquiry.phone, p_subject: enquiry.subject, p_message: enquiry.message,
    });
    if (error) {
      if (error.code === 'P0001') return reply({ error: 'Too many enquiries. Please try again later.' }, 429);
      if (error.code === '23505') return reply({ error: 'This reference was already used for another enquiry.' }, 409);
      throw new Error('Could not save enquiry');
    }
    try {
      await deliverOne(data);
    } catch {
      // The durable outbox and scheduled worker handle retries after acceptance.
      console.error('Contact notification deferred', data);
    }
    return reply({ received: true, reference: data }, 202);
  } catch {
    return reply({ error: 'Contact service is unavailable. Please try again later.' }, 503);
  }
});
