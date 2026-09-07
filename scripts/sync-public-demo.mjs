import {readFile, writeFile, copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const snapshot=resolve(root,'scripts/fixtures/demoReport.ts');
const output=resolve(root,'src/data/public-demo.json');
const [mode,source]=process.argv.slice(2);
const hash=(s)=>createHash('sha256').update(s).digest('hex');
if (!['--write','--check','--check-source'].includes(mode)) throw new Error('Use --write APP/src/data/demoReport.ts, --check, or --check-source APP/src/data/demoReport.ts');
const sourcePath=mode==='--write'?resolve(source??''):snapshot;
if(mode==='--write' && (!source || !sourcePath.endsWith('/src/data/demoReport.ts'))) throw new Error('Only the explicit public demo fixture may be synchronized');
const raw=await readFile(sourcePath,'utf8');
const module=await import(pathToFileURL(sourcePath).href);
const {demoReport:report,demoNeighborhood:neighborhood,demoMatch:match}=module;
if(report?.id!=='demo' || report?.isDemo!==true || !Array.isArray(report.sectionScores) || !Array.isArray(neighborhood)) throw new Error('Refusing non-demo or invalid source');
const serialized=JSON.stringify({schemaVersion:1,source:'Score-Immo/scoreimmo/src/data/demoReport.ts',sourceHash:hash(raw),report,neighborhood,match},null,2)+'\n';
if(mode==='--write') {await copyFile(sourcePath,snapshot);await writeFile(output,serialized);}
else {
 if(await readFile(output,'utf8')!==serialized) throw new Error('Public demo artifact drift: regenerate from the app fixture');
 if(mode==='--check-source' && hash(await readFile(resolve(source),'utf8'))!==hash(raw)) throw new Error('App demo changed: regenerate and review the public artifact');
}
console.log('Public demo schema and source synchronization verified');
