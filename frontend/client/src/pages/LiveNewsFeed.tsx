/**
 * LIVE NEWS FEED PAGE
 * Real-time industry news from RSS feeds
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Newspaper, Search, RefreshCw, Clock, ExternalLink,
  Fuel, FlaskConical, Truck, Snowflake, Package, Ship,
  AlertTriangle, Zap, TrendingUp, Filter, Rss
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRSSFeeds, type NewsArticle } from "@/hooks/useRSSFeeds";
import { 
  FEED_CATEGORY_LABELS, 
  FEED_CATEGORY_COLORS,
  ENABLED_FEEDS,
  type FeedCategory 
} from "@/data/rssFeeds";

const CATEGORY_ICONS: Record<FeedCategory, React.ReactNode> = {
  oil_gas: <Fuel className="w-4 h-4" />,
  chemical: <FlaskConical className="w-4 h-4" />,
  bulk_transport: <Package className="w-4 h-4" />,
  cold_chain: <Snowflake className="w-4 h-4" />,
  trucking: <Truck className="w-4 h-4" />,
  logistics: <Package className="w-4 h-4" />,
  hazmat: <AlertTriangle className="w-4 h-4" />,
  marine: <Ship className="w-4 h-4" />,
  supply_chain: <TrendingUp className="w-4 h-4" />,
  energy: <Zap className="w-4 h-4" />,
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function LiveNewsFeed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const { articles, isLoading, error, refresh, lastUpdated } = useRSSFeeds({
    limit: 100,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "oil_gas" && article.category === "oil_gas") ||
      (activeTab === "trucking" && (article.category === "trucking" || article.category === "logistics")) ||
      (activeTab === "bulk" && (article.category === "bulk_transport" || article.category === "chemical")) ||
      (activeTab === "cold_chain" && article.category === "cold_chain");

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Stats
  const stats = {
    total: articles.length,
    sources: new Set(articles.map(a => a.sourceId)).size,
    today: articles.filter(a => {
      const today = new Date();
      return a.pubDate.toDateString() === today.toDateString();
    }).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Rss className="w-6 h-6 text-orange-400" />
            Live News Feed
          </h1>
          <p className="text-slate-400">Real-time industry news from {ENABLED_FEEDS.length} sources</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <Button 
            onClick={refresh} 
            disabled={isLoading}
            variant="outline" 
            className="border-slate-600"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Articles</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Newspaper className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Active Sources</p>
                <p className="text-2xl font-bold text-green-400">{stats.sources}</p>
              </div>
              <Rss className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Today's News</p>
                <p className="text-2xl font-bold text-orange-400">{stats.today}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Search news..."
                className="pl-9 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(["all", "oil_gas", "chemical", "trucking", "bulk_transport", "cold_chain", "hazmat"] as const).map((cat: any) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={categoryFilter === cat ? "default" : "outline"}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    categoryFilter === cat ? "bg-blue-600" : "border-slate-600 text-slate-400"
                  )}
                >
                  {cat === "all" ? "All" : FEED_CATEGORY_LABELS[cat as FeedCategory]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for quick filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="all">All News</TabsTrigger>
          <TabsTrigger value="oil_gas">Oil & Gas</TabsTrigger>
          <TabsTrigger value="trucking">Trucking & Logistics</TabsTrigger>
          <TabsTrigger value="bulk">Bulk & Chemical</TabsTrigger>
          <TabsTrigger value="cold_chain">Cold Chain</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Loading State */}
          {isLoading && articles.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading news feeds...</p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="py-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400">{error}</p>
                <Button onClick={refresh} className="mt-4">Try Again</Button>
              </CardContent>
            </Card>
          )}

          {/* News Grid */}
          {!isLoading && filteredArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article: any) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredArticles.length === 0 && articles.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <Newspaper className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No articles match your filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Feed Sources */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Rss className="w-4 h-4 text-orange-400" />
            Active Feed Sources ({ENABLED_FEEDS.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ENABLED_FEEDS.slice(0, 20).map((feed: any) => (
              <Badge
                key={feed.id}
                variant="outline"
                className={cn("text-xs", (FEED_CATEGORY_COLORS as Record<string, string>)[feed.category])}
              >
                {feed.name}
              </Badge>
            ))}
            {ENABLED_FEEDS.length > 20 && (
              <Badge variant="outline" className="text-xs text-slate-500">
                +{ENABLED_FEEDS.length - 20} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all h-full group">
        <CardContent className="p-5">
          {/* Category & Source */}
          <div className="flex items-center justify-between mb-3">
            <Badge className={cn("text-xs", FEED_CATEGORY_COLORS[article.category])}>
              {CATEGORY_ICONS[article.category]}
              <span className="ml-1">{FEED_CATEGORY_LABELS[article.category]}</span>
            </Badge>
            <ExternalLink className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Image */}
          {article.imageUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-slate-700">
              <img 
                src={article.imageUrl} 
                alt="" 
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Title */}
          <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-400 mb-4 line-clamp-3">
            {article.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">{article.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(article.pubDate)}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
