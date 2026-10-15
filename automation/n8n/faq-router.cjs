'use strict';

// Answers supplied and approved by the temple owner on 2026-10-15.
const ADMIN_EMAIL = 'ramalayamkyp@gmail.com';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const FAQS = [
  {
    id: 'visiting-hours',
    question: 'What are the temple visiting hours?',
    answer: 'The temple is open daily from 6:00 AM to 12:00 PM in the morning and 4:00 PM to 8:00 PM in the evening.',
    patterns: [
      /^(?:what are )?(?:the )?(?:temple )?(?:visiting hours|opening hours|opening times|timings|hours)$/,
      /^what (?:time|times) (?:does|is) (?:the )?temple (?:open|close|open and close)$/,
      /^when (?:does|is) (?:the )?temple (?:open|close|open and close)$/,
      /^(?:temple )?(?:visiting )?hours enquiry$/,
    ],
  },
  {
    id: 'entry-fee',
    question: 'Is there any entry fee?',
    answer: 'No, there is no entry fee. The temple welcomes all devotees. However, donations are welcome and help in temple maintenance.',
    patterns: [
      /^is there (?:any |an? )?(?:entry|entrance|admission) (?:fee|charge)$/,
      /^(?:what is )?(?:the )?(?:entry|entrance|admission) (?:fee|cost|charge)$/,
      /^how much (?:does it cost|is it) to (?:enter|visit) (?:the )?temple$/,
      /^is (?:temple )?entry free$/,
      /^do i (?:need|have) to pay (?:an? )?(?:entry fee|to enter the temple)$/,
    ],
  },
  {
    id: 'special-pujas',
    question: 'Can I arrange special pujas?',
    answer: 'Yes, you can arrange special pujas by contacting the temple office. Please call or email us with your requirements and preferred dates.',
    patterns: [
      /^(?:can|may) (?:i|we) (?:arrange|organise|organize|request) (?:a )?special (?:puja|pujas|pooja|poojas)$/,
      /^how (?:can|do) (?:i|we) (?:arrange|organise|organize|request) (?:a )?special (?:puja|pujas|pooja|poojas)$/,
      /^are special (?:pujas|poojas) available$/,
      /^special (?:puja|pujas|pooja|poojas)(?: enquiry)?$/,
    ],
  },
  {
    id: 'prasadam',
    question: 'Are there facilities for prasadam?',
    answer: 'Yes, prasadam is distributed daily after the morning and evening aartis. Special prasadam is also available during festivals.',
    patterns: [
      /^are there facilities for (?:prasadam|prasadh?am)$/,
      /^is (?:prasadam|prasadh?am) (?:available|provided|distributed)$/,
      /^(?:when is |what time is )?(?:prasadam|prasadh?am)(?: (?:distributed|available|provided))?$/,
      /^do you (?:provide|distribute|offer) (?:prasadam|prasadh?am)$/,
      /^(?:prasadam|prasadh?am) (?:facilities|availability|enquiry)$/,
    ],
  },
];

function normalizeQuestion(text) {
  return text.toLowerCase().replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^(?:(?:hi|hello|namaste)\s+)+/, '')
    .replace(/^(?:please (?:tell me|let me know)|i would like to know)\s+/, '')
    .replace(/\s+(?:please|thank you|thanks)$/, '').trim();
}

function matchQuestion(message, subject) {
  if (/[^\x00-\x7f\u2018\u2019]/.test(message + subject)) return { matches: [], reason: 'Language or wording requires admin review' };
  const parts = message.split(/[?\n;]+/).map(normalizeQuestion).filter(part => part && !/^(hi|hello|namaste|thanks|thank you)$/.test(part));
  if (!parts.length || parts.length > 8) return { matches: [], reason: 'Question requires admin review' };
  const matches = [];
  for (const part of parts) {
    const found = FAQS.filter(faq => faq.patterns.some(pattern => pattern.test(part)));
    if (found.length !== 1) return { matches: [], reason: 'Question is outside the approved FAQ wording' };
    if (!matches.some(faq => faq.id === found[0].id)) matches.push(found[0]);
  }
  const title = normalizeQuestion(subject);
  const generic = /^(?:general )?(?:enquiry|inquiry|question|questions|query|queries|information|faq|test|contact)(?: (?:for|about) (?:the )?temple)?$/.test(title)
    || /^(?:temple|website) (?:enquiry|inquiry|question|query|faq)$/.test(title);
  const sameTopic = matches.some(faq => faq.patterns.some(pattern => pattern.test(title)));
  if (!generic && !sameTopic) return { matches: [], reason: 'Subject adds context outside the matched FAQ' };
  return { matches, reason: '' };
}

