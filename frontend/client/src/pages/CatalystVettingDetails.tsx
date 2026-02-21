/**
 * CATALYST VETTING DETAILS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Building, Shield, Star, Truck, FileText, CheckCircle,
  XCircle, AlertTriangle, Clock, Phone, Mail, MapPin,
  Download, Eye, User, Calendar, TrendingUp, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CatalystVettingDetails() {
  const params = useParams<{ catalystId: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const catalystQuery = (trpc as any).catalysts.getById.useQuery({ id: params.catalystId || "" }, { enabled: !!params.catalystId });
  const csaQuery = (trpc as any).catalysts.getCSAScores.useQuery({ catalystId: params.catalystId || "" }, { enabled: !!params.catalystId });
  const insuranceQuery = (trpc as any).catalysts.getInsurance.useQuery({ catalystId: params.catalystId || "" }, { enabled: !!params.catalystId });
  const historyQuery = (trpc as any).catalysts.getLoadHistory.useQuery({ catalystId: params.catalystId || "" }, { enabled: !!params.catalystId });

  const approveMutation = (trpc as any).catalysts.approve.useMutation({
    onSuccess: () => { toast.success("Catalyst approved"); catalystQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const rejectMutation = (trpc as any).catalysts.reject.useMutation({
    onSuccess: () => { toast.info("Catalyst rejected"); catalystQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  if (catalystQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading catalyst</p>
        <Button className="mt-4" onClick={() => catalystQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const catalyst = catalystQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getCSAColor = (score: number) => {
    if (score <= 50) return "text-green-400";
    if (score <= 75) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
            <Building className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            {catalystQuery.isLoading ? <Skeleton className="h-8 w-48" /> : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{catalyst?.name}</h1>
                <Badge className={getStatusColor(catalyst?.vettingStatus || "")}>{catalyst?.vettingStatus}</Badge>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              {catalystQuery.isLoading ? <Skeleton className="h-6 w-48" /> : (
                <>
                  <Badge className="bg-blue-500/20 text-blue-400">{catalyst?.mcNumber}</Badge>
                  <Badge className="bg-slate-500/20 text-slate-400">{catalyst?.dotNumber}</Badge>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {catalyst?.vettingStatus === "pending" && (
            <>
              <Button variant="outline" className="border-red-500/50 text-red-400" onClick={() => params.catalystId && rejectMutation.mutate({ catalystId: params.catalystId })} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" />Reject</>}
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => params.catalystId && approveMutation.mutate({ catalystId: params.catalystId })} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Approve</>}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {catalystQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{catalyst?.saferScore || "N/A"}</p>
            )}
            <p className="text-xs text-slate-400">SAFER Score</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-400 fill-yellow-400" />
            {catalystQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{catalyst?.rating || 0}</p>
            )}
            <p className="text-xs text-slate-400">Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            <Truck className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {catalystQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{catalyst?.fleetSize || 0}</p>
            )}
            <p className="text-xs text-slate-400">Fleet Size</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {catalystQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{catalyst?.loadsCompleted || 0}</p>
            )}
            <p className="text-xs text-slate-400">Loads Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-slate-700">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            {catalystQuery.isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : (
              <p className="text-2xl font-bold text-orange-400">{catalyst?.yearsInBusiness || 0}</p>
            )}
            <p className="text-xs text-slate-400">Years in Business</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
          <TabsTrigger value="csa" className="data-[state=active]:bg-blue-600">CSA Scores</TabsTrigger>
          <TabsTrigger value="insurance" className="data-[state=active]:bg-blue-600">Insurance</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">Load History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/[0.02] border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Building className="w-5 h-5 text-blue-400" />Company Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {catalystQuery.isLoading ? (
                  [1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">Legal Name</span><span className="text-white">{catalyst?.legalName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">DBA</span><span className="text-white">{catalyst?.dba || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">MC Number</span><span className="text-white">{catalyst?.mcNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">DOT Number</span><span className="text-white">{catalyst?.dotNumber}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Authority Status</span><Badge className="bg-green-500/20 text-green-400">{catalyst?.authorityStatus}</Badge></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/[0.02] border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-green-400" />Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {catalystQuery.isLoading ? (
                  [1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-400" /><span className="text-white">{typeof catalyst?.address === "object" ? `${catalyst.address.street}, ${catalyst.address.city}, ${catalyst.address.state} ${catalyst.address.zip}` : catalyst?.address}</span></div>
                    <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span className="text-white">{catalyst?.phone}</span></div>
                    <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><span className="text-white">{catalyst?.email}</span></div>
                    <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><span className="text-white">{typeof catalyst?.primaryContact === "object" ? `${catalyst.primaryContact.name} - ${catalyst.primaryContact.phone}` : catalyst?.primaryContact}</span></div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="csa" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader><CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" />CSA BASIC Scores</CardTitle></CardHeader>
            <CardContent>
              {csaQuery.isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i: any) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(csaQuery.data as any)?.map((basic: any) => (
                    <div key={basic.category} className="p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm">{basic.category}</span>
                        <span className={cn("text-xl font-bold", getCSAColor(basic.score))}>{basic.score}%</span>
                      </div>
                      <Progress value={basic.score} className="h-2" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">Threshold: {basic.threshold}%</span>
                        {basic.score > basic.threshold ? (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">Alert</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">OK</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insuranceQuery.isLoading ? (
              [1, 2, 3].map((i: any) => <Card key={i} className="bg-white/[0.02] border-slate-700"><CardContent className="p-4"><Skeleton className="h-40 w-full" /></CardContent></Card>)
            ) : (
              (insuranceQuery.data as any)?.map((insurance: any) => (
                <Card key={insurance.type} className="bg-white/[0.02] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className={cn("w-5 h-5", insurance.type === "liability" ? "text-blue-400" : insurance.type === "cargo" ? "text-green-400" : "text-purple-400")} />
                      {insurance.type === "liability" ? "Liability" : insurance.type === "cargo" ? "Cargo" : "Workers Comp"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div><p className="text-xs text-slate-500">Catalyst</p><p className="text-white">{insurance.catalyst}</p></div>
                    <div><p className="text-xs text-slate-500">Policy Number</p><p className="text-white">{insurance.policyNumber}</p></div>
                    {insurance.coverage && <div><p className="text-xs text-slate-500">Coverage</p><p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${(insurance.coverage / 1000000).toFixed(1)}M</p></div>}
                    <div>
                      <p className="text-xs text-slate-500">Expires</p>
                      <p className="text-white">{insurance.expirationDate}</p>
                    </div>
                    <Badge className={insurance.verified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                      {insurance.verified ? "Verified" : "Pending Verification"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-white/[0.02] border-slate-700">
            <CardHeader><CardTitle className="text-white">Load History</CardTitle></CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : (historyQuery.data as any)?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No load history</p>
              ) : (
                <div className="space-y-3">
                  {(historyQuery.data as any)?.map((load: any) => (
                    <div key={load.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", load.status === "delivered" ? "bg-green-500/20" : "bg-blue-500/20")}>
                          <Truck className={cn("w-5 h-5", load.status === "delivered" ? "text-green-400" : "text-blue-400")} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{load.loadNumber}</p>
                          <p className="text-sm text-slate-400">{load.route}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent font-bold">${load.rate?.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{load.date}</p>
                        </div>
                        <Badge className={load.status === "delivered" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}>
                          {load.status}
                        </Badge>
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
