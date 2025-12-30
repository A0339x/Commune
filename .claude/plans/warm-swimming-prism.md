# Security Audit: Wallet Verification & Connect Process

## Executive Summary

Comprehensive security audit of the Commune wallet authentication system. While the SIWE (EIP-4361) implementation uses proper cryptographic libraries (viem), there are **13 critical/high severity vulnerabilities** that require immediate attention.

---

## CRITICAL VULNERABILITIES (Fix Immediately)

### 1. Weak Nonce Generation - Math.random() is Predictable
**File:** `frontend/src/config/web3.js:166-169`
```javascript
export const generateNonce = () => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};
```
**Risk:** `Math.random()` is NOT cryptographically secure. Attackers can predict nonces and forge/replay signatures.

**Fix:**
```javascript
export const generateNonce = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
```

---

### 2. Hardcoded Session Secret Fallback
**File:** `api/src/index.js:28, 815`
```javascript
secret: 'CHANGE_THIS_TO_A_SECURE_SECRET_KEY', // Line 28
const secret = env.SESSION_SECRET || CONFIG.session.secret; // Line 815
```
**Risk:** If `SESSION_SECRET` env var is missing, anyone knowing this default can forge session tokens.

**Fix:** Add validation that rejects the default secret:
```javascript
const secret = env.SESSION_SECRET;
if (!secret || secret === 'CHANGE_THIS_TO_A_SECURE_SECRET_KEY') {
  throw new Error('SESSION_SECRET environment variable must be set');
}
```

---

### 3. No Nonce/Replay Attack Protection
**File:** `api/src/index.js:901-974`
**Risk:** SIWE messages can be replayed within the 15-minute expiration window. No server-side nonce tracking.

**Fix:** Track used nonces in KV:
```javascript
const nonceKey = `nonce:${siweMessage.nonce}`;
const existingNonce = await env.SESSIONS.get(nonceKey);
if (existingNonce) {
  return errorResponse('Nonce already used', 401, request);
}
await env.SESSIONS.put(nonceKey, 'used', { expirationTtl: 15 * 60 });
```

---

### 4. Hardcoded Test Wallet Bypass
**File:** `api/src/index.js:1597-1624`
```javascript
// TEMPORARY TEST: Hardcoded badge for testing UI - REMOVE AFTER TESTING
if (wallet === '0x81763a34db26e383c1144be34c3fb7c56f48bff3') {
  return jsonResponse({ primaryBadge: { emoji: '👑', name: 'Founding Member' }, ... });
}
```
**Risk:** Any request to `/api/reputation?wallet=0x81763...` returns fake Founding Member badge without any verification.

**Fix:** Remove this entire code block immediately.

---

### 5. Unauthenticated Sensitive Endpoints
**Files:** `api/src/index.js:976-1000, 1589-1700`

| Endpoint | Issue |
|----------|-------|
| `/api/balance?wallet=X` | Exposes exact token balance of ANY wallet |
| `/api/reputation?wallet=X` | Exposes badges, transaction analysis, buy/sell patterns |

**Risk:** Attackers can enumerate all wallets, identify whales, track selling behavior for targeted attacks.

**Fix:** Require session token authentication or remove wallet parameter (only return own data).

---

### 6. WebSocket Token in URL Query String
**File:** `api/src/index.js:2483`
```javascript
const token = url.searchParams.get('token');
```
**Risk:** Session tokens appear in browser history, server logs, Cloudflare logs, and referer headers.

**Fix:** Use Authorization header instead:
```javascript
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
```

---

### 7. SSRF via Unauthenticated Proxy Endpoint
**File:** `api/src/index.js:2224-2326`
```javascript
if (path === '/api/proxy' && method === 'GET') {
  const targetUrl = url.searchParams.get('url');
  // NO AUTHENTICATION - fetches ANY URL
```
**Risk:** Server-Side Request Forgery - attackers can access internal services, cloud metadata, port scan.

**Fix:** Either remove this endpoint or add authentication + URL whitelist.

---

## HIGH SEVERITY VULNERABILITIES

### 8. CORS Fallback Bypasses Security
**File:** `api/src/index.js:660-661`
```javascript
const allowedOrigin = CONFIG.cors.origins.includes(origin) ? origin : CONFIG.cors.origins[0];
```
**Risk:** Non-whitelisted origins get the first whitelisted origin in response, bypassing CORS.

**Fix:**
```javascript
if (!CONFIG.cors.origins.includes(origin)) {
  return new Response('Origin not allowed', { status: 403 });
}
```

---

