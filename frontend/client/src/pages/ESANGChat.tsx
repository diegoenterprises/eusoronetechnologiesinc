/**
 * ESANG AI™ CHAT PAGE
 * Intelligent Assistant for EusoTrip - Powered by Gemini API
 * ERG2024 Emergency Response + Load Management + Compliance
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Send, User, AlertTriangle, Phone, Flame, Droplets,
  Shield, Heart, MapPin, Clock, RefreshCw, Zap, Truck,
  FileText, Search, ChevronRight, Sparkles, CircleAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ergLookup } from "@/services/ergLookup";
import { HAZARD_CLASS_COLORS } from "@/data/erg2024Types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  ergData?: any;
  isLoading?: boolean;
}

const QUICK_ACTIONS = [
  { label: "UN Number Lookup", prompt: "Look up UN number ", icon: <Search className="w-4 h-4" /> },
  { label: "Emergency Response", prompt: "Emergency response for ", icon: <AlertTriangle className="w-4 h-4" /> },
  { label: "Protective Distances", prompt: "Protective action distances for ", icon: <MapPin className="w-4 h-4" /> },
  { label: "First Aid", prompt: "First aid for exposure to ", icon: <Heart className="w-4 h-4" /> },
];

const SAMPLE_QUERIES = [
  "What is UN 1203?",
  "Emergency response for chlorine spill",
  "Protective distances for ammonia large spill at night",
  "What PPE for sulfuric acid?",
  "First aid for propane exposure",
  "Guide 128 procedures",
];

export default function ESANGChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `# Welcome to ESANG AI™

I'm your intelligent assistant for hazardous materials logistics. I can help you with:

- **Material Identification** - Look up UN/NA numbers and material names
- **Emergency Response** - Get ERG 2024 guide procedures
- **Protective Distances** - Calculate evacuation zones (TIH materials)
- **First Aid** - Emergency medical procedures
- **Compliance** - DOT/FMCSA regulatory guidance

**Safety First**: Always approach from UPWIND, UPHILL, UPSTREAM.

How can I help you today?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processMessage = async (userMessage: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Process the query
    const response = await processESANGQuery(userMessage);

    // Add assistant response
    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.message,
      timestamp: new Date(),
      ergData: response.ergData,
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput("");
    await processMessage(message);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleSampleQuery = (query: string) => {
    processMessage(query);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              ESANG AI™
              <Badge className="bg-green-500/20 text-green-400 text-xs">Online</Badge>
            </h1>
            <p className="text-sm text-slate-400">Emergency Response + Logistics Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-400">
            <Phone className="w-4 h-4 mr-2" />
            CHEMTREC: 1-800-424-9300
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 bg-slate-800/50 border-slate-700 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="border-t border-slate-700 p-3 bg-slate-800/30">
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_ACTIONS.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.prompt)}
                className="border-slate-600 text-slate-400 hover:bg-slate-700"
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hazmat, ERG guides, compliance..."
              className="flex-1 bg-slate-700/50 border-slate-600 text-white"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>

      {/* Sample Queries */}
      <div className="mt-4">
        <p className="text-xs text-slate-500 mb-2">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((query, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="sm"
              onClick={() => handleSampleQuery(query)}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              "{query}"
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-slate-600" 
          : "bg-gradient-to-br from-blue-500 to-purple-600"
      )}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={cn(
        "max-w-[80%] rounded-lg p-4",
        isUser ? "bg-blue-600/20 text-blue-100" : "bg-slate-700/50 text-slate-200"
      )}>
        {/* Render markdown-like content */}
        <div className="prose prose-sm prose-invert max-w-none">
          {message.content.split('\n').map((line, idx) => {
            if (line.startsWith('# ')) {
              return <h2 key={idx} className="text-lg font-bold text-white mt-0 mb-2">{line.slice(2)}</h2>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={idx} className="text-md font-semibold text-white mt-3 mb-1">{line.slice(3)}</h3>;
            }
            if (line.startsWith('### ')) {
              return <h4 key={idx} className="text-sm font-semibold text-slate-300 mt-2 mb-1">{line.slice(4)}</h4>;
            }
            if (line.startsWith('- **')) {
              const match = line.match(/- \*\*(.+?)\*\*(.*)$/);
              if (match) {
                return (
                  <p key={idx} className="my-1">
                    <span className="font-semibold text-white">{match[1]}</span>
                    {match[2]}
                  </p>
                );
              }
            }
            if (line.startsWith('- ')) {
              return <p key={idx} className="my-1 pl-4">• {line.slice(2)}</p>;
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={idx} className="font-bold text-white my-1">{line.slice(2, -2)}</p>;
            }
            if (line.startsWith('[WARNING]') || line.startsWith('[ALERT]')) {
              return (
                <div key={idx} className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2 my-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-yellow-200">{line.replace('[WARNING]', '').replace('[ALERT]', '').trim()}</span>
                </div>
              );
            }
            if (line.startsWith('[OK]')) {
              return (
                <div key={idx} className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded p-2 my-2">
                  <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-green-200">{line.replace('[OK]', '').trim()}</span>
                </div>
              );
            }
            if (line.trim() === '') return <br key={idx} />;
            return <p key={idx} className="my-1">{line}</p>;
          })}
        </div>

        {/* ERG Data Display */}
        {message.ergData?.guide && (
          <ERGGuideCard guide={message.ergData.guide} material={message.ergData.material} />
        )}

        <p className="text-xs text-slate-500 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function ERGGuideCard({ guide, material }: { guide: any; material?: any }) {
  return (
    <Card className="mt-4 bg-slate-800/50 border-slate-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-400" />
          ERG Guide {guide.number}: {guide.title}
        </CardTitle>
        {material && (
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-blue-500/20 text-blue-400">UN {material.un_number}</Badge>
            <Badge className={cn(
              "text-xs",
              HAZARD_CLASS_COLORS[parseInt(material.hazard_class)]?.bg || "bg-slate-500"
            )}>
              Class {material.hazard_class}
            </Badge>
            {material.is_tih && (
              <Badge className="bg-red-500/20 text-red-400">TIH</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Isolation Distances */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-slate-700/50">
            <p className="text-slate-400">Initial Isolation</p>
            <p className="text-white font-medium">
              {guide.public_safety?.isolation_distance?.meters}m ({guide.public_safety?.isolation_distance?.feet}ft)
            </p>
          </div>
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
            <p className="text-slate-400">Fire Isolation</p>
            <p className="text-red-400 font-medium">
              {guide.public_safety?.fire_isolation_distance?.meters}m ({guide.public_safety?.fire_isolation_distance?.feet}ft)
            </p>
          </div>
        </div>

        {/* Hazards */}
        <div>
          <p className="text-slate-400 mb-1 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Fire/Explosion Hazards
          </p>
          <ul className="space-y-1 text-slate-300">
            {guide.potential_hazards?.fire_explosion?.slice(0, 3).map((h: string, i: number) => (
              <li key={i} className="pl-2">• {h}</li>
            ))}
          </ul>
        </div>

        {/* Health Hazards */}
        <div>
          <p className="text-slate-400 mb-1 flex items-center gap-1">
            <Heart className="w-3 h-3" /> Health Hazards
          </p>
          <ul className="space-y-1 text-slate-300">
            {guide.potential_hazards?.health?.slice(0, 3).map((h: string, i: number) => (
              <li key={i} className="pl-2">• {h}</li>
            ))}
          </ul>
        </div>

        {/* First Aid */}
        <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
          <p className="text-green-400 font-medium mb-1">First Aid</p>
          <p className="text-slate-300">{guide.emergency_response?.first_aid}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Process ESANG query and return response
async function processESANGQuery(query: string): Promise<{ message: string; ergData?: any }> {
  const lowerQuery = query.toLowerCase();
  
  // Check for UN number lookup
  const unMatch = query.match(/UN\s*(\d{4})/i) || query.match(/(\d{4})/);
  if (unMatch) {
    const result = ergLookup.lookupByUN(unMatch[1]);
    if (result && result.guide) {
      return {
        message: `## Material Identified: ${result.material.name}

**UN Number:** ${result.material.un_number}
**Hazard Class:** ${result.material.hazard_class}
**ERG Guide:** ${result.guide.number}
${result.material.is_tih ? '\n[WARNING] TOXIC INHALATION HAZARD - Requires protective action distances!' : ''}

### Emergency Response Summary:

**Initial Isolation:** ${result.guide.public_safety?.isolation_distance?.meters}m (${result.guide.public_safety?.isolation_distance?.feet}ft)
**Fire Isolation:** ${result.guide.public_safety?.fire_isolation_distance?.meters}m (${result.guide.public_safety?.fire_isolation_distance?.feet}ft)

**PPE:** ${result.guide.public_safety?.protective_clothing}

**Emergency Contacts:**
- CHEMTREC: 1-800-424-9300
- NRC: 1-800-424-8802`,
        ergData: result,
      };
    }
  }

  // Check for material name lookup
  const materialKeywords = ["gasoline", "diesel", "propane", "ammonia", "chlorine", "sulfuric", "hydrochloric", "methanol", "ethanol", "hydrogen", "oxygen", "nitrogen", "crude", "benzene", "toluene", "xylene", "kerosene", "lng", "lpg", "natural gas"];
  
  for (const keyword of materialKeywords) {
    if (lowerQuery.includes(keyword)) {
      const result = ergLookup.lookupByName(keyword);
      if (result && result.guide) {
        const isTIH = result.material?.is_tih;
        const distances = isTIH ? ergLookup.getProtectiveDistances(result.material.un_number) : null;
        
        let distanceInfo = "";
        if (distances) {
          distanceInfo = `

### Protective Action Distances (TIH Material):

| Spill Size | Day | Night |
|------------|-----|-------|
| Small (≤55 gal) | ${distances.small_spill.day.meters}m | ${distances.small_spill.night.meters}m |
| Large (>55 gal) | ${distances.large_spill.day.meters}m | ${distances.large_spill.night.meters}m |`;
        }

        return {
          message: `## Material Identified: ${result.material.name}

**UN Number:** ${result.material.un_number}
**Hazard Class:** ${result.material.hazard_class}
**ERG Guide:** ${result.guide.number}
${isTIH ? '\n[WARNING] TOXIC INHALATION HAZARD!' : ''}
${distanceInfo}

### Emergency Response:

**Isolation:** ${result.guide.public_safety?.isolation_distance?.meters}m initially
**Fire Isolation:** ${result.guide.public_safety?.fire_isolation_distance?.meters}m

**Fire Response:**
- Small: ${result.guide.emergency_response?.fire?.small?.join("; ")}
- Large: ${result.guide.emergency_response?.fire?.large?.join("; ")}

**Spill Response:**
${result.guide.emergency_response?.spill_leak?.general?.slice(0, 3).map((s: string) => `- ${s}`).join("\n")}

**Call CHEMTREC: 1-800-424-9300**`,
          ergData: result,
        };
      }
    }
  }

  // Check for guide number lookup
  const guideMatch = query.match(/guide\s*(\d+)/i);
  if (guideMatch) {
    const guide = ergLookup.getGuide(parseInt(guideMatch[1]));
    if (guide) {
      return {
        message: `## ERG Guide ${guide.number}: ${guide.title}

${guide.description}

### Potential Hazards:

**Fire/Explosion:**
${guide.potential_hazards?.fire_explosion?.map((h: string) => `- ${h}`).join("\n")}

**Health:**
${guide.potential_hazards?.health?.map((h: string) => `- ${h}`).join("\n")}

### Emergency Response:

**Fire - Small:** ${guide.emergency_response?.fire?.small?.join("; ")}
**Fire - Large:** ${guide.emergency_response?.fire?.large?.join("; ")}

**Spill/Leak:**
${guide.emergency_response?.spill_leak?.general?.map((s: string) => `- ${s}`).join("\n")}

**First Aid:** ${guide.emergency_response?.first_aid}`,
        ergData: { guide },
      };
    }
  }

  // Default response with Guide 111
  const guide111 = ergLookup.getGuide(111);
  return {
    message: `I'll help you with that query about "${query}".

[WARNING] If you're dealing with an unknown material, use **Guide 111** (Mixed Load/Unidentified Cargo) and exercise maximum caution.

**Key Safety Points:**
- Approach from UPWIND, UPHILL, UPSTREAM
- Initial isolation: 100m (330ft)
- Fire isolation: 800m (2640ft)
- Wear positive pressure SCBA

**To get specific information, try:**
- "UN 1203" - Lookup by UN number
- "Gasoline emergency response" - Lookup by material name
- "Guide 128 procedures" - Get guide details

**Emergency Contacts:**
- CHEMTREC: 1-800-424-9300
- CANUTEC: 1-888-226-8832
- NRC: 1-800-424-8802`,
    ergData: guide111 ? { guide: guide111 } : undefined,
  };
}
