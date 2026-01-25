/**
 * TERMINAL STAFF PAGE - TERMINAL MANAGER
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
  Users, Search, CheckCircle, Clock, Plus,
  Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TerminalStaff() {
  const [search, setSearch] = useState("");

  const staffQuery = trpc.terminals.getStaff.useQuery({ search });
  const statsQuery = trpc.terminals.getStaffStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_duty": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />On Duty</Badge>;
      case "off_duty": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Off Duty</Badge>;
      case "break": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Break</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "supervisor": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Supervisor</Badge>;
      case "forklift": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Forklift</Badge>;
      case "loader": return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">Loader</Badge>;
      case "gate": return <Badge className="bg-orange-500/20 text-orange-400 border-0">Gate</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{role}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Terminal Staff</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your terminal personnel</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Staff
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Users className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.onDuty || 0}</p>}<p className="text-xs text-slate-400">On Duty</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.onBreak || 0}</p>}<p className="text-xs text-slate-400">On Break</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Users className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.supervisors || 0}</p>}<p className="text-xs text-slate-400">Supervisors</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" />Staff</CardTitle></CardHeader>
        <CardContent className="p-0">
          {staffQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : !staffQuery.data || (Array.isArray(staffQuery.data) && staffQuery.data.length === 0) ? (
            <div className="text-center py-16"><Users className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No staff found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(Array.isArray(staffQuery.data) ? staffQuery.data : []).map((staff: any) => (
                <div key={staff.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{staff.name?.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{staff.name}</p>
                        {getRoleBadge(staff.role)}
                        {getStatusBadge(staff.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{staff.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{staff.email}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Shift: {staff.shift} | Area: {staff.assignedArea}</p>
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
