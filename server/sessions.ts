import {turnProjects} from '../shared/planning';
import {resolutionInput,resolutionMetrics,type ResolutionDetails} from '../shared/resolution';
import {applyDrySeason,livingCover,noProjectCover} from '../shared/dryland';
import { randomUUID } from 'node:crypto';
import { rules, type AssessmentResult, type Assessment, type Session, type Simulation, type ToolGateway, type TurnInput } from '../shared/types';
export class RequestError extends Error { constructor(message:string, public status=400) { super(message); } }
export class SessionStore {
  private sessions = new Map<string,Session>();
  private locks = new Set<string>();
  constructor(private gateway:ToolGateway, private persistence?:{load(id:string):Session|undefined;save(session:Session):void}) {}
  private commit(s:Session){this.persistence?.save(s);this.sessions.set(s.id,structuredClone(s));}
  get(id:string):Session { const s=this.sessions.get(id)??this.persistence?.load(id); if(!s)throw new RequestError('Session not found. Start a new neighborhood.',404); return structuredClone(s); }
  create(profileId:string) {
    const p=rules.profiles.find(p=>p.id===profileId); if(!p)throw new RequestError('Choose a listed neighborhood.');
    const s:Session={id:randomUUID(),profile_id:p.id,scenario_version:'dryland-v1',phase:'baseline',year:1,engine:{land_cover:structuredClone(p.land_cover),baseline_land_cover:structuredClone(p.land_cover),remaining_budget:rules.budget.total_coins*rules.budget.usd_per_coin,total_area_hectares:p.total_area_hectares},history:[]};
    this.commit(s); return structuredClone(s);
  }
  private async locked<T>(id:string, work:()=>Promise<T>) { if(this.locks.has(id))throw new RequestError('A request is already running. Retry when it finishes.',409);this.locks.add(id);try{return await work();}finally{this.locks.delete(id);} }
  async baseline(id:string, answers:Assessment) { return this.locked(id,async()=>{
    const s=this.get(id);
    if(!answers || Object.values({a:answers.q1_canopy_flooding,b:answers.q2_pavement_heat}).some(v=>!Number.isInteger(v)||v<1||v>5))throw new RequestError('Answer both questions with a rating from 1 to 5.');
    if(s.baseline){if(JSON.stringify(s.baseline)===JSON.stringify(answers))return s;throw new RequestError('Baseline already recorded.',409);}
    if(s.phase!=='baseline')throw new RequestError('Baseline cannot be changed.',409);
    await this.gateway.call('assessment','record_assessment_score',{session_id:id,turn:0,responses:answers});
    s.baseline=answers;s.phase='planning';this.commit(s);return structuredClone(s);
  }); }
  async resolution(id:string, raw:ResolutionDetails){return this.locked(id,async()=>{
    const s=this.get(id);if(s.phase!=='complete'||s.history.length!==5||!s.post_assessment||!s.assessment_result)throw new RequestError('Finish all five years and save your final answers first.',409);
    const text=(value:unknown,required:boolean)=>{if(typeof value!=='string'||value.trim().length>(required?80:100)||(/[\x00-\x1f]/.test(value))||(required&&!value.trim()))throw new RequestError('Enter a short name and district (up to 80 characters).');return value.trim();};
    if(!raw)throw new RequestError('Enter a name and district.');
    const details:ResolutionDetails={author_name:text(raw.author_name,true),district_name:text(raw.district_name,true)};
    if(raw.organization_or_school)details.organization_or_school=text(raw.organization_or_school,false);
    if(s.resolution&&JSON.stringify(s.resolution.details)===JSON.stringify(details))return s;
    const metrics=resolutionMetrics(s);if(Object.values(metrics).some(v=>!Number.isFinite(v)))throw new RequestError('Saved results contain invalid numbers. Your game is preserved.',409);
    const generated=await this.gateway.call('resolution','generate_youth_resolution',resolutionInput(s,details)) as {author_name?:string;district_name?:string;biophysical_scorecard?:Record<string,unknown>};
    const score=generated?.biophysical_scorecard;
    if(generated?.author_name!==details.author_name||generated.district_name!==details.district_name||!score||['total_modeled_retention_m3','baseline_runoff_reduction_m3','net_built_up_reduced_ha','ground_depaved_ha','total_ground_interventions_ha','rooftop_treated_ha'].some(k=>typeof score[k]!=='number'||Math.abs(Number(score[k])-metrics[k as keyof typeof metrics])>(k.endsWith("_m3")?.51:.011)))throw new RequestError('The document service returned different numbers. Your game is saved; try again.',502);
    s.resolution={details,created_at:new Date().toISOString(),metrics,years:s.history.map(t=>({year:t.year,policy:turnProjects(t)[0].policy,policies:turnProjects(t).map(p=>p.policy),coins:t.spend_coins,cooling:t.result.science_payload.invest_urban_cooling.surface_temp_drop_celsius})),rating_change:s.assessment_result.learning_gain.average_normalized_gain};
    this.commit(s);return structuredClone(s);
  });}
  async post(id:string, answers:Assessment) {return this.locked(id,async()=>{
    const s=this.get(id);
    if(!answers||[answers.q1_canopy_flooding,answers.q2_pavement_heat].some(v=>!Number.isInteger(v)||v<1||v>5))throw new RequestError('Answer both questions with a rating from 1 to 5.');
    if(s.post_assessment){if(s.post_assessment.q1_canopy_flooding===answers.q1_canopy_flooding&&s.post_assessment.q2_pavement_heat===answers.q2_pavement_heat)return s;throw new RequestError('Final ratings already recorded.',409);}
    if(s.phase!=='complete'||s.history.length!==rules.years)throw new RequestError('Finish all five years before the final ratings.',409);
    if(!s.baseline)throw new RequestError('Your baseline ratings are missing. Your game is saved; restore the original save before retrying.',409);
    const result=await this.gateway.call('assessment','record_assessment_score',{session_id:id,turn:5,responses:answers,prior_assessment:s.baseline}) as AssessmentResult;
    const g=result?.learning_gain;
    if(result?.status!=='completed'||result.turn!==5||result.session_id!==id||!g||!Number.isFinite(g.average_normalized_gain)||!['standard','ceiling_effect'].includes(g.gain_type)||!Array.isArray(g.question_breakdown)||g.question_breakdown.length!==2||rules.assessment.questions.some(q=>{const b=g.question_breakdown.find(b=>b.question_id===q.id);return !b||b.pre_score!==s.baseline![q.id as keyof Assessment]||b.post_score!==answers[q.id as keyof Assessment]||b.raw_delta!==b.post_score-b.pre_score||!Number.isFinite(b.normalized_gain);}))throw new RequestError('The ratings service returned inconsistent results. Your answers were not committed; try again.',502);
    s.post_assessment=answers;s.assessment_result=result;this.commit(s);return structuredClone(s);
  });}
  async turn(id:string, input:TurnInput) { return this.locked(id,async()=>{
    const s=this.get(id);
    if(!input || typeof input.request_id!=='string'||input.request_id.length<1||input.request_id.length>100)throw new RequestError('A request identifier is required.');
    const choices=input.projects??[{policy:input.policy,quantity:input.quantity}];
    if(!Array.isArray(choices)||!choices.length||choices.length>rules.interventions.length)throw new RequestError('Choose at least one project.');
    const normalized=choices.map(c=>{const p=rules.interventions.find(p=>p.id===c?.policy);if(!p||typeof c.quantity!=='number'||!Number.isInteger(c.quantity)||c.quantity<1||c.quantity>p.max_units_per_year)throw new RequestError('Choose valid projects and whole units.');return {policy:p.id as import('../shared/types').Policy,quantity:c.quantity};}).sort((a,b)=>a.policy.localeCompare(b.policy));
    if(new Set(normalized.map(c=>c.policy)).size!==normalized.length)throw new RequestError('Combine duplicate project types.');
    const committed=s.history.find(t=>t.year===input.year || t.request_id===input.request_id);
    if(committed){if(committed.year===input.year && committed.request_id===input.request_id && JSON.stringify(turnProjects(committed).slice().sort((a,b)=>a.policy.localeCompare(b.policy)))===JSON.stringify(normalized))return s;throw new RequestError('This year or request is already committed.',409);}
    if(s.phase!=='planning'||input.year!==s.year||!Number.isInteger(input.year)||input.year>rules.years)throw new RequestError('This is not the current planning year.',409);
    const spend=normalized.reduce((sum,c)=>sum+rules.interventions.find(p=>p.id===c.policy)!.unit_cost_coins*c.quantity,0);const usd=spend*rules.budget.usd_per_coin;
    if(spend>rules.budget.annual_limit_coins||usd>s.engine.remaining_budget)throw new RequestError('This investment exceeds your budget.');
    const dry=s.scenario_version==='dryland-v1'?applyDrySeason(s.engine,s.year,s.history):undefined;
    // Apply the scenario event once above, then submit the complete yearly plan.
    const raw=await this.gateway.call('simulation','simulate_year_plan',{year:s.year,annual_budget_limit:rules.budget.annual_limit_coins*rules.budget.usd_per_coin,current_state:dry?.state??s.engine,projects:normalized.map(c=>({intervention_id:c.policy,budget_allocated:rules.interventions.find(p=>p.id===c.policy)!.unit_cost_coins*c.quantity*rules.budget.usd_per_coin}))}) as {year:number;total_budget_spent:number;projects_executed:NonNullable<Simulation['projects_executed']>;next_state:Simulation['next_state'];science_payload:Simulation['science_payload'];youth_scorecard:{overall_sustainability_score:number}};
    validateYearResponse(raw,s,dry?.state??s.engine,usd);
    if(!raw||raw.year!==s.year||raw.total_budget_spent!==usd||!Array.isArray(raw.projects_executed)||raw.projects_executed.length!==normalized.length||normalized.some(c=>{const matches=raw.projects_executed.filter(p=>p?.intervention_id===c.policy);return matches.length!==1||matches[0].budget_capped||matches[0].budget_allocated!==rules.interventions.find(p=>p.id===c.policy)!.unit_cost_coins*c.quantity*rules.budget.usd_per_coin||!Number.isFinite(matches[0].area_converted_hectares)||matches[0].area_converted_hectares<0;}))throw new RequestError('The yearly simulation returned inconsistent projects. Nothing was saved.',502);
    const result:Simulation={turn:s.year,intervention:{id:normalized[0].policy,budget_allocated:usd,area_converted_hectares:raw.projects_executed.reduce((n,p)=>n+p.area_converted_hectares,0)},projects_executed:raw.projects_executed,next_state:raw.next_state,science_payload:raw.science_payload,player_metrics:{community_cheer_score:raw.youth_scorecard?.overall_sustainability_score}};

    validateSimulation(result,s,usd,normalized[0].policy);
    if(dry){dry.impact.after_project_vegetation_pct=livingCover(result.next_state.land_cover);dry.impact.no_project_vegetation_pct=livingCover(noProjectCover(s.engine.baseline_land_cover as typeof s.engine.land_cover,s.engine.total_area_hectares,s.year));}
    s.history.push({dry_season:dry?.impact,year:s.year,request_id:input.request_id,projects:normalized,spend_coins:spend,unused_allowance:100-spend,result});
    s.engine=result.next_state; if(s.year===rules.years)s.phase='complete';else s.year++;
    this.commit(s);return structuredClone(s);
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

/** Validate the entire payload before adapting, persisting, or advancing the year. */
export function validateYearResponse(raw:unknown,session:Session,before:Session['engine'],usd:number){
 const fail=()=>{throw new RequestError('The yearly simulation returned invalid results. Your plan and funds are preserved; try again.',502);};
 const object=(v:unknown):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 const finiteTree=(v:unknown):boolean=>typeof v==='number'?Number.isFinite(v):Array.isArray(v)?v.every(finiteTree):object(v)?Object.values(v).every(finiteTree):true;
 if(!object(raw)||!finiteTree(raw))return fail();
 const state=raw.next_state,science=raw.science_payload,score=raw.youth_scorecard;
 if(raw.year!==session.year||raw.total_budget_spent!==usd||!object(state)||!object(science)||!object(score))return fail();
 if(!Array.isArray(raw.projects_executed)||!raw.projects_executed.length||raw.projects_executed.some((p:unknown)=>!object(p)))return fail();
 if(state.remaining_budget!==before.remaining_budget-usd||state.remaining_budget<0||state.total_area_hectares!==before.total_area_hectares)return fail();
 const validCover=(cover:unknown)=>object(cover)&&Object.keys(cover).length===rules.grid.class_order.length&&rules.grid.class_order.every(k=>typeof cover[k]==='number'&&cover[k]>=0&&cover[k]<=100)&&Math.abs(Object.values(cover).reduce((n,v)=>n+Number(v),0)-100)<=rules.metrics.land_cover_sum_tolerance_pct;
 if(!validCover(state.land_cover))return fail();
 if(state.baseline_land_cover!==undefined){if(!validCover(state.baseline_land_cover))return fail();const base=before.baseline_land_cover??before.land_cover;if(rules.grid.class_order.some(k=>Math.abs(state.baseline_land_cover[k]-Number(base[k as keyof typeof base]))>.011))return fail();}
 if(state.baseline_runoff_mm!==undefined&&(typeof state.baseline_runoff_mm!=='number'||state.baseline_runoff_mm<0))return fail();
 if(before.baseline_runoff_mm!==undefined&&state.baseline_runoff_mm!==before.baseline_runoff_mm)return fail();
 if(state.roof_treatment_hectares!==undefined&&(typeof state.roof_treatment_hectares!=='number'||state.roof_treatment_hectares<0||state.roof_treatment_hectares>before.total_area_hectares||state.roof_treatment_hectares+.011<(before.roof_treatment_hectares??0)))return fail();
 if((before.roof_treatment_hectares??0)>0&&state.roof_treatment_hectares===undefined)return fail();
 if(typeof score.overall_sustainability_score!=='number'||score.overall_sustainability_score<0||score.overall_sustainability_score>100)return fail();
 const cooling=science.invest_urban_cooling,flood=science.invest_urban_flood;
 if(!object(cooling)||!object(flood)||typeof cooling.surface_temp_drop_celsius!=='number')return fail();
 for(const key of ['baseline_runoff_mm','post_runoff_mm','stormwater_retained_m3'])if(typeof flood[key]!=='number'||flood[key]<0)return fail();
 if(typeof flood.incremental_runoff_reduction_m3!=='number')return fail();
 for(const p of raw.projects_executed)if(typeof p.budget_allocated!=='number'||p.budget_allocated<=0||typeof p.area_converted_hectares!=='number'||p.area_converted_hectares<0||p.area_converted_hectares>before.total_area_hectares||p.budget_capped!==undefined&&p.budget_capped!==false)return fail();
}
