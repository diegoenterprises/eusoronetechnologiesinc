/**
 * RAIL FLEET MANAGEMENT — Railcar Fleet Management
 * For RAIL_CATALYST role: Full car roster, type breakdown,
 * maintenance scheduling, inspection tracking
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Truck, Package, Search, Filter, Plus, Eye, Wrench,
  CheckCircle, AlertTriangle, Clock, Calendar, FileText,
  ChevronDown, ChevronUp, RefreshCw, Hash, Fuel, Box,
  Layers, Shield, Activity, MapPin, BarChart3, Settings,
  Download, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Status Maps ─── */
const STATUS_COLORS: Record<string, string> = {
  in_service: "bg-emerald-500/20 text-emerald-400",
  loaded: "bg-cyan-500/20 text-cyan-400",
  empty: "bg-blue-500/20 text-blue-400",
  maintenance: "bg-amber-500/20 text-amber-400",
  out_of_service: "bg-red-500/20 text-red-400",
  in_transit: "bg-cyan-500/20 text-cyan-400",
  at_yard: "bg-blue-500/20 text-blue-400",
  reserved: "bg-purple-500/20 text-purple-400",
  bad_order: "bg-red-500/20 text-red-400",
};

const INSPECTION_STATUS: Record<string, string> = {
  current: "bg-emerald-500/20 text-emerald-400",
  due_soon: "bg-amber-500/20 text-amber-400",
  overdue: "bg-red-500/20 text-red-400",
};

const CAR_TYPE_LABELS: Record<string, string> = {
  tankcar: "Tank Car",
  boxcar: "Box Car",
  hopper: "Hopper",
  flatcar: "Flat Car",
  gondola: "Gondola",
  intermodal: "Intermodal",
  refrigerated: "Refrigerated",
  autorack: "Auto Rack",
};

