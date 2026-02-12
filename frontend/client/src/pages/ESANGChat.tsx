/**
 * ESANG AI CHAT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
import { useTheme } from "@/contexts/ThemeContext";

export default function ESANGChat() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [lastActions, setLastActions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const [dissolving, setDissolving] = useState(false);
  const [dissolveParticles, setDissolveParticles] = useState<Array<{startX: number; startY: number; delay: number; size: number; color: string; dur: number}>>([]);

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

  // Listen for dissolution trigger from floating button
  useEffect(() => {
    const handler = () => {
      const colors = isLight
        ? ['#0D5FE3', '#9B00D4', '#7C3AED', '#4F46E5', '#9333EA']
        : ['#1473FF', '#BE01FF', '#8B5CF6', '#6366F1', '#A855F7'];
      setDissolveParticles(
        Array.from({ length: 40 }, () => ({
          startX: 100 + Math.random() * (window.innerWidth - 300),
          startY: 50 + Math.random() * (window.innerHeight - 200),
          delay: Math.random() * 0.3,
          size: 3 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          dur: 0.4 + Math.random() * 0.4,
        }))
      );
      setDissolving(true);
    };
    window.addEventListener('esang-dissolve', handler);
    return () => window.removeEventListener('esang-dissolve', handler);
  }, [isLight]);

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
    <>
    <motion.div
      className="p-4 md:p-6 space-y-4 h-[calc(100vh-180px)] flex flex-col overflow-hidden"
      style={{ transformOrigin: 'bottom right' }}
      animate={dissolving ? { opacity: 0, scale: 0.15, filter: 'blur(12px)' } : {}}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn("text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent flex items-center gap-2", isLight ? "from-purple-600 to-pink-600" : "from-purple-400 to-pink-400")}>
            <Sparkles className={cn("w-8 h-8", isLight ? "text-purple-600" : "text-purple-400")} />
            ESANG AI
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>Your intelligent logistics assistant</p>
        </div>
        <Button variant="outline" className={cn("rounded-lg", isLight ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-700" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700")} onClick={() => clearMutation.mutate()}>
          <Trash2 className="w-4 h-4 mr-2" />Clear Chat
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <Card className={cn("rounded-xl flex-1 flex flex-col", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {historyQuery.isLoading ? (
              <div className="space-y-4">{[1, 2, 3].map((i: any) => <Skeleton key={i} className={cn("h-20 w-full rounded-xl", isLight ? "bg-slate-100" : "")} />)}</div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-purple-500/20 mb-4">
                  <Sparkles className={cn("w-12 h-12", isLight ? "text-purple-600" : "text-purple-400")} />
                </div>
                <p className={cn("font-bold text-xl mb-2", isLight ? "text-slate-800" : "text-white")}>Hello! I'm ESANG AI</p>
                <p className={cn("max-w-md", isLight ? "text-slate-500" : "text-slate-400")}>I can help you with load recommendations, hazmat classification, compliance questions, and more. How can I assist you today?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: any, i: number) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="p-2 rounded-full bg-purple-500/20 h-fit">
                        <Bot className={cn("w-5 h-5", isLight ? "text-purple-600" : "text-purple-400")} />
                      </div>
                    )}
                    <div className={cn("max-w-[70%] p-4 rounded-2xl", msg.role === "user" ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white" : isLight ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-slate-700/50 text-slate-200")}>
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
                                  : isLight ? "border-slate-300 text-slate-600 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700"
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
                      <div className={cn("p-2 rounded-full h-fit", isLight ? "bg-blue-500/10" : "bg-cyan-500/20")}>
                        <User className={cn("w-5 h-5", isLight ? "text-blue-600" : "text-cyan-400")} />
                      </div>
                    )}
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full bg-purple-500/20 h-fit">
                      <Bot className={cn("w-5 h-5", isLight ? "text-purple-600" : "text-purple-400")} />
                    </div>
                    <div className={cn("p-4 rounded-2xl", isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-700/50")}>
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
          <div className={cn("p-4 border-t", isLight ? "border-slate-200" : "border-slate-700/50")}>
            <div className="flex gap-2">
              <Input value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Ask ESANG anything..." className={cn("rounded-lg", isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-700/50 border-slate-600/50")} onKeyDown={(e: any) => e.key === "Enter" && !e.shiftKey && handleSend()} />
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg" onClick={handleSend} disabled={sendMutation.isPending || !message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="w-72 space-y-4 hidden lg:flex lg:flex-col flex-shrink-0 overflow-y-auto">
          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><Lightbulb className="w-4 h-4 text-yellow-400" />Suggestions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {suggestionsQuery.isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i: any) => <Skeleton key={i} className={cn("h-10 w-full rounded-lg", isLight ? "bg-slate-100" : "")} />)}</div>
              ) : (
                (suggestionsQuery.data as any)?.map((suggestion: string, i: number) => (
                  <Button key={i} variant="outline" className={cn("w-full justify-start text-left text-xs rounded-lg h-auto py-2", isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700" : "bg-slate-700/30 border-slate-600/50 hover:bg-slate-700")} onClick={() => handleSuggestion(suggestion)}>
                    {suggestion}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={cn("rounded-xl", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/50 border-slate-700/50")}>
            <CardHeader className="pb-3"><CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}><HelpCircle className="w-4 h-4 text-cyan-400" />Capabilities</CardTitle></CardHeader>
            <CardContent className={cn("space-y-2 text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
              <p>- Load recommendations</p>
              <p>- Hazmat classification</p>
              <p>- ERG 2024 lookup</p>
              <p>- Bid fairness analysis</p>
              <p>- Compliance guidance</p>
              <p>- Route optimization</p>
              <div className={cn("pt-2 border-t mt-2", isLight ? "border-slate-200" : "border-slate-700/50")}>
                <p className={cn("font-medium flex items-center gap-1", isLight ? "text-purple-600" : "text-purple-400")}><Beaker className="w-3 h-3" /> SPECTRA-MATCH™</p>
                <p>- Product identification</p>
                <p>- Crude oil analysis</p>
                <p>- Safety info</p>
                <p>- Market context</p>
              </div>
            </CardContent>
          </Card>

          {/* SPECTRA-MATCH Learning Stats */}
          <Card className={cn("bg-gradient-to-br rounded-xl", isLight ? "from-purple-50 to-cyan-50 border-purple-200 shadow-sm" : "from-purple-500/5 to-cyan-500/5 border-purple-500/30")}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
                <Brain className={cn("w-4 h-4", isLight ? "text-purple-600" : "text-purple-400")} />
                Learning
                <Badge className={cn("border-0 text-[9px] ml-auto", isLight ? "bg-purple-100 text-purple-600" : "bg-purple-500/20 text-purple-400")}>AI</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {learningStatsQuery.isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>Identifications</span>
                    <span className={cn("font-bold", isLight ? "text-cyan-600" : "text-cyan-400")}>{learningStatsQuery.data?.totalIdentifications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>Avg Confidence</span>
                    <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">{learningStatsQuery.data?.avgConfidence || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>Trend</span>
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
    </motion.div>

    {/* Dissolution particle effect */}
    {dissolving && (
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {dissolveParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: isLight
                ? `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}40`
                : `0 0 ${p.size * 2}px ${p.color}`,
            }}
            initial={{ left: p.startX, top: p.startY, opacity: 1, scale: 1 }}
            animate={{
              left: window.innerWidth - 50,
              top: window.innerHeight - 50,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              ease: [0.6, 0, 0.2, 1],
            }}
          />
        ))}
      </div>
    )}
    </>
  );
}
