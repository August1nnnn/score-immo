// Official npm CLI with two integrity-locked, official patch dependencies.
// npm overrides do not replace bundled dependencies; the explicit overlay below does.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import tls from 'node:tls';
import {createHash, X509Certificate, randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const compromised=new Set(['7dd78d5f4f13459a83dff9abbba62edbaf6f2d102bf257fd712f4d9f2746ed8d','f2edaaff3d9b701fb4d14c9f285f8c0bad90fc3bcc1fa07d47f4718edaba34a5','d7a7a0fb5d7e2731d771e9484ebcdef71d5f0c3e0a2948782bc83ee0ea699ef4','86a1ecba089c4a8d3bbe2734c612ba341d813e043cf9e8a862cd5c57a36bbe6b']);
const digest=(bytes,algorithm='sha256',encoding='hex')=>createHash(algorithm).update(bytes).digest(encoding);

export function verifyArchive(item,bytes){
 const expected=`https://registry.npmjs.org/${item.name}/-/${item.name}-${item.version}.tgz`;
 if(item.url!==expected||!/^sha512-[A-Za-z0-9+/]+=*$/.test(item.integrity))throw Error('Invalid locked archive metadata');
 if(bytes.length>32*1024*1024||'sha512-'+digest(bytes,'sha512','base64')!==item.integrity)throw Error('Archive integrity verification failed');
}

function request(url,{method='GET',body,maxBytes=32*1024*1024}={}){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||!['registry.npmjs.org','api.osv.dev'].includes(parsed.hostname)||parsed.port||parsed.username||parsed.password)throw Error('Unapproved HTTPS destination');
 return new Promise((resolve,reject)=>{
  const req=https.request(url,{method,headers:{'User-Agent':'verified-security-npm-toolchain/1',...(body?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}:{})}},res=>{
   if(res.statusCode!==200){res.resume();reject(Error('HTTPS request failed: '+res.statusCode));return;}
   const chunks=[];let size=0;
   res.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){req.destroy(Error('HTTPS response exceeds size limit'));return;}chunks.push(chunk);});
   res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject);
  });
  req.setTimeout(45000,()=>req.destroy(Error('HTTPS request timeout')));req.on('error',reject);if(body)req.write(body);req.end();
 });
}

async function packageJson(directory){return JSON.parse(await fs.readFile(path.join(directory,'package.json'),'utf8'));}

async function writeAtomic(file,content,mode=0o600){
 const temporary=path.join(path.dirname(file),'.verified-write-'+randomUUID());
 try{await fs.writeFile(temporary,content,{mode,flag:'wx'});await fs.rename(temporary,file);}
 finally{await fs.rm(temporary,{force:true});}
}

export async function dependencyTreeDigest(root){
 const entries=[],base=path.join(root,'node_modules');
 async function walk(directory){
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
   const file=path.join(directory,entry.name),relative=path.relative(base,file).split(path.sep).join('/');
   if(entry.isDirectory())await walk(file);
   else if(entry.isSymbolicLink())entries.push(JSON.stringify([relative,'link',await fs.readlink(file)]));
   else if(entry.isFile())entries.push(JSON.stringify([relative,'file',digest(await fs.readFile(file))]));
   else throw Error('Unexpected filesystem entry in toolchain');
  }
 }
 await walk(base);return digest(entries.sort().join('\n')+'\n');
}

export async function verifyInstalled(root,manifest){
 root=await fs.realpath(root);
 if(!/^[a-f0-9]{64}$/.test(manifest.dependency_tree_sha256)||await dependencyTreeDigest(root)!==manifest.dependency_tree_sha256)throw Error('Unexpected npm dependency files');
 const npm=path.join(root,'node_modules/npm'),cli=path.join(npm,'bin/npm-cli.js');
 if(digest(await fs.readFile(cli))!==manifest.npm_cli_sha256)throw Error('Unexpected npm CLI source');
 for(const item of manifest.archives){
  if((await packageJson(path.join(root,'node_modules',item.name))).version!==item.version)throw Error('Wrong installed tool version');
 }
 const require=createRequire(path.join(npm,'package.json'));
 for(const [name,versions] of Object.entries(manifest.bundled_replacements)){
  const resolved=require.resolve(name+'/package.json');
  if(resolved!==path.join(root,'node_modules',name,'package.json')||require(name+'/package.json').version!==versions.to)throw Error('Bundled dependency overlay is not effective');
 }
 return cli;
}

async function auditInstalled(root){
 const packages=new Map();
 async function walk(directory){
  const entries=await fs.readdir(directory,{withFileTypes:true});
  if(entries.some(e=>e.name==='package.json'&&e.isFile())){
   const p=await packageJson(directory);if(p.name&&p.version)packages.set(p.name+'@'+p.version,{package:{name:p.name,ecosystem:'npm'},version:p.version});
  }
  for(const entry of entries)if(entry.isDirectory()&&entry.name!=='.bin')await walk(path.join(directory,entry.name));
 }
 await walk(path.join(root,'node_modules'));
 if(packages.size!==144)throw Error('Unexpected physical npm dependency inventory');
 const items=[...packages.values()];let controlFound=false;
 for(let i=0;i<items.length;i+=99){
  const part=items.slice(i,i+99),control={package:{name:'@capacitor/ios',ecosystem:'npm'},version:'8.1.0'};
  const data=JSON.parse((await request('https://api.osv.dev/v1/querybatch',{method:'POST',body:JSON.stringify({queries:[...part,control]}),maxBytes:4*1024*1024})).toString());
  if(!Array.isArray(data.results)||data.results.length!==part.length+1)throw Error('Invalid advisory response');
  if(data.results.slice(0,-1).some(r=>!r||r.error||r.vulns?.length))throw Error('npm toolchain has unresolved advisory findings');
  controlFound=controlFound||Boolean(data.results.at(-1)?.vulns?.some(v=>v.id==='GHSA-rvm3-566m-v7fv'));
 }
 if(!controlFound)throw Error('Known vulnerable advisory control did not match');
 return {package_versions:packages.size,findings:0,positive_control:true};
}

