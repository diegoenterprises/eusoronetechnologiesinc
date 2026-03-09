import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Building2, Plus, Users, Key, Globe, Settings, X, RefreshCw, Shield } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  suspended: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  deactivated: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function TenantManagerPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customDomain: "", maxUsers: "50", maxLoads: "1000", parentCarrierId: "" });

  const listQ = (trpc as any).tenantManager?.list?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const statsQ = (trpc as any).tenantManager?.getStats?.useQuery?.() || { data: null };
  const createM = (trpc as any).tenantManager?.create?.useMutation?.({
    onSuccess: (data: any) => { toast.success(`Tenant created — Key: ${data?.tenantKey?.substring(0, 12)}...`); setShowCreate(false); listQ.refetch?.(); },
    onError: () => toast.error("Failed to create tenant"),
  }) || { mutate: () => {}, isPending: false };
  const regenM = (trpc as any).tenantManager?.regenerateKey?.useMutation?.({
    onSuccess: (data: any) => { toast.success(`New key: ${data?.tenantKey?.substring(0, 12)}...`); listQ.refetch?.(); },
  }) || { mutate: () => {} };

  const tenants = (listQ.data as any[]) || [];
  const stats = statsQ.data || { total: 0, active: 0, suspended: 0 };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-pink-400" />PaaS Tenant Manager
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5">White-label multi-tenant infrastructure — data isolation, feature gating, API key management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.08] text-slate-400" onClick={() => listQ.refetch?.()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
          </Button>
          <Button size="sm" className="h-7 text-xs bg-pink-600 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />New Tenant
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
          <Building2 className="w-4 h-4 text-pink-400 mb-1" />
          <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
          <p className="text-[9px] text-slate-500 mt-0.5">Total Tenants</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <Shield className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-xl font-bold font-mono text-white">{stats.active}</span>
          <p className="text-[9px] text-slate-500 mt-0.5">Active</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Settings className="w-4 h-4 text-amber-400 mb-1" />
          <span className="text-xl font-bold font-mono text-white">{stats.suspended}</span>
          <p className="text-[9px] text-slate-500 mt-0.5">Suspended</p>
        </div>
      </div>

      {/* Tenant List */}
      {tenants.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-10 text-center">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-semibold">No Tenants</p>
            <p className="text-[10px] text-slate-500 mt-1">Create your first white-label tenant</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tenants.map((t: any) => (
            <Card key={t.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">Tenant #{t.id}</span>
                      <Badge className={cn("text-[8px]", STATUS_COLORS[t.status] || STATUS_COLORS.active)}>{t.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-slate-500 font-mono"><Key className="w-3 h-3 inline mr-0.5" />{t.tenantKeyPreview}</span>
                      {t.customDomain && <span className="text-[9px] text-blue-400"><Globe className="w-3 h-3 inline mr-0.5" />{t.customDomain}</span>}
                      <span className="text-[9px] text-slate-500"><Users className="w-3 h-3 inline mr-0.5" />Max {t.maxUsers} users</span>
                      <span className="text-[9px] text-slate-500">Max {t.maxLoads} loads</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-pink-400 hover:bg-pink-500/10" onClick={() => { if (confirm("Regenerate API key?")) regenM.mutate({ id: t.id }); }}>
                    <Key className="w-3 h-3 mr-0.5" />Regen Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-pink-400" />New Tenant</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase">Custom Domain (optional)</label>
                <Input value={form.customDomain} onChange={(e: any) => setForm({ ...form, customDomain: e.target.value })} placeholder="freight.acme.com" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase">Parent Carrier ID (optional)</label>
                <Input value={form.parentCarrierId} onChange={(e: any) => setForm({ ...form, parentCarrierId: e.target.value })} placeholder="e.g., 5" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Max Users</label>
                  <Input type="number" value={form.maxUsers} onChange={(e: any) => setForm({ ...form, maxUsers: e.target.value })} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase">Max Loads</label>
                  <Input type="number" value={form.maxLoads} onChange={(e: any) => setForm({ ...form, maxLoads: e.target.value })} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
                </div>
              </div>
            </div>
            <Button className="w-full bg-pink-600 text-white text-xs" disabled={createM.isPending}
              onClick={() => createM.mutate({
                customDomain: form.customDomain || undefined,
                parentCarrierId: form.parentCarrierId ? parseInt(form.parentCarrierId) : undefined,
                maxUsers: parseInt(form.maxUsers) || 50,
                maxLoads: parseInt(form.maxLoads) || 1000,
              })}>
              {createM.isPending ? "Creating..." : "Create Tenant"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
