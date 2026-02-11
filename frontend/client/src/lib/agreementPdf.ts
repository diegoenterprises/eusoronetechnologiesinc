/**
 * AGREEMENT PDF DOWNLOAD — EusoContract™
 * One-click .pdf file download using jsPDF.
 * Works for all roles: shipper, carrier, broker, escort, dispatch, etc.
 */

import { jsPDF } from "jspdf";

export interface AgreementPdfData {
  agreementNumber: string;
  agreementType: string;
  contractDuration?: string;
  status?: string;
  generatedContent: string;
  // Parties
  partyAName?: string;
  partyACompany?: string;
  partyARole?: string;
  partyBName?: string;
  partyBCompany?: string;
  partyBRole?: string;
  // Financial
  baseRate?: string | number;
  rateType?: string;
  paymentTermDays?: number;
  payFrequency?: string;
  fuelSurchargeType?: string;
  fuelSurchargeValue?: string | number;
  // Insurance
  minInsuranceAmount?: string | number;
  liabilityLimit?: string | number;
  cargoInsuranceRequired?: string | number;
  // Dates
  effectiveDate?: string;
  expirationDate?: string;
  // Equipment
  equipmentTypes?: string[];
  hazmatRequired?: boolean;
  // Lanes
  lanes?: any[];
  // Signatures
  signatures?: { signerName?: string; signatureRole?: string; signedAt?: string; signatureData?: string }[];
}

function fmt(t: string) {
  return t?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";
}

function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return d; }
}

