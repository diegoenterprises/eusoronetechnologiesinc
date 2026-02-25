/**
 * TERMINAL COMMAND CENTER
 * Integration-powered dashboard: OPIS rack pricing, Genscape supply intel,
 * Enverus crude benchmarks, TAS connection status — all woven into
 * real-time terminal operations. Designed with intention.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Fuel, Truck, Calendar, Clock, AlertTriangle,
  CheckCircle, Eye, Activity, Beaker, Target,
  TrendingUp, TrendingDown, Minus, Droplets, BarChart3,
  Zap, Plug2, Radio, ArrowUpRight, ArrowDownRight,
  Database, Globe, Gauge,
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const summaryQuery = (trpc as any).terminals.getSummary.useQuery();
  const racksQuery = (trpc as any).terminals.getRacks.useQuery();
  const tanksQuery = (trpc as any).terminals.getTanks.useQuery();
  const appointmentsQuery = (trpc as any).terminals.getTodayAppointments.useQuery();
  const alertsQuery = (trpc as any).terminals.getAlerts.useQuery();
  const marketQuery = (trpc as any).terminals?.getMarketPricing?.useQuery?.() || { data: null };
  const crudeQuery = (trpc as any).terminals?.getCrudeContext?.useQuery?.() || { data: null };
  const supplyQuery = (trpc as any).terminals?.getSupplyIntelligence?.useQuery?.() || { data: null };
  const tasQuery = (trpc as any).terminals?.getTASStatus?.useQuery?.() || { data: null };

  const summary = summaryQuery.data;
  const market = marketQuery.data;
  const crude = crudeQuery.data;
  const supply = supplyQuery.data;
  const tas = tasQuery.data;

  const getRackStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "loading": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "maintenance": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "offline": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getTankLevelColor = (level: number) => {
    if (level >= 70) return "from-green-500 to-green-400";
    if (level >= 30) return "from-yellow-500 to-yellow-400";
    return "from-red-500 to-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-800 dark:text-white">
            Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Terminal operations, market intelligence, and supply chain visibility</p>
        </div>
        <div className="flex items-center gap-2">
          {tas?.connected && (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-medium">{tas.provider} Connected</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs bg-[#1473FF]/10 text-[#1473FF] px-3 py-1.5 rounded-xl border border-[#1473FF]/20">
            <Radio className="w-3.5 h-3.5" />
            <span className="font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* ═══ MARKET TICKER STRIP ═══ */}
      {market?.prices && market.prices.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02]">
          <div className="flex items-center gap-1 px-4 py-1.5 border-b border-slate-100 dark:border-white/[0.04]">
            <Droplets className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">OPIS Rack Pricing</span>
            <span className="text-[9px] text-slate-400 ml-auto">Updated {new Date(market.asOf).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center divide-x divide-slate-100 dark:divide-white/[0.04] overflow-x-auto scrollbar-hide">
            {market.prices.map((p: any) => (
              <div key={p.product} className="flex items-center gap-3 px-5 py-3 min-w-[180px] group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{p.product}</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-white tabular-nums">${p.price.toFixed(4)}</p>
                </div>
                <div className={cn("flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md",
                  p.trend === "up" ? "text-emerald-500 bg-emerald-500/10" :
                  p.trend === "down" ? "text-red-400 bg-red-400/10" : "text-slate-400 bg-slate-400/10"
                )}>
                  {p.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : p.trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {p.changePercent > 0 ? "+" : ""}{p.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CRUDE BENCHMARKS BAR ═══ */}
      {crude?.benchmarks && (
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide px-1">
          {crude.benchmarks.slice(0, 4).map((b: any) => (
            <div key={b.name} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] min-w-fit">
              <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">{b.name}</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">${b.price.toFixed(2)}</span>
              <span className={cn("text-[10px] font-medium",
                b.change > 0 ? "text-emerald-500" : b.change < 0 ? "text-red-400" : "text-slate-400"
              )}>
                {b.change > 0 ? "+" : ""}{b.change.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-[10px] text-slate-400 min-w-fit">
            <BarChart3 className="w-3 h-3" /> Enverus
          </div>
        </div>
      )}

      {/* Alerts */}
      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-bold">{alertsQuery.data.length} Alert{alertsQuery.data.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-slate-400">{alertsQuery.data[0]?.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPECTRA-MATCH Quick Access */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/30 to-cyan-500/30">
                <Beaker className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  SPECTRA-MATCH™
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">
                    <EsangIcon className="w-3 h-3 mr-1" />AI
                  </Badge>
                </p>
                <p className="text-sm text-slate-400">Crude/fuel product identification system</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              onClick={() => window.location.href = '/terminal/scada'}
            >
              <Target className="w-4 h-4 mr-2" />
              Open Oil ID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.todayAppointments || 0}</p>
                )}
                <p className="text-xs text-slate-400">Today's Appts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.checkedIn || 0}</p>
                )}
                <p className="text-xs text-slate-400">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Fuel className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.loading || 0}</p>
                )}
                <p className="text-xs text-slate-400">Loading</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.rackUtilization || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-400">{(summary?.totalInventory || 0).toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Total BBL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex gap-1 flex-wrap">
          {([
            { value: "overview", label: "Overview" },
            { value: "racks", label: "Racks" },
            { value: "inventory", label: "Inventory" },
            { value: "supply", label: "Supply Intel" },
            { value: "appointments", label: "Appointments" },
          ] as const).map(t => (
            <button key={t.value} onClick={() => setActiveTab(t.value)} className={cn(
              "text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors",
              activeTab === t.value ? "bg-[#1473FF]/15 text-[#1473FF]" : "bg-slate-50 dark:bg-white/[0.03] text-slate-500 hover:text-slate-300"
            )}>{t.label}</button>
          ))}
        </div>

        <TabsContent value="overview" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Rack Status */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-slate-800 dark:text-white mb-4">Rack Status</h3>
              {racksQuery.isLoading ? (
                <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(racksQuery.data as any)?.slice(0, 4).map((rack: any) => (
                    <div key={rack.id} className={cn("p-4 rounded-xl border", getRackStatusColor(rack.status))}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-800 dark:text-white font-medium text-sm">Rack {rack.number}</span>
                        <Badge className={cn("border-0 text-[10px]", getRackStatusColor(rack.status))}>{rack.status}</Badge>
                      </div>
                      {rack.currentTruck && <p className="text-xs text-slate-500">{rack.currentTruck}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tank Levels */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-slate-800 dark:text-white mb-4">Tank Levels</h3>
              {tanksQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : (
                <div className="space-y-3">
                  {(tanksQuery.data as any)?.slice(0, 4).map((tank: any) => (
                    <div key={tank.id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-300">Tank {tank.number} - {tank.product}</span>
                        <span className="text-slate-800 dark:text-white font-medium">{tank.level}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-gradient-to-r transition-all duration-700 ease-out", getTankLevelColor(tank.level))} style={{ width: `${tank.level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ SUPPLY INTELLIGENCE SUMMARY (on overview tab) ═══ */}
          {supply && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Pipeline Flows */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-white">Pipeline Flows</h3>
                    <p className="text-[10px] text-slate-400">Genscape</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {supply.pipelineFlows?.slice(0, 3).map((pf: any) => (
                    <div key={pf.pipeline} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 truncate">{pf.pipeline}</span>
                        <span className="text-slate-800 dark:text-white font-medium tabular-nums">{pf.utilization}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${pf.utilization}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Hubs */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Database className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-white">Storage Hubs</h3>
                    <p className="text-[10px] text-slate-400">Genscape</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {supply.storageHubs?.map((sh: any) => (
                    <div key={sh.hub} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-800 dark:text-white font-medium">{sh.hub}</p>
                        <p className="text-[10px] text-slate-500">{(sh.inventory / 1000000).toFixed(1)}M bbl / {(sh.capacity / 1000000).toFixed(0)}M</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">{sh.utilization}%</p>
                        <p className={cn("text-[10px] font-medium", sh.weekChange > 0 ? "text-emerald-500" : "text-red-400")}>
                          {sh.weekChange > 0 ? "+" : ""}{(sh.weekChange / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refinery Utilization */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-white">Refinery Utilization</h3>
                    <p className="text-[10px] text-slate-400">Genscape</p>
                  </div>
                </div>
                {supply.refineryUtilization && (
                  <div className="space-y-2.5">
                    {[
                      { label: "National Avg", value: supply.refineryUtilization.national },
                      { label: "PADD 1 (East)", value: supply.refineryUtilization.padd1 },
                      { label: "PADD 2 (Midwest)", value: supply.refineryUtilization.padd2 },
                      { label: "PADD 3 (Gulf)", value: supply.refineryUtilization.padd3 },
                      { label: "PADD 5 (West)", value: supply.refineryUtilization.padd5 },
                    ].map(r => (
                      <div key={r.label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-28 shrink-0">{r.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700",
                            r.value >= 90 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                            r.value >= 80 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                            "bg-gradient-to-r from-red-500 to-red-400"
                          )} style={{ width: `${r.value}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-white tabular-nums w-12 text-right">{r.value}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="racks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {racksQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : (
              (racksQuery.data as any)?.map((rack: any) => (
                <Card key={rack.id} className={cn("border rounded-xl", getRackStatusColor(rack.status))}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold">Rack {rack.number}</p>
                      <Badge className={cn("border-0", getRackStatusColor(rack.status))}>{rack.status}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Product</span>
                        <span className="text-white">{rack.product || "N/A"}</span>
                      </div>
                      {rack.currentTruck && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Truck</span>
                          <span className="text-white">{rack.currentTruck}</span>
                        </div>
                      )}
                      {rack.eta && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">ETA</span>
                          <span className="text-white">{rack.eta}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanksQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : (
              (tanksQuery.data as any)?.map((tank: any) => (
                <Card key={tank.id} className="bg-slate-700/30 border-slate-600/30 rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-white font-bold">Tank {tank.number}</p>
                      <Badge className="bg-slate-500/20 text-slate-400 border-0">{tank.product}</Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Level</span>
                        <span className="text-white font-medium">{tank.level}%</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-gradient-to-r transition-all", getTankLevelColor(tank.level))} style={{ width: `${tank.level}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Current</span>
                        <p className="text-white">{tank.currentVolume?.toLocaleString()} bbl</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Capacity</span>
                        <p className="text-white">{tank.capacity?.toLocaleString()} bbl</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ═══ SUPPLY INTEL TAB ═══ */}
        <TabsContent value="supply" className="mt-5">
          <div className="space-y-5">
            {/* Full Supply Intelligence */}
            {supply ? (
              <>
                {/* Pipeline Flows — Full Detail */}
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Activity className="w-4.5 h-4.5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800 dark:text-white">Pipeline Flow Rates</h3>
                      <p className="text-[10px] text-slate-400">Genscape / Wood Mackenzie real-time monitoring</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {supply.pipelineFlows?.map((pf: any) => (
                      <div key={pf.pipeline} className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-medium text-slate-800 dark:text-white">{pf.pipeline}</p>
                          <span className="text-[10px] text-slate-400">{pf.direction}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Flow Rate</span>
                            <span className="text-slate-800 dark:text-white font-medium tabular-nums">{(pf.flow / 1000).toFixed(0)}K {pf.unit}</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pf.utilization}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">{pf.product}</span>
                            <span className="text-violet-400 font-medium">{pf.utilization}% capacity</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage + Refinery Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Storage Hubs — Full Detail */}
                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <Database className="w-4.5 h-4.5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-800 dark:text-white">Crude Storage Levels</h3>
                        <p className="text-[10px] text-slate-400">Genscape satellite-verified inventory</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {supply.storageHubs?.map((sh: any) => (
                        <div key={sh.hub} className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-slate-800 dark:text-white">{sh.hub}</p>
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-md",
                              sh.weekChange > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-400 bg-red-400/10"
                            )}>
                              {sh.weekChange > 0 ? "+" : ""}{(sh.weekChange / 1000000).toFixed(1)}M WoW
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center mb-2">
                            <div>
                              <p className="text-[10px] text-slate-400">Inventory</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">{(sh.inventory / 1000000).toFixed(1)}M</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400">Capacity</p>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">{(sh.capacity / 1000000).toFixed(0)}M</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400">Utilization</p>
                              <p className="text-sm font-semibold text-cyan-400 tabular-nums">{sh.utilization}%</p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${sh.utilization}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crude Benchmarks — Detailed */}
                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <BarChart3 className="w-4.5 h-4.5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-800 dark:text-white">Energy Benchmarks</h3>
                        <p className="text-[10px] text-slate-400">Enverus market data</p>
                      </div>
                    </div>
                    {crude?.benchmarks && (
                      <div className="space-y-3">
                        {crude.benchmarks.map((b: any) => (
                          <div key={b.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04]">
                            <div>
                              <p className="text-xs font-medium text-slate-800 dark:text-white">{b.name}</p>
                              <p className="text-[10px] text-slate-400">{b.unit}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-800 dark:text-white tabular-nums">${b.price.toFixed(2)}</p>
                              <p className={cn("text-[10px] font-medium",
                                b.change > 0 ? "text-emerald-500" : b.change < 0 ? "text-red-400" : "text-slate-400"
                              )}>
                                {b.change > 0 ? "+" : ""}{b.change.toFixed(2)} ({b.change > 0 ? "+" : ""}{((b.change / b.price) * 100).toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Production snapshot */}
                    {crude?.productionSnapshot && (
                      <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/[0.04]">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3">US Production Snapshot</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-slate-800 dark:text-white tabular-nums">{(crude.productionSnapshot.usProduction / 1000000).toFixed(1)}M</p>
                            <p className="text-[10px] text-slate-400">Total US (bbl/day)</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-[#1473FF] tabular-nums">{(crude.productionSnapshot.permianBasin / 1000000).toFixed(1)}M</p>
                            <p className="text-[10px] text-slate-400">Permian Basin</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Supply intelligence loading...</p>
                <p className="text-xs text-slate-600 mt-1">Connect Genscape and Enverus API keys in Integrations for live data</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="mt-5">
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02] p-5">
            <h3 className="text-sm font-medium text-slate-800 dark:text-white mb-4">Today's Appointments</h3>
              {appointmentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : (appointmentsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No appointments today</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(appointmentsQuery.data as any)?.map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center px-3 py-2 rounded-xl bg-[#1473FF]/10 min-w-[56px]">
                          <p className="text-sm font-bold text-[#1473FF]">{appt.time}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{appt.catalystName}</p>
                          <p className="text-xs text-slate-500">{appt.truckNumber} - {appt.driverName}</p>
                          <p className="text-[10px] text-slate-400">{appt.product} | {(appt as any).weight || appt.quantity} gal | Rack {appt.rackNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={cn("border-0 text-[10px]",
                          appt.status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                          appt.status === "loading" ? "bg-blue-500/10 text-blue-400" :
                          "bg-amber-500/10 text-amber-400"
                        )}>
                          {appt.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-[#1473FF] h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
