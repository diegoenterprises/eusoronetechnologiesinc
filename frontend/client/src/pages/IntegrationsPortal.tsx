import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Zap, Database, BarChart3, CheckCircle, Loader2, X, Eye, EyeOff,
  Settings, Activity, ChevronRight, Plug2, Lock, Fuel, Key, Trash2,
  Shield, Truck, TrendingUp, Droplets, Container, MapPin, FileText,
  Gauge, Radio, CircleDot, Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════
   INTEGRATION CATALOG — Each provider has unique branding,
   data-flow mapping, and feature capabilities.
   ═══════════════════════════════════════════════════════════════ */

interface Integration {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: React.ReactNode;
  category: "terminal_automation" | "market_data" | "analytics" | "compliance" | "telematics";
  brandFrom: string;
  brandTo: string;
  feeds: { label: string; icon: React.ReactNode }[];
  features: string[];
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "dtn",
    name: "DTN",
    provider: "DTN / Rittman",
    description: "Industry-leading terminal automation — rack operations, BOL generation, allocation management, real-time inventory levels, and rack pricing intelligence.",
    icon: <Zap className="w-6 h-6" />,
    category: "terminal_automation",
    brandFrom: "#0EA5E9",
    brandTo: "#06B6D4",
    feeds: [
      { label: "Dock Management", icon: <Container className="w-3 h-3" /> },
      { label: "Dispatch Load", icon: <Truck className="w-3 h-3" /> },
      { label: "Terminal Dashboard", icon: <Gauge className="w-3 h-3" /> },
    ],
    features: ["Rack Operations", "BOL Generation", "Allocation Mgmt", "Live Inventory", "Rack Pricing"],
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "dtn_xxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "••••••••", secret: true },
      { key: "externalId", label: "Terminal ID", placeholder: "DTN terminal identifier" },
    ],
  },
  {
    id: "enverus",
    name: "Enverus",
    provider: "Enverus Inc.",
    description: "Energy analytics platform — crude oil benchmarks (WTI, Brent), production data by basin, pipeline flow intelligence, and market positioning insights.",
    icon: <TrendingUp className="w-6 h-6" />,
    category: "market_data",
    brandFrom: "#10B981",
    brandTo: "#059669",
    feeds: [
      { label: "Market Intelligence", icon: <BarChart3 className="w-3 h-3" /> },
      { label: "Hot Zones", icon: <MapPin className="w-3 h-3" /> },
      { label: "Terminal Dashboard", icon: <Gauge className="w-3 h-3" /> },
    ],
    features: ["Crude Benchmarks", "Basin Production", "Pipeline Flows", "Market Positioning"],
    fields: [
      { key: "apiKey", label: "Secret Key", placeholder: "env_xxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "••••••••", secret: true },
    ],
  },
  {
    id: "opis",
    name: "OPIS",
    provider: "OPIS by Dow Jones (ICE Data Services)",
    description: "Wholesale rack pricing for refined products — spot market assessments, terminal-level pricing, retail fuel benchmarks, and regional price differentials via ICE Data API.",
    icon: <Fuel className="w-6 h-6" />,
    category: "market_data",
    brandFrom: "#F59E0B",
    brandTo: "#EA580C",
    feeds: [
      { label: "Market Intelligence", icon: <BarChart3 className="w-3 h-3" /> },
      { label: "Terminal Dashboard", icon: <Gauge className="w-3 h-3" /> },
      { label: "Dispatch Load", icon: <Truck className="w-3 h-3" /> },
    ],
    features: ["Rack Pricing", "Spot Assessments", "Retail Benchmarks", "Price Differentials"],
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "opis_xxxxxx", secret: true },
      { key: "apiSecret", label: "Client Secret", placeholder: "••••••••", secret: true },
    ],
  },
  {
    id: "genscape",
    name: "Genscape",
    provider: "Genscape (Wood Mackenzie)",
    description: "Physical energy market intelligence via Lens Direct API — oil storage levels at Cushing & Gulf Coast, pipeline flows, refinery utilization, and supply/demand fundamentals.",
    icon: <Activity className="w-6 h-6" />,
    category: "analytics",
    brandFrom: "#8B5CF6",
    brandTo: "#7C3AED",
    feeds: [
      { label: "Market Intelligence", icon: <BarChart3 className="w-3 h-3" /> },
      { label: "Hot Zones", icon: <MapPin className="w-3 h-3" /> },
      { label: "Terminal Dashboard", icon: <Gauge className="w-3 h-3" /> },
    ],
    features: ["Storage Levels", "Pipeline Flows", "Refinery Utilization", "Supply/Demand"],
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "gs_xxxxxx", secret: true },
    ],
  },
  {
    id: "buckeye_tas",
    name: "Buckeye TAS",
    provider: "Buckeye Partners",
    description: "Terminal automation for Buckeye-operated facilities — scheduling, allocation management, loading rack orchestration, inventory tracking, and automated BOL generation.",
    icon: <Database className="w-6 h-6" />,
    category: "terminal_automation",
    brandFrom: "#6366F1",
    brandTo: "#4F46E5",
    feeds: [
      { label: "Dock Management", icon: <Container className="w-3 h-3" /> },
      { label: "Appointments", icon: <Radio className="w-3 h-3" /> },
      { label: "Dispatch Load", icon: <Truck className="w-3 h-3" /> },
    ],
    features: ["Scheduling", "Allocation Mgmt", "Rack Orchestration", "Inventory", "BOL Generation"],
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "bkt_xxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "••••••••", secret: true },
      { key: "externalId", label: "Terminal Code", placeholder: "Buckeye terminal code" },
    ],
  },
  {
    id: "dearman",
    name: "Dearman Systems",
    provider: "Dearman Systems",
    description: "TAS V5/V5+ terminal automation — load authorization, order management, rack status monitoring, gate event processing, contract enforcement, and BOL generation.",
    icon: <Settings className="w-6 h-6" />,
    category: "terminal_automation",
    brandFrom: "#64748B",
    brandTo: "#475569",
    feeds: [
      { label: "Dock Management", icon: <Container className="w-3 h-3" /> },
      { label: "Gate Operations", icon: <Shield className="w-3 h-3" /> },
      { label: "Dispatch Load", icon: <Truck className="w-3 h-3" /> },
    ],
    features: ["Load Authorization", "Order Mgmt", "Gate Events", "Contract Enforcement", "BOL Generation"],
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "dm_xxxxxx", secret: true },
      { key: "externalId", label: "Account ID", placeholder: "Dearman account ID" },
    ],
  },
  {
    id: "fmcsa",
    name: "FMCSA SafeStat",
    provider: "Federal Motor Carrier Safety Admin",
    description: "Carrier safety verification at the gate — DOT/MC authority lookup, BASICs safety scores, crash history, inspection results, and hazmat endorsement validation.",
    icon: <Shield className="w-6 h-6" />,
    category: "compliance",
    brandFrom: "#EF4444",
    brandTo: "#DC2626",
    feeds: [
      { label: "Gate Operations", icon: <Shield className="w-3 h-3" /> },
      { label: "Hot Zones", icon: <MapPin className="w-3 h-3" /> },
      { label: "Access Validation", icon: <CheckCircle className="w-3 h-3" /> },
    ],
    features: ["DOT/MC Lookup", "BASICs Scores", "Crash History", "Inspection Results", "Hazmat Validation"],
    fields: [
      { key: "apiKey", label: "WebServices API Key", placeholder: "Your FMCSA API key", secret: true },
    ],
  },
  {
    id: "motive",
    name: "Motive ELD",
    provider: "Motive (KeepTruckin)",
    description: "Fleet telematics and ELD compliance — real-time GPS tracking, HOS monitoring, DVIR management, driver scorecards, and fuel consumption analytics.",
    icon: <Truck className="w-6 h-6" />,
    category: "telematics",
    brandFrom: "#14B8A6",
    brandTo: "#0D9488",
    feeds: [
      { label: "Fleet Tracking", icon: <MapPin className="w-3 h-3" /> },
      { label: "Hot Zones", icon: <CircleDot className="w-3 h-3" /> },
      { label: "Gate Operations", icon: <Shield className="w-3 h-3" /> },
    ],
    features: ["GPS Tracking", "HOS Monitoring", "DVIR Management", "Driver Scorecards", "Fuel Analytics"],
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "mk_xxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "••••••••", secret: true },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  terminal_automation: "Terminal Automation",
  market_data: "Market Data",
  compliance: "Compliance & Safety",
  analytics: "Supply Analytics",
  telematics: "Fleet & Telematics",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function IntegrationsPortal() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // State
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [catalogFilter, setCatalogFilter] = useState<string>("all");

  // Key management API
  const keysQuery = (trpc as any).terminals?.getIntegrationKeys?.useQuery?.() || { data: null, isLoading: false };
  const utils = (trpc as any).useUtils?.() || {};

  const saveMut = (trpc as any).terminals?.saveIntegrationKey?.useMutation?.({
    onSuccess: (d: any) => {
      toast.success(`${d?.action === "created" ? "Connected" : "Updated"} successfully`);
      setSelectedIntegration(null);
      setFormData({});
      setShowCatalog(false);
      utils.terminals?.getIntegrationKeys?.invalidate?.();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save"),
  }) || { mutate: () => {}, isPending: false };

  const removeMut = (trpc as any).terminals?.removeIntegrationKey?.useMutation?.({
    onSuccess: () => {
      toast.success("Disconnected");
      utils.terminals?.getIntegrationKeys?.invalidate?.();
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  }) || { mutate: () => {}, isPending: false };

  const connectedKeys = (keysQuery.data || []) as any[];
  const getStatus = (slug: string) => connectedKeys.find((k: any) => k.provider === slug);
  const connectedCount = INTEGRATIONS.filter(i => getStatus(i.id)?.configured).length;
  const hasIntegrations = connectedCount > 0;

  function handleSave(integration: Integration) {
    const apiKey = formData.apiKey;
    if (!apiKey) { toast.error("API Key is required"); return; }
    saveMut.mutate({
      provider: integration.id,
      apiKey,
      apiSecret: formData.apiSecret || undefined,
      externalId: formData.externalId || undefined,
    });
  }

  useEffect(() => {
    if (!selectedIntegration) {
      setFormData({});
      setShowSecrets({});
    }
  }, [selectedIntegration]);

  const filteredCatalog = catalogFilter === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter(i => i.category === catalogFilter);

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20"
          )}>
            <Plug2 className="w-5 h-5 text-[#1473FF]" />
          </div>
          <div>
            <h1 className={cn("text-[28px] font-semibold tracking-tight", isLight ? "text-slate-900" : "text-white")}>
              Integrations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Connect third-party systems to your terminal operations
            </p>
          </div>
          {hasIntegrations && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] px-3 py-1.5 rounded-xl">
              <Plug2 className="w-3.5 h-3.5" />
              <span>{connectedCount}/{INTEGRATIONS.length} Connected</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Empty State — Center Add Button ─── */}
      {!hasIntegrations && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center py-32"
        >
          <div className="relative group cursor-pointer" onClick={() => setShowCatalog(true)}>
            <div className="absolute -inset-[10%] rounded-[32px] bg-gradient-to-r from-[#1473FF]/25 to-[#BE01FF]/25 blur-2xl transition-all duration-500" />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative w-32 h-32 rounded-[28px] flex flex-col items-center justify-center gap-2 transition-all duration-300",
                isLight
                  ? "bg-white hover:bg-[#1473FF]/[0.02] shadow-sm hover:shadow-lg hover:shadow-[#1473FF]/10"
                  : "bg-white/[0.02] hover:bg-[#1473FF]/[0.03]"
              )}
            >
              <svg className="absolute inset-[1px] pointer-events-none" width="100%" height="100%" fill="none">
                <defs>
                  <linearGradient id="gdb-empty" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1473FF" />
                    <stop offset="100%" stopColor="#BE01FF" />
                  </linearGradient>
                </defs>
                <rect className="transition-opacity duration-300 opacity-100 group-hover:opacity-0" width="100%" height="100%" rx="27" stroke={isLight ? "rgba(203,213,225,1)" : "rgba(255,255,255,0.12)"} strokeWidth="2" strokeDasharray="8 6" />
                <rect className="transition-opacity duration-300 opacity-0 group-hover:opacity-100" width="100%" height="100%" rx="27" stroke="url(#gdb-empty)" strokeWidth="2" strokeDasharray="8 6" />
              </svg>
              <Plus className={cn("w-8 h-8 transition-colors", isLight ? "text-slate-400 group-hover:text-[#1473FF]" : "text-white/30 group-hover:text-[#1473FF]")} />
              <span className={cn("text-xs font-medium transition-colors", isLight ? "text-slate-400 group-hover:text-[#1473FF]" : "text-white/30 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#1473FF] group-hover:to-[#BE01FF] group-hover:bg-clip-text")}>
                Add
              </span>
            </motion.button>
          </div>

          <p className={cn("mt-8 text-sm", isLight ? "text-slate-400" : "text-white/30")}>
            Connect your first integration
          </p>
          <p className={cn("mt-1 text-xs", isLight ? "text-slate-400" : "text-white/20")}>
            DTN · Enverus · OPIS · Genscape · and more
          </p>
        </motion.div>
      )}

      {/* ─── Connected Integrations Grid ─── */}
      {hasIntegrations && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.filter(i => getStatus(i.id)?.configured).map((integration, idx) => {
              const status = getStatus(integration.id);
              return (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "group relative rounded-2xl border overflow-hidden transition-all duration-300",
                    isLight
                      ? "bg-white border-slate-200/80 hover:shadow-xl hover:shadow-black/[0.04]"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                  )}
                >
                  {/* Provider brand accent bar */}
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${integration.brandFrom}, ${integration.brandTo})` }} />

                  <div className="p-5">
                    <div className="flex items-start gap-3.5">
                      {/* Provider-branded icon */}
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 3 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${integration.brandFrom}20, ${integration.brandTo}20)` }}
                      >
                        <span style={{ color: integration.brandFrom }}>{integration.icon}</span>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{integration.name}</p>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            <Wifi className="w-2.5 h-2.5" />Live
                          </span>
                        </div>
                        <p className={cn("text-[11px] mt-0.5", isLight ? "text-slate-500" : "text-white/40")}>{integration.provider}</p>
                      </div>
                    </div>

                    {/* Data flow chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {integration.feeds.map(f => (
                        <span key={f.label} className={cn(
                          "flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-md",
                          isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.04] text-white/40"
                        )}>
                          {f.icon}{f.label}
                        </span>
                      ))}
                    </div>

                    {status?.lastSync && (
                      <p className="text-[10px] text-slate-400 mt-2.5">Synced {new Date(status.lastSync).toLocaleString()}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={cn("flex items-center gap-2 px-5 py-3 border-t",
                    isLight ? "border-slate-100 bg-slate-50/50" : "border-white/[0.04] bg-white/[0.01]"
                  )}>
                    <button
                      onClick={() => { setSelectedIntegration(integration); }}
                      className={cn("flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-lg transition-colors",
                        isLight ? "text-slate-500 hover:bg-white hover:shadow-sm" : "text-white/40 hover:bg-white/[0.06]"
                      )}
                    >
                      <Key className="w-3 h-3" />Update Keys
                    </button>
                    <button
                      onClick={() => removeMut.mutate({ provider: integration.id })}
                      className="text-[11px] font-medium py-1.5 px-3 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Add more button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCatalog(true)}
              className={cn(
                "group relative rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all min-h-[160px]",
                isLight
                  ? "bg-slate-50/50"
                  : "bg-white/[0.01] hover:bg-[#1473FF]/[0.03]"
              )}
            >
              <svg className="absolute inset-[1px] pointer-events-none" width="100%" height="100%" fill="none">
                <defs>
                  <linearGradient id="gdb-grid" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1473FF" />
                    <stop offset="100%" stopColor="#BE01FF" />
                  </linearGradient>
                </defs>
                <rect className="transition-opacity duration-300 opacity-100 group-hover:opacity-0" width="100%" height="100%" rx="15" stroke={isLight ? "rgba(226,232,240,1)" : "rgba(255,255,255,0.08)"} strokeWidth="2" strokeDasharray="8 6" />
                <rect className="transition-opacity duration-300 opacity-0 group-hover:opacity-100" width="100%" height="100%" rx="15" stroke="url(#gdb-grid)" strokeWidth="2" strokeDasharray="8 6" />
              </svg>
              <Plus className={cn("w-6 h-6 transition-colors", isLight ? "text-slate-400 group-hover:text-[#1473FF]" : "text-white/30 group-hover:text-[#1473FF]")} />
              <span className={cn("text-xs font-medium transition-colors", isLight ? "text-slate-400 group-hover:text-[#1473FF]" : "text-white/30 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-[#1473FF] group-hover:to-[#BE01FF] group-hover:bg-clip-text")}>Add Integration</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          CATALOG MODAL — Browse all integrations (portaled to body)
          ═══════════════════════════════════════════════════════ */}
      {createPortal(
      <AnimatePresence>
        {showCatalog && !selectedIntegration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
            onClick={() => setShowCatalog(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border shadow-2xl mx-4",
                isLight ? "bg-white border-slate-200" : "bg-[#0f0f17] border-white/[0.08]"
              )}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={cn("px-6 pt-6 pb-4 border-b shrink-0", isLight ? "border-slate-100" : "border-white/[0.06]")}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={cn("text-xl font-semibold", isLight ? "text-slate-900" : "text-white")}>
                      Add Integration
                    </h2>
                    <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-white/40")}>
                      Choose a system to connect to your terminal
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCatalog(false)}
                    className={cn("p-2 rounded-xl transition-colors", isLight ? "hover:bg-slate-100" : "hover:bg-white/[0.06]")}
                  >
                    <X className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-white/40")} />
                  </button>
                </div>

                {/* Category filter */}
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  {["all", "terminal_automation", "market_data", "analytics", "compliance", "telematics"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCatalogFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        catalogFilter === cat
                          ? "bg-[#1473FF]/10 text-[#1473FF]"
                          : isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/40 hover:bg-white/[0.06]"
                      )}
                    >
                      {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Integration list */}
              <div className="overflow-y-auto flex-1 min-h-0 p-4 pb-6">
                <div className="space-y-3">
                  {filteredCatalog.map((integration, idx) => {
                    const isAlreadyConfigured = !!getStatus(integration.id)?.configured;
                    return (
                      <motion.button
                        key={integration.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        whileHover={!isAlreadyConfigured ? { x: 4 } : undefined}
                        disabled={isAlreadyConfigured}
                        onClick={() => {
                          if (!isAlreadyConfigured) {
                            setSelectedIntegration(integration);
                          }
                        }}
                        className={cn(
                          "w-full rounded-2xl border text-left transition-all duration-200 overflow-hidden",
                          !isAlreadyConfigured
                            ? isLight
                              ? "border-slate-200/80 hover:shadow-md cursor-pointer"
                              : "border-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                            : isLight
                              ? "border-slate-100 bg-slate-50/30 opacity-50 cursor-default"
                              : "border-white/[0.03] bg-white/[0.01] opacity-40 cursor-default"
                        )}
                      >
                        {/* Provider brand accent */}
                        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${integration.brandFrom}, ${integration.brandTo})` }} />

                        <div className="flex items-start gap-4 p-4">
                          {/* Branded icon */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${integration.brandFrom}18, ${integration.brandTo}18)` }}
                          >
                            <span style={{ color: integration.brandFrom }}>{integration.icon}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>
                                {integration.name}
                              </p>
                              <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-medium border",
                                isLight ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-white/[0.03] border-white/[0.06] text-white/30"
                              )}>
                                {CATEGORY_LABELS[integration.category]}
                              </span>
                              {isAlreadyConfigured && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                  <CheckCircle className="w-3 h-3" />Connected
                                </span>
                              )}
                            </div>
                            <p className={cn("text-[11px] leading-relaxed mt-1 line-clamp-2", isLight ? "text-slate-500" : "text-white/40")}>
                              {integration.description}
                            </p>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {integration.features.slice(0, 4).map(f => (
                                <span key={f} className={cn(
                                  "text-[8px] font-medium px-1.5 py-0.5 rounded",
                                  isLight ? "bg-slate-100 text-slate-400" : "bg-white/[0.04] text-white/30"
                                )}>
                                  {f}
                                </span>
                              ))}
                              {integration.features.length > 4 && (
                                <span className={cn("text-[8px] px-1.5 py-0.5 rounded", isLight ? "text-slate-400" : "text-white/20")}>
                                  +{integration.features.length - 4}
                                </span>
                              )}
                            </div>

                            {/* Data flow */}
                            {!isAlreadyConfigured && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={cn("text-[8px] font-semibold uppercase tracking-wider", isLight ? "text-slate-300" : "text-white/15")}>
                                  Feeds
                                </span>
                                {integration.feeds.map(f => (
                                  <span key={f.label} className="flex items-center gap-0.5 text-[9px]" style={{ color: `${integration.brandFrom}99` }}>
                                    {f.icon}{f.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          {!isAlreadyConfigured && (
                            <ChevronRight className={cn("w-5 h-5 flex-shrink-0 mt-1", isLight ? "text-slate-300" : "text-white/20")} />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}

      {/* ═══════════════════════════════════════════════════════
          CONFIGURATION MODAL — Enter API Keys (portaled to body)
          ═══════════════════════════════════════════════════════ */}
      {createPortal(
      <AnimatePresence>
        {selectedIntegration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
            onClick={() => { setSelectedIntegration(null); setShowCatalog(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "w-full max-w-lg rounded-3xl border shadow-2xl mx-4 overflow-hidden",
                isLight ? "bg-white border-slate-200" : "bg-[#0f0f17] border-white/[0.08]"
              )}
              onClick={e => e.stopPropagation()}
            >
              {/* Provider-branded gradient header */}
              <div className="px-8 pt-8 pb-6" style={{ background: `linear-gradient(135deg, ${selectedIntegration.brandFrom}, ${selectedIntegration.brandTo})` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                      className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"
                    >
                      <span className="text-white">{selectedIntegration.icon}</span>
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedIntegration.name}</h2>
                      <p className="text-xs text-white/70">{selectedIntegration.provider}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedIntegration(null); setShowCatalog(false); }}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Feature badges in header */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {selectedIntegration.features.map(f => (
                    <span key={f} className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/30 text-white backdrop-blur-sm border border-white/20">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Form body */}
              <div className="px-8 py-6 space-y-5">
                <p className={cn("text-xs leading-relaxed", isLight ? "text-slate-600" : "text-white/50")}>
                  {selectedIntegration.description}
                </p>

                {/* Data flow indicator */}
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-[10px]",
                  isLight ? "bg-slate-50 border border-slate-100" : "bg-white/[0.02] border border-white/[0.04]"
                )}>
                  <span className={cn("font-semibold uppercase tracking-wider", isLight ? "text-slate-500" : "text-white/30")}>Enhances</span>
                  {selectedIntegration.feeds.map(f => (
                    <span key={f.label} className="flex items-center gap-1 font-medium" style={{ color: selectedIntegration.brandFrom }}>
                      {f.icon}{f.label}
                    </span>
                  ))}
                </div>

                {/* Key fields */}
                <div className="space-y-3">
                  {selectedIntegration.fields.map(field => (
                    <div key={field.key}>
                      <label className={cn("text-[10px] font-semibold uppercase tracking-wider block mb-1.5", isLight ? "text-slate-700" : "text-white/50")}>
                        {field.label} <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                          value={formData[field.key] || ""}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={cn(
                            "w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors pr-10",
                            isLight
                              ? "bg-slate-50 border border-slate-200 text-slate-900 focus:border-[#1473FF]/40 placeholder:text-slate-400"
                              : "bg-white/[0.04] border border-white/[0.06] text-white focus:border-[#1473FF]/40 placeholder:text-white/20"
                          )}
                        />
                        {field.secret && (
                          <button
                            type="button"
                            onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                          >
                            {showSecrets[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security note + Save */}
                <div className="flex items-center justify-between pt-2">
                  <p className={cn("text-[10px] flex items-center gap-1", isLight ? "text-slate-500" : "text-white/30")}>
                    <Lock className="w-3 h-3" /> Keys encrypted at rest (AES-256)
                  </p>
                  <button
                    onClick={() => handleSave(selectedIntegration)}
                    disabled={!formData.apiKey || saveMut.isPending}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-xs font-medium hover:shadow-lg hover:shadow-[#1473FF]/20 transition-all disabled:opacity-30"
                  >
                    {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    {saveMut.isPending ? "Saving..." : getStatus(selectedIntegration.id)?.configured ? "Update Key" : "Save & Connect"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}
    </div>
  );
}
