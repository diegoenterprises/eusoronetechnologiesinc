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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  UserCheck, CheckCircle, Clock, Search, User,
  XCircle, FileText, Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserVerification() {
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const usersQuery = (trpc as any).admin.getPendingVerifications.useQuery({ filter, search });
  const statsQuery = (trpc as any).admin.getVerificationStats.useQuery();

  const approveMutation = (trpc as any).admin.approveUser.useMutation({
    onSuccess: () => { toast.success("User approved"); usersQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = (trpc as any).admin.rejectUser.useMutation({
    onSuccess: () => { toast.success("User rejected"); usersQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      shipper: "bg-blue-500/20 text-blue-400",
      carrier: "bg-green-500/20 text-green-400",
      broker: "bg-purple-500/20 text-purple-400",
      driver: "bg-cyan-500/20 text-cyan-400",
    };
    return <Badge className={cn("border-0", colors[role] || "bg-slate-500/20 text-slate-400")}>{role}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">User Verification</h1>
          <p className="text-slate-400 text-sm mt-1">Verify and approve user accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.approvedToday || 0}</p>}<p className="text-xs text-slate-400">Approved Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><XCircle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.rejectedToday || 0}</p>}<p className="text-xs text-slate-400">Rejected Today</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><UserCheck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalVerified || 0}</p>}<p className="text-xs text-slate-400">Total Verified</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-cyan-400" />Verification Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : (usersQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" /><p className="text-slate-400">No pending verifications</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(usersQuery.data as any)?.map((user: any) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{user.name?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-bold">{user.name}</p>
                          {getRoleBadge(user.role)}
                        </div>
                        <p className="text-sm text-slate-400">{user.email}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{user.company}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Applied: {user.appliedAt}</span>
                        </div>
                      </div>
                    </div>
                    {user.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-lg" onClick={() => rejectMutation.mutate({ userId: user.id })}>
                          <XCircle className="w-4 h-4 mr-1" />Reject
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg" onClick={() => approveMutation.mutate({ userId: user.id })}>
                          <CheckCircle className="w-4 h-4 mr-1" />Approve
                        </Button>
                      </div>
                    )}
                  </div>
                  {user.documents && user.documents.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Documents:</span>
                      {user.documents.map((doc: any, i: number) => (
                        <Badge key={i} className={cn("border-0 text-xs", doc.verified ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-300")}>
                          <FileText className="w-3 h-3 mr-1" />{doc.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
