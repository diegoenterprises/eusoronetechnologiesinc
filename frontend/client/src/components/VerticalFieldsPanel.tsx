/**
 * VERTICAL FIELDS PANEL (GAP-274-339 Task 4.2)
 * Dynamically renders industry-vertical-specific fields inside the Load Creation Wizard.
 * Fetches vertical config from industryVerticals tRPC router and renders custom fields,
 * compliance warnings, required documents checklist, and pricing factor badges.
 */

import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle, FileText, DollarSign, Shield, CheckCircle, Info,
  Package, Snowflake, Truck, Droplets, Car, Layers, Weight,
  Home, Mountain, Container,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const VERTICAL_ICONS: Record<string, React.ReactNode> = {
  Package: <Package className="w-5 h-5" />,
  Snowflake: <Snowflake className="w-5 h-5" />,
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
  Droplets: <Droplets className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Container: <Container className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  Weight: <Weight className="w-5 h-5" />,
  Beef: <Package className="w-5 h-5" />,
  Mountain: <Mountain className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
};

interface VerticalFieldsPanelProps {
  selectedVertical: string;
  onVerticalChange: (verticalId: string) => void;
  verticalData: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
  compact?: boolean;
}

export function VerticalSelector({
  selectedVertical,
  onVerticalChange,
}: {
  selectedVertical: string;
  onVerticalChange: (v: string) => void;
}) {
  const verticalsQuery = (trpc as any).industryVerticals?.getAll?.useQuery?.() || { data: null, isLoading: false, isError: false };
  const verticals: any[] = verticalsQuery.data || [];

  if (verticalsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-slate-300 text-xs">Industry Vertical</Label>
        <Skeleton className="h-10 w-full bg-slate-700/50" />
      </div>
    );
  }

  if (verticalsQuery.isError || verticals.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-slate-300 text-xs font-medium">Industry Vertical</Label>
        <p className="text-xs text-slate-500">Industry verticals are loading. You can skip this step and configure later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-slate-300 text-xs font-medium">Industry Vertical</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {verticals.map((v: any) => (
          <button
            key={v.id}
            onClick={() => onVerticalChange(v.id)}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-xs",
              selectedVertical === v.id
                ? "bg-blue-500/20 border-blue-500 text-blue-300"
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
            )}
          >
            <span className="shrink-0">{VERTICAL_ICONS[v.icon] || <Package className="w-4 h-4" />}</span>
            <span className="truncate font-medium">{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function VerticalFieldsPanel({
  selectedVertical,
  onVerticalChange,
  verticalData,
  onFieldChange,
  compact = false,
}: VerticalFieldsPanelProps) {
  const verticalQuery = (trpc as any).industryVerticals?.getVertical?.useQuery?.(
    { verticalId: selectedVertical },
    { enabled: !!selectedVertical, staleTime: 300_000 }
  ) || { data: null, isLoading: false };

  const vertical: any = verticalQuery.data;

  const renderField = useCallback((field: any) => {
    const value = verticalData[field.key];

    switch (field.type) {
      case "text":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-slate-300 text-xs">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              value={value || ""}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder || ""}
              className="bg-slate-700/50 border-slate-600 text-white text-sm h-9"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-slate-300 text-xs">
              {field.label} {field.unit && <span className="text-slate-500">({field.unit})</span>} {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              type="number"
              value={value ?? ""}
              onChange={(e) => onFieldChange(field.key, e.target.value ? Number(e.target.value) : "")}
              placeholder={field.placeholder || ""}
              className="bg-slate-700/50 border-slate-600 text-white text-sm h-9"
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-slate-300 text-xs">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Select value={value || ""} onValueChange={(v) => onFieldChange(field.key, v)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white text-sm h-9">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "boolean":
        return (
          <div key={field.key} className="flex items-center space-x-2 p-2 rounded bg-slate-700/20">
            <Checkbox
              id={`vf-${field.key}`}
              checked={value ?? field.defaultValue ?? false}
              onCheckedChange={(c) => onFieldChange(field.key, c as boolean)}
            />
            <Label htmlFor={`vf-${field.key}`} className="text-xs text-slate-300 cursor-pointer">
              {field.label}
            </Label>
          </div>
        );

      case "date":
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-slate-300 text-xs">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
              type="date"
              value={value || ""}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white text-sm h-9"
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-1 col-span-2">
            <Label className="text-slate-300 text-xs">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </Label>
            <Textarea
              value={value || ""}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder || ""}
              className="bg-slate-700/50 border-slate-600 text-white text-sm"
              rows={2}
            />
          </div>
        );

      default:
        return null;
    }
  }, [verticalData, onFieldChange]);

  if (!selectedVertical) {
    return (
      <VerticalSelector selectedVertical={selectedVertical} onVerticalChange={onVerticalChange} />
    );
  }

  if (verticalQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 bg-slate-700/50" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 bg-slate-700/50" />
          <Skeleton className="h-10 bg-slate-700/50" />
          <Skeleton className="h-10 bg-slate-700/50" />
          <Skeleton className="h-10 bg-slate-700/50" />
        </div>
      </div>
    );
  }

  if (!vertical) return null;

  return (
    <div className="space-y-4">
      {/* Vertical Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {VERTICAL_ICONS[vertical.icon] || <Package className="w-5 h-5 text-blue-400" />}
          <span className="text-sm font-semibold text-white">{vertical.name}</span>
          {vertical.temperatureControlled && (
            <Badge variant="outline" className="text-xs border-cyan-500/40 text-cyan-400">Temp Controlled</Badge>
          )}
          {vertical.hazmatApplicable && (
            <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-400">Hazmat</Badge>
          )}
        </div>
        <button
          onClick={() => onVerticalChange("")}
          className="text-xs text-slate-500 hover:text-slate-300 underline"
        >
          Change
        </button>
      </div>

      {/* Custom Fields */}
      {vertical.customFields?.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> {vertical.name} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vertical.customFields.map((f: any) => renderField(f))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Warnings */}
      {!compact && vertical.complianceRules?.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Compliance Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1.5">
            {vertical.complianceRules.map((rule: any) => (
              <div
                key={rule.id}
                className={cn(
                  "flex items-start gap-2 p-2 rounded text-xs",
                  rule.severity === "critical" ? "bg-red-500/10 text-red-300" :
                  rule.severity === "high" ? "bg-orange-500/10 text-orange-300" :
                  "bg-slate-700/30 text-slate-400"
                )}
              >
                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{rule.regulation}</span>
                  <span className="mx-1">—</span>
                  <span>{rule.description}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Required Documents */}
      {!compact && vertical.requiredDocuments?.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {vertical.requiredDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className={cn("w-3 h-3 shrink-0", doc.required ? "text-red-400" : "text-slate-500")} />
                  <span>{doc.name}</span>
                  {doc.required && <span className="text-red-400 text-xs">Required</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Factors */}
      {!compact && vertical.pricingFactors?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <DollarSign className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-slate-400 mr-1">Pricing:</span>
          {vertical.pricingFactors.filter((f: any) => f.factor !== "base").map((f: any) => (
            <Badge key={f.factor} variant="outline" className="text-xs border-green-500/30 text-green-400">
              {f.description} ({((f.multiplier - 1) * 100).toFixed(0)}%)
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default VerticalFieldsPanel;
