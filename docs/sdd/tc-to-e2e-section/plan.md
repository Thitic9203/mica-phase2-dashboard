# Plan: tc-to-e2e section

## Files

- `public/index.html` (the only file):
  - Markup: a new `<section class="pt-card ru-card">` after the "Usage by Project" card in `#view-retest-usage`.
  - Script: new `te*` functions placed next to the `ru*` functions.
    - `teCompute(issues)` is pure and returns `{ total, types, rows, totalRow }`.
    - `teRender(m)` and `teRenderFail()` draw the section.
    - `loadTcToE2e(opts)` loads the data. It is called from `loadRetestUsage`, alongside the existing
      load but independent of it, and so shares the existing 5-minute auto-refresh and tab-open triggers.

## Data

- Data comes from `fetchIssues('project in (REV, MICA2) AND labels = "tc-to-e2e"', 'issuetype,project')`,
  read through the existing authenticated proxy.
- Only `project.key` and `issuetype.name` are read.

## Libraries

- None new. The section reuses GSAP, which is already vendored. No new cost (rule 3).

## Alternatives weighed

- Merge the counts into the helix totals: rejected. The owner chose a separate section.
- Add a server-side function: not needed. Live JQL through the proxy is enough, and the helix live
  path already does this.

## What could break

- `loadRetestUsage` early-returns: the new load must run before any return, so a helix snapshot
  failure does not block it.
- Racing refreshes: the new load uses its own sequence counter.
- The helix count-up animation selects `#ru-total, .ru-type-v`: the new section uses its own ids,
  `#te-total` and `.te-types .ru-type-v`, and the selector must stay scoped so the helix animation does
  not double-animate the new numbers.
