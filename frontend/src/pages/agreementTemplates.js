const CO = "ASKC DIGITAL WEB";
const LOGO = "/agreements/logo.jpeg";
const EMAIL = "support@askcweb.in";
const WEB = "www.askcweb.in";
const PHONE = "+91 62626 92632";

export const DOCUMENT_TYPES = [
  { id: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { id: "quotation", label: "Project Quotation / Proposal" },
  { id: "invoice", label: "Tax Invoice" },
  { id: "welcome", label: "Client Welcome Letter" },
  { id: "handover", label: "Project Handover Document" },
  { id: "change_request", label: "Change Request Form" },
  { id: "questionnaire", label: "Client Questionnaire" },
];

export function generateDocCode(clientName) {
  const initials = clientName.trim().replace(/[^a-zA-Z ]/g,'').split(' ').filter(Boolean).map(w=>w[0]).join('').substring(0,5).toUpperCase();
  const now = new Date();
  const mmyy = String(now.getMonth()+1).padStart(2,'0') + String(now.getFullYear()).slice(-2);
  const seq = Math.floor(100+Math.random()*900);
  return `ASKC-DOC-${initials}-${mmyy}-${seq}`;
}

const css = `*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',sans-serif;background:#cbd5e1;display:flex;justify-content:center;padding:30px 0;}
.page{width:210mm;min-height:297mm;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.15);display:flex;flex-direction:column;position:relative;}
header{height:125px;display:flex;align-items:center;justify-content:space-between;padding:0 45px;position:relative;overflow:hidden;}
.hbg{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;}
.hlogo{display:flex;align-items:center;gap:10px;z-index:10;}
.hlogo img{width:46px;height:46px;object-fit:contain;border-radius:6px;}
.hlogo h1{font-size:18px;color:#061d4b;font-weight:800;}
.hlogo p{font-size:9px;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
.htitle{text-align:right;z-index:2;}
.htitle p{font-size:11px;font-weight:700;letter-spacing:1px;color:#475569;text-transform:uppercase;}
.htitle h2{font-size:24px;font-weight:800;color:#061d4b;}
.content{padding:28px 45px;flex:1;}
.info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 18px;margin-bottom:18px;font-size:11.5px;}
.info-box strong{color:#061d4b;display:block;margin-bottom:3px;}
.sec-title{font-size:12px;font-weight:800;color:#061d4b;text-transform:uppercase;letter-spacing:.8px;margin:18px 0 10px;}
.clause{font-size:11px;line-height:1.7;margin-bottom:15px;text-align:justify;}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px;}
th{background:#061d4b;color:#fff;padding:9px 10px;text-align:left;}
td{padding:9px 10px;border-bottom:1px solid #e2e8f0;}
.total-box{margin-left:auto;width:270px;border:2px solid #061d4b;padding:13px;border-radius:8px;}
.tr{display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;}
.tr.grand{font-size:16px;font-weight:800;color:#165ebc;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:6px;}
.sig-block{display:flex;justify-content:space-between;margin-top:auto;padding-top:28px;}
.sig-col{width:44%;}
.sig-line{border-top:1px solid #334155;margin-top:45px;padding-top:4px;font-size:10px;font-weight:700;text-transform:uppercase;text-align:center;}
footer{background:#061d4b;padding:0 45px;height:58px;display:flex;align-items:center;justify-content:center;gap:35px;position:relative;margin-top:auto;}
footer::before{content:'';position:absolute;left:0;top:0;height:100%;width:200px;background:#334155;clip-path:polygon(0 0,100% 0,85% 100%,0 100%);}
.fi{display:flex;align-items:center;gap:7px;color:#e2e8f0;font-size:11px;z-index:2;}
.fi-brand{color:#fff;font-weight:800;font-size:12px;}
.dc{text-align:right;font-size:9px;color:#94a3b8;z-index:2;position:absolute;right:12px;bottom:4px;}
.chk{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #e2e8f0;font-size:11px;}
.chk span.ok{color:#16a34a;font-size:14px;}
@media print{body{background:transparent;padding:0;}.controls{display:none!important;}.page{box-shadow:none;}}`;

const head = (title) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title} - ${CO}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head>`;

const hdr = (sub,title) => `<header>
<svg class="hbg" viewBox="0 0 1000 125" preserveAspectRatio="none"><path d="M0,0 L1000,0 L1000,90 L0,115 Z" fill="#f8fafc"/><path d="M0,115 L1000,90 L1000,93 L0,118 Z" fill="rgba(6,29,75,0.07)"/></svg>
<div class="hlogo"><img src="${LOGO}" alt="Logo"><div><h1>${CO}</h1><p>Digital Excellence</p></div></div>
<div class="htitle"><p>${sub}</p><h2>${title}</h2></div></header>`;

const ftr = (docCode) => `<footer>
<div class="fi fi-brand">${CO}</div>
<div class="fi">✉ ${EMAIL}</div>
<div class="fi">🌐 ${WEB}</div>
<div class="dc">${docCode || ''}</div>
</footer>`;

const ctrl = (label) => `<div class="controls" style="position:fixed;top:18px;right:20px;z-index:1000;">
<button onclick="window.print()" style="background:#061d4b;color:#fff;border:none;padding:10px 22px;font-weight:700;border-radius:8px;cursor:pointer;font-size:13px;">🖨 ${label}</button></div>`;

const dcBadge = (docCode) => docCode ? `<div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:8px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;">Document Reference</span><span style="font-family:monospace;font-size:13px;font-weight:800;color:#061d4b;letter-spacing:1px;">${docCode}</span></div>` : '';

