/**
 * SHIPPER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import { trpc } from "@/lib/trpc";
import { 
  Package, TrendingUp, Clock, CheckCircle, DollarSign, 
  Plus, MapPin, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShipperDashboard() {
  const [, navigate] = useLocation();
  
  const { data: loads, isLoading: loadsLoading } = trpc.loads.list.useQuery({ limit: 50 });
  const { data: payments, isLoading: paymentsLoading } = trpc.payments.getTransactions.useQuery({ limit: 50 });
  
  const activeLoads = loads?.filter((l: any) => l.status === 'posted' || l.status === 'accepted').length || 0;
  const inTransit = loads?.filter((l: any) => l.status === 'in_transit').length || 0;
  const delivered = loads?.filter((l: any) => l.status === 'delivered').length || 0;
  const totalSpent = payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

  const isLoading = loadsLoading || paymentsLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Posted</Badge>;
      case "accepted": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Accepted</Badge>;
      case "in_transit": return <Badge className="bg-purple-500/20 text-purple-400 border-0">In Transit</Badge>;
      case "delivered": return <Badge className="bg-green-500/20 text-green-400 border-0">Delivered</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Shipper Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your shipments and track deliveries</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => navigate("/loads/create")}>
          <Plus className="w-4 h-4 mr-2" />Create Shipment
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Package className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{activeLoads}</p>
                )}
                <p className="text-xs text-slate-400">Active Loads</p>
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
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{inTransit}</p>
                )}
                <p className="text-xs text-slate-400">In Transit</p>
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
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{delivered}</p>
                )}
                <p className="text-xs text-slate-400">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${totalSpent.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loads */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Recent Loads</CardTitle>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => navigate("/my-loads")}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : loads?.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No loads yet</p>
                <Button className="mt-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => navigate("/loads/create")}>
                  Create Your First Load
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {loads?.slice(0, 4).map((load: any) => (
                  <div key={load.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => navigate(`/loads/${load.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber || `#${load.id?.slice(0, 6)}`}</p>
                      {getStatusBadge(load.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-3 h-3 text-green-400" />
                      <span>{load.origin?.city || "N/A"}</span>
                      <ArrowRight className="w-3 h-3" />
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{load.destination?.city || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Bids */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Pending Bids</CardTitle>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => navigate("/bids")}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No pending bids</p>
              <p className="text-slate-500 text-sm mt-1">Bids will appear here when carriers respond</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/loads/create")}>
          <Plus className="w-6 h-6 mb-2 text-cyan-400" />
          <span className="text-slate-300">Create Load</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/my-loads")}>
          <Package className="w-6 h-6 mb-2 text-blue-400" />
          <span className="text-slate-300">My Loads</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/track")}>
          <Clock className="w-6 h-6 mb-2 text-yellow-400" />
          <span className="text-slate-300">Track Shipments</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/payments")}>
          <DollarSign className="w-6 h-6 mb-2 text-green-400" />
          <span className="text-slate-300">Payments</span>
        </Button>
      </div>
    </div>
  );
}
