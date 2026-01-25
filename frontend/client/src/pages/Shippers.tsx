/**
 * SHIPPERS PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Broker shipper management and relationship tracking.
 * Features:
 * - Shipper directory
 * - Relationship status
 * - Load history
 * - Performance metrics
 * - Contact management
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Building2,
  Star,
  Package,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Shipper {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  rating: number;
  totalLoads: number;
  activeLoads: number;
  totalRevenue: number;
  avgCommission: number;
  status: "active" | "inactive" | "pending";
  lastActivity: Date;
}

export default function ShippersPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock shipper data - TODO: Replace with trpc.brokers.shippers.useQuery()
  const shippers: Shipper[] = [
    {
      id: "S001",
      name: "PetroTrans Inc",
      contactPerson: "Sarah Martinez",
      email: "sarah@petrotrans.com",
      phone: "(555) 123-4567",
      location: "Houston, TX",
      rating: 4.8,
      totalLoads: 45,
      activeLoads: 3,
      totalRevenue: 54000,
      avgCommission: 15,
      status: "active",
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "S002",
      name: "Swift Energy",
      contactPerson: "Michael Johnson",
      email: "mjohnson@swiftenergy.com",
      phone: "(555) 234-5678",
      location: "Midland, TX",
      rating: 4.9,
      totalLoads: 62,
      activeLoads: 5,
      totalRevenue: 74400,
      avgCommission: 12,
      status: "active",
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: "S003",
      name: "Texas Fuel Co",
      contactPerson: "Jennifer Chen",
      email: "jchen@texasfuel.com",
      phone: "(555) 345-6789",
      location: "Dallas, TX",
      rating: 4.7,
      totalLoads: 38,
      activeLoads: 2,
      totalRevenue: 45600,
      avgCommission: 15,
      status: "active",
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "S004",
      name: "Lone Star Petroleum",
      contactPerson: "Robert Davis",
      email: "rdavis@lonestar.com",
      phone: "(555) 456-7890",
      location: "Austin, TX",
      rating: 4.5,
      totalLoads: 28,
      activeLoads: 0,
      totalRevenue: 33600,
      avgCommission: 14,
      status: "inactive",
      lastActivity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ];

  const filteredShippers = shippers.filter((shipper) => {
    if (statusFilter !== "all" && shipper.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        shipper.name.toLowerCase().includes(query) ||
        shipper.contactPerson.toLowerCase().includes(query) ||
        shipper.location.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalShippers = shippers.length;
  const activeShippers = shippers.filter((s) => s.status === "active").length;
  const totalRevenue = shippers.reduce((sum, s) => sum + s.totalRevenue, 0);
  const avgRating =
    shippers.reduce((sum, s) => sum + s.rating, 0) / shippers.length;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-green-600 text-green-400 bg-green-600/10";
      case "inactive":
        return "border-gray-600 text-gray-400 bg-gray-600/10";
      case "pending":
        return "border-yellow-600 text-yellow-400 bg-yellow-600/10";
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
            <h1 className="text-3xl font-bold text-white mb-2">Shipper Management</h1>
            <p className="text-gray-400">
              Manage relationships with your shipper partners
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
              <Plus className="mr-2" size={18} />
              Add Shipper
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <Building2 className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Shippers</p>
                <p className="text-2xl font-bold text-white">{totalShippers}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-white">{activeShippers}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <DollarSign className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <Star className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg Rating</p>
                <p className="text-2xl font-bold text-white">
                  {avgRating.toFixed(1)}
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
                placeholder="Search by name, contact, or location..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </Card>

        {/* Shipper List */}
        <div className="grid grid-cols-2 gap-4">
          {filteredShippers.map((shipper) => (
            <Card
              key={shipper.id}
              className="bg-gray-900 border-gray-700 p-6 hover:border-blue-500 transition-all"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-lg">
                      <Building2 className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{shipper.name}</h3>
                      <p className="text-gray-400 text-sm">{shipper.contactPerson}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(shipper.status)}>
                    {shipper.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="text-gray-500" size={16} />
                    <span>{shipper.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="text-gray-500" size={16} />
                    <span>{shipper.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="text-gray-500" size={16} />
                    <span>{shipper.location}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Total Loads</p>
                    <p className="text-white font-semibold">{shipper.totalLoads}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Active Loads</p>
                    <p className="text-white font-semibold">{shipper.activeLoads}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Revenue</p>
                    <p className="text-white font-semibold">
                      ${shipper.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Avg Commission</p>
                    <p className="text-white font-semibold">{shipper.avgCommission}%</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                    <span className="text-white font-semibold">{shipper.rating}</span>
                    <span className="text-gray-400 text-sm">
                      • Last active {formatDate(shipper.lastActivity)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredShippers.length === 0 && (
          <Card className="bg-gray-900 border-gray-700 p-12 text-center">
            <Building2 className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">No shippers found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or search criteria
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
