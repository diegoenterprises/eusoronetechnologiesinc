/**
 * BENEFITS MANAGEMENT PAGE
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
  Heart, Search, CheckCircle, Clock, Users,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BenefitsManagement() {
  const [search, setSearch] = useState("");

  const benefitsQuery = (trpc as any).payroll.getBenefits.useQuery({ search });
  const statsQuery = (trpc as any).payroll.getBenefitStats.useQuery();

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Enrolled</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "waived": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Waived</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Benefits Management</h1>
          <p className="text-slate-400 text-sm mt-1">Employee benefits enrollment</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Users className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalEmployees || 0}</p>}<p className="text-xs text-slate-400">Employees</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.enrolled || 0}</p>}<p className="text-xs text-slate-400">Enrolled</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Heart className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.plans || 0}</p>}<p className="text-xs text-slate-400">Plans</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><DollarSign className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.monthlyCost?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Monthly</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search employees..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-cyan-400" />Benefits Enrollment</CardTitle></CardHeader>
        <CardContent className="p-0">
          {benefitsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : (benefitsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Heart className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No benefits found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(benefitsQuery.data as any)?.map((benefit: any) => (
                <div key={benefit.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white text-lg">{benefit.employeeName?.charAt(0)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{benefit.employeeName}</p>
                        {getStatusBadge(benefit.status)}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {benefit.plans?.map((plan: any, idx: number) => (
                          <Badge key={idx} className={cn("border-0", plan.enrolled ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                            {plan.type}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Effective: {benefit.effectiveDate}</span>
                        <span>Dependents: {benefit.dependents}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${benefit.employeeCost}/mo</p>
                      <p className="text-xs text-slate-500">Employee Cost</p>
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
