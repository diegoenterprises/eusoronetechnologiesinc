/**
 * ESANG AI CHAT PAGE
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
import { useLocation } from "wouter";
import {
  Sparkles, Send, User, Bot, Trash2,
  MessageSquare, Lightbulb, HelpCircle, Beaker,
  Target, Brain, Shield, Flame, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ESANGChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [lastActions, setLastActions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const historyQuery = (trpc as any).esang.getChatHistory.useQuery();
  const suggestionsQuery = (trpc as any).esang.getSuggestions.useQuery();
  const learningStatsQuery = (trpc as any).spectraMatch.getLearningStats.useQuery();

  const sendMutation = (trpc as any).esang.chat.useMutation({
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.response }]);
      if (data.actions?.length > 0) setLastActions(data.actions);
      if (data.suggestions?.length > 0) {
        // Suggestions are handled via the sidebar
      }
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const handleAction = (action: any) => {
    switch (action.type) {
      case "spectra_match":
        navigate("/spectra-match");
        break;
      case "verify_product":
        navigate("/terminal/scada");
        break;
      case "create_load":
        navigate("/shipper/load-wizard");
        break;
      case "erg_lookup":
        navigate("/erg");
        break;
      case "check_compliance":
        navigate("/compliance/audit-dashboard");
        break;
      default:
        break;
    }
  };

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
                      {msg.role === "assistant" && lastActions.length > 0 && i === messages.length - 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-600/30">
                          {lastActions.map((action: any, ai: number) => (
                            <Button
                              key={ai}
                              size="sm"
                              variant="outline"
                              className={cn(
                                "text-xs h-7 rounded-full",
                                action.type === "spectra_match" || action.type === "verify_product"
                                  ? "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                  : "border-slate-600 text-slate-300 hover:bg-slate-700"
                              )}
                              onClick={() => handleAction(action)}
                            >
                              {(action.type === "spectra_match" || action.type === "verify_product") && <Beaker className="w-3 h-3 mr-1" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
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
              <div className="pt-2 border-t border-slate-700/50 mt-2">
                <p className="text-purple-400 font-medium flex items-center gap-1"><Beaker className="w-3 h-3" /> SPECTRA-MATCH™</p>
                <p>- Product identification</p>
                <p>- Crude oil analysis</p>
                <p>- Safety info</p>
                <p>- Market context</p>
              </div>
            </CardContent>
          </Card>

          {/* SPECTRA-MATCH Learning Stats */}
          <Card className="bg-gradient-to-br from-purple-500/5 to-cyan-500/5 border-purple-500/30 rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Learning
                <Badge className="bg-purple-500/20 text-purple-400 border-0 text-[9px] ml-auto">AI</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {learningStatsQuery.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Identifications</span>
                    <span className="text-cyan-400 font-bold">{learningStatsQuery.data?.totalIdentifications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Avg Confidence</span>
                    <span className="text-green-400 font-bold">{learningStatsQuery.data?.avgConfidence || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Trend</span>
                    <span className={cn("font-bold text-xs",
                      learningStatsQuery.data?.recentTrend === "Improving" ? "text-green-400" : "text-yellow-400"
                    )}>{learningStatsQuery.data?.recentTrend || "--"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-xs h-7 mt-1"
                    onClick={() => navigate("/spectra-match")}
                  >
                    <Target className="w-3 h-3 mr-1" />Open SPECTRA-MATCH
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
