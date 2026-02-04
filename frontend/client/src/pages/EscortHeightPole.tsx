/**
 * ESCORT HEIGHT POLE PAGE
 * 100% Dynamic - Height pole clearance verification for oversize loads
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import {
  Ruler, AlertTriangle, CheckCircle, MapPin, Camera,
  ChevronLeft, Navigation, Clock, ArrowUp, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortHeightPole() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/escort/height/:jobId");
  const jobId = params?.jobId;

  const [currentReading, setCurrentReading] = useState("");
  const [location, setLocation] = useState("");

  const jobQuery = trpc.escorts.getJob.useQuery({ jobId: jobId || "" });
  const obstaclesQuery = trpc.escorts.getRouteObstacles.useQuery({ jobId: jobId || "" });
  const readingsQuery = trpc.escorts.getHeightReadings.useQuery({ jobId: jobId || "" });

  const submitReadingMutation = trpc.escorts.submitHeightReading.useMutation({
    onSuccess: () => {
      toast.success("Reading recorded");
      setCurrentReading("");
      setLocation("");
      readingsQuery.refetch();
    },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const job = jobQuery.data;
  const obstacles = obstaclesQuery.data || [];
  const readings = readingsQuery.data || [];

  const loadHeight = job?.loadDimensions?.height || 0;
  const clearanceRequired = loadHeight + 0.5; // 6 inches safety margin

  if (jobQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/escort/job/${jobId}`)}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Height Pole
          </h1>
          <p className="text-slate-400 text-sm mt-1">Clearance Verification</p>
        </div>
      </div>

      {/* Load Height Info */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-yellow-500/20">
                <ArrowUp className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Load Height</p>
                <p className="text-4xl font-bold text-white">{loadHeight}' {((loadHeight % 1) * 12).toFixed(0)}"</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Min Clearance Required</p>
              <p className="text-2xl font-bold text-yellow-400">{clearanceRequired.toFixed(1)}' </p>
              <p className="text-slate-400 text-xs">(includes 6" safety margin)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record New Reading */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-cyan-400" />
            Record Height Reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Clearance Height (feet)</label>
              <Input
                type="number"
                step="0.1"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                placeholder="e.g., 14.5"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Location/Obstacle</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Bridge on I-35"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
          </div>

          {currentReading && (
            <div className={cn(
              "p-4 rounded-lg flex items-center gap-3",
              parseFloat(currentReading) >= clearanceRequired
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            )}>
              {parseFloat(currentReading) >= clearanceRequired ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium">CLEAR</p>
                    <p className="text-slate-300 text-sm">
                      {(parseFloat(currentReading) - loadHeight).toFixed(1)}' clearance above load
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="text-red-400 font-medium">OBSTRUCTION</p>
                    <p className="text-slate-300 text-sm">
                      Insufficient clearance - need {(clearanceRequired - parseFloat(currentReading)).toFixed(1)}' more
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-slate-700/50 border-slate-600/50 rounded-lg">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <Button
              onClick={() => submitReadingMutation.mutate({
                jobId: jobId!,
                height: parseFloat(currentReading),
                location,
                isClear: parseFloat(currentReading) >= clearanceRequired,
              })}
              disabled={!currentReading || !location || submitReadingMutation.isPending}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Record Reading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Known Obstacles */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Known Obstacles Ahead
          </CardTitle>
        </CardHeader>
        <CardContent>
          {obstaclesQuery.isLoading ? (
            <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : obstacles.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-slate-400">No known obstacles on route</p>
            </div>
          ) : (
            <div className="space-y-3">
              {obstacles.map((obs: any) => (
                <div
                  key={obs.id}
                  className={cn(
                    "p-4 rounded-lg border",
                    obs.clearance >= clearanceRequired
                      ? "bg-green-500/5 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {obs.clearance >= clearanceRequired ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">{obs.name}</p>
                        <p className="text-slate-400 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{obs.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-lg",
                        obs.clearance >= clearanceRequired ? "text-green-400" : "text-red-400"
                      )}>
                        {obs.clearance}'
                      </p>
                      <p className="text-slate-400 text-xs">{obs.distance} mi ahead</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Readings */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {readings.length === 0 ? (
            <div className="text-center py-8">
              <Ruler className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No readings recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {readings.map((reading: any) => (
                <div key={reading.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-3">
                    {reading.isClear ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{reading.location}</p>
                      <p className="text-slate-400 text-sm">{reading.recordedAt}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "font-bold",
                    reading.isClear ? "text-green-400" : "text-red-400"
                  )}>
                    {reading.height}'
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
