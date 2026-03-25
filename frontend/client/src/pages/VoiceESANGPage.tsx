/**
 * VOICE-FIRST ESANG INTERACTION PAGE (GAP-360)
 * Voice input via Web Speech API → ESANG AI → TTS response.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles,
  MessageCircle, ArrowRight, HelpCircle, Zap, Radio,
  Navigation, Package, Search, Shield, AlertTriangle,
  TrendingUp, Truck, CheckCircle, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type ConvoEntry = { role: "user" | "assistant"; text: string; spokenText?: string; intent?: string; timestamp: Date };

const INTENT_ICONS: Record<string, React.ReactNode> = {
  navigation: <Navigation className="w-3.5 h-3.5" />,
  load_action: <Package className="w-3.5 h-3.5" />,
  search: <Search className="w-3.5 h-3.5" />,
  status_check: <Clock className="w-3.5 h-3.5" />,
  rate_check: <TrendingUp className="w-3.5 h-3.5" />,
  compliance: <Shield className="w-3.5 h-3.5" />,
  hazmat: <AlertTriangle className="w-3.5 h-3.5" />,
  dispatch: <Truck className="w-3.5 h-3.5" />,
  tracking: <Radio className="w-3.5 h-3.5" />,
  help: <HelpCircle className="w-3.5 h-3.5" />,
  conversational: <MessageCircle className="w-3.5 h-3.5" />,
};

const INTENT_COLORS: Record<string, string> = {
  navigation: "text-blue-400", load_action: "text-emerald-400", search: "text-cyan-400",
  status_check: "text-amber-400", rate_check: "text-green-400", compliance: "text-purple-400",
  hazmat: "text-red-400", dispatch: "text-orange-400", tracking: "text-indigo-400",
  help: "text-slate-400", conversational: "text-violet-400",
};

export default function VoiceESANGPage() {
  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState<ConvoEntry[]>([]);
  const [tab, setTab] = useState<"voice" | "help">("voice");
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const commandsMutation = (trpc as any).voiceESANG?.processVoiceCommand?.useMutation?.({
    onSuccess: (data: any) => {
      const entry: ConvoEntry = { role: "assistant", text: data.text, spokenText: data.spokenText, intent: data.intent, timestamp: new Date() };
      setConversation(prev => [...prev, entry]);
      // Execute navigation actions
      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === "navigate" && action.payload?.path) {
            setTimeout(() => setLocation(action.payload.path), 1500);
          }
        }
      }
      // TTS
      if (ttsEnabled && data.spokenText && "speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(data.spokenText);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => {
          setIsSpeaking(false);
          if (data.shouldListen) startListening();
        };
        window.speechSynthesis.speak(utter);
      }
    },
  }) || { mutate: () => {}, isLoading: false };

  const helpQuery = (trpc as any).voiceESANG?.getCommandHelp?.useQuery?.() || { data: null };

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[0]?.isFinal) {
        setIsListening(false);
        processText(t);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const processText = (text: string) => {
    if (!text.trim()) return;
    const userEntry: ConvoEntry = { role: "user", text: text.trim(), timestamp: new Date() };
    setConversation(prev => [...prev, userEntry]);
    setTranscript("");
    setTextInput("");
    commandsMutation.mutate({ text: text.trim() });
  };

  const handleTextSubmit = () => { processText(textInput); };

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [conversation]);

  const hasSpeechAPI = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return (
    <div className="p-4 md:p-6 space-y-4 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            Voice ESANG
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Talk to ESANG — voice commands & AI conversation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className={cn("text-xs", ttsEnabled ? "text-cyan-400" : "text-slate-500")} onClick={() => { setTtsEnabled(!ttsEnabled); if (isSpeaking) window.speechSynthesis?.cancel(); }}>
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400"><Radio className="w-3 h-3 mr-1" />Voice AI</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit flex-shrink-0">
        <Button size="sm" variant={tab === "voice" ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === "voice" ? "bg-cyan-600" : "text-slate-400")} onClick={() => setTab("voice")}>
          <Mic className="w-3.5 h-3.5 mr-1" />Voice Chat
        </Button>
        <Button size="sm" variant={tab === "help" ? "default" : "ghost"} className={cn("rounded-md text-xs", tab === "help" ? "bg-blue-600" : "text-slate-400")} onClick={() => setTab("help")}>
          <HelpCircle className="w-3.5 h-3.5 mr-1" />Commands
        </Button>
      </div>

      {/* Voice Chat Tab */}
      {tab === "voice" && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Conversation */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
            {conversation.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 mb-4">
                  <Sparkles className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-lg font-semibold text-white">Hey, I'm ESANG</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">Tap the mic or type a command. I can navigate the app, search loads, check rates, and more.</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-md">
                  {["Find loads from Houston to Dallas", "What's my load status?", "Go to the dashboard", "Help"].map(s => (
                    <button key={s} onClick={() => processText(s)} className="px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/50 text-xs text-slate-300 hover:border-cyan-500/30 hover:text-white transition-all">
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {conversation.map((entry, i) => (
              <div key={i} className={cn("flex", entry.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", entry.role === "user" ? "bg-cyan-600/20 border border-cyan-500/20" : "bg-slate-800/70 border border-slate-700/50")}>
                  {entry.role === "assistant" && entry.intent && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={INTENT_COLORS[entry.intent] || "text-slate-400"}>{INTENT_ICONS[entry.intent] || <Zap className="w-3.5 h-3.5" />}</span>
                      <Badge variant="outline" className={cn("text-xs", INTENT_COLORS[entry.intent] || "text-slate-400")}>{entry.intent}</Badge>
                    </div>
                  )}
                  <p className="text-sm text-white whitespace-pre-wrap">{entry.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{entry.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}

            {commandsMutation.isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/70 border border-slate-700/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-400">ESANG is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {isListening && transcript && (
            <Card className="bg-cyan-500/5 border-cyan-500/20 rounded-xl flex-shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-cyan-400">Listening...</span>
                </div>
                <p className="text-sm text-white mt-1 italic">{transcript}</p>
              </CardContent>
            </Card>
          )}

          {/* Input Area */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasSpeechAPI && (
              <Button
                size="lg"
                className={cn(
                  "rounded-full w-14 h-14 flex-shrink-0 transition-all",
                  isListening
                    ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30"
                    : "bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                )}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            )}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Or type a command..."
                value={textInput}
                onChange={(e: any) => setTextInput(e.target.value)}
                onKeyDown={(e: any) => e.key === "Enter" && handleTextSubmit()}
                className="bg-slate-900/50 border-slate-700 text-white text-sm"
              />
              <Button onClick={handleTextSubmit} disabled={!textInput.trim() || commandsMutation.isLoading} className="bg-cyan-600">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 py-1 flex-shrink-0">
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400">ESANG is speaking...</span>
            </div>
          )}
        </div>
      )}

      {/* Help Tab */}
      {tab === "help" && helpQuery.data && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {helpQuery.data.map((cat: any) => (
            <Card key={cat.category} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white">{cat.category}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-1.5">
                  {cat.commands.map((cmd: any, i: number) => (
                    <button key={i} onClick={() => { setTab("voice"); processText(cmd.phrase); }} className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-700/30 hover:border-cyan-500/30 transition-all group">
                      <div>
                        <p className="text-xs text-cyan-300 font-mono group-hover:text-white transition-colors">"{cmd.phrase}"</p>
                        <p className="text-xs text-slate-500">{cmd.description}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
