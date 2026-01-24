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
  HelpCircle, Search, Book, MessageCircle, Video,
  FileText, ChevronRight, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const categoriesQuery = trpc.help.getCategories.useQuery();
  const popularQuery = trpc.help.getPopularArticles.useQuery({ limit: 5 });
  const searchQuery = trpc.help.search.useQuery({ query: searchTerm }, { enabled: searchTerm.length >= 2 });

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case "book": return <Book className="w-6 h-6" />;
      case "video": return <Video className="w-6 h-6" />;
      case "file": return <FileText className="w-6 h-6" />;
      case "message": return <MessageCircle className="w-6 h-6" />;
      default: return <HelpCircle className="w-6 h-6" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Gradient Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Help Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Find answers and get support</p>
      </div>

      {/* Search */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border-cyan-500/30 rounded-xl">
        <CardContent className="p-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for help articles..." className="pl-12 h-14 text-lg bg-slate-800/50 border-slate-700/50 rounded-xl" />
          </div>
          {searchTerm.length >= 2 && (
            <div className="mt-4 max-w-2xl mx-auto">
              {searchQuery.isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
              ) : searchQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No results found for "{searchTerm}"</p>
              ) : (
                <div className="space-y-2">
                  {searchQuery.data?.map((article: any) => (
                    <div key={article.id} className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between" onClick={() => setLocation(`/help/${article.id}`)}>
                      <div>
                        <p className="text-white font-medium">{article.title}</p>
                        <p className="text-xs text-slate-500">{article.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoriesQuery.isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : (
          categoriesQuery.data?.map((category: any) => (
            <Card key={category.id} className="bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-cyan-500/50 transition-all cursor-pointer" onClick={() => setLocation(`/help/category/${category.id}`)}>
              <CardContent className="p-6 text-center">
                <div className={cn("p-3 rounded-full w-fit mx-auto mb-3", category.color || "bg-cyan-500/20 text-cyan-400")}>
                  {getCategoryIcon(category.icon)}
                </div>
                <p className="text-white font-medium">{category.name}</p>
                <p className="text-xs text-slate-500">{category.articleCount} articles</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Articles */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Popular Articles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {popularQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {popularQuery.data?.map((article: any) => (
                  <div key={article.id} className="p-4 flex items-center gap-3 hover:bg-slate-700/20 transition-colors cursor-pointer" onClick={() => setLocation(`/help/${article.id}`)}>
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{article.title}</p>
                      <p className="text-xs text-slate-500">{article.views?.toLocaleString()} views</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Need More Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                <p className="text-white font-medium">Live Chat</p>
              </div>
              <p className="text-sm text-slate-400 mb-3">Chat with our support team in real-time</p>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-lg">Start Chat</Button>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <p className="text-white font-medium">Submit a Ticket</p>
              </div>
              <p className="text-sm text-slate-400 mb-3">Create a support ticket for complex issues</p>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">Create Ticket</Button>
            </div>
            <div className="p-4 rounded-xl bg-slate-700/30">
              <div className="flex items-center gap-3 mb-2">
                <Video className="w-5 h-5 text-green-400" />
                <p className="text-white font-medium">Video Tutorials</p>
              </div>
              <p className="text-sm text-slate-400 mb-3">Watch step-by-step video guides</p>
              <Button variant="outline" className="w-full bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 rounded-lg">
                <ExternalLink className="w-4 h-4 mr-2" />Watch Videos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
