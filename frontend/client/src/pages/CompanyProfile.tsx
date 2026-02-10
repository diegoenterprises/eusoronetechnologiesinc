/**
 * COMPANY PROFILE PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building, MapPin, Phone, Mail, Globe, Edit,
  CheckCircle, Upload, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CompanyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const companyQuery = (trpc as any).companies.getProfile.useQuery();
  const statsQuery = (trpc as any).companies.getStats.useQuery();

  const updateMutation = (trpc as any).companies.updateProfile.useMutation({
    onSuccess: () => { toast.success("Company profile updated"); companyQuery.refetch(); setIsEditing(false); },
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  const company = companyQuery.data;
  const stats = statsQuery.data;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, etc.)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateMutation.mutate({ logo: base64 }, {
        onSuccess: () => {
          toast.success("Company logo updated");
          companyQuery.refetch();
        },
      });
    };
    reader.readAsDataURL(file);
    // Reset input so re-uploading same file works
    e.target.value = "";
  };

  const handleEdit = () => {
    // Sanitize null → "" so Zod doesn't reject null values
    const sanitized: any = {};
    if (company) {
      Object.entries(company).forEach(([k, v]) => {
        sanitized[k] = v ?? "";
      });
    }
    setFormData(sanitized);
    setIsEditing(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Company Profile
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your company information</p>
        </div>
        {!isEditing && (
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />Edit Profile
          </Button>
        )}
      </div>

      {/* Company Header Card */}
      {companyQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div
                className="w-24 h-24 rounded-xl bg-slate-700/50 flex items-center justify-center relative cursor-pointer group overflow-hidden border-2 border-transparent hover:border-cyan-500/50 transition-all"
                onClick={() => logoInputRef.current?.click()}
                title="Click to upload company logo"
              >
                {company?.logo ? (
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building className="w-12 h-12 text-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
                  <Upload className="w-5 h-5 text-white mb-1" />
                  <span className="text-white text-[10px] font-medium">Upload</span>
                </div>
                {updateMutation.isPending && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white text-2xl font-bold">{company?.name}</p>
                  {company?.verified && <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>}
                </div>
                <p className="text-slate-400">{company?.type}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{company?.city}, {company?.state}</span>
                  <span>DOT: {company?.dotNumber}</span>
                  <span>MC: {company?.mcNumber}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.employees || 0}</p>
                )}
                <p className="text-xs text-slate-400">Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Building className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.vehicles || 0}</p>
                )}
                <p className="text-xs text-slate-400">Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <CheckCircle className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.loadsCompleted?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Loads Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.rating}</p>
                )}
                <p className="text-xs text-slate-400">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Details */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          {companyQuery.isLoading ? (
            <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm text-slate-400 mb-1 block">Company Name</label><Input value={formData.name || ""} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Legal Name</label><Input value={formData.legalName || ""} onChange={(e: any) => setFormData({ ...formData, legalName: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">DOT Number</label><Input value={formData.dotNumber || ""} onChange={(e: any) => setFormData({ ...formData, dotNumber: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">MC Number</label><Input value={formData.mcNumber || ""} onChange={(e: any) => setFormData({ ...formData, mcNumber: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">EIN (Tax ID)</label><Input value={formData.ein || ""} onChange={(e: any) => setFormData({ ...formData, ein: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Phone</label><Input value={formData.phone || ""} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Email</label><Input value={formData.email || ""} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Website</label><Input value={formData.website || ""} onChange={(e: any) => setFormData({ ...formData, website: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
              </div>
              <div><label className="text-sm text-slate-400 mb-1 block">Address</label><Input value={formData.address || ""} onChange={(e: any) => setFormData({ ...formData, address: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-sm text-slate-400 mb-1 block">City</label><Input value={formData.city || ""} onChange={(e: any) => setFormData({ ...formData, city: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">State</label><Input value={formData.state || ""} onChange={(e: any) => setFormData({ ...formData, state: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
                <div><label className="text-sm text-slate-400 mb-1 block">Zip Code</label><Input value={formData.zipCode || ""} onChange={(e: any) => setFormData({ ...formData, zipCode: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg" /></div>
              </div>
              <div><label className="text-sm text-slate-400 mb-1 block">Description</label><Textarea value={formData.description || ""} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} className="bg-slate-700/30 border-slate-600/50 rounded-lg min-h-[100px]" /></div>
              <div className="flex gap-3">
                <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => {
                  // Sanitize: ensure no null values sent to mutation
                  const clean: any = {};
                  Object.entries(formData).forEach(([k, v]) => { clean[k] = v ?? ""; });
                  updateMutation.mutate(clean);
                }}>Save Changes</Button>
                <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">Legal Name</p><p className="text-white">{company?.legalName || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">DOT Number</p><p className="text-white">{company?.dotNumber || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">MC Number</p><p className="text-white">{company?.mcNumber || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">EIN (Tax ID)</p><p className="text-white">{company?.ein || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">Phone</p><p className="text-white flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />{company?.phone || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">Email</p><p className="text-white flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{company?.email || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">Website</p><p className="text-white flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" />{company?.website || "—"}</p></div>
                <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">Address</p><p className="text-white flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" />{[company?.address, company?.city, company?.state, company?.zipCode].filter(Boolean).join(", ") || "—"}</p></div>
              </div>
              {company?.description && <div className="p-3 rounded-lg bg-slate-700/30"><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-slate-300">{company.description}</p></div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
