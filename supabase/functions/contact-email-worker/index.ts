import { deliverOne, requiredEnv } from '../_shared/contact-runtime.ts';

Deno.serve(async (request) => {
  let expected: string;
  try {
    expected = requiredEnv('CONTACT_WORKER_SECRET');
    if (expected.length < 32) throw new Error('Worker secret is too short');
  } catch {
    return Response.json({ error: 'Worker is not configured' }, { status: 503 });
  }
  const supplied = request.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
  // Hash both values before comparison so the secret itself is not compared byte by byte.
  const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([digest(supplied), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  if (difference !== 0 || !supplied) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (request.method !== 'POST') return Response.json({ error: 'Method not permitted' }, { status: 405 });
  try {
    const processed = await deliverOne();
    return Response.json({ processed });
  } catch {
    return Response.json({ error: 'Notification worker unavailable' }, { status: 503 });
  }
});
