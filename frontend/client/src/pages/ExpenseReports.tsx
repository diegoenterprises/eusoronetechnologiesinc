/**
 * EXPENSE REPORTS PAGE
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
  Receipt, DollarSign, CheckCircle, Clock, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExpenseReports() {
  const [status, setStatus] = useState("all");

  const expensesQuery = (trpc as any).payroll.getExpenseReports.useQuery({ status });
  const statsQuery = (trpc as any).payroll.getExpenseStats.useQuery();

  const approveMutation = (trpc as any).payroll.approveExpense.useMutation({
    onSuccess: () => { toast.success("Expense approved"); expensesQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "reimbursed": return <Badge className="bg-purple-500/20 text-purple-400 border-0"><DollarSign className="w-3 h-3 mr-1" />Reimbursed</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Expense Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Manage expense reimbursements</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />New Report
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Receipt className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Reports</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.pendingAmount?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Pending</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-green-400">${stats?.approvedAmount?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Approved</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold text-purple-400">${stats?.reimbursedAmount?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Reimbursed</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="reimbursed">Reimbursed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Receipt className="w-5 h-5 text-cyan-400" />Expense Reports</CardTitle></CardHeader>
        <CardContent className="p-0">
          {expensesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (expensesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><Receipt className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No expense reports found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(expensesQuery.data as any)?.map((expense: any) => (
                <div key={expense.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", expense.status === "reimbursed" ? "bg-purple-500/20" : expense.status === "approved" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                      <Receipt className={cn("w-5 h-5", expense.status === "reimbursed" ? "text-purple-400" : expense.status === "approved" ? "text-green-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{expense.employeeName}</p>
                        {getStatusBadge(expense.status)}
                      </div>
                      <p className="text-sm text-slate-400">{expense.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Submitted: {expense.submittedDate}</span>
                        <span>Category: {expense.category}</span>
                        <span>Items: {expense.itemCount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${expense.amount?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    {expense.status === "pending" && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg" onClick={() => approveMutation.mutate({ id: expense.id })}>
                        Approve
                      </Button>
                    )}
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
