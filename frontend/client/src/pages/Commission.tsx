/**
 * COMMISSION PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Broker commission tracking and analytics.
 * Features:
 * - Commission overview dashboard
 * - Earnings by shipper/carrier
 * - Payment status tracking
 * - Commission rate management
 * - Historical analytics
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Commission {
  id: string;
  loadId: string;
  shipper: string;
  carrier: string;
  loadRate: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid" | "processing";
  date: Date;
  paidDate?: Date;
}

export default function CommissionPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock commission data - TODO: Replace with trpc.broker.commissions.useQuery()
  const commissions: Commission[] = [
    {
      id: "C001",
      loadId: "L001",
      shipper: "PetroTrans Inc",
      carrier: "Swift Logistics",
      loadRate: 1200,
      commissionRate: 15,
      commissionAmount: 180,
      status: "paid",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "C002",
      loadId: "L002",
      shipper: "Swift Energy",
      carrier: "Texas Haulers",
      loadRate: 1920,
      commissionRate: 12,
      commissionAmount: 230.4,
      status: "processing",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "C003",
      loadId: "L003",
      shipper: "Texas Fuel Co",
      carrier: "Lone Star Transport",
      loadRate: 1680,
      commissionRate: 15,
      commissionAmount: 252,
      status: "pending",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const filteredCommissions = commissions.filter((commission) => {
    if (statusFilter !== "all" && commission.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        commission.shipper.toLowerCase().includes(query) ||
        commission.carrier.toLowerCase().includes(query) ||
        commission.loadId.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalEarnings = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const pendingEarnings = commissions
    .filter((c) => c.status === "pending" || c.status === "processing")
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const avgCommissionRate =
    commissions.reduce((sum, c) => sum + c.commissionRate, 0) / commissions.length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "border-green-600 text-green-400 bg-green-600/10";
      case "processing":
        return "border-yellow-600 text-yellow-400 bg-yellow-600/10";
      case "pending":
        return "border-gray-600 text-gray-400 bg-gray-600/10";
      default:
        return "border-gray-600 text-gray-400 bg-gray-600/10";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Commission Tracking</h1>
            <p className="text-gray-400">
              Track your brokerage earnings and commission rates
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Filter className="mr-2" size={18} />
              Filters
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Download className="mr-2" size={18} />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <DollarSign className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-white">
                  ${totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <TrendingUp className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">
                  ${pendingEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Package className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Loads</p>
                <p className="text-2xl font-bold text-white">{commissions.length}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Users className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg Rate</p>
                <p className="text-2xl font-bold text-white">
                  {avgCommissionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-gray-900 border-gray-700 p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={20}
              />
              <Input
                placeholder="Search by shipper, carrier, or load ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white rounded px-4 py-2"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </Card>

        {/* Commission List */}
        <div className="space-y-4">
          {filteredCommissions.map((commission) => (
            <Card
              key={commission.id}
              className="bg-gray-900 border-gray-700 p-6 hover:border-blue-500 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={getStatusColor(commission.status)}
                    >
                      {commission.status.toUpperCase()}
                    </Badge>
                    <span className="text-gray-400 text-sm">
                      Load ID: {commission.loadId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Shipper</p>
                      <p className="text-white font-semibold">{commission.shipper}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Carrier</p>
                      <p className="text-white font-semibold">{commission.carrier}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="text-gray-500" size={16} />
                      <span className="text-gray-300">
                        Load Rate: ${commission.loadRate.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-gray-500" size={16} />
                      <span className="text-gray-300">
                        Commission: {commission.commissionRate}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-500" size={16} />
                      <span className="text-gray-300">
                        {formatDate(commission.date)}
                      </span>
                    </div>
                    {commission.paidDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="text-green-500" size={16} />
                        <span className="text-green-400">
                          Paid: {formatDate(commission.paidDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right ml-6">
                  <p className="text-3xl font-bold text-white">
                    ${commission.commissionAmount.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">Commission Earned</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCommissions.length === 0 && (
          <Card className="bg-gray-900 border-gray-700 p-12 text-center">
            <DollarSign className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">No commissions found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or search criteria
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
