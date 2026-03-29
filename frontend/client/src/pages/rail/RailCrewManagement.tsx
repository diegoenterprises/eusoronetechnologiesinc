/**
 * RAIL CREW MANAGEMENT — Full Crew Management for Railroad Carriers
 * For RAIL_CATALYST role: Engineers, Conductors, Certifications,
 * Assignments, Drug Testing, Training Records
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Users, HardHat, Award, Clock, CheckCircle, AlertTriangle,
  UserCheck, Shield, Search, Plus, Calendar, FileText,
  Activity, ChevronDown, ChevronUp, RefreshCw, Download,
  Beaker, GraduationCap, ClipboardCheck, MapPin, X,
  Eye, Phone, Mail, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─── Status Maps ─── */
const STATUS_COLORS: Record<string, string> = {
  on_duty: "bg-emerald-500/20 text-emerald-400",
  available: "bg-cyan-500/20 text-cyan-400",
  resting: "bg-blue-500/20 text-blue-400",
  off_duty: "bg-slate-500/20 text-slate-400",
  on_leave: "bg-purple-500/20 text-purple-400",
  suspended: "bg-red-500/20 text-red-400",
};

const CERT_STATUS: Record<string, string> = {
  valid: "bg-emerald-500/20 text-emerald-400",
  expiring_soon: "bg-amber-500/20 text-amber-400",
  expired: "bg-red-500/20 text-red-400",
  pending_renewal: "bg-yellow-500/20 text-yellow-400",
};

const TEST_RESULT: Record<string, string> = {
  negative: "bg-emerald-500/20 text-emerald-400",
  positive: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-400",
};

/* ─── Mock Crew Data ─── */
const MOCK_ENGINEERS = [
  { id: 1, name: "James Martinez", employeeId: "ENG-1001", status: "on_duty", assignment: "Train Q401 (Chicago-KC)", hosRemaining: 4.5, hoursToday: 7.5, maxHours: 12, phone: "(312) 555-0101", email: "j.martinez@eslx.com", hireDate: "2018-03-15", seniorityDate: "2018-03-15", district: "Midwest" },
  { id: 2, name: "Robert Chen", employeeId: "ENG-1002", status: "on_duty", assignment: "Train Z103 (Dallas-Houston)", hosRemaining: 8.0, hoursToday: 4.0, maxHours: 12, phone: "(214) 555-0202", email: "r.chen@eslx.com", hireDate: "2019-06-01", seniorityDate: "2019-06-01", district: "South" },
  { id: 3, name: "Michael Davis", employeeId: "ENG-1003", status: "on_duty", assignment: "Train L780 (Denver-Omaha)", hosRemaining: 3.0, hoursToday: 9.0, maxHours: 12, phone: "(303) 555-0303", email: "m.davis@eslx.com", hireDate: "2016-09-20", seniorityDate: "2016-09-20", district: "West" },
  { id: 4, name: "Patricia Brown", employeeId: "ENG-1004", status: "available", assignment: "—", hosRemaining: 12.0, hoursToday: 0, maxHours: 12, phone: "(312) 555-0404", email: "p.brown@eslx.com", hireDate: "2020-01-10", seniorityDate: "2020-01-10", district: "Midwest" },
  { id: 5, name: "David Wilson", employeeId: "ENG-1005", status: "resting", assignment: "Off — 8hr rest", hosRemaining: 0, hoursToday: 12.0, maxHours: 12, phone: "(816) 555-0505", email: "d.wilson@eslx.com", hireDate: "2015-04-22", seniorityDate: "2015-04-22", district: "Midwest" },
  { id: 6, name: "Sarah Thompson", employeeId: "ENG-1006", status: "on_duty", assignment: "Yard Ops - Chicago Terminal", hosRemaining: 6.5, hoursToday: 5.5, maxHours: 12, phone: "(312) 555-0606", email: "s.thompson@eslx.com", hireDate: "2021-07-15", seniorityDate: "2021-07-15", district: "Midwest" },
  { id: 7, name: "William Garcia", employeeId: "ENG-1007", status: "available", assignment: "—", hosRemaining: 12.0, hoursToday: 0, maxHours: 12, phone: "(713) 555-0707", email: "w.garcia@eslx.com", hireDate: "2017-11-30", seniorityDate: "2017-11-30", district: "South" },
  { id: 8, name: "Jennifer Adams", employeeId: "ENG-1008", status: "on_leave", assignment: "Vacation", hosRemaining: 0, hoursToday: 0, maxHours: 12, phone: "(404) 555-0808", email: "j.adams@eslx.com", hireDate: "2019-02-14", seniorityDate: "2019-02-14", district: "East" },
];

