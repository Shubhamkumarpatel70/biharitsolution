const BASE_LOGO_URL = "/agreements/logo.jpeg";
const COMPANY_NAME = "ASKC DIGITAL WEB";
const COMPANY_EMAIL = "support@askcweb.in";
const COMPANY_WEB = "www.askcweb.in";
const COMPANY_PHONE = "+91 62626 92632";
const COMPANY_ADDRESS = "Bihar IT Solution, Main Road, Near City Center, Patna, Bihar - 800001";

const baseHead = (title) => `
<head>
<meta charset="UTF-8">
<title>${title} - ${COMPANY_NAME}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--blue:#165ebc;--dark:#061d4b;--light:#f4f8fc;--text:#334155;--gray:#475569;--border:#cbd5e1;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#cbd5e1;color:var(--text);display:flex;justify-content:center;padding:40px 0;}
.page{width:210mm;min-height:297mm;background:white;box-shadow:0 10px 30px rgba(0,0,0,0.15);display:flex;flex-direction:column;position:relative;}
.controls{position:fixed;top:20px;right:20px;z-index:1000;display:flex;gap:10px;}
.btn{padding:10px 22px;font-weight:700;border-radius:8px;cursor:pointer;border:none;font-size:14px;display:flex;align-items:center;gap:8px;}
.btn-primary{background:var(--dark);color:white;}
.btn-secondary{background:var(--blue);color:white;}
header{height:130px;display:flex;align-items:center;justify-content:space-between;padding:0 50px;position:relative;overflow:hidden;}
.hbg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;}
.hlogo{display:flex;align-items:center;gap:12px;z-index:10;}
.hlogo img{width:50px;height:50px;object-fit:contain;border-radius:8px;}
.hlogo h1{font-size:20px;color:var(--dark);font-weight:800;}
.hlogo p{font-size:10px;color:var(--gray);font-weight:600;text-transform:uppercase;}
.htitle{text-align:right;z-index:2;}
.htitle p{font-size:12px;font-weight:700;letter-spacing:1px;color:var(--gray);text-transform:uppercase;}
.htitle h2{font-size:26px;font-weight:800;color:var(--dark);}
.content{padding:30px 50px;flex:1;}
footer{height:60px;background:var(--dark);display:flex;align-items:center;justify-content:center;gap:40px;color:#e2e8f0;font-size:11px;position:relative;margin-top:auto;}
footer::before{content:"";position:absolute;left:0;top:0;height:100%;width:220px;background:#334155;clip-path:polygon(0 0,100% 0,85% 100%,0 100%);}
.fi{display:flex;align-items:center;gap:8px;z-index:2;}
.fi-brand{color:#fff;font-weight:800;font-size:13px;}
.clause{font-size:11.5px;line-height:1.7;margin-bottom:18px;text-align:justify;}
.clause strong{color:var(--dark);}
.sig-block{margin-top:auto;display:flex;justify-content:space-between;padding-top:30px;}
.sig-col{width:45%;}
.sig-line{border-top:1px solid var(--text);margin-top:50px;padding-top:5px;font-size:11px;font-weight:700;text-transform:uppercase;text-align:center;}
.info-box{background:var(--light);border:1px solid var(--border);border-radius:6px;padding:15px 20px;margin-bottom:20px;font-size:12px;}
.info-box strong{color:var(--dark);display:block;margin-bottom:4px;}
table{width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:20px;}
th{background:var(--dark);color:white;padding:10px;}
td{padding:10px;border-bottom:1px solid var(--border);}
@media print{body{background:transparent;padding:0;}.controls{display:none!important;}.page{box-shadow:none;}}
</style>
</head>`;

const headerHtml = (subtitle, titleLine) => `
<header>
  <svg class="hbg" viewBox="0 0 1000 130" preserveAspectRatio="none">
    <path d="M0,0 L1000,0 L1000,95 L0,120 Z" fill="#f8fafc"/>
    <path d="M0,120 L1000,95 L1000,98 L0,123 Z" fill="rgba(6,29,75,0.08)"/>
  </svg>
  <div class="hlogo">
    <img src="${BASE_LOGO_URL}" alt="Logo">
    <div><h1>${COMPANY_NAME}</h1><p>Digital Excellence</p></div>
  </div>
  <div class="htitle"><p>${subtitle}</p><h2>${titleLine}</h2></div>
</header>`;

