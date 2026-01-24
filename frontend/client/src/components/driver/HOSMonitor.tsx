/**
 * HOS MONITOR COMPONENT
 * Hours of Service tracking per 49 CFR 395
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Clock, AlertTriangle, Coffee, Moon, Truck, 
  Play, Pause, Square, RefreshCw, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HOSData {
  driverId: string;
  driverName: string;
  currentStatus: "driving" | "on_duty" | "off_duty" | "sleeper";
  statusStartTime: string;
  
  // Available hours
  drivingRemaining: number; // minutes
  dutyRemaining: number; // minutes
  cycleRemaining: number; // minutes (60/70 hour)
  
  // Break requirements
  breakRequired: boolean;
  breakDueIn?: number; // minutes
  lastBreakTime?: string;
  
  // Cycle info
  cycleType: "60_7" | "70_8";
  cycleUsed: number; // minutes
  lastRestartDate?: string;
  
  // Violations
  violations: {
    type: string;
    date: string;
    description: string;
  }[];
  
  // Today's log
  todayLog: {
    status: "driving" | "on_duty" | "off_duty" | "sleeper";
    startTime: string;
    duration: number; // minutes
  }[];
}

interface HOSMonitorProps {
  data: HOSData;
  onStatusChange?: (newStatus: HOSData["currentStatus"]) => void;
  onRefresh?: () => void;
  isDriver?: boolean;
}

const STATUS_CONFIG = {
  driving: { 
    label: "Driving", 
    color: "bg-green-500", 
    textColor: "text-green-400",
    icon: <Truck className="w-4 h-4" />
  },
  on_duty: { 
    label: "On Duty (Not Driving)", 
    color: "bg-blue-500", 
    textColor: "text-blue-400",
    icon: <Play className="w-4 h-4" />
  },
  off_duty: { 
    label: "Off Duty", 
    color: "bg-slate-500", 
    textColor: "text-slate-400",
    icon: <Pause className="w-4 h-4" />
  },
  sleeper: { 
    label: "Sleeper Berth", 
    color: "bg-purple-500", 
    textColor: "text-purple-400",
    icon: <Moon className="w-4 h-4" />
  },
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function getProgressColor(remaining: number, total: number): string {
  const percentage = (remaining / total) * 100;
  if (percentage > 50) return "bg-green-500";
  if (percentage > 25) return "bg-yellow-500";
  if (percentage > 10) return "bg-orange-500";
  return "bg-red-500";
}

export function HOSMonitor({ data, onStatusChange, onRefresh, isDriver = false }: HOSMonitorProps) {
  const statusConfig = STATUS_CONFIG[data.currentStatus];
  
  const drivingTotal = 11 * 60; // 11 hours in minutes
  const dutyTotal = 14 * 60; // 14 hours in minutes
  const cycleTotal = data.cycleType === "70_8" ? 70 * 60 : 60 * 60;
  
  const drivingPercentage = (data.drivingRemaining / drivingTotal) * 100;
  const dutyPercentage = (data.dutyRemaining / dutyTotal) * 100;
  const cyclePercentage = (data.cycleRemaining / cycleTotal) * 100;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Hours of Service
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRefresh} className="text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-400">{data.driverName}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-4 rounded-lg bg-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", statusConfig.color + "/20")}>
                <div className={cn("w-3 h-3 rounded-full animate-pulse", statusConfig.color)} />
              </div>
              <div>
                <p className={cn("font-semibold", statusConfig.textColor)}>{statusConfig.label}</p>
                <p className="text-xs text-slate-500">Since {data.statusStartTime}</p>
              </div>
            </div>
            {isDriver && (
              <div className="flex gap-1">
                {(["driving", "on_duty", "off_duty", "sleeper"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={data.currentStatus === status ? "default" : "outline"}
                    onClick={() => onStatusChange?.(status)}
                    className={cn(
                      "w-8 h-8 p-0",
                      data.currentStatus === status && STATUS_CONFIG[status].color
                    )}
                    title={STATUS_CONFIG[status].label}
                  >
                    {STATUS_CONFIG[status].icon}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Break Warning */}
        {data.breakRequired && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
            <Coffee className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">30-Minute Break Required</p>
              <p className="text-xs text-slate-400">
                {data.breakDueIn ? `Due in ${formatMinutes(data.breakDueIn)}` : "Take a 30-minute break before continuing"}
              </p>
            </div>
          </div>
        )}

        {/* Hours Remaining */}
        <div className="space-y-4">
          {/* Driving Time */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">Driving Time</span>
              </div>
              <span className={cn(
                "text-sm font-medium",
                drivingPercentage > 25 ? "text-green-400" : drivingPercentage > 10 ? "text-yellow-400" : "text-red-400"
              )}>
                {formatMinutes(data.drivingRemaining)} remaining
              </span>
            </div>
            <div className="relative">
              <Progress value={drivingPercentage} className="h-3 bg-slate-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">
                  {formatMinutes(drivingTotal - data.drivingRemaining)} / {formatMinutes(drivingTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* On-Duty Time */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">On-Duty Time</span>
              </div>
              <span className={cn(
                "text-sm font-medium",
                dutyPercentage > 25 ? "text-blue-400" : dutyPercentage > 10 ? "text-yellow-400" : "text-red-400"
              )}>
                {formatMinutes(data.dutyRemaining)} remaining
              </span>
            </div>
            <div className="relative">
              <Progress value={dutyPercentage} className="h-3 bg-slate-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">
                  {formatMinutes(dutyTotal - data.dutyRemaining)} / {formatMinutes(dutyTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Cycle Time */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300">
                  {data.cycleType === "70_8" ? "70-Hour/8-Day" : "60-Hour/7-Day"} Cycle
                </span>
              </div>
              <span className={cn(
                "text-sm font-medium",
                cyclePercentage > 25 ? "text-purple-400" : cyclePercentage > 10 ? "text-yellow-400" : "text-red-400"
              )}>
                {formatMinutes(data.cycleRemaining)} remaining
              </span>
            </div>
            <div className="relative">
              <Progress value={cyclePercentage} className="h-3 bg-slate-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">
                  {formatMinutes(data.cycleUsed)} / {formatMinutes(cycleTotal)}
                </span>
              </div>
            </div>
            {data.lastRestartDate && (
              <p className="text-xs text-slate-500 mt-1">
                Last 34-hour restart: {data.lastRestartDate}
              </p>
            )}
          </div>
        </div>

        {/* Today's Log Summary */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Today's Log</p>
          <div className="flex h-6 rounded overflow-hidden">
            {data.todayLog.map((entry, idx) => {
              const widthPercent = (entry.duration / (24 * 60)) * 100;
              return (
                <div
                  key={idx}
                  className={cn(
                    "h-full transition-all",
                    STATUS_CONFIG[entry.status].color
                  )}
                  style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  title={`${STATUS_CONFIG[entry.status].label}: ${entry.startTime} (${formatMinutes(entry.duration)})`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1 text-xs">
                <div className={cn("w-2 h-2 rounded", config.color)} />
                <span className="text-slate-500">{config.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Violations */}
        {data.violations.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              Recent Violations
            </p>
            <div className="space-y-2">
              {data.violations.slice(0, 3).map((violation, idx) => (
                <div key={idx} className="p-2 rounded bg-red-500/10 border border-red-500/30">
                  <div className="flex justify-between">
                    <span className="text-xs text-red-300 font-medium">{violation.type}</span>
                    <span className="text-xs text-slate-500">{violation.date}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{violation.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HOSMonitor;
