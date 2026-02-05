/**
 * TEST LOGIN PAGE
 * 
 * Quick access to test all 10 user roles
 * Click any role card to instantly view that role's dashboard
 * 
 * FOR DEVELOPMENT/TESTING ONLY
 */

import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  Users,
  User,
  Flame,
  Shield,
  Building2,
  FileCheck,
  AlertTriangle,
  Crown,
} from "lucide-react";

const TEST_ROLES = [
  {
    role: "SHIPPER",
    name: "Shipper",
    description: "Create and manage loads, track shipments, manage payments",
    icon: Package,
    color: "bg-blue-500",
    features: ["Create Loads", "Track Shipments", "Manage Payments", "View Analytics"],
  },
  {
    role: "CARRIER",
    name: "Carrier",
    description: "Manage fleet, assign drivers, bid on loads, track vehicles",
    icon: Truck,
    color: "bg-green-500",
    features: ["Fleet Management", "Bid on Loads", "Driver Assignment", "GPS Tracking"],
  },
  {
    role: "BROKER",
    name: "Broker",
    description: "Connect shippers with carriers, manage load board, earn commissions",
    icon: Users,
    color: "bg-purple-500",
    features: ["Load Matching", "Commission Tracking", "Market Analytics", "Relationship Management"],
  },
  {
    role: "DRIVER",
    name: "Driver",
    description: "Accept loads, navigate routes, update delivery status, track earnings",
    icon: User,
    color: "bg-orange-500",
    features: ["Accept Loads", "Route Navigation", "Status Updates", "Earnings Tracking"],
  },
  {
    role: "CATALYST",
    name: "Catalyst",
    description: "Independent driver with advanced features, direct load access",
    icon: Flame,
    color: "bg-red-500",
    features: ["Direct Load Access", "Premium Routes", "Priority Support", "Advanced Analytics"],
  },
  {
    role: "ESCORT",
    name: "Escort",
    description: "Provide escort services for oversized/hazmat loads, route planning",
    icon: Shield,
    color: "bg-yellow-500",
    features: ["Escort Services", "HazMat Routing", "Safety Compliance", "Route Planning"],
  },
  {
    role: "TERMINAL_MANAGER",
    name: "Terminal Manager",
    description: "Manage terminal operations, schedule dock times, track inventory",
    icon: Building2,
    color: "bg-cyan-500",
    features: ["Terminal Operations", "Dock Scheduling", "Inventory Management", "Facility Oversight"],
  },
  {
    role: "COMPLIANCE_OFFICER",
    name: "Compliance Officer",
    description: "Review documents, ensure regulatory compliance, audit operations",
    icon: FileCheck,
    color: "bg-indigo-500",
    features: ["Document Review", "Compliance Audits", "Regulatory Reporting", "Certification Management"],
  },
  {
    role: "SAFETY_MANAGER",
    name: "Safety Manager",
    description: "Monitor safety incidents, manage protocols, conduct training",
    icon: AlertTriangle,
    color: "bg-pink-500",
    features: ["Incident Management", "Safety Protocols", "Training Programs", "Risk Assessment"],
  },
  {
    role: "ADMIN",
    name: "Administrator",
    description: "Full platform access, user management, system configuration",
    icon: Crown,
    color: "bg-gradient-to-r from-blue-500 to-purple-500",
    features: ["User Management", "System Config", "Analytics Dashboard", "Full Access"],
  },
];

export default function TestLogin() {
  const [, setLocation] = useLocation();

  const handleRoleSelect = (role: string) => {
    // Store test role in localStorage
    localStorage.setItem("test_role", role);
    localStorage.setItem("test_user", JSON.stringify({
      id: Math.floor(Math.random() * 1000),
      openId: `test_${role.toLowerCase()}_${Date.now()}`,
      name: `Test ${role}`,
      email: `test.${role.toLowerCase()}@eusotrip.com`,
      role: role,
      isActive: true,
      isVerified: true,
    }));
    
    // Redirect to dashboard
    setLocation("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            EusoTrip Test Environment
          </h1>
          <p className="text-slate-400 text-lg">
            Select a role to test the platform from different user perspectives
          </p>
          <Badge variant="outline" className="mt-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Development Mode - For Testing Only
          </Badge>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEST_ROLES.map((roleData: any) => {
            const Icon = roleData.icon;
            return (
              <Card
                key={roleData.role}
                className="cursor-pointer hover:scale-105 transition-all duration-200 bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/20"
                onClick={() => handleRoleSelect(roleData.role)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`${roleData.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{roleData.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {roleData.role}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-slate-400">
                    {roleData.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-300">Key Features:</p>
                    <ul className="space-y-1">
                      {roleData.features.map((feature: any, idx: number) => (
                        <li key={idx} className="text-sm text-slate-400 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Click any role card to instantly login and explore the dashboard</p>
          <p className="mt-2">Your selection will be saved in localStorage for testing</p>
        </div>
      </div>
    </div>
  );
}

