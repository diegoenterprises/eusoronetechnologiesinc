/**
 * QUOTE REQUESTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, DollarSign, Clock, CheckCircle, Search,
  Plus, Eye, MapPin, Send, Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { toast } from "sonner";
import QuoteWidget from "@/components/QuoteWidget";

export default function QuoteRequests() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuoteWidget, setShowQuoteWidget] = useState(false);

  const quotesQuery = (trpc as any).quotes.list.useQuery({ limit: 50 });
  const summaryQuery = (trpc as any).quotes.getSummary.useQuery();

  const respondMutation = (trpc as any).quotes.respond.useMutation({
    onSuccess: () => { toast.success("Quote response sent"); quotesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to send response", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "quoted": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Quoted</Badge>;
      case "accepted": return <Badge className="bg-green-500/20 text-green-400 border-0">Accepted</Badge>;
      case "declined": return <Badge className="bg-red-500/20 text-red-400 border-0">Declined</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredQuotes = (quotesQuery.data as any)?.filter((quote: any) => {
    const matchesSearch = !searchTerm || 
      quote.shipperName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.origin?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || quote.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Quote Requests
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage incoming quote requests from shippers</p>
        </div>
        <Button
          onClick={() => setShowQuoteWidget(!showQuoteWidget)}
          className={showQuoteWidget ? "bg-slate-700 hover:bg-slate-600 rounded-xl" : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-xl"}
        >
          <Zap className="w-4 h-4 mr-2" />
          Instant Quote
          {showQuoteWidget ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>
      </div>

      {/* Instant Quote Widget */}
      {showQuoteWidget && (
        <div className="max-w-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <QuoteWidget
            onQuoteGenerated={(q: any) => toast.info(`Quote ${q.quoteId}`, { description: `$${q.pricing.totalEstimate.toLocaleString()} — ${q.distance} mi` })}
          />
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <DollarSign className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.quoted || 0}</p>
                )}
                <p className="text-xs text-slate-400">Quoted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.accepted || 0}</p>
                )}
                <p className="text-xs text-slate-400">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target.value)}
          placeholder="Search by shipper or location..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">Pending</TabsTrigger>
          <TabsTrigger value="quoted" className="data-[state=active]:bg-slate-700 rounded-md">Quoted</TabsTrigger>
          <TabsTrigger value="accepted" className="data-[state=active]:bg-slate-700 rounded-md">Accepted</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {quotesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : filteredQuotes?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No quote requests found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredQuotes?.map((quote: any) => (
                    <div key={quote.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", quote.status === "pending" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl", quote.status === "accepted" ? "bg-green-500/20" : quote.status === "pending" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                            <FileText className={cn("w-6 h-6", quote.status === "accepted" ? "text-green-400" : quote.status === "pending" ? "text-yellow-400" : "text-blue-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{quote.shipperName}</p>
                              {getStatusBadge(quote.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                              <MapPin className="w-3 h-3 text-green-400" />
                              <span>{quote.origin?.city}, {quote.origin?.state}</span>
                              <span>→</span>
                              <MapPin className="w-3 h-3 text-red-400" />
                              <span>{quote.destination?.city}, {quote.destination?.state}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>{quote.equipmentType}</span>
                              <span>{quote.weight?.toLocaleString()} lbs</span>
                              <span>Pickup: {quote.pickupDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {quote.quotedRate && (
                            <div className="text-right">
                              <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${quote.quotedRate.toLocaleString()}</p>
                              <p className="text-xs text-slate-500">Quoted Rate</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {quote.status === "pending" && (
                              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                                <Send className="w-4 h-4 mr-1" />Quote
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setLocation(`/quotes/${quote.id}`)}>
                              <Eye className="w-4 h-4 mr-1" />View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
