/**
 * MESSAGING CENTER — OpenIM-Inspired Architecture
 * 100% Database-backed real-time messaging
 * Phone calls via mobile network (no Twilio)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Send, Search, Phone, MoreVertical, Plus,
  User, Users, Paperclip, Image, Smile, Check, CheckCheck,
  AlertTriangle, Loader2, Archive, Trash2, Pin, BellOff, ArrowLeft,
  Shield, Truck, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MessagingCenter() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──
  const conversationsQuery = (trpc as any).messages.getConversations.useQuery(
    { search: searchTerm || undefined },
    { refetchInterval: 8000 }
  );
  const messagesQuery = (trpc as any).messages.getMessages.useQuery(
    { conversationId: selectedConversation || "" },
    { enabled: !!selectedConversation, refetchInterval: 3000 }
  );

  // ── Mutations ──
  const sendMutation = (trpc as any).messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesQuery.refetch();
      conversationsQuery.refetch();
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onError: (error: any) => toast.error("Failed to send", { description: error.message }),
  });
  const sendMessageMutation = (trpc as any).messages.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesQuery.refetch();
      conversationsQuery.refetch();
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onError: (error: any) => toast.error("Failed to send", { description: error.message }),
  });
  const markAsReadMutation = (trpc as any).messages.markAsRead.useMutation({
    onSuccess: () => conversationsQuery.refetch(),
  });

  // ── Effects ──
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate({ conversationId: selectedConversation });
      setShowMobileChat(true);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  useEffect(() => {
    if ((conversationsQuery.data as any)?.length && !selectedConversation) {
      setSelectedConversation(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedConversation]);

  // ── Handlers ──
  const selectedConv = (conversationsQuery.data as any)?.find((c: any) => c.id === selectedConversation);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !selectedConversation) return;
    sendMutation.mutate({ conversationId: selectedConversation, content: messageText });
  }, [messageText, selectedConversation]);

  const handlePhoneCall = useCallback(() => {
    if (!selectedConv) return;
    // Use mobile network — open tel: link (no Twilio needed)
    // The phone number comes from the other participant's user record
    toast.info("Opening dialer...", { description: "Calling via your mobile network" });
    // In production, fetch phone from getUserPhone endpoint
    window.open(`tel:`, "_self");
  }, [selectedConv]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getRoleIcon = (role: string) => {
    if (role === "DRIVER") return <Truck className="w-3 h-3" />;
    if (role === "CARRIER") return <Shield className="w-3 h-3" />;
    return null;
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "DRIVER") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (role === "CARRIER") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (role === "SHIPPER") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  if (conversationsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading messages</p>
        <Button className="mt-4" onClick={() => conversationsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-900 rounded-2xl overflow-hidden border border-slate-800/50">
      {/* ═══════════ Conversations Sidebar ═══════════ */}
      <div className={cn(
        "w-full md:w-96 border-r border-slate-800/50 flex flex-col bg-slate-900/80",
        showMobileChat && "hidden md:flex"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              Messages
            </h1>
            <Button size="sm" className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-xl h-9 px-3">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-xl text-sm focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-[72px] w-full rounded-xl" />)}</div>
          ) : (conversationsQuery.data as any)?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">No conversations yet</p>
              <p className="text-slate-500 text-sm mt-1 text-center">Start a conversation with a carrier, driver, or shipper</p>
            </div>
          ) : (
            (conversationsQuery.data as any)?.map((conv: any) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all",
                  selectedConversation === conv.id
                    ? "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-l-2 border-l-purple-500"
                    : "hover:bg-slate-800/40 border-l-2 border-l-transparent"
                )}
                onClick={() => setSelectedConversation(conv.id)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-700/50" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-2 ring-slate-700/50">
                      {conv.type === "group" ? <Users className="w-5 h-5 text-slate-400" /> : (
                        <span className="text-lg font-bold text-slate-400">{(conv.name || "?")[0]?.toUpperCase()}</span>
                      )}
                    </div>
                  )}
                  {conv.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />}
                  {conv.isPinned && <Pin className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "font-semibold truncate text-sm",
                      conv.unreadCount > 0 ? "text-white" : "text-slate-300"
                    )}>{conv.name}</p>
                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={cn(
                      "text-xs truncate max-w-[200px]",
                      conv.unreadCount > 0 ? "text-slate-300 font-medium" : "text-slate-500"
                    )}>{conv.lastMessage || "No messages yet"}</p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full border-0 ml-2 px-1.5">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══════════ Chat Area ═══════════ */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-950/50",
        !showMobileChat && "hidden md:flex"
      )}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1473FF]/5 to-[#BE01FF]/5 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-12 h-12 text-slate-700" />
              </div>
              <p className="text-slate-400 text-lg font-medium">Select a conversation</p>
              <p className="text-slate-600 text-sm mt-1">Choose from your conversations to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="px-5 py-3.5 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <Button variant="ghost" size="sm" className="md:hidden p-1" onClick={() => setShowMobileChat(false)}>
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </Button>
                {/* Avatar */}
                {selectedConv?.avatar ? (
                  <img src={selectedConv.avatar} alt={selectedConv.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-400">{(selectedConv?.name || "?")[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{selectedConv?.name}</p>
                  <div className="flex items-center gap-2">
                    {selectedConv?.online ? (
                      <span className="text-emerald-400 text-[11px] font-medium">Online</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Offline</span>
                    )}
                    {selectedConv?.role && selectedConv.role !== "user" && (
                      <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", getRoleBadgeColor(selectedConv.role))}>
                        {getRoleIcon(selectedConv.role)}
                        <span className="ml-1">{selectedConv.role}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Phone call via mobile network (no Twilio) */}
                <Button variant="ghost" size="sm" onClick={handlePhoneCall} className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-300 rounded-xl">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messagesQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-3/4 rounded-2xl" />)}</div>
              ) : (messagesQuery.data as any)?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                    <Send className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm">No messages yet</p>
                  <p className="text-slate-600 text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                (messagesQuery.data as any)?.map((message: any, idx: number) => {
                  const prevMsg = idx > 0 ? (messagesQuery.data as any)[idx - 1] : null;
                  const showSenderName = !message.isOwn && (!prevMsg || prevMsg.senderId !== message.senderId);

                  return (
                    <div key={message.id} className={cn("flex gap-2", message.isOwn ? "justify-end" : "justify-start")}>
                      {/* Sender avatar (for others) */}
                      {!message.isOwn && showSenderName && (
                        <div className="flex-shrink-0 mt-5">
                          {message.senderAvatar ? (
                            <img src={message.senderAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-slate-400">{(message.senderName || "?")[0]?.toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {!message.isOwn && !showSenderName && <div className="w-7 flex-shrink-0" />}

                      <div className={cn("max-w-[70%]")}>
                        {showSenderName && !message.isOwn && (
                          <p className="text-[10px] text-slate-500 mb-0.5 ml-1 font-medium">{message.senderName}</p>
                        )}
                        <div className={cn(
                          "rounded-2xl px-4 py-2.5",
                          message.isOwn
                            ? "bg-gradient-to-r from-[#1473FF] to-[#1473FF]/90 text-white rounded-br-md"
                            : "bg-slate-800/70 text-slate-100 rounded-bl-md"
                        )}>
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <div className={cn("flex items-center gap-1 mt-0.5 px-1", message.isOwn ? "justify-end" : "justify-start")}>
                          <span className="text-[10px] text-slate-600">{formatTime(message.timestamp)}</span>
                          {message.isOwn && (
                            message.read
                              ? <CheckCheck className="w-3 h-3 text-blue-400" />
                              : <Check className="w-3 h-3 text-slate-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Message Input ── */}
            <div className="px-4 py-3 border-t border-slate-800/50 bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-300 rounded-xl p-2">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={messageText}
                  onChange={(e: any) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800/50 border-slate-700/50 rounded-xl text-sm focus:border-purple-500/50 focus:ring-purple-500/20"
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMutation.isPending}
                  className={cn(
                    "rounded-xl h-10 w-10 p-0 transition-all",
                    messageText.trim()
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white shadow-lg shadow-purple-500/20"
                      : "bg-slate-800 text-slate-500"
                  )}
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
