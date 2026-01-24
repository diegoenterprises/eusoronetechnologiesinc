/**
 * CHAT WINDOW COMPONENT
 * Real-time messaging for load-related communications
 * Supports shipper-carrier, dispatcher-driver messaging
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Paperclip, Image, MapPin, Clock, Check, CheckCheck,
  Phone, Video, MoreVertical, User, Truck, Package, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "shipper" | "carrier" | "driver" | "dispatcher" | "system";
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read";
  attachments?: {
    type: "image" | "document" | "location";
    url?: string;
    name?: string;
    lat?: number;
    lng?: number;
  }[];
  isAlert?: boolean;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: "shipper" | "carrier" | "driver" | "dispatcher";
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface ChatWindowProps {
  loadId: string;
  loadNumber: string;
  currentUserId: string;
  currentUserRole: "shipper" | "carrier" | "driver" | "dispatcher";
  participants: ChatParticipant[];
  messages: Message[];
  onSendMessage: (content: string, attachments?: Message["attachments"]) => void;
  onMarkAsRead?: (messageId: string) => void;
}

const ROLE_COLORS = {
  shipper: "bg-blue-500",
  carrier: "bg-green-500",
  driver: "bg-purple-500",
  dispatcher: "bg-orange-500",
  system: "bg-slate-500",
};

const ROLE_ICONS = {
  shipper: Package,
  carrier: Truck,
  driver: User,
  dispatcher: User,
  system: AlertTriangle,
};

export function ChatWindow({
  loadId,
  loadNumber,
  currentUserId,
  currentUserRole,
  participants,
  messages,
  onSendMessage,
  onMarkAsRead,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return messageDate.toLocaleDateString();
  };

  const getOtherParticipants = () => participants.filter(p => p.id !== currentUserId);

  const renderMessageStatus = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-slate-500" />;
      case "sent":
        return <Check className="w-3 h-3 text-slate-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-slate-400" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
    }
  };

  let lastDate: string | null = null;

  return (
    <Card className="bg-slate-800/50 border-slate-700 flex flex-col h-[600px]">
      {/* Header */}
      <CardHeader className="pb-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <CardTitle className="text-white text-sm">{loadNumber}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                {getOtherParticipants().slice(0, 2).map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", p.isOnline ? "bg-green-500" : "bg-slate-500")} />
                    <span className="text-xs text-slate-400">{p.name}</span>
                    {idx < getOtherParticipants().length - 1 && <span className="text-slate-600">,</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
              <Phone className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
              <Video className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, idx) => {
            const isOwn = message.senderId === currentUserId;
            const showDate = formatDate(message.timestamp) !== lastDate;
            lastDate = formatDate(message.timestamp);
            const RoleIcon = ROLE_ICONS[message.senderRole];

            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}

                {message.isAlert ? (
                  <div className="flex justify-center">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 max-w-md">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-yellow-300">{message.content}</span>
                      </div>
                      <span className="text-xs text-slate-500 mt-1 block">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={cn("flex gap-2", isOwn ? "justify-end" : "justify-start")}>
                    {!isOwn && (
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", ROLE_COLORS[message.senderRole])}>
                        <RoleIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={cn("max-w-[70%]", isOwn ? "items-end" : "items-start")}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-300">{message.senderName}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1 text-slate-500 capitalize">
                            {message.senderRole}
                          </Badge>
                        </div>
                      )}
                      <div className={cn(
                        "rounded-2xl px-4 py-2",
                        isOwn 
                          ? "bg-blue-600 text-white rounded-br-md" 
                          : "bg-slate-700 text-slate-100 rounded-bl-md"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.attachments?.map((att, i) => (
                          <div key={i} className="mt-2">
                            {att.type === "location" && (
                              <div className="flex items-center gap-2 p-2 bg-black/20 rounded">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs">Location shared</span>
                              </div>
                            )}
                            {att.type === "image" && (
                              <img src={att.url} alt="" className="rounded max-w-full max-h-48" />
                            )}
                            {att.type === "document" && (
                              <div className="flex items-center gap-2 p-2 bg-black/20 rounded">
                                <Paperclip className="w-4 h-4" />
                                <span className="text-xs">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className={cn("flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
                        <span className="text-[10px] text-slate-500">{formatTime(message.timestamp)}</span>
                        {isOwn && renderMessageStatus(message.status)}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {isTyping && (
            <div className="flex gap-2 items-center">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="bg-slate-700 rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-white">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-white">
            <Image className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-white">
            <MapPin className="w-4 h-4" />
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700/50 border-slate-600 text-white"
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function getSampleMessages(): Message[] {
  return [
    {
      id: "m1",
      senderId: "shipper1",
      senderName: "Shell Oil",
      senderRole: "shipper",
      content: "Load is ready for pickup at Gate 3. Please check in with security upon arrival.",
      timestamp: new Date(Date.now() - 3600000 * 2),
      status: "read",
    },
    {
      id: "m2",
      senderId: "carrier1",
      senderName: "ABC Transport",
      senderRole: "carrier",
      content: "Driver John Smith is en route. ETA 30 minutes.",
      timestamp: new Date(Date.now() - 3600000 * 1.5),
      status: "read",
    },
    {
      id: "m3",
      senderId: "driver1",
      senderName: "John Smith",
      senderRole: "driver",
      content: "Arrived at facility. Checking in now.",
      timestamp: new Date(Date.now() - 3600000),
      status: "read",
    },
    {
      id: "m4",
      senderId: "system",
      senderName: "System",
      senderRole: "system",
      content: "Driver checked in at Houston Terminal",
      timestamp: new Date(Date.now() - 3000000),
      status: "delivered",
      isAlert: true,
    },
    {
      id: "m5",
      senderId: "shipper1",
      senderName: "Shell Oil",
      senderRole: "shipper",
      content: "Great, loading should take approximately 45 minutes. BOL will be provided upon completion.",
      timestamp: new Date(Date.now() - 1800000),
      status: "read",
    },
  ];
}

export default ChatWindow;
