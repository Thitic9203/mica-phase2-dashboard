export async function onRequest(context) {
  const url = new URL(context.request.url)
  const target = `https://pluton-dashboard.firebaseapp.com${url.pathname}${url.search}`
  const resp = await fetch(target, {
    method: context.request.method,
    headers: {
      'Accept': context.request.headers.get('Accept') || '*/*',
      'User-Agent': context.request.headers.get('User-Agent') || '',
    },
  })
  const headers = new Headers(resp.headers)
  headers.delete('x-frame-options')
  return new Response(resp.body, {
    status: resp.status,
    headers,
  })
}
