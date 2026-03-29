/**
 * SHIP LOGS — V5 Multi-Modal
 * IMO-mandated Official Log Book, Oil Record Book (Parts I & II), Garbage Record Book
 * Critical compliance page for SHIP_CAPTAIN role
 * Covers MARPOL Annex I (oil), Annex V (garbage), and SOLAS Chapter II-1
 */

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Droplets,
  Fuel,
  Trash2,
  Plus,
  Calendar,
  MapPin,
  CloudSun,
  Anchor,
  Ship,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Eye,
  Pen,
  XCircle,
  Waves,
  Flame,
  Recycle,
  Bug,
  Fish,
  Cpu,
  Package,
  UtensilsCrossed,
  CookingPot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ───────────────────── Types ───────────────────── */

interface OfficialLogEntry {
  id: string;
  dateTime: string;
  position: string;
  weather: string;
  eventType: "arrival" | "departure" | "drill" | "incident" | "crew_change" | "navigation" | "general";
  description: string;
  masterSignature: string;
  verified: boolean;
}

interface OilRecordPartI {
  id: string;
  date: string;
  operationCode: string;
  operationType: "ballasting_cleaning" | "disposal_residues" | "discharge_bilge" | "internal_transfer" | "accidental_discharge" | "bunkering" | "condition_monitoring";
  tankIdentity: string;
  quantityM3: number;
  retainedOnBoard: number;
  dischargedToSea: number;
  dischargedToReception: number;
  officerSignature: string;
  masterSignature: string;
  remarks: string;
}

interface OilRecordPartII {
  id: string;
  date: string;
  operationCode: string;
  operationType: "loading" | "unloading" | "tank_washing" | "ballasting" | "discharge_dirty_ballast" | "slop_tank" | "accidental_discharge";
  tankIdentity: string;
  cargoType: string;
  quantityM3: number;
  retainedOnBoard: number;
  dischargedToSea: number;
  dischargedToReception: number;
  ppmReading: number | null;
  officerSignature: string;
  masterSignature: string;
  remarks: string;
}

interface GarbageRecordEntry {
  id: string;
  date: string;
  category: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";
  categoryName: string;
  disposalMethod: "discharged_to_sea" | "incinerated" | "delivered_to_reception" | "accidental_loss";
  estimatedAmountM3: number;
  position: string;
  distanceFromShore_nm: number | null;
  receptionFacility: string | null;
  officerSignature: string;
  remarks: string;
}

/* ───────────────────── Static Reference Data ───────────────────── */

const EVENT_TYPES = [
  { value: "arrival", label: "Arrival in Port", color: "text-emerald-400" },
  { value: "departure", label: "Departure from Port", color: "text-blue-400" },
  { value: "drill", label: "Safety Drill", color: "text-amber-400" },
  { value: "incident", label: "Incident / Accident", color: "text-red-400" },
  { value: "crew_change", label: "Crew Change", color: "text-purple-400" },
  { value: "navigation", label: "Navigation Event", color: "text-cyan-400" },
  { value: "general", label: "General Entry", color: "text-slate-400" },
];

const OIL_OPS_PART_I = [
  { value: "ballasting_cleaning", label: "Ballasting/Cleaning of Fuel Tanks", code: "C" },
  { value: "disposal_residues", label: "Disposal of Oil Residues (Sludge)", code: "D" },
  { value: "discharge_bilge", label: "Discharge of Bilge Water", code: "E" },
  { value: "internal_transfer", label: "Internal Transfer of Oil", code: "B" },
  { value: "accidental_discharge", label: "Accidental/Exceptional Discharge", code: "G" },
  { value: "bunkering", label: "Bunkering of Fuel Oil", code: "A" },
  { value: "condition_monitoring", label: "Condition Monitoring of Equipment", code: "F" },
];

const OIL_OPS_PART_II = [
  { value: "loading", label: "Loading of Cargo", code: "H" },
  { value: "unloading", label: "Unloading of Cargo", code: "I" },
  { value: "tank_washing", label: "Tank Washing (COW/Water)", code: "J" },
  { value: "ballasting", label: "Ballasting of Cargo Tanks", code: "K" },
  { value: "discharge_dirty_ballast", label: "Discharge of Dirty Ballast", code: "L" },
  { value: "slop_tank", label: "Settling/Transfer to Slop Tank", code: "M" },
  { value: "accidental_discharge", label: "Accidental/Exceptional Discharge", code: "N" },
];

const GARBAGE_CATEGORIES = [
  { cat: "A", name: "Plastics", icon: Package, color: "text-red-400" },
  { cat: "B", name: "Food Waste", icon: UtensilsCrossed, color: "text-green-400" },
  { cat: "C", name: "Domestic Waste", icon: Trash2, color: "text-orange-400" },
  { cat: "D", name: "Cooking Oil", icon: CookingPot, color: "text-amber-400" },
  { cat: "E", name: "Incinerator Ash", icon: Flame, color: "text-gray-400" },
  { cat: "F", name: "Operational Waste", icon: Recycle, color: "text-blue-400" },
  { cat: "G", name: "Animal Carcasses", icon: Bug, color: "text-purple-400" },
  { cat: "H", name: "Fishing Gear", icon: Fish, color: "text-cyan-400" },
  { cat: "I", name: "E-Waste", icon: Cpu, color: "text-pink-400" },
];

const DISPOSAL_METHODS = [
  { value: "discharged_to_sea", label: "Discharged to Sea" },
  { value: "incinerated", label: "Incinerated" },
  { value: "delivered_to_reception", label: "Delivered to Reception Facility" },
  { value: "accidental_loss", label: "Accidental Loss" },
];

/* ───────────────────── Mock Data Generator ───────────────────── */

