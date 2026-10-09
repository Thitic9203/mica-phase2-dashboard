import { verifyFirebaseIdToken } from '../_lib/firebase-auth.js'

// Frozen history of AI retest-skill usage (one row per recorded run, no personal
// names) for the "AI Skill Adoption Overview" tab. The data is NOT in this repo (the
// repo is public): it is the encrypted Pages secret RETEST_SNAPSHOT_GZ — base64 of a
// gzip'd compact JSON {generated, cutoff, skillCreated, cols, rows: [[...], ...]}.
// Update it with: wrangler pages secret put RETEST_SNAPSHOT_GZ --project-name mica-phase2-dashboard
// Same caller check as the Jira proxy (functions/api/jira/[[path]].js): a valid
// Firebase ID token from this project, restricted to the company domain.
const FIREBASE_PROJECT_ID = 'pluton-dashboard'
const ALLOWED_DOMAIN = 'skilllane.com'

const json = (body, status, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  })

let _snapshot = null
async function loadSnapshot(env) {
  if (_snapshot) return _snapshot
  const b64 = env.RETEST_SNAPSHOT_GZ
  if (!b64) throw new Error('RETEST_SNAPSHOT_GZ is not set')
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  const c = JSON.parse(await new Response(stream).text())
  const rows = c.rows.map(r => Object.fromEntries(c.cols.map((k, i) => [k, r[i]])))
  _snapshot = { generated: c.generated, cutoff: c.cutoff, skillCreated: c.skillCreated, rows }
  return _snapshot
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'Method not allowed' }, 405, { 'Allow': 'GET, HEAD' })
  }
  const authz = request.headers.get('Authorization') || ''
  const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  const verdict = await verifyFirebaseIdToken(idToken, {
    projectId: FIREBASE_PROJECT_ID,
    allowedDomain: ALLOWED_DOMAIN,
  })
  if (!verdict.ok) return json({ error: 'Unauthorized', reason: verdict.reason }, 401)
  // No Access-Control-Allow-Origin: same-origin only, like the Jira proxy.
  try {
    return json(await loadSnapshot(env), 200)
  } catch (e) {
    return json({ error: 'Snapshot unavailable' }, 500)
  }
}
