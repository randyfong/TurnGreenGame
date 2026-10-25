# Step 8: Playtest and optimize

Executed October 24, 2026 using the Game Studio playtest workflow. Test play used a separate production server and separate saves on port 5174; the player's village on port 5173 was preserved.

## Findings fixed

| Finding | Player impact | Fix and verification |
| --- | --- | --- |
| Weather buttons were 34 px, quantity controls 36 px, and several explanation links about 21–35 px high on mobile. | Small targets were difficult to tap. | Main mobile weather, quantity, and explanation controls are now at least 44 px high. Measured in the browser at 390 px width. Small supporting labels were increased. |
| New village retained the previous game's selected project. | A fresh game started with an unexpected selection. | Reset to trees and one unit. Started another village and verified its 25-coin review. |
| Request errors appeared in the planning panel above the resolution form. | A document failure could appear off-screen. | Errors receive keyboard focus and scroll into view. Stopped the QA server, attempted an update, verified alert focus and preserved document; restarted and retried successfully. |
| Assessment comparison table lacked cell spacing. | Before/after numbers were crowded. | Added full-width table layout, padding, and row separators. |
| Long names could overrun the document. | Narrow screens or print could clip names. | Added word wrapping. Tested an 80-character unbroken alias and long district/group values without horizontal overflow. |
| Production served uncompressed assets without cache validators. | Larger transfers on initial and repeat visits. | Added gzip, representation-specific ETags/304, immutable caching for hashed assets, revalidated HTML, and unchanged `no-store` API responses. |

## Journey and recovery checks

- **Desktop:** Dryland Farming Village, full baseline → five annual review/commit/results cycles → final ratings → action plan. Sequence: 50 tree, 60 rain garden, 45 roof, 75 tree, 90 rain garden coins. 320 spent, 180 unused, all five badges. Cancel via Escape returned focus to the review button. Refresh restored the selected two-unit draft.
- **Mobile responsive viewport (390 × 844):** Riverbank Village, the same five-year sequence, final ratings, and generated action plan. A maximum baseline and maximum final answers displayed the ceiling explanation. Document and game stayed within the viewport; page content width was 375 px with a 390 px viewport (scrollbar accounts for difference). This was viewport testing, not a physical phone test.
- **Keyboard:** Enter activated start, assessment submit, review and confirmation. Escape closed the review and science drawer and restored the relevant opener. Native dialogs keep modal interaction within the overlay.
- **Real services:** `validate-release.ts` completes both profiles with all three interventions, restart recovery midway, identical committed-turn retry, final assessments and resolutions. An extra roof-only journey preserves zero ground work separately from roof treatment: 15 live simulation turns total. The test's mixed sequence spends 335 coins in each profile.
- **Failures:** Automated tests cover rollback, concurrent submissions, corrupted saves, write failure, invalid spend, changed duplicate requests, failed assessment and science service requests, unsafe reference links, premature resolution generation, and mismatched resolution metrics. Browser offline document update kept the existing document, focused the error, then recovered after server restart and refresh.
- **Reduced motion:** Existing global `prefers-reduced-motion` rules disable animations and transitions, including map highlights and drawers. Reviewed in CSS; OS preference emulation was not available through the browser controls used here.
- **Browser console:** No error entries in the final QA tab. The intentionally stopped-server failure was tested separately.

## Performance

Production build: 260,682 bytes JavaScript and 26,203 bytes CSS (approximately 287 KB raw). Combined gzip size: 88,872 bytes, below the 500 KB compressed-client budget. Production HTTP check verified JavaScript transferred as 81,975 gzip bytes instead of 260,682 raw bytes, and an unchanged ETag returned 304. HTML uses `no-cache` and API responses use `no-store`.

All assets and illustrations are bundled; no new font, animation, or image dependency was added. Tests used local loopback with no network throttling. These measurements do not establish a cellular-network load-time target.

## Print layout and remaining limitation

The exact rendered action-plan markup and actual print CSS were checked at Letter printable dimensions: 725 × 965 CSS px, corresponding to 12-mm margins at 96 px/inch. With an 80-character alias plus long district/group names, the document measured **758 px high**, with no horizontal overflow. Screenshot review confirmed readable rows, complete sources and disclaimer, and no clipping.

This is a print-layout fit check, **not a verified saved-PDF page count**. Native print access remains unavailable: the in-app print dialog blocks automation, and Safari native access timed out. Actual PDF pagination under the user's print settings remains the one outstanding acceptance check. Physical phone testing, a full screen-reader audit, and a cross-browser matrix were not performed.

## Reproduce

1. `npm run build`
2. `npm test` — 27 passing tests.
3. `node --import tsx scripts/validate-release.ts` — both profiles, restart/retry cases, and three resolutions.
4. Start an isolated production server with `PORT=5174 COOLVILLAGE_SAVE_DIR=/tmp/coolvillage-qa-sessions NODE_ENV=production node --import tsx server/index.ts`.
5. `node --import tsx scripts/validate-serving.ts` — gzip, identity response, ETag, cache controls, invalid profile and origin guards.

Evidence: `validation/release-live.json`, `release-serving.json`, `release-desktop.png`, `release-mobile.png`, `release-review.png`, `release-mobile-controls.png`, `release-print-fit.json`, and `release-print-fit.png`.
