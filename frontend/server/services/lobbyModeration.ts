/**
 * LOBBY MODERATION ENGINE
 * ═══════════════════════════════════════════════════════════════
 * Enforces EusoTrip Terms of Service §4 (Anti-Circumvention),
 * §6 (User Conduct), and professional communication standards.
 *
 * Categories:
 *  - CIRCUMVENTION: Attempts to move transactions off-platform
 *  - PII_LEAK: Sharing personal contact info (phone, email, social)
 *  - PROFANITY: Offensive language, slurs, hate speech
 *  - HARASSMENT: Threats, doxxing, intimidation
 *  - SOLICITATION: Spam, scams, illegal activity
 *  - FLOODING: Rate-limit / message spam
 *
 * Severity levels: WARNING → BLOCK → STRIKE → SUSPEND
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type ViolationType =
  | "CIRCUMVENTION"
  | "PII_LEAK"
  | "PROFANITY"
  | "HARASSMENT"
  | "SOLICITATION"
  | "FLOODING";

export type Severity = "WARNING" | "BLOCK" | "STRIKE" | "SUSPEND";

export interface ModerationResult {
  allowed: boolean;
  violation?: ViolationType;
  severity?: Severity;
  reason?: string;
  /** Sanitized message (redacted PII) — used only if allowed with warning */
  sanitized?: string;
  /** Reference to ToS section */
  tosRef?: string;
}

// ─── Pattern Libraries ─────────────────────────────────────────────────────

/**
 * §4 ANTI-CIRCUMVENTION PATTERNS
 * Detects language attempting to move business relationships off-platform.
 * Per ToS §4.1(a-g): contact exchange, direct dealing, fee avoidance.
 */
