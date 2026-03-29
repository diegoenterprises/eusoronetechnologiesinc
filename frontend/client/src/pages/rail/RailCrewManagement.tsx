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

/* ─── Empty data arrays (populated by tRPC queries when endpoints exist) ─── */
const EMPTY_ENGINEERS: any[] = [];

const EMPTY_CONDUCTORS: any[] = [];

const EMPTY_CERTIFICATIONS: { id: number; crewName: string; employeeId: string; certType: string; issueDate: string; expiryDate: string; status: string; issuedBy: string }[] = [];

const EMPTY_ASSIGNMENTS: { id: number; crewName: string; role: string; train: string; route: string; startTime: string; endTime: string; date: string; status: string }[] = [];

const EMPTY_DRUG_TESTS: { id: number; crewName: string; employeeId: string; testType: string; testDate: string; result: string; lab: string; nextDue: string }[] = [];

const EMPTY_TRAINING: { id: number; crewName: string; course: string; completedDate: string; validUntil: string; status: string; provider: string }[] = [];

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

  // Merge live data with empty defaults
  const engineers = liveCrew.length > 0
    ? liveCrew.filter((c: any) => c.role === "engineer")
    : EMPTY_ENGINEERS;
  const conductors = liveCrew.length > 0
    ? liveCrew.filter((c: any) => c.role === "conductor")
    : EMPTY_CONDUCTORS;

  const districts = [...new Set([...EMPTY_ENGINEERS, ...EMPTY_CONDUCTORS].map((c) => c.district))];

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
    if (certFilter === "all") return EMPTY_CERTIFICATIONS;
    return EMPTY_CERTIFICATIONS.filter((c) => c.status === certFilter);
  }, [certFilter]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === "all") return EMPTY_ASSIGNMENTS;
    return EMPTY_ASSIGNMENTS.filter((a) => a.status === assignmentFilter);
  }, [assignmentFilter]);

  // KPIs
  const allCrew = [...engineers, ...conductors];
  const onDutyCount = allCrew.filter((c: any) => c.status === "on_duty").length;
  const availableCount = allCrew.filter((c: any) => c.status === "available").length;
  const restingCount = allCrew.filter((c: any) => c.status === "resting").length;
  const alertCerts = EMPTY_CERTIFICATIONS.filter((c) => c.status === "expired" || c.status === "expiring_soon").length;

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
              {EMPTY_CERTIFICATIONS.some((c) => c.status === "expired" || c.status === "expiring_soon") && (
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
                      {EMPTY_CERTIFICATIONS.filter((c) => c.status === "expired").length} expired,{" "}
                      {EMPTY_CERTIFICATIONS.filter((c) => c.status === "expiring_soon").length} expiring soon — immediate action required
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
                {EMPTY_DRUG_TESTS.some((t) => t.result === "scheduled") && (
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
                        {EMPTY_DRUG_TESTS.filter((t) => t.result === "scheduled").length} crew members scheduled for testing
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
                      {EMPTY_DRUG_TESTS.map((test) => (
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
                {EMPTY_TRAINING.some((t) => t.status === "expiring_soon") && (
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
                        {EMPTY_TRAINING.filter((t) => t.status === "expiring_soon").length} training records expiring soon
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {EMPTY_TRAINING.map((tr) => (
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
