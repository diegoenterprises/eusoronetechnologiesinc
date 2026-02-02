/**
 * SHIPPER VENDOR MANAGEMENT PAGE
 * 100% Dynamic - Manage shipping vendors and suppliers
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
  Building, Search, Plus, Star, Phone,
  Mail, MapPin, FileText, TrendingUp, TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipperVendorManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const vendorsQuery = trpc.shipper.getVendors.useQuery({ category: categoryFilter, status: statusFilter });
  const statsQuery = trpc.shipper.getVendorStats.useQuery();
  const categoriesQuery = trpc.shipper.getVendorCategories.useQuery();

  const vendors = vendorsQuery.data || [];
  const stats = statsQuery.data;
  const categories = categoriesQuery.data || [];

  const filteredVendors = vendors.filter((v: any) =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.contact?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Vendor Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage shipping vendors and suppliers</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Vendor
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
                  <span className="text-slate-400 text-sm">Total Vendors</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalVendors || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Preferred</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.preferred || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Avg Rating</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.avgRating?.toFixed(1) || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Active Contracts</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.activeContracts || 0}</p>
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
                placeholder="Search vendors..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
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

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendorsQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredVendors.length === 0 ? (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Building className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No vendors found</p>
            </CardContent>
          </Card>
        ) : (
          filteredVendors.map((vendor: any) => (
            <Card key={vendor.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      vendor.isPreferred ? "bg-yellow-500/20" : "bg-slate-600/50"
                    )}>
                      <Building className={cn(
                        "w-6 h-6",
                        vendor.isPreferred ? "text-yellow-400" : "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold">{vendor.name}</p>
                        {vendor.isPreferred && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <Badge className={cn(
                        "border-0 text-xs",
                        vendor.status === "active" ? "bg-green-500/20 text-green-400" :
                        vendor.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-slate-500/20 text-slate-400"
                      )}>
                        {vendor.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{vendor.rating}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>{vendor.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {vendor.categories?.map((cat: string, idx: number) => (
                    <Badge key={idx} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">Orders</p>
                    <p className="text-white font-bold">{vendor.orderCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-700/30 text-center">
                    <p className="text-slate-400 text-xs">On-Time</p>
                    <p className={cn(
                      "font-bold",
                      vendor.onTimeRate >= 95 ? "text-green-400" :
                      vendor.onTimeRate >= 90 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {vendor.onTimeRate}%
                    </p>
                  </div>
                </div>

                {vendor.performance && (
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    {vendor.performance === "up" ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Performance trending up</span>
                      </>
                    ) : vendor.performance === "down" ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">Performance declining</span>
                      </>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
                  >
                    <Phone className="w-4 h-4 mr-1" />Contact
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                  >
                    <FileText className="w-4 h-4 mr-1" />Details
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
