# Deployment

A free live preview, in three parts:

| Part | Host (free plan) | Address |
|---|---|---|
| Web client | **Vercel** (Hobby) | `https://<project>.vercel.app` |
| API | **Render** (free web service, Docker) | `https://<service>.onrender.com` |
| Database | **MongoDB Atlas** (M0, 512 MB) | private connection string |

All three run in **Frankfurt**, so each request crosses as few kilometres as possible:
browser → Vercel → Render → Atlas.

**Why these three.**
- Vercel builds Next.js natively, including the `/api` relay and the per-page CSP.
- Render builds the API's existing Dockerfile and redeploys it from GitHub.
- Atlas M0 is free with no time limit.

None of them asks for a credit card. Render's free web services pause after 15 minutes without
traffic and take up to a minute to start again. The web client shows a "waking up" screen
meanwhile, and step 5 keeps the API awake during a review.

Budget about 30 minutes, most of it waiting for builds.

## What you need

- The GitHub repository (Vercel and Render ask for access to it when you sign in with GitHub).
- A terminal with `openssl`, in the repository (Linux, macOS, WSL or Git Bash).

## 1. Database: MongoDB Atlas

1. Create a free account at <https://www.mongodb.com/cloud/atlas/register>.
2. **Create a cluster:** choose **M0 (Free)**, provider **AWS**, region **Frankfurt
   (eu-central-1)**, name `ets-booking`.
3. **Database user** (*Security → Database Access → Add new database user*):
   - Authentication: password. Username `ets_api`; click *Autogenerate secure password* and
     keep the password.
   - Privileges: *Specific privileges* → `readWrite` on database `ets_booking`.
4. **Network access** (*Security → Network Access → Add IP address*): **Allow access from
   anywhere** (`0.0.0.0/0`). Render's free services have no fixed address. The database stays
   protected by the user's password and TLS.
5. **Connection string** (*Database → Connect → Drivers*): copy the `mongodb+srv://…` string.
   Put the password in it, and add `&serverSelectionTimeoutMS=5000` at the end:

   ```
   mongodb+srv://ets_api:<password>@ets-booking.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=ets-booking&serverSelectionTimeoutMS=5000
   ```

## 2. Secrets for the API

From the repository:

```bash
make deploy-secrets
```

It prints three lines: `JWT_PASSPHRASE`, `JWT_SECRET_KEY_BASE64` and `JWT_PUBLIC_KEY_BASE64`.
They are a fresh key pair that signs the session tokens. Keep them for step 3 and store them
nowhere else: nothing is written to disk. Passing the keys to Render means sessions survive the
API's restarts.

## 3. API: Render

1. Create an account at <https://render.com> with **GitHub**, and allow access to the
   repository.
2. **New → Blueprint**, pick the repository. Render reads [`render.yaml`](../render.yaml): one
   free Docker web service, `ets-booking-api`, in Frankfurt.
3. Fill in the values it asks for:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | the connection string from step 1 |
   | `JWT_PASSPHRASE`, `JWT_SECRET_KEY_BASE64`, `JWT_PUBLIC_KEY_BASE64` | the lines from step 2 |

   Render generates `APP_SECRET` and `API_PROXY_SECRET`. The rest is already in `render.yaml`:
   HTTPS-only cookie, timezone, demo data.
4. **Apply.** The first build takes 5 to 10 minutes. The deploy goes live once
   `/api/health` answers, which also proves the database connection works.
5. Check it: open `https://<service>.onrender.com/api/health`. You should see
   `{"status":"ok","checks":{"mongodb":"up"}}`. The API documentation is at `/api/doc`.
6. In the service's **Environment** tab, reveal and copy **`API_PROXY_SECRET`** for step 4.

The demo accounts and 30 upcoming sessions are created on the first start only.

## 4. Web client: Vercel

1. Create an account at <https://vercel.com/signup> with **GitHub**.
2. **Add New → Project**, import the repository.
3. **Root Directory:** `frontend`. Vercel detects Next.js; keep the default build settings.
4. **Environment Variables:**

   | Variable | Value |
   |---|---|
   | `API_INTERNAL_URL` | `https://<service>.onrender.com` (from step 3, no trailing slash) |
   | `API_PROXY_SECRET` | the value copied at the end of step 3 |
   | `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS` | `true` for a review, `false` otherwise |
   | `NEXT_PUBLIC_APP_TIMEZONE` | `Europe/Paris` |

5. **Deploy.** It takes about two minutes. [`frontend/vercel.json`](../frontend/vercel.json) runs
   the functions in Frankfurt, next to the API.
6. Open `https://<project>.vercel.app` and sign in with a demo account.

## 5. Optional: keep the API awake during a review

A free Render service pauses after 15 minutes without traffic. The first visitor after a pause
sees the "waking up" screen for up to a minute. To avoid that while reviewers are using the
preview, have a free uptime monitor call the API every 5 minutes:

1. Create a free account at <https://uptimerobot.com>.
2. **Add New Monitor:** type *HTTP(s)*, URL `https://<service>.onrender.com/api/health`,
   interval *5 minutes*.

Render's 750 free hours a month cover one service running all month. The monitor also sends an
email if the API goes down. Pause it once the review is over.

## Updating

Every push to `main` redeploys automatically:
- Render redeploys when `backend/` changes.
- Vercel redeploys when `frontend/` changes.
- Vercel also builds a preview of each pull request.

## Checks after a deployment

| Check | Expected |
|---|---|
| `https://<service>.onrender.com/api/health` | `200` with `"mongodb":"up"` |
| Sign in with `candidate@ets.test` / `Candidate123!` | "My reservations" with two bookings |
| Browser devtools → Application → Cookies | `ets_token`: `HttpOnly`, `Secure`, `SameSite=Strict`, path `/api` |
| Book a seat, then sign out and sign in again | The booking is kept; sign-out revokes the token |

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Render deploy fails its health check | `MONGODB_URI`: password, network access (`0.0.0.0/0`), or user privileges |
| Vercel pages load but sign-in fails with "service unavailable" | `API_INTERNAL_URL` wrong or has a trailing slash |
| Sign-in works but every visitor shares one rate limit | `API_PROXY_SECRET` differs between Vercel and Render |
| Everyone is signed out after each API restart | The `JWT_*` values are missing: without them, the API creates new keys on each start |
| The first page takes up to a minute | The free API was asleep (see step 5) |

## Going further

- **Custom domains:** Vercel and Render both add them for free, with HTTPS.
- **Paid plans remove the pause:** Render Starter keeps the API always on. Everything else stays
  the same.
- **Security settings:** the production checklist is in [SECURITY.md](SECURITY.md#production-checklist).
