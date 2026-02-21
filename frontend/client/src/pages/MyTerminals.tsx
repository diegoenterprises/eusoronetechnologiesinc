/**
 * MY TERMINALS — Shipper/Marketer Terminal Access View
 * 
 * Shows which terminals this shipper/marketer has active partnerships with.
 * Enables supply chain awareness for load creation (origin/destination terminal).
 * 
 * Theme-aware | Jony Ive design | Platform standard
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Building2, MapPin, Droplets, Shield, Activity,
  CheckCircle, Lock, Clock
} from "lucide-react";

export default function MyTerminals() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const terminalsQuery = (trpc as any).supplyChain?.getMyTerminals?.useQuery?.(
    undefined,
    { staleTime: 30_000 }
  ) || { data: null, isLoading: false };

  const classQuery = (trpc as any).supplyChain?.getCompanyClassification?.useQuery?.(
    undefined,
    { staleTime: 60_000 }
  ) || { data: null, isLoading: false };

  const terminals = (terminalsQuery.data || []) as any[];
  const classification = classQuery.data as any;

  const cardCls = cn("rounded-2xl border transition-all", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-4 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const getTerminalTypeLabel = (type: string) => {
    const m: Record<string, string> = {
      refinery: "Refinery", storage: "Storage Facility", rack: "Rack Terminal",
      pipeline: "Pipeline Hub", blending: "Blending Facility", distribution: "Distribution Center",
      marine: "Marine Terminal", rail: "Rail Terminal",
    };
    return m[type] || type;
  };

  const getAccessIcon = (level: string) => {
    if (level === "full") return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    if (level === "limited") return <Lock className="w-3.5 h-3.5 text-amber-500" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          My Terminals
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Terminals where your company has active rack access or partnerships
        </p>
      </div>

      {/* Company Classification Banner */}
      {classification && (
        <Card className={cn(cardCls, "overflow-hidden")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-2 rounded-xl bg-purple-500/15">
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <span className={cn("text-sm font-semibold", isLight ? "text-slate-700" : "text-white")}>
                  {classification.name}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {classification.supplyChainRole && (
                    <Badge className={cn("text-[10px] border font-semibold", isLight ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-purple-500/20 text-purple-400 border-purple-500/30")}>
                      {classification.supplyChainRole}
                    </Badge>
                  )}
                  {classification.marketerType && (
                    <Badge className={cn("text-[10px] border font-semibold", isLight ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30")}>
                      {classification.marketerType} marketer
                    </Badge>
                  )}
                  {!classification.supplyChainRole && (
                    <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                      No supply chain classification set
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terminal Cards */}
      {terminalsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className={cardCls}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className={cn("h-6 w-40 rounded-lg", isLight ? "bg-slate-100" : "")} />
                <Skeleton className={cn("h-4 w-32 rounded-lg", isLight ? "bg-slate-100" : "")} />
                <Skeleton className={cn("h-4 w-24 rounded-lg", isLight ? "bg-slate-100" : "")} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : terminals.length === 0 ? (
        <Card className={cardCls}>
          <CardContent className="p-10 text-center">
            <Building2 className={cn("w-10 h-10 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
            <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
              No terminal partnerships yet
            </p>
            <p className={cn("text-xs mt-1", isLight ? "text-slate-400" : "text-slate-500")}>
              Contact terminal operators to establish rack access or loading agreements
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terminals.map((t: any) => (
            <Card key={t.partnerId} className={cn(cardCls, "hover:shadow-md transition-shadow")}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={cn("p-3 rounded-xl shrink-0", "bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15")}>
                    <Building2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("font-semibold", isLight ? "text-slate-800" : "text-white")}>
                      {t.terminalName} {t.terminalCode ? <span className={cn("text-xs font-normal", isLight ? "text-slate-400" : "text-slate-500")}>({t.terminalCode})</span> : ""}
                    </h3>
                    {t.terminalType && (
                      <Badge className={cn("text-[9px] border mt-1", isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-slate-700/50 text-slate-300 border-slate-600/30")}>
                        {getTerminalTypeLabel(t.terminalType)}
                      </Badge>
                    )}

                    <div className="mt-3 space-y-2">
                      {(t.terminalCity || t.terminalState) && (
                        <div className={cn("flex items-center gap-1.5 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          <MapPin className="w-3 h-3" />
                          {[t.terminalCity, t.terminalState].filter(Boolean).join(", ")}
                        </div>
                      )}
                      <div className={cn("flex items-center gap-1.5 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                        {getAccessIcon(t.rackAccessLevel || "scheduled")}
                        <span className="font-medium">{(t.rackAccessLevel || "scheduled").toUpperCase()}</span> rack access
                      </div>
                      {t.productsHandled?.length > 0 && (
                        <div className={cn("flex items-center gap-1.5 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          <Droplets className="w-3 h-3" />
                          {t.productsHandled.join(", ")}
                        </div>
                      )}
                      {t.monthlyVolumeCommitment > 0 && (
                        <div className={cn("flex items-center gap-1.5 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          <Shield className="w-3 h-3" />
                          {Number(t.monthlyVolumeCommitment).toLocaleString()} bbl/mo commitment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
