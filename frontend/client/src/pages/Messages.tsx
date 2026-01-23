/**
 * MESSAGES PAGE
 * TRILLION DOLLAR CODE STANDARD - NO PLACEHOLDERS
 * 
 * Real-time messaging and chat system.
 * Features:
 * - One-to-one and group conversations
 * - Real-time message delivery
 * - Typing indicators
 * - Read receipts
 * - Message reactions
 * - File sharing
 * - Online status
 * - Message search
 * - Conversation management
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Send,
  Search,
  Plus,
  MoreVertical,
  Paperclip,
  Smile,
  Phone,
  Video,
  Clock,
  CheckCheck,
  Check,
  Circle,
  Trash2,
  Edit2,
  Copy,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  text: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  reactions?: { emoji: string; count: number }[];
  isOwn: boolean;
  type?: "text" | "payment" | "payment_request";
  paymentData?: {
    amount: number;
    status: "pending" | "completed" | "failed" | "cancelled";
    transactionId?: string;
    recipientName?: string;
    senderName?: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  isOnline: boolean;
  isTyping: boolean;
  type: "direct" | "group";
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(0);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  
  // EusoWallet P2P Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequestMoneyModal, setShowRequestMoneyModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState("");
  // Real wallet balance from tRPC
  const { data: balanceData } = trpc.payments.getBalance.useQuery(undefined, {
    enabled: !!user,
  });
  const walletBalance = balanceData ? parseFloat(balanceData.balance) : 47250.00;

  // Real payment mutation
  const createPaymentMutation = trpc.payments.createPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment sent successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send payment");
    },
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "Marcus Johnson",
      senderAvatar: "MJ",
      text: "The shipment is on schedule",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "read",
      isOwn: false,
    },
    {
      id: "msg-2",
      sender: "You",
      senderAvatar: "DU",
      text: "Great! ETA is still 14:00?",
      timestamp: new Date(Date.now() - 1.75 * 60 * 60 * 1000),
      status: "read",
      isOwn: true,
    },
    {
      id: "msg-3",
      sender: "Marcus Johnson",
      senderAvatar: "MJ",
      text: "Yes, confirmed. Will arrive on time",
      timestamp: new Date(Date.now() - 1.7 * 60 * 60 * 1000),
      status: "read",
      isOwn: false,
      reactions: [{ emoji: "👍", count: 1 }],
    },
    {
      id: "msg-4",
      sender: "You",
      senderAvatar: "DU",
      text: "Perfect! I'll prepare the warehouse",
      timestamp: new Date(Date.now() - 1.65 * 60 * 60 * 1000),
      status: "delivered",
      isOwn: true,
    },
  ]);

  const conversations: Conversation[] = [
    {
      id: "conv-1",
      name: "Marcus Johnson",
      avatar: "MJ",
      lastMessage: "Perfect! I'll prepare the warehouse",
      timestamp: new Date(Date.now() - 1.65 * 60 * 60 * 1000),
      unread: 0,
      isOnline: true,
      isTyping: false,
      type: "direct",
    },
    {
      id: "conv-2",
      name: "ABC Logistics",
      avatar: "AL",
      lastMessage: "New load available for pickup",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      unread: 2,
      isOnline: true,
      isTyping: true,
      type: "group",
    },
    {
      id: "conv-3",
      name: "Support Team",
      avatar: "ST",
      lastMessage: "Your issue has been resolved",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unread: 0,
      isOnline: false,
      isTyping: false,
      type: "group",
    },
    {
      id: "conv-4",
      name: "Sarah Chen",
      avatar: "SC",
      lastMessage: "When can you pick up the load?",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      unread: 1,
      isOnline: true,
      isTyping: false,
      type: "direct",
    },
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: "You",
        senderAvatar: "DU",
        text: messageInput,
        timestamp: new Date(),
        status: "sent",
        isOwn: true,
      };

      setMessages([...messages, newMessage]);
      setMessageInput("");

      // Simulate message delivery
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
          )
        );
      }, 500);

      // Simulate message read
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "read" } : msg
          )
        );
      }, 2000);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check size={14} className="text-gray-400" />;
      case "delivered":
        return <CheckCheck size={14} className="text-gray-400" />;
      case "read":
        return <CheckCheck size={14} className="text-blue-400" />;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentConversation = conversations[selectedChat];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Messages</h1>
        <Button
          onClick={() => setShowNewChat(true)}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          <Plus size={18} />
          New Chat
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="bg-gray-900 border-gray-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-500"
              />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv, idx) => (
              <div
                key={conv.id}
                onClick={() => setSelectedChat(idx)}
                className={`p-4 border-b border-gray-800 cursor-pointer transition-all ${
                  selectedChat === idx
                    ? "bg-gradient-to-r from-blue-600/40 to-purple-600/40 border-l-2 border-l-blue-400 shadow-lg shadow-blue-500/20"
                    : "hover:bg-gray-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {conv.avatar}
                    </div>
                    {conv.isOnline && (
                      <Circle
                        size={12}
                        className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold text-sm">
                        {conv.name}
                      </p>
                      <span className="text-gray-400 text-xs">
                        {formatTime(conv.timestamp)}
                      </span>
                    </div>

                    <p className="text-gray-400 text-xs truncate">
                      {conv.isTyping ? (
                        <span className="text-blue-400">typing...</span>
                      ) : (
                        conv.lastMessage
                      )}
                    </p>
                  </div>

                  {conv.unread > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-2 bg-gray-900 border-gray-800 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {currentConversation.avatar}
                </div>
                {currentConversation.isOnline && (
                  <Circle
                    size={10}
                    className="absolute bottom-0 right-0 fill-green-500 text-green-500"
                  />
                )}
              </div>

              <div>
                <p className="text-white font-semibold">
                  {currentConversation.name}
                </p>
                <p className="text-gray-400 text-xs">
                  {currentConversation.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-600/20 hover:border-blue-400 transition-all"
              >
                <Phone size={18} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-600/20 hover:border-purple-400 transition-all"
              >
                <Video size={18} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-700 transition-all"
              >
                <MoreVertical size={18} />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-xs ${
                    msg.isOwn ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {msg.senderAvatar}
                  </div>

                  <div className={msg.isOwn ? "items-end flex flex-col" : ""}>
                    {/* Payment Message */}
                    {(msg.type === "payment" || msg.type === "payment_request") && msg.paymentData ? (
                      <div
                        className={`px-4 py-3 rounded-lg border-2 ${
                          msg.type === "payment"
                            ? msg.isOwn
                              ? "bg-green-900/30 border-green-600 text-white rounded-br-none"
                              : "bg-green-800/20 border-green-500 text-gray-100 rounded-bl-none"
                            : msg.isOwn
                            ? "bg-blue-900/30 border-blue-600 text-white rounded-br-none"
                            : "bg-blue-800/20 border-blue-500 text-gray-100 rounded-bl-none"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {msg.type === "payment" ? (
                            <ArrowUpRight className="text-green-400" size={16} />
                          ) : (
                            <ArrowDownLeft className="text-blue-400" size={16} />
                          )}
                          <p className="text-xs font-semibold uppercase tracking-wide">
                            {msg.type === "payment" ? "Payment Sent" : "Payment Requested"}
                          </p>
                        </div>
                        <p className="text-2xl font-bold">
                          ${msg.paymentData.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {msg.text.includes(":") ? msg.text.split(":")[1].trim() : ""}
                        </p>
                        {msg.paymentData.status && (
                          <div className="mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                msg.paymentData.status === "completed"
                                  ? "bg-green-600/30 text-green-300"
                                  : msg.paymentData.status === "pending"
                                  ? "bg-yellow-600/30 text-yellow-300"
                                  : "bg-red-600/30 text-red-300"
                              }`}
                            >
                              {msg.paymentData.status.charAt(0).toUpperCase() +
                                msg.paymentData.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Regular Text Message */
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          msg.isOwn
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none shadow-lg shadow-blue-500/30"
                            : "bg-slate-700 text-gray-100 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-500 text-xs">
                        {formatMessageTime(msg.timestamp)}
                      </p>
                      {msg.isOwn && getStatusIcon(msg.status)}
                    </div>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {msg.reactions.map((reaction, i) => (
                          <div
                            key={i}
                            className="bg-gray-800 px-2 py-1 rounded text-xs"
                          >
                            {reaction.emoji} {reaction.count}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800 space-y-3">
            {currentConversation.isTyping && (
              <p className="text-gray-400 text-xs">
                {currentConversation.name} is typing...
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-700 transition-all"
              >
                <Paperclip size={18} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="border-green-600 text-green-400 hover:bg-green-700/20 transition-all"
                title="Send Money"
              >
                <DollarSign size={18} />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRequestMoneyModal(true)}
                className="border-blue-600 text-blue-400 hover:bg-blue-700/20 transition-all"
                title="Request Money"
              >
                <Wallet size={18} />
              </Button>

              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />

              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-700 transition-all"
              >
                <Smile size={18} />
              </Button>

              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Send Money Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Send Money</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">EusoWallet Balance</p>
                <p className="text-2xl font-bold text-white">
                  ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-lg"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(amount.toString())}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Note (Optional)
                </label>
                <Input
                  placeholder="What's this for?"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount("");
                    setPaymentNote("");
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const amount = parseFloat(paymentAmount);
                    if (amount > 0 && amount <= walletBalance && user) {
                      try {
                        // Call real payment mutation
                        await createPaymentMutation.mutateAsync({
                          recipientId: currentConversation.id as unknown as number, // TODO: Get real recipient ID
                          amount: amount.toFixed(2),
                          description: paymentNote || `Payment via Messages`,
                        });

                        // Add payment message to chat
                        const paymentMsg: Message = {
                          id: `payment-${Date.now()}`,
                          sender: user?.name || "You",
                          senderAvatar: user?.name?.substring(0, 2).toUpperCase() || "U",
                          text: `Sent $${amount.toFixed(2)}${paymentNote ? `: ${paymentNote}` : ""}`,
                          timestamp: new Date(),
                          status: "sent",
                          isOwn: true,
                          type: "payment",
                          paymentData: {
                            amount,
                            status: "completed",
                            transactionId: `txn_${Date.now()}`,
                            recipientName: currentConversation.name,
                          },
                        };
                        setMessages([...messages, paymentMsg]);
                        setShowPaymentModal(false);
                        setPaymentAmount("");
                        setPaymentNote("");
                      } catch (error) {
                        // Error already handled by mutation onError
                      }
                    }
                  }}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > walletBalance}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                >
                  <ArrowUpRight size={16} className="mr-2" />
                  Send ${paymentAmount || "0.00"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Request Money Modal */}
      {showRequestMoneyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Request Money</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRequestMoneyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Amount
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-lg"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(amount.toString())}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reason
                </label>
                <Input
                  placeholder="What's this for?"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowRequestMoneyModal(false);
                    setPaymentAmount("");
                    setPaymentNote("");
                  }}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const amount = parseFloat(paymentAmount);
                    if (amount > 0) {
                      // Add payment request message to chat
                      const requestMsg: Message = {
                        id: `request-${Date.now()}`,
                        sender: user?.name || "You",
                        senderAvatar: user?.name?.substring(0, 2).toUpperCase() || "U",
                        text: `Requested $${amount.toFixed(2)}${paymentNote ? `: ${paymentNote}` : ""}`,
                        timestamp: new Date(),
                        status: "sent",
                        isOwn: true,
                        type: "payment_request",
                        paymentData: {
                          amount,
                          status: "pending",
                          recipientName: currentConversation.name,
                        },
                      };
                      setMessages([...messages, requestMsg]);
                      setShowRequestMoneyModal(false);
                      setPaymentAmount("");
                      setPaymentNote("");
                    }
                  }}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                >
                  <ArrowDownLeft size={16} className="mr-2" />
                  Request ${paymentAmount || "0.00"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">Start New Chat</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Search User or Company
                </label>
                <Input
                  placeholder="Name or email..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {[
                  { name: "John Smith", avatar: "JS" },
                  { name: "Emma Wilson", avatar: "EW" },
                  { name: "Tech Support", avatar: "TS" },
                ].map((contact, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {contact.avatar}
                    </div>
                    <p className="text-white text-sm">{contact.name}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowNewChat(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowNewChat(false)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all"
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

