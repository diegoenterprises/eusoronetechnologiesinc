/**
 * TRAINING MANAGEMENT PAGE
 * Driver training and certification tracking
 * For Safety Managers and Compliance Officers
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, BookOpen, Clock, CheckCircle, AlertTriangle,
  Play, Award, Users, Calendar, Search, Filter, Plus,
  Video, FileText, Target, TrendingUp, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TrainingCourse {
  id: string;
  title: string;
  category: "safety" | "hazmat" | "compliance" | "equipment" | "customer_service";
  duration: number;
  requiredFor: string[];
  description: string;
  modules: number;
  passingScore: number;
}

interface DriverTraining {
  driverId: string;
  driverName: string;
  courseId: string;
  courseName: string;
  status: "not_started" | "in_progress" | "completed" | "expired";
  progress: number;
  score?: number;
  completedDate?: string;
  expirationDate?: string;
  dueDate?: string;
}

const MOCK_COURSES: TrainingCourse[] = [
  {
    id: "c1", title: "Hazmat Transportation Safety", category: "hazmat",
    duration: 120, requiredFor: ["DRIVER"], modules: 8, passingScore: 80,
    description: "Comprehensive hazmat handling and transportation procedures per 49 CFR 172-180",
  },
  {
    id: "c2", title: "Defensive Driving", category: "safety",
    duration: 90, requiredFor: ["DRIVER"], modules: 6, passingScore: 75,
    description: "Advanced defensive driving techniques for commercial vehicle operators",
  },
  {
    id: "c3", title: "Hours of Service Compliance", category: "compliance",
    duration: 60, requiredFor: ["DRIVER", "CATALYST"], modules: 4, passingScore: 85,
    description: "ELD regulations and HOS rules per 49 CFR 395",
  },
  {
    id: "c4", title: "Tank Vehicle Operations", category: "equipment",
    duration: 90, requiredFor: ["DRIVER"], modules: 5, passingScore: 80,
    description: "Safe operation of tank trailers including loading, unloading, and surge control",
  },
  {
    id: "c5", title: "Spill Response Procedures", category: "hazmat",
    duration: 45, requiredFor: ["DRIVER"], modules: 3, passingScore: 90,
    description: "Emergency response procedures for hazmat spills per ERG 2024",
  },
];

const MOCK_DRIVER_TRAINING: DriverTraining[] = [
  { driverId: "d1", driverName: "Mike Johnson", courseId: "c1", courseName: "Hazmat Transportation Safety", status: "completed", progress: 100, score: 92, completedDate: "2024-11-15", expirationDate: "2025-11-15" },
  { driverId: "d1", driverName: "Mike Johnson", courseId: "c2", courseName: "Defensive Driving", status: "in_progress", progress: 65, dueDate: "2025-02-01" },
  { driverId: "d1", driverName: "Mike Johnson", courseId: "c3", courseName: "Hours of Service Compliance", status: "completed", progress: 100, score: 88, completedDate: "2024-12-01", expirationDate: "2025-12-01" },
  { driverId: "d2", driverName: "Sarah Williams", courseId: "c1", courseName: "Hazmat Transportation Safety", status: "expired", progress: 100, score: 85, completedDate: "2024-01-10", expirationDate: "2025-01-10" },
  { driverId: "d2", driverName: "Sarah Williams", courseId: "c2", courseName: "Defensive Driving", status: "completed", progress: 100, score: 91, completedDate: "2024-10-20", expirationDate: "2026-10-20" },
  { driverId: "d3", driverName: "Tom Brown", courseId: "c1", courseName: "Hazmat Transportation Safety", status: "not_started", progress: 0, dueDate: "2025-02-15" },
  { driverId: "d3", driverName: "Tom Brown", courseId: "c4", courseName: "Tank Vehicle Operations", status: "in_progress", progress: 40, dueDate: "2025-01-31" },
];

const CATEGORY_CONFIG = {
  safety: { label: "Safety", color: "bg-green-500/20 text-green-400" },
  hazmat: { label: "Hazmat", color: "bg-orange-500/20 text-orange-400" },
  compliance: { label: "Compliance", color: "bg-blue-500/20 text-blue-400" },
  equipment: { label: "Equipment", color: "bg-purple-500/20 text-purple-400" },
  customer_service: { label: "Customer Service", color: "bg-cyan-500/20 text-cyan-400" },
};

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-slate-500/20 text-slate-400" },
  in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400" },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-400" },
  expired: { label: "Expired", color: "bg-red-500/20 text-red-400" },
};

export default function TrainingManagement() {
  const { user } = useAuth();
  const [courses] = useState<TrainingCourse[]>(MOCK_COURSES);
  const [driverTraining] = useState<DriverTraining[]>(MOCK_DRIVER_TRAINING);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"courses" | "assignments" | "reports">("assignments");

  const filteredCourses = courses.filter(c => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCategory !== "all" && c.category !== selectedCategory) return false;
    return true;
  });

  const stats = {
    totalDrivers: new Set(driverTraining.map(t => t.driverId)).size,
    completedThisMonth: driverTraining.filter(t => t.status === "completed").length,
    inProgress: driverTraining.filter(t => t.status === "in_progress").length,
    expired: driverTraining.filter(t => t.status === "expired").length,
    overdue: driverTraining.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Management</h1>
          <p className="text-slate-400 text-sm">Driver training and certification tracking</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Assign Training
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.totalDrivers}</p>
              <p className="text-xs text-slate-500">Active Drivers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">{stats.completedThisMonth}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-400">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">{stats.expired}</p>
              <p className="text-xs text-red-500/70">Expired</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-400">{stats.overdue}</p>
              <p className="text-xs text-yellow-500/70">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { id: "assignments", label: "Driver Assignments", icon: Users },
          { id: "courses", label: "Course Catalog", icon: BookOpen },
          { id: "reports", label: "Reports", icon: TrendingUp },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id ? "bg-blue-600" : ""}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "assignments" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Driver Training Status</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search driver..."
                    className="pl-10 w-64 bg-slate-700/50 border-slate-600"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Driver</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Course</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Progress</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Status</th>
                  <th className="text-left text-slate-400 text-xs font-medium p-4">Due/Expiry</th>
                  <th className="text-right text-slate-400 text-xs font-medium p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {driverTraining.map((training, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4">
                      <span className="text-white font-medium">{training.driverName}</span>
                    </td>
                    <td className="p-4 text-slate-300">{training.courseName}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 w-32">
                        <Progress value={training.progress} className="h-2" />
                        <span className="text-xs text-slate-400">{training.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={STATUS_CONFIG[training.status].color}>
                        {STATUS_CONFIG[training.status].label}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {training.expirationDate ? (
                        <span className={new Date(training.expirationDate) < new Date() ? "text-red-400" : ""}>
                          Expires: {new Date(training.expirationDate).toLocaleDateString()}
                        </span>
                      ) : training.dueDate ? (
                        <span className={new Date(training.dueDate) < new Date() ? "text-red-400" : ""}>
                          Due: {new Date(training.dueDate).toLocaleDateString()}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="p-4 text-right">
                      {training.status === "in_progress" && (
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Play className="w-3 h-3 mr-1" />
                          Resume
                        </Button>
                      )}
                      {training.status === "not_started" && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Start
                        </Button>
                      )}
                      {training.status === "expired" && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                          Renew
                        </Button>
                      )}
                      {training.status === "completed" && (
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Award className="w-3 h-3 mr-1" />
                          Certificate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-blue-600" : "border-slate-600"}
            >
              All
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={selectedCategory === key ? "bg-blue-600" : "border-slate-600"}
              >
                {config.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <Card key={course.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={CATEGORY_CONFIG[course.category].color}>
                      {CATEGORY_CONFIG[course.category].label}
                    </Badge>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {course.duration} min
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-2">{course.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{course.modules} modules</span>
                    <span>Pass: {course.passingScore}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Training reports and analytics coming soon</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
