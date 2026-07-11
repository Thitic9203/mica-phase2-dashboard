// Verify a Firebase ID token (a Google-signed RS256 JWT) at the edge, using only
// Web Crypto — no firebase-admin, no npm deps (Cloudflare Pages Functions runtime).
//
// Firebase ID tokens are documented here:
//   https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
// We check: RS256 signature against Google's public keys, aud === projectId,
// iss === https://securetoken.google.com/<projectId>, exp/iat within skew,
// email_verified === true, and email domain === allowedDomain.

const GOOGLE_JWK_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

// base64url -> Uint8Array
function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function b64urlToString(s) {
  return new TextDecoder().decode(b64urlToBytes(s))
}

// In-isolate JWK cache. Google rotates keys ~daily and advertises max-age; we
// honour it so we neither over-fetch nor serve stale keys past rotation.
let _jwkCache = { keys: null, exp: 0 }

async function defaultFetchKeys(now) {
  if (_jwkCache.keys && now < _jwkCache.exp) return _jwkCache.keys
  const res = await fetch(GOOGLE_JWK_URL)
  if (!res.ok) throw new Error(`JWK fetch failed: ${res.status}`)
  const data = await res.json()
  const cc = res.headers.get('Cache-Control') || ''
  const m = /max-age=(\d+)/.exec(cc)
  const ttl = m ? Number(m[1]) * 1000 : 60_000
  _jwkCache = { keys: data.keys, exp: now + ttl }
  return data.keys
}

// Returns { ok:true, email, uid } or { ok:false, reason }.
// opts.fetchKeys(now) is injectable for tests; opts.now for deterministic exp checks.
export async function verifyFirebaseIdToken(token, opts) {
  const { projectId, allowedDomain, now = Date.now(), fetchKeys = defaultFetchKeys, skewMs = 60_000 } = opts
  if (!token || typeof token !== 'string') return { ok: false, reason: 'missing token' }

  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'malformed token' }
  const [h, p, s] = parts

  let header, payload
  try {
    header = JSON.parse(b64urlToString(h))
    payload = JSON.parse(b64urlToString(p))
  } catch {
    return { ok: false, reason: 'undecodable token' }
  }

  if (header.alg !== 'RS256') return { ok: false, reason: 'wrong alg' }
  if (!header.kid) return { ok: false, reason: 'no kid' }

  let keys
  try { keys = await fetchKeys(now) } catch (e) { return { ok: false, reason: 'keys unavailable' } }
  const jwk = (keys || []).find(k => k.kid === header.kid)
  if (!jwk) return { ok: false, reason: 'unknown kid' }

  let valid = false
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    )
    valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`)
    )
  } catch {
    return { ok: false, reason: 'verify error' }
  }
  if (!valid) return { ok: false, reason: 'bad signature' }

  // Claims
  const sec = now / 1000
  if (payload.aud !== projectId) return { ok: false, reason: 'wrong aud' }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return { ok: false, reason: 'wrong iss' }
  if (typeof payload.exp !== 'number' || payload.exp <= sec - skewMs / 1000) return { ok: false, reason: 'expired' }
  if (typeof payload.iat !== 'number' || payload.iat > sec + skewMs / 1000) return { ok: false, reason: 'issued in future' }
  if (!payload.sub) return { ok: false, reason: 'no sub' }
  if (payload.email_verified !== true) return { ok: false, reason: 'email not verified' }
  const email = String(payload.email || '').toLowerCase()
  if (allowedDomain && !email.endsWith('@' + allowedDomain.toLowerCase())) return { ok: false, reason: 'domain not allowed' }

  return { ok: true, email, uid: payload.sub }
}
