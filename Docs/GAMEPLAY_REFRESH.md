# Neighborhood story refresh

Implemented October 24, 2026, following feedback that the foundation felt boring.

## Player experience

The game now centers on a five-year neighborhood story leading to a block party. Maya the shopkeeper, Leo the gardener, and Zuri the school club captain offer optional requests. Players can follow a request to earn a badge or choose a different investment without being blocked from finishing.

| Year | Optional request | Badge |
| :--- | :--- | :--- |
| 1 | Trees, at least 50 coins | Shade starter |
| 2 | Rain gardens, at least 60 coins | Sponge hero |
| 3 | Cool roofs, at least 45 coins | Roof raiser |
| 4 | Any intervention, at least 75 coins | Big thinker |
| 5 | Include all three policy types in the completed plan | Town all-rounder |

Requests and badges are fictional game challenges, separate from environmental calculations. Each badge is derived from committed annual history, so drafts and failed tool calls cannot award it. Existing histories load with the same deterministic badge rules.

Project cards replace the policy dropdown, and a stepper plus coin meter makes investment sizes easier to compare. Every completed year reveals the actual modeled cooling, spending, and baseline-relative runoff results alongside resident feedback. The finale collects badges and offers replay. A collapsible journal retains the five-year project story.

The town uses lightweight inline SVG houses, trees, gardens, and water. Mixed land-cover backgrounds retain the model percentages; the foreground drawings illustrate the dominant cover rather than individual addresses. Roof illustrations brighten with district roof treatment. Optional sunny/rainy previews do not alter simulation state. Neighborhood notes explain these boundaries.

## Design decisions

Use garden green (#287451), leaf green (#7ec984), sky blue (#dceff2), soft paper (#fffef8), and coin gold (#edc65b). Avenir/system type keeps the bundle small. Give the town the left side of the play surface and the current resident request and controls the right side; stack on mobile. Reserve motion for user-triggered rain previews, simulation loading, and the year-end reveal. Respect reduced-motion preferences.

This changes the presentation and adds a story reward layer. The reconciled 500-coin budget, annual spending limits, intervention mapping, synthetic profiles, assessments, district-level simulation semantics, and external MCP code are unchanged. Post-assessment, science integration, durable sessions, and civic export remain separate stages.

## Verification

- Production TypeScript/Vite build passed; approximately 73 KB compressed initial HTML/JS/CSS, with no downloaded illustration assets.
- Seven automated tests passed: two campaign-goal tests plus the existing five session transaction tests. Includes matching project/spend requirements, all-five badge path, final diversity requirement, and empty history.
- Browser playtest on a separate localhost session completed all five years through the real MCP bridge. Earned the first three badges, intentionally missed the fourth, and earned the final diversity badge: finale correctly showed 4/5.
- Verified year-end modal keyboard dismissal with Escape, weather selection without metric changes, and completion after following an alternative path.
- Confirmed the user's existing 127.0.0.1 session remained at its committed Year 4 after reload.
- Reviewed 1280×900 desktop and 390×844 mobile layouts. Mobile document width did not exceed viewport width. Restored the normal viewport afterward.
- Added an explicit dialog title and focus restoration to the next mission heading. Full assistive-technology audit and broader browser/device coverage remain future work.

Evidence: `../validation/game-story-desktop.png`, `../validation/game-story-mobile.png`, and `../validation/game-year-reveal.png`. The earlier modal screenshot predates the addition of the third (runoff) result column.