const MOCK_CONDUCTORS = [
  { id: 101, name: "Richard Park", employeeId: "CON-2001", status: "on_duty", assignment: "Train Q401 (Chicago-KC)", hosRemaining: 4.5, hoursToday: 7.5, maxHours: 12, phone: "(312) 555-1001", email: "r.park@eslx.com", hireDate: "2017-05-20", seniorityDate: "2017-05-20", district: "Midwest" },
  { id: 102, name: "Amanda Lee", employeeId: "CON-2002", status: "on_duty", assignment: "Train Z103 (Dallas-Houston)", hosRemaining: 8.0, hoursToday: 4.0, maxHours: 12, phone: "(214) 555-1002", email: "a.lee@eslx.com", hireDate: "2020-08-01", seniorityDate: "2020-08-01", district: "South" },
  { id: 103, name: "Kevin Wilson", employeeId: "CON-2003", status: "on_duty", assignment: "Train L780 (Denver-Omaha)", hosRemaining: 3.0, hoursToday: 9.0, maxHours: 12, phone: "(303) 555-1003", email: "k.wilson@eslx.com", hireDate: "2018-12-10", seniorityDate: "2018-12-10", district: "West" },
  { id: 104, name: "Teresa Garcia", employeeId: "CON-2004", status: "available", assignment: "—", hosRemaining: 12.0, hoursToday: 0, maxHours: 12, phone: "(816) 555-1004", email: "t.garcia@eslx.com", hireDate: "2021-03-15", seniorityDate: "2021-03-15", district: "Midwest" },
  { id: 105, name: "Brian Johnson", employeeId: "CON-2005", status: "resting", assignment: "Off — 8hr rest", hosRemaining: 0, hoursToday: 12.0, maxHours: 12, phone: "(312) 555-1005", email: "b.johnson@eslx.com", hireDate: "2016-07-22", seniorityDate: "2016-07-22", district: "Midwest" },
  { id: 106, name: "Rachel Patel", employeeId: "CON-2006", status: "on_duty", assignment: "Yard Ops - Chicago Terminal", hosRemaining: 6.5, hoursToday: 5.5, maxHours: 12, phone: "(312) 555-1006", email: "r.patel@eslx.com", hireDate: "2022-01-10", seniorityDate: "2022-01-10", district: "Midwest" },
  { id: 107, name: "Carlos Hernandez", employeeId: "CON-2007", status: "available", assignment: "—", hosRemaining: 12.0, hoursToday: 0, maxHours: 12, phone: "(713) 555-1007", email: "c.hernandez@eslx.com", hireDate: "2019-09-05", seniorityDate: "2019-09-05", district: "South" },
  { id: 108, name: "Linda Foster", employeeId: "CON-2008", status: "on_duty", assignment: "Train M502 (STL-Memphis)", hosRemaining: 5.0, hoursToday: 7.0, maxHours: 12, phone: "(901) 555-1008", email: "l.foster@eslx.com", hireDate: "2018-04-18", seniorityDate: "2018-04-18", district: "South" },
];