function generateMockOfficialLog(): OfficialLogEntry[] {
  return [
    { id: "OL-001", dateTime: "2026-03-28T06:00:00Z", position: "51.5074°N, 0.1278°W", weather: "SW 15kt, moderate swell, overcast", eventType: "departure", description: "Departed Port of London, Tilbury Docks. All cargo secured, crew at stations. Pilot disembarked at Gravesend Reach.", masterSignature: "Capt. J. Morrison", verified: true },
    { id: "OL-002", dateTime: "2026-03-28T10:30:00Z", position: "50.3755°N, 1.1743°W", weather: "SW 20kt, rough seas, rain squalls", eventType: "navigation", description: "Altered course to 210° to avoid reported fishing fleet concentration. Speed reduced to 12 knots.", masterSignature: "Capt. J. Morrison", verified: true },
    { id: "OL-003", dateTime: "2026-03-28T14:00:00Z", position: "49.9423°N, 2.1547°W", weather: "W 18kt, moderate seas, clearing", eventType: "drill", description: "Fire drill conducted — all hands mustered in 4 min 20 sec. Fire teams deployed to simulated engine room fire. Equipment functional, all crew accounted for.", masterSignature: "Capt. J. Morrison", verified: true },
    { id: "OL-004", dateTime: "2026-03-27T08:15:00Z", position: "51.9500°N, 1.3500°E", weather: "NE 8kt, calm seas, clear", eventType: "arrival", description: "Arrived Port of Felixstowe, berth 9. Pilot boarded at Sunk light vessel. All fast at 0845 UTC.", masterSignature: "Capt. J. Morrison", verified: true },
    { id: "OL-005", dateTime: "2026-03-26T16:45:00Z", position: "52.1000°N, 2.3000°E", weather: "N 25kt, heavy seas, overcast", eventType: "incident", description: "Container #MSCU7234561 shifted in bay 42, row 08. Lashing teams dispatched, cargo re-secured by 1830 UTC. No injuries, no damage to adjacent containers.", masterSignature: "Capt. J. Morrison", verified: false },
    { id: "OL-006", dateTime: "2026-03-26T07:00:00Z", position: "53.0000°N, 3.5000°E", weather: "NW 12kt, slight seas, partly cloudy", eventType: "crew_change", description: "Chief Engineer R. Patel relieved by Chief Engineer S. Yamamoto at Rotterdam anchorage. Full handover of engine room documentation completed.", masterSignature: "Capt. J. Morrison", verified: true },
    { id: "OL-007", dateTime: "2026-03-25T20:00:00Z", position: "52.4500°N, 4.3000°E", weather: "W 10kt, calm, clear", eventType: "general", description: "Clocks advanced 1 hour for CET zone transition. All watchkeepers notified. Ship's time now UTC+1.", masterSignature: "Capt. J. Morrison", verified: true },
  ];
}

function generateMockOilPartI(): OilRecordPartI[] {
  return [
    { id: "ORB1-001", date: "2026-03-28", operationCode: "D", operationType: "disposal_residues", tankIdentity: "Sludge Tank P/S", quantityM3: 2.5, retainedOnBoard: 0, dischargedToSea: 0, dischargedToReception: 2.5, officerSignature: "C/E S. Yamamoto", masterSignature: "Capt. J. Morrison", remarks: "Disposed to shore reception at Tilbury, receipt #TIL-2026-0384" },
    { id: "ORB1-002", date: "2026-03-27", operationCode: "E", operationType: "discharge_bilge", tankIdentity: "Engine Room Bilge", quantityM3: 1.8, retainedOnBoard: 0.3, dischargedToSea: 1.5, dischargedToReception: 0, officerSignature: "C/E S. Yamamoto", masterSignature: "Capt. J. Morrison", remarks: "OWS discharge — confirmed <15ppm via ODME. Position: 51.2°N 1.5°E, speed 14 kts" },
    { id: "ORB1-003", date: "2026-03-26", operationCode: "A", operationType: "bunkering", tankIdentity: "FO Tank 3P, 3S", quantityM3: 450, retainedOnBoard: 450, dischargedToSea: 0, dischargedToReception: 0, officerSignature: "C/E S. Yamamoto", masterSignature: "Capt. J. Morrison", remarks: "Bunkered 450m³ VLSFO 0.50% S from barge 'Fuelmaster 7' at Rotterdam" },
    { id: "ORB1-004", date: "2026-03-25", operationCode: "C", operationType: "ballasting_cleaning", tankIdentity: "FO Settling Tank 1", quantityM3: 8.0, retainedOnBoard: 0, dischargedToSea: 0, dischargedToReception: 8.0, officerSignature: "C/E R. Patel", masterSignature: "Capt. J. Morrison", remarks: "Tank cleaned for inspection. All residues to shore reception, Rotterdam" },
    { id: "ORB1-005", date: "2026-03-24", operationCode: "F", operationType: "condition_monitoring", tankIdentity: "OWS Unit #2", quantityM3: 0, retainedOnBoard: 0, dischargedToSea: 0, dischargedToReception: 0, officerSignature: "C/E R. Patel", masterSignature: "Capt. J. Morrison", remarks: "Monthly OWS test — alarm activated at 14.2 ppm. Unit operational and within limits." },
  ];
}

function generateMockOilPartII(): OilRecordPartII[] {
  return [
    { id: "ORB2-001", date: "2026-03-28", operationCode: "I", operationType: "unloading", tankIdentity: "Cargo Tanks 1C, 2C, 3C", cargoType: "Crude Oil (Arabian Light)", quantityM3: 12500, retainedOnBoard: 200, dischargedToSea: 0, dischargedToReception: 0, ppmReading: null, officerSignature: "C/O K. Andersen", masterSignature: "Capt. J. Morrison", remarks: "Discharge to Fawley refinery terminal. ROB clingage est. 200m³" },
    { id: "ORB2-002", date: "2026-03-27", operationCode: "J", operationType: "tank_washing", tankIdentity: "Cargo Tank 4P", cargoType: "Previous: Naphtha", quantityM3: 85, retainedOnBoard: 85, dischargedToSea: 0, dischargedToReception: 0, ppmReading: null, officerSignature: "C/O K. Andersen", masterSignature: "Capt. J. Morrison", remarks: "COW + water wash. Slops retained in slop tank for next discharge" },
    { id: "ORB2-003", date: "2026-03-26", operationCode: "K", operationType: "ballasting", tankIdentity: "Cargo Tanks 5P, 5S", cargoType: "N/A (Clean ballast)", quantityM3: 8400, retainedOnBoard: 8400, dischargedToSea: 0, dischargedToReception: 0, ppmReading: null, officerSignature: "C/O K. Andersen", masterSignature: "Capt. J. Morrison", remarks: "SBT ballasting for laden voyage stability. Segregated ballast system." },
    { id: "ORB2-004", date: "2026-03-25", operationCode: "H", operationType: "loading", tankIdentity: "All cargo tanks (1-5 P/C/S)", cargoType: "Crude Oil (Arabian Light)", quantityM3: 95000, retainedOnBoard: 95000, dischargedToSea: 0, dischargedToReception: 0, ppmReading: null, officerSignature: "C/O K. Andersen", masterSignature: "Capt. J. Morrison", remarks: "Loaded at Ras Tanura. Ullage surveys completed. B/L qty: 94,872m³" },
  ];
}

