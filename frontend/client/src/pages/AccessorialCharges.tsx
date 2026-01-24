/**
 * ACCESSORIAL CHARGES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Receipt, Search, Plus, DollarSign, TrendingUp,
  CheckCircle, Clock, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AccessorialCharges() {
  const [searchTerm, setSearchTerm] = useState("");

  const chargesQuery = trpc.accessorials.list.useQuery({ limit: 50 });
  const ratesQuery = trpc.accessorials.getRates.useQuery();
  const summaryQuery = trpc.accessorials.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "denied": return <Badge className="bg-red-500/20 text-red-400 border-0">Denied</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCharges = chargesQuery.data?.filter((charge: any) =>
    !searchTerm || charge.loadNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || charge.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Accessorial Charges
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage additional service charges</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Charge
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${summary?.totalCharges?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Charges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Receipt className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalCount || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Items</p>
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
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${summary?.avgCharge?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Avg Charge</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search charges..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charges List */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Recent Accessorial Charges</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {chargesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredCharges?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No charges found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredCharges?.map((charge: any) => (
                  <div key={charge.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{charge.type}</p>
                          {getStatusBadge(charge.status)}
                        </div>
                        <p className="text-sm text-slate-400">Load: {charge.loadNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">${charge.amount?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{charge.date}</p>
                      </div>
                    </div>
                    {charge.notes && <p className="text-xs text-slate-500 mt-2">{charge.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Standard Rates */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Standard Rates</CardTitle>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ratesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {ratesQuery.data?.map((rate: any) => (
                  <div key={rate.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{rate.name}</p>
                      <p className="text-xs text-slate-500">{rate.description}</p>
                    </div>
                    <p className="text-emerald-400 font-bold">${rate.rate}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
