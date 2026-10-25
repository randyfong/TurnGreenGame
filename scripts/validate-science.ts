import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {scienceTopics,turnEvidence,type ScienceTopic} from '../shared/science';
import type {Session} from '../shared/types';
const base=process.env.VALIDATION_BASE_URL??'http://127.0.0.1:5173';
const records:unknown[]=[];
for(const topic of Object.keys(scienceTopics) as ScienceTopic[]){const response=await fetch(`${base}/api/science?topic=${topic}`);assert.equal(response.status,200,topic);const data=await response.json();assert.equal(data.topic_id,topic);if(scienceTopics[topic].source==='model')assert.ok(data.citations.length>0);records.push(data);console.log(`PASS ${topic}: ${data.citations.length} sources`);}
const invalid=await fetch(`${base}/api/science?topic=not_a_topic`);assert.equal(invalid.status,400);
const post=async(path:string,body:unknown)=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);return r.json();};
const s:Session=await post('/api/sessions',{profile_id:'crowded_market'});
await post(`/api/sessions/${s.id}/baseline`,{q1_canopy_flooding:2,q2_pavement_heat:2});
const committed:Session=await post(`/api/sessions/${s.id}/turn`,{year:1,request_id:'science-evidence-check',policy:'urban_canopy_trees',quantity:2});
const evidence=turnEvidence('invest_flood_risk',committed,1);assert.ok(evidence.some(row=>row.label==='Original village runoff (mm)'));assert.deepEqual(turnEvidence('invest_flood_risk',committed,0),[]);
await writeFile('validation/science-live.json',JSON.stringify({captured_at:new Date().toISOString(),references:records,example_turn:committed.history[0],evidence},null,2));
console.log('PASS unknown topic rejection and exact committed-turn evidence.');
