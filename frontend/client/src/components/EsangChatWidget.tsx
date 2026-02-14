/**
 * ESANG AI CHAT WIDGET — Bottom-right corner chat panel
 * Activated by clicking the floating ESANG button
 * Styled like the mobile app: gradient user bubbles, dark AI bubbles
 * Supports text, voice (Web Speech API), and file/image upload
 * Theme-aware: light & dark mode
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { renderChatMarkdown } from "@/lib/renderChatMarkdown";
import {
  Send, Mic, MicOff, Paperclip, X, Maximize2,
  ChevronDown, Trash2, Bot, User, Image as ImageIcon,
  Loader2, ArrowRight, Beaker, Shield, MapPin, FileText
} from "lucide-react";
import { EsangIcon } from "@/components/EsangIcon";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface EsangChatWidgetProps {
  open: boolean;
  onClose: () => void;
  dissolving?: boolean;
}

export default function EsangChatWidget({ open, onClose, dissolving }: EsangChatWidgetProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [lastActions, setLastActions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const utils = trpc.useUtils();
  const historyQuery = (trpc as any).esang.getChatHistory.useQuery(undefined, { enabled: open });

  const sendMutation = (trpc as any).esang.chat.useMutation({
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message || data.response || "I'm here to help!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      if (data.actions?.length > 0) setLastActions(data.actions);
      (utils as any).esang.getChatHistory.invalidate();
    },
    onError: (error: any) => {
      toast.error("ESANG AI Error", { description: error.message });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I'm experiencing a temporary issue. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    },
  });

  const clearMutation = (trpc as any).esang.clearHistory.useMutation({
    onSuccess: () => { setMessages([]); setLastActions([]); toast.success("Chat cleared"); (utils as any).esang.getChatHistory.invalidate(); },
  });

  useEffect(() => {
    if (historyQuery.data && historyQuery.data.length > 0) {
      setMessages(historyQuery.data.map((m: any) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
      })));
    }
  }, [historyQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    setMessages(prev => [...prev, {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
    sendMutation.mutate({ message: text, context: { currentPage: location } });
    setMessage("");
  }, [message, sendMutation]);

  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Voice not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + (prev ? " " : "") + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const prefix = file.type.startsWith("image/")
        ? `[Uploaded image: ${file.name}]\n\nPlease analyze this image.`
        : `[Uploaded file: ${file.name}]\n\nPlease analyze this file.`;
      setMessages(prev => [...prev, {
        role: "user",
        content: prefix,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      sendMutation.mutate({ message: prefix });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [sendMutation]);

  const role = (user?.role || "SHIPPER").toUpperCase();
  const quickPrompts = (() => {
    // Context-aware prompts based on current page
    const page = location.toLowerCase();
    if (page.includes("wallet") || page.includes("payment") || page.includes("finance")) {
      return [
        { icon: <Beaker className="w-3.5 h-3.5" />, text: "Analyze my finances" },
        { icon: <FileText className="w-3.5 h-3.5" />, text: "Cash flow forecast" },
        { icon: <Shield className="w-3.5 h-3.5" />, text: "Spending insights" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "Payment recommendations" },
      ];
    }
    if (page.includes("zeun") || page.includes("mechanic") || page.includes("breakdown") || page.includes("maintenance")) {
      return [
        { icon: <Shield className="w-3.5 h-3.5" />, text: "Diagnose my truck issue" },
        { icon: <Beaker className="w-3.5 h-3.5" />, text: "Look up a fault code" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "Find repair shops nearby" },
        { icon: <FileText className="w-3.5 h-3.5" />, text: "Maintenance schedule help" },
      ];
    }
    if (page.includes("message") || page.includes("chat") || page.includes("channel")) {
      return [
        { icon: <Beaker className="w-3.5 h-3.5" />, text: "Suggest a reply" },
        { icon: <FileText className="w-3.5 h-3.5" />, text: "Summarize conversation" },
        { icon: <Shield className="w-3.5 h-3.5" />, text: "Draft a professional message" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "Help negotiate this deal" },
      ];
    }
    if (page.includes("haul") || page.includes("gamif") || page.includes("mission") || page.includes("badge")) {
      return [
        { icon: <Beaker className="w-3.5 h-3.5" />, text: "Generate missions for me" },
        { icon: <Shield className="w-3.5 h-3.5" />, text: "How do I level up faster?" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "What badges can I earn?" },
        { icon: <FileText className="w-3.5 h-3.5" />, text: "Leaderboard tips" },
      ];
    }
    if (page.includes("agreement") || page.includes("contract")) {
      return [
        { icon: <Beaker className="w-3.5 h-3.5" />, text: "Help draft an agreement" },
        { icon: <Shield className="w-3.5 h-3.5" />, text: "Review clause for compliance" },
        { icon: <FileText className="w-3.5 h-3.5" />, text: "Explain FMCSA requirements" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "Standard payment terms" },
      ];
    }
    if (page.includes("load") || page.includes("bid") || page.includes("marketplace") || page.includes("job")) {
      return [
        { icon: <Beaker className="w-3.5 h-3.5" />, text: "Analyze this rate" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "Find loads for me" },
        { icon: <Shield className="w-3.5 h-3.5" />, text: "Check bid fairness" },
        { icon: <FileText className="w-3.5 h-3.5" />, text: "ERG hazmat lookup" },
      ];
    }
    // Default role-based prompts
    const shared = [
      { icon: <FileText className="w-3.5 h-3.5" />, text: "Compliance help" },
    ];
    switch (role) {
      case "DRIVER":
        return [
          { icon: <MapPin className="w-3.5 h-3.5" />, text: "Nearby gas stations" },
          { icon: <Shield className="w-3.5 h-3.5" />, text: "Diagnose my truck issue" },
          { icon: <Beaker className="w-3.5 h-3.5" />, text: "Look up a fault code" },
          ...shared,
        ];
      case "CATALYST":
        return [
          { icon: <Shield className="w-3.5 h-3.5" />, text: "ERG hazmat lookup" },
          { icon: <Beaker className="w-3.5 h-3.5" />, text: "Analyze a rate" },
          { icon: <MapPin className="w-3.5 h-3.5" />, text: "Find available loads" },
          ...shared,
        ];
      case "BROKER":
        return [
          { icon: <MapPin className="w-3.5 h-3.5" />, text: "Find catalysts" },
          { icon: <Beaker className="w-3.5 h-3.5" />, text: "Analyze lane rate" },
          { icon: <Shield className="w-3.5 h-3.5" />, text: "Market pricing" },
          ...shared,
        ];
      default:
        return [
          { icon: <MapPin className="w-3.5 h-3.5" />, text: "Track my shipments" },
          { icon: <Beaker className="w-3.5 h-3.5" />, text: "Identify a product" },
          { icon: <Shield className="w-3.5 h-3.5" />, text: "ERG hazmat lookup" },
          ...shared,
        ];
    }
  })();

  // Shared styles
  const panelBg = isLight
    ? "bg-white border-slate-200 shadow-2xl shadow-slate-300/50"
    : "bg-[#0d1224] border-slate-700/50 shadow-2xl shadow-black/50";
  const headerBg = isLight
    ? "bg-gradient-to-r from-slate-50 to-white border-b border-slate-200"
    : "bg-gradient-to-r from-[#161d35] to-[#0d1224] border-b border-slate-700/50";
  const inputBg = isLight
    ? "bg-slate-100 border-slate-200 text-slate-800 placeholder:text-slate-400"
    : "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500";

  return (
    <AnimatePresence>
      {open && (
        <>
        {/* SVG gradient definition for icon strokes */}
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="esangIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1473FF" />
              <stop offset="100%" stopColor="#BE01FF" />
            </linearGradient>
          </defs>
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={dissolving
            ? { opacity: 0, scale: 0.15, filter: 'blur(12px)', y: 0 }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
          }
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={dissolving
            ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
            : { duration: 0.25, ease: 'easeOut' }
          }
          className={cn(
            "fixed bottom-24 right-6 z-50 w-[380px] h-[560px] rounded-2xl border overflow-hidden flex flex-col",
            panelBg
          )}
          style={{ transformOrigin: 'bottom right' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn("px-4 py-3 flex items-center justify-between flex-shrink-0 relative", headerBg)}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img src="/esang-ai-logo.svg" alt="Esang AI" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Centered title */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className={cn("text-base font-semibold tracking-[0.15em] lowercase", isLight ? "text-slate-800" : "text-white")} style={{ fontFamily: "'Inter', 'Gilroy', system-ui, sans-serif", letterSpacing: '0.15em' }}>esang</p>
              <p className="text-[9px] text-green-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Online
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => clearMutation.mutate()}
                className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100" : "hover:bg-white/10")}
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ stroke: "url(#esangIconGrad)" }} />
              </button>
              <button
                onClick={() => {
                  if (location !== '/esang' && location !== '/ai-assistant') {
                    sessionStorage.setItem('esang-prev-page', location);
                  }
                  onClose();
                  navigate("/esang");
                }}
                className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100" : "hover:bg-white/10")}
                title="Open full chat"
              >
                <Maximize2 className="w-3.5 h-3.5" style={{ stroke: "url(#esangIconGrad)" }} />
              </button>
              <button
                onClick={onClose}
                className={cn("p-1.5 rounded-lg transition-colors", isLight ? "hover:bg-slate-100" : "hover:bg-white/10")}
              >
                <ChevronDown className="w-4 h-4" style={{ stroke: "url(#esangIconGrad)" }} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className={cn("flex-1 overflow-y-auto px-4 py-3 space-y-3", isLight ? "bg-slate-50/50" : "bg-transparent")}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center mb-3 overflow-hidden">
                  <img src="/esang-ai-logo.svg" alt="ESANG AI" className="w-10 h-10 object-contain" />
                </div>
                <p className={cn("font-bold text-base mb-1", isLight ? "text-slate-800" : "text-white")}>
                  Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                </p>
                <p className={cn("text-xs mb-4", isLight ? "text-slate-500" : "text-slate-400")}>
                  I'm ESANG AI. Ask me about loads, hazmat, compliance, routes, pricing, or anything logistics.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => { setMessage(qp.text); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all text-left",
                        isLight
                          ? "bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50"
                          : "bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-purple-500/50 hover:bg-purple-500/10"
                      )}
                    >
                      <span className="text-purple-400">{qp.icon}</span>
                      {qp.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Today label */}
                <div className="flex justify-center">
                  <span className={cn(
                    "text-[10px] px-3 py-0.5 rounded-full",
                    isLight ? "bg-slate-200 text-slate-500" : "bg-slate-800 text-slate-500"
                  )}>
                    Today
                  </span>
                </div>

                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                    {/* esang label for AI messages */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <EsangIcon className="w-3 h-3 text-purple-400" />
                        <span className={cn("text-[10px] font-medium", isLight ? "text-slate-500" : "text-slate-500")}>esang</span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white rounded-br-md"
                          : isLight
                            ? "bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm"
                            : "bg-slate-800/70 border border-slate-700/30 text-slate-200 rounded-bl-md"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.role === "assistant" ? renderChatMarkdown(msg.content) : msg.content}</div>
                    </div>
                    {msg.timestamp && (
                      <span className="text-[9px] text-slate-500 mt-0.5 mx-2">{msg.timestamp}</span>
                    )}
                    {/* Action buttons on last AI message */}
                    {msg.role === "assistant" && lastActions.length > 0 && i === messages.length - 1 && (
                      <div className="flex flex-wrap gap-1 mt-1 ml-1">
                        {lastActions.map((action: any, ai: number) => (
                          <button
                            key={ai}
                            className={cn(
                              "text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                              isLight
                                ? "border-purple-200 text-purple-600 hover:bg-purple-50"
                                : "border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {sendMutation.isPending && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <EsangIcon className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] text-slate-500 font-medium">esang</span>
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl rounded-bl-md",
                      isLight ? "bg-white border border-slate-200" : "bg-slate-800/70 border border-slate-700/30"
                    )}>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input bar */}
          <div className={cn("px-3 py-2.5 flex-shrink-0 border-t", isLight ? "bg-white border-slate-200" : "bg-[#0d1224] border-slate-700/50")}>
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn("p-2 rounded-full transition-colors flex-shrink-0", isLight ? "hover:bg-slate-100" : "hover:bg-white/10")}
                title="Attach file or image"
              >
                <Paperclip className="w-4 h-4" style={{ stroke: "url(#esangIconGrad)" }} />
              </button>
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type Your message....."
                className={cn("flex-1 text-sm bg-transparent outline-none border-none", isLight ? "text-slate-800 placeholder:text-slate-400" : "text-white placeholder:text-slate-500")}
              />
              <button
                onClick={toggleVoice}
                className={cn(
                  "p-2 rounded-full transition-colors flex-shrink-0",
                  isListening
                    ? "bg-red-500/20 text-red-400"
                    : isLight ? "text-slate-400 hover:bg-slate-100" : "text-slate-500 hover:bg-white/10"
                )}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSend}
                disabled={sendMutation.isPending || !message.trim()}
                className={cn(
                  "p-2 rounded-full transition-all flex-shrink-0",
                  message.trim()
                    ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white shadow-lg shadow-purple-500/25"
                    : ""
                )}
              >
                <Send className="w-4 h-4" style={!message.trim() ? { stroke: "url(#esangIconGrad)" } : undefined} />
              </button>
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
