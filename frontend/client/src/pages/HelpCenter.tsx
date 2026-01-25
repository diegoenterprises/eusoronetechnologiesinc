/**
 * HELP CENTER PAGE
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
  HelpCircle, Search, Book, MessageCircle, FileText,
  ChevronRight, ExternalLink, ThumbsUp, ThumbsDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const categoriesQuery = trpc.support.getHelpCategories.useQuery();
  const articlesQuery = trpc.support.getPopularArticles.useQuery({ limit: 6 });
  const searchQuery_ = trpc.support.searchHelp.useQuery({ query: searchQuery }, { enabled: searchQuery.length > 2 });

  const feedbackMutation = trpc.support.submitArticleFeedback.useMutation({
    onSuccess: () => toast.success("Thanks for your feedback!"),
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Find answers and get support</p>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <HelpCircle className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <p className="text-white text-xl font-bold">How can we help you?</p>
          </div>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for help articles..." className="pl-10 bg-slate-800/50 border-slate-700/50 rounded-lg h-12" />
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery.length > 2 && (
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              Search Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {searchQuery_.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : searchQuery_.data?.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No results found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {searchQuery_.data?.map((article: any) => (
                  <div key={article.id} className="p-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="text-white font-medium">{article.title}</p>
                        <p className="text-sm text-slate-500">{article.category}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Book className="w-5 h-5 text-purple-400" />
            Browse by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesQuery.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoriesQuery.data?.map((category: any) => (
                <div key={category.id} className="p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div className={cn("p-2 rounded-lg w-fit mb-3", category.color || "bg-cyan-500/20")}>
                    <Book className={cn("w-5 h-5", category.iconColor || "text-cyan-400")} />
                  </div>
                  <p className="text-white font-medium">{category.name}</p>
                  <p className="text-xs text-slate-500">{category.articleCount} articles</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Articles */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Popular Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {articlesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {articlesQuery.data?.map((article: any) => (
                <div key={article.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{article.title}</p>
                        <Badge className="bg-slate-700/50 text-slate-300 border-0 text-xs">{article.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{article.excerpt}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 px-2">
                          <ExternalLink className="w-3 h-3 mr-1" />Read More
                        </Button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Was this helpful?</span>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-green-400 h-7 w-7 p-0" onClick={() => feedbackMutation.mutate({ articleId: article.id, helpful: true })}>
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-400 h-7 w-7 p-0" onClick={() => feedbackMutation.mutate({ articleId: article.id, helpful: false })}>
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MessageCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-bold">Still need help?</p>
                <p className="text-sm text-slate-400">Contact our support team</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
              <MessageCircle className="w-4 h-4 mr-2" />Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
