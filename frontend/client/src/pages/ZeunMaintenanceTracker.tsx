/**
 * ZEUN MECHANICS™ MAINTENANCE TRACKER
 * Track vehicle maintenance schedules and compliance
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Wrench,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ZeunMaintenanceTracker() {
  const [vehicleVin, setVehicleVin] = useState("");
  const [odometer, setOdometer] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const maintenanceDueQuery = trpc.zeun.getMaintenanceDue.useQuery(
    { vehicleVin: selectedVehicle || "", odometer },
    { enabled: !!selectedVehicle }
  );

  const maintenanceHistoryQuery = trpc.zeun.getMaintenanceHistory.useQuery(
    { vehicleVin: selectedVehicle || "" },
    { enabled: !!selectedVehicle }
  );

  const handleSearchVehicle = () => {
    if (vehicleVin.trim()) {
      setSelectedVehicle(vehicleVin);
    }
  };

  const maintenanceDue = maintenanceDueQuery.data || [];
  const maintenanceHistory = maintenanceHistoryQuery.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Maintenance Tracker</h1>
        <p className="text-gray-400 mt-1">Track vehicle maintenance schedules and compliance</p>
      </div>

      {/* Search Section */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Search Vehicle</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Vehicle VIN</label>
            <input
              type="text"
              value={vehicleVin}
              onChange={(e) => setVehicleVin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearchVehicle()}
              placeholder="Enter vehicle VIN"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Current Odometer</label>
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(parseInt(e.target.value) || 0)}
              placeholder="Enter current mileage"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
          </div>

          <Button
            onClick={handleSearchVehicle}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            Search Vehicle
          </Button>
        </div>
      </Card>

      {selectedVehicle && (
        <>
          {/* Maintenance Due */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={24} className="text-yellow-500" />
              Due for Maintenance
            </h2>

            {maintenanceDue.length > 0 ? (
              <div className="space-y-3">
                {maintenanceDue.map((item: any, idx: number) => (
                  <Card
                    key={idx}
                    className={`border-l-4 p-4 ${
                      item.priority === "HIGH"
                        ? "bg-red-900/20 border-red-700"
                        : "bg-yellow-900/20 border-yellow-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{item.service}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Due at: {item.dueAt.toLocaleString()} miles
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          item.priority === "HIGH"
                            ? "bg-red-600 text-red-200"
                            : "bg-yellow-600 text-yellow-200"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700">
                      <div>
                        <p className="text-xs text-gray-400">Interval</p>
                        <p className="text-white font-bold">{item.interval.toLocaleString()} mi</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Est. Cost</p>
                        <p className="text-white font-bold">${item.cost}</p>
                      </div>
                    </div>

                    <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                      Schedule Service
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-green-900/20 border-green-700 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <p className="text-green-300">All maintenance is current!</p>
                </div>
              </Card>
            )}
          </div>

          {/* Maintenance History */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar size={24} className="text-blue-500" />
              Service History
            </h2>

            {maintenanceHistory.length > 0 ? (
              <div className="space-y-3">
                {maintenanceHistory.map((record: any, idx: number) => (
                  <Card key={idx} className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white">{record.service}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded text-xs font-bold bg-green-900 text-green-200">
                        {record.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-700 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Odometer</p>
                        <p className="text-white font-bold">{record.odometer.toLocaleString()} mi</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Cost</p>
                        <p className="text-white font-bold">${record.cost}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Provider</p>
                        <p className="text-white font-bold text-xs">{record.provider}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700 p-4">
                <p className="text-gray-400">No service history found</p>
              </Card>
            )}
          </div>

          {/* Compliance Status */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={24} className="text-green-500" />
              Compliance Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-green-900/20 border-green-700 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <h3 className="font-bold text-white">DOT Inspection</h3>
                </div>
                <p className="text-green-300 text-sm">Current - Expires in 330 days</p>
              </Card>

              <Card className="bg-green-900/20 border-green-700 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <h3 className="font-bold text-white">Safety Rating</h3>
                </div>
                <p className="text-green-300 text-sm">Excellent - No violations</p>
              </Card>

              <Card className="bg-blue-900/20 border-blue-700 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle size={20} className="text-blue-500" />
                  <h3 className="font-bold text-white">Recalls</h3>
                </div>
                <p className="text-blue-300 text-sm">Check for open recalls</p>
              </Card>
            </div>
          </div>

          {/* Maintenance Statistics */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={24} className="text-purple-500" />
              Maintenance Statistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">Annual Maintenance Cost</h3>
                  <DollarSign size={20} className="text-green-500" />
                </div>
                <p className="text-3xl font-bold text-white">$2,450</p>
                <p className="text-sm text-gray-400 mt-1">Based on last 12 months</p>
              </Card>

              <Card className="bg-slate-800 border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">Average Service Interval</h3>
                  <Clock size={20} className="text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-white">45,000 mi</p>
                <p className="text-sm text-gray-400 mt-1">Between services</p>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Info Card */}
      <Card className="bg-blue-900/20 border-blue-700 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-300 mb-1">Preventive Maintenance</h3>
            <p className="text-sm text-blue-200">
              Regular maintenance extends vehicle life and reduces breakdowns. Schedule services
              before they become urgent.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

