import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {readdirSync,readFileSync} from 'node:fs';
import {MCPGateway} from '../server/mcp';
import {SessionStore} from '../server/sessions';
import {FileSessions} from '../server/persistence';
import {rules,type Policy} from '../shared/types';
const dir=mkdtempSync(path.join(tmpdir(),'village-release-'));let gateway=new MCPGateway();let store=new SessionStore(gateway,new FileSessions(dir));const results:unknown[]=[];
try{
 for(const profile of rules.profiles){
  const s=store.create(profile.id);await assert.rejects(store.resolution(s.id,{author_name:'QA',district_name:profile.label}));
  await store.baseline(s.id,{q1_canopy_flooding:2,q2_pavement_heat:3});
  const sequence:[Policy,number][]=[['urban_canopy_trees',4],['bioswales',3],['cool_roofs',6],['bioswales',1],['urban_canopy_trees',1]];
  for(let i=0;i<5;i++){
   const input={year:i+1,request_id:`release-${i}`,policy:sequence[i][0],quantity:sequence[i][1]};
   const committed=await store.turn(s.id,input);assert.equal(committed.history.length,i+1);assert.equal(committed.engine.remaining_budget,5000-committed.history.reduce((n,t)=>n+t.spend_coins*10,0));
   if(i===2){await gateway.close();gateway=new MCPGateway();store=new SessionStore(gateway,new FileSessions(dir));}
   assert.deepEqual(await store.turn(s.id,input),committed);
  }
  await store.post(s.id,{q1_canopy_flooding:1,q2_pavement_heat:4});
  const complete=await store.resolution(s.id,{author_name:'Release tester',district_name:profile.label,organization_or_school:'Village learning group'});
  assert.equal(complete.history.length,5);assert.ok(complete.resolution);assert.equal(complete.resolution.metrics.total_budget_spent,3350);assert.equal(complete.engine.remaining_budget,1650);
  await gateway.close();gateway=new MCPGateway();store=new SessionStore(gateway,new FileSessions(dir));assert.deepEqual(store.get(s.id),complete);results.push({profile:profile.id,years:5,spent_coins:335,restored:true,resolution:complete.resolution});
 }
 // Roof-only path keeps zero ground work separate from real roof treatments.
 const roof=store.create(rules.profiles[0].id);await store.baseline(roof.id,{q1_canopy_flooding:5,q2_pavement_heat:5});for(let year=1;year<=5;year++)await store.turn(roof.id,{year,request_id:'roof-'+year,policy:'cool_roofs',quantity:1});await store.post(roof.id,{q1_canopy_flooding:5,q2_pavement_heat:5});const r=await store.resolution(roof.id,{author_name:'Roof tester',district_name:'Roof village'});assert.equal(r.resolution!.metrics.total_ground_interventions_ha,0);assert.equal(r.resolution!.metrics.ground_depaved_ha,0);results.push({profile:'roof-only edge case',metrics:r.resolution!.metrics});
 const assets=readdirSync('dist/assets').filter(f=>/\.(js|css)$/.test(f)).map(f=>({file:f,bytes:readFileSync('dist/assets/'+f).length,gzip_bytes:gzipSync(readFileSync('dist/assets/'+f)).length}));const compressed=assets.reduce((n,a)=>n+a.gzip_bytes,0);assert.ok(compressed<500_000);
 writeFileSync('validation/release-live.json',JSON.stringify({captured_at:new Date().toISOString(),results,assets,compressed_bytes:compressed,network:'Local loopback; no throttled load-time claim'},null,2));console.log('PASS: both profiles, 15 live turns, retries, process restart recovery, final ratings, 3 resolutions, and asset budget.',compressed,'gzip bytes');
}finally{await gateway.close();rmSync(dir,{recursive:true,force:true});}
