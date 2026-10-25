import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {FileSessions} from '../server/persistence';
import {SessionStore} from '../server/sessions';
import type {ToolGateway,EngineState,Assessment} from '../shared/types';
const pre={q1_canopy_flooding:5,q2_pavement_heat:3},post={q1_canopy_flooding:4,q2_pavement_heat:2};
test('disk recovery survives new stores, retries an uncertain turn once, and preserves assessment results',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'village-'));let calls=0,assessmentCalls=0,fail=false;
 const gateway:ToolGateway={close:async()=>{},call:async(server,_name,a)=>{
  if(server==='assessment'){assessmentCalls++;if(fail)throw Error('Assessment offline');if(a.turn===0)return {status:'recorded'};assert.deepEqual(a.prior_assessment,pre);const answers=a.responses as Assessment;return {status:'completed',turn:5,session_id:a.session_id,learning_gain:{average_normalized_gain:-.5,gain_type:'standard',question_breakdown:Object.keys(pre).map(key=>{const k=key as keyof Assessment;return {question_id:k,pre_score:pre[k],post_score:answers[k],raw_delta:answers[k]-pre[k],normalized_gain:-.5};})}};}
  calls++;const state=a.current_state as EngineState;return {turn:a.turn,intervention:{id:a.intervention_id,budget_allocated:a.budget_allocated,area_converted_hectares:1},next_state:{...state,remaining_budget:state.remaining_budget-Number(a.budget_allocated)},player_metrics:{community_cheer_score:50},science_payload:{invest_urban_cooling:{surface_temp_drop_celsius:0},invest_urban_flood:{baseline_runoff_mm:20,post_runoff_mm:21,stormwater_retained_m3:0,incremental_runoff_reduction_m3:0}}};
 }};
 try{let store=new SessionStore(gateway,new FileSessions(dir));const s=store.create('crowded_market');await store.baseline(s.id,pre);await assert.rejects(store.post(s.id,post));
  for(let year=1;year<=5;year++){const input={year,request_id:'recover-'+year,policy:'urban_canopy_trees' as const,quantity:1};await store.turn(s.id,input);store=new SessionStore(gateway,new FileSessions(dir));await store.turn(s.id,input);}
  assert.equal(calls,5);const before=store.get(s.id);fail=true;await assert.rejects(store.post(s.id,post));assert.deepEqual(store.get(s.id),before);fail=false;
  await assert.rejects(store.post(s.id,{...post,q1_canopy_flooding:0}));const saved=await store.post(s.id,post);store=new SessionStore(gateway,new FileSessions(dir));assert.deepEqual(store.get(s.id),saved);const count=assessmentCalls;await store.post(s.id,post);assert.equal(assessmentCalls,count);await assert.rejects(store.post(s.id,pre));assert.equal(saved.assessment_result!.learning_gain.average_normalized_gain,-.5);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('corrupt saves are preserved and cannot silently create a new game',()=>{const dir=mkdtempSync(path.join(tmpdir(),'village-'));try{const id='a'.repeat(36);writeFileSync(path.join(dir,id+'.json'),'broken');assert.throws(()=>new FileSessions(dir).load(id),/unreadable/);assert.throws(()=>new FileSessions(dir).load('../invalid'));}finally{rmSync(dir,{recursive:true,force:true});}});
test('failed save never publishes an unpersisted session',()=>{const gateway:ToolGateway={call:async()=>({}),close:async()=>{}};let id='';const store=new SessionStore(gateway,{load:()=>undefined,save:s=>{id=s.id;throw Error('Disk full');}});assert.throws(()=>store.create('crowded_market'),/Disk full/);assert.throws(()=>store.get(id),/not found/);});
