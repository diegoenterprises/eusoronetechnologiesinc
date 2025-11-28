/**
 * EARNINGS PAGE - CARRIER ROLE
 * Payment tracking, revenue reports, and financial analytics
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Download,
  FileText, CheckCircle, Clock, XCircle, Package, BarChart3,
  ArrowUp, ArrowDown, Filter, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PaymentStatus = "paid" | "pending" | "overdue" | "disputed";

interface Earning {
  id: number;
  loadNumber: string;
  shipper: string;
  amount: number;
  status: PaymentStatus;
  completedDate: Date;
  paidDate: Date | null;
  dueDate: Date;
}

export default function EarningsPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<string>("THIS_MONTH");

  // Mock earnings data - in production, fetch from database
  const earnings: Earning[] = [
    {
      id: 1,
      loadNumber: "LD-2024-087",
      shipper: "ABC Logistics",
      amount: 4500,
      status: "paid",
      completedDate: new Date(2024, 10, 20),
      paidDate: new Date(2024, 10, 22),
      dueDate: new Date(2024, 10, 27)
    },
    {
      id: 2,
      loadNumber: "LD-2024-086",
      shipper: "XYZ Freight",
      amount: 3200,
      status: "pending",
      completedDate: new Date(2024, 10, 22),
      paidDate: null,
      dueDate: new Date(2024, 10, 29)
    },
    {
      id: 3,
      loadNumber: "LD-2024-085",
      shipper: "Global Shipping Co",
      amount: 5800,
      status: "paid",
      completedDate: new Date(2024, 10, 18),
      paidDate: new Date(2024, 10, 20),
      dueDate: new Date(2024, 10, 25)
    },
    {
      id: 4,
      loadNumber: "LD-2024-084",
      shipper: "Prime Transport",
      amount: 2900,
      status: "overdue",
      completedDate: new Date(2024, 10, 10),
      paidDate: null,
      dueDate: new Date(2024, 10, 17)
    },
    {
      id: 5,
      loadNumber: "LD-2024-083",
      shipper: "Swift Logistics",
      amount: 4100,
      status: "paid",
      completedDate: new Date(2024, 10, 16),
      paidDate: new Date(2024, 10, 18),
      dueDate: new Date(2024, 10, 23)
    },
  ];

  const getStatusBadge = (status: PaymentStatus) => {
    const badges: Record<PaymentStatus, { label: string; color: string; icon: any }> = {
      paid: { label: "Paid", color: "bg-green-600", icon: CheckCircle },
      pending: { label: "Pending", color: "bg-yellow-600", icon: Clock },
      overdue: { label: "Overdue", color: "bg-red-600", icon: XCircle },
      disputed: { label: "Disputed", color: "bg-orange-600", icon: FileText },
    };
    return badges[status];
  };

  const handleDownloadInvoice = (loadNumber: string) => {
    toast.success(`Downloading invoice for ${loadNumber}...`);
  };

  const handleExportReport = () => {
    toast.success("Exporting earnings report...");
  };

  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = searchQuery === "" || 
      earning.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      earning.shipper.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || earning.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalEarned = earnings.filter(e => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
  const totalPending = earnings.filter(e => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
  const totalOverdue = earnings.filter(e => e.status === "overdue").reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
                Earnings & Payments
              </h1>
              <p className="text-gray-400 text-lg">Track your revenue and payment history</p>
            </div>
            <div className="flex gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
              >
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="THIS_QUARTER">This Quarter</option>
                <option value="THIS_YEAR">This Year</option>
              </select>
              <Button
                onClick={handleExportReport}
                variant="outline"
                className="border-gray-800 hover:border-green-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <Badge className="bg-green-600 text-white">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Earned</p>
              <p className="text-3xl font-bold text-green-400 mb-1">
                ${totalEarned.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {earnings.filter(e => e.status === "paid").length} payments received
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border-yellow-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <Badge className="bg-yellow-600 text-white">
                  {earnings.filter(e => e.status === "pending").length} loads
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-400 mb-1">
                ${totalPending.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Expected within 7 days
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/20 border-red-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <Badge className="bg-red-600 text-white">
                  Action Required
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-400 mb-1">
                ${totalOverdue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {earnings.filter(e => e.status === "overdue").length} overdue payments
              </p>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <Badge className="bg-blue-600 text-white">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8%
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Avg Per Load</p>
              <p className="text-3xl font-bold text-blue-400 mb-1">
                ${Math.round((totalEarned + totalPending) / earnings.length).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                Based on {earnings.length} loads
              </p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by load number or shipper..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-800"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        {/* Earnings List */}
        {filteredEarnings.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">No earnings found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Complete loads to start earning"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEarnings.map((earning) => {
              const statusBadge = getStatusBadge(earning.status);
              const StatusIcon = statusBadge.icon;

              return (
                <Card key={earning.id} className="bg-gray-900/50 border-gray-800 p-6 hover:border-green-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full ${statusBadge.color}/20 flex items-center justify-center`}>
                        <StatusIcon className={`w-6 h-6 ${statusBadge.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">Load #{earning.loadNumber}</h3>
                          <Badge className={`${statusBadge.color} text-white`}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{earning.shipper}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Completed: {earning.completedDate.toLocaleDateString()}
                          </span>
                          {earning.paidDate ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Paid: {earning.paidDate.toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due: {earning.dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-2xl font-bold text-green-400">
                          ${earning.amount.toLocaleString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(earning.loadNumber)}
                        className="border-gray-700 hover:border-green-500"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
