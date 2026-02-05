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
  HelpCircle, Search, FileText, Book, Video,
  ChevronRight
} from "lucide-react";

export default function HelpCenter() {
  const [search, setSearch] = useState("");

  const articlesQuery = (trpc as any).help.getArticles.useQuery({ search });
  const categoriesQuery = (trpc as any).help.getCategories.useQuery();
  const statsQuery = (trpc as any).help.getStats.useQuery();

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Help Center</h1>
          <p className="text-slate-400 text-sm mt-1">Find answers and resources</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><FileText className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.articles || 0}</p>}<p className="text-xs text-slate-400">Articles</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><Book className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.guides || 0}</p>}<p className="text-xs text-slate-400">Guides</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><Video className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-green-400">{stats?.videos || 0}</p>}<p className="text-xs text-slate-400">Videos</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><HelpCircle className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-yellow-400">{stats?.faqs || 0}</p>}<p className="text-xs text-slate-400">FAQs</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search for help..." className="pl-12 py-6 text-lg bg-slate-800/50 border-slate-700/50 rounded-xl" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><Book className="w-5 h-5 text-purple-400" />Categories</CardTitle></CardHeader>
          <CardContent className="p-0">
            {categoriesQuery.isLoading ? (
              <div className="p-4 space-y-2">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(categoriesQuery.data as any)?.map((category: any) => (
                  <div key={category.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/50"><FileText className="w-4 h-4 text-cyan-400" /></div>
                      <div>
                        <p className="text-white font-medium">{category.name}</p>
                        <p className="text-xs text-slate-500">{category.articleCount} articles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />Popular Articles</CardTitle></CardHeader>
          <CardContent className="p-0">
            {articlesQuery.isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (articlesQuery.data as any)?.length === 0 ? (
              <div className="text-center py-16"><HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No articles found</p></div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {(articlesQuery.data as any)?.map((article: any) => (
                  <div key={article.id} className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{article.title}</p>
                          <Badge className="bg-slate-500/20 text-slate-400 border-0">{article.category}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">{article.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
                          <span>{article.readTime} read</span>
                          <span>{article.views?.toLocaleString()} views</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