function fmtCurrency(v?: string | number) {
  if (!v) return "—";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? String(v) : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Colors
const BLUE = [20, 115, 255] as const;
const DARK = [26, 26, 46] as const;
const MUTED = [120, 120, 140] as const;
const LIGHT_BG = [248, 250, 253] as const;
const LINE = [220, 225, 235] as const;

// Page geometry
const ML = 20; // margin left
const MR = 20; // margin right
const PW = 210; // A4 width mm
const CW = PW - ML - MR; // content width

function addPage(doc: jsPDF): number {
  doc.addPage();
  return 20;
}

function checkPage(doc: jsPDF, y: number, need: number): number {
  if (y + need > 275) return addPage(doc);
  return y;
}

/** Wrap text into lines that fit within maxWidth (mm) and return the lines */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export function downloadAgreementPdf(data: AgreementPdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 15;

  // ─── HEADER ───
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BLUE);
  doc.text("EUSOCONTRACT", PW / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${fmt(data.agreementType)} Agreement`, PW / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text(data.agreementNumber, PW / 2, y, { align: "center" });
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${data.status ? fmt(data.status) : "Draft"} · Generated via EusoTrip Platform`, PW / 2, y, { align: "center" });
  y += 4;

  // Divider
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.6);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // ─── PARTIES ───
  const halfW = (CW - 6) / 2;

  // Party A box
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(ML, y, halfW, 22, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.text(`${fmt(data.partyARole || "Party A")} (PARTY A)`, ML + 4, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(data.partyAName || "Party A", ML + 4, y + 11);
  if (data.partyACompany) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(data.partyACompany, ML + 4, y + 16);
  }

  // Party B box
  const bx = ML + halfW + 6;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(bx, y, halfW, 22, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.text(`${fmt(data.partyBRole || "Party B")} (PARTY B)`, bx + 4, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(data.partyBName || "Party B", bx + 4, y + 11);
  if (data.partyBCompany) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(data.partyBCompany, bx + 4, y + 16);
  }
  y += 28;

  // ─── KEY TERMS GRID (2 rows × 4 cols) ───
  const cols = 4;
  const cellW = CW / cols;
  const row1 = [
    { label: "BASE RATE", value: fmtCurrency(data.baseRate) },
    { label: "RATE TYPE", value: fmt(data.rateType || "flat") },
    { label: "PAYMENT TERMS", value: `Net ${data.paymentTermDays || 30} days` },
    { label: "DURATION", value: fmt(data.contractDuration || "—") },
  ];
  const row2 = [
    { label: "EFFECTIVE", value: fmtDate(data.effectiveDate) },
    { label: "EXPIRATION", value: fmtDate(data.expirationDate) },
    { label: "AUTO LIABILITY", value: fmtCurrency(data.minInsuranceAmount) },
    { label: "CARGO INS.", value: fmtCurrency(data.cargoInsuranceRequired) },
  ];

  for (const row of [row1, row2]) {
    y = checkPage(doc, y, 16);
    row.forEach((cell, i) => {
      const cx = ML + i * cellW;
      doc.setDrawColor(...LINE);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cx + 1, y, cellW - 2, 14, 1.5, 1.5, "FD");
      doc.setFontSize(6);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "bold");
      doc.text(cell.label, cx + 3, y + 4.5);
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      const valLines = wrapText(doc, cell.value, cellW - 6);
      doc.text(valLines[0] || "—", cx + 3, y + 10);
    });
    y += 17;
  }

  // ─── EXTRA DETAILS ───
  const extras: [string, string][] = [];
  if (data.liabilityLimit) extras.push(["Liability Limit", fmtCurrency(data.liabilityLimit)]);
  if (data.fuelSurchargeType && data.fuelSurchargeType !== "none") extras.push(["Fuel Surcharge", `${fmt(data.fuelSurchargeType)} — ${data.fuelSurchargeValue || "TBD"}`]);
  if (data.equipmentTypes?.length) extras.push(["Equipment", data.equipmentTypes.map(e => fmt(e)).join(", ")]);
  if (data.hazmatRequired) extras.push(["Hazmat Required", "YES"]);

  if (extras.length > 0) {
    y = checkPage(doc, y, 6 * extras.length + 4);
    for (const [label, value] of extras) {
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(label + ":", ML, y);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.text(value, ML + 40, y);
      y += 5;
    }
    y += 3;
  }

  // ─── LANES ───
  if (data.lanes && data.lanes.length > 0) {
    y = checkPage(doc, y, 20);
    doc.setFontSize(11);
    doc.setTextColor(...BLUE);
    doc.setFont("helvetica", "bold");
    doc.text("Lane Schedule", ML, y);
    y += 5;

    // Table header
    doc.setFillColor(240, 244, 255);
    doc.rect(ML, y, CW, 7, "F");
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text("Origin", ML + 2, y + 4.5);
    doc.text("Destination", ML + 50, y + 4.5);
    doc.text("Rate", ML + 110, y + 4.5);
    doc.text("Type", ML + 140, y + 4.5);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const l of data.lanes) {
      y = checkPage(doc, y, 7);
      doc.setTextColor(...DARK);
      doc.text(`${l.origin?.city || l.oC || "—"}, ${l.origin?.state || l.oS || ""}`, ML + 2, y);
      doc.text(`${l.destination?.city || l.dC || "—"}, ${l.destination?.state || l.dS || ""}`, ML + 50, y);
      doc.text(fmtCurrency(l.rate), ML + 110, y);
      doc.text(fmt(l.rateType || l.rt || "flat"), ML + 140, y);
      y += 6;
      doc.setDrawColor(...LINE);
      doc.line(ML, y - 2, PW - MR, y - 2);
    }
    y += 4;
  }

  // ─── AGREEMENT CONTENT ───
  y = checkPage(doc, y, 20);
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.text("Agreement Terms", ML, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");

  const content = data.generatedContent || "No content generated.";
  const contentLines = wrapText(doc, content, CW - 4);
  const lineH = 3.8;

  for (let i = 0; i < contentLines.length; i++) {
    y = checkPage(doc, y, lineH + 2);
    doc.text(contentLines[i], ML + 2, y);
    y += lineH;
  }
  y += 6;

  // ─── SIGNATURES ───
  y = checkPage(doc, y, 40);
  doc.setDrawColor(...LINE);
  doc.line(ML, y, PW - MR, y);
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.setFont("helvetica", "bold");
  doc.text("Signatures", ML, y);
  y += 8;

  if (data.signatures && data.signatures.length > 0) {
    for (const sig of data.signatures) {
      y = checkPage(doc, y, 25);
      if (sig.signatureData) {
        try { doc.addImage(sig.signatureData, "PNG", ML, y, 50, 15); } catch {}
      }
      y += 17;
      doc.setDrawColor(...DARK);
      doc.line(ML, y, ML + 70, y);
      y += 4;
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.text(sig.signerName || "—", ML, y);
      y += 4;
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(fmt(sig.signatureRole || ""), ML, y);
      doc.text(sig.signedAt ? fmtDate(sig.signedAt) : "Awaiting", ML + 40, y);
      y += 8;
    }
  } else {
    // Empty signature lines for both parties
    for (const party of [
      { name: data.partyAName || "Party A", role: data.partyARole || "Shipper" },
      { name: data.partyBName || "Party B", role: data.partyBRole || "Carrier" },
    ]) {
      y = checkPage(doc, y, 20);
      doc.setDrawColor(180, 180, 180);
      doc.line(ML, y + 12, ML + 70, y + 12);
      y += 16;
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.setFont("helvetica", "bold");
      doc.text(party.name, ML, y);
      y += 4;
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.text(fmt(party.role), ML, y);
      y += 8;
    }
  }

  // ─── FOOTER ───
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...BLUE);
    doc.rect(0, 294, PW, 3, "F");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("Generated on EusoTrip · Powered by EusoContract™ / ESANG AI™ · Gradient Ink™ Digital Signatures", PW / 2, 289, { align: "center" });
    doc.text(`E-SIGN Act (15 U.S.C. ch. 96) & UETA Compliant  ·  ${data.agreementNumber}  ·  Page ${p} of ${pages}`, PW / 2, 292, { align: "center" });
  }

  // ─── SAVE ───
  doc.save(`${data.agreementNumber}.pdf`);
}
