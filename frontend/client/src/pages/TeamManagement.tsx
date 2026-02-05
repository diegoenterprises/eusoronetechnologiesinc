/**
 * TEAM MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
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
  Users, Search, Plus, UserPlus, Mail,
  CheckCircle, Clock, Shield, MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeamManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const membersQuery = (trpc as any).team.getMembers.useQuery({ role: roleFilter === "all" ? undefined : roleFilter, limit: 50 });
  const rolesQuery = (trpc as any).team.getRoles.useQuery();
  const invitesQuery = (trpc as any).team.getPendingInvites.useQuery();

  const inviteMutation = (trpc as any).team.invite.useMutation({
    onSuccess: () => { toast.success("Invitation sent"); invitesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to invite", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "inactive": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Inactive</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-red-500/20 text-red-400 border-0"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "manager": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Manager</Badge>;
      case "dispatcher": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Dispatcher</Badge>;
      case "driver": return <Badge className="bg-green-500/20 text-green-400 border-0">Driver</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{role}</Badge>;
    }
  };

  const filteredMembers = (membersQuery.data as any)?.filter((member: any) =>
    !searchTerm || member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Team Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage team members and permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <UserPlus className="w-4 h-4 mr-2" />Invite Member
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
                {membersQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{(membersQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Members</p>
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
                {membersQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{(membersQuery.data as any)?.filter((m: any) => m.status === "active").length || 0}</p>
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
                <Mail className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {invitesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(invitesQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {membersQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{(membersQuery.data as any)?.filter((m: any) => m.role === "admin").length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search members..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(rolesQuery.data as any)?.map((role: any) => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {membersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredMembers?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No team members found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredMembers?.map((member: any) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                      {member.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{member.name}</p>
                        {getStatusBadge(member.status)}
                        {getRoleBadge(member.role)}
                      </div>
                      <p className="text-sm text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-slate-500">
                      <p>Last active: {member.lastActive}</p>
                      <p>Joined: {member.joinedAt}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
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
