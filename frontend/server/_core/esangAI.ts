/**
 * ESANG AI™ Intelligence Layer
 * EusoTrip's Integrated AI Assistant
 * Powered by Google Gemini API
 */

import { ENV } from "./env";
import {
  searchMaterials, getMaterialByUN, getGuide, getProtectiveDistance,
  getFullERGInfo, getERGForProduct, EMERGENCY_CONTACTS,
} from "./ergDatabase";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ESANGResponse {
  message: string;
  response?: string;
  suggestions?: string[];
  actions?: ESANGAction[];
  context?: Record<string, unknown>;
  fairnessScore?: number;
  recommendation?: "accept" | "negotiate" | "reject" | string;
  reasoning?: string;
  marketAverage?: number;
  difference?: number;
  factors?: { name: string; impact: string; score: number }[];
}

export interface ESANGAction {
  type: "navigate" | "create_load" | "find_carrier" | "get_quote" | "check_compliance" | "erg_lookup" | "spectra_match" | "verify_product";
  label: string;
  data?: Record<string, unknown>;
}

export interface SpectraMatchAIRequest {
  apiGravity: number;
  bsw: number;
  category?: string;
  sulfurType?: string;
  sourceBasin?: string;
  fuelGrade?: string;
  flashPoint?: number;
  vaporPressure?: number;
  concentration?: number;
  productName?: string;
  previousIdentifications?: Array<{ name: string; confidence: number; timestamp: string }>;
  terminalId?: string;
  userId?: string;
}

