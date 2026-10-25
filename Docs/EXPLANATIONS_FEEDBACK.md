# Step 5: Explanations and feedback complete

Implemented October 24, 2026 (Pacific time), for CoolVillage's remote-village dryland scenario.

## Delivered

- A native modal science drawer slides in from the right, fills narrow screens, traps focus, closes with Escape or the close button, and restores focus to its opener. It can also open above an annual-results dialog without dismissing that result.
- Land figures, cooling/runoff/tree-cover controls, the selected project, budget rules, map plots, and annual-result labels link to relevant explanations.
- Eight topics cover cooling, runoff, land-cover classes, the three selectable projects, educational dry-season rules, and game rewards/budgets.
- Each topic starts with short plain-language copy and an everyday analogy. Reference formulas and assumptions remain collapsed until requested.
- A year selector shows actual committed-turn evidence. Before planning, unknown years, missing fields, and policy topics with no matching project do not fabricate numbers. Numeric zero remains visible.
- Model reference values come from `get_science_explanation` through `GET /api/science?topic=...`. The server accepts only the named topic allowlist, validates response identity and usable HTTPS citations, shares concurrent requests, caches successful references for the process lifetime, and drops failed requests from that cache.
- The client cancels obsolete topic requests, caches successful references for the page lifetime, and retains bundled explanations and source links on failure. A retry control requests live references again. Source links are plain React-rendered text; raw returned HTML/Markdown is not executed.
- Recorded turn values take precedence over reference defaults. Cooling evidence includes the recorded mitigation-index change; runoff evidence includes original/pre/post depths, actual curve numbers, total retained water, and the engine's reported reduction. Land-cover evidence includes recorded before/after class shifts when present.
- A signed runoff-volume comparison is explicitly derived from rounded depths and area. This exposes worsening runoff even when the engine clamps its reduction field to zero; it is labeled approximate and does not replace the raw field.
- Annual results explain net vegetation change, project cooling at reported precision, and worsening/improving runoff. Dry-season loss and resident badges are identified as game assumptions/rewards, not measured local science.
- Updated schematic plots briefly highlight and settle after a committed year. A status line reports how many changed. Counts use actual fractional cover changes, not requested spending or invented exact locations. Reduced-motion preferences disable the effects. The compact map key is retained.

## Verification

- Production build and 22 automated tests pass. Coverage includes existing financial/turn guards plus topic allowlisting, concurrent cache reuse, failed-reference retry, unsafe-link rejection, missing/zero evidence, policy/year matching, adverse runoff, and conserved grid fractions.
- `node --import tsx scripts/validate-science.ts` passes live checks for all eight topics, unknown-topic rejection, and a real committed turn's evidence. Capture: `../validation/science-live.json`.
- Browser: opening exposed soil before play gives the scenario explanation and UNCCD source without invented results. Escape returns focus to the exposed-soil button.
- Browser: a real Year 1 simulation shows the new narrative feedback; its runoff label opens the drawer above the annual-results dialog with original runoff 12.33 mm, pre-project 12.72 mm, post-project 12.71 mm, and an approximate signed change of −190 m³.
- Browser: switching to Before planning removes year evidence; switching back restores it. Expanded formulas and source links load. Cooling evidence retains the model's reported zero.
- Failure check: ran a separate production instance on port 5175 with an intentionally missing science executable. Its browser drawer retained the explanation, bundled InVEST link, and retry control. That test instance was stopped; the normal game service remains on port 5173.
- Checked desktop 1280×1000 and mobile 390×844. Drawer fits the mobile viewport without horizontal overflow. Restored normal viewport afterward.

Evidence screenshots: `../validation/science-drawer-desktop.png`, `../validation/science-drawer-mobile.png`, and `../validation/science-fallback.png`.

## Boundaries

External citation destinations and every source's content were not independently audited during this implementation. References explain model families; they do not certify local calibration or SDG compliance. Numerical scenario losses are separate from scientific models. Existing engine caveats in TOOL_VALIDATION.md remain.

The backend was restarted to register the new science endpoint. Sessions remain in memory; restart durability and full post-assessment belong to Step 6. Civic resolution export remains Step 7, and broad device/performance/accessibility audits remain Step 8.
