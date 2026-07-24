# Postmortem log

Bugs that reached production, why they got there, and the rule that stops the next one.
Newest first. Add an entry whenever a defect ships — the *why it wasn't caught* section is the point of the file.

---

## 2026-07-24 — "Epics Without Tickets" section duplicated on the Epic Breakdown tab

**Impact:** cosmetic, no data loss. The OLS system group showed the *Epics Without Tickets (1)* card three times over. Only affected long-lived tabs; a fresh page load always looked correct.

**Introduced by:** [`ca855ed`](https://github.com/Thitic9203/mica-phase2-dashboard/commit/ca855ed) *"Stats: exclude only Backlog …, surface no-epic tickets"* (2026-07-13) — the commit that added `renderNoEpicLists()`. Live for 11 days.

**Fixed by:** `Epic Breakdown: stop "Epics Without Tickets" duplicating on re-render` (2026-07-24).

### Root cause

`renderNoEpicLists()` styled its own section by borrowing the neighbouring section's style class:

```js
section.className = 'epic-empty-section epic-noepic-section'   // "Tickets Without Epic"
```

`renderEmptyEpicLists()` cleaned up its previous render with a **singular** selector on that same shared class:

```js
const old = group.querySelector('.epic-empty-section')   // first match in DOM order
if (old) old.remove()
```

`querySelector` returns the first match *in document order*, and both renderers `appendChild` to the same group, so DOM order flips as each one removes-and-re-appends. After a couple of passes the first match was the **no-epic** section: the cleanup deleted the wrong node and left its own previous section in place, then appended a fresh copy. Every subsequent re-render that hit that ordering added one more stale copy.

Re-renders come from `setInterval(loadAll, 5 * 60 * 1000)` and from the group-by dropdown (`reRenderAllEpics`), so duplicates accumulate the longer a tab stays open.

### Why it wasn't caught

- **Passes 1 and 2 are correct.** The bug needs ≥3 render passes, i.e. ~10 minutes of an idle open tab. Every manual check after deploy is a fresh load, which is always clean.
- **CSS gave no signal.** Sharing `.epic-empty-section` is legitimate for styling; nothing in the stylesheet hints that the class is also load-bearing for cleanup.
- **No error.** Wrong-node removal is silent — no exception, no console warning, no failed request.

### Fix

Each renderer cleans up **only its own** section, and removes **all** matches rather than the first:

```js
// renderEmptyEpicLists()
group.querySelectorAll('.epic-empty-section:not(.epic-noepic-section)').forEach(n => n.remove())

// renderNoEpicLists()
group.querySelectorAll('.epic-noepic-section').forEach(n => n.remove())
```

`querySelectorAll` also self-heals: a tab that already accumulated duplicates cleans itself on the next render instead of needing a reload.

### Same-shape audit (whole of `public/index.html`)

Every DOM insert/remove site and all 29 singular `querySelector` calls were reviewed:

| Site | Verdict |
|---|---|
| `renderEmptyEpicLists` / `renderNoEpicLists` | the bug — fixed |
| `container.querySelector('.tt-pgsz-menu')` ×2 (Blocked Tickets, Master Ticket) | same shape, not yet broken — one menu per container today. Hardened to `querySelectorAll`, matching the `.tt-dd-menu` sweep on the line above |
| `document.body.appendChild(backdrop / sheet)` (bottom sheet) | safe — IIFE runs once; `listEl.innerHTML = ''` precedes every populate |
| 9 × `document` / `window` `addEventListener` | safe — all behind init guards (`container._btInit`, `container._mtInit`, `host.dataset.built`, or inside `showApp()`); no listener stacking |
| other paired classes (`pt-td pt-td-status`, `tt-td tt-summary-cell`, `bs-item bs-item-sel`, `gb-item gb-item--selected`, …) | safe — style only, never used as a cleanup selector, and every owner re-renders through a whole-container `innerHTML =` |

### Rules taken from this

1. **A style class is not an identity.** The moment a second element borrows a class for looks, any singular-selector cleanup keyed on it targets the wrong node. Give the cleanup its own class, or exclude the other users with `:not(...)`.
2. **Use `querySelectorAll(...).forEach(n => n.remove())`, never `querySelector(...).remove()`,** for teardown. It is correct with one node and self-healing with several.
3. **Any `appendChild` into a long-lived container needs a scoped cleanup that runs first and removes all.** Containers rebuilt via `innerHTML =` are exempt — that already replaces everything.
4. **Test the second and third render, not just the first.** Accumulation bugs are invisible on a fresh load, which is exactly what a post-deploy check looks at.
