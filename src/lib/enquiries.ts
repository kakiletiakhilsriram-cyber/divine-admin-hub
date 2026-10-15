export const ENQUIRY_STATUSES = { new: 'New', awaiting_admin: 'Awaiting admin', replied: 'Replied', closed: 'Closed' } as const;
export type EnquiryStatus = keyof typeof ENQUIRY_STATUSES;
export interface Enquiry {
  id: string; name: string; email: string; phone: string | null; subject: string; message: string;
  created_at: string; is_read: boolean | null; enquiry_status: EnquiryStatus;
  notification: { status: string; attempts: number; sent_at: string | null; next_attempt_at: string; locked_until: string | null } | null;
  automation: { route: 'faq' | 'admin'; state: string; started_at: string; finished_at: string | null } | null;
}
export interface EmailEvent { id: string; kind: string; outcome: string; detail: string; created_at: string }
export function emailSummary(enquiry: Enquiry) {
  const r = enquiry.automation;
  if (!r) return 'Automation not recorded';
  const name = r.route === 'faq' ? 'FAQ answer' : 'Admin review email';
  if (r.state === 'sent') return `${name} accepted by Gmail`;
  if (r.state === 'processing') return `${name} in progress`;
  if (r.state === 'failed') return `${name} failed`;
  return `${name}: delivery unconfirmed`;
}
export function notificationSummary(enquiry: Enquiry) {
  const n = enquiry.notification;
  if (!n) return 'No website email record (older enquiry)';
  if (n.status === 'sent') return 'Website notification accepted by Gmail';
  if (n.status === 'failed') return 'Website notification failed';
  if (n.status === 'processing') return 'Website notification in progress';
  return n.attempts ? 'Website notification waiting for retry' : 'Website notification queued';
}
export function needsAttention(enquiry: Enquiry) {
  const n = enquiry.notification;
  return ['failed', 'uncertain'].includes(enquiry.automation?.state || '') || n?.status === 'failed' ||
    (n?.status === 'pending' && n.attempts > 0) ||
    (n?.status === 'processing' && !!n.locked_until && Date.parse(n.locked_until) < Date.now());
}
export function replyLink(enquiry: Pick<Enquiry, 'id' | 'email'>) {
  return `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent('Re: Temple enquiry ' + enquiry.id)}`;
}
// The date picker uses the admin's local calendar day; the API receives explicit UTC instants.
export function dateBoundary(value: string, nextDay = false) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day + (nextDay ? 1 : 0)).toISOString();
}