const footerHtml = () => `
<footer>
  <div class="fi fi-brand">${COMPANY_NAME}</div>
  <div class="fi">✉ ${COMPANY_EMAIL}</div>
  <div class="fi">🌐 ${COMPANY_WEB}</div>
</footer>`;

export const DOCUMENT_TYPES = [
  { id: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { id: "quotation", label: "Project Quotation / Proposal" },
  { id: "invoice", label: "Tax Invoice" },
  { id: "welcome", label: "Client Welcome Letter" },
  { id: "handover", label: "Project Handover Document" },
  { id: "change_request", label: "Change Request Form" },
  { id: "questionnaire", label: "Client Questionnaire" },
];

export function generateTemplate(type, data) {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const { clientName, clientEmail, clientCompany, projectDesc, amount } = data;

  switch (type) {
    case "nda": return generateNDA({ clientName, clientCompany, today });
    case "quotation": return generateQuotation({ clientName, clientCompany, projectDesc, amount, today });
    case "invoice": return generateInvoice({ clientName, clientCompany, amount, today });
    case "welcome": return generateWelcome({ clientName, clientCompany, today });
    case "handover": return generateHandover({ clientName, clientCompany, projectDesc, today });
    case "change_request": return generateChangeRequest({ clientName, clientCompany, projectDesc, today });
    case "questionnaire": return generateQuestionnaire({ clientName, clientCompany, today });
    default: return "<p>Unknown template type</p>";
  }
}

function generateNDA({ clientName, clientCompany, today }) {
  return `<!DOCTYPE html><html lang="en">${baseHead("Non-Disclosure Agreement")}
<body>
<div class="controls">
  <button class="btn btn-primary" onclick="window.print()">🖨 Print NDA</button>
</div>
<div class="page">
  ${headerHtml("Corporate Standard", "NON-DISCLOSURE")}
  <div class="content">
    <p style="text-align:center;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:25px;">Mutual Non-Disclosure Agreement (NDA)</p>
    <div class="clause">This Mutual Non-Disclosure Agreement is entered into on <strong>${today}</strong> by and between <strong>${clientName}${clientCompany ? ` (${clientCompany})` : ""}</strong> ("Disclosing Party"), and <strong>ASKC DIGITAL WEB</strong> ("Receiving Party"), collectively referred to as the "Parties".</div>
    <div class="clause"><strong>1. Scope of Confidential Information:</strong> "Confidential Information" includes proprietary software ideas, technical algorithms, marketing strategies, business plans, financial records, client databases, and any UI/UX structures disclosed by the Disclosing Party to the Receiving Party during the project engagement.</div>
    <div class="clause"><strong>2. Obligations of the Receiving Party:</strong> The Receiving Party agrees to: (a) hold the Confidential Information in the strictest confidence; (b) not disclose it to any third-party entity without prior written authorization; and (c) use the Confidential Information exclusively for the purpose of evaluating or executing web development services for the Disclosing Party.</div>
    <div class="clause"><strong>3. Exclusions from Confidentiality:</strong> Obligations shall not apply to information that: (a) becomes part of the public domain through no fault of the Receiving Party; (b) was rightfully in their possession prior to disclosure; (c) is independently developed; or (d) is legally mandated by court order.</div>
    <div class="clause"><strong>4. Return or Destruction of Materials:</strong> Upon written request, the Receiving Party shall return or destroy all documentation containing Confidential Information.</div>
    <div class="clause"><strong>5. Survivability &amp; Governing Law:</strong> The non-disclosure obligations shall survive indefinitely beyond the termination of any resulting service contracts. This Agreement shall be governed by applicable local jurisdictional legislations.</div>
    <div class="sig-block">
      <div class="sig-col">
        <div style="font-size:11px;margin-bottom:8px;"><strong>For Disclosing Party:</strong></div>
        <p style="font-size:13px;font-weight:700;">${clientName}</p>
        <div class="sig-line">Authorized Client Signature</div>
      </div>
      <div class="sig-col">
        <div style="font-size:11px;margin-bottom:8px;"><strong>For ${COMPANY_NAME}:</strong></div>
        <p style="font-size:13px;font-weight:700;">Shubham Kumar</p>
        <div class="sig-line">Authorized Agency Signature</div>
      </div>
    </div>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}

function generateQuotation({ clientName, clientCompany, projectDesc, amount, today }) {
  const amt = parseFloat(amount) || 0;
  const gst = amt * 0.18;
  const total = amt + gst;
  return `<!DOCTYPE html><html lang="en">${baseHead("Project Quotation")}
<body>
<div class="controls"><button class="btn btn-secondary" onclick="window.print()">🖨 Print Quotation</button></div>
<div class="page">
  ${headerHtml("Official Estimate", "PROJECT PROPOSAL")}
  <div class="content">
    <div class="info-box" style="display:flex;justify-content:space-between;">
      <div><strong>Prepared For:</strong>${clientName}${clientCompany ? ` — ${clientCompany}` : ""}</div>
      <div><strong>Prepared By:</strong> Shubham Kumar, Senior Web Engineer</div>
      <div style="text-align:right;"><strong>Date Issued:</strong> ${today}<br><strong>Valid Until:</strong> 30 Days</div>
    </div>
    <p style="font-size:13px;font-weight:700;color:var(--dark);text-transform:uppercase;margin-bottom:12px;">Project Scope</p>
    <div class="info-box"><p style="font-size:12px;line-height:1.7;">${projectDesc || "Complete web development project as discussed and agreed upon with the client."}</p></div>
    <p style="font-size:13px;font-weight:700;color:var(--dark);text-transform:uppercase;margin:20px 0 12px;">Investment Breakdown</p>
    <table>
      <tr><th style="width:15%">Phase</th><th style="width:60%">Description</th><th style="width:25%;text-align:right">Cost (₹)</th></tr>
      <tr><td><strong>Design</strong></td><td>UI/UX Wireframing &amp; Layout Architecture</td><td style="text-align:right">—</td></tr>
      <tr><td><strong>Development</strong></td><td>Frontend Coding &amp; Backend System Integration</td><td style="text-align:right">—</td></tr>
      <tr><td><strong>Infrastructure</strong></td><td>Hosting Setup / Domain / SSL Security</td><td style="text-align:right">—</td></tr>
    </table>
    <div style="margin-left:auto;width:280px;border:2px solid var(--dark);padding:15px;border-radius:8px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Subtotal:</span><span>₹ ${amt.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>GST (18%):</span><span>₹ ${gst.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800;color:var(--blue);border-top:1px solid var(--border);padding-top:10px;margin-top:8px;"><span>Total:</span><span>₹ ${total.toFixed(2)}</span></div>
    </div>
    <p style="font-size:11px;margin-top:25px;color:var(--gray);line-height:1.5;">*Disclaimer: This is a professional scope projection. The final execution cost will be bound within the final Client Agreement.</p>
    <div style="margin-top:25px;text-align:center;"><span style="font-size:12px;font-weight:700;color:var(--dark);border-top:1px solid var(--border);padding:10px 40px;display:inline-block;">Client Authorization Signature: _________________________</span></div>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}

function generateInvoice({ clientName, clientCompany, amount, today }) {
  const invNo = `INV-${Date.now().toString().slice(-6)}`;
  const amt = parseFloat(amount) || 0;
  const gst = amt * 0.18;
  const total = amt + gst;
  return `<!DOCTYPE html><html lang="en">${baseHead("Tax Invoice")}
<body>
<div class="controls"><button class="btn btn-primary" onclick="window.print()">🖨 Print Invoice</button></div>
<div class="page">
  ${headerHtml("Official Document", "TAX INVOICE")}
  <div class="content">
    <div style="display:flex;justify-content:space-between;margin-bottom:25px;">
      <div class="info-box" style="width:48%"><strong>Bill To:</strong><br>${clientName}${clientCompany ? `<br>${clientCompany}` : ""}</div>
      <div class="info-box" style="width:48%;text-align:right"><strong>Invoice No:</strong> ${invNo}<br><strong>Date:</strong> ${today}<br><strong>Due:</strong> 7 Days from Issue</div>
    </div>
    <table>
      <tr><th>#</th><th>Description</th><th style="text-align:right">Amount (₹)</th></tr>
      <tr><td>1</td><td>Web Development Services</td><td style="text-align:right">${amt.toFixed(2)}</td></tr>
    </table>
    <div style="margin-left:auto;width:280px;border:2px solid var(--dark);padding:15px;border-radius:8px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Subtotal:</span><span>₹ ${amt.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>GST (18%):</span><span>₹ ${gst.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:800;color:var(--blue);border-top:1px solid var(--border);padding-top:10px;margin-top:8px;"><span>Total Due:</span><span>₹ ${total.toFixed(2)}</span></div>
    </div>
    <div style="margin-top:30px;font-size:12px;line-height:1.8;color:var(--gray);">
      <strong style="color:var(--dark)">Payment Details:</strong><br>
      Account Name: ASKC Digital Web<br>
      Bank: State Bank of India | UPI: support@askcweb
    </div>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}

function generateWelcome({ clientName, clientCompany, today }) {
  return `<!DOCTYPE html><html lang="en">${baseHead("Welcome Letter")}
<body>
<div class="controls"><button class="btn btn-secondary" onclick="window.print()">🖨 Print Letter</button></div>
<div class="page">
  ${headerHtml("Client Onboarding", "WELCOME GUIDE")}
  <div class="content">
    <div style="background:var(--light);border-left:4px solid var(--blue);padding:20px;border-radius:0 8px 8px 0;margin-bottom:30px;">
      <h3 style="color:var(--dark);font-size:20px;font-weight:800;margin-bottom:8px;">Welcome Aboard, ${clientName}!</h3>
      <p style="font-size:13px;line-height:1.6;">Thank you for choosing ${COMPANY_NAME} as your official technology partner. We are incredibly excited to help bring your digital vision to life.</p>
    </div>
    <p style="font-size:13px;font-weight:800;color:var(--dark);text-transform:uppercase;margin-bottom:15px;">What Happens Next?</p>
    ${["Project Kickoff Call — We'll schedule an onboarding call to align on goals, milestones & communication channels.", "Requirement Gathering — Our team will collect detailed project requirements & deliver a comprehensive scope document.", "Design &amp; Development — Your project enters our engineering pipeline with regular progress updates.", "Quality Assurance — Rigorous testing across all devices before final delivery."].map((s, i) => `<div style="display:flex;gap:15px;margin-bottom:20px;"><div style="width:30px;height:30px;background:var(--dark);color:white;border-radius:50%;display:flex;justify-content:center;align-items:center;font-weight:800;flex-shrink:0;">${i + 1}</div><div style="font-size:12px;line-height:1.6;padding-top:4px;">${s}</div></div>`).join("")}
    <div style="border:1px solid var(--border);border-radius:8px;padding:20px;margin-top:25px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <strong style="font-size:13px;color:var(--dark);display:block;margin-bottom:6px;">Your Dedicated Project Manager:</strong>
        <p style="font-size:13px;font-weight:700;">Shubham Kumar</p>
        <p style="font-size:12px;color:var(--gray);margin-top:8px;">📧 ${COMPANY_EMAIL}<br>📞 ${COMPANY_PHONE}</p>
      </div>
      <div style="font-size:12px;color:var(--gray);line-height:1.7;">
        <strong>Support Hours:</strong><br>Mon – Fri<br>10:00 AM – 6:00 PM IST
      </div>
    </div>
    <p style="font-size:11px;color:var(--gray);margin-top:20px;text-align:center;">Issued: ${today} | ${COMPANY_ADDRESS}</p>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}

function generateHandover({ clientName, clientCompany, projectDesc, today }) {
  return `<!DOCTYPE html><html lang="en">${baseHead("Project Handover")}
<body>
<div class="controls"><button class="btn btn-primary" onclick="window.print()">🖨 Print Handover</button></div>
<div class="page">
  ${headerHtml("Project Completion", "HANDOVER DOCUMENT")}
  <div class="content">
    <div class="info-box" style="display:flex;justify-content:space-between;">
      <div><strong>Client:</strong> ${clientName}${clientCompany ? ` — ${clientCompany}` : ""}</div>
      <div><strong>Handover Date:</strong> ${today}</div>
    </div>
    <p style="font-size:13px;font-weight:800;color:var(--dark);text-transform:uppercase;margin-bottom:12px;">Project Summary</p>
    <div class="info-box"><p style="font-size:12px;line-height:1.7;">${projectDesc || "All deliverables have been completed and tested as per the agreed project scope."}</p></div>
    <p style="font-size:13px;font-weight:800;color:var(--dark);text-transform:uppercase;margin:20px 0 12px;">Deliverables Checklist</p>
    ${["Website / Application Source Code", "Database Schema &amp; Credentials", "Hosting &amp; Domain Access Credentials", "Admin Panel Access", "Documentation &amp; User Manual", "Training Session Completed"].map(item => `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:12px;"><span style="color:green;font-size:16px;">✓</span> ${item}</div>`).join("")}
    <div class="sig-block">
      <div class="sig-col"><div style="font-size:11px;margin-bottom:8px;"><strong>Client Acceptance:</strong></div><p style="font-size:12px;">${clientName}</p><div class="sig-line">Client Signature &amp; Date</div></div>
      <div class="sig-col"><div style="font-size:11px;margin-bottom:8px;"><strong>Delivered By:</strong></div><p style="font-size:12px;">Shubham Kumar</p><div class="sig-line">Agency Authorized Signature</div></div>
    </div>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}

function generateChangeRequest({ clientName, clientCompany, projectDesc, today }) {
  const reqNo = `CR-${Date.now().toString().slice(-5)}`;
  return `<!DOCTYPE html><html lang="en">${baseHead("Change Request")}
<body>
<div class="controls"><button class="btn btn-primary" onclick="window.print()">🖨 Print CR</button></div>
<div class="page">
  ${headerHtml("Project Management", "CHANGE REQUEST")}
  <div class="content">
    <div class="info-box" style="display:flex;justify-content:space-between;">
      <div><strong>Client:</strong> ${clientName}${clientCompany ? ` — ${clientCompany}` : ""}</div>
      <div><strong>CR No:</strong> ${reqNo}</div>
      <div><strong>Date:</strong> ${today}</div>
    </div>
    <p style="font-size:13px;font-weight:800;color:var(--dark);text-transform:uppercase;margin-bottom:12px;">Change Description</p>
    <div class="info-box" style="min-height:120px;"><p style="font-size:12px;line-height:1.7;">${projectDesc || "Description of the requested change to be filled in."}</p></div>
    <table>
      <tr><th>Category</th><th>Current State</th><th>Requested Change</th></tr>
      <tr><td style="font-weight:700;">Scope</td><td>As per original agreement</td><td>As described above</td></tr>
      <tr><td style="font-weight:700;">Timeline Impact</td><td>—</td><td>To be assessed</td></tr>
      <tr><td style="font-weight:700;">Cost Impact</td><td>—</td><td>To be quoted</td></tr>
    </table>
    <div class="sig-block">
      <div class="sig-col"><div style="font-size:11px;margin-bottom:8px;"><strong>Requested By (Client):</strong></div><p style="font-size:12px;">${clientName}</p><div class="sig-line">Client Signature</div></div>
      <div class="sig-col"><div style="font-size:11px;margin-bottom:8px;"><strong>Approved By (Agency):</strong></div><p style="font-size:12px;">Shubham Kumar</p><div class="sig-line">Agency Signature</div></div>
    </div>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}

function generateQuestionnaire({ clientName, clientCompany, today }) {
  const questions = [
    "What is the primary goal of your website/application?",
    "Who is your target audience and what are their key characteristics?",
    "Do you have an existing website? If yes, what issues are you facing?",
    "What features/functionalities are must-haves for this project?",
    "Do you have brand guidelines (logo, colors, fonts)? Please share if available.",
    "What is your expected timeline for project completion?",
    "What is your estimated budget range for this project?",
    "Who are your main competitors? Share 2–3 website examples you admire.",
  ];
  return `<!DOCTYPE html><html lang="en">${baseHead("Client Questionnaire")}
<body>
<div class="controls"><button class="btn btn-secondary" onclick="window.print()">🖨 Print Form</button></div>
<div class="page">
  ${headerHtml("Client Onboarding", "QUESTIONNAIRE")}
  <div class="content">
    <div class="info-box" style="display:flex;justify-content:space-between;">
      <div><strong>Client:</strong> ${clientName}${clientCompany ? ` — ${clientCompany}` : ""}</div>
      <div><strong>Date:</strong> ${today}</div>
    </div>
    <p style="font-size:12px;color:var(--gray);margin-bottom:20px;line-height:1.6;">Please answer the following questions to help us understand your project requirements clearly. Your responses will be used to create a tailored project plan.</p>
    ${questions.map((q, i) => `<div style="margin-bottom:20px;"><p style="font-size:12px;font-weight:700;color:var(--dark);margin-bottom:8px;">${i + 1}. ${q}</p><div style="border:1px solid var(--border);border-radius:4px;padding:10px;min-height:55px;font-size:12px;color:var(--gray);">_</div></div>`).join("")}
    <div class="sig-block">
      <div class="sig-col"><p style="font-size:12px;">${clientName}</p><div class="sig-line">Client Signature &amp; Date</div></div>
    </div>
  </div>
  ${footerHtml()}
</div>
</body></html>`;
}
