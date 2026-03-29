/**
 * RAIL SHIPPER SHIPMENTS — Full Shipment Management for Rail Shippers
 * Tabs: Active | Pending | Completed | Templates
 * Filters, bulk actions, expandable details with waybill/events/documents/demurrage.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Package,
  Train,
  MapPin,
  ArrowRight,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Bookmark,
  Copy,
  RefreshCw,
  BarChart3,
  Truck,
  CalendarDays,
  Scale,
  Hash,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
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
  on_hold: "bg-red-500/20 text-red-400",
};

const ACTIVE_STATUSES = ["car_ordered", "car_placed", "loading", "loaded", "in_transit", "at_interchange", "in_yard", "spotted", "unloading"];
const PENDING_STATUSES = ["requested"];
const COMPLETED_STATUSES = ["delivered", "settled", "empty_released", "cancelled"];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ShipmentTemplate {
  id: string;
  name: string;
  originYard: string;
  destYard: string;
  commodity: string;
  stccCode: string;
  carType: string;
  carCount: number;
  weight: number;
  railroad: string;
  lastUsed: string;
  timesUsed: number;
}

/* ------------------------------------------------------------------ */
/*  Mock templates                                                     */
/* ------------------------------------------------------------------ */
const MOCK_TEMPLATES: ShipmentTemplate[] = [
  { id: "T-001", name: "Weekly Grain — CHI to LAX", originYard: "CHI-Corwith", destYard: "LAX-ICTF", commodity: "Grain", stccCode: "01131", carType: "Covered Hopper", carCount: 45, weight: 4500, railroad: "BNSF", lastUsed: "2026-03-25", timesUsed: 28 },
  { id: "T-002", name: "Chemical Run — HOU to ATL", originYard: "HOU-Englewood", destYard: "ATL-Inman", commodity: "Chemicals", stccCode: "28111", carType: "Tank Car", carCount: 20, weight: 1800, railroad: "CSX", lastUsed: "2026-03-22", timesUsed: 14 },
  { id: "T-003", name: "Coal Unit Train — KC to SEA", originYard: "KC-Argentine", destYard: "SEA-SIG", commodity: "Coal", stccCode: "11211", carType: "Open Hopper", carCount: 110, weight: 11000, railroad: "UP", lastUsed: "2026-03-20", timesUsed: 52 },
  { id: "T-004", name: "Auto Express — DEN to STL", originYard: "DEN-North Yard", destYard: "STL-Dupo", commodity: "Automobiles", stccCode: "37111", carType: "Autorack", carCount: 18, weight: 900, railroad: "UP", lastUsed: "2026-03-18", timesUsed: 9 },
  { id: "T-005", name: "Lumber — MEM to DAL", originYard: "MEM-Johnston", destYard: "DAL-Zacha", commodity: "Lumber", stccCode: "24111", carType: "Centerbeam Flat", carCount: 30, weight: 2400, railroad: "BNSF", lastUsed: "2026-03-15", timesUsed: 21 },
  { id: "T-006", name: "Intermodal — PHL to CHI", originYard: "PHL-Greenwich", destYard: "CHI-59th St", commodity: "Mixed Goods", stccCode: "46111", carType: "Well Car", carCount: 60, weight: 3600, railroad: "NS", lastUsed: "2026-03-12", timesUsed: 36 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function SkeletonRows({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
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
/*  Expandable Shipment Row                                            */
/* ------------------------------------------------------------------ */
function ShipmentRow({ shipment, isLight, text, muted, cardBg }: {
  shipment: any;
  isLight: boolean;
  text: string;
  muted: string;
  cardBg: string;
}) {
  const [expanded, setExpanded] = useState(false);

  /* Fetch detail on expand */
  const detailQuery = (trpc as any).railShipments.getRailShipmentDetail.useQuery(
    { id: shipment.id },
    { enabled: expanded }
  );
  const detail = detailQuery.data;

  const rate = shipment.rate ? parseFloat(shipment.rate) : 0;

  return (
    <div className={cn("border-b last:border-b-0 transition-colors", isLight ? "border-slate-100" : "border-slate-700/20")}>
      {/* Main row */}
      <div
        className={cn("grid grid-cols-10 gap-3 px-4 py-3 text-sm cursor-pointer transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-slate-700/20")}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          <span className={cn("font-medium", isLight ? "text-blue-600" : "text-blue-400")}>{shipment.shipmentNumber}</span>
        </span>
        <span className={cn("truncate", isLight ? "text-slate-600" : "text-slate-300")}>{shipment.originYardId || "---"}</span>
        <span className={cn("truncate", isLight ? "text-slate-600" : "text-slate-300")}>{shipment.destinationYardId || "---"}</span>
        <span className={cn("truncate", isLight ? "text-slate-600" : "text-slate-300")}>{shipment.commodity || "---"}</span>
        <span className={cn("text-xs", muted)}>{shipment.stccCode || "---"}</span>
        <span className={cn(isLight ? "text-slate-600" : "text-slate-300")}>{(shipment.carType || "---").replace(/_/g, " ")}</span>
        <span className={cn(isLight ? "text-slate-700" : "text-slate-300")}>{shipment.numberOfCars || 1}</span>
        <span className={cn(isLight ? "text-slate-600" : "text-slate-300")}>{shipment.weight ? `${Number(shipment.weight).toLocaleString()} tons` : "---"}</span>
        <span className={cn(isLight ? "text-slate-700" : "text-slate-200")}>{rate > 0 ? fmt(rate) : "---"}</span>
        <Badge className={cn("w-fit text-xs", STATUS_COLORS[shipment.status] || "bg-slate-500/20 text-slate-400")}>
          {shipment.status?.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className={cn("px-4 pb-4 pt-1 ml-6 space-y-4", isLight ? "bg-slate-50/50" : "bg-slate-800/30")}>
          {detailQuery.isLoading ? (
            <SkeletonRows rows={3} cols={4} />
          ) : detail ? (
            <>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Link href={`/rail/shipments/${shipment.id}`}>
                  <Button size="sm" variant="outline" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
                    <Eye className="w-3 h-3 mr-1" /> View Detail
                  </Button>
                </Link>
                <Link href={`/rail/tracking`}>
                  <Button size="sm" variant="outline" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
                    <MapPin className="w-3 h-3 mr-1" /> Track
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
              </div>

              {/* Tabs: Waybill, Events, Documents, Demurrage */}
              <ExpandedDetailTabs detail={detail} isLight={isLight} text={text} muted={muted} cardBg={cardBg} />
            </>
          ) : (
            <p className={cn("text-sm", muted)}>No detail available</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded Detail Tabs                                               */
/* ------------------------------------------------------------------ */
function ExpandedDetailTabs({ detail, isLight, text, muted, cardBg }: {
  detail: any;
  isLight: boolean;
  text: string;
  muted: string;
  cardBg: string;
}) {
  const [tab, setTab] = useState("waybill");

  const waybills = detail?.waybills || [];
  const events = detail?.events || [];
  const demurrage = detail?.demurrage || [];

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("h-8", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
          <TabsTrigger value="waybill" className="text-xs h-7">Waybill ({waybills.length})</TabsTrigger>
          <TabsTrigger value="events" className="text-xs h-7">Events ({events.length})</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs h-7">Documents</TabsTrigger>
          <TabsTrigger value="demurrage" className="text-xs h-7">Demurrage ({demurrage.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="waybill" className="mt-3">
          {waybills.length === 0 ? (
            <p className={cn("text-sm py-4", muted)}>No waybills generated yet</p>
          ) : (
            <div className="space-y-2">
              {waybills.map((w: any) => (
                <div key={w.id} className={cn("rounded-lg border p-3 text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className={cn("font-medium", text)}>Waybill #{w.waybillNumber || w.id}</span>
                    </div>
                    <Badge className={cn("text-xs", w.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400")}>
                      {w.status || "draft"}
                    </Badge>
                  </div>
                  <div className={cn("grid grid-cols-3 gap-2 mt-2 text-xs", muted)}>
                    <div>Car Type: <span className={text}>{w.carType || "---"}</span></div>
                    <div>Weight: <span className={text}>{w.weight || "---"}</span></div>
                    <div>Created: <span className={text}>{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "---"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-3">
          {events.length === 0 ? (
            <p className={cn("text-sm py-4", muted)}>No events recorded</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {events.slice(0, 15).map((evt: any) => (
                <div key={evt.id} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", isLight ? "hover:bg-white" : "hover:bg-slate-700/20")}>
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                    evt.eventType?.includes("delivered") || evt.eventType?.includes("settled") ? "bg-green-500" :
                    evt.eventType?.includes("transit") ? "bg-emerald-500" :
                    evt.eventType?.includes("cancel") ? "bg-red-500" :
                    "bg-blue-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className={cn("font-medium text-xs", text)}>{evt.eventType?.replace(/_/g, " ")}</span>
                    <span className={cn("text-xs ml-2", muted)}>{evt.description}</span>
                  </div>
                  <span className={cn("text-xs whitespace-nowrap flex-shrink-0", muted)}>
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : "---"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-3">
          <div className={cn("text-center py-6", muted)}>
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Documents attached to this shipment</p>
            <p className="text-xs mt-1">BOLs, hazmat papers, and customs docs appear here</p>
            <Link href="/rail/documents">
              <Button size="sm" variant="outline" className={cn("mt-3 h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
                Go to Documents <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="demurrage" className="mt-3">
          {demurrage.length === 0 ? (
            <p className={cn("text-sm py-4", muted)}>No demurrage charges</p>
          ) : (
            <div className="space-y-2">
              {demurrage.map((d: any) => (
                <div key={d.id} className={cn("rounded-lg border p-3 text-sm", isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className={cn("font-medium", text)}>Demurrage #{d.id}</span>
                    </div>
                    <span className="text-amber-500 font-bold">{fmt(parseFloat(d.totalCharge || "0"))}</span>
                  </div>
                  <div className={cn("grid grid-cols-3 gap-2 mt-2 text-xs", muted)}>
                    <div>Free Time: <span className={text}>{d.freeTimeHours || 48}h</span></div>
                    <div>Accrued: <span className={text}>{d.hoursAcrrued || "---"}h</span></div>
                    <div>Rate: <span className={text}>{d.dailyRate ? `$${d.dailyRate}/day` : "---"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Filters panel                                             */
/* ------------------------------------------------------------------ */
function FiltersPanel({ isLight, text, muted, filters, setFilters }: {
  isLight: boolean;
  text: string;
  muted: string;
  filters: { commodity: string; railroad: string; dateFrom: string; dateTo: string };
  setFilters: React.Dispatch<React.SetStateAction<typeof filters>>;
}) {
  const inputCls = cn("h-8 text-sm", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400");

  return (
    <div className={cn("rounded-lg border p-3 mb-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/40 border-slate-700/40")}>
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className={cn("text-sm font-medium", text)}>Filters</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className={cn("text-xs font-medium mb-1 block", muted)}>Commodity</label>
          <Input placeholder="Any commodity" value={filters.commodity} onChange={e => setFilters(f => ({ ...f, commodity: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={cn("text-xs font-medium mb-1 block", muted)}>Railroad</label>
          <select
            className={cn("w-full h-8 rounded-md border text-sm px-3", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white")}
            value={filters.railroad}
            onChange={e => setFilters(f => ({ ...f, railroad: e.target.value }))}
          >
            <option value="">All Railroads</option>
            <option value="BNSF">BNSF Railway</option>
            <option value="UP">Union Pacific</option>
            <option value="CSX">CSX Transportation</option>
            <option value="NS">Norfolk Southern</option>
            <option value="KCS">Kansas City Southern</option>
            <option value="CN">Canadian National</option>
          </select>
        </div>
        <div>
          <label className={cn("text-xs font-medium mb-1 block", muted)}>Date From</label>
          <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={cn("text-xs font-medium mb-1 block", muted)}>Date To</label>
          <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} className={inputCls} />
        </div>
      </div>
      <div className="flex justify-end mt-2">
        <Button size="sm" variant="ghost" className={cn("h-7 text-xs", muted)} onClick={() => setFilters({ commodity: "", railroad: "", dateFrom: "", dateTo: "" })}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Templates Tab                                             */
/* ------------------------------------------------------------------ */
function TemplatesTab({ isLight, text, muted, cardBg }: {
  isLight: boolean; text: string; muted: string; cardBg: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = MOCK_TEMPLATES.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.commodity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            className={cn("pl-8 h-8 w-64 text-sm", isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400")}
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
          <Bookmark className="w-3.5 h-3.5 mr-1" /> Save New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(t => (
          <Card key={t.id} className={cn("border transition-all hover:scale-[1.01]", cardBg)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("font-medium text-sm", text)}>{t.name}</div>
                <Badge className={cn("text-xs", isLight ? "bg-amber-50 text-amber-700" : "bg-amber-500/10 text-amber-400")}>
                  {t.timesUsed}x
                </Badge>
              </div>
              <div className={cn("text-xs space-y-1.5", muted)}>
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {t.originYard} <ArrowRight className="w-3 h-3" /> {t.destYard}</div>
                <div className="flex items-center gap-1.5"><Package className="w-3 h-3" /> {t.commodity} (STCC: {t.stccCode})</div>
                <div className="flex items-center gap-1.5"><Train className="w-3 h-3" /> {t.carCount} {t.carType}s — {t.weight.toLocaleString()} tons</div>
                <div className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> {t.railroad}</div>
                <div className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> Last used: {t.lastUsed}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link href="/rail/shipments/create" className="flex-1">
                  <Button size="sm" className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                    <Copy className="w-3 h-3 mr-1" /> Use Template
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className={cn("h-7 text-xs", isLight ? "border-slate-300" : "border-slate-600 text-slate-300")}>
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className={cn("text-center py-12", muted)}>
          <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No templates match your search</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Shipment List Tab                                         */
/* ------------------------------------------------------------------ */
function ShipmentListTab({ statusFilter, isLight, text, muted, cardBg, search, filters }: {
  statusFilter: string[];
  isLight: boolean;
  text: string;
  muted: string;
  cardBg: string;
  search: string;
  filters: { commodity: string; railroad: string; dateFrom: string; dateTo: string };
}) {
  const shipmentsQuery = trpc.railShipments.getRailShipments.useQuery({
    limit: 100,
    startDate: filters.dateFrom || undefined,
    endDate: filters.dateTo || undefined,
  });

  const allShipments = shipmentsQuery.data?.shipments || [];

  const filtered = useMemo(() => {
    return allShipments.filter((s: any) => {
      if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
      if (search && !s.shipmentNumber?.toLowerCase().includes(search.toLowerCase()) && !s.commodity?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.commodity && !s.commodity?.toLowerCase().includes(filters.commodity.toLowerCase())) return false;
      return true;
    });
  }, [allShipments, statusFilter, search, filters]);

  if (shipmentsQuery.isLoading) {
    return <SkeletonRows rows={8} cols={10} />;
  }

  return (
    <Card className={cn("border", cardBg)}>
      <CardContent className="p-0">
        {/* Table header */}
        <div className={cn("grid grid-cols-10 gap-3 px-4 py-2.5 text-xs font-medium border-b", isLight ? "text-slate-500 bg-slate-50 border-slate-200" : "text-slate-400 bg-slate-800/40 border-slate-700/40")}>
          <span>Shipment #</span>
          <span>Origin</span>
          <span>Destination</span>
          <span>Commodity</span>
          <span>STCC</span>
          <span>Car Type</span>
          <span>Cars</span>
          <span>Weight</span>
          <span>Rate</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className={cn("text-center py-12", muted)}>
            <Train className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No shipments found</p>
            <p className="text-xs mt-1">Try adjusting your filters or create a new shipment</p>
          </div>
        ) : (
          filtered.map((s: any) => (
            <ShipmentRow key={s.id} shipment={s} isLight={isLight} text={text} muted={muted} cardBg={cardBg} />
          ))
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className={cn("px-4 py-2 text-xs border-t", isLight ? "text-slate-400 border-slate-200 bg-slate-50" : "text-slate-500 border-slate-700/40 bg-slate-800/20")}>
            Showing {filtered.length} of {shipmentsQuery.data?.total || 0} shipments
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function RailShipperShipments() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ commodity: "", railroad: "", dateFrom: "", dateTo: "" });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* Style tokens */
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  const statusFilter = tab === "active" ? ACTIVE_STATUSES : tab === "pending" ? PENDING_STATUSES : tab === "completed" ? COMPLETED_STATUSES : [];

  const handleExport = () => {
    toast.success("Export started. CSV will download shortly.");
  };

  const handleReport = () => {
    toast.success("Generating shipment report...");
  };

  return (
    <div className={cn("min-h-screen p-6 space-y-5", bg)}>
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", isLight ? "bg-blue-50" : "bg-blue-500/10")}>
            <Train className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Rail Shipments</h1>
            <p className={cn("text-sm", muted)}>Manage all your rail freight shipments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-9", showFilters ? "bg-blue-500/10 border-blue-500/30 text-blue-500" : (isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50"))}
          >
            <Filter className="w-4 h-4 mr-1" /> Filters {showFilters ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className={cn("h-9", isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50")}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleReport} className={cn("h-9", isLight ? "border-slate-300" : "border-slate-600 text-slate-300 hover:bg-slate-700/50")}>
            <BarChart3 className="w-4 h-4 mr-1" /> Report
          </Button>
          <Link href="/rail/shipments/create">
            <Button className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Create Shipment
            </Button>
          </Link>
        </div>
      </div>

      {/* ---- Filters ---- */}
      {showFilters && <FiltersPanel isLight={isLight} text={text} muted={muted} filters={filters} setFilters={setFilters as any} />}

      {/* ---- Search ---- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          className={cn("pl-9 h-10", isLight ? "bg-white border-slate-300" : "bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-400")}
          placeholder="Search by shipment #, commodity, origin, destination..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ---- Tabs ---- */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn(isLight ? "bg-slate-100" : "bg-slate-800/60")}>
          <TabsTrigger value="active" className="text-sm">Active</TabsTrigger>
          <TabsTrigger value="pending" className="text-sm">Pending</TabsTrigger>
          <TabsTrigger value="completed" className="text-sm">Completed</TabsTrigger>
          <TabsTrigger value="templates" className="text-sm">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <ShipmentListTab statusFilter={ACTIVE_STATUSES} isLight={isLight} text={text} muted={muted} cardBg={cardBg} search={search} filters={filters} />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <ShipmentListTab statusFilter={PENDING_STATUSES} isLight={isLight} text={text} muted={muted} cardBg={cardBg} search={search} filters={filters} />
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <ShipmentListTab statusFilter={COMPLETED_STATUSES} isLight={isLight} text={text} muted={muted} cardBg={cardBg} search={search} filters={filters} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab isLight={isLight} text={text} muted={muted} cardBg={cardBg} />
        </TabsContent>
      </Tabs>

      {/* ---- Summary Stats Footer ---- */}
      <ShipmentSummaryStats isLight={isLight} text={text} muted={muted} cardBg={cardBg} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SECTION: Summary Statistics Footer                                 */
/* ------------------------------------------------------------------ */
function ShipmentSummaryStats({ isLight, text, muted, cardBg }: {
  isLight: boolean; text: string; muted: string; cardBg: string;
}) {
  const shipmentsQuery = trpc.railShipments.getRailShipments.useQuery({ limit: 200 });
  const allShipments = shipmentsQuery.data?.shipments || [];

  const activeCount = allShipments.filter((s: any) => ACTIVE_STATUSES.includes(s.status)).length;
  const pendingCount = allShipments.filter((s: any) => PENDING_STATUSES.includes(s.status)).length;
  const completedCount = allShipments.filter((s: any) => COMPLETED_STATUSES.includes(s.status)).length;
  const totalCars = allShipments.reduce((sum: number, s: any) => sum + (s.numberOfCars || 1), 0);
  const totalWeight = allShipments.reduce((sum: number, s: any) => sum + (s.weight ? Number(s.weight) : 0), 0);
  const totalRate = allShipments.reduce((sum: number, s: any) => sum + (s.rate ? parseFloat(s.rate) : 0), 0);

  const commodities = new Set(allShipments.map((s: any) => s.commodity).filter(Boolean));
  const carTypes = new Set(allShipments.map((s: any) => s.carType).filter(Boolean));

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", text)}>
          <BarChart3 className="w-5 h-5 text-cyan-400" /> Shipment Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shipmentsQuery.isLoading ? (
          <SkeletonRows rows={2} cols={6} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <StatBox label="Active" value={activeCount} color="text-emerald-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Pending" value={pendingCount} color="text-yellow-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Completed" value={completedCount} color="text-green-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Total Cars" value={totalCars} color="text-blue-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Total Weight" value={`${(totalWeight / 1000).toFixed(0)}k tons`} color="text-purple-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Total Value" value={fmt(totalRate)} color="text-amber-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Commodities" value={commodities.size} color="text-teal-500" isLight={isLight} text={text} muted={muted} />
            <StatBox label="Car Types" value={carTypes.size} color="text-indigo-500" isLight={isLight} text={text} muted={muted} />
          </div>
        )}

        {/* Top Commodities breakdown */}
        {!shipmentsQuery.isLoading && allShipments.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: isLight ? "#e2e8f0" : "rgba(100,116,139,0.2)" }}>
            <div className={cn("text-xs font-medium mb-2", muted)}>Top Commodities</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(commodities).slice(0, 10).map((c: any) => {
                const count = allShipments.filter((s: any) => s.commodity === c).length;
                return (
                  <Badge key={c} variant="outline" className={cn("text-xs", isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300")}>
                    {c} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Status Changes */}
        {!shipmentsQuery.isLoading && allShipments.length > 0 && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: isLight ? "#e2e8f0" : "rgba(100,116,139,0.2)" }}>
            <div className={cn("text-xs font-medium mb-2", muted)}>Recent Status Breakdown</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                allShipments.reduce((acc: Record<string, number>, s: any) => {
                  acc[s.status] = (acc[s.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <Badge key={status} className={cn("text-xs", STATUS_COLORS[status] || "bg-slate-500/20 text-slate-400")}>
                  {status.replace(/_/g, " ")} ({count as number})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Stat box                                                   */
/* ------------------------------------------------------------------ */
function StatBox({ label, value, color, isLight, text, muted }: {
  label: string;
  value: string | number;
  color: string;
  isLight: boolean;
  text: string;
  muted: string;
}) {
  return (
    <div className="text-center">
      <div className={cn("text-xl font-bold", color)}>{value}</div>
      <div className={cn("text-xs", muted)}>{label}</div>
    </div>
  );
}
