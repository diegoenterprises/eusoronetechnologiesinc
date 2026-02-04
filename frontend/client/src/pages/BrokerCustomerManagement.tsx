/**
 * BROKER CUSTOMER MANAGEMENT PAGE
 * 100% Dynamic - Manage customer accounts and relationships
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
  Users, Search, Plus, Building2, DollarSign,
  TrendingUp, Phone, Mail, Star, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerCustomerManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const customersQuery = trpc.brokers.getCustomers.useQuery({ status: statusFilter, tier: tierFilter });
  const statsQuery = trpc.brokers.getCustomerStats.useQuery();

  const customers = customersQuery.data || [];
  const stats = statsQuery.data;

  const filteredCustomers = customers.filter((c: any) =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    c.customerId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage customer accounts and relationships</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalCustomers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.activeCustomers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Premium</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.premiumCustomers || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Revenue MTD</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">${stats?.revenueMTD?.toLocaleString() || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Loads MTD</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.loadsMTD || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Customers */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Top Customers by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsQuery.isLoading ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stats?.topCustomers?.map((customer: any, idx: number) => (
                <div key={customer.id} className="p-3 rounded-lg bg-slate-700/30 flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    idx === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    idx === 1 ? "bg-slate-400/20 text-slate-300" :
                    idx === 2 ? "bg-amber-600/20 text-amber-500" :
                    "bg-slate-600/50 text-slate-400"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{customer.name}</p>
                    <p className="text-green-400 text-sm">${customer.revenue?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                placeholder="Search customers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customersQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredCustomers.length === 0 ? (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer: any) => (
            <Card key={customer.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{customer.companyName}</p>
                      <p className="text-slate-400 text-sm">ID: {customer.customerId}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    customer.tier === "premium" ? "bg-yellow-500/20 text-yellow-400" :
                    customer.tier === "standard" ? "bg-blue-500/20 text-blue-400" :
                    "bg-slate-500/20 text-slate-400"
                  )}>
                    {customer.tier}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Contact:</span>
                    <span className="text-white">{customer.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{customer.phone}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-700/30 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Total Revenue</p>
                    <p className="text-green-400 font-bold">${customer.totalRevenue?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Loads</p>
                    <p className="text-white font-bold">{customer.totalLoads}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Avg Load Value</p>
                    <p className="text-cyan-400 font-medium">${customer.avgLoadValue?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Active Since</p>
                    <p className="text-white">{customer.activeSince}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={cn(
                    "border-0",
                    customer.status === "active" ? "bg-green-500/20 text-green-400" :
                    customer.status === "inactive" ? "bg-slate-500/20 text-slate-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {customer.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-cyan-400">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
