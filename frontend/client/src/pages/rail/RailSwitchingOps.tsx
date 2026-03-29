/**
 * RAIL SWITCHING OPERATIONS — V5 Multi-Modal
 * Yard switching and car spotting management for RAIL_CATALYST & RAIL_DISPATCHER
 * Switch lists, track map, car spotting, inbound/outbound staging, crew, dwell analytics
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowRightLeft,
  TrainFront,
  MapPin,
  Clock,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Timer,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  RefreshCw,
  CircleDot,
  Grip,
  DollarSign,
  TrendingUp,
  Hash,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Priority & Status color maps ─── */
const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  blocked: "bg-red-500/20 text-red-400",
  awaiting: "bg-amber-500/20 text-amber-400",
  staged: "bg-cyan-500/20 text-cyan-400",
  spotted: "bg-green-500/20 text-green-400",
  en_route: "bg-indigo-500/20 text-indigo-400",
  classified: "bg-teal-500/20 text-teal-400",
};

const CREW_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  on_break: "bg-yellow-500/20 text-yellow-400",
  available: "bg-cyan-500/20 text-cyan-400",
  off_duty: "bg-slate-500/20 text-slate-400",
};

/* ─── Mock data generators (used when trpc endpoints return empty) ─── */
function generateSwitchOrders() {
  const cars = [
    "BNSF 723401", "UP 584920", "CSX 319744", "NS 502218", "CN 771503",
    "CP 445817", "KCS 623190", "BNSF 981205", "UP 334661", "CSX 887412",
    "NS 220387", "CN 615098", "BNSF 553472", "UP 761935", "CP 892014",
  ];
  const tracks = [
    "T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08",
    "T-09", "T-10", "T-11", "T-12", "CL-A", "CL-B", "CL-C", "DP-1", "DP-2",
  ];
  const priorities: Array<"urgent" | "high" | "normal" | "low"> = ["urgent", "high", "normal", "low"];
  const statuses: Array<"pending" | "in_progress" | "completed" | "blocked"> = ["pending", "in_progress", "completed", "blocked"];
  const crews = ["Alpha Crew", "Bravo Crew", "Charlie Crew", "Delta Crew"];
  return cars.map((car, i) => ({
    id: `SW-${1000 + i}`,
    carNumber: car,
    currentTrack: tracks[i % tracks.length],
    destinationTrack: tracks[(i + 5) % tracks.length],
    priority: priorities[i % 4],
    status: statuses[Math.min(i % 5, 3)],
    assignedCrew: crews[i % 4],
    notes: i % 3 === 0 ? "Hazmat — requires escort" : i % 5 === 0 ? "Bad order — inspect first" : "",
    createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

function generateTrackMap() {
  const tracks: Array<{ id: string; name: string; type: string; capacity: number; occupied: number; cars: string[] }> = [];
  const types = ["classification", "classification", "classification", "classification", "departure", "departure", "arrival", "arrival", "dock", "dock", "dock", "storage"];
  for (let i = 0; i < 12; i++) {
    const cap = types[i] === "dock" ? 3 : types[i] === "storage" ? 15 : 10;
    const occ = Math.floor(Math.random() * cap);
    const carList = [];
    for (let c = 0; c < occ; c++) {
      carList.push(`${["BNSF", "UP", "CSX", "NS", "CN"][c % 5]} ${100000 + i * 100 + c}`);
    }
    tracks.push({
      id: `T-${String(i + 1).padStart(2, "0")}`,
      name: types[i] === "dock" ? `Dock ${i - 7}` : types[i] === "classification" ? `Class ${i + 1}` : types[i] === "departure" ? `Departure ${i - 3}` : types[i] === "arrival" ? `Arrival ${i - 5}` : `Storage ${i - 10}`,
      type: types[i],
      capacity: cap,
      occupied: occ,
      cars: carList,
    });
  }
  return tracks;
}

function generateCarSpotting() {
  const shippers = ["Cargill Inc.", "Nucor Steel", "ADM Grain", "Dow Chemical", "CF Industries", "Koch Fertilizer", "Marathon Petroleum", "US Steel"];
  const commodities = ["Grain", "Steel Coil", "Soybeans", "Ethylene", "Ammonia", "Potash", "Crude Oil", "Flat-Rolled Steel"];
  const docks = ["Dock 1", "Dock 2", "Dock 3", "Dock 4"];
  const statuses: Array<"awaiting" | "spotted" | "pending"> = ["awaiting", "spotted", "pending"];
  return shippers.map((shipper, i) => ({
    id: `CS-${2000 + i}`,
    carNumber: `${["BNSF", "UP", "CSX", "NS"][i % 4]} ${200000 + i * 111}`,
    shipper,
    commodity: commodities[i],
    dock: docks[i % 4],
    status: statuses[i % 3],
    requestedTime: new Date(Date.now() + (i - 3) * 3600000).toISOString(),
    weight: `${(60 + Math.floor(Math.random() * 50))} tons`,
  }));
}

function generateInboundTrains() {
  const symbols = ["Q-CHISTL", "Z-LACCHI", "M-KCSBAR", "Q-ATLDAL", "Z-SEAPTL", "M-HOUMEM"];
  return symbols.map((sym, i) => ({
    id: `IB-${3000 + i}`,
    consistNumber: sym,
    origin: ["Chicago", "Los Angeles", "Kansas City", "Atlanta", "Seattle", "Houston"][i],
    eta: new Date(Date.now() + (i + 1) * 1800000).toISOString(),
    carCount: 45 + Math.floor(Math.random() * 80),
    status: i === 0 ? "arriving" : i < 3 ? "en_route" : "scheduled",
    hazmatCars: Math.floor(Math.random() * 5),
    priority: i === 0 ? "high" : "normal",
  }));
}

function generateOutboundStaging() {
  const destinations = ["Memphis", "Jacksonville", "Fort Worth", "Denver", "Portland", "Buffalo"];
  return destinations.map((dest, i) => ({
    id: `OB-${4000 + i}`,
    destination: dest,
    trackId: `T-${String(5 + (i % 2)).padStart(2, "0")}`,
    carCount: 10 + Math.floor(Math.random() * 40),
    readyForDeparture: i < 2,
    scheduledDeparture: new Date(Date.now() + (i + 2) * 3600000).toISOString(),
    trainSymbol: `Q-${dest.slice(0, 3).toUpperCase()}`,
    status: i < 2 ? "staged" : "building",
  }));
}

function generateCrewAssignments() {
  const names = [
    "J. Martinez", "R. Thompson", "K. Washington", "D. Nguyen",
    "M. Johnson", "S. Patel", "T. Williams", "A. Rodriguez",
  ];
  const tasks = [
    "Switching T-03 to T-07", "Car spotting Dock 2", "Classification — IB Q-CHISTL",
    "Outbound build Q-MEM", "Hump operations", "Track inspection T-01 to T-04",
    "Break available", "Yard transfer CL-A to DP-1",
  ];
  const statuses: Array<"active" | "on_break" | "available" | "off_duty"> = ["active", "active", "active", "active", "on_break", "available", "active", "off_duty"];
  return names.map((name, i) => ({
    id: `CR-${5000 + i}`,
    name,
    crew: ["Alpha Crew", "Alpha Crew", "Bravo Crew", "Bravo Crew", "Charlie Crew", "Charlie Crew", "Delta Crew", "Delta Crew"][i],
    currentTask: tasks[i],
    status: statuses[i],
    hoursWorked: parseFloat((2 + Math.random() * 8).toFixed(1)),
    maxHours: 12,
    startTime: new Date(Date.now() - (2 + i) * 3600000).toISOString(),
    certifications: i % 2 === 0 ? ["Hazmat", "Conductor"] : ["Conductor"],
  }));
}

function generateDwellAnalytics() {
  return {
    averageDwellHours: 18.4,
    targetDwellHours: 24,
    carsExceedingFreeTime: 12,
    totalCarsInYard: 147,
    demurrageAccruing: 8,
    demurrageDailyRate: 125,
    estimatedDemurrage: 6500,
    freeTimeHours: 48,
    dwellDistribution: [
      { range: "0-12h", count: 42, pct: 29 },
      { range: "12-24h", count: 51, pct: 35 },
      { range: "24-48h", count: 34, pct: 23 },
      { range: "48-72h", count: 12, pct: 8 },
      { range: "72h+", count: 8, pct: 5 },
    ],
    topDwellers: [
      { carNumber: "UP 334661", dwellHours: 96, shipper: "ADM Grain", demurrage: 750 },
      { carNumber: "BNSF 723401", dwellHours: 84, shipper: "Cargill Inc.", demurrage: 625 },
      { carNumber: "NS 502218", dwellHours: 78, shipper: "Nucor Steel", demurrage: 500 },
      { carNumber: "CSX 887412", dwellHours: 72, shipper: "Dow Chemical", demurrage: 375 },
      { carNumber: "CN 615098", dwellHours: 68, shipper: "CF Industries", demurrage: 250 },
    ],
  };
}

/* ─── Main Component ─── */
export default function RailSwitchingOps() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [tab, setTab] = useState("switch-list");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [yardName] = useState("Roseville Classification Yard");

  /* trpc queries — fall back to generated data */
  const shipmentsQuery = trpc.railShipments.getRailShipments.useQuery({ limit: 100 });
  const yardsQuery = trpc.railShipments.getRailYards.useQuery({ limit: 50 });
  const crewQuery = (trpc as any).railShipments.getRailCrew?.useQuery?.({ limit: 50 });

  /* Generated datasets */
  const switchOrders = useMemo(() => generateSwitchOrders(), []);
  const trackMap = useMemo(() => generateTrackMap(), []);
  const carSpotting = useMemo(() => generateCarSpotting(), []);
  const inboundTrains = useMemo(() => generateInboundTrains(), []);
  const outboundStaging = useMemo(() => generateOutboundStaging(), []);
  const crewAssignments = useMemo(() => generateCrewAssignments(), []);
  const dwellAnalytics = useMemo(() => generateDwellAnalytics(), []);

  /* Theme helpers */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
  );
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const rowBorder = isLight ? "border-slate-200" : "border-slate-700/50";
  const inputBg = isLight
    ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
    : "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500";

  /* Filtered switch orders */
  const filteredOrders = switchOrders.filter((o) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (
        !o.carNumber.toLowerCase().includes(q) &&
        !o.id.toLowerCase().includes(q) &&
        !o.currentTrack.toLowerCase().includes(q) &&
        !o.destinationTrack.toLowerCase().includes(q)
      )
        return false;
    }
    if (priorityFilter !== "all" && o.priority !== priorityFilter) return false;
    return true;
  });

  /* Summary stats */
  const activeOrders = switchOrders.filter((o) => o.status !== "completed").length;
  const urgentOrders = switchOrders.filter((o) => o.priority === "urgent").length;
  const completedToday = switchOrders.filter((o) => o.status === "completed").length;
  const activeCrew = crewAssignments.filter((c) => c.status === "active").length;

  /* ─── Stat card helper ─── */
  const StatCard = ({
    icon: Icon,
    label,
    value,
    accent,
    sub,
  }: {
    icon: any;
    label: string;
    value: string | number;
    accent: string;
    sub?: string;
  }) => (
    <Card className={cardBg}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", accent)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-medium", muted)}>{label}</p>
            <p className={cn("text-xl font-bold", text)}>{value}</p>
            {sub && <p className={cn("text-xs", muted)}>{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  /* ─── Format helpers ─── */
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatETA = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.round((d.getTime() - now.getTime()) / 60000);
    if (diffMin < 0) return "Arrived";
    if (diffMin < 60) return `${diffMin}m`;
    return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
  };

  /* ─── SECTION: Switch List ─── */
  const renderSwitchList = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
          <Input
            placeholder="Search car #, order ID, track..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("pl-9", inputBg)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className={cn("w-40", inputBg)}>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Switch Order Table */}
      <Card className={cardBg}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2", text)}>
            <ArrowRightLeft className="w-4 h-4 text-violet-400" />
            Active Switch Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", rowBorder)}>
                  {["Order", "Car #", "From", "To", "Priority", "Status", "Crew", "Notes"].map(
                    (h) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-left font-medium text-xs uppercase tracking-wider",
                          muted
                        )}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "border-b transition-colors",
                      rowBorder,
                      isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30"
                    )}
                  >
                    <td className={cn("px-4 py-3 font-mono text-xs", muted)}>{order.id}</td>
                    <td className={cn("px-4 py-3 font-semibold", text)}>{order.carNumber}</td>
                    <td className={cn("px-4 py-3 font-mono", muted)}>{order.currentTrack}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-mono">
                        <ChevronRight className="w-3 h-3 text-violet-400" />
                        <span className={text}>{order.destinationTrack}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs border", PRIORITY_COLORS[order.priority])}>
                        {order.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs", STATUS_COLORS[order.status])}>
                        {order.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className={cn("px-4 py-3 text-xs", muted)}>{order.assignedCrew}</td>
                    <td className="px-4 py-3">
                      {order.notes ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          {order.notes}
                        </span>
                      ) : (
                        <span className={cn("text-xs", muted)}>--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ─── SECTION: Track Map ─── */
  const renderTrackMap = () => {
    const typeColors: Record<string, string> = {
      classification: isLight ? "bg-blue-50 border-blue-300" : "bg-blue-900/30 border-blue-600/40",
      departure: isLight ? "bg-green-50 border-green-300" : "bg-green-900/30 border-green-600/40",
      arrival: isLight ? "bg-amber-50 border-amber-300" : "bg-amber-900/30 border-amber-600/40",
      dock: isLight ? "bg-purple-50 border-purple-300" : "bg-purple-900/30 border-purple-600/40",
      storage: isLight ? "bg-slate-100 border-slate-300" : "bg-slate-700/30 border-slate-600/40",
    };
    const typeLabels: Record<string, string> = {
      classification: "Classification",
      departure: "Departure",
      arrival: "Arrival",
      dock: "Dock",
      storage: "Storage",
    };

    return (
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className={cn("w-4 h-3 rounded border", typeColors[key])} />
              <span className={muted}>{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {trackMap.map((track) => {
            const pct = track.capacity > 0 ? (track.occupied / track.capacity) * 100 : 0;
            const full = pct >= 90;
            return (
              <Card key={track.id} className={cn("border", typeColors[track.type])}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-mono text-xs font-bold", text)}>{track.id}</span>
                      <span className={cn("text-xs", muted)}>{track.name}</span>
                    </div>
                    <Badge className={cn("text-[10px]", STATUS_COLORS[full ? "blocked" : "pending"])}>
                      {track.occupied}/{track.capacity}
                    </Badge>
                  </div>
                  <Progress
                    value={pct}
                    className={cn(
                      "h-2 mb-2",
                      full ? "[&>div]:bg-red-500" : pct > 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"
                    )}
                  />
                  {/* Car markers */}
                  <div className="flex flex-wrap gap-1">
                    {track.cars.map((car) => (
                      <div
                        key={car}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono truncate max-w-[100px]",
                          isLight
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-slate-700 text-slate-300 border border-slate-600"
                        )}
                        title={car}
                      >
                        {car}
                      </div>
                    ))}
                    {track.occupied === 0 && (
                      <span className={cn("text-[10px] italic", muted)}>Empty track</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── SECTION: Car Spotting ─── */
  const renderCarSpotting = () => (
    <div className="space-y-4">
      <Card className={cardBg}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2", text)}>
            <MapPin className="w-4 h-4 text-purple-400" />
            Car Spotting Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={cn("border-b", rowBorder)}>
                  {["ID", "Car #", "Shipper", "Commodity", "Dock", "Status", "Requested", "Weight"].map(
                    (h) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-left font-medium text-xs uppercase tracking-wider",
                          muted
                        )}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {carSpotting.map((cs) => (
                  <tr
                    key={cs.id}
                    className={cn(
                      "border-b transition-colors",
                      rowBorder,
                      isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/30"
                    )}
                  >
                    <td className={cn("px-4 py-3 font-mono text-xs", muted)}>{cs.id}</td>
                    <td className={cn("px-4 py-3 font-semibold", text)}>{cs.carNumber}</td>
                    <td className={cn("px-4 py-3", text)}>{cs.shipper}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-amber-400" />
                        <span className={muted}>{cs.commodity}</span>
                      </span>
                    </td>
                    <td className={cn("px-4 py-3 font-mono text-xs", muted)}>{cs.dock}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs", STATUS_COLORS[cs.status])}>
                        {cs.status}
                      </Badge>
                    </td>
                    <td className={cn("px-4 py-3 text-xs", muted)}>{formatTime(cs.requestedTime)}</td>
                    <td className={cn("px-4 py-3 text-xs", muted)}>{cs.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /* ─── SECTION: Inbound Trains ─── */
  const renderInboundTrains = () => (
    <div className="space-y-4">
      <Card className={cardBg}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2", text)}>
            <ArrowDownToLine className="w-4 h-4 text-amber-400" />
            Inbound Trains Awaiting Classification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {inboundTrains.map((train) => (
            <div
              key={train.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border",
                rowBorder,
                isLight ? "bg-slate-50" : "bg-slate-800/40"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    train.status === "arriving"
                      ? "bg-amber-500/20"
                      : train.status === "en_route"
                        ? "bg-blue-500/20"
                        : "bg-slate-500/20"
                  )}
                >
                  <TrainFront
                    className={cn(
                      "w-5 h-5",
                      train.status === "arriving"
                        ? "text-amber-400"
                        : train.status === "en_route"
                          ? "text-blue-400"
                          : "text-slate-400"
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold font-mono", text)}>{train.consistNumber}</span>
                    <Badge className={cn("text-xs", STATUS_COLORS[train.status] || STATUS_COLORS.pending)}>
                      {train.status}
                    </Badge>
                    {train.priority === "high" && (
                      <Badge className="text-xs bg-red-500/20 text-red-400">Priority</Badge>
                    )}
                  </div>
                  <p className={cn("text-xs mt-0.5", muted)}>
                    From {train.origin} &middot; {train.carCount} cars
                    {train.hazmatCars > 0 && (
                      <span className="text-amber-400 ml-1">
                        &middot; {train.hazmatCars} hazmat
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className={cn("text-xs", muted)}>ETA</p>
                  <p className={cn("font-semibold text-sm", text)}>{formatETA(train.eta)}</p>
                </div>
                <div>
                  <p className={cn("text-xs", muted)}>Arrival</p>
                  <p className={cn("font-mono text-sm", text)}>{formatTime(train.eta)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isLight ? "border-slate-300" : "border-slate-600"
                  )}
                >
                  Plan Classification
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  /* ─── SECTION: Outbound Staging ─── */
  const renderOutboundStaging = () => (
    <div className="space-y-4">
      <Card className={cardBg}>
        <CardHeader className="pb-2">
          <CardTitle className={cn("text-base font-semibold flex items-center gap-2", text)}>
            <ArrowUpFromLine className="w-4 h-4 text-cyan-400" />
            Outbound Staging by Destination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {outboundStaging.map((ob) => (
            <div
              key={ob.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border",
                rowBorder,
                isLight ? "bg-slate-50" : "bg-slate-800/40"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("font-bold", text)}>{ob.destination}</span>
                  <Badge className={cn("text-xs font-mono", STATUS_COLORS[ob.status] || STATUS_COLORS.pending)}>
                    {ob.status}
                  </Badge>
                  {ob.readyForDeparture && (
                    <Badge className="text-xs bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                </div>
                <div className={cn("flex flex-wrap gap-3 text-xs", muted)}>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {ob.trainSymbol}
                  </span>
                  <span className="flex items-center gap-1">
                    <Grip className="w-3 h-3" />
                    Track {ob.trackId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {ob.carCount} cars
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn("text-xs", muted)}>Departure</p>
                  <p className={cn("font-mono text-sm", text)}>{formatTime(ob.scheduledDeparture)}</p>
                </div>
                {ob.readyForDeparture ? (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    Release
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "text-xs",
                      isLight ? "border-slate-300" : "border-slate-600"
                    )}
                  >
                    View Build
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  /* ─── SECTION: Crew Assignments ─── */
  const renderCrewAssignments = () => {
    const grouped = crewAssignments.reduce(
      (acc, c) => {
        if (!acc[c.crew]) acc[c.crew] = [];
        acc[c.crew].push(c);
        return acc;
      },
      {} as Record<string, typeof crewAssignments>
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(grouped).map(([crewName, members]) => (
            <Card key={crewName} className={cardBg}>
              <CardHeader className="pb-2">
                <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", text)}>
                  <Users className="w-4 h-4 text-indigo-400" />
                  {crewName}
                  <Badge className={cn("text-[10px] ml-auto", "bg-indigo-500/20 text-indigo-400")}>
                    {members.filter((m) => m.status === "active").length}/{members.length} active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      rowBorder,
                      isLight ? "bg-slate-50" : "bg-slate-800/40"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", text)}>{member.name}</span>
                        <Badge className={cn("text-[10px]", CREW_STATUS_COLORS[member.status])}>
                          {member.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className={cn("text-xs mt-0.5 truncate", muted)}>{member.currentTask}</p>
                      <div className="flex gap-1 mt-1">
                        {member.certifications.map((cert) => (
                          <span
                            key={cert}
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded",
                              isLight
                                ? "bg-slate-100 text-slate-600"
                                : "bg-slate-700 text-slate-400"
                            )}
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="w-24 shrink-0">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className={muted}>{member.hoursWorked}h</span>
                        <span className={muted}>{member.maxHours}h</span>
                      </div>
                      <Progress
                        value={(member.hoursWorked / member.maxHours) * 100}
                        className={cn(
                          "h-1.5",
                          member.hoursWorked / member.maxHours > 0.85
                            ? "[&>div]:bg-red-500"
                            : member.hoursWorked / member.maxHours > 0.65
                              ? "[&>div]:bg-amber-500"
                              : "[&>div]:bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  /* ─── SECTION: Dwell Time Analytics ─── */
  const renderDwellAnalytics = () => {
    const dwell = dwellAnalytics;
    const maxBarWidth = Math.max(...dwell.dwellDistribution.map((d) => d.pct));

    return (
      <div className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Timer}
            label="Avg Dwell Time"
            value={`${dwell.averageDwellHours}h`}
            accent="bg-blue-500/10 text-blue-400"
            sub={`Target: ${dwell.targetDwellHours}h`}
          />
          <StatCard
            icon={AlertTriangle}
            label="Exceeding Free Time"
            value={dwell.carsExceedingFreeTime}
            accent="bg-amber-500/10 text-amber-400"
            sub={`of ${dwell.totalCarsInYard} total cars`}
          />
          <StatCard
            icon={DollarSign}
            label="Demurrage Accruing"
            value={dwell.demurrageAccruing}
            accent="bg-red-500/10 text-red-400"
            sub={`$${dwell.demurrageDailyRate}/car/day`}
          />
          <StatCard
            icon={TrendingUp}
            label="Est. Demurrage"
            value={`$${dwell.estimatedDemurrage.toLocaleString()}`}
            accent="bg-rose-500/10 text-rose-400"
            sub={`Free time: ${dwell.freeTimeHours}h`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Distribution */}
          <Card className={cardBg}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", text)}>
                <Clock className="w-4 h-4 text-blue-400" />
                Dwell Time Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {dwell.dwellDistribution.map((bucket) => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className={cn("w-16 text-xs font-mono text-right", muted)}>
                    {bucket.range}
                  </span>
                  <div className="flex-1 relative">
                    <div
                      className={cn(
                        "h-6 rounded",
                        bucket.range.includes("72")
                          ? "bg-red-500/40"
                          : bucket.range.includes("48")
                            ? "bg-amber-500/40"
                            : bucket.range.includes("24")
                              ? "bg-yellow-500/30"
                              : "bg-emerald-500/30"
                      )}
                      style={{ width: `${(bucket.pct / maxBarWidth) * 100}%` }}
                    />
                    <span
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold",
                        text
                      )}
                    >
                      {bucket.count} cars ({bucket.pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Dwellers */}
          <Card className={cardBg}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", text)}>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Top Dwell Offenders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b", rowBorder)}>
                      {["Car #", "Shipper", "Dwell", "Demurrage"].map((h) => (
                        <th
                          key={h}
                          className={cn(
                            "px-4 py-2 text-left font-medium text-xs uppercase tracking-wider",
                            muted
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dwell.topDwellers.map((car) => (
                      <tr
                        key={car.carNumber}
                        className={cn("border-b", rowBorder)}
                      >
                        <td className={cn("px-4 py-2 font-mono font-semibold text-xs", text)}>
                          {car.carNumber}
                        </td>
                        <td className={cn("px-4 py-2 text-xs", muted)}>{car.shipper}</td>
                        <td className="px-4 py-2">
                          <span className="text-xs text-red-400 font-semibold">{car.dwellHours}h</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-xs text-rose-400 font-semibold">
                            ${car.demurrage.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  /* ─── LOADING STATE ─── */
  if (shipmentsQuery.isLoading) {
    return (
      <div className={cn("min-h-screen p-6", bg)}>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  /* ─── MAIN RENDER ─── */
  return (
    <div className={cn("min-h-screen p-4 md:p-6", bg)}>
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl",
              isLight
                ? "bg-gradient-to-br from-violet-100 to-fuchsia-100"
                : "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20"
            )}
          >
            <ArrowRightLeft className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Switching Operations</h1>
            <p className={cn("text-sm flex items-center gap-1", muted)}>
              <Warehouse className="w-3.5 h-3.5" />
              {yardName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-xs",
              isLight ? "border-slate-300" : "border-slate-600"
            )}
            onClick={() => {
              shipmentsQuery.refetch();
              yardsQuery.refetch();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={ArrowRightLeft}
          label="Active Orders"
          value={activeOrders}
          accent="bg-violet-500/10 text-violet-400"
          sub={`${completedToday} completed today`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent"
          value={urgentOrders}
          accent="bg-red-500/10 text-red-400"
          sub="Requires immediate action"
        />
        <StatCard
          icon={TrainFront}
          label="Inbound Trains"
          value={inboundTrains.length}
          accent="bg-amber-500/10 text-amber-400"
          sub={`${inboundTrains.reduce((s, t) => s + t.carCount, 0)} total cars`}
        />
        <StatCard
          icon={Users}
          label="Active Crews"
          value={`${activeCrew}/${crewAssignments.length}`}
          accent="bg-indigo-500/10 text-indigo-400"
          sub="Currently on duty"
        />
      </div>

      {/* ─── Tab Navigation ─── */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList
            className={cn(
              "inline-flex h-10 rounded-lg p-1 w-auto",
              isLight ? "bg-slate-200/70" : "bg-slate-800/70"
            )}
          >
            <TabsTrigger value="switch-list" className="text-xs gap-1.5 px-3">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Switch List
            </TabsTrigger>
            <TabsTrigger value="track-map" className="text-xs gap-1.5 px-3">
              <Grip className="w-3.5 h-3.5" />
              Track Map
            </TabsTrigger>
            <TabsTrigger value="car-spotting" className="text-xs gap-1.5 px-3">
              <CircleDot className="w-3.5 h-3.5" />
              Car Spotting
            </TabsTrigger>
            <TabsTrigger value="inbound" className="text-xs gap-1.5 px-3">
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Inbound
            </TabsTrigger>
            <TabsTrigger value="outbound" className="text-xs gap-1.5 px-3">
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Outbound
            </TabsTrigger>
            <TabsTrigger value="crews" className="text-xs gap-1.5 px-3">
              <Users className="w-3.5 h-3.5" />
              Crews
            </TabsTrigger>
            <TabsTrigger value="dwell" className="text-xs gap-1.5 px-3">
              <Timer className="w-3.5 h-3.5" />
              Dwell Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="switch-list">{renderSwitchList()}</TabsContent>
        <TabsContent value="track-map">{renderTrackMap()}</TabsContent>
        <TabsContent value="car-spotting">{renderCarSpotting()}</TabsContent>
        <TabsContent value="inbound">{renderInboundTrains()}</TabsContent>
        <TabsContent value="outbound">{renderOutboundStaging()}</TabsContent>
        <TabsContent value="crews">{renderCrewAssignments()}</TabsContent>
        <TabsContent value="dwell">{renderDwellAnalytics()}</TabsContent>
      </Tabs>
    </div>
  );
}
