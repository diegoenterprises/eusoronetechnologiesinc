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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  FileText, Search, Upload, Download, Trash2,
  CheckCircle, Clock, AlertTriangle, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DocumentCenter() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const documentsQuery = (trpc as any).documents.getAll.useQuery({ search, category });
  const statsQuery = (trpc as any).documents.getStats.useQuery();
  const categoriesQuery = (trpc as any).documents.getCategories.useQuery();

  const deleteMutation = (trpc as any).documents.delete.useMutation({
    onSuccess: () => { toast.success("Document deleted"); documentsQuery.refetch(); statsQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case "expiring": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Expiring</Badge>;
      case "expired": return <Badge className="bg-red-500/20 text-red-400 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Document Center</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your documents</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Upload className="w-4 h-4 mr-2" />Upload
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.total || 0}</p>}<p className="text-xs text-slate-400">Total</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.valid || 0}</p>}<p className="text-xs text-slate-400">Valid</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><Clock className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.expiring || 0}</p>}<p className="text-xs text-slate-400">Expiring</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-red-400">{stats?.expired || 0}</p>}<p className="text-xs text-slate-400">Expired</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9 bg-slate-800/50 border-slate-700/50 rounded-lg" />
        </div>
        {categoriesQuery.isLoading ? <Skeleton className="h-10 w-[150px]" /> : (
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700/50 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(categoriesQuery.data as any)?.map((cat: any) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FolderOpen className="w-5 h-5 text-cyan-400" />Documents</CardTitle></CardHeader>
        <CardContent className="p-0">
          {documentsQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (documentsQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No documents found</p></div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {(documentsQuery.data as any)?.map((doc: any) => (
                <div key={doc.id} className={cn("p-4 flex items-center justify-between", doc.status === "expired" && "bg-red-500/5 border-l-2 border-red-500")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", doc.status === "valid" ? "bg-green-500/20" : doc.status === "expiring" ? "bg-yellow-500/20" : "bg-red-500/20")}>
                      <FileText className={cn("w-5 h-5", doc.status === "valid" ? "text-green-400" : doc.status === "expiring" ? "text-yellow-400" : "text-red-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{doc.name}</p>
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="text-sm text-slate-400">{doc.category}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Uploaded: {doc.uploadedAt}</span>
                        {doc.expiresAt && <span>Expires: {doc.expiresAt}</span>}
                        <span>{doc.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="bg-slate-700/50 border-slate-600/50 rounded-lg"><Download className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg" onClick={() => deleteMutation.mutate({ id: doc.id })}><Trash2 className="w-4 h-4" /></Button>
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
