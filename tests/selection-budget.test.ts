import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectionBudget,selectionMaximum,restoreQuantities} from '../shared/planning';
test('mixed selections share one budget and release funds on decrease',()=>{
 const q={urban_canopy_trees:1,bioswales:1,cool_roofs:3};
 assert.deepEqual(selectionBudget(q),{spent:100,remaining:0,limit:100,valid:true});
 assert.equal(selectionMaximum(q,'cool_roofs'),3);
 q.bioswales=0;assert.equal(selectionBudget(q).remaining,30);assert.equal(selectionMaximum(q,'cool_roofs'),5);
});
test('budget and project limits reject overspending, fractions, negatives and nonfinite values',()=>{
 for(const q of [{urban_canopy_trees:4,bioswales:1,cool_roofs:0},{urban_canopy_trees:0,bioswales:0,cool_roofs:7},{urban_canopy_trees:1.5,bioswales:0,cool_roofs:0},{urban_canopy_trees:-1,bioswales:0,cool_roofs:0},{urban_canopy_trees:NaN,bioswales:0,cool_roofs:0}])assert.equal(selectionBudget(q).valid,false);
 assert.equal(selectionMaximum({urban_canopy_trees:0,bioswales:0,cool_roofs:0},'cool_roofs'),6);
});
test('restored drafts cannot bypass shared budget or unit limits',()=>{
 for(const raw of [null,{urban_canopy_trees:999,bioswales:999,cool_roofs:999},{urban_canopy_trees:-1,bioswales:1.5,cool_roofs:'6'}])assert.equal(selectionBudget(restoreQuantities(raw)).valid,true);
});
