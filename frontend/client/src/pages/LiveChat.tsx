/**
 * LIVE CHAT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  MessageCircle, Send, User, Bot, Clock,
  CheckCircle, Paperclip, Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LiveChat() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatQuery = trpc.support.getChatSession.useQuery();
  const messagesQuery = trpc.support.getChatMessages.useQuery({ sessionId: chatQuery.data?.sessionId }, { enabled: !!chatQuery.data?.sessionId, refetchInterval: 3000 });

  const sendMutation = trpc.support.sendChatMessage.useMutation({
    onSuccess: () => { setMessage(""); messagesQuery.refetch(); },
    onError: (error) => toast.error("Failed to send", { description: error.message }),
  });

  const startChatMutation = trpc.support.startChatSession.useMutation({
    onSuccess: () => { chatQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const endChatMutation = trpc.support.endChatSession.useMutation({
    onSuccess: () => { toast.success("Chat ended"); chatQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  const session = chatQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Live Chat
          </h1>
          <p className="text-slate-400 text-sm mt-1">Chat with our support team</p>
        </div>
        {session?.active && (
          <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg" onClick={() => endChatMutation.mutate({ sessionId: session.sessionId })}>
            End Chat
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl flex-1 flex flex-col overflow-hidden">
        {chatQuery.isLoading ? (
          <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-3/4 rounded-xl" />)}
          </div>
        ) : !session?.active ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="p-4 rounded-full bg-cyan-500/20 w-fit mx-auto mb-4">
                <MessageCircle className="w-12 h-12 text-cyan-400" />
              </div>
              <p className="text-white text-xl font-bold mb-2">Start a Conversation</p>
              <p className="text-slate-400 mb-4">Connect with our support team for immediate assistance</p>
              <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => startChatMutation.mutate({})}>
                <MessageCircle className="w-4 h-4 mr-2" />Start Chat
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Agent Info */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                  {session.agent?.avatar ? <img src={session.agent.avatar} alt={session.agent.name} className="w-10 h-10 rounded-full" /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-white font-medium">{session.agent?.name || "Support Agent"}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="text-xs text-slate-400">Online</span>
                  </div>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesQuery.isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-3/4 rounded-xl" />)
              ) : messagesQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">No messages yet</p>
                  <p className="text-sm text-slate-500">Start the conversation!</p>
                </div>
              ) : (
                messagesQuery.data?.map((msg: any) => (
                  <div key={msg.id} className={cn("flex", msg.isUser ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] rounded-xl p-3", msg.isUser ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white" : "bg-slate-700/50 text-white")}>
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isUser && (msg.isBot ? <Bot className="w-4 h-4 text-cyan-400" /> : <User className="w-4 h-4 text-slate-400" />)}
                        <span className="text-xs opacity-70">{msg.sender}</span>
                      </div>
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <Clock className="w-3 h-3 opacity-50" />
                        <span className="text-xs opacity-50">{msg.timestamp}</span>
                        {msg.isUser && msg.read && <CheckCircle className="w-3 h-3 text-cyan-300" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg" onKeyDown={(e) => { if (e.key === "Enter" && message.trim()) { sendMutation.mutate({ sessionId: session.sessionId, content: message }); } }} />
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg" onClick={() => { if (message.trim()) sendMutation.mutate({ sessionId: session.sessionId, content: message }); }} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
