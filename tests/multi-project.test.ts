import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SessionStore} from '../server/sessions';
import {applyDrySeason} from '../shared/dryland';
import {missionWon} from '../src/campaign';
import type {ToolGateway,EngineState,Turn} from '../shared/types';
function fixture(){const calls:{name:string;args:any}[]=[];let fail=false;const gateway:ToolGateway={close:async()=>{},call:async(server,name,args)=>{if(server==='assessment')return {};calls.push({name,args});if(fail)throw Error('Outage');const state=args.current_state as EngineState;const projects=(args.projects as any[]).map(p=>({...p,area_converted_hectares:.1}));const total=projects.reduce((n,p)=>n+p.budget_allocated,0);return {year:args.year,total_budget_spent:total,projects_executed:projects,next_state:{...state,remaining_budget:state.remaining_budget-total},youth_scorecard:{overall_sustainability_score:55},science_payload:{invest_urban_cooling:{surface_temp_drop_celsius:.02},invest_urban_flood:{baseline_runoff_mm:20,post_runoff_mm:18,stormwater_retained_m3:100,incremental_runoff_reduction_m3:10}}};}};return {store:new SessionStore(gateway),calls,fail:()=>fail=true};}
async function ready(f:ReturnType<typeof fixture>){const s=f.store.create('crowded_market');return f.store.baseline(s.id,{q1_canopy_flooding:2,q2_pavement_heat:3});}
const projects=[{policy:'urban_canopy_trees' as const,quantity:1},{policy:'bioswales' as const,quantity:1},{policy:'cool_roofs' as const,quantity:3}];
test('mixed year uses yearly tool, one dry season, combined budget and order-independent retry',async()=>{const f=fixture(),s=await ready(f);const end=await f.store.turn(s.id,{year:1,request_id:'mixed',projects});assert.equal(f.calls[0].name,'simulate_year_plan');assert.equal(f.calls[0].args.annual_budget_limit,1000);assert.deepEqual(f.calls[0].args.current_state.land_cover,applyDrySeason(s.engine,1).state.land_cover);assert.equal(end.engine.remaining_budget,4000);assert.equal(end.history[0].spend_coins,100);assert.equal(end.history[0].result.science_payload.invest_urban_flood.stormwater_retained_m3,100);assert.deepEqual(await f.store.turn(s.id,{year:1,request_id:'mixed',projects:[...projects].reverse()}),end);assert.equal(f.calls.length,1);});
test('empty, duplicate, invalid and over-budget lists never reach simulation',async()=>{const f=fixture(),s=await ready(f);for(const choices of [[],[projects[0],projects[0]],[{policy:'bioswales' as const,quantity:4}],[{policy:'urban_canopy_trees' as const,quantity:4},projects[1]]])await assert.rejects(f.store.turn(s.id,{year:1,request_id:'invalid',projects:choices}));assert.equal(f.calls.length,0);assert.deepEqual(f.store.get(s.id),s);});
test('mixed simulation failure leaves the entire year unchanged',async()=>{const f=fixture(),s=await ready(f);f.fail();await assert.rejects(f.store.turn(s.id,{year:1,request_id:'failure',projects}));assert.deepEqual(f.store.get(s.id),s);});
test('mixed badges count only the requested project spend',()=>{const turn={year:1,policy:'bioswales',quantity:1,spend_coins:100,projects} as Turn;assert.equal(missionWon(turn,[turn]),false);turn.projects=[{policy:'urban_canopy_trees',quantity:2},{policy:'bioswales',quantity:1}];assert.equal(missionWon(turn,[turn]),true);});
test('legacy single-project requests also use the yearly tool and convert coins to dollars',async()=>{
 const f=fixture(),s=await ready(f);
 await f.store.turn(s.id,{year:1,request_id:'legacy-yearly',policy:'urban_canopy_trees',quantity:2});
 assert.equal(f.calls[0].name,'simulate_year_plan');
 assert.deepEqual(f.calls[0].args.projects,[{intervention_id:'urban_canopy_trees',budget_allocated:500}]);
 assert.equal(f.calls[0].args.annual_budget_limit,1000);
 assert.deepEqual(f.calls[0].args.current_state.land_cover,applyDrySeason(s.engine,1).state.land_cover);
});
test('later mixed years apply the event once with protection from earlier rain gardens',async()=>{
 const f=fixture(),s=await ready(f);
 const first=await f.store.turn(s.id,{year:1,request_id:'rain-gardens',projects:[{policy:'bioswales',quantity:2}]});
 const expected=applyDrySeason(first.engine,2,first.history);
 assert.equal(expected.impact.protection_fraction,.1);
 const second=await f.store.turn(s.id,{year:2,request_id:'protected-mix',projects});
 assert.deepEqual(f.calls[1].args.current_state.land_cover,expected.state.land_cover);
 assert.equal(second.history[1].dry_season?.vegetation_lost_ha,expected.impact.vegetation_lost_ha);
 assert.equal(f.calls.length,2);
});
