# CoolTown Reconciled Implementation Specification

> Current setting and land-loss rules: [DRYLAND_VILLAGE.md](DRYLAND_VILLAGE.md) supersedes the earlier urban profile table and story-only degradation treatment. The game now uses a remote-village dryland scenario. Budget and transactional rules are retained.

Status: Step 2 complete. Decisions adopted October 24, 2026.

## Authority and scope

This document governs the first release wherever `DESIGN_PLAN.md` or `PROJECT_SPEC.md` disagrees with it. Those documents retain the original product vision and examples. `TOOL_VALIDATION.md` records observed server behavior; it is evidence, not a replacement for these gameplay rules. `../config/game-rules.json` contains matching implementation constants.

Use React, TypeScript, Vite, a DOM/CSS grid, and a small Node.js MCP bridge. No canvas engine, live GIS download, user account, or external authentication is required. The browser calls the application backend; the backend calls the four configured local MCP processes. The host conversation's MCP connection is not the deployed browser's connection.

This step defines contracts and product decisions. It does not implement the application or repair the external servers.

## 1. Session and budget rules

- A session has neighborhood selection, a two-question baseline, five planning years, the identical post-assessment, and a resolution.
- The total modeled budget is 500 coins, equivalent to $5,000. **1 coin = $10 modeled USD**, a game abstraction, not a statement of local purchasing power.
- Each year permits up to 100 coins. Unspent annual allowance does **not** carry forward. This bounds each simulation request to $1,000, avoiding the unusually large allocation behavior found during validation.
- The player selects exactly one intervention type for the year and buys a positive whole number of investment units. Multiple units use one tool call. Switching intervention before submission clears the old quantity and preview.
- Costs are 25 coins per tree investment unit, 30 per rain-garden unit, and 15 per cool-roof unit. A unit is a budget increment, **not a parcel or a promise of a fixed area or environmental effect**.
- Annual spend is `unit_cost_coins × quantity`, at most 100. Maximum quantities are 4, 3, and 6 respectively. No mixed-intervention batches or zero-spend years in the first release. A player can always choose a minimum-cost action in each new year.
- `current_state.remaining_budget` is the total unspent five-year budget in USD, initially 5000. It decreases only by committed spending. Annual allowance is a separate application constraint; do not refill or subtract expired allowance from the server budget.
- Before submission show `annual_remaining = 100 − pending_spend`. After commitment, store `unused_allowance = 100 − committed_spend`. At completion, total server budget remaining equals all five unused allowances multiplied by 10.
- Example: two tree units spend 50 coins / $500. Annual remainder is 50, total budget becomes $4,500. Next year again offers 100 coins, not 150. The unspent 50 remains in the final budget accounting.
- Five committed years complete the planning phase. There is no score-based loss or forced perfect outcome. Restart creates a new anonymous session and requires confirmation if it discards progress.

The $1,000 sample calls are validated. Smaller unit-sized requests and repeated-policy sequences must be exercised in Step 3 before enabling the planning controls; the conversion above is a product decision, not a claim that those amounts have already been tested.

## 2. Intervention and topic mapping

| Player label | Simulation ID | Cost per investment unit | Maximum units/year | Science topic |
| :--- | :--- | ---: | ---: | :--- |
| Plant shady trees | `urban_canopy_trees` | 25 coins | 4 | `urban_canopy_trees` |
| Build rain gardens | `bioswales` | 30 coins | 3 | `bioswales` |
| Paint cool roofs | `cool_roofs` | 15 coins | 6 | `cool_roofs` |

Permeable pavement, pocket parks, and green roofs remain server capabilities, outside the first-release action palette. Do not combine cool roofs and green roofs into one label or policy. The original per-parcel cooling and runoff percentages are illustrative and are removed as gameplay promises; accepted tool outputs determine outcomes.

## 3. Neighborhoods and grid semantics

Use two synthetic 50-hectare teaching profiles, with the following percentages. They are not sampled satellite tiles or measured local conditions.

| WorldCover class / request key | Crowded Market District | Riverside Valley Town |
| :--- | ---: | ---: |
| Tree cover / `tree_cover_10` | 10 | 10 |
| Shrubland / `shrubland_20` | 0 | 5 |
| Grassland / `grassland_30` | 10 | 15 |
| Cropland / `cropland_40` | 0 | 0 |
| Built-up / `built_up_50` | 75 | 50 |
| Bare soil / `bare_soil_60` | 5 | 10 |
| Water / `water_80` | 0 | 10 |
| **Total** | **100** | **100** |

The market profile uses the validated baseline. Riverside is a new fixture requiring a five-turn check in Step 3. It provides a different land-cover tradeoff; the current engine does not model river routing or elevation. Describe it as a riverside setting without claiming the engine simulates river flooding or low-elevation exposure.

