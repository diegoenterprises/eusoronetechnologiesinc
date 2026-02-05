/**
 * ADMIN USER VERIFICATION PAGE
 * 100% Dynamic - Verify and approve new user registrations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  UserCheck, Search, CheckCircle, XCircle, Clock,
  Building, Shield, FileText, AlertTriangle, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUserVerification() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [roleFilter, setRoleFilter] = useState("all");

  const usersQuery = (trpc as any).admin.getPendingVerifications.useQuery({ filter: statusFilter !== "all" ? statusFilter : undefined });
  const statsQuery = (trpc as any).admin.getVerificationStats.useQuery();

  const approveMutation = (trpc as any).admin.approveUser.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully");
      usersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const rejectMutation = (trpc as any).admin.rejectUser.useMutation({
    onSuccess: () => {
      toast.success("User rejected");
      usersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const users = usersQuery.data || [];
  const stats = statsQuery.data;

  const filteredUsers = users.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "approved": return "bg-green-500/20 text-green-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "review": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "shipper": return "bg-blue-500/20 text-blue-400";
      case "carrier": return "bg-purple-500/20 text-purple-400";
      case "broker": return "bg-green-500/20 text-green-400";
      case "driver": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            User Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve new registrations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Approved Today</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.approvedToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Rejected Today</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.rejectedToday || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">This Week</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalVerified || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Urgent Queue */}
      {(stats?.pending || 0) > 5 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white font-medium">{stats?.pending || 0} users waiting for review</p>
                <p className="text-slate-400 text-sm">Prioritize these verifications</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setStatusFilter("urgent")}
              className="bg-red-600 hover:bg-red-700 rounded-lg"
            >
              View Urgent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="shipper">Shipper</SelectItem>
                <SelectItem value="carrier">Carrier</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="escort">Escort</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No users pending verification</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  user.isUrgent && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{user.name}</p>
                          <Badge className={cn("border-0", getStatusColor(user.status))}>
                            {user.status}
                          </Badge>
                          <Badge className={cn("border-0", getRoleBadgeColor(user.role))}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Building className="w-3 h-3" />Company</p>
                        <p className="text-white">{user.company || "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Applied</p>
                        <p className="text-white">{user.appliedAt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "border-0 text-xs",
                          user.documentsComplete ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          <FileText className="w-3 h-3 mr-1" />
                          {user.documentsComplete ? "Docs Complete" : "Docs Pending"}
                        </Badge>
                        {user.saferVerified && (
                          <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                            <Shield className="w-3 h-3 mr-1" />SAFER
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {user.mcNumber && (
                        <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          MC# {user.mcNumber}
                        </Badge>
                      )}
                      {user.dotNumber && (
                        <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          DOT# {user.dotNumber}
                        </Badge>
                      )}
                      {user.state && (
                        <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          {user.state}
                        </Badge>
                      )}
                    </div>

                    {user.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                        >
                          <Eye className="w-4 h-4 mr-1" />Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectMutation.mutate({ userId: user.id })}
                          className="bg-red-500/20 border-red-500/50 text-red-400 rounded-lg"
                        >
                          <XCircle className="w-4 h-4 mr-1" />Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate({ userId: user.id })}
                          className="bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />Approve
                        </Button>
                      </div>
                    )}
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
