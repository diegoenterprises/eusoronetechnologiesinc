import React, { useState } from 'react';
import { trpc } from "@/lib/trpc";
import { 
  Shield, MapPin, FileCheck, Calendar, Phone, Ruler,
  AlertTriangle, CheckCircle, Radio, Truck, Navigation,
  Bell, ClipboardCheck, Wrench, Clock, Users
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// ============= CATALYST WIDGETS =============

// Escort Assignment Dashboard
export const EscortAssignmentWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const assignments = [
    { id: 1, load: 'Load #1234', route: 'TX-45 North', status: 'active', escort: 'Unit 12' },
    { id: 2, load: 'Load #1235', route: 'I-10 West', status: 'scheduled', escort: 'Unit 8' },
    { id: 3, load: 'Load #1236', route: 'US-290 East', status: 'completed', escort: 'Unit 5' },
  ];

  return (
    <div className="space-y-3">
      {assignments.slice(0, compact ? 2 : 3).map(assignment => (
        <div key={assignment.id} className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">{assignment.load}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              assignment.status === 'active' ? 'bg-green-500/20 text-green-400' :
              assignment.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {assignment.status}
            </span>
          </div>
          <p className="text-xs text-gray-400">{assignment.route}</p>
          <p className="text-xs text-gray-500 mt-1">Escort: {assignment.escort}</p>
        </div>
      ))}
    </div>
  );
};

// Route Permit Tracker
export const RoutePermitWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const permits = [
    { id: 1, state: 'Texas', status: 'approved', expires: '2024-12-31', type: 'Oversize' },
    { id: 2, state: 'Louisiana', status: 'pending', expires: '2024-11-15', type: 'Overweight' },
    { id: 3, state: 'Oklahoma', status: 'approved', expires: '2024-10-20', type: 'Oversize' },
  ];

  return (
    <div className="space-y-2">
      {permits.slice(0, compact ? 2 : 3).map(permit => (
        <div key={permit.id} className="p-2 rounded-lg bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{permit.state}</p>
              <p className="text-xs text-gray-400">{permit.type}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                permit.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {permit.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">Exp: {permit.expires}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Oversized Load Coordinator
export const OversizedLoadWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const loads = [
    { id: 1, dimensions: '14\'W x 16\'H x 80\'L', weight: '120,000 lbs', status: 'In Transit' },
    { id: 2, dimensions: '12\'W x 14\'H x 65\'L', weight: '95,000 lbs', status: 'Pending' },
  ];

  return (
    <div className="space-y-3">
      {loads.slice(0, compact ? 1 : 2).map(load => (
        <div key={load.id} className="p-3 rounded-lg bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-white">Load #{load.id}</span>
          </div>
          <p className="text-xs text-gray-300">{load.dimensions}</p>
          <p className="text-xs text-gray-400">{load.weight}</p>
          <span className="text-xs text-orange-400 mt-2 inline-block">{load.status}</span>
        </div>
      ))}
    </div>
  );
};

// Load Dimension Calculator
export const DimensionCalculatorWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');

  const isOversized = () => {
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const l = parseFloat(length) || 0;
    return w > 8.5 || h > 13.5 || l > 53;
  };

  if (compact) {
    return (
      <div className="text-center">
        <Ruler className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
        <p className="text-xs text-gray-400">Dimension Calculator</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          placeholder="Width (ft)"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
        />
        <input
          type="number"
          placeholder="Height (ft)"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
        />
        <input
          type="number"
          placeholder="Length (ft)"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>
      {(width || height || length) && (
        <div className={`p-3 rounded-lg ${isOversized() ? 'bg-red-900/20 border border-red-500/30' : 'bg-green-900/20 border border-green-500/30'}`}>
          <p className={`text-sm font-semibold ${isOversized() ? 'text-red-400' : 'text-green-400'}`}>
            {isOversized() ? 'OVERSIZED - Permit Required' : 'Standard Size'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {width && `W: ${width}' `}
            {height && `H: ${height}' `}
            {length && `L: ${length}'`}
          </p>
        </div>
      )}
    </div>
  );
};

// ============= ESCORT WIDGETS =============

// Active Escort Assignments
export const ActiveEscortWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const escorts = [
    { id: 1, unit: 'Unit 12', load: 'Load #1234', location: 'Mile 145, TX-45', status: 'Active' },
    { id: 2, unit: 'Unit 8', load: 'Load #1235', location: 'Rest Stop, I-10', status: 'Break' },
  ];

  return (
    <div className="space-y-3">
      {escorts.slice(0, compact ? 1 : 2).map(escort => (
        <div key={escort.id} className="p-3 rounded-lg bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">{escort.unit}</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              escort.status === 'Active' ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {escort.status}
            </span>
          </div>
          <p className="text-xs text-gray-300">{escort.load}</p>
          <div className="flex items-center gap-1 mt-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-400">{escort.location}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Clearance Alerts
export const ClearanceAlertsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const alerts = [
    { id: 1, type: 'Height', location: 'Bridge at Mile 152', clearance: '13.2 ft', loadHeight: '14.5 ft', severity: 'critical' },
    { id: 2, type: 'Width', location: 'Tunnel at Mile 178', clearance: '12 ft', loadWidth: '11.5 ft', severity: 'warning' },
  ];

  return (
    <div className="space-y-2">
      {alerts.slice(0, compact ? 1 : 2).map(alert => (
        <div key={alert.id} className={`p-3 rounded-lg border ${
          alert.severity === 'critical' ? 'bg-red-900/20 border-red-500/50' : 'bg-yellow-900/20 border-yellow-500/50'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`} />
            <span className="text-sm font-semibold text-white">{alert.type} Clearance</span>
          </div>
          <p className="text-xs text-gray-300">{alert.location}</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-500">Clearance</p>
              <p className="text-xs text-white">{alert.clearance}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Load {alert.type}</p>
              <p className={`text-xs ${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                {alert.type === 'Height' ? alert.loadHeight : alert.loadWidth}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Communication Hub
export const CommunicationHubWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const contacts = [
    { name: 'Dispatch', phone: '(555) 123-4567', status: 'online' },
    { name: 'Lead Driver', phone: '(555) 234-5678', status: 'online' },
    { name: 'Tail Driver', phone: '(555) 345-6789', status: 'offline' },
  ];

  return (
    <div className="space-y-2">
      {contacts.slice(0, compact ? 2 : 3).map((contact, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${contact.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <div>
              <p className="text-sm text-white">{contact.name}</p>
              <p className="text-xs text-gray-400">{contact.phone}</p>
            </div>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-2">
            <Phone className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
};

// Emergency Protocols
export const EmergencyProtocolsWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const protocols = [
    { title: 'Accident Response', steps: 4, priority: 'critical' },
    { title: 'Vehicle Breakdown', steps: 3, priority: 'high' },
    { title: 'Weather Emergency', steps: 5, priority: 'high' },
  ];

  return (
    <div className="space-y-2">
      {protocols.slice(0, compact ? 2 : 3).map((protocol, i) => (
        <div key={i} className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-800/30 ${
          protocol.priority === 'critical' ? 'bg-red-900/10 border-red-500/30' : 'bg-orange-900/10 border-orange-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className={`w-4 h-4 ${protocol.priority === 'critical' ? 'text-red-400' : 'text-orange-400'}`} />
              <span className="text-sm font-semibold text-white">{protocol.title}</span>
            </div>
            <span className="text-xs text-gray-400">{protocol.steps} steps</span>
          </div>
        </div>
      ))}
    </div>
  );
};
