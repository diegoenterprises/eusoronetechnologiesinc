/**
 * FORECAST ENGINE v1.0
 * Time Series Forecasting — MIT / Apache 2.0 inspired algorithms
 * Implements: Simple Exponential Smoothing, Holt-Winters, Linear Regression,
 *             Seasonal Decomposition, Trend Detection, Anomaly Detection
 *
 * Replaces commercial: AWS Forecast, Azure Time Series Insights
 * Inspired by: Darts, Prophet, NeuralForecast (Python equivalents)
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface TimeSeriesPoint {
  timestamp: Date | number;
  value: number;
}

export interface ForecastResult {
  predictions: { period: number; value: number; lower: number; upper: number }[];
  trend: "RISING" | "STABLE" | "DECLINING" | "VOLATILE";
  trendStrength: number; // 0-100
  seasonality: { detected: boolean; period?: number; strength?: number };
  confidence: number; // 0-100
  method: string;
  stats: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    count: number;
    lastValue: number;
    changePercent: number; // vs period ago
  };
}

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number; // 0-100 (higher = more anomalous)
  zScore: number;
  modifiedZScore: number;
  percentile: number;
  direction: "HIGH" | "LOW" | "NORMAL";
  explanation: string;
}

export interface TrendAnalysis {
  direction: "RISING" | "STABLE" | "DECLINING" | "VOLATILE";
  slope: number; // units per period
  rSquared: number; // goodness of fit
  percentChange: number; // over the entire series
  momentum: number; // recent acceleration/deceleration
  breakpoints: number[]; // indices where trend changes
}

export interface RatePrediction {
  predictedRate: number;
  confidence: number;
  range: { low: number; high: number };
  trend: string;
  factors: { name: string; impact: number }[];
  marketPosition: "BELOW_MARKET" | "AT_MARKET" | "ABOVE_MARKET";
}

// ═══════════════════════════════════════════════════════════════════
// STATISTICAL HELPERS
// ═══════════════════════════════════════════════════════════════════

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1));
}

function mad(arr: number[]): number {
  const m = median(arr);
  return median(arr.map(v => Math.abs(v - m)));
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const frac = idx - lower;
  if (lower >= sorted.length - 1) return sorted[sorted.length - 1];
  return sorted[lower] + frac * (sorted[lower + 1] - sorted[lower]);
}

function linearRegression(values: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, rSquared: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: mean(values), rSquared: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssTot = values.reduce((s, v) => s + (v - yMean) ** 2, 0);
  const ssRes = values.reduce((s, v, i) => s + (v - (intercept + slope * i)) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

// ═══════════════════════════════════════════════════════════════════
// EXPONENTIAL SMOOTHING
// ═══════════════════════════════════════════════════════════════════

/**
 * Simple Exponential Smoothing (SES)
 * Good for data without trend or seasonality
 */
function ses(values: number[], alpha: number = 0.3, periods: number = 4): number[] {
  if (!values.length) return Array(periods).fill(0);
  let level = values[0];
  for (let i = 1; i < values.length; i++) {
    level = alpha * values[i] + (1 - alpha) * level;
  }
  return Array(periods).fill(level);
}

/**
 * Double Exponential Smoothing (Holt's method)
 * Handles data with trend but no seasonality
 */
function holtLinear(values: number[], alpha: number = 0.3, beta: number = 0.1, periods: number = 4): number[] {
  if (values.length < 2) return ses(values, alpha, periods);

  let level = values[0];
  let trend = values[1] - values[0];

  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecasts: number[] = [];
  for (let h = 1; h <= periods; h++) {
    forecasts.push(level + h * trend);
  }
  return forecasts;
}

/**
 * Triple Exponential Smoothing (Holt-Winters)
 * Handles data with trend AND seasonality
 */
