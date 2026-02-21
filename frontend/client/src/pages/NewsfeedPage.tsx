/**
 * NEWSFEED PAGE
 * Frontend for newsfeed router — industry news, platform updates, regulatory changes.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Newspaper, TrendingUp, Shield, Cpu, BarChart3,
  Lightbulb, Megaphone, Clock, ChevronRight, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  industry: { icon: <TrendingUp className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/20" },
  regulations: { icon: <Shield className="w-4 h-4" />, color: "text-red-400 bg-red-500/20" },
  safety: { icon: <Shield className="w-4 h-4" />, color: "text-orange-400 bg-orange-500/20" },
  technology: { icon: <Cpu className="w-4 h-4" />, color: "text-cyan-400 bg-cyan-500/20" },
  market: { icon: <BarChart3 className="w-4 h-4" />, color: "text-green-400 bg-green-500/20" },
  platform: { icon: <Megaphone className="w-4 h-4" />, color: "text-purple-400 bg-purple-500/20" },
  tips: { icon: <Lightbulb className="w-4 h-4" />, color: "text-yellow-400 bg-yellow-500/20" },
};

export default function NewsfeedPage() {
  const [category, setCategory] = useState<string>("");

  const feedQuery = (trpc as any).newsfeed.getFeed.useQuery({
    category: category || undefined,
    limit: 30,
  });
  const featuredQuery = (trpc as any).newsfeed.getFeatured.useQuery();
  const trendingQuery = (trpc as any).newsfeed.getTrending.useQuery();

  const articles = feedQuery.data?.articles || [];
  const featured = featuredQuery.data || [];
  const trending = trendingQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Industry Newsfeed</h1>
        <p className="text-slate-400 text-sm mt-1">Latest industry news, regulatory updates, and market insights</p>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={!category ? "default" : "outline"} onClick={() => setCategory("")}
          className={!category ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
          All
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <Button key={key} size="sm" variant={category === key ? "default" : "outline"} onClick={() => setCategory(key)}
            className={category === key ? "bg-gradient-to-r from-[#1473FF] to-[#BE01FF]" : "border-slate-600 text-slate-300"}>
            {cfg.icon}<span className="ml-1 capitalize">{key}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Featured */}
          {featured.length > 0 && (
            <Card className="bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-[#1473FF]/30 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#BE01FF]" />Featured</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {featured.slice(0, 2).map((a: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/30">
                    <p className="text-white font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Articles */}
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#1473FF]" />Latest Articles
                <Badge variant="outline" className="text-[10px] border-slate-600 ml-auto">{feedQuery.data?.total || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {feedQuery.isLoading ? (
                <div className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : articles.length === 0 ? (
                <div className="p-8 text-center"><Newspaper className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No articles available</p></div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {articles.map((a: any, i: number) => {
                    const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.industry;
                    return (
                      <div key={i} className="p-3 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-1.5 rounded-lg mt-0.5 shrink-0", cat.color)}>{cat.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">{a.title}</p>
                            {a.summary && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{a.summary}</p>}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              {a.source && <span>{a.source}</span>}
                              {a.publishedAt && <span>{new Date(a.publishedAt).toLocaleDateString()}</span>}
                              <Badge variant="outline" className="text-[8px] border-slate-600 capitalize">{a.category}</Badge>
                            </div>
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

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" />Trending</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {trending.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No trending topics</div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {trending.slice(0, 8).map((t: any, i: number) => (
                    <div key={i} className="px-4 py-2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold w-4">{i + 1}</span>
                      <span className="text-xs text-white">{t.title || t.topic}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
