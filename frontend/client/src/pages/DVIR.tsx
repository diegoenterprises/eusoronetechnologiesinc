/**
 * DVIR PAGE - Driver Vehicle Inspection Report
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle, XCircle, AlertTriangle, Truck, FileText,
  Calendar, Clock, MapPin, User, Send, History, Eye,
  Wrench, Shield, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DVIR() {
  const [activeTab, setActiveTab] = useState("new");
  const [inspectionType, setInspectionType] = useState<"pre-trip" | "post-trip">("pre-trip");
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const categoriesQuery = trpc.dvir.getCategories.useQuery();
  const historyQuery = trpc.dvir.getHistory.useQuery({ limit: 20 });
  const pendingDefectsQuery = trpc.dvir.getPendingDefects.useQuery();
  const vehicleQuery = trpc.dvir.getCurrentVehicle.useQuery();

  const submitMutation = trpc.dvir.submit.useMutation({
    onSuccess: () => {
      toast.success("DVIR submitted successfully");
      setSelectedDefects([]);
      setNotes("");
      historyQuery.refetch();
    },
    onError: (error) => toast.error("Submission failed", { description: error.message }),
  });

  const certifySafeMutation = trpc.dvir.certifySafe.useMutation({
    onSuccess: () => {
      toast.success("Vehicle certified safe");
      pendingDefectsQuery.refetch();
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const toggleDefect = (defectId: string) => {
    setSelectedDefects(prev =>
      prev.includes(defectId) ? prev.filter(d => d !== defectId) : [...prev, defectId]
    );
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      type: inspectionType,
      defects: selectedDefects,
      notes,
      defectsFound: selectedDefects.length > 0,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "major": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "minor": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "repaired": return "bg-green-500/20 text-green-400";
      case "acknowledged": return "bg-blue-500/20 text-blue-400";
      case "reported": return "bg-yellow-500/20 text-yellow-400";
      case "deferred": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DVIR</h1>
          <p className="text-slate-400 text-sm">Driver Vehicle Inspection Report</p>
        </div>
      </div>

      {/* Current Vehicle */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Truck className="w-8 h-8 text-blue-400" />
              </div>
              {vehicleQuery.isLoading ? (
                <div><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
              ) : (
                <div>
                  <p className="text-white font-bold text-lg">{vehicleQuery.data?.truckNumber}</p>
                  <p className="text-slate-400">Trailer: {vehicleQuery.data?.trailerNumber || "None"}</p>
                  <p className="text-sm text-slate-500">Odometer: {vehicleQuery.data?.odometer?.toLocaleString()} mi</p>
                </div>
              )}
            </div>
            <div className="text-right">
              {vehicleQuery.isLoading ? <Skeleton className="h-6 w-24" /> : (
                <Badge className={vehicleQuery.data?.lastInspectionStatus === "pass" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                  Last: {vehicleQuery.data?.lastInspectionDate}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Defects Alert */}
      {pendingDefectsQuery.data && pendingDefectsQuery.data.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />Outstanding Defects ({pendingDefectsQuery.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingDefectsQuery.data.map((defect) => (
                <div key={defect.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div>
                    <p className="text-white font-medium">{defect.category}: {defect.description}</p>
                    <p className="text-xs text-slate-500">Reported: {defect.reportedAt}</p>
                  </div>
                  <Badge className={getSeverityColor(defect.severity)}>{defect.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="new" className="data-[state=active]:bg-blue-600">New Inspection</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">History</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />New Inspection
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant={inspectionType === "pre-trip" ? "default" : "outline"} size="sm" className={inspectionType === "pre-trip" ? "bg-blue-600" : "border-slate-600"} onClick={() => setInspectionType("pre-trip")}>Pre-Trip</Button>
                  <Button variant={inspectionType === "post-trip" ? "default" : "outline"} size="sm" className={inspectionType === "post-trip" ? "bg-blue-600" : "border-slate-600"} onClick={() => setInspectionType("post-trip")}>Post-Trip</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Select any defects found during inspection:</p>

              {categoriesQuery.isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {categoriesQuery.data?.map((category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className={cn(
                        "h-auto py-3 justify-start",
                        selectedDefects.includes(category.id)
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "border-slate-600 hover:border-slate-500"
                      )}
                      onClick={() => toggleDefect(category.id)}
                    >
                      {selectedDefects.includes(category.id) ? (
                        <XCircle className="w-4 h-4 mr-2 text-red-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      )}
                      {category.label}
                    </Button>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <Label className="text-slate-400">Additional Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe any defects or observations..."
                  className="mt-1 bg-slate-700/50 border-slate-600"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 mb-6">
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-6 h-6", selectedDefects.length === 0 ? "text-green-400" : "text-yellow-400")} />
                  <div>
                    <p className="text-white font-medium">
                      {selectedDefects.length === 0 ? "No Defects Found" : `${selectedDefects.length} Defect(s) Found`}
                    </p>
                    <p className="text-sm text-slate-400">
                      {selectedDefects.length === 0 ? "Vehicle is safe to operate" : "Defects will be reported to maintenance"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedDefects.length === 0 && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => certifySafeMutation.mutate({})} disabled={certifySafeMutation.isPending}>
                    {certifySafeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Certify Safe
                  </Button>
                )}
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSubmit} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit DVIR
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><History className="w-5 h-5 text-purple-400" />Inspection History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : historyQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No inspection history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyQuery.data?.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", report.defectsFound ? "bg-yellow-500/20" : "bg-green-500/20")}>
                          {report.defectsFound ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> : <CheckCircle className="w-5 h-5 text-green-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium capitalize">{report.type}</p>
                            <Badge className={report.defectsFound ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}>
                              {report.defectsFound ? `${report.defectCount} Defects` : "No Defects"}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{report.truckNumber} | {report.trailerNumber || "No Trailer"}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />{report.date}
                            <Clock className="w-3 h-3 ml-2" />{report.time}
                            <MapPin className="w-3 h-3 ml-2" />{report.location}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
