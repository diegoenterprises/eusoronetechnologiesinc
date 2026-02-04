/**
 * ESCORT COMMUNICATIONS PAGE
 * 100% Dynamic - Manage escort-driver communications during routes
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Search, Send, Phone, Radio,
  User, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortCommunications() {
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const conversationsQuery = trpc.escorts.getConversations.useQuery();
  const messagesQuery = trpc.escorts.getMessages.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );
  const activeJobQuery = trpc.escorts.getActiveJob.useQuery();

  const sendMessageMutation = trpc.escorts.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      messagesQuery.refetch();
      toast.success("Message sent");
    },
  });

  const conversations = conversationsQuery.data || [];
  const messages = messagesQuery.data || [];
  const activeJob = activeJobQuery.data;

  const filteredConversations = conversations.filter((c: any) =>
    c.participantName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      message: newMessage.trim(),
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Communications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Route communications and messaging</p>
        </div>
      </div>

      {/* Active Job Alert */}
      {activeJob && (
        <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              <div>
                <p className="text-white font-medium">Active Route: #{activeJob.routeNumber}</p>
                <p className="text-slate-400 text-sm">
                  Driver: {activeJob.driverName} • {activeJob.origin} to {activeJob.destination}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50 rounded-lg">
                <Phone className="w-4 h-4 mr-1" />Call Driver
              </Button>
              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                <Radio className="w-4 h-4 mr-1" />Push to Talk
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto h-[500px]">
            {conversationsQuery.isLoading ? (
              <div className="p-3 space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
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
                      selectedConversation === conv.id ? "bg-cyan-500/20" : "hover:bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        conv.isOnline ? "bg-green-500/20" : "bg-slate-600/50"
                      )}>
                        <User className={cn(
                          "w-5 h-5",
                          conv.isOnline ? "text-green-400" : "text-slate-400"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium truncate">{conv.participantName}</p>
                          <span className="text-slate-500 text-xs">{conv.lastMessageTime}</span>
                        </div>
                        <p className="text-slate-400 text-sm truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-cyan-500 text-white border-0 text-xs px-2">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="md:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Select a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {conversations.find((c: any) => c.id === selectedConversation)?.participantName}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {conversations.find((c: any) => c.id === selectedConversation)?.role}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <Phone className="w-4 h-4 mr-1" />Call
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10">
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
                        "max-w-[70%] rounded-lg p-3",
                        msg.isOwn ? "bg-cyan-600" : "bg-slate-700"
                      )}>
                        {msg.type === "alert" && (
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 text-xs font-medium">ALERT</span>
                          </div>
                        )}
                        <p className="text-white">{msg.content}</p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-slate-300/70 text-xs">{msg.timestamp}</span>
                          {msg.isOwn && msg.read && (
                            <CheckCircle className="w-3 h-3 text-cyan-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
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
