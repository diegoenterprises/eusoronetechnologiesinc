/**
 * FRAUD SCORER v1.0
 * Statistical Anomaly Detection & Fraud Risk Assessment
 * 
 * Implements: Z-score analysis, Modified Z-score (MAD), Benford's Law,
 *             Pattern matching, Velocity checks, Cross-entity correlation
 *
 * Replaces commercial: Stripe Radar ($$$), AWS Fraud Detector
 * Inspired by: scikit-learn anomaly detection, XGBoost fraud models
 */

import { detectAnomaly } from "./forecastEngine";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface FraudRiskScore {
  overallScore: number; // 0-100 (higher = more suspicious)
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  signals: FraudSignal[];
  recommendation: "ALLOW" | "REVIEW" | "FLAG" | "BLOCK";
  explanation: string;
}

export interface FraudSignal {
  type: string;
  score: number; // 0-100
  severity: "LOW" | "MEDIUM" | "HIGH";
  detail: string;
}

export interface BidFraudCheck {
  riskScore: number;
  signals: FraudSignal[];
  isFairPrice: boolean;
  marketDeviation: number; // percentage
  recommendation: string;
}

export interface ClaimFraudCheck {
  riskScore: number;
  signals: FraudSignal[];
  suspicionLevel: "NONE" | "LOW" | "MODERATE" | "HIGH";
  patterns: string[];
}

export interface RegistrationFraudCheck {
  riskScore: number;
  signals: FraudSignal[];
  verificationNeeded: string[];
}

// ═══════════════════════════════════════════════════════════════════
// BENFORD'S LAW
// ═══════════════════════════════════════════════════════════════════

const BENFORD_EXPECTED = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

