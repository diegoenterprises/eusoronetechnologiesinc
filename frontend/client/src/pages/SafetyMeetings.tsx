/**
 * SAFETY MEETINGS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Shield, Search, Plus, Calendar, Users, Clock,
  CheckCircle, Video, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SafetyMeetings() {
  const [searchTerm, setSearchTerm] = useState("");

  const meetingsQuery = trpc.safety.getMeetings.useQuery({ limit: 20 });
  const upcomingQuery = trpc.safety.getUpcomingMeetings.useQuery({ limit: 5 });
  const summaryQuery = trpc.safety.getMeetingSummary.useQuery();

  const registerMutation = trpc.safety.registerForMeeting.useMutation({
    onSuccess: () => { toast.success("Registered for meeting"); meetingsQuery.refetch(); },
    onError: (error) => toast.error("Registration failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Scheduled</Badge>;
      case "in_progress": return <Badge className="bg-green-500/20 text-green-400 border-0">In Progress</Badge>;
      case "completed": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Completed</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400 border-0">Cancelled</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredMeetings = meetingsQuery.data?.filter((meeting: any) =>
    !searchTerm || meeting.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Safety Meetings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Schedule and attend safety meetings</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Schedule Meeting
        </Button>
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
                  <p className="text-2xl font-bold text-blue-400">{summary?.upcoming || 0}</p>
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
                  <p className="text-2xl font-bold text-green-400">{summary?.attended || 0}</p>
                )}
                <p className="text-xs text-slate-400">Attended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.avgAttendance || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Attendance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.totalHours}h</p>
                )}
                <p className="text-xs text-slate-400">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Meetings */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : upcomingQuery.data?.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No upcoming meetings</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingQuery.data?.map((meeting: any) => (
                <div key={meeting.id} className="p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    {meeting.type === "virtual" ? <Video className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-green-400" />}
                    <p className="text-white font-medium">{meeting.title}</p>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{meeting.date} at {meeting.time}</p>
                  <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => registerMutation.mutate({ meetingId: meeting.id })}>
                    Register
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search meetings..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      {/* All Meetings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">All Safety Meetings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {meetingsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : filteredMeetings?.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Shield className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No meetings found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredMeetings?.map((meeting: any) => (
                <div key={meeting.id} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{meeting.title}</p>
                        {getStatusBadge(meeting.status)}
                        {meeting.type === "virtual" && <Badge className="bg-blue-500/20 text-blue-400 border-0"><Video className="w-3 h-3 mr-1" />Virtual</Badge>}
                      </div>
                      <p className="text-sm text-slate-400">{meeting.description}</p>
                    </div>
                    {meeting.registered && <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Registered</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{meeting.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meeting.time} ({meeting.duration})</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.attendees} attendees</span>
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
