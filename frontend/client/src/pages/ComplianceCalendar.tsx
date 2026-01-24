/**
 * COMPLIANCE CALENDAR PAGE
 * Expiration tracking and compliance deadline management
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, AlertTriangle, CheckCircle, Clock, FileText,
  User, Truck, Shield, ChevronLeft, ChevronRight, Bell,
  Filter, Download, RefreshCw, Eye, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ExpirationCategory = "driver" | "vehicle" | "company" | "insurance" | "permit";
type UrgencyLevel = "expired" | "critical" | "warning" | "upcoming" | "ok";

interface ExpirationItem {
  id: string;
  category: ExpirationCategory;
  type: string;
  entity: string;
  entityId: string;
  expiresAt: string;
  daysUntilExpiry: number;
  status: UrgencyLevel;
  lastNotified?: string;
  assignedTo?: string;
  notes?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  expirations: ExpirationItem[];
}

export default function ComplianceCalendar() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const expirations: ExpirationItem[] = [
    { id: "exp_001", category: "driver", type: "CDL", entity: "Mike Johnson", entityId: "d1", expiresAt: "2025-01-25", daysUntilExpiry: 2, status: "critical" },
    { id: "exp_002", category: "driver", type: "Medical Card", entity: "Sarah Williams", entityId: "d2", expiresAt: "2025-01-28", daysUntilExpiry: 5, status: "critical" },
    { id: "exp_003", category: "driver", type: "Hazmat Endorsement", entity: "David Brown", entityId: "d3", expiresAt: "2025-02-15", daysUntilExpiry: 23, status: "warning" },
    { id: "exp_004", category: "vehicle", type: "Annual Inspection", entity: "TRK-4521", entityId: "v1", expiresAt: "2025-01-30", daysUntilExpiry: 7, status: "critical" },
    { id: "exp_005", category: "vehicle", type: "Registration", entity: "TRK-4522", entityId: "v2", expiresAt: "2025-02-28", daysUntilExpiry: 36, status: "upcoming" },
    { id: "exp_006", category: "vehicle", type: "Tank Test", entity: "TRL-8847", entityId: "v3", expiresAt: "2025-02-10", daysUntilExpiry: 18, status: "warning" },
    { id: "exp_007", category: "insurance", type: "Liability Insurance", entity: "Company", entityId: "c1", expiresAt: "2025-06-30", daysUntilExpiry: 158, status: "ok" },
    { id: "exp_008", category: "insurance", type: "Cargo Insurance", entity: "Company", entityId: "c1", expiresAt: "2025-06-30", daysUntilExpiry: 158, status: "ok" },
    { id: "exp_009", category: "permit", type: "IFTA License", entity: "Company", entityId: "c1", expiresAt: "2025-12-31", daysUntilExpiry: 342, status: "ok" },
    { id: "exp_010", category: "permit", type: "IRP Registration", entity: "Company", entityId: "c1", expiresAt: "2025-12-31", daysUntilExpiry: 342, status: "ok" },
    { id: "exp_011", category: "driver", type: "TWIC Card", entity: "Emily Martinez", entityId: "d4", expiresAt: "2025-03-15", daysUntilExpiry: 51, status: "upcoming" },
    { id: "exp_012", category: "driver", type: "CDL", entity: "Chris Taylor", entityId: "d5", expiresAt: "2024-12-31", daysUntilExpiry: -24, status: "expired" },
  ];

  const stats = {
    expired: expirations.filter(e => e.status === "expired").length,
    critical: expirations.filter(e => e.status === "critical").length,
    warning: expirations.filter(e => e.status === "warning").length,
    upcoming: expirations.filter(e => e.status === "upcoming").length,
    ok: expirations.filter(e => e.status === "ok").length,
  };

  const getUrgencyColor = (status: UrgencyLevel) => {
    switch (status) {
      case "expired": return "bg-red-600/20 text-red-400 border-red-500/50";
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "upcoming": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "ok": return "bg-green-500/20 text-green-400 border-green-500/50";
    }
  };

  const getCategoryIcon = (category: ExpirationCategory) => {
    switch (category) {
      case "driver": return User;
      case "vehicle": return Truck;
      case "company": return Shield;
      case "insurance": return Shield;
      case "permit": return FileText;
    }
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().split("T")[0];
      const dayExpirations = expirations.filter(e => e.expiresAt === dateStr);

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        expirations: dayExpirations,
      });
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const sendReminder = (item: ExpirationItem) => {
    toast.success("Reminder sent", {
      description: `Notification sent for ${item.entity} - ${item.type}`,
    });
  };

  const filteredExpirations = expirations.filter(e => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (urgencyFilter !== "all" && e.status !== urgencyFilter) return false;
    return true;
  }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  const calendarDays = getCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Calendar</h1>
          <p className="text-slate-400 text-sm">Track expirations and compliance deadlines</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" className="border-slate-600">
            <Bell className="w-4 h-4 mr-2" />
            Send All Reminders
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-red-600/10 border-red-600/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
            <p className="text-xs text-slate-400">Expired</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
            <p className="text-xs text-slate-400">Critical (7 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{stats.warning}</p>
            <p className="text-xs text-slate-400">Warning (30 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.upcoming}</p>
            <p className="text-xs text-slate-400">Upcoming (90 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{stats.ok}</p>
            <p className="text-xs text-slate-400">OK</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-purple-600">Calendar View</TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-purple-600">List View</TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:bg-purple-600">
            Expired ({stats.expired})
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-bold text-white">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="border-slate-600" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-24 p-2 rounded-lg border transition-colors",
                      day.isCurrentMonth ? "bg-slate-700/30 border-slate-700" : "bg-slate-800/30 border-slate-800",
                      day.isToday && "border-purple-500 bg-purple-500/10",
                      day.expirations.length > 0 && "cursor-pointer hover:border-slate-600"
                    )}
                  >
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      day.isCurrentMonth ? "text-white" : "text-slate-600",
                      day.isToday && "text-purple-400"
                    )}>
                      {day.date.getDate()}
                    </p>
                    <div className="space-y-1">
                      {day.expirations.slice(0, 2).map(exp => (
                        <div
                          key={exp.id}
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate",
                            exp.status === "expired" || exp.status === "critical" ? "bg-red-500/20 text-red-400" :
                            exp.status === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}
                        >
                          {exp.entity}
                        </div>
                      ))}
                      {day.expirations.length > 2 && (
                        <p className="text-xs text-slate-500">+{day.expirations.length - 2} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="permit">Permits</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700">
                {filteredExpirations.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          item.status === "expired" || item.status === "critical" ? "bg-red-500/20" :
                          item.status === "warning" ? "bg-yellow-500/20" :
                          item.status === "upcoming" ? "bg-blue-500/20" :
                          "bg-green-500/20"
                        )}>
                          <CategoryIcon className={cn(
                            "w-5 h-5",
                            item.status === "expired" || item.status === "critical" ? "text-red-400" :
                            item.status === "warning" ? "text-yellow-400" :
                            item.status === "upcoming" ? "text-blue-400" :
                            "text-green-400"
                          )} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.entity}</p>
                          <p className="text-sm text-slate-400">{item.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{item.expiresAt}</p>
                          <Badge className={getUrgencyColor(item.status)}>
                            {item.status === "expired" ? "EXPIRED" :
                             item.daysUntilExpiry === 0 ? "TODAY" :
                             item.daysUntilExpiry === 1 ? "Tomorrow" :
                             `${item.daysUntilExpiry} days`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => sendReminder(item)}>
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Tab */}
        <TabsContent value="expired" className="mt-6">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Expired Items - Immediate Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expirations.filter(e => e.status === "expired").length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No expired items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expirations.filter(e => e.status === "expired").map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <CategoryIcon className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.entity}</p>
                            <p className="text-sm text-slate-400">{item.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-red-400 font-medium">Expired {Math.abs(item.daysUntilExpiry)} days ago</p>
                            <p className="text-sm text-slate-500">{item.expiresAt}</p>
                          </div>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
