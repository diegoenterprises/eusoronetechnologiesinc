/**
 * AUDIT LOGS PAGE
 * System activity logging for admins
 * Tracks all user actions and system events
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Activity, Search, Filter, Download, Clock, User,
  FileText, Settings, Shield, Truck, DollarSign,
  AlertTriangle, Eye, ChevronRight, RefreshCw, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActionType = "create" | "update" | "delete" | "view" | "login" | "logout" | "export" | "approve" | "reject";
type ResourceType = "load" | "user" | "company" | "payment" | "document" | "bid" | "settings" | "system";

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: ActionType;
  resource: ResourceType;
  resourceId: string;
  resourceName: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: "log_001",
    timestamp: "2025-01-23T14:45:00",
    userId: "usr_001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "approve",
    resource: "company",
    resourceId: "comp_045",
    resourceName: "SafeHaul Transport LLC",
    details: "Approved company verification request",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    success: true,
  },
  {
    id: "log_002",
    timestamp: "2025-01-23T14:30:00",
    userId: "usr_002",
    userName: "Sarah Shipper",
    userRole: "SHIPPER",
    action: "create",
    resource: "load",
    resourceId: "load_45921",
    resourceName: "LOAD-45921",
    details: "Created new load: Houston to Dallas, Gasoline 42,000 lbs",
    ipAddress: "10.0.0.55",
    userAgent: "Safari/17.0 macOS",
    success: true,
  },
  {
    id: "log_003",
    timestamp: "2025-01-23T14:15:00",
    userId: "usr_003",
    userName: "Mike Carrier",
    userRole: "CARRIER",
    action: "create",
    resource: "bid",
    resourceId: "bid_8834",
    resourceName: "Bid on LOAD-45921",
    details: "Submitted bid: $2,450 for Load #45921",
    ipAddress: "172.16.0.25",
    userAgent: "Chrome/120.0 Android",
    success: true,
  },
  {
    id: "log_004",
    timestamp: "2025-01-23T14:00:00",
    userId: "usr_004",
    userName: "Tom Driver",
    userRole: "DRIVER",
    action: "update",
    resource: "load",
    resourceId: "load_45920",
    resourceName: "LOAD-45920",
    details: "Status changed: Loading -> In Transit",
    ipAddress: "Mobile GPS",
    userAgent: "EusoTrip Mobile/2.1 iOS",
    success: true,
  },
  {
    id: "log_005",
    timestamp: "2025-01-23T13:45:00",
    userId: "usr_001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "update",
    resource: "settings",
    resourceId: "sys_config",
    resourceName: "System Settings",
    details: "Updated platform commission rate: 8% -> 7.5%",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    success: true,
  },
  {
    id: "log_006",
    timestamp: "2025-01-23T13:30:00",
    userId: "usr_005",
    userName: "Lisa Compliance",
    userRole: "COMPLIANCE_OFFICER",
    action: "export",
    resource: "document",
    resourceId: "report_dq_jan",
    resourceName: "DQ File Compliance Report",
    details: "Exported monthly DQ file compliance report",
    ipAddress: "10.0.0.78",
    userAgent: "Firefox/121.0 Windows",
    success: true,
  },
  {
    id: "log_007",
    timestamp: "2025-01-23T13:15:00",
    userId: "usr_006",
    userName: "Unknown",
    userRole: "UNKNOWN",
    action: "login",
    resource: "system",
    resourceId: "auth",
    resourceName: "Authentication",
    details: "Failed login attempt - invalid credentials",
    ipAddress: "45.67.89.123",
    userAgent: "Python-urllib/3.9",
    success: false,
  },
  {
    id: "log_008",
    timestamp: "2025-01-23T13:00:00",
    userId: "usr_007",
    userName: "Bob Safety",
    userRole: "SAFETY_MANAGER",
    action: "view",
    resource: "document",
    resourceId: "csa_report_jan",
    resourceName: "CSA Scores Dashboard",
    details: "Viewed CSA BASIC scores dashboard",
    ipAddress: "10.0.0.92",
    userAgent: "Edge/120.0 Windows",
    success: true,
  },
  {
    id: "log_009",
    timestamp: "2025-01-23T12:45:00",
    userId: "usr_001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "reject",
    resource: "company",
    resourceId: "comp_044",
    resourceName: "Shady Trucking Inc",
    details: "Rejected verification: Invalid MC authority documentation",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0 Windows",
    success: true,
  },
  {
    id: "log_010",
    timestamp: "2025-01-23T12:30:00",
    userId: "usr_008",
    userName: "Amy Billing",
    userRole: "ADMIN",
    action: "create",
    resource: "payment",
    resourceId: "pmt_9982",
    resourceName: "Payment to ABC Transport",
    details: "Processed carrier payment: $3,600 for LOAD-45898",
    ipAddress: "192.168.1.105",
    userAgent: "Chrome/120.0 Windows",
    success: true,
  },
];

const ACTION_CONFIG: Record<ActionType, { label: string; color: string }> = {
  create: { label: "Create", color: "bg-green-500/20 text-green-400" },
  update: { label: "Update", color: "bg-blue-500/20 text-blue-400" },
  delete: { label: "Delete", color: "bg-red-500/20 text-red-400" },
  view: { label: "View", color: "bg-slate-500/20 text-slate-400" },
  login: { label: "Login", color: "bg-purple-500/20 text-purple-400" },
  logout: { label: "Logout", color: "bg-purple-500/20 text-purple-400" },
  export: { label: "Export", color: "bg-cyan-500/20 text-cyan-400" },
  approve: { label: "Approve", color: "bg-emerald-500/20 text-emerald-400" },
  reject: { label: "Reject", color: "bg-orange-500/20 text-orange-400" },
};

const RESOURCE_CONFIG: Record<ResourceType, { label: string; icon: React.ElementType }> = {
  load: { label: "Load", icon: Truck },
  user: { label: "User", icon: User },
  company: { label: "Company", icon: Shield },
  payment: { label: "Payment", icon: DollarSign },
  document: { label: "Document", icon: FileText },
  bid: { label: "Bid", icon: DollarSign },
  settings: { label: "Settings", icon: Settings },
  system: { label: "System", icon: Activity },
};

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs] = useState<AuditLog[]>(MOCK_LOGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [filterSuccess, setFilterSuccess] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!log.userName.toLowerCase().includes(q) &&
          !log.resourceName.toLowerCase().includes(q) &&
          !log.details.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterAction !== "all" && log.action !== filterAction) return false;
    if (filterResource !== "all" && log.resource !== filterResource) return false;
    if (filterSuccess === "success" && !log.success) return false;
    if (filterSuccess === "failed" && log.success) return false;
    return true;
  });

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 text-sm">System activity and user action history</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-slate-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{logs.length}</p>
              <p className="text-xs text-slate-500">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <User className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {new Set(logs.map(l => l.userId)).size}
              </p>
              <p className="text-xs text-slate-500">Active Users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {logs.filter(l => !l.success).length}
              </p>
              <p className="text-xs text-red-500/70">Failed Actions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Today</p>
              <p className="text-xs text-slate-500">Time Range</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="pl-10 bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
            >
              <option value="all">All Actions</option>
              {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
            >
              <option value="all">All Resources</option>
              {Object.entries(RESOURCE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Timestamp</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">User</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Action</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Resource</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Details</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Status</th>
                <th className="text-right text-slate-400 text-xs font-medium p-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLogs.map((log) => {
                const ResourceIcon = RESOURCE_CONFIG[log.resource].icon;
                return (
                  <tr 
                    key={log.id} 
                    className={cn(
                      "hover:bg-slate-700/20 transition-colors cursor-pointer",
                      !log.success && "bg-red-500/5"
                    )}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-white text-sm">{log.userName}</p>
                        <p className="text-xs text-slate-500">{log.userRole}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={ACTION_CONFIG[log.action].color}>
                        {ACTION_CONFIG[log.action].label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <ResourceIcon className="w-4 h-4 text-slate-400" />
                        {log.resourceName}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="p-4">
                      {log.success ? (
                        <Badge className="bg-green-500/20 text-green-400">Success</Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">Failed</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right text-slate-500 text-xs">
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No logs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Log Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Timestamp</p>
                  <p className="text-white">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  {selectedLog.success ? (
                    <Badge className="bg-green-500/20 text-green-400">Success</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400">Failed</Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400">User</p>
                  <p className="text-white">{selectedLog.userName}</p>
                  <p className="text-xs text-slate-500">{selectedLog.userRole}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Action</p>
                  <Badge className={ACTION_CONFIG[selectedLog.action].color}>
                    {ACTION_CONFIG[selectedLog.action].label}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Resource</p>
                  <p className="text-white">{selectedLog.resourceName}</p>
                  <p className="text-xs text-slate-500">ID: {selectedLog.resourceId}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Details</p>
                  <p className="text-white">{selectedLog.details}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">IP Address</p>
                  <p className="text-white font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">User Agent</p>
                  <p className="text-white text-sm">{selectedLog.userAgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
