/**
 * BROKER CARRIER ONBOARDING PAGE
 * 100% Dynamic - Manage carrier onboarding workflow
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
  UserPlus, Search, CheckCircle, Clock, FileText,
  Building, Phone, Mail, AlertTriangle, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrokerCarrierOnboarding() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const carriersQuery = trpc.brokers.getOnboardingCarriers.useQuery({ status: statusFilter });
  const statsQuery = trpc.brokers.getOnboardingStats.useQuery();

  const approveCarrierMutation = trpc.brokers.approveCarrier.useMutation({
    onSuccess: () => {
      toast.success("Carrier approved");
      carriersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const rejectCarrierMutation = trpc.brokers.rejectCarrier.useMutation({
    onSuccess: () => {
      toast.success("Carrier rejected");
      carriersQuery.refetch();
      statsQuery.refetch();
    },
  });

  const sendReminderMutation = trpc.brokers.sendOnboardingReminder.useMutation({
    onSuccess: () => toast.success("Reminder sent"),
  });

  const carriers = carriersQuery.data || [];
  const stats = statsQuery.data;

  const filteredCarriers = carriers.filter((c: any) =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.mcNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Carrier Onboarding
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage carrier onboarding and approval workflow</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Applications</span>
                </div>
                <p className="text-2xl font-bold text-white">{(stats?.pending || 0) + (stats?.inProgress || 0) + (stats?.completed || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Pending Review</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Docs Pending</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats?.inProgress || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Approved</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.completed || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Avg Time</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.avgCompletionDays || 0} days</p>
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
                placeholder="Search carriers..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="application">Application</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="verification">Verification</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Carriers List */}
      <div className="space-y-4">
        {carriersQuery.isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)
        ) : filteredCarriers.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="text-center py-16">
              <UserPlus className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No carriers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCarriers.map((carrier: any) => (
            <Card key={carrier.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-lg flex items-center justify-center",
                      carrier.status === "approved" ? "bg-green-500/20" :
                      carrier.status === "rejected" ? "bg-red-500/20" :
                      "bg-slate-600/50"
                    )}>
                      <Building className={cn(
                        "w-7 h-7",
                        carrier.status === "approved" ? "text-green-400" :
                        carrier.status === "rejected" ? "text-red-400" :
                        "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{carrier.companyName}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>MC# {carrier.mcNumber}</span>
                        <span className="text-slate-600">|</span>
                        <span>DOT# {carrier.dotNumber}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={cn(
                    "border-0",
                    carrier.status === "approved" ? "bg-green-500/20 text-green-400" :
                    carrier.status === "rejected" ? "bg-red-500/20 text-red-400" :
                    carrier.status === "review" ? "bg-purple-500/20 text-purple-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {carrier.status}
                  </Badge>
                </div>

                {/* Progress Steps */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">Onboarding Progress</span>
                    <span className="text-cyan-400 font-medium">{carrier.progress || 0}%</span>
                  </div>
                  <Progress value={carrier.progress || 0} className="h-2 bg-slate-700" />
                  <div className="flex justify-between mt-3">
                    {["Application", "Documents", "Verification", "Review", "Complete"].map((step, idx) => {
                      const stepNum = idx + 1;
                      const isComplete = carrier.currentStep > stepNum;
                      const isCurrent = carrier.currentStep === stepNum;
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                            isComplete ? "bg-green-500/20 text-green-400" :
                            isCurrent ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-400/50" :
                            "bg-slate-700 text-slate-500"
                          )}>
                            {isComplete ? <CheckCircle className="w-4 h-4" /> : stepNum}
                          </div>
                          <span className={cn(
                            "text-xs",
                            isComplete ? "text-green-400" :
                            isCurrent ? "text-cyan-400" :
                            "text-slate-500"
                          )}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 rounded-lg bg-slate-700/30">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Contact</p>
                    <p className="text-white font-medium">{carrier.contactName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Email</p>
                    <p className="text-slate-300 text-sm">{carrier.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Phone</p>
                    <p className="text-slate-300 text-sm">{carrier.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Applied</p>
                    <p className="text-slate-300 text-sm">{carrier.appliedAt}</p>
                  </div>
                </div>

                {/* Documents Status */}
                {carrier.documents && carrier.documents.length > 0 && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-xs mb-2">Required Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {carrier.documents.map((doc: any) => (
                        <Badge key={doc.name} className={cn(
                          "border-0 text-xs",
                          doc.status === "approved" ? "bg-green-500/20 text-green-400" :
                          doc.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          doc.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {doc.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {doc.status === "rejected" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {doc.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues */}
                {carrier.issues && carrier.issues.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium text-sm">Issues Found:</span>
                    </div>
                    <ul className="text-red-300 text-sm list-disc list-inside">
                      {carrier.issues.map((issue: string, idx: number) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {carrier.status !== "approved" && carrier.status !== "rejected" && (
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sendReminderMutation.mutate({ carrierId: carrier.id })}
                      className="text-slate-400"
                    >
                      <Mail className="w-4 h-4 mr-1" />Send Reminder
                    </Button>
                    {carrier.status === "review" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectCarrierMutation.mutate({ carrierId: carrier.id })}
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveCarrierMutation.mutate({ carrierId: carrier.id })}
                          className="bg-green-600 hover:bg-green-700 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />Approve
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
