/**
 * SECURITY PLAN PAGE
 * Hazmat security plan reference and compliance tracker per 49 CFR 172.800.
 * Displays company security plan components, personnel security measures,
 * en-route security procedures, and training requirements.
 * Theme-aware | Brand gradient | Oil & gas industry focused
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Shield, Lock, CheckCircle, AlertTriangle, Eye,
  Users, Truck, MapPin, FileText, Clock,
  ChevronRight, Radio, Phone
} from "lucide-react";

type PlanSection = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  items: string[];
};

const PLAN_SECTIONS: PlanSection[] = [
  {
    id: "personnel",
    title: "Personnel Security",
    description: "Employee screening and access controls",
    icon: <Users className="w-5 h-5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    items: [
      "Background checks for all hazmat employees (49 CFR 172.802(b))",
      "TWIC card verification for port/terminal access",
      "Security awareness training annually",
      "Restricted access to shipping documents and security-sensitive information",
      "Visitor escort policy at hazmat facilities",
    ],
  },
  {
    id: "enroute",
    title: "En-Route Security",
    description: "Security procedures during transport",
    icon: <Truck className="w-5 h-5" />,
    color: "text-green-400",
    bg: "bg-green-500/15",
    items: [
      "Vehicle secured when unattended (locked cab, sealed trailer)",
      "Attendance requirement — vehicle not left unattended in high-risk areas",
      "Route security assessment before departure",
      "Communication protocol — check in with dispatch every 2 hours",
      "Tamper-evident seals verified at pickup and delivery",
      "Immediate reporting of suspicious activity or attempted theft",
    ],
  },
  {
    id: "facility",
    title: "Facility Security",
    description: "Physical security at origin and destination",
    icon: <Lock className="w-5 h-5" />,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    items: [
      "Perimeter fencing and access control at hazmat storage",
      "CCTV monitoring of loading/unloading areas",
      "Key control and restricted access to hazmat areas",
      "Lighting requirements for nighttime security",
      "Inventory control and discrepancy reporting",
    ],
  },
  {
    id: "threat",
    title: "Threat Response",
    description: "Actions for security threats and incidents",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "text-red-400",
    bg: "bg-red-500/15",
    items: [
      "Bomb threat procedures — evacuate and call 911",
      "Hijacking response — comply and report immediately",
      "Suspicious package protocol",
      "Chain of custody verification for high-risk shipments",
      "Coordination with law enforcement and FBI",
    ],
  },
];

const TRAINING_ITEMS = [
  { label: "Security Awareness Training", frequency: "Annual", regulation: "49 CFR 172.704(a)(4)", required: true },
  { label: "In-Depth Security Training", frequency: "Initial + Recurrent (3 yr)", regulation: "49 CFR 172.704(a)(5)", required: true },
  { label: "Security Plan Familiarization", frequency: "Initial hire", regulation: "49 CFR 172.802(b)", required: true },
  { label: "Threat Recognition Training", frequency: "Annual", regulation: "TSA Requirement", required: true },
  { label: "Emergency Response Drill", frequency: "Semi-Annual", regulation: "Company Policy", required: false },
];

export default function SecurityPlan() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [expandedSection, setExpandedSection] = useState<string | null>("enroute");
  const [acknowledged, setAcknowledged] = useState(false);

  const cc = cn("rounded-2xl border", isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/[0.03] border-white/[0.06]");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Security Plan
          </h1>
          <p className={cn("text-sm mt-1", isLight ? "text-slate-500" : "text-slate-400")}>
            Hazmat transportation security — 49 CFR 172.800
          </p>
        </div>
        <Badge className={cn(
          "rounded-full px-3 py-1 text-xs font-medium border",
          acknowledged
            ? "bg-green-500/15 text-green-500 border-green-500/30"
            : "bg-yellow-500/15 text-yellow-500 border-yellow-500/30"
        )}>
          {acknowledged ? "Acknowledged" : "Review Required"}
        </Badge>
      </div>

      {/* Classification banner */}
      <div className={cn(
        "flex items-start gap-4 p-5 rounded-xl border-2",
        isLight ? "bg-red-50 border-red-300" : "bg-red-500/10 border-red-500/30"
      )}>
        <div className="p-3 rounded-xl bg-red-500/20 flex-shrink-0">
          <Shield className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className={cn("text-base font-bold", isLight ? "text-red-700" : "text-red-400")}>
            SENSITIVE SECURITY INFORMATION
          </p>
          <p className={cn("text-sm mt-1", isLight ? "text-red-600" : "text-red-400/80")}>
            This security plan contains sensitive information. Do not share with unauthorized individuals.
            Unauthorized disclosure is prohibited under 49 CFR 15 and 49 USC 114(r).
          </p>
        </div>
      </div>

      {/* Plan Sections */}
      <div className="space-y-3">
        {PLAN_SECTIONS.map((section) => {
          const isExpanded = expandedSection === section.id;
          return (
            <Card
              key={section.id}
              className={cn(cc, "overflow-hidden cursor-pointer transition-all")}
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-lg flex-shrink-0", section.bg, section.color)}>
                      {section.icon}
                    </div>
                    <div>
                      <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{section.title}</p>
                      <p className={cn("text-xs", isLight ? "text-slate-400" : "text-slate-500")}>{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[9px]", section.bg, section.color, "border-current/20")}>{section.items.length} items</Badge>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90", isLight ? "text-slate-300" : "text-slate-600")} />
                  </div>
                </div>

                {isExpanded && (
                  <div className={cn("px-5 pb-5 space-y-2", isLight ? "border-t border-slate-100" : "border-t border-slate-700/30")}>
                    <div className="pt-3" />
                    {section.items.map((item, i) => (
                      <div key={i} className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border",
                        isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
                      )}>
                        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5", section.bg)}>
                          <CheckCircle className={cn("w-3.5 h-3.5", section.color)} />
                        </div>
                        <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-700" : "text-slate-200")}>{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Training Requirements */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <FileText className="w-5 h-5 text-[#1473FF]" />
            Security Training Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {TRAINING_ITEMS.map((item, i) => (
            <div key={i} className={cn(
              "flex items-center justify-between p-3 rounded-xl border",
              isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-slate-700/30"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", item.required ? "bg-blue-500/15" : "bg-slate-500/15")}>
                  <FileText className={cn("w-3.5 h-3.5", item.required ? "text-blue-400" : "text-slate-400")} />
                </div>
                <div>
                  <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white")}>{item.label}</p>
                  <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>
                    {item.frequency} · {item.regulation}
                  </p>
                </div>
              </div>
              <Badge className={cn(
                "text-[9px] border",
                item.required ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "bg-slate-500/15 text-slate-400 border-slate-500/30"
              )}>
                {item.required ? "Required" : "Recommended"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className={cc}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center gap-2", isLight ? "text-slate-800" : "text-white")}>
            <Phone className="w-5 h-5 text-red-500" />
            Security Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: "911 Emergency", number: "911", desc: "Immediate threat to life" },
              { name: "TSA Hotline", number: "1-866-289-9673", desc: "Security threat reporting" },
              { name: "FBI Tips", number: "1-800-225-5324", desc: "Terrorism/suspicious activity" },
            ].map((c) => (
              <a
                key={c.name}
                href={`tel:${c.number.replace(/[^0-9]/g, "")}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border transition-colors",
                  isLight ? "bg-white border-slate-200 hover:border-red-300" : "bg-white/[0.02] border-slate-700/30 hover:border-red-500/30"
                )}
              >
                <div className="p-2.5 rounded-lg bg-red-500/15">
                  <Phone className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", isLight ? "text-slate-800" : "text-white")}>{c.name}</p>
                  <p className="text-xs font-mono text-red-500">{c.number}</p>
                  <p className={cn("text-[10px]", isLight ? "text-slate-400" : "text-slate-500")}>{c.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acknowledge */}
      {!acknowledged && (
        <Button
          className="w-full h-12 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:from-[#1260DD] hover:to-[#A801DD] text-white border-0 rounded-xl text-base font-medium shadow-lg shadow-purple-500/20"
          onClick={() => { setAcknowledged(true); toast.success("Security plan acknowledged"); }}
        >
          <Shield className="w-5 h-5 mr-2" />
          Acknowledge Security Plan
        </Button>
      )}
    </div>
  );
}
