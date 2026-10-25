import {rules,type Session,type Policy,type Turn} from './types';
export function investment(policy:Policy,quantity:number){
  const choice=rules.interventions.find(p=>p.id===policy);
  if(!choice||!Number.isInteger(quantity)||quantity<1||quantity>choice.max_units_per_year)throw new Error('Choose a valid whole number of investment units.');
  const coins=choice.unit_cost_coins*quantity;
  if(coins>rules.budget.annual_limit_coins)throw new Error('This project exceeds the annual allowance.');
  return {coins,usd:coins*rules.budget.usd_per_coin,unused:rules.budget.annual_limit_coins-coins};
}
export function planningBudget(session:Session){
  const spent=session.history.reduce((sum,t)=>sum+t.spend_coins,0);
  const unused=session.history.reduce((sum,t)=>sum+t.unused_allowance,0);
  return {spent,unused,remaining:session.engine.remaining_budget/rules.budget.usd_per_coin,futureAllowance:Math.max(0,rules.years-session.history.length)*rules.budget.annual_limit_coins};
}
export function runoffReduction(turn:Turn){const f=turn.result.science_payload.invest_urban_flood;return f.baseline_runoff_mm>0?(f.baseline_runoff_mm-f.post_runoff_mm)/f.baseline_runoff_mm*100:null;}
export function signedArea(value:number){const rounded=Math.round(value*100)/100;return `${rounded>0?'+':''}${rounded.toFixed(2)} ha`;}

export function turnProjects(turn:Turn){return turn.projects??[{policy:turn.policy,quantity:turn.quantity}];}
export function projectCoins(policy:Policy,quantity:number){return rules.interventions.find(p=>p.id===policy)!.unit_cost_coins*quantity;}

export function turnAllocations(turn:Turn){return turn.projects?turn.projects.map(p=>({...p,coins:projectCoins(p.policy,p.quantity)})):[{policy:turn.policy,quantity:turn.quantity,coins:turn.spend_coins}];}

export type ProjectQuantities=Record<Policy,number>;
export function selectionBudget(quantities:ProjectQuantities){
 const limit=rules.budget.annual_limit_coins;
 const spent=rules.interventions.reduce((sum,p)=>sum+p.unit_cost_coins*quantities[p.id as Policy],0);
 const valid=Number.isFinite(spent)&&spent<=limit&&rules.interventions.every(p=>Number.isInteger(quantities[p.id as Policy])&&quantities[p.id as Policy]>=0&&quantities[p.id as Policy]<=p.max_units_per_year);
 return {spent,remaining:limit-spent,limit,valid};
}
export function selectionMaximum(quantities:ProjectQuantities,policy:Policy){
 const p=rules.interventions.find(p=>p.id===policy)!;
 const otherSpend=rules.interventions.filter(p=>p.id!==policy).reduce((sum,p)=>sum+p.unit_cost_coins*quantities[p.id as Policy],0);
 return Math.max(0,Math.min(p.max_units_per_year,Math.floor((rules.budget.annual_limit_coins-otherSpend)/p.unit_cost_coins)));
}
export function restoreQuantities(raw:unknown):ProjectQuantities{
 const result:ProjectQuantities={urban_canopy_trees:0,bioswales:0,cool_roofs:0};
 if(!raw||typeof raw!=='object')return result;
 for(const p of rules.interventions){const value=(raw as Record<string,unknown>)[p.id];if(typeof value==='number'&&Number.isInteger(value)&&value>=0)result[p.id as Policy]=Math.min(value,selectionMaximum(result,p.id as Policy));}
 return result;
}

/** Read combined plan metrics; intermediate steps are cumulative snapshots, never totals to sum. */
export function yearlyEffects(turn:Turn){
 const c=turn.result.science_payload.invest_urban_cooling,f=turn.result.science_payload.invest_urban_flood;
 return {cooling:c.annual_plan_temp_drop_celsius??c.surface_temp_drop_celsius,retention:f.design_storm_total_retained_m3??f.stormwater_retained_m3,annualRunoffReduction:f.annual_plan_incremental_runoff_reduction_m3??f.incremental_runoff_reduction_m3,baselineRunoffReduction:f.cumulative_retained_improvement_m3??(f.baseline_runoff_mm-f.post_runoff_mm)*turn.result.next_state.total_area_hectares*10};
}
