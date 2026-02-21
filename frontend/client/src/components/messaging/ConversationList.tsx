/**
 * CONVERSATION LIST COMPONENT
 * List of active message threads for a user
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, Search, Package, Truck, User, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  loadId: string;
  loadNumber: string;
  participants: {
    id: string;
    name: string;
    role: "shipper" | "catalyst" | "driver" | "dispatcher";
    isOnline?: boolean;
  }[];
  lastMessage: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: number;
  status: "active" | "completed" | "issue";
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  currentUserId: string;
}

const ROLE_COLORS = {
  shipper: "bg-blue-500",
  catalyst: "bg-green-500",
  driver: "bg-purple-500",
  dispatcher: "bg-orange-500",
};

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      conv.loadNumber.toLowerCase().includes(search) ||
      conv.participants.some(p => p.name.toLowerCase().includes(search)) ||
      conv.lastMessage.content.toLowerCase().includes(search)
    );
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString();
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find(p => p.id !== currentUserId) || conv.participants[0];
  };

  return (
    <Card className="bg-white/[0.02] border-slate-700 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Messages
        </CardTitle>
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 bg-white/[0.04] border-slate-600 text-white"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/[0.04]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherParticipant = getOtherParticipant(conv);
              const isSelected = selectedId === conv.id;
              const isUnread = conv.unreadCount > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    isSelected ? "bg-blue-500/10" : "hover:bg-white/[0.06]/30",
                    isUnread && "bg-slate-700/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        ROLE_COLORS[otherParticipant.role]
                      )}>
                        {otherParticipant.role === "shipper" && <Package className="w-5 h-5 text-white" />}
                        {otherParticipant.role === "catalyst" && <Truck className="w-5 h-5 text-white" />}
                        {otherParticipant.role === "driver" && <User className="w-5 h-5 text-white" />}
                        {otherParticipant.role === "dispatcher" && <User className="w-5 h-5 text-white" />}
                      </div>
                      {otherParticipant.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-medium truncate",
                          isUnread ? "text-white" : "text-slate-300"
                        )}>
                          {otherParticipant.name}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] py-0 h-4 text-slate-500">
                          {conv.loadNumber}
                        </Badge>
                        {conv.status === "issue" && (
                          <Badge className="text-[10px] py-0 h-4 bg-red-500/20 text-red-400">
                            Issue
                          </Badge>
                        )}
                      </div>

                      <p className={cn(
                        "text-sm truncate mt-1",
                        isUnread ? "text-slate-200" : "text-slate-500"
                      )}>
                        {conv.lastMessage.senderId === currentUserId && (
                          <span className="text-slate-400">You: </span>
                        )}
                        {conv.lastMessage.content}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-medium">{conv.unreadCount}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ConversationList;
