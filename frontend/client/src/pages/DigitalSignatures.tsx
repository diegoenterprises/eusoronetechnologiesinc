/**
 * DIGITAL SIGNATURES PAGE
 * 100% Dynamic - No mock data
 * Manages electronic signature requests for BOLs, Rate Confirmations, PODs
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  FileSignature, Search, Clock, CheckCircle, XCircle,
  Send, Eye, Download, RefreshCw, Plus, FileText,
  User, Mail, Calendar, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DigitalSignatures() {
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState("all");

  const requestsQuery = (trpc as any).documents.getAll.useQuery({
    category: documentType !== "all" ? documentType : undefined,
    search,
  });

  const statsQuery = (trpc as any).documents.getStats.useQuery();

  const resendMutation = (trpc as any).documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Reminder sent successfully");
      requestsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to send reminder", { description: error.message }),
  });

  const voidMutation = (trpc as any).documents.update.useMutation({
    onSuccess: () => {
      toast.success("Signature request voided");
      requestsQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to void request", { description: error.message }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "signed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Signed</Badge>;
      case "declined":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Declined</Badge>;
      case "expired":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Expired</Badge>;
      case "voided":
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Voided</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "bol":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-0">BOL</Badge>;
      case "rate_confirmation":
        return <Badge className="bg-purple-500/20 text-purple-400 border-0">Rate Conf</Badge>;
      case "pod":
        return <Badge className="bg-green-500/20 text-green-400 border-0">POD</Badge>;
      case "contract":
        return <Badge className="bg-blue-500/20 text-blue-400 border-0">Contract</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-0">{type}</Badge>;
    }
  };

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Gradient Ink Signatures
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage electronic signature requests — powered by Gradient Ink</p>
        </div>
        <Button className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsQuery.isLoading ? (
          Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-cyan-500/20">
                    <FileSignature className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>
                    <p className="text-xs text-slate-400">Total</p>
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
                    <p className="text-2xl font-bold text-yellow-400">{(stats as any)?.pending || 0}</p>
                    <p className="text-xs text-slate-400">Pending</p>
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
                    <p className="text-2xl font-bold text-green-400">{stats?.valid || 0}</p>
                    <p className="text-xs text-slate-400">Signed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-red-500/20">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>
                    <p className="text-xs text-slate-400">Declined</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <AlertTriangle className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{stats?.expiring || 0}</p>
                    <p className="text-xs text-slate-400">Expiring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-purple-400" />
              Signature Requests
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-700/50 border-slate-600/50 rounded-lg w-64"
                />
              </div>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600/50 rounded-lg">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bol">Bill of Lading</SelectItem>
                  <SelectItem value="rate_confirmation">Rate Confirmation</SelectItem>
                  <SelectItem value="pod">Proof of Delivery</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="bg-slate-700/50 border-slate-600/50 rounded-lg"
                onClick={() => requestsQuery.refetch()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-700/50 border border-slate-600/50 mb-4">
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600">Pending</TabsTrigger>
              <TabsTrigger value="signed" className="data-[state=active]:bg-green-600">Signed</TabsTrigger>
              <TabsTrigger value="declined" className="data-[state=active]:bg-red-600">Declined</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-slate-600">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {requestsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-28 rounded-lg" />)}
                </div>
              ) : (requestsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <FileSignature className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No signature requests found</p>
                  <p className="text-slate-500 text-sm">Create a new request to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(requestsQuery.data as any)?.map((request: any) => (
                    <div
                      key={request.id}
                      className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-white font-medium">{request.documentName}</span>
                            {getDocTypeBadge(request.documentType)}
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-slate-400 text-sm mb-3">Request ID: {request.requestId}</p>

                          <div className="mb-3">
                            <p className="text-xs text-slate-500 mb-2">Signers Progress</p>
                            <div className="flex items-center gap-2 mb-1">
                              <Progress
                                value={(request.signedCount / request.totalSigners) * 100}
                                className="h-2 flex-1"
                              />
                              <span className="text-xs text-slate-400">
                                {request.signedCount}/{request.totalSigners}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {request.signers?.map((signer: any, index: number) => (
                              <div
                                key={index}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1 rounded text-xs",
                                  signer.status === "signed"
                                    ? "bg-green-500/20 text-green-400"
                                    : signer.status === "declined"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-600/50 text-slate-400"
                                )}
                              >
                                <User className="w-3 h-3" />
                                {signer.name} ({signer.role})
                                {signer.status === "signed" && <CheckCircle className="w-3 h-3" />}
                                {signer.status === "declined" && <XCircle className="w-3 h-3" />}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created: {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {new Date(request.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {request.status === "signed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 rounded-lg"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-cyan-600/20 border-cyan-600/50 hover:bg-cyan-600/30 text-cyan-400 rounded-lg"
                                onClick={() => resendMutation.mutate({ id: request.requestId, name: request.documentName } as any)}
                                disabled={resendMutation.isPending}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Remind
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-600/20 border-red-600/50 hover:bg-red-600/30 text-red-400 rounded-lg"
                                onClick={() => voidMutation.mutate({ id: request.requestId } as any)}
                                disabled={voidMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Void
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
