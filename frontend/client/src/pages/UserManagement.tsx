/**
 * USER MANAGEMENT PAGE
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
  User, Users, Shield, Search, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, Building, Key, Lock, Unlock,
  UserPlus, UserCheck, UserX, Settings, Download, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const usersQuery = trpc.admin.listUsers.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });
  const rolesQuery = trpc.admin.listRoles.useQuery();
  const pendingQuery = trpc.admin.getPendingUsers.useQuery();

  const activateMutation = trpc.admin.activateUser.useMutation({
    onSuccess: () => { toast.success("User activated"); usersQuery.refetch(); pendingQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const suspendMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => { toast.success("User suspended"); usersQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const resetPasswordMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (usersQuery.error) {
    return (
      <div className="p-6 text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading users</p>
        <Button className="mt-4" onClick={() => usersQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const users = usersQuery.data?.users || [];
  const stats = {
    totalUsers: usersQuery.data?.total || 0,
    activeUsers: users.filter(u => u.status === "active").length,
    pendingVerification: pendingQuery.data?.length || 0,
    suspendedUsers: users.filter(u => u.status === "suspended").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "suspended": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-500/20 text-purple-400";
      case "dispatcher": return "bg-blue-500/20 text-blue-400";
      case "driver": return "bg-green-500/20 text-green-400";
      case "broker": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const formatLastLogin = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button className="bg-blue-600 hover:bg-blue-700"><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {usersQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            )}
            <p className="text-xs text-slate-400">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {usersQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-green-400">{stats.activeUsers}</p>
            )}
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {pendingQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingVerification}</p>
            )}
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <UserX className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {usersQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-red-400">{stats.suspendedUsers}</p>
            )}
            <p className="text-xs text-slate-400">Suspended</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">Users</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-blue-600">Roles</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">Pending ({stats.pendingVerification})</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users..." className="pl-9 bg-slate-700/50 border-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="dispatcher">Dispatcher</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {usersQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {users.map((user) => (
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
                            <p className="text-xs text-slate-500 flex items-center gap-1"><Building className="w-3 h-3" />{user.company}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                        <div className="text-right w-24">
                          <p className="text-xs text-slate-500">Last login</p>
                          <p className="text-sm text-slate-400">{formatLastLogin(user.lastLogin)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => resetPasswordMutation.mutate({ userId: user.id })} disabled={resetPasswordMutation.isPending}>
                            {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                          </Button>
                          {user.status === "active" ? (
                            <Button variant="ghost" size="sm" onClick={() => suspendMutation.mutate({ userId: user.id })} disabled={suspendMutation.isPending}>
                              {suspendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-red-400" />}
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => activateMutation.mutate({ userId: user.id })} disabled={activateMutation.isPending}>
                              {activateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4 text-green-400" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rolesQuery.isLoading ? (
              [1, 2, 3, 4].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>)
            ) : (
              rolesQuery.data?.map((role) => (
                <Card key={role.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base">{role.name}</CardTitle>
                      <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-4">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-400">{role.userCount} users</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-slate-600">{role.permissions?.length || 0} permissions</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-400" />Pending Verification</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingQuery.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : pendingQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No pending verifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingQuery.data?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                          <p className="text-xs text-slate-500">Registered: {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => activateMutation.mutate({ userId: user.id })} disabled={activateMutation.isPending}>
                          {activateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Approve</>}
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400">
                          <XCircle className="w-4 h-4 mr-2" />Reject
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
