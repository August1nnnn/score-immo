import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source=readFileSync(new URL('../public/presence.js',import.meta.url),'utf8');
function setup({accepted=true,visible=true,path='/blogs/guides/acheter',storageBlocked=false}={}){
 const intervals=new Map(),timeouts=new Map(),events=new Map(),calls=[];let n=0,listener;
 const doc={visibilityState:visible?'visible':'hidden',addEventListener:(name,fn)=>events.set(name,fn)};
 const consent={getStatus:()=>accepted?'accepted':'rejected',onChange:fn=>{listener=fn;return()=>{};}};
 const storage=new Map();
 const win={ScoreImmoConsent:consent,addEventListener:(name,fn)=>events.set(name,fn)};
 vm.runInNewContext(source,{window:win,document:doc,location:{pathname:path},navigator:{userAgent:'Mozilla/5.0 (iPhone)',maxTouchPoints:1},sessionStorage:{getItem:k=>{if(storageBlocked)throw Error();return storage.get(k);},setItem:(k,v)=>storage.set(k,v)},crypto:{randomUUID:()=> '11111111-1111-4111-8111-111111111111'},AbortController,fetch:async (url,options)=>{calls.push({url,options});return{};},setInterval:(fn,ms)=>{intervals.set(++n,{fn,ms});return n;},clearInterval:id=>intervals.delete(id),setTimeout:(fn,ms)=>{timeouts.set(++n,{fn,ms});return n;},clearTimeout:id=>timeouts.delete(id)});
 return {calls,intervals,timeouts,storage,async tick(){for(const {fn}of intervals.values())fn();await new Promise(r=>setImmediate(r));},async settle(){await new Promise(r=>setImmediate(r));},hide(){doc.visibilityState='hidden';events.get('visibilitychange')();},show(){doc.visibilityState='visible';events.get('visibilitychange')();},consent(value){accepted=value;listener();},leave(){events.get('pagehide')();},restore(){events.get('pageshow')({persisted:true});}};
}
test('visible consented visitor gets immediate and 30-second presence only',async()=>{
 const s=setup();await s.settle();assert.equal(s.calls.length,1);assert.equal([...s.intervals.values()][0].ms,30000);
 await s.tick();assert.equal(s.calls.length,2);assert.equal(s.calls[0].url,'/api/presence');
 assert.deepEqual(JSON.parse(s.calls[0].options.body),{session_id:'11111111-1111-4111-8111-111111111111',path:'/blogs/guides/acheter',device_type:'mobile'});
});
test('hidden and refused consent stop intervals; visibility and acceptance restart',async()=>{
 const s=setup({accepted:false});await s.settle();assert.equal(s.calls.length,0);assert.equal(s.storage.size,0);
 s.consent(true);await s.settle();assert.equal(s.calls.length,1);
 s.hide();assert.equal(s.intervals.size,0);await s.tick();assert.equal(s.calls.length,1);
 s.show();await s.settle();assert.equal(s.calls.length,2);
 s.consent(false);assert.equal(s.intervals.size,0);await s.tick();assert.equal(s.calls.length,2);
});
test('pagehide aborts pending presence, clears timers and bfcache restore resumes',async()=>{
 const s=setup();s.leave();assert.equal(s.calls[0].options.signal.aborted,true);assert.equal(s.intervals.size,0);assert.equal(s.timeouts.size,0);
 await s.settle();s.restore();await s.settle();assert.equal(s.calls.length,2);
});
test('admin routes, blocked storage and initial hidden state do not send',async()=>{
 for(const options of [{path:'/admin/users'},{storageBlocked:true},{visible:false}]){const s=setup(options);await s.settle();assert.equal(s.calls.length,0);}
});
