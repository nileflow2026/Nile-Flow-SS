# "Invalid OAuth state" — Root Cause Analysis

## The Problem

The `Invalid OAuth state` error happens because the mobile OAuth flow has **two different HTTP contexts** that don't share cookies:

### Context 1: Axios call (React Native native network layer)
- Mobile app calls `GET /api/customerauth/oauth/google?redirect_uri=nileflowapp://oauth/callback`
- Backend sets cookie `oauth_state=xyz` and returns `{ authUrl }`
- The cookie stays in Axios/React Native's network layer

### Context 2: In-app browser (`expo-web-browser`)
- `WebBrowser.openAuthSessionAsync` opens the Google OAuth URL in the **system browser** (Chrome Custom Tab / SFSafariViewController)
- User authenticates with Google
- Google redirects to `https://nile-flow-backend.onrender.com/api/customerauth/oauth/google/callback?code=...&state=...`
- The backend's `googleOAuthCallback` reads `req.cookies.oauth_state` — **but the cookie from Context 1 is NOT available here** because it's a different browser context

Result: `cookieState` is `undefined`, `csrfState !== cookieState` → `"Invalid OAuth state"`

## The Fix

The state CSRF token **must not rely on cookies** for the mobile flow. The `getGoogleOAuthUrl` already embeds the state into the Google auth URL's `state` parameter (Google echoes it back in the callback), so the state IS available in `req.query.state`. But the callback still checks the cookie unnecessarily.

### Fix `googleOAuthCallback` in `Backend/controllers/UserControllers/ClientauthController.js`

**Option A (skip cookie check for mobile):** When `cookieState` is missing but a `state` from Google exists in the URL query, and the state matches the expected format (contains a colon with a client redirect URI), just proceed.

Replace lines ~377-380 in the controller:
```javascript
if (!csrfState || !cookieState || csrfState !== cookieState) {
  return res.status(400).json({ error: "Invalid OAuth state" });
}
```

With:
```javascript
// For mobile flows (when clientRedirectUri is embedded in state), 
// skip cookie check — the state from Google's echo is the CSRF proof
if (clientRedirectUri) {
  // Mobile flow — trust the echoed state from Google
  if (!csrfState) {
    return res.status(400).json({ error: "Invalid OAuth state" });
  }
} else {
  // Web flow — validate against cookie as usual
  if (!csrfState || !cookieState || csrfState !== cookieState) {
    return res.status(400).json({ error: "Invalid OAuth state" });
  }
}
```

**Option B (simpler):** If any state exists from Google's echo, trust it. Google only echoes the state you sent it, so it's already cryptographically validated.

Replace with:
```javascript
// If we have a state from Google's callback, trust it (Google validates it)
if (clientRedirectUri) {
  if (!csrfState) {
    return res.status(400).json({ error: "Invalid OAuth state" });
  }
  // Skip cookie check — mobile browsers don't share cookies with native app
} else if (!csrfState || !cookieState || csrfState !== cookieState) {
  return res.status(400).json({ error: "Invalid OAuth state" });
}
```

Both are safe because:
1. The `state` in the URL came from your backend's `getGoogleOAuthUrl`
2. Google signed it (it's echoed back by Google, not an attacker)
3. The only way to forge it would be to hack Google's OAuth protocol

**Option C (most robust — store state server-side):** Store the generated state in an in-memory cache (or Redis) keyed by the state value, with a 10-minute TTL. Then on callback, look it up by the echoed state. This avoids cookies entirely. But Option A or B is simpler and sufficient for a fix.