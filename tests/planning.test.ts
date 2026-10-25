import {test} from 'node:test';
import assert from 'node:assert/strict';
import {investment,planningBudget,runoffReduction,signedArea} from '../shared/planning';
import type {Session,Turn} from '../shared/types';
test('review quotes use $10 per coin and retain annual purchase limits',()=>{
 assert.deepEqual(investment('urban_canopy_trees',4),{coins:100,usd:1000,unused:0});
 assert.deepEqual(investment('bioswales',3),{coins:90,usd:900,unused:10});
 assert.deepEqual(investment('cool_roofs',6),{coins:90,usd:900,unused:10});
 for(const quantity of [NaN,0,-1,1.5,5])assert.throws(()=>investment('urban_canopy_trees',quantity));
});
test('budget distinguishes unused expired coins from future spending allowance',()=>{
 const s={engine:{remaining_budget:4500},history:[{spend_coins:50,unused_allowance:50}]} as Session;
 assert.deepEqual(planningBudget(s),{spent:50,unused:50,remaining:450,futureAllowance:400});
});
test('annual display handles zero baseline, worse runoff, and small signed changes',()=>{
 const t={result:{science_payload:{invest_urban_flood:{baseline_runoff_mm:0,post_runoff_mm:0}}}} as Turn;
 assert.equal(runoffReduction(t),null);
 t.result.science_payload.invest_urban_flood={baseline_runoff_mm:10,post_runoff_mm:12,stormwater_retained_m3:0,incremental_runoff_reduction_m3:-2};
 assert.equal(runoffReduction(t),-20);assert.equal(signedArea(-.001),'0.00 ha');assert.equal(signedArea(.27),'+0.27 ha');
});