function benfordsLawTest(values: number[]): { score: number; suspicious: boolean; detail: string } {
  if (values.length < 20) return { score: 0, suspicious: false, detail: "Insufficient data for Benford analysis" };

  const firstDigits = new Array(10).fill(0);
  let validCount = 0;

  for (const v of values) {
    const abs = Math.abs(v);
    if (abs < 1) continue;
    const firstDigit = parseInt(String(abs).charAt(0));
    if (firstDigit >= 1 && firstDigit <= 9) {
      firstDigits[firstDigit]++;
      validCount++;
    }
  }

  if (validCount < 20) return { score: 0, suspicious: false, detail: "Insufficient valid numbers" };

  // Chi-squared test against Benford distribution
  let chiSquared = 0;
  for (let d = 1; d <= 9; d++) {
    const observed = firstDigits[d] / validCount;
    const expected = BENFORD_EXPECTED[d];
    chiSquared += ((observed - expected) ** 2) / expected;
  }

  // Normalize to 0-100 score (chi-squared with 8 df, critical value ~15.5 at p=0.05)
  const score = Math.min(100, Math.round((chiSquared / 15.5) * 50));
  const suspicious = chiSquared > 15.5;

  return {
    score,
    suspicious,
    detail: suspicious
      ? `First-digit distribution deviates from Benford's Law (chi²=${chiSquared.toFixed(2)}). Possible data manipulation.`
      : `First-digit distribution consistent with Benford's Law (chi²=${chiSquared.toFixed(2)}).`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// VELOCITY CHECKS
// ═══════════════════════════════════════════════════════════════════

function velocityCheck(
  timestamps: number[], // epoch ms
  threshold: number, // max events per window
  windowMs: number // window size in ms
): { score: number; exceeded: boolean; maxRate: number; detail: string } {
  if (timestamps.length < 2) return { score: 0, exceeded: false, maxRate: 0, detail: "Insufficient data" };

  const sorted = [...timestamps].sort((a, b) => a - b);
  let maxInWindow = 0;

  for (let i = 0; i < sorted.length; i++) {
    let count = 0;
    for (let j = i; j < sorted.length && sorted[j] - sorted[i] <= windowMs; j++) {
      count++;
    }
    maxInWindow = Math.max(maxInWindow, count);
  }

  const exceeded = maxInWindow > threshold;
  const score = Math.min(100, Math.round((maxInWindow / threshold) * 50));

  return {
    score,
    exceeded,
    maxRate: maxInWindow,
    detail: exceeded
      ? `${maxInWindow} events in ${windowMs / 60000}min window (limit: ${threshold})`
      : `Activity rate normal: ${maxInWindow} events in window`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PATTERN MATCHING
// ═══════════════════════════════════════════════════════════════════

function roundNumberBias(values: number[]): { score: number; detail: string } {
  if (values.length < 5) return { score: 0, detail: "Insufficient data" };

  let roundCount = 0;
  for (const v of values) {
    if (v % 100 === 0 || v % 50 === 0 || v % 25 === 0) roundCount++;
  }

  const roundPct = roundCount / values.length;
  // Expected round number frequency is ~6% for multiples of 50, ~12% for multiples of 25
  const score = roundPct > 0.5 ? Math.min(80, Math.round((roundPct - 0.12) * 100)) : 0;

  return {
    score,
    detail: score > 30
      ? `${Math.round(roundPct * 100)}% of values are round numbers (expected ~12%). Possible estimation or fabrication.`
      : `Round number frequency normal (${Math.round(roundPct * 100)}%)`,
  };
}

function duplicateAmountCheck(values: number[]): { score: number; detail: string } {
  if (values.length < 5) return { score: 0, detail: "Insufficient data" };

  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) || 0) + 1);
  }

  let maxDup = 0;
  let dupValue = 0;
  for (const [val, count] of Array.from(freq)) {
    if (count > maxDup) { maxDup = count; dupValue = val; }
  }

  const dupPct = maxDup / values.length;
  const score = dupPct > 0.3 ? Math.min(70, Math.round(dupPct * 100)) : 0;

  return {
    score,
    detail: score > 0
      ? `Value $${dupValue} appears ${maxDup} times (${Math.round(dupPct * 100)}% of submissions). Unusual repetition.`
      : "No unusual duplicate patterns",
  };
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Score bid for fraud risk
 */
export function scoreBid(
  bidAmount: number,
  historicalBids: number[], // recent bids on this lane/load type
  marketAvg: number,
  bidderHistory?: { totalBids: number; acceptedBids: number; avgAmount: number; accountAgeDays: number; timestamps?: number[] }
): BidFraudCheck {
  const signals: FraudSignal[] = [];

  // 1. Market deviation check
  const deviation = marketAvg > 0 ? ((bidAmount - marketAvg) / marketAvg) * 100 : 0;
  if (Math.abs(deviation) > 40) {
    signals.push({
      type: "MARKET_DEVIATION",
      score: Math.min(80, Math.round(Math.abs(deviation))),
      severity: Math.abs(deviation) > 60 ? "HIGH" : "MEDIUM",
      detail: `Bid is ${deviation > 0 ? "+" : ""}${deviation.toFixed(1)}% vs market avg ($${marketAvg.toFixed(0)})`,
    });
  }

  // 2. Statistical anomaly vs historical bids
  if (historicalBids.length >= 3) {
    const anomaly = detectAnomaly(bidAmount, historicalBids);
    if (anomaly.isAnomaly) {
      signals.push({
        type: "STATISTICAL_ANOMALY",
        score: anomaly.score,
        severity: anomaly.score > 70 ? "HIGH" : "MEDIUM",
        detail: anomaly.explanation,
      });
    }
  }

  // 3. Suspiciously low bid (potential bait-and-switch)
  if (deviation < -30) {
    signals.push({
      type: "LOW_BALL",
      score: Math.min(70, Math.round(Math.abs(deviation) - 10)),
      severity: deviation < -50 ? "HIGH" : "MEDIUM",
      detail: `Bid ${Math.abs(deviation).toFixed(0)}% below market. Potential bait-and-switch or accessorial padding.`,
    });
  }

  // 4. Bidder velocity check
  if (bidderHistory?.timestamps && bidderHistory.timestamps.length > 3) {
    const vel = velocityCheck(bidderHistory.timestamps, 10, 600_000); // max 10 bids per 10 min
    if (vel.exceeded) {
      signals.push({
        type: "BID_VELOCITY",
        score: vel.score,
        severity: "HIGH",
        detail: vel.detail,
      });
    }
  }

  // 5. New account risk
  if (bidderHistory && bidderHistory.accountAgeDays < 7) {
    signals.push({
      type: "NEW_ACCOUNT",
      score: 40,
      severity: "MEDIUM",
      detail: `Account is only ${bidderHistory.accountAgeDays} days old. Requires additional verification.`,
    });
  }

  // 6. Win rate check (0% win rate with many bids = suspicious)
  if (bidderHistory && bidderHistory.totalBids > 10 && bidderHistory.acceptedBids === 0) {
    signals.push({
      type: "ZERO_WIN_RATE",
      score: 35,
      severity: "LOW",
      detail: `${bidderHistory.totalBids} bids with 0 accepted. Pattern suggests systematic underbidding.`,
    });
  }

  const riskScore = signals.length > 0
    ? Math.min(100, Math.round(signals.reduce((s, sig) => s + sig.score, 0) / Math.max(signals.length, 1)))
    : 0;

  return {
    riskScore,
    signals,
    isFairPrice: Math.abs(deviation) <= 25,
    marketDeviation: Math.round(deviation * 10) / 10,
    recommendation: riskScore > 70 ? "Flag for manual review" :
      riskScore > 40 ? "Monitor closely" :
      Math.abs(deviation) > 25 ? "Price outside normal range" : "Appears legitimate",
  };
}

/**
 * Score claim for fraud risk
 */
export function scoreClaim(
  claimAmount: number,
  loadValue: number,
  claimantHistory?: {
    totalClaims: number;
    claimsLast90Days: number;
    avgClaimAmount: number;
    claimAmounts: number[];
    deliveriesTotal: number;
  }
): ClaimFraudCheck {
  const signals: FraudSignal[] = [];
  const patterns: string[] = [];

  // 1. Claim vs load value ratio
  const ratio = loadValue > 0 ? claimAmount / loadValue : 0;
  if (ratio > 0.8) {
    signals.push({ type: "HIGH_CLAIM_RATIO", score: 70, severity: "HIGH",
      detail: `Claim is ${(ratio * 100).toFixed(0)}% of load value ($${loadValue})` });
    patterns.push("Claim amount near total load value");
  }

  // 2. Frequency check
  if (claimantHistory) {
    const claimRate = claimantHistory.deliveriesTotal > 0
      ? claimantHistory.totalClaims / claimantHistory.deliveriesTotal : 0;
    if (claimRate > 0.15) {
      signals.push({ type: "HIGH_CLAIM_FREQUENCY", score: 60, severity: "HIGH",
        detail: `${(claimRate * 100).toFixed(1)}% claim rate (${claimantHistory.totalClaims}/${claimantHistory.deliveriesTotal} deliveries)` });
      patterns.push("Abnormally high claim frequency");
    }

    // 3. Recent spike
    if (claimantHistory.claimsLast90Days > 3) {
      signals.push({ type: "RECENT_SPIKE", score: 50, severity: "MEDIUM",
        detail: `${claimantHistory.claimsLast90Days} claims in last 90 days` });
      patterns.push("Spike in recent claim activity");
    }

    // 4. Benford's law on claim amounts
    if (claimantHistory.claimAmounts.length >= 20) {
      const benford = benfordsLawTest(claimantHistory.claimAmounts);
      if (benford.suspicious) {
        signals.push({ type: "BENFORD_VIOLATION", score: benford.score, severity: "HIGH", detail: benford.detail });
        patterns.push("Claim amounts fail Benford's Law test");
      }
    }

    // 5. Round number bias
    if (claimantHistory.claimAmounts.length >= 5) {
      const roundCheck = roundNumberBias(claimantHistory.claimAmounts);
      if (roundCheck.score > 30) {
        signals.push({ type: "ROUND_NUMBER_BIAS", score: roundCheck.score, severity: "MEDIUM", detail: roundCheck.detail });
        patterns.push("Excessive round-number claims");
      }
    }

    // 6. Amount anomaly
    if (claimantHistory.claimAmounts.length >= 3) {
      const anomaly = detectAnomaly(claimAmount, claimantHistory.claimAmounts);
      if (anomaly.isAnomaly && anomaly.direction === "HIGH") {
        signals.push({ type: "AMOUNT_ANOMALY", score: anomaly.score, severity: "HIGH", detail: anomaly.explanation });
        patterns.push("Claim amount significantly higher than history");
      }
    }
  }

  const riskScore = signals.length > 0
    ? Math.min(100, Math.round(signals.reduce((s, sig) => s + sig.score, 0) / Math.max(signals.length, 1)))
    : 0;

  let suspicionLevel: ClaimFraudCheck["suspicionLevel"] = "NONE";
  if (riskScore > 70) suspicionLevel = "HIGH";
  else if (riskScore > 40) suspicionLevel = "MODERATE";
  else if (riskScore > 15) suspicionLevel = "LOW";

  return { riskScore, signals, suspicionLevel, patterns };
}

/**
 * Score registration for fraud risk
 */
export function scoreRegistration(input: {
  email: string;
  phone?: string;
  companyName?: string;
  dotNumber?: string;
  mcNumber?: string;
  ipAddress?: string;
  userAgent?: string;
}): RegistrationFraudCheck {
  const signals: FraudSignal[] = [];
  const verificationNeeded: string[] = [];

  // 1. Disposable email detection
  const disposableDomains = ["tempmail", "guerrillamail", "throwaway", "mailinator", "yopmail", "10minutemail", "trashmail", "sharklasers", "guerrilla"];
  const emailDomain = input.email.split("@")[1]?.toLowerCase() || "";
  if (disposableDomains.some(d => emailDomain.includes(d))) {
    signals.push({ type: "DISPOSABLE_EMAIL", score: 80, severity: "HIGH", detail: `Disposable email domain: ${emailDomain}` });
    verificationNeeded.push("Require verified business email");
  }

  // 2. Free email for business registration
  const freeEmails = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "protonmail.com"];
  if (freeEmails.includes(emailDomain)) {
    signals.push({ type: "FREE_EMAIL", score: 20, severity: "LOW", detail: "Using free email provider for business registration" });
  }

  // 3. DOT/MC number validation
  if (input.dotNumber) {
    const dotClean = input.dotNumber.replace(/\D/g, "");
    if (dotClean.length < 5 || dotClean.length > 8) {
      signals.push({ type: "INVALID_DOT", score: 60, severity: "HIGH", detail: `DOT number format invalid: ${input.dotNumber}` });
      verificationNeeded.push("Verify DOT number with FMCSA");
    }
  } else {
    verificationNeeded.push("DOT number not provided");
  }

  if (input.mcNumber) {
    const mcClean = input.mcNumber.replace(/\D/g, "");
    if (mcClean.length < 5 || mcClean.length > 8) {
      signals.push({ type: "INVALID_MC", score: 50, severity: "MEDIUM", detail: `MC number format invalid: ${input.mcNumber}` });
      verificationNeeded.push("Verify MC number with FMCSA");
    }
  }

  // 4. Company name heuristics
  if (input.companyName) {
    if (input.companyName.length < 3) {
      signals.push({ type: "SHORT_COMPANY_NAME", score: 30, severity: "LOW", detail: "Company name suspiciously short" });
    }
    if (/test|fake|temp|demo|sample|xxx/i.test(input.companyName)) {
      signals.push({ type: "TEST_COMPANY", score: 90, severity: "HIGH", detail: "Company name contains test/fake keywords" });
    }
  }

  // 5. Phone number check
  if (input.phone) {
    const digitsOnly = input.phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      signals.push({ type: "INVALID_PHONE", score: 40, severity: "MEDIUM", detail: "Phone number too short" });
      verificationNeeded.push("Verify phone number via SMS");
    }
    // All same digit check
    if (/^(\d)\1+$/.test(digitsOnly)) {
      signals.push({ type: "FAKE_PHONE", score: 70, severity: "HIGH", detail: "Phone number is all same digits" });
    }
  } else {
    verificationNeeded.push("Phone number not provided");
  }

  const riskScore = signals.length > 0
    ? Math.min(100, signals.reduce((s, sig) => s + sig.score, 0) / Math.max(signals.length, 1))
    : 5; // minimum baseline

  return {
    riskScore: Math.round(riskScore),
    signals,
    verificationNeeded,
  };
}

