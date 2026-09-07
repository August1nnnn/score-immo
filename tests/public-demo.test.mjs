import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import test from 'node:test';
test('public full demo is static and linked from product documents',()=>{
 assert.ok(existsSync('src/pages/exemple-rapport.astro'));
 for(const file of ['src/pages/methodologie.astro','src/pages/pages/tarifs.astro','public/llms.txt']) assert.match(readFileSync(file,'utf8'),/exemple-rapport/);
});
test('demo artifact identifies fiction and contains no customer report access',()=>{
 const artifact=JSON.parse(readFileSync('src/data/public-demo.json','utf8'));
 assert.equal(artifact.report.id,'demo');assert.equal(artifact.report.isDemo,true);
 assert.match(artifact.sourceHash,/^[a-f0-9]{64}$/);
 assert.ok(artifact.neighborhood.length>0);
});
import {execFileSync} from 'node:child_process';
test('versioned demo snapshot and rendered artifact cannot drift',()=>{
 assert.match(execFileSync(process.execPath,['scripts/sync-public-demo.mjs','--check'],{encoding:'utf8'}),/verified/);
});
test('public page discloses fiction and excludes private APIs and script hydration',()=>{
 const page=readFileSync('src/pages/exemple-rapport.astro','utf8');
 assert.match(page,/Démo entièrement fictive/);assert.match(page,/Aucun achat/);
 assert.ok(!/supabase|report_id|client:load|set:html|fetch\(/.test(page));
 assert.match(page,/BaseLayout/);assert.match(page,/application\/ld\+json|jsonLd/);
});
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('synchronizer rejects a non-demo fixture without changing the public artifact',()=>{
 const before=readFileSync('src/data/public-demo.json','utf8');
 const temporary=mkdtempSync(join(tmpdir(),'scoreimmo-demo-'));
 try {
  const directory=join(temporary,'src/data');mkdirSync(directory,{recursive:true});
  const source=join(directory,'demoReport.ts');
  writeFileSync(source,"export const demoReport={id:'private',isDemo:false}; export const demoNeighborhood=[];");
  const result=spawnSync(process.execPath,['scripts/sync-public-demo.mjs','--write',source],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/Refusing non-demo/);
  assert.equal(readFileSync('src/data/public-demo.json','utf8'),before);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});
