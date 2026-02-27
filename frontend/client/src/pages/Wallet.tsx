/**
 * EUSOWALLET - Digital Wallet & Fintech Infrastructure
 * 
 * Powered by Stripe Connect, Issuing & Treasury APIs
 * Features:
 * - Standalone digital wallet with real balance
 * - Send/receive money between platform users
 * - Physical debit card ordering ($5 fee → platform revenue)
 * - Bank account connections (ACH/wire)
 * - Escrow system for shippers → drivers payment on job completion
 * - Full transaction history with filtering
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus,
  CreditCard, DollarSign, Clock, Send, Landmark, Shield,
  Lock, ChevronRight, AlertTriangle, CheckCircle2, Ban,
  Building2, Users, Copy, Eye, EyeOff, RefreshCw,
  Smartphone, X, ArrowRight, Banknote, FileText, Receipt,
  Download, Search, Calendar, Filter, CheckCircle,
  CircleDollarSign, MailCheck, BrainCircuit, Scale, Droplets,
  ShieldCheck, Fuel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DatePicker from "@/components/DatePicker";
import { useAuth } from "@/_core/hooks/useAuth";
import { EUSOTRIP_LOGO_BASE64 } from "@/lib/logoBase64";

type WalletTab = "overview" | "invoices" | "send" | "cards" | "bank" | "escrow" | "history" | "terminal" | "eusoticket";

export default function Wallet() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [showBalance, setShowBalance] = useState(true);
  const [sendAmount, setSendAmount] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [cardOrderLoading, setCardOrderLoading] = useState(false);

  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [etFilter, setEtFilter] = useState<string>("all");
  const [etSubTab, setEtSubTab] = useState<"docs" | "billing" | "recon">("docs");
  const [walletReconPeriod, setWalletReconPeriod] = useState({
    start: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // ─── All hooks called unconditionally to keep React hook count stable ───
  const _t = trpc as any;
  const _noop = { data: null, isLoading: false, refetch: () => {} };

  const companyQuery = _t.companies.getCompanyProfile.useQuery();
  const profileQuery = _t.users.getProfile.useQuery();

  // EusoTicket queries — procedures confirmed to exist in rateSheet router
  const eusoTicketDocsQuery = _t.rateSheet.getEusoTicketDocuments.useQuery({ type: "all", limit: 50 });
  const platformFeeQuery = _t.rateSheet.getPlatformFeeSchedule.useQuery();
  const reconStatsQuery = _t.rateSheet.getStats.useQuery();
  const walletTicketReconQ = _t.rateSheet.reconcileTickets.useQuery(
    { periodStart: walletReconPeriod.start, periodEnd: walletReconPeriod.end },
    { enabled: activeTab === "eusoticket" && etSubTab === "recon" }
  );

  const balanceQuery = _t.wallet.getBalance.useQuery();
  const transactionsQuery = _t.wallet.getTransactions.useQuery({ limit: 50 });
  const cardsQuery = _t.wallet.getCards.useQuery();
  const bankQuery = _t.wallet.getBankAccounts.useQuery();
  const escrowQuery = _t.wallet.getEscrowHolds.useQuery();

  // Payments / Invoicing queries
  const paySummaryQuery = _t.payments.getSummary.useQuery();
  const invoicesQuery = _t.payments.getInvoices.useQuery({ status: invoiceFilter === "all" ? undefined : invoiceFilter });
  const receivablesQuery = _t.payments.getReceivables.useQuery();
  const receiptsQuery = _t.payments.getReceipts.useQuery();
  const payInvoiceMutation = _t.payments.pay.useMutation({ onSuccess: () => { setPayingInvoice(null); invoicesQuery.refetch?.(); paySummaryQuery.refetch?.(); balanceQuery.refetch(); } });
  const aiInsightsMutation = _t.esang.walletInsights.useMutation({ onSuccess: (data: any) => { setAiInsights(data); }, onError: (err: any) => { toast.error(err?.message || "AI insights temporarily unavailable"); } });
  const sendMoneyMutation = _t.wallet.sendMoney.useMutation();
  const orderCardMutation = _t.wallet.orderPhysicalCard.useMutation();
  const connectBankMutation = _t.wallet.initBankConnection.useMutation();
  const releaseEscrowMutation = _t.wallet.releaseEscrow.useMutation();
  const paySummary = paySummaryQuery.data;

  const balance = balanceQuery.data;
  const transactions = transactionsQuery.data || [];
  const cards = cardsQuery.data || [];
  const profile = profileQuery.data;
  const cardHolderName = (() => {
    if (profile?.firstName && profile?.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (profile?.firstName) return profile.firstName;
    if (cards[0]?.cardholderName) return cards[0].cardholderName;
    if (user?.name && user.name !== "User" && !["CATALYST","SHIPPER","BROKER","DRIVER","ADMIN","SUPER_ADMIN","Catalyst","Shipper","Broker","Driver"].includes(user.name)) return user.name;
    if (companyQuery.data?.name) return companyQuery.data.name;
    if (user?.email) {
      const local = user.email.split("@")[0];
      return local.split(/[._-]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
    return "Account Holder";
  })();
  const bankAccounts = bankQuery.data || [];
  const escrowHolds = escrowQuery.data || [];

  const filteredTransactions = transactions.filter((t: any) => {
    if (historyFilter === "all") return true;
    return t.type === historyFilter;
  });

  const handleSendMoney = async () => {
    if (!sendAmount || !sendRecipient) {
      toast.error("Enter recipient and amount");
      return;
    }
    setSendLoading(true);
    try {
      await sendMoneyMutation.mutateAsync({
        recipientEmail: sendRecipient,
        amount: parseFloat(sendAmount),
        note: sendNote,
      });
      toast.success(`$${sendAmount} sent to ${sendRecipient}`);
      setSendAmount(""); setSendRecipient(""); setSendNote("");
      balanceQuery.refetch();
      transactionsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Transfer failed. Please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  const handleOrderCard = async () => {
    setCardOrderLoading(true);
    try {
      await orderCardMutation.mutateAsync({});
      toast.success("Card ordered! Your EusoWallet debit card will arrive in 5-7 business days.");
      cardsQuery.refetch();
      balanceQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Card order failed. Please try again.");
    } finally {
      setCardOrderLoading(false);
    }
  };

  const handleConnectBank = async () => {
    try {
      const result = await connectBankMutation.mutateAsync({});
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      if (result?.clientSecret) {
        toast.success("Complete bank verification in the secure window.");
      } else {
        toast.success(result?.message || "Bank connection initiated. Follow the secure link to connect your account.");
      }
      bankQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Bank connection failed. Please try again.");
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      await releaseEscrowMutation.mutateAsync({ escrowId });
      toast.success("Escrow released! Payment sent to driver.");
      escrowQuery.refetch();
      balanceQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Escrow release failed. Please try again.");
    }
  };

  const handlePayInvoice = (invoiceId: string) => {
    setPayingInvoice(invoiceId);
    payInvoiceMutation.mutate({ invoiceId, method: "card" });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: "bg-green-500/20", text: "text-green-500", label: "Paid" },
      succeeded: { bg: "bg-green-500/20", text: "text-green-500", label: "Paid" },
      completed: { bg: "bg-green-500/20", text: "text-green-500", label: "Completed" },
      outstanding: { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "Outstanding" },
      pending: { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "Pending" },
      overdue: { bg: "bg-red-500/20", text: "text-red-500", label: "Overdue" },
      draft: { bg: "bg-slate-500/20", text: "text-slate-400", label: "Draft" },
      void: { bg: "bg-slate-500/20", text: "text-slate-400", label: "Void" },
      refunded: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Refunded" },
    };
    const s = map[status] || { bg: "bg-slate-500/20", text: "text-slate-400", label: status };
    return <Badge className={`${s.bg} ${s.text} border-0 text-xs font-semibold`}>{s.label}</Badge>;
  };

  const isTerminal = user?.role === "TERMINAL_MANAGER";

  // ── Download EusoTicket document as formatted HTML (printable/saveable as PDF) ──
  const downloadDocument = (doc: any) => {
    let meta: any = {};
    try { meta = typeof doc.fileUrl === "string" && doc.fileUrl.startsWith("{") ? JSON.parse(doc.fileUrl) : {}; } catch { meta = {}; }

    const date = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
    const companyName = companyQuery.data?.name || "EusoTrip";

    // Inline base64 PNG logo (actual EusoTrip flame with spiral)
    const logoSvg = `<img src="${EUSOTRIP_LOGO_BASE64}" width="40" height="40" alt="EusoTrip" style="object-fit:contain" />`;

    // Color palette matching app dark theme
    const bg = "#0c1222";
    const cardBg = "#111827";
    const cardBorder = "rgba(255,255,255,0.06)";
    const textPrimary = "#f1f5f9";
    const textSecondary = "#94a3b8";
    const textMuted = "#64748b";
    const accent = "#1473FF";
    const accentPurple = "#BE01FF";
    const rowBg = "rgba(255,255,255,0.02)";
    const rowBorderColor = "rgba(255,255,255,0.06)";

    const headerHtml = `
      <div class="header" style="text-align:center;padding:16px 0 12px;border-bottom:1px solid ${cardBorder};margin-bottom:16px">
        <div style="display:inline-block;margin-bottom:6px">${logoSvg}</div>
        <svg width="140" height="30" viewBox="0 0 140 30" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto"><defs><linearGradient id="etg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accentPurple}"/></linearGradient></defs><text x="70" y="24" text-anchor="middle" fill="url(#etg)" font-family="-apple-system,BlinkMacSystemFont,Inter,sans-serif" font-size="26" font-weight="800" letter-spacing="-0.5">EusoTrip</text></svg>
        <p style="margin:2px 0 0;font-size:9px;color:${textMuted};letter-spacing:1.5px;text-transform:uppercase">EusoTicket Document System</p>
        <div style="margin-top:8px;display:flex;justify-content:center;gap:16px">
          <span style="font-size:10px;color:${textSecondary}">${companyName}</span>
          <span style="font-size:10px;color:${textMuted}">${date}</span>
          <span style="font-size:10px;color:${textMuted}">Doc #${doc.id || "N/A"}</span>
        </div>
      </div>`;

    const footerHtml = `
      <div class="footer" style="position:fixed;bottom:0;left:0;right:0;text-align:center;padding:12px 0;pointer-events:none">
        <p style="font-size:8px;color:${textMuted}">Generated by EusoTrip EusoTicket &middot; ${new Date().toLocaleString()}</p>
        <p style="font-size:7px;color:${textMuted};margin-top:2px">Designed by Eusorone Technologies, Inc.</p>
      </div>`;

    const row = (label: string, value: string) => `<tr><td style="padding:6px 12px;font-size:10px;color:${textMuted};border-bottom:1px solid ${rowBorderColor};width:160px;vertical-align:top">${label}</td><td style="padding:6px 12px;font-size:11px;color:${textPrimary};font-weight:500;border-bottom:1px solid ${rowBorderColor}">${value}</td></tr>`;

    const sectionTitle = (title: string) => `<h3 style="font-size:14px;color:${textPrimary};margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid ${cardBorder};display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:3px;height:16px;background:linear-gradient(180deg,${accent},${accentPurple});border-radius:2px"></span>${title}</h3>`;

    let bodyHtml = "";

    if (doc.type === "rate_sheet") {
      const tiers = meta.rateTiers || [];
      const sc = meta.surcharges || {};
      const rateUnit = meta.rateUnit || "per_barrel";
      const unitLabel = ({ per_barrel: "/BBL", per_mile: "/mi", per_cwt: "/cwt", flat_rate: "", per_pallet: "/plt", per_gallon: "/gal", per_ton: "/ton" } as Record<string, string>)[rateUnit] || "/BBL";
      const trailerLabel = { tanker: "Tanker", dry_van: "Dry Van", reefer: "Reefer", flatbed: "Flatbed", step_deck: "Step Deck", lowboy: "Lowboy", hopper: "Hopper", intermodal: "Container" }[meta.trailerType as string] || meta.trailerType || "Tanker";

      // Build gradient tier grid matching the app's Schedule A layout
      const cols = 7;
      let tierGridCells = "";
      tiers.forEach((t: any, i: number) => {
        // Gradient from blue-purple through teal to amber across tiers
        const pct = tiers.length > 1 ? i / (tiers.length - 1) : 0;
        let cellBg: string;
        if (pct < 0.25) cellBg = `rgba(20,115,255,${0.15 + pct * 0.4})`;
        else if (pct < 0.5) cellBg = `rgba(6,182,212,${0.12 + (pct - 0.25) * 0.5})`;
        else if (pct < 0.75) cellBg = `rgba(16,185,129,${0.12 + (pct - 0.5) * 0.5})`;
        else cellBg = `rgba(245,158,11,${0.12 + (pct - 0.75) * 0.6})`;

        tierGridCells += `<div style="background:${cellBg};border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px 5px;text-align:center">
          <div style="font-size:8px;color:${textMuted};margin-bottom:3px;white-space:nowrap">${t.minMiles}-${t.maxMiles}</div>
          <div style="font-size:13px;font-weight:700;color:${textPrimary}">$${Number(t.ratePerBarrel).toFixed(2)}</div>
        </div>`;
      });

      bodyHtml = `
        <div class="card" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:12px;padding:14px;margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div>
              <h2 style="margin:0;font-size:14px;color:${textPrimary};font-weight:700">${meta.name || doc.name || "Rate Sheet"}</h2>
              <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
                <span style="display:inline-block;font-size:8px;color:#a78bfa;background:rgba(167,139,250,0.15);padding:2px 6px;border-radius:3px;font-weight:600">${trailerLabel}</span>
                ${meta.region ? `<span style="display:inline-block;font-size:8px;color:${accent};background:rgba(20,115,255,0.12);padding:2px 6px;border-radius:3px;font-weight:600">${meta.region}</span>` : ""}
                <span style="font-size:8px;color:${textMuted}">${meta.productType || "Crude Oil"}</span>
              </div>
            </div>
            <div style="text-align:right">
              <span style="font-size:9px;color:${textMuted}">v${meta.version || 1}</span>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${row("Effective", meta.effectiveDate || date)} ${row("Expires", meta.expirationDate || "None")}
          </table>
        </div>

        <div class="card" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:12px;padding:14px;margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <h3 style="margin:0;font-size:11px;color:${textPrimary};font-weight:600">Schedule A — Rates (${tiers.length} tiers)</h3>
            <span style="font-size:9px;color:${accent};font-weight:600">1-${tiers.length > 0 ? tiers[tiers.length - 1].maxMiles : 0} mi</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px">
            ${tierGridCells}
          </div>
        </div>

        <div style="page-break-before:always"></div>
        <div class="card" style="background:${cardBg};border:1px solid ${cardBorder};border-radius:12px;padding:14px;margin-top:20px">
          <h3 style="margin:0 0 8px;font-size:11px;color:${textPrimary};font-weight:600">Surcharges</h3>
          <table style="width:100%;border-collapse:collapse">
            ${row("FSC Baseline Diesel", "$" + (sc.fscBaselineDieselPrice || "3.75") + "/gal")}
            ${row("FSC MPG", String(sc.fscMilesPerGallon || 5))}
            ${row("Wait Time Rate", "$" + (sc.waitTimeRatePerHour || 85) + "/hr")}
            ${row("Wait Time Free Hours", String(sc.waitTimeFreeHours || 1) + " hr")}
            ${row("Split Load Fee", "$" + (sc.splitLoadFee || 50))}
            ${row("Reject Fee", "$" + (sc.rejectFee || 85))}
            ${row("Minimum Volume", String(sc.minimumBarrels || 160) + " BBL")}
            ${row("Travel Surcharge", "$" + (sc.travelSurchargePerMile || "1.50") + "/mi outside operating area")}
          </table>
        </div>`;
    } else if (doc.type === "bol") {
      bodyHtml = `
        <div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px">
          <h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:4px;height:20px;background:linear-gradient(180deg,${accent},${accentPurple});border-radius:2px"></span>Bill of Lading</h2>
          <table style="width:100%;border-collapse:collapse">
            ${row("BOL Number", doc.name || meta.bolNumber || "N/A")}
            ${row("Shipper", meta.shipper || meta.shipperName || "N/A")}
            ${row("Carrier", meta.carrier || meta.carrierName || "N/A")}
            ${row("Driver", meta.driverName || meta.driver || "N/A")}
            ${row("Origin", meta.origin || meta.pickupLocation || "N/A")}
            ${row("Destination", meta.destination || meta.deliveryLocation || "N/A")}
            ${row("Product", meta.product || meta.productType || "Crude Oil")}
            ${row("Gross Volume", (meta.grossBarrels || meta.grossBBL || "N/A") + " BBL")}
            ${row("Net Volume", (meta.netBarrels || meta.netBBL || "N/A") + " BBL")}
            ${row("BS&W %", (meta.bsw || meta.bswPercent || "N/A") + "%")}
            ${row("API Gravity", String(meta.apiGravity || "N/A"))}
            ${row("Temperature", (meta.temperature || "N/A") + " F")}
            ${row("Seal Number", meta.sealNumber || "N/A")}
            ${row("Date", meta.date || date)}
            ${row("Status", doc.status || "active")}
          </table>
        </div>`;
    } else if (doc.type === "run_ticket") {
      const isLiquid = meta.docSubtype === "run_ticket" || meta.docSubtype === "hazmat_run_ticket" || meta.volumeUnit === "BBL" || meta.grossBarrels;
      const isReefer = meta.docSubtype === "temp_delivery_receipt";
      const isFlatbed = meta.docSubtype === "oversize_delivery_receipt";
      const isHazmat = meta.docSubtype?.includes("hazmat");
      const docTitle = isLiquid ? "Run Ticket" : isReefer ? "Temperature Delivery Receipt" : isFlatbed ? "Oversize Delivery Receipt" : "Delivery Receipt";
      const subtypeBadge = meta.docSubtype ? `<span style="display:inline-block;font-size:10px;color:#a78bfa;background:rgba(167,139,250,0.15);padding:3px 10px;border-radius:4px;font-weight:600;margin-left:12px">${meta.cargoType || meta.docSubtype}</span>` : "";

      let ticketRows = `
          ${row("Ticket Number", doc.name || meta.ticketNumber || "N/A")}
          ${row("Load #", meta.loadNumber || "N/A")}
          ${row("Driver", meta.driverName || meta.driver || "N/A")}
          ${row("Carrier", meta.carrierName || "N/A")}
          ${row("Origin", meta.origin || "N/A")}
          ${row("Destination", meta.destination || "N/A")}
          ${row("Miles", String(meta.miles || meta.destinationMiles || "N/A"))}
          ${row("Wait Time", (meta.waitTimeHours || "0") + " hrs")}
          ${row("Date", meta.ticketDate || meta.createdAt?.split("T")[0] || date)}`;

      if (isLiquid) {
        ticketRows += `
          <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:${accent};letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid ${rowBorderColor}">GAUGING &amp; MEASUREMENT</td></tr>
          ${row("Product", meta.productName || meta.productType || meta.commodityName || "Petroleum Product")}
          ${row("Obs Gravity", meta.obsGravity ? meta.obsGravity + " API" : "N/A")}
          ${row("Obs Temperature", meta.obsTemperature ? meta.obsTemperature + " F" : "N/A")}
          ${row("BS&W %", meta.bsw !== undefined ? String(meta.bsw) + "%" : "N/A")}
          ${row("Gross BBL", String(meta.grossBarrels || "N/A"))}
          ${row("Net BBL", String(meta.netBarrels || "N/A"))}
          ${row("Corrected Gravity", meta.correctedGravity ? meta.correctedGravity + " API" : "N/A")}
          ${row("Temp Correction Factor", String(meta.tempCorrectionFactor || "N/A"))}
          ${row("Tank #", meta.tankNumber || "N/A")}`;
      }

      if (!isLiquid) {
        ticketRows += `
          <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:${accent};letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid ${rowBorderColor}">CARGO DETAILS</td></tr>
          ${row("Item Description", meta.itemDescription || meta.commodityName || "N/A")}
          ${row("Piece Count", String(meta.pieceCount || "N/A"))}
          ${row("Pallet Count", String(meta.palletCount || "N/A"))}
          ${row("Total Weight", (meta.totalWeight || "N/A") + " " + (meta.weightUnit || "lbs"))}
          ${row("PO #", meta.poNumber || "N/A")}
          ${row("Received in Good Condition", meta.receivedInGoodCondition ? "Yes" : meta.receivedInGoodCondition === false ? "No" : "N/A")}
          ${meta.damageNotes ? row("Damage Notes", meta.damageNotes) : ""}
          ${meta.shortageNotes ? row("Shortage Notes", meta.shortageNotes) : ""}`;
      }

      if (isReefer) {
        ticketRows += `
          <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:#06b6d4;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid ${rowBorderColor}">TEMPERATURE LOG</td></tr>
          ${row("Set Temperature", meta.setTemperature ? meta.setTemperature + " " + (meta.tempUnit || "F") : "N/A")}
          ${row("Temp at Pickup", meta.tempAtPickup ? meta.tempAtPickup + " " + (meta.tempUnit || "F") : "N/A")}
          ${row("Temp at Delivery", meta.tempAtDelivery ? meta.tempAtDelivery + " " + (meta.tempUnit || "F") : "N/A")}
          ${row("Continuous Temp Log", meta.continuousTempLog ? "Yes" : "No")}
          ${row("Product Integrity", meta.productIntegrity ? "Maintained" : "Compromised")}`;
      }

      if (isFlatbed) {
        const dims = meta.dimensions;
        ticketRows += `
          <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:#f59e0b;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid ${rowBorderColor}">OVERSIZE DETAILS</td></tr>
          ${dims ? row("Dimensions", dims.length + " x " + dims.width + " x " + dims.height + " " + (dims.unit || "ft")) : ""}
          ${row("Securement Method", meta.securementMethod || "N/A")}
          ${row("Tie-Down Count", String(meta.tieDownCount || "N/A"))}
          ${row("Tarp Required / Applied", (meta.tarpRequired ? "Yes" : "No") + " / " + (meta.tarpApplied ? "Yes" : "No"))}
          ${meta.oversizePermit ? row("Oversize Permit", meta.oversizePermit) : ""}
          ${meta.overweightPermit ? row("Overweight Permit", meta.overweightPermit) : ""}`;
      }

      if (isHazmat) {
        ticketRows += `
          <tr><td colspan="2" style="padding:12px 16px 6px;font-size:11px;font-weight:700;color:#ef4444;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.05)">HAZMAT INFORMATION</td></tr>
          ${row("Hazmat Class", meta.hazmatClass || "N/A")}
          ${row("UN Number", meta.unNumber || "N/A")}
          ${row("Packing Group", meta.packingGroup || "N/A")}
          ${row("Emergency Phone", meta.emergencyPhone || "1-800-424-9300")}
          ${row("Placard Applied", meta.placardApplied ? "Yes" : "No")}
          ${row("Spill Kit Verified", meta.spillKitVerified ? "Yes" : "No")}
          ${row("PPE Used", meta.ppeUsed ? "Yes" : "No")}`;
      }

      ticketRows += row("Status", doc.status || "active");

      bodyHtml = `
        <div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px">
          <h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700;display:flex;align-items:center"><span style="display:inline-block;width:4px;height:20px;background:linear-gradient(180deg,${accent},${accentPurple});border-radius:2px;margin-right:8px"></span>${docTitle}${subtypeBadge}</h2>
          <table style="width:100%;border-collapse:collapse">${ticketRows}</table>
        </div>`;
    } else if (doc.type === "reconciliation") {
      const runs = meta.runs || meta.lines || [];
      let runRows = "";
      runs.forEach((r: any, i: number) => {
        runRows += `<tr style="background:${i % 2 === 0 ? "transparent" : rowBg}">
          <td style="padding:8px 10px;font-size:11px;color:${textMuted};border-bottom:1px solid ${rowBorderColor}">${i + 1}</td>
          <td style="padding:8px 10px;font-size:11px;color:${textPrimary};border-bottom:1px solid ${rowBorderColor}">${r.driverName || r.driver || "N/A"}</td>
          <td style="padding:8px 10px;font-size:11px;color:${textSecondary};border-bottom:1px solid ${rowBorderColor}">${r.origin || ""} &rarr; ${r.destination || ""}</td>
          <td style="padding:8px 10px;font-size:11px;color:${textPrimary};border-bottom:1px solid ${rowBorderColor}">${r.netBarrels || r.netBBL || "N/A"} BBL</td>
          <td style="padding:8px 10px;font-size:12px;color:#10b981;font-weight:600;border-bottom:1px solid ${rowBorderColor}">$${Number(r.totalPayment || r.total || 0).toFixed(2)}</td>
        </tr>`;
      });
      const totals = meta.totals || {};
      bodyHtml = `
        <div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px;margin-bottom:24px">
          <h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:4px;height:20px;background:linear-gradient(180deg,${accent},${accentPurple});border-radius:2px"></span>Reconciliation Statement</h2>
          <table style="width:100%;border-collapse:collapse">
            ${row("Statement ID", meta.reconciliationId || doc.name || "N/A")}
            ${row("Period", (meta.periodStart || "") + " to " + (meta.periodEnd || ""))}
            ${row("Customer", meta.customerName || "N/A")}
            ${row("Carrier", meta.carrierName || "N/A")}
            ${row("Total Runs", String(totals.totalRuns || runs.length || 0))}
            ${row("Total Net BBL", String(totals.totalNetBarrels || "N/A"))}
          </table>
          <div style="margin-top:20px;background:linear-gradient(135deg,rgba(20,115,255,0.1),rgba(190,1,255,0.1));border:1px solid rgba(20,115,255,0.2);border-radius:12px;padding:16px;text-align:center">
            <span style="font-size:12px;color:${textMuted}">Grand Total</span>
            <div style="font-size:28px;font-weight:800;color:#10b981;margin-top:4px">$${Number(totals.grandTotal || 0).toFixed(2)}</div>
          </div>
        </div>
        ${runs.length > 0 ? `
        <div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px">
          <h3 style="margin:0 0 16px;font-size:15px;color:${textPrimary};font-weight:600">Run Details</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>
              <th style="padding:8px 10px;font-size:10px;text-align:left;color:${textMuted};border-bottom:1px solid ${cardBorder};text-transform:uppercase;letter-spacing:0.5px">#</th>
              <th style="padding:8px 10px;font-size:10px;text-align:left;color:${textMuted};border-bottom:1px solid ${cardBorder};text-transform:uppercase;letter-spacing:0.5px">Driver</th>
              <th style="padding:8px 10px;font-size:10px;text-align:left;color:${textMuted};border-bottom:1px solid ${cardBorder};text-transform:uppercase;letter-spacing:0.5px">Route</th>
              <th style="padding:8px 10px;font-size:10px;text-align:left;color:${textMuted};border-bottom:1px solid ${cardBorder};text-transform:uppercase;letter-spacing:0.5px">Volume</th>
              <th style="padding:8px 10px;font-size:10px;text-align:left;color:${textMuted};border-bottom:1px solid ${cardBorder};text-transform:uppercase;letter-spacing:0.5px">Total</th>
            </tr></thead>
            <tbody>${runRows}</tbody>
          </table>
        </div>` : ""}`;
    } else {
      bodyHtml = `
        <div style="background:${cardBg};border:1px solid ${cardBorder};border-radius:16px;padding:24px">
          <h2 style="margin:0 0 20px;font-size:20px;color:${textPrimary};font-weight:700">${doc.name || "Document"}</h2>
          <pre style="font-size:11px;background:rgba(255,255,255,0.03);padding:16px;border-radius:8px;overflow:auto;max-height:600px;color:${textSecondary};border:1px solid ${cardBorder}">${JSON.stringify(meta, null, 2)}</pre>
        </div>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.name || "EusoTicket Document"}</title>
      <style>
        @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:12px 16px!important}button,.no-print{display:none!important}.card{padding:14px!important;margin-bottom:12px!important}.header{padding:16px 0 12px!important;margin-bottom:16px!important}.footer{margin-top:20px!important;padding-top:10px!important}}
        @page{margin:0.4in;size:letter}
        *{box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;max-width:900px;margin:0 auto;padding:20px 20px 48px;background:${bg};color:${textPrimary};font-size:11px;min-height:100vh;display:flex;flex-direction:column}
        table{border-spacing:0}
        .card{padding:16px;margin-bottom:16px}
        .header{padding:20px 0 16px;margin-bottom:20px}
        .footer{margin-top:28px;padding-top:12px}
      </style>
    </head><body>
      ${headerHtml}<div style="flex:1">${bodyHtml}</div>${footerHtml}
      <div class="no-print" style="text-align:center;margin-top:28px">
        <button onclick="window.print()" style="background:linear-gradient(135deg,${accent},${accentPurple});color:white;border:none;padding:12px 32px;border-radius:10px;font-size:13px;cursor:pointer;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(20,115,255,0.3)">Print / Save as PDF</button>
      </div>
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
    else toast.error("Pop-up blocked. Please allow pop-ups for this site.");
  };

  const TABS: { id: WalletTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <WalletIcon className="w-4 h-4" /> },
    { id: "eusoticket", label: "EusoTicket", icon: <Scale className="w-4 h-4" />, count: (eusoTicketDocsQuery.data?.stats?.bols || 0) + (eusoTicketDocsQuery.data?.stats?.runTickets || 0) },
    { id: "invoices", label: "Invoices", icon: <FileText className="w-4 h-4" />, count: paySummary?.outstandingCount || 0 },
    ...(isTerminal ? [{ id: "terminal" as WalletTab, label: "Terminal Billing", icon: <Building2 className="w-4 h-4" /> }] : []),
    { id: "send", label: "Send", icon: <Send className="w-4 h-4" /> },
    { id: "cards", label: "Cards", icon: <CreditCard className="w-4 h-4" /> },
    { id: "bank", label: "Bank", icon: <Landmark className="w-4 h-4" /> },
    { id: "escrow", label: "Escrow", icon: <Shield className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            EusoWallet
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Your digital wallet — send money, manage cards & bank accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`rounded-lg ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700' : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 text-white'}`}
            onClick={() => {
              aiInsightsMutation.mutate({
                balance: balance?.available || 0,
                recentTransactions: (transactions || []).slice(0, 10).map((t: any) => ({ type: t.type || "transfer", amount: Number(t.amount) || 0, date: t.date || new Date().toISOString(), description: t.description || t.type || "" })),
                monthlyEarnings: balance?.monthlyEarnings || 0,
                monthlyExpenses: balance?.monthlyExpenses || 0,
                outstandingInvoices: paySummary?.outstanding || 0,
              });
            }}
            disabled={aiInsightsMutation.isPending}
          >
            <BrainCircuit className={`w-4 h-4 mr-1 ${aiInsightsMutation.isPending ? 'animate-spin' : ''}`} />{aiInsightsMutation.isPending ? "Analyzing..." : "AI Insights"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`rounded-lg ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700' : 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 text-white'}`}
            onClick={() => { balanceQuery.refetch(); transactionsQuery.refetch(); }}
          >
            <RefreshCw className="w-4 h-4 mr-1" />Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg text-white"
            size="sm"
            onClick={() => setActiveTab("send")}
          >
            <Send className="w-4 h-4 mr-1" />Send Money
          </Button>
        </div>
      </div>

      {/* Balance Hero Card — Matte cotton gradient (matches Earnings) */}
      <div className={`rounded-3xl overflow-hidden border ${isLight ? 'bg-white border-slate-200 shadow-xl shadow-purple-500/5' : 'bg-slate-800/60 border-slate-700/50'}`}>
        <div className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 p-6 md:p-8">

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLight ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-white/10 backdrop-blur'}`}>
                <WalletIcon className={`w-5 h-5 ${isLight ? 'text-slate-800' : 'text-white'}`} />
              </div>
              <span className={`font-semibold text-lg ${isLight ? 'text-slate-800' : 'text-white/90'}`}>EusoWallet</span>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className={`${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-white/50 hover:text-white'} transition-colors`}>
              {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <div className="mb-6">
            <p className={`text-sm mb-1 ${isLight ? 'text-slate-500' : 'text-white/60'}`}>Available Balance</p>
            {balanceQuery.isLoading ? <Skeleton className={`h-12 w-48 rounded-2xl ${isLight ? 'bg-slate-200' : 'bg-white/20'}`} /> : (
              <p className={`text-4xl md:text-5xl font-bold tracking-tight ${isLight ? 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent' : 'text-white'}`}>
                {showBalance ? `$${(balance?.available || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
              </p>
            )}
          </div>
          {/* Sub-stat boxes */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pending", value: balance?.pending || 0 },
              { label: "In Escrow", value: balance?.escrow || 0 },
              { label: "This Month", value: balance?.monthVolume || 0 },
            ].map((box) => (
              <div
                key={box.label}
                className={`p-4 rounded-2xl ${isLight ? 'bg-white/60 border border-purple-100/60 backdrop-blur-sm' : 'bg-white/[0.06] border border-white/[0.08] backdrop-blur-md'}`}
              >
                <p className={`text-sm font-semibold tracking-wide ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{box.label}</p>
                <p className={`font-bold text-xl mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {showBalance ? `$${box.value.toLocaleString()}` : '••••'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESANG AI Financial Insights */}
      {aiInsights && (
        <Card className={`rounded-2xl border ${isLight ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50' : 'bg-gradient-to-r from-blue-950/30 to-purple-950/30 border-blue-800/30'}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-500" />
                ESANG AI Financial Insights
              </CardTitle>
              <button onClick={() => setAiInsights(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <p className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>{aiInsights.summary}</p>
            {aiInsights.insights?.length > 0 && (
              <div className="space-y-1">
                {aiInsights.insights.map((insight: string, i: number) => (
                  <p key={i} className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>- {insight}</p>
                ))}
              </div>
            )}
            {aiInsights.recommendations?.length > 0 && (
              <div className={`p-3 rounded-xl ${isLight ? 'bg-white/80' : 'bg-slate-800/50'}`}>
                <p className="text-xs font-semibold mb-1">Recommendations</p>
                {aiInsights.recommendations.map((rec: string, i: number) => (
                  <p key={i} className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{i + 1}. {rec}</p>
                ))}
              </div>
            )}
            {aiInsights.riskAlerts?.length > 0 && (
              <div className={`p-3 rounded-xl ${isLight ? 'bg-red-50' : 'bg-red-950/20'}`}>
                <p className="text-xs font-semibold text-red-500 mb-1">Risk Alerts</p>
                {aiInsights.riskAlerts.map((alert: string, i: number) => (
                  <p key={i} className="text-xs text-red-400">{alert}</p>
                ))}
              </div>
            )}
            <p className={`text-xs italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Forecast: {aiInsights.cashFlowForecast}</p>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-blue-500/20'
                : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? "bg-white/20 text-white" : isLight ? "bg-slate-200 text-slate-600" : "bg-slate-600 text-slate-300"
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* OVERVIEW TAB */}
      {/* ============================================================ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Received", value: balance?.totalReceived || 0, icon: <ArrowDownLeft className="w-5 h-5" />, color: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent", bg: "bg-purple-500/20" },
              { label: "Total Sent", value: balance?.totalSpent || 0, icon: <ArrowUpRight className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/20" },
              { label: "Active Cards", value: cards.length || 0, icon: <CreditCard className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/20", isCurrency: false },
              { label: "Bank Accounts", value: bankAccounts.length || 0, icon: <Landmark className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/20", isCurrency: false },
            ].map((stat, i) => (
              <Card key={i} className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <span className={stat.color}>{stat.icon}</span>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${stat.color}`}>
                        {(stat as any).isCurrency === false ? stat.value : `$${(stat.value as number).toLocaleString()}`}
                      </p>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Send Money", icon: <Send className="w-5 h-5" />, tab: "send" as WalletTab },
              { label: "Order Card", icon: <CreditCard className="w-5 h-5" />, tab: "cards" as WalletTab },
              { label: "Connect Bank", icon: <Landmark className="w-5 h-5" />, tab: "bank" as WalletTab },
              { label: "View Escrow", icon: <Shield className="w-5 h-5" />, tab: "escrow" as WalletTab },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(action.tab)}
                className={`p-4 rounded-xl border transition-all hover:scale-[1.02] flex flex-col items-center gap-2 ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md text-slate-700'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500 text-slate-300'
                }`}
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20">
                  <span className="text-blue-400">{action.icon}</span>
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Transactions Preview */}
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className={`text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Recent Activity</CardTitle>
              <button onClick={() => setActiveTab("history")} className="text-blue-400 text-sm hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                  <p className={isLight ? 'text-slate-400' : 'text-slate-500'}>No transactions yet</p>
                </div>
              ) : (
                <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-700/50'}`}>
                  {transactions.slice(0, 5).map((t: any) => (
                    <div key={t.id} className={`px-6 py-3 flex items-center justify-between ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/20'} transition-colors`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {t.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{t.date}</p>
                        </div>
                      </div>
                      <p className={cn("font-bold", t.type === 'credit' ? 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent' : 'text-red-400')}>
                        {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* INVOICES TAB (merged from Payments page)                    */}
      {/* ============================================================ */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Invoice stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Outstanding", value: paySummary?.outstandingTotal || 0, count: paySummary?.outstandingCount || 0, icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/15" },
              { label: "Paid This Month", value: paySummary?.paidThisMonth || 0, count: paySummary?.paidThisMonthCount || 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/15" },
              { label: "Receivables", value: paySummary?.receivablesTotal || 0, count: paySummary?.receivablesCount || 0, icon: ArrowDownLeft, color: "text-blue-500", bg: "bg-blue-500/15" },
              { label: "Overdue", value: paySummary?.overdueTotal || 0, count: paySummary?.overdueCount || 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/15" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", s.bg)}><s.icon className={cn("w-5 h-5", s.color)} /></div>
                    <div className="min-w-0">
                      <p className={cn("text-xl font-bold", s.color)}>${s.value.toLocaleString()}</p>
                      <p className={cn("text-xs truncate", isLight ? "text-slate-500" : "text-slate-400")}>{s.count} {s.label.toLowerCase()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search invoices..." className={cn("pl-9 rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50")} />
            </div>
            <div className="flex items-center gap-1">
              {["all", "outstanding", "paid", "overdue"].map((f) => (
                <button key={f} onClick={() => setInvoiceFilter(f)} className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize", invoiceFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>{f}</button>
              ))}
            </div>
          </div>

          {/* Invoices table */}
          <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
            <CardContent className="p-0">
              {invoicesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4].map((i: number) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : !invoicesQuery.data?.length ? (
                <div className="text-center py-16">
                  <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}><FileText className="w-10 h-10 text-slate-400" /></div>
                  <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No invoices found</p>
                  <p className="text-sm text-slate-400 mt-1">Invoices will appear here when created</p>
                </div>
              ) : (
                <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                  <div className={cn("grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider", isLight ? "text-slate-400 bg-slate-50" : "text-slate-500 bg-slate-800/40")}>
                    <div className="col-span-3">Invoice</div><div className="col-span-3">Details</div><div className="col-span-2 text-right">Amount</div><div className="col-span-2 text-center">Status</div><div className="col-span-2 text-right">Actions</div>
                  </div>
                  {(invoicesQuery.data as any[]).map((inv: any) => (
                    <div key={inv.id} className={cn("grid grid-cols-12 gap-4 items-center px-5 py-4 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                      <div className="col-span-3"><p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{inv.invoiceNumber}</p><p className="text-xs text-slate-400 mt-0.5">{inv.loadRef || "—"}</p></div>
                      <div className="col-span-3"><p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{inv.customerName || inv.description}</p><div className="flex items-center gap-2 mt-0.5"><Calendar className="w-3 h-3 text-slate-400" /><span className="text-xs text-slate-400">Due {inv.dueDate}</span>{inv.daysOverdue > 0 && <span className="text-xs text-red-400 font-medium">{inv.daysOverdue}d overdue</span>}</div></div>
                      <div className="col-span-2 text-right"><p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${Number(inv.amount).toLocaleString()}</p></div>
                      <div className="col-span-2 text-center">{getStatusBadge(inv.status)}</div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        {(inv.status === "outstanding" || inv.status === "overdue") && (
                          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs rounded-lg h-8" onClick={() => handlePayInvoice(inv.id)} disabled={payingInvoice === inv.id}>
                            {payingInvoice === inv.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}Pay
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0" title="Download"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receivables */}
          {receivablesQuery.data?.length > 0 && (
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
              <CardHeader className="pb-2 px-5 pt-5"><CardTitle className={cn("text-base font-semibold", isLight ? "text-slate-800" : "text-white")}>Outstanding Receivables</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                  {(receivablesQuery.data as any[]).map((r: any) => (
                    <div key={r.id} className={cn("flex items-center justify-between px-5 py-4", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", r.status === "overdue" ? "bg-red-500/15" : "bg-blue-500/15")}><Banknote className={cn("w-5 h-5", r.status === "overdue" ? "text-red-500" : "text-blue-500")} /></div>
                        <div><p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{r.invoiceNumber}</p><p className="text-xs text-slate-400">{r.customerName} · Due {r.dueDate}</p></div>
                      </div>
                      <div className="flex items-center gap-3"><div className="text-right"><p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>${Number(r.amount).toLocaleString()}</p>{getStatusBadge(r.status)}</div></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipts */}
          {receiptsQuery.data?.length > 0 && (
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
              <CardHeader className="pb-2 px-5 pt-5"><CardTitle className={cn("text-base font-semibold", isLight ? "text-slate-800" : "text-white")}>Payment Receipts</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                  {(receiptsQuery.data as any[]).map((receipt: any) => (
                    <div key={receipt.id} className={cn("flex items-center justify-between px-5 py-4", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div>
                        <div><p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{receipt.invoiceNumber}</p><p className="text-xs text-slate-400">{receipt.description} · Paid {receipt.paidDate}</p></div>
                      </div>
                      <div className="flex items-center gap-3"><div className="text-right"><p className="font-bold text-green-500">${Number(receipt.amount).toLocaleString()}</p><p className="text-xs text-slate-400">{receipt.paymentMethod}</p></div><Button variant="ghost" size="sm" className="text-slate-400 h-8 w-8 p-0"><Download className="w-4 h-4" /></Button></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* EUSOTICKET TAB — BOL, Run Tickets, Rate Sheets, Reconciliation */}
      {/* ============================================================ */}
      {activeTab === "eusoticket" && (() => {
        const etDocs = eusoTicketDocsQuery.data?.documents || [];
        const etStats = eusoTicketDocsQuery.data?.stats || { bols: 0, runTickets: 0, rateSheets: 0, reconciliations: 0 };
        const feeSchedule = platformFeeQuery.data;
        const reconStats = reconStatsQuery.data;
        // etFilter state moved to top-level to avoid conditional hook
        const filteredDocs = etFilter === "all" ? etDocs : etDocs.filter((d: any) => d.type === etFilter);
        const typeLabel: Record<string, string> = { bol: "BOL", run_ticket: "Run Ticket", rate_sheet: "Rate Sheet", reconciliation: "Reconciliation" };
        const typeColor: Record<string, { bg: string; text: string }> = {
          bol: { bg: "bg-blue-500/15", text: "text-blue-500" },
          run_ticket: { bg: "bg-amber-500/15", text: "text-amber-500" },
          rate_sheet: { bg: "bg-purple-500/15", text: "text-purple-500" },
          reconciliation: { bg: "bg-emerald-500/15", text: "text-emerald-500" },
        };
        return (
          <div className="space-y-5">
            {/* EusoTicket Document Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Bills of Lading", value: etStats.bols, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/15" },
                { label: "Run Tickets", value: etStats.runTickets, icon: Droplets, color: "text-amber-500", bg: "bg-amber-500/15" },
                { label: "Rate Sheets", value: etStats.rateSheets, icon: Scale, color: "text-purple-500", bg: "bg-purple-500/15" },
                { label: "Reconciliations", value: etStats.reconciliations, icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-500/15" },
              ].map((s) => (
                <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl", s.bg)}><s.icon className={cn("w-5 h-5", s.color)} /></div>
                      <div>
                        <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sub-navigation: Documents | Billing Statement | Ticket Reconciliation */}
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] w-fit">
              {[
                { id: "docs" as const, label: "Documents", icon: FileText },
                { id: "billing" as const, label: "Billing Statement", icon: Receipt },
                { id: "recon" as const, label: "Ticket Reconciliation", icon: ShieldCheck },
              ].map(st => (
                <button key={st.id} onClick={() => setEtSubTab(st.id)}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    etSubTab === st.id
                      ? isLight ? "bg-white text-slate-800 shadow-sm" : "bg-white/[0.08] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}>
                  <st.icon className="w-4 h-4" />{st.label}
                </button>
              ))}
            </div>

            {/* ── DOCUMENTS SUB-TAB ── */}
            {etSubTab === "docs" && (<>
            {/* Platform Fee Schedule — Transparent Revenue Model */}
            {feeSchedule && (
              <Card className={cn("rounded-xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50" : "bg-gradient-to-r from-blue-950/20 to-purple-950/20 border-blue-800/30")}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className={cn("font-semibold text-sm flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                        <Scale className="w-4 h-4 text-purple-500" />EusoTrip Platform Fee Schedule
                      </h3>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{feeSchedule.description}</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs">{feeSchedule.transactionFeePercent}% per load</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className={cn("p-3 rounded-xl border", isLight ? "bg-white/80 border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                      <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Transaction Fee</p>
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{feeSchedule.transactionFeePercent}%</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Min ${feeSchedule.minimumFee} / Max ${feeSchedule.maximumFee}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl border", isLight ? "bg-white/80 border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                      <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Payment Processing</p>
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>{feeSchedule.paymentProcessingPercent}% + ${feeSchedule.paymentProcessingFlat}</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>Stripe Connect</p>
                    </div>
                    <div className={cn("p-3 rounded-xl border", isLight ? "bg-white/80 border-slate-200" : "bg-slate-800/50 border-slate-700/50")}>
                      <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Included Free</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(feeSchedule.includes || []).slice(0, 3).map((item: string) => (
                          <Badge key={item} className={cn("text-[9px] border-0", isLight ? "bg-green-100 text-green-700" : "bg-green-500/15 text-green-400")}>{item}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Who pays what breakdown */}
                  <div className={cn("mt-3 p-3 rounded-xl border", isLight ? "bg-white/60 border-slate-200" : "bg-slate-800/40 border-slate-700/50")}>
                    <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Settlement Flow</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-center">
                        <p className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Shipper</p>
                        <p className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Pays load + fee</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="text-center">
                        <p className="font-semibold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoTrip</p>
                        <p className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Keeps {feeSchedule.transactionFeePercent}% fee</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="text-center">
                        <p className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Carrier</p>
                        <p className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Receives load - fee</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="text-center">
                        <p className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Driver</p>
                        <p className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Paid by carrier</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EusoTicket Document Filter + List */}
            <div className="flex items-center gap-1">
              {["all", "bol", "run_ticket", "rate_sheet", "reconciliation"].map(f => (
                <button key={f} onClick={() => setEtFilter(f)} className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-colors", etFilter === f ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
                  {f === "all" ? "All" : typeLabel[f] || f}
                </button>
              ))}
            </div>

            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
              <CardContent className="p-0">
                {eusoTicketDocsQuery.isLoading ? (
                  <div className="p-4 space-y-3">{[1,2,3].map((i: number) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-14">
                    <Scale className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                    <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No EusoTicket documents yet</p>
                    <p className={cn("text-sm mt-1", isLight ? "text-slate-400" : "text-slate-500")}>BOLs, run tickets, rate sheets, and reconciliation statements from your loads will appear here</p>
                  </div>
                ) : (
                  <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                    {filteredDocs.map((doc: any) => {
                      const tc = typeColor[doc.type] || { bg: "bg-slate-500/15", text: "text-slate-400" };
                      return (
                        <div key={doc.id} className={cn("flex items-center justify-between px-5 py-3.5 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", tc.bg)}>
                              {doc.type === "bol" && <FileText className={cn("w-4 h-4", tc.text)} />}
                              {doc.type === "run_ticket" && <Droplets className={cn("w-4 h-4", tc.text)} />}
                              {doc.type === "rate_sheet" && <Scale className={cn("w-4 h-4", tc.text)} />}
                              {doc.type === "reconciliation" && <Receipt className={cn("w-4 h-4", tc.text)} />}
                            </div>
                            <div>
                              <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={cn("text-[9px] border-0", tc.bg, tc.text)}>{typeLabel[doc.type]}</Badge>
                                <span className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ""}</span>
                                {doc.isOwner && <Badge className={cn("text-[9px] border-0", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-700 text-slate-400")}>Owner</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge className={doc.status === "active" ? "bg-green-500/15 text-green-500 border-0" : "bg-yellow-500/15 text-yellow-500 border-0"}>{doc.status}</Badge>
                            <Button variant="ghost" size="sm" className="text-slate-400 h-8 w-8 p-0" onClick={() => downloadDocument(doc)}><Download className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            </>)}

            {/* ── BILLING STATEMENT SUB-TAB ── */}
            {etSubTab === "billing" && (
              <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={cn("font-semibold text-sm flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                      <Receipt className="w-4 h-4 text-[#1473FF]" />Billing Statement Generator
                    </h3>
                  </div>
                  <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                    Generate reconciliation billing statements from run ticket data. Add run lines with driver, origin, destination, miles, barrels, and surcharges.
                  </p>
                  <div className={cn("p-4 rounded-xl border text-center", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/30 border-slate-700/50")}>
                    <Receipt className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                    <p className={cn("text-sm font-medium", isLight ? "text-slate-600" : "text-slate-300")}>Open Full Billing Statement</p>
                    <p className={cn("text-xs mt-1 mb-3", isLight ? "text-slate-400" : "text-slate-500")}>Add run ticket lines and generate a full reconciliation statement with platform fees</p>
                    <Button size="sm" onClick={() => { window.location.href = "/rate-sheet"; }}
                      className="h-8 px-4 text-xs rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" />Go to Rate Sheet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── TICKET RECONCILIATION SUB-TAB ── */}
            {etSubTab === "recon" && (() => {
              const reconData = walletTicketReconQ.data as { matched: any[]; unmatched: any[]; summary: any } | null;
              const isShipper = user?.role === "SHIPPER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
              return (
                <div className="space-y-4">
                  <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={cn("font-semibold text-sm flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                          <ShieldCheck className="w-4 h-4 text-[#1473FF]" />{isShipper ? "Ticket Reconciliation" : "Reconciliation Status"}
                        </h3>
                        {isShipper ? (
                          <Button size="sm" onClick={() => walletTicketReconQ.refetch?.()} disabled={walletTicketReconQ.isLoading}
                            className="h-8 px-3 text-[10px] rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0">
                            <RefreshCw className={cn("w-3 h-3 mr-1", walletTicketReconQ.isLoading && "animate-spin")} />Run Reconciliation
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => walletTicketReconQ.refetch?.()} disabled={walletTicketReconQ.isLoading}
                            className={cn("h-8 px-3 text-[10px] rounded-xl", isLight ? "border-slate-200 text-slate-600" : "border-slate-600 text-slate-300")}>
                            <RefreshCw className={cn("w-3 h-3 mr-1", walletTicketReconQ.isLoading && "animate-spin")} />Refresh Status
                          </Button>
                        )}
                      </div>
                      <p className={cn("text-xs mb-3", isLight ? "text-slate-500" : "text-slate-400")}>
                        {isShipper
                          ? "Run reconciliation to match internal run tickets against BOL declarations and verify volume, product, rate, and financial accuracy"
                          : "View the reconciliation status of your run tickets. Once the shipper reconciles, matched payments will appear in your EusoWallet balance."}
                      </p>
                      {isShipper ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={cn("text-[10px] font-semibold uppercase tracking-wider block mb-1", isLight ? "text-slate-500" : "text-slate-400")}>Period Start</label>
                            <DatePicker value={walletReconPeriod.start} onChange={(v) => setWalletReconPeriod(p => ({ ...p, start: v }))} />
                          </div>
                          <div>
                            <label className={cn("text-[10px] font-semibold uppercase tracking-wider block mb-1", isLight ? "text-slate-500" : "text-slate-400")}>Period End</label>
                            <DatePicker value={walletReconPeriod.end} onChange={(v) => setWalletReconPeriod(p => ({ ...p, end: v }))} />
                          </div>
                        </div>
                      ) : (
                        <div className={cn("p-3 rounded-xl border", isLight ? "bg-blue-50/50 border-blue-200/50" : "bg-blue-500/5 border-blue-500/15")}>
                          <p className={cn("text-[11px] flex items-center gap-1.5", isLight ? "text-blue-700" : "text-blue-400")}>
                            <Clock className="w-3 h-3 shrink-0" />
                            Reconciliation is performed by the shipper. Once your tickets are matched and verified, payment will be released to your EusoWallet.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reconciliation Score + Summary */}
                  {reconData?.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: "Reconciliation Score", value: `${reconData.summary.reconciliationScore}%`, color: reconData.summary.reconciliationScore >= 80 ? "text-emerald-400" : reconData.summary.reconciliationScore >= 50 ? "text-amber-400" : "text-red-400" },
                        { label: "Matched (Clean)", value: reconData.summary.clean || 0, color: "text-emerald-400" },
                        { label: "Minor Variance", value: reconData.summary.warnings || 0, color: "text-amber-400" },
                        { label: "Discrepancies", value: reconData.summary.discrepancies || 0, color: "text-red-400" },
                        { label: "Unmatched", value: reconData.summary.unmatched || 0, color: "text-slate-500" },
                      ].map(s => (
                        <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                          <CardContent className="p-4 text-center">
                            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                            <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>{s.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Reconciliation Process Steps */}
                  <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                    <CardContent className="p-5">
                      <h4 className={cn("text-[10px] font-semibold uppercase tracking-wider mb-3", isLight ? "text-slate-500" : "text-slate-400")}>Reconciliation Process</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { step: 1, title: "Record Retrieval", desc: "gather run tickets & BOLs" },
                          { step: 2, title: "Matching", desc: "auto-pair by date, product, volume, carrier" },
                          { step: 3, title: "Investigation", desc: "analyze discrepancies & flag issues" },
                          { step: 4, title: "Adjustment", desc: "correct errors in general ledger" },
                        ].map(s => (
                          <div key={s.step} className="flex items-start gap-2">
                            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700 text-slate-300")}>{s.step}</div>
                            <div>
                              <p className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-300")}>{s.title}</p>
                              <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{s.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40">
                        {[
                          { color: "bg-emerald-500", label: "Matched (\u22642% vol)" },
                          { color: "bg-amber-500", label: "Variance (2-5%)" },
                          { color: "bg-red-500", label: "Discrepancy (>5%)" },
                          { color: "bg-slate-400", label: "Unmatched" },
                        ].map(l => (
                          <div key={l.label} className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", l.color)} />
                            <span className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Matched Records */}
                  {reconData?.matched && reconData.matched.length > 0 && (
                    <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                      <CardContent className="p-5">
                        <h4 className={cn("text-xs font-semibold flex items-center gap-2 mb-3", isLight ? "text-slate-800" : "text-white")}>
                          <Search className="w-3.5 h-3.5 text-[#1473FF]" />Matched Records ({reconData.matched.length})
                        </h4>
                        <div className="space-y-2">
                          {reconData.matched.map((m: any, i: number) => (
                            <div key={i} className={cn("p-3 rounded-xl border",
                              m.overallStatus === "green" ? isLight ? "bg-emerald-50/50 border-emerald-200" : "bg-emerald-500/5 border-emerald-500/20" :
                              m.overallStatus === "amber" ? isLight ? "bg-amber-50/50 border-amber-200" : "bg-amber-500/5 border-amber-500/20" :
                              isLight ? "bg-red-50/50 border-red-200" : "bg-red-500/5 border-red-500/20"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {m.overallStatus === "green" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                                   m.overallStatus === "amber" ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                                   <Ban className="w-4 h-4 text-red-500" />}
                                  <span className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-300")}>{m.ticketNumber}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs font-medium text-blue-500">{m.bolNumber}</span>
                                </div>
                                <Badge className={cn("text-[10px] border-0",
                                  m.overallStatus === "green" ? "bg-emerald-500/10 text-emerald-500" :
                                  m.overallStatus === "amber" ? "bg-amber-500/10 text-amber-500" :
                                  "bg-red-500/10 text-red-500"
                                )}>{m.overallStatus === "green" ? "MATCHED" : m.overallStatus === "amber" ? "VARIANCE" : "DISCREPANCY"}</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                                <div>
                                  <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Volume</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className={cn("font-medium", isLight ? "text-slate-700" : "text-slate-300")}>{m.ticketNetBBL} vs {m.bolDeclaredQty} BBL</span>
                                    <span className={cn("font-bold", m.volumeStatus === "green" ? "text-emerald-500" : m.volumeStatus === "amber" ? "text-amber-500" : "text-red-500")}>
                                      ({m.volumeVariancePct > 0 ? "+" : ""}{m.volumeVariancePct}%)
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Product</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {m.productMatch ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Ban className="w-3 h-3 text-red-500" />}
                                    <span className={cn("font-medium", isLight ? "text-slate-700" : "text-slate-300")}>{m.ticketProduct}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Rate</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className={cn("font-medium", isLight ? "text-slate-700" : "text-slate-300")}>${m.ticketRate?.toFixed?.(2) || "0.00"} vs ${m.agreedRate?.toFixed?.(2) || "N/A"}</span>
                                  </div>
                                </div>
                                <div>
                                  <span className={cn(isLight ? "text-slate-500" : "text-slate-400")}>Route</span>
                                  <span className={cn("font-medium mt-0.5 block", isLight ? "text-slate-700" : "text-slate-300")}>{m.driverName} · {m.origin} → {m.destination}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Unmatched Records */}
                  {reconData?.unmatched && reconData.unmatched.length > 0 && (
                    <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                      <CardContent className="p-5">
                        <h4 className={cn("text-xs font-semibold flex items-center gap-2 mb-3", isLight ? "text-slate-800" : "text-white")}>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Unmatched Records ({reconData.unmatched.length})
                        </h4>
                        <div className="space-y-2">
                          {reconData.unmatched.map((u: any, i: number) => (
                            <div key={i} className={cn("p-3 rounded-xl border flex items-center justify-between", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/30 border-slate-700/50")}>
                              <div className="flex items-center gap-3">
                                <Badge className={u.type === "run_ticket" ? "bg-amber-500/15 text-amber-500 border-0" : "bg-blue-500/15 text-blue-500 border-0"}>
                                  {u.type === "run_ticket" ? "Run Ticket" : "BOL"}
                                </Badge>
                                <span className={cn("text-xs font-medium", isLight ? "text-slate-700" : "text-slate-300")}>{u.number}</span>
                                <span className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{u.product} · {u.volume} BBL</span>
                              </div>
                              <span className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{u.reason}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty state */}
                  {!reconData?.matched?.length && !reconData?.unmatched?.length && !walletTicketReconQ.isLoading && (
                    <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
                      <CardContent className="p-12 text-center">
                        <ShieldCheck className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No reconciliation data yet</p>
                        <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
                          {isShipper
                            ? "Click \"Run Reconciliation\" to auto-match run tickets against BOLs for the selected period"
                            : "Your shipper has not yet reconciled tickets for this period. Once reconciled, your matched tickets and payment status will appear here."}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* SEND MONEY TAB */}
      {/* ============================================================ */}
      {activeTab === "send" && (
        <div className="max-w-lg mx-auto space-y-6">
          <Card className={`rounded-2xl ${isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-800/70 border-slate-700/50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Send className="w-5 h-5 text-blue-400" />
                Send Money
              </CardTitle>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Transfer funds instantly to any EusoTrip user
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Recipient Email</label>
                <div className="relative">
                  <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <Input
                    placeholder="user@email.com"
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    className={`pl-10 rounded-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-600'}`}
                  />
                </div>
              </div>
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Amount</label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className={`pl-10 text-xl font-bold rounded-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-600'}`}
                  />
                </div>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  Available: ${(balance?.available || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Note (optional)</label>
                <Input
                  placeholder="What's this for?"
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                  className={`rounded-xl ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-600'}`}
                />
              </div>
              <Button
                onClick={handleSendMoney}
                disabled={sendLoading || !sendAmount || !sendRecipient}
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-xl py-6 text-base font-semibold"
              >
                {sendLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send ${sendAmount || '0.00'}
              </Button>
              <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                <Lock className="w-3.5 h-3.5" />
                Secured by Stripe Connect. Transfers are instant between EusoWallet users.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARDS TAB */}
      {/* ============================================================ */}
      {activeTab === "cards" && (
        <div className="space-y-6">
          {/* Virtual Card */}
          <Card className={`rounded-2xl overflow-hidden border-0 ${isLight ? 'shadow-xl' : ''}`}>
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 relative">
              <div className="absolute top-4 right-4 opacity-20">
                <svg width="60" height="40" viewBox="0 0 60 40"><circle cx="22" cy="20" r="18" fill="white" opacity="0.5"/><circle cx="38" cy="20" r="18" fill="white" opacity="0.5"/></svg>
              </div>
              <p className="text-slate-400 text-xs tracking-widest mb-6">EUSOWALLET VIRTUAL CARD</p>
              <p className="text-white font-mono text-xl tracking-[0.25em] mb-6">•••• •••• •••• {cards[0]?.last4 || '0000'}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-[10px]">CARD HOLDER</p>
                  <p className="text-white text-sm font-medium">{cardHolderName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px]">EXPIRES</p>
                  <p className="text-white text-sm font-medium">{cards[0]?.expiry || 'MM/YY'}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-[10px]">
                    {cards[0]?.status === 'active' ? 'ACTIVE' : 'VIRTUAL'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Physical Card Order */}
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Order Physical EusoWallet Card
                  </h3>
                  <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Get a physical Visa debit card linked to your EusoWallet. Use it anywhere Visa is accepted.
                    Delivered in 5-7 business days.
                  </p>
                  <div className={`mt-3 flex items-center gap-4 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Free ATM withdrawals</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Real-time notifications</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Freeze/unfreeze anytime</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      onClick={handleOrderCard}
                      disabled={cardOrderLoading}
                      className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-xl"
                    >
                      {cardOrderLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                      Order Card — $5.00
                    </Button>
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>One-time issuance fee</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Cards List */}
          {cards.length > 0 && (
            <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Your Cards</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-700/50'}`}>
                  {cards.map((card: any) => (
                    <div key={card.id} className={`px-6 py-4 flex items-center justify-between ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/20'} transition-colors`}>
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-5 h-5 ${card.type === 'physical' ? 'text-purple-400' : 'text-blue-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {card.type === 'physical' ? 'Physical' : 'Virtual'} Card •••• {card.last4}
                          </p>
                          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Exp {card.expiry}</p>
                        </div>
                      </div>
                      <Badge className={card.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border-0'
                        : 'bg-yellow-500/20 text-yellow-400 border-0'
                      }>{card.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* BANK TAB */}
      {/* ============================================================ */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/20 flex-shrink-0">
                  <Landmark className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Connect Bank Account
                  </h3>
                  <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Link your bank account to fund your EusoWallet, receive payouts, and enable escrow deposits.
                    Powered by Stripe Financial Connections with bank-level encryption.
                  </p>
                  <div className={`mt-3 flex flex-wrap items-center gap-3 text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> ACH transfers</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Wire transfers</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Instant verification</span>
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-blue-400" /> 256-bit encryption</span>
                  </div>
                  <Button
                    onClick={handleConnectBank}
                    className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white rounded-xl"
                  >
                    <Landmark className="w-4 h-4 mr-2" />
                    Connect Bank Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          {bankAccounts.length > 0 && (
            <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-700/50'}`}>
                  {bankAccounts.map((acct: any) => (
                    <div key={acct.id} className={`px-6 py-4 flex items-center justify-between ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/20'} transition-colors`}>
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{acct.bankName}</p>
                          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>•••• {acct.last4} · {acct.type}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-0">{acct.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {bankAccounts.length === 0 && (
            <div className="text-center py-8">
              <Landmark className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
              <p className={`text-lg font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>No bank accounts connected</p>
              <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Connect a bank to fund your wallet and receive payouts</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ESCROW TAB */}
      {/* ============================================================ */}
      {activeTab === "escrow" && (
        <div className="space-y-6">
          {/* Escrow Info */}
          <Card className={`rounded-xl border-blue-500/30 ${isLight ? 'bg-blue-50' : 'bg-blue-500/10'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                <div>
                  <p className={`font-semibold text-sm ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>ESCROW PROTECTION</p>
                  <p className={`text-sm mt-1 ${isLight ? 'text-blue-600/80' : 'text-blue-200/80'}`}>
                    When you book a load, funds are held in escrow and only released to the driver upon confirmed delivery.
                    This protects both shippers and catalysts. Disputes are mediated by the EusoTrip platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Escrow Holds */}
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Active Escrow Holds</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {escrowQuery.isLoading ? (
                <div className="text-center py-12">
                  <div className={`w-6 h-6 mx-auto mb-3 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-slate-300' : 'border-slate-600'}`} />
                  <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Loading escrow holds...</p>
                </div>
              ) : escrowHolds.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                  <p className={isLight ? 'text-slate-400' : 'text-slate-500'}>No active escrow holds</p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Escrow funds will appear here when you book loads</p>
                </div>
              ) : (
                <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-700/50'}`}>
                  {escrowHolds.map((hold: any) => (
                    <div key={hold.id} className={`px-6 py-4 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/20'} transition-colors`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{hold.loadRef}</p>
                          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            {hold.route} · Driver: {hold.driverName}
                          </p>
                        </div>
                        <p className="font-bold text-lg text-yellow-400">${hold.amount.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={
                          hold.status === 'held' ? 'bg-yellow-500/20 text-yellow-400 border-0' :
                          hold.status === 'released' ? 'bg-green-500/20 text-green-400 border-0' :
                          'bg-red-500/20 text-red-400 border-0'
                        }>{hold.status}</Badge>
                        {hold.status === 'held' && (
                          <Button
                            size="sm"
                            onClick={() => handleReleaseEscrow(hold.id)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Release Funds
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TERMINAL BILLING TAB */}
      {/* ============================================================ */}
      {activeTab === "terminal" && isTerminal && (
        <div className="space-y-6">
          {/* Revenue Summary */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4`}>
            {[
              { label: "This Month Revenue", value: "$0", color: isLight ? "text-emerald-600" : "text-emerald-400", bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10", icon: <DollarSign className="w-5 h-5" /> },
              { label: "Detention Fees", value: "$0", color: isLight ? "text-amber-600" : "text-amber-400", bg: isLight ? "bg-amber-50" : "bg-amber-500/10", icon: <Clock className="w-5 h-5" /> },
              { label: "Loading Fees", value: "$0", color: isLight ? "text-blue-600" : "text-blue-400", bg: isLight ? "bg-blue-50" : "bg-blue-500/10", icon: <Receipt className="w-5 h-5" /> },
              { label: "Accessorial Charges", value: "$0", color: isLight ? "text-purple-600" : "text-purple-400", bg: isLight ? "bg-purple-50" : "bg-purple-500/10", icon: <FileText className="w-5 h-5" /> },
            ].map(k => (
              <Card key={k.label} className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center`}>
                      <span className={k.color}>{k.icon}</span>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                      <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{k.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detention Tracking */}
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                <AlertTriangle className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                Active Detention Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-center py-8`}>
                <Clock className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>No trucks currently in detention</p>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>Trucks exceeding 2-hour free time will appear here with auto-calculated fees</p>
              </div>
            </CardContent>
          </Card>

          {/* Fee Schedule */}
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <Receipt className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-[#1473FF]'}`} />
                  Fee Schedule
                </CardTitle>
                <Button variant="outline" size="sm" className={`rounded-lg text-xs ${isLight ? 'border-slate-200' : 'border-slate-600/50'}`}>
                  Edit Fees
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-700/50'}`}>
                {[
                  { fee: "Loading Fee", rate: "$400 / load", desc: "Standard rack loading operation" },
                  { fee: "Unloading Fee", rate: "$350 / load", desc: "Standard unloading operation" },
                  { fee: "Detention Rate", rate: "$75 / hour", desc: "After 2-hour free time" },
                  { fee: "Demurrage (Tankers)", rate: "$150 / day", desc: "After 24-hour free time" },
                  { fee: "After-Hours Surcharge", rate: "1.5x standard", desc: "Outside normal operating hours" },
                  { fee: "Product Heating", rate: "Cost + 15%", desc: "Temperature-sensitive products" },
                  { fee: "Rush Loading", rate: "$250 surcharge", desc: "Less than 4-hour notice" },
                  { fee: "No-Show Fee", rate: "$150 / occurrence", desc: "Missed appointment without cancellation" },
                ].map(item => (
                  <div key={item.fee} className={`flex items-center justify-between py-3 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/20'} transition-colors px-1 rounded-lg`}>
                    <div>
                      <p className={`text-sm font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>{item.fee}</p>
                      <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                    </div>
                    <span className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.rate}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terminal Invoices — Carrier Billing */}
          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  <Building2 className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                  Carrier Invoices
                </CardTitle>
                <Button size="sm" className="rounded-lg text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white hover:opacity-90">
                  Generate Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-center py-8`}>
                <FileText className={`w-8 h-8 mx-auto mb-2 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>No carrier invoices yet</p>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>Select a carrier and date range to generate terminal service invoices including loading fees, detention, and accessorials</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* HISTORY TAB */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {["all", "credit", "debit", "escrow"].map(f => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  historyFilter === f
                    ? 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white'
                    : isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'All' : f === 'credit' ? 'Received' : f === 'debit' ? 'Sent' : 'Escrow'}
              </button>
            ))}
          </div>

          <Card className={`rounded-xl ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <CardContent className="p-0">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <DollarSign className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-slate-300' : 'text-slate-600'}`} />
                  <p className={`text-lg ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>No transactions</p>
                </div>
              ) : (
                <div className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-700/50'}`}>
                  {filteredTransactions.map((t: any) => (
                    <div key={t.id} className={`px-6 py-4 flex items-center justify-between ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-700/20'} transition-colors`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          t.type === 'credit' ? 'bg-green-500/20' :
                          t.type === 'escrow' ? 'bg-yellow-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {t.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> :
                           t.type === 'escrow' ? <Shield className="w-4 h-4 text-yellow-400" /> :
                           <ArrowUpRight className="w-4 h-4 text-red-400" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                          <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{t.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold",
                          t.type === 'credit' ? 'text-green-400' :
                          t.type === 'escrow' ? 'text-yellow-400' :
                          'text-red-400'
                        )}>
                          {t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                        </p>
                        <Badge className={t.status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border-0'
                          : 'bg-yellow-500/20 text-yellow-400 border-0'
                        }>{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stripe Powered Footer */}
      <div className={`text-center py-4 flex items-center justify-center gap-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
        <Lock className="w-3.5 h-3.5" />
        <span className="text-xs">Powered by Stripe Connect, Issuing & Treasury · Bank-level security · FDIC eligible</span>
      </div>
    </div>
  );
}
