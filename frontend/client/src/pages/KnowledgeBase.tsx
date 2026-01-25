/**
 * KNOWLEDGE BASE PAGE
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
  Book, Search, FileText, Folder, ChevronRight,
  Clock, Eye, Bookmark, BookmarkCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const categoriesQuery = trpc.support.getKBCategories.useQuery();
  const articlesQuery = trpc.support.getKBArticles.useQuery({ categoryId: selectedCategory, search: searchQuery });
  const articleDetailQuery = trpc.support.getKBArticle.useQuery({ articleId: selectedArticle! }, { enabled: !!selectedArticle });
  const bookmarksQuery = trpc.support.getKBBookmarks.useQuery();

  const bookmarkMutation = trpc.support.toggleKBBookmark.useMutation({
    onSuccess: (data) => { toast.success(data.bookmarked ? "Bookmarked" : "Removed from bookmarks"); bookmarksQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const isBookmarked = (articleId: string) => bookmarksQuery.data?.some((b: any) => b.articleId === articleId);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-slate-400 text-sm mt-1">Browse documentation and guides</p>
        </div>
        {selectedArticle && (
          <Button variant="outline" className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg" onClick={() => setSelectedArticle(null)}>
            Back to Articles
          </Button>
        )}
      </div>

      {/* Search */}
      {!selectedArticle && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search knowledge base..." className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-lg h-12" />
        </div>
      )}

      {/* Article Detail */}
      {selectedArticle ? (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          {articleDetailQuery.isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-slate-700/50 text-slate-300 border-0 mb-2">{articleDetailQuery.data?.category}</Badge>
                    <CardTitle className="text-white text-2xl">{articleDetailQuery.data?.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />Updated: {articleDetailQuery.data?.updatedAt}</span>
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{articleDetailQuery.data?.views} views</span>
                    </div>
                  </div>
                  <Button variant="ghost" className={cn("text-slate-400 hover:text-yellow-400", isBookmarked(selectedArticle) && "text-yellow-400")} onClick={() => bookmarkMutation.mutate({ articleId: selectedArticle })}>
                    {isBookmarked(selectedArticle) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: articleDetailQuery.data?.content || "" }} />
              </CardContent>
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Folder className="w-5 h-5 text-cyan-400" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {categoriesQuery.isLoading ? (
                <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  <div className={cn("p-3 cursor-pointer transition-colors flex items-center justify-between", !selectedCategory && "bg-cyan-500/10 border-l-2 border-cyan-500")} onClick={() => setSelectedCategory(null)}>
                    <span className={cn("text-sm", !selectedCategory ? "text-cyan-400" : "text-slate-400")}>All Articles</span>
                    <Badge className="bg-slate-700/50 text-slate-300 border-0">{categoriesQuery.data?.reduce((acc: number, c: any) => acc + c.articleCount, 0)}</Badge>
                  </div>
                  {categoriesQuery.data?.map((category: any) => (
                    <div key={category.id} className={cn("p-3 cursor-pointer transition-colors flex items-center justify-between hover:bg-slate-700/20", selectedCategory === category.id && "bg-cyan-500/10 border-l-2 border-cyan-500")} onClick={() => setSelectedCategory(category.id)}>
                      <span className={cn("text-sm", selectedCategory === category.id ? "text-cyan-400" : "text-slate-400")}>{category.name}</span>
                      <Badge className="bg-slate-700/50 text-slate-300 border-0">{category.articleCount}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookmarks */}
              <div className="p-4 border-t border-slate-700/50">
                <p className="text-sm text-slate-500 mb-2 flex items-center gap-1"><Bookmark className="w-4 h-4" />Bookmarks</p>
                {bookmarksQuery.isLoading ? (
                  <Skeleton className="h-8 w-full rounded-lg" />
                ) : bookmarksQuery.data?.length === 0 ? (
                  <p className="text-xs text-slate-600">No bookmarks</p>
                ) : (
                  <div className="space-y-1">
                    {bookmarksQuery.data?.slice(0, 5).map((bookmark: any) => (
                      <div key={bookmark.articleId} className="text-xs text-slate-400 hover:text-cyan-400 cursor-pointer truncate" onClick={() => setSelectedArticle(bookmark.articleId)}>
                        {bookmark.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl md:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {articlesQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
              ) : articlesQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400">No articles found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {articlesQuery.data?.map((article: any) => (
                    <div key={article.id} className="p-4 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setSelectedArticle(article.id)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{article.title}</p>
                            <Badge className="bg-slate-700/50 text-slate-300 border-0 text-xs">{article.category}</Badge>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2">{article.excerpt}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.updatedAt}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.views} views</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
