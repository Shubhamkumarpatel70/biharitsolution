# ASKC TECHNOLOGIES

**Tagline:** We Build. You Grow.  
**Primary domain:** https://askctechnologies.in/

ASKC TECHNOLOGIES is the parent technology company. ASKC Web is the digital-solutions identity powered by ASKC TECHNOLOGIES.

## Current application

- React 18 frontend with React Router and Tailwind CSS
- Node.js / Express backend
- MongoDB with Mongoose
- Existing authentication retained for protected legacy account areas
- New role-protected corporate CMS API and admin editor
- Business enquiry form with server-side validation and persistent records
- Public corporate routes for About, Services, Products, Portfolio, Industries and Insights
- Responsive blue-and-white corporate design system

## Local setup

Requirements: Node.js 18 and MongoDB.

1. Copy `.env.example` to `backend/.env` and configure the required values.
2. Install dependencies:
   ```bash
   npm run install-all
   ```
3. Start the frontend and backend:
   ```bash
   npm run dev
   ```
4. Frontend: http://localhost:3000  
   Backend health: http://localhost:5000/api/health

## Production build

```bash
cd frontend
npm install
npm run build
```

The Express server serves the React build when `NODE_ENV=production`.

## CMS

Open `/admin-dashboard` and choose **Website CMS** from the Content section.

Supported content types: pages, services, products, portfolio, industries, articles, careers, testimonials and site settings.

- Draft content is not returned by public content endpoints.
- Published content is available from `GET /api/cms/public/:type`.
- Admin create/update operations require a valid bearer token and an admin or co-admin role.
- Archive is a soft-delete; records are retained.
- CMS create, update and archive operations are recorded in the audit log.

## Contact enquiries

The contact form posts to `POST /api/auth/contact`. The server validates required fields, email format and consent, applies field length limits, filters the honeypot field and stores enquiries in MongoDB. Admins can review submissions through the existing Contacts module.

## Environment variables

See `.env.example`. Never commit production credentials. Use separate development and production secrets. Configure SMTP and Cloudinary before enabling those integrations in production.

## Deployment notes

- Keep the existing Render service until the new branch has passed build and smoke tests.
- Configure `MONGO_URI`, `JWT_SECRET` and `SESSION_SECRET` in Render environment settings.
- Set the production domain and SSL for `askctechnologies.in`.
- Verify the health endpoint after deployment.
- Verify contact submission, CMS authentication, public published content and admin archive behavior.
- Back up MongoDB before any production migration.

## Known implementation work still required

- Complete integration of every public section with CMS content and per-page SEO fields.
- Cloudinary media library and secure upload workflows.
- SMTP notification delivery for contact and career submissions.
- Full admin role/permission matrix and richer audit-log viewer.
- Blog article detail routes, pagination, search and scheduled publishing.
- Automated unit, API and end-to-end tests.
- Final production build, mobile QA, accessibility audit and deployment smoke tests.

Do not publish unverified company facts, customer logos, testimonials, awards, metrics, addresses or project outcomes.
