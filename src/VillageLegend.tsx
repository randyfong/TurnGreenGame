import {TownIcon} from './Town';
const entries = [
  ['tree_cover_10', 'Trees'],
  ['shrubland_20', 'Grass & shrubs'],
  ['cropland_40', 'Crops'],
  ['built_up_50', 'Homes'],
  ['bare_soil_60', 'Bare soil'],
  ['water_80', 'Water'],
] as const;
export function VillageLegend() {
  return <section className="village-legend" aria-labelledby="village-legend-title">
    <h3 id="village-legend-title">Map key</h3>
    <ul>{entries.map(([kind, label]) => <li key={kind}>
      <span className={`legend-picture legend-${kind}`}><TownIcon kind={kind}/></span>
      <span>{label}</span>
    </li>)}</ul>
    <p>Two colors = mixed land. <span aria-hidden="true">🌧️</span> Rain = visual preview only.</p>
  </section>;
}
