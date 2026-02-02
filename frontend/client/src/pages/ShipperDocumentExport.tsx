/**
 * SHIPPER DOCUMENT EXPORT PAGE
 * 100% Dynamic - Export and download load documents in bulk
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Download, Calendar, Package, CheckCircle,
  FileArchive, Filter, Search, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShipperDocumentExport() {
  const [dateRange, setDateRange] = useState("30d");
  const [docTypes, setDocTypes] = useState<string[]>(["bol", "pod", "rate_con"]);
  const [selectedLoads, setSelectedLoads] = useState<string[]>([]);
  const [format, setFormat] = useState("pdf");

  const loadsQuery = trpc.loads.getDeliveredLoads.useQuery({ dateRange });
  const exportMutation = trpc.documents.exportBulk.useMutation({
    onSuccess: (data) => {
      toast.success("Export ready", { description: "Download will start shortly" });
      window.open(data.downloadUrl, "_blank");
    },
    onError: (error) => toast.error("Export failed", { description: error.message }),
  });

  const loads = loadsQuery.data || [];

  const toggleLoad = (loadId: string) => {
    setSelectedLoads(prev =>
      prev.includes(loadId) ? prev.filter(id => id !== loadId) : [...prev, loadId]
    );
  };

  const toggleDocType = (type: string) => {
    setDocTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const selectAll = () => {
    setSelectedLoads(loads.map((l: any) => l.id));
  };

  const selectNone = () => {
    setSelectedLoads([]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Document Export
        </h1>
        <p className="text-slate-400 text-sm mt-1">Download load documents in bulk</p>
      </div>

      {/* Export Options */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Export Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Combined)</SelectItem>
                  <SelectItem value="zip">ZIP (Separate Files)</SelectItem>
                  <SelectItem value="csv">CSV (Data Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Document Types</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "bol", label: "Bill of Lading" },
                { value: "pod", label: "Proof of Delivery" },
                { value: "rate_con", label: "Rate Confirmation" },
                { value: "invoice", label: "Invoice" },
                { value: "inspection", label: "Inspection Reports" },
              ].map((doc) => (
                <div
                  key={doc.value}
                  onClick={() => toggleDocType(doc.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg border cursor-pointer transition-all flex items-center gap-2",
                    docTypes.includes(doc.value)
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "bg-slate-700/50 border-slate-600/50 text-slate-300"
                  )}
                >
                  <Checkbox checked={docTypes.includes(doc.value)} />
                  {doc.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Selection */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Select Loads ({selectedLoads.length} selected)
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-cyan-400">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone} className="text-slate-400">
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadsQuery.isLoading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : loads.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No delivered loads in selected period</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loads.map((load: any) => (
                <div
                  key={load.id}
                  onClick={() => toggleLoad(load.id)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between",
                    selectedLoads.includes(load.id)
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox checked={selectedLoads.includes(load.id)} />
                    <div>
                      <p className="text-white font-medium">Load #{load.loadNumber}</p>
                      <p className="text-slate-400 text-sm">
                        {load.origin?.city} → {load.destination?.city}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Delivered</p>
                      <p className="text-white text-sm">{load.deliveredAt}</p>
                    </div>
                    <div className="flex gap-1">
                      {load.documents?.map((doc: any) => (
                        <Badge key={doc.type} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          {doc.type.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <FileArchive className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Export Summary</p>
                <p className="text-slate-400 text-sm">
                  {selectedLoads.length} loads × {docTypes.length} document types
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Est. Documents</p>
              <p className="text-cyan-400 font-bold text-xl">
                {selectedLoads.length * docTypes.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        onClick={() => exportMutation.mutate({
          loadIds: selectedLoads,
          documentTypes: docTypes,
          format,
        })}
        disabled={selectedLoads.length === 0 || docTypes.length === 0 || exportMutation.isPending}
        className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg h-12"
      >
        <Download className="w-5 h-5 mr-2" />
        {exportMutation.isPending ? "Preparing Export..." : `Export ${selectedLoads.length * docTypes.length} Documents`}
      </Button>
    </div>
  );
}
