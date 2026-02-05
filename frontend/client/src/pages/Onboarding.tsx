/**
 * ONBOARDING PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  User, FileText, CheckCircle, Clock, Upload, ChevronRight,
  AlertTriangle, Shield, Truck, Award, Camera, Download,
  Eye, Send, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Onboarding() {
  const [activeTab, setActiveTab] = useState("progress");

  const progressQuery = (trpc as any).onboarding.getProgress.useQuery();
  const stepsQuery = (trpc as any).onboarding.getSteps.useQuery();
  const documentsQuery = (trpc as any).onboarding.getRequiredDocuments.useQuery();
  const applicantsQuery = (trpc as any).onboarding.getApplicants.useQuery();

  const completeStepMutation = (trpc as any).onboarding.completeStep.useMutation({
    onSuccess: () => { toast.success("Step completed"); progressQuery.refetch(); stepsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const uploadDocumentMutation = (trpc as any).onboarding.uploadDocument.useMutation({
    onSuccess: () => { toast.success("Document uploaded"); documentsQuery.refetch(); progressQuery.refetch(); },
    onError: (error: any) => toast.error("Upload failed", { description: error.message }),
  });

  const approveApplicantMutation = (trpc as any).onboarding.approveApplicant.useMutation({
    onSuccess: () => { toast.success("Applicant approved"); applicantsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (progressQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading onboarding data</p>
        <Button className="mt-4" onClick={() => progressQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const progress = progressQuery.data;

  const getStepIcon = (type: string) => {
    switch (type) {
      case "profile": return User;
      case "documents": return FileText;
      case "training": return Award;
      case "equipment": return Truck;
      case "verification": return Shield;
      default: return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-blue-500/20 text-blue-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Onboarding</h1>
          <p className="text-slate-400 text-sm">Complete your onboarding to start driving</p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm">Onboarding Progress</p>
              {progressQuery.isLoading ? <Skeleton className="h-10 w-24" /> : (
                <p className="text-4xl font-bold text-white">{progress?.percentage || 0}%</p>
              )}
            </div>
            <div className="text-right">
              {progressQuery.isLoading ? <Skeleton className="h-6 w-32" /> : (
                <>
                  <p className="text-white font-medium">{progress?.completedSteps || 0} of {progress?.totalSteps || 0} steps</p>
                  <p className="text-sm text-slate-400">Est. time remaining: {progress?.estimatedTimeRemaining || "N/A"}</p>
                </>
              )}
            </div>
          </div>
          <Progress value={progress?.percentage || 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {progressQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{progress?.completedSteps || 0}</p>
            )}
            <p className="text-xs text-slate-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {progressQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{progress?.inProgressSteps || 0}</p>
            )}
            <p className="text-xs text-slate-400">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {documentsQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{(documentsQuery.data as any)?.filter(d => d.status === "pending").length || 0}</p>
            )}
            <p className="text-xs text-slate-400">Docs Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {progressQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{progress?.trainingsCompleted || 0}</p>
            )}
            <p className="text-xs text-slate-400">Trainings Done</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="progress" className="data-[state=active]:bg-blue-600">My Progress</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600">Documents</TabsTrigger>
          <TabsTrigger value="applicants" className="data-[state=active]:bg-blue-600">Applicants</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Onboarding Steps</CardTitle></CardHeader>
            <CardContent>
              {stepsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : (
                <div className="space-y-4">
                  {(stepsQuery.data as any)?.map((step: any, idx: number) => {
                    const StepIcon = getStepIcon(step.type);
                    const isActive = step.status === "in_progress";
                    const isCompleted = step.status === "completed";

                    return (
                      <div key={step.id} className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-all",
                        isActive ? "bg-blue-500/10 border-blue-500/30" :
                        isCompleted ? "bg-green-500/10 border-green-500/30" : "bg-slate-700/30 border-slate-700"
                      )}>
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            isCompleted ? "bg-green-500/20" : isActive ? "bg-blue-500/20" : "bg-slate-700"
                          )}>
                            {isCompleted ? <CheckCircle className="w-5 h-5 text-green-400" /> : <StepIcon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-slate-500")} />}
                          </div>
                          {idx < ((stepsQuery.data as any)?.length || 0) - 1 && (
                            <div className={cn("w-0.5 h-8 mt-2", isCompleted ? "bg-green-500" : "bg-slate-700")} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={cn("font-medium", isCompleted ? "text-green-400" : isActive ? "text-white" : "text-slate-400")}>{step.title}</p>
                            <Badge className={getStatusColor(step.status)}>{step.status.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                          {step.estimatedTime && <p className="text-xs text-slate-600 mt-1">Est. time: {step.estimatedTime}</p>}
                        </div>

                        {isActive && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => completeStepMutation.mutate({ stepId: step.id })} disabled={completeStepMutation.isPending}>
                            {completeStepMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue<ChevronRight className="w-4 h-4 ml-1" /></>}
                          </Button>
                        )}
                        {isCompleted && <CheckCircle className="w-6 h-6 text-green-400" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Required Documents</CardTitle></CardHeader>
            <CardContent>
              {documentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (
                <div className="space-y-3">
                  {(documentsQuery.data as any)?.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          doc.status === "approved" ? "bg-green-500/20" :
                          doc.status === "pending" ? "bg-yellow-500/20" :
                          doc.status === "rejected" ? "bg-red-500/20" : "bg-slate-700"
                        )}>
                          <FileText className={cn(
                            "w-5 h-5",
                            doc.status === "approved" ? "text-green-400" :
                            doc.status === "pending" ? "text-yellow-400" :
                            doc.status === "rejected" ? "text-red-400" : "text-slate-500"
                          )} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{doc.name}</p>
                          <p className="text-sm text-slate-400">{doc.description}</p>
                          {doc.expirationDate && <p className="text-xs text-slate-500">Expires: {doc.expirationDate}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                        {doc.status === "not_uploaded" && (
                          <Button size="sm" variant="outline" className="border-slate-600">
                            <Upload className="w-4 h-4 mr-2" />Upload
                          </Button>
                        )}
                        {doc.status === "approved" && (
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        )}
                        {doc.status === "rejected" && (
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            <Upload className="w-4 h-4 mr-2" />Re-upload
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applicants" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Driver Applicants</CardTitle></CardHeader>
            <CardContent>
              {applicantsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i: any) => <Skeleton key={i} className="h-20 w-full" />)}</div>
              ) : (applicantsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No pending applicants</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(applicantsQuery.data as any)?.map((applicant: any) => (
                    <div key={applicant.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{applicant.name}</p>
                          <p className="text-sm text-slate-400">{applicant.email}</p>
                          <p className="text-xs text-slate-500">Applied: {applicant.appliedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-white">{applicant.progress}% Complete</p>
                          <Progress value={applicant.progress} className="h-1 w-24" />
                        </div>
                        <Badge className={getStatusColor(applicant.status)}>{applicant.status}</Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          {applicant.status === "pending" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approveApplicantMutation.mutate({ applicantId: applicant.id })} disabled={approveApplicantMutation.isPending}>
                              {approveApplicantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                            </Button>
                          )}
                        </div>
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
