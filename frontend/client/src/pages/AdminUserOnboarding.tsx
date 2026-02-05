/**
 * ADMIN USER ONBOARDING PAGE
 * 100% Dynamic - Manage user onboarding workflows and progress
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  UserPlus, Search, Clock, CheckCircle, AlertTriangle,
  Mail, User, Building, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUserOnboarding() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("in_progress");
  const [roleFilter, setRoleFilter] = useState("all");

  const usersQuery = trpc.admin.getOnboardingUsers.useQuery({ status: statusFilter !== "all" ? statusFilter : undefined });
  const statsQuery = trpc.admin.getOnboardingStats.useQuery();

  const sendReminderMutation = trpc.admin.sendOnboardingReminder.useMutation({
    onSuccess: () => {
      toast.success("Reminder sent");
    },
  });

  const users = usersQuery.data || [];
  const stats = statsQuery.data;

  const filteredUsers = users.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.company?.toLowerCase().includes(search.toLowerCase())
  );

  const getStepColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-yellow-500";
      case "pending": return "bg-slate-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            User Onboarding
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track and manage user onboarding progress</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Users</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.totalUsers || stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Stalled</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{(stats as any)?.stalled || stats?.abandoned || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Days</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{(stats as any)?.avgDays || stats?.avgCompletionTime || 0}</p>
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
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stalled">Stalled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="carrier">Carrier</SelectItem>
                <SelectItem value="shipper">Shipper</SelectItem>
                <SelectItem value="broker">Broker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className={cn(
                  "p-5 hover:bg-slate-700/20 transition-colors",
                  user.isStalled && "border-l-4 border-red-500"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        user.progress >= 100 ? "bg-green-500/20" :
                        user.isStalled ? "bg-red-500/20" :
                        "bg-cyan-500/20"
                      )}>
                        <User className={cn(
                          "w-6 h-6",
                          user.progress >= 100 ? "text-green-400" :
                          user.isStalled ? "text-red-400" :
                          "text-cyan-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{user.name}</p>
                          <Badge className={cn(
                            "border-0 text-xs",
                            user.role === "driver" ? "bg-blue-500/20 text-blue-400" :
                            user.role === "carrier" ? "bg-purple-500/20 text-purple-400" :
                            user.role === "shipper" ? "bg-green-500/20 text-green-400" :
                            "bg-cyan-500/20 text-cyan-400"
                          )}>
                            {user.role}
                          </Badge>
                          {user.isStalled && (
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Stalled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="w-3 h-3" /><span>{user.email}</span>
                          {user.company && (
                            <>
                              <span className="text-slate-600">•</span>
                              <Building className="w-3 h-3" /><span>{user.company}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Started</p>
                        <p className="text-white">{user.startedAt}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Last Activity</p>
                        <p className="text-white">{user.lastActivity}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendReminderMutation.mutate({ userId: user.id })}
                        disabled={sendReminderMutation.isPending}
                        className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                      >
                        <Mail className="w-4 h-4 mr-1" />Remind
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">Progress</span>
                      <span className={cn(
                        "font-medium",
                        user.progress >= 100 ? "text-green-400" :
                        user.progress >= 50 ? "text-yellow-400" :
                        "text-slate-400"
                      )}>
                        {user.progress}%
                      </span>
                    </div>
                    <Progress value={user.progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2">
                    {user.steps?.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          getStepColor(step.status)
                        )}>
                          {step.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-white">{idx + 1}</span>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs",
                          step.status === "completed" ? "text-green-400" :
                          step.status === "in_progress" ? "text-yellow-400" :
                          "text-slate-500"
                        )}>
                          {step.name}
                        </span>
                        {idx < user.steps.length - 1 && (
                          <div className={cn(
                            "w-8 h-0.5 mx-1",
                            step.status === "completed" ? "bg-green-500" : "bg-slate-600"
                          )} />
                        )}
                      </div>
                    ))}
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
