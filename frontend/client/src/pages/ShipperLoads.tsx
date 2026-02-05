/**
 * SHIPPER LOADS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Calendar, Clock, DollarSign, Truck,
  Search, Plus, Eye, Edit, AlertTriangle, CheckCircle,
  ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CancelConfirmationDialog } from "@/components/ConfirmationDialog";

export default function ShipperLoads() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const summaryQuery = (trpc as any).loads.getShipperSummary.useQuery();
  const loadsQuery = (trpc as any).loads.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as "delivered" | "assigned" | "cancelled" | "in_transit" | "draft" | "posted" | "bidding" | "disputed" : undefined,
  });

  const cancelMutation = (trpc as any).loads.cancel.useMutation({
    onSuccess: () => { toast.success("Load cancelled"); loadsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading data</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500/20 text-green-400";
      case "in_transit": return "bg-blue-500/20 text-blue-400";
      case "assigned": return "bg-purple-500/20 text-purple-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Loads</h1>
          <p className="text-slate-400 text-sm">Manage your shipments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/loads/new")}>
          <Plus className="w-4 h-4 mr-2" />Create Load
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalLoads || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Loads</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
            )}
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.inTransit || 0}</p>
            )}
            <p className="text-xs text-slate-400">In Transit</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.delivered || 0}</p>
            )}
            <p className="text-xs text-slate-400">Delivered</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-20 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">${(summary?.totalSpend || 0).toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-400">Total Spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search loads..." className="pl-9 bg-slate-700/50 border-slate-600" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loads List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {loadsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (loadsQuery.data as any)?.loads?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No loads found</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setLocation("/loads/new")}>
                <Plus className="w-4 h-4 mr-2" />Create Your First Load
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {(loadsQuery.data as any)?.loads?.map((load: any) => (
                <div key={load.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", load.status === "in_transit" ? "bg-blue-500/20" : load.status === "delivered" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                      <Package className={cn("w-5 h-5", load.status === "in_transit" ? "text-blue-400" : load.status === "delivered" ? "text-green-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{load.loadNumber}</p>
                        <Badge className={getStatusColor(load.status)}>{load.status?.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="w-3 h-3 text-green-400" />
                        <span>{load.pickupLocation?.city}, {load.pickupLocation?.state}</span>
                        <ChevronRight className="w-3 h-3" />
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{load.deliveryLocation?.city}, {load.deliveryLocation?.state}</span>
                      </div>
                      <p className="text-xs text-slate-500">{load.commodity} - {load.weight}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-green-400 font-bold">${load.rate?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{load.pickupDate}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/loads/${load.id}`)}><Eye className="w-4 h-4" /></Button>
                      {load.status === "pending" && (
                        <>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setCancelId(load.id)} disabled={cancelMutation.isPending}>
                            {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CancelConfirmationDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        actionName="this load"
        onConfirm={() => { if (cancelId) cancelMutation.mutate({ loadId: cancelId }); setCancelId(null); }}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
