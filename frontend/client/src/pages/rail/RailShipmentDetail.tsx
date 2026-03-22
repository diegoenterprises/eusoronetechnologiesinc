/**
 * RAIL SHIPMENT DETAIL — V5 Multi-Modal
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { TrainFront, ArrowLeft, MapPin, Package, Clock, DollarSign, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useRoute, Link } from "wouter";
import { toast } from "sonner";

const STATUSES = ["requested","car_ordered","car_placed","loading","loaded","in_consist","in_transit","at_interchange","in_yard","spotted","unloading","empty_released","returned","delivered","invoiced","settled"];
const STATUS_COLORS: Record<string, string> = {
  requested: "bg-yellow-500/20 text-yellow-400", in_transit: "bg-emerald-500/20 text-emerald-400",
  delivered: "bg-green-500/20 text-green-400", settled: "bg-green-600/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function RailShipmentDetail() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, params] = useRoute("/rail/shipments/:id");
  const id = Number(params?.id);
  const detail = trpc.railShipments.getRailShipmentDetail.useQuery({ id }, { enabled: !!id });
  const updateStatus = trpc.railShipments.updateRailShipmentStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); detail.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const s = detail.data;

  if (detail.isLoading) return <div className={cn("min-h-screen p-6", bg)}><Skeleton className="h-96" /></div>;
  if (!s) return <div className={cn("min-h-screen p-6 flex items-center justify-center", bg)}><p className="text-slate-400">Shipment not found</p></div>;

  const currentIdx = STATUSES.indexOf(s.status || "requested");
  const nextStatus = currentIdx >= 0 && currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null;

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rail/shipments"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div className="p-2 rounded-lg bg-blue-500/10"><TrainFront className="w-6 h-6 text-blue-400" /></div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{s.shipmentNumber}</h1>
          <Badge className={STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400"}>{s.status?.replace(/_/g, " ")}</Badge>
        </div>
      </div>

      {/* Status Timeline */}
      <Card className={cn("border mb-6", cardBg)}>
        <CardHeader><CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>Status Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUSES.map((st, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={st} className="flex items-center">
                  <div className={cn("flex flex-col items-center min-w-[60px]")}>
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
                      active ? "bg-blue-500 border-blue-400 text-white" : done ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-700/30 border-slate-600 text-slate-500"
                    )}>{done ? <CheckCircle className="w-3 h-3" /> : i + 1}</div>
                    <span className={cn("text-[10px] mt-1 text-center leading-tight", active ? "text-blue-400 font-medium" : done ? "text-emerald-400" : "text-slate-500")}>{st.replace(/_/g, " ")}</span>
                  </div>
                  {i < STATUSES.length - 1 && <div className={cn("w-4 h-0.5 mt-[-12px]", done ? "bg-emerald-500" : "bg-slate-600")} />}
                </div>
              );
            })}
          </div>
          {nextStatus && s.status !== "cancelled" && (
            <Button size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus.mutate({ id, newStatus: nextStatus })} disabled={updateStatus.isPending}>
              Advance to: {nextStatus.replace(/_/g, " ")}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipment Info */}
        <Card className={cn("border", cardBg)}>
          <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Package className="w-4 h-4" /> Shipment Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[["Commodity", s.commodity], ["Car Type", s.carType?.replace(/_/g, " ")], ["# of Cars", s.numberOfCars], ["Weight", s.weight ? `${Number(s.weight).toLocaleString()} lbs` : "—"], ["Hazmat", s.hazmatClass || "None"]].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between"><span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span><span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{v || "—"}</span></div>
            ))}
          </CardContent>
        </Card>

        {/* Financial */}
        <Card className={cn("border", cardBg)}>
          <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><DollarSign className="w-4 h-4" /> Financial</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[["Rate", s.rate ? `$${Number(s.rate).toLocaleString()}` : "Pending"]].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between"><span className={isLight ? "text-slate-500" : "text-slate-400"}>{k}</span><span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{v}</span></div>
            ))}
            {(s.demurrage || []).length > 0 && (
              <div className="pt-2 border-t border-slate-700/30">
                <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Demurrage Charges</span>
                {(s.demurrage || []).map((d: any, i: number) => (
                  <div key={i} className="flex justify-between mt-1"><span className="text-slate-400">{d.chargeType}</span><span className="text-amber-400">${Number(d.totalCharge || 0).toLocaleString()}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events */}
        <Card className={cn("border lg:col-span-2", cardBg)}>
          <CardHeader><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}><Clock className="w-4 h-4" /> Event Log</CardTitle></CardHeader>
          <CardContent>
            {(s.events || []).length === 0 ? <p className="text-sm text-slate-500">No events recorded</p> : (
              <div className="space-y-2">
                {(s.events || []).map((e: any, i: number) => (
                  <div key={i} className={cn("flex items-start gap-3 p-2 rounded-lg", isLight ? "bg-slate-50" : "bg-slate-700/20")}>
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>{e.eventType?.replace(/_/g, " ")}</div>
                      <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{e.description} — {e.timestamp ? new Date(e.timestamp).toLocaleString() : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
