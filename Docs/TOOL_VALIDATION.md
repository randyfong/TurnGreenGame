# TurnGreen Tool Validation

Live revalidation: October 24, 2026 (Pacific time).

## Outcome

Step 1 is complete: all four required tools returned structured results for a synthetic five-turn session. Several previously reported server defects are now resolved. Integration remains conditional on the findings below. No external server code was modified.

Current requests and responses: `../validation/turngreen-tool-responses.json`. Earlier capture: `../validation/turngreen-tool-responses.initial.json`. All names and districts are synthetic.

## Executed Checks

| Check | Current result |
| :--- | :--- |
| Five chained simulation turns | Passed: trees, bioswales, cool roofs, permeable pavement, trees. Each call carries the previous next_state; budget falls from $500,000 to $0. |
| Science explanation | Passed: tree topic returns drawer content, coefficients, equations, and three citation links. Destinations not independently verified. |
| Topic discovery | Passed: ten topics. |
| Baseline and post assessment | Passed: 2/2 → 4/5 gives normalized gain 0.833. |
| Missing baseline | Fixed: returns isError rather than inventing baseline scores. |
| Unchanged maximum scores | Fixed: gain 0, gain_type ceiling_effect. |
| Invalid score, topic, turn | Passed: each returns isError with details. |
| Overspending | Now reports requested amount, capped allocation, budget_capped flag, and warning. |
| Roof state | Fixed: 11.11 treated hectares persist; turn 4 prior albedo matches turn 3 post albedo. |
| Rainwater metric | Now includes baseline-relative incremental_runoff_reduction_m3, alongside total retention. |
| Science tree cost | Fixed for ordinary sample: $100,000 → 6.67 ha / 13.33% in a 50-ha district. |
| Bioswale normalization | Previously lost tree cover is now preserved at 23.33%. |
| Resolution | Passed structure: three talking points, clauses, Markdown, printable HTML. Uses final retention rather than summing five totals; separates roofs from ground work. |

## Current Contracts

Responses arrive as serialized JSON in MCP content text blocks. Check isError before parsing: error text need not be JSON.

- Simulation accepts USD budget, intervention, turn, and current state. Carry the complete next_state, including new roof_treatment_hectares, baseline_runoff_mm, and baseline_land_cover fields.
- Science accepts topic_id and audience; returns drawer Markdown, equations, coefficients, and citations.
- Assessment accepts anonymous session_id, turn 0/5, and q1_canopy_flooding / q2_pavement_heat responses. Save the baseline locally; prior_assessment supports explicit recovery. Post output includes learning_gain.average_normalized_gain and ceiling classification.
- Resolution accepts author, district, and session_history with optional final metrics. Map assessment average_normalized_gain to input learning_gain.normalized_gain. Output includes scorecard, clauses, talking points, Markdown, and HTML.

## Remaining Integration Findings

1. **Total retention differs from improvement.** Final total retention is 20,095.1 m³ for a 50-mm storm; improvement over original runoff is 8,565 m³. Despite its name, incremental_runoff_reduction_m3 is baseline-relative, not a per-turn increment: it stays 4,685 m³ across the roof turn. Do not sum these values. Resolution presents about 20,095 m³; label this total modeled retention rather than benefit created by interventions.
2. **Resolution metric overrides now verified.** Supplied total_modeled_retention_m3 = 20,095.1, baseline_runoff_reduction_m3 = 8,565, net_built_up_reduced_ha = 17.58, and rooftop_treated_ha = 11.11. The output correctly separates total retention from baseline improvement and 17.58 ha unique built-up reduction from 22.09 ha summed ground work. Always pass these explicit metrics; do not infer unique de-paving from summed intervention areas.
3. **Generated claims need qualification.** Resolution still returns a fixed 25% greenspace increase and compliance/verified language unsupported by this sample's evidence. Earlier numeric ROI and 100-meter cooling-buffer claims are absent. Present educational simulation estimates; independent scientific accuracy and compliance are not established.
4. **Cooling continuity needs review.** Roof area persists, but turn 4 post-HMI is 0.3692 and turn 5 prior-HMI is 0.3672; albedo changes from 0.252 to 0.242 at the boundary. Reconcile the engine's baseline conventions before claiming exact cumulative cooling. Resolution sums rounded turn drops to 1.04°C.
5. **Large allocation conversion needs clarification.** Overspending probe caps $600,000 to $500,000 but converts only 8.33 ha of trees, compared with 6.67 ha for $100,000. Confirm conversion caps and spending policy before deriving parcel costs.

## Reproducible Checks and Limits

Run `python3 validation/check_tool_responses.py` from the project root. It verifies captured structures, chained state, budgets, expected error envelopes, ceiling handling, roof persistence, baseline-relative water calculations, and resolution retention/roof mapping. It does not reconnect to live servers.

The browser bridge, server restart recovery, negative/zero budgets, invalid land cover, repeated calls, other interventions, independent citations/model verification, and printed page count remain unverified.

## Latest Live Run

Repeated the full five-turn session and error checks, and verified the updated resolution final-metric overrides. All four tools returned structured valid-sample responses. Current capture supersedes the previous response fixture, preserved in `../validation/turngreen-tool-responses.previous.json`. Cooling continuity and unsubstantiated greenspace/compliance labels remain open.
