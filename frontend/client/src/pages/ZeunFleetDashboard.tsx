/**
 * ZEUN Fleet Dashboard - Carrier breakdown and maintenance overview
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Wrench, AlertTriangle, Truck, TrendingUp, DollarSign,
  Clock, CheckCircle, RefreshCw, Search, Download, BarChart3,
  Activity, Calendar
} from "lucide-react";

export default function ZeunFleetDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "RESOLVED" | "ALL">("ALL");

  const { data: breakdowns, isLoading: breakdownsLoading, refetch } = (trpc as any).zeunMechanics.getFleetBreakdowns.useQuery({
    status: statusFilter,
    limit: 50,
  });

  const { data: costAnalytics, isLoading: costLoading } = (trpc as any).zeunMechanics.getFleetCostAnalytics.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const openBreakdowns = breakdowns?.filter((b: any) => !["RESOLVED", "CANCELLED"].includes(b.status)) || [];
  const resolvedBreakdowns = breakdowns?.filter((b: any) => b.status === "RESOLVED") || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "destructive";
      case "HIGH": return "default";
      case "MEDIUM": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RESOLVED": return "bg-green-100 text-green-800";
      case "UNDER_REPAIR": return "bg-blue-100 text-blue-800";
      case "WAITING_PARTS": return "bg-yellow-100 text-yellow-800";
      case "REPORTED":
      case "DIAGNOSED": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            ZEUN Fleet Dashboard
          </h1>
          <p className="text-muted-foreground">Fleet breakdown and maintenance management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Breakdowns</p>
                {breakdownsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-orange-600">{openBreakdowns.length}</p>
                )}
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved This Month</p>
                {breakdownsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold text-green-600">{resolvedBreakdowns.length}</p>
                )}
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Repair Cost</p>
                {costLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-3xl font-bold">${costAnalytics?.totalCost?.toLocaleString() || 0}</p>
                )}
              </div>
              <DollarSign className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Breakdown Count</p>
                {costLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{costAnalytics?.breakdownCount || 0}</p>
                )}
              </div>
              <Activity className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e: any) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e: any) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <div className="flex gap-2">
                {(["ALL", "OPEN", "RESOLVED"] as const).map((status: any) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost by Category */}
      {costAnalytics?.byCategory && Object.keys(costAnalytics.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cost by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(costAnalytics.byCategory)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([category, cost]) => {
                  const percentage = costAnalytics.totalCost ? ((cost as number) / costAnalytics.totalCost) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category.replace(/_/g, " ")}</span>
                        <span className="font-medium">${(cost as number).toLocaleString()} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Breakdowns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Active Breakdowns
          </CardTitle>
          <CardDescription>Breakdowns requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {breakdownsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : openBreakdowns.length > 0 ? (
            <div className="space-y-3">
              {openBreakdowns.map((breakdown: any) => (
                <div key={breakdown.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">#{breakdown.id}</span>
                        <Badge variant={getSeverityColor(breakdown.severity)}>{breakdown.severity}</Badge>
                        <Badge className={getStatusColor(breakdown.status)}>{breakdown.status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="font-medium">{breakdown.issueCategory.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground">
                        Driver: {breakdown.driverName || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {breakdown.createdAt ? new Date(breakdown.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                      {breakdown.actualCost && (
                        <div className="font-medium text-foreground mt-1">
                          ${breakdown.actualCost.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-muted-foreground">No active breakdowns</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Resolved */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recently Resolved
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdownsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : resolvedBreakdowns.length > 0 ? (
            <div className="space-y-2">
              {resolvedBreakdowns.slice(0, 5).map((breakdown: any) => (
                <div key={breakdown.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{breakdown.issueCategory.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">{breakdown.driverName || "Unknown Driver"}</p>
                  </div>
                  <div className="text-right">
                    {breakdown.actualCost ? (
                      <p className="font-bold">${breakdown.actualCost.toLocaleString()}</p>
                    ) : (
                      <p className="text-muted-foreground">No cost recorded</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {breakdown.createdAt ? new Date(breakdown.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">No resolved breakdowns in this period</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
