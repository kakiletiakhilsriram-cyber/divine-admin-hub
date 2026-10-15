// Generate a separate, disabled import. Never overwrite the running local workflow.
const fs = require('node:fs');
const path = require('node:path');
const workflow = JSON.parse(fs.readFileSync(path.join(__dirname, 'temple-faq-workflow.json'), 'utf8'));
const endpoint = 'https://xdtqbxgjskmvffbsmrtn.supabase.co/functions/v1/contact-automation-event';
const restore = 'Restore enquiry after claim';
const original = `$(${JSON.stringify(restore)}).item.json`;
function httpNode(name, body, position) {
  return { id: name.toLowerCase().replaceAll(' ', '-'), name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position,
    parameters: { method: 'POST', url: endpoint, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
      sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify(' + body + ') }}', options: { timeout: 15000 } } };
}
workflow.name = 'Temple Enquiry Responses - tracked rollout';
workflow.nodes = workflow.nodes.filter(n => n.name !== 'Remember attempted reference');
workflow.nodes.push(httpNode('Claim enquiry in database', '{action:"begin",reference:$json.reference,attemptId:$json.reference,route:$json.route,visitorEmail:$json.visitorEmail}', [700,0]));
workflow.nodes.push({ id: 'restore-enquiry-after-claim', name: restore, type: 'n8n-nodes-base.code', typeVersion: 2,
  position: [900,0], parameters: { jsCode: 'return $input.all().flatMap((item, index) => item.json.allowed === true ? [{json: $("Validate and match approved FAQ").itemMatching(index).json, pairedItem:{item:index}}] : []);' } });
for (const [name, x, y] of [['Record FAQ acceptance',1500,-140],['Record admin acceptance',1500,140]]) {
  const node = httpNode(name, `{action:"finish",reference:${original}.reference,attemptId:${original}.reference,outcome:"sent",providerMessageId:$json.id}`, [x,y]);
  // Safe to repeat the idempotent result callback, never repeat Gmail Send.
  node.retryOnFail = true; node.maxTries = 3; node.waitBetweenTries = 1000;
  workflow.nodes.push(node);
}
for (const [name,y] of [['Record uncertain FAQ send',-280],['Record uncertain admin send',280]]) {
  const node = httpNode(name, `{action:"finish",reference:${original}.reference,attemptId:${original}.reference,outcome:"uncertain"}`, [1500,y]);
  node.retryOnFail = true; node.maxTries = 3; node.waitBetweenTries = 1000; workflow.nodes.push(node);
}
const edge = name => ({ node: name, type: 'main', index: 0 });
workflow.connections['Delivery enabled'].main[0] = [edge('Claim enquiry in database')];
delete workflow.connections['Remember attempted reference'];
workflow.connections['Claim enquiry in database'] = { main: [[edge(restore)]] };
workflow.connections[restore] = { main: [[edge('Approved FAQ matched')]] };
for (const [nodeName,success,failure] of [
  ['Send approved answer to visitor','Record FAQ acceptance','Record uncertain FAQ send'],
  ['Notify admin of unmatched enquiry','Record admin acceptance','Record uncertain admin send'],
]) {
  const node = workflow.nodes.find(n=>n.name === nodeName);
  node.onError = 'continueErrorOutput'; node.retryOnFail = false;
  workflow.connections[nodeName] = { main: [[edge(success)],[edge(failure)]] };
}
const note = workflow.nodes.find(n=>n.type==='n8n-nodes-base.stickyNote');
note.parameters.content = '## STAGED: enquiry tracking\nDeploy tracking migration and contact-automation-event first.\nSelect the Gmail credential and a Header Auth credential for every HTTP node.\nHeader: Authorization / Bearer plus the private CONTACT_AUTOMATION_SECRET.\nKeep the secret out of workflow JSON and code.\nDelivery stays OFF and Gmail nodes disabled until controlled tests pass.\n\nDatabase claim prevents concurrent duplicate attempts. Gmail failures are uncertain: inspect Sent before manual intervention. Never automatically retry Send.\n\nUnpublish the old workflow before activating this replacement. Never run both together.\nUse a fresh startAfter timestamp; old emails are not reconstructed.';
workflow.active = false; workflow.pinData = {};
fs.writeFileSync(path.join(__dirname, 'temple-faq-tracked-workflow.json'), JSON.stringify(workflow,null,2));
console.log('Generated disabled tracked workflow; configure private credentials in n8n after backend deployment.');
