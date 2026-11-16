---
title: What Jira allows for each signal in REV and MICA2
labels: [wayfinder:research]
status: open
assignee:
blocked_by: []
---

## Question

For the Jira projects REV (team-managed / next-gen) and MICA2, what does each candidate signal need,
and can the dashboard read it reliably through the existing Jira proxy?

- Comment marker: does `comment ~ "<marker>"` JQL find a marker reliably, and what tokenisation
  pitfalls exist? Copy the helix `retestskillmarker` format.
- Label: can anyone with edit rights add a new label, and is it searchable with JQL?
- Custom field: who can create one in a team-managed project compared with a company-managed one,
  and does it cost anything?
- Remote link or GitHub development panel: can a GitHub commit that names a ticket key show up on the
  ticket, and can JQL query it (`development[commits]`)?

Also: do any REV or MICA2 tickets already carry a label, field or comment text that hints at
tc-to-e2e use since 28 Oct 2026? Give the JQL used and the hit counts only, no ticket content.