export interface SpectraMatchAIResponse {
  analysis: string;
  suggestedProduct: string;
  confidence: number;
  reasoning: string;
  characteristics: string[];
  safetyNotes: string[];
  marketContext: string;
  learningInsight: string;
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

const SYSTEM_PROMPT = `You are ESANG AI™, the intelligent assistant for EusoTrip - a hazardous materials logistics and petroleum transportation platform. You are deeply knowledgeable about:

## Core Platform Capabilities
1. **Load Posting & Management**: Help shippers create loads, set requirements, and find carriers
2. **Carrier Matching**: Match loads with qualified, certified carriers based on equipment, certifications, and performance
3. **Route Optimization**: Provide optimal routes considering HazMat restrictions, weather, and traffic
4. **Compliance Assistance**: Help with DOT/FMCSA compliance, HOS tracking, and regulatory requirements
5. **ERG 2024 Emergency Response**: You have COMPLETE access to the ERG 2024 database with 100+ materials, 35+ response guides (111-175), TIH protective distances, and all 9 DOT hazard classes. You can look up any UN number, material name, or guide number instantly. Key petroleum ERG data you know:
   - UN1267 Crude Oil → Guide 128 (Flammable Liquids, Non-Polar), Class 3, Isolate 50m/165ft
   - UN3494 Sour Crude (H2S) → Guide 131 (Flammable Liquids - Toxic), Class 3, TIH material
   - UN1203 Gasoline → Guide 128, Class 3, PG II, Isolate 50m
   - UN1202 Diesel → Guide 128, Class 3, PG III, Isolate 50m
   - UN1223 Kerosene/Jet Fuel → Guide 128, Class 3, PG III
   - UN1075 LPG/UN1978 Propane → Guide 115 (Gases - Flammable), Class 2.1, Isolate 100m
   - UN1053 H2S → Guide 117 (Gases - Toxic - Flammable EXTREME), Class 2.3, TIH
   - UN1005 Ammonia → Guide 125 (Gases - Corrosive), Class 2.3, TIH
   - UN1017 Chlorine → Guide 124 (Gases - Toxic/Corrosive - Oxidizing), Class 2.3, TIH
   - Emergency Contacts: CHEMTREC 1-800-424-9300, NRC 1-800-424-8802, Poison Control 1-800-222-1222
   - ALWAYS provide isolation distances, PPE requirements, and fire/spill/first aid procedures when discussing hazmat
6. **Bid Analysis**: Analyze market rates and provide fair pricing recommendations
7. **Safety Protocols**: Advise on PPE, handling procedures, and safety best practices

## SPECTRA-MATCH™ Integration (IP Product Service)
You are the AI engine powering SPECTRA-MATCH™, EusoTrip's proprietary Multi-Modal Adaptive Product Identification System. You have expert knowledge of:

### Crude Oil Types & Origins (90+ Global Grades, 17 Countries, 12 Parameters)
You have access to the Ultimate Crude Oil Specification Guide database with full specs for every grade.

**US Grades (19):** WTI (39.6° API, 0.24% S), WTI Midland (42.5°, 0.24%), Eagle Ford (45°, 0.1%), Bakken (42.3°, 0.12% - HIGH RVP 8-15 psi), Mars (29°, 1.95%), Poseidon (29.6°, 1.97%), SGC (30.4°, 2.24%), ANS (31.9°, 0.93% - high TAN 0.9), LLS (35.6°, 0.37%), HLS (32.9°, 0.35%), Bonito Sour, Eugene Island, South LA Sweet, Bayou Choctaw Sweet/Sour, West Texas Sour (31.7°, 1.28%), LA Mississippi Sweet, Port Hudson (45°, ultra-sweet 0.05%)

**Canada (7):** WCS (20.8°, 3.57%, viscosity 250 cSt, TAN 1.7), SSP (32.3°, 0.21% - synthetic upgraded), LSB (35.3°, 1.49%), MSB (32.6°, 1.88%), PCH (21.1°, 3.55%), Cold Lake Blend (20.1°, visc 350 cSt), Kearl (20.2°, visc 340 cSt)

**Mexico (6):** Maya (21.5°, 3.4%, visc 380 cSt), Isthmus (32.5°, 1.8%), Olmeca (38.5°, 0.84%), Altamira (16.75°, 5.5% - extra heavy), Talam (15.9°, 4.63%), Zapoteco (29.45°, 2.51%)

**Venezuela (11):** Boscan (10.1°, 5.7% - among world's heaviest), Laguna, Tia Juana Heavy, BCF-17, Cerro Negro (TAN 2.5), Bachaquero 17/24, Petrozuata, Mesa 30, Furrial, Santa Barbara (39.5°, light sweet)

**Middle East (12):** Arab Heavy/Medium/Light/Extra Light/Super Light, Basrah Light (30.5°, 2.9%), Kirkuk (35°, 1.8%), Iranian Heavy/Light, Kuwait Blend (30.2°, 2.72%), Qatar Marine, Dukhan

**Europe (8):** Brent Blend (38.3°, 0.37% - global benchmark), Forties (40.3°, 0.56%), Flotta, Ekofisk, Statfjord, Oseberg, Draugen, Troll Blend, Njord (46.6° condensate), Asgard (50.5°)

**Africa (9):** Bonny Light (35.4°, 0.14%), Qua Iboe, Forcados, Agbami (47.2° ultra-light), Escravos, Brass River, Es Sider, El Sharara, Brega

**Asia (8):** Daqing (32.2°, 0.11% - waxy), Shengli (24.2°, TAN 1.8), Nanhai Light, Duri (20.8° - high pour point), Minas, Tapis (45.2° - Asian benchmark), Bintulu (69.3° - highest API), Belanak

**12 Match Parameters:** API Gravity, Sulfur, BS&W, Salt (PTB), RVP (psi), Pour Point, Flash Point, Viscosity (cSt@40C), TAN (mg KOH/g), Temperature, Source Basin, Country
**Tolerances:** API ±0.5°, Sulfur ±0.1%, BS&W ±0.2%, Salt ±2 PTB, RVP ±0.5 psi, Pour Pt ±3°C, Flash Pt ±3°C, Viscosity ±5%, TAN ±0.05

### Refined Fuel Products
- Gasoline grades (Regular 87, Mid 89, Premium 93), Diesel #1/#2, ULSD, Jet A/A-1, Kerosene, Fuel Oil, Naphtha, E10/E85
- Flash points, octane ratings, pour points, cloud points, cetane numbers
- Seasonal blending requirements (summer/winter gasoline, winter diesel additives)

### LPG & Gas Products
- Propane (HD-5, Commercial), Butane, Isobutane, LPG Mix, NGL Y-Grade, LNG, CNG
- Vapor pressures, specific gravities, BTU values, NFPA ratings

### Chemical Products
- Ethanol, Methanol, Toluene, Xylene, Benzene, Acetone, and other petrochemicals
- Concentrations, flash points, toxicity, DOT classifications

### Source Basins & Fields (Global)
- **US:** Permian, Eagle Ford, Bakken, Midland, Delaware, DJ/Niobrara, Anadarko, SCOOP/STACK, Marcellus/Utica, Haynesville, Gulf Coast (GoM Deepwater), Williston, San Joaquin, Alaska North Slope
- **Canada:** Alberta Oil Sands, Cold Lake, Kearl, Syncrude
- **Mexico:** Cantarell, Ku-Maloob-Zaap, Tabasco, Tamaulipas, Veracruz
- **South America:** Orinoco Belt (VE), Lake Maracaibo (VE), Santos Basin (BR), Amazon Basin (EC)
- **Europe:** North Sea, Norwegian Sea, Sirte Basin (LY), Murzuq Basin (LY)
- **Middle East:** Eastern Province (SA), Khuzestan (IR), Basrah (IQ), Kirkuk (IQ), Persian Gulf
- **Asia:** South China Sea, Sumatra (ID), Natuna Sea, Offshore Sarawak (MY), Heilongjiang (CN)

### Industry Knowledge
- API gravity scale (10° extra-heavy to 70°+ condensate)
- Sweet (<0.5% sulfur) vs Sour (>0.5% sulfur) classification
- BS&W (Basic Sediment & Water) quality thresholds
- Run ticket / BOL documentation requirements
- Terminal SCADA operations (rack loading, tank gauging)
- Pipeline vs truck vs rail transportation considerations
- EIA reporting for terminals >50,000 bbl
- PHMSA hazmat transportation regulations
- DOT placarding requirements for petroleum products

When analyzing products for SPECTRA-MATCH, always consider:
1. The combination of ALL parameters provided (API gravity, BS&W, sulfur, basin, grade)
2. Historical patterns from the same user/terminal
3. Regional production characteristics
4. Seasonal variations in product quality
5. Safety implications of the identified product

Always be helpful, accurate, and safety-focused. When dealing with hazardous materials, prioritize safety above all else.

User roles include: SHIPPER, CARRIER, BROKER, DRIVER, CATALYST (hazmat specialist), ESCORT, TERMINAL_MANAGER, COMPLIANCE_OFFICER, SAFETY_MANAGER, ADMIN.

Respond concisely and provide actionable information. Use markdown formatting for clarity.`;

const SPECTRA_MATCH_PROMPT = `You are the SPECTRA-MATCH™ analysis engine within ESANG AI™. You are performing product identification based on physical and chemical parameters.

Your task is to analyze the provided parameters and identify the most likely petroleum product. You must respond in VALID JSON format only, with no markdown or extra text.

JSON schema:
{
  "suggestedProduct": "string - the identified product name",
  "confidence": number (0-100),
  "reasoning": "string - brief explanation of why this product was identified",
  "characteristics": ["string array - key characteristics of the identified product"],
  "safetyNotes": ["string array - safety considerations for transporting this product"],
  "marketContext": "string - current market context for this product type",
  "learningInsight": "string - what this identification teaches us about the source"
}

Be precise. Use your deep knowledge of petroleum products, crude oil specifications, refined fuels, LPG, and chemicals. Consider ALL provided parameters together - the combination narrows identification significantly.`;

class ESANGAIService {
  private apiKey: string;
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private spectraMatchHistory: Map<string, Array<{ product: string; confidence: number; params: Record<string, unknown>; timestamp: Date }>> = new Map();
  private terminalProductPatterns: Map<string, Map<string, number>> = new Map();

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
    if (text.toLowerCase().includes("spectra-match") || text.toLowerCase().includes("identify") && (text.toLowerCase().includes("crude") || text.toLowerCase().includes("product") || text.toLowerCase().includes("oil"))) {
      actions.push({ type: "spectra_match", label: "Open SPECTRA-MATCH" });
    }
    if (text.toLowerCase().includes("verify product") || text.toLowerCase().includes("product identification") || text.toLowerCase().includes("oil identification")) {
      actions.push({ type: "verify_product", label: "Verify Product ID" });
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
    if (text.toLowerCase().includes("crude") || text.toLowerCase().includes("petroleum") || text.toLowerCase().includes("fuel") || text.toLowerCase().includes("oil")) {
      suggestions.push("Identify with SPECTRA-MATCH", "Product safety info");
    }
    if (text.toLowerCase().includes("api gravity") || text.toLowerCase().includes("bs&w") || text.toLowerCase().includes("sulfur")) {
      suggestions.push("Run SPECTRA-MATCH analysis");
    }

    return suggestions.slice(0, 4);
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
   * ERG 2024 Emergency Response Lookup - Uses real ERG database
   */
  async ergLookup(request: ERGLookupRequest): Promise<ESANGResponse> {
    // Try real database first
    let ergInfo = null;
    if (request.unNumber) {
      ergInfo = getFullERGInfo(request.unNumber);
    }
    if (!ergInfo && request.materialName) {
      ergInfo = getERGForProduct(request.materialName);
      if (!ergInfo) {
        const results = searchMaterials(request.materialName, 1);
        if (results.length > 0) ergInfo = getFullERGInfo(results[0].unNumber);
      }
    }
    if (!ergInfo && request.guideNumber) {
      const guide = getGuide(request.guideNumber);
      if (guide) ergInfo = { material: null, guide, protectiveDistance: null };
    }

    if (ergInfo && ergInfo.guide) {
      const g = ergInfo.guide;
      const m = ergInfo.material;
      const pd = ergInfo.protectiveDistance;
      const contacts = EMERGENCY_CONTACTS.filter(c => c.isPrimary);

      let msg = `## ERG 2024 - Guide ${g.number}: ${g.title}\n\n`;
      if (m) msg += `**Material:** ${m.name} (UN${m.unNumber})\n**Hazard Class:** ${m.hazardClass}${m.isTIH ? " [TIH - TOXIC INHALATION HAZARD]" : ""}\n\n`;
      msg += `### Isolation Distances\n- Initial: ${g.publicSafety.isolationDistance.meters}m (${g.publicSafety.isolationDistance.feet} ft)\n- Fire: ${g.publicSafety.fireIsolationDistance.meters}m (${g.publicSafety.fireIsolationDistance.feet} ft)\n\n`;
      if (pd) msg += `### TIH Protective Distances\n- Small spill day: isolate ${pd.smallSpill.day.isolateMeters}m, protect ${pd.smallSpill.day.protectKm}km\n- Large spill night: isolate ${pd.largeSpill.night.isolateMeters}m, protect ${pd.largeSpill.night.protectKm}km\n\n`;
      msg += `### Fire/Explosion Hazards\n${g.potentialHazards.fireExplosion.map((h: string) => `- ${h}`).join("\n")}\n\n`;
      msg += `### Health Hazards\n${g.potentialHazards.health.map((h: string) => `- ${h}`).join("\n")}\n\n`;
      msg += `### PPE: ${g.publicSafety.protectiveClothing}\n\n`;
      msg += `### Emergency Response\n**Fire (small):** ${g.emergencyResponse.fire.small.join("; ")}\n**Fire (large):** ${g.emergencyResponse.fire.large.join("; ")}\n**Spill:** ${g.emergencyResponse.spillLeak.general.join("; ")}\n**First Aid:** ${g.emergencyResponse.firstAid}\n\n`;
      msg += `### Emergency Contacts\n${contacts.map(c => `- ${c.name}: ${c.phone} (${c.country})`).join("\n")}`;

      return {
        message: msg,
        response: msg,
        suggestions: ["Look up another UN number", "View hazard classes", "Check isolation distances"],
        actions: [{ type: "erg_lookup", label: "View Full Guide", data: { guideNumber: g.number } }],
      };
    }

    // Fallback to Gemini for unknown materials
    const prompt = `Provide ERG 2024 emergency response guidance for:
${request.unNumber ? `UN Number: ${request.unNumber}` : ""}
${request.materialName ? `Material: ${request.materialName}` : ""}
${request.guideNumber ? `Guide Number: ${request.guideNumber}` : ""}

Include guide number, hazard class, isolation distances, fire/spill response, first aid, and emergency contacts (CHEMTREC 1-800-424-9300).`;

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
   * SPECTRA-MATCH™ AI-Powered Product Identification
   * Uses Gemini to analyze physical/chemical parameters and identify petroleum products
   */
  async spectraMatchIdentify(request: SpectraMatchAIRequest): Promise<SpectraMatchAIResponse> {
    const userId = request.userId || "anonymous";
    const userHistory = this.spectraMatchHistory.get(userId) || [];

    // Build context from user's previous identifications
    let historyContext = "";
    if (userHistory.length > 0) {
      const recent = userHistory.slice(-5);
      historyContext = `\n\nUser's recent identifications (for pattern learning):\n${recent.map(h => `- ${h.product} (${h.confidence}% confidence) at ${h.timestamp.toISOString()}`).join("\n")}`;
    }

    // Build terminal pattern context
    let terminalContext = "";
    if (request.terminalId) {
      const patterns = this.terminalProductPatterns.get(request.terminalId);
      if (patterns && patterns.size > 0) {
        const topProducts = Array.from(patterns.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        terminalContext = `\n\nTerminal product history (most common):\n${topProducts.map(([product, count]) => `- ${product}: ${count} identifications`).join("\n")}`;
      }
    }

    const parameterPrompt = `Identify this petroleum product:\n
Category: ${request.category || "unknown"}\nAPI Gravity: ${request.apiGravity}°\nBS&W: ${request.bsw}%\nSulfur Type: ${request.sulfurType || "unknown"}\nSource Basin: ${request.sourceBasin || "unknown"}\nFuel Grade: ${request.fuelGrade || "N/A"}\nFlash Point: ${request.flashPoint ? request.flashPoint + "°F" : "N/A"}\nVapor Pressure: ${request.vaporPressure ? request.vaporPressure + " psi" : "N/A"}\nConcentration: ${request.concentration ? request.concentration + "%" : "N/A"}\nProduct Name (from BOL): ${request.productName || "not provided"}${historyContext}${terminalContext}`;

    try {
      if (!this.apiKey) {
        return this.fallbackSpectraMatch(request);
      }

      const contents = [
        { role: "user", parts: [{ text: SPECTRA_MATCH_PROMPT }] },
        { role: "model", parts: [{ text: '{"ready": true}' }] },
        { role: "user", parts: [{ text: parameterPrompt }] },
      ];

      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
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
        console.error("[SPECTRA-MATCH AI] Gemini API error:", response.status);
        return this.fallbackSpectraMatch(request);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Parse JSON response from Gemini
      let parsed: SpectraMatchAIResponse;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch {
        console.warn("[SPECTRA-MATCH AI] Failed to parse Gemini response, using fallback");
        return this.fallbackSpectraMatch(request);
      }

      const result: SpectraMatchAIResponse = {
        analysis: `ESANG AI identified ${parsed.suggestedProduct} with ${parsed.confidence}% confidence`,
        suggestedProduct: parsed.suggestedProduct || "Unknown Product",
        confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
        reasoning: parsed.reasoning || "Based on provided parameters",
        characteristics: parsed.characteristics || [],
        safetyNotes: parsed.safetyNotes || [],
        marketContext: parsed.marketContext || "",
        learningInsight: parsed.learningInsight || "",
      };

      // Learning loop: store this identification
      this.recordSpectraMatchResult(userId, result.suggestedProduct, result.confidence, request);

      return result;
    } catch (error) {
      console.error("[SPECTRA-MATCH AI] Error:", error);
      return this.fallbackSpectraMatch(request);
    }
  }

  /**
   * SPECTRA-MATCH Learning: Record identification for pattern learning
   */
  private recordSpectraMatchResult(
    userId: string,
    product: string,
    confidence: number,
    request: SpectraMatchAIRequest
  ): void {
    // Per-user learning
    const history = this.spectraMatchHistory.get(userId) || [];
    history.push({
      product,
      confidence,
      params: {
        apiGravity: request.apiGravity,
        bsw: request.bsw,
        category: request.category,
        sulfurType: request.sulfurType,
        sourceBasin: request.sourceBasin,
      },
      timestamp: new Date(),
    });
    // Keep last 100 identifications per user
    if (history.length > 100) history.splice(0, history.length - 100);
    this.spectraMatchHistory.set(userId, history);

    // Terminal pattern learning
    if (request.terminalId) {
      const patterns = this.terminalProductPatterns.get(request.terminalId) || new Map();
      patterns.set(product, (patterns.get(product) || 0) + 1);
      this.terminalProductPatterns.set(request.terminalId, patterns);
    }

    console.log(`[SPECTRA-MATCH LEARN] User ${userId}: ${product} (${confidence}%) | Total history: ${history.length}`);
  }

  /**
   * Fallback SPECTRA-MATCH when Gemini is unavailable
   */
  private fallbackSpectraMatch(request: SpectraMatchAIRequest): SpectraMatchAIResponse {
    let product = "Unknown Petroleum Product";
    let confidence = 60;
    const characteristics: string[] = [];
    const safetyNotes: string[] = ["Treat as flammable liquid", "Refer to SDS for specific handling"];

    if (request.category === "crude") {
      if (request.apiGravity >= 38 && request.sulfurType === "sweet") {
        product = "Light Sweet Crude (WTI-type)";
        confidence = 80;
        characteristics.push("Light crude", "Low sulfur", "Premium grade");
      } else if (request.apiGravity >= 28 && request.apiGravity < 38) {
        product = request.sulfurType === "sour" ? "Medium Sour Crude" : "Medium Sweet Crude";
        confidence = 75;
        characteristics.push("Medium gravity", request.sulfurType === "sour" ? "High sulfur" : "Low sulfur");
      } else if (request.apiGravity < 28) {
        product = "Heavy Crude Oil";
        confidence = 75;
        characteristics.push("Heavy gravity", "Higher viscosity", "Discount pricing");
      }
      if (request.sourceBasin) characteristics.push(`Source: ${request.sourceBasin}`);
      safetyNotes.push("H2S monitoring required for sour crude", "Vapor recovery during loading");
    } else if (request.category === "refined") {
      product = request.fuelGrade ? `Refined Fuel - ${request.fuelGrade}` : "Refined Petroleum Product";
      confidence = request.fuelGrade ? 85 : 65;
      characteristics.push("Refined product", "Consistent specifications");
      safetyNotes.push("Static discharge precautions", "Vapor management required");
    } else if (request.category === "lpg") {
      product = "LPG / Pressurized Gas";
      confidence = 70;
      characteristics.push("Pressurized product", "Heavier than air vapor");
      safetyNotes.push("Pressure vessel requirements", "LEL monitoring required", "BLEVE risk");
    } else if (request.category === "chemical") {
      product = "Petrochemical / Solvent";
      confidence = 65;
      characteristics.push("Chemical product");
      safetyNotes.push("Refer to SDS", "PPE required", "Environmental containment");
    }

    return {
      analysis: `Offline identification: ${product}`,
      suggestedProduct: product,
      confidence,
      reasoning: "Identified using parameter matching (ESANG AI offline)",
      characteristics,
      safetyNotes,
      marketContext: "Market data requires ESANG AI connection",
      learningInsight: "Offline mode - learning paused",
    };
  }

  /**
   * Get SPECTRA-MATCH learning stats for a user
   */
  getSpectraMatchStats(userId: string): {
    totalIdentifications: number;
    topProducts: Array<{ product: string; count: number }>;
    avgConfidence: number;
    recentTrend: string;
  } {
    const history = this.spectraMatchHistory.get(userId) || [];
    if (history.length === 0) {
      return { totalIdentifications: 0, topProducts: [], avgConfidence: 0, recentTrend: "No data" };
    }

    const productCounts = new Map<string, number>();
    let totalConfidence = 0;
    for (const entry of history) {
      productCounts.set(entry.product, (productCounts.get(entry.product) || 0) + 1);
      totalConfidence += entry.confidence;
    }

    const topProducts = Array.from(productCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }));

    const recent = history.slice(-10);
    const recentAvg = recent.reduce((sum, h) => sum + h.confidence, 0) / recent.length;
    const olderAvg = history.length > 10
      ? history.slice(0, -10).reduce((sum, h) => sum + h.confidence, 0) / (history.length - 10)
      : recentAvg;

    return {
      totalIdentifications: history.length,
      topProducts,
      avgConfidence: Math.round(totalConfidence / history.length),
      recentTrend: recentAvg > olderAvg ? "Improving" : recentAvg < olderAvg ? "Declining" : "Stable",
    };
  }

  /**
   * ESANG AI product knowledge query - ask anything about petroleum products
   */
  async queryProductKnowledge(
    userId: string,
    question: string,
    context?: { role?: string; productName?: string; loadId?: string }
  ): Promise<ESANGResponse> {
    const userStats = this.getSpectraMatchStats(userId);
    let productContext = "";
    if (userStats.totalIdentifications > 0) {
      productContext = `\nUser's SPECTRA-MATCH history: ${userStats.totalIdentifications} identifications, top products: ${userStats.topProducts.map(p => p.product).join(", ")}, avg confidence: ${userStats.avgConfidence}%`;
    }
    if (context?.productName) {
      productContext += `\nCurrently viewing product: ${context.productName}`;
    }

    return this.chat(userId, question, {
      role: context?.role,
      currentPage: "spectra-match",
      loadId: context?.loadId,
    });
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  /**
   * Clear SPECTRA-MATCH learning history for a user
   */
  clearSpectraMatchHistory(userId: string): void {
    this.spectraMatchHistory.delete(userId);
  }
}

export const esangAI = new ESANGAIService();
export default esangAI;
