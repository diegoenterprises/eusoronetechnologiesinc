/**
 * NEWS FEED PAGE
 * 100% Dynamic - No mock data
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
  Newspaper, Clock, Eye, Share2, Bookmark, Search,
  TrendingUp, AlertTriangle, Truck, DollarSign, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewsFeed() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const newsQuery = trpc.news.getArticles.useQuery({
    category: activeTab !== "all" ? activeTab : undefined,
    search: searchTerm || undefined,
  });
  const trendingQuery = trpc.news.getTrending.useQuery();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "industry": return Truck;
      case "regulations": return Shield;
      case "market": return DollarSign;
      case "safety": return AlertTriangle;
      default: return Newspaper;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "industry": return "bg-blue-500/20 text-blue-400";
      case "regulations": return "bg-purple-500/20 text-purple-400";
      case "market": return "bg-green-500/20 text-green-400";
      case "safety": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Industry News</h1>
          <p className="text-slate-400 text-sm">Stay updated with the latest in trucking and logistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search news..." className="pl-9 bg-slate-700/50 border-slate-600" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">All</TabsTrigger>
              <TabsTrigger value="industry" className="data-[state=active]:bg-blue-600">Industry</TabsTrigger>
              <TabsTrigger value="regulations" className="data-[state=active]:bg-blue-600">Regulations</TabsTrigger>
              <TabsTrigger value="market" className="data-[state=active]:bg-blue-600">Market</TabsTrigger>
              <TabsTrigger value="safety" className="data-[state=active]:bg-blue-600">Safety</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {newsQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : newsQuery.data?.length === 0 ? (
                <div className="text-center py-12">
                  <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No articles found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newsQuery.data?.map((article) => {
                    const CategoryIcon = getCategoryIcon(article.category);
                    return (
                      <Card key={article.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {article.imageUrl && (
                              <div className="w-32 h-24 rounded-lg bg-slate-700 flex-shrink-0 overflow-hidden">
                                <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getCategoryColor(article.category)}>
                                  <CategoryIcon className="w-3 h-3 mr-1" />{article.category}
                                </Badge>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{article.publishedAt}
                                </span>
                              </div>
                              <h3 className="text-white font-medium mb-2 line-clamp-2">{article.title}</h3>
                              <p className="text-sm text-slate-400 line-clamp-2">{article.summary}</p>
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-slate-500">{article.source}</span>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
                <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : trendingQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No trending articles</p>
              ) : (
                <div className="space-y-3">
                  {trendingQuery.data?.map((article, idx) => (
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
                ].map((link, idx) => (
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
