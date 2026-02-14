import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Clock } from "lucide-react";

export default function FactoringAging() {
  const reportsQuery = (trpc as any).factoring.getReports.useQuery({ period: "month" });
  const report = reportsQuery.data;

  const buckets = [
    { label: "0-30 Days", color: "from-green-500 to-emerald-600", amount: 0 },
    { label: "31-60 Days", color: "from-yellow-500 to-orange-500", amount: 0 },
    { label: "61-90 Days", color: "from-orange-500 to-red-500", amount: 0 },
    { label: "90+ Days", color: "from-red-500 to-red-700", amount: 0 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Aging Report
        </h1>
        <p className="text-muted-foreground mt-1">Invoice aging breakdown by time period</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map((bucket) => (
          <Card key={bucket.label} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bucket.color} flex items-center justify-center`}>
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{bucket.label}</p>
                  <p className="text-xl font-bold">${bucket.amount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No aging data available</p>
          <p className="text-sm text-muted-foreground">Invoice aging data will populate as invoices are factored</p>
        </CardContent>
      </Card>
    </div>
  );
}
