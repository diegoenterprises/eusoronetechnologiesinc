import React from "react";
import { trpc } from "@/lib/trpc";
import { ResponsiveWidget } from "./DynamicWidgets";
import { StatRow, MiniStats, WidgetList, WidgetLoader } from "./WidgetHelpers";
import { Badge } from "@/components/ui/badge";
import {
  Clock, Shield, AlertCircle, CheckCircle, FileText, BookOpen,
  DollarSign, Gauge, Truck, Award, Target, Flame, Wrench, Calendar
} from "lucide-react";

// ---- COMPLIANCE OFFICER WIDGETS ----

export const VehicleInspectionsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getVehicleInspections.useQuery(undefined, { refetchInterval: 600000 });
  const i = data || { total: 0, passed: 0, failed: 0, upcoming: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Passed", value: i.passed, color: "bg-green-500/10" },
          { label: "Failed", value: i.failed, color: "bg-red-500/10" },
          { label: "Upcoming", value: i.upcoming, color: "bg-blue-500/10" },
        ]} />
        <StatRow label="Total Inspections" value={i.total} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const HOSViolationsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getHOSViolations.useQuery(undefined, { refetchInterval: 120000 });
  const v = data || { total: 0, thisWeek: 0, critical: 0, trending: "down" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: v.total, color: "bg-red-500/10" },
          { label: "This Week", value: v.thisWeek, color: "bg-orange-500/10" },
          { label: "Critical", value: v.critical, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Trend" value={v.trending === "down" ? "Improving" : "Worsening"} color={v.trending === "down" ? "text-green-400" : "text-red-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const DrugTestingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDrugTesting.useQuery(undefined, { refetchInterval: 600000 });
  const t = data || { scheduled: 0, completed: 0, positive: 0, overdue: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Scheduled", value: t.scheduled, color: "bg-blue-500/10" },
          { label: "Done", value: t.completed, color: "bg-green-500/10" },
          { label: "Overdue", value: t.overdue, color: "bg-red-500/10" },
        ]} />
        {t.positive > 0 && <StatRow label="[ALERT] Positive Results" value={t.positive} color="text-red-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const InsuranceComplianceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getInsuranceCompliance.useQuery(undefined, { refetchInterval: 600000 });
  const i = data || { compliant: 0, nonCompliant: 0, expiringSoon: 0, total: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Compliant", value: i.compliant, color: "bg-green-500/10" },
          { label: "Non-Compliant", value: i.nonCompliant, color: "bg-red-500/10" },
          { label: "Expiring", value: i.expiringSoon, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Total Policies" value={i.total} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const AuditTrackerWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getAuditTracker.useQuery(undefined, { refetchInterval: 600000 });
  const a = data || { upcoming: 0, completed: 0, findings: 0, nextDate: "N/A" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Upcoming", value: a.upcoming, color: "bg-blue-500/10" },
          { label: "Completed", value: a.completed, color: "bg-green-500/10" },
          { label: "Findings", value: a.findings, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Next Audit" value={a.nextDate} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const TrainingRecordsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getTrainingRecords.useQuery(undefined, { refetchInterval: 600000 });
  const t = data || { completed: 0, inProgress: 0, overdue: 0, complianceRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Done", value: t.completed, color: "bg-green-500/10" },
          { label: "In Progress", value: t.inProgress, color: "bg-blue-500/10" },
          { label: "Overdue", value: t.overdue, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Compliance Rate" value={`${t.complianceRate}%`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const IFTAReportingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getIFTAReporting.useQuery(undefined, { refetchInterval: 600000 });
  const f = data || { currentQuarter: "Q1", totalMiles: 0, totalGallons: 0, taxOwed: 0, dueDate: "N/A" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Quarter" value={f.currentQuarter} color="text-blue-400" />
        <StatRow label="Total Miles" value={f.totalMiles.toLocaleString()} color="text-cyan-400" />
        <StatRow label="Gallons" value={f.totalGallons.toLocaleString()} color="text-purple-400" />
        <StatRow label="Tax Owed" value={`$${f.taxOwed.toLocaleString()}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const DOTNumberStatusWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDOTNumberStatus.useQuery(undefined, { refetchInterval: 600000 });
  const d = data || { number: "N/A", status: "Active", authority: "Active" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-lg font-bold text-blue-400">{d.number}</p>
          <p className="text-xs text-gray-400">DOT Number</p>
        </div>
        <StatRow label="Status" value={d.status} color={d.status === "Active" ? "text-green-400" : "text-red-400"} />
        <StatRow label="Authority" value={d.authority} color={d.authority === "Active" ? "text-green-400" : "text-red-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ViolationTrendsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getViolationTrends.useQuery(undefined, { refetchInterval: 600000 });
  const t = data || { thisMonth: 0, lastMonth: 0, change: 0, topCategory: "" };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "This Month", value: t.thisMonth, color: "bg-red-500/10" },
          { label: "Last Month", value: t.lastMonth, color: "bg-orange-500/10" },
        ]} />
        <StatRow label="Change" value={`${t.change > 0 ? '+' : ''}${t.change}%`} color={t.change <= 0 ? "text-green-400" : "text-red-400"} />
        {t.topCategory && <StatRow label="Top Issue" value={t.topCategory} color="text-orange-400" />}
      </div>
    )}</ResponsiveWidget>
  );
};

export const PermitManagementWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getPermitManagement.useQuery(undefined, { refetchInterval: 600000 });
  const p = data || { active: 0, expiring: 0, expired: 0, pending: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Active", value: p.active, color: "bg-green-500/10" },
          { label: "Expiring", value: p.expiring, color: "bg-yellow-500/10" },
          { label: "Expired", value: p.expired, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Pending Review" value={p.pending} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const CSAScoresWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getCSAScores.useQuery(undefined, { refetchInterval: 600000 });
  const c = data || { unsafe: 0, hos: 0, vehicleMaint: 0, hazmat: 0, driverFitness: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <StatRow label="Unsafe Driving" value={`${c.unsafe}%`} color={c.unsafe > 65 ? "text-red-400" : "text-green-400"} />
        <StatRow label="HOS Compliance" value={`${c.hos}%`} color={c.hos > 65 ? "text-red-400" : "text-green-400"} />
        <StatRow label="Vehicle Maint" value={`${c.vehicleMaint}%`} color={c.vehicleMaint > 80 ? "text-red-400" : "text-green-400"} />
        <StatRow label="Hazmat" value={`${c.hazmat}%`} color={c.hazmat > 80 ? "text-red-400" : "text-green-400"} />
        <StatRow label="Driver Fitness" value={`${c.driverFitness}%`} color={c.driverFitness > 80 ? "text-red-400" : "text-green-400"} />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ComplianceCostsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getComplianceCosts.useQuery(undefined, { refetchInterval: 600000 });
  const c = data || { total: 0, fines: 0, training: 0, insurance: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-red-500/10">
          <p className="text-2xl font-bold text-red-400">${c.total.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total Compliance Cost</p>
        </div>
        <StatRow label="Fines" value={`$${c.fines.toLocaleString()}`} color="text-red-400" />
        <StatRow label="Training" value={`$${c.training.toLocaleString()}`} color="text-blue-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

// ---- SAFETY MANAGER WIDGETS ----

export const DriverSafetyScoresWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getDriverSafetyScores.useQuery(undefined, { refetchInterval: 300000 });
  const drivers = Array.isArray(data) ? data : data?.drivers || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader /> : (
      <WidgetList items={drivers.slice(0, exp ? 5 : 3)} renderItem={(d: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
          <Award className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{d.name || `Driver ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${(d.score||0)>=90?"bg-green-500/20 text-green-400":(d.score||0)>=70?"bg-yellow-500/20 text-yellow-400":"bg-red-500/20 text-red-400"}`}>
            {d.score || 0}
          </Badge>
        </div>
      )} empty="No driver scores" />
    )}</ResponsiveWidget>
  );
};

export const SafetyTrainingWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getSafetyTraining.useQuery(undefined, { refetchInterval: 600000 });
  const t = data || { programs: 0, completed: 0, inProgress: 0, overdue: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Programs", value: t.programs, color: "bg-blue-500/10" },
          { label: "Done", value: t.completed, color: "bg-green-500/10" },
          { label: "Overdue", value: t.overdue, color: "bg-red-500/10" },
        ]} />
        <StatRow label="In Progress" value={t.inProgress} color="text-cyan-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const NearMissReportsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getNearMissReports.useQuery(undefined, { refetchInterval: 300000 });
  const r = data || { total: 0, thisMonth: 0, investigated: 0, open: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-yellow-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: r.total, color: "bg-yellow-500/10" },
          { label: "This Month", value: r.thisMonth, color: "bg-orange-500/10" },
          { label: "Open", value: r.open, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Investigated" value={r.investigated} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const VehicleMaintenanceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getVehicleMaintenance.useQuery(undefined, { refetchInterval: 300000 });
  const m = data || { scheduled: 0, overdue: 0, completed: 0, avgCost: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Scheduled", value: m.scheduled, color: "bg-blue-500/10" },
          { label: "Overdue", value: m.overdue, color: "bg-red-500/10" },
          { label: "Done", value: m.completed, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Avg Cost" value={`$${m.avgCost.toLocaleString()}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const SafetyMeetingsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getSafetyMeetings.useQuery(undefined, { refetchInterval: 600000 });
  const m = data || { upcoming: 0, completed: 0, nextDate: "N/A", attendance: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Upcoming", value: m.upcoming, color: "bg-blue-500/10" },
          { label: "Completed", value: m.completed, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Next Meeting" value={m.nextDate} color="text-cyan-400" />
        <StatRow label="Avg Attendance" value={`${m.attendance}%`} color="text-purple-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const HazmatComplianceWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getHazmatCompliance.useQuery(undefined, { refetchInterval: 600000 });
  const h = data || { certified: 0, expiring: 0, incidents: 0, complianceRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-orange-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Certified", value: h.certified, color: "bg-green-500/10" },
          { label: "Expiring", value: h.expiring, color: "bg-yellow-500/10" },
          { label: "Incidents", value: h.incidents, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Compliance Rate" value={`${h.complianceRate}%`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const SafetyEquipmentWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getSafetyEquipment.useQuery(undefined, { refetchInterval: 600000 });
  const e = data || { total: 0, inspected: 0, needsReplacement: 0, compliant: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Total", value: e.total, color: "bg-blue-500/10" },
          { label: "Inspected", value: e.inspected, color: "bg-green-500/10" },
          { label: "Replace", value: e.needsReplacement, color: "bg-red-500/10" },
        ]} />
        <StatRow label="Compliant" value={`${e.compliant}%`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const RiskAssessmentWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getRiskAssessment.useQuery(undefined, { refetchInterval: 600000 });
  const r = data || { high: 0, medium: 0, low: 0, mitigated: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "High", value: r.high, color: "bg-red-500/10" },
          { label: "Medium", value: r.medium, color: "bg-yellow-500/10" },
          { label: "Low", value: r.low, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Mitigated" value={r.mitigated} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const InjuryRatesWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getInjuryRates.useQuery(undefined, { refetchInterval: 600000 });
  const r = data || { recordable: 0, lostTime: 0, firstAid: 0, trir: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Recordable", value: r.recordable, color: "bg-red-500/10" },
          { label: "Lost Time", value: r.lostTime, color: "bg-orange-500/10" },
          { label: "First Aid", value: r.firstAid, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="TRIR" value={r.trir.toFixed(2)} color="text-red-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const EmergencyProceduresWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getEmergencyProcedures.useQuery(undefined, { refetchInterval: 600000 });
  const procs = Array.isArray(data) ? data : data?.procedures || [];
  return (
    <ResponsiveWidget>{(exp) => isLoading ? <WidgetLoader color="text-red-400" /> : (
      <WidgetList items={procs.slice(0, exp ? 5 : 3)} renderItem={(p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <span className="text-xs text-white flex-1 truncate">{p.name || `Procedure ${i+1}`}</span>
          <Badge className={`border-0 text-[10px] ${p.reviewed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            {p.reviewed ? "Reviewed" : "Pending"}
          </Badge>
        </div>
      )} empty="No procedures" />
    )}</ResponsiveWidget>
  );
};

export const SafetyInspectionsWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getSafetyInspections.useQuery(undefined, { refetchInterval: 600000 });
  const i = data || { completed: 0, scheduled: 0, findings: 0, passRate: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Done", value: i.completed, color: "bg-green-500/10" },
          { label: "Scheduled", value: i.scheduled, color: "bg-blue-500/10" },
          { label: "Findings", value: i.findings, color: "bg-yellow-500/10" },
        ]} />
        <StatRow label="Pass Rate" value={`${i.passRate}%`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const ClaimsManagementWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getClaimsManagement.useQuery(undefined, { refetchInterval: 600000 });
  const c = data || { open: 0, closed: 0, totalValue: 0, avgSettlement: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader /> : (
      <div className="space-y-3">
        <MiniStats items={[
          { label: "Open", value: c.open, color: "bg-red-500/10" },
          { label: "Closed", value: c.closed, color: "bg-green-500/10" },
        ]} />
        <StatRow label="Total Value" value={`$${c.totalValue.toLocaleString()}`} color="text-red-400" />
        <StatRow label="Avg Settlement" value={`$${c.avgSettlement.toLocaleString()}`} color="text-orange-400" />
      </div>
    )}</ResponsiveWidget>
  );
};

export const SafetyROIWidget: React.FC = () => {
  const { data, isLoading } = (trpc as any).dashboard.getSafetyROI.useQuery(undefined, { refetchInterval: 600000 });
  const r = data || { invested: 0, saved: 0, roi: 0, accidentsAvoided: 0 };
  return (
    <ResponsiveWidget>{() => isLoading ? <WidgetLoader color="text-green-400" /> : (
      <div className="space-y-3">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">{r.roi}%</p>
          <p className="text-xs text-gray-400">Safety Program ROI</p>
        </div>
        <StatRow label="Invested" value={`$${r.invested.toLocaleString()}`} color="text-blue-400" />
        <StatRow label="Saved" value={`$${r.saved.toLocaleString()}`} color="text-green-400" />
      </div>
    )}</ResponsiveWidget>
  );
};
