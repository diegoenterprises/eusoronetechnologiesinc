/**
 * COMPANY MANAGEMENT PAGE
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
  Building, Search, Plus, Edit, Shield,
  CheckCircle, XCircle, Clock, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CompanyManagement() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const companiesQuery = (trpc as any).admin.getCompanies.useQuery({ search, type: typeFilter });
  const statsQuery = (trpc as any).admin.getCompanyStats.useQuery();

  const verifyMutation = (trpc as any).admin.verifyCompany.useMutation({
    onSuccess: () => { toast.success("Company verified"); companiesQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      shipper: "bg-blue-500/20 text-blue-400",
      carrier: "bg-green-500/20 text-green-400",
      broker: "bg-purple-500/20 text-purple-400",
      terminal: "bg-cyan-500/20 text-cyan-400",
    };
    return <Badge className={cn("border-0", colors[type] || "bg-slate-500/20 text-slate-400")}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500/20 text-green-400 border-0"><Shield className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Company Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage registered companies</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Company
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Building className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Shield className="w-6 h-6 text-green-400" /></div>
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
              <div className="p-3 rounded-full bg-red-500/20"><XCircle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.suspended || 0}</p>}<p className="text-xs text-slate-400">Suspended</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search companies..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="shipper">Shipper</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
            <SelectItem value="broker">Broker</SelectItem>
            <SelectItem value="terminal">Terminal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Building className="w-5 h-5 text-cyan-400" />Companies</CardTitle></CardHeader>
        <CardContent className="p-0">
          {companiesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (companiesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Building className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No companies found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(companiesQuery.data as any)?.map((company: any) => (
                <div key={company.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{company.name?.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{company.name}</p>
                        {getTypeBadge(company.type)}
                        {getStatusBadge(company.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {company.dotNumber && <span>DOT# {company.dotNumber}</span>}
                        {company.mcNumber && <span>MC# {company.mcNumber}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Users className="w-3 h-3" /><span>{company.userCount} users</span>
                        <span>|</span>
                        <span>Joined: {company.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.status === "pending" && (
                      <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg" onClick={() => verifyMutation.mutate({ companyId: company.id })}>
                        <CheckCircle className="w-4 h-4 mr-1" />Verify
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><Edit className="w-4 h-4" /></Button>
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