function holtWinters(
  values: number[],
  seasonLength: number = 4,
  alpha: number = 0.3,
  beta: number = 0.1,
  gamma: number = 0.2,
  periods: number = 4
): number[] {
  if (values.length < seasonLength * 2) return holtLinear(values, alpha, beta, periods);

  // Initialize
  let level = mean(values.slice(0, seasonLength));
  let trend = (mean(values.slice(seasonLength, seasonLength * 2)) - mean(values.slice(0, seasonLength))) / seasonLength;
  const seasonal: number[] = [];
  for (let i = 0; i < seasonLength; i++) {
    seasonal.push(values[i] / (level || 1));
  }

  // Smooth
  for (let i = seasonLength; i < values.length; i++) {
    const si = i % seasonLength;
    const prevLevel = level;
    level = alpha * (values[i] / (seasonal[si] || 1)) + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[si] = gamma * (values[i] / (level || 1)) + (1 - gamma) * seasonal[si];
  }

  // Forecast
  const forecasts: number[] = [];
  for (let h = 1; h <= periods; h++) {
    const si = (values.length + h - 1) % seasonLength;
    forecasts.push((level + h * trend) * (seasonal[si] || 1));
  }
  return forecasts;
}

// ═══════════════════════════════════════════════════════════════════
// SEASONALITY DETECTION
// ═══════════════════════════════════════════════════════════════════

