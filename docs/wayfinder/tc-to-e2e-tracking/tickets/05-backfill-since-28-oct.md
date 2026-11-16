---
title: Decide how to backfill tickets tested from 28 Oct 2026 to the cut-over
labels: [wayfinder:grilling]
status: open
assignee:
blocked_by: [01-github-artifact-survey.md, 03-ask-skill-owner-and-testers.md]
---

## Question

Which tickets tested with tc-to-e2e between 28 Oct 2026 and the cut-over can be proven from a real
source? Options include GitHub artifacts, a tester's list, or Discord. Should those tickets be
retro-tagged in Jira with the chosen signal, or held as a frozen snapshot? The dashboard already does
the snapshot pattern with the `RETEST_SNAPSHOT_GZ` secret. Tickets with no proof must not be counted
(global rule 20).
