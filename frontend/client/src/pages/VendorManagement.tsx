/**
 * VENDOR MANAGEMENT PAGE
 * Frontend for vendors router — vendor directory, ratings, PO management.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Building2, Star, Phone, Mail, MapPin, Search,
  Package, Wrench, Fuel, Shield, Filter, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-slate-500/20 text-slate-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  suspended: "bg-red-500/20 text-red-400",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  maintenance: <Wrench className="w-4 h-4 text-blue-400" />,
  fuel: <Fuel className="w-4 h-4 text-orange-400" />,
  insurance: <Shield className="w-4 h-4 text-purple-400" />,
  parts: <Package className="w-4 h-4 text-cyan-400" />,
};

export default function VendorManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");

  const listQuery = (trpc as any).vendors.list.useQuery({ search: searchTerm || undefined, limit: 50 });
  const statsQuery = (trpc as any).vendors.getStats.useQuery();
  const detailQuery = (trpc as any).vendors.getById.useQuery({ id: selectedId }, { enabled: !!selectedId });

  const vendors = listQuery.data?.vendors || [];
  const stats = statsQuery.data;
  const detail = detailQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Vendor Management</h1>
        <p className="text-slate-400 text-sm mt-1">Vendor directory, ratings, and purchase orders</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Vendors", value: stats.total || 0, icon: <Building2 className="w-5 h-5 text-blue-400" />, color: "text-blue-400" },
            { label: "Active", value: stats.active || 0, icon: <Building2 className="w-5 h-5 text-green-400" />, color: "text-green-400" },
            { label: "Pending", value: stats.pending || 0, icon: <Building2 className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
            { label: "Avg Rating", value: stats.avgRating?.toFixed(1) || "N/A", icon: <Star className="w-5 h-5 text-purple-400" />, color: "text-purple-400" },
          ].map(s => (
            <Card key={s.label} className="bg-white/[0.02] border-white/[0.06] rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-slate-700/30">{s.icon}</div>
                  <div><p className={cn("text-xl font-bold", s.color)}>{s.value}</p><p className="text-[10px] text-slate-400 uppercase">{s.label}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <Input placeholder="Search vendors..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-900/50 border-slate-700 text-white max-w-sm" />
        <Button onClick={() => listQuery.refetch()} className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF]"><Search className="w-4 h-4" /></Button>
      </div>

      {/* Detail Panel */}
      {selectedId && detail && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1473FF]" />{detail.name}
              <Badge className={cn("text-[9px] ml-2", STATUS_COLORS[detail.status])}>{detail.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setSelectedId("")} className="ml-auto text-slate-400">Close</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {detail.email && <div className="flex items-center gap-2 text-slate-300"><Mail className="w-4 h-4 text-slate-400" />{detail.email}</div>}
              {detail.phone && <div className="flex items-center gap-2 text-slate-300"><Phone className="w-4 h-4 text-slate-400" />{detail.phone}</div>}
              {detail.address && <div className="flex items-center gap-2 text-slate-300 col-span-2"><MapPin className="w-4 h-4 text-slate-400" />{detail.address}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />All Vendors
            <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{listQuery.data?.total || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center"><Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No vendors found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {vendors.map((v: any) => (
                <button key={v.id} onClick={() => setSelectedId(v.id)} className="w-full p-3 flex items-center justify-between hover:bg-white/[0.04] text-left">
                  <div className="flex items-center gap-3">
                    {TYPE_ICONS[v.type] || <Building2 className="w-4 h-4 text-slate-400" />}
                    <div>
                      <p className="text-white font-medium text-sm">{v.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{v.type}</span>
                        {v.email && <span>{v.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[9px]", STATUS_COLORS[v.status])}>{v.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