const MOCK_CERTIFICATIONS = [
  { id: 1, crewName: "James Martinez", employeeId: "ENG-1001", certType: "FRA Part 240 — Locomotive Engineer", issueDate: "2024-04-15", expiryDate: "2026-04-15", status: "expiring_soon", issuedBy: "FRA Region 4" },
  { id: 2, crewName: "Robert Chen", employeeId: "ENG-1002", certType: "FRA Part 240 — Locomotive Engineer", issueDate: "2024-06-01", expiryDate: "2026-06-01", status: "valid", issuedBy: "FRA Region 6" },
  { id: 3, crewName: "Michael Davis", employeeId: "ENG-1003", certType: "FRA Part 240 — Locomotive Engineer", issueDate: "2023-09-20", expiryDate: "2025-09-20", status: "expired", issuedBy: "FRA Region 7" },
  { id: 4, crewName: "Richard Park", employeeId: "CON-2001", certType: "FRA Part 242 — Conductor", issueDate: "2024-05-20", expiryDate: "2027-05-20", status: "valid", issuedBy: "FRA Region 4" },
  { id: 5, crewName: "Amanda Lee", employeeId: "CON-2002", certType: "FRA Part 242 — Conductor", issueDate: "2024-08-01", expiryDate: "2027-08-01", status: "valid", issuedBy: "FRA Region 6" },
  { id: 6, crewName: "James Martinez", employeeId: "ENG-1001", certType: "Hazmat Transportation", issueDate: "2025-01-10", expiryDate: "2027-01-10", status: "valid", issuedBy: "DOT" },
  { id: 7, crewName: "Sarah Thompson", employeeId: "ENG-1006", certType: "FRA Part 240 — Locomotive Engineer", issueDate: "2024-07-15", expiryDate: "2026-07-15", status: "valid", issuedBy: "FRA Region 4" },
  { id: 8, crewName: "Kevin Wilson", employeeId: "CON-2003", certType: "FRA Part 242 — Conductor", issueDate: "2024-12-10", expiryDate: "2027-12-10", status: "valid", issuedBy: "FRA Region 7" },
  { id: 9, crewName: "Patricia Brown", employeeId: "ENG-1004", certType: "FRA Part 240 — Locomotive Engineer", issueDate: "2025-01-10", expiryDate: "2027-01-10", status: "valid", issuedBy: "FRA Region 4" },
  { id: 10, crewName: "Brian Johnson", employeeId: "CON-2005", certType: "FRA Part 242 — Conductor", issueDate: "2023-07-22", expiryDate: "2026-07-22", status: "valid", issuedBy: "FRA Region 4" },
  { id: 11, crewName: "David Wilson", employeeId: "ENG-1005", certType: "Hazmat Transportation", issueDate: "2024-04-22", expiryDate: "2026-04-22", status: "expiring_soon", issuedBy: "DOT" },
  { id: 12, crewName: "Linda Foster", employeeId: "CON-2008", certType: "FRA Part 242 — Conductor", issueDate: "2024-04-18", expiryDate: "2027-04-18", status: "valid", issuedBy: "FRA Region 6" },
];

const MOCK_ASSIGNMENTS = [
  { id: 1, crewName: "James Martinez", role: "Engineer", train: "Q401", route: "Chicago - Kansas City", startTime: "06:00", endTime: "18:00", date: "2026-03-29", status: "active" },
  { id: 2, crewName: "Richard Park", role: "Conductor", train: "Q401", route: "Chicago - Kansas City", startTime: "06:00", endTime: "18:00", date: "2026-03-29", status: "active" },
  { id: 3, crewName: "Robert Chen", role: "Engineer", train: "Z103", route: "Dallas - Houston", startTime: "08:00", endTime: "14:00", date: "2026-03-29", status: "active" },
  { id: 4, crewName: "Amanda Lee", role: "Conductor", train: "Z103", route: "Dallas - Houston", startTime: "08:00", endTime: "14:00", date: "2026-03-29", status: "active" },
  { id: 5, crewName: "Michael Davis", role: "Engineer", train: "L780", route: "Denver - Omaha", startTime: "03:00", endTime: "15:00", date: "2026-03-29", status: "active" },
  { id: 6, crewName: "Kevin Wilson", role: "Conductor", train: "L780", route: "Denver - Omaha", startTime: "03:00", endTime: "15:00", date: "2026-03-29", status: "active" },
  { id: 7, crewName: "Sarah Thompson", role: "Engineer", train: "YARD-CHI", route: "Chicago Terminal Ops", startTime: "07:00", endTime: "15:00", date: "2026-03-29", status: "active" },
  { id: 8, crewName: "Rachel Patel", role: "Conductor", train: "YARD-CHI", route: "Chicago Terminal Ops", startTime: "07:00", endTime: "15:00", date: "2026-03-29", status: "active" },
  { id: 9, crewName: "Linda Foster", role: "Conductor", train: "M502", route: "St. Louis - Memphis", startTime: "05:00", endTime: "17:00", date: "2026-03-29", status: "active" },
  { id: 10, crewName: "David Wilson", role: "Engineer", train: "Q401", route: "Chicago - Kansas City", startTime: "06:00", endTime: "18:00", date: "2026-03-28", status: "completed" },
  { id: 11, crewName: "Brian Johnson", role: "Conductor", train: "Q401", route: "Chicago - Kansas City", startTime: "06:00", endTime: "18:00", date: "2026-03-28", status: "completed" },
];

