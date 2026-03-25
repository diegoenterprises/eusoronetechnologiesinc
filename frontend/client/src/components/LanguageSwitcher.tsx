// GAP-447: i18n Language Switcher
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";

const LANGS = [
  { code: "en", flag: "US", label: "EN" },
  { code: "es", flag: "ES", label: "ES" },
  { code: "fr", flag: "FR", label: "FR" },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.substring(0, 2) || "en";

  if (compact) {
    return (
      <div className="flex items-center gap-0.5">
        {LANGS.map(l => (
          <button key={l.code} onClick={() => i18n.changeLanguage(l.code)}
            className={cn("px-1.5 py-0.5 rounded text-xs font-bold transition-colors",
              current === l.code ? "bg-white/[0.08] text-white" : "text-slate-600 hover:text-slate-400")}>
            {l.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Languages className="w-3.5 h-3.5 text-slate-500" />
      {LANGS.map(l => (
        <button key={l.code} onClick={() => i18n.changeLanguage(l.code)}
          className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors border",
            current === l.code
              ? "bg-white/[0.06] text-white border-white/[0.12]"
              : "text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.03]")}>
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </button>
      ))}
    </div>
  );
}
