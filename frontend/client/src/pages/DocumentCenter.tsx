/**
 * DOCUMENT CENTER PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, Upload, Download, Folder, Eye,
  Calendar, CheckCircle, AlertTriangle, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DocumentCenter() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const documentsQuery = trpc.documents.list.useQuery({ category: activeTab === "all" ? undefined : activeTab, limit: 50 });
  const summaryQuery = trpc.documents.getSummary.useQuery();

  const summary = summaryQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-green-500/20 text-green-400 border-0">Valid</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Expiring Soon</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0">Expired</Badge>;
      case "pending": return <Badge className="bg-blue-500/20 text-blue-400 border-0">Pending Review</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "insurance": return <FileText className="w-5 h-5 text-blue-400" />;
      case "license": return <FileText className="w-5 h-5 text-purple-400" />;
      case "registration": return <FileText className="w-5 h-5 text-cyan-400" />;
      case "compliance": return <FileText className="w-5 h-5 text-green-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredDocuments = documentsQuery.data?.filter((doc: any) =>
    !searchTerm || doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) || doc.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Document Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage all your documents in one place</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Upload className="w-4 h-4 mr-2" />Upload Document
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <Folder className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{summary?.total || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Documents</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{summary?.valid || 0}</p>
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
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{summary?.expiring || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                {summaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-red-400">{summary?.expired || 0}</p>
                )}
                <p className="text-xs text-slate-400">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search documents..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 rounded-md">All</TabsTrigger>
          <TabsTrigger value="insurance" className="data-[state=active]:bg-slate-700 rounded-md">Insurance</TabsTrigger>
          <TabsTrigger value="license" className="data-[state=active]:bg-slate-700 rounded-md">Licenses</TabsTrigger>
          <TabsTrigger value="registration" className="data-[state=active]:bg-slate-700 rounded-md">Registration</TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-slate-700 rounded-md">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardContent className="p-0">
              {documentsQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : filteredDocuments?.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-lg">No documents found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {filteredDocuments?.map((doc: any) => (
                    <div key={doc.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", doc.status === "expired" && "bg-red-500/5 border-l-2 border-red-500", doc.status === "expiring" && "bg-yellow-500/5 border-l-2 border-yellow-500")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", doc.status === "valid" ? "bg-green-500/20" : doc.status === "expiring" ? "bg-yellow-500/20" : doc.status === "expired" ? "bg-red-500/20" : "bg-blue-500/20")}>
                            {getCategoryIcon(doc.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium">{doc.name}</p>
                              {getStatusBadge(doc.status)}
                            </div>
                            <p className="text-sm text-slate-400">{doc.type}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Uploaded: {doc.uploadedAt}</span>
                              {doc.expiresAt && <span>Expires: {doc.expiresAt}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
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