function addresses(field) {
  if (!field || !Array.isArray(field.value)) return [];
  return field.value.map(entry => typeof entry.address === 'string' ? entry.address.trim().toLowerCase() : '');
}

function processNotifications(messages, settings = {}) {
  const seen = new Set();
  const output = [];
  for (const [inputIndex, mail] of messages.entries()) {
    // Only the original website notification is eligible, never a visitor reply.
    const subjectMatch = typeof mail.subject === 'string' && mail.subject.match(new RegExp('^\\[Temple enquiry\\] (' + UUID + ')$', 'i'));
    const from = addresses(mail.from);
    if (!subjectMatch || from.length !== 1 || from[0] !== ADMIN_EMAIL || !addresses(mail.to).includes(ADMIN_EMAIL)) continue;
    const reference = subjectMatch[1].toLowerCase();
    if (seen.has(reference)) continue;
    seen.add(reference);
    const text = typeof mail.text === 'string' ? mail.text.replace(/\r\n/g, '\n') : '';
    const bodyPattern = new RegExp('^A visitor submitted an enquiry through the Sri Ramalayam website\\.\\nReference: (' + UUID + ')\\nName: ([^\\n]{1,100})\\nEmail: ([^\\n]{3,254})\\nPhone: (Not provided|[0-9]{10})\\nSubject: ([^\\n]{1,150})\\n\\n([\\s\\S]{1,5000})\\n\\nReply to this email to respond directly to the visitor\\.\\s*$', 'i');
    const body = text.length <= 16384 && !text.includes('\0') && text.match(bodyPattern);
    const replyTo = addresses(mail.replyTo);
    let reason = '';
    let visitorEmail = '';
    let question = '';
    let questionSubject = '';
    let matches = [];
    if (!body || body[1].toLowerCase() !== reference) reason = 'Notification body or reference is invalid';
    else {
      visitorEmail = body[3].trim().toLowerCase();
      questionSubject = body[5].trim();
      question = body[6].trim();
      if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(visitorEmail) || replyTo.length !== 1 || replyTo[0] !== visitorEmail || visitorEmail === ADMIN_EMAIL) {
        visitorEmail = '';
        reason = 'Visitor reply address needs admin verification';
      } else {
        const match = matchQuestion(question, questionSubject);
        matches = match.matches;
        reason = match.reason;
      }
    }
    const route = matches.length ? 'faq' : 'admin';
    const answer = matches.map(faq => matches.length > 1 ? faq.question + '\n' + faq.answer : faq.answer).join('\n\n');
    const responseBody = 'Namaste,\n\n' + answer + '\n\nThis is an automatic reply based on the temple\'s approved FAQ.\nIf this does not answer your question, reply to this email for help from the temple admin.\n\nTemple administration\nReference: ' + reference;
    const receivedAt = Date.parse(mail.date);
    const startAfter = Date.parse(settings.startAfter || '');
    const afterCutover = Number.isFinite(receivedAt) && Number.isFinite(startAfter) && receivedAt >= startAfter;
    const testRecipient = (settings.testRecipient || '').trim().toLowerCase();
    const permittedMode = settings.deliveryMode === 'live' || (settings.deliveryMode === 'test' && visitorEmail && visitorEmail === testRecipient && visitorEmail !== ADMIN_EMAIL);
    output.push({
      inputIndex, reference, notificationMessageId: mail.id || '',
      route, reason, visitorEmail, questionSubject, question,
      faqIds: matches.map(faq => faq.id), responseSubject: 'Temple enquiry response - ' + reference,
      responseBody, adminSubject: '[Admin review] Temple enquiry ' + reference,
      adminBody: 'This enquiry needs your personal response. No automatic answer was sent to the visitor.\n\nReference: ' + reference + '\nReason: ' + reason + '\nVisitor: ' + (visitorEmail || 'Verify Reply-To in the original notification') + '\nSubject: ' + questionSubject + '\n\n' + question + '\n\nPlease use the original website notification in your inbox to reply to the visitor.',
      deliveryEnabled: Boolean(afterCutover && permittedMode),
      deliveryMode: settings.deliveryMode || 'off',
    });
  }
  return output;
}

module.exports = { FAQS, matchQuestion, processNotifications };
