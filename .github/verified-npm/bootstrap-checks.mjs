import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyArchive,verifyInstalled,dependencyTreeDigest} from './bootstrap.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const bytes=Buffer.from('official fixture bytes');
const item={name:'npm',version:'11.21.1',url:'https://registry.npmjs.org/npm/-/npm-11.21.1.tgz',integrity:'sha512-'+createHash('sha512').update(bytes).digest('base64')};
test('accepts exact locked official bytes',()=>assert.doesNotThrow(()=>verifyArchive(item,bytes)));
test('fails altered bytes before extraction',()=>assert.throws(()=>verifyArchive(item,Buffer.from('altered fixture bytes')),/integrity/));
test('fails an unapproved URL even with valid bytes',()=>assert.throws(()=>verifyArchive({...item,url:'http://registry.npmjs.org/npm/-/npm-11.21.1.tgz'},bytes),/metadata/));
test('fails a replaced version even with valid bytes',()=>assert.throws(()=>verifyArchive({...item,version:'11.21.2'},bytes),/metadata/));
test('fails an unsupported integrity algorithm',()=>assert.throws(()=>verifyArchive({...item,integrity:'sha256-abc'},bytes),/metadata/));

test('rejects altered dependency code while CLI and all version fields stay unchanged',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'security-npm-cache-test-'));
 try{
  for(const [name,version] of [['npm','11.21.1'],['ip-address','10.7.4'],['undici','6.29.1']]){
   await fs.mkdir(path.join(root,'node_modules',name),{recursive:true});
   await fs.writeFile(path.join(root,'node_modules',name,'package.json'),JSON.stringify({name,version}));
  }
  const cli=path.join(root,'node_modules/npm/bin/npm-cli.js');await fs.mkdir(path.dirname(cli));await fs.writeFile(cli,'// fixed fixture CLI');
  const module=path.join(root,'node_modules/npm/other.js');await fs.writeFile(module,'// reviewed dependency');
  const manifest={dependency_tree_sha256:await dependencyTreeDigest(root),npm_cli_sha256:createHash('sha256').update(await fs.readFile(cli)).digest('hex'),archives:[{name:'npm',version:'11.21.1'},{name:'ip-address',version:'10.7.4'},{name:'undici',version:'6.29.1'}],bundled_replacements:{'ip-address':{to:'10.7.4'},undici:{to:'6.29.1'}}};
  await assert.doesNotReject(()=>verifyInstalled(root,manifest));
  await fs.writeFile(module,'// tampered dependency, same package versions and CLI');
  await assert.rejects(()=>verifyInstalled(root,manifest),/dependency files/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