/* ─── Mock Fleet Data ─── */
const MOCK_CARS: any[] = [
  { id: 1, carNumber: "ESLX-4421", type: "tankcar", ownerMark: "ESLX", status: "in_service", currentYard: "Chicago Terminal", capacity: "20,000 gal", lastInspection: "2026-02-15", nextInspection: "2026-08-15", inspectionStatus: "current", mileage: 142300, builtYear: 2018, commodity: "Ethanol", weight: "263,000 lbs" },
  { id: 2, carNumber: "ESLX-4422", type: "tankcar", ownerMark: "ESLX", status: "loaded", currentYard: "Houston Yard", capacity: "20,000 gal", lastInspection: "2026-01-10", nextInspection: "2026-07-10", inspectionStatus: "current", mileage: 98200, builtYear: 2019, commodity: "Crude Oil", weight: "286,000 lbs" },
  { id: 3, carNumber: "ESLX-5512", type: "boxcar", ownerMark: "ESLX", status: "in_service", currentYard: "Kansas City Hub", capacity: "5,238 cu ft", lastInspection: "2025-09-20", nextInspection: "2026-03-20", inspectionStatus: "overdue", mileage: 234100, builtYear: 2015, commodity: "Paper Products", weight: "220,000 lbs" },
  { id: 4, carNumber: "ESLX-5513", type: "boxcar", ownerMark: "ESLX", status: "empty", currentYard: "St. Louis Yard", capacity: "5,238 cu ft", lastInspection: "2026-02-01", nextInspection: "2026-08-01", inspectionStatus: "current", mileage: 187600, builtYear: 2016, commodity: "—", weight: "220,000 lbs" },
  { id: 5, carNumber: "ESLX-6678", type: "hopper", ownerMark: "ESLX", status: "maintenance", currentYard: "Chicago Terminal", capacity: "4,750 cu ft", lastInspection: "2025-08-12", nextInspection: "2026-02-12", inspectionStatus: "overdue", mileage: 312400, builtYear: 2012, commodity: "—", weight: "263,000 lbs" },
  { id: 6, carNumber: "GATX-8891", type: "tankcar", ownerMark: "GATX", status: "in_service", currentYard: "Memphis Intermodal", capacity: "20,000 gal", lastInspection: "2026-03-01", nextInspection: "2026-09-01", inspectionStatus: "current", mileage: 67800, builtYear: 2021, commodity: "Sulfuric Acid", weight: "263,000 lbs" },
  { id: 7, carNumber: "ESLX-7712", type: "flatcar", ownerMark: "ESLX", status: "in_service", currentYard: "Dallas Terminal", capacity: "80 tons", lastInspection: "2026-01-25", nextInspection: "2026-07-25", inspectionStatus: "current", mileage: 156200, builtYear: 2017, commodity: "Steel Coils", weight: "220,000 lbs" },
  { id: 8, carNumber: "ESLX-7713", type: "flatcar", ownerMark: "ESLX", status: "loaded", currentYard: "Houston Yard", capacity: "80 tons", lastInspection: "2026-02-20", nextInspection: "2026-08-20", inspectionStatus: "current", mileage: 98700, builtYear: 2019, commodity: "Lumber", weight: "220,000 lbs" },
  { id: 9, carNumber: "ESLX-3301", type: "gondola", ownerMark: "ESLX", status: "in_service", currentYard: "Kansas City Hub", capacity: "2,743 cu ft", lastInspection: "2025-12-10", nextInspection: "2026-06-10", inspectionStatus: "due_soon", mileage: 278900, builtYear: 2014, commodity: "Scrap Metal", weight: "220,000 lbs" },
  { id: 10, carNumber: "ESLX-3302", type: "gondola", ownerMark: "ESLX", status: "empty", currentYard: "St. Louis Yard", capacity: "2,743 cu ft", lastInspection: "2026-01-15", nextInspection: "2026-07-15", inspectionStatus: "current", mileage: 201300, builtYear: 2016, commodity: "—", weight: "220,000 lbs" },
  { id: 11, carNumber: "ESLX-9901", type: "intermodal", ownerMark: "ESLX", status: "in_transit", currentYard: "In Transit", capacity: "53 ft well", lastInspection: "2026-03-05", nextInspection: "2026-09-05", inspectionStatus: "current", mileage: 45200, builtYear: 2022, commodity: "Containers", weight: "220,000 lbs" },
  { id: 12, carNumber: "ESLX-9902", type: "intermodal", ownerMark: "ESLX", status: "in_service", currentYard: "Chicago Terminal", capacity: "53 ft well", lastInspection: "2026-02-28", nextInspection: "2026-08-28", inspectionStatus: "current", mileage: 52100, builtYear: 2022, commodity: "Containers", weight: "220,000 lbs" },
  { id: 13, carNumber: "ESLX-6679", type: "hopper", ownerMark: "ESLX", status: "in_service", currentYard: "Memphis Intermodal", capacity: "4,750 cu ft", lastInspection: "2026-03-10", nextInspection: "2026-09-10", inspectionStatus: "current", mileage: 189400, builtYear: 2015, commodity: "Grain", weight: "263,000 lbs" },
  { id: 14, carNumber: "ESLX-4423", type: "tankcar", ownerMark: "ESLX", status: "out_of_service", currentYard: "Dallas Terminal", capacity: "20,000 gal", lastInspection: "2025-06-01", nextInspection: "2025-12-01", inspectionStatus: "overdue", mileage: 298700, builtYear: 2011, commodity: "—", weight: "263,000 lbs" },
  { id: 15, carNumber: "TILX-2201", type: "hopper", ownerMark: "TILX", status: "loaded", currentYard: "Houston Yard", capacity: "4,750 cu ft", lastInspection: "2026-02-10", nextInspection: "2026-08-10", inspectionStatus: "current", mileage: 76300, builtYear: 2020, commodity: "Corn", weight: "263,000 lbs" },
  { id: 16, carNumber: "ESLX-5514", type: "boxcar", ownerMark: "ESLX", status: "bad_order", currentYard: "Chicago Terminal", capacity: "5,238 cu ft", lastInspection: "2025-11-01", nextInspection: "2026-05-01", inspectionStatus: "due_soon", mileage: 267800, builtYear: 2013, commodity: "—", weight: "220,000 lbs" },
];

