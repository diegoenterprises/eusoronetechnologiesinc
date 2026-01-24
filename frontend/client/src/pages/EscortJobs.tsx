/**
 * ESCORT JOBS PAGE
 * Job marketplace and management for escort/pilot car operators
 * Based on 06_ESCORT_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car, MapPin, Clock, Calendar, DollarSign, Star, Shield,
  Phone, Navigation, CheckCircle, AlertTriangle, Filter,
  Search, ChevronRight, User, FileText, Award, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type JobStatus = "available" | "accepted" | "in_progress" | "completed" | "cancelled";
type Position = "lead" | "chase" | "both";

interface EscortJob {
  id: string;
  status: JobStatus;
  loadNumber: string;
  position: Position;
  route: {
    origin: string;
    destination: string;
    distance: number;
    estimatedHours: number;
  };
  schedule: {
    date: string;
    startTime: string;
    endTime?: string;
  };
  pay: {
    rate: number;
    rateType: "hourly" | "flat" | "mile";
    estimated: number;
  };
  carrier: {
    name: string;
    contact: string;
    phone: string;
  };
  requirements: {
    states: string[];
    heightPole: boolean;
    flags: boolean;
    radio: boolean;
  };
  urgency: "normal" | "urgent" | "critical";
  notes?: string;
}

interface Certification {
  state: string;
  status: "active" | "expired" | "pending";
  expiresAt: string;
  number: string;
}

export default function EscortJobs() {
  const [activeTab, setActiveTab] = useState("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("all");

  const certifications: Certification[] = [
    { state: "TX", status: "active", expiresAt: "2025-12-31", number: "TX-ESC-45821" },
    { state: "LA", status: "active", expiresAt: "2025-08-15", number: "LA-PIL-78452" },
    { state: "OK", status: "active", expiresAt: "2025-10-20", number: "OK-ESC-32145" },
    { state: "NM", status: "pending", expiresAt: "", number: "Pending" },
    { state: "AR", status: "expired", expiresAt: "2024-11-30", number: "AR-ESC-65478" },
  ];

  const availableJobs: EscortJob[] = [
    {
      id: "esc_001",
      status: "available",
      loadNumber: "LOAD-45860",
      position: "lead",
      route: { origin: "Houston, TX", destination: "Dallas, TX", distance: 240, estimatedHours: 5 },
      schedule: { date: "2025-01-24", startTime: "06:00" },
      pay: { rate: 45, rateType: "hourly", estimated: 225 },
      carrier: { name: "ABC Transport", contact: "John Smith", phone: "(555) 123-4567" },
      requirements: { states: ["TX"], heightPole: true, flags: true, radio: true },
      urgency: "normal",
    },
    {
      id: "esc_002",
      status: "available",
      loadNumber: "LOAD-45865",
      position: "both",
      route: { origin: "Beaumont, TX", destination: "Baton Rouge, LA", distance: 180, estimatedHours: 4 },
      schedule: { date: "2025-01-24", startTime: "08:00" },
      pay: { rate: 50, rateType: "hourly", estimated: 400 },
      carrier: { name: "XYZ Hauling", contact: "Mary Johnson", phone: "(555) 234-5678" },
      requirements: { states: ["TX", "LA"], heightPole: true, flags: true, radio: true },
      urgency: "urgent",
      notes: "Oversized load - 14ft wide",
    },
    {
      id: "esc_003",
      status: "available",
      loadNumber: "LOAD-45870",
      position: "chase",
      route: { origin: "San Antonio, TX", destination: "El Paso, TX", distance: 550, estimatedHours: 10 },
      schedule: { date: "2025-01-25", startTime: "05:00" },
      pay: { rate: 0.85, rateType: "mile", estimated: 467.50 },
      carrier: { name: "Heavy Haul Inc", contact: "Bob Wilson", phone: "(555) 345-6789" },
      requirements: { states: ["TX"], heightPole: false, flags: true, radio: true },
      urgency: "normal",
    },
    {
      id: "esc_004",
      status: "available",
      loadNumber: "LOAD-45875",
      position: "lead",
      route: { origin: "Dallas, TX", destination: "Oklahoma City, OK", distance: 210, estimatedHours: 4.5 },
      schedule: { date: "2025-01-24", startTime: "14:00" },
      pay: { rate: 400, rateType: "flat", estimated: 400 },
      carrier: { name: "Wide Load Express", contact: "Tim Davis", phone: "(555) 456-7890" },
      requirements: { states: ["TX", "OK"], heightPole: true, flags: true, radio: true },
      urgency: "critical",
      notes: "Super load - Needs immediate confirmation",
    },
  ];

  const myJobs: EscortJob[] = [
    {
      id: "esc_010",
      status: "accepted",
      loadNumber: "LOAD-45840",
      position: "lead",
      route: { origin: "Houston, TX", destination: "Austin, TX", distance: 165, estimatedHours: 3.5 },
      schedule: { date: "2025-01-24", startTime: "07:00" },
      pay: { rate: 45, rateType: "hourly", estimated: 157.50 },
      carrier: { name: "Texas Trucking Co", contact: "Lisa Brown", phone: "(555) 567-8901" },
      requirements: { states: ["TX"], heightPole: true, flags: true, radio: true },
      urgency: "normal",
    },
  ];

  const stats = {
    completedJobs: 156,
    earnings: 28450,
    rating: 4.9,
    activeStates: 3,
    pendingCerts: 1,
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "urgent": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  const getPositionBadge = (position: Position) => {
    switch (position) {
      case "lead": return "bg-blue-500/20 text-blue-400";
      case "chase": return "bg-purple-500/20 text-purple-400";
      case "both": return "bg-green-500/20 text-green-400";
    }
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const acceptJob = (jobId: string) => {
    toast.success("Job accepted!", {
      description: "Carrier has been notified",
    });
  };

  const filteredJobs = availableJobs.filter(job => {
    if (searchTerm && !job.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.route.destination.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterState !== "all" && !job.requirements.states.includes(filterState)) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escort Jobs</h1>
          <p className="text-slate-400 text-sm">Find and manage pilot car assignments</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <FileText className="w-4 h-4 mr-2" />
          My Certifications
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.completedJobs}</p>
            <p className="text-xs text-slate-400">Jobs Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">${stats.earnings.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <p className="text-2xl font-bold text-yellow-400">{stats.rating}</p>
            </div>
            <p className="text-xs text-slate-400">Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.activeStates}</p>
            <p className="text-xs text-slate-400">Active States</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.pendingCerts}</p>
            <p className="text-xs text-slate-400">Pending Certs</p>
          </CardContent>
        </Card>
      </div>

      {/* Certifications Quick View */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            State Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {certifications.map((cert) => (
              <Badge
                key={cert.state}
                className={cn("px-3 py-1", getCertStatusColor(cert.status))}
              >
                {cert.state} - {cert.status === "active" ? `Exp ${cert.expiresAt}` : cert.status}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="available" className="data-[state=active]:bg-purple-600">
            Available Jobs ({filteredJobs.length})
          </TabsTrigger>
          <TabsTrigger value="my-jobs" className="data-[state=active]:bg-purple-600">
            My Jobs ({myJobs.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
            History
          </TabsTrigger>
        </TabsList>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="mt-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by location..."
                className="pl-9 bg-slate-700/50 border-slate-600"
              />
            </div>
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="LA">Louisiana</SelectItem>
                <SelectItem value="OK">Oklahoma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={cn(
                  "bg-slate-800/50 border-slate-700 transition-all hover:border-slate-600",
                  job.urgency === "critical" && "border-red-500/50",
                  job.urgency === "urgent" && "border-orange-500/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getPositionBadge(job.position)}>
                          {job.position === "both" ? "Lead + Chase" : job.position.charAt(0).toUpperCase() + job.position.slice(1)}
                        </Badge>
                        <Badge className={getUrgencyColor(job.urgency)}>
                          {job.urgency !== "normal" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {job.urgency}
                        </Badge>
                        <span className="text-slate-500 text-sm">{job.loadNumber}</span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span className="text-white">{job.route.origin}</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="text-white">{job.route.destination}</span>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-6 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          {job.route.distance} mi
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          ~{job.route.estimatedHours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {job.schedule.date} @ {job.schedule.startTime}
                        </span>
                      </div>

                      {/* Requirements */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-slate-500">States:</span>
                        {job.requirements.states.map((state) => (
                          <Badge key={state} variant="outline" className="text-xs border-slate-600">
                            {state}
                          </Badge>
                        ))}
                        {job.requirements.heightPole && (
                          <Badge variant="outline" className="text-xs border-slate-600">Height Pole</Badge>
                        )}
                      </div>

                      {job.notes && (
                        <p className="text-xs text-yellow-400 mt-2">{job.notes}</p>
                      )}
                    </div>

                    {/* Pay & Actions */}
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-green-400">
                        ${job.pay.estimated.toFixed(0)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.pay.rateType === "hourly" && `$${job.pay.rate}/hr`}
                        {job.pay.rateType === "mile" && `$${job.pay.rate}/mi`}
                        {job.pay.rateType === "flat" && "Flat rate"}
                      </p>
                      <Button
                        className="mt-3 bg-purple-600 hover:bg-purple-700"
                        onClick={() => acceptJob(job.id)}
                      >
                        Accept Job
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Jobs Tab */}
        <TabsContent value="my-jobs" className="mt-6">
          {myJobs.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <Car className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No active jobs</p>
                <p className="text-sm text-slate-500 mt-1">Browse available jobs to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myJobs.map((job) => (
                <Card key={job.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className="bg-green-500/20 text-green-400">Accepted</Badge>
                          <Badge className={getPositionBadge(job.position)}>
                            {job.position.charAt(0).toUpperCase() + job.position.slice(1)}
                          </Badge>
                          <span className="text-slate-500 text-sm">{job.loadNumber}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="text-white">{job.route.origin}</span>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                          <MapPin className="w-4 h-4 text-red-400" />
                          <span className="text-white">{job.route.destination}</span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {job.schedule.date} @ {job.schedule.startTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {job.carrier.contact}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {job.carrier.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" className="border-slate-600">
                          <Phone className="w-4 h-4 mr-2" />
                          Call
                        </Button>
                        <Button variant="outline" className="border-slate-600">
                          <Navigation className="w-4 h-4 mr-2" />
                          Navigate
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Start Job
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Job history will appear here</p>
              <p className="text-sm text-slate-500 mt-1">Complete jobs to build your history</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
