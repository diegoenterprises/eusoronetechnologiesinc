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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users, Search, Plus, Eye, CheckCircle, Clock,
  XCircle, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function UserManagement() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const usersQuery = trpc.admin.listUsers.useQuery({ limit: 50 });
  const summaryQuery = trpc.admin.getUsersSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-0">Active</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-0">Suspended</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-400",
      shipper: "bg-blue-500/20 text-blue-400",
      carrier: "bg-orange-500/20 text-orange-400",
      driver: "bg-cyan-500/20 text-cyan-400",
      broker: "bg-pink-500/20 text-pink-400",
    };
    return <Badge className={cn(colors[role] || "bg-slate-500/20 text-slate-400", "border-0")}>{role}</Badge>;
  };

  const filteredUsers = usersQuery.data?.filter((user: any) => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || user.status === activeTab;
    return matchesSearch && matchesTab;
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
          <Plus className="w-4 h-4 mr-2" />Add User
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
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalUsers || 0}</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.activeUsers || 0}</p>
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
                  <p className="text-2xl font-bold text-yellow-400">{summary?.pendingUsers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.adminUsers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Admins</p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-slate-700 rounded-md">Active</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">Pending</TabsTrigger>
          <TabsTrigger value="suspended" className="data-[state=active]:bg-slate-700 rounded-md">Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
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
                          <div className={cn("p-3 rounded-xl", user.status === "active" ? "bg-green-500/20" : user.status === "pending" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                            <Users className={cn("w-6 h-6", user.status === "active" ? "text-green-400" : user.status === "pending" ? "text-yellow-400" : "text-red-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{user.name}</p>
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.status)}
                            </div>
                            <p className="text-sm text-slate-400">{user.email}</p>
                            <p className="text-xs text-slate-500">Joined: {user.createdAt}</p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-slate-700 hover:bg-slate-600 rounded-lg" onClick={() => setLocation(`/users/${user.id}`)}>
                          <Eye className="w-4 h-4 mr-1" />View
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
