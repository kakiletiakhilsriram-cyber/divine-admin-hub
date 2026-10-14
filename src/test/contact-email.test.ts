import { describe, expect, it, vi } from 'vitest';
import { ADMIN_EMAIL, gmailMessage, sendGmail, validateEnquiry } from '../../supabase/functions/_shared/contact';

const input = {
  request_id: '12345678-1234-4234-8234-123456789abc',
  name: 'Visitor', email: 'visitor@example.com', phone: null,
  subject: 'Temple timings', message: 'శ్రీ రామాలయం — please confirm timings.',
};

describe('server enquiry validation and Gmail notification', () => {
  it('accepts no phone and a 10-digit phone, preserving leading zeroes', () => {
    expect(validateEnquiry(input).phone).toBeNull();
    expect(validateEnquiry({ ...input, phone: '0123456789' }).phone).toBe('0123456789');
  });

  it.each(['abc', '123', '12345678901', '+919876543210', '98765 43210'])('rejects an invalid phone: %s', (phone) => {
    expect(() => validateEnquiry({ ...input, phone })).toThrow();
  });

  it('rejects email-header injection and oversized messages', () => {
    expect(() => validateEnquiry({ ...input, email: 'visitor@example.com\r\nBcc: other@example.com' })).toThrow();
    expect(() => validateEnquiry({ ...input, message: 'x'.repeat(5001) })).toThrow();
  });

  it('always addresses the admin and uses the visitor as Reply-To, preserving Telugu in the body', () => {
    const enquiry = validateEnquiry({ ...input, subject: 'Hello\r\nBcc: attacker@example.com' });
    const raw = gmailMessage(enquiry).replace(/-/g, '+').replace(/_/g, '/');
    const mime = atob(raw);
    const [headers, body] = mime.split('\r\n\r\n');
    expect(headers).toContain(`To: ${ADMIN_EMAIL}`);
    expect(headers).toContain('Reply-To: visitor@example.com');
    expect(headers).not.toContain('Bcc:');
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(body.replace(/\r\n/g, '')), (c) => c.charCodeAt(0)));
    expect(decoded).toContain(input.message);
  });

  it('treats rejected Gmail authorization as a failure without sending email', async () => {
    vi.stubGlobal('AbortSignal', { timeout: () => new AbortController().signal });
    const request = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    try {
      await expect(sendGmail(validateEnquiry(input), { clientId: 'test', clientSecret: 'test', refreshToken: 'test' }, request)).rejects.toThrow('Gmail authorization failed');
      expect(request).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });

  it('requires confirmed Gmail delivery and sends only to the configured account', async () => {
    vi.stubGlobal('AbortSignal', { timeout: () => new AbortController().signal });
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'test-token' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'gmail-test-id' })));
    try {
      await expect(sendGmail(validateEnquiry(input), { clientId: 'test', clientSecret: 'test', refreshToken: 'test' }, request)).resolves.toBe('gmail-test-id');
      expect(request.mock.calls[1][0]).toBe(`https://gmail.googleapis.com/gmail/v1/users/${ADMIN_EMAIL}/messages/send`);
    } finally { vi.unstubAllGlobals(); }
  });
});
