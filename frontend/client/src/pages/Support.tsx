/**
 * SUPPORT PAGE — Role-aware
 * SUPER_ADMIN / ADMIN: Support Management Dashboard (you ARE the support)
 * Other roles: User-facing ticket submission
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  HelpCircle, MessageSquare, Phone, Mail, Clock,
  CheckCircle, Plus, Send, Loader2, Bot,
  BookOpen, Shield, AlertTriangle, ChevronRight,
  Headphones, LifeBuoy, Zap, FileText, Search,
  ExternalLink, Star, TrendingUp, Inbox, Users,
  RefreshCw, Filter, Activity, BarChart3,
  Truck, MapPin, DollarSign, Settings, FileCheck,
  ChevronDown, ChevronUp, Fuel, Gauge, Lock,
  UserCheck, Building2, Route, Package, Scale,
  CreditCard, Receipt, Banknote, Wallet,
  Gavel, Handshake, PenTool, ClipboardCheck,
  ShieldCheck, Siren, Flame, BadgeCheck,
  MessageCircle, Bell, Hash,
  Upload, FolderOpen, ScanLine,
  Navigation, Database, Radio, Radar
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getApprovalStatus } from "@/lib/approvalGating";

export default function Support() {
  const { user } = useAuth();
  const role = (user?.role || "").toUpperCase();
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  if (isAdmin) return <AdminSupportView />;
  return <UserSupportView />;
}

/* ═══════════════════════════════════════════
   ADMIN VIEW — Support Management Dashboard
   ═══════════════════════════════════════════ */
