/**
 * PAYMENTS PAGE - SHIPPER ROLE
 * Payment history, invoice management, and transaction tracking
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, CreditCard, FileText, Download, Eye,
  CheckCircle, Clock, XCircle, TrendingUp, Calendar,
  Filter, Search, ArrowUpRight, ArrowDownRight, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

interface MockPayment {
  id: number;
  loadNumber: string;
  carrierName: string;
  amount: number;
  status: PaymentStatus;
  date: Date;
  invoiceNumber: string;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  // Mock payment data - in production, fetch from database
  const mockPayments: MockPayment[] = [
    {
      id: 1,
      loadNumber: "LD-2024-001",
      carrierName: "Swift Transport LLC",
      amount: 4500,
      status: "completed",
      date: new Date(2024, 10, 20),
      invoiceNumber: "INV-001-2024"
    },
    {
      id: 2,
      loadNumber: "LD-2024-002",
      carrierName: "Reliable Freight Co.",
      amount: 3200,
      status: "pending",
      date: new Date(2024, 10, 22),
      invoiceNumber: "INV-002-2024"
    },
    {
      id: 3,
      loadNumber: "LD-2024-003",
      carrierName: "Express Logistics",
      amount: 5800,
      status: "completed",
      date: new Date(2024, 10, 18),
      invoiceNumber: "INV-003-2024"
    },
    {
      id: 4,
      loadNumber: "LD-2024-004",
      carrierName: "Prime Carriers",
      amount: 2900,
      status: "failed",
      date: new Date(2024, 10, 15),
      invoiceNumber: "INV-004-2024"
    },
  ];

  const getStatusBadge = (status: PaymentStatus) => {
    const badges: Record<PaymentStatus, { label: string; color: string; icon: any }> = {
      completed: { label: "Completed", color: "bg-green-600", icon: CheckCircle },
      pending: { label: "Pending", color: "bg-yellow-600", icon: Clock },
      failed: { label: "Failed", color: "bg-red-600", icon: XCircle },
      refunded: { label: "Refunded", color: "bg-blue-600", icon: ArrowDownRight },
    };
    return badges[status];
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    toast.success(`Downloading invoice ${invoiceNumber}...`);
  };

  const handleViewDetails = (paymentId: number) => {
    toast.info("Payment details (Feature coming soon)");
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = searchQuery === "" || 
      payment.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = filteredPayments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
                Payments & Invoices
              </h1>
              <p className="text-gray-400 text-lg">Manage your payment history and download invoices</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Paid</p>
                  <p className="text-3xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredPayments.filter(p => p.status === "completed").length} transactions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border-yellow-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400">${totalPending.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredPayments.filter(p => p.status === "pending").length} transactions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">This Month</p>
                  <p className="text-3xl font-bold text-blue-400">
                    ${(totalPaid + totalPending).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {filteredPayments.length} total transactions
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by load number, carrier, or invoice number..."
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white"
            >
              <option value="ALL">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-16 text-center">
            <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-300 mb-3">No payments found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "Your payment history will appear here"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const statusBadge = getStatusBadge(payment.status);
              const StatusIcon = statusBadge.icon;

              return (
                <Card key={payment.id} className="bg-gray-900/50 border-gray-800 p-6 hover:border-green-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full ${statusBadge.color}/20 flex items-center justify-center`}>
                        <StatusIcon className={`w-6 h-6 ${statusBadge.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">Load #{payment.loadNumber}</h3>
                          <Badge className={`${statusBadge.color} text-white`}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{payment.carrierName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {payment.date.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {payment.invoiceNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-2xl font-bold text-green-400">
                          ${payment.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(payment.invoiceNumber)}
                          className="border-gray-700 hover:border-green-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(payment.id)}
                          className="border-gray-700 hover:border-blue-500"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </div>
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
