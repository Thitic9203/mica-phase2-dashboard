import { verifyFirebaseIdToken } from '../_lib/firebase-auth.js'
import snapshot from '../_data/retest-snapshot.json'

// Frozen history of AI retest-skill usage (one row per recorded run, no personal
// names) for the "AI Skill Adoption Overview" tab. It lives under functions/ — not
// public/ — so it is only reachable through this authenticated endpoint; static
// files under public/ are served without the Firebase check.
// Same caller check as the Jira proxy (functions/api/jira/[[path]].js): a valid
// Firebase ID token from this project, restricted to the company domain.
const FIREBASE_PROJECT_ID = 'pluton-dashboard'
const ALLOWED_DOMAIN = 'skilllane.com'

const json = (body, status, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  })

export async function onRequest({ request }) {
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
  return json(snapshot, 200)
}
