import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, X, Plus, Star, Filter, LayoutGrid,
  ChevronDown, ChevronUp, Check
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";
import { cn } from "@/lib/utils";
import {
  ALL_WIDGETS, WidgetDefinition, WidgetCategory,
  UNIVERSAL_WIDGETS, SHIPPER_WIDGETS, CARRIER_WIDGETS,
  BROKER_WIDGETS, DRIVER_WIDGETS, CATALYST_WIDGETS,
  ESCORT_WIDGETS, TERMINAL_MANAGER_WIDGETS,
  COMPLIANCE_OFFICER_WIDGETS, SAFETY_MANAGER_WIDGETS,
  SPECIALIZED_ANALYTICS_WIDGETS,
} from "@/lib/widgetLibrary";
import { UserRole } from "@/hooks/useRoleAccess";

interface WidgetStoreProps {
  role: UserRole;
  activeWidgetIds: string[];
  onAddWidget: (widgetId: string) => void;
  onClose: () => void;
}

const CATEGORY_META: Record<WidgetCategory, { label: string; color: string }> = {
  analytics: { label: "Analytics", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  operations: { label: "Operations", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  financial: { label: "Financial", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  communication: { label: "Communication", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  productivity: { label: "Productivity", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  safety: { label: "Safety", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  compliance: { label: "Compliance", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  performance: { label: "Performance", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  planning: { label: "Planning", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  tracking: { label: "Tracking", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  reporting: { label: "Reporting", color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  management: { label: "Management", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

type StoreTab = "all" | "universal" | "role" | "premium" | WidgetCategory;

export default function WidgetStore({ role, activeWidgetIds, onAddWidget, onClose }: WidgetStoreProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StoreTab>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["all"]));

  const roleWidgets = useMemo(() => ALL_WIDGETS.filter(w => w.roles.includes(role)), [role]);

  const filteredWidgets = useMemo(() => {
    let widgets = roleWidgets;

    if (activeTab === "universal") {
      widgets = widgets.filter(w => UNIVERSAL_WIDGETS.some(u => u.id === w.id));
    } else if (activeTab === "role") {
      widgets = widgets.filter(w => !UNIVERSAL_WIDGETS.some(u => u.id === w.id) && !w.premium);
    } else if (activeTab === "premium") {
      widgets = widgets.filter(w => w.premium);
    } else if (activeTab !== "all" && Object.keys(CATEGORY_META).includes(activeTab)) {
      widgets = widgets.filter(w => w.category === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      widgets = widgets.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
      );
    }

    return widgets;
  }, [roleWidgets, activeTab, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    roleWidgets.forEach(w => {
      counts[w.category] = (counts[w.category] || 0) + 1;
    });
    return counts;
  }, [roleWidgets]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const groupedWidgets = useMemo(() => {
    const groups: Record<string, WidgetDefinition[]> = {};
    filteredWidgets.forEach(w => {
      if (!groups[w.category]) groups[w.category] = [];
      groups[w.category].push(w);
    });
    return groups;
  }, [filteredWidgets]);

  const tabs: { id: StoreTab; label: string; count: number }[] = [
    { id: "all", label: "All Widgets", count: roleWidgets.length },
    { id: "universal", label: "Universal", count: roleWidgets.filter(w => UNIVERSAL_WIDGETS.some(u => u.id === w.id)).length },
    { id: "role", label: "My Role", count: roleWidgets.filter(w => !UNIVERSAL_WIDGETS.some(u => u.id === w.id) && !w.premium).length },
    { id: "premium", label: "Premium", count: roleWidgets.filter(w => w.premium).length },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Store Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-slate-900 border-l border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1473FF] to-[#BE01FF]">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Widget Store</h2>
                <p className="text-xs text-slate-400">{roleWidgets.length} widgets available for your role</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search widgets..."
              className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg text-white placeholder:text-slate-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-500 hover:text-white" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-purple-500/20"
                    : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
                )}
              >
                {tab.id === "premium" && <EsangIcon className="w-3 h-3" />}
                {tab.label}
                <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]",
                  activeTab === tab.id ? "bg-white/20" : "bg-slate-700"
                )}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredWidgets.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No widgets found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search or category</p>
            </div>
          ) : (
            Object.entries(groupedWidgets).sort(([a], [b]) => a.localeCompare(b)).map(([category, widgets]) => {
              const meta = CATEGORY_META[category as WidgetCategory] || { label: category, color: "bg-slate-500/20 text-slate-400" };
              const isExpanded = expandedCategories.has("all") || expandedCategories.has(category);

              return (
                <div key={category} className="rounded-xl border border-slate-700/50 overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border text-xs", meta.color)}>{meta.label}</Badge>
                      <span className="text-xs text-slate-500">{widgets.length} widget{widgets.length !== 1 ? "s" : ""}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {/* Widget Cards */}
                  {isExpanded && (
                    <div className="p-2 grid grid-cols-1 gap-2">
                      {widgets.map(widget => {
                        const isActive = activeWidgetIds.includes(widget.id);
                        const Icon = widget.icon;

                        return (
                          <div
                            key={widget.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all",
                              isActive
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/50"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 p-2 rounded-lg",
                              isActive ? "bg-green-500/20" : "bg-slate-700/50"
                            )}>
                              <Icon className={cn("w-5 h-5", isActive ? "text-green-400" : "text-slate-400")} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">{widget.name}</p>
                                {widget.premium && (
                                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                    <EsangIcon className="w-2.5 h-2.5 mr-0.5" />PRO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{widget.description}</p>
                            </div>

                            <Button
                              size="sm"
                              disabled={isActive}
                              onClick={() => onAddWidget(widget.id)}
                              className={cn(
                                "flex-shrink-0 rounded-lg text-xs h-8 px-3",
                                isActive
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                                  : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white hover:shadow-lg hover:shadow-purple-500/20"
                              )}
                            >
                              {isActive ? (
                                <><Check className="w-3 h-3 mr-1" />Added</>
                              ) : (
                                <><Plus className="w-3 h-3 mr-1" />Add</>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{activeWidgetIds.length} widgets on your dashboard</span>
            <span>{filteredWidgets.length} shown / {roleWidgets.length} total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
