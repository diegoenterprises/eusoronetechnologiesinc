/**
 * ESANG AI CHAT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Zap, Send, Loader2, User, Bot, Sparkles, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ESANGChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.esang.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const suggestionsQuery = trpc.esang.getSuggestions.useQuery();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate({ message: input, conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })) });
    setInput("");
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ESANG AI
            </h1>
            <p className="text-slate-400 text-sm">Your intelligent logistics assistant</p>
          </div>
        </div>
        <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={clearChat}>
          <RefreshCw className="w-4 h-4 mr-2" />New Chat
        </Button>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 bg-slate-800/50 border-slate-700/50 rounded-xl flex flex-col overflow-hidden">
        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 mb-6">
                <Sparkles className="w-12 h-12 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">How can I help you today?</h2>
              <p className="text-slate-400 max-w-md mb-6">
                Ask me about loads, routes, compliance, hazmat regulations, or anything else related to your operations.
              </p>
              
              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {suggestionsQuery.isLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
                ) : (
                  suggestionsQuery.data?.map((suggestion: string, idx: number) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-purple-500/50 rounded-xl text-left justify-start h-auto py-3 px-4"
                      onClick={() => handleSuggestion(suggestion)}
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <span className="text-slate-300">{suggestion}</span>
                    </Button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 h-fit">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] p-4 rounded-2xl",
                      message.role === "user"
                        ? "bg-cyan-600 text-white rounded-br-sm"
                        : "bg-slate-700/50 text-white rounded-bl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-50 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="p-2 rounded-full bg-slate-600 h-fit">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 h-fit">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask ESANG AI anything..."
              className="flex-1 bg-slate-700/30 border-slate-600/50 rounded-xl focus:border-purple-500/50 py-6"
              disabled={chatMutation.isPending}
            />
            <Button
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl px-6"
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
            >
              {chatMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
