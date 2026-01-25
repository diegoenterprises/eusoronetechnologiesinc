/**
 * COMPANY DOCUMENTS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Upload, Download, Trash2, Eye,
  CheckCircle, AlertTriangle, Clock, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CompanyDocuments() {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const documentsQuery = trpc.companies.getDocuments.useQuery({ category: categoryFilter === "all" ? undefined : categoryFilter });
  const categoriesQuery = trpc.companies.getDocumentCategories.useQuery();

  const deleteMutation = trpc.companies.deleteDocument.useMutation({
    onSuccess: () => { toast.success("Document deleted"); documentsQuery.refetch(); },
    onError: (error) => toast.error("Failed to delete", { description: error.message }),
  });

  const getStatusBadge = (status: string, expiresAt?: string) => {
    if (status === "expired") return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
    if (status === "expiring_soon") return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expiring Soon</Badge>;
    if (status === "valid") return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
    return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Company Documents
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your company documents and certifications</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Upload className="w-4 h-4 mr-2" />Upload Document
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button variant={categoryFilter === "all" ? "default" : "outline"} size="sm" className={cn("rounded-lg", categoryFilter === "all" ? "bg-cyan-600" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setCategoryFilter("all")}>
          All
        </Button>
        {categoriesQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-lg" />)
        ) : (
          categoriesQuery.data?.map((category: any) => (
            <Button key={category.id} variant={categoryFilter === category.id ? "default" : "outline"} size="sm" className={cn("rounded-lg", categoryFilter === category.id ? "bg-cyan-600" : "bg-slate-700/50 border-slate-600/50")} onClick={() => setCategoryFilter(category.id)}>
              {category.name} ({category.count})
            </Button>
          ))
        )}
      </div>

      {/* Documents List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {documentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : documentsQuery.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-700/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No documents found</p>
              <p className="text-slate-500 text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {documentsQuery.data?.map((doc: any) => (
                <div key={doc.id} className={cn("p-4 hover:bg-slate-700/20 transition-colors", doc.status === "expired" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", doc.status === "valid" ? "bg-green-500/20" : doc.status === "expiring_soon" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                        <FileText className={cn("w-6 h-6", doc.status === "valid" ? "text-green-400" : doc.status === "expiring_soon" ? "text-yellow-400" : "text-red-400")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{doc.name}</p>
                          {getStatusBadge(doc.status)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{doc.category}</span>
                          <span>Uploaded: {doc.uploadedAt}</span>
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
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteMutation.mutate({ documentId: doc.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
