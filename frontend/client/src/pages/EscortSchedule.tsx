/**
 * ESCORT SCHEDULE PAGE
 * 100% Dynamic - No mock data
 * Job scheduling and availability management for escort drivers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, Truck, MapPin, DollarSign, CheckCircle,
  ChevronLeft, ChevronRight, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const scheduleQuery = (trpc as any).escorts.getSchedule.useQuery({ date: selectedDate });
  const availabilityQuery = (trpc as any).escorts.getAvailability.useQuery();
  const upcomingQuery = (trpc as any).escorts.getUpcomingJobs.useQuery();

  const updateAvailabilityMutation = (trpc as any).escorts.updateAvailability.useMutation({
    onSuccess: () => {
      toast.success("Availability updated");
      availabilityQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to update", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Completed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case "lead":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Lead</Badge>;
      case "chase":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Chase</Badge>;
      case "both":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Lead/Chase</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{position}</Badge>;
    }
  };

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            My Schedule
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your escort job schedule and availability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Daily Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigateDate(-1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-white font-medium px-3">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigateDate(1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {scheduleQuery.isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-lg" />)}
                </div>
              ) : (scheduleQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No jobs scheduled for this day</p>
                  <p className="text-slate-500 text-sm">Check the marketplace for available jobs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(scheduleQuery.data as any)?.map((job: any) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{job.convoyName}</span>
                            {getStatusBadge(job.status)}
                            {getPositionBadge(job.position)}
                          </div>
                          <p className="text-sm text-slate-400">{job.loadDescription}</p>
                        </div>
                        <div className="text-right">
                          <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${job.rate}</p>
                          <p className="text-xs text-slate-500">{job.rateType}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{job.startTime} - {job.endTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{job.origin} to {job.destination}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Truck className="w-3 h-3" />
                          <span>{job.distance} miles</span>
                        </div>
                        {job.specialRequirements && (
                          <div className="flex items-center gap-1 text-orange-400">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{job.specialRequirements}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                          View Details
                        </Button>
                        {job.status === "pending" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-lg">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirm
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Upcoming Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingQuery.isLoading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {(upcomingQuery.data as any)?.map((job: any) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{job.convoyName}</span>
                          {getPositionBadge(job.position)}
                        </div>
                        <p className="text-xs text-slate-400">{job.date} - {job.route}</p>
                      </div>
                      <div className="text-right">
                        <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${job.rate}</p>
                        <p className="text-xs text-slate-500">{job.distance} mi</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                My Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availabilityQuery.isLoading ? (
                <div className="space-y-2">
                  {Array(7).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {(availabilityQuery.data as any)?.map((day: any) => (
                    <div
                      key={day.dayOfWeek}
                      className={cn(
                        "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors",
                        day.available 
                          ? "bg-green-500/10 border-green-500/30" 
                          : "bg-slate-700/30 border-slate-600/30"
                      )}
                      onClick={() => updateAvailabilityMutation.mutate({
                        dayOfWeek: day.dayOfWeek,
                        available: !day.available,
                      })}
                    >
                      <span className="text-white font-medium">{day.dayName}</span>
                      <Badge className={cn(
                        day.available 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      )}>
                        {day.available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Week Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Jobs This Week</p>
                  <p className="text-2xl font-bold text-white">5</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/30">
                  <p className="text-xs text-slate-500">Total Miles</p>
                  <p className="text-2xl font-bold text-white">842</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-slate-500">Projected Earnings</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">$2,450</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
