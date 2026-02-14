import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { FileText, Search, DollarSign, Clock, CheckCircle, XCircle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export default function FactoringInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const invoicesQuery = (trpc as any).factoring.getInvoices.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const submitMutation = (trpc as any).factoring.submitInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice submitted for factoring"); invoicesQuery.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const invoices = (invoicesQuery.data || []).filter((inv: any) =>
    !search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      funded: "bg-blue-500/20 text-blue-400",
      rejected: "bg-red-500/20 text-red-400",
      disputed: "bg-orange-500/20 text-orange-400",
    };
    return <Badge className={`${map[s] || "bg-slate-500/20 text-slate-400"} border-0`}>{s}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Invoice Management
        </h1>
        <p className="text-muted-foreground mt-1">Review, approve, and fund catalyst invoices</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="funded">Funded</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {invoicesQuery.isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : invoices.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No invoices found</p>
            <p className="text-sm text-muted-foreground">Invoices submitted by catalysts will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => (
            <Card key={inv.id || inv.factoringId} className="border-border/50 bg-card/50 hover:border-[#1473FF]/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-[#1473FF]" />
                    </div>
                    <div>
                      <p className="font-medium">{inv.invoiceNumber || `INV-${inv.id}`}</p>
                      <p className="text-sm text-muted-foreground">{inv.customer || "Unknown Customer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">${(inv.amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{inv.dueDate || "No due date"}</p>
                    </div>
                    {statusBadge(inv.status || "pending")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
