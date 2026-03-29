/**
 * RAIL SHIPPER DASHBOARD — Rail Freight Command Center
 * A rail shipper ships goods by rail — they see their shipments, track cars,
 * manage costs, compare rates, use templates, and monitor financials.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Package,
  Train,
  DollarSign,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  BarChart3,
  FileText,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Activity,
  Bookmark,
  Copy,
  Globe,
  Gauge,
  Truck,
  Building2,
  Receipt,
  CalendarDays,
  Layers,
  Eye,
  Star,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface RateComparison {
  railroad: string;
  ratePerCar: number;
  transitDays: number;
  onTimeRate: number;
  surcharges: number;
  totalEstimate: number;
  region: string;
}

interface ShipmentTemplate {
  id: string;
  name: string;
  originYard: string;
  destYard: string;
  commodity: string;
  carType: string;
  carCount: number;
  railroad: string;
  lastUsed: string;
  timesUsed: number;
}

interface FinancialSummary {
  railroad: string;
  linehaul: number;
  demurrage: number;
  accessorials: number;
  total: number;
  pendingSettlement: number;
}

interface RecentEvent {
  id: string;
  shipmentNumber: string;
  eventType: string;
  description: string;
  timestamp: string;
  location?: string;
}

/* ------------------------------------------------------------------ */
/*  Status color map                                                   */
/* ------------------------------------------------------------------ */
const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-500/20 text-yellow-400",
  car_ordered: "bg-blue-500/20 text-blue-400",
  car_placed: "bg-indigo-500/20 text-indigo-400",
  loading: "bg-purple-500/20 text-purple-400",
  loaded: "bg-violet-500/20 text-violet-400",
  in_transit: "bg-emerald-500/20 text-emerald-400",
  at_interchange: "bg-teal-500/20 text-teal-400",
  in_yard: "bg-cyan-500/20 text-cyan-400",
  spotted: "bg-sky-500/20 text-sky-400",
  unloading: "bg-orange-500/20 text-orange-400",
  empty_released: "bg-lime-500/20 text-lime-400",
  delivered: "bg-green-500/20 text-green-400",
  settled: "bg-green-600/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-400",
};

/* ------------------------------------------------------------------ */
/*  Empty data arrays (populated by tRPC queries when endpoints exist) */
/* ------------------------------------------------------------------ */
const EMPTY_RATES: RateComparison[] = [];

const EMPTY_TEMPLATES: ShipmentTemplate[] = [];

const EMPTY_FINANCIALS: FinancialSummary[] = [];

const EMPTY_EVENTS: RecentEvent[] = [];

const EMPTY_CAR_POSITIONS: { id: number; shipmentNumber: string; railcarNumber: string; lat: number; lng: number; commodity: string; status: string; destination: string }[] = [];

