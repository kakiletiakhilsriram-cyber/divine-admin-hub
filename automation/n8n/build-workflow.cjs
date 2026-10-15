const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { FAQS } = require('./faq-router.cjs');
const workflowPath = path.join(__dirname, 'temple-faq-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const source = fs.readFileSync(path.join(__dirname, 'faq-router.cjs'), 'utf8').replace(/^module\.exports = .*;\s*$/m, '');
const settings = { deliveryMode: 'off', testRecipient: '', startAfter: '' };
const router = workflow.nodes.find(node => node.name === 'Validate and match approved FAQ');
if (!router) throw new Error('Router node missing');
router.parameters.jsCode = source + '\n\n// Keep delivery off until a controlled test and owner review.\nconst DELIVERY = '
  + JSON.stringify(settings, null, 2) + ';\nreturn processNotifications($input.all().map(item => item.json), DELIVERY).map(({inputIndex, ...json}) => ({json, pairedItem: {item: inputIndex}}));';
// The distributable is always a preview. Credentials are selected locally in n8n.
workflow.active = false;
workflow.pinData = {};
for (const node of workflow.nodes) {
  delete node.credentials;
  if (node.type === 'n8n-nodes-base.gmail') { node.disabled = true; node.retryOnFail = false; }
}
delete workflow.id;
delete workflow.versionId;
delete workflow.meta;
vm.runInNewContext('(function(){' + router.parameters.jsCode + '\n})()', {$input:{all:()=>[]}});
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
fs.writeFileSync(path.join(__dirname, 'approved-faq.json'), JSON.stringify(FAQS.map(({id,question,answer})=>({id,question,answer})), null, 2));
console.log('Regenerated credential-free preview workflow and approved FAQ data.');
