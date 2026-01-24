/**
 * USER MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, UserPlus, CheckCircle, XCircle, Clock, Search,
  Edit, Trash2, Shield, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = trpc.admin.getUsers.useQuery({ limit: 50 });
  const summaryQuery = trpc.admin.getUsersSummary.useQuery();

  const activateMutation = trpc.admin.activateUser.useMutation({
    onSuccess: () => { toast.success("User activated"); usersQuery.refetch(); },
    onError: (error) => toast.error("Failed to activate user", { description: error.message }),
  });

  const deactivateMutation = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => { toast.success("User deactivated"); usersQuery.refetch(); },
    onError: (error) => toast.error("Failed to deactivate user", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "inactive": return <Badge className="bg-red-500/20 text-red-400 border-0">Inactive</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Admin</Badge>;
      case "dispatcher": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Dispatcher</Badge>;
      case "driver": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Driver</Badge>;
      case "carrier": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Carrier</Badge>;
      case "shipper": return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Shipper</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{role}</Badge>;
    }
  };

  const filteredUsers = usersQuery.data?.filter((user: any) => {
    return !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage platform users and permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <UserPlus className="w-4 h-4 mr-2" />Add User
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Users</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.inactive || 0}</p>
                )}
                <p className="text-xs text-slate-400">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg focus:border-cyan-500/50"
        />
      </div>

      {/* Users List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : filteredUsers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredUsers?.map((user: any) => (
                <div key={user.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-full", user.status === "active" ? "bg-green-500/20" : user.status === "pending" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                        <Users className={cn("w-5 h-5", user.status === "active" ? "text-green-400" : user.status === "pending" ? "text-yellow-400" : "text-red-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{user.name}</p>
                          {getStatusBadge(user.status)}
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        <p className="text-xs text-slate-500">Last login: {user.lastLogin || "Never"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.status === "active" ? (
                        <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-400 rounded-lg" onClick={() => deactivateMutation.mutate({ userId: user.id })} disabled={deactivateMutation.isPending}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="bg-green-500/20 border-green-500/30 hover:bg-green-500/30 text-green-400 rounded-lg" onClick={() => activateMutation.mutate({ userId: user.id })} disabled={activateMutation.isPending}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
