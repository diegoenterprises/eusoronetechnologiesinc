/**
 * REGISTRATION LANDING PAGE
 * Role selection for new user registration
 * Based on EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const REGISTRATION_ROLES = [
  {
    role: "SHIPPER",
    name: "Shipper",
    description: "Companies shipping freight — oil, chemicals, dry goods, agriculture, and more",
    icon: Package,
    color: "from-blue-500 to-blue-600",
    requirements: ["PHMSA Registration", "EPA ID (if applicable)", "Insurance Certificate"],
    regulations: ["PHMSA", "EPA RCRA", "DOT 49 CFR"],
    path: "/register/shipper",
  },
  {
    role: "CARRIER",
    name: "Carrier",
    description: "Trucking companies hauling all freight types including hazmat, tanker, flatbed, dry van",
    icon: Truck,
    color: "from-green-500 to-green-600",
    requirements: ["USDOT Number", "MC Authority", "Hazmat Authority", "Insurance ($1M+ liability)"],
    regulations: ["FMCSA", "PHMSA", "DOT 49 CFR"],
    path: "/register/carrier",
  },
  {
    role: "BROKER",
    name: "Broker",
    description: "Freight brokers arranging transportation across all commodity types",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    requirements: ["Broker Authority", "Surety Bond ($75K)", "Insurance"],
    regulations: ["FMCSA", "PHMSA"],
    path: "/register/broker",
  },
  {
    role: "DRIVER",
    name: "Driver",
    description: "CDL holders — all endorsements including hazmat, tanker, doubles/triples",
    icon: User,
    color: "from-orange-500 to-orange-600",
    requirements: ["CDL (Class A/B)", "Medical Certificate", "Hazmat/TWIC (if applicable)", "TSA Background (if hazmat)"],
    regulations: ["FMCSA", "TSA", "DOT"],
    path: "/register/driver",
  },
  {
    role: "CATALYST",
    name: "Catalyst (Dispatcher)",
    description: "Dispatchers and coordinators managing loads",
    icon: Flame,
    color: "from-red-500 to-red-600",
    requirements: ["Associated with Carrier", "Hazmat Training (if applicable)"],
    regulations: ["FMCSA"],
    path: "/register/catalyst",
  },
  {
    role: "ESCORT",
    name: "Escort (Pilot Vehicle)",
    description: "Pilot/escort vehicle operators for oversized loads",
    icon: Shield,
    color: "from-yellow-500 to-yellow-600",
    requirements: ["State Certifications", "Vehicle Insurance", "Equipment Requirements"],
    regulations: ["State DOT", "FHWA"],
    path: "/register/escort",
  },
  {
    role: "TERMINAL_MANAGER",
    name: "Terminal Manager",
    description: "Terminal and warehouse facility managers — oil, chemical, dry bulk, intermodal",
    icon: Building2,
    color: "from-cyan-500 to-cyan-600",
    requirements: ["Facility EPA ID", "SPCC Plan", "State Permits"],
    regulations: ["EPA", "OSHA", "EIA", "State DEQ"],
    path: "/register/terminal",
  },
  {
    role: "COMPLIANCE_OFFICER",
    name: "Compliance Officer",
    description: "Regulatory compliance specialists",
    icon: FileCheck,
    color: "from-indigo-500 to-indigo-600",
    requirements: ["Associated with Company", "Compliance Training"],
    regulations: ["Internal Role"],
    path: "/register/compliance",
  },
  {
    role: "SAFETY_MANAGER",
    name: "Safety Manager",
    description: "Safety program managers",
    icon: AlertTriangle,
    color: "from-pink-500 to-pink-600",
    requirements: ["Associated with Company", "Safety Certifications"],
    regulations: ["FMCSA", "OSHA"],
    path: "/register/safety",
  },
  {
    role: "ADMIN",
    name: "Administrator",
    description: "Platform administrators (by invitation only)",
    icon: Crown,
    color: "from-slate-600 to-slate-700",
    requirements: ["Invitation Code Required"],
    regulations: ["Internal Role"],
    path: "/register/admin",
    inviteOnly: true,
  },
];

export default function Register() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoTrip</span>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/login")} className="text-slate-300 hover:text-white">
            Already have an account? Sign In
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Join the Future of{" "}
            <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              Freight & Energy Logistics
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Select your role to begin the registration process. Each role has specific regulatory requirements
            that we'll help you verify.
          </p>
        </div>

        {/* Compliance Notice */}
        <div className="mb-10 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-300 font-medium">Regulatory Compliance Verified</p>
              <p className="text-xs text-slate-400 mt-1">
                EusoTrip automatically verifies FMCSA, PHMSA, TSA, and state requirements during registration.
                All data is encrypted and stored securely per DOT 49 CFR standards.
              </p>
            </div>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REGISTRATION_ROLES.map((roleData: any) => {
            const Icon = roleData.icon;
            return (
              <Card
                key={roleData.role}
                className={`cursor-pointer group hover:scale-[1.02] transition-all duration-300 bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-blue-500/10 ${
                  roleData.inviteOnly ? "opacity-70" : ""
                }`}
                onClick={() => !roleData.inviteOnly && setLocation(roleData.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${roleData.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {roleData.inviteOnly && (
                      <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-400">
                        Invite Only
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {roleData.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {roleData.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Requirements */}
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleData.requirements.slice(0, 3).map((req: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-slate-700/50 text-slate-300">
                          {req}
                        </Badge>
                      ))}
                      {roleData.requirements.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-slate-700/50 text-slate-400">
                          +{roleData.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Regulations */}
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-2">Regulatory Bodies:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleData.regulations.map((reg: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                          {reg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Need help choosing? Contact support@eusotrip.com</p>
          <p className="mt-2">
            By registering, you agree to our{" "}
            <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
