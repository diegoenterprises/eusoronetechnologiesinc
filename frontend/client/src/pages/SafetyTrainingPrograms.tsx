/**
 * SAFETY TRAINING PROGRAMS PAGE
 * 100% Dynamic - Manage safety training programs and curriculum
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Shield, Search, Plus, Users, Clock, CheckCircle,
  BookOpen, Video, FileText, PlayCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyTrainingPrograms() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const programsQuery = trpc.safety.getTrainingPrograms.useQuery({ category: categoryFilter });
  const statsQuery = trpc.safety.getTrainingProgramStats.useQuery();

  const programs = programsQuery.data || [];
  const stats = statsQuery.data;

  const filteredPrograms = programs.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Training Programs
          </h1>
          <p className="text-slate-400 text-sm mt-1">Safety training curriculum management</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Create Program
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Programs</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.totalPrograms || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Enrolled</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.totalEnrolled || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.totalCompleted || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Avg Duration</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.avgDuration || 0}h</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="defensive_driving">Defensive Driving</SelectItem>
                <SelectItem value="hazmat">Hazmat</SelectItem>
                <SelectItem value="hos">HOS Compliance</SelectItem>
                <SelectItem value="accident_prevention">Accident Prevention</SelectItem>
                <SelectItem value="csa">CSA Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {programsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No training programs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program: any) => (
            <Card key={program.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <div className={cn(
                "h-2",
                program.category === "hazmat" ? "bg-yellow-500" :
                program.category === "defensive_driving" ? "bg-cyan-500" :
                program.category === "hos" ? "bg-purple-500" : "bg-green-500"
              )} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      program.type === "video" ? "bg-purple-500/20" :
                      program.type === "interactive" ? "bg-cyan-500/20" : "bg-green-500/20"
                    )}>
                      {program.type === "video" ? (
                        <Video className="w-5 h-5 text-purple-400" />
                      ) : program.type === "interactive" ? (
                        <PlayCircle className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <Badge className={cn(
                      "border-0 text-xs",
                      program.required ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"
                    )}>
                      {program.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                    <Clock className="w-3 h-3 mr-1" />{program.duration}h
                  </Badge>
                </div>

                <h3 className="text-white font-bold text-lg mb-2">{program.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{program.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Completion Rate</span>
                    <span className="text-white font-medium">{program.completionRate}%</span>
                  </div>
                  <Progress value={program.completionRate} className="h-2" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />{program.enrolledCount} enrolled
                    </span>
                    <span className="text-slate-400">{program.modulesCount} modules</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded-lg">
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
