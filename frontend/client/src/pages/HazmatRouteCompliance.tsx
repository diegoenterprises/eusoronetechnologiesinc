/**
 * HAZMAT ROUTE COMPLIANCE PAGE
 * Driver-facing hazmat route compliance verification screen.
 * Pre-trip route compliance checker that validates the planned
 * route against hazmat restrictions, permits, tunnel codes,
 * and preferred route requirements before departure.
 * Per 49 CFR 397 and FHWA routing guidelines.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Navigation, CheckCircle, AlertTriangle, XCircle, Shield,
  MapPin, Clock, Truck, ChevronRight, RefreshCw, Send
} from "lucide-react";

type ComplianceCheck = {
  id: string;
  category: string;
  item: string;
  status: "pass" | "fail" | "warning" | "pending";
  detail: string;
};

const SAMPLE_CHECKS: ComplianceCheck[] = [
  { id: "c1", category: "Route Designation", item: "NRHM preferred route verified", status: "pass", detail: "Route follows state-designated NRHM preferred route through all jurisdictions." },
  { id: "c2", category: "Route Designation", item: "Shortest practical distance analysis", status: "pass", detail: "Route is within 5% of shortest distance between origin and destination using preferred routes." },
  { id: "c3", category: "Tunnel Restrictions", item: "No prohibited tunnel crossings", status: "pass", detail: "Route avoids all Category E tunnels. No tunnel restrictions apply to this hazard class." },
  { id: "c4", category: "Tunnel Restrictions", item: "Tunnel category compatibility", status: "pass", detail: "Hazard class 3 (Flammable Liquid) is permitted through Category C tunnels on this route." },
  { id: "c5", category: "Bridge/Weight Limits", item: "Bridge weight limits verified", status: "warning", detail: "US-59 bridge at mile marker 412 has posted limit of 80,000 lbs. Verify loaded weight." },
  { id: "c6", category: "Bridge/Weight Limits", item: "Height clearances adequate", status: "pass", detail: "All bridge clearances exceed 14ft. No low-clearance structures on route." },
  { id: "c7", category: "City/Local Restrictions", item: "Municipal hazmat ordinances checked", status: "pass", detail: "No local hazmat restrictions in cities along this route." },
  { id: "c8", category: "City/Local Restrictions", item: "Time-of-day restrictions", status: "warning", detail: "Houston I-610 loop restricts bulk flammable 7-9 AM and 4-6 PM weekdays. Plan accordingly." },
  { id: "c9", category: "Permits & Documentation", item: "State permits valid", status: "pass", detail: "TX and LA state hazmat operating permits are current and on file." },
  { id: "c10", category: "Permits & Documentation", item: "Shipping papers match route", status: "pass", detail: "Emergency response information and 24-hour phone number verified on shipping papers." },
  { id: "c11", category: "Emergency Preparedness", item: "ERG guide available", status: "pass", detail: "2024 ERG available in cab. Guide 128 applicable for UN1267 Petroleum crude oil." },
  { id: "c12", category: "Emergency Preparedness", item: "Emergency contacts programmed", status: "pass", detail: "CHEMTREC, NRC, and carrier emergency numbers programmed in phone." },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pass: { label: "Pass", color: "text-green-500", bg: "bg-green-500/15", icon: <CheckCircle className="w-4 h-4" /> },
  fail: { label: "Fail", color: "text-red-500", bg: "bg-red-500/15", icon: <XCircle className="w-4 h-4" /> },
  warning: { label: "Warning", color: "text-yellow-500", bg: "bg-yellow-500/15", icon: <AlertTriangle className="w-4 h-4" /> },
  pending: { label: "Pending", color: "text-slate-400", bg: "bg-slate-500/15", icon: <Clock className="w-4 h-4" /> },
};

export default function HazmatRouteCompliance() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [acknowledged, setAcknowledged] = useState(false);

  const checks = SAMPLE_CHECKS;
  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const overallPass = failCount === 0;
  const categories = Array.from(new Set(checks.map((c) => c.category)));

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Route Compliance
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Pre-trip hazmat route compliance verification — 49 CFR 397
          </p>
        </div>
        <Badge className={cn(
          "rounded-full px-3 py-1 text-xs font-bold border",
          overallPass ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-red-500/15 text-red-500 border-red-500/30"
        )}>
          {overallPass ? "Route Compliant" : "Issues Found"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <CheckCircle className="w-5 h-5 text-green-400" />, bg: "bg-green-500/15", value: String(passCount), label: "Passed", color: "text-green-400" },
          { icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, bg: "bg-yellow-500/15", value: String(warnCount), label: "Warnings", color: "text-yellow-400" },
          { icon: <XCircle className="w-5 h-5 text-red-400" />, bg: "bg-red-500/15", value: String(failCount), label: "Failed", color: "text-red-400" },
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

      {/* Route Summary */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardContent className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: "Origin", v: "Midland, TX", icon: <MapPin className="w-3.5 h-3.5 text-green-500" /> },
              { l: "Destination", v: "Corpus Christi, TX", icon: <MapPin className="w-3.5 h-3.5 text-red-500" /> },
              { l: "Material", v: "UN1267 — Crude Oil", icon: <Truck className="w-3.5 h-3.5 text-orange-500" /> },
              { l: "Distance", v: "487 miles / ~8.5 hrs", icon: <Navigation className="w-3.5 h-3.5 text-blue-500" /> },
            ].map((d) => (
              <div key={d.l} className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
                <div className="flex items-center gap-1.5 mb-1">{d.icon}<p className={cn("text-[9px] uppercase tracking-wider font-medium", isLight ? "text-slate-400" : "text-slate-500")}>{d.l}</p></div>
                <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{d.v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance checks by category */}
      {categories.map((cat) => {
        const items = checks.filter((c) => c.category === cat);
        return (
          <Card key={cat} className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Shield className="w-4 h-4 text-[#1473FF]" /> {cat}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((check) => {
                const st = STATUS_CFG[check.status];
                return (
                  <div key={check.id} className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    check.status === "fail" ? (isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/20") :
                    check.status === "warning" ? (isLight ? "bg-yellow-50 border-yellow-200" : "bg-yellow-500/5 border-yellow-500/20") :
                    isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/30"
                  )}>
                    <div className={cn("p-1.5 rounded-md flex-shrink-0 mt-0.5", st.bg, st.color)}>{st.icon}</div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{check.item}</p>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>{check.detail}</p>
                    </div>
                    <Badge className={cn("text-[9px] border flex-shrink-0", st.bg, st.color, "border-current/20")}>{st.label}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Acknowledge */}
      {!acknowledged ? (
        <Button
          className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white border-0 rounded-xl text-base font-medium shadow-lg shadow-purple-500/20"
          onClick={() => { setAcknowledged(true); toast.success("Route compliance acknowledged — safe travels"); }}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Acknowledge Route Compliance
        </Button>
      ) : (
        <div className={cn("flex items-center gap-3 p-4 rounded-xl", isLight ? "bg-green-50 border border-green-200" : "bg-green-500/10 border border-green-500/20")}>
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className={cn("text-sm font-medium", isLight ? "text-green-700" : "text-green-400")}>Route compliance acknowledged — safe travels</p>
        </div>
      )}
    </div>
  );
}
