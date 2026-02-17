/**
 * TODAY SCHEDULE PAGE
 * Driver-facing daily schedule and task overview screen.
 * Shows today's loads, stops, appointments, HOS remaining,
 * and upcoming deadlines in a timeline format.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Clock, MapPin, Truck, CheckCircle, Calendar,
  RefreshCw, ChevronRight, Package, Navigation,
  AlertTriangle, Coffee
} from "lucide-react";

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  location: string;
  type: "pickup" | "delivery" | "break" | "inspection" | "fuel" | "appointment";
  status: "completed" | "current" | "upcoming";
  loadNumber?: string;
};

const SAMPLE_SCHEDULE: ScheduleItem[] = [
  { id: "s1", time: "06:00", title: "Pre-Trip Inspection", location: "Yard — Houston, TX", type: "inspection", status: "completed" },
  { id: "s2", time: "07:00", title: "Pickup — Crude Oil", location: "Permian Basin Terminal, Midland, TX", type: "pickup", status: "completed", loadNumber: "LD-4521" },
  { id: "s3", time: "10:30", title: "30-Min Break", location: "Rest Area — I-20 MM 312", type: "break", status: "completed" },
  { id: "s4", time: "11:00", title: "Fuel Stop", location: "Pilot Travel Center, Abilene, TX", type: "fuel", status: "current" },
  { id: "s5", time: "14:00", title: "Delivery — Crude Oil", location: "Refinery Gate 3, Corpus Christi, TX", type: "delivery", status: "upcoming", loadNumber: "LD-4521" },
  { id: "s6", time: "15:30", title: "Pickup — Diesel Fuel", location: "Refinery Loading Rack, Corpus Christi, TX", type: "pickup", status: "upcoming", loadNumber: "LD-4522" },
  { id: "s7", time: "19:00", title: "Delivery — Diesel", location: "Fuel Depot, San Antonio, TX", type: "delivery", status: "upcoming", loadNumber: "LD-4522" },
  { id: "s8", time: "20:00", title: "End of Day", location: "Overnight — San Antonio, TX", type: "break", status: "upcoming" },
];

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pickup: { icon: <Package className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-500/15" },
  delivery: { icon: <MapPin className="w-4 h-4" />, color: "text-green-500", bg: "bg-green-500/15" },
  break: { icon: <Coffee className="w-4 h-4" />, color: "text-orange-500", bg: "bg-orange-500/15" },
  inspection: { icon: <CheckCircle className="w-4 h-4" />, color: "text-purple-500", bg: "bg-purple-500/15" },
  fuel: { icon: <Truck className="w-4 h-4" />, color: "text-cyan-500", bg: "bg-cyan-500/15" },
  appointment: { icon: <Calendar className="w-4 h-4" />, color: "text-pink-500", bg: "bg-pink-500/15" },
};

export default function TodaySchedule() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const loadsQuery = (trpc as any).loads?.list?.useQuery?.({ limit: 5 }) || { data: [], isLoading: false, refetch: () => {} };
  const isLoading = loadsQuery.isLoading;

  const schedule = SAMPLE_SCHEDULE;
  const completed = schedule.filter((s) => s.status === "completed").length;
  const currentItem = schedule.find((s) => s.status === "current");
  const hoursRemaining = 6.5;

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Today&apos;s Schedule
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" className={cn("rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")} onClick={() => loadsQuery.refetch?.()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <CheckCircle className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: `${completed}/${schedule.length}`, label: "Completed", color: "text-green-400" },
              { icon: <Clock className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/15", value: `${hoursRemaining}h`, label: "HOS Left", color: "text-blue-400" },
              { icon: <Navigation className="w-5 h-5 text-purple-400" />, bg: "bg-purple-500/15", value: "287 mi", label: "Remaining", color: "text-purple-400" },
            ].map((s) => (
              <Card key={s.label} className={cn("rounded-xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", s.bg)}>{s.icon}</div>
                    <div>
                      <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* HOS Warning */}
          {hoursRemaining < 3 && (
            <div className={cn("flex items-center gap-3 p-4 rounded-xl border-2", isLight ? "bg-amber-50 border-amber-300" : "bg-amber-500/10 border-amber-500/30")}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <p className={cn("text-sm font-medium", isLight ? "text-amber-700" : "text-amber-300")}>
                Low HOS remaining — plan your 10-hour break soon
              </p>
            </div>
          )}

          {/* Timeline */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Calendar className="w-5 h-5 text-[#1473FF]" />
                Schedule Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {schedule.map((item, idx) => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.appointment;
                const isCurrent = item.status === "current";
                const isCompleted = item.status === "completed";
                const isLast = idx === schedule.length - 1;

                return (
                  <div key={item.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all",
                        isCurrent ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] border-transparent text-white shadow-lg shadow-blue-500/20" :
                        isCompleted ? `${cfg.bg} border-transparent ${cfg.color}` :
                        isLight ? "bg-white border-slate-200 text-slate-400" : "bg-slate-800/50 border-slate-700/30 text-slate-500"
                      )}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : cfg.icon}
                      </div>
                      {!isLast && (
                        <div className={cn(
                          "w-0.5 flex-1 my-1",
                          isCompleted ? "bg-green-500/30" : isLight ? "bg-slate-200" : "bg-slate-700"
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn(
                      "flex-1 pb-5",
                      isCurrent && "pb-6"
                    )}>
                      <div className={cn(
                        "p-4 rounded-xl border transition-all",
                        isCurrent
                          ? "ring-2 ring-[#1473FF]/30 " + (isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/5 border-blue-500/20")
                          : isCompleted
                            ? isLight ? "bg-green-50/50 border-green-200/50" : "bg-green-500/5 border-green-500/10"
                            : isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("text-sm font-bold", isCurrent ? "text-[#1473FF]" : isCompleted ? "text-green-600 line-through opacity-60" : isLight ? "text-slate-800" : "text-white")}>
                            {item.title}
                          </p>
                          <span className={cn("text-xs font-mono font-bold tabular-nums", isCurrent ? "text-[#1473FF]" : isLight ? "text-slate-400" : "text-slate-500")}>
                            {item.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{item.location}</p>
                        </div>
                        {item.loadNumber && (
                          <Badge className={cn("mt-2 text-[9px]", cfg.bg, cfg.color, "border-current/20")}>
                            {item.loadNumber}
                          </Badge>
                        )}
                        {isCurrent && (
                          <div className="mt-2">
                            <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-[10px]">
                              In Progress
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