export function generateTemplate(type, data) {
  const today = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  switch(type) {
    case "nda": return tNDA({...data,today});
    case "quotation": return tQuotation({...data,today});
    case "invoice": return tInvoice({...data,today});
    case "welcome": return tWelcome({...data,today});
    case "handover": return tHandover({...data,today});
    case "change_request": return tChangeRequest({...data,today});
    case "questionnaire": return tQuestionnaire({...data,today});
    default: return "<p>Unknown template</p>";
  }
}

function tNDA({clientName,clientCompany,docCode,today}) {
  return `${head("Non-Disclosure Agreement")}<body>${ctrl("Print NDA")}
<div class="page">${hdr("Corporate Standard","NON-DISCLOSURE")}
<div class="content">
${dcBadge(docCode)}
<p style="text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;">Mutual Non-Disclosure Agreement</p>
<div class="clause">This Agreement is entered into on <strong>${today}</strong> between <strong>${clientName}${clientCompany?` (${clientCompany})`:''}</strong> ("Disclosing Party") and <strong>${CO}</strong> ("Receiving Party").</div>
<div class="clause"><strong>1. Confidential Information:</strong> Includes proprietary software ideas, algorithms, marketing strategies, business plans, financial records, client databases, and UI/UX structures disclosed during the project engagement.</div>
<div class="clause"><strong>2. Obligations:</strong> The Receiving Party agrees to: (a) hold all information in strictest confidence; (b) not disclose to any third party without written authorization; (c) use information exclusively for evaluating or executing web development services.</div>
<div class="clause"><strong>3. Exclusions:</strong> Obligations do not apply to information that is: (a) in the public domain; (b) already in possession; (c) independently developed; or (d) legally required by court order.</div>
<div class="clause"><strong>4. Return of Materials:</strong> Upon written request, all documentation containing Confidential Information shall be returned or destroyed promptly.</div>
<div class="clause"><strong>5. Governing Law:</strong> Obligations survive indefinitely beyond any service contract termination and are governed by applicable local jurisdictional legislations.</div>
<div class="sig-block">
<div class="sig-col"><p style="font-size:10px;margin-bottom:6px;"><strong>For Disclosing Party:</strong></p><p style="font-size:12px;font-weight:700;">${clientName}</p><div class="sig-line">Authorized Client Signature</div></div>
<div class="sig-col"><p style="font-size:10px;margin-bottom:6px;"><strong>For ${CO}:</strong></p><p style="font-size:12px;font-weight:700;">Shubham Kumar</p><div class="sig-line">Authorized Agency Signature</div></div>
</div></div>${ftr(docCode)}</div></body></html>`;
}

