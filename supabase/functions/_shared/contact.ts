export const ADMIN_EMAIL = 'ramalayamkyp@gmail.com';

export interface Enquiry {
  request_id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
}

export function validateEnquiry(input: unknown): Enquiry {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid enquiry');
  const value = input as Record<string, unknown>;
  const limits = { name: 100, email: 254, subject: 150, message: 5000 };
  const fields: Record<string, string> = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof value[key] !== 'string') throw new Error(`Invalid ${key}`);
    const text = (value[key] as string).trim();
    if (!text || text.length > limit) throw new Error(`Invalid ${key}`);
    fields[key] = text;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) throw new Error('Invalid email');
  if (typeof value.request_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.request_id)) {
    throw new Error('Invalid request reference');
  }
  if (value.phone !== null && value.phone !== undefined && typeof value.phone !== 'string') throw new Error('Invalid phone');
  const phone = typeof value.phone === 'string' ? value.phone.trim() || null : null;
  if (phone !== null && !/^[0-9]{10}$/.test(phone)) throw new Error('Phone must be exactly 10 digits');
  return { request_id: value.request_id, name: fields.name, email: fields.email, subject: fields.subject, message: fields.message, phone };
}

function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

export function gmailMessage(enquiry: Enquiry): string {
  // No visitor-supplied text is interpolated into Subject/From/To headers.
  // The validated email address is used only as Reply-To, never as From.
  const body = [
    'A visitor submitted an enquiry through the Sri Ramalayam website.',
    `Reference: ${enquiry.request_id}`,
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone || 'Not provided'}`,
    `Subject: ${enquiry.subject}`,
    '',
    enquiry.message,
    '',
    'Reply to this email to respond directly to the visitor.',
  ].join('\r\n');
  const mime = [
    `From: Sri Ramalayam <${ADMIN_EMAIL}>`,
    `To: ${ADMIN_EMAIL}`,
    `Reply-To: ${enquiry.email}`,
    `Subject: [Temple enquiry] ${enquiry.request_id}`,
    `Message-ID: <temple-enquiry-${enquiry.request_id}@gmail.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64(body).match(/.{1,76}/g)?.join('\r\n') || '',
  ].join('\r\n');
  return base64(mime).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export async function sendGmail(enquiry: Enquiry, credentials: GmailCredentials, request = fetch): Promise<string> {
  const tokenResponse = await request('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!tokenResponse.ok) throw new Error('Gmail authorization failed');
  const token = await tokenResponse.json();
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Gmail authorization failed');
  const response = await request(`https://gmail.googleapis.com/gmail/v1/users/${ADMIN_EMAIL}/messages/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: gmailMessage(enquiry) }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Gmail delivery failed');
  const result = await response.json();
  if (typeof result.id !== 'string' || !result.id) throw new Error('Gmail delivery was not confirmed');
  return result.id;
}
