/**
 * VESSEL BOOKING DETAIL — V5 Multi-Modal
 * Full booking detail: status timeline, BOL, container tracking,
 * customs entry, demurrage/detention, settlement breakdown
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Ship,
  ArrowLeft,
  Package,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle,
  Shield,
  Container,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useRoute, Link } from "wouter";
import { toast } from "sonner";

const STATUSES = [
  "booking_requested",
  "booking_confirmed",
  "documentation",
  "container_released",
  "gate_in",
  "loaded_on_vessel",
  "departed",
  "in_transit",
  "transshipment",
  "arrived",
  "customs_hold",
  "customs_cleared",
  "discharged",
  "gate_out",
  "delivered",
  "invoiced",
  "settled",
];

const STATUS_COLORS: Record<string, string> = {
  booking_requested: "bg-yellow-500/20 text-yellow-400",
  in_transit: "bg-emerald-500/20 text-emerald-400",
  delivered: "bg-green-500/20 text-green-400",
  settled: "bg-green-600/20 text-green-300",
  customs_hold: "bg-red-500/20 text-red-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function VesselBookingDetail() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, params] = useRoute("/vessel/bookings/:id");
  const id = Number(params?.id);

  const detail = trpc.vesselShipments.getVesselShipmentDetail.useQuery(
    { id },
    { enabled: !!id }
  );
  const updateStatus = trpc.vesselShipments.updateVesselShipmentStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      detail.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn(
    "border",
    isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50"
  );
  const s = detail.data;

  if (detail.isLoading)
    return (
      <div className={cn("min-h-screen p-6", bg)}>
        <Skeleton className="h-96" />
      </div>
    );
  if (!s)
    return (
      <div className={cn("min-h-screen p-6 flex items-center justify-center", bg)}>
        <p className="text-slate-400">Booking not found</p>
      </div>
    );

  const currentIdx = STATUSES.indexOf(s.status || "booking_requested");
  const nextStatus =
    currentIdx >= 0 && currentIdx < STATUSES.length - 1
      ? STATUSES[currentIdx + 1]
      : null;

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vessel/bookings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Ship className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>
            {s.bookingNumber}
          </h1>
          <Badge className={STATUS_COLORS[s.status] || "bg-slate-500/20 text-slate-400"}>
            {s.status?.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* Status Timeline */}
      <Card className={cn("border mb-6", cardBg)}>
        <CardHeader>
          <CardTitle className={cn("text-sm", isLight ? "text-slate-900" : "text-white")}>
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {STATUSES.map((st, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={st} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[55px]">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2",
                        active
                          ? "bg-cyan-500 border-cyan-400 text-white"
                          : done
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "bg-slate-700/30 border-slate-600 text-slate-500"
                      )}
                    >
                      {done ? <CheckCircle className="w-2.5 h-2.5" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[8px] mt-1 text-center leading-tight",
                        active
                          ? "text-cyan-400 font-medium"
                          : done
                            ? "text-emerald-400"
                            : "text-slate-500"
                      )}
                    >
                      {st.replace(/_/g, " ")}
                    </span>
                  </div>
                  {i < STATUSES.length - 1 && (
                    <div
                      className={cn(
                        "w-3 h-0.5 mt-[-12px]",
                        done ? "bg-emerald-500" : "bg-slate-600"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {nextStatus && s.status !== "cancelled" && (
            <Button
              size="sm"
              className="mt-4 bg-cyan-600 hover:bg-cyan-700"
              onClick={() =>
                updateStatus.mutate({ id, newStatus: nextStatus })
              }
              disabled={updateStatus.isPending}
            >
              Advance to: {nextStatus.replace(/_/g, " ")}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Info */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle
              className={cn(
                "text-sm flex items-center gap-2",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              <Package className="w-4 h-4" /> Booking Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Cargo Type", s.cargoType?.replace(/_/g, " ")],
              ["Commodity", s.commodity],
              ["Containers", s.numberOfContainers],
              [
                "Weight",
                s.totalWeightKg
                  ? `${Number(s.totalWeightKg).toLocaleString()} kg`
                  : "—",
              ],
              [
                "Volume",
                s.totalVolumeCBM
                  ? `${Number(s.totalVolumeCBM).toLocaleString()} CBM`
                  : "—",
              ],
              ["Incoterms", s.incoterms],
              ["Freight Terms", s.freightTerms?.replace(/_/g, " ")],
              ["Hazmat", s.hazmatClass || "None"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between">
                <span className={isLight ? "text-slate-500" : "text-slate-400"}>
                  {k}
                </span>
                <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>
                  {v || "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial / Settlement */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle
              className={cn(
                "text-sm flex items-center gap-2",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              <DollarSign className="w-4 h-4" /> Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              [
                "Ocean Freight",
                s.oceanFreightRate
                  ? `$${Number(s.oceanFreightRate).toLocaleString()}`
                  : "Pending",
              ],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between">
                <span className={isLight ? "text-slate-500" : "text-slate-400"}>
                  {k}
                </span>
                <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>
                  {v}
                </span>
              </div>
            ))}
            {(s.demurrage || []).length > 0 && (
              <div className="pt-2 border-t border-slate-700/30">
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Demurrage &amp;
                  Detention
                </span>
                {(s.demurrage || []).map((d: any, i: number) => (
                  <div key={i} className="flex justify-between mt-1">
                    <span className="text-slate-400">{d.chargeType}</span>
                    <span className="text-amber-400">
                      ${Number(d.totalCharge || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customs Entry */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle
              className={cn(
                "text-sm flex items-center gap-2",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              <Shield className="w-4 h-4" /> Customs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(s.customsEntries || []).length === 0 ? (
              <p className="text-sm text-slate-500">No customs entries</p>
            ) : (
              <div className="space-y-2">
                {(s.customsEntries || []).map((c: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-700/20"
                    )}
                  >
                    <div>
                      <div className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>
                        Entry #{c.entryNumber || i + 1}
                      </div>
                      <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                        {c.entryType} — HTS: {c.htsCode || "—"}
                      </div>
                    </div>
                    <Badge
                      className={
                        c.status === "cleared"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : c.status === "hold"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                      }
                    >
                      {c.status || "pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill of Lading */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle
              className={cn(
                "text-sm flex items-center gap-2",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              <FileText className="w-4 h-4" /> Bill of Lading
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(s.billsOfLading || []).length === 0 ? (
              <p className="text-sm text-slate-500">No BOLs issued</p>
            ) : (
              <div className="space-y-2">
                {(s.billsOfLading || []).map((b: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      isLight ? "bg-slate-50" : "bg-slate-700/20"
                    )}
                  >
                    <div>
                      <div className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>
                        {b.bolNumber}
                      </div>
                      <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                        {b.bolType} — {b.shipper || ""}
                      </div>
                    </div>
                    <Badge
                      className={
                        b.surrendered
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/20 text-blue-400"
                      }
                    >
                      {b.surrendered ? "Surrendered" : "Active"}
                    </Badge>
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
