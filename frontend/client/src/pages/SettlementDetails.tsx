/**
 * SETTLEMENT DETAILS PAGE
 * Carrier payment settlements and driver pay management
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, FileText, Calendar, User, Truck, Download,
  CheckCircle, Clock, AlertTriangle, CreditCard, Building,
  TrendingUp, ArrowRight, Eye, Printer, Send, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SettlementLineItem {
  id: string;
  type: "revenue" | "deduction" | "reimbursement";
  category: string;
  description: string;
  loadNumber?: string;
  amount: number;
  date: string;
}

interface Settlement {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "pending" | "approved" | "paid";
  driver: {
    id: string;
    name: string;
    payType: "percentage" | "per_mile" | "hourly";
    rate: number;
  };
  summary: {
    grossRevenue: number;
    totalDeductions: number;
    totalReimbursements: number;
    netPay: number;
  };
  paymentMethod: string;
  paymentDate?: string;
  checkNumber?: string;
}

export default function SettlementDetails() {
  const [activeTab, setActiveTab] = useState("details");

  // Mock settlement data
  const settlement: Settlement = {
    id: "STL-2025-0042",
    periodStart: "2025-01-06",
    periodEnd: "2025-01-19",
    status: "pending",
    driver: {
      id: "d1",
      name: "Mike Johnson",
      payType: "percentage",
      rate: 28,
    },
    summary: {
      grossRevenue: 8450,
      totalDeductions: 1250,
      totalReimbursements: 185,
      netPay: 2181.20,
    },
    paymentMethod: "Direct Deposit",
    paymentDate: undefined,
    checkNumber: undefined,
  };

  const lineItems: SettlementLineItem[] = [
    { id: "li_001", type: "revenue", category: "Freight", description: "LOAD-45842 - Houston to Dallas", loadNumber: "LOAD-45842", amount: 2850, date: "2025-01-08" },
    { id: "li_002", type: "revenue", category: "Freight", description: "LOAD-45845 - Dallas to Austin", loadNumber: "LOAD-45845", amount: 1800, date: "2025-01-10" },
    { id: "li_003", type: "revenue", category: "Freight", description: "LOAD-45850 - Austin to Houston", loadNumber: "LOAD-45850", amount: 2200, date: "2025-01-14" },
    { id: "li_004", type: "revenue", category: "Detention", description: "Detention pay - LOAD-45842", loadNumber: "LOAD-45842", amount: 150, date: "2025-01-08" },
    { id: "li_005", type: "revenue", category: "Accessorial", description: "Lumper fee reimbursement", amount: 75, date: "2025-01-10" },
    { id: "li_006", type: "revenue", category: "Bonus", description: "Safety bonus - January", amount: 200, date: "2025-01-15" },
    { id: "li_007", type: "revenue", category: "Fuel Surcharge", description: "Fuel surcharge - Week 2", amount: 175, date: "2025-01-12" },
    { id: "li_008", type: "deduction", category: "Fuel Advance", description: "Fuel advance - Pilot #4521", amount: -450, date: "2025-01-07" },
    { id: "li_009", type: "deduction", category: "Fuel Advance", description: "Fuel advance - Love's #892", amount: -380, date: "2025-01-12" },
    { id: "li_010", type: "deduction", category: "Insurance", description: "Weekly insurance deduction", amount: -125, date: "2025-01-06" },
    { id: "li_011", type: "deduction", category: "ELD Lease", description: "ELD equipment lease", amount: -45, date: "2025-01-06" },
    { id: "li_012", type: "deduction", category: "Escrow", description: "Escrow contribution", amount: -100, date: "2025-01-06" },
    { id: "li_013", type: "deduction", category: "Cash Advance", description: "Cash advance repayment", amount: -150, date: "2025-01-10" },
    { id: "li_014", type: "reimbursement", category: "Tolls", description: "Toll reimbursement - Week 2", amount: 85, date: "2025-01-14" },
    { id: "li_015", type: "reimbursement", category: "Scale Tickets", description: "Scale ticket reimbursement", amount: 25, date: "2025-01-12" },
    { id: "li_016", type: "reimbursement", category: "Parking", description: "Secure parking reimbursement", amount: 75, date: "2025-01-15" },
  ];

  const previousSettlements = [
    { id: "STL-2025-0041", period: "Dec 23 - Jan 5", netPay: 1950.80, status: "paid", paidDate: "2025-01-10" },
    { id: "STL-2025-0040", period: "Dec 9 - Dec 22", netPay: 2340.50, status: "paid", paidDate: "2024-12-27" },
    { id: "STL-2025-0039", period: "Nov 25 - Dec 8", netPay: 2180.25, status: "paid", paidDate: "2024-12-13" },
    { id: "STL-2025-0038", period: "Nov 11 - Nov 24", netPay: 1890.00, status: "paid", paidDate: "2024-11-29" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/20 text-green-400";
      case "approved": return "bg-blue-500/20 text-blue-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "draft": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getLineItemColor = (type: string) => {
    switch (type) {
      case "revenue": return "text-green-400";
      case "deduction": return "text-red-400";
      case "reimbursement": return "text-blue-400";
      default: return "text-slate-400";
    }
  };

  const approveSettlement = () => {
    toast.success("Settlement approved", {
      description: "Ready for payment processing",
    });
  };

  const processPayment = () => {
    toast.success("Payment initiated", {
      description: "Direct deposit scheduled for next business day",
    });
  };

  const downloadPDF = () => {
    toast.success("Settlement downloaded", {
      description: "PDF saved to downloads",
    });
  };

  const revenueItems = lineItems.filter(li => li.type === "revenue");
  const deductionItems = lineItems.filter(li => li.type === "deduction");
  const reimbursementItems = lineItems.filter(li => li.type === "reimbursement");

  const totalRevenue = revenueItems.reduce((sum, li) => sum + li.amount, 0);
  const driverPay = totalRevenue * (settlement.driver.rate / 100);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{settlement.id}</h1>
            <Badge className={getStatusColor(settlement.status)}>
              {settlement.status}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">
            Pay Period: {settlement.periodStart} to {settlement.periodEnd}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-600" onClick={downloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="border-slate-600">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {settlement.status === "pending" && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={approveSettlement}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {settlement.status === "approved" && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={processPayment}>
              <CreditCard className="w-4 h-4 mr-2" />
              Process Payment
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Gross Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">${driverPay.toFixed(2)}</p>
                <p className="text-xs text-slate-400">Driver Pay ({settlement.driver.rate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">-${Math.abs(settlement.summary.totalDeductions).toLocaleString()}</p>
                <p className="text-xs text-slate-400">Deductions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-purple-400">${settlement.summary.netPay.toLocaleString()}</p>
                <p className="text-xs text-slate-400">Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-white font-bold">{settlement.driver.name}</p>
                <p className="text-sm text-slate-400">
                  Pay Type: {settlement.driver.payType === "percentage" ? `${settlement.driver.rate}% of Revenue` :
                            settlement.driver.payType === "per_mile" ? `$${settlement.driver.rate}/mile` :
                            `$${settlement.driver.rate}/hour`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Payment Method</p>
              <p className="text-white font-medium">{settlement.paymentMethod}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-green-600">Details</TabsTrigger>
          <TabsTrigger value="loads" className="data-[state=active]:bg-green-600">Loads</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <div>
                        <p className="text-white">{item.description}</p>
                        <p className="text-xs text-slate-500">{item.category} - {item.date}</p>
                      </div>
                      <p className="text-green-400 font-medium">+${item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4 bg-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Revenue</span>
                  <span className="text-green-400 font-bold">${totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-slate-400">Driver Pay ({settlement.driver.rate}%)</span>
                  <span className="text-blue-400 font-bold">${driverPay.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Deductions & Reimbursements */}
            <div className="space-y-6">
              {/* Deductions */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {deductionItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                        <div>
                          <p className="text-white">{item.description}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <p className="text-red-400 font-medium">${item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4 bg-slate-700" />
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Deductions</span>
                    <span className="text-red-400 font-bold">
                      -${Math.abs(deductionItems.reduce((sum, li) => sum + li.amount, 0)).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Reimbursements */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-blue-400 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Reimbursements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reimbursementItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                        <div>
                          <p className="text-white">{item.description}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <p className="text-blue-400 font-medium">+${item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4 bg-slate-700" />
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Reimbursements</span>
                    <span className="text-blue-400 font-bold">
                      +${reimbursementItems.reduce((sum, li) => sum + li.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Net Pay Summary */}
          <Card className="mt-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400">Net Pay</p>
                  <p className="text-4xl font-bold text-purple-400">${settlement.summary.netPay.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm text-slate-400">
                    Driver Pay: <span className="text-white">${driverPay.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Deductions: <span className="text-red-400">-${Math.abs(settlement.summary.totalDeductions).toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Reimbursements: <span className="text-blue-400">+${settlement.summary.totalReimbursements.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loads Tab */}
        <TabsContent value="loads" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Loads in This Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueItems.filter(li => li.loadNumber).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Truck className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.loadNumber}</p>
                        <p className="text-sm text-slate-400">{item.description.replace(`${item.loadNumber} - `, "")}</p>
                        <p className="text-xs text-slate-500">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">${item.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">
                        Driver: ${(item.amount * settlement.driver.rate / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Previous Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previousSettlements.map((stl) => (
                  <div key={stl.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{stl.id}</p>
                        <p className="text-sm text-slate-400">{stl.period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-green-400 font-bold">${stl.netPay.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Paid {stl.paidDate}</p>
                      </div>
                      <Badge className={getStatusColor(stl.status)}>{stl.status}</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
