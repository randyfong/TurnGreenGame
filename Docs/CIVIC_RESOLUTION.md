# Step 7: Civic resolution

After five years and saved final ratings, players can create a plain-language village action plan. Name or nickname and village/district are required; school/group is optional. Fields have length limits, are rendered as escaped React text, and are saved with the generated plan. Nothing is sent to officials automatically.

The backend passes all five actual turns to `generate_youth_resolution`, including the baseline, signed final storm-water change, final modeled storm retention, spending, unused funds, net paved-area reduction, summed ground work, roof treatment, community score, and qualified assessment ratings. It omits cumulative cooling. Returned identity and structured metrics are checked with tolerances for the generator's rounding. Failed generation preserves the game and can be retried. Identical repeat requests reuse the saved plan.

The application renders its own controlled document from authoritative session results. It does not render generated HTML or narrative, which can contain unsupported fixed percentages, summed cooling, invented group names, and certification claims. The document has five separate annual cooling rows, three action requests, source links, and the simulation disclaimer. Ground work is identified as a sum that may revisit land, rather than unique restored area. Water figures refer to one modeled 50-mm storm, not accumulated yearly savings.

The saved document survives refresh and server restart. Print / Save as PDF uses browser printing, with Letter-page CSS and 12-mm margins hiding all game surfaces and controls. Printing does not require another generator call.

## Validation

- Build and 27 automated tests pass. Added tests cover actual-history mapping, negative water changes, separate ground/roof work, assessment gate, field validation, mismatched generator metrics, persistence, and duplicate generation.
- Real local resolution tool returned matching metrics for the saved five-year village; browser shows the generated plan after refresh.
- The print button opened a blocking dialog in the in-app browser. Automated access to the native app is denied, so final PDF page count and visual print pagination have **not** been verified. One-page print styling is implemented; page-count acceptance remains open for Step 8. Long names or different browser print settings should be checked there.
