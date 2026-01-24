/**
 * ADMIN DASHBOARD PAGE
 * Platform administration and management
 * Based on 10_ADMIN_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Package, Shield, AlertTriangle, TrendingUp,
  Settings, Search, CheckCircle, XCircle, Clock, Eye,
  Building2, Truck, Activity, Server, Database, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PendingVerification {
  id: string;
  companyName: string;
  type: "carrier" | "shipper" | "broker";
  usdot?: string;
  submittedAt: string;
  status: "pending" | "in_review";
}

interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: string;
  resolved: boolean;
}

const STATS = {
  totalUsers: 2847,
  activeLoads: 156,
  pendingVerifications: 12,
  todaySignups: 23,
  openTickets: 8,
  systemHealth: 99.8,
};

const MOCK_VERIFICATIONS: PendingVerification[] = [
  { id: "v1", companyName: "Gulf Coast Transport LLC", type: "carrier", usdot: "3456789", submittedAt: "2 hours ago", status: "pending" },
  { id: "v2", companyName: "Texas Fuel Distributors", type: "shipper", submittedAt: "4 hours ago", status: "pending" },
  { id: "v3", companyName: "Southwest Logistics Inc", type: "broker", submittedAt: "6 hours ago", status: "in_review" },
  { id: "v4", companyName: "Eagle Tanker Services", type: "carrier", usdot: "4567890", submittedAt: "8 hours ago", status: "pending" },
];

const MOCK_ALERTS: SystemAlert[] = [
  { id: "a1", type: "warning", message: "High API latency detected on load-matching service", timestamp: "10 min ago", resolved: false },
  { id: "a2", type: "info", message: "Database backup completed successfully", timestamp: "1 hour ago", resolved: true },
  { id: "a3", type: "error", message: "Payment processing timeout - 3 transactions affected", timestamp: "2 hours ago", resolved: true },
];

const TYPE_COLORS = {
  carrier: "bg-green-500/20 text-green-400",
  shipper: "bg-blue-500/20 text-blue-400",
  broker: "bg-purple-500/20 text-purple-400",
};

const ALERT_COLORS = {
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function AdminDashboard() {
  const [verifications] = useState<PendingVerification[]>(MOCK_VERIFICATIONS);
  const [alerts] = useState<SystemAlert[]>(MOCK_ALERTS);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const handleApprove = (id: string) => {
    toast.success("Company approved", {
      description: "Verification email sent to company.",
    });
  };

  const handleReject = (id: string) => {
    toast.error("Company rejected", {
      description: "Rejection notice sent with reasons.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Platform administration and monitoring</p>
        </div>
        <Button variant="outline" className="border-slate-600">
          <Settings className="w-4 h-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{STATS.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Loads</p>
                <p className="text-2xl font-bold text-green-400">{STATS.activeLoads}</p>
              </div>
              <Package className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending Verify</p>
                <p className="text-2xl font-bold text-yellow-400">{STATS.pendingVerifications}</p>
              </div>
              <Shield className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Today's Signups</p>
                <p className="text-2xl font-bold text-white">{STATS.todaySignups}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Open Tickets</p>
                <p className="text-2xl font-bold text-orange-400">{STATS.openTickets}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">System Health</p>
                <p className="text-2xl font-bold text-green-400">{STATS.systemHealth}%</p>
              </div>
              <Activity className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Verifications */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-400" />
                    Pending Verifications
                  </CardTitle>
                  <Badge variant="outline" className="text-yellow-400">
                    {verifications.filter(v => v.status === "pending").length} pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verifications.slice(0, 4).map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", TYPE_COLORS[v.type])}>
                          {v.type === "carrier" && <Truck className="w-5 h-5" />}
                          {v.type === "shipper" && <Building2 className="w-5 h-5" />}
                          {v.type === "broker" && <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{v.companyName}</p>
                          <p className="text-xs text-slate-400">
                            {v.type} {v.usdot && `• USDOT: ${v.usdot}`} • {v.submittedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-green-400 hover:bg-green-500/20" onClick={() => handleApprove(v.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/20" onClick={() => handleReject(v.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-400">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={cn(
                      "p-3 rounded-lg border",
                      ALERT_COLORS[alert.type],
                      alert.resolved && "opacity-50"
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm">{alert.message}</p>
                          <p className="text-xs opacity-70 mt-1">{alert.timestamp}</p>
                        </div>
                        {alert.resolved ? (
                          <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>
                        ) : (
                          <Button size="sm" variant="ghost">Resolve</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Health */}
          <Card className="bg-slate-800/50 border-slate-700 mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-green-400" />
                Platform Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-2" />
                  <p className="text-white font-medium">API Gateway</p>
                  <p className="text-xs text-green-400">Operational</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-2" />
                  <p className="text-white font-medium">Database</p>
                  <p className="text-xs text-green-400">Operational</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-2" />
                  <p className="text-white font-medium">Load Matching</p>
                  <p className="text-xs text-yellow-400">Degraded</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-700/30 text-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-2" />
                  <p className="text-white font-medium">Payments</p>
                  <p className="text-xs text-green-400">Operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Company Verifications</CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search companies..."
                    className="pl-9 w-64 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", TYPE_COLORS[v.type])}>
                        {v.type === "carrier" && <Truck className="w-6 h-6" />}
                        {v.type === "shipper" && <Building2 className="w-6 h-6" />}
                        {v.type === "broker" && <Users className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{v.companyName}</p>
                        <p className="text-sm text-slate-400">{v.type.charAt(0).toUpperCase() + v.type.slice(1)}</p>
                        {v.usdot && <p className="text-xs text-slate-500">USDOT: {v.usdot}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={v.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}>
                          {v.status}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">{v.submittedAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(v.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/20" onClick={() => handleReject(v.id)}>
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">User management interface</p>
              <p className="text-sm text-slate-500 mt-1">Search, view, and manage platform users</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Database className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">System configuration</p>
              <p className="text-sm text-slate-500 mt-1">Manage platform settings, integrations, and configurations</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
