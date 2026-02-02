/**
 * FACTORING DASHBOARD PAGE - 100% Dynamic
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { DollarSign, Plus, Fuel, Building, Receipt } from "lucide-react";

export default function FactoringDashboard() {
  const accountQuery = trpc.factoring.getAccount.useQuery();
  const statsQuery = trpc.factoring.getStats.useQuery();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Factoring Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Quick pay and invoice factoring</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 rounded-lg"><Fuel className="w-4 h-4 mr-2" />Fuel Advance</Button>
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg"><Plus className="w-4 h-4 mr-2" />Submit Invoice</Button>
        </div>
      </div>

      {accountQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : accountQuery.data && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-500/20"><Building className="w-8 h-8 text-green-400" /></div>
              <div><p className="text-white font-bold text-xl">{accountQuery.data.provider}</p><p className="text-sm text-slate-400">Account: {accountQuery.data.accountNumber}</p></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Credit Limit</p><p className="text-white font-bold">${accountQuery.data.creditLimit?.toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Available</p><p className="text-green-400 font-bold">${accountQuery.data.availableCredit?.toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Advance Rate</p><p className="text-cyan-400 font-bold">{accountQuery.data.advanceRate}%</p></div>
              <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Fee Rate</p><p className="text-purple-400 font-bold">{accountQuery.data.factoringFee}%</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-4">
        {statsQuery.isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-full bg-cyan-500/20"><Receipt className="w-6 h-6 text-cyan-400" /></div><div><p className="text-2xl font-bold text-cyan-400">{statsQuery.data?.totalInvoices || 0}</p><p className="text-xs text-slate-400">Total Invoices</p></div></CardContent></Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div><div><p className="text-2xl font-bold text-green-400">${statsQuery.data?.totalFactored?.toLocaleString() || 0}</p><p className="text-xs text-slate-400">Total Factored</p></div></CardContent></Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-full bg-yellow-500/20"><Receipt className="w-6 h-6 text-yellow-400" /></div><div><p className="text-2xl font-bold text-yellow-400">{statsQuery.data?.pendingInvoices || 0}</p><p className="text-xs text-slate-400">Pending</p></div></CardContent></Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl"><CardContent className="p-5 flex items-center gap-4"><div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div><div><p className="text-2xl font-bold text-purple-400">{statsQuery.data?.avgDaysToFund || 0}</p><p className="text-xs text-slate-400">Avg Days</p></div></CardContent></Card>
          </>
        )}
      </div>
    </div>
  );
}
