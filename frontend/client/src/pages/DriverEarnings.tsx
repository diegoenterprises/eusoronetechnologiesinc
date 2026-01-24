/**
 * DRIVER EARNINGS PAGE
 * Compensation tracking for drivers
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Clock,
  Truck, Package, Download, ChevronLeft, ChevronRight,
  Wallet, CreditCard, ArrowUpRight, Target, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningEntry {
  id: string;
  loadNumber: string;
  date: string;
  origin: string;
  destination: string;
  miles: number;
  basePay: number;
  fuelBonus: number;
  hazmatPremium: number;
  detentionPay: number;
  totalPay: number;
  status: "pending" | "approved" | "paid";
}

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalLoads: number;
  totalMiles: number;
  totalEarnings: number;
  avgPerMile: number;
  avgPerLoad: number;
}

const MOCK_EARNINGS: EarningEntry[] = [
  {
    id: "e1",
    loadNumber: "LOAD-45920",
    date: "2025-01-23",
    origin: "Houston, TX",
    destination: "Dallas, TX",
    miles: 240,
    basePay: 720,
    fuelBonus: 48,
    hazmatPremium: 108,
    detentionPay: 0,
    totalPay: 876,
    status: "pending",
  },
  {
    id: "e2",
    loadNumber: "LOAD-45918",
    date: "2025-01-22",
    origin: "Beaumont, TX",
    destination: "San Antonio, TX",
    miles: 320,
    basePay: 960,
    fuelBonus: 64,
    hazmatPremium: 144,
    detentionPay: 75,
    totalPay: 1243,
    status: "approved",
  },
  {
    id: "e3",
    loadNumber: "LOAD-45915",
    date: "2025-01-21",
    origin: "Port Arthur, TX",
    destination: "Austin, TX",
    miles: 280,
    basePay: 840,
    fuelBonus: 56,
    hazmatPremium: 126,
    detentionPay: 0,
    totalPay: 1022,
    status: "paid",
  },
  {
    id: "e4",
    loadNumber: "LOAD-45912",
    date: "2025-01-20",
    origin: "Corpus Christi, TX",
    destination: "Houston, TX",
    miles: 210,
    basePay: 630,
    fuelBonus: 42,
    hazmatPremium: 94.50,
    detentionPay: 50,
    totalPay: 816.50,
    status: "paid",
  },
  {
    id: "e5",
    loadNumber: "LOAD-45908",
    date: "2025-01-19",
    origin: "Houston, TX",
    destination: "El Paso, TX",
    miles: 745,
    basePay: 2235,
    fuelBonus: 149,
    hazmatPremium: 335.25,
    detentionPay: 100,
    totalPay: 2819.25,
    status: "paid",
  },
];

const MOCK_WEEKLY_SUMMARIES: WeeklySummary[] = [
  { weekStart: "2025-01-20", weekEnd: "2025-01-26", totalLoads: 5, totalMiles: 1795, totalEarnings: 6776.75, avgPerMile: 3.78, avgPerLoad: 1355.35 },
  { weekStart: "2025-01-13", weekEnd: "2025-01-19", totalLoads: 6, totalMiles: 2150, totalEarnings: 8125.00, avgPerMile: 3.78, avgPerLoad: 1354.17 },
  { weekStart: "2025-01-06", weekEnd: "2025-01-12", totalLoads: 5, totalMiles: 1680, totalEarnings: 6342.00, avgPerMile: 3.77, avgPerLoad: 1268.40 },
  { weekStart: "2024-12-30", weekEnd: "2025-01-05", totalLoads: 4, totalMiles: 1420, totalEarnings: 5360.50, avgPerMile: 3.77, avgPerLoad: 1340.13 },
];

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Approved", color: "bg-blue-500/20 text-blue-400" },
  paid: { label: "Paid", color: "bg-green-500/20 text-green-400" },
};

export default function DriverEarnings() {
  const { user } = useAuth();
  const [earnings] = useState<EarningEntry[]>(MOCK_EARNINGS);
  const [weeklySummaries] = useState<WeeklySummary[]>(MOCK_WEEKLY_SUMMARIES);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [viewMode, setViewMode] = useState<"current" | "history">("current");

  const currentWeek = weeklySummaries[selectedWeek];
  const ytdEarnings = weeklySummaries.reduce((sum, w) => sum + w.totalEarnings, 0);
  const ytdMiles = weeklySummaries.reduce((sum, w) => sum + w.totalMiles, 0);
  const ytdLoads = weeklySummaries.reduce((sum, w) => sum + w.totalLoads, 0);

  const pendingTotal = earnings.filter(e => e.status === "pending").reduce((sum, e) => sum + e.totalPay, 0);
  const approvedTotal = earnings.filter(e => e.status === "approved").reduce((sum, e) => sum + e.totalPay, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Earnings</h1>
          <p className="text-slate-400 text-sm">Track your compensation and payments</p>
        </div>
        <Button variant="outline" className="border-slate-600">
          <Download className="w-4 h-4 mr-2" />
          Export Statement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300/70">This Week</p>
                <p className="text-2xl font-bold text-green-400">
                  ${currentWeek.totalEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">{currentWeek.totalLoads} loads</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  ${pendingTotal.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Awaiting approval</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">YTD Earnings</p>
                <p className="text-2xl font-bold text-white">
                  ${ytdEarnings.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">{ytdLoads} loads</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Avg Per Mile</p>
                <p className="text-2xl font-bold text-white">
                  ${(ytdEarnings / ytdMiles).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">{ytdMiles.toLocaleString()} total mi</p>
              </div>
              <Target className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedWeek(Math.min(selectedWeek + 1, weeklySummaries.length - 1))}
              disabled={selectedWeek >= weeklySummaries.length - 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Week
            </Button>
            <div className="text-center">
              <p className="text-white font-medium">
                {new Date(currentWeek.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(currentWeek.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500">
                {currentWeek.totalLoads} loads | {currentWeek.totalMiles.toLocaleString()} miles
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedWeek(Math.max(selectedWeek - 1, 0))}
              disabled={selectedWeek <= 0}
            >
              Next Week
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Detail */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Earnings Detail</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "current" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("current")}
                className={viewMode === "current" ? "bg-blue-600" : "border-slate-600"}
              >
                Current Week
              </Button>
              <Button
                variant={viewMode === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("history")}
                className={viewMode === "history" ? "bg-blue-600" : "border-slate-600"}
              >
                All History
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-slate-700/30">
              <tr>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Load</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Date</th>
                <th className="text-left text-slate-400 text-xs font-medium p-4">Route</th>
                <th className="text-right text-slate-400 text-xs font-medium p-4">Miles</th>
                <th className="text-right text-slate-400 text-xs font-medium p-4">Base Pay</th>
                <th className="text-right text-slate-400 text-xs font-medium p-4">Bonuses</th>
                <th className="text-right text-slate-400 text-xs font-medium p-4">Total</th>
                <th className="text-center text-slate-400 text-xs font-medium p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {earnings.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="p-4">
                    <span className="text-white font-medium">{entry.loadNumber}</span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="text-slate-300">{entry.origin}</p>
                      <p className="text-slate-500">to {entry.destination}</p>
                    </div>
                  </td>
                  <td className="p-4 text-right text-slate-300">
                    {entry.miles.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-white">
                    ${entry.basePay.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-xs space-y-0.5">
                      {entry.fuelBonus > 0 && (
                        <p className="text-cyan-400">+${entry.fuelBonus.toFixed(2)} fuel</p>
                      )}
                      {entry.hazmatPremium > 0 && (
                        <p className="text-orange-400">+${entry.hazmatPremium.toFixed(2)} hazmat</p>
                      )}
                      {entry.detentionPay > 0 && (
                        <p className="text-purple-400">+${entry.detentionPay.toFixed(2)} detention</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right font-medium text-green-400">
                    ${entry.totalPay.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <Badge className={STATUS_CONFIG[entry.status].color}>
                      {STATUS_CONFIG[entry.status].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-700/30">
              <tr>
                <td colSpan={3} className="p-4 text-white font-medium">Total</td>
                <td className="p-4 text-right text-white font-medium">
                  {earnings.reduce((sum, e) => sum + e.miles, 0).toLocaleString()}
                </td>
                <td className="p-4 text-right text-white font-medium">
                  ${earnings.reduce((sum, e) => sum + e.basePay, 0).toFixed(2)}
                </td>
                <td className="p-4 text-right text-white font-medium">
                  ${earnings.reduce((sum, e) => sum + e.fuelBonus + e.hazmatPremium + e.detentionPay, 0).toFixed(2)}
                </td>
                <td className="p-4 text-right text-green-400 font-bold text-lg">
                  ${earnings.reduce((sum, e) => sum + e.totalPay, 0).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Payment Schedule Info */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-300 font-medium">Payment Schedule</p>
              <p className="text-sm text-blue-300/70 mt-1">
                Approved earnings are processed every Friday and deposited via direct deposit within 1-2 business days. 
                For questions about pending payments, contact your dispatcher or payroll.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
