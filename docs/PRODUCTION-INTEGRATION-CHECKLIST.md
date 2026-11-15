# ASKC TECHNOLOGIES — production integration verification

This checklist distinguishes automated checks from provider/production checks. Never put secrets in source control, chat, issue comments, or CI logs.

## Required protected environment settings
- `MONGO_URI` (or `MONGODB_URI`): dedicated MongoDB database; use a separate non-production database for integration tests.
- `JWT_SECRET` and `SESSION_SECRET`: long, unique random values. Do not use development fallbacks in production.
- `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, and the Cashfree environment setting used by the backend: sandbox credentials for sandbox tests.
- `RESEND_API_KEY` and a verified sender identity/domain.
- Existing OAuth, Cloudinary, and frontend-origin settings required by the deployment.

## Automated checks
```sh
npm ci --prefix backend
npm test --prefix backend
npm run build --prefix frontend
```
The backend unit suite covers Mongo session-store behavior and cookie-authenticated CSRF origin enforcement. CI additionally runs dependency audit, syntax checks, duplicate-route checks, and the frontend production build.

## External integration checklist

### Cashfree sandbox
- [ ] Run `node backend/scripts/cashfree-sandbox-smoke.js` with sandbox-only `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY`; this creates a ₹1 test order but does not complete a payment.
- [ ] Use sandbox credentials in a protected test environment.
- [ ] Create a low-value sandbox order and verify server-side pricing.
- [ ] Complete payment; verify activation and coupon redemption exactly once.
- [ ] Replay a signed success webhook; verify idempotency.
- [ ] Test failed, pending, amount-mismatch, invalid-signature, and unknown-order events.
- [ ] Confirm webhook retries and delivery in Cashfree dashboard.

### MongoDB concurrency
- [ ] Run `MONGODB_TEST_URI="<dedicated-test-db-uri>" npm test --prefix backend` against a dedicated, disposable test database. The integration suite uses a random database name and drops only that temporary database.
- [ ] Use a dedicated Atlas test database with replica-set support.
- [ ] Race coupon reservations against a limited-use coupon; capacity must never be exceeded.
- [ ] Race initial-admin bootstrap attempts; only one may succeed.
- [ ] Verify sessions across separate app processes.
- [ ] Never run destructive tests against production.

### Refunds
- [ ] Confirm Cashfree refund API is enabled for the merchant account and original order is a verified Cashfree payment.
- [ ] Test partial/full sandbox refunds, retries, timeouts, and status polling.
- [ ] Mark a refund processed only after provider confirms terminal success.
- [ ] Manual/UPI payments require a separately verified bank/UPI reference.
- [ ] Reconcile provider refund ID, amount, order ID, and status before production payouts.

### Authentication, 2FA, and CSRF
- [ ] Test email/authenticator 2FA, expired challenges, invalid OTPs, and replay attempts.
- [ ] Verify challenge tokens cannot access authenticated endpoints.
- [ ] Verify single-device logout and logout-all behavior.
- [ ] Verify cookie-authenticated writes reject missing/untrusted Origin/Referer; safe methods and Bearer clients remain unaffected.

### Resend
- [ ] Run `RESEND_TEST_RECIPIENT="<mailbox-you-control>" node backend/scripts/resend-smoke.js` with a verified sender; confirm delivery in the mailbox and Resend dashboard.
- [ ] Verify sending domain and sender identity.
- [ ] Test registration OTP, password-reset OTP, transactional, and consented marketing emails.
- [ ] Verify delivery events, bounces, unsubscribe links, and suppression.

### Render production smoke test
- [ ] Run `RENDER_HEALTH_URL="https://<your-render-service>/<health-path>" node backend/scripts/render-health-smoke.js` after confirming the exact health path.
- [ ] Confirm intended branch and Node 22 runtime.
- [ ] Verify `/api/health` returns HTTP 200 and MongoDB is connected; do not expose credentials.
- [ ] Smoke-test login, 2FA, dashboard, manual payment, Cashfree checkout/webhook, and logout with test accounts.
- [ ] Review logs for startup, database, CORS/CSRF, and mail errors.

### Backup and recovery
- [ ] Confirm Atlas backup/PITR retention and permissions.
- [ ] Restore a recent backup into a separate temporary cluster/database.
- [ ] Verify user, subscription, payment, coupon, agreement, and session data.
- [ ] Record recovery time and restore point. Never restore over production during rehearsal.

## Important
A green GitHub Actions run does not prove Cashfree, Resend, real MongoDB concurrency, Render, or backup recovery has been exercised. These require provider credentials, dashboard access, a dedicated test database, and an approved restore target. Unit tests must never trigger real payments or refunds.
