/**
 * NEWS FEED PAGE
 * Real-time RSS feed aggregation - 100% Dynamic
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
  Newspaper, Clock, Eye, Share2, Bookmark, Search, ExternalLink,
  TrendingUp, AlertTriangle, Truck, DollarSign, Shield, Fuel,
  Snowflake, FlaskConical, Ship, Globe, Zap, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { value: "all", label: "All News", icon: Newspaper },
  { value: "logistics", label: "Logistics", icon: Truck },
  { value: "oil_gas", label: "Oil & Gas", icon: Fuel },
  { value: "chemical", label: "Chemical", icon: FlaskConical },
  { value: "refrigerated", label: "Cold Chain", icon: Snowflake },
  { value: "bulk", label: "Bulk", icon: Truck },
  { value: "hazmat", label: "Hazmat", icon: AlertTriangle },
  { value: "marine", label: "Marine", icon: Ship },
];

export default function NewsFeed() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const newsQuery = (trpc as any).news.getArticles.useQuery({
    category: activeTab !== "all" ? activeTab : undefined,
    search: searchTerm || undefined,
    limit: 50,
  });
  const trendingQuery = (trpc as any).news.getTrending.useQuery();
  const refreshMutation = (trpc as any).news.refreshFeeds.useMutation({
    onSuccess: () => newsQuery.refetch(),
  });

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.icon || Newspaper;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "logistics": return "bg-blue-500/20 text-blue-400";
      case "oil_gas": return "bg-orange-500/20 text-orange-400";
      case "chemical": return "bg-purple-500/20 text-purple-400";
      case "refrigerated": return "bg-cyan-500/20 text-cyan-400";
      case "bulk": return "bg-amber-500/20 text-amber-400";
      case "hazmat": return "bg-red-500/20 text-red-400";
      case "marine": return "bg-teal-500/20 text-teal-400";
      case "supply_chain": return "bg-green-500/20 text-green-400";
      case "energy": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Industry News</h1>
          <p className="text-slate-400 text-sm">Real-time RSS feeds from 30+ industry sources</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="border-slate-600"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshMutation.isPending && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Search news..." className="pl-9 bg-slate-700/50 border-slate-600" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border border-slate-700 flex-wrap h-auto gap-1 p-1">
              {CATEGORIES.map((cat: any) => (
                <TabsTrigger key={cat.value} value={cat.value} className="data-[state=active]:bg-blue-600 text-xs">
                  <cat.icon className="w-3 h-3 mr-1" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {newsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : (newsQuery.data as any)?.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No articles found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(newsQuery.data as any)?.map((article: any) => {
                    const CategoryIcon = getCategoryIcon(article.category);
                    return (
                      <Card key={article.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {article.imageUrl && (
                              <div className="w-32 h-24 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
                                <img src={article.imageUrl} alt="" className="w-full h-full object-cover" onError={(e: any) => (e.currentTarget.style.display = 'none')} />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={getCategoryColor(article.category)}>
                                  <CategoryIcon className="w-3 h-3 mr-1" />{article.category.replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{formatDate(article.publishedAt)}
                                </span>
                              </div>
                              <a href={article.link} target="_blank" rel="noopener noreferrer" className="block group">
                                <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{article.title}</h3>
                              </a>
                              <p className="text-sm text-slate-400 line-clamp-2">{article.summary}</p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-slate-500">{article.source}</span>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </Button>
                                  <Button variant="ghost" size="sm"><Bookmark className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="sm"><Share2 className="w-4 h-4" /></Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />Trending
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendingQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map((i: any) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (trendingQuery.data as any)?.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No trending articles</p>
              ) : (
                <div className="space-y-3">
                  {(trendingQuery.data as any)?.map((article: any, idx: number) => (
                    <div key={article.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/30 cursor-pointer">
                      <span className="text-2xl font-bold text-slate-600">{idx + 1}</span>
                      <div>
                        <p className="text-white text-sm line-clamp-2">{article.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{article.views} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "FMCSA Updates", icon: Shield },
                  { label: "Fuel Prices", icon: DollarSign },
                  { label: "Weather Alerts", icon: AlertTriangle },
                  { label: "Load Board", icon: Truck },
                ].map((link: any, idx: number) => (
                  <Button key={idx} variant="ghost" className="w-full justify-start text-slate-400 hover:text-white">
                    <link.icon className="w-4 h-4 mr-2" />{link.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