const CIRCUMVENTION_PATTERNS: RegExp[] = [
  // Direct contact solicitation
  /\b(call|text|hit|hmu|dm|message|reach|contact)\s*(me|him|her|them|us)\s*(at|on|@)?\b/i,
  /\b(my|here'?s?\s*(my|the))\s*(number|phone|cell|mobile|line|digits|email|e-?mail|address|ig|insta|snap|facebook|fb|twitter|x\.com|linkedin|telegram|whatsapp|signal|discord)\b/i,
  /\bsend\s*(me|us)\s*(a|an|your)?\s*(email|text|dm|message)\b/i,
  /\b(add|follow|find)\s*(me|us)\s*(on|@)\b/i,
  /\b(let'?s?\s*(take|move|go|switch)\s*(this|it|things)\s*(off|outside|away|to)\s*(platform|eusotrip|the app|offline|private|direct))\b/i,
  /\b(off[- ]?platform|off[- ]?the[- ]?books?|under[- ]?the[- ]?table|side[- ]?deal)\b/i,

  // Direct dealing / fee avoidance
  /\b(work|deal|book|haul|run|ship|move)\s*(with\s*(me|us)|direct(ly)?)\s*(without|outside|off|no)\s*(eusotrip|platform|the app|fees?|commission)?\b/i,
  /\b(skip|avoid|bypass|cut\s*out|get\s*around|dodge)\s*(the\s*)?(platform|eusotrip|fees?|middleman|commission|broker)\b/i,
  /\b(save|pocket)\s*(the\s*)?(fee|commission|cut|percentage)\b/i,
  /\bno\s*(need|reason)\s*(for|to use)\s*(the\s*)?(platform|eusotrip|app)\b/i,
  /\b(why\s*(pay|use)|don'?t\s*(need|use))\s*(eusotrip|the\s*platform|the\s*app|their\s*fees?)\b/i,

  // Competitor platform solicitation
  /\b(use|try|switch\s*to|check\s*out|go\s*to)\s*(dat|truckstop|123loadboard|uber\s*freight|convoy|loadsmart|coyote|echo|ch\s*robinson)\b/i,
];

/**
 * PII / CONTACT INFO PATTERNS
 * Per ToS §4.1(b): No exchange of personal contact information.
 */
const PII_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Phone numbers (US formats)
  { pattern: /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, label: "phone number" },
  { pattern: /\b\d{3}[-.\s]\d{4}\b/, label: "partial phone number" },
  // Spelled-out phone numbers (e.g., "eight three two...")
  { pattern: /\b(one|two|three|four|five|six|seven|eight|nine|zero|oh)\s+(one|two|three|four|five|six|seven|eight|nine|zero|oh)\s+(one|two|three|four|five|six|seven|eight|nine|zero|oh)\s+(one|two|three|four|five|six|seven|eight|nine|zero|oh)/i, label: "spelled-out number" },
  // Email addresses
  { pattern: /\b[a-zA-Z0-9._%+\-]+\s*(@|at)\s*[a-zA-Z0-9.\-]+\s*(\.|dot)\s*(com|net|org|io|co|gov|edu|biz|info|us|me)\b/i, label: "email address" },
  { pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, label: "email address" },
  // Social media handles
  { pattern: /\b(ig|insta(gram)?|snap(chat)?|twitter|tiktok|facebook|fb|linkedin|telegram|whatsapp|signal|discord)\s*[:=@]?\s*@?[a-zA-Z0-9._]{2,}/i, label: "social media handle" },
  // URLs (non-eusotrip)
  { pattern: /\bhttps?:\/\/(?!eusotrip\.com|eusorone\.com)[^\s]+/i, label: "external URL" },
  { pattern: /\bwww\.(?!eusotrip\.com|eusorone\.com)[^\s]+/i, label: "external URL" },
];

/**
 * OFF-PLATFORM PAYMENT PATTERNS
 * Detects attempts to arrange payment outside EusoWallet/platform.
 */
const OFFPLATFORM_PAYMENT_PATTERNS: RegExp[] = [
  /\b(venmo|zelle|cash\s*app|paypal|apple\s*pay|google\s*pay)\s*(me|us|@|:)/i,
  /\b(send|wire|transfer)\s*(me|us)?\s*(money|cash|payment|funds)\s*(via|through|on|using)?\s*(venmo|zelle|cash\s*app|paypal|western\s*union|moneygram|crypto|bitcoin|btc|eth)/i,
  /\b(pay|paid?)\s*(you|me|us|them)\s*(direct(ly)?|outside|off[- ]?platform|in\s*cash)\b/i,
  /\b(cash\s*on\s*delivery|cash\s*at\s*pickup|cash\s*deal)\b/i,
  /\b(my|here'?s?\s*(my|the))\s*(venmo|zelle|cash\s*app|paypal|bitcoin|btc|wallet\s*address)\b/i,
];

/**
 * PROFANITY & HATE SPEECH
 */
const PROFANITY_WORDS: string[] = [
  "fuck", "fucker", "fucking", "fck", "fuk", "phuck", "phuk",
  "shit", "shitty", "bullshit", "horseshit",
  "bitch", "bitches", "biatch",
  "cunt", "cunts",
  "dick", "dicks", "dickhead",
  "ass", "asshole", "asswipe", "dumbass", "jackass", "badass",
  "damn", "goddamn", "dammit",
  "nigger", "nigga", "nigg",
  "faggot", "fag", "fagg",
  "retard", "retarded",
  "whore", "slut", "hoe", "thot",
  "bastard", "piss", "cock", "twat", "wanker",
  "chink", "spic", "kike", "wetback", "gook", "cracker",
];

// Build efficient profanity regex (handles leet-speak substitutions)
function buildProfanityRegex(words: string[]): RegExp {
  const escaped = words.map(w => {
    // Handle common leet-speak: a→@/4, e→3, i→1/!, o→0, s→$
    return w
      .replace(/a/gi, "[a@4]")
      .replace(/e/gi, "[e3]")
      .replace(/i/gi, "[i1!]")
      .replace(/o/gi, "[o0]")
      .replace(/s/gi, "[s$5]");
  });
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
}

const PROFANITY_REGEX = buildProfanityRegex(PROFANITY_WORDS);

/**
 * HARASSMENT & THREAT PATTERNS
 */
const HARASSMENT_PATTERNS: RegExp[] = [
  /\b(i('ll|m\s*going\s*to|will)\s*(kill|hurt|beat|shoot|stab|find|hunt))\b/i,
  /\b(death\s*threat|bomb\s*threat|shoot\s*(up|you)|blow\s*(up|you))\b/i,
  /\b(i\s*know\s*where\s*you\s*(live|work|park|sleep))\b/i,
  /\b(stalk|dox(x)?|harass|swat)\s*(you|him|her|them)\b/i,
  /\b(watch\s*your\s*back|you('re|\s*are)\s*dead)\b/i,
  /\b(rape|sexual\s*assault|molest)\b/i,
  /\b(kys|kill\s*yourself|go\s*die)\b/i,
];

/**
 * SOLICITATION / SPAM / ILLEGAL
 */
const SOLICITATION_PATTERNS: RegExp[] = [
  /\b(buy|sell|selling)\s+(drugs|guns|weapons|meth|coke|weed|marijuana|pills|fentanyl)\b/i,
  /\b(click\s*here|free\s*money|make\s*\$\d+|guaranteed\s*income)\b/i,
  /\b(onlyfans|escort\s*service|adult\s*content|cam\s*girl|sugar\s*(daddy|mama))\b/i,
  /\b(mlm|pyramid\s*scheme|get\s*rich\s*quick|passive\s*income\s*opportunity)\b/i,
  /\b(double\s*broker|rebook\s*this|post\s*it\s*on\s*(dat|truckstop|loadboard))\b/i,
  /\b(fake\s*(insurance|authority|mc|dot|cdl|eld)|run\s*under\s*my\s*authority)\b/i,
  /\b(stolen\s*(load|cargo|trailer|freight)|jack\s*(this|that|the)\s*(load|trailer))\b/i,
];

// ─── Main Moderation Function ──────────────────────────────────────────────

/**
 * Analyze a lobby message for policy violations.
 * Returns a ModerationResult indicating whether the message is allowed.
 */
export function moderateMessage(message: string, _userRole?: string): ModerationResult {
  const msg = message.trim();
  const msgLower = msg.toLowerCase();

  // 1. HARASSMENT — highest priority, immediate block
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        allowed: false,
        violation: "HARASSMENT",
        severity: "STRIKE",
        reason: "Message contains threats or harassment. This violates our Terms of Service §6 and may be reported to authorities. Zero tolerance policy.",
        tosRef: "§6 User Conduct & Prohibited Activities",
      };
    }
  }

  // 2. SOLICITATION / ILLEGAL — immediate block
  for (const pattern of SOLICITATION_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        allowed: false,
        violation: "SOLICITATION",
        severity: "STRIKE",
        reason: "Message contains prohibited solicitation or illegal content. This is a professional freight platform — not a marketplace for illegal goods or services.",
        tosRef: "§6 User Conduct & Prohibited Activities",
      };
    }
  }

  // 3. PROFANITY — block
  if (PROFANITY_REGEX.test(msgLower)) {
    return {
      allowed: false,
      violation: "PROFANITY",
      severity: "BLOCK",
      reason: "Message contains inappropriate language. The Haul Lobby enforces professional communication standards. Please rephrase.",
      tosRef: "§6 User Conduct & Prohibited Activities",
    };
  }

  // 4. ANTI-CIRCUMVENTION — block + strike
  for (const pattern of CIRCUMVENTION_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        allowed: false,
        violation: "CIRCUMVENTION",
        severity: "STRIKE",
        reason: "⚠️ Anti-Circumvention Violation — Your message appears to solicit off-platform transactions. Per our Terms of Service §4, all business relationships originated through EusoTrip must remain on-platform. Repeated violations result in account suspension and financial penalties (2× estimated lost revenue). Use EusoTrip's messaging, bidding, and payment tools for all transactions.",
        tosRef: "§4 Anti-Circumvention & Platform Exclusivity",
      };
    }
  }

  // 5. OFF-PLATFORM PAYMENTS — block + strike
  for (const pattern of OFFPLATFORM_PAYMENT_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        allowed: false,
        violation: "CIRCUMVENTION",
        severity: "STRIKE",
        reason: "⚠️ Off-Platform Payment Detected — Arranging payments outside EusoWallet violates Terms of Service §4. All financial transactions must be processed through the platform. Use EusoWallet for secure, compliant payments with full documentation.",
        tosRef: "§4 Anti-Circumvention & Platform Exclusivity",
      };
    }
  }

  // 6. PII / CONTACT INFO — block
  for (const { pattern, label } of PII_PATTERNS) {
    if (pattern.test(msg)) {
      return {
        allowed: false,
        violation: "PII_LEAK",
        severity: "BLOCK",
        reason: `🔒 Personal information detected (${label}). Sharing contact information in The Lobby is prohibited per Terms of Service §4.1(b). Use EusoTrip's built-in messaging system for private communication. This protects you and ensures all business stays on-platform.`,
        tosRef: "§4.1(b) Exchange of Personal Contact Information",
      };
    }
  }

  // 7. Message length sanity (max 500 chars already enforced by zod, but double-check)
  if (msg.length > 500) {
    return {
      allowed: false,
      violation: "FLOODING",
      severity: "WARNING",
      reason: "Message too long. Please keep messages under 500 characters.",
    };
  }

  // 8. All-caps shouting detection (if >80% uppercase and >20 chars)
  if (msg.length > 20) {
    const upperCount = (msg.match(/[A-Z]/g) || []).length;
    const letterCount = (msg.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 0 && upperCount / letterCount > 0.8) {
      return {
        allowed: false,
        violation: "FLOODING",
        severity: "WARNING",
        reason: "Please avoid excessive caps. This is a professional space — normal capitalization is expected.",
      };
    }
  }

  // ✅ Message passed all checks
  return { allowed: true };
}

