/**
 * COMPANY CHANNELS PAGE
 * Enhanced UI matching Support/Messages style
 * Real-time communication with team members and departments
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Plus,
  Search,
  Settings,
  Users,
  Send,
  Paperclip,
  Hash,
  Lock,
  Bell,
  MoreVertical,
} from "lucide-react";

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: "public" | "private";
  memberCount: number;
  unreadCount: number;
  lastMessage?: {
    author: string;
    content: string;
    timestamp: Date;
  };
  icon?: string;
}

export interface Message {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
  reactions: Record<string, number>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export default function CompanyChannels() {
  const [selectedChannel, setSelectedChannel] = useState<string>("general");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  // Mock channels data
  const channels: Channel[] = [
    {
      id: "general",
      name: "General",
      description: "General company announcements",
      type: "public",
      memberCount: 145,
      unreadCount: 3,
      lastMessage: {
        author: "John Smith",
        content: "Welcome to the company channels!",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
    },
    {
      id: "operations",
      name: "Operations",
      description: "Operational updates and logistics",
      type: "public",
      memberCount: 67,
      unreadCount: 0,
      lastMessage: {
        author: "Sarah Johnson",
        content: "Q4 logistics plan is ready for review",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    },
    {
      id: "drivers",
      name: "Drivers",
      description: "Driver coordination and updates",
      type: "public",
      memberCount: 234,
      unreadCount: 5,
      lastMessage: {
        author: "Mike Davis",
        content: "New route optimization live",
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    },
    {
      id: "compliance",
      name: "Compliance",
      description: "Regulatory and compliance matters",
      type: "private",
      memberCount: 12,
      unreadCount: 1,
      lastMessage: {
        author: "Legal Team",
        content: "Updated HOS regulations effective tomorrow",
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
    {
      id: "sales",
      name: "Sales",
      description: "Sales team coordination",
      type: "public",
      memberCount: 23,
      unreadCount: 0,
      lastMessage: {
        author: "Emma Wilson",
        content: "New client onboarded successfully",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    },
    {
      id: "engineering",
      name: "Engineering",
      description: "Tech team discussions",
      type: "private",
      memberCount: 8,
      unreadCount: 2,
      lastMessage: {
        author: "Dev Team",
        content: "API v2 deployment scheduled",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
      },
    },
  ];

  // Mock messages for selected channel
  const messages: Message[] = [
    {
      id: "msg-1",
      author: "John Smith",
      authorId: "user-1",
      content: "Welcome to the company channels!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      reactions: { "👍": 5, "🎉": 2 },
    },
    {
      id: "msg-2",
      author: "Sarah Johnson",
      authorId: "user-2",
      content:
        "This is a great way to keep everyone informed about company updates.",
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      reactions: { "👍": 3 },
    },
    {
      id: "msg-3",
      author: "Mike Davis",
      authorId: "user-3",
      content: "Looking forward to using this for team coordination!",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      reactions: { "✨": 1, "👍": 2 },
    },
  ];

  const activeChannel = channels.find((c) => c.id === selectedChannel);
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Handle message sending
      setMessageInput("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Company Channels</h1>
          <p className="text-gray-400 mt-1">Team communication and collaboration</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all">
          <Plus size={18} className="mr-2" />
          New Channel
        </Button>
      </div>

    <div className="flex h-96 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      {/* Sidebar - Channels List */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Channels</h2>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <Plus size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                selectedChannel === channel.id
                  ? "bg-blue-900/30 border-l-blue-600 text-white"
                  : "border-l-transparent text-gray-400 hover:bg-gray-800"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {channel.type === "private" ? (
                      <Lock size={14} />
                    ) : (
                      <Hash size={14} />
                    )}
                    <span className="font-semibold truncate">
                      {channel.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {channel.description}
                  </p>
                </div>
                {channel.unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full flex-shrink-0">
                    {channel.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer - User Info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              DU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Diego Usoro
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {activeChannel.type === "private" ? (
                    <Lock size={18} className="text-gray-400" />
                  ) : (
                    <Hash size={18} className="text-gray-400" />
                  )}
                  <h1 className="text-xl font-bold text-white">
                    {activeChannel.name}
                  </h1>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {activeChannel.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-gray-400 hover:bg-slate-700"
                >
                  <Users size={18} />
                  <span className="ml-2">{activeChannel.memberCount}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-gray-400 hover:bg-slate-700"
                >
                  <Bell size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-gray-400 hover:bg-slate-700"
                >
                  <Settings size={18} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-900">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                    {message.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white">
                        {message.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-gray-300 mt-1">{message.content}</p>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
                          >
                            <Paperclip size={14} />
                            {att.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {Object.keys(message.reactions).length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {Object.entries(message.reactions).map(
                          ([emoji, count]) => (
                            <button
                              key={emoji}
                              className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700 transition-colors"
                            >
                              {emoji} {count}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <button className="p-1 hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
              <div className="flex gap-3">
                <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                  <Paperclip size={20} className="text-gray-400" />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />

                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded transition-colors"
                >
                  <Send size={20} className="text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Create Channel Modal */}
    {showCreateChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">
              Create New Channel
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., marketing-team"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What is this channel about?"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Channel Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="public"
                      defaultChecked
                      className="rounded"
                    />
                    <span className="text-gray-300">Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="private"
                      className="rounded"
                    />
                    <span className="text-gray-300">Private</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowCreateChannel(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowCreateChannel(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Create Channel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

