/**
 * ESCORT DASHBOARD PAGE
 * Dashboard for Pilot Car / Escort Vehicle Operators
 * Based on 06_ESCORT_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, DollarSign, Star, MapPin, Clock, Calendar,
  CheckCircle, AlertTriangle, Phone, Navigation, Shield,
  ChevronRight, FileText, Award, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EscortJob {
  id: string;
  jobNumber: string;
  loadDescription: string;
  carrier: string;
  route: {
    origin: string;
    destination: string;
    distance: number;
    states: string[];
  };
  schedule: {
    date: string;
    startTime: string;
    estimatedDuration: string;
  };
  position: "lead" | "chase" | "both";
  rate: number;
  status: "available" | "accepted" | "in_progress" | "completed";
  urgency: "normal" | "urgent";
  requirements: string[];
}

interface Certification {
  state: string;
  expirationDate: string;
  status: "valid" | "expiring" | "expired";
}

const STATS = {
  activeJobs: 2,
  upcoming: 5,
  completed: 127,
  earnings: {
    today: 450,
    week: 2850,
    month: 11200,
  },
  rating: 4.9,
  completionRate: 98,
};

const MOCK_JOBS: EscortJob[] = [
  {
    id: "j1",
    jobNumber: "ESC-4521",
    loadDescription: "Oversized wind turbine blade - 180ft",
    carrier: "Heavy Haul Express",
    route: { origin: "Houston, TX", destination: "Amarillo, TX", distance: 580, states: ["TX"] },
    schedule: { date: "Jan 24, 2026", startTime: "06:00 AM", estimatedDuration: "12 hours" },
    position: "lead",
    rate: 850,
    status: "accepted",
    urgency: "normal",
    requirements: ["TX Certification", "Height Pole"],
  },
  {
    id: "j2",
    jobNumber: "ESC-4522",
    loadDescription: "Heavy machinery - 14ft wide",
    carrier: "ABC Oversize",
    route: { origin: "Dallas, TX", destination: "Oklahoma City, OK", distance: 210, states: ["TX", "OK"] },
    schedule: { date: "Jan 25, 2026", startTime: "05:00 AM", estimatedDuration: "6 hours" },
    position: "chase",
    rate: 520,
    status: "available",
    urgency: "urgent",
    requirements: ["TX Certification", "OK Certification"],
  },
  {
    id: "j3",
    jobNumber: "ESC-4518",
    loadDescription: "Modular home section - 16ft wide",
    carrier: "Wide Load Logistics",
    route: { origin: "San Antonio, TX", destination: "Austin, TX", distance: 80, states: ["TX"] },
    schedule: { date: "Jan 23, 2026", startTime: "07:00 AM", estimatedDuration: "3 hours" },
    position: "both",
    rate: 680,
    status: "in_progress",
    urgency: "normal",
    requirements: ["TX Certification"],
  },
];

const MOCK_CERTIFICATIONS: Certification[] = [
  { state: "Texas", expirationDate: "Dec 31, 2026", status: "valid" },
  { state: "Oklahoma", expirationDate: "Mar 15, 2026", status: "expiring" },
  { state: "Louisiana", expirationDate: "Aug 20, 2026", status: "valid" },
  { state: "New Mexico", expirationDate: "Jan 10, 2026", status: "expired" },
];

const POSITION_COLORS = {
  lead: "bg-blue-500/20 text-blue-400",
  chase: "bg-purple-500/20 text-purple-400",
  both: "bg-green-500/20 text-green-400",
};

const STATUS_COLORS = {
  available: "bg-green-500/20 text-green-400",
  accepted: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-emerald-500/20 text-emerald-400",
};

export default function EscortDashboard() {
  const [jobs] = useState<EscortJob[]>(MOCK_JOBS);
  const [certifications] = useState<Certification[]>(MOCK_CERTIFICATIONS);
  const [activeTab, setActiveTab] = useState("jobs");

  const handleAcceptJob = (jobId: string) => {
    toast.success("Job accepted!", {
      description: "You've been assigned to this escort job.",
    });
  };

  const handleStartJob = (jobId: string) => {
    toast.success("Job started!", {
      description: "Safe travels! Remember to check in at waypoints.",
    });
  };

  const availableJobs = jobs.filter(j => j.status === "available");
  const activeJobs = jobs.filter(j => j.status === "accepted" || j.status === "in_progress");
  const expiringCerts = certifications.filter(c => c.status === "expiring" || c.status === "expired");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escort Dashboard</h1>
          <p className="text-slate-400">Manage your pilot car jobs and certifications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-lg">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-yellow-400 font-bold">{STATS.rating}</span>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <MapPin className="w-4 h-4 mr-2" />
            Update Location
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Jobs</p>
                <p className="text-2xl font-bold text-blue-400">{STATS.activeJobs}</p>
              </div>
              <Car className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Upcoming</p>
                <p className="text-2xl font-bold text-yellow-400">{STATS.upcoming}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Completed</p>
                <p className="text-2xl font-bold text-green-400">{STATS.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Today</p>
                <p className="text-2xl font-bold text-green-400">${STATS.earnings.today}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">This Week</p>
                <p className="text-2xl font-bold text-white">${STATS.earnings.week.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Completion</p>
                <p className="text-2xl font-bold text-white">{STATS.completionRate}%</p>
              </div>
              <Award className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certification Alert */}
      {expiringCerts.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Certification Alerts</p>
                <div className="mt-2 space-y-1">
                  {expiringCerts.map((cert) => (
                    <p key={cert.state} className="text-sm text-slate-300">
                      <Badge className={cn(
                        "mr-2",
                        cert.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {cert.status === "expiring" ? "Expiring" : "Expired"}
                      </Badge>
                      {cert.state} certification - {cert.expirationDate}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="jobs">Available Jobs</TabsTrigger>
          <TabsTrigger value="active">My Jobs</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-green-400" />
                Available Escort Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No available jobs matching your certifications</p>
                  </div>
                ) : (
                  availableJobs.map((job) => (
                    <div key={job.id} className={cn(
                      "p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors",
                      job.urgency === "urgent" && "border border-yellow-500/50"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{job.jobNumber}</span>
                            <Badge className={POSITION_COLORS[job.position]}>
                              {job.position.toUpperCase()}
                            </Badge>
                            {job.urgency === "urgent" && (
                              <Badge className="bg-yellow-500/20 text-yellow-400">Urgent</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-300">{job.loadDescription}</p>
                          <p className="text-xs text-slate-500 mt-1">{job.carrier}</p>

                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.route.origin} → {job.route.destination}
                            </span>
                            <span className="text-slate-400">{job.route.distance} mi</span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {job.schedule.date}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.schedule.startTime}
                            </span>
                            <span className="text-slate-400">{job.schedule.estimatedDuration}</span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.requirements.map((req, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] text-slate-400">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-green-400">${job.rate}</p>
                          <p className="text-xs text-slate-500">flat rate</p>
                          <Button 
                            onClick={() => handleAcceptJob(job.id)}
                            className="mt-3 bg-green-600 hover:bg-green-700"
                          >
                            Accept Job
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-400" />
                My Active & Upcoming Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-lg bg-slate-700/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{job.jobNumber}</span>
                          <Badge className={STATUS_COLORS[job.status]}>
                            {job.status.replace("_", " ")}
                          </Badge>
                          <Badge className={POSITION_COLORS[job.position]}>
                            {job.position.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300">{job.loadDescription}</p>
                        <p className="text-xs text-slate-500 mt-1">{job.carrier}</p>

                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className="text-slate-400">
                            {job.route.origin} → {job.route.destination}
                          </span>
                          <span className="text-slate-400">{job.schedule.date} at {job.schedule.startTime}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="text-xl font-bold text-green-400 text-right">${job.rate}</p>
                        {job.status === "accepted" && (
                          <Button 
                            onClick={() => handleStartJob(job.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Navigation className="w-4 h-4 mr-1" />
                            Start Job
                          </Button>
                        )}
                        {job.status === "in_progress" && (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Check In
                            </Button>
                            <Button variant="outline" className="border-slate-600">
                              <Phone className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  State Certifications
                </CardTitle>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certifications.map((cert) => (
                  <Card key={cert.state} className={cn(
                    "bg-slate-700/30 border-slate-600",
                    cert.status === "expired" && "border-red-500/50",
                    cert.status === "expiring" && "border-yellow-500/50"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">{cert.state}</span>
                        <Badge className={cn(
                          cert.status === "valid" && "bg-green-500/20 text-green-400",
                          cert.status === "expiring" && "bg-yellow-500/20 text-yellow-400",
                          cert.status === "expired" && "bg-red-500/20 text-red-400"
                        )}>
                          {cert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        Expires: {cert.expirationDate}
                      </p>
                      {cert.status !== "valid" && (
                        <Button size="sm" variant="outline" className="w-full mt-3 border-slate-600">
                          Renew Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium">Reciprocity Information</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Some states have reciprocity agreements. Texas certification may be valid in 
                      neighboring states. Check state requirements before accepting cross-border jobs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