export async function main(){
 const [major,minor,patch]=process.versions.node.split('.').map(Number);
 if(!((major===22&&(minor>23||minor===23&&patch>=4))||(major===24&&(minor>22||minor===22&&patch>=1))))throw Error('Use the security-patched Node22.23.4+ or Node24.22.1+ release line');
 if(process.env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('TLS verification must remain enabled');
 if(tls.getCACertificates('default').some(pem=>compromised.has(digest(new X509Certificate(pem).raw))))throw Error('Compromised certificate root remains in effective Node trust');
 const raw=await fs.readFile(path.join(here,'archives.json')),manifest=JSON.parse(raw);
 if(manifest.schema!==1||JSON.stringify(manifest.archives.map(x=>x.name))!==JSON.stringify(['npm','ip-address','undici']))throw Error('Invalid toolchain manifest');
 // A fresh private runner temporary directory avoids dirtying a source checkout
 // or sharing writable executable caches between unrelated jobs.
 const cacheParent=process.env.SECURITY_NPM_CACHE?path.resolve(process.env.SECURITY_NPM_CACHE):await fs.mkdtemp(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'.verified-npm-'));
 await fs.mkdir(cacheParent,{recursive:true,mode:0o700});
 const parentStat=await fs.lstat(cacheParent);
 if(!parentStat.isDirectory()||parentStat.isSymbolicLink()||parentStat.uid!==process.getuid()||(parentStat.mode&0o022))throw Error('Toolchain cache must be an owned directory without shared write access');
 const target=path.join(cacheParent,'security-npm-'+digest(raw).slice(0,16));
 try{await fs.access(target);}catch{
  const stage=await fs.mkdtemp(path.join(cacheParent,'.security-npm-stage-'));
  try{
   for(const item of manifest.archives){
    const archive=await request(item.url);verifyArchive(item,archive);
    const file=path.join(stage,item.name+'.tgz'),destination=path.join(stage,'node_modules',item.name);
    await fs.writeFile(file,archive);await fs.mkdir(destination,{recursive:true});
    // These exact official archives were reviewed and SHA512-locked before extraction.
    const result=spawnSync('tar',['-xzf',file,'-C',destination,'--strip-components=1'],{encoding:'utf8'});
    if(result.status!==0)throw Error('Cannot extract verified official archive');
    await fs.unlink(file);
   }
   for(const [name,versions] of Object.entries(manifest.bundled_replacements)){
    const bundled=path.join(stage,'node_modules/npm/node_modules',name);
    if((await packageJson(bundled)).version!==versions.from)throw Error('Unexpected bundled version');
    await fs.rm(bundled,{recursive:true});
   }
   await verifyInstalled(stage,manifest);await fs.writeFile(path.join(stage,'manifest.sha256'),digest(raw)+'\n');await fs.rename(stage,target);
  }finally{await fs.rm(stage,{recursive:true,force:true});}
 }
 const targetStat=await fs.lstat(target);
 if(!targetStat.isDirectory()||targetStat.isSymbolicLink()||targetStat.uid!==process.getuid()||(targetStat.mode&0o022))throw Error('Untrusted toolchain cache directory');
 if((await fs.readFile(path.join(target,'manifest.sha256'),'utf8')).trim()!==digest(raw))throw Error('Unrecognized existing toolchain cache');
 const cli=await verifyInstalled(target,manifest),audit=await auditInstalled(target),bin=path.join(target,'bin');await fs.mkdir(bin,{recursive:true});
 if(!(await fs.lstat(bin)).isDirectory()||(await fs.lstat(bin)).isSymbolicLink())throw Error('Untrusted toolchain bin directory');
 for(const command of ['npm','npx']){
  const entry=path.join(target,'node_modules/npm/bin',command+'-cli.js');
  const source='#!/usr/bin/env node\nconst r=require("node:child_process").spawnSync(process.execPath,['+JSON.stringify(entry)+',...process.argv.slice(2)],{stdio:"inherit",env:process.env});if(r.error)throw r.error;process.exit(r.status??1);\n';
  await writeAtomic(path.join(bin,command),source,0o755);
 }
 if(process.env.GITHUB_PATH)await fs.appendFile(process.env.GITHUB_PATH,bin+'\n');
 const report={at:new Date().toISOString(),node:process.versions.node,npm:'11.21.1',overlay:{'ip-address':'10.7.4',undici:'6.29.1'},manifest_sha256:digest(raw),cli_sha256:digest(await fs.readFile(cli)),audit,bin};
 await writeAtomic(path.join(target,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));return report;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
