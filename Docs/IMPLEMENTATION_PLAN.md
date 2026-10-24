# CoolTown Implementation Plan

Based on `DESIGN_PLAN.md` and `PROJECT_SPEC.md`.

## Goal

Build a lightweight, five-turn planning game: choose a neighborhood, invest in cooling and flood protection, see the results, and finish with a printable civic resolution.

## Recommended Architecture

Use **React + TypeScript + Vite**, a **CSS grid playfield**, and a **small Node.js backend**. Most interactions involve parcel selection, forms, and explanations; a separate game engine would add unnecessary weight.

The four TurnGreen MCP servers are exposed in the planning session. The web app still needs its own backend bridge to call their local standard-I/O processes.

Keep game rules and session history separate from React rendering. The backend validates spending and tool requests; the frontend manages pending selections and presentation. A failed simulation must preserve selections without charging the budget.

## Implementation Steps

| Step | Work | Completion check |
| :--- | :--- | :--- |
| **1. Validate the existing tools** | Exercise simulation, science, assessment, and resolution generation with a sample session. Capture actual response shapes and errors. | All four tools return usable structured results. |
| **2. Reconcile the specifications** | Define the budget model, intervention mapping, parcel rules, assessment wording, and metric meanings. | One consistent set of gameplay rules matches the tools. |
| **3. Build the application foundation** | Scaffold the SPA and backend bridge. Define typed session state, tool adapters, and two pre-baked neighborhood profiles. | Browser can load a neighborhood and request a simulation. |
| **4. Implement the planning loop** | Build the 4×4 grid, intervention palette, budget display, five-year progression, and annual result summaries. | A player can complete five turns without overspending or submitting twice. |
| **5. Add explanations and feedback** | Translate technical outputs into plain language. Add the science drawer, citations, and lightweight parcel transitions. | Each displayed environmental change has a traceable explanation. |
| **6. Add assessments and recovery** | Record identical pre/post questions. Save session state locally and restore it on refresh. | Assessment results and game progress survive refreshes and recoverable failures. |
| **7. Generate the civic resolution** | Pass actual session history to the resolution tool. Add author/district fields, preview, and single-page print styling. | The completed game produces a readable one-page resolution through Print / Save as PDF. |
| **8. Playtest and optimize** | Verify both neighborhoods, mobile touch, keyboard navigation, error recovery, performance, and print layout. | Both complete journeys work on desktop and a narrow mobile screen. |

## Specification Differences to Resolve First

The documents and current tool contracts differ in ways that affect implementation. These are recommended decisions to confirm during implementation, rather than completed changes.

| Issue | Recommended decision |
| :--- | :--- |
| Design grants **100 coins yearly**; spec describes a **fixed five-year pool**. | Use a 500-coin total with 100 released each year. Define whether unused coins carry forward. |
| UI costs use coins; simulation accepts **USD**. | Define an explicit coin-to-dollar conversion after checking the tool's cost model. |
| Design allows several placements per year; simulation accepts **one intervention per call** and no parcel coordinates. | Validate whether calls can be composed within a year. Keep placements pending, calculate the result, and commit the year atomically. |
| Tool state uses land-cover percentages, while the UI uses parcels. | Define parcel area and a consistent conversion between grid changes and aggregate land cover. |
| Documents label WorldCover class 20 as grassland. | Align with the tool schema: **20 = shrubland, 30 = grassland**. |
| Design calls runoff reduction “flood risk” or water-depth reduction. | Display what the tool actually calculates; do not equate runoff retention with measured flood depth. |
| Assessment wording differs between documents. | Use the tool-compatible questions unchanged before and after play. Describe the result as a change in understanding ratings. |

## Gameplay and Interface

The player's loop is:

**Review neighborhood → select an intervention → choose eligible parcels → review spending → end the year → inspect results.**

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