const MOCK_DRUG_TESTS = [
  { id: 1, crewName: "James Martinez", employeeId: "ENG-1001", testType: "Random", testDate: "2026-03-15", result: "negative", lab: "Quest Diagnostics", nextDue: "2026-09-15" },
  { id: 2, crewName: "Robert Chen", employeeId: "ENG-1002", testType: "Random", testDate: "2026-02-20", result: "negative", lab: "Quest Diagnostics", nextDue: "2026-08-20" },
  { id: 3, crewName: "Richard Park", employeeId: "CON-2001", testType: "Pre-employment", testDate: "2026-01-10", result: "negative", lab: "LabCorp", nextDue: "2026-07-10" },
  { id: 4, crewName: "Amanda Lee", employeeId: "CON-2002", testType: "Random", testDate: "2026-03-01", result: "negative", lab: "Quest Diagnostics", nextDue: "2026-09-01" },
  { id: 5, crewName: "Patricia Brown", employeeId: "ENG-1004", testType: "Post-accident", testDate: "2025-11-18", result: "negative", lab: "LabCorp", nextDue: "2026-05-18" },
  { id: 6, crewName: "Michael Davis", employeeId: "ENG-1003", testType: "Random", testDate: "—", result: "scheduled", lab: "Quest Diagnostics", nextDue: "2026-04-01" },
  { id: 7, crewName: "Kevin Wilson", employeeId: "CON-2003", testType: "Return-to-duty", testDate: "2026-01-05", result: "negative", lab: "LabCorp", nextDue: "2026-07-05" },
  { id: 8, crewName: "David Wilson", employeeId: "ENG-1005", testType: "Random", testDate: "2026-02-10", result: "negative", lab: "Quest Diagnostics", nextDue: "2026-08-10" },
  { id: 9, crewName: "Teresa Garcia", employeeId: "CON-2004", testType: "Random", testDate: "—", result: "scheduled", lab: "Quest Diagnostics", nextDue: "2026-04-05" },
  { id: 10, crewName: "Sarah Thompson", employeeId: "ENG-1006", testType: "Random", testDate: "2026-03-20", result: "negative", lab: "LabCorp", nextDue: "2026-09-20" },
];

const MOCK_TRAINING = [
  { id: 1, crewName: "James Martinez", course: "Advanced Signal Recognition", completedDate: "2026-02-15", validUntil: "2027-02-15", status: "valid", provider: "ESLX Training Center" },
  { id: 2, crewName: "Robert Chen", course: "Hazmat Emergency Response", completedDate: "2026-01-20", validUntil: "2027-01-20", status: "valid", provider: "DOT Certified" },
  { id: 3, crewName: "Michael Davis", course: "PTC System Operations", completedDate: "2025-06-10", validUntil: "2026-06-10", status: "valid", provider: "ESLX Training Center" },
  { id: 4, crewName: "Patricia Brown", course: "Defensive Driving — Rail", completedDate: "2026-03-01", validUntil: "2027-03-01", status: "valid", provider: "AAR Certified" },
  { id: 5, crewName: "Richard Park", course: "Hazmat Emergency Response", completedDate: "2025-12-05", validUntil: "2026-12-05", status: "valid", provider: "DOT Certified" },
  { id: 6, crewName: "David Wilson", course: "CTC / Dark Territory Operations", completedDate: "2025-04-22", validUntil: "2026-04-22", status: "expiring_soon", provider: "ESLX Training Center" },
];

