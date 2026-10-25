# Remote village and desertification scenario

This update follows the user's clarification: the setting is a small remote village, not a dense town. It supersedes the original neighborhood fixtures and the story-only land-degradation presentation. Product branding is CoolVillage, following the user’s naming update.

## Village setting

Two synthetic 50-hectare profiles now include homes, farmland, vegetation, and substantial exposed ground:

| Profile (stable ID) | Trees | Shrubs | Grass | Crops | Homes/paths | Exposed soil | Surface water |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Dryland Farming Village (`crowded_market`) | 10 | 10 | 15 | 10 | 25 | 30 | 0 |
| Riverbank Village (`riverside_valley`) | 8 | 10 | 15 | 12 | 25 | 25 | 5 |

All values are percentages totaling 100. Stable IDs avoid breaking API clients; their display labels and new-game baselines change. The illustration uses scattered low houses, cultivated rows, planted plots, dirt paths, cracked exposed ground, low hills, and a well. It remains a schematic cover overview, not a map of exact addresses. Surface-water class is distinct from groundwater access; the illustrative well is not a measurement of water supply.

## Playable land-loss mechanic

Each new session is marked `dryland-v1`. Before each annual policy call, the backend applies a deterministic educational dry-season event. Lost vegetation moves into bare-soil cover; area, buildings, water, and budget are conserved. The resulting state is passed to the real MCP cooling/runoff engine. The complete original land-cover baseline is preserved so the engine's runoff comparison remains relative to the original village.

Scenario loss rates across five years are 8%, 12%, 18%, 22%, and 15% of susceptible vegetation. Tree, shrub, grass, and crop susceptibility multipliers are 0.4, 0.6, 1, and 1. These are game-design constants, not empirical local mortality rates. Previously committed rain gardens reduce subsequent losses by accumulated rain-garden spending in coins divided by 600, capped at 45%. Same-year rain gardens do not retroactively prevent the event that precedes them. Cool roofs cool buildings but do not directly restore cover or reduce the scenario's vegetation losses.

Raw dry-season inputs and outcomes are committed alongside each successful annual response. Failed calls do not commit vegetation loss, spending, or a completed year; retries recompute from the same committed state. Badges use committed history. The Year 4 request now requires trees or rain gardens rather than rewarding roofs as soil restoration.

## Player feedback

- A dry-season event card previews the vegetation loss before submission.
- Land restoration watch shows living cover, cultivated land cover, exposed soil, and net living-cover area change from the initial village.
- A no-project counterfactual applies the identical five-season rules without interventions. Its living-cover comparison is an educational scenario result, not an avoided-economic-loss estimate.
- Annual reveals separate vegetation lost before the project from net vegetation change after the project.
- Surface cooling is labeled **project cooling**: it compares the dry-season-degraded state to the post-project state. It is not a net annual drought temperature estimate.
- Crop cover is not crop yield, food availability, income, soil fertility, actual erosion mass, or measured soil moisture. These outcomes are not calculated or invented.

## Scientific framing and limits

UNCCD Article 1 defines desertification as land degradation in arid, semi-arid, and dry sub-humid areas, with climate and human pressures among its causes. Loss of vegetation and erosion can be parts of land degradation; neither a patch of bare ground nor one drought establishes a desertification diagnosis. The village narrative uses that distinction and links the source in the field notes:

https://www.unccd.int/article-1-use-terms

This source grounds the concept, not the numerical game rules. The scenario does not certify SDG compliance or calibrate a desertification forecast. External MCP server code is unchanged.

## Verification

- Production TypeScript/Vite build passes.
- Ten automated tests pass, including area conservation, cultivated-cover loss, preserved original baseline, rain-garden protection, roof non-protection, and the no-project trajectory. Existing transaction and badge tests remain active.
- Both village profiles complete five live turns through the local MCP bridge. Every year records positive scenario vegetation loss and preserves the profile baseline. Capture: `../validation/dryland-live.json`.
- Development server restarted to activate backend mechanics. Previous in-memory sessions do not migrate; new sessions use the new profiles and scenario.