function tQuotation({clientName,clientCompany,docCode,projectDesc,designCost,devCost,infraCost,addonDesc,addonCost,validDays,today}) {
  const dc=parseFloat(designCost)||0, dv=parseFloat(devCost)||0, ic=parseFloat(infraCost)||0, ac=parseFloat(addonCost)||0;
  const sub=dc+dv+ic+ac, gst=sub*.18, tot=sub+gst;
  const fmt=(n)=>`₹ ${n.toFixed(2)}`;
  return `${head("Project Proposal")}<body>${ctrl("Print Proposal")}
<div class="page">${hdr("Official Estimate","PROJECT PROPOSAL")}
<div class="content">
${dcBadge(docCode)}
<div class="info-box" style="display:flex;justify-content:space-between;gap:20px;">
<div><strong>Prepared For:</strong>${clientName}${clientCompany?` — ${clientCompany}`:''}</div>
<div><strong>Prepared By:</strong>Shubham Kumar<br>Senior Web Engineer</div>
<div style="text-align:right"><strong>Date Issued:</strong>${today}<br><strong>Valid Until:</strong>${validDays||30} Days</div>
</div>
<div class="sec-title">Project Scope</div>
<div class="info-box" style="min-height:60px;"><p style="font-size:11px;line-height:1.7;">${projectDesc||'Complete web development project as discussed and agreed upon.'}</p></div>
<div class="sec-title">Investment Breakdown</div>
<table>
<tr><th style="width:18%">Phase</th><th style="width:57%">Description</th><th style="width:25%;text-align:right">Cost (₹)</th></tr>
<tr><td><strong>Design</strong></td><td>UI/UX Wireframing & Layout Architecture</td><td style="text-align:right">${dc>0?fmt(dc):'—'}</td></tr>
<tr><td><strong>Development</strong></td><td>Frontend Coding & Backend System Integration</td><td style="text-align:right">${dv>0?fmt(dv):'—'}</td></tr>
<tr><td><strong>Infrastructure</strong></td><td>Hosting Setup / Domain / SSL Security</td><td style="text-align:right">${ic>0?fmt(ic):'—'}</td></tr>
${addonDesc||ac>0?`<tr><td><strong>Add-ons</strong></td><td>${addonDesc||'Additional Services'}</td><td style="text-align:right">${ac>0?fmt(ac):'—'}</td></tr>`:''}
</table>
<div class="total-box">
<div class="tr"><span>Subtotal:</span><span>${fmt(sub)}</span></div>
<div class="tr"><span>GST (18%):</span><span>${fmt(gst)}</span></div>
<div class="tr grand"><span>Total:</span><span>${fmt(tot)}</span></div>
</div>
<p style="font-size:10px;margin-top:22px;color:#64748b;line-height:1.5;">*This is a professional scope projection. Final execution cost will be bound within the final Client Agreement. Acceptance enables drafting of the binding Master Service Agreement (MSA).</p>
<div style="margin-top:22px;text-align:center;"><span style="font-size:11px;font-weight:700;color:#061d4b;border-top:1px solid #cbd5e1;padding:8px 35px;display:inline-block;">Client Authorization Signature: _________________________</span></div>
</div>${ftr(docCode)}</div></body></html>`;
}

function tInvoice({clientName,clientCompany,docCode,serviceDesc,amount,gstRate,paymentNote,today}) {
  const invNo=`INV-${Date.now().toString().slice(-6)}`;
  const amt=parseFloat(amount)||0, gr=parseFloat(gstRate)||18;
  const gst=amt*gr/100, tot=amt+gst;
  const fmt=(n)=>`₹ ${n.toFixed(2)}`;
  return `${head("Tax Invoice")}<body>${ctrl("Print Invoice")}
<div class="page">${hdr("Official Document","TAX INVOICE")}
<div class="content">
${dcBadge(docCode)}
<div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:18px;">
<div class="info-box" style="flex:1"><strong>Bill To:</strong>${clientName}${clientCompany?`<br>${clientCompany}`:''}</div>
<div class="info-box" style="text-align:right;min-width:200px;"><strong>Invoice No:</strong><span style="color:#165ebc;font-weight:700;"> ${invNo}</span><br><strong>Date:</strong> ${today}<br><strong>Due:</strong> 7 Days from Issue</div>
</div>
<table>
<tr><th style="width:8%">#</th><th style="width:67%">Description of Services</th><th style="text-align:right;width:25%">Amount (₹)</th></tr>
<tr><td>1</td><td>${serviceDesc||'Web Development Services'}</td><td style="text-align:right">${fmt(amt)}</td></tr>
</table>
<div class="total-box">
<div class="tr"><span>Subtotal:</span><span>${fmt(amt)}</span></div>
<div class="tr"><span>GST (${gr}%):</span><span>${fmt(gst)}</span></div>
<div class="tr grand"><span>Total Due:</span><span>${fmt(tot)}</span></div>
</div>
<div style="margin-top:25px;font-size:11px;line-height:1.8;color:#475569;">
<strong style="color:#061d4b">Payment Details:</strong><br>
Account Name: ASKC Digital Web<br>
Bank: State Bank of India &nbsp;|&nbsp; UPI: support@askcweb<br>
${paymentNote?`<br><em>${paymentNote}</em>`:''}
</div>
</div>${ftr(docCode)}</div></body></html>`;
}

