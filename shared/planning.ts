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
