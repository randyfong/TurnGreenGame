# CoolTown

A lightweight five-year neighborhood climate planning game. The application foundation connects a React interface to the existing local TurnGreen MCP servers through a Node.js backend.

## Run

Requires Node.js 22 or newer, npm, and built TurnGreen MCP server entry points.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Choose a neighborhood, answer both baseline questions, and run an annual investment. The backend connects to real local MCP processes on first use; it does not return mock environmental results.

```sh
npm test
npm run build
npm run validate:live
```

The live check launches the real assessment and simulation processes, exercises both neighborhood profiles over five turns, and writes `validation/foundation-live.json`. It uses synthetic assessment sessions.

For a production build served locally:

```sh
npm run build
npm start
```

## Server configuration

By default, MCP builds are discovered in the sibling directory `../TurnGreen/MCP`:

| Service | Entry point under MCP root |
| :--- | :--- |
| Simulation | `simulate_policy_turn/dist/index.js` |
| Science | `get_scientific_explaination/dist/index.js` |
| Assessment | `assessment_delta/dist/index.js` |
| Resolution | `resolution_generator/dist/index.js` |

Set `TURNGREEN_MCP_ROOT` to an absolute alternative directory before running the app. Individual overrides are `TURNGREEN_SIMULATION_ENTRY`, `TURNGREEN_SCIENCE_ENTRY`, `TURNGREEN_ASSESSMENT_ENTRY`, and `TURNGREEN_RESOLUTION_ENTRY`. These point to JavaScript entry files, invoked with the current Node executable. No server configuration or code outside this repository is changed by the app. Use `PORT` to override port 5173. The app binds to loopback only.

## Foundation boundaries

- `shared/types.ts`: typed engine, assessment, session, turn, and gateway contracts.
- `config/game-rules.json`: reconciled prices, budgets, profiles, and assessment questions.
- `server/mcp.ts`: lazy stdio MCP connections, error-envelope checks, JSON response adapter, timeout, and shutdown.
- `server/sessions.ts`: committed state, baseline recording, annual spending checks, response validation, per-session locks, and idempotent retries.
- `server/index.ts`: same-origin HTTP API and development/production frontend serving.
- `src/`: responsive neighborhood overview and foundation controls.
- `tests/`: transaction checks with a fake gateway; these do not substitute for the separate live-server check.

API routes: `GET /api/config`, `GET /api/health`, `POST /api/sessions` with `profile_id`, `GET /api/sessions/:id`, `POST /api/sessions/:id/baseline` with the two assessment values, and `POST /api/sessions/:id/turn` with `year`, `request_id`, `policy`, and `quantity`. Each successful write returns the current session. Errors return `{ "error": "..." }` with an appropriate HTTP status.

## Current limits

Committed sessions live in backend memory. The browser remembers the session ID, so refresh works while the backend remains running; restarting the backend loses sessions. Durable saves, pending-choice restoration, post-assessment, the science drawer, resolution export, and full gameplay polish belong to the subsequent implementation stages. The completion screen explains which stages are still pending.

Use the reconciled specification as the implementation authority: [Docs/RECONCILED_SPEC.md](Docs/RECONCILED_SPEC.md). Known model discrepancies remain in [Docs/TOOL_VALIDATION.md](Docs/TOOL_VALIDATION.md). These are educational simulation estimates, not local forecasts.
