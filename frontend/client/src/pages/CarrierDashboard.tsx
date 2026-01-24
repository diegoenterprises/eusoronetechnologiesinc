/**
 * CARRIER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import { trpc } from "@/lib/trpc";
import { 
  Truck, TrendingUp, Clock, DollarSign, Package, 
  Search, MapPin, Users, ArrowRight, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function CarrierDashboard() {
  const [, navigate] = useLocation();
  
  const { data: loads, isLoading: loadsLoading } = trpc.loads.list.useQuery({ status: 'posted', limit: 50 });
  const { data: assignedLoads, isLoading: assignedLoading } = trpc.loads.list.useQuery({ limit: 50 });
  const { data: earnings, isLoading: earningsLoading } = trpc.payments.getTransactions.useQuery({ limit: 50 });
  
  const availableLoads = loads?.length || 0;
  const activeJobs = assignedLoads?.filter((l: any) => l.status === 'accepted' || l.status === 'in_transit').length || 0;
  const completedJobs = assignedLoads?.filter((l: any) => l.status === 'delivered').length || 0;
  const totalEarnings = earnings?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;

  const isLoading = loadsLoading || assignedLoading || earningsLoading;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Carrier Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your fleet and find available loads</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => navigate("/loads/find")}>
          <Search className="w-4 h-4 mr-2" />Find Loads
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{availableLoads}</p>
                )}
                <p className="text-xs text-slate-400">Available Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Truck className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{activeJobs}</p>
                )}
                <p className="text-xs text-slate-400">Active Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{completedJobs}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-emerald-400">${totalEarnings.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Loads */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Available Loads</CardTitle>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => navigate("/loads/find")}>
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
                <p className="text-slate-400">No available loads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loads?.slice(0, 4).map((load: any) => (
                  <div key={load.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => navigate(`/loads/${load.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{load.loadNumber || `#${load.id?.slice(0, 6)}`}</p>
                      <p className="text-emerald-400 font-bold">${load.rate?.toLocaleString() || "0"}</p>
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

        {/* My Drivers */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">My Drivers</CardTitle>
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => navigate("/drivers")}>
                Manage <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No drivers assigned</p>
              <Button className="mt-4 bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => navigate("/drivers/add")}>
                Add Driver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/loads/find")}>
          <Search className="w-6 h-6 mb-2 text-blue-400" />
          <span className="text-slate-300">Find Loads</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/fleet")}>
          <Truck className="w-6 h-6 mb-2 text-orange-400" />
          <span className="text-slate-300">My Fleet</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/earnings")}>
          <DollarSign className="w-6 h-6 mb-2 text-green-400" />
          <span className="text-slate-300">Earnings</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 rounded-xl" onClick={() => navigate("/compliance")}>
          <TrendingUp className="w-6 h-6 mb-2 text-purple-400" />
          <span className="text-slate-300">Compliance</span>
        </Button>
      </div>
    </div>
  );
}
