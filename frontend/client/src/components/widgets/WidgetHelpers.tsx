import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const StatRow: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="flex justify-between p-2 rounded-lg bg-white/5">
    <span className="text-xs text-gray-400">{label}</span>
    <span className={`text-xs font-medium ${color}`}>{value}</span>
  </div>
);

export const MiniStats: React.FC<{ items: { label: string; value: string | number; color: string }[] }> = ({ items }) => (
  <div className={`grid gap-2 text-center`} style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
    {items.map((item, i) => (
      <div key={i} className={`p-2 rounded-lg ${item.color}`}>
        <p className="text-lg font-bold text-white">{item.value}</p>
        <p className="text-[10px] text-gray-400">{item.label}</p>
      </div>
    ))}
  </div>
);

export const WidgetList: React.FC<{ items: any[]; renderItem: (item: any, i: number) => React.ReactNode; empty?: string }> = ({ items, renderItem, empty = "No items" }) => (
  <div className="space-y-2">
    {items.length === 0 ? (
      <p className="text-xs text-gray-500 text-center py-2">{empty}</p>
    ) : items.map((item, i) => renderItem(item, i))}
  </div>
);

export const WidgetLoader: React.FC<{ color?: string }> = ({ color = "text-blue-400" }) => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className={`w-5 h-5 animate-spin ${color}`} />
  </div>
);
