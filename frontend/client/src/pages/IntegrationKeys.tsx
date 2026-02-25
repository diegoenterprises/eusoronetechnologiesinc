/**
 * INTEGRATION KEYS SETTINGS
 * Per-terminal API key management for all 7 integration providers.
 * Terminal users bring their own keys — every connected terminal
 * enriches the platform ecosystem (Hot Zones, Market Intel, etc.)
 *
 * Providers: DTN, Enverus, OPIS, Genscape, Buckeye TAS, FMCSA SaferSys, Dearman
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Key, Shield, ShieldCheck, Plug2, Zap, Eye, EyeOff,
  CheckCircle, XCircle, Loader2, AlertTriangle, Settings,
  Globe, Database, BarChart3, Truck, Fuel, Activity,
  ArrowRight, RefreshCw, Trash2, Plus, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const cell = "rounded-2xl border border-slate-200/60 dark:border-white/[0.04] bg-white dark:bg-white/[0.02]";
const inp = "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-500";

interface ProviderConfig {
  slug: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  category: "automation" | "market" | "safety";
}

const PROVIDERS: ProviderConfig[] = [
  {
    slug: "dtn", name: "DTN", description: "Terminal automation, rack pricing, BOL generation, inventory sync",
    icon: Zap, color: "text-blue-400", bgColor: "bg-blue-500/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "dtn_xxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "••••••••", secret: true },
      { key: "externalId", label: "Terminal ID", placeholder: "DTN terminal identifier" },
    ],
    category: "automation",
  },
  {
    slug: "buckeye_tas", name: "Buckeye TAS", description: "Appointments, allocations, gate check-in, loading events",
    icon: Database, color: "text-cyan-400", bgColor: "bg-cyan-500/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "bkt_xxxxxx", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "••••••••", secret: true },
      { key: "externalId", label: "Terminal Code", placeholder: "Buckeye terminal code" },
    ],
    category: "automation",
  },
  {
    slug: "dearman", name: "Dearman Systems", description: "Load authorization, orders, rack status, gate events, contracts",
    icon: Settings, color: "text-purple-400", bgColor: "bg-purple-500/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "dm_xxxxxx", secret: true },
      { key: "externalId", label: "Account ID", placeholder: "Dearman account ID" },
    ],
    category: "automation",
  },
  {
    slug: "opis", name: "OPIS (ICE Data)", description: "Rack pricing, spot prices, market assessments, retail benchmarks",
    icon: Fuel, color: "text-amber-400", bgColor: "bg-amber-500/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "opis_xxxxxx", secret: true },
      { key: "apiSecret", label: "Client Secret", placeholder: "••••••••", secret: true },
    ],
    category: "market",
  },
  {
    slug: "genscape", name: "Genscape (Wood Mac)", description: "Oil storage, pipeline flows, refinery utilization, supply/demand",
    icon: Activity, color: "text-violet-400", bgColor: "bg-violet-500/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "gs_xxxxxx", secret: true },
    ],
    category: "market",
  },
  {
    slug: "enverus", name: "Enverus", description: "Crude prices, production data, wells, rigs, pipeline flows",
    icon: BarChart3, color: "text-emerald-400", bgColor: "bg-emerald-500/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "env_xxxxxx", secret: true },
      { key: "apiSecret", label: "Secret Key", placeholder: "••••••••", secret: true },
    ],
    category: "market",
  },
  {
    slug: "fmcsa", name: "FMCSA SaferSys", description: "Carrier vetting, BASICs scores, authority status, crash history",
    icon: Shield, color: "text-red-400", bgColor: "bg-red-500/10",
    fields: [
      { key: "apiKey", label: "WebKey", placeholder: "FMCSA web key", secret: true },
    ],
    category: "safety",
  },
];

const CATEGORIES = [
  { key: "all", label: "All Providers" },
  { key: "automation", label: "Terminal Automation" },
  { key: "market", label: "Market Intelligence" },
  { key: "safety", label: "Compliance & Safety" },
];

export default function IntegrationKeys() {
  const [category, setCategory] = useState("all");
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const keysQuery = (trpc as any).terminals?.getIntegrationKeys?.useQuery?.() || { data: null, isLoading: false };
  const utils = (trpc as any).useUtils?.() || {};

  const saveMut = (trpc as any).terminals?.saveIntegrationKey?.useMutation?.({
    onSuccess: (d: any) => {
      toast.success(`${d.action === "created" ? "Connected" : "Updated"} successfully`);
      setConfiguring(null);
      setFormData({});
      utils.terminals?.getIntegrationKeys?.invalidate?.();
    },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const removeMut = (trpc as any).terminals?.removeIntegrationKey?.useMutation?.({
    onSuccess: () => {
      toast.success("Disconnected");
      utils.terminals?.getIntegrationKeys?.invalidate?.();
    },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => {}, isPending: false };

  const connectedKeys = (keysQuery.data || []) as any[];
  const getStatus = (slug: string) => connectedKeys.find((k: any) => k.provider === slug);

  const filtered = category === "all" ? PROVIDERS : PROVIDERS.filter(p => p.category === category);
  const connectedCount = PROVIDERS.filter(p => getStatus(p.slug)?.configured).length;

  const handleSave = (slug: string, fields: ProviderConfig["fields"]) => {
    const apiKey = formData.apiKey;
    if (!apiKey) { toast.error("API Key is required"); return; }
    saveMut.mutate({ provider: slug, apiKey, apiSecret: formData.apiSecret || undefined, externalId: formData.externalId || undefined });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-800 dark:text-white">Integration Keys</h1>
          <p className="text-sm text-slate-500 mt-0.5">Connect your API keys to unlock real-time terminal intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] px-3 py-1.5 rounded-xl">
            <Plug2 className="w-3.5 h-3.5" />
            <span>{connectedCount}/{PROVIDERS.length} Connected</span>
          </div>
        </div>
      </div>

      {/* Ecosystem value banner */}
      <div className={cn("p-5", cell)}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-[#1473FF]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-white">Your keys power the ecosystem</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              When you connect your integration keys, your terminal's market data and operations data enriches
              the entire EusoTrip platform — Hot Zones maps, Market Intelligence, and supply chain visibility
              get stronger with every connected terminal. Your keys are encrypted and never shared.
            </p>
          </div>
          <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)} className={cn(
            "text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors",
            category === c.key ? "bg-[#1473FF]/15 text-[#1473FF]" : "bg-slate-50 dark:bg-white/[0.03] text-slate-500 hover:text-slate-300"
          )}>{c.label}</button>
        ))}
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {filtered.map(provider => {
          const Icon = provider.icon;
          const status = getStatus(provider.slug);
          const isConfiguring = configuring === provider.slug;

          return (
            <div key={provider.slug} className={cn("overflow-hidden transition-all", cell, isConfiguring && "ring-1 ring-[#1473FF]/30")}>
              {/* Provider header */}
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", provider.bgColor)}>
                    <Icon className={cn("w-5.5 h-5.5", provider.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{provider.name}</p>
                      {status?.configured ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" />Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-full">Not connected</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                    {status?.lastSync && (
                      <p className="text-[10px] text-slate-400 mt-1">Last sync: {new Date(status.lastSync).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {status?.configured && (
                    <Button size="sm" variant="ghost" onClick={() => removeMut.mutate({ provider: provider.slug })}
                      className="h-8 px-2 text-red-400 hover:bg-red-400/10 text-[11px]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="sm" onClick={() => { setConfiguring(isConfiguring ? null : provider.slug); setFormData({}); }}
                    className={cn("h-8 px-4 rounded-xl text-[11px] font-medium shadow-none border",
                      isConfiguring ? "bg-slate-100 dark:bg-white/[0.06] text-slate-500 border-slate-200 dark:border-white/[0.08]"
                      : status?.configured ? "bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-white border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.1]"
                      : "bg-gradient-to-r from-[#1473FF] to-[#1473FF] text-white border-0 hover:shadow-md hover:shadow-[#1473FF]/20"
                    )}>
                    {isConfiguring ? "Cancel" : status?.configured ? "Update" : "Connect"}
                  </Button>
                </div>
              </div>

              {/* Configuration form (expanded) */}
              {isConfiguring && (
                <div className="px-5 pb-5 pt-0">
                  <div className="h-[1px] bg-slate-200/60 dark:bg-white/[0.04] mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {provider.fields.map(field => (
                      <div key={field.key}>
                        <label className="text-[10px] text-slate-500 mb-1 block uppercase tracking-wider font-semibold">{field.label}</label>
                        <div className="relative">
                          <Input
                            type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                            value={formData[field.key] || ""}
                            onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className={cn("h-10 pr-10", inp)}
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
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Keys are encrypted at rest (AES-256)
                    </p>
                    <Button
                      onClick={() => handleSave(provider.slug, provider.fields)}
                      disabled={!formData.apiKey || saveMut.isPending}
                      className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs font-medium shadow-none disabled:opacity-30"
                    >
                      {saveMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Key className="w-3.5 h-3.5 mr-1.5" />}
                      {saveMut.isPending ? "Saving..." : status?.configured ? "Update Key" : "Save & Connect"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center pt-4">
        <p className="text-[10px] text-slate-500">
          API keys are stored encrypted per-company. They are never shared with other users or companies on the platform.
        </p>
      </div>
    </div>
  );
}
