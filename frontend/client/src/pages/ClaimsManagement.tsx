/**
 * CLAIMS MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, DollarSign, CheckCircle, Clock, AlertTriangle,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClaimsManagement() {
  const [filter, setFilter] = useState("all");

  const claimsQuery = trpc.insurance.getClaims.useQuery({ filter });
  const statsQuery = trpc.insurance.getClaimStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Open</Badge>;
      case "investigating": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Investigating</Badge>;
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "denied": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Denied</Badge>;
      case "paid": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><DollarSign className="w-3 h-3 mr-1" />Paid</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Claims Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage insurance claims</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />File Claim
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20"><Clock className="w-6 h-6 text-blue-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-blue-400">{stats?.open || 0}</p>}<p className="text-xs text-slate-400">Open</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>}<p className="text-xs text-slate-400">Approved</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">${stats?.totalPaid?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Paid</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><DollarSign className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.pending?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="investigating">Investigating</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="denied">Denied</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Claims</CardTitle></CardHeader>
        <CardContent className="p-0">
          {claimsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : claimsQuery.data?.length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No claims found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {claimsQuery.data?.map((claim: any) => (
                <div key={claim.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", claim.status === "paid" ? "bg-purple-500/20" : claim.status === "approved" ? "bg-green-500/20" : claim.status === "denied" ? "bg-red-500/20" : "bg-blue-500/20")}>
                      <FileText className={cn("w-5 h-5", claim.status === "paid" ? "text-purple-400" : claim.status === "approved" ? "text-green-400" : claim.status === "denied" ? "text-red-400" : "text-blue-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">Claim #{claim.claimNumber}</p>
                        {getStatusBadge(claim.status)}
                      </div>
                      <p className="text-sm text-slate-400">{claim.type} - {claim.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Filed: {claim.filedDate}</span>
                        <span>Incident: {claim.incidentDate}</span>
                        <span>Policy: {claim.policyNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${claim.amount?.toLocaleString()}</p>
                      {claim.paidAmount && <p className="text-xs text-slate-500">Paid: ${claim.paidAmount?.toLocaleString()}</p>}
                    </div>
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg">View</Button>
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
