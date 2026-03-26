/**
 * LOAD TEMPLATES — GAP-003: Load Template System
 * Manage reusable load templates. Save lanes, commodities, equipment,
 * hazmat config, multi-stop routes, and scheduling preferences.
 * One-click load creation from any template.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  FileText, Plus, Star, Trash2, Copy, Search, MapPin,
  Package, Truck, Shield, DollarSign, Clock, ChevronDown,
  ChevronUp, ArrowRight, Loader2, AlertTriangle, Archive,
  MoreHorizontal, Zap, Calendar, CheckCircle, Scale,
  Building2, Edit3, X, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function LoadTemplates() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useDialogId, setUseDialogId] = useState<number | null>(null);
  const [usePickupDate, setUsePickupDate] = useState("");
  const [useDeliveryDate, setUseDeliveryDate] = useState("");
  const [useRate, setUseRate] = useState("");

  // New template form state
  const [newName, setNewName] = useState("");
  const [newOriginCity, setNewOriginCity] = useState("");
  const [newOriginState, setNewOriginState] = useState("");
  const [newDestCity, setNewDestCity] = useState("");
  const [newDestState, setNewDestState] = useState("");
  const [newCommodity, setNewCommodity] = useState("");
  const [newEquipment, setNewEquipment] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newHazmatClass, setNewHazmatClass] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const templatesQuery = (trpc as any).loadTemplates.list.useQuery(
    { search: search || undefined, favoritesOnly, includeArchived: showArchived },
    { keepPreviousData: true }
  );
  const templates = (templatesQuery.data || []) as any[];

  const createMutation = (trpc as any).loadTemplates.create.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Template "${data.name}" created`);
      templatesQuery.refetch();
      resetCreateForm();
    },
    onError: (err: any) => toast.error("Failed to create template", { description: err.message }),
  });

  const useTemplateMutation = (trpc as any).loadTemplates.useTemplate.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Load ${data.loadNumber} posted from template`);
      setUseDialogId(null);
      templatesQuery.refetch();
      setLocation(`/loads/${data.loadId}`);
    },
    onError: (err: any) => toast.error("Failed to create load", { description: err.message }),
  });

  const toggleFavMutation = (trpc as any).loadTemplates.toggleFavorite.useMutation({
    onSuccess: () => templatesQuery.refetch(),
  });

  const removeMutation = (trpc as any).loadTemplates.remove.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      templatesQuery.refetch();
    },
    onError: (err: any) => toast.error("Failed to delete", { description: err.message }),
  });

  const archiveMutation = (trpc as any).loadTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template archived");
      templatesQuery.refetch();
    },
  });

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewName(""); setNewOriginCity(""); setNewOriginState("");
    setNewDestCity(""); setNewDestState(""); setNewCommodity("");
    setNewEquipment(""); setNewWeight(""); setNewRate("");
    setNewHazmatClass(""); setNewNotes("");
  };

  const handleCreate = () => {
    if (!newName.trim()) { toast.error("Template name is required"); return; }
    createMutation.mutate({
      name: newName.trim(),
      origin: (newOriginCity || newOriginState) ? { city: newOriginCity, state: newOriginState } : undefined,
      destination: (newDestCity || newDestState) ? { city: newDestCity, state: newDestState } : undefined,
      commodity: newCommodity || undefined,
      equipmentType: newEquipment || undefined,
      weight: newWeight || undefined,
      rate: newRate ? parseFloat(newRate) : undefined,
      hazmatClass: newHazmatClass || undefined,
      notes: newNotes || undefined,
    });
  };

  const handleUseTemplate = (templateId: number) => {
    useTemplateMutation.mutate({
      templateId,
      pickupDate: usePickupDate || undefined,
      deliveryDate: useDeliveryDate || undefined,
      rate: useRate ? parseFloat(useRate) : undefined,
    });
  };

  const stats = useMemo(() => {
    const total = templates.length;
    const favorites = templates.filter((t: any) => t.isFavorite).length;
    const hazmat = templates.filter((t: any) => t.hazmatClass).length;
    const totalUsage = templates.reduce((s: number, t: any) => s + (t.usageCount || 0), 0);
    return { total, favorites, hazmat, totalUsage };
  }, [templates]);

  const cardCls = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const cellCls = cn("p-3 rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700/30");
  const inputCls = cn("h-9 text-sm rounded-lg", isLight ? "bg-white border-slate-200" : "bg-slate-900/50 border-slate-700/50 text-slate-200");
  const valCls = cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white");

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-800" : "text-white")}>
            Load Templates
          </h1>
          <p className="text-sm text-slate-400 mt-1">Save and reuse your most common load configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/bulk-upload?type=loads")} className="gap-1.5">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl font-semibold h-10"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Templates", value: stats.total, icon: <FileText className="w-4 h-4 text-blue-500" /> },
          { label: "Favorites", value: stats.favorites, icon: <Star className="w-4 h-4 text-amber-500" /> },
          { label: "Hazmat Templates", value: stats.hazmat, icon: <Shield className="w-4 h-4 text-red-500" /> },
          { label: "Total Uses", value: stats.totalUsage, icon: <Zap className="w-4 h-4 text-emerald-500" /> },
        ].map((s) => (
          <div key={s.label} className={cellCls}>
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-slate-400 uppercase">{s.label}</span></div>
            <p className={cn("text-xl font-bold", isLight ? "text-slate-800" : "text-white")}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className={cn(inputCls, "pl-9")}
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={favoritesOnly ? "default" : "outline"}
          size="sm"
          className={cn("rounded-lg text-xs h-9", favoritesOnly ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : isLight ? "border-slate-200" : "border-slate-700")}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Star className={cn("w-3.5 h-3.5 mr-1", favoritesOnly && "fill-amber-500")} />Favorites
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn("rounded-lg text-xs h-9", isLight ? "border-slate-200" : "border-slate-700")}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="w-3.5 h-3.5 mr-1" />{showArchived ? "Hide" : "Show"} Archived
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className={cn(cardCls, "border-blue-500/30")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("flex items-center gap-2 text-lg font-semibold", isLight ? "text-slate-800" : "text-white")}>
              <Plus className="w-5 h-5 text-[#1473FF]" />Create New Template
              <Button variant="ghost" size="sm" className="ml-auto h-7 w-7 p-0" onClick={resetCreateForm}>
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input className={inputCls} placeholder="Template name (e.g. 'Midland to Houston Crude')" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input className={inputCls} placeholder="Origin city" value={newOriginCity} onChange={(e) => setNewOriginCity(e.target.value)} />
              <Input className={inputCls} placeholder="Origin state" value={newOriginState} onChange={(e) => setNewOriginState(e.target.value)} />
              <Input className={inputCls} placeholder="Dest city" value={newDestCity} onChange={(e) => setNewDestCity(e.target.value)} />
              <Input className={inputCls} placeholder="Dest state" value={newDestState} onChange={(e) => setNewDestState(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input className={inputCls} placeholder="Commodity" value={newCommodity} onChange={(e) => setNewCommodity(e.target.value)} />
              <Input className={inputCls} placeholder="Equipment type" value={newEquipment} onChange={(e) => setNewEquipment(e.target.value)} />
              <Input className={inputCls} placeholder="Weight (lbs)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
              <Input className={inputCls} placeholder="Rate ($)" type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input className={inputCls} placeholder="Hazmat class (optional)" value={newHazmatClass} onChange={(e) => setNewHazmatClass(e.target.value)} />
              <Input className={inputCls} placeholder="Notes" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button className="h-9 text-sm bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                Create Template
              </Button>
              <Button variant="outline" className={cn("h-9 text-sm rounded-lg", isLight ? "border-slate-200" : "border-slate-700")} onClick={resetCreateForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      {templatesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-slate-400">Loading templates...</span>
        </div>
      ) : templates.length === 0 ? (
        <Card className={cardCls}>
          <CardContent className="py-16 text-center">
            <FileText className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
            <p className={cn("text-lg font-semibold mb-1", isLight ? "text-slate-600" : "text-slate-400")}>No templates yet</p>
            <p className="text-sm text-slate-400 mb-4">Create your first template to speed up load posting.</p>
            <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-xl" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tmpl: any) => {
            const isExpanded = expandedId === tmpl.id;
            const origin = tmpl.origin as any;
            const dest = tmpl.destination as any;
            const originLabel = origin ? `${origin.city || ""}${origin.state ? `, ${origin.state}` : ""}` : "Any";
            const destLabel = dest ? `${dest.city || ""}${dest.state ? `, ${dest.state}` : ""}` : "Any";
            const isHazmat = !!tmpl.hazmatClass;
            const isUseDialog = useDialogId === tmpl.id;

            return (
              <Card key={tmpl.id} className={cn(cardCls, tmpl.isArchived && "opacity-60")}>
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}
                >
                  {/* Favorite star */}
                  <button
                    className="flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); toggleFavMutation.mutate({ id: tmpl.id }); }}
                  >
                    <Star className={cn("w-5 h-5 transition-colors", tmpl.isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-400 hover:text-amber-400")} />
                  </button>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn("text-sm font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>{tmpl.name}</p>
                      {isHazmat && (
                        <Badge className="text-xs bg-red-500/15 text-red-500 border-0">
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />HZ {tmpl.hazmatClass}
                        </Badge>
                      )}
                      {tmpl.equipmentType && (
                        <Badge className={cn("text-xs border-0", isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/15 text-blue-400")}>
                          <Truck className="w-2.5 h-2.5 mr-0.5" />{tmpl.equipmentType}
                        </Badge>
                      )}
                      {tmpl.isArchived && (
                        <Badge className="text-xs bg-slate-500/15 text-slate-400 border-0">Archived</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      <span>{originLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{destLabel}</span>
                      {tmpl.commodity && (
                        <>
                          <span className="mx-1">|</span>
                          <Package className="w-3 h-3" />
                          <span>{tmpl.commodity}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rate + usage */}
                  <div className="text-right flex-shrink-0">
                    {tmpl.rate && (
                      <p className="text-sm font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                        ${Number(tmpl.rate).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-slate-400">
                      {tmpl.usageCount || 0} use{tmpl.usageCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Quick use button */}
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setUseDialogId(tmpl.id); setUsePickupDate(""); setUseDeliveryDate(""); setUseRate(""); }}
                  >
                    <Zap className="w-3 h-3 mr-1" />Use
                  </Button>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {/* Use Template Dialog */}
                {isUseDialog && (
                  <div className={cn("px-5 pb-4 border-t space-y-3", isLight ? "border-slate-100" : "border-slate-700/30")}>
                    <p className={cn("text-xs font-semibold uppercase tracking-wider pt-3", isLight ? "text-blue-600" : "text-blue-400")}>
                      Post Load from Template
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 uppercase">Pickup Date</label>
                        <Input className={inputCls} type="datetime-local" value={usePickupDate} onChange={(e) => setUsePickupDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase">Delivery Date</label>
                        <Input className={inputCls} type="datetime-local" value={useDeliveryDate} onChange={(e) => setUseDeliveryDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 uppercase">Rate Override ($)</label>
                        <Input className={inputCls} type="number" placeholder={tmpl.rate ? `$${tmpl.rate}` : "Rate"} value={useRate} onChange={(e) => setUseRate(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg"
                        onClick={() => handleUseTemplate(tmpl.id)}
                        disabled={useTemplateMutation.isPending}
                      >
                        {useTemplateMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                        Post Load Now
                      </Button>
                      <Button size="sm" variant="outline" className={cn("h-8 text-xs rounded-lg", isLight ? "border-slate-200" : "border-slate-700")} onClick={() => setUseDialogId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && !isUseDialog && (
                  <div className={cn("px-5 pb-4 border-t space-y-3", isLight ? "border-slate-100" : "border-slate-700/30")}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3">
                      {tmpl.commodity && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Commodity</p>
                          <p className={valCls}>{tmpl.commodity}</p>
                        </div>
                      )}
                      {tmpl.weight && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Weight</p>
                          <p className={valCls}>{Number(tmpl.weight).toLocaleString()} {tmpl.weightUnit || "lbs"}</p>
                        </div>
                      )}
                      {tmpl.equipmentType && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Equipment</p>
                          <p className={valCls}>{tmpl.equipmentType}</p>
                        </div>
                      )}
                      {tmpl.rate && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Rate</p>
                          <p className={valCls}>${Number(tmpl.rate).toLocaleString()} {tmpl.rateType !== "flat" ? `/${tmpl.rateType?.replace("per_", "")}` : ""}</p>
                        </div>
                      )}
                      {tmpl.distance && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Distance</p>
                          <p className={valCls}>{Number(tmpl.distance).toLocaleString()} mi</p>
                        </div>
                      )}
                      {tmpl.hazmatClass && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Hazmat</p>
                          <p className="text-red-500 font-medium text-sm">Class {tmpl.hazmatClass}{tmpl.unNumber ? ` / ${tmpl.unNumber}` : ""}</p>
                        </div>
                      )}
                      {tmpl.preferredPickupTime && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Preferred Time</p>
                          <p className={valCls}>{tmpl.preferredPickupTime}</p>
                        </div>
                      )}
                      {tmpl.usageCount > 0 && (
                        <div className={cellCls}>
                          <p className="text-xs text-slate-400 uppercase">Last Used</p>
                          <p className={valCls}>{tmpl.lastUsedAt ? new Date(tmpl.lastUsedAt).toLocaleDateString() : "Never"}</p>
                        </div>
                      )}
                    </div>

                    {/* Stops */}
                    {tmpl.stops && Array.isArray(tmpl.stops) && tmpl.stops.length > 0 && (
                      <div className={cn("p-3 rounded-xl border", isLight ? "bg-blue-50/30 border-blue-200/50" : "bg-blue-500/5 border-blue-500/15")}>
                        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", isLight ? "text-blue-600" : "text-blue-400")}>
                          Multi-Stop Route ({tmpl.stops.length} stops)
                        </p>
                        <div className="space-y-1">
                          {tmpl.stops.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", isLight ? "bg-slate-200 text-slate-600" : "bg-slate-700 text-slate-300")}>{i + 1}</span>
                              <Badge className={cn("text-xs border-0", s.stopType === "pickup" ? "bg-blue-500/15 text-blue-400" : s.stopType === "delivery" ? "bg-purple-500/15 text-purple-400" : "bg-slate-500/15 text-slate-400")}>
                                {s.stopType}
                              </Badge>
                              <span className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>
                                {s.facilityName || `${s.city || ""}${s.state ? `, ${s.state}` : ""}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(tmpl.notes || tmpl.specialInstructions || tmpl.description) && (
                      <div className={cellCls}>
                        <p className="text-xs text-slate-400 uppercase">Notes</p>
                        <p className={cn("text-xs", isLight ? "text-slate-600" : "text-slate-300")}>
                          {tmpl.description || tmpl.notes || tmpl.specialInstructions}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-lg"
                        onClick={() => { setUseDialogId(tmpl.id); setExpandedId(null); }}
                      >
                        <Zap className="w-3 h-3 mr-1" />Use Template
                      </Button>
                      {!tmpl.isArchived && (
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn("h-7 text-xs rounded-lg", isLight ? "border-slate-200" : "border-slate-700")}
                          onClick={() => archiveMutation.mutate({ id: tmpl.id, data: { isArchived: true } })}
                        >
                          <Archive className="w-3 h-3 mr-1" />Archive
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-400 hover:text-red-300 ml-auto"
                        onClick={() => removeMutation.mutate({ id: tmpl.id })}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
