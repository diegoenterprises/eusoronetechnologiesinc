/**
 * QUOTE MANAGEMENT PAGE
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
  FileText, Search, Plus, DollarSign, Clock,
  CheckCircle, XCircle, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function QuoteManagement() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const quotesQuery = trpc.quotes.getAll.useQuery({ search, status });
  const statsQuery = trpc.quotes.getStats.useQuery();

  const sendMutation = trpc.quotes.send.useMutation({
    onSuccess: () => { toast.success("Quote sent"); quotesQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Draft</Badge>;
      case "sent": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Send className="w-3 h-3 mr-1" />Sent</Badge>;
      case "accepted": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "declined": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      case "expired": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Quote Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage shipping quotes</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Quote
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Send className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.sent || 0}</p>}<p className="text-xs text-slate-400">Sent</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.accepted || 0}</p>}<p className="text-xs text-slate-400">Accepted</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.totalValue?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Value</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.conversionRate}%</p>}<p className="text-xs text-slate-400">Conv Rate</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Quotes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {quotesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : quotesQuery.data?.length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No quotes found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {quotesQuery.data?.map((quote: any) => (
                <div key={quote.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold">#{quote.quoteNumber}</p>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-slate-400">{quote.customer}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>{quote.origin} → {quote.destination}</span>
                      <span>{quote.distance} mi</span>
                      <span>Created: {quote.createdAt}</span>
                      <span>Expires: {quote.expiresAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${quote.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">${quote.ratePerMile}/mi</p>
                    </div>
                    {quote.status === "draft" && (
                      <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg" onClick={() => sendMutation.mutate({ quoteId: quote.id })}>
                        <Send className="w-4 h-4 mr-1" />Send
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
