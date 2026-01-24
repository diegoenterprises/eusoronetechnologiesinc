/**
 * ESCORT JOB MARKETPLACE
 * Job marketplace for escort/pilot car operators with state certifications
 * Based on 06_ESCORT_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Car, MapPin, Clock, DollarSign, Calendar, AlertTriangle,
  CheckCircle, Star, Phone, MessageSquare, Navigation,
  Filter, Search, ChevronRight, Shield, Award, Truck, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type JobStatus = "available" | "applied" | "accepted" | "in_progress" | "completed";
type JobUrgency = "standard" | "urgent" | "emergency";
type Position = "lead" | "chase" | "both";

interface EscortJob {
  id: string;
  title: string;
  status: JobStatus;
  urgency: JobUrgency;
  position: Position;
  carrier: {
    name: string;
    rating: number;
  };
  load: {
    description: string;
    dimensions: { length: number; width: number; height: number };
    weight: number;
  };
  route: {
    origin: { city: string; state: string };
    destination: { city: string; state: string };
    miles: number;
    estimatedHours: number;
    statesTraversed: string[];
  };
  schedule: {
    startDate: string;
    startTime: string;
    estimatedEndDate: string;
  };
  pay: {
    rate: number;
    rateType: "hourly" | "flat" | "per_mile";
    estimatedTotal: number;
  };
  requirements: string[];
  specialInstructions?: string;
}

interface Certification {
  state: string;
  stateName: string;
  status: "active" | "expired" | "pending";
  expirationDate: string;
  certNumber: string;
  reciprocity: string[];
}

const MOCK_JOBS: EscortJob[] = [
  {
    id: "job_001",
    title: "Wind Turbine Blade - Lead Car",
    status: "available",
    urgency: "standard",
    position: "lead",
    carrier: { name: "Oversized Logistics Inc", rating: 4.8 },
    load: {
      description: "Wind turbine blade, 180ft",
      dimensions: { length: 180, width: 14, height: 15 },
      weight: 45000,
    },
    route: {
      origin: { city: "Amarillo", state: "TX" },
      destination: { city: "Oklahoma City", state: "OK" },
      miles: 260,
      estimatedHours: 8,
      statesTraversed: ["TX", "OK"],
    },
    schedule: {
      startDate: "2025-01-25",
      startTime: "06:00",
      estimatedEndDate: "2025-01-25",
    },
    pay: {
      rate: 35,
      rateType: "hourly",
      estimatedTotal: 280,
    },
    requirements: ["TX Certification", "OK Certification", "Height pole required"],
  },
  {
    id: "job_002",
    title: "Mobile Home Transport - Chase Car",
    status: "available",
    urgency: "urgent",
    position: "chase",
    carrier: { name: "Wide Load Movers", rating: 4.5 },
    load: {
      description: "Single-wide mobile home",
      dimensions: { length: 76, width: 16, height: 14 },
      weight: 32000,
    },
    route: {
      origin: { city: "Houston", state: "TX" },
      destination: { city: "San Antonio", state: "TX" },
      miles: 200,
      estimatedHours: 6,
      statesTraversed: ["TX"],
    },
    schedule: {
      startDate: "2025-01-24",
      startTime: "05:00",
      estimatedEndDate: "2025-01-24",
    },
    pay: {
      rate: 450,
      rateType: "flat",
      estimatedTotal: 450,
    },
    requirements: ["TX Certification", "Flags and signs"],
  },
  {
    id: "job_003",
    title: "Transformer - Lead & Chase",
    status: "available",
    urgency: "emergency",
    position: "both",
    carrier: { name: "Heavy Haul Specialists", rating: 4.9 },
    load: {
      description: "Electrical transformer unit",
      dimensions: { length: 45, width: 18, height: 16 },
      weight: 180000,
    },
    route: {
      origin: { city: "Beaumont", state: "TX" },
      destination: { city: "Shreveport", state: "LA" },
      miles: 185,
      estimatedHours: 10,
      statesTraversed: ["TX", "LA"],
    },
    schedule: {
      startDate: "2025-01-24",
      startTime: "04:00",
      estimatedEndDate: "2025-01-24",
    },
    pay: {
      rate: 2.50,
      rateType: "per_mile",
      estimatedTotal: 925,
    },
    requirements: ["TX Certification", "LA Certification", "2 vehicles needed", "Night travel"],
    specialInstructions: "Police escort coordination required. Contact dispatch for details.",
  },
];

const MOCK_CERTIFICATIONS: Certification[] = [
  {
    state: "TX",
    stateName: "Texas",
    status: "active",
    expirationDate: "2025-12-31",
    certNumber: "TX-ESC-2024-4521",
    reciprocity: ["OK", "NM", "AR"],
  },
  {
    state: "OK",
    stateName: "Oklahoma",
    status: "active",
    expirationDate: "2025-06-30",
    certNumber: "OK-PV-2024-1234",
    reciprocity: ["TX", "KS", "AR"],
  },
  {
    state: "LA",
    stateName: "Louisiana",
    status: "expired",
    expirationDate: "2024-12-31",
    certNumber: "LA-PC-2023-5678",
    reciprocity: [],
  },
  {
    state: "NM",
    stateName: "New Mexico",
    status: "pending",
    expirationDate: "",
    certNumber: "Pending",
    reciprocity: [],
  },
];

const URGENCY_CONFIG = {
  standard: { color: "bg-slate-500/20 text-slate-400", label: "Standard" },
  urgent: { color: "bg-orange-500/20 text-orange-400", label: "Urgent" },
  emergency: { color: "bg-red-500/20 text-red-400", label: "Emergency" },
};

const POSITION_CONFIG = {
  lead: { color: "bg-blue-500/20 text-blue-400", label: "Lead Car" },
  chase: { color: "bg-purple-500/20 text-purple-400", label: "Chase Car" },
  both: { color: "bg-green-500/20 text-green-400", label: "Lead & Chase" },
};

export default function EscortJobMarketplace() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<EscortJob[]>(MOCK_JOBS);
  const [certifications] = useState<Certification[]>(MOCK_CERTIFICATIONS);
  const [selectedJob, setSelectedJob] = useState<EscortJob | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"jobs" | "certifications">("jobs");

  const getActiveCertStates = () => {
    return certifications
      .filter(c => c.status === "active")
      .flatMap(c => [c.state, ...c.reciprocity]);
  };

  const canAcceptJob = (job: EscortJob) => {
    const activeCerts = getActiveCertStates();
    return job.route.statesTraversed.every(state => activeCerts.includes(state));
  };

  const filteredJobs = jobs.filter(job => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!job.title.toLowerCase().includes(q) && 
          !job.route.origin.city.toLowerCase().includes(q) &&
          !job.route.destination.city.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterUrgency !== "all" && job.urgency !== filterUrgency) return false;
    if (filterPosition !== "all" && job.position !== filterPosition) return false;
    return true;
  });

  const handleApplyJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: "applied" as JobStatus } : job
    ));
    toast.success("Application submitted!");
    setSelectedJob(null);
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400";
      case "expired": return "bg-red-500/20 text-red-400";
      default: return "bg-yellow-500/20 text-yellow-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escort Job Marketplace</h1>
          <p className="text-slate-400 text-sm">Find pilot car and escort vehicle jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400">
            {certifications.filter(c => c.status === "active").length} Active Certs
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "jobs" ? "default" : "outline"}
          onClick={() => setActiveTab("jobs")}
          className={activeTab === "jobs" ? "bg-blue-600" : "border-slate-600"}
        >
          <Car className="w-4 h-4 mr-2" />
          Available Jobs
        </Button>
        <Button
          variant={activeTab === "certifications" ? "default" : "outline"}
          onClick={() => setActiveTab("certifications")}
          className={activeTab === "certifications" ? "bg-blue-600" : "border-slate-600"}
        >
          <Award className="w-4 h-4 mr-2" />
          My Certifications
        </Button>
      </div>

      {activeTab === "jobs" ? (
        <>
          {/* Filters */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search jobs..."
                      className="pl-10 bg-slate-700/50 border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
                  >
                    <option value="all">All Urgency</option>
                    <option value="standard">Standard</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm"
                  >
                    <option value="all">All Positions</option>
                    <option value="lead">Lead Car</option>
                    <option value="chase">Chase Car</option>
                    <option value="both">Lead & Chase</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const canAccept = canAcceptJob(job);
              return (
                <Card 
                  key={job.id}
                  className={cn(
                    "bg-slate-800/50 border-slate-700 cursor-pointer transition-colors hover:border-slate-500",
                    job.urgency === "emergency" && "border-l-4 border-l-red-500",
                    job.urgency === "urgent" && "border-l-4 border-l-orange-500"
                  )}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-bold">{job.title}</h3>
                        <p className="text-slate-400 text-sm">{job.carrier.name}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={URGENCY_CONFIG[job.urgency].color}>
                          {URGENCY_CONFIG[job.urgency].label}
                        </Badge>
                        <Badge className={POSITION_CONFIG[job.position].color}>
                          {POSITION_CONFIG[job.position].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{job.route.origin.city}, {job.route.origin.state}</span>
                      <ChevronRight className="w-4 h-4" />
                      <span>{job.route.destination.city}, {job.route.destination.state}</span>
                    </div>

                    {/* Load Info */}
                    <div className="p-3 rounded-lg bg-slate-700/30 mb-3">
                      <p className="text-slate-300 text-sm">{job.load.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.load.dimensions.length}'L x {job.load.dimensions.width}'W x {job.load.dimensions.height}'H
                        | {job.load.weight.toLocaleString()} lbs
                      </p>
                    </div>

                    {/* Schedule & Pay */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-slate-400">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(job.schedule.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-slate-400">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {job.route.estimatedHours}h
                        </div>
                      </div>
                      <div className="text-green-400 font-bold text-lg">
                        ${job.pay.estimatedTotal}
                      </div>
                    </div>

                    {/* State Certs Needed */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {job.route.statesTraversed.map((state) => {
                          const hasCert = getActiveCertStates().includes(state);
                          return (
                            <Badge 
                              key={state}
                              className={hasCert ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                            >
                              {state}
                            </Badge>
                          );
                        })}
                      </div>
                      {!canAccept && (
                        <span className="text-xs text-red-400">Missing certification</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* Certifications Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <Card key={cert.state} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg",
                      cert.status === "active" ? "bg-green-500/20 text-green-400" :
                      cert.status === "expired" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {cert.state}
                    </div>
                    <div>
                      <p className="text-white font-medium">{cert.stateName}</p>
                      <p className="text-xs text-slate-500">{cert.certNumber}</p>
                    </div>
                  </div>
                  <Badge className={getCertStatusColor(cert.status)}>
                    {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                  </Badge>
                </div>

                {cert.status === "active" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>Expires: {new Date(cert.expirationDate).toLocaleDateString()}</span>
                    </div>
                    
                    {cert.reciprocity.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Reciprocity States:</p>
                        <div className="flex gap-1 flex-wrap">
                          {cert.reciprocity.map((state) => (
                            <Badge key={state} className="bg-blue-500/20 text-blue-400">
                              {state}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {cert.status === "expired" && (
                  <Button size="sm" className="w-full mt-2 bg-orange-600 hover:bg-orange-700">
                    Renew Certification
                  </Button>
                )}

                {cert.status === "pending" && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-300">
                    Application in progress
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add New Certification */}
          <Card className="bg-slate-800/50 border-slate-700 border-dashed">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[200px]">
              <Award className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 text-center mb-3">Add New State Certification</p>
              <Button variant="outline" className="border-slate-600">
                Apply for Certification
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">{selectedJob.title}</CardTitle>
                  <p className="text-slate-400 text-sm">{selectedJob.carrier.name}</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedJob(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
              {/* Badges */}
              <div className="flex gap-2">
                <Badge className={URGENCY_CONFIG[selectedJob.urgency].color}>
                  {URGENCY_CONFIG[selectedJob.urgency].label}
                </Badge>
                <Badge className={POSITION_CONFIG[selectedJob.position].color}>
                  {POSITION_CONFIG[selectedJob.position].label}
                </Badge>
                <div className="ml-auto flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-white">{selectedJob.carrier.rating}</span>
                </div>
              </div>

              {/* Load Details */}
              <div className="p-4 rounded-lg bg-slate-700/30">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  Load Details
                </h4>
                <p className="text-slate-300">{selectedJob.load.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-slate-500">Dimensions</p>
                    <p className="text-white">
                      {selectedJob.load.dimensions.length}'L x {selectedJob.load.dimensions.width}'W x {selectedJob.load.dimensions.height}'H
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Weight</p>
                    <p className="text-white">{selectedJob.load.weight.toLocaleString()} lbs</p>
                  </div>
                </div>
              </div>

              {/* Route */}
              <div className="p-4 rounded-lg bg-slate-700/30">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  Route
                </h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-white">
                    {selectedJob.route.origin.city}, {selectedJob.route.origin.state}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-white">
                    {selectedJob.route.destination.city}, {selectedJob.route.destination.state}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-slate-500">Distance</p>
                    <p className="text-white">{selectedJob.route.miles} miles</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Est. Time</p>
                    <p className="text-white">{selectedJob.route.estimatedHours} hours</p>
                  </div>
                  <div>
                    <p className="text-slate-500">States</p>
                    <p className="text-white">{selectedJob.route.statesTraversed.join(", ")}</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-700/30">
                  <p className="text-slate-500 text-sm">Start Date</p>
                  <p className="text-white font-medium">
                    {new Date(selectedJob.schedule.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-slate-400">{selectedJob.schedule.startTime}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-slate-500 text-sm">Estimated Pay</p>
                  <p className="text-green-400 font-bold text-2xl">
                    ${selectedJob.pay.estimatedTotal}
                  </p>
                  <p className="text-slate-400 text-sm">
                    ${selectedJob.pay.rate} {selectedJob.pay.rateType === "hourly" ? "/hr" : 
                      selectedJob.pay.rateType === "per_mile" ? "/mi" : "flat"}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-white font-medium mb-2">Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requirements.map((req, i) => (
                    <Badge key={i} className="bg-slate-700 text-slate-300">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedJob.specialInstructions && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 text-sm font-medium mb-1">Special Instructions</p>
                  <p className="text-yellow-200 text-sm">{selectedJob.specialInstructions}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {canAcceptJob(selectedJob) ? (
                  <Button 
                    onClick={() => handleApplyJob(selectedJob.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply for Job
                  </Button>
                ) : (
                  <div className="flex-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                    <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <p className="text-red-300 text-sm">Missing required state certification</p>
                  </div>
                )}
                <Button variant="outline" className="border-slate-600">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