### 9. Session Tokens in localStorage (XSS Vulnerable)
**File:** `frontend/src/App.jsx:6251`
```javascript
localStorage.setItem('commune_session', token);
```
**Risk:** Any XSS vulnerability in dependencies exposes all session tokens.

**Fix:** Use `sessionStorage` (clears on tab close) or HTTP-only cookies.

---

### 10. Balance Check Failure Allows WebSocket Access
**File:** `api/src/index.js:2502-2505`
```javascript
} catch (error) {
  // If balance check fails, allow connection (don't break on RPC issues)
  console.error('Balance recheck failed:', error);
}
```
**Risk:** If BSC RPC is down or times out, users who sold all tokens can still access chat.

**Fix:** Return 503 and deny access on RPC failure.

---

### 11. Durable Object Admin Endpoints Lack Auth
**File:** `api/src/ChatRoom.js:72-82`
```javascript
if (url.pathname === '/admin-delete') {
  return this.handleAdminDelete(request);  // NO AUTH CHECK
}
```
**Risk:** Direct requests to Durable Object bypass admin checks.

**Fix:** Add token verification inside Durable Object handlers.

---

## MEDIUM SEVERITY VULNERABILITIES

### 12. No Rate Limiting on Verification Endpoints
**Files:** `/api/verify`, `/api/balance`, `/api/reputation`, `/api/proxy`
**Risk:** Brute force attacks, DoS, enumeration attacks.

**Fix:** Implement Cloudflare rate limiting or per-IP tracking.

---

### 13. Session Token Missing issued-at (iat) Field
**File:** `api/src/index.js:816-824`
**Risk:** Cannot verify when token was created, only when it expires.

**Fix:** Add `iat: Date.now()` to token payload.

---

### 14. Error Messages Leak Implementation Details
**File:** `api/src/index.js:972, 2359`
```javascript
return errorResponse('Verification failed: ' + error.message, 500, request);
return errorResponse('BSCScan returned invalid JSON: ' + responseText.substring(0, 200), 500, request);
```
**Fix:** Return generic errors to clients, log details server-side.

---

### 15. Exposed WalletConnect Project ID
**File:** `frontend/src/config/web3.js:37`
```javascript
projectId: '0a4a7b9fe490e41d2ef562bc32e7e9be',
```
**Fix:** Move to environment variable: `import.meta.env.VITE_WALLETCONNECT_PROJECT_ID`

---

## LOW SEVERITY ISSUES

- Admin wallet hardcoded (privacy concern)
- Console.log statements in production
- Base64 token encoding exposes payload (privacy, not security)

---

## REMEDIATION PLAN

### Phase 1: Critical Fixes (Immediate)
| # | Task | File |
|---|------|------|
| 1 | Replace Math.random() with crypto.getRandomValues() | `frontend/src/config/web3.js` |
| 2 | Add SESSION_SECRET validation (reject default) | `api/src/index.js` |
| 3 | Implement nonce tracking in KV storage | `api/src/index.js` |
| 4 | Remove hardcoded test wallet bypass | `api/src/index.js:1597-1624` |
| 5 | Add auth to /api/balance and /api/reputation | `api/src/index.js` |
| 6 | Move WebSocket token to Authorization header | `api/src/index.js`, `frontend/src/App.jsx` |
| 7 | Remove or secure /api/proxy endpoint | `api/src/index.js` |

### Phase 2: High Priority (Within 24 hours)
| # | Task | File |
|---|------|------|
| 8 | Fix CORS fallback (reject instead of default) | `api/src/index.js` |
| 9 | Change localStorage to sessionStorage | `frontend/src/App.jsx` |
| 10 | Deny access on RPC failure instead of allow | `api/src/index.js` |
| 11 | Add auth to Durable Object admin endpoints | `api/src/ChatRoom.js` |

### Phase 3: Medium Priority (Within week)
| # | Task | File |
|---|------|------|
| 12 | Implement rate limiting on all endpoints | `api/src/index.js` |
| 13 | Add iat field to session tokens | `api/src/index.js` |
| 14 | Sanitize error messages | `api/src/index.js` |
| 15 | Move WalletConnect ID to env var | `frontend/src/config/web3.js` |

---

## Files to Modify

1. `frontend/src/config/web3.js` - Nonce generation, WalletConnect ID
2. `api/src/index.js` - Most fixes (verification, CORS, endpoints, tokens)
3. `api/src/ChatRoom.js` - Durable Object auth
4. `frontend/src/App.jsx` - WebSocket auth header, sessionStorage
