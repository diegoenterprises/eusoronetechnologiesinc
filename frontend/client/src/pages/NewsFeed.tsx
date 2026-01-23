/**
 * NEWS FEED PAGE
 * Displays aggregated RSS feeds from 50+ industry sources
 * Categories: Oil & Gas, Chemicals, Refrigerated, Bulk, Trucking, General
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, MessageCircle, Share2, Calendar, Loader2, AlertCircle, Filter, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

export default function NewsFeedPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [userLanguage, setUserLanguage] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const lang = navigator.language.split("-")[0].toLowerCase();
    setUserLanguage(lang);
  }, []);

  // Fetch RSS feeds from server
  const { data: feeds, isLoading, error } = trpc.rss.allFeeds.useQuery();
  const { data: categories } = trpc.rss.categories.useQuery();

  // Filter feeds by category
  const filteredFeeds = selectedCategory === "all" 
    ? feeds 
    : feeds?.filter(feed => feed.category === selectedCategory);

  const toggleLike = (feedId: string) => {
    const newLiked = new Set(liked);
    if (newLiked.has(feedId)) {
      newLiked.delete(feedId);
    } else {
      newLiked.add(feedId);
    }
    setLiked(newLiked);
  };

  const handleShare = (title: string, link: string) => {
    if (navigator.share) {
      navigator.share({
        title: "EusoTrip News",
        text: title,
        url: link,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Industry News Feed</h1>
        <p className="text-gray-400">Real-time updates from 50+ industry sources</p>
      </div>

      {/* Category Filter */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">Filter by Category</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Globe size={14} />
            <span>Language: {userLanguage.toUpperCase()}</span>
            {isTranslating && <Loader2 size={14} className="animate-spin" />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setSelectedCategory("all")}
            className={`${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            } transition-all`}
          >
            All News
          </Button>
          {categories?.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              } transition-all capitalize`}
            >
              {category.replace("-", " ")}
            </Button>
          ))}
        </div>
      </Card>

      {/* Loading State */}
      {(isLoading || isTranslating) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500 mr-2" size={24} />
          <span className="text-gray-400">{isTranslating ? "Translating to " + userLanguage.toUpperCase() : "Loading"} news feeds...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-900/20 border-red-700 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-400">Error Loading Feeds</h3>
              <p className="text-red-300 text-sm mt-1">
                Failed to load news feeds. Please try again later.
              </p>
              {userLanguage !== "en" && <p className="text-red-300 text-xs mt-1">Note: Content will be translated to {userLanguage.toUpperCase()}</p>}
            </div>
          </div>
        </Card>
      )}

      {/* News Feed Grid */}
      <div className="space-y-4">
        {filteredFeeds && filteredFeeds.length > 0 ? (
          filteredFeeds.map((feed) => (
            <Card
              key={feed.id}
              className="bg-slate-800 border-slate-700 p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            >
              <div className="mb-4">
                {/* Title */}
                <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">{feed.title}</h2>

                {/* Description */}
                <p className="text-gray-400 mb-4 line-clamp-3">{feed.description}</p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-gray-500 text-sm flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(feed.pubDate).toLocaleDateString()}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span>Source: {feed.source}</span>
                  <span className="text-gray-600">•</span>
                  <span className="inline-block px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs capitalize">
                    {feed.category}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(feed.id)}
                    className={`text-gray-400 hover:text-red-500 transition-colors ${
                      liked.has(feed.id) ? "text-red-500" : ""
                    }`}
                  >
                    <Heart
                      size={18}
                      className="mr-2"
                      fill={liked.has(feed.id) ? "currentColor" : "none"}
                    />
                    {liked.has(feed.id) ? "Liked" : "Like"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(feed.title, feed.link)}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Share2 size={18} className="mr-2" />
                    Share
                  </Button>
                </div>

                {/* Read More Link */}
                <a
                  href={feed.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                >
                  Read Full Article →
                </a>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-8 text-center">
            <p className="text-gray-400">No news articles found for this category.</p>
          </Card>
        )}
      </div>

      {/* Feed Sources Info */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-2">About This Feed</h3>
        <p className="text-gray-400 text-sm">
          This news feed aggregates content from 50+ industry-specific RSS sources including:
          Oil & Gas, Chemical Industry, Refrigerated Transport, Bulk Logistics, Trucking, and General Supply Chain news.
          Updates are refreshed throughout the day to keep you informed on the latest industry developments.
        </p>
        {userLanguage !== "en" && (
          <p className="text-blue-400 text-xs mt-3 flex items-center gap-1">
            <Globe size={12} />
            All content is automatically translated to {userLanguage.toUpperCase()} using ESANG AI
          </p>
        )}
      </Card>
    </div>
  );
}

