/**
 * DRIVER MESSAGES PAGE
 * 100% Dynamic - In-app messaging for drivers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Send, Search, User, Clock,
  CheckCheck, AlertCircle, Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverMessages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  const conversationsQuery = (trpc as any).drivers.getAvailable.useQuery();
  const messagesQuery = (trpc as any).drivers.getAvailable.useQuery(
    undefined,
    { enabled: !!selectedConversation }
  );

  const sendMutation = (trpc as any).drivers.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      messagesQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to send", { description: error.message }),
  });

  const conversations = conversationsQuery.data || [];
  const messages = messagesQuery.data || [];

  const filteredConversations = conversations.filter((c: any) =>
    c.participantName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-120px)]">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-6">
        Messages
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-60px)]">
        {/* Conversations List */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
          <CardHeader className="pb-2 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[calc(100%-80px)]">
            {conversationsQuery.isLoading ? (
              <div className="p-3 space-y-2">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No conversations</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredConversations.map((conv: any) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={cn(
                      "p-3 cursor-pointer transition-colors",
                      selectedConversation === conv.id ? "bg-slate-700/50" : "hover:bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium truncate">{conv.participantName}</p>
                          <span className="text-slate-500 text-xs">{conv.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-slate-400 text-sm truncate">{conv.lastMessage}</p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-cyan-500 text-white border-0 text-xs ml-2">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <CardHeader className="pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {(conversations.find((c: any) => c.id === selectedConversation) as any)?.participantName || (conversations.find((c: any) => c.id === selectedConversation) as any)?.name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {(conversations.find((c: any) => c.id === selectedConversation) as any)?.participantRole || "Driver"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages List */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[70%] p-3 rounded-xl",
                        msg.isOwn ? "bg-cyan-600 text-white" : "bg-slate-700 text-white"
                      )}>
                        <p className="text-sm">{msg.content}</p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          msg.isOwn ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-xs opacity-70">{msg.timestamp}</span>
                          {msg.isOwn && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-white" />
                            ) : (
                              <Clock className="w-3 h-3 opacity-70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e: any) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
                    onKeyPress={(e: any) => {
                      if (e.key === "Enter" && newMessage.trim()) {
                        sendMutation.mutate({
                          driverId: selectedConversation || "",
                          message: newMessage,
                        });
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (newMessage.trim()) {
                        sendMutation.mutate({
                          driverId: selectedConversation || "",
                          message: newMessage,
                        });
                      }
                    }}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700 rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