function AdminSupportView() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [activeTab, setActiveTab] = useState<"queue" | "kb" | "health">("queue");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const adminKBArticles = [
    { title: "Getting Started with EusoTrip", desc: "Platform overview, navigation, and first steps", icon: <BookOpen className="w-5 h-5 text-blue-500" />, category: "Onboarding" },
    { title: "Account Setup & Verification", desc: "Profile completion, DOT/MC numbers, approval process", icon: <UserCheck className="w-5 h-5 text-green-500" />, category: "Onboarding" },
    { title: "Understanding User Roles", desc: "Shipper, Catalyst, Broker, Driver, Dispatch, Escort, Terminal Manager", icon: <Users className="w-5 h-5 text-purple-500" />, category: "Onboarding" },
    { title: "Creating & Posting Loads", desc: "Origin/destination, product details, ERG data, multi-compartment", icon: <Package className="w-5 h-5 text-blue-500" />, category: "Loads" },
    { title: "Load Status Lifecycle", desc: "Posted → Bidding → Assigned → In Transit → Delivered → Complete", icon: <Route className="w-5 h-5 text-cyan-500" />, category: "Loads" },
    { title: "Tracking Shipments", desc: "Real-time GPS tracking, status updates, delivery confirmation", icon: <MapPin className="w-5 h-5 text-red-500" />, category: "Loads" },
    { title: "Cancelling Loads & TONU", desc: "Cancellation policy and Truck Order Not Used fees", icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, category: "Loads" },
    { title: "Browsing the Marketplace", desc: "Find loads, filter, and submit competitive bids", icon: <Search className="w-5 h-5 text-green-500" />, category: "Bidding" },
    { title: "Submitting & Managing Bids", desc: "Bid lifecycle, acceptance, rejection, withdrawal", icon: <Gavel className="w-5 h-5 text-indigo-500" />, category: "Bidding" },
    { title: "Reviewing Bids", desc: "Compare bids, accept/reject, carrier notifications", icon: <ClipboardCheck className="w-5 h-5 text-blue-500" />, category: "Bidding" },
    { title: "Creating Agreements", desc: "EusoContract: templates, negotiation, execution", icon: <Handshake className="w-5 h-5 text-blue-400" />, category: "Contracts" },
    { title: "Gradient Ink Signatures", desc: "ESIGN Act-compliant digital signatures", icon: <PenTool className="w-5 h-5 text-purple-500" />, category: "Contracts" },
    { title: "Rate Sheets (Schedule A)", desc: "Upload, digitize, and link rate sheets", icon: <Receipt className="w-5 h-5 text-green-500" />, category: "Contracts" },
    { title: "Platform Fees", desc: "Dynamic commission engine (5-15%)", icon: <TrendingUp className="w-5 h-5 text-purple-500" />, category: "Billing" },
    { title: "Invoicing & Payments", desc: "Stripe-powered invoicing and settlement", icon: <CreditCard className="w-5 h-5 text-blue-500" />, category: "Billing" },
    { title: "EusoWallet", desc: "In-app payments and wallet management", icon: <Wallet className="w-5 h-5 text-emerald-500" />, category: "Billing" },
    { title: "HazMat Compliance", desc: "DOT/FMCSA requirements, 49 CFR Parts 171-180", icon: <Shield className="w-5 h-5 text-orange-500" />, category: "Compliance" },
    { title: "Hours of Service (HOS)", desc: "FMCSA driving limits, ELD compliance", icon: <Clock className="w-5 h-5 text-blue-500" />, category: "Compliance" },
    { title: "Emergency Response (ERG 2024)", desc: "ESANG AI emergency guidance, CHEMTREC", icon: <Siren className="w-5 h-5 text-red-500" />, category: "Safety" },
    { title: "Vehicle Inspections", desc: "Pre-trip inspections, maintenance, compliance", icon: <FileCheck className="w-5 h-5 text-green-500" />, category: "Compliance" },
    { title: "Fleet Management", desc: "Vehicles, drivers, assignments, utilization", icon: <Truck className="w-5 h-5 text-blue-500" />, category: "Fleet" },
    { title: "ESANG AI Assistant", desc: "Chat, ERG lookups, bid analysis, platform help", icon: <Bot className="w-5 h-5 text-blue-500" />, category: "ESANG AI" },
    { title: "Spectra-Match Product ID", desc: "Crude oil identification via spectral analysis", icon: <ScanLine className="w-5 h-5 text-purple-500" />, category: "ESANG AI" },
    { title: "Facility Intelligence", desc: "Terminals, refineries, DTN integration", icon: <Building2 className="w-5 h-5 text-blue-500" />, category: "Facilities" },
    { title: "Documents Center", desc: "BOL, POD, insurance, compliance documents", icon: <FolderOpen className="w-5 h-5 text-blue-500" />, category: "Documents" },
    { title: "Security & 2FA", desc: "Two-factor auth, password policy, login alerts", icon: <Lock className="w-5 h-5 text-green-500" />, category: "Security" },
    { title: "Messaging & Notifications", desc: "Direct messages, email/SMS notification system", icon: <MessageCircle className="w-5 h-5 text-blue-500" />, category: "Messages" },
    { title: "Hot Zones & Market Intel", desc: "Fuel prices, weather, safety data, freight rates", icon: <Flame className="w-5 h-5 text-orange-500" />, category: "Market" },
  ];

  const ticketsQuery = (trpc as any).support?.getTickets?.useQuery?.({ search: searchQuery || undefined, status: statusFilter !== "all" ? statusFilter : undefined }) || { data: [], isLoading: false };
  const summaryQuery = (trpc as any).support?.getSummary?.useQuery?.() || { data: null, isLoading: false };
  const summary = summaryQuery.data;
  const tickets: any[] = Array.isArray(ticketsQuery.data) ? ticketsQuery.data : [];

  const cc = cn("rounded-2xl border backdrop-blur-sm", L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const vl = cn("font-medium text-sm", L ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", L ? "text-slate-500" : "text-slate-400");

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", in_progress: "bg-blue-500/15 text-blue-500 border-blue-500/30", resolved: "bg-green-500/15 text-green-500 border-green-500/30", closed: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
    return <Badge className={cn("border text-[10px] font-bold", map[status] || map.closed)}>{status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Unknown"}</Badge>;
  };

  const priorityDot = (p: string) => {
    const map: Record<string, string> = { urgent: "bg-red-500", high: "bg-orange-500", medium: "bg-blue-500", low: "bg-slate-400" };
    return <div className={cn("w-2 h-2 rounded-full flex-shrink-0", map[p] || map.medium)} title={p} />;
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Support Management</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Headphones className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Admin</span>
            </div>
          </div>
          <p className={cn("text-sm mt-1", mt)}>Manage incoming tickets, platform health & knowledge base</p>
        </div>
        <Button variant="outline" size="sm" className={cn("rounded-xl", L ? "border-slate-200" : "border-slate-700")} onClick={() => { ticketsQuery?.refetch?.(); summaryQuery?.refetch?.(); }}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh
        </Button>
      </div>

      {/* ESANG AI Banner */}
      <div className={cn("p-4 rounded-2xl border", L ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-slate-700/50")}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex-shrink-0"><Bot className="w-7 h-7 text-blue-500" /></div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-bold", vl)}>ESANG AI handles Tier 1 support automatically</p>
            <p className="text-xs text-slate-400">Users can ask ESANG AI compliance questions, ERG lookups, platform help, and troubleshooting before creating a ticket.</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-bold text-green-500">AI Active</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tickets", value: summary?.total ?? 0, icon: <Inbox className="w-4 h-4" />, color: "text-blue-500", bg: "from-blue-500/10 to-blue-600/5" },
          { label: "Open", value: summary?.open ?? 0, icon: <Clock className="w-4 h-4" />, color: "text-yellow-500", bg: "from-yellow-500/10 to-yellow-600/5" },
          { label: "In Progress", value: summary?.inProgress ?? 0, icon: <Zap className="w-4 h-4" />, color: "text-blue-400", bg: "from-blue-400/10 to-blue-500/5" },
          { label: "Resolved", value: summary?.resolved ?? 0, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500", bg: "from-green-500/10 to-green-600/5" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl p-4 bg-gradient-to-br border", L ? `${s.bg} border-slate-200/60` : `${s.bg} border-slate-700/30`)}>
            <div className="flex items-center justify-between mb-2"><span className={s.color}>{s.icon}</span></div>
            <p className={cn("text-2xl font-bold tracking-tight", s.color)}>{s.value}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={cn("flex items-center gap-1 p-1 rounded-xl w-fit", L ? "bg-slate-100" : "bg-slate-800/60")}>
        {[
          { id: "queue" as const, label: "Ticket Queue", icon: Inbox },
          { id: "kb" as const, label: "Knowledge Base", icon: BookOpen },
          { id: "health" as const, label: "Platform Health", icon: Activity },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all",
            activeTab === tab.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : L ? "text-slate-500 hover:text-slate-700" : "text-slate-400 hover:text-white"
          )}><tab.icon className="w-3.5 h-3.5" />{tab.label}</button>
        ))}
      </div>

      {/* TICKET QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", L ? "text-slate-400" : "text-slate-500")} />
              <Input value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} placeholder="Search tickets..." className={cn("pl-10 rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700")} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("w-[150px] rounded-xl", L ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700")}><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className={cc}>
            <CardContent className="p-0">
              {ticketsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3].map((i: number) => <div key={i} className={cn("h-20 rounded-xl animate-pulse", L ? "bg-slate-100" : "bg-slate-800")} />)}</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 flex items-center justify-center">
                    <Inbox className="w-10 h-10 text-slate-400/40" />
                  </div>
                  <p className={cn("font-bold text-lg mb-2", vl)}>No incoming tickets</p>
                  <p className={cn("text-sm max-w-md mx-auto mb-6", mt)}>When users submit support tickets, they'll appear here for you to triage and resolve. ESANG AI handles Tier 1 questions automatically.</p>
                  <div className={cn("p-4 rounded-xl border max-w-sm mx-auto", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/30 border-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="w-5 h-5 text-green-500" /></div>
                      <div className="text-left">
                        <p className={cn("font-semibold text-xs", vl)}>All clear</p>
                        <p className="text-[11px] text-slate-400">No tickets need your attention right now</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn("divide-y", L ? "divide-slate-100" : "divide-slate-700/30")}>
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className={cn("p-4 transition-all cursor-pointer group", L ? "hover:bg-blue-50/50" : "hover:bg-slate-700/20")}>
                      <div className="flex items-start gap-3">
                        {priorityDot(ticket.priority || "medium")}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className={cn("font-bold text-sm", vl)}>{ticket.subject || "Untitled"}</p>
                            {statusBadge(ticket.status)}
                          </div>
                          <p className={cn("text-xs line-clamp-1 mb-1.5", mt)}>{ticket.message || ""}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            {ticket.userName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ticket.userName}</span>}
                            {ticket.createdAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(ticket.createdAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 flex-shrink-0 mt-2", L ? "text-slate-300" : "text-slate-600")} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* KNOWLEDGE BASE */}
      {activeTab === "kb" && (
        <div className="space-y-3">
          <p className={cn("text-xs", mt)}>Knowledge base articles visible to users. {adminKBArticles.length} articles across all categories and roles.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adminKBArticles.map((article, i) => (
              <Card key={i} className={cn(cc, "hover:shadow-md transition-shadow cursor-pointer")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0", L ? "bg-slate-50" : "bg-slate-800/50")}>{article.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className={cn("font-bold text-sm", vl)}>{article.title}</p>
                        <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border text-[9px]">{article.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{article.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PLATFORM HEALTH */}
      {activeTab === "health" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: <Bot className="w-6 h-6 text-blue-500" />, title: "ESANG AI (Tier 1)", desc: "Handles compliance, ERG, platform help automatically", status: "Active", sc: "text-green-500", bg: "bg-blue-500/15" },
            { icon: <Mail className="w-6 h-6 text-purple-500" />, title: "Email Inbox", desc: "support@eusotrip.com — forwarded to this queue", status: "Connected", sc: "text-green-500", bg: "bg-purple-500/15" },
            { icon: <MessageSquare className="w-6 h-6 text-cyan-500" />, title: "Support Tickets", desc: "In-platform ticket system — tracked, prioritized, notified", status: "Active", sc: "text-green-500", bg: "bg-cyan-500/15" },
            { icon: <Shield className="w-6 h-6 text-orange-500" />, title: "Emergency (CHEMTREC)", desc: "1-800-424-9300 — Hazmat spill & transport emergencies", status: "External", sc: "text-orange-500", bg: "bg-orange-500/15" },
          ].map((ch, i) => (
            <div key={i} className={cn("rounded-2xl p-5 border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/40 border-slate-700/40")}>
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-xl flex-shrink-0", ch.bg)}>{ch.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn("font-bold text-sm", vl)}>{ch.title}</p>
                    <span className={cn("text-[10px] font-bold", ch.sc)}>{ch.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{ch.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   USER VIEW — Ticket Submission (original)
   ═══════════════════════════════════════════ */
function UserSupportView() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();
  type Tab = "tickets" | "new" | "kb" | "contact";
  const [activeTab, setActiveTab] = useState<Tab>("tickets");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");

  const { user } = useAuth();
  const isApproved = getApprovalStatus(user) === "approved";

  const ticketsQuery = (trpc as any).support?.getTickets?.useQuery?.() || { data: [], isLoading: false };
  const summaryQuery = (trpc as any).support?.getSummary?.useQuery?.() || { data: null, isLoading: false };

  const createTicketMutation = (trpc as any).support?.createTicket?.useMutation?.({
    onSuccess: () => { toast.success("Ticket created successfully"); setSubject(""); setMessage(""); setPriority("medium"); setCategory("general"); ticketsQuery?.refetch?.(); summaryQuery?.refetch?.(); },
    onError: (error: any) => toast.error("Failed to create ticket", { description: error?.message }),
  }) || { mutate: () => toast.error("Support system unavailable"), isPending: false };

  const summary = summaryQuery.data;
  const tickets: any[] = Array.isArray(ticketsQuery.data) ? ticketsQuery.data : [];

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cl = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const vl = cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white");
  const mt = cn("text-sm", isLight ? "text-slate-500" : "text-slate-400");
  const ic = cn("rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500");
  const lb = cn("text-xs font-medium mb-1.5 block", isLight ? "text-slate-600" : "text-slate-400");

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      resolved: "bg-green-500/15 text-green-500 border-green-500/30",
      open: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
      in_progress: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      closed: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    };
    return <Badge className={cn("border text-[10px] font-bold", map[status] || map.closed)}>{status?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Unknown"}</Badge>;
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = {
      urgent: "bg-red-500/15 text-red-400 border-red-500/30",
      high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    };
    return <Badge className={cn("border text-[10px]", map[p] || map.medium)}>{p}</Badge>;
  };

  const userRole = (user?.role || "SHIPPER").toUpperCase();

  const kbArticles: { title: string; desc: string; icon: React.ReactNode; category: string; roles: string[]; content: string }[] = [
    // ── GETTING STARTED ──────────────────────────────────────────
    { title: "Getting Started with EusoTrip", desc: "Platform overview, navigation, and your first steps", icon: <BookOpen className="w-5 h-5 text-blue-500" />, category: "Getting Started", roles: ["ALL"],
      content: "EusoTrip is a hazmat and energy logistics platform connecting shippers, catalysts (carriers), brokers, drivers, escorts, and terminal operators. After registration and account approval, you'll access your role-specific dashboard with loads, bids, fleet management, compliance tools, and ESANG AI assistant. Use the left sidebar to navigate between sections. Your dashboard shows key metrics, recent activity, and quick actions tailored to your role." },
    { title: "Account Setup & Verification", desc: "Complete your profile, company info, DOT/MC numbers, and get approved", icon: <UserCheck className="w-5 h-5 text-green-500" />, category: "Getting Started", roles: ["ALL"],
      content: "After registration, complete your profile with company information, DOT number, MC number, and insurance details. Upload required documents (operating authority, insurance certificates, W-9). Your account will be reviewed and approved by our team. You'll receive an email and SMS notification once approved. Until approved, some features like ESANG AI and load posting are restricted." },
    { title: "Understanding User Roles", desc: "Shipper, Catalyst, Broker, Driver, Dispatch, Escort, Terminal Manager", icon: <Users className="w-5 h-5 text-purple-500" />, category: "Getting Started", roles: ["ALL"],
      content: "SHIPPER: Posts loads, reviews bids, manages shipments. CATALYST (Carrier): Browses marketplace, submits bids, hauls loads. BROKER: Connects shippers with carriers, manages agreements. DRIVER: Assigned to loads, updates status in transit, manages HOS. DISPATCH: Assigns drivers/vehicles, monitors fleet. ESCORT (Pilot Vehicle): Accompanies oversized/hazmat loads. TERMINAL MANAGER: Manages facility operations, DTN integration, inbound visibility. Each role has a customized dashboard and feature set." },

    // ── LOADS & SHIPMENTS ─────────────────────────────────────────
    { title: "Creating & Posting Loads", desc: "How to create a load with origin, destination, product details, and ERG data", icon: <Package className="w-5 h-5 text-blue-500" />, category: "Loads", roles: ["SHIPPER", "BROKER", "DISPATCH"],
      content: "Navigate to Dashboard > Post New Load. Enter origin and destination addresses, pickup and delivery dates, product information (name, UN number, hazmat class), weight/volume, and rate. For hazmat loads, ESANG AI automatically populates ERG guide numbers, placards, and safety data via Spectra-Match. Multi-compartment loads are supported — add compartment details with individual products and volumes. Once posted, your load appears on the marketplace for catalysts to bid on. You'll receive email and SMS notifications for every bid." },
    { title: "Load Status Lifecycle", desc: "From posted to delivered: every status your load goes through", icon: <Route className="w-5 h-5 text-cyan-500" />, category: "Loads", roles: ["ALL"],
      content: "Posted → Bidding → Awarded → Assigned → Confirmed → En Route Pickup → At Pickup → Loading → Loaded → In Transit → At Delivery → Unloading → Delivered → Invoiced → Paid → Complete. Each status change triggers real-time WebSocket updates on your dashboard and email/SMS notifications to all parties. Cancelled and On Hold statuses are available at any point. The catalyst/driver updates status from their mobile device as the load progresses." },
    { title: "Tracking Your Shipments", desc: "Real-time GPS tracking, status updates, and delivery confirmation", icon: <MapPin className="w-5 h-5 text-red-500" />, category: "Loads", roles: ["SHIPPER", "BROKER", "DISPATCH"],
      content: "Use Fleet Tracking in the sidebar to view all active loads on a map. Each load shows real-time GPS position (when the driver updates), current status, ETA, and route. The Load Details page shows a full timeline of every status change with timestamps. When a load is delivered, you'll receive a delivery confirmation email and SMS. Post-delivery, review the BOL and POD documents in the Documents section." },
    { title: "Cancelling a Load & TONU Fees", desc: "How to cancel a load and understand Truck Order Not Used fees", icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, category: "Loads", roles: ["SHIPPER", "BROKER", "CATALYST"],
      content: "Loads can be cancelled from the Load Details page. If a catalyst has already been assigned and is en route, a TONU (Truck Order Not Used) fee applies: $250 or 25% of the load rate, whichever is greater. This protects carriers from deadhead costs. Draft loads can be deleted without penalty. All pending bids are automatically rejected when a load is cancelled. Both shipper and catalyst receive email/SMS notification of the cancellation." },

    // ── BIDDING & MARKETPLACE ────────────────────────────────────
    { title: "Browsing the Load Marketplace", desc: "Find available loads, filter by type, and submit competitive bids", icon: <Search className="w-5 h-5 text-green-500" />, category: "Bidding", roles: ["CATALYST", "BROKER", "DRIVER"],
      content: "Navigate to Find Loads or Marketplace to browse all posted loads. Filter by cargo type, origin/destination, date, and rate. Each load card shows the shipper rating, route, product type, and estimated rate. Click a load to view full details including ERG data, special instructions, and compartment configuration. Use ESANG AI's bid analysis to get recommended pricing based on market rates, distance, and your operating costs." },
    { title: "Submitting & Managing Bids", desc: "How to bid on loads, track bid status, and handle acceptance/rejection", icon: <Gavel className="w-5 h-5 text-indigo-500" />, category: "Bidding", roles: ["CATALYST", "BROKER"],
      content: "From a load detail page, click 'Place Bid' and enter your amount and any notes. Your bid appears in the shipper's bid management view. Bid statuses: Pending (awaiting review), Accepted (you got the load), Rejected (shipper chose another), Withdrawn (you cancelled). When your bid is accepted, the load is automatically assigned to you and you'll receive email + SMS confirmation. View all your bids in My Bids. ESANG AI can analyze whether your bid is competitive based on market data." },
    { title: "Reviewing Bids on Your Loads", desc: "How to compare, accept, and reject bids from catalysts", icon: <ClipboardCheck className="w-5 h-5 text-blue-500" />, category: "Bidding", roles: ["SHIPPER", "BROKER"],
      content: "When catalysts bid on your load, you'll receive real-time notifications (in-app, email, and SMS). Navigate to your load and click 'Review Bids' to see all bids with carrier name, company, bid amount, and notes. Accept the best bid — this automatically assigns the carrier, rejects all other pending bids, and triggers email/SMS notifications to all parties. You can also reject individual bids with an optional reason." },

    // ── AGREEMENTS & CONTRACTS ───────────────────────────────────
    { title: "Creating Agreements (EusoContract)", desc: "Draft, negotiate, and execute carrier/shipper agreements", icon: <Handshake className="w-5 h-5 text-blue-400" />, category: "Agreements", roles: ["SHIPPER", "CATALYST", "BROKER"],
      content: "Navigate to Agreements to create contracts between shippers and carriers. Choose from templates (Carrier-Shipper, Broker, Lane Contract) or generate from strategic inputs using ESANG AI. Add clauses, set terms, specify jurisdiction, and define rate structures. Agreements support full negotiation workflows — propose amendments, accept/reject changes, and track version history. Link a Rate Sheet (Schedule A) to define mileage-based pricing tiers." },
    { title: "Gradient Ink Digital Signatures", desc: "How EusoTrip's ESIGN Act-compliant digital signature system works", icon: <PenTool className="w-5 h-5 text-purple-500" />, category: "Agreements", roles: ["SHIPPER", "CATALYST", "BROKER"],
      content: "Gradient Ink™ is EusoTrip's digital signature system, fully compliant with the ESIGN Act (15 U.S.C. ch. 96) and UETA. When you sign an agreement, a SHA-256 hash is generated from your user ID, timestamp, and a cryptographic salt. Your IP address and user agent are recorded for audit trail. When both parties have signed, the agreement is automatically activated and filed to both parties' Documents Center. You'll receive email + SMS confirmation of the fully executed agreement." },
    { title: "Rate Sheets (Schedule A)", desc: "Upload, digitize, and link rate sheets to agreements", icon: <Receipt className="w-5 h-5 text-green-500" />, category: "Agreements", roles: ["SHIPPER", "CATALYST", "BROKER"],
      content: "Rate Sheets define pricing tiers by mileage ($/barrel). Upload CSV, XLSX, or PDF rate sheets — ESANG AI automatically digitizes them using Spectra-Match. The system extracts mileage tiers, rates per barrel, and surcharges (FSC, wait time, split load fees, reject fees). Rate sheets can be linked to agreements as Schedule A. View and edit tiers, adjust surcharges, and compare rates across carriers." },

    // ── BILLING & PAYMENTS ───────────────────────────────────────
    { title: "Understanding Platform Fees", desc: "How the dynamic commission engine calculates fees (5-15%)", icon: <TrendingUp className="w-5 h-5 text-purple-500" />, category: "Billing", roles: ["ALL"],
      content: "EusoTrip charges a dynamic platform fee on completed loads, ranging from 5% to 15%. The fee is calculated by the Commission Engine based on: load value, user tier (volume discounts), cargo type, route complexity, and market conditions. Fees are only collected when a load is marked as delivered. Your fee tier is visible in your account settings. High-volume users automatically qualify for lower rates. No fees on cancelled loads or draft agreements." },
    { title: "Invoicing & Payments", desc: "Stripe-powered invoicing, payment processing, and settlement", icon: <CreditCard className="w-5 h-5 text-blue-500" />, category: "Billing", roles: ["SHIPPER", "CATALYST", "BROKER"],
      content: "EusoTrip uses Stripe for invoicing and payment processing. After delivery, invoices are generated with load details, rate, and platform fee breakdown. Shippers can pay via credit card, ACH, or wire transfer. Catalysts receive settlements to their connected Stripe account. View all invoices, payment history, and outstanding balances in the Payments section. Email notifications are sent for every payment event." },
    { title: "EusoWallet & In-App Payments", desc: "Send and receive payments between users via the platform wallet", icon: <Wallet className="w-5 h-5 text-emerald-500" />, category: "Billing", roles: ["ALL"],
      content: "EusoWallet is your in-platform payment system. Send payments to other users, request payments, and track your balance. Wallet transactions are instant between EusoTrip users. You can fund your wallet via Stripe or receive payments from load completions. View transaction history, pending requests, and balance in the EusoWallet section. All wallet transactions trigger email and SMS notifications." },

    // ── COMPLIANCE & SAFETY ──────────────────────────────────────
    { title: "HazMat Compliance Guide", desc: "DOT/FMCSA requirements for hazardous materials transport", icon: <Shield className="w-5 h-5 text-orange-500" />, category: "Compliance", roles: ["ALL"],
      content: "All hazmat shipments on EusoTrip must comply with 49 CFR Parts 171-180. Required: valid CDL with hazmat endorsement (H), TWIC card for port/terminal access, current medical certificate, vehicle inspection within 90 days. EusoTrip automatically validates ERG guide numbers, UN numbers, and placard requirements for every load. The platform flags non-compliant loads and provides corrective guidance via ESANG AI. Emergency: call CHEMTREC at 1-800-424-9300 for spill response." },
    { title: "Hours of Service (HOS) Rules", desc: "FMCSA driving limits, rest requirements, and ELD compliance", icon: <Clock className="w-5 h-5 text-blue-500" />, category: "Compliance", roles: ["DRIVER", "CATALYST", "DISPATCH"],
      content: "FMCSA HOS rules: 11-hour driving limit after 10 consecutive hours off duty. 14-hour on-duty window. 30-minute break required after 8 hours of driving. 60/70-hour weekly limit with 34-hour restart. ELD (Electronic Logging Device) is mandatory for all CMVs. EusoTrip's HOS engine tracks your available hours and alerts when approaching limits. Violations are flagged in real-time and may affect your safety score on the platform." },
    { title: "Emergency Response (ERG 2024)", desc: "Using ESANG AI for real-time emergency guidance", icon: <Siren className="w-5 h-5 text-red-500" />, category: "Compliance", roles: ["ALL"],
      content: "ESANG AI has the complete ERG 2024 database built in. Ask ESANG AI any question about a UN number, ERG guide, or hazmat material and get instant safety data: isolation distances, protective actions, fire response, spill procedures, and first aid. In an emergency, call 911 first, then CHEMTREC at 1-800-424-9300. ESANG AI can also classify materials by DOT hazard class and provide placard requirements." },
    { title: "Vehicle Inspections & Maintenance", desc: "Pre-trip inspections, maintenance schedules, and compliance records", icon: <FileCheck className="w-5 h-5 text-green-500" />, category: "Compliance", roles: ["DRIVER", "CATALYST", "DISPATCH"],
      content: "Drivers must complete pre-trip and post-trip inspections per FMCSA §396.11-13. EusoTrip tracks vehicle inspection history, maintenance schedules, and compliance status in the Fleet section. Upload inspection reports, maintenance receipts, and DOT inspection results. Vehicles with expired inspections are flagged and cannot be assigned to loads until updated. Annual DOT inspections are required for all CMVs." },

    // ── FLEET MANAGEMENT ─────────────────────────────────────────
    { title: "Managing Your Fleet", desc: "Add vehicles, assign drivers, and track fleet performance", icon: <Truck className="w-5 h-5 text-blue-500" />, category: "Fleet", roles: ["CATALYST", "DISPATCH"],
      content: "Navigate to Fleet to manage your vehicles and drivers. Add vehicles with VIN, make/model, year, trailer type, and capacity. Assign drivers to vehicles with their CDL info, endorsements, and medical card expiration. Track fleet utilization, maintenance schedules, and compliance status. The fleet dashboard shows active loads per vehicle, driver availability, and upcoming maintenance/inspection deadlines." },
    { title: "Driver Management", desc: "Add drivers, track CDL/endorsements, HOS, and assignments", icon: <BadgeCheck className="w-5 h-5 text-cyan-500" />, category: "Fleet", roles: ["CATALYST", "DISPATCH"],
      content: "Add drivers with their CDL number, state, class, endorsements (H, N, T, X), medical card expiration, and TWIC card status. Assign drivers to vehicles and loads. Track HOS compliance in real-time. View driver scorecards with on-time delivery rate, safety score, and load history. Drivers receive push notifications when assigned to a new load with full route and product details." },

    // ── ESANG AI ─────────────────────────────────────────────────
    { title: "ESANG AI: Your Platform Assistant", desc: "Chat with AI for compliance, ERG lookups, bid analysis, and platform help", icon: <Bot className="w-5 h-5 text-blue-500" />, category: "ESANG AI", roles: ["ALL"],
      content: "ESANG AI is EusoTrip's built-in AI assistant powered by Google Gemini. It can: answer compliance questions (DOT, FMCSA, hazmat regs), look up ERG 2024 data by UN number or material name, analyze bid competitiveness using ML models, explain any platform feature, troubleshoot issues, and provide role-specific guidance. Access ESANG AI via the chat icon in the bottom-right corner of any page. Your chat history is saved for reference." },
    { title: "Spectra-Match Product Identification", desc: "How crude oil identification works with spectral analysis", icon: <ScanLine className="w-5 h-5 text-purple-500" />, category: "ESANG AI", roles: ["SHIPPER", "CATALYST", "BROKER", "TERMINAL_MANAGER"],
      content: "Spectra-Match is EusoTrip's crude oil identification system. When creating a load, enter spectral analysis data (API gravity, BS&W, sulfur content, flash point, viscosity, pour point, Reid vapor pressure, appearance) and Spectra-Match classifies the product, determines the correct UN number, hazmat class, ERG guide, and placard requirements. This ensures every crude oil shipment has accurate safety data from origin to destination." },
    { title: "ESANG AI Bid Analysis", desc: "ML-powered bid recommendations based on market data", icon: <Gauge className="w-5 h-5 text-green-500" />, category: "ESANG AI", roles: ["CATALYST", "BROKER"],
      content: "Ask ESANG AI to analyze a bid and it will use the ML engine to evaluate: current market rates for the lane, fuel costs, distance, load type, seasonal demand, and your operating costs. It provides a recommended bid range and rates your bid as competitive, fair, or aggressive. This helps catalysts price bids optimally and win more loads while maintaining profitability." },

    // ── FACILITY INTELLIGENCE ────────────────────────────────────
    { title: "Facility Intelligence (FIL)", desc: "Search terminals, refineries, and rack facilities across the US", icon: <Building2 className="w-5 h-5 text-blue-500" />, category: "Facilities", roles: ["SHIPPER", "CATALYST", "TERMINAL_MANAGER"],
      content: "Facility Intelligence gives you access to thousands of terminals, refineries, and rack facilities sourced from the EIA. Search by name, operator, city, or state. View facility details including type, capacity, location, user ratings, average wait times, and requirements (TWIC, orientation, PPE). Claim your facility to manage its profile, respond to ratings, and configure DTN integration. Use the nearby search to find facilities within a radius." },
    { title: "DTN Integration", desc: "Connect your terminal to DTN for allocation, credit checks, and rack pricing", icon: <Database className="w-5 h-5 text-green-500" />, category: "Facilities", roles: ["TERMINAL_MANAGER"],
      content: "Terminal managers can connect their facility to DTN for real-time data exchange. Configure API credentials, enable bidirectional sync, and access: terminal allocation data, credit checks, driver pre-clearance, loading progress monitoring, inventory levels, and rack pricing. The DTN Sync Dashboard shows connection status, data flow logs, and sync statistics. All DTN events are logged for audit purposes." },
    { title: "Inbound Visibility Dashboard", desc: "Track approaching trucks and demand forecasts for your terminal", icon: <Radar className="w-5 h-5 text-cyan-500" />, category: "Facilities", roles: ["TERMINAL_MANAGER"],
      content: "The Inbound Dashboard shows all trucks approaching your terminal within a 150-mile radius, with real-time position, ETA, product type, and driver information. View 24/48/72-hour demand forecasts by product to plan staffing and inventory. The dashboard refreshes every 30 seconds with live GPS data from active loads destined for your facility." },

    // ── DOCUMENTS ────────────────────────────────────────────────
    { title: "Documents Center", desc: "Upload, manage, and organize all your business documents", icon: <FolderOpen className="w-5 h-5 text-blue-500" />, category: "Documents", roles: ["ALL"],
      content: "The Documents Center stores all your platform documents: BOLs, PODs, rate confirmations, insurance certificates, operating authority, W-9s, agreements, rate sheets, and compliance records. Documents are automatically filed when agreements are executed or loads are completed. Upload new documents with type classification, add tags, and search across all your files. Documents are encrypted at rest with AES-256." },
    { title: "BOL & POD Management", desc: "Bills of Lading and Proof of Delivery for completed shipments", icon: <Upload className="w-5 h-5 text-orange-500" />, category: "Documents", roles: ["SHIPPER", "CATALYST", "DRIVER"],
      content: "After a load is delivered, upload the Bill of Lading (BOL) and Proof of Delivery (POD) from the Load Details page. These documents are required before invoicing can proceed. Supported formats: PDF, JPG, PNG. Documents are automatically linked to the load and accessible by both shipper and catalyst. Missing BOL/POD documents are flagged in the post-delivery documentation gate." },

    // ── ACCOUNT & SECURITY ───────────────────────────────────────
    { title: "Two-Factor Authentication (2FA)", desc: "Secure your account with SMS-based two-factor authentication", icon: <Lock className="w-5 h-5 text-green-500" />, category: "Security", roles: ["ALL"],
      content: "Enable 2FA in Account Settings > Security. When enabled, you'll receive a 6-digit code via SMS every time you log in from a new device. 2FA is strongly recommended for all accounts, especially those with financial access. You'll receive email confirmation when 2FA is enabled or disabled. If you lose access to your phone, contact support for account recovery." },
    { title: "Password & Login Security", desc: "Password requirements, reset process, and login alerts", icon: <ShieldCheck className="w-5 h-5 text-blue-500" />, category: "Security", roles: ["ALL"],
      content: "Passwords must be at least 8 characters. To change your password, go to Account Settings > Security. Forgot your password? Use the 'Forgot Password' link on the login page to receive a reset email. EusoTrip monitors login activity — you'll receive an email alert when your account is accessed from a new device or location, including the IP address and browser information." },

    // ── MESSAGES & NOTIFICATIONS ─────────────────────────────────
    { title: "Messaging & Communication", desc: "Direct messages, group conversations, and load-linked chats", icon: <MessageCircle className="w-5 h-5 text-blue-500" />, category: "Messages", roles: ["ALL"],
      content: "EusoTrip has a built-in messaging system. Start direct conversations with any user, create group chats, or use load-linked conversations to discuss specific shipments. Messages support text, images, documents, location sharing, and voice messages. All messages are encrypted and stored securely. You'll receive email and SMS notifications for new messages when you're offline." },
    { title: "Notification Preferences", desc: "Control which email and SMS notifications you receive", icon: <Bell className="w-5 h-5 text-yellow-500" />, category: "Messages", roles: ["ALL"],
      content: "EusoTrip sends notifications via in-app alerts, email, and SMS for important events: load posted, bid received/accepted/rejected, load status changes, delivery confirmation, payment events, agreement signatures, new messages, and security alerts. All notifications use branded EusoTrip email templates. Emergency notifications (load cancelled, account security) are always sent regardless of preferences." },

    // ── MARKET INTELLIGENCE ──────────────────────────────────────
    { title: "Hot Zones & Market Intelligence", desc: "Real-time fuel prices, weather alerts, safety data, and freight rates", icon: <Flame className="w-5 h-5 text-orange-500" />, category: "Market", roles: ["ALL"],
      content: "Market Intelligence aggregates real-time data from 10+ federal sources: NWS weather alerts, EIA diesel fuel prices by PADD region, FMCSA carrier safety scores, USGS seismic events, NIFC wildfire data, FEMA disaster declarations, EPA facility compliance, USDA truck rates, and USACE lock status. View zone-by-zone risk scores, rate trends, and operational intelligence to make informed routing and pricing decisions." },
    { title: "Operating Authority & FMCSA Lookup", desc: "Verify carrier authority, safety ratings, and compliance status", icon: <Scale className="w-5 h-5 text-blue-500" />, category: "Market", roles: ["SHIPPER", "BROKER"],
      content: "Use Operating Authority in the sidebar to look up any carrier's FMCSA data by DOT number or MC number. View authority status (active/inactive), safety rating, insurance on file, BASICs scores, inspection history, and crash data. This helps shippers verify carrier qualifications before accepting bids. EusoTrip validates carrier authority during registration and flags expired or revoked authority." },
  ];

  const kbCategories = ["All", "Getting Started", "Loads", "Bidding", "Agreements", "Billing", "Compliance", "Fleet", "ESANG AI", "Facilities", "Documents", "Security", "Messages", "Market"];
  const [kbCategory, setKbCategory] = useState("All");
  const [kbSearch, setKbSearch] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);

  const filteredArticles = kbArticles.filter(a => {
    const matchesRole = a.roles.includes("ALL") || a.roles.includes(userRole);
    const matchesCategory = kbCategory === "All" || a.category === kbCategory;
    const matchesSearch = !kbSearch || a.title.toLowerCase().includes(kbSearch.toLowerCase()) || a.desc.toLowerCase().includes(kbSearch.toLowerCase()) || a.content.toLowerCase().includes(kbSearch.toLowerCase());
    return matchesRole && matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Support Center</h1>
          <p className={mt}>Get help, manage tickets & explore the knowledge base</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className={cn("rounded-xl", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setActiveTab("kb")}>
            <BookOpen className="w-4 h-4 mr-2" />Knowledge Base
          </Button>
          <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setActiveTab("new")}>
            <Plus className="w-4 h-4 mr-2" />New Ticket
          </Button>
        </div>
      </div>

      {/* ESANG AI Quick Help */}
      <div className={cn("p-4 rounded-2xl border", isLight ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" : "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-slate-700")}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex-shrink-0">
            <Bot className="w-7 h-7 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-bold", vl)}>{isApproved ? "Need instant help? Ask ESANG AI" : "ESANG AI — Available Once Approved"}</p>
            <p className="text-xs text-slate-400">{isApproved
              ? "Our AI assistant can answer compliance questions, look up ERG data, explain platform features, and help troubleshoot issues — 24/7."
              : "Once your account is approved, ESANG AI will be available to answer compliance questions, look up ERG data, explain platform features, and help troubleshoot issues — 24/7."
            }</p>
          </div>
          <Button
            className={cn(
              "rounded-xl font-bold flex-shrink-0 h-10",
              isApproved
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            )}
            disabled={!isApproved}
            onClick={() => { if (isApproved) toast.info("ESANG AI is available via the chat icon in the bottom-right corner"); }}
          >
            <EsangIcon className="w-4 h-4 mr-2" />{isApproved ? "Chat with ESANG AI" : "Pending Approval"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tickets", value: summary?.total ?? 0, icon: <MessageSquare className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-500/15" },
          { label: "Open", value: summary?.open ?? 0, icon: <Clock className="w-4 h-4" />, color: "text-yellow-500", bg: "bg-yellow-500/15" },
          { label: "In Progress", value: summary?.inProgress ?? 0, icon: <Zap className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-400/15" },
          { label: "Resolved", value: summary?.resolved ?? 0, icon: <CheckCircle className="w-4 h-4" />, color: "text-green-500", bg: "bg-green-500/15" },
        ].map(s => (
          <div key={s.label} className={cl}>
            <div className="flex items-center gap-2 mb-1">
              <div className={cn("p-1.5 rounded-lg", s.bg)}><span className={s.color}>{s.icon}</span></div>
              <span className="text-[10px] uppercase text-slate-400 font-bold">{s.label}</span>
            </div>
            <p className={cn("text-xl font-bold", vl)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {([
          { id: "tickets" as Tab, label: "My Tickets", icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: "new" as Tab, label: "New Ticket", icon: <Plus className="w-3.5 h-3.5" /> },
          { id: "kb" as Tab, label: "Knowledge Base", icon: <BookOpen className="w-3.5 h-3.5" /> },
          { id: "contact" as Tab, label: "Contact Us", icon: <Headphones className="w-3.5 h-3.5" /> },
        ]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all",
            activeTab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md" : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          )}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* MY TICKETS */}
      {activeTab === "tickets" && (
        <Card className={cc}>
          <CardContent className="p-0">
            {ticketsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <div key={i} className={cn("h-20 rounded-xl animate-pulse", isLight ? "bg-slate-100" : "bg-slate-800")} />)}</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 flex items-center justify-center">
                  <LifeBuoy className="w-8 h-8 text-slate-400" />
                </div>
                <p className={cn("font-bold text-lg mb-1", vl)}>No support tickets</p>
                <p className={cn("text-sm mb-6", mt)}>Need help? Create a ticket or chat with ESANG AI for instant answers.</p>
                <div className="flex gap-3 justify-center">
                  <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => setActiveTab("new")}>
                    <Plus className="w-4 h-4 mr-2" />Create Ticket
                  </Button>
                  <Button variant="outline" className={cn("rounded-xl", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setActiveTab("kb")}>
                    <BookOpen className="w-4 h-4 mr-2" />Browse FAQ
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/50")}>
                {tickets.map((ticket: any) => (
                  <div key={ticket.id} className={cn("p-4 transition-colors cursor-pointer", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={cn("font-bold text-sm", vl)}>{ticket.subject}</p>
                          {statusBadge(ticket.status)}
                          {ticket.priority && priorityBadge(ticket.priority)}
                        </div>
                        <p className={cn("text-xs line-clamp-1 mb-1", mt)}>{ticket.message}</p>
                        <p className="text-[10px] text-slate-400">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ""}</p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 flex-shrink-0 mt-1", isLight ? "text-slate-300" : "text-slate-600")} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* NEW TICKET */}
      {activeTab === "new" && (
        <Card className={cc}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("flex items-center gap-2 text-lg", vl)}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15"><Plus className="w-4 h-4 text-blue-500" /></div>
              Create Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={lb}>Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="billing">Billing & Payments</SelectItem>
                    <SelectItem value="load_issue">Load Issue</SelectItem>
                    <SelectItem value="catalyst_dispute">Catalyst Dispute</SelectItem>
                    <SelectItem value="compliance">Compliance & Safety</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="account">Account & Profile</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={lb}>Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className={ic}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — General inquiry</SelectItem>
                    <SelectItem value="medium">Medium — Needs attention</SelectItem>
                    <SelectItem value="high">High — Affecting operations</SelectItem>
                    <SelectItem value="urgent">Urgent — Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className={lb}>Subject</label>
              <Input value={subject} onChange={(e: any) => setSubject(e.target.value)} placeholder="Brief description of your issue" className={ic} />
            </div>
            <div>
              <label className={lb}>Message</label>
              <Textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Describe your issue in detail. Include load numbers, dates, and any relevant information..." className={cn(ic, "min-h-[150px]")} />
            </div>
            <Button className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-bold" onClick={() => createTicketMutation.mutate({ subject, message, priority, category })} disabled={createTicketMutation.isPending || !subject || !message}>
              {createTicketMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Ticket
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KNOWLEDGE BASE */}
      {activeTab === "kb" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
            <Input value={kbSearch} onChange={(e: any) => setKbSearch(e.target.value)} placeholder="Search knowledge base..." className={cn("pl-10", ic)} />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {kbCategories.map(cat => (
              <button key={cat} onClick={() => { setKbCategory(cat); setExpandedArticle(null); }} className={cn("px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border",
                kbCategory === cat
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
                  : isLight ? "bg-white border-slate-200 text-slate-500 hover:border-blue-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600"
              )}>{cat}</button>
            ))}
          </div>

          {/* Role badge */}
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs", isLight ? "bg-blue-50 border border-blue-100" : "bg-blue-500/5 border border-blue-500/10")}>
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-400">Showing articles for:</span>
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 border text-[10px] font-bold">{userRole.replace(/_/g, " ")}</Badge>
            <span className="text-slate-400">({filteredArticles.length} articles)</span>
          </div>

          {/* Articles */}
          <div className="space-y-2">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-10 h-10 text-slate-400/30 mx-auto mb-3" />
                <p className={cn("font-bold", vl)}>No articles found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search term or category</p>
              </div>
            ) : filteredArticles.map((article, i) => {
              const globalIdx = kbArticles.indexOf(article);
              const isExpanded = expandedArticle === globalIdx;
              return (
                <Card key={globalIdx} className={cn(cc, "transition-all", isExpanded ? "ring-1 ring-blue-500/30" : "hover:shadow-md cursor-pointer")} onClick={() => setExpandedArticle(isExpanded ? null : globalIdx)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2.5 rounded-xl flex-shrink-0", isLight ? "bg-slate-50" : "bg-slate-800/50")}>
                        {article.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={cn("font-bold text-sm", vl)}>{article.title}</p>
                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border text-[9px]">{article.category}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{article.desc}</p>
                        {isExpanded && (
                          <div className={cn("mt-4 pt-4 border-t text-sm leading-relaxed", isLight ? "border-slate-100 text-slate-600" : "border-slate-700/50 text-slate-300")}>
                            {article.content}
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" /> : <ChevronDown className={cn("w-4 h-4 flex-shrink-0 mt-1", isLight ? "text-slate-300" : "text-slate-600")} />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTACT US */}
      {activeTab === "contact" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Support Ticket — Primary */}
            <Card className={cn(cc, "ring-1 ring-blue-500/20")}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-3 rounded-xl", "bg-blue-500/15")}><MessageSquare className="w-6 h-6 text-blue-500" /></div>
                  <div>
                    <p className={cn("font-bold text-sm", vl)}>Submit a Support Ticket</p>
                    <p className="text-[11px] text-slate-400">Fastest way to reach our team</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab("new")} className="font-bold text-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer">Create Ticket →</button>
                <p className="text-[11px] text-slate-400 mt-1">Tracked, prioritized, with email/SMS updates on every reply</p>
              </CardContent>
            </Card>

            {/* Email Support */}
            <Card className={cc}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-3 rounded-xl", "bg-emerald-500/15")}><Mail className="w-6 h-6 text-emerald-500" /></div>
                  <div>
                    <p className={cn("font-bold text-sm", vl)}>Email Support</p>
                    <p className="text-[11px] text-slate-400">Response within 24 hours</p>
                  </div>
                </div>
                <a href="mailto:support@eusotrip.com" className="font-bold text-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent hover:opacity-80 transition-opacity">support@eusotrip.com</a>
                <p className="text-[11px] text-slate-400 mt-1">Include your account ID for faster service</p>
              </CardContent>
            </Card>

            {/* ESANG AI */}
            <Card className={cc}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-3 rounded-xl", "bg-purple-500/15")}><Bot className="w-6 h-6 text-purple-500" /></div>
                  <div>
                    <p className={cn("font-bold text-sm", vl)}>ESANG AI Assistant</p>
                    <p className="text-[11px] text-slate-400">Instant answers, always available</p>
                  </div>
                </div>
                <button onClick={() => toast.info("ESANG AI is available via the chat icon in the bottom-right corner")} className="font-bold text-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer">Chat now →</button>
                <p className="text-[11px] text-slate-400 mt-1">Compliance, ERG, loads, billing & more</p>
              </CardContent>
            </Card>

            {/* Emergency — CHEMTREC */}
            <Card className={cn(cc, "ring-1 ring-orange-500/20")}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-3 rounded-xl", "bg-orange-500/15")}><Siren className="w-6 h-6 text-orange-500" /></div>
                  <div>
                    <p className={cn("font-bold text-sm", vl)}>Emergency / Safety</p>
                    <p className="text-[11px] text-slate-400">CHEMTREC — Hazmat emergency response</p>
                  </div>
                </div>
                <a href="tel:+18004249300" className="font-bold text-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent hover:opacity-80 transition-opacity">1-800-424-9300</a>
                <p className="text-[11px] text-slate-400 mt-1">For hazmat spills and transport emergencies (24/7)</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional info */}
          <Card className={cc}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2.5 rounded-xl", "bg-blue-500/10")}><Clock className="w-5 h-5 text-blue-500" /></div>
                <div>
                  <p className={cn("font-bold text-sm", vl)}>Support Hours & Response Times</p>
                  <p className="text-[11px] text-slate-400">We're here when you need us</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                  <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Support Tickets</p>
                  <p className={cn("font-bold text-sm", vl)}>Within 4 hours</p>
                  <p className="text-[11px] text-slate-400">Urgent tickets triaged immediately</p>
                </div>
                <div className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                  <p className="text-[10px] uppercase font-bold text-purple-500 mb-1">Email</p>
                  <p className={cn("font-bold text-sm", vl)}>Within 24 hours</p>
                  <p className="text-[11px] text-slate-400">Business hours Mon–Fri</p>
                </div>
                <div className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-800/30")}>
                  <p className="text-[10px] uppercase font-bold text-green-500 mb-1">ESANG AI</p>
                  <p className={cn("font-bold text-sm", vl)}>Instant 24/7</p>
                  <p className="text-[11px] text-slate-400">AI-powered answers in seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
