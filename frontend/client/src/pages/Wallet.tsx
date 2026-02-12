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
import {
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus,
  CreditCard, DollarSign, Clock, Send, Landmark, Shield,
  Lock, ChevronRight, AlertTriangle, CheckCircle2, Ban,
  Building2, Users, Copy, Eye, EyeOff, RefreshCw,
  Smartphone, X, ArrowRight, Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";

type WalletTab = "overview" | "send" | "cards" | "bank" | "escrow" | "history";

export default function Wallet() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  // Simple toast replacement (no external hook needed)
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    console.log(`[${variant || 'info'}] ${title}: ${description || ''}`);
  };
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [showBalance, setShowBalance] = useState(true);
  const [sendAmount, setSendAmount] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [cardOrderLoading, setCardOrderLoading] = useState(false);

  const balanceQuery = (trpc as any).wallet.getBalance.useQuery();
  const transactionsQuery = (trpc as any).wallet.getTransactions.useQuery({ limit: 50 });
  const cardsQuery = (trpc as any).wallet.getCards.useQuery();
  const bankQuery = (trpc as any).wallet.getBankAccounts.useQuery();
  const escrowQuery = (trpc as any).wallet.getEscrowHolds.useQuery();

  const balance = balanceQuery.data;
  const transactions = transactionsQuery.data || [];
  const cards = cardsQuery.data || [];
  const bankAccounts = bankQuery.data || [];
  const escrowHolds = escrowQuery.data || [];

  const filteredTransactions = transactions.filter((t: any) => {
    if (historyFilter === "all") return true;
    return t.type === historyFilter;
  });

  const handleSendMoney = async () => {
    if (!sendAmount || !sendRecipient) {
      toast({ title: "Missing info", description: "Enter recipient and amount", variant: "destructive" });
      return;
    }
    setSendLoading(true);
    try {
      await (trpc as any).wallet.sendMoney.mutate({
        recipientEmail: sendRecipient,
        amount: parseFloat(sendAmount),
        note: sendNote,
      });
      toast({ title: "Money sent!", description: `$${sendAmount} sent to ${sendRecipient}` });
      setSendAmount(""); setSendRecipient(""); setSendNote("");
      balanceQuery.refetch();
      transactionsQuery.refetch();
    } catch (err: any) {
      toast({ title: "Transfer failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setSendLoading(false);
    }
  };

  const handleOrderCard = async () => {
    setCardOrderLoading(true);
    try {
      await (trpc as any).wallet.orderPhysicalCard.mutate({});
      toast({ title: "Card ordered!", description: "Your EusoWallet debit card will arrive in 5-7 business days. $5.00 has been charged." });
      cardsQuery.refetch();
      balanceQuery.refetch();
    } catch (err: any) {
      toast({ title: "Order failed", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setCardOrderLoading(false);
    }
  };

  const handleConnectBank = async () => {
    try {
      await (trpc as any).wallet.initBankConnection.mutate({});
      toast({ title: "Bank connection initiated", description: "Follow the secure link to connect your bank account." });
      bankQuery.refetch();
    } catch (err: any) {
      toast({ title: "Connection failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      await (trpc as any).wallet.releaseEscrow.mutate({ escrowId });
      toast({ title: "Escrow released!", description: "Payment has been released to the driver." });
      escrowQuery.refetch();
      balanceQuery.refetch();
    } catch (err: any) {
      toast({ title: "Release failed", description: err?.message || "Please try again", variant: "destructive" });
    }
  };

  const TABS: { id: WalletTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <WalletIcon className="w-4 h-4" /> },
    { id: "send", label: "Send Money", icon: <Send className="w-4 h-4" /> },
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
        <div
          className="p-6 md:p-8"
          style={{ background: isLight
            ? "linear-gradient(135deg, #ffffff 0%, #f8f0ff 40%, #f0d6ff 70%, #e8bfff 100%)"
            : "linear-gradient(135deg, rgba(20,115,255,0.08) 0%, rgba(108,71,255,0.1) 40%, rgba(190,1,255,0.12) 100%)"
          }}
        >
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
                  <p className="text-white text-sm font-medium">{cards[0]?.cardholderName || 'YOUR NAME'}</p>
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
                    This protects both shippers and carriers. Disputes are mediated by the EusoTrip platform.
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
              {escrowHolds.length === 0 ? (
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
