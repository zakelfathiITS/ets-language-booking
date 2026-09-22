# Security

How the application protects accounts, sessions and data, which trade-offs were made, and
what remains out of scope.

## Authentication and session

```
Browser ──(same origin)──▶ Next.js ── /api/* relay ──▶ Symfony API ──▶ MongoDB
          cookie ets_token            + X-Client-Ip
                                      + X-Proxy-Secret
```

- **Token:** an RS256 JWT carrying the user id (`sub`) and a unique id (`jti`), valid for one hour.
  The profile is not in the token, which would go stale after a profile update.
- **Where it lives:** in the `ets_token` cookie: `HttpOnly`, `SameSite=Strict`, `Secure`,
  `Path=/api`. Scripts cannot read it, so a script injected through XSS cannot steal it, and
  it is only sent with API calls. The login response body does not contain the token.
- **Why a relay:** the browser only ever talks to the web client's origin, which relays
  `/api/*` to the API (`frontend/src/lib/apiProxy.ts`). The cookie is therefore first-party
  even when the two applications are deployed on different domains. Browsers increasingly block
  third-party cookies, and Safari already does. The API needs no CORS at all: cross-origin
  calls get no `Access-Control-Allow-Origin` header.
- **CSRF:** `SameSite=Strict` keeps the cookie off requests started by other sites. Request
  bodies must also be JSON (form-encoded bodies get `415`), which an HTML form cannot send.
- **Other clients:** the API also accepts the token as `Authorization: Bearer <token>`, and
  Swagger UI (`/api/doc`) works with the cookie.
- **Restoring a session:** on start-up, the client asks `GET /api/me` who the cookie belongs to.
  The only thing kept in `localStorage` is a boolean hint (`ets.signedIn`). It spares visitors
  who never signed in a request that could only fail.
- **Signing out:** `POST /api/auth/logout` revokes the token and clears the cookie. The
  revoked `jti` is stored in MongoDB (`revoked_tokens`), where a TTL index deletes it once the
  token would have expired anyway. A cache pool would lose every revocation on restart.
  Signing out also works with an expired or missing token.
- **Expiry:** when the API rejects the token of a signed-in user (`token_expired`,
  `token_invalid`, `token_missing`), the client signs out and says the session has expired.

## Rate limiting

| Limiter | Counted per | Limit |
|---|---|---|
| Failed logins | client | 20 / minute |
| Failed logins | account (whatever the client) | 10 / 15 minutes |
| Failed logins | client and account | 5 / minute |
| Registration | client | 10 / hour |
| Booking | user | 20 / minute |
| Profile update | user | 10 / minute |

Over the limit, the API answers `429` with a `Retry-After` header. A successful login resets
the login counters.

**Visitor address.** Behind the relay, every request comes from the web client's server. The
relay therefore forwards the visitor's address in `X-Client-Ip`, together with a secret it
shares with the API (`API_PROXY_SECRET`). The API only trusts `X-Client-Ip` when the secret
matches (`ProxyClientIpListener`), so a caller cannot choose the address it is counted under.
The relay takes the address from `X-Forwarded-For`, which hosting platforms such as Vercel
overwrite. When self-hosting, put a reverse proxy in front of Next.js that does the same.

Limits are kept per instance (`cache.rate_limiter`). Running several API instances would need
a shared store such as Redis.

## Accounts

- **Passwords:** at least 12 characters (OWASP ASVS 2.1.1), with no composition rules. Passwords
  found in known breaches are rejected through Have I Been Pwned, using k-anonymity: only 5
  characters of the SHA-1 hash leave the server. Registration still works if that service is
  down. Hashing uses Symfony's `auto` algorithm, and hashes are upgraded on login when the
  algorithm or cost changes.
- **Enumeration at login:** an unknown email and a wrong password get the same answer
  (`invalid_credentials`), and take the same time: an unknown email still costs one password
  hash (`UserByEmailProvider`).
- **Enumeration at registration:** registering an existing email answers `409
  email_already_in_use`. Without email verification, a vague answer would leave legitimate users
  unsure whether their account exists. Rate limiting keeps the lookup slow.

## HTTP hardening

**Web client** (`frontend/src/proxy.ts`, `frontend/next.config.ts`):

- A Content Security Policy with a fresh nonce per page and `'strict-dynamic'`, so only scripts
  rendered by Next.js run.
  - `style-src` allows inline styles, which cannot run code (e.g. the width of a progress bar).
  - Development adds `'unsafe-eval'` and WebSockets for React's tooling and hot reload.
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'` and `form-action 'self'`.
- Other headers: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. There is no
  `X-Powered-By`.

**API** (`SecurityHeadersListener`, `Caddyfile`):

- JSON responses get `Content-Security-Policy: default-src 'none'` and `Cache-Control: no-store`
  (personal data). Swagger UI gets a policy that lets its bundled scripts run.
- All responses carry `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer` and `Cross-Origin-Resource-Policy: same-origin`.
- The `Server` and `X-Powered-By` headers are removed, by Caddy and again by the relay.
- Errors follow RFC 9457. Details of server errors are only shown in debug mode.
- The `Authorization` header is removed from access logs.

## Supply chain and secrets

- **CI:** `.github/workflows/security.yml` runs on every change and weekly:
  - gitleaks scans the whole history for secrets (`.gitleaks.toml` allows test fixtures and
    Symfony's development-only `APP_SECRET`)
  - `composer audit` and `npm audit` check the dependencies against published advisories
- **Committed secrets:** none. The committed defaults (`docker-compose.yml`, `.env.example`)
  only protect local containers and say so in their names. The JWT key pair is generated on
  first start and never committed.

## Production checklist

| Variable | Application | Value |
|---|---|---|
| `APP_SECRET` | API | random, 32+ bytes |
| `JWT_PASSPHRASE` | API | random; protects the private key |
| `JWT_SECRET_KEY_BASE64`, `JWT_PUBLIC_KEY_BASE64` | API | the key pair, kept across restarts (`make deploy-secrets`) |
| `AUTH_COOKIE_SECURE` | API | `1` (HTTPS only) |
| `API_PROXY_SECRET` | both | random, identical on both sides |
| `API_INTERNAL_URL` | web client | URL of the API as reached from the web client's server |
| `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | web client | `false` outside demos |

## Known limitations

- **No "sign out everywhere":** revocation is per token. Revoking all of a user's tokens would
  need a per-user token version checked on every request.
- **Email changes:** changing the email does not ask for the current password. There is no
  password reset by email, so this alone does not allow taking over an account.
- **Account lifecycle:** there is no email verification, password reset or password change.
  These are out of the scope of the specification.
- **Local stack:** it runs over plain HTTP, with `AUTH_COOKIE_SECURE=0`. Browsers ignore HSTS
  there.
