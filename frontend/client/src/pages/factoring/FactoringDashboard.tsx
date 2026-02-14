import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Banknote, DollarSign, Clock, CheckCircle, TrendingUp,
  FileText, AlertTriangle, Users, BarChart3, CreditCard,
  ArrowRight, ShieldCheck, Receipt
} from "lucide-react";

export default function FactoringDashboard() {
  const [, navigate] = useLocation();
  const overviewQuery = (trpc as any).factoring.getOverview.useQuery();
  const summaryQuery = (trpc as any).factoring.getSummary.useQuery();
  const ratesQuery = (trpc as any).factoring.getRates.useQuery();

  const overview = overviewQuery.data;
  const summary = summaryQuery.data;
  const rates = ratesQuery.data;
  const isLoading = overviewQuery.isLoading || summaryQuery.isLoading;

  const statCards = [
    { label: "Total Funded", value: `$${(summary?.totalFunded || 0).toLocaleString()}`, icon: DollarSign, color: "from-green-500 to-emerald-600" },
    { label: "Pending Invoices", value: String(summary?.pending || 0), icon: Clock, color: "from-yellow-500 to-orange-500" },
    { label: "Available Credit", value: `$${(summary?.availableCredit || 0).toLocaleString()}`, icon: CreditCard, color: "from-blue-500 to-indigo-600" },
    { label: "Invoices Factored", value: String(summary?.invoicesFactored || 0), icon: Receipt, color: "from-purple-500 to-pink-600" },
  ];

  const navItems = [
    { label: "Pending Invoices", desc: "Review and approve invoices", icon: FileText, path: "/factoring/invoices", count: summary?.pending || 0 },
    { label: "Catalyst Portfolio", desc: "Manage catalyst accounts", icon: Users, path: "/factoring/catalysts" },
    { label: "Collections", desc: "Outstanding collections", icon: Banknote, path: "/factoring/collections" },
    { label: "Daily Funding", desc: "Today's funding queue", icon: DollarSign, path: "/factoring/funding" },
    { label: "Risk Assessment", desc: "Credit risk analysis", icon: ShieldCheck, path: "/factoring/risk" },
    { label: "Aging Report", desc: "Invoice aging breakdown", icon: BarChart3, path: "/factoring/aging" },
    { label: "Chargebacks", desc: "Manage chargebacks", icon: AlertTriangle, path: "/factoring/chargebacks" },
    { label: "Debtor Management", desc: "Manage debtors", icon: Users, path: "/factoring/debtors" },
    { label: "Reports", desc: "Generate factoring reports", icon: TrendingUp, path: "/factoring/reports" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Factoring Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Invoice factoring management and funding overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Account Status */}
      {overview && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={overview.account?.status === "active" ? "bg-green-500/20 text-green-400 border-0" : "bg-yellow-500/20 text-yellow-400 border-0"}>
                  {overview.account?.status || "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="font-semibold">${(overview.account?.creditLimit || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Factoring Rate</p>
                <p className="font-semibold">{((rates?.currentRate || 0.025) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Advance Rate</p>
                <p className="font-semibold">{((rates?.advanceRate || 0.95) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item) => (
          <Card
            key={item.path}
            className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-[#1473FF]/50 transition-all cursor-pointer group"
            onClick={() => navigate(item.path)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#1473FF]" />
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {item.label}
                    {item.count ? <Badge variant="secondary" className="text-xs">{item.count}</Badge> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1473FF] transition-colors" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
