/**
 * Document Expiry Email Template — GAP-034
 * Branded email notification for expiring documents/certifications.
 */

export interface ExpiryEmailParams {
  recipientEmail: string;
  recipientName: string;
  alerts: {
    documentName: string;
    documentType: string;
    expiresAt: string;
    daysRemaining: number;
    severity: "critical" | "warning" | "info";
  }[];
}

/**
 * Send a consolidated document expiry email to a user.
 */
export async function notifyDocumentExpiry(params: ExpiryEmailParams): Promise<void> {
  const { emailWrap, emailService, p, btn, infoTable, infoRow, muted } = await loadEmailHelpers();

  const criticalCount = params.alerts.filter(a => a.severity === "critical").length;
  const subject = criticalCount > 0
    ? `[URGENT] ${criticalCount} Document(s) Expiring Within 7 Days — EusoTrip`
    : `Document Expiration Notice — ${params.alerts.length} Item(s) — EusoTrip`;

  const sevColor = criticalCount > 0 ? "#ef4444" : "#eab308";

  const alertRows = params.alerts
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map(a => {
      const color = a.severity === "critical" ? "#ef4444" : a.severity === "warning" ? "#f97316" : "#eab308";
      const label = a.daysRemaining <= 0 ? "EXPIRED" : `${a.daysRemaining} days`;
      return infoRow(
        a.documentName,
        `<span style="color:${color};font-weight:600">${label}</span> — expires ${a.expiresAt}`
      );
    })
    .join("");

  const html = emailWrap("Document Expiration Alert", `
    ${p(`Hello ${params.recipientName},`)}
    ${p(`The following <strong style="color:#E2E8F0">${params.alerts.length} document(s)</strong> are expiring soon or have already expired. Please review and renew them to maintain compliance.`)}
    <div style="margin:20px 0;padding:20px;background:rgba(${criticalCount > 0 ? "239,68,68" : "234,179,8"},0.08);border:1px solid rgba(${criticalCount > 0 ? "239,68,68" : "234,179,8"},0.25);border-radius:14px">
      <p style="margin:0 0 4px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px">Expiration Summary</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:${sevColor};letter-spacing:-0.2px">${params.alerts.length} Document${params.alerts.length > 1 ? "s" : ""} Require Attention</p>
    </div>
    ${infoTable(alertRows)}
    ${btn("https://eusotrip.com/documents", "Review Documents")}
    ${p(`<strong style="color:#E2E8F0">Why this matters:</strong>`)}
    <ul style="margin:0 0 16px;padding-left:20px;color:#94A3B8;font-size:14px;line-height:2">
      <li>Expired CDL or medical cards prevent legal operation of CMVs</li>
      <li>Lapsed insurance voids coverage and operating authority</li>
      <li>Missing hazmat endorsements result in immediate out-of-service orders</li>
    </ul>
    ${muted("This alert was generated automatically by EusoTrip's compliance monitoring system. You will receive follow-up alerts at 14, 7, and 1 day before expiration.")}
  `, sevColor);

  await emailService.send({
    to: params.recipientEmail,
    subject,
    html,
  });
}

async function loadEmailHelpers() {
  const notifications = await import("../notifications") as any;
  return {
    emailWrap: notifications.emailWrap || notifications.default?.emailWrap || ((title: string, body: string) => `<html><body><h1>${title}</h1>${body}</body></html>`),
    emailService: notifications.emailService || notifications.default?.emailService || { send: async () => {} },
    p: notifications.p || ((text: string) => `<p style="margin:0 0 14px;color:#94A3B8;font-size:15px;line-height:1.7">${text}</p>`),
    btn: notifications.btn || ((url: string, label: string) => `<a href="${url}" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${label}</a>`),
    infoTable: notifications.infoTable || ((rows: string) => `<table style="width:100%;margin:16px 0">${rows}</table>`),
    infoRow: notifications.infoRow || ((label: string, value: string) => `<tr><td style="padding:6px 0;color:#64748B;font-size:13px">${label}</td><td style="padding:6px 0;color:#CBD5E1;font-size:13px;text-align:right">${value}</td></tr>`),
    muted: notifications.muted || ((text: string) => `<p style="margin:12px 0 0;font-size:12px;color:#475569">${text}</p>`),
  };
}
