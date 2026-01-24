/**
 * TRAINING MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BookOpen, Users, CheckCircle, Clock, AlertTriangle,
  Play, Award, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TrainingManagement() {
  const [activeTab, setActiveTab] = useState("courses");

  const summaryQuery = trpc.training.getSummary.useQuery();
  const coursesQuery = trpc.training.getCourses.useQuery();
  const driversQuery = trpc.training.getDriverTraining.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0">Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0">In Progress</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
      case "not_started": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Not Started</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "safety": return "bg-red-500/20 text-red-400";
      case "compliance": return "bg-purple-500/20 text-purple-400";
      case "hazmat": return "bg-orange-500/20 text-orange-400";
      case "defensive_driving": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Training Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage driver training and certifications</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <BookOpen className="w-4 h-4 mr-2" />Add Course
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.totalCourses || 0}</p>
                )}
                <p className="text-xs text-slate-400">Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{summary?.totalDrivers || 0}</p>
                )}
                <p className="text-xs text-slate-400">Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.completedTrainings || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{summary?.inProgress || 0}</p>
                )}
                <p className="text-xs text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.overdue || 0}</p>
                )}
                <p className="text-xs text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="courses" className="data-[state=active]:bg-slate-700 rounded-md">Courses</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-slate-700 rounded-md">Driver Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)
            ) : coursesQuery.data?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No courses available</p>
              </div>
            ) : (
              coursesQuery.data?.map((course) => (
                <Card key={course.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-medium mb-1">{course.title}</p>
                        <Badge className={cn("border-0", getCategoryColor(course.category))}>{course.category?.replace("_", " ")}</Badge>
                      </div>
                      {course.required && <Badge className="bg-red-500/20 text-red-400 border-0">Required</Badge>}
                    </div>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                      <span>{course.completedBy}/{course.assignedTo} completed</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 rounded-lg">
                        <Eye className="w-4 h-4 mr-1" />View
                      </Button>
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
                        <Play className="w-4 h-4 mr-1" />Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="pb-3"><CardTitle className="text-white text-lg">Driver Training Progress</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-slate-700/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">No driver training data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {driversQuery.data?.map((driver) => (
                    <div key={driver.id} className="p-4 rounded-xl bg-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-blue-500/20">
                            <Users className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.completedCourses}/{driver.totalCourses} courses completed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {driver.overdueCourses > 0 && (
                            <Badge className="bg-red-500/20 text-red-400 border-0">{driver.overdueCourses} overdue</Badge>
                          )}
                          <span className={cn("font-bold text-lg", driver.completionRate >= 90 ? "text-green-400" : driver.completionRate >= 70 ? "text-yellow-400" : "text-red-400")}>
                            {driver.completionRate}%
                          </span>
                        </div>
                      </div>
                      <Progress value={driver.completionRate} className="h-2 mb-3" />
                      <div className="flex flex-wrap gap-2">
                        {driver.courses?.slice(0, 4).map((course) => (
                          <span key={course.id}>{getStatusBadge(course.status)}</span>
                        ))}
                        {driver.courses?.length > 4 && (
                          <Badge className="bg-slate-500/20 text-slate-400 border-0">+{driver.courses.length - 4} more</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
