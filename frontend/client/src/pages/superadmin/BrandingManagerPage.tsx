import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Fingerprint, Palette, Globe, Type, Image, RefreshCw, Save, Eye } from "lucide-react";

export default function BrandingManagerPage() {
  const [editTenantId, setEditTenantId] = useState<number | null>(null);
  const [form, setForm] = useState({
    tenantId: "", brandName: "", primaryColor: "#1E40AF", secondaryColor: "#059669",
    fontFamily: "Inter, system-ui", logoUrl: "", faviconUrl: "", customDomain: "",
  });

  const listQ = (trpc as any).branding?.list?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const upsertM = (trpc as any).branding?.upsert?.useMutation?.({
    onSuccess: () => { toast.success("Branding saved"); listQ.refetch?.(); setEditTenantId(null); },
    onError: () => toast.error("Failed to save branding"),
  }) || { mutate: () => {}, isPending: false };

  const brandings = (listQ.data as any[]) || [];

  const startEdit = (b: any) => {
    setEditTenantId(b.tenantId);
    setForm({
      tenantId: String(b.tenantId),
      brandName: b.brandName || "",
      primaryColor: b.primaryColor || "#1E40AF",
      secondaryColor: b.secondaryColor || "#059669",
      fontFamily: b.fontFamily || "Inter, system-ui",
      logoUrl: b.logoUrl || "",
      faviconUrl: b.faviconUrl || "",
      customDomain: b.customDomain || "",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-orange-400" />White-Label Branding
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Custom logos, colors, fonts, and domains per tenant</p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs border-white/[0.08] text-slate-400" onClick={() => listQ.refetch?.()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
        </Button>
      </div>

      {/* New/Edit Form */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs text-white flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-orange-400" />{editTenantId ? `Edit Tenant #${editTenantId}` : "Create Branding"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Tenant ID</label>
              <Input value={form.tenantId} onChange={(e: any) => setForm({ ...form, tenantId: e.target.value })} placeholder="e.g., 1" disabled={!!editTenantId}
                className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Brand Name</label>
              <Input value={form.brandName} onChange={(e: any) => setForm({ ...form, brandName: e.target.value })} placeholder="Acme Freight" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Primary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
                <Input value={form.primaryColor} onChange={(e: any) => setForm({ ...form, primaryColor: e.target.value })} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white font-mono flex-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Secondary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
                <Input value={form.secondaryColor} onChange={(e: any) => setForm({ ...form, secondaryColor: e.target.value })} className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white font-mono flex-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Font Family</label>
              <select value={form.fontFamily} onChange={(e) => setForm({ ...form, fontFamily: e.target.value })} className="w-full h-7 text-xs bg-white/[0.04] border border-white/[0.08] text-white rounded-md px-2 mt-1">
                <option value="Inter, system-ui">Inter</option>
                <option value="'DM Sans', sans-serif">DM Sans</option>
                <option value="'Poppins', sans-serif">Poppins</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase">Logo URL</label>
              <Input value={form.logoUrl} onChange={(e: any) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Favicon URL</label>
              <Input value={form.faviconUrl} onChange={(e: any) => setForm({ ...form, faviconUrl: e.target.value })} placeholder="https://..." className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase">Custom Domain</label>
              <Input value={form.customDomain} onChange={(e: any) => setForm({ ...form, customDomain: e.target.value })} placeholder="freight.acme.com" className="h-7 text-xs bg-white/[0.04] border-white/[0.08] text-white mt-1" />
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg border border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${form.primaryColor}15, ${form.secondaryColor}15)` }}>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Preview</p>
            <div className="flex items-center gap-3">
              {form.logoUrl ? <img src={form.logoUrl} alt="logo" className="w-8 h-8 rounded object-contain" /> : <div className="w-8 h-8 rounded" style={{ backgroundColor: form.primaryColor }} />}
              <div>
                <p className="text-sm font-bold" style={{ color: form.primaryColor, fontFamily: form.fontFamily }}>{form.brandName || "Brand Name"}</p>
                <p className="text-xs" style={{ color: form.secondaryColor }}>Powered by EusoTrip</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs bg-orange-600 text-white" disabled={upsertM.isPending || !form.tenantId}
              onClick={() => upsertM.mutate({
                tenantId: parseInt(form.tenantId),
                brandName: form.brandName || undefined,
                primaryColor: form.primaryColor,
                secondaryColor: form.secondaryColor,
                fontFamily: form.fontFamily,
                logoUrl: form.logoUrl || undefined,
                faviconUrl: form.faviconUrl || undefined,
                customDomain: form.customDomain || undefined,
              })}>
              <Save className="w-3 h-3 mr-1" />{upsertM.isPending ? "Saving..." : "Save Branding"}
            </Button>
            {editTenantId && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400" onClick={() => { setEditTenantId(null); setForm({ tenantId: "", brandName: "", primaryColor: "#1E40AF", secondaryColor: "#059669", fontFamily: "Inter, system-ui", logoUrl: "", faviconUrl: "", customDomain: "" }); }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Brandings */}
      {brandings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Existing Brandings</p>
          {brandings.map((b: any) => (
            <Card key={b.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-colors cursor-pointer" onClick={() => startEdit(b)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded" style={{ background: `linear-gradient(135deg, ${b.primaryColor}, ${b.secondaryColor})` }} />
                    <div>
                      <p className="text-xs font-semibold text-white">{b.brandName || `Tenant #${b.tenantId}`}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {b.customDomain && <span className="text-xs text-blue-400"><Globe className="w-3 h-3 inline mr-0.5" />{b.customDomain}</span>}
                        <span className="text-xs text-slate-500"><Type className="w-3 h-3 inline mr-0.5" />{b.fontFamily?.split(",")[0]}</span>
                        <span className="text-xs text-slate-500 font-mono">{b.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
