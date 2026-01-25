/**
 * EMPLOYMENT HISTORY PAGE
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
  Briefcase, Search, CheckCircle, Clock, Building,
  User, Plus, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmploymentHistory() {
  const [search, setSearch] = useState("");

  const historyQuery = trpc.compliance.getEmploymentHistory.useQuery({ search });
  const statsQuery = trpc.compliance.getEmploymentHistoryStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "incomplete": return <Badge className="bg-red-500/20 text-red-400 border-0">Incomplete</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Employment History</h1>
          <p className="text-slate-400 text-sm mt-1">Driver employment verification</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Record
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Briefcase className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.verified || 0}</p>}<p className="text-xs text-slate-400">Verified</p></div>
            </div>
          </CardContent>
        </Card>
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
              <div className="p-3 rounded-full bg-purple-500/20"><User className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.drivers || 0}</p>}<p className="text-xs text-slate-400">Drivers</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-cyan-400" />Employment Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          {historyQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : historyQuery.data?.length === 0 ? (
            <div className="text-center py-16"><Briefcase className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No records found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {historyQuery.data?.map((record: any) => (
                <div key={record.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", record.status === "verified" ? "bg-green-500/20" : record.status === "pending" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <Briefcase className={cn("w-5 h-5", record.status === "verified" ? "text-green-400" : record.status === "pending" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{record.driverName}</p>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Building className="w-3 h-3" /><span>{record.employer}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{record.startDate} - {record.endDate || "Present"}</span>
                        <span>Position: {record.position}</span>
                        <span>Reason: {record.reasonForLeaving}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">View</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
