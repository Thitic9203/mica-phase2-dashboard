# Spec: tc-to-e2e section in the AI Skill Adoption tab

Source of the decision: [Choose the tracking signal](../../wayfinder/tc-to-e2e-tracking/tickets/04-choose-tracking-signal.md). The owner gave the go-ahead to build it and deploy to prod on 16 Nov 2026.

## Scope

- In scope: a new section inside the existing view `view-retest-usage`. It counts tickets in Jira projects
  `REV` and `MICA2` that carry the label `tc-to-e2e`.
- Out of scope:
  - The helix retest numbers above this section, which stay unchanged.
  - Backfill of tickets tested before the label existed.
  - Changes to the skill repo.
- Role: any signed-in `@skilllane.com` user. Reads go through the existing authenticated Jira proxy.

## Rules

- **R1** When the AI tab loads, the system must query Jira with
  `project in (REV, MICA2) AND labels = "tc-to-e2e"`. Source: ticket 04.
- **R2** The system must count distinct tickets. It must show:
  - the total;
  - a count per issue type, with Bug, Task and Story always shown and any other type added as a column;
  - a table of project by issue type, with REV and MICA2 always shown as rows, plus a total row and a
    `% of Total` column.
  These follow the same counting conventions as the helix section.
- **R3** When no ticket carries the label, the system must show 0 and an empty-state line saying no
  ticket carries the label yet. It must not show an error. Source: owner decision that the label is
  not pre-created.
- **R4** When a ticket gets the label, the system must show it within the next refresh, with no code
  change needed. Refresh happens every 5 minutes while the tab is visible, and every time the tab is
  opened. Source: owner request "จะแสดงผลอัตโนมัติ".
- **R5** The section must show these facts:
  - the skill name and its repo link (https://github.com/makkawanc-skilllane/tc-to-e2e-skill);
  - the skill's created date, 28 Oct 2026;
  - the projects, REV and MICA2;
  - the tracking rule: label `tc-to-e2e`, added by the skill.
  Source: owner's message, answers 1, 3 and 4.
- **R6** If the Jira query fails, the section must show its own failure state, and the helix section must
  be unaffected. During a background refresh, a failure must keep the last good numbers on screen.
- **R7** The section must never render people's names or ticket content. It shows counts only.
- **R8** UI rules (global rule 16 and 19):
  - Motion uses GSAP `from` with `clearProps`, uses `opacity` only, and does nothing under reduced motion.
  - Colours come from tokens only.
  - Layout must work at ≥1280, 768–1024 and ≤430 px wide.
  - It reuses the existing `ru-*` styles.

## Edge cases

- A ticket moves project or changes issue type: the current Jira values win.
- A project other than REV or MICA2 appears: it cannot appear, because the JQL is scoped to those two.
- Pagination beyond 100 tickets: `fetchIssues` follows `nextPageToken`.

## Done when

- The section renders 0 with the empty-state line while no ticket has the label.
- A unit check of the compute function passes for 0 tickets and for mixed types and projects.
- The page has no console errors, and the helix section is unchanged.
- It is deployed to https://mica-phase2-dashboard.pages.dev and the deployed HTML contains the new section.
