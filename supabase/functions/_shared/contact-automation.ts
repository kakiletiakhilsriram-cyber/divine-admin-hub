const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateAutomationEvent(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid event');
  const v = value as Record<string, unknown>;
  if (typeof v.reference !== 'string' || !uuid.test(v.reference) ||
      typeof v.attemptId !== 'string' || !uuid.test(v.attemptId)) throw new Error('Invalid reference');
  if (v.action === 'begin') {
    if ((v.route !== 'faq' && v.route !== 'admin') || typeof v.visitorEmail !== 'string' ||
        v.visitorEmail.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(v.visitorEmail)) throw new Error('Invalid route');
    return { action: 'begin' as const, reference: v.reference, attemptId: v.attemptId,
      route: v.route, visitorEmail: v.visitorEmail.toLowerCase() };
  }
  if (v.action !== 'finish' || !['sent', 'failed', 'uncertain'].includes(String(v.outcome))) throw new Error('Invalid result');
  if (v.providerMessageId != null && (typeof v.providerMessageId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(v.providerMessageId))) throw new Error('Invalid provider reference');
  if (v.outcome === 'sent' && !v.providerMessageId) throw new Error('Missing provider reference');
  return { action: 'finish' as const, reference: v.reference, attemptId: v.attemptId,
    outcome: v.outcome as 'sent' | 'failed' | 'uncertain', providerMessageId: v.providerMessageId as string | undefined };
}

export async function validAutomationSecret(supplied: string, expected: string): Promise<boolean> {
  if (expected.length < 32 || !supplied) return false;
  const hash = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([hash(supplied), hash(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
