import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {dirname,resolve,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const work=await mkdtemp(resolve(root,'.test-work-'));
const run=p=>spawnSync(process.execPath,[resolve(root,'har-timing-lite.mjs'),p],{encoding:'utf8',windowsHide:true,timeout:10000});
try{
 const sample=resolve(root,'examples/sample.har');const before=await readFile(sample);const result=run(sample);assert.equal(result.status,0);const summary=JSON.parse(result.stdout);assert.equal(summary.requests,3);assert.equal(summary.httpErrors,1);assert.equal(summary.medianDurationMs,650);assert.equal(summary.p95DurationMs,1800);assert.deepEqual(await readFile(sample),before);
 const marker='SYNTHETIC_PRIVATE_MARKER';
 const fixture={log:{version:'1.2',entries:[{request:{method:'GET',url:'https://synthetic.invalid/'+marker,headers:[{name:'Authorization',value:marker}]},response:{status:200,bodySize:-1,content:{mimeType:'text/plain',text:marker}},time:-1,timings:{wait:-1}}]}};
 const path=resolve(work,marker+'.har');await writeFile(path,JSON.stringify(fixture));const unknown=run(path);assert.equal(unknown.status,0);assert.equal(unknown.stdout.includes(marker),false);const s=JSON.parse(unknown.stdout);assert.equal(s.unknownDurations,1);assert.equal(s.medianDurationMs,null);assert.equal(s.unknownBodySizes,1);
 await writeFile(path,'invalid '+marker);const invalid=run(path);assert.equal(invalid.status,2);assert.equal((invalid.stdout+invalid.stderr).includes(marker),false);
 console.log('PASS: synthetic output, source preservation, unknown measurements and no input text in results/errors.');
}finally{assert.equal(dirname(resolve(work)),root);assert.ok(basename(work).startsWith('.test-work-'));await rm(work,{recursive:true,force:true});}
