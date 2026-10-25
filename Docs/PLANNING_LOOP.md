# Step 4: Planning loop complete

Implemented October 24, 2026 (Pacific time), for CoolVillage's current remote-village dryland scenario and $10-per-coin budget.

## Delivered behavior

The player completes baseline questions, reviews the current dry-season event, selects one of three project types, chooses whole investment units, reviews spending, confirms the year, inspects the result, and proceeds to the next year. The 4×4 village overview derives its mixed cover from committed engine state. The existing compact map key is retained.

- A planning budget HUD shows the 100-coin annual cap, total coins invested out of 500, and unused past allowances. Unused annual coins never increase a later year's allowance.
- The review dialog quotes coins and modeled USD, unused annual allowance, and the total unspent budget after the proposed investment. `Keep planning` or Escape cancels without simulation, spending, or advancing the year. Focus returns to the review button.
- `End Year N` sends one simulation request. An immediate frontend in-flight guard and a one-shot review-confirmation guard prevent duplicate clicks. The backend retains its per-session lock, expected-year checks, policy/quantity/budget validation, and idempotent request handling.
- Failure preserves the committed budget, vegetation, year, and history. Pending choices/request ID remain available for retry while the page stays open. Editing a choice clears the old pending request. Durable pending-choice recovery remains Step 6.
- Successful turns reset quantity to one, advance once, update the village, and show a labeled annual result dialog. The dialog starts at the top and supports Escape; closing focuses the new mission heading.
- Annual results show spent/unused coins, community game score, start/end living cover, net living area change, exposed soil, cultivated cover, project cooling, and baseline-relative runoff change.
- Runoff labels distinguish `more` from `less`; worsening outcomes no longer appear as a negative percentage labeled `less`. A zero runoff baseline is handled explicitly in annual results.
- Each committed year is available in the village journal with its full annual results.
- Year 5 ends planning, removes investment controls, and displays the five-year investment/land table with spent and unused funds. No sixth year is available. Story badges remain distinct from environmental outcomes.

## Verification

- Sixteen automated tests pass. Added review quotes at the current conversion; annual quantity limits; expired versus future budget accounting; zero/worse runoff; small signed-area formatting; whole-state rollback and retry after failure; five-year financial conservation; wrong-year, reused-ID, and unknown-policy rejection.
- A separate browser session completed all five years via the real HTTP/MCP bridge. Investments were 50, 60, 45, 75, and 90 coins: **320 coins / $3,200 spent**, **180 coins unused**, exactly five history entries. Final controls offered no additional planning turn.
- Canceling the first review retained the 50-coin draft and zero committed spending.
- Each annual reveal included detailed results. The journal exposed five annual entries. The first year's increased runoff was correctly labeled `3.0% more`.
- Refreshing the completed browser session restored the same table and totals while the backend remained running.
- Checked the mobile layout at 390×844: document width did not exceed the viewport. Normal viewport restored afterward.
- A separate live validation run exercises both village profiles across five turns using the actual local MCP processes. Capture: `../validation/planning-loop-live.json`.
- Production TypeScript/Vite build and whitespace checks pass.

Screenshots: `../validation/planning-review.png`, `../validation/planning-loop-complete.png`, and `../validation/planning-loop-mobile.png`.

## Boundaries

Backend sessions remain in memory. Server-restart persistence, full pre/post assessment and normalized learning results, the science drawer, and civic export are Steps 5–7. Broad device/performance/print QA remains Step 8. The known model caveats in TOOL_VALIDATION.md remain. Cooling at the current $10 conversion may round to 0.00°C because external model coefficients were not rescaled; land-loss scenario outcomes remain visible and are not represented as measured local forecasts.
