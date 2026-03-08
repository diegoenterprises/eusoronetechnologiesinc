/**
 * VOICE-FIRST ESANG INTERACTION SERVICE (GAP-360)
 * Voice input → transcription → intent → ESANG AI → TTS-optimized response
 */

export type VoiceCategory =
  | "navigation" | "load_action" | "search" | "status_check"
  | "rate_check" | "compliance" | "hazmat" | "dispatch"
  | "tracking" | "report" | "help" | "conversational";

export interface VoiceIntentResult {
  intent: VoiceCategory;
  confidence: number;
  matchedCommand: string | null;
  entities: Record<string, string>;
  requiresConfirmation: boolean;
  suggestedResponse: string;
}

export interface VoiceResponse {
  text: string;
  spokenText: string;
  intent: VoiceCategory;
  confidence: number;
  actions: { type: string; label: string; payload?: any }[];
  suggestions: string[];
  shouldListen: boolean;
}

interface CmdDef { id: string; cat: VoiceCategory; patterns: RegExp[]; resp: string; confirm: boolean }

const CMDS: CmdDef[] = [
  { id: "nav_dashboard", cat: "navigation", patterns: [/go to (?:the )?dashboard/i, /show (?:me )?(?:the )?dashboard/i], resp: "Opening the dashboard now.", confirm: false },
  { id: "nav_loads", cat: "navigation", patterns: [/go to (?:the )?loads?/i, /show (?:me )?(?:the )?load ?board/i], resp: "Opening the load board.", confirm: false },
  { id: "nav_tracking", cat: "navigation", patterns: [/go to (?:the )?tracking/i, /show (?:me )?(?:the )?fleet/i, /open (?:the )?map/i], resp: "Opening fleet tracking.", confirm: false },
  { id: "nav_messages", cat: "navigation", patterns: [/check (?:my )?messages/i, /open (?:the )?inbox/i], resp: "Opening your messages.", confirm: false },
  { id: "create_load", cat: "load_action", patterns: [/create (?:a )?(?:new )?load/i, /post (?:a )?load/i], resp: "Starting load creation. What are the details?", confirm: false },
  { id: "find_load", cat: "search", patterns: [/find (?:a )?load/i, /search (?:for )?loads/i, /available loads/i], resp: "Searching for loads now.", confirm: false },
  { id: "load_status", cat: "status_check", patterns: [/status (?:of )?(?:load|shipment)/i, /where (?:is )?(?:my )?load/i, /track (?:my )?load/i], resp: "Let me check your load status.", confirm: false },
  { id: "check_rate", cat: "rate_check", patterns: [/rate (?:from|for)/i, /how much (?:to ship|for)/i, /price (?:for|from)/i], resp: "Looking up rates for that lane.", confirm: false },
  { id: "compliance_check", cat: "compliance", patterns: [/compliance (?:status|check)/i, /expiring (?:documents?|license)/i, /hos (?:hours|status)/i], resp: "Checking compliance status.", confirm: false },
  { id: "hazmat_lookup", cat: "hazmat", patterns: [/hazmat (?:guide|response)/i, /erg (?:guide|lookup)/i, /un number/i], resp: "Looking up the ERG guide.", confirm: false },
  { id: "dispatch_load", cat: "dispatch", patterns: [/dispatch (?:load|driver)/i, /assign (?:driver|carrier)/i], resp: "Let me help with dispatching.", confirm: true },
  { id: "get_help", cat: "help", patterns: [/help/i, /what can you do/i, /voice commands/i], resp: "Here's what I can help with.", confirm: false },
];

export function classifyVoiceIntent(text: string): VoiceIntentResult {
  const lower = text.toLowerCase();
  for (const cmd of CMDS) {
    for (const p of cmd.patterns) {
      if (p.test(lower)) {
        const entities: Record<string, string> = {};
        const fromTo = lower.match(/from\s+(\w+)\s+to\s+(\w+)/);
        if (fromTo) { entities.origin = fromTo[1]; entities.destination = fromTo[2]; }
        const loadRef = lower.match(/load\s+#?(\d+)/);
        if (loadRef) entities.loadId = loadRef[1];
        return { intent: cmd.cat, confidence: 0.9, matchedCommand: cmd.id, entities, requiresConfirmation: cmd.confirm, suggestedResponse: cmd.resp };
      }
    }
  }
  return { intent: "conversational", confidence: 0.5, matchedCommand: null, entities: {}, requiresConfirmation: false, suggestedResponse: "Let me think about that." };
}

export function formatForTTS(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);
}

export function buildVoiceResponse(
  fullText: string,
  intent: VoiceIntentResult,
): VoiceResponse {
  const suggestions: string[] = [];
  if (intent.intent === "navigation") suggestions.push("Go back", "Show me more");
  else if (intent.intent === "search") suggestions.push("Narrow results", "Sort by rate", "Show on map");
  else if (intent.intent === "status_check") suggestions.push("Get ETA", "Contact driver", "View details");
  else if (intent.intent === "load_action") suggestions.push("Add stops", "Set rate", "Assign carrier");
  else suggestions.push("Tell me more", "What else can you do?");

  const actions: VoiceResponse["actions"] = [];
  if (intent.matchedCommand?.startsWith("nav_")) {
    const pathMap: Record<string, string> = { nav_dashboard: "/", nav_loads: "/loads", nav_tracking: "/fleet-tracking", nav_messages: "/messages" };
    const path = pathMap[intent.matchedCommand];
    if (path) actions.push({ type: "navigate", label: `Go to ${intent.matchedCommand.replace("nav_", "")}`, payload: { path } });
  }
  if (intent.matchedCommand === "create_load") actions.push({ type: "navigate", label: "Open load creator", payload: { path: "/nl-load-creator" } });

  return {
    text: fullText,
    spokenText: formatForTTS(fullText),
    intent: intent.intent,
    confidence: intent.confidence,
    actions,
    suggestions,
    shouldListen: intent.intent !== "navigation",
  };
}

export function getVoiceCommandHelp(): { category: string; commands: { phrase: string; description: string }[] }[] {
  return [
    { category: "Navigation", commands: [
      { phrase: "Go to the dashboard", description: "Open main dashboard" },
      { phrase: "Show me the load board", description: "Open load board" },
      { phrase: "Open fleet tracking", description: "View fleet map" },
      { phrase: "Check my messages", description: "Open inbox" },
    ]},
    { category: "Load Management", commands: [
      { phrase: "Create a new load", description: "Start load creation wizard" },
      { phrase: "Find loads from Houston to Dallas", description: "Search available loads" },
      { phrase: "What's the status of my load?", description: "Check load tracking" },
      { phrase: "Dispatch load to driver", description: "Assign carrier/driver" },
    ]},
    { category: "Intelligence", commands: [
      { phrase: "What's the rate from Chicago to Atlanta?", description: "Get lane rate estimate" },
      { phrase: "Check compliance status", description: "View expiring docs/HOS" },
      { phrase: "ERG guide for UN1203", description: "Hazmat emergency response" },
      { phrase: "Help", description: "Show available commands" },
    ]},
  ];
}
