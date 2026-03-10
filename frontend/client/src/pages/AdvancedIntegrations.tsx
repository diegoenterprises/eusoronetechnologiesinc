/**
 * ADVANCED INTEGRATIONS PAGE
 * EDI processing, fuel cards, ELD/telematics, accounting ERP sync,
 * API marketplace, webhooks, load board posting, integration logs.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, CheckCircle, Clock, Code,
  Database, Download, ExternalLink, FileText, Fuel, Globe, Key, Link2,
  MapPin, Monitor, Package, Play, Plus, RefreshCw, Send, Server, Settings,
  Shield, Truck, Upload, Webhook, Wifi, WifiOff, XCircle, Zap,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | "overview"
  | "edi"
  | "fuel"
  | "eld"
  | "accounting"
  | "marketplace"
  | "webhooks"
  | "loadboards"
  | "logs";

// ─── Health Indicators ───────────────────────────────────────────────────────

const HEALTH_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  healthy: { color: "text-green-400", bg: "bg-green-500/20", label: "Healthy", icon: CheckCircle },
  degraded: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Degraded", icon: AlertTriangle },
  down: { color: "text-red-400", bg: "bg-red-500/20", label: "Down", icon: XCircle },
  not_configured: { color: "text-slate-400", bg: "bg-slate-500/20", label: "Not Configured", icon: WifiOff },
};

function HealthBadge({ health }: { health: string }) {
  const cfg = HEALTH_CONFIG[health] || HEALTH_CONFIG.not_configured;
  const Icon = cfg.icon;
  return (
    <Badge className={cn("gap-1 border-0", cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdvancedIntegrations() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Monitor },
    { key: "edi", label: "EDI", icon: FileText },
    { key: "fuel", label: "Fuel Cards", icon: Fuel },
    { key: "eld", label: "ELD / Telematics", icon: Truck },
    { key: "accounting", label: "Accounting", icon: Database },
    { key: "marketplace", label: "Marketplace", icon: Package },
    { key: "webhooks", label: "Webhooks & API", icon: Webhook },
    { key: "loadboards", label: "Load Boards", icon: Globe },
    { key: "logs", label: "Logs", icon: Activity },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#6366f1] bg-clip-text text-transparent">
            Advanced Integrations
          </h1>
          <p className={`${isLight ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
            EDI processing, ELD feeds, fuel cards, accounting sync, and API management
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className={`${isLight ? "border-slate-300 text-slate-600" : "border-slate-600 text-slate-300"} gap-1`}>
            <Settings className="w-4 h-4" /> Settings
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#6366f1] gap-1">
            <Plus className="w-4 h-4" /> Add Integration
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? "default" : "ghost"}
              onClick={() => setTab(t.key)}
              className={cn(
                "gap-1.5 whitespace-nowrap",
                tab === t.key
                  ? "bg-gradient-to-r from-[#1473FF] to-[#6366f1] text-white"
                  : isLight
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "overview" && <OverviewPanel isLight={isLight} />}
      {tab === "edi" && <EdiPanel isLight={isLight} />}
      {tab === "fuel" && <FuelCardPanel isLight={isLight} />}
      {tab === "eld" && <EldTelematicsPanel isLight={isLight} />}
      {tab === "accounting" && <AccountingSyncPanel isLight={isLight} />}
      {tab === "marketplace" && <MarketplacePanel isLight={isLight} />}
      {tab === "webhooks" && <WebhookApiPanel isLight={isLight} />}
      {tab === "loadboards" && <LoadBoardPanel isLight={isLight} />}
      {tab === "logs" && <LogsPanel isLight={isLight} />}
    </div>
  );
}

// ─── Overview Panel ──────────────────────────────────────────────────────────

function OverviewPanel({ isLight = false }: { isLight?: boolean }) {
  const dashboardQuery = (trpc as any).advancedIntegrations.getIntegrationsDashboard.useQuery();
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 bg-slate-800/50" />
        ))}
      </div>
    );
  }

  const summary = data?.summary;
  const integrations = data?.integrations || [];

  const summaryCards = [
    { label: "Active", value: summary?.active || 0, icon: Wifi, color: "text-blue-400", bg: "bg-blue-500/20" },
    { label: "Healthy", value: summary?.healthy || 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20" },
    { label: "Degraded", value: summary?.degraded || 0, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    { label: "Messages", value: (summary?.totalMessagesProcessed || 0).toLocaleString(), icon: Zap, color: "text-indigo-400", bg: "bg-indigo-500/20" },
  ];

  const categories = ["edi", "fuel", "eld", "accounting", "loadboard", "mapping", "insurance"];
  const categoryLabels: Record<string, string> = {
    edi: "EDI Processing",
    fuel: "Fuel Cards",
    eld: "ELD / Telematics",
    accounting: "Accounting ERP",
    loadboard: "Load Boards",
    mapping: "Mapping / Routing",
    insurance: "Insurance",
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-full", s.bg)}>
                    <Icon className={cn("w-5 h-5", s.color)} />
                  </div>
                  <div>
                    <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Grid by Category */}
      {categories.map((cat) => {
        const items = integrations.filter((i: any) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              {categoryLabels[cat] || cat}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((integration: any) => (
                <Card
                  key={integration.id}
                  className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl hover:border-indigo-500/30 transition-colors`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium text-sm`}>{integration.name}</p>
                        <HealthBadge health={integration.health} />
                      </div>
                      {integration.enabled ? (
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{integration.messagesProcessed.toLocaleString()} msgs</span>
                      {integration.lastSync && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(integration.lastSync)}
                        </span>
                      )}
                    </div>
                    {integration.errorCount > 0 && (
                      <p className="text-xs text-red-400 mt-2">{integration.errorCount} errors</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── EDI Panel ───────────────────────────────────────────────────────────────

function EdiPanel({ isLight = false }: { isLight?: boolean }) {
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const txnQuery = (trpc as any).advancedIntegrations.getEdiTransactions.useQuery({});
  const partnersQuery = (trpc as any).advancedIntegrations.getEdiPartnerConfig.useQuery();

  const txns = txnQuery.data?.transactions || [];
  const summary = txnQuery.data?.summary;
  const partners = partnersQuery.data?.partners || [];

  const EDI_TYPE_LABELS: Record<string, string> = {
    "204": "Motor Carrier Load Tender",
    "210": "Motor Carrier Freight Invoice",
    "214": "Shipment Status Update",
    "990": "Response to Load Tender",
  };

  const STATUS_STYLES: Record<string, string> = {
    accepted: "bg-green-500/20 text-green-400",
    validated: "bg-blue-500/20 text-blue-400",
    parsed: "bg-indigo-500/20 text-indigo-400",
    received: "bg-slate-500/20 text-slate-300",
    rejected: "bg-red-500/20 text-red-400",
    error: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* EDI Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "204 Tenders", value: summary.total204, color: "text-blue-400" },
            { label: "210 Invoices", value: summary.total210, color: "text-green-400" },
            { label: "214 Status", value: summary.total214, color: "text-indigo-400" },
            { label: "990 Responses", value: summary.total990, color: "text-purple-400" },
            { label: "Errors", value: summary.errorCount, color: "text-red-400" },
          ].map((s) => (
            <Card key={s.label} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardContent className="p-3 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction List */}
        <div className="lg:col-span-2">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                <FileText className="w-5 h-5 text-[#1473FF]" />
                EDI Transaction Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {txnQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 bg-slate-700/50" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {txns.map((txn: any) => (
                    <div
                      key={txn.id}
                      onClick={() => setSelectedTxn(txn)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedTxn?.id === txn.id
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-slate-700/30 bg-slate-900/30 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-500/20 text-indigo-400 border-0 font-mono text-xs">
                            {txn.type}
                          </Badge>
                          <span className={`${isLight ? "text-slate-900" : "text-white"} text-sm font-medium`}>{txn.referenceNumber}</span>
                          <Badge className={cn("border-0 text-xs", txn.direction === "inbound" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400")}>
                            {txn.direction === "inbound" ? (
                              <><Download className="w-3 h-3 mr-1" />IN</>
                            ) : (
                              <><Upload className="w-3 h-3 mr-1" />OUT</>
                            )}
                          </Badge>
                        </div>
                        <Badge className={cn("border-0 text-xs", STATUS_STYLES[txn.status] || "bg-slate-500/20 text-slate-400")}>
                          {txn.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{txn.tradingPartner} - {EDI_TYPE_LABELS[txn.type]}</span>
                        <span>{formatTimeAgo(txn.createdAt)}</span>
                      </div>
                      {txn.errors.length > 0 && (
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {txn.errors[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* EDI Detail / Partners */}
        <div className="space-y-4">
          {selectedTxn ? (
            <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center justify-between`}>
                  <span>EDI {selectedTxn.type} Detail</span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedTxn(null)} className="text-slate-400 h-6 px-2">
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Reference</p>
                  <p className="text-white text-sm font-mono">{selectedTxn.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Trading Partner</p>
                  <p className="text-white text-sm">{selectedTxn.tradingPartner}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Parsed Data</p>
                  <pre className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg overflow-x-auto max-h-40 font-mono">
                    {JSON.stringify(selectedTxn.parsedData, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Raw EDI</p>
                  <pre className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded-lg overflow-x-auto max-h-32 font-mono whitespace-pre-wrap">
                    {selectedTxn.rawData}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center gap-2`}>
                  <Link2 className="w-4 h-4 text-[#1473FF]" />
                  Trading Partners
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {partners.map((p: any) => (
                  <div key={p.id} className="p-2 rounded-lg bg-slate-900/30 border border-slate-700/20">
                    <div className="flex items-center justify-between">
                      <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm font-medium`}>{p.name}</p>
                      <Badge className={cn(
                        "border-0 text-xs",
                        p.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{p.scac} | {p.communicationMethod}</p>
                    <div className="flex gap-1 mt-1">
                      {p.supportedTransactions.map((t: string) => (
                        <Badge key={t} className="bg-slate-700/50 text-slate-300 border-0 text-[10px] px-1.5 py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fuel Card Panel ─────────────────────────────────────────────────────────

function FuelCardPanel({ isLight = false }: { isLight?: boolean }) {
  const providersQuery = (trpc as any).advancedIntegrations.getFuelCardProviders.useQuery();
  const analyticsQuery = (trpc as any).advancedIntegrations.getFuelCardAnalytics.useQuery({});
  const syncMutation = (trpc as any).advancedIntegrations.syncFuelCardTransactions.useMutation();

  const providers = providersQuery.data?.providers || [];
  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Spend", value: `$${analytics.totalSpend.toLocaleString()}`, color: "text-green-400", bg: "bg-green-500/20", icon: Fuel },
            { label: "Avg $/Gallon", value: `$${analytics.avgCostPerGallon.toFixed(2)}`, color: "text-blue-400", bg: "bg-blue-500/20", icon: BarChart3 },
            { label: "Fleet MPG", value: analytics.avgMpg.toFixed(1), color: "text-indigo-400", bg: "bg-indigo-500/20", icon: Truck },
            { label: "Discounts Saved", value: `$${analytics.discountsSaved.toLocaleString()}`, color: "text-purple-400", bg: "bg-purple-500/20", icon: Zap },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", s.bg)}>
                      <Icon className={cn("w-5 h-5", s.color)} />
                    </div>
                    <div>
                      <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Providers */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
              <Fuel className="w-5 h-5 text-[#1473FF]" />
              Fuel Card Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">{p.name}</p>
                  <Badge className={cn("border-0", p.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                    {p.status}
                  </Badge>
                </div>
                {p.status === "connected" && (
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>{p.cardsActive} active cards</span>
                    <span>${p.monthlySpend.toLocaleString()} / month</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.features.map((f: string) => (
                    <Badge key={f} className="bg-slate-700/50 text-slate-300 border-0 text-[10px] px-1.5 py-0">
                      {f}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 gap-1"
                  disabled={syncMutation.isPending}
                  onClick={() => syncMutation.mutate({ providerId: p.id })}
                >
                  {p.status === "connected" ? (
                    <><RefreshCw className="w-3 h-3" /> Sync Transactions</>
                  ) : (
                    <><Plus className="w-3 h-3" /> Connect</>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fraud Alerts & Top Drivers */}
        <div className="space-y-4">
          {analytics?.fraudAlerts && analytics.fraudAlerts.length > 0 && (
            <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center gap-2`}>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Fraud Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.fraudAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <Badge className={cn(
                        "border-0 text-xs",
                        alert.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-slate-400">${alert.amount.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-white mt-1">{alert.description}</p>
                    <p className="text-xs text-slate-400">{alert.driverName}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {analytics?.topDriversByMpg && (
            <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center gap-2`}>
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  Top Drivers by MPG
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.topDriversByMpg.map((d: any, i: number) => (
                    <div key={d.driverName} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs w-4">#{i + 1}</span>
                        <span className="text-white">{d.driverName}</span>
                      </div>
                      <span className="text-green-400 font-mono">{d.mpg} MPG</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analytics?.spendByState && (
            <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center gap-2`}>
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  Spend by State (Top 5)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.spendByState.map((s: any) => (
                    <div key={s.state} className="flex items-center justify-between text-sm">
                      <span className="text-white font-mono">{s.state}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 text-xs">{s.gallons.toLocaleString()} gal</span>
                        <span className="text-indigo-400 font-mono">${s.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ELD / Telematics Panel ──────────────────────────────────────────────────

function EldTelematicsPanel({ isLight = false }: { isLight?: boolean }) {
  const providersQuery = (trpc as any).advancedIntegrations.getEldProviders.useQuery();
  const telematicsQuery = (trpc as any).advancedIntegrations.getTelematics.useQuery({});
  const syncMutation = (trpc as any).advancedIntegrations.syncEldData.useMutation();

  const providers = providersQuery.data?.providers || [];
  const telematics = telematicsQuery.data;
  const vehicles = telematics?.vehicles || [];
  const telSummary = telematics?.summary;

  const HOS_COLORS: Record<string, string> = {
    driving: "bg-green-500/20 text-green-400",
    on_duty: "bg-blue-500/20 text-blue-400",
    sleeper_berth: "bg-purple-500/20 text-purple-400",
    off_duty: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      {telSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "In Motion", value: telSummary.inMotion, color: "text-green-400", bg: "bg-green-500/20" },
            { label: "Idle", value: telSummary.idle, color: "text-yellow-400", bg: "bg-yellow-500/20" },
            { label: "Parked", value: telSummary.parked, color: "text-slate-300", bg: "bg-slate-500/20" },
            { label: "Harsh Events", value: telSummary.harshEventsToday, color: "text-red-400", bg: "bg-red-500/20" },
          ].map((s) => (
            <Card key={s.label} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
              <CardContent className="p-3 text-center">
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-400 uppercase">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ELD Providers */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center gap-2`}>
              <Server className="w-4 h-4 text-[#1473FF]" />
              ELD Providers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                <div className="flex items-center justify-between mb-1">
                  <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm font-medium`}>{p.name}</p>
                  <HealthBadge health={p.apiStatus} />
                </div>
                {p.devicesConnected > 0 && (
                  <p className="text-xs text-slate-400 mb-2">{p.devicesConnected} devices connected</p>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.features.slice(0, 3).map((f: string) => (
                    <Badge key={f} className="bg-slate-700/50 text-slate-300 border-0 text-[10px] px-1.5 py-0">
                      {f}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 gap-1"
                  disabled={syncMutation.isPending || p.status !== "connected"}
                  onClick={() => syncMutation.mutate({ providerId: p.id, dataType: "all" as const })}
                >
                  {p.status === "connected" ? (
                    <><RefreshCw className="w-3 h-3" /> Sync Data</>
                  ) : (
                    <><Plus className="w-3 h-3" /> Connect</>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vehicle Telematics */}
        <div className="lg:col-span-2">
          <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-lg flex items-center gap-2`}>
                <Truck className="w-5 h-5 text-[#1473FF]" />
                Live Telematics Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vehicles.map((v: any) => (
                <div key={v.vehicleId} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-sm">{v.vehicleId}</span>
                      <span className="text-slate-400 text-xs">- {v.driverName}</span>
                    </div>
                    <Badge className={cn("border-0 text-xs", HOS_COLORS[v.hosStatus] || "bg-slate-500/20 text-slate-400")}>
                      {v.hosStatus.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Speed:</span>
                      <span className={cn("ml-1 font-mono", v.speed > 65 ? "text-yellow-400" : "text-white")}>
                        {v.speed} mph
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fuel:</span>
                      <span className={cn("ml-1 font-mono", v.fuelLevel < 25 ? "text-red-400" : "text-white")}>
                        {v.fuelLevel}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Drive Left:</span>
                      <span className={cn("ml-1 font-mono", v.hoursRemaining.driving < 2 ? "text-red-400" : "text-white")}>
                        {v.hoursRemaining.driving}h
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Engine:</span>
                      <span className={cn("ml-1 font-mono", v.diagnostics.engineTemp > 200 ? "text-yellow-400" : "text-white")}>
                        {v.diagnostics.engineTemp}F
                      </span>
                    </div>
                  </div>
                  {v.lastHarshEvent && (
                    <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {v.lastHarshEvent.type.replace("_", " ")} - {formatTimeAgo(v.lastHarshEvent.timestamp)}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Accounting Sync Panel ───────────────────────────────────────────────────

function AccountingSyncPanel({ isLight = false }: { isLight?: boolean }) {
  const syncQuery = (trpc as any).advancedIntegrations.getAccountingSync.useQuery();
  const syncMutation = (trpc as any).advancedIntegrations.syncToAccounting.useMutation();

  const systems = syncQuery.data?.systems || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {systems.map((sys: any) => (
          <Card key={sys.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center justify-between`}>
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#1473FF]" />
                  {sys.name}
                </span>
                <Badge className={cn(
                  "border-0",
                  sys.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                )}>
                  {sys.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sys.status === "connected" ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-900/30">
                      <p className="text-slate-400">Invoices</p>
                      <p className="text-white font-mono">{sys.invoicesSynced}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/30">
                      <p className="text-slate-400">Payments</p>
                      <p className="text-white font-mono">{sys.paymentsSynced}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/30">
                      <p className="text-slate-400">Journal Entries</p>
                      <p className="text-white font-mono">{sys.journalEntriesSynced}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/30">
                      <p className="text-slate-400">Pending</p>
                      <p className={cn("font-mono", sys.pendingSync > 0 ? "text-yellow-400" : "text-white")}>{sys.pendingSync}</p>
                    </div>
                  </div>
                  {sys.mappings && (
                    <div className="text-xs space-y-1">
                      <p className="text-slate-400 uppercase text-[10px]">Account Mappings</p>
                      {Object.entries(sys.mappings).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-400">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <span className="text-slate-300 font-mono text-[11px]">{val as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sys.lastSync && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Last sync: {formatTimeAgo(sys.lastSync)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 gap-1"
                      disabled={syncMutation.isPending}
                      onClick={() => syncMutation.mutate({ systemId: sys.id, syncType: "all" as const })}
                    >
                      <RefreshCw className="w-3 h-3" /> Sync All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 gap-1"
                      disabled={syncMutation.isPending}
                      onClick={() => syncMutation.mutate({ systemId: sys.id, syncType: "invoices" as const })}
                    >
                      <Send className="w-3 h-3" /> Invoices
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm mb-3">Not connected</p>
                  <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#6366f1] gap-1">
                    <Plus className="w-3 h-3" /> Connect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Marketplace Panel ───────────────────────────────────────────────────────

function MarketplacePanel({ isLight = false }: { isLight?: boolean }) {
  const marketplaceQuery = (trpc as any).advancedIntegrations.getApiMarketplace.useQuery();
  const categories = marketplaceQuery.data?.categories || [];

  return (
    <div className="space-y-6">
      {marketplaceQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800/50" />
          ))}
        </div>
      ) : (
        categories.map((cat: any) => (
          <div key={cat.name}>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">{cat.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.integrations.map((integration: any) => (
                <Card key={integration.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl hover:border-indigo-500/30 transition-colors`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className={`${isLight ? "text-slate-900" : "text-white"} font-medium text-sm`}>{integration.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{integration.description}</p>
                      </div>
                      {integration.installed && (
                        <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-yellow-400">{integration.rating}</span>
                        <span>{integration.installs.toLocaleString()} installs</span>
                      </div>
                      <Button size="sm" variant={integration.installed ? "ghost" : "outline"}
                        className={cn(
                          "h-7 text-xs",
                          integration.installed
                            ? "text-slate-400"
                            : "border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                        )}>
                        {integration.installed ? "Manage" : "Install"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Webhook & API Panel ─────────────────────────────────────────────────────

function WebhookApiPanel({ isLight = false }: { isLight?: boolean }) {
  const webhookQuery = (trpc as any).advancedIntegrations.getWebhookConfig.useQuery();
  const apiKeysQuery = (trpc as any).advancedIntegrations.getApiKeys.useQuery();
  const testMutation = (trpc as any).advancedIntegrations.testWebhook.useMutation();

  const webhooks = webhookQuery.data?.webhooks || [];
  const availableEvents = webhookQuery.data?.availableEvents || [];
  const apiKeys = apiKeysQuery.data?.keys || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webhooks */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-[#1473FF]" />
                Webhook Endpoints
              </span>
              <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#6366f1] gap-1 h-7 text-xs">
                <Plus className="w-3 h-3" /> Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {webhooks.map((wh: any) => (
              <div key={wh.id} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-mono truncate max-w-[260px]">{wh.url}</p>
                  <Badge className={cn("border-0 text-xs", wh.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                    {wh.active ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {wh.events.map((e: string) => (
                    <Badge key={e} className="bg-indigo-500/10 text-indigo-400 border-0 text-[10px] px-1.5 py-0">
                      {e}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    {wh.lastDelivery && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTimeAgo(wh.lastDelivery)}
                      </span>
                    )}
                    {wh.failureCount > 0 && (
                      <span className="text-red-400">{wh.failureCount} failures</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs text-slate-400 gap-1"
                    disabled={testMutation.isPending}
                    onClick={() => testMutation.mutate({ webhookId: wh.id })}
                  >
                    <Play className="w-3 h-3" /> Test
                  </Button>
                </div>
              </div>
            ))}

            {availableEvents.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-slate-400 uppercase mb-2">Available Events ({availableEvents.length})</p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableEvents.map((e: string) => (
                    <Badge key={e} className="bg-slate-700/50 text-slate-300 border-0 text-[10px] px-1.5 py-0">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#1473FF]" />
                API Keys
              </span>
              <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#6366f1] gap-1 h-7 text-xs">
                <Plus className="w-3 h-3" /> Generate
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {apiKeys.map((key: any) => (
              <div key={key.id} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                <div className="flex items-center justify-between mb-1">
                  <p className={`${isLight ? "text-slate-900" : "text-white"} text-sm font-medium`}>{key.name}</p>
                  <Badge className={cn("border-0 text-xs", key.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400")}>
                    {key.active ? "Active" : "Revoked"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mb-2">{key.key}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {key.permissions.map((p: string) => (
                    <Badge key={p} className="bg-blue-500/10 text-blue-400 border-0 text-[10px] px-1.5 py-0">
                      {p}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Rate: {key.rateLimit}/min</span>
                  {key.lastUsed && <span>Used: {formatTimeAgo(key.lastUsed)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Load Board Panel ────────────────────────────────────────────────────────

function LoadBoardPanel({ isLight = false }: { isLight?: boolean }) {
  const boardsQuery = (trpc as any).advancedIntegrations.getLoadBoardIntegrations.useQuery();
  const boards = boardsQuery.data?.boards || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {boards.map((board: any) => (
          <Card key={board.id} className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
            <CardHeader className="pb-3">
              <CardTitle className={`${isLight ? "text-slate-900" : "text-white"} text-sm flex items-center justify-between`}>
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#1473FF]" />
                  {board.name}
                </span>
                <Badge className={cn(
                  "border-0",
                  board.status === "connected" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                )}>
                  {board.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {board.status === "connected" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-900/30">
                      <p className="text-slate-400">Loads Posted</p>
                      <p className="text-white font-mono text-lg">{board.loadsPosted}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-900/30">
                      <p className="text-slate-400">Matches</p>
                      <p className="text-green-400 font-mono text-lg">{board.matchesFound}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Avg post age: {board.avgPostAge}</p>
                  <Button size="sm" className="w-full bg-gradient-to-r from-[#1473FF] to-[#6366f1] gap-1">
                    <Upload className="w-3 h-3" /> Post Load
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm mb-3">Connect to start posting</p>
                  <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#6366f1] gap-1">
                    <Plus className="w-3 h-3" /> Connect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Integration Logs Panel ──────────────────────────────────────────────────

function LogsPanel({ isLight = false }: { isLight?: boolean }) {
  const logsQuery = (trpc as any).advancedIntegrations.getIntegrationLogs.useQuery({});
  const logs = logsQuery.data?.logs || [];

  const LEVEL_STYLES: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    info: { color: "text-blue-400", bg: "bg-blue-500/20", icon: Activity },
    warn: { color: "text-yellow-400", bg: "bg-yellow-500/20", icon: AlertTriangle },
    error: { color: "text-red-400", bg: "bg-red-500/20", icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <Card className={`${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50"} rounded-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1473FF]" />
              Integration Logs
            </span>
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 gap-1 h-7 text-xs">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 bg-slate-700/50" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => {
                const style = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
                const Icon = style.icon;
                return (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20 flex items-start gap-3">
                    <div className={cn("p-1 rounded", style.bg)}>
                      <Icon className={cn("w-3.5 h-3.5", style.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-slate-700/50 text-slate-300 border-0 text-[10px] px-1.5 py-0">
                            {log.integrationId}
                          </Badge>
                          <Badge className={cn("border-0 text-[10px] px-1.5 py-0", style.bg, style.color)}>
                            {log.level}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-500">{formatTimeAgo(log.timestamp)}</span>
                      </div>
                      <p className="text-sm text-white">{log.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
