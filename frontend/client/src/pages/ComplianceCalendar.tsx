/**
 * COMPLIANCE CALENDAR PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, Clock, AlertTriangle, CheckCircle, ChevronLeft,
  ChevronRight, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ComplianceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const eventsQuery = (trpc as any).compliance.getCalendarEvents.useQuery({
    month: currentMonth.getMonth() + 1,
    year: currentMonth.getFullYear(),
  });
  const summaryQuery = (trpc as any).compliance.getCalendarSummary.useQuery();

  const summary = summaryQuery.data;

  const getEventBadge = (type: string) => {
    switch (type) {
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Expiring</Badge>;
      case "due": return <Badge className="bg-red-500/20 text-red-400 border-0">Due</Badge>;
      case "renewal": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Renewal</Badge>;
      case "inspection": return <Badge className="bg-purple-500/20 text-purple-400 border-0">Inspection</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Compliance Calendar
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track deadlines and compliance events</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalEvents || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.overdue || 0}</p>
                )}
                <p className="text-xs text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.upcoming || 0}</p>
                )}
                <p className="text-xs text-slate-400">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.completed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-white text-lg">{monthName}</CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (eventsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No events this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(eventsQuery.data as any)?.map((event: any) => (
                <div key={event.id} className={cn("p-4 rounded-xl border", event.type === "due" || event.type === "overdue" ? "bg-red-500/10 border-red-500/30" : event.type === "expiring" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-slate-700/30 border-slate-600/30")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", event.type === "due" || event.type === "overdue" ? "bg-red-500/20" : event.type === "expiring" ? "bg-yellow-500/20" : "bg-blue-500/20")}>
                        <FileText className={cn("w-4 h-4", event.type === "due" || event.type === "overdue" ? "text-red-400" : event.type === "expiring" ? "text-yellow-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{event.title}</p>
                        <p className="text-sm text-slate-400">{event.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{event.date}</p>
                      {getEventBadge(event.type)}
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
