/**
 * SAFER LOOKUP PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Search, Shield, CheckCircle, AlertTriangle, Truck,
  Building, FileText, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SAFERLookup() {
  const [searchType, setSearchType] = useState<"mc" | "dot">("mc");
  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState<any>(null);

  const lookupMutation = (trpc as any).compliance.saferLookup.useMutation({
    onSuccess: (data: any) => { setResult(data); toast.success("Carrier found"); },
    onError: (error: any) => { setResult(null); toast.error("Not found", { description: error.message }); },
  });

  const handleSearch = () => {
    if (searchValue) {
      lookupMutation.mutate({ type: searchType, value: searchValue });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "authorized": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Authorized</Badge>;
      case "not_authorized": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Not Authorized</Badge>;
      case "out_of_service": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Out of Service</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">SAFER Lookup</h1>
          <p className="text-slate-400 text-sm mt-1">FMCSA carrier verification</p>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
              <Button size="sm" variant={searchType === "mc" ? "default" : "ghost"} className={cn("rounded-lg", searchType === "mc" && "bg-gradient-to-r from-cyan-600 to-emerald-600")} onClick={() => setSearchType("mc")}>MC#</Button>
              <Button size="sm" variant={searchType === "dot" ? "default" : "ghost"} className={cn("rounded-lg", searchType === "dot" && "bg-gradient-to-r from-cyan-600 to-emerald-600")} onClick={() => setSearchType("dot")}>DOT#</Button>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={searchValue} onChange={(e: any) => setSearchValue(e.target.value)} placeholder={`Enter ${searchType.toUpperCase()} number...`} className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg" onKeyDown={(e: any) => e.key === "Enter" && handleSearch()} />
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={handleSearch} disabled={lookupMutation.isPending}>
              <Search className="w-4 h-4 mr-2" />Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {lookupMutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {result && (
        <>
          <Card className={cn("rounded-xl", result.operatingStatus === "authorized" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-full", result.operatingStatus === "authorized" ? "bg-green-500/20" : "bg-red-500/20")}>
                    <Shield className={cn("w-8 h-8", result.operatingStatus === "authorized" ? "text-green-400" : "text-red-400")} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xl">{result.legalName}</p>
                    <p className="text-sm text-slate-400">{result.dbaName && `DBA: ${result.dbaName}`}</p>
                  </div>
                </div>
                {getStatusBadge(result.operatingStatus)}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">MC Number</p><p className="text-white font-medium">{result.mcNumber || "N/A"}</p></div>
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">DOT Number</p><p className="text-white font-medium">{result.dotNumber}</p></div>
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Entity Type</p><p className="text-white font-medium">{result.entityType}</p></div>
                <div className="p-3 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-500">Power Units</p><p className="text-white font-medium">{result.powerUnits}</p></div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Building className="w-5 h-5 text-cyan-400" />Company Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><p className="text-xs text-slate-500">Address</p><p className="text-white">{result.address}</p></div>
                <div><p className="text-xs text-slate-500">Phone</p><p className="text-white">{result.phone}</p></div>
                <div><p className="text-xs text-slate-500">MCS-150 Date</p><p className="text-white">{result.mcs150Date}</p></div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-purple-400" />Fleet Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Drivers</span><span className="text-white font-medium">{result.drivers}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Power Units</span><span className="text-white font-medium">{result.powerUnits}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Cargo Carried</span><span className="text-white font-medium">{result.cargoCarried?.join(", ")}</span></div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-green-400" />Insurance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.insurance?.map((ins: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-slate-400">{ins.type}</span>
                    <div className="text-right">
                      <span className="text-white font-medium">${ins.amount?.toLocaleString()}</span>
                      {ins.status === "active" ? <CheckCircle className="w-4 h-4 text-green-400 inline ml-2" /> : <XCircle className="w-4 h-4 text-red-400 inline ml-2" />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" />Safety Rating</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-slate-400">Rating</span><span className={cn("font-medium", result.safetyRating === "Satisfactory" ? "text-green-400" : result.safetyRating === "Conditional" ? "text-yellow-400" : "text-red-400")}>{result.safetyRating || "Not Rated"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Rating Date</span><span className="text-white">{result.safetyRatingDate || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">OOS Rate</span><span className={cn("font-medium", result.oosRate < 20 ? "text-green-400" : result.oosRate < 30 ? "text-yellow-400" : "text-red-400")}>{result.oosRate}%</span></div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!lookupMutation.isPending && !result && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Enter an MC or DOT number to lookup carrier information</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
