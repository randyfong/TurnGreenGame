import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {MCPGateway} from '../server/mcp';
import {SessionStore} from '../server/sessions';
import {FileSessions} from '../server/persistence';
const directory=mkdtempSync(path.join(tmpdir(),'village-live-'));let gateway=new MCPGateway();
try{
 let store=new SessionStore(gateway,new FileSessions(directory));const s=store.create('riverside_valley');await store.baseline(s.id,{q1_canopy_flooding:5,q2_pavement_heat:5});
 for(let year=1;year<=5;year++)await store.turn(s.id,{year,request_id:'live-recovery-'+year,policy:'urban_canopy_trees',quantity:1});
 await gateway.close();gateway=new MCPGateway();store=new SessionStore(gateway,new FileSessions(directory));
 const end=await store.post(s.id,{q1_canopy_flooding:5,q2_pavement_heat:5});assert.equal(end.assessment_result?.learning_gain.gain_type,'ceiling_effect');
 await gateway.close();gateway=new MCPGateway();store=new SessionStore(gateway,new FileSessions(directory));assert.deepEqual(store.get(s.id),end);
 console.log('PASS: five live turns, gateway/store restart, baseline recovery, ceiling result, persisted post-assessment.');
}finally{await gateway.close();rmSync(directory,{recursive:true,force:true});}
