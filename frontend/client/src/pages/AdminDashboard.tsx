import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { TrendingUp, Package, DollarSign, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user } = useAuth();
  const userRole = (user?.role || "user") as string;

  const getDashboardContent = () => {
    switch (userRole) {
      case "driver":
        return {
          title: "Driver Dashboard",
          subtitle: "Manage your shipments and earnings",
          metrics: [
            { label: "Active Shipments", value: "2", icon: Package, color: "text-blue-500" },
            { label: "This Month Revenue", value: "$47,250", icon: DollarSign, color: "text-green-500" },
            { label: "Compliance Score", value: "98.5%", icon: CheckCircle, color: "text-purple-500" },
            { label: "Miles This Week", value: "2,847", icon: TrendingUp, color: "text-orange-500" },
          ],
        };
      case "shipper":
        return {
          title: "Shipper Dashboard",
          subtitle: "Monitor your shipments and logistics",
          metrics: [
            { label: "Total Shipments", value: "156", icon: Package, color: "text-blue-500" },
            { label: "In Transit", value: "12", icon: Clock, color: "text-yellow-500" },
            { label: "Delivered", value: "144", icon: CheckCircle, color: "text-green-500" },
            { label: "Issues", value: "0", icon: AlertCircle, color: "text-red-500" },
          ],
        };
      case "broker":
        return {
          title: "Broker Dashboard",
          subtitle: "Manage loads and carrier relationships",
          metrics: [
            { label: "Active Loads", value: "45", icon: Package, color: "text-blue-500" },
            { label: "Pending Pickup", value: "8", icon: Clock, color: "text-yellow-500" },
            { label: "Delivered", value: "312", icon: CheckCircle, color: "text-green-500" },
            { label: "Revenue", value: "$125,450", icon: DollarSign, color: "text-green-500" },
          ],
        };
      case "admin":
        return {
          title: "Admin Dashboard",
          subtitle: "Platform overview and management",
          metrics: [
            { label: "Total Users", value: "1,234", icon: Package, color: "text-blue-500" },
            { label: "Active Loads", value: "456", icon: Package, color: "text-green-500" },
            { label: "Revenue", value: "$2.5M", icon: DollarSign, color: "text-purple-500" },
            { label: "System Health", value: "99.9%", icon: CheckCircle, color: "text-green-500" },
          ],
        };
      default:
        return {
          title: "Dashboard",
          subtitle: "Welcome to EusoTrip",
          metrics: [],
        };
    }
  };

  const content = getDashboardContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{content.title}</h1>
        <p className="text-gray-400">{content.subtitle}</p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || "User"}!</h2>
            <p className="text-blue-100">{user?.email || "user@example.com"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Role: {userRole.toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {content.metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">{metric.label}</h3>
                <Icon size={20} className={metric.color} />
              </div>
              <p className="text-2xl font-bold text-white">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700">Create New Shipment</Button>
        <Button className="bg-purple-600 hover:bg-purple-700">View My Jobs</Button>
        <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
          Ask ESANG AI
        </Button>
      </div>
    </div>
  );
}