function generateMockGarbageRecord(): GarbageRecordEntry[] {
  return [
    { id: "GRB-001", date: "2026-03-28", category: "B", categoryName: "Food Waste", disposalMethod: "discharged_to_sea", estimatedAmountM3: 0.3, position: "49.5°N 3.2°W", distanceFromShore_nm: 28, receptionFacility: null, officerSignature: "2/O L. Chen", remarks: "Comminuted food waste. >12nm from nearest land (MARPOL V Reg 4)" },
    { id: "GRB-002", date: "2026-03-27", category: "A", categoryName: "Plastics", disposalMethod: "delivered_to_reception", estimatedAmountM3: 0.8, position: "51.95°N 1.35°E", distanceFromShore_nm: null, receptionFacility: "Felixstowe Port Waste Mgmt", officerSignature: "2/O L. Chen", remarks: "All plastics retained and delivered. Receipt #FPW-2026-1122" },
    { id: "GRB-003", date: "2026-03-27", category: "C", categoryName: "Domestic Waste", disposalMethod: "delivered_to_reception", estimatedAmountM3: 1.2, position: "51.95°N 1.35°E", distanceFromShore_nm: null, receptionFacility: "Felixstowe Port Waste Mgmt", officerSignature: "2/O L. Chen", remarks: "Paper, rags, glass, metal. Receipt #FPW-2026-1123" },
    { id: "GRB-004", date: "2026-03-26", category: "E", categoryName: "Incinerator Ash", disposalMethod: "delivered_to_reception", estimatedAmountM3: 0.15, position: "51.90°N 4.50°E", distanceFromShore_nm: null, receptionFacility: "Rotterdam Europoort Waste", officerSignature: "2/O L. Chen", remarks: "Ash from incinerator operations 22-25 March. Receipt #REW-0588" },
    { id: "GRB-005", date: "2026-03-25", category: "F", categoryName: "Operational Waste", disposalMethod: "delivered_to_reception", estimatedAmountM3: 0.5, position: "51.90°N 4.50°E", distanceFromShore_nm: null, receptionFacility: "Rotterdam Europoort Waste", officerSignature: "2/O L. Chen", remarks: "Used filters, wiping rags, protective clothing. Receipt #REW-0589" },
    { id: "GRB-006", date: "2026-03-24", category: "D", categoryName: "Cooking Oil", disposalMethod: "delivered_to_reception", estimatedAmountM3: 0.08, position: "51.90°N 4.50°E", distanceFromShore_nm: null, receptionFacility: "Rotterdam Europoort Waste", officerSignature: "2/O L. Chen", remarks: "Used cooking oil from galley. Receipt #REW-0590" },
    { id: "GRB-007", date: "2026-03-23", category: "I", categoryName: "E-Waste", disposalMethod: "delivered_to_reception", estimatedAmountM3: 0.05, position: "51.90°N 4.50°E", distanceFromShore_nm: null, receptionFacility: "Rotterdam Europoort Waste", officerSignature: "2/O L. Chen", remarks: "Expired UPS batteries (2x), defunct bridge display unit. Receipt #REW-0591" },
    { id: "GRB-008", date: "2026-03-22", category: "B", categoryName: "Food Waste", disposalMethod: "incinerated", estimatedAmountM3: 0.4, position: "54.0°N 2.0°E", distanceFromShore_nm: 45, receptionFacility: null, officerSignature: "2/O L. Chen", remarks: "Non-comminuted food waste incinerated. Incinerator log #INC-0422" },
  ];
}

/* ───────────────────── Shared Sub-Components ───────────────────── */

function SectionLabel({ children, isLight }: { children: React.ReactNode; isLight: boolean }) {
  return (
    <label className={cn("block text-xs font-semibold mb-1", isLight ? "text-slate-600" : "text-slate-300")}>
      {children}
    </label>
  );
}

function InputField({
  label, value, onChange, placeholder, type = "text", isLight, required = false, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; isLight: boolean; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <SectionLabel isLight={isLight}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</SectionLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors",
          isLight
            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
            : "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
        )}
      />
    </div>
  );
}

