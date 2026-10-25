import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {MCPGateway} from '../server/mcp';
import {SessionStore} from '../server/sessions';
import {rules,type Policy} from '../shared/types';
const gateway=new MCPGateway(), store=new SessionStore(gateway);const records:unknown[]=[];
try {
 for(const profile of rules.profiles){
  const s=store.create(profile.id);await store.baseline(s.id,{q1_canopy_flooding:2,q2_pavement_heat:2});
  const sequence:[Policy,number][]=[['urban_canopy_trees',1],['bioswales',1],['cool_roofs',1],['bioswales',3],['cool_roofs',6]];
  for(let i=0;i<5;i++){const [policy,quantity]=sequence[i];const result=await store.turn(s.id,{year:i+1,request_id:`live-${i}`,policy,quantity});const committed=result.history.at(-1)!;assert.ok(committed.dry_season);assert.ok(committed.dry_season.vegetation_lost_ha>0);assert.deepEqual(result.engine.baseline_land_cover,profile.land_cover);records.push({profile:profile.id,year:i+1,turn:committed});console.log(`PASS ${profile.id} year ${i+1}: ${policy} × ${quantity}`);}
  assert.equal(store.get(s.id).phase,'complete');
 }
 await mkdir('validation',{recursive:true});await writeFile(process.env.VALIDATION_OUTPUT??'validation/foundation-live.json',JSON.stringify({captured_at:new Date().toISOString(),scope:'Real local MCP bridge, dryland-v1 scenarios, two synthetic remote villages, annual land-loss and restoration chains',records},null,2));
}finally{await gateway.close();}
