/**
 * REGISTRATION LANDING PAGE
 * Role selection for new user registration
 * Based on EUSOTRIP_USER_REGISTRATION_ONBOARDING.md
 */

import { useEffect, useState } from "react";
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
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const REGISTRATION_ROLES = [
  {
    role: "SHIPPER",
    name: "Shipper",
    description: "Companies shipping freight — oil, chemicals, dry goods, agriculture, and more",
    icon: Package,
    gradient: "from-[#1473FF] to-[#3B8BFF]",
    iconGradient: "from-[#1473FF] to-[#3B8BFF]",
    requirements: ["PHMSA Registration", "EPA ID (if applicable)", "Insurance Certificate"],
    regulations: ["PHMSA", "EPA RCRA", "DOT 49 CFR"],
    path: "/register/shipper",
  },
  {
    role: "CARRIER",
    name: "Carrier",
    description: "Trucking companies hauling all freight types including hazmat, tanker, flatbed, dry van",
    icon: Truck,
    gradient: "from-[#10B981] to-[#34D399]",
    iconGradient: "from-[#10B981] to-[#34D399]",
    requirements: ["USDOT Number", "MC Authority", "Hazmat Authority", "Insurance ($1M+ liability)"],
    regulations: ["FMCSA", "PHMSA", "DOT 49 CFR"],
    path: "/register/carrier",
  },
  {
    role: "BROKER",
    name: "Broker",
    description: "Freight brokers arranging transportation across all commodity types",
    icon: Users,
    gradient: "from-[#A855F7] to-[#C084FC]",
    iconGradient: "from-[#A855F7] to-[#C084FC]",
    requirements: ["Broker Authority", "Surety Bond ($75K)", "Insurance"],
    regulations: ["FMCSA", "PHMSA"],
    path: "/register/broker",
  },
  {
    role: "DRIVER",
    name: "Driver",
    description: "CDL holders — all endorsements including hazmat, tanker, doubles/triples",
    icon: User,
    gradient: "from-[#F97316] to-[#FB923C]",
    iconGradient: "from-[#F97316] to-[#FB923C]",
    requirements: ["CDL (Class A/B)", "Medical Certificate", "Hazmat/TWIC (if applicable)", "TSA Background (if hazmat)"],
    regulations: ["FMCSA", "TSA", "DOT"],
    path: "/register/driver",
  },
  {
    role: "CATALYST",
    name: "Catalyst (Dispatcher)",
    description: "Dispatchers and coordinators managing loads",
    icon: Flame,
    gradient: "from-[#EF4444] to-[#F87171]",
    iconGradient: "from-[#EF4444] to-[#F87171]",
    requirements: ["Associated with Carrier", "Hazmat Training (if applicable)"],
    regulations: ["FMCSA"],
    path: "/register/catalyst",
  },
  {
    role: "ESCORT",
    name: "Escort (Pilot Vehicle)",
    description: "Pilot/escort vehicle operators for oversized loads",
    icon: Shield,
    gradient: "from-[#EAB308] to-[#FACC15]",
    iconGradient: "from-[#EAB308] to-[#FACC15]",
    requirements: ["State Certifications", "Vehicle Insurance", "Equipment Requirements"],
    regulations: ["State DOT", "FHWA"],
    path: "/register/escort",
  },
  {
    role: "TERMINAL_MANAGER",
    name: "Terminal Manager",
    description: "Terminal and warehouse facility managers — oil, chemical, dry bulk, intermodal",
    icon: Building2,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["Facility EPA ID", "SPCC Plan", "State Permits"],
    regulations: ["EPA", "OSHA", "EIA", "State DEQ"],
    path: "/register/terminal",
  },
  {
    role: "COMPLIANCE_OFFICER",
    name: "Compliance Officer",
    description: "Regulatory compliance specialists",
    icon: FileCheck,
    gradient: "from-[#6366F1] to-[#818CF8]",
    iconGradient: "from-[#6366F1] to-[#818CF8]",
    requirements: ["Associated with Company", "Compliance Training"],
    regulations: ["Internal Role"],
    path: "/register/compliance",
  },
  {
    role: "SAFETY_MANAGER",
    name: "Safety Manager",
    description: "Safety program managers",
    icon: AlertTriangle,
    gradient: "from-[#EC4899] to-[#F472B6]",
    iconGradient: "from-[#EC4899] to-[#F472B6]",
    requirements: ["Associated with Company", "Safety Certifications"],
    regulations: ["FMCSA", "OSHA"],
    path: "/register/safety",
  },
  {
    role: "ADMIN",
    name: "Administrator",
    description: "Platform administrators (by invitation only)",
    icon: Crown,
    gradient: "from-[#475569] to-[#64748B]",
    iconGradient: "from-[#475569] to-[#64748B]",
    requirements: ["Invitation Code Required"],
    regulations: ["Internal Role"],
    path: "/register/admin",
    inviteOnly: true,
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${isLight ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'}`}>
      {/* Domino entrance keyframes */}
      <style>{`
        @keyframes domino-in {
          0% {
            opacity: 0;
            transform: perspective(800px) rotateX(-35deg) translateY(60px) scale(0.92);
            filter: blur(4px);
          }
          50% {
            opacity: 0.7;
            transform: perspective(800px) rotateX(4deg) translateY(-8px) scale(1.01);
            filter: blur(0px);
          }
          70% {
            transform: perspective(800px) rotateX(-1deg) translateY(3px) scale(0.995);
          }
          100% {
            opacity: 1;
            transform: perspective(800px) rotateX(0deg) translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        @keyframes hero-slide {
          0% { opacity: 0; transform: translateY(-30px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes notice-pop {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          60% { opacity: 1; transform: scale(1.015) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes icon-pulse {
          0% { transform: scale(0) rotate(-45deg); }
          60% { transform: scale(1.15) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .domino-card {
          opacity: 0;
          transform-origin: top center;
        }
        .domino-card.animate {
          animation: domino-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .domino-card.animate .card-icon-wrap {
          animation: icon-pulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: inherit;
        }
        .hero-animate {
          animation: hero-slide 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .notice-animate {
          animation: notice-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
      {/* Header */}
      <div className={`border-b backdrop-blur-xl ${isLight ? 'border-slate-200 bg-white/70' : 'border-slate-700/50 bg-slate-900/50'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/eusotrip-logo.png" alt="EusoTrip" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">EusoTrip</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation("/login")} className={isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'}>
              Already have an account? Sign In
            </Button>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-300 hover:scale-110 ${isLight ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
              title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            >
              {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div
          className="text-center mb-12"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'} ${mounted ? "hero-animate" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            Join the Future of{" "}
            <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              Freight & Energy Logistics
            </span>
          </h1>
          <p
            className={`text-xl max-w-2xl mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'} ${mounted ? "hero-animate" : "opacity-0"}`}
            style={{ animationDelay: "0.25s" }}
          >
            Select your role to begin the registration process. Each role has specific regulatory requirements
            that we'll help you verify.
          </p>
        </div>

        {/* Compliance Notice */}
        <div
          className={`mb-10 p-4 rounded-xl border max-w-3xl mx-auto ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'} ${mounted ? "notice-animate" : "opacity-0"}`}
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className={`text-sm font-medium ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>Regulatory Compliance Verified</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                EusoTrip automatically verifies FMCSA, PHMSA, TSA, and state requirements during registration.
                All data is encrypted and stored securely per DOT 49 CFR standards.
              </p>
            </div>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REGISTRATION_ROLES.map((roleData: any, index: number) => {
            const Icon = roleData.icon;
            const staggerDelay = 0.5 + index * 0.09;
            return (
              <Card
                key={roleData.role}
                className={`domino-card ${mounted ? "animate" : ""} cursor-pointer group hover:scale-[1.02] transition-all duration-300 ${isLight ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-blue-500/5' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-blue-500/10'} ${
                  roleData.inviteOnly ? "opacity-70" : ""
                }`}
                style={{ animationDelay: `${staggerDelay}s` }}
                onClick={() => !roleData.inviteOnly && setLocation(roleData.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    {/* Theme-aware icon: dark = gradient bg + white icon, light = white circle + gradient icon */}
                    <div className={`card-icon-wrap w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isLight
                        ? 'bg-white shadow-md shadow-slate-200 border border-slate-100'
                        : `bg-gradient-to-br ${roleData.gradient}`
                    }`}>
                      {isLight ? (
                        <svg width="0" height="0" className="absolute">
                          <defs>
                            <linearGradient id={`grad-${roleData.role}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor={roleData.gradient.match(/from-\[([^\]]+)\]/)?.[1] || '#1473FF'} />
                              <stop offset="100%" stopColor={roleData.gradient.match(/to-\[([^\]]+)\]/)?.[1] || '#BE01FF'} />
                            </linearGradient>
                          </defs>
                        </svg>
                      ) : null}
                      <Icon
                        className="h-6 w-6"
                        style={isLight ? { stroke: `url(#grad-${roleData.role})` } : undefined}
                        {...(isLight ? {} : { color: 'white' })}
                      />
                    </div>
                    {roleData.inviteOnly && (
                      <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-400">
                        Invite Only
                      </Badge>
                    )}
                  </div>
                  <CardTitle className={`flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {roleData.name}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                  </CardTitle>
                  <CardDescription className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                    {roleData.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Requirements */}
                  <div>
                    <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleData.requirements.slice(0, 3).map((req: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className={`text-xs ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-700/50 text-slate-300'}`}>
                          {req}
                        </Badge>
                      ))}
                      {roleData.requirements.length > 3 && (
                        <Badge variant="secondary" className={`text-xs ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-700/50 text-slate-400'}`}>
                          +{roleData.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Regulations */}
                  <div>
                    <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Regulatory Bodies:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleData.regulations.map((reg: any, idx: number) => (
                        <Badge key={idx} variant="outline" className={`text-xs ${isLight ? 'text-blue-600 border-blue-300' : 'text-blue-400 border-blue-500/30'}`}>
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
        <div
          className={`mt-12 text-center text-sm transition-all duration-700 ${isLight ? 'text-slate-400' : 'text-slate-500'} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "1.6s" }}
        >
          <p>Need help choosing? Contact support@eusotrip.com</p>
          <p className="mt-2">
            By registering, you agree to our{" "}
            <a href="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