// ─── Strike Management ─────────────────────────────────────────────────────

/**
 * Determine action based on cumulative strike count.
 *  1-2 strikes: Warning + message blocked
 *  3-4 strikes: 1-hour mute
 *  5-6 strikes: 24-hour mute
 *  7+  strikes: Permanent ban from Lobby (escalate to admin)
 */
export function getStrikeAction(strikeCount: number): {
  action: "warn" | "mute_1h" | "mute_24h" | "ban";
  message: string;
} {
  if (strikeCount <= 2) {
    return {
      action: "warn",
      message: `⚠️ Strike ${strikeCount}/7 — Your message was blocked for a policy violation. Continued violations will result in temporary muting and eventual permanent ban from The Haul Lobby.`,
    };
  }
  if (strikeCount <= 4) {
    return {
      action: "mute_1h",
      message: `🔇 Strike ${strikeCount}/7 — You have been muted from The Lobby for 1 hour due to repeated violations. Review our Community Guidelines and Terms of Service §4 and §6.`,
    };
  }
  if (strikeCount <= 6) {
    return {
      action: "mute_24h",
      message: `🔇 Strike ${strikeCount}/7 — You have been muted from The Lobby for 24 hours. Further violations will result in a permanent ban. Your account may also be reviewed for Terms of Service compliance.`,
    };
  }
  return {
    action: "ban",
    message: `🚫 Strike ${strikeCount}/7 — You have been permanently banned from The Haul Lobby due to repeated policy violations. Your account has been flagged for administrative review. Per Terms of Service §4.5, additional penalties may apply.`,
  };
}