/* ------------------------------------------------------------------ */
/*  Helper: KPI Card                                                   */
/* ------------------------------------------------------------------ */
function KpiCard({ icon, label, value, subtitle, trend, isLight, accent = "blue" }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  isLight: boolean;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
    cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
    amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
    emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
    purple: isLight ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400",
    red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
  };
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:scale-[1.02]",
      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg w-fit", accentMap[accent])}>{icon}</div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trend.positive ? "text-emerald-500" : "text-red-500")}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{value}</div>
      <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{label}</div>
      {subtitle && <div className={cn("text-xs mt-0.5 font-medium", isLight ? "text-slate-400" : "text-slate-500")}>{subtitle}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Skeleton rows                                              */
/* ------------------------------------------------------------------ */
function SkeletonRows({ rows = 4, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Event icon                                                 */
/* ------------------------------------------------------------------ */
function EventIcon({ type, isLight }: { type: string; isLight: boolean }) {
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    in_transit: { icon: <Train className="w-4 h-4" />, color: "text-emerald-400" },
    spotted: { icon: <MapPin className="w-4 h-4" />, color: "text-sky-400" },
    at_interchange: { icon: <ArrowRight className="w-4 h-4" />, color: "text-teal-400" },
    delivered: { icon: <CheckCircle className="w-4 h-4" />, color: "text-green-400" },
    loading: { icon: <Package className="w-4 h-4" />, color: "text-purple-400" },
    car_ordered: { icon: <FileText className="w-4 h-4" />, color: "text-blue-400" },
    settled: { icon: <DollarSign className="w-4 h-4" />, color: "text-green-500" },
    demurrage: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400" },
  };
  const config = iconMap[type] || { icon: <Activity className="w-4 h-4" />, color: "text-slate-400" };
  return <div className={cn("p-1.5 rounded-lg", isLight ? "bg-slate-100" : "bg-slate-700/40", config.color)}>{config.icon}</div>;
}

/* ------------------------------------------------------------------ */
/*  Helper: format currency                                            */
/* ------------------------------------------------------------------ */
function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/* ------------------------------------------------------------------ */
/*  SECTION: Active Shipments Table                                    */
/* ------------------------------------------------------------------ */
function ActiveShipmentsSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const [search, setSearch] = useState("");
  const shipmentsQuery = trpc.railShipments.getRailShipments.useQuery({ limit: 20 });
  const shipments = shipmentsQuery.data?.shipments || [];

  const activeStatuses = ["requested", "car_ordered", "car_placed", "loading", "loaded", "in_transit", "at_interchange", "in_yard", "spotted", "unloading"];
  const activeShipments = shipments.filter((s: any) => activeStatuses.includes(s.status));
  const filtered = activeShipments.filter((s: any) =>
    !search || s.shipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.commodity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
            <Train className="w-5 h-5 text-blue-400" /> Active Shipments
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                className={cn("pl-8 h-8 w-48 text-sm", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400")}
                placeholder="Search shipments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Link href="/rail/shipments">
              <Button variant="outline" size="sm" className={cn("h-8", isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50")}>
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {shipmentsQuery.isLoading ? (
          <SkeletonRows rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <div className={cn("grid grid-cols-8 gap-3 px-4 py-2.5 text-xs font-medium border-b", isLight ? "text-slate-500 bg-slate-50 border-slate-200" : "text-slate-400 bg-slate-800/40 border-slate-700/40")}>
              <span>Shipment #</span><span>Origin</span><span>Destination</span><span>Commodity</span><span>Car Count</span><span>Status</span><span>ETA</span><span>Actions</span>
            </div>
            {filtered.length === 0 && (
              <p className={cn("text-sm text-center py-10", muted)}>No active shipments found</p>
            )}
            {filtered.map((s: any) => (
              <Link key={s.id} href={`/rail/shipments/${s.id}`}>
                <div className={cn("grid grid-cols-8 gap-3 px-4 py-3 text-sm cursor-pointer transition-colors border-b last:border-b-0", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/20 border-slate-700/20")}>
                  <span className={cn("font-medium", isLight ? "text-blue-600" : "text-blue-400")}>{s.shipmentNumber}</span>
                  <span className={cn("truncate", isLight ? "text-slate-600" : "text-slate-300")}>{s.originYardId || "---"}</span>
                  <span className={cn("truncate", isLight ? "text-slate-600" : "text-slate-300")}>{s.destinationYardId || "---"}</span>
                  <span className={cn("truncate", isLight ? "text-slate-600" : "text-slate-300")}>{s.commodity || "---"}</span>
                  <span className={cn(isLight ? "text-slate-700" : "text-slate-300")}>{s.numberOfCars || 1}</span>
                  <Badge className={cn("w-fit text-xs", STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400")}>{s.status?.replace(/_/g, " ")}</Badge>
                  <span className={cn("text-xs", muted)}>{s.estimatedArrival ? new Date(s.estimatedArrival).toLocaleDateString() : "TBD"}</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Rate Comparison                                           */
/* ------------------------------------------------------------------ */
function RateComparisonSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [sortBy, setSortBy] = useState<"rate" | "transit" | "ontime">("rate");
  const inputCls = cn("h-9 text-sm", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400");

  const sorted = useMemo(() => {
    const arr = [...EMPTY_RATES];
    if (sortBy === "rate") arr.sort((a, b) => a.totalEstimate - b.totalEstimate);
    else if (sortBy === "transit") arr.sort((a, b) => a.transitDays - b.transitDays);
    else arr.sort((a, b) => b.onTimeRate - a.onTimeRate);
    return arr;
  }, [sortBy]);

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <BarChart3 className="w-5 h-5 text-cyan-400" /> Rate Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Origin Yard</label>
            <Input placeholder="e.g. CHI-Corwith" value={origin} onChange={e => setOrigin(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Destination Yard</label>
            <Input placeholder="e.g. LAX-ICTF" value={dest} onChange={e => setDest(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Sort By</label>
            <select
              className={cn("w-full h-9 rounded-md border text-sm px-3", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white")}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="rate">Lowest Rate</option>
              <option value="transit">Fastest Transit</option>
              <option value="ontime">Best On-Time</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {sorted.length === 0 && (
            <div className={cn("text-center py-8", muted)}>
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No rate data yet</p>
              <p className="text-xs mt-1">Rate comparison data will appear when available</p>
            </div>
          )}
          {sorted.map((r, idx) => (
            <div key={r.railroad} className={cn(
              "rounded-lg border p-3 flex items-center justify-between transition-all",
              idx === 0 ? (isLight ? "border-emerald-300 bg-emerald-50/50" : "border-emerald-500/30 bg-emerald-500/5") :
              (isLight ? "border-slate-200 bg-white hover:bg-slate-50" : "border-slate-700/40 bg-slate-800/30 hover:bg-slate-700/20")
            )}>
              <div className="flex items-center gap-4">
                {idx === 0 && <Star className="w-4 h-4 text-emerald-500" />}
                <div>
                  <div className={cn("font-medium text-sm", text)}>{r.railroad}</div>
                  <div className={cn("text-xs", muted)}>{r.region} region</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className={cn("font-bold", isLight ? "text-slate-900" : "text-white")}>{fmt(r.ratePerCar)}</div>
                  <div className={cn("text-xs", muted)}>per car</div>
                </div>
                <div className="text-center">
                  <div className={cn("font-medium", isLight ? "text-slate-700" : "text-slate-300")}>{r.transitDays}d</div>
                  <div className={cn("text-xs", muted)}>transit</div>
                </div>
                <div className="text-center">
                  <div className={cn("font-medium", r.onTimeRate >= 90 ? "text-emerald-500" : "text-amber-500")}>{r.onTimeRate}%</div>
                  <div className={cn("text-xs", muted)}>on-time</div>
                </div>
                <div className="text-center">
                  <div className={cn("font-bold text-base", isLight ? "text-slate-900" : "text-white")}>{fmt(r.totalEstimate)}</div>
                  <div className={cn("text-xs", muted)}>total est.</div>
                </div>
                <Button size="sm" variant="outline" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Shipment Templates                                        */
/* ------------------------------------------------------------------ */
function TemplatesSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
            <Bookmark className="w-5 h-5 text-amber-400" /> Shipment Templates
          </CardTitle>
          <Button size="sm" variant="outline" className={cn("h-8 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50")}>
            <Bookmark className="w-3.5 h-3.5 mr-1" /> Save New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {EMPTY_TEMPLATES.length === 0 && (
            <div className={cn("col-span-full text-center py-8", muted)}>
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No templates saved yet</p>
              <p className="text-xs mt-1">Save a shipment as a template for quick reuse</p>
            </div>
          )}
          {EMPTY_TEMPLATES.map(t => (
            <div key={t.id} className={cn(
              "rounded-lg border p-3 transition-all hover:scale-[1.01] cursor-pointer",
              isLight ? "bg-white border-slate-200 hover:shadow-md" : "bg-slate-800/40 border-slate-700/40 hover:border-amber-500/30"
            )}>
              <div className="flex items-start justify-between mb-2">
                <div className={cn("font-medium text-sm", text)}>{t.name}</div>
                <Badge className={cn("text-xs", isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/10 text-amber-400 border-amber-500/20")}>
                  {t.timesUsed}x used
                </Badge>
              </div>
              <div className={cn("text-xs space-y-1", muted)}>
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.originYard} <ArrowRight className="w-3 h-3" /> {t.destYard}</div>
                <div className="flex items-center gap-1"><Package className="w-3 h-3" /> {t.commodity} — {t.carCount} {t.carType}s</div>
                <div className="flex items-center gap-1"><Train className="w-3 h-3" /> {t.railroad}</div>
                <div className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Last used: {t.lastUsed}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  <Copy className="w-3 h-3 mr-1" /> Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Financial Summary                                         */
/* ------------------------------------------------------------------ */
function FinancialSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const totalSpend = EMPTY_FINANCIALS.reduce((s, f) => s + f.total, 0);
  const totalDemurrage = EMPTY_FINANCIALS.reduce((s, f) => s + f.demurrage, 0);
  const totalPending = EMPTY_FINANCIALS.reduce((s, f) => s + f.pendingSettlement, 0);

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
            <DollarSign className="w-5 h-5 text-emerald-400" /> Financial Summary
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={cn("text-xs", muted)}>Total Spend (Month)</div>
              <div className={cn("text-lg font-bold", isLight ? "text-slate-900" : "text-white")}>{fmt(totalSpend)}</div>
            </div>
            <div className="text-right">
              <div className={cn("text-xs", muted)}>Demurrage</div>
              <div className="text-lg font-bold text-amber-500">{fmt(totalDemurrage)}</div>
            </div>
            <div className="text-right">
              <div className={cn("text-xs", muted)}>Pending</div>
              <div className="text-lg font-bold text-blue-500">{fmt(totalPending)}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn("grid grid-cols-6 gap-3 px-4 py-2.5 text-xs font-medium border-b", isLight ? "text-slate-500 bg-slate-50 border-slate-200" : "text-slate-400 bg-slate-800/40 border-slate-700/40")}>
          <span>Railroad</span><span className="text-right">Linehaul</span><span className="text-right">Demurrage</span><span className="text-right">Accessorials</span><span className="text-right">Total</span><span className="text-right">Pending Settlement</span>
        </div>
        {EMPTY_FINANCIALS.map(f => (
          <div key={f.railroad} className={cn("grid grid-cols-6 gap-3 px-4 py-3 text-sm border-b last:border-b-0 transition-colors", isLight ? "hover:bg-slate-50 border-slate-100" : "hover:bg-slate-700/20 border-slate-700/20")}>
            <span className={cn("font-medium", text)}>{f.railroad}</span>
            <span className={cn("text-right", isLight ? "text-slate-600" : "text-slate-300")}>{fmt(f.linehaul)}</span>
            <span className={cn("text-right", f.demurrage > 5000 ? "text-amber-500 font-medium" : (isLight ? "text-slate-600" : "text-slate-300"))}>{fmt(f.demurrage)}</span>
            <span className={cn("text-right", isLight ? "text-slate-600" : "text-slate-300")}>{fmt(f.accessorials)}</span>
            <span className={cn("text-right font-bold", isLight ? "text-slate-900" : "text-white")}>{fmt(f.total)}</span>
            <span className={cn("text-right", f.pendingSettlement > 0 ? "text-blue-500" : (isLight ? "text-slate-400" : "text-slate-500"))}>{fmt(f.pendingSettlement)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Tracking Map                                              */
/* ------------------------------------------------------------------ */
function TrackingMapSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const [selectedCar, setSelectedCar] = useState<{ id: number; shipmentNumber: string; railcarNumber: string; lat: number; lng: number; commodity: string; status: string; destination: string } | null>(null);

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
            <Globe className="w-5 h-5 text-teal-400" /> Cars in Transit
          </CardTitle>
          <Link href="/rail/tracking">
            <Button variant="outline" size="sm" className={cn("h-8 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50")}>
              Full Map <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "rounded-xl overflow-hidden border relative",
          isLight ? "border-slate-200 bg-slate-100" : "border-slate-700/40 bg-slate-900"
        )} style={{ height: 320 }}>
          {/* Placeholder map with car positions */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("text-center", muted)}>
              <Globe className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Interactive map — {EMPTY_CAR_POSITIONS.length} cars tracked</p>
              <p className="text-xs mt-1">Open full tracking for live Google Maps view</p>
            </div>
          </div>
          {/* Car position indicators */}
          {EMPTY_CAR_POSITIONS.map(car => {
            const left = ((car.lng + 130) / 70) * 100;
            const top = ((50 - car.lat) / 30) * 100;
            return (
              <button
                key={car.id}
                onClick={() => setSelectedCar(selectedCar?.id === car.id ? null : car)}
                className={cn(
                  "absolute w-3 h-3 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer hover:scale-150 z-10",
                  car.status === "in_transit" ? "bg-emerald-500 border-emerald-300" :
                  car.status === "loading" ? "bg-purple-500 border-purple-300" :
                  car.status === "spotted" ? "bg-sky-500 border-sky-300" :
                  "bg-teal-500 border-teal-300"
                )}
                style={{ left: `${Math.max(5, Math.min(95, left))}%`, top: `${Math.max(5, Math.min(95, top))}%` }}
              />
            );
          })}
          {selectedCar && (
            <div className={cn(
              "absolute bottom-3 left-3 right-3 rounded-lg border p-3 z-20",
              isLight ? "bg-white border-slate-200 shadow-lg" : "bg-slate-800 border-slate-700"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("font-medium text-sm", text)}>{selectedCar.railcarNumber}</div>
                  <div className={cn("text-xs", muted)}>{selectedCar.shipmentNumber} — {selectedCar.commodity}</div>
                </div>
                <div className="text-right">
                  <Badge className={STATUS_COLORS[selectedCar.status] || "bg-slate-500/20 text-slate-400"}>{selectedCar.status.replace(/_/g, " ")}</Badge>
                  <div className={cn("text-xs mt-1", muted)}>Dest: {selectedCar.destination}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Car list below map */}
        <div className="mt-3 space-y-1.5">
          {EMPTY_CAR_POSITIONS.map(car => (
            <div key={car.id} className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
              selectedCar?.id === car.id
                ? (isLight ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/20")
                : (isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")
            )} onClick={() => setSelectedCar(selectedCar?.id === car.id ? null : car)}>
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full",
                  car.status === "in_transit" ? "bg-emerald-500" : car.status === "loading" ? "bg-purple-500" : car.status === "spotted" ? "bg-sky-500" : "bg-teal-500"
                )} />
                <span className={cn("font-medium", text)}>{car.railcarNumber}</span>
                <span className={muted}>{car.commodity}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={cn("text-xs", STATUS_COLORS[car.status] || "bg-slate-500/20 text-slate-400")}>{car.status.replace(/_/g, " ")}</Badge>
                <span className={cn("text-xs", muted)}>{car.destination}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Recent Activity Timeline                                  */
/* ------------------------------------------------------------------ */
function RecentActivitySection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <Activity className="w-5 h-5 text-purple-400" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {EMPTY_EVENTS.length === 0 && (
            <div className={cn("text-center py-8", muted)}>
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Events will appear as shipments progress</p>
            </div>
          )}
          {EMPTY_EVENTS.map((evt, idx) => (
            <div key={evt.id} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <EventIcon type={evt.eventType} isLight={isLight} />
                {idx < EMPTY_EVENTS.length - 1 && (
                  <div className={cn("w-px flex-1 my-1", isLight ? "bg-slate-200" : "bg-slate-700/50")} />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={cn("text-sm font-medium", isLight ? "text-blue-600" : "text-blue-400")}>{evt.shipmentNumber}</span>
                    <span className={cn("text-sm ml-2", text)}>{evt.description}</span>
                  </div>
                  <span className={cn("text-xs whitespace-nowrap", muted)}>
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {evt.location && (
                  <div className={cn("text-xs mt-0.5 flex items-center gap-1", muted)}>
                    <MapPin className="w-3 h-3" /> {evt.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function RailShipperDashboard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  /* tRPC: dashboard stats */
  const statsQuery = (trpc as any).railShipments.getRailDashboardStats.useQuery(undefined, { refetchInterval: 60000 });
  const stats = statsQuery.data || { activeShipments: 0, carsInTransit: 0, avgTransitDays: 0, revenue: 0 };

  /* Shared style tokens */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  /* Computed KPIs */
  const totalMonthlySpend = EMPTY_FINANCIALS.reduce((s, f) => s + f.total, 0);
  const onTimeRate = 91; // calculated from aggregated data

  return (
    <div className={cn("min-h-screen p-6 space-y-6", bg)}>
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-blue-50" : "bg-blue-500/10")}>
            <Package className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Rail Freight Dashboard</h1>
            <p className={cn("text-sm", muted)}>Ship by rail — track, manage, and optimize your freight</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { await statsQuery.refetch(); toast.success("Dashboard refreshed"); }}
            className={cn("h-9", isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50")}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Link href="/rail/shipments/create">
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
              <Package className="w-4 h-4 mr-1" /> New Shipment
            </Button>
          </Link>
        </div>
      </div>

      {/* ---- KPI Row ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Train className="w-5 h-5" />}
          label="Active Shipments"
          value={statsQuery.isLoading ? "..." : fmtNum(stats.activeShipments)}
          subtitle="across all railroads"
          trend={{ value: 12, positive: true }}
          isLight={isLight}
          accent="blue"
        />
        <KpiCard
          icon={<Layers className="w-5 h-5" />}
          label="Cars in Transit"
          value={statsQuery.isLoading ? "..." : fmtNum(stats.carsInTransit)}
          subtitle="currently moving"
          trend={{ value: 8, positive: true }}
          isLight={isLight}
          accent="emerald"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Monthly Spend"
          value={fmt(totalMonthlySpend)}
          subtitle="Mar 2026"
          trend={{ value: 3, positive: false }}
          isLight={isLight}
          accent="amber"
        />
        <KpiCard
          icon={<Gauge className="w-5 h-5" />}
          label="On-Time Rate"
          value={`${onTimeRate}%`}
          subtitle="last 30 days"
          trend={{ value: 2, positive: true }}
          isLight={isLight}
          accent="purple"
        />
      </div>

      {/* ---- Active Shipments ---- */}
      <ActiveShipmentsSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />

      {/* ---- Rate Comparison & Templates ---- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RateComparisonSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
        <TemplatesSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* ---- Financial Summary ---- */}
      <FinancialSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />

      {/* ---- Tracking Map & Recent Activity ---- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TrackingMapSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
        <RecentActivitySection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
      </div>

      {/* ---- Alerts & Notices ---- */}
      <AlertsSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />

      {/* ---- Quick Links ---- */}
      <QuickLinksSection isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Alerts & Notices                                          */
/* ------------------------------------------------------------------ */
function AlertsSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const alerts = [
    { id: "A-1", severity: "warning" as const, title: "Demurrage Accruing", message: "RS-14176 has exceeded free time at Memphis yard — 3 days demurrage accrued ($450 total)", time: "2h ago" },
    { id: "A-2", severity: "info" as const, title: "Rate Change Notice", message: "BNSF updated Covered Hopper tariff rates effective April 1, 2026 — review new pricing", time: "6h ago" },
    { id: "A-3", severity: "warning" as const, title: "Interchange Delay", message: "RS-14195 experiencing interchange delay at Kansas City — NS handoff pending weather clearance", time: "4h ago" },
    { id: "A-4", severity: "success" as const, title: "Settlement Completed", message: "RS-14180 settlement processed — $186,400 credited to your account", time: "18h ago" },
    { id: "A-5", severity: "info" as const, title: "Car Order Confirmed", message: "BNSF confirmed 30 covered hopper order for RS-14185 — placement ETA April 2", time: "14h ago" },
  ];

  const severityConfig: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    warning: {
      bg: isLight ? "bg-amber-50" : "bg-amber-500/5",
      border: isLight ? "border-amber-200" : "border-amber-500/20",
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    },
    info: {
      bg: isLight ? "bg-blue-50" : "bg-blue-500/5",
      border: isLight ? "border-blue-200" : "border-blue-500/20",
      icon: <Activity className="w-4 h-4 text-blue-500" />,
    },
    success: {
      bg: isLight ? "bg-emerald-50" : "bg-emerald-500/5",
      border: isLight ? "border-emerald-200" : "border-emerald-500/20",
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    },
  };

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <AlertTriangle className="w-5 h-5 text-amber-400" /> Alerts & Notices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map(a => {
          const config = severityConfig[a.severity];
          return (
            <div key={a.id} className={cn("rounded-lg border p-3 flex items-start gap-3", config.bg, config.border)}>
              <div className="mt-0.5">{config.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", text)}>{a.title}</span>
                  <span className={cn("text-xs whitespace-nowrap ml-2", muted)}>{a.time}</span>
                </div>
                <p className={cn("text-xs mt-0.5", muted)}>{a.message}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Quick Links                                               */
/* ------------------------------------------------------------------ */
function QuickLinksSection({ isLight, cardBg, text, muted }: {
  isLight: boolean; cardBg: string; text: string; muted: string;
}) {
  const links = [
    { label: "Create Shipment", href: "/rail/shipments/create", icon: <Plus className="w-5 h-5" />, color: "text-blue-400", desc: "Book a new rail freight shipment" },
    { label: "Track Cars", href: "/rail/tracking", icon: <MapPin className="w-5 h-5" />, color: "text-emerald-400", desc: "Real-time railcar tracking" },
    { label: "Shipment List", href: "/rail/shipper/shipments", icon: <Layers className="w-5 h-5" />, color: "text-indigo-400", desc: "View all your shipments" },
    { label: "Documents", href: "/rail/documents", icon: <FileText className="w-5 h-5" />, color: "text-amber-400", desc: "Waybills, BOLs, customs" },
    { label: "Financial", href: "/rail/financial", icon: <DollarSign className="w-5 h-5" />, color: "text-emerald-400", desc: "Billing, demurrage, settlements" },
    { label: "Yard Directory", href: "/rail/yards", icon: <Building2 className="w-5 h-5" />, color: "text-purple-400", desc: "Find railroad yards" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {links.map(l => (
        <Link key={l.label} href={l.href}>
          <div className={cn(
            "rounded-xl border p-4 text-center transition-all hover:scale-[1.03] cursor-pointer",
            isLight ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-800/60 border-slate-700/50 hover:border-blue-500/30"
          )}>
            <div className={cn("mx-auto mb-2", l.color)}>{l.icon}</div>
            <div className={cn("text-sm font-medium", text)}>{l.label}</div>
            <div className={cn("text-xs mt-0.5", muted)}>{l.desc}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
