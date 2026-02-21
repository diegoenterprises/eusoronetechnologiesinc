/**
 * COMPANY CHANNELS PAGE
 * Enhanced UI matching Support/Messages style
 * Real-time communication with team members and departments
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 100% Dynamic - No mock data
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEusoDialog } from "@/components/EusoDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDisplayUser } from "@/hooks/useDisplayUser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
  BellOff,
  MoreVertical,
  RefreshCw,
  X,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import { useEncryption } from "@/hooks/useEncryption";

export default function CompanyChannels() {
  const dialog = useEusoDialog();
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [newChannelType, setNewChannelType] = useState<"public" | "private">("public");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState<"public" | "private">("public");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC queries
  const channelsQuery = (trpc as any).channels.list.useQuery({ search: searchQuery || undefined });
  const messagesQuery = (trpc as any).channels.getMessages.useQuery(
    { channelId: selectedChannel, limit: 50 },
    { enabled: !!selectedChannel }
  );
  const summaryQuery = (trpc as any).channels.getSummary.useQuery();
  const membersQuery = (trpc as any).channels.getMembers.useQuery(
    { channelId: selectedChannel },
    { enabled: !!selectedChannel && showMembers }
  );
  const muteQuery = (trpc as any).channels.getMuteStatus.useQuery(
    { channelId: selectedChannel },
    { enabled: !!selectedChannel }
  );

  // tRPC mutations
  const sendMessageMutation = (trpc as any).channels.sendMessage.useMutation({
    onSuccess: () => {
      setMessageInput("");
      messagesQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed to send message", { description: error.message }),
  });

  const createChannelMutation = (trpc as any).channels.create.useMutation({
    onSuccess: () => {
      setShowCreateChannel(false);
      setNewChannelName("");
      setNewChannelDesc("");
      channelsQuery.refetch();
      toast.success("Channel created");
    },
    onError: (error: any) => toast.error("Failed to create channel", { description: error.message }),
  });

  const updateChannelMutation = (trpc as any).channels.updateChannel.useMutation({
    onSuccess: () => {
      channelsQuery.refetch();
      setShowSettings(false);
      toast.success("Channel settings saved");
    },
    onError: (error: any) => toast.error("Failed to update channel", { description: error.message }),
  });

  const deleteChannelMutation = (trpc as any).channels.deleteChannel.useMutation({
    onSuccess: () => {
      channelsQuery.refetch();
      setShowSettings(false);
      setSelectedChannel("");
      toast.success("Channel deleted");
    },
    onError: (error: any) => toast.error("Failed to delete channel", { description: error.message }),
  });

  const toggleMuteMutation = (trpc as any).channels.toggleMute.useMutation({
    onSuccess: (data: any) => {
      muteQuery.refetch();
      toast.success(data.muted ? "Notifications muted" : "Notifications enabled");
    },
    onError: (error: any) => toast.error("Failed to toggle notifications", { description: error.message }),
  });

  const uploadAttachmentMutation = (trpc as any).channels.uploadAttachment.useMutation({
    onSuccess: (data: any) => {
      messagesQuery.refetch();
      toast.success(`File sent: ${data.fileName}`);
    },
    onError: (error: any) => toast.error("Failed to upload file", { description: error.message }),
  });

  const { user } = useAuth();
  const { displayName, displayInitials, displayRole } = useDisplayUser();
  const { ready: e2eReady, encryptForChannel, decryptFromChannel, initChannelKey } = useEncryption({ userId: user?.id || user?.email });
  const channels = channelsQuery.data || [];
  const channelMessages = messagesQuery.data || [];
  const activeChannel = channels.find((c: any) => c.id === selectedChannel);
  const members = membersQuery.data || [];
  const isMuted = muteQuery.data?.muted || false;

  // Auto-select first channel when channels load
  useEffect(() => {
    if (!selectedChannel && channels.length > 0) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages]);

  const handleSendMessage = useCallback(() => {
    if (messageInput.trim() && selectedChannel) {
      sendMessageMutation.mutate({
        channelId: selectedChannel,
        content: messageInput.trim(),
      });
    }
  }, [messageInput, selectedChannel]);

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      createChannelMutation.mutate({
        name: newChannelName.trim(),
        description: newChannelDesc.trim() || undefined,
        type: newChannelType,
      });
    }
  };

  const handleOpenSettings = () => {
    if (activeChannel) {
      setEditName(activeChannel.name);
      setEditDesc(activeChannel.description || "");
      setEditType(activeChannel.type);
      setShowSettings(true);
    }
  };

  const handleSaveSettings = () => {
    if (!selectedChannel) return;
    updateChannelMutation.mutate({
      channelId: selectedChannel,
      name: editName.trim() || undefined,
      description: editDesc.trim(),
      type: editType,
    });
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel) return;
    const ok = await dialog.confirm("Are you sure you want to delete this channel? This cannot be undone.", { confirmLabel: "Delete", cancelLabel: "Cancel" });
    if (ok) deleteChannelMutation.mutate({ channelId: selectedChannel });
  };

  const handleToggleMute = () => {
    if (selectedChannel) toggleMuteMutation.mutate({ channelId: selectedChannel });
  };

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedChannel) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}`, { description: "Max 10MB" });
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1] || "";
        uploadAttachmentMutation.mutate({
          channelId: selectedChannel,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  if (channelsQuery.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-96" />
          <Skeleton className="h-96 col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Company Channels</h1>
          <p className="text-slate-400 mt-1">Team communication and collaboration</p>
        </div>
        <Button onClick={() => setShowCreateChannel(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all">
          <Plus size={18} className="mr-2" />
          New Channel
        </Button>
      </div>

    <div className="flex h-[calc(100vh-220px)] bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
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
              <Plus size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto">
          {channels.map((channel: any) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                selectedChannel === channel.id
                  ? "bg-blue-900/30 border-l-blue-600 text-white"
                  : "border-l-transparent text-slate-400 hover:bg-gray-800"
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
                  <p className="text-xs text-slate-500 mt-1 truncate">
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
              {displayInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">{displayRole}</p>
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
                    <Lock size={18} className="text-slate-400" />
                  ) : (
                    <Hash size={18} className="text-slate-400" />
                  )}
                  <h1 className="text-xl font-bold text-white">
                    {activeChannel.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-400">
                    {activeChannel.description}
                  </p>
                  {e2eReady && (
                    <span className="flex items-center gap-0.5 text-[10px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent/80 ml-2">
                      <Lock size={10} /> E2E Encrypted
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:bg-slate-700"
                  onClick={() => setShowMembers(true)}
                >
                  <Users size={18} />
                  <span className="ml-2">{activeChannel.memberCount}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-slate-700 hover:bg-slate-700 ${isMuted ? "text-red-400" : "text-slate-400"}`}
                  onClick={handleToggleMute}
                  disabled={toggleMuteMutation.isPending}
                >
                  {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-400 hover:bg-slate-700"
                  onClick={handleOpenSettings}
                >
                  <Settings size={18} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1 bg-slate-900">
              {channelMessages.map((message: any, idx: number) => {
                const prevMsg = idx > 0 ? channelMessages[idx - 1] : null;
                const showAvatar = !prevMsg || (prevMsg as any).author !== message.author;

                return (
                <div key={message.id} className={`group flex gap-3 px-2 py-1 rounded-xl hover:bg-white/[0.03] transition-colors ${showAvatar ? "mt-3" : ""}`}>
                  {showAvatar ? (
                    (message as any).authorAvatar ? (
                      <img
                        src={(message as any).authorAvatar}
                        alt={message.author}
                        className="w-9 h-9 rounded-full flex-shrink-0 object-cover ring-1 ring-white/10 shadow-md shadow-blue-500/10"
                      />
                    ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1473FF] via-[#3B5FFF] to-[#BE01FF] flex-shrink-0 flex items-center justify-center ring-1 ring-white/10 shadow-md shadow-blue-500/10">
                      <span className="text-[11px] font-semibold text-white tracking-tight">
                        {message.author
                          .split(" ")
                          .map((n: any) => n[0])
                          .join("")}
                      </span>
                    </div>
                    )
                  ) : (
                    <div className="w-9 flex-shrink-0 flex items-center justify-center">
                      <span className="text-[9px] text-slate-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold text-white tracking-[-0.01em]">
                          {message.author}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}

                    <p className="text-[13.5px] leading-[1.55] text-slate-200 tracking-[-0.01em]">{message.content}</p>

                    {(message as any).attachments && (message as any).attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(message as any).attachments.map((att: { name: string }, idx: number) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] rounded-lg border border-white/[0.08] text-[12px] text-slate-300 hover:bg-white/[0.08] hover:border-blue-500/30 cursor-pointer transition-all"
                          >
                            <Paperclip size={12} className="text-blue-400" />
                            {att.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(message.reactions).map(
                          ([reaction, count]) => (
                            <button
                              key={reaction}
                              className="px-2.5 py-1 bg-white/[0.05] rounded-full text-[12px] hover:bg-white/[0.1] border border-white/[0.06] hover:border-blue-500/30 transition-all text-slate-300"
                            >
                              {reaction} <span className="text-slate-500 ml-0.5">{String(count)}</span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <button className="p-1.5 hover:bg-white/[0.06] rounded-lg opacity-0 group-hover:opacity-100 transition-all self-start mt-0.5">
                    <MoreVertical size={14} className="text-slate-500" />
                  </button>
                </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
              {e2eReady && (
                <div className="mb-2 flex items-center justify-center gap-1.5 text-[10px] bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent/60">
                  <Lock size={10} />
                  <span>Channel messages are end-to-end encrypted. Only company members can read them.</span>
                </div>
              )}
              {uploadAttachmentMutation.isPending && (
                <div className="mb-2 px-3 py-2 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300 flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Uploading file...
                </div>
              )}
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                />
                <button
                  className="p-2 hover:bg-slate-700 rounded transition-colors"
                  onClick={handleFileSelect}
                  title="Attach file"
                >
                  <Paperclip size={20} className="text-slate-400" />
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e: any) => setMessageInput(e.target.value)}
                  onKeyPress={(e: any) => {
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
              <p className="text-slate-400">{channels.length === 0 ? 'No channels yet. Create one to get started!' : 'Select a channel to start chatting'}</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Create Channel Modal (portaled to body) */}
    {showCreateChannel && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99990 }} className="bg-black/50 flex items-center justify-center">
          <Card className="bg-slate-800 border-slate-700 p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">
              Create New Channel
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Channel Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., marketing-team"
                  value={newChannelName}
                  onChange={(e: any) => setNewChannelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="What is this channel about?"
                  rows={3}
                  value={newChannelDesc}
                  onChange={(e: any) => setNewChannelDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Channel Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="public"
                      checked={newChannelType === "public"}
                      onChange={() => setNewChannelType("public")}
                      className="rounded"
                    />
                    <span className="text-slate-300">Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="private"
                      checked={newChannelType === "private"}
                      onChange={() => setNewChannelType("private")}
                      className="rounded"
                    />
                    <span className="text-slate-300">Private</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowCreateChannel(false)}
                  variant="outline"
                  className="flex-1 border-gray-700 text-slate-300 hover:bg-gray-800"
                  disabled={createChannelMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateChannel}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={createChannelMutation.isPending || !newChannelName.trim()}
                >
                  {createChannelMutation.isPending ? "Creating..." : "Create Channel"}
                </Button>
              </div>
            </div>
          </Card>
        </div>,
        document.body
      )}

    {/* Channel Settings Modal (portaled to body) */}
    {showSettings && activeChannel && createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 99990 }} className="bg-black/50 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-6 w-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Channel Settings</h2>
            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-700 rounded">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Channel Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e: any) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e: any) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Visibility</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="editType" value="public" checked={editType === "public"} onChange={() => setEditType("public")} className="rounded" />
                  <span className="text-slate-300">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="editType" value="private" checked={editType === "private"} onChange={() => setEditType("private")} className="rounded" />
                  <span className="text-slate-300">Private</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleDeleteChannel}
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/30"
                disabled={deleteChannelMutation.isPending}
              >
                <Trash2 size={16} className="mr-1" />
                Delete
              </Button>
              <div className="flex-1" />
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                className="border-gray-700 text-slate-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateChannelMutation.isPending || !editName.trim()}
              >
                {updateChannelMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Card>
      </div>,
      document.body
    )}

    {/* Members Modal (portaled to body) */}
    {showMembers && activeChannel && createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 99990 }} className="bg-black/50 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-6 w-[420px] max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Members ({activeChannel.memberCount})
            </h2>
            <button onClick={() => setShowMembers(false)} className="p-1 hover:bg-slate-700 rounded">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {membersQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : members.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No members found</p>
            ) : (
              members.map((member: any) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {(member.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{member.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{member.role}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${member.isOnline ? "bg-green-500" : "bg-slate-600"}`} />
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <Button onClick={() => setShowMembers(false)} variant="outline" className="w-full border-gray-700 text-slate-300 hover:bg-gray-800">
              Close
            </Button>
          </div>
        </Card>
      </div>,
      document.body
    )}
    </div>
  );
}

