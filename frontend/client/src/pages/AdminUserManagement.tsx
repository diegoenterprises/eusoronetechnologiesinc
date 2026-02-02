/**
 * ADMIN USER MANAGEMENT PAGE
 * 100% Dynamic - Manage users, roles, and permissions
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Users, Search, Plus, Edit, Trash2, Shield,
  Mail, Phone, CheckCircle, XCircle, Clock,
  MoreVertical, Key, Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400",
  shipper: "bg-blue-500/20 text-blue-400",
  carrier: "bg-purple-500/20 text-purple-400",
  broker: "bg-cyan-500/20 text-cyan-400",
  driver: "bg-green-500/20 text-green-400",
  catalyst: "bg-yellow-500/20 text-yellow-400",
  terminal: "bg-orange-500/20 text-orange-400",
  escort: "bg-pink-500/20 text-pink-400",
  compliance: "bg-indigo-500/20 text-indigo-400",
  safety: "bg-emerald-500/20 text-emerald-400",
};

export default function AdminUserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const usersQuery = trpc.admin.getUsers.useQuery({
    search,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const statsQuery = trpc.admin.getUserStats.useQuery();

  const toggleStatusMutation = trpc.admin.toggleUserStatus.useMutation({
    onSuccess: () => {
      toast.success("User status updated");
      usersQuery.refetch();
    },
  });

  const resetPasswordMutation = trpc.admin.resetPassword.useMutation({
    onSuccess: () => toast.success("Password reset email sent"),
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      usersQuery.refetch();
    },
  });

  const users = usersQuery.data || [];
  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage users, roles, and permissions</p>
        </div>
        <Button
          onClick={() => setShowAddUser(true)}
          className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
                    <p className="text-xs text-slate-400">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.active || 0}</p>
                    <p className="text-xs text-slate-400">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.pending || 0}</p>
                    <p className="text-xs text-slate-400">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats?.inactive || 0}</p>
                    <p className="text-xs text-slate-400">Inactive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="shipper">Shipper</SelectItem>
                <SelectItem value="carrier">Carrier</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="catalyst">Catalyst</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-4 space-y-3">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {users.map((user: any) => (
                <div key={user.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <span className="text-cyan-400 font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />{user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={cn("border-0", roleColors[user.role] || "bg-slate-500/20 text-slate-400")}>
                        {user.role}
                      </Badge>
                      <Badge className={cn(
                        "border-0",
                        user.status === "active" ? "bg-green-500/20 text-green-400" :
                        user.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {user.status}
                      </Badge>
                      {user.organization && (
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Building className="w-3 h-3" />{user.organization}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetPasswordMutation.mutate({ userId: user.id })}
                          className="text-slate-400 hover:text-white"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ userId: user.id })}
                          className="text-slate-400 hover:text-white"
                        >
                          {user.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Name</label>
              <Input className="bg-slate-700/50 border-slate-600/50" />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Email</label>
              <Input type="email" className="bg-slate-700/50 border-slate-600/50" />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Role</label>
              <Select>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipper">Shipper</SelectItem>
                  <SelectItem value="carrier">Carrier</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="catalyst">Catalyst</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)} className="bg-slate-700/50 border-slate-600/50">
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600">
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
