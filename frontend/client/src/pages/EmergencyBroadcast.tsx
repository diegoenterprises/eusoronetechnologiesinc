/**
 * EMERGENCY BROADCAST PAGE
 * Dispatch/admin-facing emergency broadcast sender screen.
 * Allows dispatchers to send urgent broadcasts to all drivers,
 * specific regions, or individual drivers. Tracks broadcast
 * history and acknowledgment status.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Radio, AlertTriangle, CheckCircle, Clock, Send,
  Users, MapPin, Shield, Bell, ChevronRight, Volume2
} from "lucide-react";

type BroadcastSeverity = "critical" | "warning" | "info";
type BroadcastTarget = "all" | "region" | "hazmat" | "individual";

type PastBroadcast = {
  id: string;
  title: string;
  severity: BroadcastSeverity;
  target: string;
  sentAt: string;
  acknowledged: number;
  total: number;
};

const PAST_BROADCASTS: PastBroadcast[] = [
  { id: "b1", title: "Winter Storm Warning — I-40 Corridor", severity: "critical", target: "All Drivers", sentAt: "2026-02-15T18:00:00Z", acknowledged: 42, total: 45 },
  { id: "b2", title: "Fuel Price Update — Gulf Region", severity: "info", target: "Gulf Region", sentAt: "2026-02-14T09:00:00Z", acknowledged: 28, total: 30 },
  { id: "b3", title: "Bridge Weight Restriction — US-59", severity: "warning", target: "Hazmat Drivers", sentAt: "2026-02-13T14:30:00Z", acknowledged: 15, total: 18 },
  { id: "b4", title: "New ELD Compliance Deadline Reminder", severity: "info", target: "All Drivers", sentAt: "2026-02-10T08:00:00Z", acknowledged: 44, total: 45 },
];

const SEVERITY_CONFIG: Record<BroadcastSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/15" },
  warning: { label: "Warning", color: "text-orange-500", bg: "bg-orange-500/15" },
  info: { label: "Info", color: "text-blue-500", bg: "bg-blue-500/15" },
};

export default function EmergencyBroadcast() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [severity, setSeverity] = useState<BroadcastSeverity>("warning");
  const [target, setTarget] = useState<BroadcastTarget>("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSent(true);
    toast.success("Emergency broadcast sent successfully");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");
  const inputCls = cn("h-11 rounded-xl", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-400");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Emergency Broadcast
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Send urgent alerts to drivers and fleet personnel
          </p>
        </div>
      </div>

      {/* Compose */}
      {!sent ? (
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
              <Radio className="w-5 h-5 text-[#1473FF]" />
              Compose Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Severity */}
            <div>
              <p className={cn("text-xs font-medium mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Severity Level</p>
              <div className="flex gap-2">
                {(["critical", "warning", "info"] as BroadcastSeverity[]).map((s) => {
                  const cfg = SEVERITY_CONFIG[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                        severity === s
                          ? `${cfg.bg} ${cfg.color} border-current/30 ring-1 ring-current/20`
                          : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-white/[0.02] border-white/[0.06] text-slate-500"
                      )}
                    >
                      {s === "critical" && <AlertTriangle className="w-4 h-4" />}
                      {s === "warning" && <AlertTriangle className="w-4 h-4" />}
                      {s === "info" && <Bell className="w-4 h-4" />}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target */}
            <div>
              <p className={cn("text-xs font-medium mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Send To</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  { id: "all" as BroadcastTarget, label: "All Drivers", icon: <Users className="w-4 h-4" /> },
                  { id: "region" as BroadcastTarget, label: "By Region", icon: <MapPin className="w-4 h-4" /> },
                  { id: "hazmat" as BroadcastTarget, label: "Hazmat Only", icon: <Shield className="w-4 h-4" /> },
                  { id: "individual" as BroadcastTarget, label: "Individual", icon: <Users className="w-4 h-4" /> },
                ]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTarget(t.id)}
                    className={cn(
                      "py-3 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1.5",
                      target === t.id
                        ? "bg-[#1473FF]/10 text-[#1473FF] border-[#1473FF]/30"
                        : isLight ? "bg-white border-slate-200 text-slate-400" : "bg-white/[0.02] border-white/[0.06] text-slate-500"
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <p className={cn("text-xs font-medium mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>Broadcast Title</p>
              <Input value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="e.g. Winter Storm Warning — I-40 Corridor" className={inputCls} />
            </div>

            {/* Message */}
            <div>
              <p className={cn("text-xs font-medium mb-1.5", isLight ? "text-slate-500" : "text-slate-400")}>Message</p>
              <Textarea
                value={message}
                onChange={(e: any) => setMessage(e.target.value)}
                placeholder="Provide clear, actionable instructions..."
                className={cn("rounded-xl min-h-[120px]", isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-400")}
              />
            </div>

            {/* Send */}
            <Button
              className={cn(
                "w-full h-12 rounded-xl text-base font-medium",
                severity === "critical"
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                  : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 shadow-lg shadow-purple-500/20"
              )}
              onClick={handleSend}
            >
              <Send className="w-5 h-5 mr-2" />
              Send {SEVERITY_CONFIG[severity].label} Broadcast
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(cc, "overflow-hidden")}>
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="py-12 text-center">
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", isLight ? "bg-green-50" : "bg-green-500/10")}>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>Broadcast Sent</p>
            <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
              &quot;{title}&quot; sent to {target === "all" ? "all drivers" : target}
            </p>
            <Button variant="outline" className={cn("mt-4 rounded-xl", isLight ? "border-slate-200" : "bg-white/[0.04] border-white/[0.06]")} onClick={() => { setSent(false); setTitle(""); setMessage(""); }}>
              Send Another
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Broadcast History */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Clock className="w-5 h-5 text-[#BE01FF]" />
            Recent Broadcasts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {PAST_BROADCASTS.map((b) => {
            const sev = SEVERITY_CONFIG[b.severity];
            const ackPct = Math.round((b.acknowledged / b.total) * 100);
            return (
              <div key={b.id} className={cn(
                "flex items-center justify-between p-4 rounded-xl border",
                isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", sev.bg)}>
                    <Volume2 className={cn("w-4 h-4", sev.color)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{b.title}</p>
                      <Badge className={cn("text-[9px] border", sev.bg, sev.color, "border-current/20")}>{sev.label}</Badge>
                    </div>
                    <p className={cn("text-[10px] mt-0.5", isLight ? "text-slate-400" : "text-slate-500")}>
                      {b.target} · {new Date(b.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold", ackPct === 100 ? "text-green-500" : isLight ? "text-slate-700" : "text-white")}>
                    {ackPct}%
                  </p>
                  <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                    {b.acknowledged}/{b.total} ack
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
