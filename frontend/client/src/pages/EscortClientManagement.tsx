/**
 * ESCORT CLIENT MANAGEMENT PAGE
 * 100% Dynamic - Manage escort service clients and relationships
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
  Building2, Search, Plus, Phone, Mail, Star,
  Package, DollarSign, Calendar, MapPin, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortClientManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const clientsQuery = trpc.escorts.getClients.useQuery({ status: statusFilter, type: typeFilter });
  const statsQuery = trpc.escorts.getClientStats.useQuery();

  const clients = clientsQuery.data || [];
  const stats = statsQuery.data;

  const filteredClients = clients.filter((c: any) =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    c.clientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Client Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage escort service clients and relationships</p>
        </div>
        <Button className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Client
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
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Clients</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalClients || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.activeClients || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Premium</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.premiumClients || 0}</p>
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
                  <span className="text-slate-400 text-sm">Jobs MTD</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.jobsMTD || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Top Clients */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Top Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsQuery.isLoading ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stats?.topClients?.map((client: any, idx: number) => (
                <div key={client.id} className="p-3 rounded-lg bg-slate-700/30 flex items-center gap-3">
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
                    <p className="text-white font-medium truncate">{client.name}</p>
                    <p className="text-green-400 text-sm">{client.jobCount} jobs</p>
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
                placeholder="Search clients..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="carrier">Carrier</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
                <SelectItem value="shipper">Shipper</SelectItem>
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

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientsQuery.isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredClients.length === 0 ? (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No clients found</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client: any) => (
            <Card key={client.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{client.companyName}</p>
                      <p className="text-slate-400 text-sm">ID: {client.clientId}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    client.type === "carrier" ? "bg-blue-500/20 text-blue-400" :
                    client.type === "broker" ? "bg-purple-500/20 text-purple-400" :
                    "bg-green-500/20 text-green-400"
                  )}>
                    {client.type}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">Contact:</span>
                    <span className="text-white">{client.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300 truncate">{client.location}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-700/30 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Total Jobs</p>
                    <p className="text-white font-bold">{client.totalJobs}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Revenue</p>
                    <p className="text-green-400 font-bold">${client.totalRevenue?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Last Job</p>
                    <p className="text-white flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {client.lastJobDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Avg Rating</p>
                    <p className="text-yellow-400 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {client.avgRating || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={cn(
                    "border-0",
                    client.status === "active" ? "bg-green-500/20 text-green-400" :
                    client.status === "inactive" ? "bg-slate-500/20 text-slate-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {client.status}
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
