/**
 * VOICE MESSAGING PAGE
 * Driver-facing voice message inbox and recording screen.
 * Allows drivers to send/receive voice messages with dispatch,
 * safety, and other team members — hands-free communication
 * optimized for on-the-road use.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Mic, Play, Pause, Phone, Clock, Users,
  CheckCircle, RefreshCw, ChevronRight, Volume2,
  MicOff, Send, Trash2
} from "lucide-react";

type VoiceMessage = {
  id: string;
  from: string;
  role: string;
  duration: number;
  timestamp: string;
  played: boolean;
  direction: "incoming" | "outgoing";
};

const SAMPLE_MESSAGES: VoiceMessage[] = [
  { id: "vm-1", from: "Dispatch — Sarah M.", role: "Dispatcher", duration: 45, timestamp: "2026-02-16T14:30:00Z", played: false, direction: "incoming" },
  { id: "vm-2", from: "Safety — Mike T.", role: "Safety Director", duration: 22, timestamp: "2026-02-16T12:15:00Z", played: true, direction: "incoming" },
  { id: "vm-3", from: "You", role: "Driver", duration: 18, timestamp: "2026-02-16T11:00:00Z", played: true, direction: "outgoing" },
  { id: "vm-4", from: "Fleet Manager — John R.", role: "Fleet Manager", duration: 60, timestamp: "2026-02-15T16:45:00Z", played: true, direction: "incoming" },
  { id: "vm-5", from: "Dispatch — Sarah M.", role: "Dispatcher", duration: 30, timestamp: "2026-02-15T09:20:00Z", played: true, direction: "incoming" },
];

const CONTACTS = [
  { name: "Dispatch", role: "Primary Dispatcher" },
  { name: "Safety Department", role: "Safety Director" },
  { name: "Fleet Manager", role: "Fleet Operations" },
  { name: "After-Hours", role: "Emergency Line" },
];

export default function VoiceMessaging() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [tab, setTab] = useState<"inbox" | "record">("inbox");

  const messages = SAMPLE_MESSAGES;
  const unreadCount = messages.filter((m) => !m.played && m.direction === "incoming").length;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const startRecording = () => {
    setRecording(true);
    setRecordDuration(0);
    toast.info("Recording started...");
  };

  const stopRecording = () => {
    setRecording(false);
    toast.success("Voice message recorded");
  };

  const sendRecording = () => {
    toast.success("Voice message sent to dispatch");
    setRecordDuration(0);
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/60 border-slate-700/50");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Voice Messages
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hands-free voice communication with your team
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500/15 text-red-500 border-red-500/30 rounded-full px-3 py-1 text-xs font-bold border">
            {unreadCount} new
          </Badge>
        )}
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        {(["inbox", "record"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              tab === t
                ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-md"
                : isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            )}
          >
            {t === "inbox" ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {t === "inbox" ? `Inbox (${messages.length})` : "Record"}
          </button>
        ))}
      </div>

      {tab === "inbox" ? (
        <>
          {/* Message list */}
          <div className="space-y-3">
            {messages.map((msg) => {
              const isPlaying = playingId === msg.id;
              const isUnread = !msg.played && msg.direction === "incoming";
              return (
                <Card key={msg.id} className={cn(cc, "overflow-hidden", isUnread && "ring-1 ring-blue-500/30")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Play button */}
                      <button
                        onClick={() => togglePlay(msg.id)}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                          isPlaying
                            ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
                            : msg.direction === "outgoing"
                              ? isLight ? "bg-green-50 text-green-500" : "bg-green-500/10 text-green-400"
                              : isLight ? "bg-blue-50 text-blue-500" : "bg-blue-500/10 text-blue-400"
                        )}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-bold truncate", isLight ? "text-slate-800" : "text-white")}>{msg.from}</p>
                          {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                          {msg.direction === "outgoing" && (
                            <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[8px]">Sent</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={cn("text-xs flex items-center gap-1", isLight ? "text-slate-400" : "text-slate-500")}>
                            <Clock className="w-3 h-3" /> {formatDuration(msg.duration)}
                          </span>
                          <span className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>
                            {new Date(msg.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Waveform placeholder */}
                        {isPlaying && (
                          <div className="flex items-center gap-0.5 mt-2">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-gradient-to-t from-[#1473FF] to-[#BE01FF] rounded-full animate-pulse"
                                style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 50}ms` }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <p className={cn("text-xs font-mono tabular-nums", isLight ? "text-slate-400" : "text-slate-500")}>
                        {msg.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Record section */}
          <Card className={cn(cc, "overflow-hidden")}>
            <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
            <CardContent className="py-10 text-center space-y-6">
              {/* Record button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                    recording
                      ? "bg-red-500 shadow-lg shadow-red-500/30 animate-pulse"
                      : "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] shadow-lg shadow-purple-500/20 hover:scale-105"
                  )}
                >
                  {recording ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
                </button>
                <p className={cn("text-lg font-bold", isLight ? "text-slate-800" : "text-white")}>
                  {recording ? "Recording..." : "Tap to Record"}
                </p>
                {recording && (
                  <p className="text-2xl font-mono font-bold text-red-500 tabular-nums">
                    {formatDuration(recordDuration)}
                  </p>
                )}
              </div>

              {/* Send to */}
              <div>
                <p className={cn("text-xs font-medium mb-3", isLight ? "text-slate-500" : "text-slate-400")}>Send To</p>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  {CONTACTS.map((c) => (
                    <button
                      key={c.name}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-colors",
                        isLight ? "bg-white border-slate-200 hover:border-[#1473FF]/30" : "bg-slate-800/50 border-slate-700/30 hover:border-[#1473FF]/30"
                      )}
                      onClick={() => { sendRecording(); }}
                    >
                      <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{c.name}</p>
                      <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{c.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Hands-free note */}
      <div className={cn(
        "flex items-start gap-3 p-4 rounded-xl text-sm",
        isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
      )}>
        <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Hands-Free Operation</p>
          <p className="text-xs mt-0.5 opacity-80">
            Voice messages are designed for hands-free use while driving. Use your vehicle&apos;s
            Bluetooth hands-free system to listen and record messages safely. Never operate the
            touchscreen while driving.
          </p>
        </div>
      </div>
    </div>
  );
}
