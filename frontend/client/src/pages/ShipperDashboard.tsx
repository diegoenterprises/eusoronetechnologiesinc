import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { 
  Package, TrendingUp, Clock, CheckCircle, DollarSign, 
  Plus, MapPin, Users, ArrowRight, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import RoleBasedMap from "@/components/RoleBasedMap";

export default function ShipperDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch real data from tRPC
  const { data: loads, isLoading: loadsLoading } = trpc.loads.list.useQuery({ limit: 50 });
  const { data: payments, isLoading: paymentsLoading } = trpc.payments.getTransactions.useQuery({ limit: 50 });
  
  // Calculate metrics from real data
  const activeLoads = loads?.filter((l: any) => l.status === 'posted' || l.status === 'accepted').length || 0;
  const inTransit = loads?.filter((l: any) => l.status === 'in_transit').length || 0;
  const delivered = loads?.filter((l: any) => l.status === 'delivered').length || 0;
  const totalSpent = payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

  const metrics = [
    {
      label: "Active Loads",
      value: activeLoads.toString(),
      icon: Package,
      gradient: "from-cyan-500 to-blue-600",
      bgGradient: "from-cyan-500/10 to-blue-600/10"
    },
    {
      label: "In Transit",
      value: inTransit.toString(),
      icon: Clock,
      gradient: "from-yellow-500 to-orange-600",
      bgGradient: "from-yellow-500/10 to-orange-600/10"
    },
    {
      label: "Delivered",
      value: delivered.toString(),
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-500/10 to-emerald-600/10"
    },
    {
      label: "Total Spent",
      value: `$${totalSpent.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-500/10 to-pink-600/10"
    }
  ];

  const quickActions = [
    { label: "Create Load", icon: Plus, path: "/loads/create", gradient: "from-blue-600 to-cyan-600" },
    { label: "Track Shipments", icon: MapPin, path: "/tracking", gradient: "from-green-600 to-emerald-600" },
    { label: "View Carriers", icon: Users, path: "/carriers", gradient: "from-purple-600 to-pink-600" },
    { label: "Payments", icon: DollarSign, path: "/payments", gradient: "from-orange-600 to-red-600" }
  ];

  const recentLoads = loads?.slice(0, 5) || [];

  // Show dashboard immediately, handle loading per section
  const isLoading = loadsLoading || paymentsLoading;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Welcome back, {user?.name || 'Shipper'}
        </h1>
        <p className="text-gray-400">Monitor your shipments and manage logistics operations</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card 
              key={index}
              className={`relative overflow-hidden border-gray-800 bg-gradient-to-br ${metric.bgGradient} backdrop-blur-sm`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.gradient}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  <p className={`text-3xl font-bold bg-gradient-to-r ${metric.gradient} bg-clip-text text-transparent`}>
                    {metric.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={() => navigate(action.path)}
                className={`h-24 bg-gradient-to-r ${action.gradient} hover:opacity-90 transition-opacity`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-6 h-6" />
                  <span className="font-semibold">{action.label}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Map Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Live Tracking
        </h2>
        <RoleBasedMap height="h-96" />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loads */}
        <Card className="border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Recent Loads
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/loads')}
                className="text-cyan-400 hover:text-cyan-300"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentLoads.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No loads yet</p>
                  <Button 
                    onClick={() => navigate('/loads/create')}
                    className="mt-4 bg-gradient-to-r from-cyan-600 to-blue-600"
                  >
                    Create Your First Load
                  </Button>
                </div>
              ) : (
                recentLoads.map((load: any) => {
                  const statusColors = {
                    posted: 'from-blue-500 to-cyan-500',
                    accepted: 'from-yellow-500 to-orange-500',
                    in_transit: 'from-purple-500 to-pink-500',
                    delivered: 'from-green-500 to-emerald-500',
                    cancelled: 'from-red-500 to-rose-500'
                  };
                  
                  return (
                    <div 
                      key={load.id}
                      className="p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-900/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/loads/${load.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white">Load #{load.id}</p>
                          <p className="text-sm text-gray-400">{load.cargoType}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${statusColors[load.status as keyof typeof statusColors]} text-white`}>
                          {load.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{typeof load.origin === 'string' ? load.origin : (load.origin as any)?.city || 'Unknown'}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span>{typeof load.destination === 'string' ? load.destination : (load.destination as any)?.city || 'Unknown'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              Alerts & Notifications
            </h3>
            
            <div className="space-y-4">
              {inTransit > 0 && (
                <div className="p-4 rounded-lg border border-yellow-800/50 bg-yellow-900/20">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-500">Shipments In Transit</p>
                      <p className="text-sm text-gray-400">
                        You have {inTransit} shipment{inTransit > 1 ? 's' : ''} currently in transit
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeLoads > 0 && (
                <div className="p-4 rounded-lg border border-blue-800/50 bg-blue-900/20">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-500">Active Loads</p>
                      <p className="text-sm text-gray-400">
                        {activeLoads} load{activeLoads > 1 ? 's' : ''} waiting for carrier assignment
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeLoads === 0 && inTransit === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
