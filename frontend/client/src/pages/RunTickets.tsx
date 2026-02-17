/**
 * RUN TICKETS PAGE
 * Trip sheet management — fuel, tolls, expenses, product verification
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Receipt, Fuel, MapPin, Clock, DollarSign, Plus,
  CheckCircle, Eye, Download, Truck,
  Calendar, Camera, Search, RefreshCw, Navigation,
  Building2, Route, Beaker, Target, Hash
} from "lucide-react";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";

type TicketFilter = "all" | "active" | "completed" | "pending_review";

interface RunTicket {
  id: number;
  ticketNumber: string;
  loadId: number;
  loadNumber: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  origin: string;
  destination: string;
  totalMiles: number;
  totalFuel: number;
  totalTolls: number;
  totalExpenses: number;
  driverNotes: string | null;
}

const EXPENSE_TYPES = [
  { value: "fuel", label: "Fuel", icon: Fuel },
  { value: "toll", label: "Tolls", icon: Route },
  { value: "scale", label: "Scale Tickets", icon: Receipt },
  { value: "parking", label: "Parking", icon: MapPin },
  { value: "lumper", label: "Lumper Fees", icon: DollarSign },
  { value: "detention", label: "Detention", icon: Clock },
  { value: "repair", label: "Repairs", icon: Truck },
  { value: "meal", label: "Meals", icon: Receipt },
  { value: "other", label: "Other", icon: Receipt },
];

export default function RunTickets() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeFilter, setActiveFilter] = useState<TicketFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RunTicket | null>(null);
  const [spectraOpen, setSpectraOpen] = useState(false);

  // Form state
  const [loadNumber, setLoadNumber] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  // Queries
  const ticketsQuery = (trpc as any).runTickets.list.useQuery({ status: activeFilter === "all" ? undefined : activeFilter });
  const statsQuery = (trpc as any).runTickets.getStats.useQuery();

  // Mutations
  const createMutation = (trpc as any).runTickets.create.useMutation({
    onSuccess: () => { toast.success("Run ticket created"); setCreateOpen(false); setLoadNumber(""); ticketsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to create", { description: error.message }),
  });
  const addExpenseMutation = (trpc as any).runTickets.addExpense.useMutation({
    onSuccess: () => { toast.success("Expense added"); setExpenseOpen(false); setExpenseType(""); setExpenseAmount(""); setExpenseDescription(""); ticketsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to add expense", { description: error.message }),
  });
  const completeMutation = (trpc as any).runTickets.complete.useMutation({
    onSuccess: () => { toast.success("Run ticket completed"); ticketsQuery.refetch(); statsQuery.refetch(); },
  });

  const stats = statsQuery.data;
  const tickets: RunTicket[] = ticketsQuery.data || [];

  // Filter + search
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return t.ticketNumber?.toLowerCase().includes(q) ||
             t.loadNumber?.toLowerCase().includes(q) ||
             t.origin?.toLowerCase().includes(q) ||
             t.destination?.toLowerCase().includes(q);
    });
  }, [tickets, searchTerm]);

  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    active:         { label: "Active",         bg: "bg-blue-500/15",   text: "text-blue-500"  },
    completed:      { label: "Completed",      bg: "bg-emerald-500/15", text: "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" },
    pending_review: { label: "Pending Review", bg: "bg-yellow-500/15", text: "text-yellow-500" },
    disputed:       { label: "Disputed",       bg: "bg-red-500/15",    text: "text-red-500"   },
  };

  const filterTabs: { id: TicketFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "pending_review", label: "Review" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Run Tickets
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Trip sheets, expenses & product verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl px-5 font-bold"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> New Run Ticket
          </Button>
          <Button
            className={cn("rounded-xl px-3", isLight
              ? "bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600"
              : "bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400")}
            onClick={() => setSpectraOpen(true)}
          >
            <Beaker className="w-4 h-4 mr-1.5" /> Product ID
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")}
            onClick={() => { ticketsQuery.refetch(); statsQuery.refetch(); }}
          >
            <RefreshCw className={cn("w-4 h-4", ticketsQuery.isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { value: stats?.total || 0, label: "Total Tickets", icon: <Receipt className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", color: "text-blue-400" },
          { value: stats?.active || 0, label: "Active", icon: <Truck className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/15", color: "text-emerald-400" },
          { value: `$${(stats?.totalFuel || 0).toLocaleString()}`, label: "Fuel", icon: <Fuel className="w-5 h-5 text-orange-400" />, bg: "bg-orange-500/15", color: "text-orange-400" },
          { value: `$${(stats?.totalTolls || 0).toLocaleString()}`, label: "Tolls", icon: <Route className="w-5 h-5 text-violet-400" />, bg: "bg-violet-500/15", color: "text-violet-400" },
          { value: `$${(stats?.totalExpenses || 0).toLocaleString()}`, label: "Expenses", icon: <DollarSign className="w-5 h-5 text-cyan-400" />, bg: "bg-cyan-500/15", color: "text-cyan-400", gradient: true },
        ].map((s) => (
          <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                <div>
                  {statsQuery.isLoading ? <Skeleton className="h-7 w-14" /> : (
                    <p className={cn("text-2xl font-bold tabular-nums", s.gradient ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : s.color)}>
                      {s.value}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search ── */}
      <div className={cn(
        "relative rounded-xl border",
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
      )}>
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search tickets, loads, routes..."
          className={cn(
            "pl-10 pr-4 py-3 border-0 rounded-xl text-base focus-visible:ring-0",
            isLight ? "bg-transparent" : "bg-transparent text-white placeholder:text-slate-400"
          )}
        />
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeFilter === tab.id
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Ticket Cards ── */}
      {ticketsQuery.isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>
      ) : filteredTickets.length === 0 ? (
        /* ── Empty State ── */
        <div className={cn(
          "text-center py-16 rounded-2xl border",
          isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
        )}>
          <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
            <Receipt className="w-10 h-10 text-slate-400" />
          </div>
          <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No run tickets yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Create a run ticket to track fuel, tolls, and expenses for a trip
          </p>
          <Button
            className="mt-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Create Run Ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const cfg = statusConfig[ticket.status] || { label: ticket.status, bg: "bg-slate-500/15", text: "text-slate-400" };
            const isActive = ticket.status === "active";
            const originCity = ticket.origin || "Origin";
            const destCity = ticket.destination || "Destination";

            return (
              <Card key={ticket.id} className={cn(
                "rounded-2xl border overflow-hidden transition-all",
                isLight
                  ? "bg-white border-slate-200 shadow-sm hover:shadow-md"
                  : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60"
              )}>
                <CardContent className="p-0">

                  {/* ── Card Header: Ticket # + Load # + Status ── */}
                  <div className={cn("flex items-center justify-between px-5 pt-4 pb-3", isLight ? "border-b border-slate-100" : "border-b border-slate-700/30")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isActive ? "bg-blue-500/15" : "bg-emerald-500/15")}>
                        {isActive ? <Truck className="w-5 h-5 text-blue-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", isLight ? "text-slate-800" : "text-white")}>
                          #{ticket.ticketNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          Load #{ticket.loadNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border-0 text-xs font-bold px-3 py-1 rounded-md", cfg.bg, cfg.text)}>
                        {cfg.label}
                      </Badge>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* ── Route Visualization ── */}
                  <div className={cn("px-5 py-4 mx-5 mt-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-900/40")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF] to-[#4A90FF] flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{originCity}</p>
                      </div>
                      <div className="flex-1 mx-4 flex items-center">
                        <div className="flex-1 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, #1473FF, #BE01FF)', WebkitMaskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)', maskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)' }} />
                        <Navigation className="w-4 h-4 mx-1 rotate-90 text-[#8B5CF6]" />
                        <div className="flex-1 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, #6C47FF, #BE01FF)', WebkitMaskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)', maskImage: 'repeating-linear-gradient(to right, black 0 8px, transparent 8px 14px)' }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{destCity}</p>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#BE01FF] flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Expense Tags + Total ── */}
                  <div className="px-5 pt-3 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ticket.totalMiles > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-700/50 border-slate-600 text-slate-300")}>
                            <Route className="w-3 h-3 inline mr-1" />{ticket.totalMiles} mi
                          </span>
                        )}
                        {ticket.totalFuel > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-orange-500/10 border-orange-500/20 text-orange-400")}>
                            <Fuel className="w-3 h-3 inline mr-1" />${ticket.totalFuel}
                          </span>
                        )}
                        {ticket.totalTolls > 0 && (
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium border", isLight ? "bg-violet-50 border-violet-200 text-violet-600" : "bg-violet-500/10 border-violet-500/20 text-violet-400")}>
                            <MapPin className="w-3 h-3 inline mr-1" />${ticket.totalTolls}
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                        ${(ticket.totalExpenses || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div className="px-5 pb-4 pt-2 flex items-center gap-2">
                    {isActive ? (
                      <>
                        <Button
                          className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold text-sm h-10"
                          onClick={() => { setSelectedTicket(ticket); setExpenseOpen(true); }}
                        >
                          <Plus className="w-4 h-4 mr-1.5" /> Add Expense
                        </Button>
                        <Button
                          className={cn("rounded-xl font-bold text-sm h-10", isLight
                            ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400")}
                          onClick={() => completeMutation.mutate({ id: ticket.id })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Complete
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className={cn("flex-1 rounded-xl font-bold text-sm h-10", isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-600 hover:bg-slate-700/50")}
                        onClick={() => { setSelectedTicket(ticket); setDetailOpen(true); }}
                      >
                        View Details
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className={cn("rounded-xl h-10 px-3", isLight
                        ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                        : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white")}
                      onClick={() => { setSelectedTicket(ticket); setDetailOpen(true); }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className={cn("rounded-xl h-10 px-3", isLight
                        ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
                        : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Create Run Ticket Dialog ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          className={cn("sm:max-w-md rounded-2xl p-0 overflow-hidden", isLight ? "border border-slate-200" : "border-slate-700/50 text-white")}
          style={isLight
            ? { background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }
            : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)" }
          }
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                Create Run Ticket
              </DialogTitle>
              <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
                Start tracking a new trip sheet
              </p>
            </DialogHeader>
            <div className="space-y-5 mt-6">
              <div className="space-y-2">
                <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Load Number</Label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Enter load number"
                    value={loadNumber}
                    onChange={(e: any) => setLoadNumber(e.target.value)}
                    className={cn("pl-9 rounded-xl", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-600")}
                  />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate({ loadNumber })}
                disabled={createMutation.isPending || !loadNumber}
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold h-11"
              >
                {createMutation.isPending ? "Creating..." : "Create Run Ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Add Expense Dialog ═══ */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent
          className={cn("sm:max-w-md rounded-2xl p-0 overflow-hidden", isLight ? "border border-slate-200" : "border-slate-700/50 text-white")}
          style={isLight
            ? { background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }
            : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)" }
          }
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                Add Expense
              </DialogTitle>
              <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
                #{selectedTicket?.ticketNumber}
              </p>
            </DialogHeader>
            <div className="space-y-4 mt-5">
              {/* Expense type as grid pills */}
              <div className="space-y-2">
                <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPENSE_TYPES.map((et) => {
                    const Icon = et.icon;
                    const selected = expenseType === et.value;
                    return (
                      <button
                        key={et.value}
                        onClick={() => setExpenseType(et.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                          selected
                            ? "bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 border-[#8B5CF6]/40 text-[#8B5CF6] shadow-sm"
                            : isLight
                              ? "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                              : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {et.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Amount</Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e: any) => setExpenseAmount(e.target.value)}
                    className={cn("pl-9 rounded-xl text-lg font-bold", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-600")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={cn("text-sm font-medium", isLight ? "text-slate-700" : "text-slate-300")}>Description</Label>
                <Textarea
                  placeholder="Optional notes..."
                  value={expenseDescription}
                  onChange={(e: any) => setExpenseDescription(e.target.value)}
                  className={cn("rounded-xl resize-none", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-600")}
                  rows={2}
                />
              </div>
              <div className={cn("border-2 border-dashed rounded-xl p-4 text-center", isLight ? "border-slate-200 bg-slate-50" : "border-slate-600 bg-slate-800/30")}>
                <Camera className={cn("w-5 h-5 mx-auto mb-1.5", isLight ? "text-slate-400" : "text-slate-500")} />
                <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Upload receipt photo</p>
              </div>
              <Button
                onClick={() => selectedTicket && addExpenseMutation.mutate({
                  ticketId: selectedTicket.id,
                  type: expenseType,
                  amount: parseFloat(expenseAmount),
                  description: expenseDescription,
                })}
                disabled={addExpenseMutation.isPending || !expenseType || !expenseAmount}
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl font-bold h-11"
              >
                {addExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Ticket Detail Preview ═══ */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setSelectedTicket(null); } }}>
        <DialogContent
          className={cn("sm:max-w-2xl rounded-2xl p-0 overflow-hidden", isLight ? "border border-slate-200" : "border-slate-700/50 text-white")}
          style={isLight
            ? { background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }
            : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)" }
          }
        >
          {selectedTicket && (
            <div className="p-6 space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                    #{selectedTicket.ticketNumber}
                  </DialogTitle>
                  <Badge className={cn("border-0 text-xs font-bold px-3 py-1 rounded-md", (statusConfig[selectedTicket.status] || statusConfig.active).bg, (statusConfig[selectedTicket.status] || statusConfig.active).text)}>
                    {(statusConfig[selectedTicket.status] || { label: selectedTicket.status }).label}
                  </Badge>
                </div>
                <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                  Load #{selectedTicket.loadNumber}
                </p>
              </DialogHeader>

              {/* Route */}
              <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center"><MapPin className="w-4 h-4 text-[#1473FF]" /></div>
                    <p className={cn("text-sm font-semibold", isLight ? "text-slate-800" : "text-white")}>{selectedTicket.origin || "Origin"}</p>
                  </div>
                  <div className="flex-1 mx-4 flex items-center">
                    <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                    <Truck className="w-5 h-5 mx-2 text-[#8B5CF6]" />
                    <div className={cn("flex-1 border-t-2 border-dashed", isLight ? "border-slate-300" : "border-slate-600")} />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-semibold text-right", isLight ? "text-slate-800" : "text-white")}>{selectedTicket.destination || "Destination"}</p>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE01FF]/20 to-[#1473FF]/20 flex items-center justify-center"><Building2 className="w-4 h-4 text-[#BE01FF]" /></div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Expenses", value: `$${(selectedTicket.totalExpenses || 0).toLocaleString()}`, gradient: true },
                  { label: "Fuel", value: `$${(selectedTicket.totalFuel || 0).toLocaleString()}` },
                  { label: "Tolls", value: `$${(selectedTicket.totalTolls || 0).toLocaleString()}` },
                  { label: "Miles", value: `${(selectedTicket.totalMiles || 0).toLocaleString()} mi` },
                  { label: "Created", value: new Date(selectedTicket.createdAt).toLocaleDateString() },
                  { label: "Completed", value: selectedTicket.completedAt ? new Date(selectedTicket.completedAt).toLocaleDateString() : "In Progress" },
                ].map((item) => (
                  <div key={item.label} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className="text-[10px] text-slate-500 mb-0.5">{item.label}</p>
                    <p className={item.gradient ? "font-bold text-sm bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : cn("font-medium text-sm", isLight ? "text-slate-800" : "text-white")}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {selectedTicket.driverNotes && (
                <div className={cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Driver Notes</p>
                  <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{selectedTicket.driverNotes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button className="flex-1 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-xl font-bold">
                  <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
                {selectedTicket.status === "active" && (
                  <Button
                    className={cn("flex-1 rounded-xl font-bold", isLight
                      ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400")}
                    onClick={() => { completeMutation.mutate({ id: selectedTicket.id }); setDetailOpen(false); }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete Trip
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ SPECTRA-MATCH Product ID Dialog ═══ */}
      <Dialog open={spectraOpen} onOpenChange={setSpectraOpen}>
        <DialogContent
          className={cn("sm:max-w-3xl rounded-2xl p-0 overflow-hidden", isLight ? "border border-slate-200" : "border-slate-700/50 text-white")}
          style={isLight
            ? { background: "#ffffff", boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }
            : { background: "linear-gradient(180deg, #161d35 0%, #0d1224 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(20, 115, 255, 0.08)" }
          }
        >
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className={cn("text-xl font-bold flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Target className="w-5 h-5 text-purple-400" />
                SPECTRA-MATCH Product Verification
              </DialogTitle>
              <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
                Verify the product matches the BOL before signing off
              </p>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Widget */}
              <div className={cn("lg:col-span-3 rounded-xl border p-4", isLight
                ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200"
                : "bg-gradient-to-br from-purple-500/5 to-cyan-500/5 border-purple-500/20"
              )}>
                <SpectraMatchWidget
                  compact={false}
                  showSaveButton={true}
                  onIdentify={(result) => {
                    toast.success(`Product identified: ${result.primaryMatch.name} (${result.primaryMatch.confidence}% confidence)`);
                  }}
                />
              </div>

              {/* Info */}
              <div className="lg:col-span-2 space-y-3">
                {[
                  { title: "Run Ticket Accuracy", desc: "Verify the crude/fuel type matches the BOL before signing off" },
                  { title: "Quality Assurance", desc: "Confirm API gravity and BS&W match expected values" },
                  { title: "Documentation", desc: "Save identification results to the run ticket record" },
                ].map((item) => (
                  <div key={item.title} className={cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                    <p className={cn("font-medium text-sm mb-0.5", isLight ? "text-slate-800" : "text-white")}>{item.title}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                ))}
                <div className={cn("p-3 rounded-xl border", isLight ? "bg-purple-50 border-purple-200" : "bg-purple-500/10 border-purple-500/20")}>
                  <p className="text-purple-500 font-bold text-sm mb-0.5">SPECTRA-MATCH</p>
                  <p className="text-xs text-slate-400">Powered by ESANG AI for accurate product identification</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
