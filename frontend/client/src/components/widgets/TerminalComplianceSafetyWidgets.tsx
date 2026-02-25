import React from 'react';
import { 
  Warehouse, Clock, TruckIcon, Users, Wrench, DollarSign,
  AlertTriangle, FileCheck, Shield, GraduationCap, Activity,
  ClipboardCheck, Calendar, TrendingUp, BarChart3, Bell
} from 'lucide-react';

const EmptyState = ({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) => (
  <div className="flex flex-col items-center justify-center py-6 text-gray-500">
    <Icon className="w-8 h-8 mb-2 opacity-40" />
    <p className="text-xs">{text}</p>
    <p className="text-[10px] text-gray-600 mt-1">{sub}</p>
  </div>
);

// ============= TERMINAL_MANAGER WIDGETS =============

// Yard Management Dashboard
export const YardManagementWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Warehouse} text="No yard data" sub="Connect a TAS integration to see yard utilization" />
);

// Dock Scheduling System
export const DockSchedulingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Clock} text="No dock schedule" sub="Dock scheduling data will appear when a TAS is connected" />
);

// Equipment Utilization
export const EquipmentUtilizationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Wrench} text="No equipment data" sub="Equipment utilization will appear when configured" />
);

// Labor Management
export const LaborManagementWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Users} text="No labor data" sub="Staff shift data will appear when configured" />
);

// Gate Activity Monitor
export const GateActivityWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={TruckIcon} text="No gate activity" sub="Gate events will appear when a TAS is connected" />
);

// ============= COMPLIANCE_OFFICER WIDGETS =============

// Compliance Dashboard
export const ComplianceDashboardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Shield} text="No compliance data" sub="Upload documents in Document Center to see compliance status" />
);

// Driver Qualification Files
export const DriverQualificationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={FileCheck} text="No driver qualifications" sub="Driver qualification files will appear when drivers are added" />
);

// Hours of Service Monitoring
export const HOSMonitoringWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Clock} text="No HOS data" sub="Connect an ELD integration to monitor driver hours" />
);

// Drug & Alcohol Testing Tracker
export const DrugTestingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={ClipboardCheck} text="No testing records" sub="Drug & alcohol testing records will appear when configured" />
);

// Document Expiration Alerts
export const DocumentExpirationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={AlertTriangle} text="No document alerts" sub="Upload documents to track expiration dates" />
);

// ============= SAFETY_MANAGER WIDGETS =============

// Safety Dashboard
export const SafetyDashboardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Shield} text="No safety data" sub="Safety metrics will appear as incidents and inspections are logged" />
);

// Accident Tracker & Analytics
export const AccidentTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={AlertTriangle} text="No accidents recorded" sub="Accident reports will appear here when logged" />
);

// Safety Training Manager
export const SafetyTrainingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={GraduationCap} text="No training records" sub="Training courses will appear when configured" />
);

// Driver Safety Scores
export const DriverSafetyScoresWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={TrendingUp} text="No driver scores" sub="Driver safety scores will populate as trips are completed" />
);

// Incident Investigation Tracker
export const IncidentInvestigationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <EmptyState icon={Activity} text="No investigations" sub="Incident investigations will appear here when opened" />
);
