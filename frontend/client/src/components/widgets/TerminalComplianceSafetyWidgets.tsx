import React from 'react';
import { 
  Warehouse, Clock, TruckIcon, Users, Wrench, DollarSign,
  AlertTriangle, FileCheck, Shield, GraduationCap, Activity,
  ClipboardCheck, Calendar, TrendingUp, BarChart3, Bell
} from 'lucide-react';

// ============= TERMINAL_MANAGER WIDGETS =============

// Yard Management Dashboard
export const YardManagementWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const stats = {
    totalSpaces: 150,
    occupied: 87,
    available: 63,
    utilization: 58
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
          <p className="text-xs text-gray-400">Occupied</p>
          <p className="text-2xl font-bold text-blue-400">{stats.occupied}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
          <p className="text-xs text-gray-400">Available</p>
          <p className="text-2xl font-bold text-green-400">{stats.available}</p>
        </div>
      </div>
      {!compact && (
        <div className="p-3 rounded-lg bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Utilization</span>
            <span className="text-sm font-semibold text-white">{stats.utilization}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: `${stats.utilization}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Dock Scheduling System
export const DockSchedulingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const docks = [
    { id: 1, catalyst: 'ABC Logistics', time: '08:00 AM', status: 'loading', progress: 75 },
    { id: 2, catalyst: 'XYZ Transport', time: '10:00 AM', status: 'scheduled', progress: 0 },
    { id: 3, catalyst: 'Quick Ship', time: '12:00 PM', status: 'unloading', progress: 45 },
  ];

  return (
    <div className="space-y-2">
      {docks.slice(0, compact ? 2 : 3).map(dock => (
        <div key={dock.id} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">Dock {dock.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              dock.status === 'loading' ? 'bg-blue-500/20 text-blue-400' :
              dock.status === 'unloading' ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {dock.status}
            </span>
          </div>
          <p className="text-xs text-gray-400">{dock.catalyst} • {dock.time}</p>
          {dock.progress > 0 && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div className="bg-cyan-500 h-1 rounded-full" style={{ width: `${dock.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Equipment Utilization
export const EquipmentUtilizationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const equipment = [
    { name: 'Forklifts', total: 12, inUse: 9, utilization: 75 },
    { name: 'Pallet Jacks', total: 20, inUse: 14, utilization: 70 },
    { name: 'Yard Trucks', total: 8, inUse: 6, utilization: 75 },
  ];

  return (
    <div className="space-y-2">
      {equipment.slice(0, compact ? 2 : 3).map((item, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white">{item.name}</span>
            <span className="text-xs text-gray-400">{item.inUse}/{item.total}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{ width: `${item.utilization}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Labor Management
export const LaborManagementWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const shifts = [
    { shift: 'Day Shift', scheduled: 15, present: 14, efficiency: 92 },
    { shift: 'Night Shift', scheduled: 10, present: 10, efficiency: 95 },
  ];

  return (
    <div className="space-y-3">
      {shifts.slice(0, compact ? 1 : 2).map((shift, i) => (
        <div key={i} className="p-3 rounded-lg bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">{shift.shift}</span>
            <span className="text-xs text-green-400">{shift.efficiency}% efficient</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-gray-400">{shift.present}/{shift.scheduled} present</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Gate Activity Monitor
export const GateActivityWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const activity = [
    { time: '09:15 AM', catalyst: 'ABC Logistics', type: 'Check-in', gate: 'Gate 1' },
    { time: '09:30 AM', catalyst: 'XYZ Transport', type: 'Check-out', gate: 'Gate 2' },
    { time: '09:45 AM', catalyst: 'Quick Ship', type: 'Check-in', gate: 'Gate 1' },
  ];

  return (
    <div className="space-y-2">
      {activity.slice(0, compact ? 2 : 3).map((item, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">{item.catalyst}</p>
              <p className="text-xs text-gray-400">{item.gate} • {item.time}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.type === 'Check-in' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {item.type}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============= COMPLIANCE_OFFICER WIDGETS =============

// Compliance Dashboard
export const ComplianceDashboardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const stats = {
    compliant: 156,
    pending: 12,
    violations: 3,
    score: 94
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-green-900/20 text-center">
          <p className="text-xl font-bold text-green-400">{stats.compliant}</p>
          <p className="text-xs text-gray-400">Compliant</p>
        </div>
        <div className="p-2 rounded-lg bg-yellow-900/20 text-center">
          <p className="text-xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>
        <div className="p-2 rounded-lg bg-red-900/20 text-center">
          <p className="text-xl font-bold text-red-400">{stats.violations}</p>
          <p className="text-xs text-gray-400">Violations</p>
        </div>
      </div>
      {!compact && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Compliance Score</span>
            <span className="text-2xl font-bold text-green-400">{stats.score}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Driver Qualification Files
export const DriverQualificationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const drivers = [
    { name: 'John Smith', status: 'current', expires: '2025-03-15', docs: 8 },
    { name: 'Jane Doe', status: 'expiring', expires: '2024-11-20', docs: 7 },
    { name: 'Bob Johnson', status: 'expired', expires: '2024-10-01', docs: 6 },
  ];

  return (
    <div className="space-y-2">
      {drivers.slice(0, compact ? 2 : 3).map((driver, i) => (
        <div key={i} className={`p-2 rounded-lg border ${
          driver.status === 'current' ? 'bg-green-900/10 border-green-500/30' :
          driver.status === 'expiring' ? 'bg-yellow-900/10 border-yellow-500/30' :
          'bg-red-900/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{driver.name}</p>
              <p className="text-xs text-gray-400">{driver.docs} documents • Exp: {driver.expires}</p>
            </div>
            <FileCheck className={`w-4 h-4 ${
              driver.status === 'current' ? 'text-green-400' :
              driver.status === 'expiring' ? 'text-yellow-400' :
              'text-red-400'
            }`} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Hours of Service Monitoring
export const HOSMonitoringWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const drivers = [
    { name: 'Driver A', hoursLeft: 8.5, status: 'safe' },
    { name: 'Driver B', hoursLeft: 2.0, status: 'warning' },
    { name: 'Driver C', hoursLeft: 0.5, status: 'critical' },
  ];

  return (
    <div className="space-y-2">
      {drivers.slice(0, compact ? 2 : 3).map((driver, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white">{driver.name}</span>
            <span className={`text-xs font-semibold ${
              driver.status === 'safe' ? 'text-green-400' :
              driver.status === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {driver.hoursLeft}h left
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${
              driver.status === 'safe' ? 'bg-green-500' :
              driver.status === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} style={{ width: `${(driver.hoursLeft / 11) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Drug & Alcohol Testing Tracker
export const DrugTestingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const tests = [
    { driver: 'John Smith', type: 'Random', date: '2024-10-15', result: 'Negative' },
    { driver: 'Jane Doe', type: 'Pre-Employment', date: '2024-10-10', result: 'Pending' },
  ];

  return (
    <div className="space-y-2">
      {tests.slice(0, compact ? 1 : 2).map((test, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">{test.driver}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              test.result === 'Negative' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {test.result}
            </span>
          </div>
          <p className="text-xs text-gray-400">{test.type} • {test.date}</p>
        </div>
      ))}
    </div>
  );
};

// Document Expiration Alerts
export const DocumentExpirationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const documents = [
    { type: 'CDL License', driver: 'John Smith', expires: '2024-11-15', daysLeft: 15 },
    { type: 'Medical Card', driver: 'Jane Doe', expires: '2024-10-25', daysLeft: 5 },
    { type: 'Insurance', driver: 'Bob Johnson', expires: '2024-12-01', daysLeft: 42 },
  ];

  return (
    <div className="space-y-2">
      {documents.slice(0, compact ? 2 : 3).map((doc, i) => (
        <div key={i} className={`p-2 rounded-lg border ${
          doc.daysLeft <= 7 ? 'bg-red-900/20 border-red-500/30' :
          doc.daysLeft <= 30 ? 'bg-yellow-900/20 border-yellow-500/30' :
          'bg-green-900/20 border-green-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{doc.type}</p>
              <p className="text-xs text-gray-400">{doc.driver}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-semibold ${
                doc.daysLeft <= 7 ? 'text-red-400' :
                doc.daysLeft <= 30 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {doc.daysLeft} days
              </p>
              <p className="text-xs text-gray-500">{doc.expires}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============= SAFETY_MANAGER WIDGETS =============

// Safety Dashboard
export const SafetyDashboardWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const stats = {
    daysWithoutAccident: 127,
    incidents: 2,
    nearMisses: 5,
    safetyScore: 96
  };

  return (
    <div className="space-y-3">
      <div className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 text-center">
        <p className="text-3xl font-bold text-green-400">{stats.daysWithoutAccident}</p>
        <p className="text-xs text-gray-300">Days Without Accident</p>
      </div>
      {!compact && (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-blue-900/20 text-center">
            <p className="text-xl font-bold text-blue-400">{stats.incidents}</p>
            <p className="text-xs text-gray-400">Incidents</p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-900/20 text-center">
            <p className="text-xl font-bold text-yellow-400">{stats.nearMisses}</p>
            <p className="text-xs text-gray-400">Near Misses</p>
          </div>
          <div className="p-2 rounded-lg bg-green-900/20 text-center">
            <p className="text-xl font-bold text-green-400">{stats.safetyScore}%</p>
            <p className="text-xs text-gray-400">Score</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Accident Tracker & Analytics
export const AccidentTrackerWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const accidents = [
    { date: '2024-09-15', type: 'Minor Collision', driver: 'John Smith', severity: 'low' },
    { date: '2024-08-20', type: 'Property Damage', driver: 'Jane Doe', severity: 'medium' },
  ];

  return (
    <div className="space-y-2">
      {accidents.slice(0, compact ? 1 : 2).map((accident, i) => (
        <div key={i} className={`p-3 rounded-lg border ${
          accident.severity === 'low' ? 'bg-yellow-900/10 border-yellow-500/30' : 'bg-orange-900/10 border-orange-500/30'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">{accident.type}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              accident.severity === 'low' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {accident.severity}
            </span>
          </div>
          <p className="text-xs text-gray-400">{accident.driver} • {accident.date}</p>
        </div>
      ))}
    </div>
  );
};

// Safety Training Manager
export const SafetyTrainingWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const training = [
    { course: 'Defensive Driving', completed: 45, total: 50, due: '2024-11-30' },
    { course: 'Hazmat Handling', completed: 20, total: 25, due: '2024-12-15' },
  ];

  return (
    <div className="space-y-3">
      {training.slice(0, compact ? 1 : 2).map((item, i) => (
        <div key={i} className="p-3 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">{item.course}</span>
            </div>
            <span className="text-xs text-gray-400">{item.completed}/{item.total}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: `${(item.completed / item.total) * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500">Due: {item.due}</p>
        </div>
      ))}
    </div>
  );
};

// Driver Safety Scores
export const DriverSafetyScoresWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const drivers = [
    { name: 'John Smith', score: 98, trend: 'up' },
    { name: 'Jane Doe', score: 95, trend: 'stable' },
    { name: 'Bob Johnson', score: 87, trend: 'down' },
  ];

  return (
    <div className="space-y-2">
      {drivers.slice(0, compact ? 2 : 3).map((driver, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">{driver.name}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${
                driver.score >= 95 ? 'text-green-400' :
                driver.score >= 85 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {driver.score}
              </span>
              <TrendingUp className={`w-3 h-3 ${
                driver.trend === 'up' ? 'text-green-400' :
                driver.trend === 'stable' ? 'text-gray-400' :
                'text-red-400 rotate-180'
              }`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Incident Investigation Tracker
export const IncidentInvestigationWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const investigations = [
    { id: 'INV-001', type: 'Accident', status: 'In Progress', daysOpen: 5 },
    { id: 'INV-002', type: 'Near Miss', status: 'Completed', daysOpen: 12 },
  ];

  return (
    <div className="space-y-2">
      {investigations.slice(0, compact ? 1 : 2).map((inv, i) => (
        <div key={i} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-white">{inv.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              inv.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {inv.status}
            </span>
          </div>
          <p className="text-xs text-gray-400">{inv.type} • {inv.daysOpen} days</p>
        </div>
      ))}
    </div>
  );
};
