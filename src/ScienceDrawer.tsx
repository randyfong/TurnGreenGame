import {useEffect,useRef,useState} from 'react';
import {rules,type Session} from '../shared/types';
import {scienceTopics,bundledSources,turnEvidence,scenarioFormula,type ScienceTopic,type ScienceReference} from '../shared/science';
const references=new Map<ScienceTopic,ScienceReference>();
export interface ScienceSelection {topic:ScienceTopic;year?:number;}
export function ScienceDrawer({selection,session,onClose}:{selection:ScienceSelection;session:Session|null;onClose:()=>void}){
 const [topic,setTopic]=useState(selection.topic),[year,setYear]=useState(selection.year??session?.history.at(-1)?.year??0),[reference,setReference]=useState<ScienceReference|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const opener=document.activeElement;dialog.current?.showModal();return()=>{if(opener instanceof HTMLElement&&opener.isConnected)opener.focus();};},[]);
 useEffect(()=>{
  const controller=new AbortController();setError('');setReference(null);
  if(references.has(topic)){setReference(references.get(topic)!);setLoading(false);return;}
  if(scienceTopics[topic].source!=='model'){setLoading(false);return;}
  setLoading(true);
  fetch(`/api/science?topic=${encodeURIComponent(topic)}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Reference service unavailable');return r.json() as Promise<ScienceReference>;}).then(data=>{if(controller.signal.aborted)return;references.set(topic,data);setReference(data);}).catch(e=>{if(e.name!=='AbortError')setError('Live references could not load. You can still read the saved explanation, source links, and your recorded results.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[topic,attempt]);
 const explanation=scienceTopics[topic];const evidence=turnEvidence(topic,session,year);const citations=reference?.citations??bundledSources(topic);
 return <dialog ref={dialog} className="science-drawer" aria-labelledby="science-title" onCancel={onClose}>
  <div className="science-top"><span>Why did this happen?</span><button autoFocus onClick={onClose} aria-label="Close science explanation">×</button></div>
  <h2 id="science-title">{explanation.title}</h2>
  <label className="science-label" htmlFor="science-topic">Explore a topic</label><select id="science-topic" value={topic} onChange={e=>setTopic(e.target.value as ScienceTopic)}>{Object.entries(scienceTopics).map(([key,t])=><option key={key} value={key}>{t.title}</option>)}</select>
  <section className="simple-science"><h3>The simple reason</h3><p>{explanation.simple}</p><blockquote>{explanation.analogy}</blockquote></section>
  <section className="science-evidence"><h3>{explanation.source==='model'?'Your recorded model results':explanation.source==='scenario'?'Your dry-season game record':'Your game record'}</h3>
   {session&&session.history.length>0&&<><label className="science-label" htmlFor="science-year">Planning year</label><select id="science-year" value={year} onChange={e=>setYear(Number(e.target.value))}><option value={0}>Before planning</option>{session.history.map(t=><option key={t.year} value={t.year}>Year {t.year}</option>)}</select></>}
   {evidence.length?<dl>{evidence.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>:<p className="science-empty">No completed-year evidence for this view yet. Complete a year, or choose a recorded year. No result has been estimated here.</p>}
   {explanation.source==='model'&&<p className="science-note">These values come from the saved turn response. Recorded values take precedence over reference-model defaults. {topic==='invest_flood_risk'&&<>Results combine all projects in the selected year. Intermediate water-retention snapshots are not added together. Retention is for a design storm; it is not flood probability or drinking-water supply. The signed runoff comparison is calculated from rounded reported depths. An engine-reported reduction of zero can coexist with increased runoff.</>}</p>}
  </section>
  <details className="science-technical"><summary>Show formulas and assumptions</summary>
   {topic==='dryland_scenario'?<p>{scenarioFormula}</p>:explanation.source==='game'?<p>Budget = coins × ${rules.budget.usd_per_coin}. Badges follow resident request rules. Neither is an environmental measurement.</p>:<><p>Reference formulas explain the model family. They are not proof of local calibration, verified predictions, or SDG compliance.</p>{loading?<p role="status">Loading model references…</p>:reference?.equations.length?<ul>{reference.equations.map((eq,i)=><li key={i}><code>{eq}</code></li>)}</ul>:<p>Formulas have not been loaded for this view. Your recorded values are shown above when available.</p>}</>}
  </details>
  {error&&<div className="science-load-error" role="status"><p>{error}</p><button className="secondary" onClick={()=>setAttempt(n=>n+1)}>Retry live references</button></div>}
  <section className="science-sources"><h3>{explanation.source==='game'?'Where these rules come from':'Sources to explore'}</h3>{loading&&<p role="status">Loading references from the science service…</p>}{citations.length?<ul>{citations.map(c=><li key={c.link}><a href={c.link} target="_blank" rel="noreferrer">{c.title}</a><span>{c.source}</span></li>)}</ul>:<p>CoolVillage’s configured budget, resident requests, and game scoring. There is no scientific citation for a badge or community game score.</p>}{explanation.source==='scenario'&&<p className="science-note">UNCCD grounds the meaning of desertification. It does not validate our numerical vegetation-loss rules.</p>}</section>
  <button className="primary" onClick={onClose}>Back to my village</button>
 </dialog>;
}
