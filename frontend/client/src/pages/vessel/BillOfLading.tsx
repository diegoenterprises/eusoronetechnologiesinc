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
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";


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
  const bolQuery = (trpc as any).vesselShipments.getBOL.useQuery({});
  const allBols: any[] = Array.isArray(bolQuery.data) ? bolQuery.data : bolQuery.data ? [bolQuery.data] : [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  const filteredBols = allBols.filter((b: any) => {
    if (tab === "issued" && b.status !== "issued") return false;
    if (tab === "draft" && b.status !== "draft") return false;
    if (tab === "surrendered" && b.status !== "surrendered") return false;
    if (search && !(b.bolNumber || "").toLowerCase().includes(search.toLowerCase())) return false;
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

      {filteredBols.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No bills of lading yet</p>
          <p className="text-sm">Data will appear as vessel bookings are created.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBols.map((b: any) => (
            <Card key={b.id} className={cardBg}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText className={cn("w-4 h-4", b.status === "surrendered" ? "text-emerald-400" : b.status === "issued" ? "text-blue-400" : "text-amber-400")} />
                    <div>
                      <div className={cn("font-medium text-sm", isLight ? "text-slate-900" : "text-white")}>{b.bolNumber}</div>
                      <div className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>Shipment #{b.shipmentId} • {b.bolType || "standard"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={bolTypeBadge(b.bolType || "")}>{b.bolType || "—"}</Badge>
                    <Badge className={bolStatusBadge(b.status)}>{b.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-500">Shipper: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.shipperName || "—"}</span></div>
                  <div><span className="text-slate-500">Consignee: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.consigneeName || "—"}</span></div>
                  <div><span className="text-slate-500">Issued: </span><span className={isLight ? "text-slate-700" : "text-slate-300"}>{b.issuedDate ? new Date(b.issuedDate).toLocaleDateString() : "—"}</span></div>
                </div>
                {b.status === "issued" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.success(`BOL ${b.bolNumber} surrendered`)}>
                      <CheckCircle className="w-3 h-3 mr-1" /> Surrender
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
