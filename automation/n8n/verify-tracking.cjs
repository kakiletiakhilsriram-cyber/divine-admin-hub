const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const workflow = JSON.parse(fs.readFileSync(path.join(__dirname,'temple-faq-tracked-workflow.json'),'utf8'));
test('tracking import cannot send until explicitly configured',()=>{
  assert.equal(workflow.active,false);
  assert.ok(workflow.nodes.every(n=>!n.credentials));
  for(const n of workflow.nodes.filter(n=>n.type==='n8n-nodes-base.gmail')){
    assert.equal(n.disabled,true);assert.equal(n.retryOnFail,false);assert.equal(n.onError,'continueErrorOutput');
    assert.equal(workflow.connections[n.name].main.length,2);
  }
});
test('a durable database claim gates all sends; no old local dedup drops callback failures',()=>{
  assert.equal(workflow.connections['Delivery enabled'].main[0][0].node,'Claim enquiry in database');
  assert.equal(workflow.connections['Claim enquiry in database'].main[0][0].node,'Restore enquiry after claim');
  assert.equal(workflow.connections['Restore enquiry after claim'].main[0][0].node,'Approved FAQ matched');
  assert.ok(!workflow.nodes.some(n=>n.name==='Remember attempted reference'));
  const node=workflow.nodes.find(n=>n.name==='Restore enquiry after claim');
  const result=vm.runInNewContext('(function(){'+node.parameters.jsCode+'})()',{$input:{all:()=>[{json:{allowed:false}},{json:{allowed:true}}]},$:()=>({itemMatching:index=>({json:{reference:'ref-'+index}})})});
  assert.equal(result.length,1);assert.equal(result[0].json.reference,'ref-1');assert.equal(result[0].pairedItem.item,1);
});
test('callbacks keep tokens in credential storage, use the original paired reference and allow idempotent result retry',()=>{
  for(const node of workflow.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest')){
    assert.equal(node.parameters.genericAuthType,'httpHeaderAuth');
    assert.ok(!node.parameters.headerParameters);
    assert.equal(node.parameters.options.timeout,15000);
    if(node.name.startsWith('Record')){
      assert.equal(node.retryOnFail,true);
      assert.ok(node.parameters.jsonBody.includes('Restore enquiry after claim'));
    }
  }
});
