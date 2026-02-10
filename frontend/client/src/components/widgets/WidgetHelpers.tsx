import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const StatRow: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all">
    <span className="text-xs text-gray-400 font-medium tracking-wide">{label}</span>
    <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
  </div>
);

export const MiniStats: React.FC<{ items: { label: string; value: string | number; color: string }[] }> = ({ items }) => (
  <div className={`grid gap-2 text-center`} style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
    {items.map((item, i) => (
      <div key={i} className={`p-2.5 rounded-xl ${item.color} border border-white/[0.06] hover:scale-[1.02] transition-all`}>
        <p className="text-lg font-bold text-white tabular-nums">{item.value}</p>
        <p className="text-[10px] text-gray-500 font-medium tracking-wide mt-0.5">{item.label}</p>
      </div>
    ))}
  </div>
);

export const WidgetList: React.FC<{ items: any[]; renderItem: (item: any, i: number) => React.ReactNode; empty?: string }> = ({ items, renderItem, empty = "No items" }) => (
  <div className="space-y-1.5">
    {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-6 text-gray-500">
        <p className="text-xs">{empty}</p>
      </div>
    ) : items.map((item, i) => renderItem(item, i))}
  </div>
);

export const WidgetLoader: React.FC<{ color?: string }> = ({ color = "text-purple-400" }) => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className={`w-5 h-5 animate-spin ${color}`} />
  </div>
);
