# ASKC TECHNOLOGIES — Render deployment

This repository uses separate frontend and backend Node.js applications. The backend package declares Node.js 22.x; use Node 22 for local and hosted builds.

## Render service configuration

For a single Render Web Service that serves the built frontend from the Express backend:

- **Root directory:** repository root
- **Runtime:** Node
- **Branch:** `main`
- **Build command:**

```bash
cd frontend && npm ci && npm run build && cd ../backend && npm ci
```

- **Start command:**

```bash
cd backend && npm start
```

- **Health check path:** `/api/health` (confirm the configured Render health-check path matches the backend route).

If the Render service is configured with a different root directory or separate frontend/backend services, adapt these commands to that service layout rather than copying them unchanged.

## Environment and secrets

Configure required values in Render's Environment settings, not in source control. Review `backend/server.js`, the authentication, payment, email, and storage modules to determine which integrations are enabled for the deployment.

At minimum, verify the production values for:

- MongoDB connection string
- JWT and session signing secrets
- Frontend/backend public origin and CORS allowlist
- Cashfree credentials and environment selection (sandbox vs production)
- Resend API key and verified sender
- Google OAuth credentials, only if Google sign-in is enabled
- Cloudinary credentials, if uploads use Cloudinary

Use long, unique secrets. Never paste credentials into GitHub issues, commits, or chat. Do not use example values in production. Keep test credentials separate from production credentials.

## Before deploying

1. Confirm the intended branch and latest commit.
2. Confirm all required Render environment variables are present.
3. Confirm MongoDB Atlas network access and database user permissions.
4. Confirm the configured frontend origin is included in the backend CORS allowlist.
5. Confirm the verified email sender and payment environment.
6. Deploy and inspect the complete Render build and runtime logs.

## Post-deployment verification

Run the read-only health check against the exact deployed HTTPS endpoint:

```bash
RENDER_HEALTH_URL=https://YOUR-SERVICE.onrender.com/api/health node backend/scripts/render-health-smoke.js
```

The script validates HTTP success and checks MongoDB status when the endpoint reports it. It does not prove login, payment, email, or refund flows work.

Other opt-in checks are documented in `docs/PRODUCTION-INTEGRATION-CHECKLIST.md`:

- Cashfree sandbox connectivity: creates and reads a ₹1 sandbox order; it does not complete a payment or refund.
- Resend delivery: sends one real test email to the mailbox you explicitly configure.
- MongoDB integration tests: use a dedicated disposable test database via `MONGODB_TEST_URI`; never point these tests at production.

## Important operational notes

- Render's local filesystem may be ephemeral. Use the configured cloud storage provider for user uploads; do not rely on local uploads surviving restarts or redeploys.
- Never run destructive integration tests against production databases.
- Verify backup/PITR configuration and perform restores only into a separate non-production target.
- A successful GitHub Actions build is not proof that Render, MongoDB Atlas, Cashfree, Resend, OAuth, or Cloudinary are correctly configured.
