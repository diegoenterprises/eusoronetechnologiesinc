/**
 * CHANNELS PAGE
 * 100% Dynamic - No mock data
 * Uses tRPC for all data
 */

import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Plus, MessageSquare, Users, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export default function ChannelsPage() {
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState(0);

  const channelsQuery = (trpc as any).channels.list.useQuery({});

  if (channelsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i: any) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (channelsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-400 mb-4">Failed to load channels</p>
        <Button onClick={() => channelsQuery.refetch()} variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const channels = channelsQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Company Channels</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Create Channel
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {channels.map((channel: any, idx: number) => (
          <div
            key={channel.id}
            onClick={() => setSelectedChannel(idx)}
            className={`bg-gray-900 rounded-lg p-6 border cursor-pointer transition ${
              selectedChannel === idx ? "border-blue-600" : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {channel.type === "private" ? <Lock size={18} /> : <MessageSquare size={18} />}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{channel.name}</h3>
                  <p className="text-gray-400 text-sm">{channel.description}</p>
                </div>
              </div>
              {channel.unreadCount > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {channel.unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Users size={16} />
              {channel.memberCount} members
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
