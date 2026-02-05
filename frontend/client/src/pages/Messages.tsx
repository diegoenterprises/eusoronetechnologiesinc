/**
 * MESSAGES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare, Search, Send, Users, Clock, CheckCircle, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const conversationsQuery = (trpc as any).messages.getConversations.useQuery();
  const messagesQuery = (trpc as any).messages.getMessages.useQuery(
    { conversationId: selectedConversation! },
    { enabled: !!selectedConversation }
  );

  const unreadCount = (conversationsQuery.data as any)?.filter((c: any) => c.unread > 0).length || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-slate-400 text-sm mt-1">Communicate with carriers, shippers, and drivers</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <span className="text-blue-400 text-sm font-medium">Unread</span>
              <span className="text-blue-400 font-bold">{unreadCount}</span>
            </div>
          )}
          <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
            <Plus className="w-4 h-4 mr-2" />New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversations List */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-700/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-340px)]">
            {conversationsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (conversationsQuery.data as any)?.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(conversationsQuery.data as any)?.map((conversation: any) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      selectedConversation === conversation.id 
                        ? "bg-cyan-500/20 border-l-2 border-cyan-500" 
                        : "hover:bg-slate-700/30"
                    )}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{conversation.participantName}</p>
                      <span className="text-xs text-slate-500">{conversation.lastMessageTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400 truncate max-w-[180px]">{conversation.lastMessage}</p>
                      {conversation.unread > 0 && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">{conversation.unread}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-slate-400 text-lg">Select a conversation</p>
                <p className="text-slate-500 text-sm mt-1">Choose a conversation to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {(conversationsQuery.data as any)?.find((c: any) => c.id === selectedConversation)?.participantName}
                    </p>
                    <p className="text-xs text-slate-500">Online</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />)}</div>
                ) : (messagesQuery.data as any)?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No messages yet</p>
                    <p className="text-slate-500 text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  (messagesQuery.data as any)?.map((message: any) => (
                    <div key={message.id} className={cn("flex", message.isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] p-3 rounded-xl",
                        message.isMe 
                          ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white" 
                          : "bg-slate-700/50 text-white"
                      )}>
                        <p>{message.content}</p>
                        <p className={cn("text-xs mt-1", message.isMe ? "text-white/70" : "text-slate-500")}>{message.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e: any) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700/30 border-slate-600/50 rounded-lg focus:border-cyan-500/50"
                  />
                  <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
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
