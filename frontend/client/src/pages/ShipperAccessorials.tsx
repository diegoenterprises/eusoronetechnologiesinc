/**
 * SHIPPER ACCESSORIALS PAGE
 * 100% Dynamic - Manage accessorial charges and fees
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
  Receipt, Search, Plus, DollarSign, Clock,
  CheckCircle, AlertTriangle, FileText, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperAccessorials() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const accessorialsQuery = trpc.shippers.getMyLoads.useQuery({});
  const statsQuery = trpc.shippers.getStats.useQuery();

  const accessorials = (accessorialsQuery.data as any)?.loads || accessorialsQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredAccessorials = (accessorials as any[]).filter((a: any) =>
    a.loadNumber?.toLowerCase().includes(search.toLowerCase()) ||
    a.carrierName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "disputed": return "bg-red-500/20 text-red-400";
      case "paid": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Accessorial Charges
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage additional fees and charges</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Total Charges</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">${stats?.totalCharges?.toLocaleString() || 0}</p>
                <p className="text-slate-500 text-xs mt-1">This month</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending Review</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pendingCount || 0}</p>
                <p className="text-slate-500 text-xs mt-1">${stats?.pendingAmount?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-400 text-sm">Approved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.approvedCount || 0}</p>
                <p className="text-slate-500 text-xs mt-1">${stats?.approvedAmount?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-slate-400 text-sm">Disputed</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.disputedCount || 0}</p>
                <p className="text-slate-500 text-xs mt-1">${stats?.disputedAmount?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Common Accessorial Types */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Top Accessorial Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats?.topTypes?.map((type: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <p className="text-white font-medium">{type.name}</p>
                <p className="text-cyan-400 font-bold">${type.total?.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">{type.count} charges</p>
              </div>
            )) || (
              <p className="text-slate-400 col-span-4 text-center py-4">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by load or carrier..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="detention">Detention</SelectItem>
                <SelectItem value="lumper">Lumper</SelectItem>
                <SelectItem value="layover">Layover</SelectItem>
                <SelectItem value="tonu">TONU</SelectItem>
                <SelectItem value="fuel_surcharge">Fuel Surcharge</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accessorials List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {accessorialsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredAccessorials.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No accessorial charges found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredAccessorials.map((charge: any) => (
                <div key={charge.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        charge.status === "approved" || charge.status === "paid" ? "bg-green-500/20" :
                        charge.status === "disputed" ? "bg-red-500/20" : "bg-yellow-500/20"
                      )}>
                        <Receipt className={cn(
                          "w-6 h-6",
                          charge.status === "approved" || charge.status === "paid" ? "text-green-400" :
                          charge.status === "disputed" ? "text-red-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{charge.type}</p>
                          <Badge className={cn("border-0", getStatusColor(charge.status))}>
                            {charge.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                          Load #{charge.loadNumber} • {charge.carrierName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Amount</p>
                        <p className="text-yellow-400 font-bold text-lg">${charge.amount?.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Submitted</p>
                        <p className="text-white">{charge.submittedDate}</p>
                      </div>
                      {charge.hours && (
                        <div className="text-center">
                          <p className="text-slate-400 text-xs">Hours</p>
                          <p className="text-white">{charge.hours}h</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400">
                          <FileText className="w-4 h-4" />
                        </Button>
                        {charge.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/50 text-red-400 rounded-lg">
                              Dispute
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg">
                              Approve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {charge.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <p className="text-slate-400 text-sm">{charge.notes}</p>
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
