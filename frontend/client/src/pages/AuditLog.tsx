/**
 * AUDIT LOG PAGE
 * System audit trail for compliance and security
 * Based on 10_ADMIN_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Search, Filter, Download, Clock, User,
  Shield, AlertTriangle, CheckCircle, Eye, Edit,
  Trash2, LogIn, LogOut, Settings, Key, Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  category: "auth" | "data" | "config" | "compliance" | "security" | "system";
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  severity: "info" | "warning" | "critical";
  success: boolean;
}

const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: "a1", timestamp: "2026-01-23 16:45:32", userId: "u1", userName: "John Smith",
    userRole: "Driver", action: "DVIR_SUBMIT", category: "compliance",
    resource: "Vehicle Inspection", resourceId: "DVIR-4521",
    details: "Pre-trip inspection completed for TRK-101. No defects found.",
    ipAddress: "192.168.1.100", severity: "info", success: true
  },
  {
    id: "a2", timestamp: "2026-01-23 16:30:15", userId: "u2", userName: "Admin User",
    userRole: "Admin", action: "USER_CREATE", category: "data",
    resource: "User Account", resourceId: "u45",
    details: "Created new driver account for Maria Garcia",
    ipAddress: "10.0.0.50", severity: "info", success: true
  },
  {
    id: "a3", timestamp: "2026-01-23 16:15:00", userId: "u3", userName: "Sarah Chen",
    userRole: "Safety Manager", action: "INCIDENT_UPDATE", category: "compliance",
    resource: "Incident Report", resourceId: "INC-2026-0045",
    details: "Updated incident status from 'reported' to 'investigating'",
    ipAddress: "10.0.0.75", severity: "warning", success: true
  },
  {
    id: "a4", timestamp: "2026-01-23 15:45:22", userId: "u4", userName: "Unknown",
    userRole: "Unknown", action: "LOGIN_FAILED", category: "security",
    resource: "Authentication", details: "Failed login attempt - invalid credentials",
    ipAddress: "203.0.113.45", severity: "critical", success: false
  },
  {
    id: "a5", timestamp: "2026-01-23 15:30:00", userId: "u5", userName: "Mike Johnson",
    userRole: "Compliance Officer", action: "DOCUMENT_VERIFY", category: "compliance",
    resource: "Driver Document", resourceId: "DOC-8821",
    details: "Verified CDL for driver Robert Johnson - expires 2027-07-05",
    ipAddress: "10.0.0.60", severity: "info", success: true
  },
  {
    id: "a6", timestamp: "2026-01-23 15:00:00", userId: "u2", userName: "Admin User",
    userRole: "Admin", action: "CONFIG_CHANGE", category: "config",
    resource: "System Settings", details: "Updated HOS rules to include 30-minute break requirement",
    ipAddress: "10.0.0.50", severity: "warning", success: true
  },
  {
    id: "a7", timestamp: "2026-01-23 14:30:00", userId: "u6", userName: "ABC Transport",
    userRole: "Carrier", action: "BID_SUBMIT", category: "data",
    resource: "Load Bid", resourceId: "LOAD-45901",
    details: "Submitted bid of $2,800 for load LOAD-45901",
    ipAddress: "172.16.0.100", severity: "info", success: true
  },
  {
    id: "a8", timestamp: "2026-01-23 14:00:00", userId: "u7", userName: "Shell Oil",
    userRole: "Shipper", action: "LOAD_CREATE", category: "data",
    resource: "Load", resourceId: "LOAD-45905",
    details: "Created new hazmat load - Gasoline, Class 3, Houston to Dallas",
    ipAddress: "172.16.0.200", severity: "info", success: true
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  auth: <LogIn className="w-4 h-4" />,
  data: <Database className="w-4 h-4" />,
  config: <Settings className="w-4 h-4" />,
  compliance: <Shield className="w-4 h-4" />,
  security: <Key className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-500/20 text-blue-400",
  data: "bg-green-500/20 text-green-400",
  config: "bg-purple-500/20 text-purple-400",
  compliance: "bg-cyan-500/20 text-cyan-400",
  security: "bg-red-500/20 text-red-400",
  system: "bg-slate-500/20 text-slate-400",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  critical: "bg-red-500/20 text-red-400",
};

export default function AuditLog() {
  const [auditLog] = useState<AuditEntry[]>(MOCK_AUDIT_LOG);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const filteredLog = auditLog.filter(entry => {
    const matchesSearch = !searchTerm ||
      entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resourceId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || entry.severity === severityFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const stats = {
    total: auditLog.length,
    today: auditLog.length,
    warnings: auditLog.filter(e => e.severity === "warning").length,
    critical: auditLog.filter(e => e.severity === "critical").length,
    failed: auditLog.filter(e => !e.success).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-slate-400">System activity and compliance audit trail</p>
        </div>
        <Button variant="outline" className="border-slate-600">
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Events</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Today</p>
                <p className="text-2xl font-bold text-white">{stats.today}</p>
              </div>
              <Clock className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Warnings</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.warnings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Critical</p>
                <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
              </div>
              <Shield className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by user, action, or details..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="data">Data Changes</SelectItem>
                <SelectItem value="config">Configuration</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-40 bg-slate-700/50 border-slate-600 text-white"
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-40 bg-slate-700/50 border-slate-600 text-white"
              placeholder="End Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Activity Log
            <Badge variant="outline" className="ml-2 text-slate-400">
              {filteredLog.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-700">
                  <th className="pb-3 pr-4">Timestamp</th>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Resource</th>
                  <th className="pb-3 pr-4">Details</th>
                  <th className="pb-3 pr-4">IP Address</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((entry) => (
                  <tr 
                    key={entry.id} 
                    className={cn(
                      "border-b border-slate-700/50 hover:bg-slate-700/20",
                      entry.severity === "critical" && "bg-red-500/5",
                      !entry.success && "bg-red-500/5"
                    )}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-300 whitespace-nowrap">
                          {entry.timestamp}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-sm text-white">{entry.userName}</p>
                        <p className="text-xs text-slate-500">{entry.userRole}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <code className="text-xs text-cyan-400 bg-slate-700/50 px-2 py-1 rounded">
                        {entry.action}
                      </code>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={cn("text-xs", CATEGORY_COLORS[entry.category])}>
                        <span className="mr-1">{CATEGORY_ICONS[entry.category]}</span>
                        {entry.category}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="text-sm text-slate-300">{entry.resource}</p>
                        {entry.resourceId && (
                          <p className="text-xs text-slate-500">{entry.resourceId}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs text-slate-400 max-w-xs truncate" title={entry.details}>
                        {entry.details}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <code className="text-xs text-slate-500">{entry.ipAddress}</code>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Badge className={SEVERITY_COLORS[entry.severity]}>
                          {entry.severity}
                        </Badge>
                        {entry.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLog.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No audit entries found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Compliance Information</p>
              <p className="text-xs text-slate-400 mt-1">
                Audit logs are retained for 7 years per DOT regulations (49 CFR Part 395). 
                All entries are tamper-proof and cryptographically signed. 
                Contact your compliance officer for log export requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
