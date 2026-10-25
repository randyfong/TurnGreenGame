import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missionWon,earnedBadges} from '../src/campaign';
import type {Turn,Policy} from '../shared/types';
const turn=(year:number,policy:Policy,spend_coins:number)=>({year,policy,spend_coins} as Turn);
test('neighbor challenges require the right project and committed spend',()=>{
 const t=turn(1,'urban_canopy_trees',50);assert.equal(missionWon(t,[t]),true);
 assert.equal(missionWon({...t,spend_coins:25},[t]),false);
 assert.equal(missionWon({...t,policy:'bioswales'},[t]),false);
 assert.equal(missionWon(turn(2,'bioswales',60),[]),true);
 assert.equal(missionWon(turn(3,'cool_roofs',45),[]),true);
 assert.equal(missionWon(turn(4,'cool_roofs',75),[]),false);assert.equal(missionWon(turn(4,'urban_canopy_trees',75),[]),true);
});
test('final badge rewards diversity; completed history determines badge count',()=>{
 const history=[turn(1,'urban_canopy_trees',50),turn(2,'bioswales',60),turn(3,'cool_roofs',45),turn(4,'urban_canopy_trees',75),turn(5,'cool_roofs',15)];
 assert.equal(missionWon(history[4],history),true);assert.equal(earnedBadges(history).length,5);
 const onePolicy=history.map(t=>({...t,policy:'urban_canopy_trees' as Policy}));assert.equal(missionWon(onePolicy[4],onePolicy),false);
 assert.equal(earnedBadges([]).length,0);
});
