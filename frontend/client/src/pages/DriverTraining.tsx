/**
 * DRIVER TRAINING PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, Search, Play, CheckCircle, Clock,
  Award, BookOpen, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverTraining() {
  const [searchTerm, setSearchTerm] = useState("");

  const coursesQuery = (trpc as any).training.getCourses.useQuery();
  const progressQuery = (trpc as any).training.getProgress.useQuery();
  const certificationsQuery = (trpc as any).training.getCertifications.useQuery({ limit: 5 });

  const startCourseMutation = (trpc as any).training.startCourse.useMutation({
    onSuccess: () => { toast.success("Course started"); coursesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to start course", { description: error.message }),
  });

  const progress = progressQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case "not_started": return <Badge className="bg-slate-500/20 text-slate-400 border-0">Not Started</Badge>;
      case "overdue": return <Badge className="bg-red-500/20 text-red-400 border-0">Overdue</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const filteredCourses = (coursesQuery.data as any)?.filter((course: any) =>
    !searchTerm || course.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Driver Training
        </h1>
        <p className="text-slate-400 text-sm mt-1">Complete required training and certifications</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {progressQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{progress?.totalCourses || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Courses</p>
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
                {progressQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{progress?.completed || 0}</p>
                )}
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {progressQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{progress?.certifications || 0}</p>
                )}
                <p className="text-xs text-slate-400">Certifications</p>
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
                {progressQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{progress?.hoursCompleted}h</p>
                )}
                <p className="text-xs text-slate-400">Hours Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium text-lg">Training Progress</p>
              <p className="text-slate-400 text-sm">{progress?.completed} of {progress?.totalCourses} courses completed</p>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{progress?.percentage}%</p>
          </div>
          <Progress value={progress?.percentage || 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search courses..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses */}
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              Available Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {coursesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : filteredCourses?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No courses found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredCourses?.map((course: any) => (
                  <div key={course.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", course.status === "overdue" && "bg-red-500/5 border-l-2 border-red-500")}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{course.title}</p>
                          {getStatusBadge(course.status)}
                          {course.required && <Badge className="bg-orange-500/20 text-orange-400 border-0">Required</Badge>}
                        </div>
                        <p className="text-sm text-slate-400">{course.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                        {course.dueDate && <span>Due: {course.dueDate}</span>}
                      </div>
                      {course.status === "not_started" ? (
                        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 rounded-lg" onClick={() => startCourseMutation.mutate({ courseId: course.id })}>
                          <Play className="w-3 h-3 mr-1" />Start
                        </Button>
                      ) : course.status === "in_progress" ? (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                          <Play className="w-3 h-3 mr-1" />Continue
                        </Button>
                      ) : null}
                    </div>
                    {course.status === "in_progress" && (
                      <Progress value={course.progress} className="h-1.5 mt-3" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="lg:col-span-1 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {certificationsQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : (certificationsQuery.data as any)?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No certifications yet</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(certificationsQuery.data as any)?.map((cert: any) => (
                  <div key={cert.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{cert.name}</p>
                        <p className="text-xs text-slate-500">Earned: {cert.earnedDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
