/**
 * ESCORT TRAINING PAGE
 * 100% Dynamic - Manage escort training and certifications
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  GraduationCap, CheckCircle, Clock, AlertTriangle,
  PlayCircle, FileText, Award, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EscortTraining() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const coursesQuery = (trpc as any).escorts.getAvailableJobs.useQuery({});
  const progressQuery = (trpc as any).escorts.getDashboardStats.useQuery();
  const certsQuery = (trpc as any).escorts.getCertifications.useQuery();

  const courses = coursesQuery.data || [];
  const progress = progressQuery.data as any;
  const certifications = certsQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Training Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Complete required training and certifications</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {progressQuery.isLoading ? (
          Array(3).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                  <span className="text-white font-medium">Overall Progress</span>
                </div>
                <Progress value={progress?.overallProgress || 0} className="h-3 mb-2" />
                <p className="text-purple-400 font-bold text-xl">{progress?.overallProgress || 0}% Complete</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-white font-medium">Completed</span>
                </div>
                <p className="text-green-400 font-bold text-2xl">{progress?.completedCourses || 0}</p>
                <p className="text-slate-400 text-sm">of {progress?.totalCourses || 0} courses</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-yellow-400" />
                  <span className="text-white font-medium">Certifications</span>
                </div>
                <p className="text-yellow-400 font-bold text-2xl">{certifications.length}</p>
                <p className="text-slate-400 text-sm">active certifications</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Active Certifications */}
      {certifications.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Your Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {certifications.map((cert: any) => (
                <div key={cert.id} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{cert.name}</p>
                    <Badge className={cn(
                      "border-0 text-xs",
                      cert.expiresIn <= 30 ? "bg-red-500/20 text-red-400" :
                      cert.expiresIn <= 90 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    )}>
                      {cert.expiresIn <= 0 ? "Expired" : `${cert.expiresIn}d left`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>Expires: {cert.expirationDate}</span>
                  </div>
                  {cert.states && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cert.states.slice(0, 5).map((state: string) => (
                        <Badge key={state} className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          {state}
                        </Badge>
                      ))}
                      {cert.states.length > 5 && (
                        <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                          +{cert.states.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Courses */}
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">Training Courses</h2>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="required">Required</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="regulations">Regulations</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {coursesQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No courses available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Card key={course.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <div className={cn(
                "h-2",
                course.status === "completed" ? "bg-green-500" :
                course.status === "in_progress" ? "bg-cyan-500" :
                course.required ? "bg-yellow-500" : "bg-slate-500"
              )} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={cn(
                    "border-0 text-xs",
                    course.required ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-500/20 text-slate-400"
                  )}>
                    {course.required ? "Required" : "Optional"}
                  </Badge>
                  {course.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>

                <h3 className="text-white font-bold text-lg mb-2">{course.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>

                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />{course.modulesCount} modules
                  </span>
                </div>

                {course.status === "in_progress" && (
                  <div className="mb-4">
                    <Progress value={course.progress} className="h-2" />
                    <p className="text-slate-400 text-xs mt-1">{course.progress}% complete</p>
                  </div>
                )}

                <Button
                  className={cn(
                    "w-full rounded-lg",
                    course.status === "completed" ? "bg-slate-600 hover:bg-slate-500" :
                    course.status === "in_progress" ? "bg-cyan-600 hover:bg-cyan-700" :
                    "bg-purple-600 hover:bg-purple-700"
                  )}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {course.status === "completed" ? "Review" :
                   course.status === "in_progress" ? "Continue" : "Start Course"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
