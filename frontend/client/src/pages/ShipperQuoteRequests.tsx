/**
 * SHIPPER QUOTE REQUESTS PAGE
 * 100% Dynamic - Request and manage shipping quotes
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  FileText, Plus, Search, Clock, CheckCircle, DollarSign,
  MapPin, Calendar, ArrowRight, Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperQuoteRequests() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const quotesQuery = trpc.shippers.getMyLoads.useQuery({});
  const statsQuery = trpc.shippers.getStats.useQuery();

  const quotes = (quotesQuery.data as any)?.loads || quotesQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredQuotes = (quotes as any[]).filter((q: any) =>
    q.origin?.toLowerCase().includes(search.toLowerCase()) ||
    q.destination?.toLowerCase().includes(search.toLowerCase()) ||
    q.quoteNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "accepted": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Quote Requests
          </h1>
          <p className="text-slate-400 text-sm mt-1">Request and manage shipping quotes</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Request Quote
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Requests</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Received</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.received || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Quote</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">${stats?.avgQuote?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotes..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {quotesQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No quote requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredQuotes.map((quote: any) => (
                <div key={quote.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{quote.quoteNumber}</p>
                          <Badge className={cn("border-0", getStatusColor(quote.status))}>
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-green-400" />{quote.origin}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-400" />{quote.destination}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Truck className="w-3 h-3" />Equipment</p>
                        <p className="text-white">{quote.equipment}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Pickup</p>
                        <p className="text-white">{quote.pickupDate}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Responses</p>
                        <p className="text-cyan-400 font-bold">{quote.responseCount || 0}</p>
                      </div>
                      {quote.bestQuote && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Best Quote</p>
                          <p className="text-green-400 font-bold">${quote.bestQuote?.toLocaleString()}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/shipper/quotes/${quote.id}`)}
                        className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>

                  {quote.responseCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-4 text-sm">
                      <span className="text-slate-400">Quote range:</span>
                      <span className="text-white">${quote.lowestQuote?.toLocaleString()} - ${quote.highestQuote?.toLocaleString()}</span>
                      {quote.expiresAt && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                          <Clock className="w-3 h-3 mr-1" />Expires: {quote.expiresAt}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
