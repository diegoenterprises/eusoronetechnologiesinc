/**
 * BOOKMARKS PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Bookmark, Search, Trash2, ExternalLink, Folder,
  Star, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ConfirmationDialog";
import { useLocation } from "wouter";

export default function Bookmarks() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const bookmarksQuery = (trpc as any).bookmarks.list.useQuery({ limit: 50 });
  const foldersQuery = (trpc as any).bookmarks.getFolders.useQuery();

  const deleteMutation = (trpc as any).bookmarks.delete.useMutation({
    onSuccess: () => { toast.success("Bookmark removed"); bookmarksQuery.refetch(); },
    onError: (error: any) => toast.error("Failed to remove", { description: error.message }),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "load": return "bg-blue-500/20 text-blue-400";
      case "driver": return "bg-green-500/20 text-green-400";
      case "catalyst": return "bg-purple-500/20 text-purple-400";
      case "report": return "bg-orange-500/20 text-orange-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const filteredBookmarks = (bookmarksQuery.data as any)?.filter((bookmark: any) =>
    !searchTerm || bookmark.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Bookmarks
        </h1>
        <p className="text-slate-400 text-sm mt-1">Your saved items and quick access links</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Bookmark className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {bookmarksQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{(bookmarksQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Total Bookmarks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {bookmarksQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{(bookmarksQuery.data as any)?.filter((b: any) => b.starred).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Starred</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Folder className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {foldersQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{(foldersQuery.data as any)?.length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {bookmarksQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{(bookmarksQuery.data as any)?.filter((b: any) => b.recentlyUsed).length || 0}</p>
                )}
                <p className="text-xs text-slate-400">Recently Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search bookmarks..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
      </div>

      {/* Bookmarks List */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardContent className="p-0">
          {bookmarksQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : filteredBookmarks?.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-white/[0.04] w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg">No bookmarks found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredBookmarks?.map((bookmark: any) => (
                <div key={bookmark.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                  <div className={cn("p-2 rounded-lg", getTypeColor(bookmark.type))}>
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="flex-1 cursor-pointer" onClick={() => setLocation(bookmark.path)}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{bookmark.title}</p>
                      {bookmark.starred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      <Badge className={cn(getTypeColor(bookmark.type), "border-0 text-xs")}>{bookmark.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-400">{bookmark.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setLocation(bookmark.path)}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setDeleteId(bookmark.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        itemName="this item"
        onConfirm={() => { if (deleteId) deleteMutation.mutate({ id: deleteId }); setDeleteId(null); }}
        isLoading={deleteMutation?.isPending}
      />
    </div>
  );
}
