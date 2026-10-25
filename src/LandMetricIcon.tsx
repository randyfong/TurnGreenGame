type MetricKind = 'plants' | 'crops' | 'soil' | 'change';
export function LandMetricIcon({kind}:{kind:MetricKind}) {
  return <svg className={`land-metric-icon metric-${kind}`} viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false">
    {kind==='plants'&&<><path d="M14 23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14 16C5 17 4 10 5 6c6 0 10 3 9 10Z" fill="currentColor" opacity=".65"/><path d="M14 12C13 5 19 3 24 4c0 6-4 10-10 8Z" fill="currentColor"/><path d="M5 24h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>}
    {kind==='crops'&&<><path d="M5 24h18M14 22V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>{[8,13,18].map(y=><g key={y}><path d={`M14 ${y+3}C8 ${y+3} 7 ${y} 7 ${y-2}c4 0 7 2 7 5ZM14 ${y+3}c6 0 7-3 7-5-4 0-7 2-7 5Z`} fill="currentColor"/></g>)}</>}
    {kind==='soil'&&<><rect x="3" y="5" width="22" height="19" rx="3" fill="currentColor" opacity=".18"/><path d="m5 12 7 2 3-7m-3 7 4 5-2 5m2-5 7-2M4 21l7-3m8-2 3-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>}
    {kind==='change'&&<><path d="M5 9h18m-5-5 5 5-5 5M23 20H5m5-5-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>}
  </svg>;
}
