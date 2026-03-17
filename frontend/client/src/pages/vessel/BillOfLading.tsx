/**
 * BILL OF LADING — V5 Multi-Modal
 * BOL management: create/view/surrender BOLs,
 * BOL types (master, house, straight, order), document workflow
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Search, CheckCircle, Ship } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const MOCK_BOLS = [
  { id: 1, bolNumber: "BOL-2026-MSC-00234", bookingRef: "VB-2026-0034", bolType: "master", shipper: "Pacific Electronics Inc", consignee: "TechDist America LLC", vessel: "MSC FLORA", containers: 4, status: "issued", surrendered: false, issuedDate: "2026-03-12" },
  { id: 2, bolNumber: "BOL-2026-MAE-00118", bookingRef: "VB-2026-0038", bolType: "house", shipper: "AutoParts Global Ltd", consignee: "Midwest Auto Parts LLC", vessel: "MAERSK EDMONTON", containers: 2, status: "surrendered", surrendered: true, issuedDate: "2026-03-10" },
  { id: 3, bolNumber: "BOL-2026-CMA-00089", bookingRef: "VB-2026-0041", bolType: "straight", shipper: "Fashion House Milano", consignee: "Fashion Forward Imports", vessel: "CMA CGM JACQUES SAADE", containers: 1, status: "draft", surrendered: false, issuedDate: "" },
  { id: 4, bolNumber: "BOL-2026-EVR-00056", bookingRef: "VB-2026-0042", bolType: "order", shipper: "TSMC Export Division", consignee: "To Order of Bank of America", vessel: "EVER ACE", containers: 6, status: "issued", surrendered: false, issuedDate: "2026-03-14" },
];

function bolStatusBadge(status: string) {
  if (status === "surrendered") return "bg-emerald-500/20 text-emerald-400";
  if (status === "issued") return "bg-blue-500/20 text-blue-400";
  if (status === "draft") return "bg-amber-500/20 text-amber-400";
  return "bg-slate-500/20 text-slate-400";
}

function bolTypeBadge(type: string) {
  if (type === "master") return "bg-purple-500/20 text-purple-400";
  if (type === "house") return "bg-indigo-500/20 text-indigo-400";
  if (type === "straight") return "bg-blue-500/20 text-blue-400";
  if (type === "order") return "bg-cyan-500/20 text-cyan-400";
  return "bg-slate-500/20 text-slate-400";
}

export default function BillOfLading() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  const filteredBols = MOCK_BOLS.filter((b) => {
    if (tab === "issued" && b.status !== "issued") return false;
    if (tab === "draft" && b.status !== "draft") return false;
    if (tab === "surrendered" && !b.surrendered) return false;
    if (search && !b.bolNumber.toLowerCase().includes(search.toLowerCase()) && !b.shipper.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-500/10"><FileText className="w-6 h-6 text-indigo-400" /></div>
        <div>
          <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Bills of Lading</h1>
          <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>BOL issuance, tracking &amp; surrender</p>
        </div>
      </div>

      {/* BOL Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {[
          { type: "master", label: "Master BOL", desc: "Carrier to freight forwarder" },
          { type: "house", label: "House BOL", desc: "Forwarder to shipper" },
          { type: "straight", label: "Straight BOL", desc: "Non-negotiable, named consignee" },
          { type: "order", label: "Order BOL", desc: "Negotiable, transferable" },
        ].map((t) => (
          <div key={t.type} className={cn("rounded-xl border p-3", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
            <Badge className={cn(bolTypeBadge(t.type), "mb-1.5 text-xs")}>{t.label}</Badge>
            <p className={cn("text-[11px]", isLight ? "text-slate-500" : "text-slate-400")}>{t.desc}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="surrendered">Surrendered</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input className="pl-9" placeholder="Search by BOL # or shipper..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filteredBols.map((b) => (
          <Card key={b.id} className={cardBg}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FileText className={cn("w-4 h-4", b.status === "surrendered" ? "text-emerald-400" : b.status === "issued" ? "text-blue-400" : "text-amber-400")} />
                  <div>
                    <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{b.bolNumber}</div>
                    <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Booking: {b.bookingRef} — Vessel: {b.vessel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={bolTypeBadge(b.bolType)}>{b.bolType}</Badge>
                  <Badge className={bolStatusBadge(b.status)}>{b.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div><span className="text-slate-500">Shipper: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.shipper}</span></div>
                <div><span className="text-slate-500">Consignee: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.consignee}</span></div>
                <div><span className="text-slate-500">Containers: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.containers}</span></div>
                <div><span className="text-slate-500">Issued: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.issuedDate || "—"}</span></div>
              </div>
              {b.status === "issued" && !b.surrendered && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.success(`BOL ${b.bolNumber} surrendered`)}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Surrender
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredBols.length === 0 && <p className="text-center py-12 text-slate-500 text-sm">No BOLs found</p>}
      </div>
    </div>
  );
}
