---
title: Find tc-to-e2e outputs on GitHub that name REV or MICA2 tickets
labels: [wayfinder:research]
status: closed
assignee:
blocked_by: []
---

## Question

Since 28 Oct 2026, has any tc-to-e2e output been committed to a GitHub repo that the owner can read
(the skilllane org, SkillLane-Dev, or personal repos)? Outputs include Playwright specs built from the
skill's templates, `TC_TO_E2E.md` docs, `evidence-*` folders, and bug files. If so, does the output
name the REV or MICA2 ticket key in a form that could be read reliably, such as a file name, spec
title, commit message or doc table? Give the repos, the paths, how the key appears, and an
approximate count of tickets per project.

## Resolution (16 Nov 2026, read-only research)

**No tc-to-e2e output was found** in any repo the owner can read, from 28 Oct 2026 up to this check.

What was searched:
- **Repos:** 50 readable repos, 19 of them pushed since 28 Oct.
- **File trees:** every branch with a commit since 28 Oct, 911 trees in all, none truncated. The
  search looked for the skill's file names: `step-evidence`, `clip-use`, `evidence.json`,
  `evidence-report.mjs`, `TC_TO_E2E.md`, `evidence-*/index.html` and `per-tc/`.
- **Commit messages since 28 Oct (default branch only):** 3 commits name a REV or MICA2 ticket key. All
  3 are ordinary feature commits with no link to the skill.
- **`gh search code`:** 0 hits. This proves little, because code search does not index private repos
  well. The skill's own repo returned 0 for a string it contains.

How the skill names things:
- Test titles use the TC ID (for example `TC-HOME-001`), not the Jira key.
- Bug files are numbered locally.
- A Jira key appears only if the project chooses to add one.

So even if outputs were committed, they would not be a reliable per-ticket source.

Limits:
- Only repos this account can read were searched.
- Reports are usually published as artifacts or kept on Drive, not committed.
- Files that were renamed or inlined would be missed.

**Takeaway:** GitHub cannot back up the backfill. Proof for tickets tested before the cut-over has to
come from the testers. See [Ask the skill owner and testers](03-ask-skill-owner-and-testers.md).
