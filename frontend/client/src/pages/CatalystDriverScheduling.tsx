/**
 * CATALYST DRIVER SCHEDULING PAGE
 * 100% Dynamic - Schedule and manage driver assignments
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, User, Clock, ChevronLeft, ChevronRight,
  Truck, MapPin, AlertTriangle, CheckCircle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystDriverScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const scheduleQuery = trpc.catalysts.getDriverSchedule.useQuery({ date: selectedDate, view: viewMode });
  const driversQuery = trpc.catalysts.getDriversForScheduling.useQuery();

  const assignMutation = trpc.catalysts.assignDriverToSlot.useMutation({
    onSuccess: () => {
      toast.success("Driver assigned");
      scheduleQuery.refetch();
    },
  });

  const schedule = scheduleQuery.data || [];
  const drivers = driversQuery.data || [];

  const navigateDate = (direction: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (viewMode === "week" ? direction * 7 : direction));
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-green-500/20 text-green-400 border-green-500/50";
      case "available": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "off_duty": return "bg-slate-500/20 text-slate-400 border-slate-500/50";
      case "conflict": return "bg-red-500/20 text-red-400 border-red-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Driver Scheduling
          </h1>
          <p className="text-slate-400 text-sm mt-1">Plan and manage driver assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(v: "day" | "week") => setViewMode(v)}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-slate-700/50 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />Add Assignment
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigateDate(-1)} className="text-slate-400">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <p className="text-white text-xl font-bold">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {viewMode === "week" && (
                <p className="text-slate-400 text-sm">Week View</p>
              )}
            </div>
            <Button variant="ghost" onClick={() => navigateDate(1)} className="text-slate-400">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Driver List */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Drivers ({drivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {driversQuery.isLoading ? (
              <div className="p-3 space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                {drivers.map((driver: any) => (
                  <div
                    key={driver.id}
                    className="p-3 border-b border-slate-700/50 hover:bg-slate-700/20 cursor-pointer"
                    draggable
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{driver.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("border-0 text-xs", getStatusColor(driver.status))}>
                            {driver.status}
                          </Badge>
                          <span className="text-slate-500 text-xs">{driver.drivingAvailable}h avail</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleQuery.isLoading ? (
                <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No scheduled assignments</p>
                  <p className="text-slate-500 text-sm">Drag drivers to create assignments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedule.map((slot: any) => (
                    <div
                      key={slot.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        slot.conflict ? "bg-red-500/10 border-red-500/30" : "bg-slate-700/30 border-slate-600/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-600/50">
                            <Clock className="w-5 h-5 text-slate-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{slot.timeRange}</p>
                            <p className="text-slate-400 text-sm">{slot.loadCount} loads scheduled</p>
                          </div>
                        </div>
                        {slot.conflict && (
                          <Badge className="bg-red-500/20 text-red-400 border-0">
                            <AlertTriangle className="w-3 h-3 mr-1" />Conflict
                          </Badge>
                        )}
                      </div>

                      {slot.assignments?.map((assignment: any) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded bg-slate-800/50 mb-2 last:mb-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <span className="text-cyan-400 text-sm font-bold">{assignment.driverInitials}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{assignment.driverName}</p>
                              <p className="text-slate-400 text-xs">Load #{assignment.loadNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {assignment.origin} → {assignment.destination}
                            </span>
                            <Badge className={cn("border-0 text-xs", getStatusColor(assignment.status))}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {slot.unassignedLoads > 0 && (
                        <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/30 mt-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 text-sm">
                              {slot.unassignedLoads} loads need driver assignment
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <span className="text-slate-400 text-sm">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-slate-300 text-sm">Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-slate-300 text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-slate-300 text-sm">Needs Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-slate-300 text-sm">Conflict</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
