---
labels: [wayfinder:map]
title: Track which tickets were tested with the tc-to-e2e skill
status: open
---

# Track which tickets were tested with the tc-to-e2e skill

## Destination

A locked decision on how a REV (MiCA Revamp) or MICA2 ticket is marked as "tested with the tc-to-e2e skill":
what the signal is, who or what writes it, and how the dashboard reads it. Plus a way to backfill
tickets tested from 28 Oct 2026 (the day the skill was created) up to the cut-over. The result is
handed off as the spec for a new tc-to-e2e section in the dashboard's AI Skill Adoption tab.

## Notes

- Skill: https://github.com/makkawanc-skilllane/tc-to-e2e-skill (created 28 Oct 2026, last push 3 Nov 2026).
  As of that commit it writes nothing back to Jira: no comment, label, field or marker.
  Its outputs (Playwright specs, `evidence-<name>/index.html`, bug files) stay wherever the tester ran it.
- Jira projects in scope: `REV` (MiCA Revamp, id 10891) and `MICA2`, both team-managed (next-gen).
- Precedent: the helix retest skill appends `retestskillmarker` to its Jira comments, and the dashboard
  counts those with `comment ~ "retestskillmarker"` (`public/index.html`, `ruLoadLive`).
- Candidates to weigh: a marker at the end of a Jira comment, a Jira label, a Jira custom field,
  and a GitHub commit or spec that names the ticket key.
- The dashboard repo is public. Never put ticket content, people's names or private data here.
- Dashboard rules: every number comes from a real source (global rule 20); no spending (rule 3);
  changing someone else's repo, or creating Jira fields or labels, needs the owner's OK first (rule 23).
- Tracker: local markdown. Tickets are files under `tickets/`; front-matter `blocked_by` lists the
  blocking ticket files; `assignee` is the claim.
- The `grilling` and `domain-modeling` skills are not installed. Grilling tickets run as live Q&A with
  the owner through AskUserQuestion.

## Decisions so far

<!-- one line per closed ticket -->

- [What Jira allows for each signal in REV and MICA2](tickets/02-jira-signal-capabilities.md): a label is the strongest candidate (exact match, no admin, one JQL query); a comment marker of one unbroken word is the fallback; GitHub commit info cannot tell skill runs from dev work; no signal exists in Jira today.
- [Choose the tracking signal going forward](tickets/04-choose-tracking-signal.md): Jira label `tc-to-e2e`, added automatically by the skill; the dashboard reads `project in (REV, MICA2) AND labels = "tc-to-e2e"`.

## Not yet specified

- How the dashboard should count a ticket tested by both helix and tc-to-e2e: whether one ticket can
  count once per skill or only once in total, and how the existing totals change.
- Whether the skill author will accept adding the auto-label step, and when. Until then, no new
  tickets get the label.
- How to stop the signal from being forgotten or faked, for example a check, a reminder, or the skill
  doing it automatically.
- What "tested" means for counting: a full run with evidence, or any run, including failed or blocked
  ones.

## Out of scope

- Building the dashboard section itself. That work follows the SDD spec, plan and tasks once this map
  is done.
- Changing the tc-to-e2e skill repository. This map may only recommend a change for the owner to make.
