/**
 * INDUSTRY PROFILES PAGE (Phase 4 — Tasks 3.2.1-3.3.1)
 * Foundation system + Pharmaceutical, Radioactive, Explosives, Gov/Military,
 * + 10 niche vertical configurations
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Factory, Shield, Pill, Atom, Bomb, ShieldCheck,
  Flame, Snowflake, Truck, Leaf, Apple, Globe2,
  Car, FlaskConical, Droplets, ToggleLeft, ToggleRight,
  CheckCircle, AlertTriangle, FileText, DollarSign, ChevronRight
} from "lucide-react";

export default function IndustryProfiles() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const profilesQuery = (trpc as any).industryProfile?.getAll?.useQuery?.() || { data: [], refetch: () => {} };
  const detailQuery = (trpc as any).industryProfile?.getById?.useQuery?.(
    { profileId: selectedProfile || "" },
    { enabled: !!selectedProfile }
  ) || { data: null };
  const toggleMutation = (trpc as any).industryProfile?.toggle?.useMutation?.() || { mutateAsync: async () => ({}), isPending: false };

  const profiles: any[] = Array.isArray(profilesQuery.data) ? profilesQuery.data : [];
  const detail = detailQuery.data;

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const iconMap: Record<string, React.ReactNode> = {
    pharmaceutical: <Pill className="w-5 h-5" />,
    radioactive: <Atom className="w-5 h-5" />,
    explosives: <Bomb className="w-5 h-5" />,
    government_military: <ShieldCheck className="w-5 h-5" />,
    flammable_liquids: <Flame className="w-5 h-5" />,
    cold_chain: <Snowflake className="w-5 h-5" />,
    oversize_heavy: <Truck className="w-5 h-5" />,
    environmental_waste: <Leaf className="w-5 h-5" />,
    food_beverage: <Apple className="w-5 h-5" />,
    cross_border_usmca: <Globe2 className="w-5 h-5" />,
    automotive_parts: <Car className="w-5 h-5" />,
    oxidizers: <FlaskConical className="w-5 h-5" />,
    corrosives: <Droplets className="w-5 h-5" />,
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleMutation.mutateAsync({ profileId: id, enabled: !enabled });
      profilesQuery.refetch?.();
      toast.success(`Profile ${!enabled ? "enabled" : "disabled"}`);
    } catch { toast.error("Failed to toggle profile"); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Industry Profiles</h1>
        <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>
          Vertical-specific compliance rules, certifications, document templates & pricing multipliers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile List */}
        <div className="lg:col-span-1 space-y-2">
          {profiles.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedProfile(p.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                selectedProfile === p.id
                  ? "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30"
                  : L ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
              )}
            >
              <div className={cn("p-2 rounded-lg flex-shrink-0", p.enabled ? "bg-[#1473FF]/10 text-[#1473FF]" : "bg-slate-200/50 text-slate-400")}>
                {iconMap[p.id] || <Factory className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", L ? "text-slate-800" : "text-white")}>{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[10px]", L ? "text-slate-400" : "text-slate-500")}>{p.ruleCount} rules · {p.certCount} certs · {p.docCount} docs</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge className={cn("text-[9px]", p.pricingMultiplier > 1.5 ? "bg-amber-500/15 text-amber-500" : "bg-green-500/15 text-green-500")}>×{p.pricingMultiplier}</Badge>
                {p.enabled ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
              </div>
            </button>
          ))}
        </div>

        {/* Profile Detail */}
        <div className="lg:col-span-2">
          {!selectedProfile ? (
            <Card className={cc}>
              <CardContent className="py-16 text-center">
                <Factory className={cn("w-12 h-12 mx-auto mb-3", L ? "text-slate-300" : "text-slate-600")} />
                <p className={cn("font-medium text-lg", L ? "text-slate-600" : "text-slate-300")}>Select a Profile</p>
                <p className={cn("text-sm mt-1", L ? "text-slate-400" : "text-slate-500")}>Choose an industry profile to view compliance rules, certifications, and document templates</p>
              </CardContent>
            </Card>
          ) : detail ? (
            <div className="space-y-4">
              {/* Header */}
              <Card className={cn(cc, "overflow-hidden")}>
                <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#1473FF]/10 text-[#1473FF]">{iconMap[detail.id] || <Factory className="w-6 h-6" />}</div>
                      <div>
                        <h2 className={cn("text-xl font-bold", L ? "text-slate-800" : "text-white")}>{detail.name}</h2>
                        <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>v{detail.version}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={detail.enabled ? "outline" : "default"}
                      className="rounded-xl"
                      onClick={() => handleToggle(detail.id, detail.enabled)}
                    >
                      {detail.enabled ? <><ToggleRight className="w-4 h-4 mr-1 text-green-500" />Enabled</> : <><ToggleLeft className="w-4 h-4 mr-1" />Disabled</>}
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {detail.hazmatClasses?.map((c: string) => <Badge key={c} variant="outline" className="text-[10px]">Class {c}</Badge>)}
                    <Badge className="bg-[#1473FF]/10 text-[#1473FF] text-[10px]">×{detail.pricingMultiplier} pricing</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Rules */}
              <Card className={cc}>
                <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Shield className="w-5 h-5 text-[#1473FF]" />Compliance Rules ({detail.rules?.length || 0})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(detail.rules || []).map((rule: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-3 p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      {rule.s === "critical" ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      <p className={cn("text-sm", L ? "text-slate-700" : "text-slate-300")}>{rule.r?.replace(/_/g, " ")}</p>
                      <Badge className={cn("ml-auto text-[9px]", rule.s === "critical" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-500")}>{rule.s}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className={cc}>
                <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><ShieldCheck className="w-5 h-5 text-[#1473FF]" />Required Certifications</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {(detail.certs || []).map((cert: string) => (
                      <Badge key={cert} variant="outline" className="px-3 py-1.5 text-xs">{cert.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Document Templates */}
              <Card className={cc}>
                <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><FileText className="w-5 h-5 text-[#1473FF]" />Document Templates</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(detail.docs || []).map((doc: string) => (
                    <div key={doc} className={cn("flex items-center justify-between p-2.5 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className={cn("text-sm", L ? "text-slate-700" : "text-slate-300")}>{doc.replace(/_/g, " ")}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Regulatory Integrations */}
              <Card className={cc}>
                <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Globe2 className="w-5 h-5 text-[#1473FF]" />Regulatory Integrations</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {(detail.integrations || []).map((api: string) => (
                      <Badge key={api} className="bg-[#1473FF]/10 text-[#1473FF] px-3 py-1.5 text-xs">{api}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className={cc}><CardContent className="py-8 text-center"><p className={cn("text-sm", L ? "text-slate-400" : "text-slate-500")}>Loading profile...</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
