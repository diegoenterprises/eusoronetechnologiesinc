import { useState, useCallback, useRef, useEffect, DragEvent } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CalendarDays, ChevronLeft, ChevronRight, GripVertical,
  Truck, AlertTriangle, Shield, Clock, MapPin, Package,
  Sparkles, RefreshCw, Search, Zap, X, User, ChevronUp, ChevronDown,
} from "lucide-react";

/* ── Dark-themed Mini Calendar ── */
function MiniCalendar({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value + "T12:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDate(new Date());
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const navMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewDate({ year: y, month: m });
  };

  const selectDay = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(d);
    onClose();
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-white/[0.1] bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-200">{monthLabel}</span>
        <div className="flex gap-1">
          <button onClick={() => navMonth(-1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.08] text-slate-400"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => navMonth(1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.08] text-slate-400"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-500 mb-1">
        {["S","M","T","W","T","F","S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day, i) => {
          if (!day) return <span key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === value;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={i}
              onClick={() => selectDay(day)}
              className={cn(
                "w-8 h-7 rounded-md text-xs font-medium transition-all",
                isSelected ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30" :
                isToday ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30" :
                "text-slate-300 hover:bg-white/[0.08]"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
        <button onClick={() => { onChange(formatDate(new Date())); onClose(); }} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium">Today</button>
        <button onClick={() => { onChange(""); onClose(); }} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatLocation(loc: any): string {
  if (!loc) return "—";
  return [loc.city, loc.state].filter(Boolean).join(", ") || "—";
}

function hosColor(minutes: number): string {
  if (minutes >= 480) return "bg-green-500";
  if (minutes >= 240) return "bg-yellow-500";
  return "bg-red-500";
}

function hosLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

interface SlotLoad {
  loadNumber: string;
  pickupLocation: string;
  deliveryLocation: string;
  hazmatClass?: string;
  cargoType?: string;
  rate?: number | string;
}

interface SlotRow {
  slotIndex: number;
  slotId?: string;
  loadId?: string;
  load?: SlotLoad;
}

interface DriverRow {
  driverId: number;
  driverName: string;
  status: string;
  hazmatEndorsement?: boolean;
  hasTwic?: boolean;
  totalLoads: number;
  hosRemaining: number;
  slots: SlotRow[];
}

export default function DispatchPlanner() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [search, setSearch] = useState("");
  const [cargoFilter, setCargoFilter] = useState<string>("");
  const [hazmatOnly, setHazmatOnly] = useState(false);
  const [draggingLoadId, setDraggingLoadId] = useState<number | null>(null);
  const [suggestLoadId, setSuggestLoadId] = useState<number | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const utils = (trpc as any).useUtils?.() || (trpc as any).useContext?.();

  // Board query
  const boardQuery = (trpc as any).dispatchPlanner.getBoard.useQuery({ date });
  const board = boardQuery.data as any;

  // Auto-suggest query
  const suggestQuery = (trpc as any).dispatchPlanner.autoSuggest.useQuery(
    { loadId: suggestLoadId! },
    { enabled: !!suggestLoadId }
  );

  // Mutations
  const assignMut = (trpc as any).dispatchPlanner.assignLoad.useMutation({
    onSuccess: () => {
      toast.success("Load assigned");
      try { utils?.dispatchPlanner?.getBoard?.invalidate?.({ date }); } catch {}
      boardQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message || "Assignment failed"),
  });

  const unassignMut = (trpc as any).dispatchPlanner.unassignLoad.useMutation({
    onSuccess: () => {
      toast.success("Load unassigned");
      try { utils?.dispatchPlanner?.getBoard?.invalidate?.({ date }); } catch {}
      boardQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message || "Unassign failed"),
  });

  // Date navigation
  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(formatDate(d));
  };

  // Drag handlers
  const onDragStart = useCallback((e: DragEvent, loadId: number) => {
    e.dataTransfer.setData("text/plain", String(loadId));
    e.dataTransfer.effectAllowed = "move";
    setDraggingLoadId(loadId);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingLoadId(null);
  }, []);

  const onDrop = useCallback((e: DragEvent, driverId: number, slotIndex: number) => {
    e.preventDefault();
    const loadId = parseInt(e.dataTransfer.getData("text/plain"));
    if (!loadId) return;
    setDraggingLoadId(null);
    assignMut.mutate({ driverId, date, slotIndex, loadId });
  }, [date, assignMut]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Filter unassigned loads
  const filteredLoads = (board?.unassignedLoads || []).filter((l: any) => {
    if (search) {
      const q = search.toLowerCase();
      const matchNumber = l.loadNumber?.toLowerCase().includes(q);
      const matchPickup = formatLocation(l.pickupLocation).toLowerCase().includes(q);
      const matchDel = formatLocation(l.deliveryLocation).toLowerCase().includes(q);
      if (!matchNumber && !matchPickup && !matchDel) return false;
    }
    if (cargoFilter && l.cargoType !== cargoFilter) return false;
    if (hazmatOnly && !l.hazmatClass) return false;
    return true;
  });

  const displayDate = new Date(date + "T12:00:00");
  const isToday = formatDate(new Date()) === date;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-bold">Dispatch Planner</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400" onClick={() => changeDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            className={cn(
              "px-3 py-1 text-sm font-medium rounded-md border transition-all",
              isToday ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/[0.08] text-white"
            )}
            onClick={() => setDate(formatDate(new Date()))}
          >
            {displayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400" onClick={() => changeDate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="relative">
            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={cn(
                "h-7 px-2.5 text-xs rounded-md border transition-all flex items-center gap-1.5",
                calendarOpen ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.06]"
              )}
            >
              <CalendarDays className="w-3 h-3" />
              {date.replace(/-/g, "/")}
            </button>
            {calendarOpen && (
              <MiniCalendar
                value={date}
                onChange={(d) => setDate(d || formatDate(new Date()))}
                onClose={() => setCalendarOpen(false)}
              />
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-400" onClick={() => boardQuery.refetch()}>
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1", boardQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL — Unassigned Loads */}
        <div className="w-[380px] shrink-0 border-r border-white/[0.06] flex flex-col bg-slate-900/30">
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-orange-400" />
                Unassigned Loads
                <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[10px] ml-1">
                  {filteredLoads.length}
                </Badge>
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search loads..."
                className="h-7 pl-7 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded border transition-all",
                  !cargoFilter ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                )}
                onClick={() => setCargoFilter("")}
              >All</button>
              {["hazmat", "petroleum", "general", "refrigerated", "chemicals"].map(c => (
                <button
                  key={c}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded border transition-all capitalize",
                    cargoFilter === c ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400" : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                  )}
                  onClick={() => setCargoFilter(c === cargoFilter ? "" : c)}
                >{c}</button>
              ))}
              <button
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded border transition-all",
                  hazmatOnly ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                )}
                onClick={() => setHazmatOnly(!hazmatOnly)}
              >
                <AlertTriangle className="w-3 h-3 inline mr-0.5" />HazMat
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {boardQuery.isLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500 text-xs">Loading loads...</div>
            ) : filteredLoads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
                <Package className="w-8 h-8 mb-2 opacity-30" />
                No unassigned loads for this date
              </div>
            ) : (
              filteredLoads.map((load: any) => (
                <div
                  key={load.id}
                  draggable
                  onDragStart={e => onDragStart(e, load.id)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "p-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all group",
                    draggingLoadId === load.id
                      ? "border-cyan-500/50 bg-cyan-500/10 opacity-50"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                      {load.loadNumber}
                    </span>
                    <div className="flex gap-1">
                      {load.hazmatClass && (
                        <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px] px-1">
                          HazMat {load.hazmatClass}
                        </Badge>
                      )}
                      <Badge className="bg-slate-700 text-slate-300 border-0 text-[9px] px-1 capitalize">
                        {load.cargoType}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                    <MapPin className="w-3 h-3 text-green-400 shrink-0" />
                    <span className="truncate">{formatLocation(load.pickupLocation)}</span>
                    <span className="text-slate-600 mx-0.5">→</span>
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="truncate">{formatLocation(load.deliveryLocation)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    {load.distance && <span>{Number(load.distance).toFixed(0)} mi</span>}
                    {load.weight && <span>{Number(load.weight).toLocaleString()} lbs</span>}
                    {load.rate && <span className="text-green-400 font-medium">${Number(load.rate).toLocaleString()}</span>}
                    <button
                      className="ml-auto text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                      onClick={() => setSuggestLoadId(suggestLoadId === load.id ? null : load.id)}
                    >
                      <Sparkles className="w-3 h-3" />Suggest
                    </button>
                  </div>

                  {/* Auto-suggest panel */}
                  {suggestLoadId === load.id && suggestQuery.data && (
                    <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-1">
                      <div className="text-[10px] text-purple-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />AI Suggestions
                        <button className="ml-auto text-slate-500 hover:text-slate-300" onClick={() => setSuggestLoadId(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {suggestQuery.data.suggestedDrivers.slice(0, 5).map((s: any) => (
                        <div key={s.driverId} className="flex items-center gap-2 text-[10px] py-0.5">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                            s.score >= 70 ? "bg-green-500/20 text-green-400" :
                            s.score >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          )}>{s.score}</div>
                          <span className="text-white">{s.driverName}</span>
                          <span className="text-slate-500 truncate flex-1">{s.matchReasons.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Driver Timeline */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 border-b border-white/[0.06] bg-slate-900/30 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                Driver Timelines
                <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-[10px] ml-1">
                  {board?.drivers?.length || 0} drivers
                </Badge>
              </h2>
              <div className="text-[10px] text-slate-500">
                Drag loads from left panel onto driver slots
              </div>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {boardQuery.isLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading drivers...</div>
            ) : !board?.drivers?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                <User className="w-10 h-10 mb-3 opacity-30" />
                No drivers found for your company
              </div>
            ) : (
              board.drivers.map((driver: DriverRow) => (
                <Card
                  key={driver.driverId}
                  className="bg-white/[0.02] border-white/[0.06] p-0 overflow-hidden"
                >
                  {/* Driver header */}
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.04] bg-white/[0.01]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {driver.driverName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{driver.driverName}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span className={cn(
                          "px-1 py-0.5 rounded text-[9px] font-medium capitalize",
                          driver.status === "available" ? "bg-green-500/20 text-green-400" :
                          driver.status === "on_load" ? "bg-blue-500/20 text-blue-400" :
                          "bg-slate-700 text-slate-400"
                        )}>{driver.status.replace("_", " ")}</span>
                        {driver.hazmatEndorsement && (
                          <span className="text-orange-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" />HazMat
                          </span>
                        )}
                        {driver.hasTwic && (
                          <span className="text-blue-400 flex items-center gap-0.5">
                            <Shield className="w-3 h-3" />TWIC
                          </span>
                        )}
                        <span className="text-slate-500">{driver.totalLoads} loads completed</span>
                      </div>
                    </div>

                    {/* HOS bar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", hosColor(driver.hosRemaining))}
                          style={{ width: `${Math.min(100, (driver.hosRemaining / 660) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 w-12 text-right">{hosLabel(driver.hosRemaining)}</span>
                    </div>
                  </div>

                  {/* Slot row */}
                  <div className="flex gap-2 p-2 overflow-x-auto">
                    {driver.slots.map((slot) => (
                      <div
                        key={slot.slotIndex}
                        onDragOver={onDragOver}
                        onDrop={e => onDrop(e, driver.driverId, slot.slotIndex)}
                        className={cn(
                          "w-48 min-w-[192px] h-24 rounded-lg border-2 border-dashed transition-all flex flex-col",
                          slot.loadId
                            ? "border-solid border-cyan-500/30 bg-cyan-500/5"
                            : draggingLoadId
                              ? "border-cyan-500/40 bg-cyan-500/5 animate-pulse"
                              : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12]",
                        )}
                      >
                        {slot.load ? (
                          <div className="p-2 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-semibold text-cyan-400 truncate">
                                {slot.load.loadNumber}
                              </span>
                              <button
                                className="text-slate-500 hover:text-red-400 transition-colors"
                                onClick={() => slot.slotId && unassignMut.mutate({ slotId: slot.slotId })}
                                title="Unassign"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              {formatLocation(slot.load.pickupLocation)} → {formatLocation(slot.load.deliveryLocation)}
                            </div>
                            <div className="mt-auto flex items-center gap-1.5 text-[9px]">
                              {slot.load.hazmatClass && (
                                <span className="text-red-400">HM-{slot.load.hazmatClass}</span>
                              )}
                              <span className="text-slate-500 capitalize">{slot.load.cargoType}</span>
                              {slot.load.rate && (
                                <span className="text-green-400 ml-auto">${Number(slot.load.rate).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-[10px]">
                            <Zap className="w-4 h-4 mb-0.5 opacity-30" />
                            Slot {slot.slotIndex + 1}
                            {draggingLoadId && (
                              <span className="text-cyan-500 mt-0.5 font-medium">Drop here</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
