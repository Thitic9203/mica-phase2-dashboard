# Mica Phase 2 — MICA2 QA Dashboard

Real-time QA status dashboard for the **MICA2** Jira project ([board 180](https://skilllane.atlassian.net/jira/software/projects/MICA2/boards/180)), grouped by subsystem.

Built the same way as the OLS dashboard ([mica-ols-phase2](https://github.com/Thitic9203/mica-ols-phase2)): a single static HTML page + Cloudflare Pages Functions proxy. No build step, no dependencies.

> Live: `https://mica-phase2-dashboard.pages.dev/` (after Cloudflare Pages is connected — see Deploy below)

## What it tracks

Epics from four subsystems. OLS lives in its own Jira project (`OLS-*`); the other three are `MICA2-*`:

| System | What | Epics |
|--------|------|-------|
| **EvMS** | Evaluation / Exam Management | Exam Bank, Timetable, Grading, Report, Room Management, Create Exam (AI), Exam Room, Session, Result (9) |
| **ELMS** | Extended Learning Management | AI Integration, Google Docs/Meet/Drive/Connect (5) |
| **CBMS** | Credit Bank Management | Activation, Curriculum, Course, Credit Transfer (Learner/Staff), My Credit (6) |

Each epic shows a donut of its child tickets, grouped by **TC Status / Status / Ticket Details Status / Issue Type / QA Owner / Assignee**. A **Progress Tracker** tab rolls up per-system status, blocked tickets, and tickets with incomplete fields.

Tickets are pulled per epic with `parent = <EPIC-KEY>` (e.g. `parent = MICA2-630`). **Any unfilled value (TC Status, QA Owner, etc.) is shown as `Empty` and still counted normally** — keep epic links and fields up to date in Jira for accurate charts.

### Gotcha: custom-field ids differ per Jira project

`OLS` and `MICA2` are separate Jira projects, so the **same** logical field has a **different** `customfield_*` id in each. An issue only ever carries the id belonging to its own project.

| Field | OLS | MICA2 |
|---|---|---|
| TC Status | `cf[12128]` | `cf[11735]` |
| Ticket Detail Status | `cf[12127]` | `cf[12130]` |
| QA Owner | `cf[12120]` | `cf[11013]` |
| Remark | `cf[12121]` | `cf[11049]` |

Reading the wrong id **does not error** — Jira silently omits the field, so everything buckets as `Empty`, and a `cf[<wrong-id>] is EMPTY` drill-down matches *every* issue in that project and looks correct. The readers (`tcStatusValue`, `tdStatusValue`, `remarkValue`, `getQaOwnerUsers`) and the JQL builders (`tcStatusClause`, `tdStatusClause`, `qaOwnerClause`) each coalesce both ids. To confirm an id, call `getJiraIssue(key, fields: ["*all"], expand: "names")` and read the `names` map.

## Architecture

```
public/index.html              all-in-one app (HTML + CSS + vanilla JS, SVG charts)
public/_headers                cache-control: no-store
public/_redirects              note only (the Function handles /api/jira/*)
functions/api/jira/[[path]].js Jira REST v3 proxy — injects auth from env (NOT hardcoded)
functions/_lib/firebase-auth.js Firebase ID-token verifier (Web Crypto, no deps) used by the proxy
functions/__/auth/[[path]].js  Firebase auth proxy (pluton-dashboard)
```

- **Auth:** Google Sign-In via Firebase (`pluton-dashboard`), restricted to `skilllane.com` + email whitelist (shared with the OLS dashboard).
- **Proxy auth (server-side):** the Jira proxy is **not** an open endpoint. Every `/api/jira/*` request must carry `Authorization: Bearer <Firebase ID token>`; the proxy verifies the token's RS256 signature against Google's public keys and checks `aud`/`iss`/`exp`/`email_verified` and the `@skilllane.com` domain before using the `JIRA_AUTH` credential. It also refuses non-GET verbs and sends no CORS grant (same-origin only). The client attaches the token in `fetchIssues` via `getIdToken()`.
- **Data:** fetched client-side through the proxy; cached in memory; auto-refreshes every 30 minutes.

## Deploy (Cloudflare Pages — free tier)

1. **Connect the repo** to Cloudflare Pages. Build command: *none*. Build output directory: `public`.
2. **Set the Jira credential** — Pages → Settings → Environment variables → add **`JIRA_AUTH`**
   = `Basic <base64("your-email:your-jira-api-token")>` (or just the base64; the proxy adds `Basic `).
   Generate a token at <https://id.atlassian.com/manage-profile/security/api-tokens>.
   The token is **never** committed — it lives only in this env var.
3. **Whitelist access** — add team emails to the whitelist in `public/index.html` (or the shared Apps Script endpoint).
4. Open `https://mica-phase2-dashboard.pages.dev/`, sign in with a `skilllane.com` Google account, and confirm the EvMS/ELMS/CBMS epic cards load.

## Local dev

```bash
npx wrangler pages dev public   # needs JIRA_AUTH in env to proxy Jira
```

See [PLAN.md](PLAN.md) for the full build plan and decisions.
