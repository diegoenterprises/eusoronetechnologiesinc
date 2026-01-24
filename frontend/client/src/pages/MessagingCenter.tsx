/**
 * MESSAGING CENTER PAGE
 * Real-time messaging and notifications hub
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, Search, Send, Phone, Video, MoreVertical,
  Paperclip, Image, FileText, Users, Bell, Check, CheckCheck,
  Clock, Truck, AlertTriangle, Star, Plus, Filter, Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: "text" | "image" | "file" | "system";
}

interface Conversation {
  id: string;
  type: "load" | "support" | "dispatch" | "direct";
  title: string;
  subtitle?: string;
  participants: { id: string; name: string; role: string }[];
  lastMessage: Message;
  unreadCount: number;
  pinned: boolean;
  loadNumber?: string;
}

export default function MessagingCenter() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>("conv_001");
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - would use tRPC in production
  const conversations: Conversation[] = [
    {
      id: "conv_001",
      type: "load",
      title: "LOAD-45850",
      subtitle: "Houston to Dallas",
      participants: [
        { id: "d1", name: "Dispatch", role: "dispatcher" },
        { id: "u1", name: "Mike Johnson", role: "driver" },
      ],
      lastMessage: {
        id: "m1",
        senderId: "d1",
        senderName: "Dispatch",
        content: "ETA update: Arriving at 15:30",
        timestamp: "2025-01-23T14:30:00Z",
        read: false,
        type: "text",
      },
      unreadCount: 2,
      pinned: true,
      loadNumber: "LOAD-45850",
    },
    {
      id: "conv_002",
      type: "dispatch",
      title: "Dispatch Team",
      participants: [
        { id: "d1", name: "Sarah Williams", role: "dispatcher" },
        { id: "d2", name: "John Davis", role: "dispatcher" },
      ],
      lastMessage: {
        id: "m2",
        senderId: "d1",
        senderName: "Sarah Williams",
        content: "New load available for pickup",
        timestamp: "2025-01-23T13:15:00Z",
        read: true,
        type: "text",
      },
      unreadCount: 0,
      pinned: false,
    },
    {
      id: "conv_003",
      type: "support",
      title: "Billing Support",
      subtitle: "Invoice #INV-2024-001",
      participants: [
        { id: "s1", name: "Support Team", role: "support" },
      ],
      lastMessage: {
        id: "m3",
        senderId: "s1",
        senderName: "Support Team",
        content: "Your issue has been resolved",
        timestamp: "2025-01-22T16:00:00Z",
        read: true,
        type: "text",
      },
      unreadCount: 0,
      pinned: false,
    },
    {
      id: "conv_004",
      type: "load",
      title: "LOAD-45842",
      subtitle: "Beaumont to Corpus Christi",
      participants: [
        { id: "d1", name: "Dispatch", role: "dispatcher" },
        { id: "u2", name: "David Brown", role: "driver" },
      ],
      lastMessage: {
        id: "m4",
        senderId: "u2",
        senderName: "David Brown",
        content: "Delivered successfully",
        timestamp: "2025-01-22T11:30:00Z",
        read: true,
        type: "text",
      },
      unreadCount: 0,
      pinned: false,
      loadNumber: "LOAD-45842",
    },
    {
      id: "conv_005",
      type: "direct",
      title: "Emily Martinez",
      participants: [
        { id: "u3", name: "Emily Martinez", role: "driver" },
      ],
      lastMessage: {
        id: "m5",
        senderId: "u3",
        senderName: "Emily Martinez",
        content: "Thanks for the help!",
        timestamp: "2025-01-21T09:00:00Z",
        read: true,
        type: "text",
      },
      unreadCount: 0,
      pinned: false,
    },
  ];

  const currentMessages: Message[] = [
    { id: "m1", senderId: "d1", senderName: "Dispatch", content: "Good morning! Your load LOAD-45850 is ready for pickup.", timestamp: "2025-01-23T08:00:00Z", read: true, type: "text" },
    { id: "m2", senderId: "u1", senderName: "Mike Johnson", content: "On my way. ETA 30 minutes.", timestamp: "2025-01-23T08:05:00Z", read: true, type: "text" },
    { id: "m3", senderId: "d1", senderName: "Dispatch", content: "Perfect. Terminal gate code is 4521.", timestamp: "2025-01-23T08:10:00Z", read: true, type: "text" },
    { id: "m4", senderId: "u1", senderName: "Mike Johnson", content: "Arrived at terminal. Starting load process.", timestamp: "2025-01-23T08:35:00Z", read: true, type: "text" },
    { id: "m5", senderId: "system", senderName: "System", content: "Load pickup confirmed - BOL #BOL-2025-4521", timestamp: "2025-01-23T09:15:00Z", read: true, type: "system" },
    { id: "m6", senderId: "u1", senderName: "Mike Johnson", content: "Loaded and sealed. Departing now.", timestamp: "2025-01-23T09:20:00Z", read: true, type: "text" },
    { id: "m7", senderId: "d1", senderName: "Dispatch", content: "Great! Drive safe. Let me know when you're near Dallas.", timestamp: "2025-01-23T09:25:00Z", read: true, type: "text" },
    { id: "m8", senderId: "u1", senderName: "Mike Johnson", content: "Will do. Traffic looks clear on I-45.", timestamp: "2025-01-23T09:30:00Z", read: true, type: "text" },
    { id: "m9", senderId: "d1", senderName: "Dispatch", content: "ETA update: Arriving at 15:30", timestamp: "2025-01-23T14:30:00Z", read: false, type: "text" },
  ];

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    toast.success("Message sent");
    setMessageInput("");
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case "load": return Truck;
      case "support": return Bell;
      case "dispatch": return Users;
      case "direct": return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getConversationColor = (type: string) => {
    switch (type) {
      case "load": return "bg-blue-500/20 text-blue-400";
      case "support": return "bg-purple-500/20 text-purple-400";
      case "dispatch": return "bg-green-500/20 text-green-400";
      case "direct": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeTab !== "all" && conv.type !== activeTab) return false;
    if (searchTerm && !conv.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-120px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Conversation List */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Messages</CardTitle>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative mt-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
              <TabsList className="bg-slate-700/50 w-full">
                <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
                <TabsTrigger value="load" className="flex-1 text-xs">Loads</TabsTrigger>
                <TabsTrigger value="dispatch" className="flex-1 text-xs">Dispatch</TabsTrigger>
                <TabsTrigger value="support" className="flex-1 text-xs">Support</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="flex-1 mt-3">
              <div className="space-y-1 px-2">
                {filteredConversations.map((conv) => {
                  const Icon = getConversationIcon(conv.type);
                  const isSelected = selectedConversation === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isSelected
                          ? "bg-purple-500/20 border border-purple-500/30"
                          : "hover:bg-slate-700/50"
                      )}
                    >
                      <div className={cn("p-2 rounded-full", getConversationColor(conv.type))}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "font-medium truncate",
                            conv.unreadCount > 0 ? "text-white" : "text-slate-300"
                          )}>
                            {conv.title}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatTime(conv.lastMessage.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={cn(
                            "text-sm truncate",
                            conv.unreadCount > 0 ? "text-slate-300" : "text-slate-500"
                          )}>
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-purple-500 text-white text-xs ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", getConversationColor(selectedConv.type))}>
                      {React.createElement(getConversationIcon(selectedConv.type), { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedConv.title}</p>
                      {selectedConv.subtitle && (
                        <p className="text-xs text-slate-400">{selectedConv.subtitle}</p>
                      )}
                    </div>
                    {selectedConv.loadNumber && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {selectedConv.loadNumber}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentMessages.map((message) => {
                    const isOwnMessage = message.senderId === "u1";
                    const isSystem = message.type === "system";

                    if (isSystem) {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <Badge className="bg-slate-700 text-slate-400">
                            {message.content}
                          </Badge>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[70%]",
                          isOwnMessage ? "items-end" : "items-start"
                        )}>
                          {!isOwnMessage && (
                            <p className="text-xs text-slate-500 mb-1 ml-1">
                              {message.senderName}
                            </p>
                          )}
                          <div className={cn(
                            "px-4 py-2 rounded-2xl",
                            isOwnMessage
                              ? "bg-purple-600 text-white rounded-br-sm"
                              : "bg-slate-700 text-white rounded-bl-sm"
                          )}>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwnMessage ? "justify-end mr-1" : "ml-1"
                          )}>
                            <span className="text-xs text-slate-500">
                              {formatTime(message.timestamp)}
                            </span>
                            {isOwnMessage && (
                              message.read ? (
                                <CheckCheck className="w-3 h-3 text-blue-400" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-500" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-5 h-5 text-slate-400" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Image className="w-5 h-5 text-slate-400" />
                  </Button>
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
