import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyDrySeason,livingCover,noProjectCover} from '../shared/dryland';
import {rules,type EngineState,type Turn} from '../shared/types';
const initial=():EngineState=>({land_cover:structuredClone(rules.profiles[0].land_cover),remaining_budget:500000,total_area_hectares:50});
test('dry seasons conserve area while moving vegetation, including crop cover, to bare soil',()=>{
 const s=initial(),original=structuredClone(s);const {state,impact}=applyDrySeason(s,1);
 assert.deepEqual(s,original);assert.ok(livingCover(state.land_cover)<livingCover(s.land_cover));
 assert.ok(state.land_cover.cropland_40<s.land_cover.cropland_40);
 assert.ok(Math.abs(Object.values(state.land_cover).reduce((a,b)=>a+b,0)-100)<1e-9);
 assert.equal(state.land_cover.built_up_50,s.land_cover.built_up_50);assert.equal(state.remaining_budget,500000);
 assert.ok(Math.abs((state.land_cover.bare_soil_60-s.land_cover.bare_soil_60)*.5-impact.vegetation_lost_ha)<1e-9);
 assert.deepEqual(state.baseline_land_cover,s.land_cover);
});
test('established rain gardens reduce future losses; roofs alone do not',()=>{
 const s=initial();const record=(policy:string)=>[{policy,spend_coins:90}] as Turn[];
 const none=applyDrySeason(s,3).impact.vegetation_lost_ha;
 assert.ok(applyDrySeason(s,3,record('bioswales')).impact.vegetation_lost_ha<none);
 assert.equal(applyDrySeason(s,3,record('cool_roofs')).impact.vegetation_lost_ha,none);
});
test('no-project counterfactual progressively loses vegetation without inventing urban or water changes',()=>{
 const s=initial();const outcome=noProjectCover(s.land_cover,50,5);
 assert.ok(livingCover(outcome)<livingCover(noProjectCover(s.land_cover,50,1)));
 assert.equal(outcome.built_up_50,s.land_cover.built_up_50);assert.equal(outcome.water_80,s.land_cover.water_80);
 assert.throws(()=>applyDrySeason(s,0));
});
