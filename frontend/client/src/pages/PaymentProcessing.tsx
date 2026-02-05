/**
 * PAYMENT PROCESSING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, Search, DollarSign, ArrowUpRight, ArrowDownLeft,
  CheckCircle, Clock, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentProcessing() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const paymentsQuery = (trpc as any).billing.getPayments.useQuery({ search, type });
  const statsQuery = (trpc as any).billing.getPaymentStats.useQuery();

  const processPaymentMutation = (trpc as any).billing.processPayment.useMutation({
    onSuccess: () => { toast.success("Payment processed"); paymentsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Payment Processing</h1>
          <p className="text-slate-400 text-sm mt-1">Manage payments and transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><ArrowDownLeft className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.received?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Received</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><ArrowUpRight className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-red-400">${stats?.sent?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Sent</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.pending?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><CreditCard className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.transactions || 0}</p>}<p className="text-xs text-slate-400">Transactions</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search payments..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
            <SelectItem value="outgoing">Outgoing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-cyan-400" />Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {paymentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (paymentsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No transactions found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(paymentsQuery.data as any)?.map((payment: any) => (
                <div key={payment.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", payment.type === "incoming" ? "bg-green-500/20" : "bg-red-500/20")}>
                      {payment.type === "incoming" ? <ArrowDownLeft className="w-5 h-5 text-green-400" /> : <ArrowUpRight className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{payment.description}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-slate-400">{payment.type === "incoming" ? `From: ${payment.from}` : `To: ${payment.to}`}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>{payment.method}</span>
                        <span>{payment.date}</span>
                        {payment.reference && <span>Ref: {payment.reference}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn("text-xl font-bold", payment.type === "incoming" ? "text-green-400" : "text-red-400")}>
                      {payment.type === "incoming" ? "+" : "-"}${payment.amount?.toLocaleString()}
                    </p>
                    {payment.status === "pending" && (
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={() => processPaymentMutation.mutate({ paymentId: payment.id })}>
                        Process
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
  );
}
