import {useEffect,useRef} from 'react';
import {rules,type Session,type Policy,type Turn,type ProjectChoice} from '../shared/types';
import {investment,turnProjects,planningBudget,runoffReduction,signedArea} from '../shared/planning';
import {projects} from './campaign';
import {yearlyFeedback,scienceTopics,type ScienceTopic} from '../shared/science';

export function BudgetHUD({session,onExplain}:{session:Session;onExplain?:(topic:ScienceTopic,year?:number)=>void}){
 const b=planningBudget(session);
 return <section className="planning-budget" aria-label="Planning budget">
  <div><strong>{session.phase==='complete'?0:rules.budget.annual_limit_coins} 🪙</strong><span>{session.phase==='complete'?'Planning complete':'Available this year'}</span></div>
  <div><strong>{b.spent} / {rules.budget.total_coins}</strong><span>Coins invested so far</span></div>
  <p>{b.unused} unused from past years · you cannot spend them later. Each coin models ${rules.budget.usd_per_coin}. {onExplain&&<button className="why-link" onClick={()=>onExplain('game_rules')}>Budget rules</button>}</p>
 </section>;
}

export function PlanReview({session,choices,onCancel,onConfirm}:{session:Session;choices:ProjectChoice[];onCancel:()=>void;onConfirm:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);const submitted=useRef(false);const coins=choices.reduce((n,c)=>n+investment(c.policy,c.quantity).coins,0);const cost={coins,usd:coins*rules.budget.usd_per_coin,unused:100-coins};
 useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="year-reveal plan-review" aria-labelledby="plan-review-title" onCancel={onCancel}>
  <p className="year-label">Year {session.year} of {rules.years}</p><h2 id="plan-review-title">Ready to put your plan to work?</h2>
  {choices.map(({policy,quantity})=><div key={policy} className="review-project"><span aria-hidden="true">{projects[policy].icon}</span><div><strong>{projects[policy].name}</strong><p>{quantity} investment {quantity===1?'unit':'units'}</p></div></div>)}
  <dl className="review-cost"><div><dt>Spend this year</dt><dd>{cost.coins} coins · ${cost.usd.toLocaleString()}</dd></div><div><dt>Unused this year</dt><dd>{cost.unused} coins</dd></div><div><dt>Total budget after project</dt><dd>{((session.engine.remaining_budget-cost.usd)/rules.budget.usd_per_coin).toLocaleString()} coins</dd></div></dl>
  <p className="fine">You get up to 100 coins each year. Unspent coins cannot be used in later years, even though they still appear in the unused total. Mix project types within your yearly budget.</p>
  <p className="review-warning">The dry season and project will be calculated together. You can edit now; a completed year cannot be undone.</p>
  <div className="review-actions"><button className="secondary" autoFocus onClick={onCancel}>Keep planning</button><button className="primary" onClick={()=>{if(submitted.current)return;submitted.current=true;onConfirm();}}>End Year {session.year}</button></div>
 </dialog>;
}

export function AnnualResults({turn,onExplain}:{turn:Turn;onExplain?:(topic:ScienceTopic,year?:number)=>void}){
 const r=turn.result;const dry=turn.dry_season;const runoff=runoffReduction(turn);
 return <section className="annual-results" aria-label={`Year ${turn.year} results`}>
  <h3>Year {turn.year} results</h3><div className="year-feedback"><h4>What changed, in plain words</h4>{yearlyFeedback(turn).map(item=><p key={item.topic}>{item.text} {onExplain&&<button className="why-link" aria-label={`Explain: ${scienceTopics[item.topic].title}`} onClick={()=>onExplain(item.topic,turn.year)}>Why?</button>}</p>)}</div><dl>
   <div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('game_rules',turn.year)}>Spent / unused <span aria-hidden="true">ⓘ</span></button>:'Spent / unused'}</dt><dd>{turn.spend_coins} / {turn.unused_allowance} coins</dd></div>
   <div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('game_rules',turn.year)}>Community game score <span aria-hidden="true">ⓘ</span></button>:'Community game score'}</dt><dd>{r.player_metrics.community_cheer_score}/100</dd></div>
   {dry&&<><div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('dryland_scenario',turn.year)}>Land covered by plants: start → end <span aria-hidden="true">ⓘ</span></button>:'Land covered by plants: start → end'}</dt><dd>{dry.before_vegetation_pct.toFixed(1)}% → {dry.after_project_vegetation_pct.toFixed(1)}%</dd></div><div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('dryland_scenario',turn.year)}>Plant-covered land gained or lost <span aria-hidden="true">ⓘ</span></button>:'Plant-covered land gained or lost'}</dt><dd>{signedArea((dry.after_project_vegetation_pct-dry.before_vegetation_pct)*r.next_state.total_area_hectares/100)}</dd></div></>}
   <div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('dryland_scenario',turn.year)}>Exposed soil at year end <span aria-hidden="true">ⓘ</span></button>:'Exposed soil at year end'}</dt><dd>{r.next_state.land_cover.bare_soil_60.toFixed(1)}%</dd></div>
   <div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('dryland_scenario',turn.year)}>Land used to grow crops at year end <span aria-hidden="true">ⓘ</span></button>:'Land used to grow crops at year end'}</dt><dd>{r.next_state.land_cover.cropland_40.toFixed(1)}%</dd></div>
   <div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('invest_urban_cooling',turn.year)}>Ground cooling from this project <span aria-hidden="true">ⓘ</span></button>:'Ground cooling from this project'}</dt><dd>{r.science_payload.invest_urban_cooling.surface_temp_drop_celsius.toFixed(2)}°C</dd></div>
   <div><dt>{onExplain?<button className="explain-value" onClick={()=>onExplain('invest_flood_risk',turn.year)}>Rainwater flowing away vs. the start <span aria-hidden="true">ⓘ</span></button>:'Rainwater flowing away vs. the start'}</dt><dd>{runoff===null?'No baseline runoff':`${Math.abs(runoff).toFixed(1)}% ${runoff>=0?'less':'more'}`}</dd></div>
  </dl><p className="fine">Plant loss follows the game’s dry-season rules. Cooling shows how much the project cooled the ground. The community score is part of the game; it does not come from a survey.</p>
 </section>;
}

export function FiveYearSummary({session}:{session:Session}){
 const b=planningBudget(session);const final=session.history.at(-1);if(!final)return null;
 return <section className="five-year-summary" aria-labelledby="five-year-title"><h3 id="five-year-title">Your five-year plan, in numbers</h3>
  <div className="final-budget"><strong>{b.spent} coins invested · ${(b.spent*rules.budget.usd_per_coin).toLocaleString()}</strong><span>{b.remaining} coins unused · {session.history.length} years completed</span></div>
  <div className="history-table-wrap"><table><caption>What you spent and how much land had plants each year</caption><thead><tr><th scope="col">Year</th><th scope="col">Project</th><th scope="col">Coins</th><th scope="col">Living cover</th></tr></thead><tbody>{session.history.map(t=><tr key={t.year}><th scope="row">{t.year}</th><td>{turnProjects(t).map(p=>projects[p.policy].name).join(' + ')}</td><td>{t.spend_coins}</td><td>{t.dry_season?.after_project_vegetation_pct.toFixed(1)??'—'}%</td></tr>)}</tbody></table></div>
  <p className="fine">The unused total includes coins you did not spend in earlier years. The game ends after year five. Open your village story below to see each year’s results.</p>
 </section>;
}
