/**
 * SAFETY DASHBOARD PAGE
 * Dashboard for Safety Managers
 * Based on 09_SAFETY_MANAGER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Shield, AlertTriangle, Users, TrendingUp, TrendingDown,
  FileText, Search, Filter, Activity, Car, Clock,
  CheckCircle, XCircle, ChevronRight, Star, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CSAScores, getSampleCSAScores } from "@/components/safety/CSAScores";

interface DriverSafetyCard {
  id: string;
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  incidents30d: number;
  violations30d: number;
  hosCompliance: number;
  lastIncident?: string;
  status: "good" | "warning" | "critical";
}

const MOCK_DRIVERS: DriverSafetyCard[] = [
  { id: "d1", name: "John Smith", score: 95, trend: "up", incidents30d: 0, violations30d: 0, hosCompliance: 99, status: "good" },
  { id: "d2", name: "Maria Garcia", score: 88, trend: "stable", incidents30d: 0, violations30d: 1, hosCompliance: 96, status: "good" },
  { id: "d3", name: "Robert Johnson", score: 72, trend: "down", incidents30d: 1, violations30d: 3, hosCompliance: 85, lastIncident: "Hard braking event", status: "warning" },
  { id: "d4", name: "Sarah Williams", score: 91, trend: "up", incidents30d: 0, violations30d: 0, hosCompliance: 98, status: "good" },
  { id: "d5", name: "Michael Brown", score: 65, trend: "down", incidents30d: 2, violations30d: 5, hosCompliance: 78, lastIncident: "Speeding violation", status: "critical" },
  { id: "d6", name: "Emily Davis", score: 82, trend: "stable", incidents30d: 0, violations30d: 2, hosCompliance: 92, status: "good" },
];

const STATS = {
  safetyScore: 87,
  activeDrivers: 45,
  openIncidents: 3,
  overdueItems: 7,
  pendingDrugTests: 2,
  csaAlert: true,
};

export default function SafetyDashboard() {
  const [drivers] = useState<DriverSafetyCard[]>(MOCK_DRIVERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCSA, setShowCSA] = useState(false);

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const criticalDrivers = drivers.filter(d => d.status === "critical");
  const warningDrivers = drivers.filter(d => d.status === "warning");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Safety Dashboard</h1>
          <p className="text-slate-400">Monitor fleet safety metrics and driver performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600" onClick={() => setShowCSA(!showCSA)}>
            <Activity className="w-4 h-4 mr-2" />
            {showCSA ? "Hide CSA Scores" : "View CSA Scores"}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Safety Score</p>
                <p className={cn(
                  "text-2xl font-bold",
                  STATS.safetyScore >= 85 ? "text-green-400" : 
                  STATS.safetyScore >= 70 ? "text-yellow-400" : "text-red-400"
                )}>{STATS.safetyScore}</p>
              </div>
              <Shield className={cn(
                "w-8 h-8 opacity-50",
                STATS.safetyScore >= 85 ? "text-green-400" : 
                STATS.safetyScore >= 70 ? "text-yellow-400" : "text-red-400"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Drivers</p>
                <p className="text-2xl font-bold text-white">{STATS.activeDrivers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Open Incidents</p>
                <p className="text-2xl font-bold text-yellow-400">{STATS.openIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Overdue Items</p>
                <p className="text-2xl font-bold text-red-400">{STATS.overdueItems}</p>
              </div>
              <Clock className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">D&A Tests Due</p>
                <p className="text-2xl font-bold text-orange-400">{STATS.pendingDrugTests}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-slate-800/50 border-slate-700",
          STATS.csaAlert && "border-red-500/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">CSA Alert</p>
                <p className={cn(
                  "text-2xl font-bold",
                  STATS.csaAlert ? "text-red-400" : "text-green-400"
                )}>{STATS.csaAlert ? "YES" : "NO"}</p>
              </div>
              <AlertCircle className={cn(
                "w-8 h-8 opacity-50",
                STATS.csaAlert ? "text-red-400" : "text-green-400"
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSA Scores Section */}
      {showCSA && (
        <CSAScores
          carrierName="ABC Trucking LLC"
          usdotNumber="1234567"
          lastUpdated="Jan 23, 2026"
          scores={getSampleCSAScores()}
          overallRating="Satisfactory"
          outOfServiceRate={4.2}
          nationalAvgOOS={5.8}
        />
      )}

      {/* Alerts Section */}
      {(criticalDrivers.length > 0 || warningDrivers.length > 0) && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Safety Alerts</p>
                <div className="mt-2 space-y-2">
                  {criticalDrivers.map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <Badge className="bg-red-500/20 text-red-400">Critical</Badge>
                      <span className="text-slate-300">{d.name}</span>
                      <span className="text-slate-500">- Score: {d.score}, {d.violations30d} violations in 30 days</span>
                    </div>
                  ))}
                  {warningDrivers.map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>
                      <span className="text-slate-300">{d.name}</span>
                      <span className="text-slate-500">- Score: {d.score}, {d.lastIncident}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Safety Scorecards */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Driver Safety Scorecards
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search drivers..."
                  className="pl-9 w-64 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <Button variant="outline" size="sm" className="border-slate-600">
                <Filter className="w-4 h-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => (
              <Card 
                key={driver.id} 
                className={cn(
                  "bg-slate-700/30 border-slate-600 hover:border-slate-500 cursor-pointer transition-all",
                  driver.status === "critical" && "border-red-500/50",
                  driver.status === "warning" && "border-yellow-500/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {driver.trend === "up" && <TrendingUp className="w-3 h-3 text-green-400" />}
                        {driver.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                        {driver.trend === "stable" && <span className="w-3 h-3 text-slate-400">—</span>}
                        <span className="text-xs text-slate-400">
                          {driver.trend === "up" ? "Improving" : driver.trend === "down" ? "Declining" : "Stable"}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-2xl font-bold",
                      driver.score >= 85 ? "text-green-400" :
                      driver.score >= 70 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {driver.score}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">HOS Compliance</span>
                      <span className={driver.hosCompliance >= 95 ? "text-green-400" : "text-yellow-400"}>
                        {driver.hosCompliance}%
                      </span>
                    </div>
                    <Progress 
                      value={driver.hosCompliance} 
                      className="h-1.5 bg-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-slate-700/50">
                      <p className="text-slate-400">Incidents (30d)</p>
                      <p className={cn(
                        "font-medium",
                        driver.incidents30d === 0 ? "text-green-400" : "text-yellow-400"
                      )}>{driver.incidents30d}</p>
                    </div>
                    <div className="p-2 rounded bg-slate-700/50">
                      <p className="text-slate-400">Violations (30d)</p>
                      <p className={cn(
                        "font-medium",
                        driver.violations30d === 0 ? "text-green-400" : 
                        driver.violations30d <= 2 ? "text-yellow-400" : "text-red-400"
                      )}>{driver.violations30d}</p>
                    </div>
                  </div>

                  {driver.lastIncident && (
                    <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs">
                      <p className="text-yellow-400">Last incident: {driver.lastIncident}</p>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" className="w-full mt-3 text-slate-400 hover:text-white">
                    View Full Scorecard
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 1, driver: "Michael Brown", type: "Speeding Violation", date: "Jan 22, 2026", severity: "high", status: "open" },
              { id: 2, driver: "Robert Johnson", type: "Hard Braking Event", date: "Jan 20, 2026", severity: "medium", status: "investigating" },
              { id: 3, driver: "Michael Brown", type: "Following Distance Alert", date: "Jan 18, 2026", severity: "low", status: "closed" },
            ].map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    incident.severity === "high" && "bg-red-500",
                    incident.severity === "medium" && "bg-yellow-500",
                    incident.severity === "low" && "bg-blue-500"
                  )} />
                  <div>
                    <p className="text-white font-medium">{incident.type}</p>
                    <p className="text-xs text-slate-400">{incident.driver} • {incident.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    incident.status === "open" && "bg-red-500/20 text-red-400",
                    incident.status === "investigating" && "bg-yellow-500/20 text-yellow-400",
                    incident.status === "closed" && "bg-green-500/20 text-green-400"
                  )}>
                    {incident.status}
                  </Badge>
                  <Button size="sm" variant="ghost" className="text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
