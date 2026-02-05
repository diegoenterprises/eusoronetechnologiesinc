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
  Sparkles, Send, User, Bot, Trash2,
  MessageSquare, Lightbulb, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ESANGChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const historyQuery = (trpc as any).esang.getChatHistory.useQuery();
  const suggestionsQuery = (trpc as any).esang.getSuggestions.useQuery();

  const sendMutation = (trpc as any).esang.chat.useMutation({
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const clearMutation = (trpc as any).esang.clearHistory.useMutation({
    onSuccess: () => { setMessages([]); toast.success("Chat cleared"); },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages(prev => [...prev, { role: "user", content: message }]);
      sendMutation.mutate({ message });
      setMessage("");
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            ESANG AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your intelligent logistics assistant</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700 rounded-lg" onClick={() => clearMutation.mutate()}>
          <Trash2 className="w-4 h-4 mr-2" />Clear Chat
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl flex-1 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {historyQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-purple-500/20 mb-4">
                  <Sparkles className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-white font-bold text-xl mb-2">Hello! I'm ESANG AI</p>
                <p className="text-slate-400 max-w-md">I can help you with load recommendations, hazmat classification, compliance questions, and more. How can I assist you today?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: any, i: number) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="p-2 rounded-full bg-purple-500/20 h-fit">
                        <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                    )}
                    <div className={cn("max-w-[70%] p-4 rounded-2xl", msg.role === "user" ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white" : "bg-slate-700/50 text-slate-200")}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="p-2 rounded-full bg-cyan-500/20 h-fit">
                        <User className="w-5 h-5 text-cyan-400" />
                      </div>
                    )}
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full bg-purple-500/20 h-fit">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex gap-2">
              <Input value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Ask ESANG anything..." className="bg-slate-700/50 border-slate-600/50 rounded-lg" onKeyDown={(e: any) => e.key === "Enter" && !e.shiftKey && handleSend()} />
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg" onClick={handleSend} disabled={sendMutation.isPending || !message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="w-72 space-y-4 hidden lg:block">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-400" />Suggestions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {suggestionsQuery.isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (
                (suggestionsQuery.data as any)?.map((suggestion: string, i: number) => (
                  <Button key={i} variant="outline" className="w-full justify-start text-left text-xs bg-slate-700/30 border-slate-600/50 hover:bg-slate-700 rounded-lg h-auto py-2" onClick={() => handleSuggestion(suggestion)}>
                    {suggestion}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4 text-cyan-400" />Capabilities</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-400">
              <p>- Load recommendations</p>
              <p>- Hazmat classification</p>
              <p>- ERG 2024 lookup</p>
              <p>- Bid fairness analysis</p>
              <p>- Compliance guidance</p>
              <p>- Route optimization</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
