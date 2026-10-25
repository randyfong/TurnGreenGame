# Step 6: Assessments and recovery

The final gathering now asks the exact same two questions as the baseline, with explicit 1–5 choices and the same scale labels. Final submission requires five committed years and the saved baseline. The assessment service receives `prior_assessment`, so its own in-memory baseline is not needed after a restart.

Results show each before/after rating, signed difference, and the service's normalized rating change. Maximum-baseline results say “You started at the top of the scale.” Generated mastery claims and privacy-compliance claims are not displayed. Ratings are reflections, not objective knowledge scores. Repeated identical submissions return the saved result; changed final answers conflict.

## Saves and recovery

- Versioned, authoritative snapshots live in `data/sessions/` on this machine (override with `COOLVILLAGE_SAVE_DIR`). Every commit writes a temporary file then atomically renames it before publishing state. Save failures do not advance the stored village.
- Browser storage keeps the anonymous session identifier and a versioned draft: selected project, quantity, unfinished baseline/final answers, and pending turn identifier. Drafts cannot set authoritative funds or history.
- Refresh reconnects to the saved session. Committed turns win over stale drafts. An uncertain turn can be retried using its original identifier without double spending, including after a server restart.
- Server outages, missing sessions, and unreadable saves retain the browser identifier and offer reconnect or an explicit fresh start. Corrupt server files are preserved. Browser storage failures show a warning.
- New village clears the active browser pointer/draft after confirmation. It does not delete old server snapshots.

Local saves are not cloud backups or accounts. Clearing browser storage loses the automatic session pointer; removing the server data directory loses committed saves. Existing sessions held only in the old server's memory cannot be recovered retroactively. One local application process should own the save directory; multi-process deployments need a transactional database.

## Validation

- Production build and 25 automated tests pass, including disk round trips, new-store recovery, duplicate turn/final assessment retries, failed assessment rollback, corrupt saves, and write failure.
- `node --import tsx scripts/validate-recovery.ts`: five real simulation turns, restart of MCP gateway and session store, explicit baseline recovery, real ceiling-effect result, and persisted final assessment.
- Browser: partially completed baseline survives refresh; complete five-year journey; final ratings submit and survive refresh with negative and positive individual changes shown.
- Screenshot: `validation/assessment-recovery.png`.

Step 7 (civic resolution) remains separate.
