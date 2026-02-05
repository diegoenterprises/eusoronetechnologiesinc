/**
 * FACTORING INTEGRATION PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Send, CheckCircle, Clock, Package,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FactoringIntegration() {
  const [status, setStatus] = useState("all");

  const invoicesQuery = (trpc as any).billing.getFactoringInvoices.useQuery({ status });
  const statsQuery = (trpc as any).billing.getFactoringStats.useQuery();

  const submitMutation = (trpc as any).billing.submitToFactoring.useMutation({
    onSuccess: () => { toast.success("Submitted to factoring"); invoicesQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "submitted": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Send className="w-3 h-3 mr-1" />Submitted</Badge>;
      case "funded": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Funded</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Factoring Integration</h1>
          <p className="text-slate-400 text-sm mt-1">Quick pay through factoring</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="p-3 rounded-full bg-blue-500/20"><Send className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-blue-400">${stats?.submitted?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Submitted</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-green-400">${stats?.funded?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Funded</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><ArrowUpRight className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.avgDays}d</p>}<p className="text-xs text-slate-400">Avg Fund</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="funded">Funded</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-cyan-400" />Factoring Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (invoicesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No invoices</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(invoicesQuery.data as any)?.map((invoice: any) => (
                <div key={invoice.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", invoice.status === "funded" ? "bg-green-500/20" : invoice.status === "submitted" ? "bg-blue-500/20" : "bg-yellow-500/20")}>
                      <Package className={cn("w-5 h-5", invoice.status === "funded" ? "text-green-400" : invoice.status === "submitted" ? "text-blue-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">Invoice #{invoice.invoiceNumber}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-slate-400">Load #{invoice.loadNumber} | {invoice.customer}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Created: {invoice.createdAt}</span>
                        {invoice.fundedAt && <span>Funded: {invoice.fundedAt}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${invoice.amount?.toLocaleString()}</p>
                      {invoice.fee && <p className="text-xs text-slate-500">Fee: ${invoice.fee}</p>}
                    </div>
                    {invoice.status === "pending" && (
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={() => submitMutation.mutate({ invoiceId: invoice.id })}>
                        <Send className="w-4 h-4 mr-1" />Submit
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
