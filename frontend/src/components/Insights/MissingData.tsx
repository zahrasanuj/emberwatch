import React, {useEffect, useState} from 'react';
import {useStore} from '../../store/useStore';
export function MissingData({region='world', message='Verified historical coverage is not ingested yet.'}:{region?:string;message?:string}) {
 const bbox=useStore(s=>s.customBbox); const [job,setJob]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{if(!job?.job_id || job.status!=='running')return; const timer=setInterval(async()=>{try {const r=await fetch(`/api/ingest?job_id=${encodeURIComponent(job.job_id)}`); const next=await r.json(); setJob({...next,job_id:job.job_id});}catch{setError('Unable to read ingest progress.');}},2000); return()=>clearInterval(timer);},[job]);
 async function ingest(){setError('');try{const r=await fetch('/api/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({region,bbox:region==='world'?null:bbox})});const j=await r.json();if(!r.ok)throw Error(j.detail);setJob(j);}catch(e){setError(String(e));}}
 return <div className="missing-data"><strong>Not ingested yet</strong><p>{message}</p><progress aria-label="Ingestion progress" max={100} value={job?.progress||0}/><button onClick={ingest} disabled={job?.status==='running'}>{job?.status==='running'?'Ingesting…':'Ingest this area'}</button><p role="status">{error||job?.message||(job?.status==='complete'?`${job.records.toLocaleString()} records ingested. Refresh to view observations.`:'')}</p></div>;
}
