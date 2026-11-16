---
title: What Jira allows for each signal in REV and MICA2
labels: [wayfinder:research]
status: closed
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

## Resolution (16 Nov 2026, read-only research)

Both REV and MICA2 are team-managed (`style: next-gen`, `simplified: true`). None of the options costs anything.

- **Comment marker:** `comment ~ "retestskillmarker"` finds 8 tickets, all in OLS, and none in REV or MICA2.
  - A single lowercase word with nothing joining its parts is searched as one whole word, so it is found reliably.
  - Hyphens split a marker into separate words: `comment ~ "tc-to-e2e"` finds 0. `_`, `/` and `@` can split a marker the same way.
  - Search matches word roots, so a marker that is a real word can match other words.
  - Anyone can edit or delete a comment, which removes the signal.
  - Source: https://support.atlassian.com/jira-software-cloud/docs/search-for-work-items-using-the-text-field/
- **Label:** `labels = x` matches the whole label exactly, so hyphens are safe. One JQL query covers both projects.
  - Existing labels since 28 Oct 2026: MICA2 has only `EvMS-Demo-Feedback`. REV has `triage-*`, `exploratory`, `flaky-test` and `REV_label`. None of them relate to AI or e2e.
  - The research found no doc saying who can create a label. It is believed that anyone who can edit a ticket can, with no admin step. Not confirmed.
- **Custom field:** a team-managed project's own admin can add one, so no Jira admin is needed.
  - Each project would need its own field, with its own id. That adds complexity to the JQL.
  - Source: https://support.atlassian.com/jira-software-cloud/docs/what-are-team-managed-and-company-managed-projects/
- **GitHub commits on the ticket:** the GitHub integration is already on. `project in (REV, MICA2) AND development[commits].all > 0` finds 7 tickets (6 REV, 1 MICA2).
  - Any commit that names a ticket key counts, so this cannot tell a skill run apart from normal dev work.
  - Source: https://support.atlassian.com/jira-cloud-administration/docs/integrate-with-github/
- **Existing hints in REV and MICA2:**
  - `comment ~ "tc-to-e2e"` finds 0.
  - `comment ~ "playwright"` finds 2 tickets updated since 28 Oct.
  - Broader words (e2e, automation, helix) find 26 tickets. These words are too general to count on.

**Takeaway for the decision ticket:** a label such as `tc-to-e2e` is the strongest candidate. It is an exact match, needs one JQL query, and needs no admin. A comment marker of one word with nothing joining its parts is the fallback. Neither is in use today, so backfill cannot rely on Jira history.
