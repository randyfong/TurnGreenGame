import {applyDrySeason,livingCover,noProjectCover} from '../shared/dryland';
import { randomUUID } from 'node:crypto';
import { rules, type Assessment, type Session, type Simulation, type ToolGateway, type TurnInput } from '../shared/types';
export class RequestError extends Error { constructor(message:string, public status=400) { super(message); } }
export class SessionStore {
  private sessions = new Map<string,Session>();
  private locks = new Set<string>();
  constructor(private gateway:ToolGateway) {}
  get(id:string):Session { const s=this.sessions.get(id); if(!s)throw new RequestError('Session not found. Start a new neighborhood.',404); return structuredClone(s); }
  create(profileId:string) {
    const p=rules.profiles.find(p=>p.id===profileId); if(!p)throw new RequestError('Choose a listed neighborhood.');
    const s:Session={id:randomUUID(),profile_id:p.id,scenario_version:'dryland-v1',phase:'baseline',year:1,engine:{land_cover:structuredClone(p.land_cover),baseline_land_cover:structuredClone(p.land_cover),remaining_budget:rules.budget.total_coins*rules.budget.usd_per_coin,total_area_hectares:p.total_area_hectares},history:[]};
    this.sessions.set(s.id,s); return structuredClone(s);
  }
  private async locked<T>(id:string, work:()=>Promise<T>) { if(this.locks.has(id))throw new RequestError('A request is already running. Retry when it finishes.',409);this.locks.add(id);try{return await work();}finally{this.locks.delete(id);} }
  async baseline(id:string, answers:Assessment) { return this.locked(id,async()=>{
    const s=this.get(id);
    if(!answers || Object.values({a:answers.q1_canopy_flooding,b:answers.q2_pavement_heat}).some(v=>!Number.isInteger(v)||v<1||v>5))throw new RequestError('Answer both questions with a rating from 1 to 5.');
    if(s.baseline){if(JSON.stringify(s.baseline)===JSON.stringify(answers))return s;throw new RequestError('Baseline already recorded.',409);}
    if(s.phase!=='baseline')throw new RequestError('Baseline cannot be changed.',409);
    await this.gateway.call('assessment','record_assessment_score',{session_id:id,turn:0,responses:answers});
    s.baseline=answers;s.phase='planning';this.sessions.set(id,s);return structuredClone(s);
  }); }
  async turn(id:string, input:TurnInput) { return this.locked(id,async()=>{
    const s=this.get(id);
    if(!input || typeof input.request_id!=='string'||input.request_id.length<1||input.request_id.length>100)throw new RequestError('A request identifier is required.');
    const committed=s.history.find(t=>t.year===input.year || t.request_id===input.request_id);
    if(committed){if(committed.year===input.year && committed.request_id===input.request_id && committed.policy===input.policy&&committed.quantity===input.quantity)return s;throw new RequestError('This year or request is already committed.',409);}
    if(s.phase!=='planning'||input.year!==s.year||!Number.isInteger(input.year)||input.year>rules.years)throw new RequestError('This is not the current planning year.',409);
    const policy=rules.interventions.find(p=>p.id===input.policy);
    if(!policy||!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>policy.max_units_per_year)throw new RequestError('Choose a valid intervention and whole number of units.');
    const spend=policy.unit_cost_coins*input.quantity; const usd=spend*rules.budget.usd_per_coin;
    if(spend>rules.budget.annual_limit_coins||usd>s.engine.remaining_budget)throw new RequestError('This investment exceeds your budget.');
    const dry=s.scenario_version==='dryland-v1'?applyDrySeason(s.engine,s.year,s.history):undefined;
    const result=await this.gateway.call('simulation','simulate_policy_turn',{turn:s.year,intervention_id:input.policy,budget_allocated:usd,current_state:dry?.state??s.engine}) as Simulation;
    validateSimulation(result,s,usd,input.policy);
    if(dry){dry.impact.after_project_vegetation_pct=livingCover(result.next_state.land_cover);dry.impact.no_project_vegetation_pct=livingCover(noProjectCover(s.engine.baseline_land_cover as typeof s.engine.land_cover,s.engine.total_area_hectares,s.year));}
    s.history.push({dry_season:dry?.impact,year:s.year,request_id:input.request_id,policy:input.policy,quantity:input.quantity,spend_coins:spend,unused_allowance:100-spend,result});
    s.engine=result.next_state; if(s.year===rules.years)s.phase='complete';else s.year++;
    this.sessions.set(id,s);return structuredClone(s);
  }); }
}
export function validateSimulation(r:Simulation,s:Session,usd:number,policy:string) {
  const fail=()=>{throw new RequestError('The simulation returned inconsistent results. Your year was not spent; retry or check the server.',502);};
  if(!r||r.turn!==s.year||r.intervention?.id!==policy||r.intervention.budget_allocated!==usd||r.intervention.budget_capped||r.next_state?.remaining_budget!==s.engine.remaining_budget-usd||r.next_state.total_area_hectares!==s.engine.total_area_hectares)fail();
  const cover=r.next_state?.land_cover;
  const keys=rules.grid.class_order;
  if(!cover||keys.some(k=>!Number.isFinite(cover[k as keyof typeof cover])||cover[k as keyof typeof cover]<0||cover[k as keyof typeof cover]>100)||Math.abs(Object.values(cover).reduce((a,b)=>a+b,0)-100)>rules.metrics.land_cover_sum_tolerance_pct)fail();
  const c=r.science_payload?.invest_urban_cooling;const f=r.science_payload?.invest_urban_flood;
  if(!c||!f||[c.surface_temp_drop_celsius,f.baseline_runoff_mm,f.post_runoff_mm,f.stormwater_retained_m3,f.incremental_runoff_reduction_m3,r.player_metrics?.community_cheer_score,r.intervention.area_converted_hectares].some(n=>!Number.isFinite(n)))fail();
}
