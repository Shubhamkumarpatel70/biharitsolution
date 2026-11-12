# Deployment checklist

## Render environment

Set these variables in the Render service. Never put real values in GitHub.

Required:
- `NODE_ENV=production`
- `MONGO_URI`
- `JWT_SECRET` (long random secret)
- `SESSION_SECRET` (different long random secret)
- `CLIENT_URL=https://askctechnologies.in`

Optional integrations:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `CONTACT_NOTIFY_EMAIL`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Google OAuth values only if that sign-in feature is intentionally retained.

## Before deploying

1. Back up the production MongoDB database.
2. Confirm the Render service uses `MONGO_URI` (not the old `MONGODB_URI` key).
3. Confirm all required secrets are set; the server exits early in production if a required secret is missing.
4. Confirm `askctechnologies.in` DNS points to the intended Render service and SSL is active.
5. Deploy the approved branch only after CI and manual QA pass.
6. Verify `/api/health`, public routes, contact form, admin CMS authentication, archive behavior and media upload.
7. Confirm SMTP notifications only after a test email is actually received.
8. Keep a rollback target and database backup before changing production traffic.

## Current limitations

The source branch still requires complete end-to-end QA, career-application email notifications, full per-page SEO rendering, a complete admin permission matrix and final production smoke tests. Do not treat a successful frontend build alone as production sign-off.
