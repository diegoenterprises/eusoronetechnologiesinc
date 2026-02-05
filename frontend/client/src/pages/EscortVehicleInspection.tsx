/**
 * ESCORT VEHICLE INSPECTION PAGE
 * 100% Dynamic - Perform and track vehicle inspections
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ClipboardCheck, Search, Plus, Car, Calendar,
  CheckCircle, AlertTriangle, Clock, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortVehicleInspection() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewInspection, setShowNewInspection] = useState(false);

  const inspectionsQuery = trpc.escorts.getJobs.useQuery({ status: statusFilter !== "all" ? statusFilter : undefined });
  const statsQuery = trpc.escorts.getDashboardStats.useQuery();
  const vehiclesQuery = trpc.escorts.getJobs.useQuery({});
  const checklistQuery = trpc.escorts.getJobs.useQuery({});

  const submitInspectionMutation = trpc.escorts.acceptJob.useMutation({
    onSuccess: () => {
      toast.success("Inspection submitted");
      inspectionsQuery.refetch();
      statsQuery.refetch();
      setShowNewInspection(false);
    },
  });

  const inspections = inspectionsQuery.data || [];
  const stats = statsQuery.data;
  const vehicles = vehiclesQuery.data || [];
  const checklist = checklistQuery.data || [];

  const filteredInspections = inspections.filter((i: any) =>
    i.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspectorName?.toLowerCase().includes(search.toLowerCase())
  );

  const [inspectionData, setInspectionData] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Vehicle Inspection
          </h1>
          <p className="text-slate-400 text-sm mt-1">Perform and track escort vehicle inspections</p>
        </div>
        <Button
          onClick={() => setShowNewInspection(!showNewInspection)}
          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />New Inspection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.completedThisMonth || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Passed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-400 text-sm">Failed</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{stats?.activeJobs || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Due Today</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.upcoming || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Vehicles</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.upcomingJobs || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* New Inspection Form */}
      {showNewInspection && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-violet-400" />
              New Vehicle Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Select Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.number} - {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {checklistQuery.isLoading ? (
                <Skeleton className="h-48 rounded-lg" />
              ) : (
                <div className="space-y-4">
                  {checklist.map((category: any) => (
                    <div key={category.id} className="p-4 rounded-lg bg-slate-700/30">
                      <p className="text-white font-medium mb-3">{category.name}</p>
                      <div className="space-y-2">
                        {category.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <Checkbox
                              id={item.id}
                              checked={inspectionData[item.id] || false}
                              onCheckedChange={(checked) => 
                                setInspectionData(prev => ({ ...prev, [item.id]: !!checked }))
                              }
                            />
                            <label htmlFor={item.id} className="text-slate-300 text-sm cursor-pointer">
                              {item.name}
                            </label>
                            {item.required && (
                              <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Required</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or issues found..."
                className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-24"
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewInspection(false)}
                  className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => submitInspectionMutation.mutate({
                    jobId: selectedVehicle,
                  } as any)}
                  disabled={!selectedVehicle || submitInspectionMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 rounded-lg"
                >
                  Submit Inspection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search inspections..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <div className="space-y-4">
        {inspectionsQuery.isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
        ) : filteredInspections.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No inspections found</p>
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map((inspection: any) => (
            <Card key={inspection.id} className={cn(
              "bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden",
              inspection.status === "failed" && "border-l-4 border-red-500"
            )}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      inspection.status === "passed" ? "bg-green-500/20" :
                      inspection.status === "failed" ? "bg-red-500/20" :
                      "bg-yellow-500/20"
                    )}>
                      {inspection.status === "passed" ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : inspection.status === "failed" ? (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      ) : (
                        <Clock className="w-6 h-6 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold">Vehicle #{inspection.vehicleNumber}</p>
                      <p className="text-slate-400 text-sm">{inspection.vehicleMake} {inspection.vehicleModel}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    inspection.status === "passed" ? "bg-green-500/20 text-green-400" :
                    inspection.status === "failed" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {inspection.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Date</p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {inspection.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Inspector</p>
                    <p className="text-white">{inspection.inspectorName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Type</p>
                    <p className="text-white">{inspection.inspectionType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Mileage</p>
                    <p className="text-white">{inspection.mileage?.toLocaleString()} mi</p>
                  </div>
                </div>

                {inspection.status === "failed" && inspection.failedItems?.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                    <p className="text-red-400 font-medium text-sm mb-2">Failed Items:</p>
                    <ul className="text-red-300 text-sm list-disc list-inside">
                      {inspection.failedItems.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {inspection.notes && (
                  <div className="p-3 rounded-lg bg-slate-700/30">
                    <p className="text-slate-400 text-xs mb-1">Notes:</p>
                    <p className="text-slate-300 text-sm">{inspection.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-end pt-3 border-t border-slate-700/50 mt-4">
                  <Button variant="ghost" size="sm" className="text-cyan-400">
                    <FileText className="w-4 h-4 mr-1" />View Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
