/**
 * DOCUMENT CENTER PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Upload, Download, Eye, Trash2, Search,
  Folder, Clock, CheckCircle, AlertTriangle, Calendar,
  Shield, Truck, User, Building, Filter, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DocumentCenter() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const summaryQuery = trpc.documents.getSummary.useQuery();
  const documentsQuery = trpc.documents.list.useQuery({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: searchTerm || undefined,
  });
  const expiringQuery = trpc.documents.getExpiring.useQuery({ days: 30 });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => { toast.success("Document uploaded"); documentsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Upload failed", { description: error.message }),
  });

  const deleteMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { toast.success("Document deleted"); documentsQuery.refetch(); summaryQuery.refetch(); },
    onError: (error) => toast.error("Delete failed", { description: error.message }),
  });

  if (summaryQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading documents</p>
        <Button className="mt-4" onClick={() => summaryQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const summary = summaryQuery.data;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "compliance": return Shield;
      case "driver": return User;
      case "vehicle": return Truck;
      case "company": return Building;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid": return "bg-green-500/20 text-green-400";
      case "expiring": return "bg-yellow-500/20 text-yellow-400";
      case "expired": return "bg-red-500/20 text-red-400";
      case "pending": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Document Center</h1>
          <p className="text-slate-400 text-sm">Manage all your documents in one place</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-blue-400">{summary?.totalDocuments || 0}</p>
            )}
            <p className="text-xs text-slate-400">Total Documents</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-green-400">{summary?.valid || 0}</p>
            )}
            <p className="text-xs text-slate-400">Valid</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-yellow-400">{summary?.expiringSoon || 0}</p>
            )}
            <p className="text-xs text-slate-400">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-red-400">{summary?.expired || 0}</p>
            )}
            <p className="text-xs text-slate-400">Expired</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <Folder className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            {summaryQuery.isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
              <p className="text-2xl font-bold text-purple-400">{summary?.categories || 0}</p>
            )}
            <p className="text-xs text-slate-400">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Documents Alert */}
      {expiringQuery.data && expiringQuery.data.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />Documents Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expiringQuery.data.slice(0, 5).map((doc) => (
                <Badge key={doc.id} className="bg-yellow-500/20 text-yellow-400">
                  {doc.name} - {doc.daysUntilExpiry} days
                </Badge>
              ))}
              {expiringQuery.data.length > 5 && (
                <Badge className="bg-slate-500/20 text-slate-400">+{expiringQuery.data.length - 5} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search documents..." className="pl-9 bg-slate-700/50 border-slate-600" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {documentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : documentsQuery.data?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No documents found</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700"><Upload className="w-4 h-4 mr-2" />Upload First Document</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {documentsQuery.data?.map((doc) => {
                const CategoryIcon = getCategoryIcon(doc.category);
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg", doc.status === "valid" ? "bg-green-500/20" : doc.status === "expiring" ? "bg-yellow-500/20" : doc.status === "expired" ? "bg-red-500/20" : "bg-blue-500/20")}>
                        <CategoryIcon className={cn("w-5 h-5", doc.status === "valid" ? "text-green-400" : doc.status === "expiring" ? "text-yellow-400" : doc.status === "expired" ? "text-red-400" : "text-blue-400")} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{doc.name}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span>{doc.category}</span>
                          <span>{doc.fileType}</span>
                          <span>{doc.fileSize}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {doc.expirationDate && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Expires</p>
                          <p className={cn("text-sm", doc.status === "expired" ? "text-red-400" : doc.status === "expiring" ? "text-yellow-400" : "text-slate-400")}>{doc.expirationDate}</p>
                        </div>
                      )}
                      <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ documentId: doc.id })} disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-400" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
