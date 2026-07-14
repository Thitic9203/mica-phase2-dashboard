import { verifyFirebaseIdToken } from '../../_lib/firebase-auth.js'

const JIRA_BASE = 'https://skilllane.atlassian.net/rest/api/3'

// Callers must present a valid Firebase ID token from this project (the same
// Google Sign-In the UI uses), restricted to the company domain. Without this the
// proxy is an open, unauthenticated gateway to Jira using the server credential —
// anyone could `curl /api/jira/...`. These values are the public firebaseConfig
// from the client, safe to hardcode.
const FIREBASE_PROJECT_ID = 'pluton-dashboard'
const ALLOWED_DOMAIN = 'skilllane.com'

// Edge-cache tuning (ms). GET reads are served from Cloudflare's edge cache so
// repeated / concurrent refreshes don't each pay a full Jira round-trip.
//   age < FRESH_MS  → serve cached instantly
//   age < STALE_MS  → serve cached instantly + revalidate in the background (SWR)
//   otherwise       → fetch fresh from Jira
// Data changes slowly (auto-refresh is 5 min), so ≤30s staleness is invisible.
const FRESH_MS = 30_000
const STALE_MS = 120_000

// Auth is read from the Cloudflare Pages environment secret JIRA_AUTH.
// Set it in: Cloudflare Pages → Settings → Environment variables.
// Value: either the full header ("Basic <base64>") or just the base64 of "email:api_token".
// NEVER hardcode the token here — this repo is public.
export async function onRequest(context) {
  const { request, env } = context

  // The dashboard only ever reads (GET). Refuse write verbs so the shared
  // JIRA_AUTH credential can never be driven to mutate Jira through this proxy.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'GET, HEAD' },
    })
  }

  // Authenticate the caller before touching the cache or Jira.
  const authz = request.headers.get('Authorization') || ''
  const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  const verdict = await verifyFirebaseIdToken(idToken, {
    projectId: FIREBASE_PROJECT_ID,
    allowedDomain: ALLOWED_DOMAIN,
  })
  if (!verdict.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized', reason: verdict.reason }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const raw = env.JIRA_AUTH
  if (!raw) {
    return new Response(
      JSON.stringify({
        error: 'JIRA_AUTH is not configured. Set it in Cloudflare Pages → Settings → Environment variables (value: "Basic " + base64("email:api_token")).',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
  const authHeader = raw.startsWith('Basic ') ? raw : `Basic ${raw}`

  const url = new URL(request.url)
  // `_fresh=1` (manual refresh) bypasses the cache read but still refreshes the
  // shared entry. Strip it before building target/cacheKey so the key stays
  // canonical and shared with normal (auto-refresh) reads.
  const bypass = url.searchParams.get('_fresh') === '1'
  url.searchParams.delete('_fresh')
  const jiraPath = url.pathname.replace(/^\/api\/jira/, '')
  const target = `${JIRA_BASE}${jiraPath}${url.search}`

  // Fetch from Jira and (on success) store in the edge cache with a timestamp.
  async function fetchAndStore(cache, cacheKey) {
    const res = await fetch(target, {
      method: request.method,
      headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
    })
    const body = await res.text()
    // No Access-Control-Allow-Origin: the dashboard calls this from the same
    // origin (/api/jira), so it needs no CORS grant — and omitting it stops any
    // other website from reading Jira data through a visitor's browser.
    const headers = {
      'Content-Type': 'application/json',
    }
    if (cache && res.ok) {
      const stored = new Response(body, {
        status: res.status,
        headers: {
          ...headers,
          'X-Fetched-At': Date.now().toString(),
          // Keep the entry alive in the Cache API; freshness is managed via X-Fetched-At.
          'Cache-Control': 'public, max-age=300',
        },
      })
      context.waitUntil(cache.put(cacheKey, stored.clone()))
      return stored
    }
    return new Response(body, { status: res.status, headers })
  }

  // Only cache safe GET reads (search/jql, issue lookups). Everything else passes through.
  // Guard the Cache API: some runtimes (older wrangler dev) lack caches.default —
  // fall back to a plain fetch instead of throwing a 500.
  const cache = (typeof caches !== 'undefined' && caches.default) ? caches.default : null
  if (request.method === 'GET' && cache) {
    const cacheKey = new Request(target, { method: 'GET' })
    if (!bypass) {
      const hit = await cache.match(cacheKey)
      if (hit) {
        const age = Date.now() - Number(hit.headers.get('X-Fetched-At') || 0)
        if (age < FRESH_MS) return withStatus(hit, 'HIT-fresh')
        if (age < STALE_MS) {
          context.waitUntil(fetchAndStore(cache, cacheKey)) // revalidate behind the scenes
          return withStatus(hit, 'HIT-stale')
        }
      }
    }
    // Cache miss, expired, or manual force-fresh → hit Jira and refresh the shared entry.
    const fresh = await fetchAndStore(cache, cacheKey)
    return withStatus(fresh, bypass ? 'BYPASS' : 'MISS')
  }

  return fetchAndStore(null, null)
}

// Return a clone of the response tagged with the cache outcome (debug via X-Cache header).
function withStatus(res, status) {
  const h = new Headers(res.headers)
  h.set('X-Cache', status)
  h.delete('Access-Control-Allow-Origin')
  // The `max-age=300` on the stored entry is for the *edge* Cache API only (freshness
  // is managed here via X-Fetched-At). Never let the browser cache /api/jira, or a Jira
  // edit stays invisible on reload for up to 5 min. no-store → every reload revalidates
  // at the edge, so edits surface within the edge SWR window (≤120s) instead.
  h.set('Cache-Control', 'no-store')
  return new Response(res.body, { status: res.status, headers: h })
}
