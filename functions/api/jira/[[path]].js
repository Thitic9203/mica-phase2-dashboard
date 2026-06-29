const JIRA_BASE = 'https://skilllane.atlassian.net/rest/api/3'

// Auth is read from the Cloudflare Pages environment secret JIRA_AUTH.
// Set it in: Cloudflare Pages → Settings → Environment variables.
// Value: either the full header ("Basic <base64>") or just the base64 of "email:api_token".
// NEVER hardcode the token here — this repo is public.
export async function onRequest(context) {
  const { request, env } = context

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
  const jiraPath = url.pathname.replace(/^\/api\/jira/, '')
  const target = `${JIRA_BASE}${jiraPath}${url.search}`

  const res = await fetch(target, {
    method: request.method,
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  })

  const body = await res.text()
  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
