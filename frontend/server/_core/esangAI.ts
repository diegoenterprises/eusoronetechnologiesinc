/**
 * ESANG AI™ Intelligence Layer
 * EusoTrip's Integrated AI Assistant
 * Powered by Google Gemini API
 */

import { ENV } from "./env";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ESANGResponse {
  message: string;
  suggestions?: string[];
  actions?: ESANGAction[];
  context?: Record<string, unknown>;
}

export interface ESANGAction {
  type: "navigate" | "create_load" | "find_carrier" | "get_quote" | "check_compliance" | "erg_lookup";
  label: string;
  data?: Record<string, unknown>;
}

export interface LoadMatchRequest {
  origin: string;
  destination: string;
  cargoType: string;
  weight?: number;
  hazmat?: boolean;
  unNumber?: string;
}

export interface ERGLookupRequest {
  unNumber?: string;
  materialName?: string;
  guideNumber?: number;
}

export interface ERGResponse {
  guideNumber: number;
  materialName: string;
  hazardClass: string;
  isolationDistance: { meters: number; feet: number };
  fireIsolation: { meters: number; feet: number };
  hazards: {
    fire: string[];
    health: string[];
  };
  response: {
    fire: { small: string; large: string; tank: string };
    spill: { actions: string[]; small: string; large: string };
    firstAid: string;
  };
  emergencyContacts: { name: string; phone: string }[];
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `You are ESANG AI™, the intelligent assistant for EusoTrip - a hazardous materials logistics platform. You help users with:

1. **Load Posting & Management**: Help shippers create loads, set requirements, and find carriers
2. **Carrier Matching**: Match loads with qualified, certified carriers based on equipment, certifications, and performance
3. **Route Optimization**: Provide optimal routes considering HazMat restrictions, weather, and traffic
4. **Compliance Assistance**: Help with DOT/FMCSA compliance, HOS tracking, and regulatory requirements
5. **ERG 2024 Emergency Response**: Provide emergency response guidance for hazardous materials
6. **Bid Analysis**: Analyze market rates and provide fair pricing recommendations
7. **Safety Protocols**: Advise on PPE, handling procedures, and safety best practices

Always be helpful, accurate, and safety-focused. When dealing with hazardous materials, prioritize safety above all else.

User roles include: SHIPPER, CARRIER, BROKER, DRIVER, CATALYST (hazmat specialist), ESCORT, TERMINAL_MANAGER, COMPLIANCE_OFFICER, SAFETY_MANAGER, ADMIN.

Respond concisely and provide actionable information. Use markdown formatting for clarity.`;

class ESANGAIService {
  private apiKey: string;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.apiKey = ENV.geminiApiKey || "";
    if (!this.apiKey) {
      console.warn("[ESANG AI] Gemini API key not configured");
    }
  }

  /**
   * Send a chat message to ESANG AI
   */
  async chat(
    userId: string,
    message: string,
    context?: { role?: string; currentPage?: string; loadId?: string }
  ): Promise<ESANGResponse> {
    // Get or create conversation history
    let history = this.conversationHistory.get(userId) || [];
    
    // Add user message to history
    history.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Build context-aware prompt
    let contextPrompt = "";
    if (context?.role) {
      contextPrompt += `\nUser role: ${context.role}`;
    }
    if (context?.currentPage) {
      contextPrompt += `\nCurrent page: ${context.currentPage}`;
    }
    if (context?.loadId) {
      contextPrompt += `\nViewing load ID: ${context.loadId}`;
    }

    try {
      const response = await this.callGeminiAPI(message, history, contextPrompt);
      
      // Add assistant response to history
      history.push({
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      });

      // Keep only last 20 messages
      if (history.length > 20) {
        history = history.slice(-20);
      }
      this.conversationHistory.set(userId, history);

      return response;
    } catch (error) {
      console.error("[ESANG AI] Error:", error);
      return {
        message: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        suggestions: ["Try again", "Contact support"],
      };
    }
  }