/**
 * Generic entity fraud risk assessment
 */
export function scoreEntity(
  entity: string,
  value: number,
  historicalValues: number[],
  metadata?: Record<string, any>
): FraudRiskScore {
  const signals: FraudSignal[] = [];

  // Statistical anomaly
  if (historicalValues.length >= 3) {
    const anomaly = detectAnomaly(value, historicalValues);
    if (anomaly.isAnomaly) {
      signals.push({
        type: "STATISTICAL_ANOMALY",
        score: anomaly.score,
        severity: anomaly.score > 70 ? "HIGH" : anomaly.score > 40 ? "MEDIUM" : "LOW",
        detail: anomaly.explanation,
      });
    }
  }

  // Benford's law
  if (historicalValues.length >= 20) {
    const benford = benfordsLawTest([...historicalValues, value]);
    if (benford.suspicious) {
      signals.push({ type: "BENFORD_VIOLATION", score: benford.score, severity: "HIGH", detail: benford.detail });
    }
  }

  // Round number
  const roundCheck = roundNumberBias([...historicalValues, value]);
  if (roundCheck.score > 30) {
    signals.push({ type: "ROUND_NUMBER_BIAS", score: roundCheck.score, severity: "MEDIUM", detail: roundCheck.detail });
  }

  // Duplicates
  const dupCheck = duplicateAmountCheck([...historicalValues, value]);
  if (dupCheck.score > 0) {
    signals.push({ type: "DUPLICATE_PATTERN", score: dupCheck.score, severity: "MEDIUM", detail: dupCheck.detail });
  }

  const overallScore = signals.length > 0
    ? Math.min(100, Math.round(signals.reduce((s, sig) => s + sig.score * (sig.severity === "HIGH" ? 1.5 : sig.severity === "MEDIUM" ? 1.0 : 0.5), 0) / signals.length))
    : 0;

  let riskLevel: FraudRiskScore["riskLevel"] = "LOW";
  if (overallScore > 75) riskLevel = "CRITICAL";
  else if (overallScore > 50) riskLevel = "HIGH";
  else if (overallScore > 25) riskLevel = "MODERATE";

  let recommendation: FraudRiskScore["recommendation"] = "ALLOW";
  if (overallScore > 75) recommendation = "BLOCK";
  else if (overallScore > 50) recommendation = "FLAG";
  else if (overallScore > 25) recommendation = "REVIEW";

  return {
    overallScore,
    riskLevel,
    signals,
    recommendation,
    explanation: signals.length > 0
      ? `${entity}: ${signals.length} risk signal(s) detected. Primary concern: ${signals[0].detail}`
      : `${entity}: No fraud signals detected`,
  };
}
