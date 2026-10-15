import { describe, expect, it } from 'vitest';
import { validateAutomationEvent } from '../../supabase/functions/_shared/contact-automation';
const reference = 'a507a3c5-056b-48ee-8c38-67fefe8ba320';
const begin = { action: 'begin', reference, attemptId: reference, route: 'admin', visitorEmail: 'visitor@example.com' };
describe('automation callback validation', () => {
  it('accepts a begin claim and a provider-confirmed completion', () => {
    expect(validateAutomationEvent(begin).action).toBe('begin');
    expect(validateAutomationEvent({action:'finish',reference,attemptId:reference,outcome:'sent',providerMessageId:'abc123'}).action).toBe('finish');
  });
  it.each([null, [], {...begin,reference:'bad'}, {...begin,route:'send-any-email'}, {...begin,visitorEmail:'x\r\nBcc: other@example.com'},
    {action:'finish',reference,attemptId:reference,outcome:'sent'}, {action:'finish',reference,attemptId:reference,outcome:'delivered'},
    {action:'finish',reference,attemptId:reference,outcome:'sent',providerMessageId:'a\nb'}])('rejects invalid/unverifiable events: %j', value => {
    expect(()=>validateAutomationEvent(value)).toThrow();
  });
  it('accepts uncertainty without inventing a provider message id',()=>{
    expect(validateAutomationEvent({action:'finish',reference,attemptId:reference,outcome:'uncertain'})).toMatchObject({outcome:'uncertain'});
  });
});
