/**
 * useLocale — Unified localization hook
 * Combines react-i18next translation with locale-aware formatting:
 *  - Currency formatting (USD/CAD/MXN) using Intl.NumberFormat
 *  - Date/time formatting using Intl.DateTimeFormat
 *  - Number formatting (weights, distances) using Intl.NumberFormat
 *  - Menu label translation via nav.* keys
 *
 * Usage:
 *   const { t, formatCurrency, formatDate, formatNumber, translateLabel } = useLocale();
 *   <span>{t('loads.title')}</span>
 *   <span>{formatCurrency(1500, 'USD')}</span>
 *   <span>{formatDate(new Date())}</span>
 *   <span>{translateLabel('Dashboard')}</span>
 */

import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';

// ─── Locale → Intl Locale mapping ────────────────────────────────────────────

const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-US',
  es: 'es-MX',
  fr: 'fr-CA',
  pt: 'pt-BR',
  de: 'de-DE',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ar: 'ar-SA',
  ru: 'ru-RU',
  ja: 'ja-JP',
  ko: 'ko-KR',
  vi: 'vi-VN',
};

// ─── Currency codes ──────────────────────────────────────────────────────────

type CurrencyCode = 'USD' | 'CAD' | 'MXN' | 'EUR' | 'GBP';

// ─── Menu label → i18n key mapping ───────────────────────────────────────────
// Maps hardcoded English menu labels to their translation keys.

const LABEL_KEY_MAP: Record<string, string> = {
  'Dashboard': 'nav.dashboard',
  'Loads': 'nav.loads',
  'Messages': 'nav.messages',
  'Settings': 'nav.settings',
  'Support': 'nav.support',
  'News': 'nav.news',
  'Billing': 'nav.billing',
  'EusoWallet': 'nav.wallet',
  'My Partners': 'nav.partners',
  'Training': 'nav.training',
  'Training Center': 'training.title',
  'The Haul': 'nav.theHaul',
  'More': 'nav.more',
  'Compliance': 'nav.compliance',
  'Safety': 'nav.safety',
  'Safety Center': 'safety.title',
  'Fleet': 'nav.fleet',
  'Fleet Management': 'fleet.title',
  'Dispatch': 'nav.dispatch',
  'Dispatch Center': 'dispatch.title',
  'Terminal': 'nav.terminal',
  'Terminal Management': 'terminal.title',
  'Agreements': 'nav.agreements',
  'Hot Zones': 'nav.hotZones',
  'Load Board': 'nav.loadBoard',
  'Find Loads': 'nav.findLoads',
  'Marketplace': 'nav.marketplace',
  'Rate Sheet': 'nav.rateSheet',
  'Insurance': 'nav.insurance',
  'Gamification': 'nav.gamification',
  'Wellness & Retention': 'nav.wellness',
  'Mobile Hub': 'nav.mobileHub',
  'The Lobby': 'nav.lobby',
  'Integrations': 'nav.integrations',
  'Analytics': 'nav.analytics',
  'Reports': 'nav.reports',
  'Rail': 'nav.rail',
  'Rail Operations': 'rail.title',
  'Vessel': 'nav.vessel',
  'Maritime Operations': 'vessel.title',
  'Intermodal': 'nav.intermodal',
  'Cross-Border': 'crossBorder.title',
  'Cross-Border Operations': 'crossBorder.title',
  // Common action labels
  'Save': 'common.save',
  'Cancel': 'common.cancel',
  'Delete': 'common.delete',
  'Edit': 'common.edit',
  'Create': 'common.create',
  'Search': 'common.search',
  'Filter': 'common.filter',
  'Submit': 'common.submit',
  'Confirm': 'common.confirm',
  'Back': 'common.back',
  'Next': 'common.next',
  'Close': 'common.close',
  'View': 'common.view',
  'View All': 'common.viewAll',
  'Loading...': 'common.loading',
  'No results found': 'common.noResults',
  // Load-specific
  'Create Load': 'loads.createLoad',
  'My Loads': 'loads.myLoads',
  'Available Loads': 'loads.available',
  'Track Load': 'loads.trackLoad',
  'Load Details': 'loads.loadDetails',
  'Submit Bid': 'loads.submitBid',
  // Payment-specific
  'Payments': 'payments.title',
  'Settlement': 'payments.settlement',
  'Settlements': 'payments.settlements',
  'Invoice': 'payments.invoice',
  'Invoices': 'payments.invoices',
  // Dispatch-specific
  'Dispatch Board': 'dispatch.board',
  'Assignments': 'dispatch.assignments',
  'Check Calls': 'dispatch.checkCalls',
  // Safety-specific
  'Incidents': 'safety.incidents',
  'Inspections': 'safety.inspections',
  'Violations': 'safety.violations',
  // Auth-specific
  'Log In': 'auth.login',
  'Log Out': 'auth.logout',
  'Register': 'auth.register',
};

