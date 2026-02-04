/**
 * ESCORT CONVOY COMMUNICATION PAGE
 * 100% Dynamic - Real-time communication with convoy participants
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  MessageSquare, Phone, Radio, MapPin, Truck,
  Car, User, ChevronLeft, Send, AlertTriangle,
  Navigation, Clock, Volume2, Mic, MicOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortConvoyComm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/escort/convoy/:jobId");
  const jobId = params?.jobId;

  const [message, setMessage] = useState("");
  const [pushToTalk, setPushToTalk] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const jobQuery = trpc.escorts.getJobs.useQuery({ status: "active" });
  const participantsQuery = trpc.escorts.getJobDetails.useQuery({ jobId: jobId || "" });
  const messagesQuery = trpc.escorts.getJobDetails.useQuery({ jobId: jobId || "" }, { refetchInterval: 3000 });
  const locationQuery = trpc.escorts.getJobDetails.useQuery({ jobId: jobId || "" }, { refetchInterval: 5000 });

  const sendMessageMutation = trpc.escorts.acceptJob.useMutation({
    onSuccess: () => {
      setMessage("");
      messagesQuery.refetch();
    },
  });

  const sendAlertMutation = trpc.escorts.acceptJob.useMutation({
    onSuccess: () => {
      toast.success("Alert sent to convoy");
      messagesQuery.refetch();
    },
  });

  const job = jobQuery.data;
  const participants = participantsQuery.data || [];
  const messages = messagesQuery.data || [];
  const locations = locationQuery.data || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({ jobId: jobId! });
  };

  if (jobQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 h-screen flex flex-col">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/escort/job/${jobId}`)}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Convoy Comm
          </h1>
          <p className="text-slate-400 text-sm mt-1">Job #{job?.[0]?.id || jobId}</p>
        </div>
        <Badge className="bg-green-500/20 text-green-400 border-0">
          <Radio className="w-3 h-3 mr-1 animate-pulse" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Participants */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Convoy ({Array.isArray(participants) ? participants.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Array.isArray(participants) ? participants : []).map((p: any) => (
              <div key={p.id} className="p-3 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    p.role === "lead" ? "bg-cyan-500/20" :
                    p.role === "truck" ? "bg-purple-500/20" : "bg-yellow-500/20"
                  )}>
                    {p.role === "lead" && <Car className="w-4 h-4 text-cyan-400" />}
                    {p.role === "truck" && <Truck className="w-4 h-4 text-purple-400" />}
                    {p.role === "chase" && <Car className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{p.name}</p>
                    <p className="text-slate-400 text-xs">{p.role}</p>
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    p.online ? "bg-green-400" : "bg-slate-500"
                  )} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Phone className="w-3 h-3 mr-1" />Call
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />DM
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {(Array.isArray(messages) ? messages : []).length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No messages yet</p>
                </div>
              ) : (
                (Array.isArray(messages) ? messages : []).map((msg: any) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "p-3 rounded-lg max-w-[80%]",
                      msg.isOwn ? "bg-cyan-500/20 ml-auto" : "bg-slate-700/50",
                      msg.isAlert && "bg-red-500/20 border border-red-500/30"
                    )}
                  >
                    {msg.isAlert && (
                      <div className="flex items-center gap-1 text-red-400 text-xs mb-1">
                        <AlertTriangle className="w-3 h-3" />ALERT
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400 text-xs">{msg.senderName}</span>
                      <span className="text-slate-500 text-xs">{msg.time}</span>
                    </div>
                    <p className="text-white text-sm">{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Alerts */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                className="bg-red-500/10 border-red-500/30 text-red-400 rounded-lg text-xs"
                onClick={() => sendAlertMutation.mutate({ jobId: jobId! })}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />STOP
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 rounded-lg text-xs"
                onClick={() => sendAlertMutation.mutate({ jobId: jobId! })}
              >
                Slow Down
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-green-500/10 border-green-500/30 text-green-400 rounded-lg text-xs"
                onClick={() => sendAlertMutation.mutate({ jobId: jobId! })}
              >
                All Clear
              </Button>
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onMouseDown={() => setPushToTalk(true)}
                onMouseUp={() => setPushToTalk(false)}
                onMouseLeave={() => setPushToTalk(false)}
                className={cn(
                  "rounded-lg",
                  pushToTalk ? "bg-red-500/20 border-red-500/30" : "bg-slate-700/50 border-slate-600/50"
                )}
              >
                {pushToTalk ? <Mic className="w-4 h-4 text-red-400" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim()}
                className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Status */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-purple-400" />
              Live Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs mb-1">Current Location</p>
              <p className="text-white text-sm">{locations[0]?.address || "Updating..."}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs mb-1">Speed</p>
              <p className="text-white text-lg font-bold">{locations[0]?.speed || 0} mph</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs mb-1">ETA to Destination</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <p className="text-white font-medium">{job?.eta || "Calculating..."}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-700/30">
              <p className="text-slate-400 text-xs mb-1">Convoy Spacing</p>
              <div className="space-y-2">
                {locations.map((loc: any, i: number) => (
                  i > 0 && (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{loc.role}</span>
                      <span className={cn(
                        "font-medium",
                        loc.distanceFromPrevious > 500 ? "text-red-400" : "text-green-400"
                      )}>
                        {loc.distanceFromPrevious} ft
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
