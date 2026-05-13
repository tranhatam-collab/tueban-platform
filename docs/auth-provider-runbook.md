# Tueban Auth Provider Runbook

Updated: 2026-05-13

## Scope

This runbook covers Google OAuth and email magic-link auth for Tueban.
Apple Sign in is intentionally deferred.

## Public URLs

- `https://tueban.com/privacy/`
- `https://tueban.com/terms/`
- `https://tueban.com/support/`
- `https://tueban.com/contact/`
- `https://tueban.com/auth/`

## Google OAuth

Create a Google Cloud OAuth web client for `tueban.com`.

Authorized JavaScript origin:

```text
https://tueban.com
```

Authorized redirect URI:

```text
https://tueban-api.tranhatam.workers.dev/api/auth/google/callback
```

Required Worker secrets:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
MAGIC_LINK_BASE_URL
```

Recommended values:

```text
GOOGLE_REDIRECT_URI=https://tueban-api.tranhatam.workers.dev/api/auth/google/callback
MAGIC_LINK_BASE_URL=https://tueban.com
```

Optional domain lock:

```text
GOOGLE_ALLOWED_DOMAIN=
```

Leave `GOOGLE_ALLOWED_DOMAIN` unset for public Google login.

## Magic Link

Magic links use Resend for email delivery and D1 for one-time token storage.

Required D1 migration:

```sh
wrangler d1 migrations apply tueban-db
```

Required Worker secrets:

```text
RESEND_API_KEY
MAGIC_LINK_FROM_EMAIL
MAGIC_LINK_BASE_URL
```

Recommended value:

```text
MAGIC_LINK_BASE_URL=https://tueban.com
```

The API never returns raw magic-link tokens in JSON. Tokens are sent only through the configured email provider.

## API Routes

- `GET /api/auth/google/start`
- `GET /api/auth/google/start?redirect=1`
- `GET /api/auth/google/callback`
- `POST /api/auth/magic-link/request`
- `GET /api/auth/magic-link/verify`

When required secrets are missing, the API returns `501` with a `required_secrets` list.
This is intentional so staging/prod smoke tests do not fake provider readiness.

## Smoke Checks

After deploying Worker and Pages:

```sh
curl -sS https://tueban-api.tranhatam.workers.dev/api/auth/google/start
curl -sS -X POST https://tueban-api.tranhatam.workers.dev/api/auth/magic-link/request \
  -H 'content-type: application/json' \
  --data '{"email":"test@example.com"}'
curl -I https://tueban.com/privacy/
curl -I https://tueban.com/terms/
curl -I https://tueban.com/support/
curl -I https://tueban.com/contact/
curl -I https://tueban.com/auth/
```

Expected before secrets are loaded:

- Legal/auth pages return `200`.
- Auth API returns `501` with missing secret names.

Expected after secrets are loaded:

- Google start redirects to Google or returns an `auth_url`.
- Magic-link request returns `ok: true` and delivers email.
- Verify link sets an HTTP-only `tueban_session` cookie.