- Keep a 4×4 grid as an accessible **schematic overview**, labeled “Neighborhood overview — model totals, not a street map.” Each square represents 1/16 of total area, or 3.125 ha, and may contain mixed land-cover fractions.
- Derive every land-cover fill from returned district percentages. Use a stable class order matching the table above, distribute each class sequentially across the 16 cells, and allow split fills at cell boundaries. This conserves area without rounding each square into one whole class. Do not infer spatial adjacency from this display order.
- A square supports inspection by tap, Enter, or Space; it opens the appropriate class explanation. It is not a selectable intervention target. Primary actions live in the intervention palette. No parcel coordinates are sent or stored as simulation inputs.
- Show roof work as a separate district-level indicator with treated hectares; roofs overlay built-up land and must not be counted as an additional land-cover class. Do not assign an exact roof address or overwrite ground fractions with roofs.
- Commit area and visual changes only after a successful response. Keep budget-unit quantity distinct from converted hectares, grid cells, and unique ground restored.
- This explicitly replaces the original exact parcel-placement mechanic. Location-sensitive placement requires a future spatial engine contract; do not imply it exists in this release.

## 4. Annual transaction and state ownership

The backend owns committed session state, validates annual and total spending, and supplies the simulation request. The renderer does not calculate biophysical outcomes.

1. Validate phase, expected year, policy allowlist, integer quantity, annual allowance, and total remaining funds.
2. Send one `simulate_policy_turn` request with the year, selected policy ID, `budget_allocated = coins × 10`, and the entire previous `next_state`. Start with the selected profile, area 50 ha, and $5,000 budget. Preserve baseline and roof fields returned by the engine without reconstructing them from grid graphics.
3. Check transport failure, MCP `isError`, JSON parsing, finite metrics, land-cover sum (tolerance 0.05 percentage points), and nonnegative funds. Require returned budget allocation to match the request, and new remaining budget to equal old budget minus allocation. A capped or mismatched result does not silently commit.
4. Persist response, raw scientific metadata, spending, and history together; advance the year once. Use a session/year/request identifier and reject different payloads for an already committed year. An identical retry returns the committed result. Serialize submissions per session.
5. On failure, retain pending choice and old committed state. Permit retry; do not deduct coins or increment the year. Since simulation is stateless, an uncommitted retry uses the same prior state. Browser refresh restoration and backend recovery are implemented in Steps 3 and 6.

Persist serializable state only: schema version, anonymous session ID, profile and original baseline, phase/year, annual history, complete engine state, raw tool responses, assessment values, and pending selection. Author details belong to the resolution form and are not assessment identifiers. Do not claim in-memory server storage provides durable persistence or establishes legal compliance.

## 5. Player-facing metrics and evidence

| UI label | Source / calculation | Meaning and guardrail |
| :--- | :--- | :--- |
| Surface cooling this year | `science_payload.invest_urban_cooling.surface_temp_drop_celsius` | Display a positive amount as “0.4°C cooler this year”; preserve sign if warming occurs. This is modeled surface temperature, not measured street air temperature. |
| Less rainwater runoff | `(baseline_runoff_mm − post_runoff_mm) / baseline_runoff_mm × 100` | Baseline-relative reduction for the same 50-mm design storm. If baseline runoff is zero, show “No baseline runoff” instead of dividing. A negative result is increased runoff. Never label this flood probability or street-water-depth reduction. |
| Rainwater held back | `stormwater_retained_m3` | Total retention under the current modeled storm, not improvement caused by this year's spending. |
| Extra rainwater held back | `incremental_runoff_reduction_m3` | Improvement over the original baseline despite the field's name; never sum across years. If deriving it from rounded depths use `delta_mm × area_ha × 10` and disclose rounding. |
| Community game score | `player_metrics.community_cheer_score` | Display `/100`, not a percentage of residents surveyed. |
| Less hard ground | `(baseline built_up_50 − current built_up_50) × area_ha / 100` | Net change in modeled built-up area; preserve the signed result. Distinct from summed intervention area and roof treatment. |
| Cool roofs treated | `next_state.roof_treatment_hectares` | Separate modeled treated-roof area. |

Do not display a five-year cooling total by summing turn drops while the documented cross-turn HMI discontinuity remains unresolved. The final screen and resolution show the last year's cooling plus a five-entry annual cooling table; omit cumulative cooling claims. “Not available” must not become a fabricated zero.

Science drawer mappings: cooling → `invest_urban_cooling`; runoff/retention → `invest_flood_risk`; ground/grid → `esa_worldcover`; policy → its ID. Community score is identified as a game score, not a scientifically validated public-opinion measure. Include actual turn coefficients and source links when available. Cached descriptions must not override numeric results with old coefficients. Do not claim SDG certification or independently verified local forecasts.

## 6. Assessments

Use these exact questions before and after planning:

1. “How much impact does neighborhood tree canopy have on local street flooding?” → `q1_canopy_flooding`.
2. “How much impact does asphalt pavement have on neighborhood heatwaves?” → `q2_pavement_heat`.

