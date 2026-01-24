/**
 * NOTIFICATION CENTER PAGE
 * Centralized notification and alert management
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Settings,
  AlertTriangle, Info, CheckCircle, XCircle, Clock,
  Truck, FileText, DollarSign, Shield, User, Calendar,
  MessageSquare, Filter, MoreVertical, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NotificationType = "alert" | "info" | "success" | "warning" | "error";
type NotificationCategory = "load" | "compliance" | "payment" | "safety" | "system" | "message";

interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationPreference {
  category: NotificationCategory;
  label: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const notifications: Notification[] = [
    { id: "n1", type: "alert", category: "compliance", title: "CDL Expiring Soon", message: "Mike Johnson's CDL expires in 5 days. Please ensure renewal is in progress.", timestamp: "2025-01-24T08:30:00Z", read: false, actionUrl: "/compliance/calendar", actionLabel: "View Details" },
    { id: "n2", type: "success", category: "load", title: "Load Delivered", message: "LOAD-45842 has been successfully delivered to Dallas, TX.", timestamp: "2025-01-24T07:45:00Z", read: false, actionUrl: "/load/LOAD-45842", actionLabel: "View Load" },
    { id: "n3", type: "warning", category: "safety", title: "Speeding Event Detected", message: "Driver David Brown exceeded speed limit by 12 mph on I-45.", timestamp: "2025-01-24T06:20:00Z", read: false, actionUrl: "/driver/performance", actionLabel: "Review" },
    { id: "n4", type: "info", category: "payment", title: "Invoice Paid", message: "Invoice INV-2025-0142 has been paid. Amount: $2,850.00", timestamp: "2025-01-23T16:00:00Z", read: true, actionUrl: "/invoice/INV-2025-0142", actionLabel: "View Invoice" },
    { id: "n5", type: "alert", category: "compliance", title: "Annual Inspection Due", message: "TRK-4523 annual inspection is due in 3 days.", timestamp: "2025-01-23T14:30:00Z", read: true, actionUrl: "/fleet", actionLabel: "Schedule" },
    { id: "n6", type: "info", category: "load", title: "New Bid Received", message: "ABC Transport submitted a bid of $2,650 for LOAD-45865.", timestamp: "2025-01-23T12:00:00Z", read: true, actionUrl: "/bid/BID-2025-0892", actionLabel: "Review Bid" },
    { id: "n7", type: "success", category: "system", title: "Driver Onboarding Complete", message: "Emily Martinez has completed all onboarding requirements.", timestamp: "2025-01-23T10:15:00Z", read: true },
    { id: "n8", type: "warning", category: "compliance", title: "HOS Violation Warning", message: "Driver approaching 11-hour driving limit. 30 minutes remaining.", timestamp: "2025-01-23T09:00:00Z", read: true },
    { id: "n9", type: "info", category: "message", title: "New Message", message: "You have a new message from Dispatch regarding LOAD-45850.", timestamp: "2025-01-22T16:45:00Z", read: true, actionUrl: "/messaging", actionLabel: "View Message" },
    { id: "n10", type: "error", category: "safety", title: "Accident Reported", message: "An incident has been reported involving TRK-4524. No injuries.", timestamp: "2025-01-22T14:20:00Z", read: true, actionUrl: "/accident-report", actionLabel: "View Report" },
  ];

  const preferences: NotificationPreference[] = [
    { category: "load", label: "Load Updates", email: true, push: true, sms: false },
    { category: "compliance", label: "Compliance Alerts", email: true, push: true, sms: true },
    { category: "payment", label: "Payment Notifications", email: true, push: true, sms: false },
    { category: "safety", label: "Safety Alerts", email: true, push: true, sms: true },
    { category: "system", label: "System Updates", email: true, push: false, sms: false },
    { category: "message", label: "Messages", email: false, push: true, sms: false },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "alert": return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case "info": return <Info className="w-5 h-5 text-blue-400" />;
      case "success": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "error": return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case "alert": return "bg-orange-500/10 border-orange-500/30";
      case "info": return "bg-blue-500/10 border-blue-500/30";
      case "success": return "bg-green-500/10 border-green-500/30";
      case "warning": return "bg-yellow-500/10 border-yellow-500/30";
      case "error": return "bg-red-500/10 border-red-500/30";
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "load": return Truck;
      case "compliance": return FileText;
      case "payment": return DollarSign;
      case "safety": return Shield;
      case "system": return Settings;
      case "message": return MessageSquare;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = (id: string) => {
    toast.success("Marked as read");
  };

  const markAllAsRead = () => {
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    toast.success("Notification deleted");
  };

  const clearAll = () => {
    toast.success("All notifications cleared");
  };

  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (activeTab !== "all" && n.category !== activeTab) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600" onClick={clearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === "all" && "border-blue-500")}>
          <CardContent className="p-4 text-center" onClick={() => setActiveTab("all")}>
            <Bell className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold text-white">{notifications.length}</p>
            <p className="text-xs text-slate-400">All</p>
          </CardContent>
        </Card>
        <Card className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === "load" && "border-blue-500")}>
          <CardContent className="p-4 text-center" onClick={() => setActiveTab("load")}>
            <Truck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{notifications.filter(n => n.category === "load").length}</p>
            <p className="text-xs text-slate-400">Loads</p>
          </CardContent>
        </Card>
        <Card className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === "compliance" && "border-blue-500")}>
          <CardContent className="p-4 text-center" onClick={() => setActiveTab("compliance")}>
            <FileText className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <p className="text-2xl font-bold text-orange-400">{notifications.filter(n => n.category === "compliance").length}</p>
            <p className="text-xs text-slate-400">Compliance</p>
          </CardContent>
        </Card>
        <Card className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === "payment" && "border-blue-500")}>
          <CardContent className="p-4 text-center" onClick={() => setActiveTab("payment")}>
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-purple-400">{notifications.filter(n => n.category === "payment").length}</p>
            <p className="text-xs text-slate-400">Payments</p>
          </CardContent>
        </Card>
        <Card className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === "safety" && "border-blue-500")}>
          <CardContent className="p-4 text-center" onClick={() => setActiveTab("safety")}>
            <Shield className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{notifications.filter(n => n.category === "safety").length}</p>
            <p className="text-xs text-slate-400">Safety</p>
          </CardContent>
        </Card>
        <Card className={cn("bg-slate-800/50 border-slate-700 cursor-pointer", activeTab === "message" && "border-blue-500")}>
          <CardContent className="p-4 text-center" onClick={() => setActiveTab("message")}>
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold text-blue-400">{notifications.filter(n => n.category === "message").length}</p>
            <p className="text-xs text-slate-400">Messages</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">All</TabsTrigger>
            <TabsTrigger value="load" className="data-[state=active]:bg-blue-600">Loads</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-blue-600">Compliance</TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-blue-600">Safety</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">Settings</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Switch
              id="unread-only"
              checked={showUnreadOnly}
              onCheckedChange={setShowUnreadOnly}
            />
            <Label htmlFor="unread-only" className="text-slate-400 text-sm">Unread only</Label>
          </div>
        </div>

        {/* Notifications List */}
        <TabsContent value="all" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            getCategoryIcon={getCategoryIcon}
            formatTime={formatTime}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="load" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            getCategoryIcon={getCategoryIcon}
            formatTime={formatTime}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            getCategoryIcon={getCategoryIcon}
            formatTime={formatTime}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="safety" className="mt-6">
          <NotificationList
            notifications={filteredNotifications}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            getCategoryIcon={getCategoryIcon}
            formatTime={formatTime}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700">
                  <div className="text-slate-400 text-sm">Category</div>
                  <div className="text-slate-400 text-sm text-center">Email</div>
                  <div className="text-slate-400 text-sm text-center">Push</div>
                  <div className="text-slate-400 text-sm text-center">SMS</div>
                </div>
                {preferences.map((pref) => {
                  const CategoryIcon = getCategoryIcon(pref.category);
                  return (
                    <div key={pref.category} className="grid grid-cols-4 gap-4 items-center py-2">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-white">{pref.label}</span>
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked={pref.email} />
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked={pref.push} />
                      </div>
                      <div className="flex justify-center">
                        <Switch defaultChecked={pref.sms} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  getTypeIcon: (type: NotificationType) => React.ReactNode;
  getTypeColor: (type: NotificationType) => string;
  getCategoryIcon: (category: NotificationCategory) => React.ElementType;
  formatTime: (timestamp: string) => string;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
}

function NotificationList({
  notifications,
  getTypeIcon,
  getTypeColor,
  getCategoryIcon,
  formatTime,
  markAsRead,
  deleteNotification,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12 text-center">
          <BellOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No notifications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700">
          {notifications.map((notification) => {
            const CategoryIcon = getCategoryIcon(notification.category);
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-slate-700/30 transition-colors",
                  !notification.read && "bg-slate-700/20"
                )}
              >
                <div className={cn("p-2 rounded-lg", getTypeColor(notification.type))}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium",
                      notification.read ? "text-slate-300" : "text-white"
                    )}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(notification.timestamp)}
                    </span>
                    <Badge variant="outline" className="text-xs border-slate-600">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {notification.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {notification.actionUrl && (
                    <Button variant="outline" size="sm" className="border-slate-600">
                      {notification.actionLabel || "View"}
                    </Button>
                  )}
                  {!notification.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                    <Trash2 className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
