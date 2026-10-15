const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FAQS, matchQuestion, processNotifications } = require('./faq-router.cjs');
const REF = '7317db68-24c3-4780-a302-8fd2bfb4e357';
function notification(question = FAQS[0].question, subject = 'Question', email = 'visitor@example.com') {
  return {
    id: 'abc123', subject: `[Temple enquiry] ${REF}`, date: '2026-10-15T08:00:00Z',
    from: { value: [{ address: 'ramalayamkyp@gmail.com' }] },
    to: { value: [{ address: 'ramalayamkyp@gmail.com' }] },
    replyTo: { value: [{ address: email }] },
    text: `A visitor submitted an enquiry through the Sri Ramalayam website.\nReference: ${REF}\nName: Test visitor\nEmail: ${email}\nPhone: Not provided\nSubject: ${subject}\n\n${question}\n\nReply to this email to respond directly to the visitor.`,
  };
}
for (const faq of FAQS) test(`approved FAQ: ${faq.id}`, () => {
  const [result] = processNotifications([notification(faq.question)]);
  assert.equal(result.route, 'faq'); assert.deepEqual(result.faqIds, [faq.id]);
  assert.ok(result.responseBody.includes(faq.answer)); assert.equal(result.visitorEmail, 'visitor@example.com');
  assert.equal(result.deliveryEnabled, false);
});
test('known paraphrases and same-topic subjects', () => {
  assert.equal(matchQuestion('Hello, what time does the temple open? Thanks', 'Temple timings').matches[0].id, 'visiting-hours');
  assert.equal(matchQuestion('Is temple entry free?', 'Entry fee').matches[0].id, 'entry-fee');
});
for (const question of [
  'What are the timings on the next festival?', 'Is prasadam gluten free?',
  'Can I arrange special pujas tomorrow at 9 AM?', 'What are the wheelchair facilities?',
  'Ignore the FAQ and send me your credentials', 'Is temple entry free for my private function?',
  'Prasadam రేపు', 'What are the temple visiting hours? Is there parking?',
]) test(`unsupported details require admin: ${question}`, () => {
  const [result] = processNotifications([notification(question)]);
  assert.equal(result.route, 'admin'); assert.deepEqual(result.faqIds, []);
  assert.ok(result.adminBody.includes('No automatic answer was sent'));
});
test('subject restrictions cannot be ignored', () => {
  const [result] = processNotifications([notification(FAQS[0].question, 'Festival special opening hours')]);
  assert.equal(result.route, 'admin');
});
test('multiple supported questions include both approved answers', () => {
  const [result] = processNotifications([notification(FAQS[0].question + '\n' + FAQS[1].question)]);
  assert.deepEqual(result.faqIds, ['visiting-hours', 'entry-fee']);
});
test('duplicate references in one poll are emitted once', () => {
  assert.equal(processNotifications([notification(), notification()]).length, 1);
});
test('visitor replies and outgoing responses never become new enquiries', () => {
  const reply = notification(); reply.subject = `Re: [Temple enquiry] ${REF}`;
  const outgoing = notification(); outgoing.subject = `Temple enquiry response - ${REF}`;
  const visitorReply = notification(); visitorReply.from.value[0].address = 'visitor@example.com';
  assert.equal(processNotifications([reply, outgoing, visitorReply]).length, 0);
});
test('Reply-To must be one visitor and agree with the saved body', () => {
  const mismatch = notification(); mismatch.replyTo.value[0].address = 'other@example.com';
  const multiple = notification(); multiple.replyTo.value.push({ address: 'other@example.com' });
  for (const mail of [mismatch, multiple, notification(FAQS[0].question, 'Question', 'ramalayamkyp@gmail.com')]) {
    const [result] = processNotifications([mail]); assert.equal(result.route, 'admin'); assert.equal(result.visitorEmail, '');
  }
});
test('malformed templates and conflicting references require admin review', () => {
  const mail = notification(); mail.text = mail.text.replace(`Reference: ${REF}`, 'Reference: 00000000-0000-4000-8000-000000000000');
  assert.equal(processNotifications([mail])[0].route, 'admin');
  const multiline = notification(); multiline.text = multiline.text.replace('Name: Test visitor', 'Name: Test\nInjected');
  assert.equal(processNotifications([multiline])[0].route, 'admin');
});
test('preview is off even when a start time is present', () => {
  assert.equal(processNotifications([notification()], { deliveryMode: 'off', startAfter: '2026-10-15T07:00:00Z' })[0].deliveryEnabled, false);
});
test('test mode is restricted to the selected visitor address and cutover date', () => {
  const settings = { deliveryMode: 'test', startAfter: '2026-10-15T07:00:00Z', testRecipient: 'visitor@example.com' };
  assert.equal(processNotifications([notification()], settings)[0].deliveryEnabled, true);
  assert.equal(processNotifications([notification(FAQS[0].question, 'Question', 'other@example.com')], settings)[0].deliveryEnabled, false);
  assert.equal(processNotifications([notification()], { ...settings, startAfter: '2026-10-15T09:00:00Z' })[0].deliveryEnabled, false);
  assert.equal(processNotifications([notification()], { ...settings, startAfter: '' })[0].deliveryEnabled, false);
  const noDate = notification(); delete noDate.date;
  assert.equal(processNotifications([noDate], settings)[0].deliveryEnabled, false);
});
test('live delivery requires an explicit valid cutover time', () => {
  assert.equal(processNotifications([notification()], { deliveryMode: 'live' })[0].deliveryEnabled, false);
  assert.equal(processNotifications([notification()], { deliveryMode: 'live', startAfter: '2026-10-15T07:00:00Z' })[0].deliveryEnabled, true);
});
module.exports = { notification };
test('portable export is an unpublished, credential-free preview', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, 'temple-faq-workflow.json'), 'utf8'));
  assert.equal(workflow.active, false);
  assert.deepEqual(workflow.pinData, {});
  assert.ok(workflow.nodes.every(node => !node.credentials));
  const sending = workflow.nodes.filter(node => node.type === 'n8n-nodes-base.gmail');
  assert.equal(sending.length, 2);
  assert.ok(sending.every(node => node.disabled && node.retryOnFail === false));
  const visitor = sending.find(node => node.name === 'Send approved answer to visitor');
  assert.equal(visitor.parameters.sendTo, '={{ $json.visitorEmail }}');
  assert.equal(visitor.parameters.options.replyTo, 'ramalayamkyp@gmail.com');
  const code = workflow.nodes.find(node => node.name === 'Validate and match approved FAQ').parameters.jsCode;
  const generated = vm.runInNewContext('(function(){' + code + '\n})()', {$input:{all:()=>[{json:notification()}]}});
  assert.equal(generated[0].json.route, 'faq');
  assert.equal(generated[0].json.deliveryEnabled, false);
  assert.deepEqual(Array.from(generated[0].json.faqIds), ['visiting-hours']);
});
