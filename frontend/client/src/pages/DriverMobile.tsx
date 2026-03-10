/**
 * DRIVER MOBILE PAGE
 * Comprehensive driver mobile experience — dashboard, trip planner, expenses,
 * nearby services, truck parking, pay calculator, document wallet, HOS status,
 * quick actions, and more.
 *
 * 100% Dynamic — all data from tRPC procedures
 * Dark theme with blue/cyan driver-focused accents
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Truck, MapPin, DollarSign, Clock, Fuel, AlertTriangle,
  Receipt, Wrench, ParkingCircle, Scale, FileText, Phone,
  Calendar, Bell, Trophy, CreditCard, Shield, Navigation,
  ChevronRight, CheckCircle2, XCircle, Timer, Activity,
  Wallet, Star, TrendingUp, Package, CloudSun, Map,
  ClipboardCheck, MessageSquare, Send, Camera, Upload,
  Heart, Zap, CircleDot,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "in_transit": case "driving": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "delivered": case "reimbursed": case "approved": case "valid": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "dispatched": case "booked": case "pending": case "pending_review": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "at_pickup": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "rejected": case "expired": case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "expiring_soon": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

// ── Sub-components ─────────────────────────────────────────────────

function LoadingCards({ count = 3 }: { count?: number }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className={cn("h-5 w-3/4", isLight ? "bg-slate-200" : "bg-slate-700")} />
            <Skeleton className={cn("h-4 w-1/2", isLight ? "bg-slate-200" : "bg-slate-700")} />
            <Skeleton className={cn("h-4 w-2/3", isLight ? "bg-slate-200" : "bg-slate-700")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── HOS Status Bar ─────────────────────────────────────────────────

function HOSStatusBar() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const hosQuery = (trpc as any).driverMobile.getDriverHosStatus.useQuery({});

  if (hosQuery.isLoading) {
    return <Skeleton className={cn("h-16 w-full rounded-xl", isLight ? "bg-slate-100" : "bg-slate-800")} />;
  }

  const hos = hosQuery.data;
  if (!hos) return null;

  const drivePercent = Math.max(0, (hos.driveTimeRemaining / 660) * 100);
  const dutyPercent = Math.max(0, (hos.dutyTimeRemaining / 840) * 100);

  return (
    <Card className="bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border-cyan-500/20">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">HOS Status</span>
          </div>
          <Badge className={cn("text-xs", getStatusColor(hos.currentDutyStatus))}>
            {hos.currentDutyStatus.replace(/_/g, " ").toUpperCase()}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Drive</div>
            <Progress value={drivePercent} className="h-2 bg-slate-700" />
            <div className="text-xs text-cyan-300 mt-0.5">{formatMinutes(hos.driveTimeRemaining)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Duty</div>
            <Progress value={dutyPercent} className="h-2 bg-slate-700" />
            <div className="text-xs text-cyan-300 mt-0.5">{formatMinutes(hos.dutyTimeRemaining)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Cycle</div>
            <Progress value={(hos.cycleTimeRemaining / 4200) * 100} className="h-2 bg-slate-700" />
            <div className="text-xs text-cyan-300 mt-0.5">{formatMinutes(hos.cycleTimeRemaining)}</div>
          </div>
        </div>
        {hos.breakRequired && (
          <div className="mt-2 flex items-center gap-1 text-amber-400 text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>30-minute break required</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Quick Action Buttons ───────────────────────────────────────────

function QuickActionsGrid() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const qaQuery = (trpc as any).driverMobile.getQuickActions.useQuery();

  if (qaQuery.isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={cn("h-20 rounded-xl", isLight ? "bg-slate-100" : "bg-slate-800")} />
        ))}
      </div>
    );
  }

  const iconMap: Record<string, React.ReactNode> = {
    "alert-triangle": <AlertTriangle className="w-5 h-5" />,
    "calendar-off": <Calendar className="w-5 h-5" />,
    "phone": <Phone className="w-5 h-5" />,
    "wrench": <Wrench className="w-5 h-5" />,
    "parking-circle": <ParkingCircle className="w-5 h-5" />,
    "receipt": <Receipt className="w-5 h-5" />,
    "clipboard-check": <ClipboardCheck className="w-5 h-5" />,
    "file-text": <FileText className="w-5 h-5" />,
    "credit-card": <CreditCard className="w-5 h-5" />,
    "cloud-sun": <CloudSun className="w-5 h-5" />,
    "map": <Map className="w-5 h-5" />,
    "folder": <FileText className="w-5 h-5" />,
  };

  const actions = qaQuery.data?.actions || [];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.slice(0, 8).map((action: any) => (
        <button
          key={action.id}
          className={cn("flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all", isLight ? "bg-white border-slate-200 hover:border-cyan-400 hover:bg-slate-50 shadow-sm" : "bg-slate-800/60 border-slate-700/40 hover:border-cyan-500/40 hover:bg-slate-800")}
        >
          <div style={{ color: action.color }}>{iconMap[action.icon] || <Zap className="w-5 h-5" />}</div>
          <span className="text-[11px] text-slate-300 text-center leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────

function DashboardTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const dashQuery = (trpc as any).driverMobile.getDriverHomeDashboard.useQuery({});

  if (dashQuery.isLoading) return <LoadingCards count={4} />;

  const data = dashQuery.data;
  if (!data) return <div className="text-slate-400 text-center py-8">Unable to load dashboard</div>;

  return (
    <div className="space-y-4">
      {/* HOS Status */}
      <HOSStatusBar />

      {/* Current Load Card */}
      {data.currentLoad ? (
        <Card className={cn(isLight ? "bg-white border-cyan-200 shadow-md" : "bg-slate-900/60 border-cyan-500/20 shadow-lg shadow-cyan-500/5")}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-cyan-400 flex items-center gap-2">
                <Truck className="w-5 h-5" /> Current Load
              </CardTitle>
              <Badge className={cn("text-xs", getStatusColor(data.currentLoad.status))}>
                {data.currentLoad.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-slate-400">{data.currentLoad.referenceNumber}</div>
            <div className="flex items-center gap-2 text-sm">
              <CircleDot className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-slate-200">{data.currentLoad.origin}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-slate-200">{data.currentLoad.destination}</span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-400">
              <span>{data.currentLoad.distance} mi</span>
              <span>{formatCurrency(data.currentLoad.rate)}</span>
              {data.currentLoad.commodity && <span>{data.currentLoad.commodity}</span>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardContent className="py-6 text-center text-slate-400">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No active load</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Today", value: formatCurrency(data.earningsToday), icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-400" },
          { label: "This Week", value: formatCurrency(data.earningsWeek), icon: <TrendingUp className="w-4 h-4" />, color: "text-cyan-400" },
          { label: "On-Time", value: `${data.quickStats.onTimePercentage}%`, icon: <Clock className="w-4 h-4" />, color: "text-blue-400" },
          { label: "Safety", value: `${data.quickStats.safetyScore}`, icon: <Shield className="w-4 h-4" />, color: "text-emerald-400" },
        ].map((stat, i) => (
          <Card key={i} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/40")}>
            <CardContent className="p-2 text-center">
              <div className={cn("mx-auto mb-1", stat.color)}>{stat.icon}</div>
              <div className="text-sm font-bold text-slate-100">{stat.value}</div>
              <div className="text-[10px] text-slate-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Quick Actions</h3>
        <QuickActionsGrid />
      </div>

      {/* Next Assignment */}
      {data.nextAssignment && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" /> Next Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="text-slate-400 text-xs">{data.nextAssignment.referenceNumber}</div>
            <div className="text-slate-200">{data.nextAssignment.origin} → {data.nextAssignment.destination}</div>
            <div className="text-xs text-slate-400">{formatCurrency(data.nextAssignment.rate)}</div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" /> Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg text-xs",
                  alert.severity === "warning" ? "bg-amber-500/10 border border-amber-500/20" : "bg-cyan-500/10 border border-cyan-500/20",
                )}
              >
                <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", alert.severity === "warning" ? "text-amber-400" : "text-cyan-400")} />
                <span className="text-slate-300">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Trip Planner Tab ───────────────────────────────────────────────

function TripPlannerTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [originLat, setOriginLat] = useState("35.222");
  const [originLng, setOriginLng] = useState("-101.831");
  const [destLat, setDestLat] = useState("29.511");
  const [destLng, setDestLng] = useState("-98.357");
  const [searched, setSearched] = useState(false);

  const tripQuery = (trpc as any).driverMobile.getTripPlanner.useQuery(
    {
      origin: { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
      includeStops: true,
    },
    { enabled: searched },
  );

  return (
    <div className="space-y-4">
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-cyan-400 flex items-center gap-2">
            <Navigation className="w-5 h-5" /> Trip Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Origin Lat"
              value={originLat}
              onChange={(e) => setOriginLat(e.target.value)}
              className={cn("text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}
            />
            <Input
              placeholder="Origin Lng"
              value={originLng}
              onChange={(e) => setOriginLng(e.target.value)}
              className={cn("text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}
            />
            <Input
              placeholder="Dest Lat"
              value={destLat}
              onChange={(e) => setDestLat(e.target.value)}
              className={cn("text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}
            />
            <Input
              placeholder="Dest Lng"
              value={destLng}
              onChange={(e) => setDestLng(e.target.value)}
              className={cn("text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}
            />
          </div>
          <Button
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={() => setSearched(true)}
          >
            Plan Trip
          </Button>
        </CardContent>
      </Card>

      {tripQuery.isLoading && <LoadingCards count={2} />}

      {tripQuery.data && (
        <>
          {/* Trip Summary */}
          <Card className={cn(isLight ? "bg-white border-cyan-200 shadow-sm" : "bg-slate-900/60 border-cyan-500/20")}>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">Trip Summary</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-100">{tripQuery.data.summary.totalDistance}</div>
                  <div className="text-[10px] text-slate-400">Miles</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-100">{formatMinutes(tripQuery.data.summary.estimatedDriveTime)}</div>
                  <div className="text-[10px] text-slate-400">Drive Time</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-100">{formatCurrency(tripQuery.data.summary.estimatedFuelCost)}</div>
                  <div className="text-[10px] text-slate-400">Est. Fuel</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fuel Stops */}
          {tripQuery.data.fuelStops.length > 0 && (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-400" /> Fuel Stops ({tripQuery.data.fuelStops.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tripQuery.data.fuelStops.map((stop: any) => (
                  <div key={stop.stopNumber} className={cn("flex items-center justify-between p-2 rounded-lg text-sm", isLight ? "bg-slate-50" : "bg-slate-800/40")}>
                    <div>
                      <div className="text-slate-200">{stop.name}</div>
                      <div className="text-xs text-slate-400">Mile {stop.estimatedMile}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Weigh Stations */}
          {tripQuery.data.weighStations.length > 0 && (
            <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" /> Weigh Stations ({tripQuery.data.weighStations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tripQuery.data.weighStations.map((ws: any) => (
                  <div key={ws.id} className={cn("flex items-center justify-between p-2 rounded-lg text-sm", isLight ? "bg-slate-50" : "bg-slate-800/40")}>
                    <div>
                      <div className="text-slate-200">{ws.name}</div>
                      <div className="text-xs text-slate-400">{ws.highway} {ws.direction}</div>
                    </div>
                    <Badge className={cn("text-xs", ws.status === "open" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400")}>
                      {ws.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── Expenses Tab ───────────────────────────────────────────────────

function ExpensesTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const trackerQuery = (trpc as any).driverMobile.getExpenseTracker.useQuery({ period: "month" });
  const historyQuery = (trpc as any).driverMobile.getExpenseHistory.useQuery({ page: 1, limit: 10 });

  if (trackerQuery.isLoading) return <LoadingCards count={3} />;

  const tracker = trackerQuery.data;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {tracker && (
        <div className="grid grid-cols-2 gap-2">
          <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
            <CardContent className="p-3 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              <div className="text-lg font-bold text-slate-100">{formatCurrency(tracker.totalSpent)}</div>
              <div className="text-[10px] text-slate-400">Total Spent</div>
            </CardContent>
          </Card>
          <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
            <CardContent className="p-3 text-center">
              <Wallet className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
              <div className="text-lg font-bold text-slate-100">{formatCurrency(tracker.totalReimbursed)}</div>
              <div className="text-[10px] text-slate-400">Reimbursed</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Progress */}
      {tracker && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardContent className="p-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Monthly Budget</span>
              <span>{formatCurrency(tracker.budgetUsed)} / {formatCurrency(tracker.budgetLimit)}</span>
            </div>
            <Progress value={(tracker.budgetUsed / tracker.budgetLimit) * 100} className="h-2 bg-slate-700" />
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {tracker && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tracker.categories.map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-slate-300 capitalize">{cat.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-200">{formatCurrency(cat.amount)}</span>
                  <span className="text-xs text-slate-500 ml-2">({cat.count})</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {historyQuery.data && (
        <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-400" /> Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {historyQuery.data.expenses.map((exp: any) => (
              <div key={exp.id} className={cn("flex items-center justify-between p-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-800/40")}>
                <div>
                  <div className="text-sm text-slate-200">{exp.vendor}</div>
                  <div className="text-xs text-slate-400">{exp.date} &middot; {exp.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-200">{formatCurrency(exp.amount)}</div>
                  <Badge className={cn("text-[10px]", getStatusColor(exp.status))}>{exp.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scan Receipt Button */}
      <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2">
        <Camera className="w-4 h-4" /> Scan Receipt
      </Button>
    </div>
  );
}

// ── Services Tab (Nearby Services, Truck Stops, Parking) ───────────

function ServicesTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [serviceView, setServiceView] = useState<"nearby" | "stops" | "parking">("nearby");

  const nearbyQuery = (trpc as any).driverMobile.getNearbyServices.useQuery({
    location: { lat: 35.222, lng: -101.831 },
    radius: 50,
  });

  const stopsQuery = (trpc as any).driverMobile.getTruckStopFinder.useQuery({
    location: { lat: 35.222, lng: -101.831 },
    radius: 75,
  });

  const parkingQuery = (trpc as any).driverMobile.getTruckParking.useQuery({
    location: { lat: 35.222, lng: -101.831 },
    radius: 50,
  });

  const serviceTypeIcon: Record<string, React.ReactNode> = {
    fuel: <Fuel className="w-4 h-4 text-amber-400" />,
    food: <Heart className="w-4 h-4 text-red-400" />,
    repair: <Wrench className="w-4 h-4 text-orange-400" />,
    hospital: <Activity className="w-4 h-4 text-red-400" />,
    atm: <CreditCard className="w-4 h-4 text-green-400" />,
    laundry: <Star className="w-4 h-4 text-purple-400" />,
    rest_area: <ParkingCircle className="w-4 h-4 text-blue-400" />,
  };

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className={cn("flex gap-1 rounded-lg p-1", isLight ? "bg-white border border-slate-200 shadow-sm" : "bg-slate-800/60")}>
        {[
          { key: "nearby", label: "Nearby", icon: <MapPin className="w-3.5 h-3.5" /> },
          { key: "stops", label: "Truck Stops", icon: <Fuel className="w-3.5 h-3.5" /> },
          { key: "parking", label: "Parking", icon: <ParkingCircle className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setServiceView(tab.key as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all",
              serviceView === tab.key
                ? "bg-cyan-600 text-white"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Nearby Services */}
      {serviceView === "nearby" && (
        <>
          {nearbyQuery.isLoading ? (
            <LoadingCards count={3} />
          ) : (
            <div className="space-y-2">
              {(nearbyQuery.data?.services || []).map((svc: any) => (
                <Card key={svc.id} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {serviceTypeIcon[svc.type] || <MapPin className="w-4 h-4 text-slate-400" />}
                      <div>
                        <div className="text-sm text-slate-200">{svc.name}</div>
                        <div className="text-xs text-slate-400">{svc.address}</div>
                        <div className="flex gap-1 mt-1">
                          {svc.amenities.slice(0, 4).map((a: string) => (
                            <Badge key={a} variant="outline" className="text-[9px] py-0 px-1 border-slate-600 text-slate-400">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-cyan-400">{svc.distance} mi</div>
                      <div className="text-xs text-slate-400">{svc.rating} &#9733;</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Truck Stops */}
      {serviceView === "stops" && (
        <>
          {stopsQuery.isLoading ? (
            <LoadingCards count={3} />
          ) : (
            <div className="space-y-2">
              {(stopsQuery.data?.truckStops || []).map((stop: any) => (
                <Card key={stop.id} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-slate-200">{stop.name}</div>
                        <div className="text-xs text-slate-400">{stop.address}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-cyan-400">{stop.distance} mi</div>
                        <div className="text-xs text-amber-400">${stop.dieselPrice}/gal</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[9px] py-0 border-slate-600 text-slate-400">
                        {stop.availableParking} spots
                      </Badge>
                      {stop.amenities.slice(0, 5).map((a: string) => (
                        <Badge key={a} variant="outline" className="text-[9px] py-0 border-slate-600 text-slate-400">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Truck Parking */}
      {serviceView === "parking" && (
        <>
          {parkingQuery.isLoading ? (
            <LoadingCards count={3} />
          ) : (
            <div className="space-y-2">
              {(parkingQuery.data?.locations || []).map((loc: any) => (
                <Card key={loc.id} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm text-slate-200">{loc.name}</div>
                        <div className="text-xs text-slate-400">{loc.distance} mi away</div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-bold",
                          loc.statusColor === "green" ? "text-emerald-400" : loc.statusColor === "yellow" ? "text-amber-400" : "text-red-400",
                        )}>
                          {loc.availableSpaces}
                        </div>
                        <div className="text-[10px] text-slate-400">of {loc.totalSpaces} spots</div>
                      </div>
                    </div>
                    <Progress
                      value={loc.availabilityPercentage}
                      className="h-1.5 bg-slate-700 mb-2"
                    />
                    <div className="flex items-center gap-2 text-xs">
                      {loc.pricePerNight > 0 && (
                        <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                          ${loc.pricePerNight}/night
                        </Badge>
                      )}
                      {loc.pricePerNight === 0 && (
                        <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Free
                        </Badge>
                      )}
                      {loc.reservable && (
                        <Badge className="text-[9px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Reservable
                        </Badge>
                      )}
                      {loc.security.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[9px] py-0 border-slate-600 text-slate-400">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Pay Calculator Tab ─────────────────────────────────────────────

function PayTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [period, setPeriod] = useState("this_week");
  const payQuery = (trpc as any).driverMobile.getDriverPay.useQuery({ period });

  if (payQuery.isLoading) return <LoadingCards count={3} />;

  const pay = payQuery.data;
  if (!pay) return null;

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <Select value={period} onValueChange={setPeriod}>
        <SelectTrigger className={cn(isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current_trip">Current Trip</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this_week">This Week</SelectItem>
          <SelectItem value="last_week">Last Week</SelectItem>
          <SelectItem value="this_month">This Month</SelectItem>
        </SelectContent>
      </Select>

      {/* Net Pay Card */}
      <Card className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/20">
        <CardContent className="p-4 text-center">
          <div className="text-sm text-cyan-300 mb-1">Net Pay</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(pay.netPay)}</div>
          <div className="text-xs text-slate-400 mt-1">Gross: {formatCurrency(pay.grossPay)}</div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300">Pay Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Mileage ({pay.breakdown.miles.quantity} mi @ ${pay.breakdown.miles.rate}/mi)</span>
            <span className="text-emerald-400">{formatCurrency(pay.breakdown.miles.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Stop Pay ({pay.breakdown.stops.quantity} stops @ ${pay.breakdown.stops.rate})</span>
            <span className="text-emerald-400">{formatCurrency(pay.breakdown.stops.total)}</span>
          </div>
          {pay.breakdown.detention.total > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Detention ({pay.breakdown.detention.hours}h)</span>
              <span className="text-emerald-400">{formatCurrency(pay.breakdown.detention.total)}</span>
            </div>
          )}
          {pay.breakdown.bonuses.total > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Bonuses</span>
              <span className="text-emerald-400">{formatCurrency(pay.breakdown.bonuses.total)}</span>
            </div>
          )}
          <div className="border-t border-slate-700/50 pt-2">
            {pay.breakdown.deductions.items.map((ded: any) => (
              <div key={ded.name} className="flex justify-between text-sm">
                <span className="text-slate-400">{ded.name}</span>
                <span className="text-red-400">-{formatCurrency(ded.amount)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* YTD Summary */}
      <Card className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300">Year to Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-100">{formatCurrency(pay.ytd.grossPay)}</div>
              <div className="text-[10px] text-slate-400">Gross Pay</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-100">{pay.ytd.totalMiles.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">Miles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-100">{formatCurrency(pay.ytd.netPay)}</div>
              <div className="text-[10px] text-slate-400">Net Pay</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-100">{pay.ytd.totalLoads}</div>
              <div className="text-[10px] text-slate-400">Loads</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Documents Tab ──────────────────────────────────────────────────

function DocumentsTab() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const docsQuery = (trpc as any).driverMobile.getDriverDocuments.useQuery({});

  if (docsQuery.isLoading) return <LoadingCards count={4} />;

  const data = docsQuery.data;
  if (!data) return null;

  const docIcon: Record<string, React.ReactNode> = {
    cdl: <FileText className="w-5 h-5 text-cyan-400" />,
    medical_card: <Heart className="w-5 h-5 text-red-400" />,
    vehicle_registration: <Truck className="w-5 h-5 text-blue-400" />,
    insurance: <Shield className="w-5 h-5 text-emerald-400" />,
    permit: <FileText className="w-5 h-5 text-amber-400" />,
    certification: <Star className="w-5 h-5 text-purple-400" />,
  };

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {(data.expiringWithin30Days > 0 || data.expired > 0) && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-sm text-amber-300">
              {data.expired > 0 && <div>{data.expired} document(s) expired</div>}
              {data.expiringWithin30Days > 0 && <div>{data.expiringWithin30Days} expiring within 30 days</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Cards */}
      {data.documents.map((doc: any) => (
        <Card key={doc.id} className={cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900/60 border-slate-700/50")}>
          <CardContent className="p-3 flex items-center gap-3">
            {docIcon[doc.type] || <FileText className="w-5 h-5 text-slate-400" />}
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-200">{doc.title}</div>
              {doc.number && <div className="text-xs text-slate-400">{doc.number} {doc.state && `(${doc.state})`}</div>}
              {doc.expirationDate && (
                <div className="text-xs text-slate-400">Expires: {doc.expirationDate}</div>
              )}
              {doc.endorsements && (
                <div className="flex gap-1 mt-1">
                  {doc.endorsements.map((e: string) => (
                    <Badge key={e} variant="outline" className="text-[9px] py-0 px-1 border-cyan-500/30 text-cyan-400">
                      {e}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Badge className={cn("text-xs", getStatusColor(doc.status))}>
              {doc.status.replace(/_/g, " ")}
            </Badge>
          </CardContent>
        </Card>
      ))}

      {/* Upload Button */}
      <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2">
        <Upload className="w-4 h-4" /> Upload Document
      </Button>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────

export default function DriverMobile() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <div className={cn("p-4 md:p-6 max-w-2xl mx-auto space-y-4", isLight ? "min-h-screen bg-slate-50 text-slate-900" : "")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Driver Hub
          </h1>
          <p className={cn("text-sm mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>Your mobile command center</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className={cn("w-full h-auto flex-wrap border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/40")}>
          <TabsTrigger value="dashboard" className="flex-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Truck className="w-3.5 h-3.5 mr-1" /> Home
          </TabsTrigger>
          <TabsTrigger value="trip" className="flex-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Navigation className="w-3.5 h-3.5 mr-1" /> Trip
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Receipt className="w-3.5 h-3.5 mr-1" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="services" className="flex-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <MapPin className="w-3.5 h-3.5 mr-1" /> Services
          </TabsTrigger>
          <TabsTrigger value="pay" className="flex-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <DollarSign className="w-3.5 h-3.5 mr-1" /> Pay
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex-1 text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <FileText className="w-3.5 h-3.5 mr-1" /> Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="trip"><TripPlannerTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="services"><ServicesTab /></TabsContent>
        <TabsContent value="pay"><PayTab /></TabsContent>
        <TabsContent value="docs"><DocumentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
