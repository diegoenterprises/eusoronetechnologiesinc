/**
 * EUSOTRIP MULTI-CURRENCY ENGINE
 * Phase 0 - Cross-Border Audit P0 Blocker
 * Supports USD, CAD, MXN with live exchange rates via exchangerate-api.com
 * Fallback to cached rates if API is unavailable.
 *
 * Usage:
 *   import { convertCurrency, formatCurrency, refreshRates } from './currencyEngine';
 *   const cad = await convertCurrency(1500, 'USD', 'CAD');
 *   const display = formatCurrency(cad, 'CAD'); // "CA$2,045.25"
 */

import { logger } from '../_core/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'CAD' | 'MXN';

export interface ExchangeRates {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  source: 'live' | 'cached' | 'fallback';
}

export interface CurrencyConversion {
  from: CurrencyCode;
  to: CurrencyCode;
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  rateSource: 'live' | 'cached' | 'fallback';
  timestamp: string;
}

// ─── Country → Currency Mapping ─────────────────────────────────────────────

export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
};

// ─── Currency Metadata ──────────────────────────────────────────────────────

export const CURRENCY_META: Record<CurrencyCode, {
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}> = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX', decimals: 2 },
};

// ─── Fallback Rates (updated periodically, used when API is down) ───────────

const FALLBACK_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  USD: { USD: 1, CAD: 1.3650, MXN: 17.15 },
  CAD: { USD: 0.7326, CAD: 1, MXN: 12.564 },
  MXN: { USD: 0.05831, CAD: 0.07959, MXN: 1 },
};

// ─── Rate Cache ─────────────────────────────────────────────────────────────

let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── API Fetch ──────────────────────────────────────────────────────────────

const API_KEY = process.env.EXCHANGE_RATE_API_KEY || '';
const API_BASE = 'https://v6.exchangerate-api.com/v6';

async function fetchLiveRates(base: CurrencyCode = 'USD'): Promise<ExchangeRates | null> {
  if (!API_KEY) {
    logger.warn('[CurrencyEngine] No EXCHANGE_RATE_API_KEY set, using fallback rates');
    return null;
  }

  try {
    const url = `${API_BASE}/${API_KEY}/latest/${base}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      logger.error(`[CurrencyEngine] API returned ${res.status}`);
      return null;
    }

    const data = await res.json() as {
      result: string;
      conversion_rates?: Record<string, number>;
    };

    if (data.result !== 'success' || !data.conversion_rates) {
      logger.error('[CurrencyEngine] API returned non-success result');
      return null;
    }

    const rates: Record<CurrencyCode, number> = {
      USD: data.conversion_rates['USD'] ?? 1,
      CAD: data.conversion_rates['CAD'] ?? FALLBACK_RATES[base].CAD,
      MXN: data.conversion_rates['MXN'] ?? FALLBACK_RATES[base].MXN,
    };

    return {
      base,
      rates,
      updatedAt: new Date().toISOString(),
      source: 'live',
    };
  } catch (err) {
    logger.error('[CurrencyEngine] Failed to fetch live rates:', err);
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function refreshRates(base: CurrencyCode = 'USD'): Promise<ExchangeRates> {
  const live = await fetchLiveRates(base);
  if (live) {
    cachedRates = live;
    lastFetchTime = Date.now();
    logger.info(`[CurrencyEngine] Live rates refreshed: 1 ${base} = ${live.rates.CAD} CAD, ${live.rates.MXN} MXN`);
    return live;
  }

  if (cachedRates && Date.now() - lastFetchTime < CACHE_TTL_MS * 24) {
    return { ...cachedRates, source: 'cached' };
  }

  return {
    base,
    rates: FALLBACK_RATES[base],
    updatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}

export async function getRates(base: CurrencyCode = 'USD'): Promise<ExchangeRates> {
  if (cachedRates && Date.now() - lastFetchTime < CACHE_TTL_MS) {
    return cachedRates;
  }
  return refreshRates(base);
}

export async function getRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
  if (from === to) return 1;
  const rates = await getRates(from);
  return rates.rates[to] ?? FALLBACK_RATES[from][to];
}

export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): Promise<CurrencyConversion> {
  const rate = await getRate(from, to);
  const rates = await getRates(from);

  return {
    from,
    to,
    originalAmount: amount,
    convertedAmount: Math.round(amount * rate * 100) / 100,
    rate,
    rateSource: rates.source,
    timestamp: new Date().toISOString(),
  };
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCY_META[currency];
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.decimals)}`;
  }
}

