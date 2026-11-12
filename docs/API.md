# API notes — ASKC TECHNOLOGIES

The application retains existing `/api/auth` routes for compatibility. New corporate CMS endpoints are grouped under `/api/cms`; media endpoints are under `/api/media`.

## Public content

- `GET /api/cms/public/:type` — published records for `page`, `service`, `product`, `portfolio`, `industry`, `article`, `career`, `testimonial` or `site-setting`.

## Admin CMS

All routes below require a bearer JWT whose role is `admin` or `coadmin`.

- `GET /api/cms/:type` — list records for a content type.
- `GET /api/cms/audit-logs` — latest 100 CMS/media audit events.
- `POST /api/cms` — create a draft/published record.
- `PUT /api/cms/:id` — update a record.
- `DELETE /api/cms/:id` — archive a record (soft-delete).

Required create/update fields: `type`, `title`, `slug`. Optional fields: `summary`, `body`, `status`, `sortOrder`, `seo.title`, `seo.description`.

## Media library

All routes require an admin/co-admin bearer JWT.

- `GET /api/media` — list up to 200 media records.
- `POST /api/media` — multipart upload with `file` and optional `altText`.
- `DELETE /api/media/:id` — delete the Cloudinary asset and database record.

Accepted media: JPEG, PNG, WEBP, GIF and PDF; maximum 8 MB. File signatures are checked before upload. Cloudinary credentials must be configured server-side.

## Business enquiries

- `POST /api/auth/contact` — validates and stores an enquiry.
- `GET /api/auth/contacts` — admin/co-admin enquiry list.
- `PATCH /api/auth/contacts/:id/manage` — update status, internal notes and assignee.

SMTP notification is optional and only attempted when SMTP host, credentials, sender and notification recipient are configured. A stored enquiry remains successful even if notification email delivery fails.
