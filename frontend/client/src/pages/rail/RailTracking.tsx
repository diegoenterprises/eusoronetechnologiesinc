/**
 * RAIL TRACKING — V5 Multi-Modal
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MapPin, Search, TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export default function RailTracking() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [search, setSearch] = useState("");
  const tracking = trpc.railShipments.getRailTracking.useQuery({});
  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");
  const items = (tracking.data || []).filter((t: any) => !search || t.carNumber?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10"><MapPin className="w-6 h-6 text-blue-400" /></div>
        <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Rail Tracking</h1>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search by car number..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card className={cardBg}>
        <CardHeader><CardTitle className={cn("text-lg", isLight ? "text-slate-900" : "text-white")}>Active Railcars</CardTitle></CardHeader>
        <CardContent>
          {tracking.isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div> : items.length === 0 ? (
            <p className="text-sm text-center py-12 text-slate-500">No tracking data available</p>
          ) : (
            <div className="space-y-2">{items.map((t: any, i: number) => (
              <div key={i} className={cn("flex items-center justify-between p-3 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/20")}>
                <div className="flex items-center gap-3">
                  <TrainFront className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{t.carNumber || `Car #${i+1}`}</div>
                    <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{t.location || "Location pending"}</div>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400">{t.status || "tracking"}</Badge>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
