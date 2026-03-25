/**
 * MY PRODUCTS TAB — Settings page tab for managing saved product profiles.
 * CRUD: Create, Read, Update, Delete (soft) product profiles.
 * Sortable card grid with search, duplicate, and inline edit.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Package, Plus, Trash2, Copy, Pencil, Search, ArrowUpDown,
  AlertTriangle, Droplets, Wind, Box, Thermometer, Snowflake,
  Truck, X, Save, Loader2, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TRAILER_TYPES } from "@/lib/loadConstants";

const TRAILER_ICON: Record<string, React.ReactNode> = {
  droplets: <Droplets className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
  box: <Box className="w-5 h-5" />,
  thermometer: <Thermometer className="w-5 h-5" />,
  truck: <Truck className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
  alert: <AlertTriangle className="w-5 h-5" />,
  snowflake: <Snowflake className="w-5 h-5" />,
};

type SortKey = "lastUsed" | "name" | "usageCount" | "created";

export default function MyProductsTab() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("lastUsed");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<any>({ nickname: "", trailerType: "", equipment: "", productName: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const productsQuery = (trpc as any).productProfiles?.list?.useQuery?.(
    { sortBy, includeCompanyShared: true },
    { staleTime: 30_000 }
  ) || { data: [], isLoading: false, refetch: () => {} };
  const products: any[] = productsQuery.data || [];

  const createMutation = (trpc as any).productProfiles?.create?.useMutation?.({
    onSuccess: () => { toast.success("Product created"); setShowCreate(false); setCreateForm({ nickname: "", trailerType: "", equipment: "", productName: "" }); productsQuery.refetch?.(); },
    onError: (err: any) => toast.error("Failed to create product", { description: err?.message }),
  }) || { mutate: () => {}, isPending: false };

  const updateMutation = (trpc as any).productProfiles?.update?.useMutation?.({
    onSuccess: () => { toast.success("Product updated"); setEditingId(null); productsQuery.refetch?.(); },
    onError: (err: any) => toast.error("Failed to update", { description: err?.message }),
  }) || { mutate: () => {}, isPending: false };

  const deleteMutation = (trpc as any).productProfiles?.delete?.useMutation?.({
    onSuccess: () => { toast.success("Product deleted"); setDeleteConfirmId(null); productsQuery.refetch?.(); },
    onError: (err: any) => toast.error("Failed to delete", { description: err?.message }),
  }) || { mutate: () => {}, isPending: false };

  const filtered = products.filter((p: any) =>
    !search || p.nickname?.toLowerCase().includes(search.toLowerCase()) || p.productName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({ nickname: product.nickname || "", productName: product.productName || "", hazmatClass: product.hazmatClass || "", description: product.description || "" });
  };

  const handleSaveEdit = () => {
    if (!editForm.nickname?.trim()) { toast.error("Nickname is required"); return; }
    updateMutation.mutate({ id: editingId, ...editForm });
  };

  const handleDuplicate = (product: any) => {
    const { id, createdAt, updatedAt, deletedAt, usageCount, lastUsedAt, ...rest } = product;
    createMutation.mutate({ ...rest, nickname: `${product.nickname} (Copy)` });
  };

  const handleCreate = () => {
    if (!createForm.nickname?.trim()) { toast.error("Nickname is required"); return; }
    if (!createForm.trailerType) { toast.error("Trailer type is required"); return; }
    if (!createForm.productName?.trim()) { toast.error("Product name is required"); return; }
    const trailer = TRAILER_TYPES.find(t => t.id === createForm.trailerType);
    createMutation.mutate({ ...createForm, equipment: trailer?.id || createForm.trailerType });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-lg">My Products</h3>
          <p className="text-slate-500 text-sm">{products.length} saved product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> New Product
        </Button>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/30"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600/30">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastUsed">Last Used</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="usageCount">Most Used</SelectItem>
            <SelectItem value="created">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create Product Form */}
      {showCreate && (
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-900 dark:text-white font-bold">Create New Product</p>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Nickname *</label>
                <Input value={createForm.nickname} onChange={(e) => setCreateForm((p: any) => ({ ...p, nickname: e.target.value }))} placeholder="e.g., WTI Crude" className="bg-slate-50 dark:bg-slate-700/30" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Product Name *</label>
                <Input value={createForm.productName} onChange={(e) => setCreateForm((p: any) => ({ ...p, productName: e.target.value }))} placeholder="e.g., West Texas Intermediate" className="bg-slate-50 dark:bg-slate-700/30" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Trailer Type *</label>
                <Select value={createForm.trailerType} onValueChange={(v) => setCreateForm((p: any) => ({ ...p, trailerType: v, equipment: v }))}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-700/30">
                    <SelectValue placeholder="Select trailer" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAILER_TYPES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}{t.hazmat ? " (HM)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Hazmat Class</label>
                <Input value={createForm.hazmatClass || ""} onChange={(e) => setCreateForm((p: any) => ({ ...p, hazmatClass: e.target.value }))} placeholder="e.g., 3" className="bg-slate-50 dark:bg-slate-700/30" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Cards Grid */}
      {productsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-slate-100 dark:bg-slate-700/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-slate-400 font-medium">{search ? "No products match your search" : "No saved products yet"}</p>
          <p className="text-slate-500 text-sm mt-1">Create your first product to speed up load creation</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product: any) => {
            const trailer = TRAILER_TYPES.find(t => t.id === product.trailerType);
            const isEditing = editingId === product.id;

            return (
              <Card key={product.id} className={cn(
                "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-xl transition-all",
                isEditing && "ring-2 ring-cyan-500/40"
              )}>
                <CardContent className="p-4 space-y-3">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Input value={editForm.nickname} onChange={(e) => setEditForm((p: any) => ({ ...p, nickname: e.target.value }))} placeholder="Nickname" className="bg-slate-50 dark:bg-slate-700/30 text-sm" />
                        <Input value={editForm.productName} onChange={(e) => setEditForm((p: any) => ({ ...p, productName: e.target.value }))} placeholder="Product Name" className="bg-slate-50 dark:bg-slate-700/30 text-sm" />
                        <Input value={editForm.description || ""} onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" className="bg-slate-50 dark:bg-slate-700/30 text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1 text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending} className="flex-1 text-xs bg-gradient-to-r from-cyan-500 to-emerald-500">
                          <Save className="w-3 h-3 mr-1" />Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          {TRAILER_ICON[trailer?.icon || "package"] || <Package className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{product.nickname}</p>
                          <p className="text-slate-500 text-xs truncate">{product.productName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-600/50 text-slate-600 dark:text-slate-300">
                          {trailer?.name || product.trailerType}
                        </span>
                        {product.hazmatClass && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                            Class {product.hazmatClass}
                          </span>
                        )}
                        {product.isCompanyShared && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Shared</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/40">
                        <span className="text-xs text-slate-500">{product.usageCount || 0}x used</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(product)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" title="Edit">
                            <Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400" />
                          </button>
                          <button onClick={() => handleDuplicate(product)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" title="Duplicate">
                            <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                          </button>
                          <button onClick={() => setDeleteConfirmId(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">Delete Product?</p>
                <p className="text-slate-400 text-sm">This cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={() => deleteMutation.mutate({ id: deleteConfirmId })}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