function detectSeasonality(values: number[]): { detected: boolean; period: number; strength: number } {
  if (values.length < 8) return { detected: false, period: 0, strength: 0 };

  // Try common periods: 4 (quarterly), 7 (weekly), 12 (monthly), 52 (weekly-in-year)
  const candidatePeriods = [4, 7, 12, 13, 26, 52].filter(p => p <= values.length / 2);
  let bestPeriod = 0, bestStrength = 0;

  for (const period of candidatePeriods) {
    // Autocorrelation at this lag
    const m = mean(values);
    let num = 0, den = 0;
    for (let i = 0; i < values.length - period; i++) {
      num += (values[i] - m) * (values[i + period] - m);
    }
    den = values.reduce((s, v) => s + (v - m) ** 2, 0);
    const acf = den > 0 ? num / den : 0;

    if (acf > bestStrength && acf > 0.3) {
      bestStrength = acf;
      bestPeriod = period;
    }
  }

  return {
    detected: bestStrength > 0.3,
    period: bestPeriod,
    strength: Math.min(100, bestStrength * 100),
  };
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate forecast from time series data
 */
export function forecast(
  values: number[],
  periodsAhead: number = 4,
  options?: { alpha?: number; beta?: number; gamma?: number; seasonLength?: number }
): ForecastResult {
  if (!values.length) {
    return {
      predictions: [], trend: "STABLE", trendStrength: 0,
      seasonality: { detected: false }, confidence: 0, method: "none",
      stats: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, count: 0, lastValue: 0, changePercent: 0 },
    };
  }

  const stats = {
    mean: mean(values),
    median: median(values),
    stdDev: stdDev(values),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    lastValue: values[values.length - 1],
    changePercent: values.length > 1 && values[0] !== 0
      ? ((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 100
      : 0,
  };

  // Detect seasonality
  const season = detectSeasonality(values);

  // Choose best method
  let predictions: number[];
  let method: string;

  if (season.detected && values.length >= (season.period || 4) * 2) {
    predictions = holtWinters(values, season.period || 4, options?.alpha, options?.beta, options?.gamma, periodsAhead);
    method = "holt_winters";
  } else if (values.length >= 4) {
    const reg = linearRegression(values);
    if (Math.abs(reg.slope) > stats.stdDev * 0.1) {
      predictions = holtLinear(values, options?.alpha, options?.beta, periodsAhead);
      method = "holt_linear";
    } else {
      predictions = ses(values, options?.alpha, periodsAhead);
      method = "ses";
    }
  } else {
    predictions = ses(values, options?.alpha, periodsAhead);
    method = "ses";
  }

  // Trend analysis
  const trendAnalysis = analyzeTrend(values);

  // Confidence intervals
  const sd = stats.stdDev || stats.mean * 0.1 || 1;
  const predResults = predictions.map((v, i) => {
    const widthFactor = 1 + (i * 0.3); // wider CI for further out
    return {
      period: i + 1,
      value: Math.max(0, Math.round(v * 100) / 100),
      lower: Math.max(0, Math.round((v - 1.96 * sd * widthFactor) * 100) / 100),
      upper: Math.round((v + 1.96 * sd * widthFactor) * 100) / 100,
    };
  });

  // Confidence based on data quality
  let confidence = 50;
  if (values.length >= 12) confidence += 15;
  if (values.length >= 30) confidence += 10;
  if (trendAnalysis.rSquared > 0.5) confidence += 10;
  if (season.detected) confidence += 5;
  if (stats.stdDev / (stats.mean || 1) < 0.3) confidence += 10; // low coefficient of variation

  return {
    predictions: predResults,
    trend: trendAnalysis.direction,
    trendStrength: Math.min(100, Math.round(trendAnalysis.rSquared * 100)),
    seasonality: season,
    confidence: Math.min(95, confidence),
    method,
    stats,
  };
}

/**
 * Analyze trend in data
 */
export function analyzeTrend(values: number[]): TrendAnalysis {
  if (values.length < 2) {
    return { direction: "STABLE", slope: 0, rSquared: 0, percentChange: 0, momentum: 0, breakpoints: [] };
  }

  const reg = linearRegression(values);
  const sd = stdDev(values);
  const m = mean(values);

  // Direction
  let direction: TrendAnalysis["direction"];
  const relativeSlope = m !== 0 ? Math.abs(reg.slope) / Math.abs(m) : 0;
  const cv = m !== 0 ? sd / Math.abs(m) : 0;

  if (cv > 0.5 && reg.rSquared < 0.2) direction = "VOLATILE";
  else if (relativeSlope < 0.005 || reg.rSquared < 0.1) direction = "STABLE";
  else if (reg.slope > 0) direction = "RISING";
  else direction = "DECLINING";

  // Momentum — compare recent slope vs overall slope
  let momentum = 0;
  if (values.length >= 6) {
    const recentHalf = values.slice(Math.floor(values.length / 2));
    const recentReg = linearRegression(recentHalf);
    momentum = reg.slope !== 0 ? (recentReg.slope - reg.slope) / Math.abs(reg.slope) : 0;
  }

  // Breakpoint detection (simple: find where rolling mean changes direction)
  const breakpoints: number[] = [];
  const windowSize = Math.max(3, Math.floor(values.length / 5));
  for (let i = windowSize; i < values.length - windowSize; i++) {
    const before = mean(values.slice(i - windowSize, i));
    const after = mean(values.slice(i, i + windowSize));
    const diff = (after - before) / (Math.abs(before) || 1);
    if (Math.abs(diff) > 0.15) breakpoints.push(i);
  }

  return {
    direction,
    slope: Math.round(reg.slope * 1000) / 1000,
    rSquared: Math.round(reg.rSquared * 1000) / 1000,
    percentChange: values[0] !== 0 ? Math.round(((values[values.length - 1] - values[0]) / Math.abs(values[0])) * 10000) / 100 : 0,
    momentum: Math.round(momentum * 100) / 100,
    breakpoints: Array.from(new Set(breakpoints)).slice(0, 5),
  };
}

/**
 * Detect anomaly in a value relative to a series
 */
export function detectAnomaly(value: number, historicalValues: number[], threshold: number = 2.5): AnomalyResult {
  if (historicalValues.length < 3) {
    return { isAnomaly: false, score: 0, zScore: 0, modifiedZScore: 0, percentile: 50, direction: "NORMAL", explanation: "Insufficient data" };
  }

  const m = mean(historicalValues);
  const sd = stdDev(historicalValues);
  const md = median(historicalValues);
  const madVal = mad(historicalValues);

  // Z-score
  const zScore = sd > 0 ? (value - m) / sd : 0;

  // Modified Z-score (more robust to outliers)
  const modifiedZScore = madVal > 0 ? 0.6745 * (value - md) / madVal : 0;

  // Percentile
  const sorted = [...historicalValues].sort((a, b) => a - b);
  const rank = sorted.filter(v => v <= value).length;
  const pct = (rank / sorted.length) * 100;

  // Anomaly score (0-100)
  const absZ = Math.abs(modifiedZScore);
  const score = Math.min(100, Math.round(absZ * 25));

  const isAnomaly = absZ > threshold;
  const direction = zScore > threshold ? "HIGH" : zScore < -threshold ? "LOW" : "NORMAL";

  let explanation = "Value is within normal range";
  if (isAnomaly) {
    if (direction === "HIGH") {
      explanation = `Value ${value.toFixed(2)} is ${(((value - m) / m) * 100).toFixed(1)}% above the mean (${m.toFixed(2)}). Z-score: ${zScore.toFixed(2)}`;
    } else {
      explanation = `Value ${value.toFixed(2)} is ${(((m - value) / m) * 100).toFixed(1)}% below the mean (${m.toFixed(2)}). Z-score: ${zScore.toFixed(2)}`;
    }
  }

  return { isAnomaly, score, zScore: Math.round(zScore * 100) / 100, modifiedZScore: Math.round(modifiedZScore * 100) / 100, percentile: Math.round(pct), direction, explanation };
}

/**
 * Predict rate for a lane based on historical data
 */
export function predictRate(
  historicalRates: number[],
  currentMarketAvg: number,
  factors?: { distance?: number; isHazmat?: boolean; isExpedited?: boolean; season?: number; demandLevel?: "LOW" | "NORMAL" | "HIGH" }
): RatePrediction {
  if (!historicalRates.length && !currentMarketAvg) {
    return { predictedRate: 0, confidence: 0, range: { low: 0, high: 0 }, trend: "STABLE", factors: [], marketPosition: "AT_MARKET" };
  }

  const fc = historicalRates.length >= 3 ? forecast(historicalRates, 1) : null;
  let baseRate = fc?.predictions[0]?.value || currentMarketAvg || mean(historicalRates);

  const appliedFactors: { name: string; impact: number }[] = [];

  // Hazmat premium
  if (factors?.isHazmat) {
    const premium = baseRate * 0.35;
    baseRate += premium;
    appliedFactors.push({ name: "Hazmat premium", impact: premium });
  }

  // Expedited premium
  if (factors?.isExpedited) {
    const premium = baseRate * 0.20;
    baseRate += premium;
    appliedFactors.push({ name: "Expedited premium", impact: premium });
  }

  // Seasonal adjustment
  if (factors?.season) {
    const seasonalFactors: Record<number, number> = {
      1: -0.05, 2: -0.03, 3: 0.00, 4: 0.02, 5: -0.02, 6: 0.05,
      7: 0.08, 8: 0.10, 9: 0.15, 10: 0.12, 11: 0.08, 12: 0.03,
    };
    const factor = seasonalFactors[factors.season] || 0;
    const impact = baseRate * factor;
    baseRate += impact;
    appliedFactors.push({ name: `Seasonal (month ${factors.season})`, impact });
  }

  // Demand level
  if (factors?.demandLevel === "HIGH") {
    const premium = baseRate * 0.10;
    baseRate += premium;
    appliedFactors.push({ name: "High demand surge", impact: premium });
  } else if (factors?.demandLevel === "LOW") {
    const discount = baseRate * -0.08;
    baseRate += discount;
    appliedFactors.push({ name: "Low demand discount", impact: discount });
  }

  const sd = historicalRates.length > 1 ? stdDev(historicalRates) : baseRate * 0.15;
  const confidence = fc?.confidence || (historicalRates.length > 5 ? 65 : 40);

  let marketPosition: RatePrediction["marketPosition"] = "AT_MARKET";
  if (currentMarketAvg > 0) {
    const diff = (baseRate - currentMarketAvg) / currentMarketAvg;
    if (diff > 0.10) marketPosition = "ABOVE_MARKET";
    else if (diff < -0.10) marketPosition = "BELOW_MARKET";
  }

  return {
    predictedRate: Math.round(baseRate * 100) / 100,
    confidence,
    range: {
      low: Math.max(0, Math.round((baseRate - 1.5 * sd) * 100) / 100),
      high: Math.round((baseRate + 1.5 * sd) * 100) / 100,
    },
    trend: fc?.trend || "STABLE",
    factors: appliedFactors,
    marketPosition,
  };
}

/**
 * Demand volume forecast for a lane/region
 */
export function forecastDemand(
  weeklyVolumes: number[],
  weeksAhead: number = 4
): {
  forecasts: { week: number; volume: number; lower: number; upper: number }[];
  trend: string;
  peakWeek: number;
  avgVolume: number;
  volatility: number; // coefficient of variation
} {
  const fc = forecast(weeklyVolumes, weeksAhead);

  const avgVol = mean(weeklyVolumes);
  const vol = avgVol > 0 ? stdDev(weeklyVolumes) / avgVol : 0;
  const peakWeek = fc.predictions.reduce((best, p, i) =>
    p.value > (fc.predictions[best]?.value || 0) ? i : best, 0) + 1;

  return {
    forecasts: fc.predictions.map(p => ({
      week: p.period,
      volume: Math.round(p.value),
      lower: Math.max(0, Math.round(p.lower)),
      upper: Math.round(p.upper),
    })),
    trend: fc.trend,
    peakWeek,
    avgVolume: Math.round(avgVol),
    volatility: Math.round(vol * 100) / 100,
  };
}