const MOCK_MAINTENANCE = [
  { id: 1, carNumber: "ESLX-6678", type: "hopper", issue: "Brake valve replacement", priority: "high", scheduledDate: "2026-04-02", assignedTo: "Shop A - Chicago", status: "scheduled" },
  { id: 2, carNumber: "ESLX-4423", type: "tankcar", issue: "Tank shell repair — corrosion", priority: "critical", scheduledDate: "2026-03-30", assignedTo: "Shop B - Dallas", status: "in_progress" },
  { id: 3, carNumber: "ESLX-5514", type: "boxcar", issue: "Door mechanism repair", priority: "medium", scheduledDate: "2026-04-05", assignedTo: "Shop A - Chicago", status: "scheduled" },
  { id: 4, carNumber: "ESLX-3301", type: "gondola", issue: "Wheel bearing inspection", priority: "low", scheduledDate: "2026-04-10", assignedTo: "Shop C - Kansas City", status: "pending" },
  { id: 5, carNumber: "ESLX-5512", type: "boxcar", issue: "Floor replacement", priority: "medium", scheduledDate: "2026-04-08", assignedTo: "Shop A - Chicago", status: "scheduled" },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-blue-500/20 text-blue-400",
};

const MAINT_STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-cyan-500/20 text-cyan-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-emerald-500/20 text-emerald-400",
};

