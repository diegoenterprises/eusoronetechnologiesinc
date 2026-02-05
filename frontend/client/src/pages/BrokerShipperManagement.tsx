/**
 * BROKER SHIPPER MANAGEMENT PAGE
 * 100% Dynamic - Manage shipper relationships and accounts
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
  Building, Search, Plus, Star, DollarSign, Truck,
  Phone, Mail, Clock, TrendingUp, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrokerShipperManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const shippersQuery = trpc.brokers.getShippers.useQuery({ status: statusFilter });
  const statsQuery = trpc.brokers.getDashboardStats.useQuery();

  const shippers = shippersQuery.data || [];
  const stats = statsQuery.data;

  const filteredShippers = shippers.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Shipper Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage shipper relationships</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Shipper
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
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Shippers</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.total || stats?.activeLoads || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{(stats as any)?.active || stats?.pendingMatches || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Loads MTD</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.loadsMTD || stats?.weeklyVolume || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Revenue MTD</span>
                </div>
                <p className="text-2xl font-bold text-green-400">${(stats as any)?.revenueMTD?.toLocaleString() || stats?.commissionEarned?.toLocaleString() || 0}</p>
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
                placeholder="Search shippers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipper List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {shippersQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
          ) : filteredShippers.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No shippers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredShippers.map((shipper: any) => (
                <div key={shipper.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Building className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{shipper.name}</p>
                          {shipper.preferred && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <Star className="w-3 h-3 mr-1" />Key Account
                            </Badge>
                          )}
                          <Badge className={cn(
                            "border-0 text-xs",
                            shipper.status === "active" ? "bg-green-500/20 text-green-400" :
                            shipper.status === "prospect" ? "bg-purple-500/20 text-purple-400" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {shipper.status}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{shipper.contactName} • {shipper.industry}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Loads YTD</p>
                        <p className="text-white font-bold">{shipper.loadsYTD || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Revenue YTD</p>
                        <p className="text-green-400 font-bold">${shipper.revenueYTD?.toLocaleString() || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Avg Margin</p>
                        <p className="text-cyan-400 font-bold">{shipper.avgMargin || 0}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Last Load</p>
                        <p className="text-white">{shipper.lastLoadDate || "—"}</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                        Details
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{shipper.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{shipper.email}</span>
                    {shipper.creditTerms && (
                      <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                        <Clock className="w-3 h-3 mr-1" />{shipper.creditTerms} days
                      </Badge>
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
