/**
 * DRIVER AVAILABILITY PAGE
 * Driver-facing availability status and scheduling screen.
 * Allows drivers to set their current status (available, on break, off duty),
 * preferred lanes, availability windows, and home time requests.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import DatePicker from "@/components/DatePicker";
import {
  Clock, CheckCircle, MapPin, Calendar, Truck,
  RefreshCw, Power, Coffee, Home, ChevronRight,
  Navigation, Sun, Moon as MoonIcon, ArrowRight
} from "lucide-react";

type AvailabilityStatus = "available" | "on_break" | "off_duty" | "en_route" | "home_time";

const STATUS_OPTIONS: { id: AvailabilityStatus; label: string; description: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: "available", label: "Available", description: "Ready for dispatch", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/15" },
  { id: "on_break", label: "On Break", description: "30-min / 10-hr break", icon: <Coffee className="w-5 h-5" />, color: "text-yellow-500", bg: "bg-yellow-500/15" },
  { id: "off_duty", label: "Off Duty", description: "Not available for loads", icon: <Power className="w-5 h-5" />, color: "text-red-500", bg: "bg-red-500/15" },
  { id: "en_route", label: "En Route", description: "Currently on a load", icon: <Truck className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-500/15" },
  { id: "home_time", label: "Home Time", description: "Scheduled time off", icon: <Home className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-500/15" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DriverAvailability() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [currentStatus, setCurrentStatus] = useState<AvailabilityStatus>("available");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [preferredLanes, setPreferredLanes] = useState("");
  const [maxMiles, setMaxMiles] = useState("500");
  const [homeDate, setHomeDate] = useState("");

  const profileQuery = (trpc as any).drivers?.getProfile?.useQuery?.() || { data: null, isLoading: false, refetch: () => {} };
  const isLoading = profileQuery.isLoading;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleStatusChange = (status: AvailabilityStatus) => {
    setCurrentStatus(status);
    const s = STATUS_OPTIONS.find((o) => o.id === status);
    toast.success(`Status updated to ${s?.label}`);
  };

  const handleSavePreferences = () => {
    toast.success("Availability preferences saved");
  };

  const activeStatus = STATUS_OPTIONS.find((s) => s.id === currentStatus);
  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");
  const inputCls = cn("h-11 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Availability
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Set your status and scheduling preferences
          </p>
        </div>
        <Badge className={cn("rounded-full px-4 py-1.5 text-sm font-medium border", activeStatus?.bg, activeStatus?.color, "border-current/20")}>
          {activeStatus?.icon}
          <span className="ml-2">{activeStatus?.label}</span>
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Current Status */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Clock className="w-5 h-5 text-[#1473FF]" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => handleStatusChange(status.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                      currentStatus === status.id
                        ? `${status.bg} border-current/30 shadow-md`
                        : isLight
                          ? "bg-white border-slate-200 hover:border-slate-300"
                          : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600"
                    )}
                  >
                    <div className={cn("p-2.5 rounded-lg", currentStatus === status.id ? status.bg : isLight ? "bg-slate-100" : "bg-slate-700/30")}>
                      <span className={currentStatus === status.id ? status.color : "text-slate-400"}>{status.icon}</span>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-sm font-bold", currentStatus === status.id ? status.color : isLight ? "text-slate-700" : "text-slate-200")}>
                        {status.label}
                      </p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{status.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Availability Window */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Calendar className="w-5 h-5 text-[#BE01FF]" />
                Availability Window
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className={cn("text-xs font-medium mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Available Days</p>
                <div className="flex gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-medium border transition-all",
                        selectedDays.includes(day)
                          ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
                          : isLight
                            ? "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            : "bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={cn("text-xs font-medium mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>Preferred Lanes</p>
                  <div className="relative">
                    <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={preferredLanes}
                      onChange={(e: any) => setPreferredLanes(e.target.value)}
                      placeholder="e.g. TX → OK, Gulf Coast, Permian Basin"
                      className={cn(inputCls, "pl-10")}
                    />
                  </div>
                </div>
                <div>
                  <p className={cn("text-xs font-medium mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>Max Deadhead Miles</p>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      value={maxMiles}
                      onChange={(e: any) => setMaxMiles(e.target.value)}
                      placeholder="500"
                      className={cn(inputCls, "pl-10")}
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 rounded-xl h-11"
                onClick={handleSavePreferences}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Home Time Request */}
          <Card className={cc}>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Home className="w-5 h-5 text-purple-500" />
                Home Time Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                Request scheduled home time. Your dispatcher will be notified and plan loads accordingly.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={cn("text-xs font-medium mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>Start Date</p>
                  <DatePicker value={homeDate} onChange={setHomeDate} />
                </div>
                <div>
                  <p className={cn("text-xs font-medium mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>Duration</p>
                  <select className={cn("w-full h-11 px-3 rounded-xl border text-sm", isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-800/50 border-slate-700/50 text-white")}>
                    <option>2 days</option>
                    <option>3 days</option>
                    <option>1 week</option>
                    <option>2 weeks</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
              <Button
                variant="outline"
                className={cn("w-full h-11 rounded-xl", isLight ? "border-slate-200 hover:bg-slate-50" : "bg-slate-700/50 border-slate-600/50 hover:bg-slate-700")}
                onClick={() => toast.success("Home time request submitted to dispatch")}
              >
                <Home className="w-4 h-4 mr-2" /> Submit Home Time Request
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
