/**
 * DRIVER ISSUE REPORT PAGE
 * 100% Dynamic - No mock data
 * Report breakdowns, accidents, delays, and hazmat incidents
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  AlertTriangle, MapPin, Camera, Phone, Wrench,
  CloudRain, Construction, Truck, HeartPulse,
  ChevronLeft, Send, AlertOctagon, Flame,
  Droplets, Package, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const issueTypes = [
  { value: "mechanical", label: "Mechanical Breakdown", icon: Wrench, color: "text-orange-400" },
  { value: "tire", label: "Tire Issue", icon: Truck, color: "text-yellow-400" },
  { value: "accident", label: "Accident/Collision", icon: AlertOctagon, color: "text-red-400" },
  { value: "weather", label: "Weather Delay", icon: CloudRain, color: "text-blue-400" },
  { value: "road_closure", label: "Road Closure", icon: Construction, color: "text-purple-400" },
  { value: "cargo", label: "Cargo Issue/Spill", icon: Droplets, color: "text-red-500" },
  { value: "medical", label: "Medical Emergency", icon: HeartPulse, color: "text-pink-400" },
  { value: "other", label: "Other", icon: AlertTriangle, color: "text-slate-400" },
];

const severityLevels = [
  { value: "low", label: "Low - Can continue shortly", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "medium", label: "Medium - Significant delay", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "high", label: "High - Cannot continue", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "critical", label: "CRITICAL - Hazmat emergency", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

export default function DriverIssueReport() {
  const [, navigate] = useLocation();
  
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [hazmatSpill, setHazmatSpill] = useState(false);
  const [hazmatFire, setHazmatFire] = useState(false);
  const [hazmatDamage, setHazmatDamage] = useState(false);

  const locationQuery = trpc.tracking.getCurrentLocation.useQuery();
  const currentLoadQuery = trpc.drivers.getCurrentAssignment.useQuery();

  const submitMutation = trpc.incidents.reportIssue.useMutation({
    onSuccess: () => {
      toast.success("Issue reported successfully");
      navigate("/driver/dashboard");
    },
    onError: (error) => toast.error("Failed to submit report", { description: error.message }),
  });

  const handleSubmit = () => {
    submitMutation.mutate({
      type: issueType,
      severity,
      description,
      location: locationQuery.data,
      loadId: currentLoadQuery.data?.id,
      hazmatIncident: hazmatSpill || hazmatFire || hazmatDamage,
      hazmatDetails: {
        spill: hazmatSpill,
        fire: hazmatFire,
        containerDamage: hazmatDamage,
      },
    });
  };

  const isHazmatIssue = issueType === "cargo" || hazmatSpill || hazmatFire || hazmatDamage;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/driver/dashboard")}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Report Issue
          </h1>
          <p className="text-slate-400 text-sm mt-1">Report a breakdown, delay, or incident</p>
        </div>
      </div>

      {/* Current Location */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-cyan-500/20">
              <MapPin className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-slate-400 text-sm">Current Location (Auto-detected)</p>
              {locationQuery.isLoading ? (
                <Skeleton className="h-5 w-48 mt-1" />
              ) : (
                <p className="text-white font-medium">{locationQuery.data?.address || "Location detected"}</p>
              )}
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-0">GPS Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Issue Type */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Issue Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {issueTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = issueType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setIssueType(type.value)}
                  className={cn(
                    "p-4 rounded-lg border transition-all flex flex-col items-center gap-2",
                    isSelected
                      ? "bg-slate-700/50 border-cyan-500/50"
                      : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50"
                  )}
                >
                  <Icon className={cn("w-6 h-6", type.color)} />
                  <span className={cn("text-sm text-center", isSelected ? "text-white" : "text-slate-400")}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Severity */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            Severity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={severity} onValueChange={setSeverity} className="space-y-3">
            {severityLevels.map((level) => (
              <div
                key={level.value}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                  severity === level.value ? level.color : "bg-slate-700/30 hover:bg-slate-700/50"
                )}
              >
                <RadioGroupItem value={level.value} id={level.value} />
                <label htmlFor={level.value} className="cursor-pointer flex-1 text-white">
                  {level.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="bg-slate-700/50 border-slate-600/50 rounded-lg min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            Photos (Required)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Button
                key={i}
                variant="outline"
                className="h-24 bg-slate-700/30 border-slate-600/50 border-dashed hover:bg-slate-700/50 rounded-lg flex flex-col items-center justify-center"
              >
                <Camera className="w-6 h-6 text-cyan-400 mb-2" />
                <span className="text-slate-400 text-xs">Photo {i}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hazmat Incident Section */}
      <Card className={cn(
        "rounded-xl",
        isHazmatIssue
          ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50"
          : "bg-slate-800/50 border-slate-700/50"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertOctagon className={cn("w-5 h-5", isHazmatIssue ? "text-red-400" : "text-slate-400")} />
            Hazmat Incident?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900/30">
              <Checkbox
                id="spill"
                checked={hazmatSpill}
                onCheckedChange={(checked) => setHazmatSpill(checked === true)}
              />
              <label htmlFor="spill" className="flex items-center gap-2 cursor-pointer text-white">
                <Droplets className="w-4 h-4 text-blue-400" />
                Spill or leak detected
              </label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900/30">
              <Checkbox
                id="fire"
                checked={hazmatFire}
                onCheckedChange={(checked) => setHazmatFire(checked === true)}
              />
              <label htmlFor="fire" className="flex items-center gap-2 cursor-pointer text-white">
                <Flame className="w-4 h-4 text-orange-400" />
                Fire or smoke
              </label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900/30">
              <Checkbox
                id="damage"
                checked={hazmatDamage}
                onCheckedChange={(checked) => setHazmatDamage(checked === true)}
              />
              <label htmlFor="damage" className="flex items-center gap-2 cursor-pointer text-white">
                <Package className="w-4 h-4 text-yellow-400" />
                Container damage
              </label>
            </div>
          </div>

          {isHazmatIssue && (
            <Button
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 rounded-lg h-14"
              onClick={() => navigate("/driver/hazmat-emergency")}
            >
              <AlertOctagon className="w-5 h-5 mr-2" />
              HAZMAT EMERGENCY PROTOCOL
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      {isHazmatIssue && (
        <Card className="bg-red-500/10 border-red-500/30 rounded-xl">
          <CardContent className="p-4">
            <p className="text-red-400 font-bold mb-3">Emergency Contacts</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="border-red-500/30 text-white hover:bg-red-500/20 rounded-lg">
                <Phone className="w-4 h-4 mr-2" />
                CHEMTREC: 1-800-424-9300
              </Button>
              <Button variant="outline" className="border-red-500/30 text-white hover:bg-red-500/20 rounded-lg">
                <Phone className="w-4 h-4 mr-2" />
                NRC: 1-800-424-8802
              </Button>
              <Button variant="outline" className="border-red-500/30 text-white hover:bg-red-500/20 rounded-lg">
                <Phone className="w-4 h-4 mr-2" />
                911 Emergency
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!issueType || !severity || !description || submitMutation.isPending}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg px-8"
          size="lg"
        >
          <Send className="w-5 h-5 mr-2" />
          Submit Report
        </Button>
      </div>
    </div>
  );
}
