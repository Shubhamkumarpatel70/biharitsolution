# Cloudinary image storage

All newly uploaded application images are sent from the backend to Cloudinary using signed server-side uploads. The API secret is never sent to the browser. MongoDB stores the returned Cloudinary HTTPS URL, not Base64 image payloads.

## Render environment variables

Add these three variables to the **backend web service** in Render (Environment):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Get the values from Cloudinary Console → Dashboard. Do not commit them to GitHub or put them in frontend environment variables. Save changes and redeploy the backend.

## Image folders

- `askc-technologies/founder`
- `askc-technologies/team`
- `askc-technologies/user-profiles` (legacy migration)
- `askc-technologies/id-cards`
- `askc-technologies/client-logos`
- `askc-technologies/projects`
- `askc-technologies/payment-proofs`
- `askc-technologies/agreements` (inline signature/document images)

Uploads accept JPG, PNG, WebP and GIF, up to 5 MB per image. Agreement HTML is scanned for embedded Base64 images and those images are replaced with Cloudinary URLs before saving.

## Move existing MongoDB images

After the backend has redeployed with all three Cloudinary variables:

1. Sign in as an admin.
2. Open Admin Dashboard → Team.
3. In **Cloudinary Image Migration**, select **Migrate existing images**.
4. Review the result message. If any records fail, correct the reported issue and run the migration again.

The migration covers Founder Profile, Team, Client Logos, Projects, Payment Proofs, ID Cards, User profile image fields and inline images in saved Agreements. It processes up to 1,000 legacy records per image field per run. Re-running it is safe: already migrated Cloudinary URLs are skipped.

The migration does not delete original Base64 records until each replacement URL has been successfully saved to MongoDB. Keep the Cloudinary account active and retain its credentials in Render.