export function useLocale() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || 'en';
  const intlLocale = LANG_TO_LOCALE[lang] || 'en-US';

  // ─── Currency formatting ───────────────────────────────────────────────────

  const formatCurrency = useCallback((amount: number, currency: CurrencyCode = 'USD'): string => {
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, [intlLocale]);

  // ─── Date formatting ──────────────────────────────────────────────────────

  const formatDate = useCallback((date: Date | string, options?: {
    includeTime?: boolean;
    relative?: boolean;
    short?: boolean;
  }): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);

    if (options?.relative) {
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t('time.justNow', 'Just now');
      if (diffMins < 60) return t('time.minutesAgo', '{{count}} min ago', { count: diffMins });
      if (diffHrs < 24) return t('time.hoursAgo', '{{count}}h ago', { count: diffHrs });
      if (diffDays < 7) return t('time.daysAgo', '{{count}}d ago', { count: diffDays });
    }

    try {
      if (options?.short) {
        return new Intl.DateTimeFormat(intlLocale, {
          month: 'short', day: 'numeric',
        }).format(d);
      }
      const fmt: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'short', day: 'numeric',
        ...(options?.includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      };
      return new Intl.DateTimeFormat(intlLocale, fmt).format(d);
    } catch {
      return d.toLocaleDateString();
    }
  }, [intlLocale, t]);

  // ─── Number formatting (weights, distances, percentages) ───────────────────

  const formatNumber = useCallback((value: number, options?: {
    unit?: 'lb' | 'kg' | 'mi' | 'km' | 'gal' | 'L';
    decimals?: number;
    compact?: boolean;
    percent?: boolean;
  }): string => {
    try {
      if (options?.percent) {
        return new Intl.NumberFormat(intlLocale, {
          style: 'percent',
          minimumFractionDigits: options?.decimals ?? 1,
          maximumFractionDigits: options?.decimals ?? 1,
        }).format(value / 100);
      }
      if (options?.compact) {
        return new Intl.NumberFormat(intlLocale, {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(value);
      }
      const formatted = new Intl.NumberFormat(intlLocale, {
        minimumFractionDigits: options?.decimals ?? 0,
        maximumFractionDigits: options?.decimals ?? 2,
      }).format(value);
      return options?.unit ? `${formatted} ${options.unit}` : formatted;
    } catch {
      return `${value}`;
    }
  }, [intlLocale]);

  // ─── Menu label translation ────────────────────────────────────────────────

  const translateLabel = useCallback((label: string): string => {
    const key = LABEL_KEY_MAP[label];
    if (key) {
      const translated = t(key, label);
      return translated;
    }
    return label;
  }, [t]);

  // ─── Language info ─────────────────────────────────────────────────────────

  const currentLanguage = useMemo(() => ({
    code: lang,
    locale: intlLocale,
    isRTL: lang === 'ar',
    name: t(`language.${lang}`, lang.toUpperCase()),
  }), [lang, intlLocale, t]);

  const changeLanguage = useCallback((code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  }, [i18n]);

  return {
    t,
    i18n,
    lang,
    intlLocale,
    formatCurrency,
    formatDate,
    formatNumber,
    translateLabel,
    currentLanguage,
    changeLanguage,
  };
}

export default useLocale;

/**
 * Standalone currency formatter for use outside React components.
 * For component usage, prefer the `formatCurrency` from the `useLocale()` hook
 * which is locale-aware based on the current i18n language.
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount));
}
