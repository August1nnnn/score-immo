import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/presence.js';
const id = '11111111-1111-4111-8111-111111111111';
const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test' };
const payload = { session_id: id, path: '/blogs/guides/acheter?email=private', device_type: 'mobile' };
function request(body=payload, headers={}) { return new Request('https://score-immo.fr/api/presence', {method:'POST', headers: {'Origin':'https://score-immo.fr','Content-Type':'application/json',cookie:'si_cookie_consent=accepted', ...headers},body:JSON.stringify(body)}); }
test('presence endpoint sends sanitized source marketing RPC, opaque apikey only', async t => {
  const calls=[]; t.mock.method(globalThis,'fetch',async (url,options)=>{calls.push({url,options});return new Response(null,{status:204});});
  assert.equal((await onRequestPost({request:request(),env})).status,204);
  assert.equal(calls.length,1);assert.ok(calls[0].url.endsWith('/rpc/record_analytics_presence'));
  assert.deepEqual(JSON.parse(calls[0].options.body),{p_session_id:id,p_path:'/blogs/guides/acheter',p_device_type:'mobile',p_source:'marketing'});
  assert.equal(calls[0].options.headers.apikey,'sb_secret_test'); assert.equal(calls[0].options.headers.Authorization,undefined);
});
test('origin, content type, consent, identity injection and malformed payload never reach RPC', async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async()=>{calls.push(1);return new Response(null,{status:204});});
 for(const req of [request(payload,{Origin:'https://evil.test'}),request(payload,{Origin:''}),request(payload,{'Content-Type':'text/plain'}),request(payload,{cookie:'si_cookie_consent=rejected'}),request({...payload,user_id:'fake'}),request({...payload,session_id:'invalid'}),request({...payload,device_type:'phone'}),request({...payload,path:'/admin'}),request({...payload,path:'https://evil.test/'}),request(null)]){
   const res=await onRequestPost({request:req,env});assert.ok(res.status===204||res.status>=400);
 }
 assert.equal(calls.length,0);
});
test('RPC errors are observable failures without leaking upstream data or falling back to page views',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('private upstream error',{status:500}));
 const res=await onRequestPost({request:request(),env});assert.equal(res.status,502);assert.ok(!(await res.text()).includes('private'));
});
test('long public paths stay within the SQL RPC 240-character contract',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async(_url,options)=>{calls.push(JSON.parse(options.body));return new Response(null,{status:204});});
 const path='/blogs/guides/'+ 'a'.repeat(260);
 assert.equal((await onRequestPost({request:request({...payload,path}),env})).status,204);
 assert.equal(calls[0].p_path.length,240);
});
