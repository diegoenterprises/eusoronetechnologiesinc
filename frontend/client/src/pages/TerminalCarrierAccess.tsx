/**
 * TERMINAL CARRIER ACCESS PAGE
 * 100% Dynamic - Manage carrier access permissions for terminal
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building, Search, Plus, CheckCircle, XCircle,
  Shield, Clock, AlertTriangle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalCarrierAccess() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const carriersQuery = trpc.terminal.getApprovedCarriers.useQuery({ status: statusFilter });
  const statsQuery = trpc.terminal.getCarrierAccessStats.useQuery();
  const pendingQuery = trpc.terminal.getPendingAccessRequests.useQuery();

  const toggleAccessMutation = trpc.terminal.toggleCarrierAccess.useMutation({
    onSuccess: () => {
      toast.success("Access updated");
      carriersQuery.refetch();
    },
  });

  const approveRequestMutation = trpc.terminal.approveAccessRequest.useMutation({
    onSuccess: () => {
      toast.success("Access approved");
      pendingQuery.refetch();
      carriersQuery.refetch();
    },
  });

  const carriers = carriersQuery.data || [];
  const stats = statsQuery.data;
  const pendingRequests = pendingQuery.data || [];

  const filteredCarriers = carriers.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mcNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Carrier Access
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage terminal access permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Carrier
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
                  <span className="text-slate-400 text-sm">Total Carriers</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Approved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{pendingRequests.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Suspended</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.suspended || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-400 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Access Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">{request.carrierName}</p>
                      <p className="text-slate-400 text-sm">MC# {request.mcNumber} • Requested {request.requestedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                    >
                      <FileText className="w-4 h-4 mr-1" />Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveRequestMutation.mutate({ requestId: request.id })}
                      className="bg-green-600 hover:bg-green-700 rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search carriers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Carriers List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {carriersQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredCarriers.length === 0 ? (
            <div className="text-center py-16">
              <Building className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No carriers found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredCarriers.map((carrier: any) => (
                <div key={carrier.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        carrier.accessEnabled ? "bg-green-500/20" : "bg-red-500/20"
                      )}>
                        <Building className={cn(
                          "w-6 h-6",
                          carrier.accessEnabled ? "text-green-400" : "text-red-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{carrier.name}</p>
                          <Badge className={cn(
                            "border-0",
                            carrier.accessEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {carrier.accessEnabled ? "Active" : "Suspended"}
                          </Badge>
                          {carrier.hazmatCertified && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />Hazmat
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">MC# {carrier.mcNumber} • DOT# {carrier.dotNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Loads YTD</p>
                        <p className="text-white font-bold">{carrier.loadsYTD || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Last Visit</p>
                        <p className="text-white">{carrier.lastVisit || "Never"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Shield className="w-3 h-3" />Safety</p>
                        <p className={cn(
                          "font-bold",
                          carrier.safetyRating === "Satisfactory" ? "text-green-400" : "text-yellow-400"
                        )}>
                          {carrier.safetyRating || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">Access</span>
                        <Switch
                          checked={carrier.accessEnabled}
                          onCheckedChange={(checked) => toggleAccessMutation.mutate({
                            carrierId: carrier.id,
                            enabled: checked,
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {carrier.restrictions && carrier.restrictions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
                      <span className="text-slate-500 text-sm">Restrictions:</span>
                      {carrier.restrictions.map((restriction: string, idx: number) => (
                        <Badge key={idx} className="bg-red-500/20 text-red-400 border-0 text-xs">
                          {restriction}
                        </Badge>
                      ))}
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
