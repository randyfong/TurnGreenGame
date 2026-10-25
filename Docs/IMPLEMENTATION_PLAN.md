# CoolTown Implementation Plan

Based on `DESIGN_PLAN.md` and `PROJECT_SPEC.md`.

## Goal

Build a lightweight, five-turn planning game: choose a neighborhood, invest in cooling and flood protection, see the results, and finish with a printable civic resolution.

## Recommended Architecture

Use **React + TypeScript + Vite**, a **CSS grid playfield**, and a **small Node.js backend**. Most interactions involve parcel selection, forms, and explanations; a separate game engine would add unnecessary weight.

The four TurnGreen MCP servers are exposed in the planning session. The web app still needs its own backend bridge to call their local standard-I/O processes.

Keep game rules and session history separate from React rendering. The backend validates spending and tool requests; the frontend manages pending selections and presentation. A failed simulation must preserve selections without charging the budget.

## Implementation Steps

**Step 1 executed (October 24, 2026):** All four required tools returned structured results for a sample session. Live revalidation confirms fixes to assessment edge cases and roof persistence. Integration remains conditional on the remaining findings documented in [TOOL_VALIDATION.md](TOOL_VALIDATION.md). Captured live responses and a repeatable fixture check are in `../validation/`.

**Step 3 implemented (October 24, 2026):** React/TypeScript/Vite scaffold, Node MCP bridge, typed state, both profiles, guarded annual transactions, and baseline integration are working. Both profiles completed five live turns with unit-sized allocations. See [FOUNDATION_VALIDATION.md](FOUNDATION_VALIDATION.md) and [run instructions](../README.md). Durable saves and later game surfaces remain in their planned stages.

| Step | Work | Completion check |
| :--- | :--- | :--- |
| **1. Validate the existing tools** | Exercise simulation, science, assessment, and resolution generation with a sample session. Capture actual response shapes and errors. | All four tools return usable structured results. |
| **2. Reconcile the specifications** | Define the budget model, intervention mapping, parcel rules, assessment wording, and metric meanings. | One consistent set of gameplay rules matches the tools. |
| **3. Build the application foundation** | Scaffold the SPA and backend bridge. Define typed session state, tool adapters, and two pre-baked neighborhood profiles. | Browser can load a neighborhood and request a simulation. |
| **4. Implement the planning loop** | Build the 4×4 grid, intervention palette, budget display, five-year progression, and annual result summaries. | A player can complete five turns without overspending or submitting twice. |
| **5. Add explanations and feedback** | Translate technical outputs into plain language. Add the science drawer, citations, and lightweight parcel transitions. | Each displayed environmental change has a traceable explanation. |
| **6. Add assessments and recovery** | Record identical pre/post questions. Save session state locally and restore it on refresh. | Assessment results and game progress survive refreshes and recoverable failures. |
| **7. Generate the civic resolution** | Pass actual session history to the resolution tool. Add author/district fields, a controlled resolution template, validated metric overrides, and single-page print styling. | The completed game produces a readable one-page resolution through Print / Save as PDF. |
| **8. Playtest and optimize** | Verify both neighborhoods, mobile touch, keyboard navigation, error recovery, performance, and print layout. | Both complete journeys work on desktop and a narrow mobile screen. |

## Reconciled Specification (Step 2 Complete)

[RECONCILED_SPEC.md](RECONCILED_SPEC.md) is the implementation authority for the first release. Constants are captured in `../config/game-rules.json`. It supersedes conflicting examples in the original design and project specification.

| Topic | Adopted rule |
| :--- | :--- |
| Budget | 500 total coins; maximum 100 per year; unused annual allowance does not carry forward. |
| Units | 1 coin = $1,000 modeled USD. Tree/rain-garden/roof investment units cost 25/30/15 coins. Units are budget increments, not exact parcels. |
| Annual action | One intervention type per year; multiple whole investment units in a single simulation call. |
| Grid | 4×4 schematic, mixed land-cover overview; squares open explanations. The aggregate engine does not support spatial targeting. |
| Land cover | Class 20 is shrubland, class 30 grassland. Two synthetic 50-ha neighborhood profiles are defined. |
| Metrics | Annual surface cooling, baseline-relative runoff reduction, community game score, and distinct net ground/roof areas. No unsupported cumulative cooling total. |
| Assessment | Identical tool-compatible questions before/after play; rating change rather than objective mastery. |
| Resolution | Explicit water/land overrides and a controlled print template; omit unsupported generated claims. |

Step 3 must validate unit-sized allocations and the new riverside profile before enabling these controls. Existing server continuity findings remain documented in [TOOL_VALIDATION.md](TOOL_VALIDATION.md).

## Engagement Update

Resident requests, five collectible badges, illustrated town tiles, project cards, a coin meter, year-end reveals, a story journal, and a block-party finale are implemented. This advances the planning-loop presentation while retaining the reconciled simulation and budget rules. See [GAMEPLAY_REFRESH.md](GAMEPLAY_REFRESH.md) for reward rules and playtest results. Steps 5–8 still include their remaining science, assessment, recovery, export, and broader QA work.

## Gameplay and Interface

The player's loop is:

**Review neighborhood → select an intervention → choose investment units → review spending → end the year → inspect results and grid.**

Use large, labeled grid buttons; a compact HUD for heat, rainwater, budget, and community score; and a science drawer that keeps technical details optional. Use small bundled SVG illustrations and CSS transitions to support the asset budget and low-bandwidth requirement.

## First-Release Scope

Include:

- Both neighborhoods.
- Three intervention choices.
- All five turns.
- Pre/post assessments.
- Science explanations.
- Saved progress.
- A printable civic resolution.

Defer accounts, multiplayer, live GIS downloads, and elaborate animation.

## Acceptance Criteria

- Complete the full journey through each neighborhood.
- Refresh mid-game and restore the correct session state.
- Recover from a failed request and retry without duplicate spending or turn submission.
- Verify mobile touch and keyboard navigation.
- Check loading performance against the source documents' lightweight-client requirements.
- Verify that the resolution fits one printed page and uses the recorded results.
- Identify results as **simulation estimates**, with evidence links supporting the model rather than implying real-world certification.
