/**
 * COMPLIANCE SCORE COMPONENT
 * Visual compliance score breakdown by category
 * Based on 08_COMPLIANCE_OFFICER_USER_JOURNEY.md
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, FileCheck, Clock, AlertTriangle, CheckCircle,
  User, Truck, Droplet, FileText, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComplianceCategory {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  status: "compliant" | "warning" | "critical" | "expired";
  icon: React.ReactNode;
  items: {
    name: string;
    status: "ok" | "expiring" | "overdue" | "missing";
    expiresAt?: string;
    daysUntilExpiry?: number;
  }[];
}

interface ComplianceScoreProps {
  overallScore: number;
  categories: ComplianceCategory[];
  entityName: string;
  entityType: "driver" | "carrier" | "company";
  lastAudit?: string;
  nextAudit?: string;
}

const STATUS_COLORS = {
  compliant: { bg: "bg-green-500", text: "text-green-400", border: "border-green-500/30" },
  warning: { bg: "bg-yellow-500", text: "text-yellow-400", border: "border-yellow-500/30" },
  critical: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500/30" },
  expired: { bg: "bg-slate-500", text: "text-slate-400", border: "border-slate-500/30" },
};

const ITEM_STATUS_COLORS = {
  ok: "text-green-400",
  expiring: "text-yellow-400",
  overdue: "text-red-400",
  missing: "text-slate-400",
};

export function ComplianceScore({
  overallScore,
  categories,
  entityName,
  entityType,
  lastAudit,
  nextAudit,
}: ComplianceScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreRing = (score: number) => {
    if (score >= 90) return "from-green-500 to-emerald-500";
    if (score >= 70) return "from-yellow-500 to-orange-500";
    if (score >= 50) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-500";
  };

  const getOverallStatus = () => {
    if (overallScore >= 90) return "Compliant";
    if (overallScore >= 70) return "Needs Attention";
    if (overallScore >= 50) return "At Risk";
    return "Critical";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Compliance Score</p>
              <h2 className="text-2xl font-bold text-white">{entityName}</h2>
              <Badge className={cn(
                "mt-2",
                overallScore >= 90 && "bg-green-500/20 text-green-400",
                overallScore >= 70 && overallScore < 90 && "bg-yellow-500/20 text-yellow-400",
                overallScore >= 50 && overallScore < 70 && "bg-orange-500/20 text-orange-400",
                overallScore < 50 && "bg-red-500/20 text-red-400"
              )}>
                {overallScore >= 90 && <CheckCircle className="w-3 h-3 mr-1" />}
                {overallScore < 90 && overallScore >= 70 && <AlertTriangle className="w-3 h-3 mr-1" />}
                {overallScore < 70 && <AlertTriangle className="w-3 h-3 mr-1" />}
                {getOverallStatus()}
              </Badge>
            </div>

            {/* Score Circle */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 352} 352`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className={cn(
                      overallScore >= 90 && "stop-green-500",
                      overallScore >= 70 && overallScore < 90 && "stop-yellow-500",
                      overallScore < 70 && "stop-red-500"
                    )} stopColor={overallScore >= 90 ? "#22c55e" : overallScore >= 70 ? "#eab308" : "#ef4444"} />
                    <stop offset="100%" className={cn(
                      overallScore >= 90 && "stop-emerald-500",
                      overallScore >= 70 && overallScore < 90 && "stop-orange-500",
                      overallScore < 70 && "stop-pink-500"
                    )} stopColor={overallScore >= 90 ? "#10b981" : overallScore >= 70 ? "#f97316" : "#ec4899"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-4xl font-bold", getScoreColor(overallScore))}>
                  {overallScore}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Info */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-700">
            <div>
              <p className="text-xs text-slate-400">Last Audit</p>
              <p className="text-white">{lastAudit || "Never"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Next Audit Due</p>
              <p className="text-white">{nextAudit || "Not scheduled"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const percentage = Math.round((category.score / category.maxScore) * 100);
          const statusColors = STATUS_COLORS[category.status];
          
          return (
            <Card key={category.id} className={cn(
              "bg-slate-800/50 border-slate-700",
              category.status === "critical" && "border-red-500/50",
              category.status === "warning" && "border-yellow-500/50"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      statusColors.bg + "/20"
                    )}>
                      {category.icon}
                    </div>
                    <CardTitle className="text-sm text-white">{category.name}</CardTitle>
                  </div>
                  <Badge className={cn(statusColors.bg + "/20", statusColors.text)}>
                    {category.score}/{category.maxScore}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={percentage} 
                  className={cn("h-2 mb-3", 
                    category.status === "compliant" && "[&>div]:bg-green-500",
                    category.status === "warning" && "[&>div]:bg-yellow-500",
                    category.status === "critical" && "[&>div]:bg-red-500",
                    category.status === "expired" && "[&>div]:bg-slate-500"
                  )} 
                />
                
                <div className="space-y-1">
                  {category.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate flex-1">{item.name}</span>
                      <span className={ITEM_STATUS_COLORS[item.status]}>
                        {item.status === "ok" && "OK"}
                        {item.status === "expiring" && `${item.daysUntilExpiry}d`}
                        {item.status === "overdue" && "Overdue"}
                        {item.status === "missing" && "Missing"}
                      </span>
                    </div>
                  ))}
                  {category.items.length > 4 && (
                    <p className="text-xs text-slate-500 mt-1">
                      +{category.items.length - 4} more items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Default categories for different entity types
export function getDefaultCategories(entityType: "driver" | "carrier" | "company"): ComplianceCategory[] {
  if (entityType === "driver") {
    return [
      {
        id: "dq",
        name: "Driver Qualification",
        score: 8,
        maxScore: 10,
        status: "compliant",
        icon: <User className="w-4 h-4 text-green-400" />,
        items: [
          { name: "CDL", status: "ok" },
          { name: "Medical Certificate", status: "expiring", daysUntilExpiry: 45 },
          { name: "Employment Application", status: "ok" },
          { name: "MVR", status: "ok" },
          { name: "Road Test", status: "ok" },
        ],
      },
      {
        id: "hos",
        name: "Hours of Service",
        score: 10,
        maxScore: 10,
        status: "compliant",
        icon: <Clock className="w-4 h-4 text-green-400" />,
        items: [
          { name: "ELD Compliance", status: "ok" },
          { name: "Logs Current", status: "ok" },
          { name: "No Violations (30d)", status: "ok" },
        ],
      },
      {
        id: "da",
        name: "Drug & Alcohol",
        score: 10,
        maxScore: 10,
        status: "compliant",
        icon: <Activity className="w-4 h-4 text-green-400" />,
        items: [
          { name: "Pre-Employment Test", status: "ok" },
          { name: "Random Pool Enrolled", status: "ok" },
          { name: "Clearinghouse Query", status: "ok" },
        ],
      },
      {
        id: "hazmat",
        name: "Hazmat",
        score: 7,
        maxScore: 10,
        status: "warning",
        icon: <Droplet className="w-4 h-4 text-yellow-400" />,
        items: [
          { name: "Hazmat Endorsement", status: "ok" },
          { name: "TSA Background", status: "ok" },
          { name: "Hazmat Training", status: "expiring", daysUntilExpiry: 30 },
          { name: "Security Training", status: "expiring", daysUntilExpiry: 30 },
        ],
      },
    ];
  }
  
  // Default carrier categories
  return [
    {
      id: "authority",
      name: "Operating Authority",
      score: 10,
      maxScore: 10,
      status: "compliant",
      icon: <Shield className="w-4 h-4 text-green-400" />,
      items: [
        { name: "MC Authority", status: "ok" },
        { name: "USDOT Active", status: "ok" },
        { name: "Hazmat Authority", status: "ok" },
      ],
    },
    {
      id: "insurance",
      name: "Insurance",
      score: 8,
      maxScore: 10,
      status: "warning",
      icon: <FileCheck className="w-4 h-4 text-yellow-400" />,
      items: [
        { name: "Liability ($1M)", status: "ok" },
        { name: "Cargo ($100K)", status: "expiring", daysUntilExpiry: 45 },
        { name: "General Liability", status: "ok" },
      ],
    },
    {
      id: "safety",
      name: "Safety Rating",
      score: 9,
      maxScore: 10,
      status: "compliant",
      icon: <AlertTriangle className="w-4 h-4 text-green-400" />,
      items: [
        { name: "FMCSA Rating", status: "ok" },
        { name: "CSA Scores", status: "ok" },
        { name: "Out of Service Rate", status: "ok" },
      ],
    },
    {
      id: "vehicles",
      name: "Vehicle Compliance",
      score: 7,
      maxScore: 10,
      status: "warning",
      icon: <Truck className="w-4 h-4 text-yellow-400" />,
      items: [
        { name: "Annual Inspections", status: "expiring", daysUntilExpiry: 20 },
        { name: "Registrations", status: "ok" },
        { name: "IFTA Current", status: "ok" },
      ],
    },
  ];
}

export default ComplianceScore;
