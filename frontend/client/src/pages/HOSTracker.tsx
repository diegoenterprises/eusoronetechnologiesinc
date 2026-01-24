/**
 * HOS TRACKER
 * Hours of Service tracking for drivers with ELD compliance per 49 CFR 395
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Clock, Play, Pause, Square, Coffee, Truck, AlertTriangle,
  Calendar, ChevronLeft, ChevronRight, FileText, Download,
  CheckCircle, Timer, Moon, Sun, Activity, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DutyStatus = "off_duty" | "sleeper" | "driving" | "on_duty";

interface HOSLimits {
  driving: { used: number; limit: number };
  onDuty: { used: number; limit: number };
  cycle: { used: number; limit: number };
  breakRequired: boolean;
  breakTimeRemaining: number;
}

interface LogEntry {
  id: string;
  status: DutyStatus;
  startTime: string;
  endTime?: string;
  duration: number;
  location: string;
  notes?: string;
}

interface DailyLog {
  date: string;
  entries: LogEntry[];
  totalDriving: number;
  totalOnDuty: number;
  totalOffDuty: number;
  totalSleeper: number;
  violations: string[];
  certified: boolean;
}

const STATUS_CONFIG: Record<DutyStatus, { color: string; bgColor: string; label: string; icon: React.ElementType }> = {
  off_duty: { color: "text-slate-400", bgColor: "bg-slate-500", label: "Off Duty", icon: Moon },
  sleeper: { color: "text-purple-400", bgColor: "bg-purple-500", label: "Sleeper Berth", icon: Moon },
  driving: { color: "text-green-400", bgColor: "bg-green-500", label: "Driving", icon: Truck },
  on_duty: { color: "text-yellow-400", bgColor: "bg-yellow-500", label: "On Duty (Not Driving)", icon: Activity },
};

const generateMockLogs = (): DailyLog[] => {
  const today = new Date();
  const logs: DailyLog[] = [];
  
  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    logs.push({
      date: date.toISOString().split('T')[0],
      entries: i === 0 ? [
        { id: "e1", status: "off_duty", startTime: "00:00", endTime: "06:00", duration: 360, location: "Houston, TX" },
        { id: "e2", status: "on_duty", startTime: "06:00", endTime: "06:30", duration: 30, location: "Houston, TX", notes: "Pre-trip inspection" },
        { id: "e3", status: "driving", startTime: "06:30", endTime: "10:30", duration: 240, location: "En route to Dallas" },
        { id: "e4", status: "on_duty", startTime: "10:30", endTime: "11:00", duration: 30, location: "Rest Area I-45", notes: "30-min break" },
        { id: "e5", status: "driving", startTime: "11:00", endTime: "14:00", duration: 180, location: "En route to Dallas" },
      ] : [
        { id: `e${i}1`, status: "off_duty", startTime: "00:00", endTime: "06:00", duration: 360, location: "Houston, TX" },
        { id: `e${i}2`, status: "on_duty", startTime: "06:00", endTime: "06:30", duration: 30, location: "Houston, TX" },
        { id: `e${i}3`, status: "driving", startTime: "06:30", endTime: "14:30", duration: 480, location: "Various" },
        { id: `e${i}4`, status: "on_duty", startTime: "14:30", endTime: "15:00", duration: 30, location: "Dallas, TX" },
        { id: `e${i}5`, status: "off_duty", startTime: "15:00", endTime: "23:59", duration: 539, location: "Dallas, TX" },
      ],
      totalDriving: i === 0 ? 420 : 480,
      totalOnDuty: i === 0 ? 480 : 540,
      totalOffDuty: i === 0 ? 360 : 899,
      totalSleeper: 0,
      violations: i === 3 ? ["Exceeded 11-hour driving limit by 15 minutes"] : [],
      certified: i > 0,
    });
  }
  
  return logs;
};

export default function HOSTracker() {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<DutyStatus>("driving");
  const [statusStartTime, setStatusStartTime] = useState<Date>(new Date(Date.now() - 3 * 60 * 60 * 1000));
  const [logs, setLogs] = useState<DailyLog[]>(generateMockLogs());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [hosLimits] = useState<HOSLimits>({
    driving: { used: 420, limit: 660 },
    onDuty: { used: 480, limit: 840 },
    cycle: { used: 3600, limit: 4200 },
    breakRequired: false,
    breakTimeRemaining: 30,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - statusStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [statusStartTime]);

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatSeconds = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const changeStatus = (newStatus: DutyStatus) => {
    if (newStatus === currentStatus) return;
    
    setCurrentStatus(newStatus);
    setStatusStartTime(new Date());
    toast.success(`Status changed to ${STATUS_CONFIG[newStatus].label}`);
  };

  const getSelectedLog = () => logs.find(l => l.date === selectedDate);
  const selectedLog = getSelectedLog();

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const certifyLog = () => {
    setLogs(prev => prev.map(log => 
      log.date === selectedDate ? { ...log, certified: true } : log
    ));
    toast.success("Daily log certified");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hours of Service</h1>
          <p className="text-slate-400 text-sm">ELD Compliance per 49 CFR 395</p>
        </div>
        <Badge className={cn(
          "text-lg px-4 py-2",
          STATUS_CONFIG[currentStatus].color,
          currentStatus === "driving" ? "bg-green-500/20" :
          currentStatus === "on_duty" ? "bg-yellow-500/20" :
          "bg-slate-500/20"
        )}>
          {React.createElement(STATUS_CONFIG[currentStatus].icon, { className: "w-5 h-5 mr-2" })}
          {STATUS_CONFIG[currentStatus].label}
        </Badge>
      </div>

      {/* Current Status Timer */}
      <Card className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-slate-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Current Status Duration</p>
              <p className="text-5xl font-mono font-bold text-white mt-2">
                {formatSeconds(elapsedTime)}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Started at {statusStartTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => changeStatus("driving")}
                className={cn(
                  "h-16 w-24 flex-col",
                  currentStatus === "driving" ? "bg-green-600" : "bg-slate-700 hover:bg-green-600/50"
                )}
              >
                <Truck className="w-6 h-6 mb-1" />
                <span className="text-xs">Drive</span>
              </Button>
              <Button 
                onClick={() => changeStatus("on_duty")}
                className={cn(
                  "h-16 w-24 flex-col",
                  currentStatus === "on_duty" ? "bg-yellow-600" : "bg-slate-700 hover:bg-yellow-600/50"
                )}
              >
                <Activity className="w-6 h-6 mb-1" />
                <span className="text-xs">On Duty</span>
              </Button>
              <Button 
                onClick={() => changeStatus("sleeper")}
                className={cn(
                  "h-16 w-24 flex-col",
                  currentStatus === "sleeper" ? "bg-purple-600" : "bg-slate-700 hover:bg-purple-600/50"
                )}
              >
                <Moon className="w-6 h-6 mb-1" />
                <span className="text-xs">Sleeper</span>
              </Button>
              <Button 
                onClick={() => changeStatus("off_duty")}
                className={cn(
                  "h-16 w-24 flex-col",
                  currentStatus === "off_duty" ? "bg-slate-600" : "bg-slate-700 hover:bg-slate-600"
                )}
              >
                <Coffee className="w-6 h-6 mb-1" />
                <span className="text-xs">Off Duty</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HOS Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Driving Time */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Driving</span>
              </div>
              <span className="text-slate-400 text-sm">11-Hour Limit</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Used: {formatDuration(hosLimits.driving.used)}</span>
                <span className={cn(
                  "font-medium",
                  hosLimits.driving.used / hosLimits.driving.limit > 0.9 ? "text-red-400" :
                  hosLimits.driving.used / hosLimits.driving.limit > 0.75 ? "text-yellow-400" : "text-green-400"
                )}>
                  {formatDuration(hosLimits.driving.limit - hosLimits.driving.used)} left
                </span>
              </div>
              <Progress 
                value={(hosLimits.driving.used / hosLimits.driving.limit) * 100} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* On-Duty Time */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">On-Duty</span>
              </div>
              <span className="text-slate-400 text-sm">14-Hour Limit</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Used: {formatDuration(hosLimits.onDuty.used)}</span>
                <span className={cn(
                  "font-medium",
                  hosLimits.onDuty.used / hosLimits.onDuty.limit > 0.9 ? "text-red-400" :
                  hosLimits.onDuty.used / hosLimits.onDuty.limit > 0.75 ? "text-yellow-400" : "text-green-400"
                )}>
                  {formatDuration(hosLimits.onDuty.limit - hosLimits.onDuty.used)} left
                </span>
              </div>
              <Progress 
                value={(hosLimits.onDuty.used / hosLimits.onDuty.limit) * 100} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* 70-Hour Cycle */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">70-Hour Cycle</span>
              </div>
              <span className="text-slate-400 text-sm">8-Day Period</span>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Used: {formatDuration(hosLimits.cycle.used)}</span>
                <span className={cn(
                  "font-medium",
                  hosLimits.cycle.used / hosLimits.cycle.limit > 0.9 ? "text-red-400" :
                  hosLimits.cycle.used / hosLimits.cycle.limit > 0.75 ? "text-yellow-400" : "text-green-400"
                )}>
                  {formatDuration(hosLimits.cycle.limit - hosLimits.cycle.used)} left
                </span>
              </div>
              <Progress 
                value={(hosLimits.cycle.used / hosLimits.cycle.limit) * 100} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 30-Minute Break Reminder */}
      {hosLimits.driving.used >= 480 && !hosLimits.breakRequired && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">30-Minute Break Required</p>
                <p className="text-yellow-500/70 text-sm">You must take a 30-minute break before driving further</p>
              </div>
            </div>
            <Button onClick={() => changeStatus("off_duty")} className="bg-yellow-600 hover:bg-yellow-700">
              Start Break
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Daily Log */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Daily Log</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-700/50">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-white">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateDate(1)}
                disabled={selectedDate === new Date().toISOString().split('T')[0]}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {selectedLog ? (
            <>
              {/* Graph Grid */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-1 text-xs">
                      <div className={cn("w-3 h-3 rounded", config.bgColor)} />
                      <span className={config.color}>{config.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Time Grid */}
                <div className="relative h-24 bg-slate-700/30 rounded-lg overflow-hidden">
                  {/* Hour markers */}
                  <div className="absolute inset-x-0 top-0 flex">
                    {Array.from({ length: 25 }, (_, i) => (
                      <div key={i} className="flex-1 border-l border-slate-600 text-[10px] text-slate-500 pl-0.5">
                        {i % 4 === 0 && i.toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                  
                  {/* Status bars */}
                  <div className="absolute inset-0 pt-4 flex">
                    {selectedLog.entries.map((entry, idx) => {
                      const startHour = parseInt(entry.startTime.split(':')[0]) + parseInt(entry.startTime.split(':')[1]) / 60;
                      const width = entry.duration / (24 * 60) * 100;
                      const left = startHour / 24 * 100;
                      
                      return (
                        <div
                          key={entry.id}
                          className={cn("absolute h-12 top-6 rounded", STATUS_CONFIG[entry.status].bgColor)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${entry.status}: ${entry.startTime} - ${entry.endTime || 'current'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Log Entries Table */}
              <div className="space-y-2 mb-6">
                {selectedLog.entries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-8 rounded", STATUS_CONFIG[entry.status].bgColor)} />
                      <div>
                        <p className={cn("font-medium", STATUS_CONFIG[entry.status].color)}>
                          {STATUS_CONFIG[entry.status].label}
                        </p>
                        <p className="text-xs text-slate-500">{entry.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">
                        {entry.startTime} - {entry.endTime || 'current'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDuration(entry.duration)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 rounded-lg bg-slate-700/30 mb-4">
                <div className="text-center">
                  <p className="text-green-400 font-bold">{formatDuration(selectedLog.totalDriving)}</p>
                  <p className="text-xs text-slate-500">Driving</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400 font-bold">{formatDuration(selectedLog.totalOnDuty)}</p>
                  <p className="text-xs text-slate-500">On-Duty</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 font-bold">{formatDuration(selectedLog.totalOffDuty)}</p>
                  <p className="text-xs text-slate-500">Off-Duty</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-400 font-bold">{formatDuration(selectedLog.totalSleeper)}</p>
                  <p className="text-xs text-slate-500">Sleeper</p>
                </div>
              </div>

              {/* Violations */}
              {selectedLog.violations.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                  <p className="text-red-400 font-medium mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Violations
                  </p>
                  {selectedLog.violations.map((v, i) => (
                    <p key={i} className="text-red-300 text-sm">- {v}</p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!selectedLog.certified && selectedDate !== new Date().toISOString().split('T')[0] && (
                  <Button onClick={certifyLog} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Certify Log
                  </Button>
                )}
                {selectedLog.certified && (
                  <Badge className="bg-green-500/20 text-green-400 py-2 px-4">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Log Certified
                  </Badge>
                )}
                <Button variant="outline" className="border-slate-600">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" className="border-slate-600">
                  <FileText className="w-4 h-4 mr-2" />
                  Add Remark
                </Button>
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-center py-8">No log data for selected date</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