Both use integer ratings 1–5, labeled “Minimal impact” to “Decisive impact.” Require an explicit response to both; do not submit untouched defaults as intentional answers. Record Turn 0 before beginning Year 1. Save the baseline and pass it as `prior_assessment` on Turn 5 completion for server-restart recovery. Missing baselines block calculation with a recoverable message, not an assumed score.

Use the tool's question breakdown and average normalized gain; do not substitute a different formula. For maximum baselines show “You started at the top of the scale” when `gain_type` is `ceiling_effect`. Negative change remains visible. Label results “Change in your understanding ratings,” not an objective knowledge test or proof of mastery. Do not show server-generated mastery or civic-justification prose as verified evidence.

## 7. Civic resolution and export

- Unlock after five committed years and completed post-assessment. Author and district are collected here; allow a display alias. Require an explicit organization or omit the organization line rather than inventing a delegation.
- Call `generate_youth_resolution` with all five actual annual records and explicit final metrics. Supply `total_modeled_retention_m3`, `baseline_runoff_reduction_m3`, `net_built_up_reduced_ha`, `ground_depaved_ha` (same net modeled built-up reduction, clearly labeled as modeled), `rooftop_treated_ha`, `total_ground_interventions_ha` (sum excluding roofs), total spending, remaining budget, and community game score. Keep summed work distinct from unique area.
- Pass learning gain with its rating-based qualification. Omit unsupported cumulative cooling input; do not let the generated fallback sum reappear in the visible document.
- Render a controlled application template using validated structured metrics, a five-year cooling table, three action requests mapped to the three policy options, and model reference links. Generated narrative/HTML is source material, not automatically trusted publishable output. Do not use brittle text replacement to remove unsupported claims.
- Exclude fixed greenspace percentages, inferred financial returns, certification/compliance badges, invented organizations, and unsupported claims about avoided harm. Wording: “Results from a simplified educational simulation; local conditions and implementation may differ.”
- Export via browser Print / Save as PDF with one-page print styling. This does not promise a separate server-produced PDF download. Verify page count and readability in Step 7.

## 8. Delivery constraints and acceptance

- Preserve the audience of ages 15–24, plain-language labels, icons with text, visible keyboard focus, touch-friendly buttons, and an accessible drawer with focus restoration.
- Bundle local SVG assets and system fonts. Target initial compressed client JS/CSS/images under 500 KB; record the measurement and connection profile before claiming a load-time target. No mandatory network GIS or citation fetch during play. Cached science remains readable offline; pending simulation and export generation need the local backend and must show a retry state when unavailable.
- Step 3 must exercise both profiles and unit-sized policy requests, confirm response contracts, and implement budget/idempotency boundaries. Do not treat previously validated $1,000 calls as coverage of all new gameplay inputs.
- Steps 4–8 implement the specified loop, accessibility, persistence, evidence translation, resolution template, and end-to-end verification. Remaining server discrepancies are documented limitations, not silent fixes in frontend math.

## Decision ledger

| Original conflict | Adopted rule |
| :--- | :--- |
| Annual grant versus five-year pool | 500 total, maximum 100 per year; unused allowance does not carry. |
| Coins versus USD | 1 coin = $10 modeled USD. |
| Multiple policies per year versus single-policy request | One type/year, multiple investment units in one call. |
| Fixed per-parcel prices and effects | Preserve 25/30/15 as budget-unit prices; derive areas and outcomes from tool results. |
| Exact parcel placement versus aggregate engine | Inspectable schematic grid, district-wide policy; no fabricated spatial targeting. |
| Grassland class 20 | Class 20 shrubland; class 30 grassland. |
| Flood danger and water depth labels | Modeled runoff reduction for a stated design storm. |
| Competing assessment wording | Exact tool-compatible questions and rating-scale interpretation. |
| Summed water/land/cooling outputs | Explicit water/land overrides; yearly cooling only until continuity is resolved. |
| Live platform downloads versus zero-auth cached game | Synthetic baselines and local MCP outputs; no runtime GIS credentials or live tile dependency. |
| Single FastMCP architecture diagram | Four configured MCP processes behind one application backend. |

## Presentation addendum: neighborhood story

[GAMEPLAY_REFRESH.md](GAMEPLAY_REFRESH.md) defines the implemented optional resident requests and badge layer. Investment IDs, costs, annual transactions, profile data, and environmental metric meanings above remain authoritative. Illustrated foregrounds represent dominant land cover; mixed tile backgrounds preserve percentages. Story rewards and weather previews do not change engine state.

## Plain-language update

At the user’s request, both assessment screens now use the same simpler wording from `config/game-rules.json`, with scale labels “Very little effect” and “Very strong effect.” The question identifiers, 1–5 values, and tool calculation are unchanged. Results are headed “How your views changed” and explain the percentage with an example. This wording supersedes the earlier exact display text above.
