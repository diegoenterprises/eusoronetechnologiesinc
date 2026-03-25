/**
 * DEVELOPER PORTAL PAGE (Phase 4 — Task 2.1.1 + 2.1.2)
 * MCP Write Tools reference, API Key management, Webhook config, SDK docs
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
  Key, Code, Webhook, BookOpen, Copy, Plus, Trash2,
  Shield, Activity, Clock, ExternalLink, Lock, Eye, EyeOff,
  Terminal, Zap, ChevronRight, RefreshCw
} from "lucide-react";

type DevTab = "api_keys" | "mcp_tools" | "webhooks" | "sdk";

export default function DeveloperPortal() {
  const { theme } = useTheme();
  const L = theme === "light";
  const [tab, setTab] = useState<DevTab>("api_keys");
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);

  const toolsQuery = (trpc as any).devPortal?.mcpTools?.getTools?.useQuery?.() || { data: [] };
  const scopesQuery = (trpc as any).devPortal?.mcpTools?.getScopes?.useQuery?.() || { data: [] };
  const keysQuery = (trpc as any).devPortal?.apiKeys?.list?.useQuery?.() || { data: [], refetch: () => {} };
  const webhooksQuery = (trpc as any).devPortal?.webhooks?.list?.useQuery?.() || { data: [], refetch: () => {} };
  const eventsQuery = (trpc as any).devPortal?.webhooks?.getEvents?.useQuery?.() || { data: [] };
  const sdkQuery = (trpc as any).devPortal?.sdk?.getInfo?.useQuery?.() || { data: null };

  const createKeyMutation = (trpc as any).devPortal?.apiKeys?.create?.useMutation?.() || { mutateAsync: async () => ({ apiKey: "demo_key" }), isPending: false };
  const revokeKeyMutation = (trpc as any).devPortal?.apiKeys?.revoke?.useMutation?.() || { mutateAsync: async () => ({}), isPending: false };

  const tools: any[] = Array.isArray(toolsQuery.data) ? toolsQuery.data : [];
  const scopes: any[] = Array.isArray(scopesQuery.data) ? scopesQuery.data : [];
  const keys: any[] = Array.isArray(keysQuery.data) ? keysQuery.data : [];
  const webhooksList: any[] = Array.isArray(webhooksQuery.data) ? webhooksQuery.data : [];
  const events: any[] = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];

  const cc = cn("rounded-2xl border", L ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const sc = cn("p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) { toast.error("Key name required"); return; }
    try {
      const res = await createKeyMutation.mutateAsync({ name: newKeyName, scopes: ["loads:read", "loads:write", "tracking:read"], expiresInDays: 365 });
      setShowNewKey(res.apiKey);
      setNewKeyName("");
      keysQuery.refetch?.();
      toast.success("API key created");
    } catch { toast.error("Failed to create key"); }
  };

  const handleRevokeKey = async (id: string) => {
    try { await revokeKeyMutation.mutateAsync({ keyId: id }); keysQuery.refetch?.(); toast.success("Key revoked"); } catch { toast.error("Failed"); }
  };

  const tabs: { id: DevTab; label: string; icon: React.ReactNode }[] = [
    { id: "api_keys", label: "API Keys", icon: <Key className="w-4 h-4" /> },
    { id: "mcp_tools", label: "MCP Write Tools", icon: <Terminal className="w-4 h-4" /> },
    { id: "webhooks", label: "Webhooks", icon: <Webhook className="w-4 h-4" /> },
    { id: "sdk", label: "SDK & Docs", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Developer Portal</h1>
        <p className={cn("text-sm mt-1", L ? "text-slate-500" : "text-slate-400")}>API keys, MCP write tools, webhooks & SDK documentation</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border", tab === t.id ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-md" : L ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600")}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {tab === "api_keys" && (
        <div className="space-y-4">
          {showNewKey && (
            <div className={cn("p-4 rounded-xl border-2 border-dashed", L ? "bg-green-50 border-green-300" : "bg-green-500/10 border-green-500/30")}>
              <p className={cn("text-xs font-medium uppercase tracking-wider mb-1", L ? "text-green-600" : "text-green-400")}>New API Key — Copy now, won't be shown again</p>
              <div className="flex items-center gap-2">
                <code className={cn("flex-1 text-sm font-mono p-2 rounded-lg", L ? "bg-white" : "bg-slate-900")}>{showNewKey}</code>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(showNewKey); toast.success("Copied"); }}><Copy className="w-4 h-4" /></Button>
              </div>
              <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowNewKey(null)}>Dismiss</Button>
            </div>
          )}

          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Key className="w-5 h-5 text-[#1473FF]" />Create API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g., Production TMS)" className={cn("flex-1 px-4 py-2.5 rounded-xl border text-sm", L ? "bg-white border-slate-200" : "bg-slate-800 border-slate-700 text-white")} />
                <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl"><Plus className="w-4 h-4 mr-1" />Create</Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg", L ? "text-slate-800" : "text-white")}>Active Keys</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {keys.length === 0 ? <p className={cn("text-sm text-center py-8", L ? "text-slate-400" : "text-slate-500")}>No API keys yet</p> : keys.map((k: any) => (
                <div key={k.id} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div>
                    <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{k.name}</p>
                    <p className={cn("text-xs font-mono mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{k.key}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{k.status}</Badge>
                      <span className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>Expires {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-500" onClick={() => handleRevokeKey(k.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MCP Write Tools Tab */}
      {tab === "mcp_tools" && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Terminal className="w-5 h-5 text-[#1473FF]" />MCP Write Tools ({tools.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tools.map((t: any, i: number) => (
                <div key={i} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-xs rounded-md font-mono", t.method === "POST" ? "bg-green-500/15 text-green-500 border-green-500/30" : "bg-blue-500/15 text-blue-500 border-blue-500/30")}>{t.method}</Badge>
                    <div>
                      <p className={cn("text-sm font-mono font-medium", L ? "text-slate-800" : "text-white")}>{t.name}</p>
                      <p className={cn("text-xs", L ? "text-slate-400" : "text-slate-500")}>{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{t.rateLimit}/min</Badge>
                    <Badge variant="outline" className="text-xs font-mono">{t.requiresScope}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Lock className="w-5 h-5 text-[#1473FF]" />OAuth Scopes ({scopes.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {scopes.map((s: any, i: number) => (
                  <div key={i} className={sc}>
                    <p className={cn("text-xs font-mono font-medium", L ? "text-slate-700" : "text-white")}>{s.scope}</p>
                    <p className={cn("text-xs mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{s.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks Tab */}
      {tab === "webhooks" && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Webhook className="w-5 h-5 text-[#1473FF]" />Available Events</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {events.map((e: any, i: number) => (
                  <div key={i} className={sc}>
                    <p className={cn("text-xs font-mono font-medium", L ? "text-slate-700" : "text-white")}>{e.event}</p>
                    <p className={cn("text-xs mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{e.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg", L ? "text-slate-800" : "text-white")}>Configured Webhooks</CardTitle></CardHeader>
            <CardContent>
              {webhooksList.length === 0 ? <p className={cn("text-sm text-center py-8", L ? "text-slate-400" : "text-slate-500")}>No webhooks configured</p> : webhooksList.map((w: any) => (
                <div key={w.id} className={cn("flex items-center justify-between p-3 rounded-xl border mb-2", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div>
                    <p className={cn("text-sm font-mono", L ? "text-slate-800" : "text-white")}>{w.url}</p>
                    <div className="flex gap-1 mt-1">{w.events?.map((e: string) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}</div>
                  </div>
                  <Badge className={w.status === "active" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>{w.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SDK Tab */}
      {tab === "sdk" && sdkQuery.data && (
        <div className="space-y-4">
          <Card className={cc}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-lg flex items-center gap-2", L ? "text-slate-800" : "text-white")}><Code className="w-5 h-5 text-[#1473FF]" />SDK & Integration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className={sc}>
                <p className={cn("text-xs uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>API Base URL</p>
                <p className={cn("text-sm font-mono font-medium mt-0.5", L ? "text-slate-800" : "text-white")}>{sdkQuery.data.apiBase}</p>
              </div>
              <div className={sc}>
                <p className={cn("text-xs uppercase tracking-wider font-medium", L ? "text-slate-400" : "text-slate-500")}>Authentication</p>
                <p className={cn("text-sm mt-0.5", L ? "text-slate-700" : "text-slate-300")}>{sdkQuery.data.authentication}</p>
              </div>
              {sdkQuery.data.sdks?.map((sdk: any) => (
                <div key={sdk.language} className={cn("flex items-center justify-between p-3 rounded-xl border", L ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30")}>
                  <div>
                    <p className={cn("text-sm font-medium", L ? "text-slate-800" : "text-white")}>{sdk.language}</p>
                    {sdk.package && <p className={cn("text-xs font-mono mt-0.5", L ? "text-slate-400" : "text-slate-500")}>{sdk.installCmd}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs">v{sdk.version || "REST"}</Badge>
                </div>
              ))}
              <div className={sc}>
                <p className={cn("text-xs uppercase tracking-wider font-medium mb-1", L ? "text-slate-400" : "text-slate-500")}>Rate Limits</p>
                <div className="flex gap-4 text-xs">
                  <span className={L ? "text-slate-600" : "text-slate-300"}>Standard: <strong>{sdkQuery.data.rateLimits?.standard}</strong></span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>Premium: <strong>{sdkQuery.data.rateLimits?.premium}</strong></span>
                  <span className={L ? "text-slate-600" : "text-slate-300"}>Enterprise: <strong>{sdkQuery.data.rateLimits?.enterprise}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