function TextareaField({
  label, value, onChange, placeholder, isLight, required = false, rows = 3, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  isLight: boolean; required?: boolean; rows?: number; className?: string;
}) {
  return (
    <div className={className}>
      <SectionLabel isLight={isLight}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</SectionLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none",
          isLight
            ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
            : "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-400"
        )}
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options, isLight, required = false, className = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; isLight: boolean; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <SectionLabel isLight={isLight}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</SectionLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors",
          isLight
            ? "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
            : "bg-slate-800 border-slate-600 text-white focus:border-blue-400"
        )}
      >
        <option value="">Select...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function EmptyState({ message, isLight }: { message: string; isLight: boolean }) {
  return (
    <Card className={cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
      <CardContent className="p-12 text-center">
        <BookOpen className={cn("w-12 h-12 mx-auto mb-3", isLight ? "text-slate-300" : "text-slate-600")} />
        <p className={cn("text-sm", isLight ? "text-slate-400" : "text-slate-500")}>{message}</p>
      </CardContent>
    </Card>
  );
}

/* ───────────────────── TAB 1: Official Log ───────────────────── */

function OfficialLogTab({ isLight, cardBg }: { isLight: boolean; cardBg: string }) {
  const [entries] = useState<OfficialLogEntry[]>(generateMockOfficialLog);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formWeather, setFormWeather] = useState("");
  const [formEventType, setFormEventType] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSignature, setFormSignature] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch = !searchTerm || e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = !filterEvent || e.eventType === filterEvent;
      return matchSearch && matchFilter;
    });
  }, [entries, searchTerm, filterEvent]);

  const eventColor = (type: string) => EVENT_TYPES.find((e) => e.value === type)?.color || "text-slate-400";
  const eventLabel = (type: string) => EVENT_TYPES.find((e) => e.value === type)?.label || type;

  const handleSubmit = () => {
    // In production: trpc mutation
    setShowForm(false);
    setFormDate(""); setFormPosition(""); setFormWeather("");
    setFormEventType(""); setFormDescription(""); setFormSignature("");
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isLight ? "text-slate-400" : "text-slate-500")} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entries..."
              className={cn(
                "w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none",
                isLight ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400" : "bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              )}
            />
          </div>
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className={cn(
              "px-3 py-2 rounded-lg border text-sm outline-none",
              isLight ? "bg-white border-slate-300 text-slate-900" : "bg-slate-800 border-slate-600 text-white"
            )}
          >
            <option value="">All Events</option>
            {EVENT_TYPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <Card className={cn("border-2", isLight ? "bg-blue-50/50 border-blue-200" : "bg-blue-950/20 border-blue-800/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
              <Pen className="w-4 h-4 text-blue-400" /> New Official Log Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Date / Time (UTC)" value={formDate} onChange={setFormDate} type="datetime-local" isLight={isLight} required />
              <InputField label="Position (Lat/Lon)" value={formPosition} onChange={setFormPosition} placeholder="51.5074°N, 0.1278°W" isLight={isLight} required />
              <InputField label="Weather / Sea State" value={formWeather} onChange={setFormWeather} placeholder="SW 15kt, moderate swell" isLight={isLight} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Event Type"
                value={formEventType}
                onChange={setFormEventType}
                options={EVENT_TYPES.map((e) => ({ value: e.value, label: e.label }))}
                isLight={isLight}
                required
              />
              <InputField label="Master's Signature" value={formSignature} onChange={setFormSignature} placeholder="Capt. J. Morrison" isLight={isLight} required />
            </div>
            <TextareaField label="Description" value={formDescription} onChange={setFormDescription} placeholder="Detailed account of event..." isLight={isLight} required rows={4} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className={cn("px-4 py-2 rounded-lg text-sm font-medium border", isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700")}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Save Entry
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry List */}
      {filtered.length === 0 ? (
        <EmptyState message="No official log entries match your search." isLight={isLight} />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className={cn(cardBg, "cursor-pointer transition-all hover:shadow-md")} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg mt-0.5", isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                        <BookOpen className={cn("w-4 h-4", eventColor(entry.eventType))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{entry.id}</span>
                          <Badge className={cn("text-[10px] px-1.5 py-0", eventColor(entry.eventType), isLight ? "bg-slate-100" : "bg-slate-700/50")}>
                            {eventLabel(entry.eventType)}
                          </Badge>
                          {entry.verified ? (
                            <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3 mr-0.5" />Verified</Badge>
                          ) : (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400"><AlertTriangle className="w-3 h-3 mr-0.5" />Pending</Badge>
                          )}
                        </div>
                        <p className={cn("text-xs truncate", isLight ? "text-slate-500" : "text-slate-400")}>
                          {new Date(entry.dateTime).toUTCString()} | {entry.position}
                        </p>
                        {!expanded && (
                          <p className={cn("text-xs mt-1 truncate", isLight ? "text-slate-600" : "text-slate-300")}>{entry.description}</p>
                        )}
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                  {expanded && (
                    <div className={cn("mt-4 pt-4 border-t space-y-3", isLight ? "border-slate-200" : "border-slate-700")}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Date/Time (UTC)</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{new Date(entry.dateTime).toUTCString()}</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Position</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.position}</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Weather / Sea State</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.weather}</p>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Description</span>
                        <p className={cn("font-medium mt-1 leading-relaxed", isLight ? "text-slate-900" : "text-white")}>{entry.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Master's Signature: </span>
                          <span className={cn("font-medium italic", isLight ? "text-slate-900" : "text-white")}>{entry.masterSignature}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── TAB 2: Oil Record Book Part I ───────────────────── */

function OilRecordPartITab({ isLight, cardBg }: { isLight: boolean; cardBg: string }) {
  const [entries] = useState<OilRecordPartI[]>(generateMockOilPartI);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formOpType, setFormOpType] = useState("");
  const [formTank, setFormTank] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formRetained, setFormRetained] = useState("");
  const [formSea, setFormSea] = useState("");
  const [formReception, setFormReception] = useState("");
  const [formOfficer, setFormOfficer] = useState("");
  const [formMaster, setFormMaster] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const handleSubmit = () => {
    setShowForm(false);
    setFormDate(""); setFormOpType(""); setFormTank(""); setFormQty("");
    setFormRetained(""); setFormSea(""); setFormReception("");
    setFormOfficer(""); setFormMaster(""); setFormRemarks("");
  };

  const opLabel = (type: string) => OIL_OPS_PART_I.find((o) => o.value === type)?.label || type;
  const opCode = (type: string) => OIL_OPS_PART_I.find((o) => o.value === type)?.code || "?";

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className={cn("rounded-xl border p-4 text-xs", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-950/20 border-blue-800/50")}>
        <div className="flex items-center gap-2 mb-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span className={cn("font-semibold", isLight ? "text-blue-800" : "text-blue-300")}>MARPOL Annex I — Regulation 17</span>
        </div>
        <p className={isLight ? "text-blue-700" : "text-blue-400"}>
          Part I covers machinery space operations for all ships of 400 GT and above. Records must be retained on board for 3 years.
          Operation codes: A (Bunkering), B (Internal Transfer), C (Ballasting/Cleaning), D (Disposal of Residues), E (Bilge Discharge), F (Condition Monitoring), G (Accidental Discharge).
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Operation Record
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className={cn("border-2", isLight ? "bg-blue-50/50 border-blue-200" : "bg-blue-950/20 border-blue-800/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
              <Pen className="w-4 h-4 text-blue-400" /> New Oil Record (Part I) Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Date" value={formDate} onChange={setFormDate} type="date" isLight={isLight} required />
              <SelectField
                label="Operation Type"
                value={formOpType}
                onChange={setFormOpType}
                options={OIL_OPS_PART_I.map((o) => ({ value: o.value, label: `${o.code} — ${o.label}` }))}
                isLight={isLight}
                required
              />
              <InputField label="Tank Identity" value={formTank} onChange={setFormTank} placeholder="Sludge Tank P/S" isLight={isLight} required />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField label="Quantity (m3)" value={formQty} onChange={setFormQty} type="number" placeholder="0.0" isLight={isLight} required />
              <InputField label="Retained on Board (m3)" value={formRetained} onChange={setFormRetained} type="number" placeholder="0.0" isLight={isLight} />
              <InputField label="Discharged to Sea (m3)" value={formSea} onChange={setFormSea} type="number" placeholder="0.0" isLight={isLight} />
              <InputField label="To Reception Facility (m3)" value={formReception} onChange={setFormReception} type="number" placeholder="0.0" isLight={isLight} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Officer's Signature" value={formOfficer} onChange={setFormOfficer} placeholder="C/E Name" isLight={isLight} required />
              <InputField label="Master's Signature" value={formMaster} onChange={setFormMaster} placeholder="Capt. Name" isLight={isLight} required />
            </div>
            <TextareaField label="Remarks" value={formRemarks} onChange={setFormRemarks} placeholder="Additional details, receipt numbers..." isLight={isLight} rows={3} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className={cn("px-4 py-2 rounded-lg text-sm font-medium border", isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700")}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Save Record
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry List */}
      {entries.length === 0 ? (
        <EmptyState message="No oil record (Part I) entries found." isLight={isLight} />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className={cn(cardBg, "cursor-pointer transition-all hover:shadow-md")} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg mt-0.5", isLight ? "bg-blue-50" : "bg-blue-900/30")}>
                        <span className="text-xs font-bold text-blue-400">{opCode(entry.operationType)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{entry.id}</span>
                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-500/20 text-blue-400">{opLabel(entry.operationType)}</Badge>
                        </div>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          {entry.date} | Tank: {entry.tankIdentity} | {entry.quantityM3} m3
                        </p>
                        {!expanded && (
                          <p className={cn("text-xs mt-1 truncate", isLight ? "text-slate-600" : "text-slate-300")}>{entry.remarks}</p>
                        )}
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                  {expanded && (
                    <div className={cn("mt-4 pt-4 border-t space-y-3", isLight ? "border-slate-200" : "border-slate-700")}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Total Quantity</span>
                          <p className={cn("font-bold text-base", isLight ? "text-slate-900" : "text-white")}>{entry.quantityM3} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Retained on Board</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.retainedOnBoard} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Discharged to Sea</span>
                          <p className={cn("font-medium", entry.dischargedToSea > 0 ? "text-amber-400" : isLight ? "text-slate-900" : "text-white")}>{entry.dischargedToSea} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>To Reception Facility</span>
                          <p className={cn("font-medium", entry.dischargedToReception > 0 ? "text-emerald-400" : isLight ? "text-slate-900" : "text-white")}>{entry.dischargedToReception} m3</p>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Remarks</span>
                        <p className={cn("font-medium mt-1 leading-relaxed", isLight ? "text-slate-900" : "text-white")}>{entry.remarks}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Officer: </span>
                          <span className={cn("font-medium italic", isLight ? "text-slate-900" : "text-white")}>{entry.officerSignature}</span>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Master: </span>
                          <span className={cn("font-medium italic", isLight ? "text-slate-900" : "text-white")}>{entry.masterSignature}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── TAB 3: Oil Record Book Part II ───────────────────── */

function OilRecordPartIITab({ isLight, cardBg }: { isLight: boolean; cardBg: string }) {
  const [entries] = useState<OilRecordPartII[]>(generateMockOilPartII);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formOpType, setFormOpType] = useState("");
  const [formTank, setFormTank] = useState("");
  const [formCargo, setFormCargo] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formRetained, setFormRetained] = useState("");
  const [formSea, setFormSea] = useState("");
  const [formReception, setFormReception] = useState("");
  const [formPpm, setFormPpm] = useState("");
  const [formOfficer, setFormOfficer] = useState("");
  const [formMaster, setFormMaster] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const handleSubmit = () => {
    setShowForm(false);
    setFormDate(""); setFormOpType(""); setFormTank(""); setFormCargo("");
    setFormQty(""); setFormRetained(""); setFormSea(""); setFormReception("");
    setFormPpm(""); setFormOfficer(""); setFormMaster(""); setFormRemarks("");
  };

  const opLabel = (type: string) => OIL_OPS_PART_II.find((o) => o.value === type)?.label || type;
  const opCode = (type: string) => OIL_OPS_PART_II.find((o) => o.value === type)?.code || "?";

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className={cn("rounded-xl border p-4 text-xs", isLight ? "bg-amber-50 border-amber-200" : "bg-amber-950/20 border-amber-800/50")}>
        <div className="flex items-center gap-2 mb-2">
          <Fuel className="w-4 h-4 text-amber-400" />
          <span className={cn("font-semibold", isLight ? "text-amber-800" : "text-amber-300")}>MARPOL Annex I — Regulation 36</span>
        </div>
        <p className={isLight ? "text-amber-700" : "text-amber-400"}>
          Part II covers cargo/ballast operations for oil tankers of 150 GT and above. All cargo loading, unloading, tank washing,
          ballasting, and slop operations must be recorded. ODME readings required for any overboard discharge.
          Codes: H (Loading), I (Unloading), J (Tank Washing), K (Ballasting), L (Dirty Ballast Discharge), M (Slop Transfer), N (Accidental Discharge).
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Cargo Operation
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className={cn("border-2", isLight ? "bg-amber-50/50 border-amber-200" : "bg-amber-950/20 border-amber-800/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
              <Pen className="w-4 h-4 text-amber-400" /> New Oil Record (Part II) Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Date" value={formDate} onChange={setFormDate} type="date" isLight={isLight} required />
              <SelectField
                label="Operation Type"
                value={formOpType}
                onChange={setFormOpType}
                options={OIL_OPS_PART_II.map((o) => ({ value: o.value, label: `${o.code} — ${o.label}` }))}
                isLight={isLight}
                required
              />
              <InputField label="Tank Identity" value={formTank} onChange={setFormTank} placeholder="Cargo Tanks 1C, 2C" isLight={isLight} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Cargo Type" value={formCargo} onChange={setFormCargo} placeholder="Crude Oil (Arabian Light)" isLight={isLight} required />
              <InputField label="ODME PPM Reading" value={formPpm} onChange={setFormPpm} type="number" placeholder="0" isLight={isLight} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField label="Quantity (m3)" value={formQty} onChange={setFormQty} type="number" placeholder="0.0" isLight={isLight} required />
              <InputField label="Retained on Board (m3)" value={formRetained} onChange={setFormRetained} type="number" placeholder="0.0" isLight={isLight} />
              <InputField label="Discharged to Sea (m3)" value={formSea} onChange={setFormSea} type="number" placeholder="0.0" isLight={isLight} />
              <InputField label="To Reception Facility (m3)" value={formReception} onChange={setFormReception} type="number" placeholder="0.0" isLight={isLight} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Officer's Signature" value={formOfficer} onChange={setFormOfficer} placeholder="C/O Name" isLight={isLight} required />
              <InputField label="Master's Signature" value={formMaster} onChange={setFormMaster} placeholder="Capt. Name" isLight={isLight} required />
            </div>
            <TextareaField label="Remarks" value={formRemarks} onChange={setFormRemarks} placeholder="Additional details, B/L qty, ODME records..." isLight={isLight} rows={3} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className={cn("px-4 py-2 rounded-lg text-sm font-medium border", isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700")}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors">
                Save Record
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry List */}
      {entries.length === 0 ? (
        <EmptyState message="No oil record (Part II) entries found." isLight={isLight} />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className={cn(cardBg, "cursor-pointer transition-all hover:shadow-md")} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg mt-0.5", isLight ? "bg-amber-50" : "bg-amber-900/30")}>
                        <span className="text-xs font-bold text-amber-400">{opCode(entry.operationType)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{entry.id}</span>
                          <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/20 text-amber-400">{opLabel(entry.operationType)}</Badge>
                        </div>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          {entry.date} | {entry.cargoType} | {entry.quantityM3.toLocaleString()} m3
                        </p>
                        {!expanded && (
                          <p className={cn("text-xs mt-1 truncate", isLight ? "text-slate-600" : "text-slate-300")}>{entry.remarks}</p>
                        )}
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                  {expanded && (
                    <div className={cn("mt-4 pt-4 border-t space-y-3", isLight ? "border-slate-200" : "border-slate-700")}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Total Quantity</span>
                          <p className={cn("font-bold text-base", isLight ? "text-slate-900" : "text-white")}>{entry.quantityM3.toLocaleString()} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Retained on Board</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.retainedOnBoard.toLocaleString()} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Discharged to Sea</span>
                          <p className={cn("font-medium", entry.dischargedToSea > 0 ? "text-amber-400" : isLight ? "text-slate-900" : "text-white")}>{entry.dischargedToSea} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>To Reception Facility</span>
                          <p className={cn("font-medium", entry.dischargedToReception > 0 ? "text-emerald-400" : isLight ? "text-slate-900" : "text-white")}>{entry.dischargedToReception} m3</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Cargo Type</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.cargoType}</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>ODME PPM Reading</span>
                          <p className={cn("font-medium", entry.ppmReading !== null && entry.ppmReading > 15 ? "text-red-400" : isLight ? "text-slate-900" : "text-white")}>
                            {entry.ppmReading !== null ? `${entry.ppmReading} ppm` : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Remarks</span>
                        <p className={cn("font-medium mt-1 leading-relaxed", isLight ? "text-slate-900" : "text-white")}>{entry.remarks}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Officer: </span>
                          <span className={cn("font-medium italic", isLight ? "text-slate-900" : "text-white")}>{entry.officerSignature}</span>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Master: </span>
                          <span className={cn("font-medium italic", isLight ? "text-slate-900" : "text-white")}>{entry.masterSignature}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── TAB 4: Garbage Record Book ───────────────────── */

function GarbageRecordTab({ isLight, cardBg }: { isLight: boolean; cardBg: string }) {
  const [entries] = useState<GarbageRecordEntry[]>(generateMockGarbageRecord);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("");

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDisposal, setFormDisposal] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formDistance, setFormDistance] = useState("");
  const [formFacility, setFormFacility] = useState("");
  const [formOfficer, setFormOfficer] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const handleSubmit = () => {
    setShowForm(false);
    setFormDate(""); setFormCategory(""); setFormDisposal(""); setFormAmount("");
    setFormPosition(""); setFormDistance(""); setFormFacility("");
    setFormOfficer(""); setFormRemarks("");
  };

  const filtered = useMemo(() => {
    if (!filterCat) return entries;
    return entries.filter((e) => e.category === filterCat);
  }, [entries, filterCat]);

  const catInfo = (cat: string) => GARBAGE_CATEGORIES.find((c) => c.cat === cat);
  const disposalLabel = (m: string) => DISPOSAL_METHODS.find((d) => d.value === m)?.label || m;

  // Summary stats
  const totalByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.estimatedAmountM3;
    });
    return map;
  }, [entries]);

  const totalByMethod = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      map[e.disposalMethod] = (map[e.disposalMethod] || 0) + e.estimatedAmountM3;
    });
    return map;
  }, [entries]);

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className={cn("rounded-xl border p-4 text-xs", isLight ? "bg-green-50 border-green-200" : "bg-green-950/20 border-green-800/50")}>
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-green-400" />
          <span className={cn("font-semibold", isLight ? "text-green-800" : "text-green-300")}>MARPOL Annex V — Regulation 10</span>
        </div>
        <p className={isLight ? "text-green-700" : "text-green-400"}>
          Every ship of 400 GT and above, and every ship certified to carry 15+ persons, must carry a Garbage Record Book.
          All discharge, incineration, and reception facility delivery operations must be recorded by category (A-I) per 2017 MEPC guidelines.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {GARBAGE_CATEGORIES.map((gc) => {
          const Icon = gc.icon;
          const total = totalByCategory[gc.cat] || 0;
          return (
            <div
              key={gc.cat}
              onClick={() => setFilterCat(filterCat === gc.cat ? "" : gc.cat)}
              className={cn(
                "rounded-xl border p-3 cursor-pointer transition-all text-center",
                filterCat === gc.cat
                  ? isLight ? "bg-green-50 border-green-400 ring-1 ring-green-400" : "bg-green-900/30 border-green-500 ring-1 ring-green-500"
                  : isLight ? "bg-white border-slate-200 hover:border-slate-300" : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
              )}
            >
              <Icon className={cn("w-5 h-5 mx-auto mb-1", gc.color)} />
              <div className={cn("text-xs font-semibold", isLight ? "text-slate-900" : "text-white")}>Cat {gc.cat}</div>
              <div className={cn("text-[10px]", isLight ? "text-slate-500" : "text-slate-400")}>{gc.name}</div>
              <div className={cn("text-sm font-bold mt-1", isLight ? "text-slate-900" : "text-white")}>{total.toFixed(2)} m3</div>
            </div>
          );
        })}
      </div>

      {/* Disposal Method Summary */}
      <div className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
        <h3 className={cn("text-xs font-semibold mb-3", isLight ? "text-slate-900" : "text-white")}>Disposal Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {DISPOSAL_METHODS.map((dm) => {
            const total = totalByMethod[dm.value] || 0;
            const color = dm.value === "discharged_to_sea" ? "text-amber-400" : dm.value === "incinerated" ? "text-orange-400" : dm.value === "delivered_to_reception" ? "text-emerald-400" : "text-red-400";
            return (
              <div key={dm.value}>
                <span className={isLight ? "text-slate-500" : "text-slate-400"}>{dm.label}</span>
                <p className={cn("font-bold text-lg", color)}>{total.toFixed(2)} m3</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Garbage Record
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className={cn("border-2", isLight ? "bg-green-50/50 border-green-200" : "bg-green-950/20 border-green-800/50")}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-sm flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
              <Pen className="w-4 h-4 text-green-400" /> New Garbage Record Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Date" value={formDate} onChange={setFormDate} type="date" isLight={isLight} required />
              <SelectField
                label="Garbage Category"
                value={formCategory}
                onChange={setFormCategory}
                options={GARBAGE_CATEGORIES.map((c) => ({ value: c.cat, label: `${c.cat} — ${c.name}` }))}
                isLight={isLight}
                required
              />
              <SelectField
                label="Disposal Method"
                value={formDisposal}
                onChange={setFormDisposal}
                options={DISPOSAL_METHODS}
                isLight={isLight}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Estimated Amount (m3)" value={formAmount} onChange={setFormAmount} type="number" placeholder="0.0" isLight={isLight} required />
              <InputField label="Position" value={formPosition} onChange={setFormPosition} placeholder="49.5°N 3.2°W" isLight={isLight} required />
              <InputField label="Distance from Shore (nm)" value={formDistance} onChange={setFormDistance} type="number" placeholder="12" isLight={isLight} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Reception Facility (if applicable)" value={formFacility} onChange={setFormFacility} placeholder="Port Waste Management Ltd" isLight={isLight} />
              <InputField label="Officer's Signature" value={formOfficer} onChange={setFormOfficer} placeholder="2/O Name" isLight={isLight} required />
            </div>
            <TextareaField label="Remarks" value={formRemarks} onChange={setFormRemarks} placeholder="Receipt numbers, regulatory basis..." isLight={isLight} rows={3} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className={cn("px-4 py-2 rounded-lg text-sm font-medium border", isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700")}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
                Save Record
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry List */}
      {filtered.length === 0 ? (
        <EmptyState message={filterCat ? `No Category ${filterCat} entries found.` : "No garbage record entries found."} isLight={isLight} />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id;
            const cat = catInfo(entry.category);
            const CatIcon = cat?.icon || Trash2;
            return (
              <Card key={entry.id} className={cn(cardBg, "cursor-pointer transition-all hover:shadow-md")} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-2 rounded-lg mt-0.5", isLight ? "bg-green-50" : "bg-green-900/30")}>
                        <CatIcon className={cn("w-4 h-4", cat?.color || "text-green-400")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{entry.id}</span>
                          <Badge className={cn("text-[10px] px-1.5 py-0 bg-green-500/20", cat?.color || "text-green-400")}>
                            Cat {entry.category}: {entry.categoryName}
                          </Badge>
                          <Badge className={cn("text-[10px] px-1.5 py-0",
                            entry.disposalMethod === "delivered_to_reception" ? "bg-emerald-500/20 text-emerald-400"
                            : entry.disposalMethod === "discharged_to_sea" ? "bg-amber-500/20 text-amber-400"
                            : entry.disposalMethod === "incinerated" ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                          )}>
                            {disposalLabel(entry.disposalMethod)}
                          </Badge>
                        </div>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                          {entry.date} | {entry.estimatedAmountM3} m3 | {entry.position}
                        </p>
                        {!expanded && (
                          <p className={cn("text-xs mt-1 truncate", isLight ? "text-slate-600" : "text-slate-300")}>{entry.remarks}</p>
                        )}
                      </div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                  {expanded && (
                    <div className={cn("mt-4 pt-4 border-t space-y-3", isLight ? "border-slate-200" : "border-slate-700")}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Estimated Amount</span>
                          <p className={cn("font-bold text-base", isLight ? "text-slate-900" : "text-white")}>{entry.estimatedAmountM3} m3</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Position</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.position}</p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Distance from Shore</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>
                            {entry.distanceFromShore_nm !== null ? `${entry.distanceFromShore_nm} nm` : "In port"}
                          </p>
                        </div>
                        <div>
                          <span className={isLight ? "text-slate-500" : "text-slate-400"}>Reception Facility</span>
                          <p className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{entry.receptionFacility || "N/A"}</p>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Remarks</span>
                        <p className={cn("font-medium mt-1 leading-relaxed", isLight ? "text-slate-900" : "text-white")}>{entry.remarks}</p>
                      </div>
                      <div className="text-xs">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Officer: </span>
                        <span className={cn("font-medium italic", isLight ? "text-slate-900" : "text-white")}>{entry.officerSignature}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Main Component ───────────────────── */

export default function ShipLogs() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("official");

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = cn("border", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50");

  // KPI data from mock entries
  const officialLogCount = 7;
  const oilPartICount = 5;
  const oilPartIICount = 4;
  const garbageCount = 8;

  return (
    <div className={cn("min-h-screen p-4 sm:p-6", bg)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Ship Logs</h1>
            <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
              IMO-mandated Official Log Book, Oil Record Book & Garbage Record Book
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
            isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700"
          )}>
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
            isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-slate-600 text-slate-300 hover:bg-slate-700"
          )}>
            <Eye className="w-3.5 h-3.5" /> Audit View
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: <BookOpen className="w-5 h-5 text-indigo-400" />, label: "Official Log Entries", value: officialLogCount, color: "bg-indigo-500" },
          { icon: <Droplets className="w-5 h-5 text-blue-400" />, label: "Oil Record (Part I)", value: oilPartICount, color: "bg-blue-500" },
          { icon: <Fuel className="w-5 h-5 text-amber-400" />, label: "Oil Record (Part II)", value: oilPartIICount, color: "bg-amber-500" },
          { icon: <Trash2 className="w-5 h-5 text-green-400" />, label: "Garbage Records", value: garbageCount, color: "bg-green-500" },
        ].map((kpi, i) => (
          <div key={i} className={cn("rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
            <div className={cn("p-2 rounded-lg w-fit mb-2", `${kpi.color}/10`)}>{kpi.icon}</div>
            <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{kpi.value}</div>
            <div className={cn("text-xs mt-1", isLight ? "text-slate-500" : "text-slate-400")}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Compliance Banner */}
      <div className={cn("rounded-xl border p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3",
        isLight ? "bg-indigo-50 border-indigo-200" : "bg-indigo-950/20 border-indigo-800/50"
      )}>
        <div className="flex items-center gap-2">
          <Ship className="w-5 h-5 text-indigo-400" />
          <span className={cn("text-sm font-semibold", isLight ? "text-indigo-800" : "text-indigo-300")}>
            Regulatory Compliance Status
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Official Log Book — Current</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Oil Record Book Part I — Current</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Oil Record Book Part II — Current</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Garbage Record Book — Current</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("mb-4 flex-wrap h-auto gap-1", isLight ? "bg-slate-100" : "")}>
          <TabsTrigger value="official" className="text-xs sm:text-sm">
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Official Log
          </TabsTrigger>
          <TabsTrigger value="oil-part1" className="text-xs sm:text-sm">
            <Droplets className="w-3.5 h-3.5 mr-1" /> Oil Record (Part I)
          </TabsTrigger>
          <TabsTrigger value="oil-part2" className="text-xs sm:text-sm">
            <Fuel className="w-3.5 h-3.5 mr-1" /> Oil Record (Part II)
          </TabsTrigger>
          <TabsTrigger value="garbage" className="text-xs sm:text-sm">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Garbage Record
          </TabsTrigger>
        </TabsList>

        <TabsContent value="official">
          <OfficialLogTab isLight={isLight} cardBg={cardBg} />
        </TabsContent>

        <TabsContent value="oil-part1">
          <OilRecordPartITab isLight={isLight} cardBg={cardBg} />
        </TabsContent>

        <TabsContent value="oil-part2">
          <OilRecordPartIITab isLight={isLight} cardBg={cardBg} />
        </TabsContent>

        <TabsContent value="garbage">
          <GarbageRecordTab isLight={isLight} cardBg={cardBg} />
        </TabsContent>
      </Tabs>

      {/* Regulatory Footer */}
      <div className={cn("mt-8 rounded-xl border p-4", isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50")}>
        <h3 className={cn("text-xs font-semibold mb-3 flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
          <FileText className="w-4 h-4 text-slate-400" /> Regulatory References
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Official Log Book</span>
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>SOLAS Ch. II-1, Reg. 3-1; Flag State regulations. Records of navigation events, drills, crew changes, and incidents.</p>
          </div>
          <div>
            <span className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Oil Record Book Part I</span>
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>MARPOL Annex I, Reg. 17. Machinery space operations for ships of 400 GT+. 3-year retention requirement.</p>
          </div>
          <div>
            <span className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Oil Record Book Part II</span>
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>MARPOL Annex I, Reg. 36. Cargo/ballast operations for oil tankers of 150 GT+. ODME monitoring required.</p>
          </div>
          <div>
            <span className={cn("font-semibold", isLight ? "text-slate-700" : "text-slate-300")}>Garbage Record Book</span>
            <p className={isLight ? "text-slate-500" : "text-slate-400"}>MARPOL Annex V, Reg. 10. Categories A-I per MEPC.277(70). Ships of 400 GT+ or 15+ persons. 2-year retention.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