/* ─── Car Detail Expand ─── */
function CarDetailPanel({ car, isLight, text, muted }: {
  car: any; isLight: boolean; text: string; muted: string;
}) {
  const maintenanceHistory = [
    { date: "2026-02-15", type: "Periodic Inspection", shop: "Chicago Shop A", result: "Pass" },
    { date: "2025-11-02", type: "Wheel Replacement", shop: "Kansas City Shop", result: "Completed" },
    { date: "2025-08-20", type: "Brake Test", shop: "Chicago Shop A", result: "Pass" },
    { date: "2025-05-10", type: "Coupler Inspection", shop: "St. Louis Shop", result: "Pass" },
  ];

  return (
    <div className={cn(
      "px-4 pb-4 pt-2 border-t space-y-4",
      isLight ? "border-slate-200 bg-slate-50/50" : "border-slate-700/50 bg-slate-800/30"
    )}>
      {/* Specs */}
      <div>
        <h4 className={cn("text-sm font-semibold mb-2", text)}>Car Specifications</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Type", value: CAR_TYPE_LABELS[car.type] || car.type },
            { label: "Built", value: car.builtYear },
            { label: "Capacity", value: car.capacity },
            { label: "Max Weight", value: car.weight },
            { label: "Mileage", value: `${car.mileage?.toLocaleString()} mi` },
            { label: "Owner Mark", value: car.ownerMark },
            { label: "Commodity", value: car.commodity || "—" },
            { label: "Current Yard", value: car.currentYard },
          ].map((spec) => (
            <div key={spec.label}>
              <div className={cn("text-xs", muted)}>{spec.label}</div>
              <div className={cn("text-sm font-medium", text)}>{spec.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance History */}
      <div>
        <h4 className={cn("text-sm font-semibold mb-2", text)}>Maintenance History</h4>
        <div className="space-y-1.5">
          {maintenanceHistory.map((m, i) => (
            <div key={i} className={cn(
              "flex items-center justify-between p-2 rounded-lg text-sm",
              isLight ? "bg-white border border-slate-200" : "bg-slate-700/30 border border-slate-700/50"
            )}>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs w-24", muted)}>{m.date}</span>
                <span className={cn("font-medium", text)}>{m.type}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs", muted)}>{m.shop}</span>
                <Badge className={m.result === "Pass" || m.result === "Completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                  {m.result}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspection Record */}
      <div>
        <h4 className={cn("text-sm font-semibold mb-2", text)}>Inspection Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className={cn("rounded-lg border p-3", isLight ? "border-slate-200" : "border-slate-700/50")}>
            <div className={cn("text-xs", muted)}>Last Inspection</div>
            <div className={cn("text-sm font-medium", text)}>{car.lastInspection}</div>
          </div>
          <div className={cn("rounded-lg border p-3", isLight ? "border-slate-200" : "border-slate-700/50")}>
            <div className={cn("text-xs", muted)}>Next Due</div>
            <div className={cn("text-sm font-medium", text)}>{car.nextInspection}</div>
          </div>
          <div className={cn("rounded-lg border p-3", isLight ? "border-slate-200" : "border-slate-700/50")}>
            <div className={cn("text-xs", muted)}>Status</div>
            <Badge className={INSPECTION_STATUS[car.inspectionStatus] || "bg-slate-500/20 text-slate-400"}>
              {car.inspectionStatus?.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="text-xs gap-1">
          <Wrench className="w-3 h-3" /> Schedule Maintenance
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1">
          <FileText className="w-3 h-3" /> Full History
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1">
          <Download className="w-3 h-3" /> Export Record
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function RailFleetManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYard, setFilterYard] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const inputCls = cn(
    "h-9 text-sm",
    isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
  );

  // Unique values for filters
  const yards = [...new Set(MOCK_CARS.map((c) => c.currentYard))];
  const types = [...new Set(MOCK_CARS.map((c) => c.type))];
  const statuses = [...new Set(MOCK_CARS.map((c) => c.status))];

  // Filtered cars
  const filteredCars = useMemo(() => {
    return MOCK_CARS.filter((car) => {
      if (search && !car.carNumber.toLowerCase().includes(search.toLowerCase()) &&
          !car.commodity?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && car.type !== filterType) return false;
      if (filterStatus !== "all" && car.status !== filterStatus) return false;
      if (filterYard !== "all" && car.currentYard !== filterYard) return false;
      return true;
    });
  }, [search, filterType, filterStatus, filterYard]);

  // Cars by type for "By Type" tab
  const carsByType = useMemo(() => {
    const groups: Record<string, any[]> = {};
    MOCK_CARS.forEach((car) => {
      if (!groups[car.type]) groups[car.type] = [];
      groups[car.type].push(car);
    });
    return groups;
  }, []);

  // Inspection due list
  const inspectionDue = MOCK_CARS
    .filter((c) => c.inspectionStatus === "overdue" || c.inspectionStatus === "due_soon")
    .sort((a, b) => (a.inspectionStatus === "overdue" ? -1 : 1));

  // KPIs
  const totalCars = MOCK_CARS.length;
  const inServiceCount = MOCK_CARS.filter((c) => ["in_service", "loaded", "in_transit"].includes(c.status)).length;
  const maintenanceCount = MOCK_CARS.filter((c) => ["maintenance", "bad_order", "out_of_service"].includes(c.status)).length;
  const overdueInspections = MOCK_CARS.filter((c) => c.inspectionStatus === "overdue").length;

  const clearFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterYard("all");
  };
  const hasFilters = search || filterType !== "all" || filterStatus !== "all" || filterYard !== "all";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-blue-100 to-indigo-100" : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
          )}>
            <Truck className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Fleet Management</h1>
            <p className={cn("text-sm", muted)}>Railcar roster, maintenance & inspections</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className={cn(
            "gap-1.5 text-xs",
            isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600/90 hover:bg-blue-600 text-white"
          )}>
            <Plus className="w-3.5 h-3.5" /> Add Car
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Package className="w-5 h-5" />, label: "Total Cars", value: totalCars, accent: "blue" },
          { icon: <CheckCircle className="w-5 h-5" />, label: "In Service", value: inServiceCount, accent: "emerald" },
          { icon: <Wrench className="w-5 h-5" />, label: "Maintenance / Bad Order", value: maintenanceCount, accent: "amber" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Overdue Inspections", value: overdueInspections, accent: "red" },
        ].map((kpi) => {
          const accentMap: Record<string, string> = {
            blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
            emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
            amber: isLight ? "bg-amber-50 text-amber-600" : "bg-amber-500/10 text-amber-400",
            red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
          };
          return (
            <Card key={kpi.label} className={cn("border", cardBg)}>
              <CardContent className="p-4">
                <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[kpi.accent])}>{kpi.icon}</div>
                <div className={cn("text-2xl font-bold", text)}>{kpi.value}</div>
                <div className={cn("text-xs", muted)}>{kpi.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
          <TabsTrigger value="all">All Cars</TabsTrigger>
          <TabsTrigger value="byType">By Type</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        {/* ── All Cars Tab ── */}
        <TabsContent value="all">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
                  <Input
                    placeholder="Search car number or commodity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>{CAR_TYPE_LABELS[t] || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterYard} onValueChange={setFilterYard}>
                    <SelectTrigger className={cn("w-44", inputCls)}>
                      <SelectValue placeholder="Yard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Yards</SelectItem>
                      {yards.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasFilters && (
                    <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs gap-1">
                      <X className="w-3 h-3" /> Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      {["Car Number", "Type", "Owner", "Status", "Current Yard", "Capacity", "Last Inspection", ""].map((h) => (
                        <th key={h} className={cn("text-left py-2 px-3 text-xs font-medium", muted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCars.map((car) => (
                      <React.Fragment key={car.id}>
                        <tr
                          className={cn(
                            "border-b cursor-pointer transition-colors",
                            isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-800 hover:bg-slate-700/20",
                            expandedId === car.id && (isLight ? "bg-slate-50" : "bg-slate-700/20")
                          )}
                          onClick={() => setExpandedId(expandedId === car.id ? null : car.id)}
                        >
                          <td className={cn("py-2.5 px-3 font-semibold", text)}>{car.carNumber}</td>
                          <td className={cn("py-2.5 px-3", text)}>{CAR_TYPE_LABELS[car.type] || car.type}</td>
                          <td className={cn("py-2.5 px-3", muted)}>{car.ownerMark}</td>
                          <td className="py-2.5 px-3">
                            <Badge className={STATUS_COLORS[car.status] || "bg-slate-500/20 text-slate-400"}>
                              {car.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className={cn("py-2.5 px-3", text)}>{car.currentYard}</td>
                          <td className={cn("py-2.5 px-3", muted)}>{car.capacity}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs", text)}>{car.lastInspection}</span>
                              <Badge className={INSPECTION_STATUS[car.inspectionStatus] || "bg-slate-500/20 text-slate-400"} >
                                {car.inspectionStatus?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {expandedId === car.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </td>
                        </tr>
                        {expandedId === car.id && (
                          <tr>
                            <td colSpan={8}>
                              <CarDetailPanel car={car} isLight={isLight} text={text} muted={muted} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {filteredCars.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Package className={cn("w-10 h-10 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                          <p className={cn("text-sm", muted)}>No cars match your filters</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className={cn("text-xs mt-3 text-right", muted)}>
                Showing {filteredCars.length} of {totalCars} cars
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── By Type Tab ── */}
        <TabsContent value="byType">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(carsByType).map(([type, cars]) => {
              const inService = cars.filter((c: any) => ["in_service", "loaded", "in_transit"].includes(c.status)).length;
              const util = Math.round((inService / cars.length) * 100);
              return (
                <Card key={type} className={cn("border", cardBg)}>
                  <CardHeader className="pb-2">
                    <CardTitle className={cn("text-base flex items-center gap-2", text)}>
                      {CAR_TYPE_LABELS[type] || type}
                      <Badge className="ml-auto bg-blue-500/20 text-blue-400">{cars.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className={muted}>Utilization</span>
                        <span className={cn("font-medium", text)}>{util}%</span>
                      </div>
                      <Progress value={util} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={cn("rounded-lg p-2", isLight ? "bg-emerald-50" : "bg-emerald-500/10")}>
                        <div className={cn("text-sm font-bold", isLight ? "text-emerald-600" : "text-emerald-400")}>{inService}</div>
                        <div className="text-xs text-emerald-500">Active</div>
                      </div>
                      <div className={cn("rounded-lg p-2", isLight ? "bg-amber-50" : "bg-amber-500/10")}>
                        <div className={cn("text-sm font-bold", isLight ? "text-amber-600" : "text-amber-400")}>
                          {cars.filter((c: any) => c.status === "maintenance").length}
                        </div>
                        <div className="text-xs text-amber-500">Maint.</div>
                      </div>
                      <div className={cn("rounded-lg p-2", isLight ? "bg-blue-50" : "bg-blue-500/10")}>
                        <div className={cn("text-sm font-bold", isLight ? "text-blue-600" : "text-blue-400")}>
                          {cars.filter((c: any) => c.status === "empty").length}
                        </div>
                        <div className="text-xs text-blue-500">Empty</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {cars.slice(0, 3).map((car: any) => (
                        <div key={car.id} className={cn(
                          "flex items-center justify-between text-xs p-2 rounded",
                          isLight ? "bg-slate-50" : "bg-slate-700/20"
                        )}>
                          <span className={cn("font-medium", text)}>{car.carNumber}</span>
                          <Badge className={STATUS_COLORS[car.status] || "bg-slate-500/20 text-slate-400"}>
                            {car.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      ))}
                      {cars.length > 3 && (
                        <div className={cn("text-xs text-center pt-1", muted)}>
                          +{cars.length - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Maintenance Tab ── */}
        <TabsContent value="maintenance">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
                  <Wrench className="w-5 h-5 text-amber-400" /> Maintenance Schedule
                </CardTitle>
                <Button size="sm" className={cn(
                  "gap-1.5 text-xs",
                  isLight ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-amber-600/90 hover:bg-amber-600 text-white"
                )}>
                  <Plus className="w-3.5 h-3.5" /> Schedule Work
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_MAINTENANCE.map((m) => (
                  <div key={m.id} className={cn(
                    "rounded-lg border p-4 transition-all",
                    isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold", text)}>{m.carNumber}</span>
                        <Badge className="bg-slate-500/20 text-slate-400">{CAR_TYPE_LABELS[m.type] || m.type}</Badge>
                        <Badge className={PRIORITY_COLORS[m.priority]}>{m.priority}</Badge>
                      </div>
                      <Badge className={MAINT_STATUS_COLORS[m.status] || "bg-slate-500/20 text-slate-400"}>
                        {m.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className={cn("text-sm", text)}>{m.issue}</div>
                    <div className={cn("flex items-center gap-4 mt-2 text-xs", muted)}>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.scheduledDate}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Inspections Tab ── */}
        <TabsContent value="inspections">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
                  <Shield className="w-5 h-5 text-red-400" /> Inspection Due List
                </CardTitle>
                <Badge className="bg-red-500/20 text-red-400">
                  {inspectionDue.filter((c) => c.inspectionStatus === "overdue").length} overdue
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {inspectionDue.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className={cn("w-10 h-10 mx-auto mb-2", isLight ? "text-emerald-400" : "text-emerald-500")} />
                  <p className={cn("text-sm", muted)}>All inspections are current</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectionDue.map((car) => (
                    <div key={car.id} className={cn(
                      "rounded-lg border p-4 flex items-center justify-between",
                      car.inspectionStatus === "overdue"
                        ? (isLight ? "border-red-200 bg-red-50/50" : "border-red-500/30 bg-red-500/5")
                        : (isLight ? "border-amber-200 bg-amber-50/50" : "border-amber-500/30 bg-amber-500/5")
                    )}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("font-semibold", text)}>{car.carNumber}</span>
                          <Badge className="bg-slate-500/20 text-slate-400">{CAR_TYPE_LABELS[car.type] || car.type}</Badge>
                          <Badge className={INSPECTION_STATUS[car.inspectionStatus]}>
                            {car.inspectionStatus.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className={cn("text-xs", muted)}>
                          Last: {car.lastInspection} | Due: {car.nextInspection} | Yard: {car.currentYard}
                        </div>
                      </div>
                      <Button size="sm" className={cn(
                        "gap-1.5 text-xs",
                        car.inspectionStatus === "overdue"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      )}>
                        <Shield className="w-3 h-3" /> Schedule Inspection
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fleet Analytics Summary */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Utilization by Type */}
        <Card className={cn("border", cardBg)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
              <BarChart3 className="w-5 h-5 text-blue-400" /> Utilization by Car Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(carsByType).map(([type, cars]) => {
                const inService = cars.filter((c: any) => ["in_service", "loaded", "in_transit"].includes(c.status)).length;
                const util = cars.length > 0 ? Math.round((inService / cars.length) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={cn("w-28 text-sm font-medium truncate", text)}>
                      {CAR_TYPE_LABELS[type] || type}
                    </div>
                    <div className="flex-1">
                      <Progress value={util} className="h-3" />
                    </div>
                    <div className={cn("text-sm font-semibold w-12 text-right",
                      util >= 80 ? (isLight ? "text-emerald-600" : "text-emerald-400") :
                      util >= 60 ? (isLight ? "text-amber-600" : "text-amber-400") :
                      (isLight ? "text-red-600" : "text-red-400")
                    )}>
                      {util}%
                    </div>
                    <div className={cn("text-xs w-16 text-right", muted)}>
                      {inService}/{cars.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Age Distribution */}
        <Card className={cn("border", cardBg)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
              <Calendar className="w-5 h-5 text-purple-400" /> Fleet Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const currentYear = new Date().getFullYear();
              const ageGroups = [
                { label: "0-3 years", min: currentYear - 3, max: currentYear, color: "emerald" },
                { label: "4-7 years", min: currentYear - 7, max: currentYear - 3, color: "blue" },
                { label: "8-10 years", min: currentYear - 10, max: currentYear - 7, color: "amber" },
                { label: "10+ years", min: 0, max: currentYear - 10, color: "red" },
              ];
              return (
                <div className="space-y-3">
                  {ageGroups.map((group) => {
                    const count = MOCK_CARS.filter(
                      (c) => c.builtYear > group.min && c.builtYear <= group.max
                    ).length;
                    const pct = Math.round((count / MOCK_CARS.length) * 100);
                    const colorMap: Record<string, string> = {
                      emerald: isLight ? "bg-emerald-500" : "bg-emerald-600",
                      blue: isLight ? "bg-blue-500" : "bg-blue-600",
                      amber: isLight ? "bg-amber-500" : "bg-amber-600",
                      red: isLight ? "bg-red-500" : "bg-red-600",
                    };
                    const textColorMap: Record<string, string> = {
                      emerald: isLight ? "text-emerald-600" : "text-emerald-400",
                      blue: isLight ? "text-blue-600" : "text-blue-400",
                      amber: isLight ? "text-amber-600" : "text-amber-400",
                      red: isLight ? "text-red-600" : "text-red-400",
                    };
                    return (
                      <div key={group.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={cn("font-medium", text)}>{group.label}</span>
                          <span className={cn("font-medium", textColorMap[group.color])}>
                            {count} cars ({pct}%)
                          </span>
                        </div>
                        <div className={cn("h-3 rounded-full overflow-hidden",
                          isLight ? "bg-slate-100" : "bg-slate-700/50"
                        )}>
                          <div
                            className={cn("h-full rounded-full transition-all", colorMap[group.color])}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className={cn("text-xs mt-2 pt-2 border-t flex justify-between",
                    isLight ? "border-slate-200" : "border-slate-700/50"
                  )}>
                    <span className={muted}>Average fleet age</span>
                    <span className={cn("font-semibold", text)}>
                      {(MOCK_CARS.reduce((sum, c) => sum + (currentYear - c.builtYear), 0) / MOCK_CARS.length).toFixed(1)} years
                    </span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Mileage Leaders */}
        <Card className={cn("border", cardBg)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
              <Activity className="w-5 h-5 text-cyan-400" /> Highest Mileage Cars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...MOCK_CARS]
                .sort((a, b) => b.mileage - a.mileage)
                .slice(0, 6)
                .map((car, idx) => (
                  <div key={car.id} className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border",
                    isLight ? "border-slate-200" : "border-slate-700/50"
                  )}>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        idx < 3 ? (isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-400")
                                : (isLight ? "bg-slate-100 text-slate-600" : "bg-slate-700/50 text-slate-400")
                      )}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className={cn("text-sm font-medium", text)}>{car.carNumber}</div>
                        <div className={cn("text-xs", muted)}>{CAR_TYPE_LABELS[car.type]} | Built {car.builtYear}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold", text)}>{car.mileage.toLocaleString()} mi</div>
                      <Badge className={STATUS_COLORS[car.status] || "bg-slate-500/20 text-slate-400"}>
                        {car.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Cars by Yard */}
        <Card className={cn("border", cardBg)}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
              <MapPin className="w-5 h-5 text-amber-400" /> Cars by Yard Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {yards.map((yard) => {
                const carsAtYard = MOCK_CARS.filter((c) => c.currentYard === yard);
                return (
                  <div key={yard} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20"
                  )}>
                    <div>
                      <div className={cn("text-sm font-medium", text)}>{yard}</div>
                      <div className={cn("text-xs", muted)}>
                        {carsAtYard.map((c) => c.carNumber).join(", ")}
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">{carsAtYard.length} cars</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
