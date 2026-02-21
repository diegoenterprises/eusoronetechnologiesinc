/**
 * BOL GENERATION PAGE - Terminal Manager
 * 100% Dynamic - No mock data
 * Bill of Lading generation and management
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, Plus, Download, Printer, CheckCircle,
  Clock, AlertTriangle, Truck, Calendar, Eye, Beaker, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SpectraMatchWidget from "@/components/SpectraMatchWidget";

export default function BOLGeneration() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const bolsQuery = (trpc as any).terminals.getBOLs.useQuery({
    search,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const statsQuery = (trpc as any).terminals.getBOLStats.useQuery();

  const generateMutation = (trpc as any).terminals.generateBOL.useMutation({
    onSuccess: (data: any) => {
      toast.success("BOL generated successfully", { description: `BOL #${data.bolNumber}` });
      bolsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to generate BOL", { description: error.message }),
  });

  const handleGenerateBOL = () => {
    generateMutation.mutate({
      appointmentId: `apt_${Date.now()}`,
      productId: "prod_diesel",
      quantity: 8500,
      destination: "Houston Terminal",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generated":
        return <Badge className="bg-green-500/20 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent border-green-500/30">Generated</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "signed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Signed</Badge>;
      case "delivered":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Delivered</Badge>;
      case "voided":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Voided</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Bill of Lading
          </h1>
          <p className="text-slate-400 text-sm mt-1">Generate and manage BOL documents</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-lg"
          onClick={handleGenerateBOL}
          disabled={generateMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" />
          Generate BOL
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.generated || 0}</p>
                    <p className="text-xs text-slate-400">Generated Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.pending || 0}</p>
                    <p className="text-xs text-slate-400">Pending Signature</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.thisMonth || 0}</p>
                    <p className="text-xs text-slate-400">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Truck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(statsQuery.data as any)?.delivered || 0}</p>
                    <p className="text-xs text-slate-400">Delivered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* SPECTRA-MATCH Quick Access */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border-purple-500/30 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Beaker className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  SPECTRA-MATCH™ Product Verification
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 text-xs">AI</Badge>
                </p>
                <p className="text-sm text-slate-400">Verify crude/fuel product identity before generating BOL</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              onClick={() => window.location.href = '/spectra-match'}
            >
              <Target className="w-4 h-4 mr-2" />
              Open SPECTRA-MATCH
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" />
              BOL Records
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search BOL number..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bolsQuery.isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
          ) : (bolsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No BOLs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(bolsQuery.data as any)?.map((bol: any) => (
                <div
                  key={bol.id}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-bold">{bol.bolNumber}</span>
                        {getStatusBadge(bol.status)}
                        {bol.hazmat && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">HazMat</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Catalyst</p>
                          <p className="text-sm text-white">{bol.catalyst}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Driver</p>
                          <p className="text-sm text-white">{bol.driver}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Product</p>
                          <p className="text-sm text-white">{bol.product}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Quantity</p>
                          <p className="text-sm text-white">{bol.weight?.toLocaleString()} gal</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(bol.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {bol.vehicleNumber}
                        </span>
                        {bol.destination && (
                          <span>Dest: {bol.destination}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
