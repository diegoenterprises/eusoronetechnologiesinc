/**
 * IN-HOUSE FLEET PAGE
 * Frontend for inhouse router — EUSOTRACK GPS tracking, EUSOSMS messaging, EUSOBANK payments.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Navigation, MessageSquare, CreditCard, Truck, MapPin,
  Send, Phone, DollarSign, Activity, Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function InHouseFleet() {
  const [tab, setTab] = useState<"tracking" | "sms" | "payments">("tracking");

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">In-House Services</h1>
        <p className="text-slate-400 text-sm mt-1">EUSOTRACK GPS, EUSOSMS Messaging, EUSOBANK Payments</p>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("rounded-xl cursor-pointer transition-all", tab === "tracking" ? "border-[#1473FF]/50 bg-[#1473FF]/5" : "bg-white/[0.02] border-white/[0.06]")} onClick={() => setTab("tracking")}>
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-blue-500/20 w-fit mx-auto mb-3"><Navigation className="w-8 h-8 text-blue-400" /></div>
            <h3 className="text-white font-bold text-lg">EUSOTRACK</h3>
            <p className="text-xs text-slate-400 mt-1">GPS Tracking & Telematics</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Wifi className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400">Live</span>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl cursor-pointer transition-all", tab === "sms" ? "border-[#BE01FF]/50 bg-[#BE01FF]/5" : "bg-white/[0.02] border-white/[0.06]")} onClick={() => setTab("sms")}>
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-purple-500/20 w-fit mx-auto mb-3"><MessageSquare className="w-8 h-8 text-purple-400" /></div>
            <h3 className="text-white font-bold text-lg">EUSOSMS</h3>
            <p className="text-xs text-slate-400 mt-1">SMS & Push Notifications</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Activity className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-purple-400">Ready</span>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("rounded-xl cursor-pointer transition-all", tab === "payments" ? "border-green-500/50 bg-green-500/5" : "bg-white/[0.02] border-white/[0.06]")} onClick={() => setTab("payments")}>
          <CardContent className="p-5 text-center">
            <div className="p-3 rounded-full bg-green-500/20 w-fit mx-auto mb-3"><CreditCard className="w-8 h-8 text-green-400" /></div>
            <h3 className="text-white font-bold text-lg">EUSOBANK</h3>
            <p className="text-xs text-slate-400 mt-1">Payment Processing</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400">Connected</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EUSOTRACK Panel */}
      {tab === "tracking" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-400" />EUSOTRACK — GPS Tracking & Telematics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Record Location", desc: "Submit GPS coordinates for a vehicle", icon: <MapPin className="w-4 h-4 text-blue-400" /> },
                { label: "Location History", desc: "View vehicle location trail", icon: <Navigation className="w-4 h-4 text-cyan-400" /> },
                { label: "Geofence Alerts", desc: "Monitor boundary triggers", icon: <Activity className="w-4 h-4 text-yellow-400" /> },
                { label: "Fleet Overview", desc: "All vehicle positions", icon: <Truck className="w-4 h-4 text-green-400" /> },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-white text-sm font-medium">{item.label}</span></div>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Real-time GPS tracking powered by EUSOTRACK telematics service. Supports vehicle location recording, history playback, geofence monitoring, and fleet-wide position overview.</p>
          </CardContent>
        </Card>
      )}

      {/* EUSOSMS Panel */}
      {tab === "sms" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />EUSOSMS — Messaging Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Send SMS", desc: "Direct text message to drivers", icon: <Send className="w-4 h-4 text-purple-400" /> },
                { label: "Bulk Broadcast", desc: "Message all drivers at once", icon: <Phone className="w-4 h-4 text-pink-400" /> },
                { label: "Message History", desc: "View sent/received messages", icon: <MessageSquare className="w-4 h-4 text-blue-400" /> },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-white text-sm font-medium">{item.label}</span></div>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">EUSOSMS provides SMS and push notification capabilities for driver communication, load updates, safety alerts, and compliance reminders.</p>
          </CardContent>
        </Card>
      )}

      {/* EUSOBANK Panel */}
      {tab === "payments" && (
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-400" />EUSOBANK — Payment Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Process Payment", desc: "Initiate carrier/driver payout", icon: <DollarSign className="w-4 h-4 text-green-400" /> },
                { label: "Payment Status", desc: "Track payment processing", icon: <Activity className="w-4 h-4 text-blue-400" /> },
                { label: "Account Balance", desc: "View wallet balance", icon: <CreditCard className="w-4 h-4 text-purple-400" /> },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-900/30 border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-white text-sm font-medium">{item.label}</span></div>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">EUSOBANK handles payment processing, driver payouts, fuel card transactions, and financial reconciliation for the platform.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
