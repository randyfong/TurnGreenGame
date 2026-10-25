import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {FileSessions,migrateSession} from '../server/persistence';
import {SessionStore} from '../server/sessions';
import type {Session,Turn,ToolGateway} from '../shared/types';
function legacy():Session{
 const store=new SessionStore({close:async()=>{},call:async()=>({})});
 const s=store.create('crowded_market');
 s.phase='planning';s.year=2;s.engine.remaining_budget=4500;
 s.history=[{year:1,request_id:'old-year',policy:'urban_canopy_trees',quantity:2,spend_coins:50,unused_allowance:50,result:{turn:1,intervention:{id:'urban_canopy_trees',budget_allocated:500,area_converted_hectares:.1},next_state:structuredClone(s.engine),player_metrics:{community_cheer_score:55},science_payload:{invest_urban_cooling:{surface_temp_drop_celsius:.01},invest_urban_flood:{baseline_runoff_mm:20,post_runoff_mm:19,stormwater_retained_m3:100,incremental_runoff_reduction_m3:10}}}}];
 return s;
}
test('v1 save migrates to one-item lists and rewrites v2 without changing results or funds',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'project-migration-'));try{
 const before=legacy();const file=path.join(dir,before.id+'.json');const source=JSON.stringify({version:1,session:before});writeFileSync(file,source);
 const disk=new FileSessions(dir);const loaded=disk.load(before.id)!;
 assert.deepEqual(loaded.history[0].projects,[{policy:'urban_canopy_trees',quantity:2}]);
 assert.equal('policy' in loaded.history[0],false);assert.equal('quantity' in loaded.history[0],false);
 assert.deepEqual(loaded.history[0].result,before.history[0].result);assert.deepEqual(loaded.engine,before.engine);
 assert.equal(readFileSync(file,'utf8'),source);
 const gateway:ToolGateway={close:async()=>{},call:async()=>{throw Error('Retry must not simulate');}};
 const restored=new SessionStore(gateway,disk);
 assert.deepEqual(await restored.turn(before.id,{year:1,request_id:'old-year',policy:'urban_canopy_trees',quantity:2}),loaded);
 disk.save(loaded);assert.equal(JSON.parse(readFileSync(file,'utf8')).version,2);assert.deepEqual(disk.load(before.id),loaded);assert.deepEqual(migrateSession(loaded),loaded);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('mixed years retain their full lists and drop legacy primary-project fields',()=>{
 const s=legacy();s.history[0]={...s.history[0],projects:[{policy:'urban_canopy_trees',quantity:1},{policy:'bioswales',quantity:1}],spend_coins:55,unused_allowance:45} as Turn;
 const migrated=migrateSession(s);assert.deepEqual(migrated.history[0].projects,s.history[0].projects);assert.equal('policy' in migrated.history[0],false);assert.equal(migrated.history[0].spend_coins,55);assert.equal('policy' in s.history[0],true);
});