/* ─── Crew Row Component ─── */
function CrewRow({ member, isLight, text, muted, expanded, onToggle }: {
  member: any; isLight: boolean; text: string; muted: string; expanded: boolean; onToggle: () => void;
}) {
  const hosPercent = member.maxHours > 0 ? (member.hoursToday / member.maxHours) * 100 : 0;
  const hosColor = hosPercent >= 90 ? "text-red-500" : hosPercent >= 75 ? "text-amber-500" : "text-emerald-500";

  return (
    <>
      <div
        className={cn(
          "rounded-lg border p-3 transition-all cursor-pointer",
          isLight ? "border-slate-200 hover:bg-slate-50" : "border-slate-700/50 hover:bg-slate-700/20",
          expanded && (isLight ? "bg-slate-50 border-blue-300" : "bg-slate-700/20 border-blue-500/30")
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
              isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400"
            )}>
              {member.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("font-semibold text-sm", text)}>{member.name}</span>
                <Badge className={STATUS_COLORS[member.status] || "bg-slate-500/20 text-slate-400"}>
                  {member.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className={cn("text-xs mt-0.5", muted)}>
                {member.employeeId} | {member.assignment}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32">
              <div className="flex justify-between text-xs mb-1">
                <span className={muted}>HOS {member.hoursToday}h / {member.maxHours}h</span>
                <span className={cn("font-medium", hosColor)}>{member.hosRemaining}h left</span>
              </div>
              <Progress value={hosPercent} className="h-2" />
            </div>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>
      {expanded && (
        <div className={cn(
          "rounded-lg border px-4 py-3 -mt-1 space-y-3",
          isLight ? "border-slate-200 bg-slate-50/70" : "border-slate-700/50 bg-slate-800/30"
        )}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Phone", value: member.phone, icon: <Phone className="w-3 h-3" /> },
              { label: "Email", value: member.email, icon: <Mail className="w-3 h-3" /> },
              { label: "Hire Date", value: member.hireDate, icon: <Calendar className="w-3 h-3" /> },
              { label: "District", value: member.district, icon: <MapPin className="w-3 h-3" /> },
            ].map((item) => (
              <div key={item.label}>
                <div className={cn("text-xs flex items-center gap-1", muted)}>{item.icon} {item.label}</div>
                <div className={cn("text-sm font-medium", text)}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Eye className="w-3 h-3" /> Full Profile
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <ClipboardCheck className="w-3 h-3" /> Certifications
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Calendar className="w-3 h-3" /> Assignment History
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function RailCrewManagement() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("engineers");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [certFilter, setCertFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("active");

  // Try live tRPC data
  const crewQuery = (trpc as any).railShipments?.getRailCrew?.useQuery?.({ limit: 100 });
  const liveCrew: any[] = crewQuery?.data || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";
  const inputCls = cn(
    "h-9 text-sm",
    isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
  );

  // Merge live data with mock
  const engineers = liveCrew.length > 0
    ? liveCrew.filter((c: any) => c.role === "engineer")
    : MOCK_ENGINEERS;
  const conductors = liveCrew.length > 0
    ? liveCrew.filter((c: any) => c.role === "conductor")
    : MOCK_CONDUCTORS;

  const districts = [...new Set([...MOCK_ENGINEERS, ...MOCK_CONDUCTORS].map((c) => c.district))];

  // Filter crew
  const filterCrew = (crew: any[]) => {
    return crew.filter((m) => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
          !m.employeeId?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      if (filterDistrict !== "all" && m.district !== filterDistrict) return false;
      return true;
    });
  };

  const filteredEngineers = useMemo(() => filterCrew(engineers), [search, filterStatus, filterDistrict, engineers]);
  const filteredConductors = useMemo(() => filterCrew(conductors), [search, filterStatus, filterDistrict, conductors]);

  // Filtered certifications
  const filteredCerts = useMemo(() => {
    if (certFilter === "all") return MOCK_CERTIFICATIONS;
    return MOCK_CERTIFICATIONS.filter((c) => c.status === certFilter);
  }, [certFilter]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === "all") return MOCK_ASSIGNMENTS;
    return MOCK_ASSIGNMENTS.filter((a) => a.status === assignmentFilter);
  }, [assignmentFilter]);

  // KPIs
  const allCrew = [...engineers, ...conductors];
  const onDutyCount = allCrew.filter((c: any) => c.status === "on_duty").length;
  const availableCount = allCrew.filter((c: any) => c.status === "available").length;
  const restingCount = allCrew.filter((c: any) => c.status === "resting").length;
  const alertCerts = MOCK_CERTIFICATIONS.filter((c) => c.status === "expired" || c.status === "expiring_soon").length;

  const hasFilters = search || filterStatus !== "all" || filterDistrict !== "all";
  const clearFilters = () => { setSearch(""); setFilterStatus("all"); setFilterDistrict("all"); };

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isLight ? "bg-gradient-to-br from-indigo-100 to-purple-100" : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
          )}>
            <Users className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className={cn("text-2xl font-bold", text)}>Crew Management</h1>
            <p className={cn("text-sm", muted)}>Engineers, conductors, certifications & compliance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className={cn(
            "gap-1.5 text-xs",
            isLight ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-indigo-600/90 hover:bg-indigo-600 text-white"
          )}>
            <Plus className="w-3.5 h-3.5" /> Add Crew Member
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { icon: <Users className="w-5 h-5" />, label: "Total Crew", value: allCrew.length, accent: "blue" as const },
          { icon: <Activity className="w-5 h-5" />, label: "On Duty", value: onDutyCount, accent: "emerald" as const },
          { icon: <UserCheck className="w-5 h-5" />, label: "Available", value: availableCount, accent: "cyan" as const },
          { icon: <Clock className="w-5 h-5" />, label: "Resting", value: restingCount, accent: "blue" as const },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Cert Alerts", value: alertCerts, accent: "red" as const },
        ].map((kpi) => {
          const accentMap: Record<string, string> = {
            blue: isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400",
            emerald: isLight ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400",
            cyan: isLight ? "bg-cyan-50 text-cyan-600" : "bg-cyan-500/10 text-cyan-400",
            red: isLight ? "bg-red-50 text-red-600" : "bg-red-500/10 text-red-400",
          };
          return (
            <Card key={kpi.label} className={cn("border", cardBg)}>
              <CardContent className="p-4">
                <div className={cn("p-2 rounded-lg w-fit mb-2", accentMap[kpi.accent])}>{kpi.icon}</div>
                <div className={cn("text-2xl font-bold", text)}>{kpi.value}</div>
                <div className={cn("text-xs", muted)}>{kpi.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
          <TabsTrigger value="engineers">Engineers</TabsTrigger>
          <TabsTrigger value="conductors">Conductors</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="drugTesting">Drug Testing</TabsTrigger>
        </TabsList>

        {/* ── Engineers Tab ── */}
        <TabsContent value="engineers">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
                  <Input
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="on_duty">On Duty</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="resting">Resting</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasFilters && (
                    <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs gap-1">
                      <X className="w-3 h-3" /> Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredEngineers.map((eng: any) => (
                  <CrewRow
                    key={eng.id}
                    member={eng}
                    isLight={isLight}
                    text={text}
                    muted={muted}
                    expanded={expandedId === eng.id}
                    onToggle={() => setExpandedId(expandedId === eng.id ? null : eng.id)}
                  />
                ))}
                {filteredEngineers.length === 0 && (
                  <div className="text-center py-12">
                    <HardHat className={cn("w-10 h-10 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                    <p className={cn("text-sm", muted)}>No engineers match your filters</p>
                  </div>
                )}
              </div>
              <div className={cn("text-xs mt-3 text-right", muted)}>
                {filteredEngineers.length} of {engineers.length} engineers
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Conductors Tab ── */}
        <TabsContent value="conductors">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", muted)} />
                  <Input
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(inputCls, "pl-9")}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="on_duty">On Duty</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="resting">Resting</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasFilters && (
                    <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs gap-1">
                      <X className="w-3 h-3" /> Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredConductors.map((cond: any) => (
                  <CrewRow
                    key={cond.id}
                    member={cond}
                    isLight={isLight}
                    text={text}
                    muted={muted}
                    expanded={expandedId === cond.id}
                    onToggle={() => setExpandedId(expandedId === cond.id ? null : cond.id)}
                  />
                ))}
                {filteredConductors.length === 0 && (
                  <div className="text-center py-12">
                    <UserCheck className={cn("w-10 h-10 mx-auto mb-2", isLight ? "text-slate-300" : "text-slate-600")} />
                    <p className={cn("text-sm", muted)}>No conductors match your filters</p>
                  </div>
                )}
              </div>
              <div className={cn("text-xs mt-3 text-right", muted)}>
                {filteredConductors.length} of {conductors.length} conductors
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Certifications Tab ── */}
        <TabsContent value="certifications">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
                  <Award className="w-5 h-5 text-purple-400" /> FRA Part 240/242 Certifications
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={certFilter} onValueChange={setCertFilter}>
                    <SelectTrigger className={cn("w-40", inputCls)}>
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Alert banner for expiring/expired */}
              {MOCK_CERTIFICATIONS.some((c) => c.status === "expired" || c.status === "expiring_soon") && (
                <div className={cn(
                  "rounded-lg border p-3 mb-4 flex items-center gap-3",
                  isLight ? "bg-red-50 border-red-200" : "bg-red-500/5 border-red-500/30"
                )}>
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <div className={cn("text-sm font-medium", isLight ? "text-red-700" : "text-red-400")}>
                      Certification Alerts
                    </div>
                    <div className={cn("text-xs", isLight ? "text-red-600" : "text-red-400/70")}>
                      {MOCK_CERTIFICATIONS.filter((c) => c.status === "expired").length} expired,{" "}
                      {MOCK_CERTIFICATIONS.filter((c) => c.status === "expiring_soon").length} expiring soon — immediate action required
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      {["Crew Member", "ID", "Certification", "Issue Date", "Expiry Date", "Status", "Issued By"].map((h) => (
                        <th key={h} className={cn("text-left py-2 px-3 text-xs font-medium", muted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className={cn(
                        "border-b transition-colors",
                        cert.status === "expired" ? (isLight ? "bg-red-50/50" : "bg-red-500/5") :
                        cert.status === "expiring_soon" ? (isLight ? "bg-amber-50/50" : "bg-amber-500/5") : "",
                        isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-800 hover:bg-slate-700/20"
                      )}>
                        <td className={cn("py-2.5 px-3 font-medium", text)}>{cert.crewName}</td>
                        <td className={cn("py-2.5 px-3", muted)}>{cert.employeeId}</td>
                        <td className={cn("py-2.5 px-3", text)}>{cert.certType}</td>
                        <td className={cn("py-2.5 px-3", muted)}>{cert.issueDate}</td>
                        <td className={cn("py-2.5 px-3", text)}>{cert.expiryDate}</td>
                        <td className="py-2.5 px-3">
                          <Badge className={CERT_STATUS[cert.status] || "bg-slate-500/20 text-slate-400"}>
                            {cert.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className={cn("py-2.5 px-3", muted)}>{cert.issuedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("text-xs mt-3 text-right", muted)}>
                {filteredCerts.length} certifications
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Assignments Tab ── */}
        <TabsContent value="assignments">
          <Card className={cn("border", cardBg)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
                  <ClipboardCheck className="w-5 h-5 text-cyan-400" /> Crew Assignments
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                    <SelectTrigger className={cn("w-36", inputCls)}>
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className={cn(
                    "gap-1.5 text-xs",
                    isLight ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-cyan-600/90 hover:bg-cyan-600 text-white"
                  )}>
                    <Plus className="w-3.5 h-3.5" /> New Assignment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      {["Crew Member", "Role", "Train", "Route", "Date", "Shift", "Status"].map((h) => (
                        <th key={h} className={cn("text-left py-2 px-3 text-xs font-medium", muted)}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((a) => (
                      <tr key={a.id} className={cn(
                        "border-b transition-colors",
                        isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-800 hover:bg-slate-700/20"
                      )}>
                        <td className={cn("py-2.5 px-3 font-medium", text)}>{a.crewName}</td>
                        <td className={cn("py-2.5 px-3", muted)}>{a.role}</td>
                        <td className={cn("py-2.5 px-3 font-semibold", text)}>{a.train}</td>
                        <td className={cn("py-2.5 px-3", text)}>{a.route}</td>
                        <td className={cn("py-2.5 px-3", muted)}>{a.date}</td>
                        <td className={cn("py-2.5 px-3", text)}>{a.startTime} — {a.endTime}</td>
                        <td className="py-2.5 px-3">
                          <Badge className={a.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn("text-xs mt-3 text-right", muted)}>
                {filteredAssignments.length} assignments
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Drug Testing Tab ── */}
        <TabsContent value="drugTesting">
          <div className="space-y-6">
            {/* Drug Test Schedule */}
            <Card className={cn("border", cardBg)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
                    <Beaker className="w-5 h-5 text-teal-400" /> Drug & Alcohol Testing — FRA Part 219
                  </CardTitle>
                  <Button size="sm" className={cn(
                    "gap-1.5 text-xs",
                    isLight ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-teal-600/90 hover:bg-teal-600 text-white"
                  )}>
                    <Plus className="w-3.5 h-3.5" /> Schedule Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Upcoming tests banner */}
                {MOCK_DRUG_TESTS.some((t) => t.result === "scheduled") && (
                  <div className={cn(
                    "rounded-lg border p-3 mb-4 flex items-center gap-3",
                    isLight ? "bg-blue-50 border-blue-200" : "bg-blue-500/5 border-blue-500/30"
                  )}>
                    <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <div className={cn("text-sm font-medium", isLight ? "text-blue-700" : "text-blue-400")}>
                        Upcoming Tests
                      </div>
                      <div className={cn("text-xs", isLight ? "text-blue-600" : "text-blue-400/70")}>
                        {MOCK_DRUG_TESTS.filter((t) => t.result === "scheduled").length} crew members scheduled for testing
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn("border-b", isLight ? "border-slate-200" : "border-slate-700/50")}>
                        {["Crew Member", "ID", "Test Type", "Test Date", "Result", "Lab", "Next Due"].map((h) => (
                          <th key={h} className={cn("text-left py-2 px-3 text-xs font-medium", muted)}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_DRUG_TESTS.map((test) => (
                        <tr key={test.id} className={cn(
                          "border-b transition-colors",
                          isLight ? "border-slate-100 hover:bg-slate-50" : "border-slate-800 hover:bg-slate-700/20"
                        )}>
                          <td className={cn("py-2.5 px-3 font-medium", text)}>{test.crewName}</td>
                          <td className={cn("py-2.5 px-3", muted)}>{test.employeeId}</td>
                          <td className={cn("py-2.5 px-3", text)}>{test.testType}</td>
                          <td className={cn("py-2.5 px-3", muted)}>{test.testDate}</td>
                          <td className="py-2.5 px-3">
                            <Badge className={TEST_RESULT[test.result] || "bg-slate-500/20 text-slate-400"}>
                              {test.result}
                            </Badge>
                          </td>
                          <td className={cn("py-2.5 px-3", muted)}>{test.lab}</td>
                          <td className={cn("py-2.5 px-3", text)}>{test.nextDue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Training Records */}
            <Card className={cn("border", cardBg)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-lg flex items-center gap-2", text)}>
                    <GraduationCap className="w-5 h-5 text-orange-400" /> Training Records
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Log Training
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Expiring training alert */}
                {MOCK_TRAINING.some((t) => t.status === "expiring_soon") && (
                  <div className={cn(
                    "rounded-lg border p-3 mb-4 flex items-center gap-3",
                    isLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/5 border-amber-500/30"
                  )}>
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className={cn("text-sm font-medium", isLight ? "text-amber-700" : "text-amber-400")}>
                        Training Expiring
                      </div>
                      <div className={cn("text-xs", isLight ? "text-amber-600" : "text-amber-400/70")}>
                        {MOCK_TRAINING.filter((t) => t.status === "expiring_soon").length} training records expiring soon
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {MOCK_TRAINING.map((tr) => (
                    <div key={tr.id} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      tr.status === "expiring_soon"
                        ? (isLight ? "border-amber-200 bg-amber-50/50" : "border-amber-500/30 bg-amber-500/5")
                        : (isLight ? "border-slate-200" : "border-slate-700/50")
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isLight ? "bg-orange-50" : "bg-orange-500/10"
                        )}>
                          <GraduationCap className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <div className={cn("text-sm font-medium", text)}>{tr.course}</div>
                          <div className={cn("text-xs", muted)}>
                            {tr.crewName} | {tr.provider} | Completed: {tr.completedDate}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={cn("text-xs", muted)}>Valid Until</div>
                          <div className={cn("text-sm font-medium", text)}>{tr.validUntil}</div>
                        </div>
                        <Badge className={CERT_STATUS[tr.status] || "bg-slate-500/20 text-slate-400"}>
                          {tr.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
