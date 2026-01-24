/**
 * CARRIER VETTING DETAILS PAGE
 * Comprehensive carrier verification for brokers
 * Based on 03_BROKER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, FileText,
  Truck, Users, Star, MapPin, Phone, Mail, Building, Calendar,
  ExternalLink, RefreshCw, Award, TrendingUp, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VettingChecklist {
  id: string;
  name: string;
  status: "verified" | "pending" | "failed" | "not_checked";
  source: string;
  verifiedAt?: string;
  expiresAt?: string;
  notes?: string;
}

interface CarrierProfile {
  id: string;
  name: string;
  mcNumber: string;
  dotNumber: string;
  status: "active" | "pending" | "suspended" | "inactive";
  saferScore: number;
  insuranceExpiry: string;
  fleetSize: number;
  yearsInBusiness: number;
  rating: number;
  completedLoads: number;
  onTimeRate: number;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export default function CarrierVettingDetails() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock carrier data - would come from route params in real app
  const carrier: CarrierProfile = {
    id: "carr_001",
    name: "ABC Transport LLC",
    mcNumber: "MC-123456",
    dotNumber: "DOT-7891011",
    status: "active",
    saferScore: 92,
    insuranceExpiry: "2025-06-15",
    fleetSize: 45,
    yearsInBusiness: 8,
    rating: 4.7,
    completedLoads: 1250,
    onTimeRate: 96,
    contact: {
      name: "John Smith",
      phone: "(555) 123-4567",
      email: "john@abctransport.com",
    },
    address: {
      street: "123 Trucking Way",
      city: "Houston",
      state: "TX",
      zip: "77001",
    },
  };

  const vettingChecklist: VettingChecklist[] = [
    { id: "mc", name: "MC Authority", status: "verified", source: "FMCSA SAFER", verifiedAt: "2025-01-20", notes: "Active authority since 2017" },
    { id: "dot", name: "DOT Number", status: "verified", source: "FMCSA SAFER", verifiedAt: "2025-01-20" },
    { id: "insurance_liability", name: "Liability Insurance ($1M)", status: "verified", source: "Certificate on file", verifiedAt: "2025-01-15", expiresAt: "2025-06-15" },
    { id: "insurance_cargo", name: "Cargo Insurance ($100K)", status: "verified", source: "Certificate on file", verifiedAt: "2025-01-15", expiresAt: "2025-06-15" },
    { id: "w9", name: "W-9 Form", status: "verified", source: "Document uploaded", verifiedAt: "2025-01-10" },
    { id: "operating_auth", name: "Operating Authority", status: "verified", source: "FMCSA SAFER", verifiedAt: "2025-01-20" },
    { id: "safety_rating", name: "Safety Rating", status: "verified", source: "FMCSA SMS", verifiedAt: "2025-01-20", notes: "Satisfactory rating" },
    { id: "csa_scores", name: "CSA BASIC Scores", status: "verified", source: "FMCSA SMS", verifiedAt: "2025-01-20", notes: "All categories below threshold" },
    { id: "hazmat_auth", name: "Hazmat Authority", status: "verified", source: "FMCSA SAFER", verifiedAt: "2025-01-20" },
    { id: "bond", name: "Surety Bond/Trust", status: "verified", source: "FMCSA SAFER", verifiedAt: "2025-01-20" },
    { id: "process_agent", name: "Process Agent (BOC-3)", status: "verified", source: "FMCSA SAFER", verifiedAt: "2025-01-20" },
    { id: "clearinghouse", name: "Clearinghouse Query", status: "pending", source: "Awaiting consent", notes: "Consent request sent 01/18" },
  ];

  const csaScores = [
    { category: "Unsafe Driving", score: 15, threshold: 65, percentile: 23 },
    { category: "HOS Compliance", score: 22, threshold: 65, percentile: 34 },
    { category: "Driver Fitness", score: 0, threshold: 80, percentile: 0 },
    { category: "Controlled Substances", score: 0, threshold: 80, percentile: 0 },
    { category: "Vehicle Maintenance", score: 18, threshold: 80, percentile: 28 },
    { category: "Hazmat Compliance", score: 5, threshold: 80, percentile: 8 },
    { category: "Crash Indicator", score: 12, threshold: 65, percentile: 18 },
  ];

  const recentLoads = [
    { id: "load_001", date: "2025-01-18", origin: "Houston, TX", destination: "Dallas, TX", status: "delivered", onTime: true, rating: 5 },
    { id: "load_002", date: "2025-01-15", origin: "Dallas, TX", destination: "Austin, TX", status: "delivered", onTime: true, rating: 5 },
    { id: "load_003", date: "2025-01-12", origin: "San Antonio, TX", destination: "Houston, TX", status: "delivered", onTime: false, rating: 4 },
    { id: "load_004", date: "2025-01-08", origin: "Houston, TX", destination: "Corpus Christi, TX", status: "delivered", onTime: true, rating: 5 },
    { id: "load_005", date: "2025-01-05", origin: "Beaumont, TX", destination: "Houston, TX", status: "delivered", onTime: true, rating: 5 },
  ];

  const refreshVerification = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast.success("Verification data refreshed");
  };

  const approveCarrier = () => {
    toast.success("Carrier approved for load assignments");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "pending": return <Clock className="w-5 h-5 text-yellow-400" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "failed": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const verifiedCount = vettingChecklist.filter(v => v.status === "verified").length;
  const vettingProgress = (verifiedCount / vettingChecklist.length) * 100;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{carrier.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge className="bg-blue-500/20 text-blue-400">{carrier.mcNumber}</Badge>
            <Badge className="bg-slate-500/20 text-slate-400">{carrier.dotNumber}</Badge>
            <Badge className={cn(
              carrier.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
            )}>
              {carrier.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-600"
            onClick={refreshVerification}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh Data
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={approveCarrier}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Carrier
          </Button>
        </div>
      </div>

      {/* Vetting Progress */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-bold text-lg">Vetting Progress</p>
              <p className="text-slate-400 text-sm">{verifiedCount} of {vettingChecklist.length} checks completed</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">{Math.round(vettingProgress)}%</p>
              <p className="text-sm text-slate-400">Complete</p>
            </div>
          </div>
          <Progress value={vettingProgress} className="h-3 bg-slate-700" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{carrier.saferScore}</p>
                <p className="text-xs text-slate-400">SAFER Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{carrier.rating}</p>
                <p className="text-xs text-slate-400">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{carrier.onTimeRate}%</p>
                <p className="text-xs text-slate-400">On-Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Truck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{carrier.fleetSize}</p>
                <p className="text-xs text-slate-400">Fleet Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">Overview</TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-green-600">Vetting Checklist</TabsTrigger>
          <TabsTrigger value="csa" className="data-[state=active]:bg-green-600">CSA Scores</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">Load History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">{carrier.contact.name}</p>
                    <p className="text-xs text-slate-500">Primary Contact</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white">{carrier.contact.phone}</p>
                    <p className="text-xs text-slate-500">Phone</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white">{carrier.contact.email}</p>
                    <p className="text-xs text-slate-500">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-white">{carrier.address.street}</p>
                    <p className="text-slate-400 text-sm">
                      {carrier.address.city}, {carrier.address.state} {carrier.address.zip}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Years in Business</span>
                  <span className="text-white font-medium">{carrier.yearsInBusiness} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fleet Size</span>
                  <span className="text-white font-medium">{carrier.fleetSize} vehicles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed Loads</span>
                  <span className="text-white font-medium">{carrier.completedLoads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Insurance Expiry</span>
                  <span className="text-white font-medium">{carrier.insuranceExpiry}</span>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <Button variant="outline" className="w-full border-slate-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on FMCSA SAFER
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vetting Checklist Tab */}
        <TabsContent value="checklist" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Verification Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vettingChecklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      item.status === "verified" ? "bg-green-500/5 border border-green-500/20" :
                      item.status === "pending" ? "bg-yellow-500/5 border border-yellow-500/20" :
                      item.status === "failed" ? "bg-red-500/5 border border-red-500/20" :
                      "bg-slate-700/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.source}</p>
                        {item.notes && (
                          <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusBadge(item.status)}>
                        {item.status}
                      </Badge>
                      {item.verifiedAt && (
                        <p className="text-xs text-slate-500 mt-1">Verified: {item.verifiedAt}</p>
                      )}
                      {item.expiresAt && (
                        <p className="text-xs text-yellow-400 mt-1">Expires: {item.expiresAt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSA Scores Tab */}
        <TabsContent value="csa" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                CSA BASIC Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {csaScores.map((score) => {
                  const isAlert = score.score >= score.threshold;
                  return (
                    <div key={score.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{score.category}</span>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-bold",
                            isAlert ? "text-red-400" : "text-green-400"
                          )}>
                            {score.score}
                          </span>
                          <span className="text-slate-500 text-sm">
                            / {score.threshold} threshold
                          </span>
                          {isAlert && <AlertTriangle className="w-4 h-4 text-red-400" />}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={(score.score / score.threshold) * 100} 
                          className={cn(
                            "h-3",
                            isAlert ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"
                          )}
                        />
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
                          style={{ left: "100%" }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {score.percentile}th percentile nationally
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Load History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Load History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLoads.map((load) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        load.onTime ? "bg-green-500/20" : "bg-yellow-500/20"
                      )}>
                        <Truck className={cn(
                          "w-5 h-5",
                          load.onTime ? "text-green-400" : "text-yellow-400"
                        )} />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {load.origin} to {load.destination}
                        </p>
                        <p className="text-xs text-slate-500">{load.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={cn(
                        load.onTime ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {load.onTime ? "On Time" : "Late"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < load.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