  /**
   * Call Gemini API directly
   */
  private async callGeminiAPI(
    message: string,
    history: ChatMessage[],
    contextPrompt: string
  ): Promise<ESANGResponse> {
    if (!this.apiKey) {
      return {
        message: "ESANG AI is not configured. Please set up the Gemini API key.",
        suggestions: ["Configure API key in settings"],
      };
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPT + contextPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "I understand. I'm ESANG AI, ready to assist with EusoTrip logistics operations. How can I help you today?" }],
      },
      // Add conversation history
      ...history.slice(-10).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[ESANG AI] Gemini API error:", error);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

    // Extract any suggested actions from the response
    const actions = this.extractActions(text);
    const suggestions = this.extractSuggestions(text);

    return {
      message: text,
      suggestions,
      actions,
    };
  }

  /**
   * Extract actionable items from AI response
   */
  private extractActions(text: string): ESANGAction[] {
    const actions: ESANGAction[] = [];

    if (text.toLowerCase().includes("create a load") || text.toLowerCase().includes("post a load")) {
      actions.push({ type: "create_load", label: "Create New Load" });
    }
    if (text.toLowerCase().includes("find carrier") || text.toLowerCase().includes("search carrier")) {
      actions.push({ type: "find_carrier", label: "Find Carriers" });
    }
    if (text.toLowerCase().includes("erg guide") || text.toLowerCase().includes("emergency response")) {
      actions.push({ type: "erg_lookup", label: "Open ERG Guide" });
    }
    if (text.toLowerCase().includes("compliance") || text.toLowerCase().includes("regulation")) {
      actions.push({ type: "check_compliance", label: "Check Compliance" });
    }

    return actions;
  }

  /**
   * Extract follow-up suggestions
   */
  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];

    if (text.includes("?")) {
      suggestions.push("Tell me more");
    }
    if (text.toLowerCase().includes("load")) {
      suggestions.push("View my loads", "Create new load");
    }
    if (text.toLowerCase().includes("hazmat") || text.toLowerCase().includes("hazardous")) {
      suggestions.push("ERG lookup", "Safety requirements");
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get load matching recommendations
   */
  async getLoadRecommendations(request: LoadMatchRequest): Promise<ESANGResponse> {
    const prompt = `Analyze this load and provide carrier matching recommendations:
Origin: ${request.origin}
Destination: ${request.destination}
Cargo Type: ${request.cargoType}
${request.weight ? `Weight: ${request.weight} lbs` : ""}
${request.hazmat ? `HazMat: Yes, UN${request.unNumber}` : "HazMat: No"}

Provide:
1. Recommended equipment types
2. Required certifications
3. Estimated transit time
4. Rate range estimate
5. Any special considerations`;

    return this.chat("system", prompt, { role: "SYSTEM" });
  }

  /**
   * ERG 2024 Emergency Response Lookup
   */
  async ergLookup(request: ERGLookupRequest): Promise<ESANGResponse> {
    const prompt = `Provide ERG 2024 emergency response guidance for:
${request.unNumber ? `UN Number: ${request.unNumber}` : ""}
${request.materialName ? `Material: ${request.materialName}` : ""}
${request.guideNumber ? `Guide Number: ${request.guideNumber}` : ""}

Include:
1. Guide number and title
2. Hazard class
3. Isolation distances
4. Fire response procedures
5. Spill response procedures
6. First aid measures
7. Emergency contacts (CHEMTREC, etc.)`;

    return this.chat("system", prompt, { role: "SYSTEM" });
  }

  /**
   * Bid fairness analysis
   */
  async analyzeBid(
    loadDetails: { origin: string; destination: string; miles: number; cargoType: string },
    bidAmount: number
  ): Promise<ESANGResponse> {
    const prompt = `Analyze this bid for fairness:
Route: ${loadDetails.origin} → ${loadDetails.destination}
Distance: ${loadDetails.miles} miles
Cargo Type: ${loadDetails.cargoType}
Bid Amount: $${bidAmount}
Rate per Mile: $${(bidAmount / loadDetails.miles).toFixed(2)}

Provide:
1. Market rate comparison (is this fair?)
2. Rate trend for this lane
3. Recommendation (accept/counter/reject)
4. Suggested counter-offer if applicable`;

    return this.chat("system", prompt, { role: "SYSTEM" });
  }

  /**
   * Compliance check
   */
  async checkCompliance(
    entityType: "driver" | "carrier" | "vehicle",
    entityId: string
  ): Promise<ESANGResponse> {
    const prompt = `Perform a compliance check for ${entityType} ${entityId}.
List any potential compliance issues, expired documents, upcoming renewals, and recommendations for maintaining full compliance with DOT/FMCSA regulations.`;

    return this.chat("system", prompt, { role: "COMPLIANCE_OFFICER" });
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }
}

export const esangAI = new ESANGAIService();
export default esangAI;
