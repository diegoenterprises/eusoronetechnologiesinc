/**
 * TRAINING MANAGEMENT PAGE
 * 100% Dynamic - No mock data
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
  Play, Award, Eye, Calendar, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TrainingManagement() {
  const [activeTab, setActiveTab] = useState("courses");

  const summaryQuery = trpc.training.getSummary.useQuery();
  const coursesQuery = trpc.training.getCourses.useQuery();
  const driversQuery = trpc.training.getDriverTraining.useQuery();

  const assignMutation = trpc.training.assignCourse.useMutation({
    onSuccess: () => { toast.success("Course assigned"); driversQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const summary = summaryQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-blue-500/20 text-blue-400";
      case "overdue": return "bg-red-500/20 text-red-400";
      case "not_started": return "bg-slate-500/20 text-slate-400";
      default: return "bg-slate-500/20 text-slate-400";
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Management</h1>
          <p className="text-slate-400 text-sm">Manage driver training and certifications</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <BookOpen className="w-4 h-4 mr-2" />Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalCourses || 0}</p>
            )}
            <p className="text-xs text-slate-400">Courses</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.totalDrivers || 0}</p>
            )}
            <p className="text-xs text-slate-400">Drivers</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.completedTrainings || 0}</p>
            )}
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.inProgress || 0}</p>
            )}
            <p className="text-xs text-slate-400">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.overdue || 0}</p>
            )}
            <p className="text-xs text-slate-400">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="courses" className="data-[state=active]:bg-blue-600">Courses</TabsTrigger>
          <TabsTrigger value="drivers" className="data-[state=active]:bg-blue-600">Driver Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesQuery.isLoading ? (
              [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 w-full" />)
            ) : coursesQuery.data?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No courses available</p>
              </div>
            ) : (
              coursesQuery.data?.map((course) => (
                <Card key={course.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">{course.title}</p>
                        <Badge className={getCategoryColor(course.category)}>{course.category?.replace("_", " ")}</Badge>
                      </div>
                      {course.required && <Badge className="bg-red-500/20 text-red-400">Required</Badge>}
                    </div>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                      <span>{course.completedBy}/{course.assignedTo} completed</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 border-slate-600"><Eye className="w-4 h-4 mr-1" />View</Button>
                      <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700"><Play className="w-4 h-4 mr-1" />Start</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Driver Training Progress</CardTitle></CardHeader>
            <CardContent>
              {driversQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : driversQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No driver training data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {driversQuery.data?.map((driver) => (
                    <div key={driver.id} className="p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.completedCourses}/{driver.totalCourses} courses completed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {driver.overdueCourses > 0 && (
                            <Badge className="bg-red-500/20 text-red-400">{driver.overdueCourses} overdue</Badge>
                          )}
                          <span className={cn("font-bold", driver.completionRate >= 90 ? "text-green-400" : driver.completionRate >= 70 ? "text-yellow-400" : "text-red-400")}>
                            {driver.completionRate}%
                          </span>
                        </div>
                      </div>
                      <Progress value={driver.completionRate} className="h-2 mb-3" />
                      <div className="flex flex-wrap gap-2">
                        {driver.courses?.slice(0, 4).map((course) => (
                          <Badge key={course.id} className={getStatusColor(course.status)}>
                            {course.title}
                          </Badge>
                        ))}
                        {driver.courses?.length > 4 && (
                          <Badge className="bg-slate-500/20 text-slate-400">+{driver.courses.length - 4} more</Badge>
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
