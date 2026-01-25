/**
 * ESCORT CERTIFICATIONS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Award, CheckCircle, AlertTriangle, Clock, MapPin,
  Upload, FileText, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function EscortCertifications() {
  const certsQuery = trpc.escorts.getMyCertifications.useQuery();
  const statesQuery = trpc.escorts.getStateRequirements.useQuery();
  const statsQuery = trpc.escorts.getCertificationStats.useQuery();

  const uploadMutation = trpc.escorts.uploadCertification.useMutation({
    onSuccess: () => { toast.success("Certification uploaded"); certsQuery.refetch(); statsQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      case "pending": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Escort Certifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your state certifications</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Upload className="w-4 h-4 mr-2" />Upload New
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.valid || 0}</p>
                )}
                <p className="text-xs text-slate-400">Valid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{stats?.expiring || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <MapPin className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.statesCovered || 0}</p>
                )}
                <p className="text-xs text-slate-400">States</p>
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
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{stats?.reciprocity || 0}</p>
                )}
                <p className="text-xs text-slate-400">Reciprocity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Certifications */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            My Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certsQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : certsQuery.data?.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No certifications uploaded</p>
              <p className="text-sm text-slate-500 mt-1">Upload your state certifications to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {certsQuery.data?.map((cert: any) => (
                <div key={cert.id} className={cn("p-4 rounded-xl border", cert.status === "valid" ? "bg-green-500/5 border-green-500/30" : cert.status === "expiring" ? "bg-yellow-500/5 border-yellow-500/30" : cert.status === "expired" ? "bg-red-500/5 border-red-500/30" : "bg-slate-700/30 border-slate-600/50")}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-bold text-lg">{cert.state}</p>
                    {getStatusBadge(cert.status)}
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{cert.certNumber}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <Calendar className="w-3 h-3" />
                    <span>Expires: {cert.expiresAt}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                    <FileText className="w-4 h-4 mr-1" />View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* State Requirements */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            State Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {statesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {statesQuery.data?.map((state: any) => (
                <div key={state.code} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-bold", state.certified ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-400")}>
                      {state.code}
                    </div>
                    <div>
                      <p className="text-white font-medium">{state.name}</p>
                      <p className="text-xs text-slate-500">{state.requiresCert ? "Certification Required" : "No Certification Required"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {state.certified ? (
                      <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>
                    ) : state.reciprocityFrom ? (
                      <Badge className="bg-purple-500/20 text-purple-400 border-0">Reciprocity: {state.reciprocityFrom}</Badge>
                    ) : state.requiresCert ? (
                      <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                        <Upload className="w-4 h-4 mr-1" />Get Certified
                      </Button>
                    ) : (
                      <Badge className="bg-slate-500/20 text-slate-400 border-0">Not Required</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
