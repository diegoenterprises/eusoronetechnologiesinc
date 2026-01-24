/**
 * USER VERIFICATION PAGE
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
  User, CheckCircle, XCircle, Clock, Search, Eye,
  Building, Mail, Phone, Calendar, AlertTriangle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserVerification() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  const summaryQuery = trpc.admin.getVerificationSummary.useQuery();
  const requestsQuery = trpc.admin.getVerificationRequests.useQuery({
    status: activeTab !== "all" ? activeTab : undefined,
    search: searchTerm || undefined,
  });

  const approveMutation = trpc.admin.approveVerification.useMutation({
    onSuccess: () => { toast.success("User approved"); requestsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = trpc.admin.rejectVerification.useMutation({
    onSuccess: () => { toast.success("User rejected"); requestsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      carrier: "bg-blue-500/20 text-blue-400",
      shipper: "bg-purple-500/20 text-purple-400",
      broker: "bg-green-500/20 text-green-400",
      driver: "bg-orange-500/20 text-orange-400",
    };
    return <Badge className={cn("border-0", colors[role] || "bg-slate-500/20 text-slate-400")}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Pending</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            User Verification
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve user registrations</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Requests</p>
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
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.approved || 0}</p>
                )}
                <p className="text-xs text-slate-400">Approved</p>
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
                  <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
                )}
                <p className="text-xs text-slate-400">Rejected</p>
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
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 rounded-md">
            Pending ({summary?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-slate-700 rounded-md">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-slate-700 rounded-md">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {requestsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : requestsQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No {activeTab} requests</p>
                  <p className="text-slate-500 text-sm mt-1">Check back later for new submissions</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {requestsQuery.data?.map((request) => (
                    <div key={request.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-full bg-slate-700/50">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{request.name}</p>
                              {getRoleBadge(request.role)}
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{request.email}</span>
                              {request.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{request.phone}</span>}
                            </div>
                            {request.companyName && (
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <Building className="w-3 h-3" />{request.companyName}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />Submitted: {request.submittedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></Button>
                          {request.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-lg" 
                                onClick={() => rejectMutation.mutate({ userId: request.id })} 
                                disabled={rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 rounded-lg" 
                                onClick={() => approveMutation.mutate({ userId: request.id })} 
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </Button>
                            </>
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
      </Tabs>
    </div>
  );
}
