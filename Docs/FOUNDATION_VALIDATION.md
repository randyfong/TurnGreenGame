# Application Foundation Verification

Step 3 implemented October 24, 2026 (Pacific time).

## Delivered

React/TypeScript/Vite application; loopback Node HTTP backend; lazy MCP stdio gateway for all four configured services; typed session, simulation, assessment, and turn contracts; both reconciled synthetic profiles; baseline flow and minimum annual investment controls; authoritative in-memory session state; response checks; concurrency and retry protection. The basic annual controls are an integration surface for the later planning-loop work.

## Verification

- `npm test`: five transaction tests pass. Covers invalid amounts before tool calls, retry idempotency, conflicting retries, rollback on inconsistent response, concurrent submissions, required baseline, five-year completion, and mutation isolation.
- `npm run validate:live`: both synthetic neighborhoods complete five real MCP simulations. Exercises one-unit trees ($25,000), rain gardens ($30,000), and roofs ($15,000), plus three rain-garden units ($90,000) and six roof units ($90,000). Every response passes the backend validator. Captured in `../validation/foundation-live.json`.
- `npm run build`: TypeScript check and Vite production bundle pass. Initial assets approximately 65.8 KB gzip including HTML, CSS, and JavaScript; no external fonts or image downloads. This is a bundle measurement, not a network load-time benchmark.
- Browser check: selected market district, explicitly answered baseline questions, ran one tree unit through the real HTTP/MCP bridge, observed Year 2, 475 total coins remaining, 0.09°C annual cooling, and 7.8% baseline-relative runoff reduction. Refreshed and recovered the same committed year and results. Screenshot: `../validation/foundation-browser.png`.
- HTTP smoke check: loaded both profiles from `/api/config`, rejected an unknown profile with 400, recorded a riverside baseline, committed a real one-unit bioswale investment leaving $470,000, returned the identical state for an identical retry, and rejected a conflicting retry with 409.

## Limits

Sessions are in memory and only the ID is stored in browser localStorage. Browser refresh recovery does not imply backend-restart durability. Client pending selections are not persisted yet. Full post-assessment, science UI, controlled civic resolution, accessibility audit, and broad mobile playtesting remain subsequent steps. Existing scientific and narrative findings remain open; this scaffold does not silently repair the external engine.
