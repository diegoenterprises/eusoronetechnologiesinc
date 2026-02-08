/**
 * MESSAGES PAGE — Production-Ready
 * 100% Database-backed, all buttons wired, real-time polling
 * New conversation dialog, search, send/receive, read receipts
 * Phone calls via mobile network (tel: links, no Twilio)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Search, Send, Users, Plus, X, Phone,
  Check, CheckCheck, Loader2, AlertTriangle, ArrowLeft,
  User, Trash2, Archive, MoreVertical, Truck, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Queries (all DB-backed, real-time polling) ──
  const conversationsQuery = (trpc as any).messages.getConversations.useQuery(
    { search: searchTerm || undefined },
    { refetchInterval: 6000 }
  );
  const messagesQuery = (trpc as any).messages.getMessages.useQuery(
    { conversationId: selectedConversation || "" },
    { enabled: !!selectedConversation, refetchInterval: 3000 }
  );
  const unreadQuery = (trpc as any).messages.getUnreadCount.useQuery(undefined, { refetchInterval: 10000 });
  const usersQuery = (trpc as any).messages.searchUsers.useQuery(
    { query: userSearchTerm || undefined, limit: 15 },
    { enabled: showNewConversation }
  );

  // ── Mutations (all write to MySQL via tRPC) ──
  const sendMutation = (trpc as any).messages.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      messagesQuery.refetch();
      conversationsQuery.refetch();
      unreadQuery.refetch();
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    onError: (err: any) => toast.error("Failed to send message", { description: err.message }),
  });

  const markAsReadMutation = (trpc as any).messages.markAsRead.useMutation({
    onSuccess: () => { conversationsQuery.refetch(); unreadQuery.refetch(); },
  });

  const createConversationMutation = (trpc as any).messages.createConversation.useMutation({
    onSuccess: (data: any) => {
      setShowNewConversation(false);
      setUserSearchTerm("");
      setSelectedConversation(data.id);
      setShowMobileChat(true);
      conversationsQuery.refetch();
      toast.success(data.existing ? "Opened existing conversation" : "Conversation created");
    },
    onError: (err: any) => toast.error("Failed to create conversation", { description: err.message }),
  });

  const deleteConversationMutation = (trpc as any).messages.deleteConversation.useMutation({
    onSuccess: () => {
      setSelectedConversation(null);
      setShowContextMenu(null);
      conversationsQuery.refetch();
      toast.success("Conversation deleted");
    },
  });

  const archiveConversationMutation = (trpc as any).messages.archiveConversation.useMutation({
    onSuccess: () => {
      setShowContextMenu(null);
      conversationsQuery.refetch();
      toast.success("Conversation archived");
    },
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
  const totalUnread = unreadQuery.data?.total || 0;

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMutation.mutate({ conversationId: selectedConversation, content: newMessage });
  }, [newMessage, selectedConversation]);

  const handleStartConversation = useCallback((userId: number, userName: string) => {
    createConversationMutation.mutate({
      participantIds: [userId],
      type: "direct",
    });
  }, []);

  const phoneQuery = (trpc as any).messages.getConversation.useQuery(
    { conversationId: selectedConversation || "" },
    { enabled: !!selectedConversation }
  );

  const handlePhoneCall = useCallback(() => {
    const participants = phoneQuery.data?.participants || [];
    const other = participants.find((p: any) => p.phone);
    if (other?.phone) {
      toast.info(`Calling ${other.name}`, { description: "Via your mobile network" });
      window.open(`tel:${other.phone}`, "_self");
    } else {
      toast.error("No phone number", { description: "This user hasn't added a phone number" });
    }
  }, [phoneQuery.data]);

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
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      DRIVER: "bg-emerald-500/20 text-emerald-400",
      CARRIER: "bg-blue-500/20 text-blue-400",
      SHIPPER: "bg-purple-500/20 text-purple-400",
      BROKER: "bg-amber-500/20 text-amber-400",
      ADMIN: "bg-red-500/20 text-red-400",
    };
    return colors[role] || "bg-slate-500/20 text-slate-400";
  };

  if (conversationsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 font-medium">Error loading messages</p>
        <p className="text-slate-500 text-sm mt-1">{(conversationsQuery.error as any)?.message}</p>
        <Button className="mt-4" onClick={() => conversationsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-slate-400 text-sm mt-1">Communicate with carriers, shippers, and drivers</p>
        </div>
        <div className="flex items-center gap-3">
          {totalUnread > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1473FF]/15 to-[#BE01FF]/15 border border-purple-500/20">
              <span className="text-purple-400 text-sm font-medium">Unread</span>
              <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-xs h-5 min-w-5 rounded-full">{totalUnread}</Badge>
            </div>
          )}
          <Button
            onClick={() => setShowNewConversation(true)}
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white rounded-xl font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />New Message
          </Button>
        </div>
      </div>

      {/* ═══ Main Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-220px)]">

        {/* ── Conversations List ── */}
        <Card className={cn(
          "bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden",
          showMobileChat && "hidden lg:block"
        )}>
          <CardHeader className="pb-3 border-b border-slate-700/50 px-4 pt-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-xl focus:border-purple-500/50 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-340px)]">
            {conversationsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (conversationsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1473FF]/10 to-[#BE01FF]/10 mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No conversations yet</p>
                <p className="text-slate-500 text-xs mt-1">Click "New Message" to start one</p>
              </div>
            ) : (
              <div>
                {(conversationsQuery.data as any)?.map((conv: any) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all",
                      selectedConversation === conv.id
                        ? "bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-l-2 border-l-purple-500"
                        : "hover:bg-slate-700/30 border-l-2 border-l-transparent"
                    )}
                    onClick={() => setSelectedConversation(conv.id)}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.avatar ? (
                        <img src={conv.avatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-700/50" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-2 ring-slate-700/50">
                          <span className="text-base font-bold text-slate-400">{(conv.name || "?")[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-800" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn("font-semibold truncate text-sm", conv.unreadCount > 0 ? "text-white" : "text-slate-300")}>
                          {conv.name || conv.participantName}
                        </p>
                        <span className="text-[10px] text-slate-500 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={cn("text-xs truncate max-w-[160px]", conv.unreadCount > 0 ? "text-slate-300 font-medium" : "text-slate-500")}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white text-[10px] h-5 min-w-5 rounded-full border-0 ml-2 px-1.5">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Context menu trigger */}
                    <button
                      className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded-lg hover:bg-slate-700/50 transition-all"
                      onClick={(e) => { e.stopPropagation(); setShowContextMenu(showContextMenu === conv.id ? null : conv.id); }}
                    >
                      <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {/* Context menu */}
                    {showContextMenu === conv.id && (
                      <div className="absolute right-2 top-12 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[140px]">
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); archiveConversationMutation.mutate({ conversationId: conv.id }); }}
                        >
                          <Archive className="w-3.5 h-3.5" /> Archive
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); deleteConversationMutation.mutate({ conversationId: conv.id }); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Chat Area ── */}
        <Card className={cn(
          "lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-2xl overflow-hidden flex flex-col",
          !showMobileChat && "hidden lg:flex"
        )}>
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1473FF]/5 to-[#BE01FF]/5 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-400 text-lg font-medium">Select a conversation</p>
                <p className="text-slate-500 text-sm mt-1">Choose a conversation or start a new one</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-slate-700/50 px-5 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="lg:hidden p-1" onClick={() => setShowMobileChat(false)}>
                      <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Button>
                    {selectedConv?.avatar ? (
                      <img src={selectedConv.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-400">{(selectedConv?.name || "?")[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">{selectedConv?.name || selectedConv?.participantName}</p>
                      <div className="flex items-center gap-2">
                        {selectedConv?.online ? (
                          <span className="text-emerald-400 text-[11px] font-medium">Online</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Offline</span>
                        )}
                        {selectedConv?.role && selectedConv.role !== "user" && (
                          <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", getRoleBadge(selectedConv.role))}>
                            {selectedConv.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={handlePhoneCall} className="text-slate-400 hover:text-emerald-400 rounded-xl">
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />)}</div>
                ) : (messagesQuery.data as any)?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Send className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-slate-500 text-sm">No messages yet</p>
                    <p className="text-slate-600 text-xs mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  (messagesQuery.data as any)?.map((message: any, idx: number) => {
                    const prevMsg = idx > 0 ? (messagesQuery.data as any)[idx - 1] : null;
                    const showName = !message.isOwn && (!prevMsg || prevMsg.senderId !== message.senderId);

                    return (
                      <div key={message.id} className={cn("flex gap-2", message.isOwn ? "justify-end" : "justify-start")}>
                        {!message.isOwn && showName && (
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
                        {!message.isOwn && !showName && <div className="w-7 flex-shrink-0" />}

                        <div className="max-w-[70%]">
                          {showName && !message.isOwn && (
                            <p className="text-[10px] text-slate-500 mb-0.5 ml-1 font-medium">{message.senderName}</p>
                          )}
                          <div className={cn(
                            "rounded-2xl px-4 py-2.5",
                            message.isOwn
                              ? "bg-gradient-to-r from-[#1473FF] to-[#1473FF]/90 text-white rounded-br-md"
                              : "bg-slate-700/60 text-slate-100 rounded-bl-md"
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
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e: any) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700/30 border-slate-600/50 rounded-xl focus:border-purple-500/50 text-sm"
                    onKeyDown={(e: any) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className={cn(
                      "rounded-xl h-10 w-10 p-0 transition-all",
                      newMessage.trim()
                        ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white shadow-lg shadow-purple-500/20"
                        : "bg-slate-700 text-slate-500"
                    )}
                  >
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ═══ New Conversation Modal ═══ */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewConversation(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <h2 className="text-lg font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">New Conversation</h2>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowNewConversation(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            {/* User Search */}
            <div className="p-5">
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={userSearchTerm}
                  onChange={(e: any) => setUserSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-xl text-sm focus:border-purple-500/50"
                  autoFocus
                />
              </div>

              {/* User Results */}
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {usersQuery.isLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
                ) : (usersQuery.data as any)?.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">{userSearchTerm ? "No users found" : "Search for a user to message"}</p>
                  </div>
                ) : (
                  (usersQuery.data as any)?.map((user: any) => (
                    <button
                      key={user.id}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-all text-left"
                      onClick={() => handleStartConversation(user.id, user.name)}
                      disabled={createConversationMutation.isPending}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-400">{(user.name || "?")[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {user.email && <p className="text-slate-500 text-xs truncate">{user.email}</p>}
                          {user.role && (
                            <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 border", getRoleBadge(user.role))}>
                              {user.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Send className="w-4 h-4 text-slate-500" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {createConversationMutation.isPending && (
              <div className="px-5 pb-4 flex items-center gap-2 text-purple-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating conversation...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
