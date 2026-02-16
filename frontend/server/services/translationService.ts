/**
 * TRANSLATION SERVICE
 * Uses ESANG AI to translate RSS feeds
 * to user's preferred language automatically
 */

import { invokeLLM } from "../_core/llm";

interface TranslationCache {
  [key: string]: {
    translated: string;
    timestamp: number;
    language: string;
  };
}

const translationCache: TranslationCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Detect user language from browser locale or user profile
 */
export function detectUserLanguage(userLocale?: string): string {
  if (userLocale) {
    const lang = userLocale.split("-")[0].toLowerCase();
    return lang;
  }

  // Fallback to navigator language if available
  if (typeof navigator !== "undefined") {
    return navigator.language.split("-")[0].toLowerCase();
  }

  return "en"; // Default to English
}

/**
 * Translate text using ESANG AI
 * Automatically selects best model based on language and content
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "en"
): Promise<string> {
  // Skip if already in target language
  if (sourceLanguage === targetLanguage || targetLanguage === "en") {
    return text;
  }

  // Check cache first
  const cacheKey = `${text.substring(0, 50)}_${sourceLanguage}_${targetLanguage}`;
  if (translationCache[cacheKey]) {
    const cached = translationCache[cacheKey];
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.translated;
    }
  }

  try {
    // Use ESANG AI (LLM) for translation
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. 
          Maintain the original meaning, tone, and formatting. Return ONLY the translated text, nothing else.
          If the text is already in the target language, return it as-is.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const translated =
      typeof response.choices[0].message.content === "string"
        ? response.choices[0].message.content.trim()
        : text;

    // Cache the translation
    translationCache[cacheKey] = {
      translated,
      timestamp: Date.now(),
      language: targetLanguage,
    };

    return translated;
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate RSS feed item
 */
export async function translateFeedItem(
  item: {
    title: string;
    description?: string;
    content?: string;
  },
  targetLanguage: string
): Promise<{
  title: string;
  description?: string;
  content?: string;
}> {
  try {
    const [translatedTitle, translatedDescription, translatedContent] = await Promise.all([
      translateText(item.title, targetLanguage),
      item.description ? translateText(item.description, targetLanguage) : Promise.resolve(undefined),
      item.content ? translateText(item.content, targetLanguage) : Promise.resolve(undefined),
    ]);

    return {
      title: translatedTitle,
      description: translatedDescription,
      content: translatedContent,
    };
  } catch (error) {
    console.error("Feed item translation error:", error);
    return item;
  }
}

/**
 * Batch translate multiple items
 */
export async function translateBatch(
  items: Array<{ title: string; description?: string }>,
  targetLanguage: string
): Promise<Array<{ title: string; description?: string }>> {
  // Translate up to 5 items in parallel
  const batchSize = 5;
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const translated = await Promise.all(
      batch.map((item) => translateFeedItem(item, targetLanguage))
    );
    results.push(...translated);
  }

  return results;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach((key) => {
    delete translationCache[key];
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: number;
  oldestEntry: number | null;
} {
  const entries = Object.keys(translationCache);
  const timestamps = entries.map((key) => translationCache[key].timestamp);

  return {
    size: entries.length,
    entries: entries.length,
    oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
  };
}

/**
 * Language detection helper
 */
export const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  id: "Indonesian",
  fil: "Filipino",
  uk: "Ukrainian",
};

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES] || code;
}