function tWelcome({clientName,clientCompany,docCode,today}) {
  return `${head("Welcome Letter")}<body>${ctrl("Print Letter")}
<div class="page">${hdr("Client Onboarding","WELCOME GUIDE")}
<div class="content">
${dcBadge(docCode)}
<div style="background:#f4f8fc;border-left:4px solid #165ebc;padding:18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
<h3 style="color:#061d4b;font-size:18px;font-weight:800;margin-bottom:6px;">Welcome Aboard, ${clientName}!</h3>
<p style="font-size:12px;line-height:1.7;">Thank you for choosing ${CO} as your official technology partner. We are excited to help bring your digital vision to life.</p>
</div>
<div class="sec-title">What Happens Next?</div>
${["Project Kickoff Call — We'll schedule an onboarding call to align on goals, milestones & communication channels.","Requirement Gathering — Our team collects detailed project requirements and delivers a comprehensive scope document.","Design & Development — Your project enters our engineering pipeline with regular progress updates.","Quality Assurance — Rigorous testing across all devices before final delivery."].map((s,i)=>`<div style="display:flex;gap:12px;margin-bottom:16px;"><div style="width:28px;height:28px;background:#061d4b;color:#fff;border-radius:50%;display:flex;justify-content:center;align-items:center;font-weight:800;font-size:12px;flex-shrink:0;">${i+1}</div><div style="font-size:11px;line-height:1.6;padding-top:4px;">${s}</div></div>`).join('')}
<div style="border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-top:20px;display:flex;justify-content:space-between;align-items:flex-start;">
<div>
<strong style="font-size:12px;color:#061d4b;display:block;margin-bottom:5px;">Your Dedicated Project Manager:</strong>
<p style="font-size:13px;font-weight:700;">Shubham Kumar</p>
<p style="font-size:11px;color:#64748b;margin-top:8px;">📧 ${EMAIL}<br>📞 ${PHONE}</p>
</div>
<div style="font-size:11px;color:#64748b;line-height:1.7;"><strong>Support Hours:</strong><br>Mon – Fri<br>10:00 AM – 6:00 PM IST</div>
</div>
<p style="font-size:10px;color:#94a3b8;margin-top:18px;text-align:center;">Issued: ${today}${clientCompany?` | ${clientCompany}`:''}</p>
</div>${ftr(docCode)}</div></body></html>`;
}

function tHandover({clientName,clientCompany,docCode,projectDesc,websiteUrl,adminUrl,hostingInfo,deliverables,today}) {
  const items = deliverables ? deliverables.split('\n').filter(Boolean) : ["Website / Application Source Code","Database Schema & Credentials","Hosting & Domain Access Credentials","Admin Panel Access","Documentation & User Manual","Training Session Completed"];
  return `${head("Handover Document")}<body>${ctrl("Print Handover")}
<div class="page">${hdr("Project Completion","HANDOVER DOCUMENT")}
<div class="content">
${dcBadge(docCode)}
<div class="info-box" style="display:flex;justify-content:space-between;gap:20px;">
<div><strong>Client:</strong>${clientName}${clientCompany?` — ${clientCompany}`:''}</div>
<div><strong>Handover Date:</strong>${today}</div>
</div>
${projectDesc?`<div class="sec-title">Project Summary</div><div class="info-box"><p style="font-size:11px;line-height:1.7;">${projectDesc}</p></div>`:''}
${websiteUrl||adminUrl||hostingInfo?`<div class="info-box" style="margin-bottom:14px;">
${websiteUrl?`<div style="margin-bottom:6px;font-size:11px;"><strong>Website URL:</strong> <a href="${websiteUrl}" style="color:#165ebc;">${websiteUrl}</a></div>`:''}
${adminUrl?`<div style="margin-bottom:6px;font-size:11px;"><strong>Admin Panel:</strong> <a href="${adminUrl}" style="color:#165ebc;">${adminUrl}</a></div>`:''}
${hostingInfo?`<div style="font-size:11px;"><strong>Hosting / Credentials:</strong> ${hostingInfo}</div>`:''}
</div>`:''}
<div class="sec-title">Deliverables Checklist</div>
${items.map(item=>`<div class="chk"><span class="ok">✓</span><span>${item}</span></div>`).join('')}
<div class="sig-block">
<div class="sig-col"><p style="font-size:10px;margin-bottom:5px;"><strong>Client Acceptance:</strong></p><p style="font-size:12px;">${clientName}</p><div class="sig-line">Client Signature & Date</div></div>
<div class="sig-col"><p style="font-size:10px;margin-bottom:5px;"><strong>Delivered By:</strong></p><p style="font-size:12px;">Shubham Kumar</p><div class="sig-line">Agency Authorized Signature</div></div>
</div></div>${ftr(docCode)}</div></body></html>`;
}

