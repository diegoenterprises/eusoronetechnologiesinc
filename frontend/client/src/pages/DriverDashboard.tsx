/**
 * DRIVER DASHBOARD PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Truck, Clock, DollarSign, MapPin, Navigation,
  CheckCircle, AlertTriangle, ClipboardCheck, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverDashboard() {
  const statsQuery = (trpc as any).drivers.getDashboardStats.useQuery();
  const hosQuery = (trpc as any).drivers.getHOSStatus.useQuery({}, { refetchInterval: 60000 });
  const assignmentQuery = (trpc as any).drivers.getCurrentAssignment.useQuery();

  const stats = statsQuery.data;
  const hos = hosQuery.data;
  const assignment = assignmentQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Driver Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your daily overview</p>
        </div>
      </div>

      {hosQuery.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : hos && (
        <Card className={cn("rounded-xl", hos.status === "driving" ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30" : hos.status === "on_duty" ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30" : "bg-gradient-to-r from-slate-500/10 to-slate-600/10 border-slate-500/30")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-full", hos.status === "driving" ? "bg-green-500/20" : hos.status === "on_duty" ? "bg-blue-500/20" : "bg-slate-500/20")}>
                  <Clock className={cn("w-8 h-8", hos.status === "driving" ? "text-green-400" : hos.status === "on_duty" ? "text-blue-400" : "text-slate-400")} />
                </div>
                <div>
                  <p className="text-white font-bold text-xl capitalize">{hos.status?.replace("_", " ")}</p>
                  <p className="text-sm text-slate-400">Current Status</p>
                </div>
              </div>
              {hos.violation && <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />HOS Violation</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">Driving</p>
                <div className="flex items-center justify-between mb-1"><span className="text-white font-bold">{hos.drivingUsed}h</span><span className="text-xs text-slate-500">/ 11h</span></div>
                <Progress value={(hos.drivingUsed / 11) * 100} className="h-2" />
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">On-Duty</p>
                <div className="flex items-center justify-between mb-1"><span className="text-white font-bold">{hos.onDutyUsed}h</span><span className="text-xs text-slate-500">/ 14h</span></div>
                <Progress value={(hos.onDutyUsed / 14) * 100} className="h-2" />
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">70hr Cycle</p>
                <div className="flex items-center justify-between mb-1"><span className="text-white font-bold">{hos.cycleUsed}h</span><span className="text-xs text-slate-500">/ 70h</span></div>
                <Progress value={(hos.cycleUsed / 70) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {assignmentQuery.isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : assignment ? (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Truck className="w-5 h-5 text-cyan-400" />Current Assignment</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold text-xl">Load #{assignment.loadNumber}</p>
                <p className="text-sm text-slate-400">{assignment.product} - {assignment.weight}</p>
              </div>
              <Badge className={cn("border-0", assignment.status === "in_transit" ? "bg-cyan-500/20 text-cyan-400" : "bg-yellow-500/20 text-yellow-400")}>{assignment.status?.replace("_", " ")}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-green-400 mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Origin</span></div>
                <p className="text-white font-medium">{typeof assignment.origin === "object" ? `${assignment.origin.name}, ${assignment.origin.city}, ${assignment.origin.state}` : assignment.origin}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 text-red-400 mb-1"><MapPin className="w-4 h-4" /><span className="text-xs">Destination</span></div>
                <p className="text-white font-medium">{typeof assignment.destination === "object" ? `${assignment.destination.name}, ${assignment.destination.city}, ${assignment.destination.state}` : assignment.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button className="flex-1 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                <Navigation className="w-4 h-4 mr-2" />Navigate
              </Button>
              <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg">
                <Phone className="w-4 h-4 mr-2" />Dispatch
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-2">No Active Assignment</p>
            <p className="text-slate-400 text-sm">Check for available loads or contact dispatch</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${stats?.weeklyEarnings?.toLocaleString()}</p>}<p className="text-xs text-slate-400">This Week</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><MapPin className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-purple-400">{stats?.weeklyMiles?.toLocaleString()}</p>}<p className="text-xs text-slate-400">Miles</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><Truck className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.loadsCompleted || 0}</p>}<p className="text-xs text-slate-400">Loads</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><CheckCircle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.safetyScore}</p>}<p className="text-xs text-slate-400">Safety</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg h-16">
          <ClipboardCheck className="w-5 h-5 mr-2" />Pre-Trip Inspection
        </Button>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg h-16">
          <Truck className="w-5 h-5 mr-2" />DVIR
        </Button>
      </div>
    </div>
  );
}
