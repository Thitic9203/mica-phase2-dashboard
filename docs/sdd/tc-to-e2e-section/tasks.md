# Tasks: tc-to-e2e section

- **T1** — `teCompute` (R2, R3, R7)
  - Test first: a node check runs `teCompute` against two cases. With 0 issues it must return a total
    of 0 and the REV and MICA2 rows at 0. With mixed issues it must return totals that add up, extra
    types added as columns, and shares that sum to 100.0.
  - Done when the check passes.
- **T2** — Markup and render: empty state, table, meta facts (R3, R5, R8).
  - Done when the section shows 0 and the empty-state line with no data.
- **T3** — `loadTcToE2e` wired into `loadRetestUsage` and the auto-refresh, with its own failure state
  (R1, R4, R6).
  - Done when a failure in one section leaves the other intact.
- **T4** — Motion via `ruReveal`, scoped (R8).
  - Done when there is no double count-up and nothing animates under reduced motion.
- **T5** — Deploy to prod and verify that the deployed HTML contains the section (Done when).