function tChangeRequest({clientName,clientCompany,docCode,projectDesc,timelineImpact,costImpact,crStatus,today}) {
  const crNo=`CR-${Date.now().toString().slice(-5)}`;
  return `${head("Change Request")}<body>${ctrl("Print CR")}
<div class="page">${hdr("Project Management","CHANGE REQUEST")}
<div class="content">
${dcBadge(docCode)}
<div class="info-box" style="display:flex;justify-content:space-between;gap:20px;">
<div><strong>Client:</strong>${clientName}${clientCompany?` — ${clientCompany}`:''}</div>
<div><strong>CR No:</strong>${crNo}</div>
<div><strong>Date:</strong>${today}</div>
<div><strong>Status:</strong><span style="color:#165ebc;font-weight:700;"> ${crStatus||'Pending Review'}</span></div>
</div>
<div class="sec-title">Change Description</div>
<div class="info-box" style="min-height:100px;"><p style="font-size:11px;line-height:1.7;">${projectDesc||'Description of the requested change.'}</p></div>
<table>
<tr><th style="width:28%">Category</th><th style="width:36%">Current State</th><th>Requested Change / Impact</th></tr>
<tr><td><strong>Scope</strong></td><td>As per original agreement</td><td>As described above</td></tr>
<tr><td><strong>Timeline Impact</strong></td><td>—</td><td>${timelineImpact||'To be assessed'}</td></tr>
<tr><td><strong>Cost Impact</strong></td><td>—</td><td>${costImpact||'To be quoted'}</td></tr>
</table>
<div class="sig-block">
<div class="sig-col"><p style="font-size:10px;margin-bottom:5px;"><strong>Requested By (Client):</strong></p><p style="font-size:12px;">${clientName}</p><div class="sig-line">Client Signature</div></div>
<div class="sig-col"><p style="font-size:10px;margin-bottom:5px;"><strong>Approved By (Agency):</strong></p><p style="font-size:12px;">Shubham Kumar</p><div class="sig-line">Agency Signature</div></div>
</div></div>${ftr(docCode)}</div></body></html>`;
}

function tQuestionnaire({clientName,clientCompany,docCode,q1,q2,q3,q4,q5,q6,q7,q8,today}) {
  const qs=[
    {q:"What is the primary goal of your website/application?",a:q1},
    {q:"Who is your target audience and what are their key characteristics?",a:q2},
    {q:"Do you have an existing website? If yes, what issues are you facing?",a:q3},
    {q:"What features/functionalities are must-haves for this project?",a:q4},
    {q:"Do you have brand guidelines (logo, colors, fonts)? Please share if available.",a:q5},
    {q:"What is your expected timeline for project completion?",a:q6},
    {q:"What is your estimated budget range for this project?",a:q7},
    {q:"Who are your main competitors? Share 2–3 website examples you admire.",a:q8},
  ];
  return `${head("Client Questionnaire")}<body>${ctrl("Print Form")}
<div class="page">${hdr("Client Onboarding","QUESTIONNAIRE")}
<div class="content">
${dcBadge(docCode)}
<div class="info-box" style="display:flex;justify-content:space-between;">
<div><strong>Client:</strong>${clientName}${clientCompany?` — ${clientCompany}`:''}</div>
<div><strong>Date:</strong>${today}</div>
</div>
<p style="font-size:11px;color:#64748b;margin-bottom:18px;line-height:1.6;">Please answer the following questions to help us understand your project requirements clearly.</p>
${qs.map((item,i)=>`<div style="margin-bottom:16px;">
<p style="font-size:11.5px;font-weight:700;color:#061d4b;margin-bottom:6px;">${i+1}. ${item.q}</p>
<div style="border:1px solid #e2e8f0;border-radius:4px;padding:10px;min-height:48px;font-size:11px;color:${item.a?'#334155':'#94a3b8'};line-height:1.6;">${item.a||'— Not provided —'}</div>
</div>`).join('')}
<div class="sig-block" style="margin-top:20px;">
<div class="sig-col"><p style="font-size:12px;">${clientName}</p><div class="sig-line">Client Signature & Date</div></div>
</div></div>${ftr(docCode)}</div></body></html>`;
}
