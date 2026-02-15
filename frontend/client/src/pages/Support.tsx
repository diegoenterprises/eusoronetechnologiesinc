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
  RefreshCw, Filter, Activity, BarChart3
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: "Getting Started with EusoTrip", desc: "Learn the basics of creating loads and finding catalysts", icon: <BookOpen className="w-5 h-5 text-blue-500" />, category: "Onboarding" },
            { title: "HazMat Compliance Guide", desc: "DOT/FMCSA requirements for hazardous materials transport", icon: <Shield className="w-5 h-5 text-orange-500" />, category: "Compliance" },
            { title: "Understanding Platform Fees", desc: "How the dynamic commission engine calculates fees (5-15%)", icon: <TrendingUp className="w-5 h-5 text-purple-500" />, category: "Billing" },
            { title: "Agreements & Smart Contracts", desc: "Creating, signing, and managing catalyst agreements", icon: <FileText className="w-5 h-5 text-blue-400" />, category: "Contracts" },
            { title: "Emergency Response (ERG 2024)", desc: "Using ESANG AI for real-time emergency guidance", icon: <AlertTriangle className="w-5 h-5 text-red-400" />, category: "Safety" },
            { title: "Spectra-Match Product ID", desc: "How crude oil identification works with spectral analysis", icon: <EsangIcon className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />, category: "Technology" },
          ].map((article, i) => (
            <Card key={i} className={cn(cc, "hover:shadow-md transition-shadow cursor-pointer")}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("p-2.5 rounded-xl flex-shrink-0", L ? "bg-slate-50" : "bg-slate-800/50")}>{article.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
      )}

      {/* PLATFORM HEALTH */}
      {activeTab === "health" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: <Bot className="w-6 h-6 text-blue-500" />, title: "ESANG AI (Tier 1)", desc: "Handles compliance, ERG, platform help automatically", status: "Active", sc: "text-green-500", bg: "bg-blue-500/15" },
            { icon: <Mail className="w-6 h-6 text-purple-500" />, title: "Email Inbox", desc: "support@eusotrip.com — forwarded to this queue", status: "Connected", sc: "text-green-500", bg: "bg-purple-500/15" },
            { icon: <Phone className="w-6 h-6 text-cyan-500" />, title: "Phone Line", desc: "1-800-EUSOTRIP — 24/7 for urgent issues", status: "Active", sc: "text-green-500", bg: "bg-cyan-500/15" },
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

  const kbArticles = [
    { title: "Getting Started with EusoTrip", desc: "Learn the basics of creating loads and finding catalysts", icon: <BookOpen className="w-5 h-5 text-blue-500" />, category: "Onboarding" },
    { title: "HazMat Compliance Guide", desc: "DOT/FMCSA requirements for hazardous materials transport", icon: <Shield className="w-5 h-5 text-orange-500" />, category: "Compliance" },
    { title: "Understanding Platform Fees", desc: "How the dynamic commission engine calculates fees (5-15%)", icon: <TrendingUp className="w-5 h-5 text-purple-500" />, category: "Billing" },
    { title: "Spectra-Match Product ID", desc: "How crude oil identification works with spectral analysis", icon: <EsangIcon className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />, category: "Technology" },
    { title: "Agreements & Smart Contracts", desc: "Creating, signing, and managing catalyst agreements", icon: <FileText className="w-5 h-5 text-blue-400" />, category: "Contracts" },
    { title: "Emergency Response (ERG 2024)", desc: "Using ESANG AI for real-time emergency guidance", icon: <AlertTriangle className="w-5 h-5 text-red-400" />, category: "Safety" },
  ];

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
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
            <Input placeholder="Search knowledge base..." className={cn("pl-10", ic)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kbArticles.map((article, i) => (
              <Card key={i} className={cn(cc, "hover:shadow-md transition-shadow cursor-pointer")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0", isLight ? "bg-slate-50" : "bg-slate-800/50")}>
                      {article.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn("font-bold text-sm", vl)}>{article.title}</p>
                        <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 border text-[9px]">{article.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{article.desc}</p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 flex-shrink-0 mt-1", isLight ? "text-slate-300" : "text-slate-600")} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CONTACT US */}
      {activeTab === "contact" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: <Phone className="w-6 h-6 text-blue-500" />, title: "Phone Support", sub: "Available 24/7 for urgent issues", value: "1-800-EUSOTRIP", note: "Average wait: < 2 minutes", bg: "bg-blue-500/15" },
            { icon: <Mail className="w-6 h-6 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />, title: "Email Support", sub: "Response within 24 hours", value: "support@eusotrip.com", note: "Include your account ID for faster service", bg: "bg-emerald-500/15" },
            { icon: <Bot className="w-6 h-6 text-purple-500" />, title: "ESANG AI Assistant", sub: "Instant answers, always available", value: "Chat now →", note: "Compliance, ERG, loads, billing & more", bg: "bg-purple-500/15" },
            { icon: <Shield className="w-6 h-6 text-orange-500" />, title: "Emergency / Safety", sub: "CHEMTREC & emergency response", value: "1-800-424-9300", note: "For hazmat spills and transport emergencies", bg: "bg-orange-500/15" },
          ].map((c, i) => (
            <Card key={i} className={cc}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-3 rounded-xl", c.bg)}>{c.icon}</div>
                  <div>
                    <p className={cn("font-bold text-sm", vl)}>{c.title}</p>
                    <p className="text-[11px] text-slate-400">{c.sub}</p>
                  </div>
                </div>
                <p className="font-bold text-lg bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">{c.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{c.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
