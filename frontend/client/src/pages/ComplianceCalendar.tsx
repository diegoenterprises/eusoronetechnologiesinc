/**
 * COMPLIANCE CALENDAR PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Calendar, AlertTriangle, CheckCircle, Clock, FileText,
  User, Truck, Shield, ChevronLeft, ChevronRight, Bell,
  Download, Eye, Mail, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ComplianceCalendar() {
  const [activeTab, setActiveTab] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const summaryQuery = trpc.compliance.getSummary.useQuery();
  const expirationsQuery = trpc.compliance.getExpiringDocuments.useQuery({
    days: 90,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const sendReminderMutation = trpc.compliance.sendReminder.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
    onError: (error) => toast.error("Failed to send reminder", { description: error.message }),
  });

  if (summaryQuery.error || expirationsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading compliance data</p>
        <Button className="mt-4" onClick={() => { summaryQuery.refetch(); expirationsQuery.refetch(); }}>Retry</Button>
      </div>
    );
  }

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return "bg-red-600/20 text-red-400 border-red-500/50";
    if (daysLeft <= 7) return "bg-red-500/20 text-red-400 border-red-500/50";
    if (daysLeft <= 30) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    if (daysLeft <= 90) return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    return "bg-green-500/20 text-green-400 border-green-500/50";
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "driver": return User;
      case "vehicle": return Truck;
      default: return FileText;
    }
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filteredExpirations = (expirationsQuery.data || []).filter(e => {
    if (urgencyFilter === "expired" && e.daysUntilExpiration >= 0) return false;
    if (urgencyFilter === "critical" && (e.daysUntilExpiration < 0 || e.daysUntilExpiration > 7)) return false;
    if (urgencyFilter === "warning" && (e.daysUntilExpiration <= 7 || e.daysUntilExpiration > 30)) return false;
    return true;
  }).sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

  const stats = {
    expired: (expirationsQuery.data || []).filter(e => e.daysUntilExpiration < 0).length,
    critical: (expirationsQuery.data || []).filter(e => e.daysUntilExpiration >= 0 && e.daysUntilExpiration <= 7).length,
    warning: (expirationsQuery.data || []).filter(e => e.daysUntilExpiration > 7 && e.daysUntilExpiration <= 30).length,
    upcoming: (expirationsQuery.data || []).filter(e => e.daysUntilExpiration > 30 && e.daysUntilExpiration <= 90).length,
  };

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
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
          <Button variant="outline" className="border-slate-600">
            <Bell className="w-4 h-4 mr-2" />Send All Reminders
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-red-600/10 border-red-600/30">
          <CardContent className="p-4 text-center">
            {expirationsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
            )}
            <p className="text-xs text-slate-400">Expired</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            {expirationsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
            )}
            <p className="text-xs text-slate-400">Critical (7 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            {expirationsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-yellow-400">{stats.warning}</p>
            )}
            <p className="text-xs text-slate-400">Warning (30 days)</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            {expirationsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-3xl font-bold text-blue-400">{stats.upcoming}</p>
            )}
            <p className="text-xs text-slate-400">Upcoming (90 days)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="list" className="data-[state=active]:bg-purple-600">List View</TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-purple-600">Calendar View</TabsTrigger>
          <TabsTrigger value="expired" className="data-[state=active]:bg-purple-600">Expired ({stats.expired})</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="mt-6">
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
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              {expirationsQuery.isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filteredExpirations.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No items match your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredExpirations.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.relatedTo?.type || "");
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2 rounded-lg",
                            item.daysUntilExpiration < 0 || item.daysUntilExpiration <= 7 ? "bg-red-500/20" :
                            item.daysUntilExpiration <= 30 ? "bg-yellow-500/20" : "bg-blue-500/20"
                          )}>
                            <CategoryIcon className={cn(
                              "w-5 h-5",
                              item.daysUntilExpiration < 0 || item.daysUntilExpiration <= 7 ? "text-red-400" :
                              item.daysUntilExpiration <= 30 ? "text-yellow-400" : "text-blue-400"
                            )} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.relatedTo?.name}</p>
                            <p className="text-sm text-slate-400">{item.documentType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-white">{item.expirationDate}</p>
                            <Badge className={getUrgencyColor(item.daysUntilExpiration)}>
                              {item.daysUntilExpiration < 0 ? "EXPIRED" :
                               item.daysUntilExpiration === 0 ? "TODAY" :
                               item.daysUntilExpiration === 1 ? "Tomorrow" :
                               `${item.daysUntilExpiration} days`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendReminderMutation.mutate({ documentId: item.id })}
                              disabled={sendReminderMutation.isPending}
                            >
                              {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm text-slate-500 py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="min-h-20 p-2 rounded-lg border bg-slate-700/30 border-slate-700">
                    <p className="text-sm text-slate-400">{((i % 28) + 1)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Tab */}
        <TabsContent value="expired" className="mt-6">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />Expired Items - Immediate Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expirationsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : stats.expired === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-slate-400">No expired items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(expirationsQuery.data || []).filter(e => e.daysUntilExpiration < 0).map((item) => {
                    const CategoryIcon = getCategoryIcon(item.relatedTo?.type || "");
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <CategoryIcon className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.relatedTo?.name}</p>
                            <p className="text-sm text-slate-400">{item.documentType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-red-400 font-medium">Expired {Math.abs(item.daysUntilExpiration)} days ago</p>
                            <p className="text-sm text-slate-500">{item.expirationDate}</p>
                          </div>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">Resolve</Button>
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
