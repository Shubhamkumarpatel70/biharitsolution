#!/usr/bin/env python3
"""Script to update auth.js with multiple email support."""

# Read the file
with open(r'd:\WORKING WEBSITES\CUSTM WEB\backend\routes\auth.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Check current state
if 'for (const normalizedEmail of emailList)' in content:
    print('Already updated - loop found')
    exit(0)

# Step 1: Replace just after the validation section
old = '''if (!normalizedMessage) {
        return res.status(400).json({ message: "Message is required." });
      }

      await NewsletterSubscriber.findOneAndUpdate(
        { email: normalizedEmail },
        { email: normalizedEmail, status: "subscribed" },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );'''

new_step1 = '''if (!normalizedMessage) {
        return res.status(400).json({ message: "Message is required." });
      }

      // Get site origin for unsubscribe links
      const siteOrigin = getPublicSiteOrigin();
      if (!siteOrigin) {
        return res.status(500).json({
          message:
            "Public site URL is not configured. Set CLIENT_URL or PUBLIC_SITE_URL on the server.",
        });
      }

      // Process each email
      let successCount = 0;
      const errors = [];

      for (const normalizedEmail of emailList) {
        try {
          // Update subscriber status
          await NewsletterSubscriber.findOneAndUpdate(
            { email: normalizedEmail },
            { email: normalizedEmail, status: "subscribed" },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          // Generate unsubscribe URL
          const unsubscribeUrl = siteOrigin.replace(/\\/$/, "") + "/unsubscribe-email?email=" + encodeURIComponent(normalizedEmail);

          // Build HTML
          const escapedSubject = normalizedSubject.replace(/&/g, "&amp;").replace(/</g, "<").replace(/>/g, ">");
          const escapedMessage = normalizedMessage.replace(/&/g, "&amp;").replace(/</g, "<").replace(/>/g, ">").replace(/\\n/g, "<br/>");

          const html = `<div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
            <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
              <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);">
                <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;font-weight:700;">ASKC Digital Web</div>
                <h2 style="margin:10px 0 0 0;font-size:22px;line-height:1.3;color:#ffffff;">${escapedSubject}</h2>
              </div>
              <div style="padding:24px;">
                <div style="font-size:15px;line-height:1.7;color:#334155;">${escapedMessage}</div>
                <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
                  <p style="font-size:12px;color:#64748b;margin:0 0 10px 0;">
                    You received this email because you have subscribed to updates from ASKC Digital Web.
                  </p>
                  <a href="${unsubscribeUrl}" style="display:inline-block;padding:10px 14px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;color:#0f172a;text-decoration:none;font-size:12px;font-weight:700;">
                    Unsubscribe
                  </a>
                </div>
              </div>
            </div>
            <p style="max-width:620px;margin:12px auto 0 auto;font-size:11px;color:#94a3b8;text-align:center;">
              Need help? Contact support@askcweb.in
            </p>
          </div>`;

          await sendEmail(normalizedEmail, normalizedSubject, normalizedMessage, html, "ASKC Digital Web <info@askcweb.in>");

          successCount++;
        } catch (emailErr) {
          console.error("Error sending to " + normalizedEmail + ":", emailErr);
          errors.push(normalizedEmail);
        }
      }

      if (successCount === 0) {
        return res.status(500).json({ message: "Could not send promotional emails." });
      }

      if (errors.length > 0) {
        res.json({ message: "Email sent to " + successCount + " recipient(s). Failed: " + errors.join(", "), successCount, failedEmails: errors });
      } else {
        res.json({ message: "Promotional email sent to " + successCount + " recipient(s) successfully." });
      }'''

if old in content:
    new_content = content.replace(old, new_step1)
    with open(r'd:\WORKING WEBSITES\CUSTM WEB\backend\routes\auth.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Step 1 replaced!')
else:
    print('Old code not found')
