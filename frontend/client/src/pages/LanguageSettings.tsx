/**
 * LANGUAGE SETTINGS PAGE
 * User-facing language and locale preferences screen.
 * Allows users to select their preferred language, date/time format,
 * measurement units, and currency display.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Globe, CheckCircle, Clock, Ruler, DollarSign,
  Calendar, ChevronRight, Settings, Search
} from "lucide-react";

type Language = { code: string; name: string; native: string; flag: string };
type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
type MeasurementSystem = "imperial" | "metric";
type TimeFormat = "12h" | "24h";

const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", flag: "US" },
  { code: "es", name: "Spanish", native: "Español", flag: "MX" },
  { code: "fr", name: "French", native: "Français", flag: "FR" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "BR" },
  { code: "de", name: "German", native: "Deutsch", flag: "DE" },
  { code: "zh", name: "Chinese (Simplified)", native: "简体中文", flag: "CN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "IN" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "SA" },
  { code: "ru", name: "Russian", native: "Русский", flag: "RU" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "JP" },
  { code: "ko", name: "Korean", native: "한국어", flag: "KR" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "VN" },
];

export default function LanguageSettings() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [selectedLang, setSelectedLang] = useState("en");
  const [dateFormat, setDateFormat] = useState<DateFormat>("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");
  const [measurement, setMeasurement] = useState<MeasurementSystem>("imperial");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLangs = LANGUAGES.filter(
    (l) => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.native.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    toast.success("Language and locale preferences saved");
  };

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Language & Region
        </h1>
        <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
          Set your preferred language, date, time, and measurement formats
        </p>
      </div>

      {/* Language Selection */}
      <Card className={cn(cc, "overflow-hidden")}>
        <div className="h-1.5 bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" />
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Globe className="w-5 h-5 text-[#1473FF]" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <div className={cn("relative rounded-xl border", isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.02] border-white/[0.06]")}>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search languages..."
              className={cn("w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border-0 bg-transparent focus:outline-none", isLight ? "text-slate-800 placeholder:text-slate-400" : "text-white placeholder:text-slate-400")}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filteredLangs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  selectedLang === lang.code
                    ? "bg-[#1473FF]/10 border-[#1473FF]/30 ring-1 ring-[#1473FF]/20"
                    : isLight
                      ? "bg-white border-slate-200 hover:border-slate-300"
                      : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                  selectedLang === lang.code ? "bg-[#1473FF]/20 text-[#1473FF]" : isLight ? "bg-slate-100 text-slate-500" : "bg-white/[0.04] text-slate-400"
                )}>
                  {lang.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", selectedLang === lang.code ? "text-[#1473FF]" : isLight ? "text-slate-800" : "text-white")}>
                    {lang.name}
                  </p>
                  <p className={cn("text-[10px] truncate", isLight ? "text-slate-400" : "text-slate-500")}>{lang.native}</p>
                </div>
                {selectedLang === lang.code && <CheckCircle className="w-4 h-4 text-[#1473FF] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Format */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Calendar className="w-5 h-5 text-[#BE01FF]" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className={cn("text-xs font-medium mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Date Format</p>
            <div className="flex gap-2">
              {(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as DateFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setDateFormat(fmt)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border text-sm font-mono font-medium transition-all",
                    dateFormat === fmt
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
                      : isLight
                        ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-slate-600"
                  )}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={cn("text-xs font-medium mb-2", isLight ? "text-slate-500" : "text-slate-400")}>Time Format</p>
            <div className="flex gap-2">
              {(["12h", "24h"] as TimeFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setTimeFormat(fmt)}
                  className={cn(
                    "flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                    timeFormat === fmt
                      ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-transparent shadow-sm"
                      : isLight
                        ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-slate-600"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {fmt === "12h" ? "12-Hour (AM/PM)" : "24-Hour (Military)"}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("p-3 rounded-xl", isLight ? "bg-slate-50" : "bg-slate-700/30")}>
            <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>Preview</p>
            <p className={cn("text-sm font-mono font-medium mt-1", isLight ? "text-slate-800" : "text-white")}>
              {dateFormat === "MM/DD/YYYY" ? "02/16/2026" : dateFormat === "DD/MM/YYYY" ? "16/02/2026" : "2026-02-16"}{" "}
              {timeFormat === "12h" ? "4:38 PM" : "16:38"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Measurement System */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Ruler className="w-5 h-5 text-[#1473FF]" />
            Measurement System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "imperial" as MeasurementSystem, label: "Imperial (US)", details: "Miles, Pounds, Gallons, Fahrenheit" },
              { id: "metric" as MeasurementSystem, label: "Metric", details: "Kilometers, Kilograms, Liters, Celsius" },
            ]).map((sys) => (
              <button
                key={sys.id}
                onClick={() => setMeasurement(sys.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                  measurement === sys.id
                    ? "bg-[#1473FF]/10 border-[#1473FF]/30 shadow-md"
                    : isLight
                      ? "bg-white border-slate-200 hover:border-slate-300"
                      : "bg-white/[0.02] border-slate-700/30 hover:border-slate-600"
                )}
              >
                <div className={cn("p-3 rounded-xl", measurement === sys.id ? "bg-[#1473FF]/15" : isLight ? "bg-slate-100" : "bg-slate-700/30")}>
                  <Ruler className={cn("w-6 h-6", measurement === sys.id ? "text-[#1473FF]" : "text-slate-400")} />
                </div>
                <p className={cn("text-sm font-bold", measurement === sys.id ? "text-[#1473FF]" : isLight ? "text-slate-700" : "text-slate-200")}>
                  {sys.label}
                </p>
                <p className={cn("text-[10px] text-center", isLight ? "text-slate-400" : "text-slate-500")}>{sys.details}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white border-0 rounded-xl text-base font-medium shadow-lg shadow-purple-500/20"
        onClick={handleSave}
      >
        <CheckCircle className="w-5 h-5 mr-2" />
        Save Preferences
      </Button>
    </div>
  );
}