export function formatRate(rate: number, from: CurrencyCode, to: CurrencyCode): string {
  return `1 ${from} = ${rate.toFixed(4)} ${to}`;
}

// ─── Freight-Specific Helpers ───────────────────────────────────────────────

export async function convertFreightRate(
  ratePerUnit: number,
  from: CurrencyCode,
  to: CurrencyCode,
  unitType: 'per_mile' | 'per_km' | 'flat' = 'flat',
): Promise<{ converted: number; rate: number; display: string }> {
  const conversion = await convertCurrency(ratePerUnit, from, to);
  const suffix = unitType === 'per_mile' ? '/mi' : unitType === 'per_km' ? '/km' : '';
  return {
    converted: conversion.convertedAmount,
    rate: conversion.rate,
    display: formatCurrency(conversion.convertedAmount, to) + suffix,
  };
}

export async function convertInvoiceLineItems(
  items: Array<{ description: string; amount: number; currency: CurrencyCode }>,
  targetCurrency: CurrencyCode,
): Promise<Array<{ description: string; originalAmount: number; originalCurrency: CurrencyCode; convertedAmount: number; targetCurrency: CurrencyCode; rate: number }>> {
  const results = [];
  for (const item of items) {
    const conversion = await convertCurrency(item.amount, item.currency, targetCurrency);
    results.push({
      description: item.description,
      originalAmount: item.amount,
      originalCurrency: item.currency,
      convertedAmount: conversion.convertedAmount,
      targetCurrency,
      rate: conversion.rate,
    });
  }
  return results;
}

// ─── Duty & Tax Estimation (for customs) ────────────────────────────────────

export interface DutyEstimate {
  dutiableValue: number;
  dutiableValueCurrency: CurrencyCode;
  dutyRate: number;
  dutyAmount: number;
  vatRate: number;
  vatAmount: number;
  totalDutyAndTax: number;
  currency: CurrencyCode;
}

export async function estimateMexicanDuty(
  commercialValueUSD: number,
  htsRate: number = 0.05,
): Promise<DutyEstimate> {
  const conversion = await convertCurrency(commercialValueUSD, 'USD', 'MXN');
  const dutiableValue = conversion.convertedAmount;
  const dutyAmount = Math.round(dutiableValue * htsRate * 100) / 100;
  const vatBase = dutiableValue + dutyAmount;
  const vatRate = 0.16; // Mexico IVA = 16%
  const vatAmount = Math.round(vatBase * vatRate * 100) / 100;

  return {
    dutiableValue,
    dutiableValueCurrency: 'MXN',
    dutyRate: htsRate,
    dutyAmount,
    vatRate,
    vatAmount,
    totalDutyAndTax: Math.round((dutyAmount + vatAmount) * 100) / 100,
    currency: 'MXN',
  };
}

export async function estimateCanadianDuty(
  commercialValueUSD: number,
  htsRate: number = 0.0,
  isUSMCA: boolean = true,
): Promise<DutyEstimate> {
  const conversion = await convertCurrency(commercialValueUSD, 'USD', 'CAD');
  const dutiableValue = conversion.convertedAmount;
  const effectiveDutyRate = isUSMCA ? 0 : htsRate;
  const dutyAmount = Math.round(dutiableValue * effectiveDutyRate * 100) / 100;
  const vatBase = dutiableValue + dutyAmount;
  const vatRate = 0.05; // Canada GST = 5%
  const vatAmount = Math.round(vatBase * vatRate * 100) / 100;

  return {
    dutiableValue,
    dutiableValueCurrency: 'CAD',
    dutyRate: effectiveDutyRate,
    dutyAmount,
    vatRate,
    vatAmount,
    totalDutyAndTax: Math.round((dutyAmount + vatAmount) * 100) / 100,
    currency: 'CAD',
  };
}
