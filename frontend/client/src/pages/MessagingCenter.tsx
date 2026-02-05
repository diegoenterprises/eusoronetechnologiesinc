/**
 * MESSAGING CENTER PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Send, Search, Phone, Video, MoreVertical,
  User, Users, Paperclip, Image, Smile, Check, CheckCheck,
  Circle, AlertTriangle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MessagingCenter() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = (trpc as any).messages.getConversations.useQuery({ search: searchTerm || undefined });
  const messagesQuery = (trpc as any).messages.getMessages.useQuery(
    { conversationId: selectedConversation || "" },
    { enabled: !!selectedConversation, refetchInterval: 5000 }
  );

  const sendMessageMutation = (trpc as any).messages.send.useMutation({
    onSuccess: () => { setMessageText(""); messagesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to send", { description: error.message }),
  });

  const markAsReadMutation = (trpc as any).messages.markAsRead.useMutation({
    onSuccess: () => conversationsQuery.refetch(),
  });

  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate({ conversationId: selectedConversation });
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  // Auto-select first conversation
  useEffect(() => {
    if ((conversationsQuery.data as any)?.length && !selectedConversation) {
      setSelectedConversation(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedConversation]);

  if (conversationsQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading messages</p>
        <Button className="mt-4" onClick={() => conversationsQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const selectedConv = (conversationsQuery.data as any)?.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({ conversationId: selectedConversation, content: messageText });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9 bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (conversationsQuery.data as any)?.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No conversations</p>
            </div>
          ) : (
            (conversationsQuery.data as any)?.map((conv: any) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/30 transition-colors border-b border-slate-700/50",
                  selectedConversation === conv.id && "bg-slate-700/50"
                )}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    {conv.type === "group" ? <Users className="w-6 h-6 text-slate-400" /> : <User className="w-6 h-6 text-slate-400" />}
                  </div>
                  {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-800" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn("font-medium truncate", conv.unreadCount > 0 ? "text-white" : "text-slate-300")}>{conv.name}</p>
                    <span className="text-xs text-slate-500">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "text-slate-300" : "text-slate-500")}>{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-blue-500 text-white text-xs ml-2">{conv.unreadCount}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  {selectedConv?.type === "group" ? <Users className="w-5 h-5 text-slate-400" /> : <User className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedConv?.name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedConv?.online ? <span className="text-green-400">Online</span> : "Offline"}
                    {selectedConv?.role && ` - ${selectedConv.role}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm"><Phone className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Video className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-3/4" />)}</div>
              ) : (messagesQuery.data as any)?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                (messagesQuery.data as any)?.map((message: any) => (
                  <div key={message.id} className={cn("flex", message.isOwn ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%]", message.isOwn ? "order-2" : "order-1")}>
                      {!message.isOwn && (
                        <p className="text-xs text-slate-500 mb-1">{message.senderName}</p>
                      )}
                      <div className={cn(
                        "rounded-2xl px-4 py-2",
                        message.isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-700 text-white rounded-bl-sm"
                      )}>
                        <p>{message.content}</p>
                      </div>
                      <div className={cn("flex items-center gap-1 mt-1", message.isOwn ? "justify-end" : "justify-start")}>
                        <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                        {message.isOwn && (
                          message.read ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Check className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm"><Paperclip className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Image className="w-4 h-4" /></Button>
                <Input
                  value={messageText}
                  onChange={(e: any) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-700/50 border-slate-600"
                  onKeyDown={(e: any) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                />
                <Button variant="ghost" size="sm"><Smile className="w-4 h-4" /></Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
