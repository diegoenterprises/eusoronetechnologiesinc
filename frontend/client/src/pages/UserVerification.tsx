/**
 * USER VERIFICATION PAGE
 * 100% Dynamic - No mock data
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "carrier": return "bg-blue-500/20 text-blue-400";
      case "shipper": return "bg-purple-500/20 text-purple-400";
      case "broker": return "bg-green-500/20 text-green-400";
      case "driver": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Verification</h1>
          <p className="text-slate-400 text-sm">Review and approve user registrations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Requests</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.pending || 0}</p>
            )}
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.approved || 0}</p>
            )}
            <p className="text-xs text-slate-400">Approved</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.rejected || 0}</p>
            )}
            <p className="text-xs text-slate-400">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users..." className="pl-9 bg-slate-700/50 border-slate-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600">Pending ({summary?.pending || 0})</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-blue-600">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-blue-600">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {requestsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : requestsQuery.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No {activeTab} requests</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {requestsQuery.data?.map((request) => (
                    <div key={request.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{request.name}</p>
                              <Badge className={getRoleColor(request.role)}>{request.role}</Badge>
                              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
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
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          {request.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => rejectMutation.mutate({ userId: request.id })} disabled={rejectMutation.isPending}>
                                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveMutation.mutate({ userId: request.id })} disabled={approveMutation.isPending}>
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
