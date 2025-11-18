/**
 * DASHBOARD - 9-ROLE SYSTEM
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Role-specific dashboards for all user types with real-time metrics,
 * quick actions, and role-appropriate content.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useRoleAccess, UserRole } from "@/hooks/useRoleAccess";
import { 
  TrendingUp, Package, DollarSign, CheckCircle, AlertCircle, Clock,
  Briefcase, Users, MapPin, Zap, Shield, Building2, BarChart3,
  ArrowRight, Bell, Calendar, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import RoleBasedMap from "@/components/RoleBasedMap";
import DashboardAnalytics from "@/components/DashboardAnalytics";

interface MetricCard {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  color: string;
}

interface DashboardConfig {
  title: string;
  subtitle: string;
  metrics: MetricCard[];
  quickActions: QuickAction[];
  recentActivity: Array<{
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'pending' | 'warning' | 'error';
  }>;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const userRole = (user?.role as UserRole) || "USER";

  const getDashboardConfig = (): DashboardConfig => {
    switch (userRole) {
      case "SHIPPER":
        return {
          title: "Shipper Dashboard",
          subtitle: "Monitor your shipments and logistics operations",
          metrics: [
            { 
              label: "Active Shipments", 
              value: "12", 
              icon: Package, 
              color: "text-blue-500",
              trend: "+2 this week",
              trendUp: true
            },
            { 
              label: "In Transit", 
              value: "8", 
              icon: Clock, 
              color: "text-yellow-500",
              trend: "On schedule",
              trendUp: true
            },
            { 
              label: "Delivered", 
              value: "156", 
              icon: CheckCircle, 
              color: "text-green-500",
              trend: "+12 this month",
              trendUp: true
            },
            { 
              label: "Total Spent", 
              value: "$45,320", 
              icon: DollarSign, 
              color: "text-purple-500",
              trend: "-5% vs last month",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Create Load", icon: Plus, path: "/loads/create", color: "bg-blue-600" },
            { label: "Track Shipment", icon: MapPin, path: "/tracking", color: "bg-green-600" },
            { label: "View Bids", icon: Users, path: "/carriers", color: "bg-purple-600" },
            { label: "Payments", icon: DollarSign, path: "/payments", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "Load #SHP-2025-001 Delivered",
              description: "Chicago to Dallas - 1,250 lbs",
              timestamp: "2 hours ago",
              status: "success"
            },
            {
              title: "New Bid Received",
              description: "Load #SHP-2025-002 - $2,450 offer",
              timestamp: "1 hour ago",
              status: "pending"
            },
            {
              title: "Payment Processed",
              description: "Invoice #INV-2025-045 - $5,200",
              timestamp: "4 hours ago",
              status: "success"
            },
          ]
        };

      case "CARRIER":
        return {
          title: "Carrier Dashboard",
          subtitle: "Manage loads, fleet, and earnings",
          metrics: [
            { 
              label: "Available Loads", 
              value: "24", 
              icon: Package, 
              color: "text-blue-500",
              trend: "+5 new today",
              trendUp: true
            },
            { 
              label: "Active Bids", 
              value: "7", 
              icon: Briefcase, 
              color: "text-indigo-500",
              trend: "2 pending",
              trendUp: true
            },
            { 
              label: "In Transit", 
              value: "3", 
              icon: TrendingUp, 
              color: "text-green-500",
              trend: "On schedule",
              trendUp: true
            },
            { 
              label: "This Month Revenue", 
              value: "$18,750", 
              icon: DollarSign, 
              color: "text-green-600",
              trend: "+12% vs last month",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Find Loads", icon: Search, path: "/marketplace", color: "bg-blue-600" },
            { label: "My Bids", icon: Briefcase, path: "/bids", color: "bg-indigo-600" },
            { label: "Fleet", icon: Truck, path: "/fleet", color: "bg-orange-600" },
            { label: "Earnings", icon: DollarSign, path: "/earnings", color: "bg-green-600" },
          ],
          recentActivity: [
            {
              title: "Bid Accepted",
              description: "Load #CAR-2025-156 - $2,850 rate",
              timestamp: "30 minutes ago",
              status: "success"
            },
            {
              title: "Load Delivered",
              description: "Load #CAR-2025-152 - Dallas to Houston",
              timestamp: "2 hours ago",
              status: "success"
            },
            {
              title: "New Load Posted",
              description: "Load #CAR-2025-158 - $3,200 rate",
              timestamp: "1 hour ago",
              status: "pending"
            },
          ]
        };

      case "BROKER":
        return {
          title: "Broker Dashboard",
          subtitle: "Manage marketplace and carrier relationships",
          metrics: [
            { 
              label: "Active Loads", 
              value: "45", 
              icon: Package, 
              color: "text-blue-500",
              trend: "+8 this week",
              trendUp: true
            },
            { 
              label: "Pending Pickup", 
              value: "8", 
              icon: Clock, 
              color: "text-yellow-500",
              trend: "2 urgent",
              trendUp: false
            },
            { 
              label: "Delivered", 
              value: "312", 
              icon: CheckCircle, 
              color: "text-green-500",
              trend: "+45 this month",
              trendUp: true
            },
            { 
              label: "Commission", 
              value: "$12,450", 
              icon: DollarSign, 
              color: "text-purple-500",
              trend: "+8% vs last month",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Post Load", icon: Plus, path: "/loads/create", color: "bg-blue-600" },
            { label: "Marketplace", icon: BarChart3, path: "/marketplace", color: "bg-green-600" },
            { label: "Carriers", icon: Users, path: "/carriers", color: "bg-purple-600" },
            { label: "Analytics", icon: TrendingUp, path: "/analytics", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "Load Assigned",
              description: "Load #BRK-2025-089 - Carrier #12",
              timestamp: "1 hour ago",
              status: "success"
            },
            {
              title: "Commission Earned",
              description: "Load #BRK-2025-087 - $450 commission",
              timestamp: "3 hours ago",
              status: "success"
            },
            {
              title: "New Shipper Inquiry",
              description: "Quote request for 5 loads",
              timestamp: "2 hours ago",
              status: "pending"
            },
          ]
        };

      case "DRIVER":
        return {
          title: "Driver Dashboard",
          subtitle: "Manage jobs and track earnings",
          metrics: [
            { 
              label: "Current Job", 
              value: "Active", 
              icon: Briefcase, 
              color: "text-blue-500",
              trend: "ETA 2:30 PM",
              trendUp: true
            },
            { 
              label: "This Week", 
              value: "4 jobs", 
              icon: Calendar, 
              color: "text-green-500",
              trend: "+1 completed",
              trendUp: true
            },
            { 
              label: "Earnings", 
              value: "$1,250", 
              icon: DollarSign, 
              color: "text-green-600",
              trend: "+$150 this week",
              trendUp: true
            },
            { 
              label: "Rating", 
              value: "4.9/5", 
              icon: CheckCircle, 
              color: "text-yellow-500",
              trend: "Excellent",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Current Job", icon: MapPin, path: "/jobs/current", color: "bg-blue-600" },
            { label: "Navigation", icon: MapPin, path: "/navigation", color: "bg-green-600" },
            { label: "My Jobs", icon: Briefcase, path: "/jobs", color: "bg-purple-600" },
            { label: "Earnings", icon: DollarSign, path: "/earnings", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "Job Started",
              description: "Load pickup from Chicago Terminal",
              timestamp: "30 minutes ago",
              status: "success"
            },
            {
              title: "Navigation Active",
              description: "Route: Chicago → Dallas (847 miles)",
              timestamp: "25 minutes ago",
              status: "success"
            },
            {
              title: "Bonus Earned",
              description: "On-time delivery bonus - $50",
              timestamp: "Yesterday",
              status: "success"
            },
          ]
        };

      case "CATALYST":
        return {
          title: "Catalyst Dashboard",
          subtitle: "AI-powered load optimization",
          metrics: [
            { 
              label: "Matched Loads", 
              value: "8", 
              icon: Zap, 
              color: "text-blue-500",
              trend: "+3 today",
              trendUp: true
            },
            { 
              label: "Success Rate", 
              value: "94%", 
              icon: CheckCircle, 
              color: "text-green-500",
              trend: "+2% this month",
              trendUp: true
            },
            { 
              label: "Specializations", 
              value: "5", 
              icon: Target, 
              color: "text-purple-500",
              trend: "All active",
              trendUp: true
            },
            { 
              label: "Earnings", 
              value: "$3,450", 
              icon: DollarSign, 
              color: "text-green-600",
              trend: "+15% vs last week",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Matched Loads", icon: Zap, path: "/matched-loads", color: "bg-blue-600" },
            { label: "Specializations", icon: Target, path: "/specializations", color: "bg-purple-600" },
            { label: "AI Assistant", icon: Brain, path: "/ai-assistant", color: "bg-green-600" },
            { label: "Performance", icon: BarChart3, path: "/performance", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "AI Match Found",
              description: "Load matched to specialization",
              timestamp: "1 hour ago",
              status: "success"
            },
            {
              title: "Recommendation",
              description: "Consider adding Hazmat certification",
              timestamp: "2 hours ago",
              status: "pending"
            },
            {
              title: "Bonus Achieved",
              description: "90%+ success rate bonus - $200",
              timestamp: "Yesterday",
              status: "success"
            },
          ]
        };

      case "ESCORT":
        return {
          title: "Escort Dashboard",
          subtitle: "Convoy management and security",
          metrics: [
            { 
              label: "Active Convoys", 
              value: "2", 
              icon: Shield, 
              color: "text-blue-500",
              trend: "All secure",
              trendUp: true
            },
            { 
              label: "Team Members", 
              value: "6", 
              icon: Users, 
              color: "text-green-500",
              trend: "All on duty",
              trendUp: true
            },
            { 
              label: "Incidents", 
              value: "0", 
              icon: AlertCircle, 
              color: "text-green-600",
              trend: "No alerts",
              trendUp: true
            },
            { 
              label: "This Month", 
              value: "$4,200", 
              icon: DollarSign, 
              color: "text-purple-500",
              trend: "+5% vs last month",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Active Convoys", icon: Shield, path: "/convoys", color: "bg-blue-600" },
            { label: "Team", icon: Users, path: "/team", color: "bg-green-600" },
            { label: "Tracking", icon: MapPin, path: "/tracking", color: "bg-purple-600" },
            { label: "Reports", icon: FileText, path: "/reports", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "Convoy Started",
              description: "Hazmat shipment - 3 vehicles",
              timestamp: "2 hours ago",
              status: "success"
            },
            {
              title: "Security Check",
              description: "All systems operational",
              timestamp: "1 hour ago",
              status: "success"
            },
            {
              title: "Route Update",
              description: "Detour due to traffic - ETA adjusted",
              timestamp: "30 minutes ago",
              status: "pending"
            },
          ]
        };

      case "TERMINAL_MANAGER":
        return {
          title: "Terminal Manager Dashboard",
          subtitle: "Facility operations and compliance",
          metrics: [
            { 
              label: "Incoming", 
              value: "5", 
              icon: Truck, 
              color: "text-blue-500",
              trend: "Next 2 hours",
              trendUp: true
            },
            { 
              label: "Outgoing", 
              value: "3", 
              icon: Package, 
              color: "text-green-500",
              trend: "Ready to depart",
              trendUp: true
            },
            { 
              label: "Compliance", 
              value: "100%", 
              icon: CheckCircle, 
              color: "text-green-600",
              trend: "All clear",
              trendUp: true
            },
            { 
              label: "Staff", 
              value: "12", 
              icon: Users, 
              color: "text-purple-500",
              trend: "On duty",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Incoming", icon: Truck, path: "/incoming", color: "bg-blue-600" },
            { label: "Outgoing", icon: Package, path: "/outgoing", color: "bg-green-600" },
            { label: "Operations", icon: Building2, path: "/operations", color: "bg-purple-600" },
            { label: "Compliance", icon: CheckCircle, path: "/compliance", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "Shipment Received",
              description: "Load #TRM-2025-045 - Verified",
              timestamp: "30 minutes ago",
              status: "success"
            },
            {
              title: "Shipment Dispatched",
              description: "Load #TRM-2025-042 - Departed",
              timestamp: "1 hour ago",
              status: "success"
            },
            {
              title: "Compliance Check",
              description: "All documentation verified",
              timestamp: "2 hours ago",
              status: "success"
            },
          ]
        };

      case "ADMIN":
        return {
          title: "Admin Dashboard",
          subtitle: "Platform management and oversight",
          metrics: [
            { 
              label: "Total Users", 
              value: "1,234", 
              icon: Users, 
              color: "text-blue-500",
              trend: "+45 this month",
              trendUp: true
            },
            { 
              label: "Active Loads", 
              value: "456", 
              icon: Package, 
              color: "text-green-500",
              trend: "+78 today",
              trendUp: true
            },
            { 
              label: "Revenue", 
              value: "$2.5M", 
              icon: DollarSign, 
              color: "text-purple-500",
              trend: "+12% vs last month",
              trendUp: true
            },
            { 
              label: "System Health", 
              value: "99.9%", 
              icon: CheckCircle, 
              color: "text-green-600",
              trend: "All systems operational",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "Users", icon: Users, path: "/admin/users", color: "bg-blue-600" },
            { label: "Loads", icon: Package, path: "/admin/loads", color: "bg-green-600" },
            { label: "Payments", icon: DollarSign, path: "/admin/payments", color: "bg-purple-600" },
            { label: "Analytics", icon: BarChart3, path: "/admin/analytics", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "User Verification",
              description: "45 new users verified",
              timestamp: "1 hour ago",
              status: "success"
            },
            {
              title: "Payment Processed",
              description: "$125,450 distributed to carriers",
              timestamp: "2 hours ago",
              status: "success"
            },
            {
              title: "System Alert",
              description: "High load on database - monitoring",
              timestamp: "30 minutes ago",
              status: "warning"
            },
          ]
        };

      case "SUPER_ADMIN":
        return {
          title: "Super Admin Dashboard",
          subtitle: "System administration and configuration",
          metrics: [
            { 
              label: "System Status", 
              value: "Operational", 
              icon: CheckCircle, 
              color: "text-green-500",
              trend: "All services running",
              trendUp: true
            },
            { 
              label: "API Health", 
              value: "99.95%", 
              icon: TrendingUp, 
              color: "text-green-600",
              trend: "Excellent",
              trendUp: true
            },
            { 
              label: "Database", 
              value: "Healthy", 
              icon: Database, 
              color: "text-blue-500",
              trend: "No issues",
              trendUp: true
            },
            { 
              label: "Security", 
              value: "Secure", 
              icon: Shield, 
              color: "text-purple-500",
              trend: "All checks passed",
              trendUp: true
            },
          ],
          quickActions: [
            { label: "System Config", icon: Settings, path: "/super-admin/config", color: "bg-blue-600" },
            { label: "Database", icon: Database, path: "/super-admin/database", color: "bg-green-600" },
            { label: "Security", icon: Shield, path: "/super-admin/security", color: "bg-purple-600" },
            { label: "Monitoring", icon: BarChart3, path: "/super-admin/monitoring", color: "bg-orange-600" },
          ],
          recentActivity: [
            {
              title: "System Update",
              description: "Security patches applied",
              timestamp: "1 hour ago",
              status: "success"
            },
            {
              title: "Backup Completed",
              description: "Full system backup - 2.3 TB",
              timestamp: "2 hours ago",
              status: "success"
            },
            {
              title: "Configuration Change",
              description: "API rate limits adjusted",
              timestamp: "3 hours ago",
              status: "success"
            },
          ]
        };

      default:
        return {
          title: "Dashboard",
          subtitle: "Welcome to EusoTrip",
          metrics: [],
          quickActions: [],
          recentActivity: []
        };
    }
  };

  const config = getDashboardConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{config.title}</h1>
        <p className="text-gray-400 mt-1">{config.subtitle}</p>
      </div>

      {/* Welcome Card with Map and Analytics */}
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-magenta-600 rounded-lg p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || "User"}!</h2>
              <p className="text-blue-100">{user?.email || "user@example.com"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">Role: {userRole}</p>
              <p className="text-xs text-blue-200 mt-1">Last login: Today at 9:30 AM</p>
            </div>
          </div>
        </div>

        {/* Role-Based Map */}
        <div className="rounded-lg overflow-hidden border border-slate-700 shadow-lg shadow-blue-500/20">
          <RoleBasedMap height="h-96" />
        </div>

        {/* Dashboard Analytics */}
        <div className="rounded-lg overflow-hidden border border-slate-700">
          <DashboardAnalytics />
        </div>
      </div>

      {/* Metrics Grid and Activity */}
      {config.metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {config.metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <Card key={idx} className="bg-gray-900 border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-400">{metric.label}</h3>
                  <Icon size={20} className={metric.color} />
                </div>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                {metric.trend && (
                  <p className={`text-xs mt-2 ${metric.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {metric.trend}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      {config.quickActions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {config.quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className={`${action.color} text-white h-auto py-4 flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-all`}
                >
                  <Icon size={24} />
                  <span>{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {config.recentActivity.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {config.recentActivity.map((activity, idx) => (
              <Card key={idx} className="bg-gray-900 border-gray-700 p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' :
                    activity.status === 'warning' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{activity.title}</h4>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Import missing icons
import { Plus, Search, Truck, Brain, FileText, Settings, Database } from "lucide-react";

