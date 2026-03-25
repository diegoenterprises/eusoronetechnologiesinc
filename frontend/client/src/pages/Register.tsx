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
  ArrowLeft,
  CheckCircle,
  Sun,
  Moon,
  TrainFront,
  Ship,
  Anchor,
  Globe,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from 'react-i18next';

// Country flag images — official SVGs in /flags/
const FLAG_PATHS: Record<string, string> = { US: "/flags/us.svg", CA: "/flags/ca.svg", MX: "/flags/mx.svg" };

// V5 Multi-Modal: Country options
const COUNTRIES = [
  { code: "US", name: "United States", desc: "FMCSA/DOT/FRA/USCG regulated operations" },
  { code: "CA", name: "Canada", desc: "Transport Canada/TDG/Railway Safety Act" },
  { code: "MX", name: "Mexico", desc: "SCT/NOM/Ley de Navegaci\u00f3n" },
];

// V5 Multi-Modal: Transport mode options — brand gradient (blue→purple)
const TRANSPORT_MODES = [
  { code: "TRUCK", icon: Truck, name: "Trucking", desc: "Highway freight & hazmat transport", color: "from-[#1473FF] to-[#7C3AED]" },
  { code: "RAIL", icon: TrainFront, name: "Rail", desc: "Railroad freight & intermodal operations", color: "from-[#1473FF] to-[#BE01FF]" },
  { code: "VESSEL", icon: Ship, name: "Vessel / Maritime", desc: "Ocean, barge & inland waterway freight", color: "from-[#7C3AED] to-[#BE01FF]" },
];

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
    modes: ["TRUCK"],
  },
  {
    role: "CATALYST",
    name: "Catalyst",
    description: "Trucking companies hauling all freight types including hazmat, tanker, flatbed, dry van",
    icon: Truck,
    gradient: "from-[#10B981] to-[#34D399]",
    iconGradient: "from-[#10B981] to-[#34D399]",
    requirements: ["USDOT Number", "MC Authority", "Hazmat Authority", "Insurance ($1M+ liability)"],
    regulations: ["FMCSA", "PHMSA", "DOT 49 CFR"],
    path: "/register/catalyst",
    modes: ["TRUCK"],
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
    modes: ["TRUCK"],
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
    modes: ["TRUCK"],
  },
  {
    role: "DISPATCH",
    name: "Dispatch (Dispatcher)",
    description: "Dispatchers and coordinators managing loads",
    icon: Flame,
    gradient: "from-[#EF4444] to-[#F87171]",
    iconGradient: "from-[#EF4444] to-[#F87171]",
    requirements: ["Associated with Catalyst", "Hazmat Training (if applicable)"],
    regulations: ["FMCSA"],
    path: "/register/dispatch",
    modes: ["TRUCK"],
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
    modes: ["TRUCK"],
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
    modes: ["TRUCK", "RAIL", "VESSEL"],
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
    modes: ["TRUCK", "RAIL", "VESSEL"],
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
    modes: ["TRUCK", "RAIL", "VESSEL"],
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
    modes: ["TRUCK", "RAIL", "VESSEL"],
  },
  // V5 Rail Roles
  {
    role: "RAIL_SHIPPER",
    name: "Rail Shipper",
    description: "Companies shipping freight by rail — bulk, intermodal, unit trains",
    icon: Package,
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    iconGradient: "from-[#3B82F6] to-[#60A5FA]",
    requirements: ["STB Registration", "Insurance Certificate"],
    regulations: ["STB", "FRA", "DOT 49 CFR"],
    path: "/register/shipper",
    modes: ["RAIL"],
  },
  {
    role: "RAIL_CATALYST",
    name: "Railroad Carrier",
    description: "Class I, II, III railroads and short lines",
    icon: TrainFront,
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    iconGradient: "from-[#3B82F6] to-[#60A5FA]",
    requirements: ["STB Docket", "FRA Certificate", "Operating Authority"],
    regulations: ["STB", "FRA", "AAR"],
    path: "/register/catalyst",
    modes: ["RAIL"],
  },
  {
    role: "RAIL_DISPATCHER",
    name: "Rail Dispatcher",
    description: "Train dispatchers coordinating rail movements",
    icon: Flame,
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    iconGradient: "from-[#3B82F6] to-[#60A5FA]",
    requirements: ["FRA Dispatcher Certification", "Associated with Railroad"],
    regulations: ["FRA", "49 CFR Part 241"],
    path: "/register/dispatch",
    modes: ["RAIL"],
  },
  {
    role: "RAIL_ENGINEER",
    name: "Rail Engineer",
    description: "Locomotive engineers — certified under 49 CFR Part 240",
    icon: User,
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    iconGradient: "from-[#3B82F6] to-[#60A5FA]",
    requirements: ["Engineer Certification (49 CFR 240)", "Medical Fitness", "Rules Qualification"],
    regulations: ["FRA", "49 CFR Part 240"],
    path: "/register/driver",
    modes: ["RAIL"],
  },
  {
    role: "RAIL_CONDUCTOR",
    name: "Rail Conductor",
    description: "Train conductors — certified under 49 CFR Part 242",
    icon: User,
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    iconGradient: "from-[#3B82F6] to-[#60A5FA]",
    requirements: ["Conductor Certification (49 CFR 242)", "Medical Fitness", "Rules Qualification"],
    regulations: ["FRA", "49 CFR Part 242"],
    path: "/register/driver",
    modes: ["RAIL"],
  },
  {
    role: "RAIL_BROKER",
    name: "Rail Broker",
    description: "Intermodal marketing companies and rail freight brokers",
    icon: Users,
    gradient: "from-[#3B82F6] to-[#60A5FA]",
    iconGradient: "from-[#3B82F6] to-[#60A5FA]",
    requirements: ["IMC Registration", "Surety Bond", "Insurance"],
    regulations: ["STB", "FRA"],
    path: "/register/broker",
    modes: ["RAIL"],
  },
  // V5 Vessel Roles
  {
    role: "VESSEL_SHIPPER",
    name: "Vessel Shipper",
    description: "Companies shipping freight by ocean — containerized, bulk, breakbulk",
    icon: Package,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["FMC Registration", "Insurance Certificate"],
    regulations: ["FMC", "CBP", "USCG"],
    path: "/register/shipper",
    modes: ["VESSEL"],
  },
  {
    role: "VESSEL_OPERATOR",
    name: "Vessel Operator",
    description: "VOCC and NVOCC operators — ocean freight carriers",
    icon: Ship,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["FMC License/Bond", "USCG Documentation", "ISM DOC"],
    regulations: ["FMC", "USCG", "IMO"],
    path: "/register/catalyst",
    modes: ["VESSEL"],
  },
  {
    role: "PORT_MASTER",
    name: "Port Master",
    description: "Port authorities and terminal operators",
    icon: Anchor,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["MTSA Facility Security Plan", "TWIC", "Port Authority License"],
    regulations: ["USCG", "MTSA", "CBP"],
    path: "/register/terminal",
    modes: ["VESSEL"],
  },
  {
    role: "SHIP_CAPTAIN",
    name: "Ship Captain",
    description: "Licensed mariners — STCW certified masters",
    icon: User,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["USCG License (MMC)", "STCW Certification", "TWIC Card", "Medical Certificate"],
    regulations: ["USCG", "STCW", "IMO"],
    path: "/register/driver",
    modes: ["VESSEL"],
  },
  {
    role: "VESSEL_BROKER",
    name: "Vessel Broker",
    description: "Ocean freight forwarders and vessel brokers",
    icon: Users,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["FMC License", "Surety Bond", "Insurance"],
    regulations: ["FMC", "CBP"],
    path: "/register/broker",
    modes: ["VESSEL"],
  },
  {
    role: "CUSTOMS_BROKER",
    name: "Customs Broker",
    description: "Licensed customs brokers — CBP entry processing",
    icon: Shield,
    gradient: "from-[#06B6D4] to-[#22D3EE]",
    iconGradient: "from-[#06B6D4] to-[#22D3EE]",
    requirements: ["CBP Customs Broker License", "National Permit", "Surety Bond"],
    regulations: ["CBP", "FMC", "19 CFR"],
    path: "/register/broker",
    modes: ["VESSEL"],
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const { t } = useTranslation();
  // V5 Multi-Modal: multi-step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const toggleCountry = (code: string) =>
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const toggleMode = (code: string) =>
    setSelectedModes((prev) =>
      prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code]
    );

  // Filter roles by selected modes
  const filteredRoles = selectedModes.length === 0
    ? REGISTRATION_ROLES
    : REGISTRATION_ROLES.filter((r: any) =>
        r.modes?.some((m: string) => selectedModes.includes(m))
      );

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
              {t('auth.alreadyHaveAccount', 'Already have an account? Sign In')}
            </Button>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
              className={`p-2.5 rounded-full border transition-all duration-300 hover:scale-110 ${isLight ? 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm' : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'}`}
              title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
            >
              {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step ? 'bg-emerald-500 text-white' : s === step ? 'bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white' : isLight ? 'bg-slate-200 text-slate-400' : 'bg-slate-700 text-slate-500'
              }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-0.5 ${s < step ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-[52px] text-xs mb-6">
          <span className={step >= 1 ? (isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium') : (isLight ? 'text-slate-400' : 'text-slate-500')}>{t('register.country', 'Country')}</span>
          <span className={step >= 2 ? (isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium') : (isLight ? 'text-slate-400' : 'text-slate-500')}>{t('register.mode', 'Mode')}</span>
          <span className={step >= 3 ? (isLight ? 'text-slate-700 font-medium' : 'text-slate-300 font-medium') : (isLight ? 'text-slate-400' : 'text-slate-500')}>{t('register.role', 'Role')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Hero */}
        <div className="text-center mb-10" style={{ opacity: mounted ? 1 : 0 }}>
          <h1
            className={`text-4xl md:text-5xl font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'} ${mounted ? "hero-animate" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            {t('register.joinTheFuture', 'Join the Future of')}{" "}
            <span className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
              {t('register.freightEnergy', 'Freight & Energy Logistics')}
            </span>
          </h1>
          <p
            className={`text-xl max-w-2xl mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'} ${mounted ? "hero-animate" : "opacity-0"}`}
            style={{ animationDelay: "0.25s" }}
          >
            {step === 1 && t('register.step1Desc', 'Select your operating country. Multi-select allowed for cross-border operators.')}
            {step === 2 && t('register.step2Desc', 'Select your transport mode(s). Multi-select allowed for multi-modal operators.')}
            {step === 3 && t('register.step3Desc', 'Select your role to begin registration. Each role has specific regulatory requirements.')}
          </p>
        </div>

        {/* ═══ STEP 1: COUNTRY SELECTION ═══ */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              {COUNTRIES.map((c) => {
                const selected = selectedCountries.includes(c.code);
                return (
                  <Card
                    key={c.code}
                    onClick={() => toggleCountry(c.code)}
                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      selected
                        ? isLight
                          ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50 shadow-lg shadow-blue-500/10'
                          : 'ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:shadow-lg'
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3"><img src={FLAG_PATHS[c.code]} alt={c.name} className="w-16 h-11 rounded-md shadow-sm object-cover" /></div>
                      <CardTitle className={`text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</CardTitle>
                      <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{c.desc}</CardDescription>
                      {selected && (
                        <CheckCircle className="w-5 h-5 text-blue-500 mx-auto mt-3" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-center">
              <Button
                disabled={selectedCountries.length === 0}
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white px-8"
              >
                {t('common.next', 'Continue')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* ═══ STEP 2: TRANSPORT MODE SELECTION ═══ */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
              {TRANSPORT_MODES.map((m) => {
                const ModeIcon = m.icon;
                const selected = selectedModes.includes(m.code);
                return (
                  <Card
                    key={m.code}
                    onClick={() => toggleMode(m.code)}
                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      selected
                        ? isLight
                          ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50 shadow-lg shadow-blue-500/10'
                          : 'ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-lg'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:shadow-lg'
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${isLight ? 'bg-blue-50 border border-blue-100' : `bg-gradient-to-br ${m.color}`}`}>
                        <ModeIcon className={`w-7 h-7 ${isLight ? 'text-blue-600' : 'text-white'}`} />
                      </div>
                      <CardTitle className={`text-lg mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{m.name}</CardTitle>
                      <CardDescription className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{m.desc}</CardDescription>
                      {selected && (
                        <CheckCircle className="w-5 h-5 text-blue-500 mx-auto mt-3" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.back', 'Back')}
              </Button>
              <Button
                disabled={selectedModes.length === 0}
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white px-8"
              >
                {t('common.next', 'Continue')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* ═══ STEP 3: ROLE SELECTION (filtered by mode) ═══ */}
        {step === 3 && (
          <>
            {/* Compliance Notice */}
            <div
              className={`mb-8 p-4 rounded-xl border max-w-3xl mx-auto ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'} ${mounted ? "notice-animate" : "opacity-0"}`}
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`text-sm font-medium ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>Regulatory Compliance Verified</p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    EusoTrip automatically verifies FMCSA, PHMSA, TSA, FRA, FMC, USCG, and state requirements during registration.
                    All data is encrypted and stored securely per DOT 49 CFR standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Selected tags */}
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              {selectedCountries.map((c) => {
                const country = COUNTRIES.find((x) => x.code === c);
                return (
                  <Badge key={c} className={`text-xs flex items-center gap-1.5 ${isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                    <img src={FLAG_PATHS[c]} alt={c} className="w-5 h-3.5 rounded-sm object-cover" />
                    {country?.name}
                  </Badge>
                );
              })}
              {selectedModes.map((m) => {
                const mode = TRANSPORT_MODES.find((x) => x.code === m);
                return (
                  <Badge key={m} className={`text-xs ${isLight ? 'bg-violet-100 text-violet-700' : 'bg-violet-500/20 text-violet-400'}`}>
                    {mode?.name}
                  </Badge>
                );
              })}
            </div>

            {/* Role Cards Grid */}
            <div role="list" aria-label="Registration role options" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((roleData: any, index: number) => {
                const Icon = roleData.icon;
                const staggerDelay = 0.1 + index * 0.06;
                return (
                  <Card
                    key={roleData.role}
                    role="listitem"
                    tabIndex={roleData.inviteOnly ? -1 : 0}
                    aria-label={`Register as ${roleData.name}${roleData.inviteOnly ? ' (invite only)' : ''}`}
                    onKeyDown={(e: React.KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && !roleData.inviteOnly) { e.preventDefault(); setLocation(roleData.path); } }}
                    className={`domino-card ${mounted ? "animate" : ""} cursor-pointer group hover:scale-[1.02] transition-all duration-300 ${isLight ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-blue-500/5' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-blue-500/10'} ${
                      roleData.inviteOnly ? "opacity-70" : ""
                    }`}
                    style={{ animationDelay: `${staggerDelay}s` }}
                    onClick={() => !roleData.inviteOnly && setLocation(roleData.path)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`card-icon-wrap w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isLight
                            ? 'bg-white shadow-md shadow-slate-200 border border-slate-100'
                            : 'bg-gradient-to-br from-[#1473FF] to-[#BE01FF]'
                        }`}>
                          {isLight ? (
                            <svg width="0" height="0" className="absolute">
                              <defs>
                                <linearGradient id={`grad-${roleData.role}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#1473FF" />
                                  <stop offset="100%" stopColor="#BE01FF" />
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
                        <div className="flex items-center gap-1.5">
                          {roleData.modes?.map((m: string) => {
                            const modeData = TRANSPORT_MODES.find((t) => t.code === m);
                            if (!modeData) return null;
                            const MIcon = modeData.icon;
                            return (
                              <div key={m} className={`w-5 h-5 rounded flex items-center justify-center ${
                                m === 'TRUCK' ? 'bg-orange-500/20' : m === 'RAIL' ? 'bg-blue-500/20' : 'bg-cyan-500/20'
                              }`}>
                                <MIcon className={`w-3 h-3 ${
                                  m === 'TRUCK' ? 'text-orange-400' : m === 'RAIL' ? 'text-blue-400' : 'text-cyan-400'
                                }`} />
                              </div>
                            );
                          })}
                          {roleData.inviteOnly && (
                            <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-400 ml-1">
                              Invite Only
                            </Badge>
                          )}
                        </div>
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
                        <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{t('register.requirements', 'Requirements')}:</p>
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
                        <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{t('register.regulatoryBodies', 'Regulatory Bodies')}:</p>
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

            {/* Back button */}
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('register.backToMode', 'Back to Mode Selection')}
              </Button>
            </div>
          </>
        )}

        {/* Footer Info */}
        <div
          className={`mt-12 text-center text-sm transition-all duration-700 ${isLight ? 'text-slate-400' : 'text-slate-500'} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "1.6s" }}
        >
          <p>{t('register.needHelp', 'Need help choosing? Contact support@eusotrip.com')}</p>
          <p className="mt-2">
            {t('register.byRegistering', 'By registering, you agree to our')}{" "}
            <a href="/terms-of-service" className="text-blue-400 hover:underline">{t('register.termsOfService', 'Terms of Service')}</a>
            {" "}{t('register.and', 'and')}{" "}
            <a href="/privacy-policy" className="text-blue-400 hover:underline">{t('register.privacyPolicy', 'Privacy Policy')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
