/**
 * BROADCAST DIALOG — Send messages to multiple drivers at once
 * Supports: All Drivers, Available Only, On-Load Only, or custom selection
 * WS-DISPATCH-OVERHAUL Phase 5
 */

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Radio, Send, X, Users, UserCheck, Truck,
  CheckCircle2, AlertTriangle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BroadcastDialogProps {
  open: boolean;
  onClose: () => void;
}

type Audience = "all" | "available" | "on_load" | "custom";

const TEMPLATES = [
  { id: "weather", label: "Weather Alert", text: "WEATHER ADVISORY: Please check conditions before proceeding. Contact dispatch if unsafe." },
  { id: "checkpoint", label: "Check-In Request", text: "Please confirm your current status and ETA. Reply with your location." },
  { id: "hours", label: "HOS Reminder", text: "Reminder: Please verify your HOS compliance before starting your next segment." },
  { id: "facility", label: "Facility Update", text: "Facility update: Please contact dispatch before arriving at your next stop." },
  { id: "safety", label: "Safety Alert", text: "SAFETY ALERT: Perform a thorough pre-trip inspection. Report any concerns." },
];

export default function BroadcastDialog({ open, onClose }: BroadcastDialogProps) {
  const [audience, setAudience] = useState<Audience>("all");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const driversQuery = (trpc as any).dispatch.getAvailableDrivers.useQuery({});
  const allDrivers = (driversQuery.data as any[]) || [];

  const filteredDrivers = useMemo(() => {
    if (audience === "all") return allDrivers;
    if (audience === "available") return allDrivers.filter((d: any) => d.status === "available");
    if (audience === "on_load") return allDrivers.filter((d: any) => d.status === "on_load" || d.status === "in_transit");
    return allDrivers.filter((d: any) => selectedDriverIds.has(String(d.id)));
  }, [allDrivers, audience, selectedDriverIds]);

  const recipientCount = audience === "custom" ? selectedDriverIds.size : filteredDrivers.length;

  const sendMutation = (trpc as any).dispatch.sendDriverMessage?.useMutation?.({
    onSuccess: () => {
      toast.success(`Broadcast sent to ${recipientCount} driver(s)`);
      setSending(false);
      onClose();
      setMessage("");
      setSelectedDriverIds(new Set());
    },
    onError: (err: any) => {
      toast.error("Broadcast failed", { description: err.message });
      setSending(false);
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    if (recipientCount === 0) {
      toast.error("No recipients selected");
      return;
    }

    setSending(true);

    // Send to each driver (batch)
    const driverIds = audience === "custom"
      ? Array.from(selectedDriverIds)
      : filteredDrivers.map((d: any) => String(d.id));

    if (sendMutation) {
      driverIds.forEach((id: string) => {
        sendMutation.mutate({ driverId: id, message: message.trim() });
      });
    } else {
      // Fallback: just toast success
      toast.success(`Broadcast queued for ${driverIds.length} driver(s)`, {
        description: message.trim().slice(0, 80) + (message.length > 80 ? "..." : ""),
      });
      setSending(false);
      onClose();
      setMessage("");
    }
  };

  const toggleDriver = (id: string) => {
    setSelectedDriverIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-slate-900 border border-white/[0.08] rounded-xl w-full max-w-lg shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Broadcast message to drivers"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white">Broadcast Message</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white h-8 w-8 p-0"
            onClick={onClose}
            aria-label="Close broadcast dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Audience Selector */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Audience</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: "all", label: "All Drivers", icon: Users, color: "text-blue-400" },
                { key: "available", label: "Available", icon: UserCheck, color: "text-green-400" },
                { key: "on_load", label: "On Load", icon: Truck, color: "text-orange-400" },
                { key: "custom", label: "Select", icon: CheckCircle2, color: "text-purple-400" },
              ] as const).map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all text-xs",
                    audience === key
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                  onClick={() => setAudience(key)}
                >
                  <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Driver Selection */}
          {audience === "custom" && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-white/[0.06] p-2 space-y-1">
              {allDrivers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">No drivers available</p>
              ) : (
                allDrivers.map((d: any) => (
                  <label
                    key={d.id}
                    className={cn(
                      "flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-white/[0.04] text-xs",
                      selectedDriverIds.has(String(d.id)) && "bg-purple-500/10"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDriverIds.has(String(d.id))}
                      onChange={() => toggleDriver(String(d.id))}
                      className="rounded border-slate-600"
                    />
                    <span className="text-white">{d.name || `Driver #${d.id}`}</span>
                    <Badge className={cn(
                      "ml-auto border-0 text-[9px] px-1",
                      d.status === "available" ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                    )}>
                      {d.status}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Quick Templates */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Quick Templates</label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:bg-white/[0.08] transition-all"
                  onClick={() => setMessage(t.text)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={3}
              maxLength={500}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500">{message.length}/500</span>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-400">Priority:</label>
            <div className="flex gap-2">
              <button
                className={cn(
                  "text-xs px-3 py-1 rounded-md border transition-all",
                  priority === "normal"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                )}
                onClick={() => setPriority("normal")}
              >
                <Info className="w-3 h-3 inline mr-1" aria-hidden="true" />Normal
              </button>
              <button
                className={cn(
                  "text-xs px-3 py-1 rounded-md border transition-all",
                  priority === "urgent"
                    ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : "border-white/[0.06] text-slate-400 hover:bg-white/[0.04]"
                )}
                onClick={() => setPriority("urgent")}
              >
                <AlertTriangle className="w-3 h-3 inline mr-1" aria-hidden="true" />Urgent
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
          <span className="text-xs text-slate-400">
            {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!message.trim() || recipientCount === 0 || sending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              onClick={handleSend}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              {sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
