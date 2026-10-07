#!/usr/bin/env node
import {readFile,stat} from 'node:fs/promises';
const METHODS = new Set(['GET','HEAD','POST','PUT','DELETE','CONNECT','OPTIONS','TRACE','PATCH']);
const MAX_DURATION = 86400000;
const VERSION = '1.0.0';
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const measure = (v, max=Number.MAX_SAFE_INTEGER) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v*100)/100 : null;
const countBytes = v => Number.isSafeInteger(v) && v >= 0 ? v : null;
const mean = xs => xs.length ? Math.round(xs.reduce((a,b)=>a+b,0)/xs.length*100)/100 : null;
function percentile(xs, p) {
  if (!xs.length) return null;
  const sorted=[...xs].sort((a,b)=>a-b);
  return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];
}
function mimeKind(v) {
  if (typeof v !== 'string') return 'unknown';
  const m=v.toLowerCase().split(';')[0].trim();
  if (m==='text/html') return 'html';
  if (m==='text/css') return 'css';
  if (['application/javascript','text/javascript','application/x-javascript'].includes(m)) return 'javascript';
  if (m==='application/json' || /^application\/[a-z0-9.+-]+\+json$/.test(m)) return 'json';
  if (/^image\/[a-z0-9.+-]+$/.test(m)) return 'image';
  if (/^(audio|video)\/[a-z0-9.+-]+$/.test(m)) return 'media';
  if (/^font\/[a-z0-9.+-]+$/.test(m)) return 'font';
  return 'other';
}
function analyze(har) {
  if (!object(har)||!object(har.log)||har.log.version!=='1.2'||!Array.isArray(har.log.entries)) throw new Error('Expected HAR 1.2 with a log.entries array.');
  if (har.log.entries.length>100000) throw new Error('Maximum 100,000 entries per capture.');
  const entries=har.log.entries.map((e,i)=>{
    if (!object(e)||!object(e.request)||!object(e.response)) throw new Error('Every entry requires request and response objects.');
    const times={};
    for (const key of ['blocked','dns','connect','send','wait','receive','ssl']) times[key]=measure(e.timings?.[key],MAX_DURATION);
    return {
      id:'R'+String(i+1).padStart(6,'0'),
      method:METHODS.has(e.request.method)?e.request.method:'OTHER',
      status:Number.isInteger(e.response.status)&&(e.response.status===0 || e.response.status>=100&&e.response.status<=599)?e.response.status:null,
      kind:mimeKind(e.response.content?.mimeType),
      durationMs:measure(e.time,MAX_DURATION),
      responseBodyBytes:countBytes(e.response.bodySize),
      decodedBodyBytes:countBytes(e.response.content?.size),
      timingsMs:times
    };
  });
  const durations=entries.map(e=>e.durationMs).filter(v=>v!==null);
  const waits=entries.map(e=>e.timingsMs.wait).filter(v=>v!==null);
  const body=entries.map(e=>e.responseBodyBytes).filter(v=>v!==null);
  const summary={
    requests:entries.length,
    measuredDurations:durations.length,
    unknownDurations:entries.length-durations.length,
    httpErrors:entries.filter(e=>e.status!==null&&e.status>=400).length,
    zeroStatus:entries.filter(e=>e.status===0).length,
    unknownStatuses:entries.filter(e=>e.status===null).length,
    medianDurationMs:percentile(durations,0.5),
    p95DurationMs:percentile(durations,0.95),
    meanDurationMs:mean(durations),
    p95WaitMs:percentile(waits,0.95),
    slowRequests:durations.filter(v=>v>1000).length,
    knownResponseBodyBytes:body.reduce((a,b)=>a+b,0),
    measuredBodySizes:body.length,
    unknownBodySizes:entries.length-body.length
  };
  return {schema:'har-timing-brief/1',version:VERSION,summary,entries};
}

async function main(){
  const args=process.argv.slice(2);
  if(args.length===1&&args[0]==='--help'){console.log('HAR Timing Brief Lite: node har-timing-lite.mjs capture.har\nSingle-capture JSON summary. Offline, no uploads. Node.js 20+.');return;}
  if(args.length!==1)throw new Error();
  const s=await stat(args[0]);if(!s.isFile()||s.size>32*1024*1024)throw new Error();
  const input=JSON.parse((await readFile(args[0],'utf8')).replace(/^\uFEFF/,''));
  console.log(JSON.stringify(analyze(input).summary,null,2));
}
main().catch(()=>{console.error('Cannot analyze input. Supply one readable HAR 1.2 file, up to 32 MiB and 100,000 entries. Input contents and paths are not printed.');process.exitCode=2;});

