---
title: Choose the tracking signal going forward
labels: [wayfinder:grilling]
status: closed
assignee: owner
blocked_by: [01-github-artifact-survey.md, 02-jira-signal-capabilities.md, 03-ask-skill-owner-and-testers.md]
---

## Question

Which signal marks a REV or MICA2 ticket as tested with tc-to-e2e from the cut-over date onward:
a comment marker, a label, a custom field, or a GitHub commit or spec that names the ticket? Who or
what writes it (the skill automatically, or the tester by hand), and what exact query does the
dashboard use to read it?

## Resolution (16 Nov 2026, decided by the owner)

- **Signal:** the Jira label `tc-to-e2e`, matched exactly. Basis: [What Jira allows for each signal](02-jira-signal-capabilities.md).
- **Writer:** the skill adds the label automatically after a run, so nobody has to remember to add it.
  The skill author has to make that change in the skill repo. That change is outside this map, which
  can only recommend it.
- **Dashboard query:** `project in (REV, MICA2) AND labels = "tc-to-e2e"`.
- The owner decided this before tickets 01 and 03 were resolved. Their findings now feed only the
  backfill ticket.
