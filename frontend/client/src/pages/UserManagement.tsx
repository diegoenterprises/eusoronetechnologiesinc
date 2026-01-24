/**
 * USER MANAGEMENT PAGE
 * Admin user and role management
 * Based on 10_ADMIN_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  User, Users, Shield, Search, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, Mail, Phone, Building,
  Key, Lock, Unlock, MoreVertical, Filter, Download,
  UserPlus, UserCheck, UserX, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type UserStatus = "active" | "pending" | "suspended" | "inactive";
type UserRole = "admin" | "dispatcher" | "driver" | "broker" | "shipper" | "carrier" | "compliance" | "safety" | "terminal" | "escort";

interface SystemUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  company?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  verified: boolean;
  twoFactorEnabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showNewUser, setShowNewUser] = useState(false);

  const users: SystemUser[] = [
    { id: "u1", email: "admin@eusotrip.com", firstName: "System", lastName: "Admin", role: "admin", status: "active", createdAt: "2024-01-01", lastLogin: "2025-01-24T08:00:00Z", verified: true, twoFactorEnabled: true },
    { id: "u2", email: "mike.johnson@abctransport.com", firstName: "Mike", lastName: "Johnson", role: "driver", status: "active", company: "ABC Transport", phone: "(555) 123-4567", createdAt: "2024-06-15", lastLogin: "2025-01-24T06:30:00Z", verified: true, twoFactorEnabled: false },
    { id: "u3", email: "sarah.williams@abctransport.com", firstName: "Sarah", lastName: "Williams", role: "dispatcher", status: "active", company: "ABC Transport", phone: "(555) 234-5678", createdAt: "2024-06-15", lastLogin: "2025-01-24T07:45:00Z", verified: true, twoFactorEnabled: true },
    { id: "u4", email: "john.smith@shell.com", firstName: "John", lastName: "Smith", role: "shipper", status: "active", company: "Shell Oil Company", phone: "(555) 345-6789", createdAt: "2024-03-20", lastLogin: "2025-01-23T14:00:00Z", verified: true, twoFactorEnabled: false },
    { id: "u5", email: "david.brown@xyzbroker.com", firstName: "David", lastName: "Brown", role: "broker", status: "active", company: "XYZ Brokerage", phone: "(555) 456-7890", createdAt: "2024-08-10", lastLogin: "2025-01-24T09:15:00Z", verified: true, twoFactorEnabled: true },
    { id: "u6", email: "emily.martinez@newdriver.com", firstName: "Emily", lastName: "Martinez", role: "driver", status: "pending", company: "ABC Transport", phone: "(555) 567-8901", createdAt: "2025-01-20", verified: false, twoFactorEnabled: false },
    { id: "u7", email: "chris.taylor@suspended.com", firstName: "Chris", lastName: "Taylor", role: "driver", status: "suspended", company: "Fast Freight", phone: "(555) 678-9012", createdAt: "2024-04-05", lastLogin: "2025-01-10T12:00:00Z", verified: true, twoFactorEnabled: false },
    { id: "u8", email: "lisa.jones@compliance.com", firstName: "Lisa", lastName: "Jones", role: "compliance", status: "active", company: "ABC Transport", phone: "(555) 789-0123", createdAt: "2024-07-22", lastLogin: "2025-01-24T08:30:00Z", verified: true, twoFactorEnabled: true },
  ];

  const roles: Role[] = [
    { id: "r1", name: "Admin", description: "Full system access", permissions: ["all"], userCount: 2 },
    { id: "r2", name: "Dispatcher", description: "Manage loads and drivers", permissions: ["loads.manage", "drivers.view", "fleet.view"], userCount: 8 },
    { id: "r3", name: "Driver", description: "Driver mobile app access", permissions: ["loads.view", "hos.manage", "documents.upload"], userCount: 45 },
    { id: "r4", name: "Broker", description: "Broker portal access", permissions: ["loads.create", "carriers.view", "bids.manage"], userCount: 12 },
    { id: "r5", name: "Shipper", description: "Shipper portal access", permissions: ["loads.create", "tracking.view", "invoices.view"], userCount: 25 },
    { id: "r6", name: "Carrier", description: "Carrier portal access", permissions: ["loads.view", "bids.create", "fleet.manage"], userCount: 18 },
    { id: "r7", name: "Compliance", description: "Compliance management", permissions: ["compliance.manage", "drivers.view", "documents.manage"], userCount: 4 },
    { id: "r8", name: "Safety", description: "Safety management", permissions: ["safety.manage", "drivers.view", "incidents.manage"], userCount: 3 },
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    pendingVerification: users.filter(u => u.status === "pending").length,
    suspendedUsers: users.filter(u => u.status === "suspended").length,
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "suspended": return "bg-red-500/20 text-red-400";
      case "inactive": return "bg-slate-500/20 text-slate-400";
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-purple-500/20 text-purple-400";
      case "dispatcher": return "bg-blue-500/20 text-blue-400";
      case "driver": return "bg-green-500/20 text-green-400";
      case "broker": return "bg-orange-500/20 text-orange-400";
      case "shipper": return "bg-cyan-500/20 text-cyan-400";
      case "carrier": return "bg-indigo-500/20 text-indigo-400";
      case "compliance": return "bg-yellow-500/20 text-yellow-400";
      case "safety": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatLastLogin = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return formatDate(timestamp);
  };

  const activateUser = (userId: string) => {
    toast.success("User activated");
  };

  const suspendUser = (userId: string) => {
    toast.success("User suspended");
  };

  const resetPassword = (userId: string) => {
    toast.success("Password reset email sent");
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm && !`${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewUser(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-xs text-slate-400">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-3xl font-bold text-green-400">{stats.activeUsers}</p>
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingVerification}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <UserX className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <p className="text-3xl font-bold text-red-400">{stats.suspendedUsers}</p>
            <p className="text-xs text-slate-400">Suspended</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">Users</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-blue-600">Roles</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">
            Pending ({stats.pendingVerification})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-9 bg-slate-700/50 border-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="dispatcher">Dispatcher</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
                <SelectItem value="shipper">Shipper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          {user.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {user.twoFactorEnabled && <Shield className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        {user.company && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {user.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      </div>
                      <div className="text-center">
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                      </div>
                      <div className="text-right w-24">
                        <p className="text-xs text-slate-500">Last login</p>
                        <p className="text-sm text-slate-400">{formatLastLogin(user.lastLogin)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => resetPassword(user.id)}>
                          <Key className="w-4 h-4" />
                        </Button>
                        {user.status === "active" ? (
                          <Button variant="ghost" size="sm" onClick={() => suspendUser(user.id)}>
                            <Lock className="w-4 h-4 text-red-400" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => activateUser(user.id)}>
                            <Unlock className="w-4 h-4 text-green-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base">{role.name}</CardTitle>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-4">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">{role.userCount} users</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-600">
                      {role.permissions.length} permissions
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {users.filter(u => u.status === "pending").length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No pending verifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.filter(u => u.status === "pending").map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                          <p className="text-xs text-slate-500">Registered: {formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => activateUser(user.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
