/**
 * INDUSTRY VERTICALS — Comprehensive Dashboard
 * Vertical selector, compliance, equipment, pricing, seasonal trends,
 * carrier certifications, analytics, and hazmat segregation.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  Droplets, AlertTriangle, Truck, Snowflake, Package, Container,
  Layers, Weight, Beef, Mountain, Home, Car,
  Shield, ShieldCheck, FileText, DollarSign, TrendingUp, Award,
  Thermometer, Leaf, HardHat, Pill, ArrowUpRight, ArrowDownRight,
  CheckCircle, XCircle, AlertCircle, ChevronRight, BarChart3,
  Calendar, Gauge, Target, Info, Wrench, Globe,
} from "lucide-react";

// ── Vertical definitions ─────────────────────────────────────────────────────
const VERTICALS = [
  { id: "petroleum", label: "Petroleum", icon: Droplets, color: "text-amber-400", bg: "bg-amber-500/10" },
  { id: "chemical", label: "Chemical", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  { id: "food", label: "Food / Agriculture", icon: Snowflake, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { id: "construction", label: "Construction", icon: HardHat, color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "pharma", label: "Pharmaceutical", icon: Pill, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "livestock", label: "Livestock", icon: Beef, color: "text-green-400", bg: "bg-green-500/10" },
  { id: "intermodal", label: "Intermodal", icon: Container, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "automotive", label: "Automotive", icon: Car, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "hazmat", label: "Hazmat", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { id: "tanker", label: "Tanker / Liquid", icon: Droplets, color: "text-sky-400", bg: "bg-sky-500/10" },
  { id: "flatbed", label: "Flatbed / Heavy", icon: Truck, color: "text-slate-400", bg: "bg-slate-500/10" },
  { id: "heavy_haul", label: "Heavy Haul", icon: Weight, color: "text-rose-400", bg: "bg-rose-500/10" },
];

export default function IndustryVerticals() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [selectedVertical, setSelectedVertical] = useState("petroleum");
  const [activeTab, setActiveTab] = useState("overview");
  const [baseRate, setBaseRate] = useState(3500);
  const [pricingMiles, setPricingMiles] = useState(800);

  // ── tRPC queries ───────────────────────────────────────────────────────────
  const configQ = (trpc as any).industryVerticals?.getVerticalConfig?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const complianceQ = (trpc as any).industryVerticals?.getComplianceRequirements?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const equipmentQ = (trpc as any).industryVerticals?.getSpecializedEquipment?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const seasonalQ = (trpc as any).industryVerticals?.getSeasonalFactors?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const analyticsQ = (trpc as any).industryVerticals?.getVerticalAnalytics?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const certsQ = (trpc as any).industryVerticals?.getCarrierCertifications?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const tempQ = (trpc as any).industryVerticals?.getTemperatureProtocols?.useQuery?.({ verticalId: selectedVertical }) ?? { data: null, isLoading: false };
  const pricingQ = (trpc as any).industryVerticals?.calculateVerticalPricing?.useQuery?.({
    verticalId: selectedVertical,
    baseRate,
    miles: pricingMiles,
    factors: [],
    temperatureRequired: ["food", "pharma", "refrigerated"].includes(selectedVertical),
    hazmatClass: ["chemical", "hazmat", "petroleum"].includes(selectedVertical) ? "3" : undefined,
    oversized: ["construction", "heavy_haul"].includes(selectedVertical),
  }) ?? { data: null, isLoading: false };
  const hazmatQ = (trpc as any).industryVerticals?.getHazmatSegregation?.useQuery?.({}) ?? { data: null, isLoading: false };

  // ── Derived data ───────────────────────────────────────────────────────────
  const config = configQ.data as any;
  const compliance = complianceQ.data as any;
  const equipment = equipmentQ.data as any;
  const seasonal = seasonalQ.data as any;
  const analytics = analyticsQ.data as any;
  const certs = certsQ.data as any;
  const tempProto = tempQ.data as any;
  const pricing = pricingQ.data as any;
  const hazmatTable = hazmatQ.data as any;

  const currentV = VERTICALS.find(v => v.id === selectedVertical) || VERTICALS[0];
  const Icon = currentV.icon;

  const isLoading = configQ.isLoading || complianceQ.isLoading;

  // ── Style helpers ──────────────────────────────────────────────────────────
  const cardCls = cn("rounded-2xl border backdrop-blur-sm transition-all",
    L ? "bg-white/80 border-slate-200/80 shadow-sm" : "bg-slate-800/40 border-slate-700/40");
  const cellCls = cn("p-3 rounded-xl border",
    L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const headingCls = cn("text-lg font-bold", L ? "text-slate-900" : "text-white");
  const subCls = cn("text-sm", L ? "text-slate-600" : "text-slate-400");
  const labelCls = cn("text-xs font-medium", L ? "text-slate-500" : "text-slate-400");

  // ── Severity badge helper ──────────────────────────────────────────────────
  const SeverityBadge = ({ severity }: { severity: string }) => {
    const map: Record<string, string> = {
      critical: "bg-red-500/20 text-red-400 border-red-500/30",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      low: "bg-green-500/20 text-green-400 border-green-500/30",
      warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return <Badge className={cn("text-[10px] border", map[severity] || map.medium)}>{severity.toUpperCase()}</Badge>;
  };

  // ── Trend indicator ────────────────────────────────────────────────────────
  const Trend = ({ value }: { value: number }) => {
    if (!value) return null;
    return (
      <span className={cn("flex items-center gap-0.5 text-xs font-semibold", value >= 0 ? "text-green-400" : "text-red-400")}>
        {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className={cn("min-h-screen p-6", L ? "bg-slate-50" : "bg-slate-950")}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentV.bg)}>
          <Icon className={cn("w-6 h-6", currentV.color)} />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", L ? "text-slate-900" : "text-white")}>Industry Verticals</h1>
          <p className={subCls}>Compliance, equipment, pricing, and analytics by industry sector</p>
        </div>
      </div>

      {/* Vertical Selector */}
      <div className={cn(cardCls, "p-4 mb-6")}>
        <div className="flex flex-wrap gap-2">
          {VERTICALS.map(v => {
            const VIcon = v.icon;
            const active = v.id === selectedVertical;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVertical(v.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                  active
                    ? L ? "bg-cyan-50 border-cyan-300 text-cyan-800" : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                    : L ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50" : "bg-slate-800/50 border-slate-700/30 text-slate-400 hover:bg-slate-700/50"
                )}
              >
                <VIcon className={cn("w-4 h-4", active ? v.color : "")} />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("mb-6 flex flex-wrap gap-1 h-auto p-1 rounded-xl",
          L ? "bg-slate-200/80" : "bg-slate-800/60")}>
          {[
            { val: "overview", label: "Overview", icon: Gauge },
            { val: "compliance", label: "Compliance", icon: Shield },
            { val: "equipment", label: "Equipment", icon: Wrench },
            { val: "pricing", label: "Pricing", icon: DollarSign },
            { val: "seasonal", label: "Seasonal", icon: Calendar },
            { val: "certifications", label: "Certifications", icon: Award },
            { val: "analytics", label: "Analytics", icon: BarChart3 },
            { val: "hazmat", label: "Hazmat Table", icon: AlertTriangle },
          ].map(t => {
            const TIcon = t.icon;
            return (
              <TabsTrigger key={t.val} value={t.val} className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg",
                "data-[state=active]:bg-cyan-500 data-[state=active]:text-white"
              )}>
                <TIcon className="w-3.5 h-3.5" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── Overview Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          {isLoading ? <LoadingSkeleton L={L} /> : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Vertical Info */}
              <Card className={cardCls}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", currentV.bg)}>
                      <Icon className={cn("w-5 h-5", currentV.color)} />
                    </div>
                    <div>
                      <h3 className={headingCls}>{config?.name || currentV.label}</h3>
                      <p className={cn("text-xs", subCls)}>{config?.description || ""}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={cellCls}>
                      <p className={labelCls}>Equipment Types</p>
                      <p className={cn("text-lg font-bold", L ? "text-slate-900" : "text-white")}>{config?.equipmentTypes?.length || 0}</p>
                    </div>
                    <div className={cellCls}>
                      <p className={labelCls}>Cargo Types</p>
                      <p className={cn("text-lg font-bold", L ? "text-slate-900" : "text-white")}>{config?.cargoTypes?.length || 0}</p>
                    </div>
                    <div className={cellCls}>
                      <p className={labelCls}>Temp Controlled</p>
                      <p className={cn("text-lg font-bold", config?.temperatureControlled ? "text-cyan-400" : L ? "text-slate-400" : "text-slate-500")}>
                        {config?.temperatureControlled ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className={cellCls}>
                      <p className={labelCls}>Hazmat Applicable</p>
                      <p className={cn("text-lg font-bold", config?.hazmatApplicable ? "text-amber-400" : L ? "text-slate-400" : "text-slate-500")}>
                        {config?.hazmatApplicable ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weight Range & Special Requirements */}
              <Card className={cardCls}>
                <CardContent className="p-5">
                  <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Special Requirements
                  </h3>
                  <div className={cn(cellCls, "mb-3")}>
                    <p className={labelCls}>Typical Weight Range</p>
                    <p className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>
                      {config?.typicalWeightRange
                        ? `${config.typicalWeightRange.min.toLocaleString()} - ${config.typicalWeightRange.max.toLocaleString()} ${config.typicalWeightRange.unit}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(config?.specialRequirements || []).map((req: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 mt-1 text-cyan-400 flex-shrink-0" />
                        <span className={cn("text-xs", L ? "text-slate-700" : "text-slate-300")}>{req}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick KPIs */}
              <Card className={cardCls}>
                <CardContent className="p-5">
                  <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                    <Target className="w-4 h-4 text-purple-400" />
                    Key Metrics
                  </h3>
                  <div className="space-y-3">
                    {(analytics?.kpis || []).slice(0, 4).map((kpi: any, i: number) => (
                      <div key={i} className={cellCls}>
                        <div className="flex items-center justify-between">
                          <span className={labelCls}>{kpi.metric}</span>
                          <Trend value={kpi.trend} />
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className={cn("text-lg font-bold", L ? "text-slate-900" : "text-white")}>
                            {kpi.unit === "$" ? `$${kpi.value.toLocaleString()}` : `${kpi.value}${kpi.unit === "%" ? "%" : ` ${kpi.unit}`}`}
                          </span>
                          <span className={cn("text-[10px]", subCls)}>
                            vs {kpi.unit === "$" ? `$${kpi.benchmark.toLocaleString()}` : `${kpi.benchmark}${kpi.unit === "%" ? "%" : ""}`} {kpi.benchmarkLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Temperature Protocols (if applicable) */}
              {tempProto?.protocols?.length > 0 && (
                <Card className={cn(cardCls, "lg:col-span-2")}>
                  <CardContent className="p-5">
                    <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                      <Thermometer className="w-4 h-4 text-cyan-400" />
                      Temperature Protocols
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(tempProto.protocols || []).map((p: any, i: number) => (
                        <div key={i} className={cellCls}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{p.product}</span>
                            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px]">
                              {p.tempRange.min} to {p.tempRange.max} {p.tempRange.unit}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div>
                              <p className={cn("text-[10px]", labelCls)}>Tolerance</p>
                              <p className={cn("text-xs font-medium", L ? "text-slate-700" : "text-slate-300")}>+/- {p.tolerance} {p.tempRange.unit}</p>
                            </div>
                            <div>
                              <p className={cn("text-[10px]", labelCls)}>Monitor</p>
                              <p className={cn("text-xs font-medium", L ? "text-slate-700" : "text-slate-300")}>{p.monitoringInterval}</p>
                            </div>
                            <div>
                              <p className={cn("text-[10px]", labelCls)}>Regulation</p>
                              <p className={cn("text-xs font-medium", L ? "text-slate-700" : "text-slate-300")}>{p.regulation}</p>
                            </div>
                          </div>
                          <p className={cn("text-[10px]", subCls)}>{p.notes}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Equipment Quick View */}
              <Card className={cn(cardCls, tempProto?.protocols?.length > 0 ? "" : "lg:col-span-2")}>
                <CardContent className="p-5">
                  <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    Equipment Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(config?.equipmentTypes || []).map((eq: string, i: number) => (
                      <Badge key={i} className={cn("text-xs border", L ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30")}>
                        {eq}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <p className={cn("text-xs w-full mb-1", labelCls)}>Cargo Types:</p>
                    {(config?.cargoTypes || []).map((ct: string, i: number) => (
                      <Badge key={i} variant="outline" className={cn("text-[10px]", L ? "text-slate-600" : "text-slate-400")}>
                        {ct.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Compliance Tab ────────────────────────────────────────────────── */}
        <TabsContent value="compliance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Base Compliance Rules */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Base Compliance Rules
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {(compliance?.baseRules || []).map((rule: any, i: number) => (
                    <div key={i} className={cellCls}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-xs font-mono", L ? "text-cyan-600" : "text-cyan-400")}>{rule.regulation}</span>
                        <SeverityBadge severity={rule.severity} />
                      </div>
                      <p className={cn("text-sm", L ? "text-slate-700" : "text-slate-300")}>{rule.description}</p>
                      {rule.autoCheck && (
                        <Badge className="mt-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Auto-Check Enabled</Badge>
                      )}
                    </div>
                  ))}
                  {(!compliance?.baseRules || compliance.baseRules.length === 0) && (
                    <p className={subCls}>No base compliance rules defined for this vertical.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Environmental / Regulatory Compliance */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                  <Leaf className="w-4 h-4 text-green-400" />
                  Environmental & Regulatory
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {(compliance?.environmentalCompliance || []).map((rule: any, i: number) => (
                    <div key={i} className={cellCls}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px] border",
                            rule.category?.includes("EPA") ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            rule.category?.includes("OSHA") ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                            rule.category?.includes("DOT") ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            rule.category?.includes("FDA") ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                            "bg-slate-500/20 text-slate-400 border-slate-500/30"
                          )}>
                            {rule.category}
                          </Badge>
                          <span className={cn("text-xs font-mono", L ? "text-slate-500" : "text-slate-400")}>{rule.regulation}</span>
                        </div>
                        <SeverityBadge severity={rule.severity} />
                      </div>
                      <p className={cn("text-sm font-semibold mb-0.5", L ? "text-slate-800" : "text-white")}>{rule.title}</p>
                      <p className={cn("text-xs", subCls)}>{rule.description}</p>
                    </div>
                  ))}
                  {(!compliance?.environmentalCompliance || compliance.environmentalCompliance.length === 0) && (
                    <p className={subCls}>No specific environmental requirements for this vertical.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Required Documents */}
            <Card className={cn(cardCls, "lg:col-span-2")}>
              <CardContent className="p-5">
                <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                  <FileText className="w-4 h-4 text-amber-400" />
                  Required Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(compliance?.requiredDocuments || []).map((doc: any, i: number) => (
                    <div key={i} className={cellCls}>
                      <div className="flex items-center gap-2 mb-1">
                        {doc.required ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className={cn("text-sm font-semibold", L ? "text-slate-800" : "text-white")}>{doc.name}</span>
                      </div>
                      <Badge className={cn("text-[10px] mb-1 border",
                        doc.category === "safety" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                        doc.category === "compliance" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                        doc.category === "customs" ? "bg-purple-500/15 text-purple-400 border-purple-500/30" :
                        doc.category === "insurance" ? "bg-green-500/15 text-green-400 border-green-500/30" :
                        "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      )}>
                        {doc.category}
                      </Badge>
                      <p className={cn("text-[11px]", subCls)}>{doc.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Equipment Tab ────────────────────────────────────────────────── */}
        <TabsContent value="equipment">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                <Wrench className="w-4 h-4 text-emerald-400" />
                Specialized Equipment — {equipment?.vertical || currentV.label}
              </h3>
              <div className="space-y-4">
                {(equipment?.equipment || []).map((eq: any, i: number) => (
                  <div key={i} className={cn(cellCls, "space-y-3")}>
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-sm font-bold", L ? "text-slate-900" : "text-white")}>{eq.type}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-[10px] border",
                          eq.availability === "High" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          eq.availability === "Moderate" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          eq.availability === "Low" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                          "bg-red-500/20 text-red-400 border-red-500/30"
                        )}>
                          {eq.availability} Availability
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                          ${eq.avgDayRate.toLocaleString()}/day
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className={labelCls}>Specification</p>
                        <p className={cn("text-xs", L ? "text-slate-700" : "text-slate-300")}>{eq.specification}</p>
                      </div>
                      <div>
                        <p className={labelCls}>Capacity</p>
                        <p className={cn("text-xs", L ? "text-slate-700" : "text-slate-300")}>{eq.capacity}</p>
                      </div>
                      <div>
                        <p className={labelCls}>Certifications</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {eq.certifications.map((c: string, j: number) => (
                            <Badge key={j} variant="outline" className="text-[9px]">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {eq.notes && <p className={cn("text-xs italic", subCls)}>{eq.notes}</p>}
                  </div>
                ))}
                {(!equipment?.equipment || equipment.equipment.length === 0) && (
                  <p className={subCls}>No specialized equipment data available for this vertical.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Pricing Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="pricing">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pricing Calculator */}
            <Card className={cardCls}>
              <CardContent className="p-5">
                <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Pricing Calculator
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className={labelCls}>Base Rate ($)</Label>
                    <Input
                      type="number"
                      value={baseRate}
                      onChange={(e) => setBaseRate(Number(e.target.value) || 0)}
                      className={cn("mt-1", L ? "" : "bg-slate-800 border-slate-700 text-white")}
                    />
                  </div>
                  <div>
                    <Label className={labelCls}>Distance (miles)</Label>
                    <Input
                      type="number"
                      value={pricingMiles}
                      onChange={(e) => setPricingMiles(Number(e.target.value) || 0)}
                      className={cn("mt-1", L ? "" : "bg-slate-800 border-slate-700 text-white")}
                    />
                  </div>
                  <div className={cn(cellCls, "mt-4")}>
                    <div className="flex items-center justify-between">
                      <p className={labelCls}>Auto-Applied Flags</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {["food", "pharma", "refrigerated"].includes(selectedVertical) && (
                        <Badge className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Temp Control</Badge>
                      )}
                      {["chemical", "hazmat", "petroleum"].includes(selectedVertical) && (
                        <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">Hazmat</Badge>
                      )}
                      {["construction", "heavy_haul"].includes(selectedVertical) && (
                        <Badge className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30">Oversized</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Result */}
            <Card className={cn(cardCls, "lg:col-span-2")}>
              <CardContent className="p-5">
                <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Rate Breakdown
                </h3>
                {pricing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className={cellCls}>
                        <p className={labelCls}>Base Rate</p>
                        <p className={cn("text-xl font-bold", L ? "text-slate-900" : "text-white")}>${pricing.baseRate?.toLocaleString()}</p>
                      </div>
                      <div className={cellCls}>
                        <p className={labelCls}>All-In Rate</p>
                        <p className="text-xl font-bold text-emerald-400">${pricing.allInRate?.toLocaleString()}</p>
                      </div>
                      <div className={cellCls}>
                        <p className={labelCls}>Rate per Mile</p>
                        <p className="text-xl font-bold text-cyan-400">${pricing.ratePerMile || "N/A"}</p>
                      </div>
                    </div>

                    {/* Surcharges */}
                    {pricing.surcharges?.length > 0 && (
                      <div>
                        <p className={cn("text-sm font-semibold mb-2", L ? "text-slate-700" : "text-slate-300")}>Vertical Surcharges</p>
                        <div className="space-y-2">
                          {pricing.surcharges.map((s: any, i: number) => (
                            <div key={i} className={cn(cellCls, "flex items-center justify-between")}>
                              <div>
                                <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{s.name}</p>
                                <p className={cn("text-xs", subCls)}>{s.description}</p>
                              </div>
                              <span className="text-sm font-bold text-amber-400">+${s.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vertical Adjustments */}
                    {pricing.adjustments?.length > 0 && (
                      <div>
                        <p className={cn("text-sm font-semibold mb-2", L ? "text-slate-700" : "text-slate-300")}>Factor Adjustments</p>
                        <div className="space-y-2">
                          {pricing.adjustments.map((a: any, i: number) => (
                            <div key={i} className={cn(cellCls, "flex items-center justify-between")}>
                              <span className={cn("text-sm", L ? "text-slate-700" : "text-slate-300")}>{a.factor.replace(/_/g, " ")}</span>
                              <div className="flex items-center gap-3">
                                <span className={cn("text-xs font-mono", subCls)}>x{a.multiplier}</span>
                                <span className="text-sm font-bold text-emerald-400">+${a.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={subCls}>Enter a base rate and distance to calculate pricing.</p>
                )}
              </CardContent>
            </Card>

            {/* Pricing Factors */}
            <Card className={cn(cardCls, "lg:col-span-3")}>
              <CardContent className="p-5">
                <h3 className={cn(headingCls, "mb-4")}>Available Pricing Factors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(config?.pricingFactors || []).map((f: any, i: number) => (
                    <div key={i} className={cellCls}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-xs font-semibold", L ? "text-slate-800" : "text-white")}>{f.factor.replace(/_/g, " ")}</span>
                        <Badge className={cn("text-[10px]",
                          f.multiplier >= 1.3 ? "bg-red-500/20 text-red-400" :
                          f.multiplier >= 1.1 ? "bg-amber-500/20 text-amber-400" :
                          "bg-green-500/20 text-green-400"
                        )}>
                          x{f.multiplier}
                        </Badge>
                      </div>
                      <p className={cn("text-[10px]", subCls)}>{f.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Seasonal Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="seasonal">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                <Calendar className="w-4 h-4 text-purple-400" />
                Seasonal Demand Patterns — {seasonal?.vertical || currentV.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(seasonal?.seasons || []).map((s: any, i: number) => (
                  <div key={i} className={cellCls}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className={cn("text-sm font-bold", L ? "text-slate-900" : "text-white")}>{s.period}</h4>
                        <p className={cn("text-xs", subCls)}>{s.months}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={cn("text-[10px] border",
                          s.demandMultiplier >= 1.3 ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          s.demandMultiplier >= 1.1 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                          s.demandMultiplier < 1.0 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-green-500/20 text-green-400 border-green-500/30"
                        )}>
                          {s.rateImpact}
                        </Badge>
                      </div>
                    </div>
                    {/* Demand bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-[10px]", labelCls)}>Demand Multiplier</span>
                        <span className={cn("text-xs font-bold", L ? "text-slate-800" : "text-white")}>{s.demandMultiplier}x</span>
                      </div>
                      <div className={cn("h-2 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                        <div
                          className={cn("h-full rounded-full transition-all duration-500",
                            s.demandMultiplier >= 1.3 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                            s.demandMultiplier >= 1.1 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                            s.demandMultiplier < 1.0 ? "bg-gradient-to-r from-blue-500 to-sky-500" :
                            "bg-gradient-to-r from-green-500 to-emerald-500"
                          )}
                          style={{ width: `${Math.min((s.demandMultiplier / 1.5) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* Drivers */}
                    <div className="space-y-1">
                      {s.drivers.map((d: string, j: number) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 text-purple-400 flex-shrink-0" />
                          <span className={cn("text-[11px]", L ? "text-slate-600" : "text-slate-400")}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Certifications Tab ───────────────────────────────────────────── */}
        <TabsContent value="certifications">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                <Award className="w-4 h-4 text-amber-400" />
                Carrier Certifications — {certs?.vertical || currentV.label}
              </h3>
              <div className="space-y-4">
                {(certs?.certifications || []).map((cert: any, i: number) => (
                  <div key={i} className={cn(cellCls, "space-y-2")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {cert.required ? (
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Info className="w-4 h-4 text-slate-400" />
                        )}
                        <h4 className={cn("text-sm font-bold", L ? "text-slate-900" : "text-white")}>{cert.name}</h4>
                      </div>
                      <Badge className={cn("text-[10px] border",
                        cert.required ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      )}>
                        {cert.required ? "REQUIRED" : "RECOMMENDED"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className={labelCls}>Issued By</p>
                        <p className={cn("text-xs", L ? "text-slate-700" : "text-slate-300")}>{cert.issuedBy}</p>
                      </div>
                      <div>
                        <p className={labelCls}>Renewal Period</p>
                        <p className={cn("text-xs", L ? "text-slate-700" : "text-slate-300")}>{cert.renewalPeriod}</p>
                      </div>
                      <div>
                        <p className={labelCls}>Description</p>
                        <p className={cn("text-xs", L ? "text-slate-700" : "text-slate-300")}>{cert.description}</p>
                      </div>
                    </div>
                    {cert.verificationUrl && (
                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Verification Portal
                      </a>
                    )}
                  </div>
                ))}
                {(!certs?.certifications || certs.certifications.length === 0) && (
                  <p className={subCls}>No certification data available for this vertical.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Analytics Tab ────────────────────────────────────────────────── */}
        <TabsContent value="analytics">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(headingCls, "mb-4 flex items-center gap-2")}>
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Vertical KPIs — {analytics?.vertical || currentV.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(analytics?.kpis || []).map((kpi: any, i: number) => (
                  <div key={i} className={cellCls}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={labelCls}>{kpi.metric}</span>
                      <Trend value={kpi.trend} />
                    </div>
                    <p className={cn("text-2xl font-bold mb-1", L ? "text-slate-900" : "text-white")}>
                      {kpi.unit === "$" ? `$${kpi.value.toLocaleString()}` :
                       kpi.unit === "%" ? `${kpi.value}%` :
                       `${kpi.value.toLocaleString()} ${kpi.unit}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-1.5 flex-1 rounded-full overflow-hidden", L ? "bg-slate-200" : "bg-slate-700")}>
                        <div
                          className={cn("h-full rounded-full",
                            kpi.unit === "%" && kpi.value >= kpi.benchmark ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                            kpi.unit === "$" && kpi.value >= kpi.benchmark ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                            "bg-gradient-to-r from-cyan-500 to-blue-400"
                          )}
                          style={{ width: `${Math.min(kpi.unit === "%" ? kpi.value : (kpi.value / (kpi.benchmark * 1.5)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={cn("text-[10px] whitespace-nowrap", subCls)}>
                        {kpi.benchmarkLabel}: {kpi.unit === "$" ? `$${kpi.benchmark.toLocaleString()}` : `${kpi.benchmark}${kpi.unit === "%" ? "%" : ""}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Hazmat Segregation Tab ────────────────────────────────────────── */}
        <TabsContent value="hazmat">
          <Card className={cardCls}>
            <CardContent className="p-5">
              <h3 className={cn(headingCls, "mb-2 flex items-center gap-2")}>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Hazmat Segregation Table
              </h3>
              <p className={cn("text-xs mb-4", subCls)}>
                {hazmatTable?.regulation || "49 CFR 177.848"} — Segregation of hazardous materials during transport
              </p>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-red-500/30 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-red-400" />
                  </div>
                  <span className={cn("text-xs", subCls)}>X = Incompatible</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-amber-500/30 flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className={cn("text-xs", subCls)}>O = Conditional</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-green-500/30 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  </div>
                  <span className={cn("text-xs", subCls)}>Blank = Compatible</span>
                </div>
              </div>
              {/* Table */}
              {hazmatTable?.entries ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className={cn("p-2 text-left border-b", L ? "border-slate-200 text-slate-600" : "border-slate-700 text-slate-400")}>Class A \ B</th>
                        {(hazmatTable.classes || []).map((c: string) => (
                          <th key={c} className={cn("p-2 text-center border-b font-mono", L ? "border-slate-200 text-slate-600" : "border-slate-700 text-slate-400")}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(hazmatTable.classes || []).map((rowClass: string) => (
                        <tr key={rowClass}>
                          <td className={cn("p-2 font-mono font-bold border-b", L ? "border-slate-100 text-slate-700" : "border-slate-800 text-slate-300")}>{rowClass}</td>
                          {(hazmatTable.classes || []).map((colClass: string) => {
                            const entry = hazmatTable.entries.find((e: any) =>
                              (e.classA === rowClass && e.classB === colClass) ||
                              (e.classA === colClass && e.classB === rowClass)
                            );
                            const val = entry?.result || "";
                            return (
                              <td
                                key={colClass}
                                className={cn("p-2 text-center border-b font-bold",
                                  L ? "border-slate-100" : "border-slate-800",
                                  val === "X" ? "text-red-400 bg-red-500/10" :
                                  val === "O" ? "text-amber-400 bg-amber-500/10" :
                                  rowClass === colClass ? (L ? "bg-slate-100" : "bg-slate-800/50") : ""
                                )}
                              >
                                {val || (rowClass === colClass ? "-" : "")}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={subCls}>Loading hazmat segregation data...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton({ L }: { L: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <Card key={i} className={cn("rounded-2xl border", L ? "bg-white/80 border-slate-200/80" : "bg-slate-800/40 border-slate-700/40")}>
          <CardContent className="p-5 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
