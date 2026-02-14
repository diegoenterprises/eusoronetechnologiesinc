import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp } from "lucide-react";

export default function FactoringFunding() {
  const summaryQuery = (trpc as any).factoring.getSummary.useQuery();
  const summary = summaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Daily Funding
        </h1>
        <p className="text-muted-foreground mt-1">Today's funding queue and processing summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Funded Today</p>
              <p className="text-2xl font-bold">${(summary?.totalFunded || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1473FF]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
              <p className="text-2xl font-bold">${(summary?.pendingPayments || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No invoices in funding queue</p>
          <p className="text-sm text-muted-foreground">Approved invoices ready for funding will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
