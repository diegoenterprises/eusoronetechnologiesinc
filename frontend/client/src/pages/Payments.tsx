/**
 * PAYMENTS & INVOICING PAGE
 * Full-featured fintech invoicing hub powered by Stripe
 * - Outstanding invoices / receivables
 * - Paid receipts & history
 * - Invoice creation & payment
 * - Payment methods management
 * Theme-aware | Brand gradient | Stripe-powered
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DollarSign, Clock, CheckCircle, TrendingUp, Search,
  FileText, Download, Eye, Send, CreditCard, Plus,
  AlertTriangle, ArrowUpRight, ArrowDownLeft, Receipt,
  Building2, Landmark, ChevronRight, Filter, RefreshCw,
  Banknote, CircleDollarSign, MailCheck, Calendar, X
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentTab = "invoices" | "receivables" | "receipts" | "methods";

export default function Payments() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<PaymentTab>("invoices");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const summaryQuery = (trpc as any).payments.getSummary.useQuery();
  const invoicesQuery = (trpc as any).payments.getInvoices.useQuery({ status: invoiceFilter === "all" ? undefined : invoiceFilter });
  const receivablesQuery = (trpc as any).payments.getReceivables.useQuery();
  const receiptsQuery = (trpc as any).payments.getReceipts.useQuery();
  const methodsQuery = (trpc as any).payments.getPaymentMethods.useQuery();

  const payInvoiceMutation = (trpc as any).payments.pay.useMutation({
    onSuccess: () => { setPayingInvoice(null); invoicesQuery.refetch(); summaryQuery.refetch(); },
  });

  const summary = summaryQuery.data;

  const tabs: { id: PaymentTab; label: string; icon: any; count?: number }[] = [
    { id: "invoices", label: "Invoices", icon: FileText, count: summary?.outstandingCount || 0 },
    { id: "receivables", label: "Receivables", icon: ArrowDownLeft, count: summary?.receivablesCount || 0 },
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "methods", label: "Payment Methods", icon: CreditCard },
  ];

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

  const handlePayInvoice = (invoiceId: string) => {
    setPayingInvoice(invoiceId);
    payInvoiceMutation.mutate({ invoiceId, method: "card" });
  };

  // ── Stat cards ──
  const statCards = [
    {
      label: "Outstanding",
      value: summary?.outstandingTotal || 0,
      count: summary?.outstandingCount || 0,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/15",
      border: "border-yellow-500/20",
    },
    {
      label: "Paid This Month",
      value: summary?.paidThisMonth || 0,
      count: summary?.paidThisMonthCount || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/15",
      border: "border-green-500/20",
    },
    {
      label: "Receivables",
      value: summary?.receivablesTotal || 0,
      count: summary?.receivablesCount || 0,
      icon: ArrowDownLeft,
      color: "text-blue-500",
      bg: "bg-blue-500/15",
      border: "border-blue-500/20",
    },
    {
      label: "Overdue",
      value: summary?.overdueTotal || 0,
      count: summary?.overdueCount || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/15",
      border: "border-red-500/20",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Hero Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Payments & Invoicing
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Manage invoices, receivables, and payment history — powered by Stripe
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" /> Create Invoice
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn("rounded-lg", isLight ? "border-slate-300" : "border-slate-600")}
            onClick={() => summaryQuery.refetch()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className={cn(
            "rounded-xl border",
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <div className="min-w-0">
                  {summaryQuery.isLoading ? <Skeleton className="h-7 w-20 mb-1" /> : (
                    <p className={cn("text-xl font-bold", s.color)}>
                      ${s.value.toLocaleString()}
                    </p>
                  )}
                  <p className={cn("text-xs truncate", isLight ? "text-slate-500" : "text-slate-400")}>
                    {s.count} {s.label.toLowerCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab Navigation ── */}
      <div className={cn(
        "flex items-center gap-1 p-1 rounded-xl border",
        isLight ? "bg-slate-100 border-slate-200" : "bg-slate-800/60 border-slate-700/50"
      )}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
              activeTab === tab.id
                ? isLight
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-slate-700 text-white shadow"
                : isLight
                  ? "text-slate-500 hover:text-slate-700"
                  : "text-slate-400 hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-bold",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                  : isLight ? "bg-slate-200 text-slate-600" : "bg-slate-600 text-slate-300"
              )}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            placeholder="Search invoices, loads, or amounts..."
            className={cn(
              "pl-9 rounded-lg",
              isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50"
            )}
          />
        </div>
        {activeTab === "invoices" && (
          <div className="flex items-center gap-1">
            {["all", "outstanding", "paid", "overdue"].map((f) => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-colors capitalize",
                  invoiceFilter === f
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                    : isLight
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >{f}</button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* INVOICES TAB                          */}
      {/* ══════════════════════════════════════ */}
      {activeTab === "invoices" && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <CardContent className="p-0">
            {invoicesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : !invoicesQuery.data?.length ? (
              <div className="text-center py-16">
                <div className={cn("p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <p className={cn("text-lg font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No invoices found</p>
                <p className="text-sm text-slate-400 mt-1">Create your first invoice to get started</p>
              </div>
            ) : (
              <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                {/* Table Header */}
                <div className={cn("grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider", isLight ? "text-slate-400 bg-slate-50" : "text-slate-500 bg-slate-800/40")}>
                  <div className="col-span-3">Invoice</div>
                  <div className="col-span-3">Details</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {(invoicesQuery.data as any[]).map((inv: any) => (
                  <div key={inv.id} className={cn("grid grid-cols-12 gap-4 items-center px-5 py-4 transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                    <div className="col-span-3">
                      <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{inv.loadRef || "—"}</p>
                    </div>
                    <div className="col-span-3">
                      <p className={cn("text-sm", isLight ? "text-slate-700" : "text-slate-300")}>{inv.customerName || inv.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">Due {inv.dueDate}</span>
                        {inv.daysOverdue > 0 && <span className="text-xs text-red-400 font-medium">{inv.daysOverdue}d overdue</span>}
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>${Number(inv.amount).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 text-center">{getStatusBadge(inv.status)}</div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {(inv.status === "outstanding" || inv.status === "overdue") && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs rounded-lg h-8"
                          onClick={() => handlePayInvoice(inv.id)}
                          disabled={payingInvoice === inv.id}
                        >
                          {payingInvoice === inv.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}
                          Pay
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════ */}
      {/* RECEIVABLES TAB                       */}
      {/* ══════════════════════════════════════ */}
      {activeTab === "receivables" && (
        <div className="space-y-4">
          {/* Receivables Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/15">
                  <CircleDollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                    ${(summary?.receivablesTotal || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">Total receivable</p>
                </div>
              </CardContent>
            </Card>
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/15">
                  <MailCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                    {summary?.receivablesSentCount || 0}
                  </p>
                  <p className="text-xs text-slate-400">Invoices sent</p>
                </div>
              </CardContent>
            </Card>
            <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-yellow-500/15">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>
                    {summary?.avgDaysToPayment || 0}
                  </p>
                  <p className="text-xs text-slate-400">Avg days to payment</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Receivables List */}
          <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
            <CardHeader className="pb-2 px-5 pt-5">
              <CardTitle className={cn("text-base font-semibold", isLight ? "text-slate-800" : "text-white")}>Outstanding Receivables</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {receivablesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3].map((i: number) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : !receivablesQuery.data?.length ? (
                <div className="text-center py-12">
                  <ArrowDownLeft className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No receivables</p>
                  <p className="text-sm text-slate-400">Invoices you've sent will appear here</p>
                </div>
              ) : (
                <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                  {(receivablesQuery.data as any[]).map((r: any) => (
                    <div key={r.id} className={cn("flex items-center justify-between px-5 py-4", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", r.status === "overdue" ? "bg-red-500/15" : "bg-blue-500/15")}>
                          <Banknote className={cn("w-5 h-5", r.status === "overdue" ? "text-red-500" : "text-blue-500")} />
                        </div>
                        <div>
                          <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{r.invoiceNumber}</p>
                          <p className="text-xs text-slate-400">{r.customerName} · Due {r.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={cn("font-bold", isLight ? "text-slate-800" : "text-white")}>${Number(r.amount).toLocaleString()}</p>
                          {getStatusBadge(r.status)}
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 h-8 w-8 p-0">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* RECEIPTS TAB                          */}
      {/* ══════════════════════════════════════ */}
      {activeTab === "receipts" && (
        <Card className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50")}>
          <CardHeader className="pb-2 px-5 pt-5">
            <CardTitle className={cn("text-base font-semibold", isLight ? "text-slate-800" : "text-white")}>Payment Receipts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {receiptsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: number) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !receiptsQuery.data?.length ? (
              <div className="text-center py-12">
                <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className={cn("font-medium", isLight ? "text-slate-600" : "text-slate-300")}>No receipts yet</p>
                <p className="text-sm text-slate-400">Paid invoice receipts will appear here</p>
              </div>
            ) : (
              <div className={cn("divide-y", isLight ? "divide-slate-100" : "divide-slate-700/40")}>
                {(receiptsQuery.data as any[]).map((receipt: any) => (
                  <div key={receipt.id} className={cn("flex items-center justify-between px-5 py-4", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className={cn("font-semibold text-sm", isLight ? "text-slate-800" : "text-white")}>{receipt.invoiceNumber}</p>
                        <p className="text-xs text-slate-400">{receipt.description} · Paid {receipt.paidDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-green-500">${Number(receipt.amount).toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{receipt.paymentMethod}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════ */}
      {/* PAYMENT METHODS TAB                   */}
      {/* ══════════════════════════════════════ */}
      {activeTab === "methods" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={cn("text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>Saved Payment Methods</h2>
            <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-lg">
              <Plus className="w-4 h-4 mr-1" /> Add Method
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methodsQuery.isLoading ? (
              [1, 2].map((i: number) => <Skeleton key={i} className="h-32 rounded-xl" />)
            ) : (methodsQuery.data as any[])?.map((method: any) => (
              <Card key={method.id} className={cn(
                "rounded-xl border relative overflow-hidden",
                method.isDefault
                  ? "border-[#1473FF]/40 ring-1 ring-[#1473FF]/20"
                  : isLight ? "border-slate-200" : "border-slate-700/50",
                isLight ? "bg-white" : "bg-slate-800/60"
              )}>
                {method.isDefault && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    DEFAULT
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl", method.type === "bank" ? "bg-blue-500/15" : "bg-purple-500/15")}>
                      {method.type === "bank"
                        ? <Building2 className="w-6 h-6 text-blue-500" />
                        : <CreditCard className="w-6 h-6 text-purple-500" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>
                        {method.type === "bank" ? method.bankName : method.brand} •••• {method.last4}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {method.type === "bank" ? "Bank Account" : `Expires ${method.expiryDate}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!method.isDefault && (
                        <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                          Set Default
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stripe Badge */}
          <div className={cn(
            "flex items-center justify-center gap-2 py-4 rounded-xl border",
            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/50"
          )}>
            <svg width="40" height="16" viewBox="0 0 60 25" fill="none">
              <path d="M9.5 4.5C9.5 3.4 10.3 2.8 11.8 2.8c2 0 4.5.6 6.5 1.7V.8C16.5.2 14.7 0 12.8 0 6.8 0 3 2.8 3 7.5c0 7.3 10 6.2 10 9.3 0 1.3-1.1 1.7-2.7 1.7-2.3 0-5.3-.9-7.6-2.2v3.7C4.8 21 7.2 22 10.3 22c6.2 0 9.3-2.6 9.3-7.4C19.6 7 9.5 8.2 9.5 4.5z" fill={isLight ? "#635BFF" : "#A29BFE"}/>
            </svg>
            <span className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
              Payments secured by Stripe
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
