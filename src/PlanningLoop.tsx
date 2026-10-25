import {useEffect,useRef} from 'react';
import {rules,type Session,type Policy,type Turn} from '../shared/types';
import {investment,planningBudget,runoffReduction,signedArea} from '../shared/planning';
import {projects} from './campaign';

export function BudgetHUD({session}:{session:Session}){
 const b=planningBudget(session);
 return <section className="planning-budget" aria-label="Planning budget">
  <div><strong>{session.phase==='complete'?0:rules.budget.annual_limit_coins} 🪙</strong><span>{session.phase==='complete'?'Planning complete':'Available this year'}</span></div>
  <div><strong>{b.spent} / {rules.budget.total_coins}</strong><span>Coins invested so far</span></div>
  <p>{b.unused} unused from past years · no carryover. Each coin models ${rules.budget.usd_per_coin}.</p>
 </section>;
}

export function PlanReview({session,policy,quantity,onCancel,onConfirm}:{session:Session;policy:Policy;quantity:number;onCancel:()=>void;onConfirm:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);const submitted=useRef(false);const cost=investment(policy,quantity);
 useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="year-reveal plan-review" aria-labelledby="plan-review-title" onCancel={onCancel}>
  <p className="year-label">Year {session.year} of {rules.years}</p><h2 id="plan-review-title">Ready to put your plan to work?</h2>
  <div className="review-project"><span aria-hidden="true">{projects[policy].icon}</span><div><strong>{projects[policy].name}</strong><p>{quantity} investment {quantity===1?'unit':'units'}</p></div></div>
  <dl className="review-cost"><div><dt>Spend this year</dt><dd>{cost.coins} coins · ${cost.usd.toLocaleString()}</dd></div><div><dt>Unused this year</dt><dd>{cost.unused} coins</dd></div><div><dt>Total budget after project</dt><dd>{((session.engine.remaining_budget-cost.usd)/rules.budget.usd_per_coin).toLocaleString()} coins</dd></div></dl>
  <p className="fine">Unused annual coins expire. The remaining five-year budget includes those unused coins; it does not increase next year’s 100-coin allowance. One project is committed per year.</p>
  <p className="review-warning">The dry season and project will be calculated together. You can edit now; a completed year cannot be undone.</p>
  <div className="review-actions"><button className="secondary" autoFocus onClick={onCancel}>Keep planning</button><button className="primary" onClick={()=>{if(submitted.current)return;submitted.current=true;onConfirm();}}>End Year {session.year}</button></div>
 </dialog>;
}

export function AnnualResults({turn}:{turn:Turn}){
 const r=turn.result;const dry=turn.dry_season;const runoff=runoffReduction(turn);
 return <section className="annual-results" aria-label={`Year ${turn.year} results`}>
  <h3>Year {turn.year} results</h3><dl>
   <div><dt>Spent / unused</dt><dd>{turn.spend_coins} / {turn.unused_allowance} coins</dd></div>
   <div><dt>Community game score</dt><dd>{r.player_metrics.community_cheer_score}/100</dd></div>
   {dry&&<><div><dt>Living cover: start → finish</dt><dd>{dry.before_vegetation_pct.toFixed(1)}% → {dry.after_project_vegetation_pct.toFixed(1)}%</dd></div><div><dt>Net living-cover change</dt><dd>{signedArea((dry.after_project_vegetation_pct-dry.before_vegetation_pct)*r.next_state.total_area_hectares/100)}</dd></div></>}
   <div><dt>Exposed soil at year end</dt><dd>{r.next_state.land_cover.bare_soil_60.toFixed(1)}%</dd></div>
   <div><dt>Cultivated cover at year end</dt><dd>{r.next_state.land_cover.cropland_40.toFixed(1)}%</dd></div>
   <div><dt>Project surface cooling</dt><dd>{r.science_payload.invest_urban_cooling.surface_temp_drop_celsius.toFixed(2)}°C</dd></div>
   <div><dt>Runoff change vs. original village</dt><dd>{runoff===null?'No baseline runoff':`${Math.abs(runoff).toFixed(1)}% ${runoff>=0?'less':'more'}`}</dd></div>
  </dl><p className="fine">Land loss uses the educational scenario. Cooling compares the state just before and after the project. The community score is a game score, not a survey.</p>
 </section>;
}

export function FiveYearSummary({session}:{session:Session}){
 const b=planningBudget(session);const final=session.history.at(-1);if(!final)return null;
 return <section className="five-year-summary" aria-labelledby="five-year-title"><h3 id="five-year-title">Your five-year plan, in numbers</h3>
  <div className="final-budget"><strong>{b.spent} coins invested · ${(b.spent*rules.budget.usd_per_coin).toLocaleString()}</strong><span>{b.remaining} coins unused · {session.history.length} years completed</span></div>
  <div className="history-table-wrap"><table><caption>Each year’s investment and land outcome</caption><thead><tr><th scope="col">Year</th><th scope="col">Project</th><th scope="col">Coins</th><th scope="col">Living cover</th></tr></thead><tbody>{session.history.map(t=><tr key={t.year}><th scope="row">{t.year}</th><td>{projects[t.policy].name}</td><td>{t.spend_coins}</td><td>{t.dry_season?.after_project_vegetation_pct.toFixed(1)??'—'}%</td></tr>)}</tbody></table></div>
  <p className="fine">Unused yearly allowances are included in the unused total. No sixth year or extra spending is unlocked. Open your village story below for full annual results.</p>
 </section>;
}
