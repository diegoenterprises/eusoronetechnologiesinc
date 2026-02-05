/**
 * LOAD NEGOTIATION PAGE
 * Rate negotiation between brokers, carriers, and drivers
 * Counter-offers, rate history, and deal tracking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MessageSquare, DollarSign, TrendingUp, TrendingDown, Clock,
  CheckCircle, XCircle, ArrowRight, ArrowLeftRight, Send,
  Target, Sparkles, History, AlertTriangle
} from "lucide-react";

interface Negotiation {
  id: number;
  loadId: number;
  loadNumber: string;
  origin: string;
  destination: string;
  distance: number;
  initialRate: number;
  currentOffer: number;
  counterOffer: number | null;
  status: string;
  initiatedBy: string;
  otherParty: string;
  createdAt: string;
  updatedAt: string;
  messages: NegotiationMessage[];
}

interface NegotiationMessage {
  id: number;
  sender: string;
  type: string;
  amount: number | null;
  message: string;
  createdAt: string;
}

export default function LoadNegotiation() {
  const [activeTab, setActiveTab] = useState("active");
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [messageText, setMessageText] = useState("");

  const negotiationsQuery = (trpc as any).negotiations.list.useQuery({ status: activeTab === "all" ? undefined : activeTab });
  const statsQuery = (trpc as any).negotiations.getStats.useQuery();

  const counterOfferMutation = (trpc as any).negotiations.submitCounterOffer.useMutation({
    onSuccess: () => {
      toast.success("Counter offer sent");
      setCounterAmount("");
      negotiationsQuery.refetch();
    },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const acceptMutation = (trpc as any).negotiations.accept.useMutation({
    onSuccess: () => {
      toast.success("Offer accepted! Rate confirmed.");
      setSelectedNegotiation(null);
      negotiationsQuery.refetch();
      statsQuery.refetch();
    },
  });

  const rejectMutation = (trpc as any).negotiations.reject.useMutation({
    onSuccess: () => {
      toast.success("Offer rejected");
      setSelectedNegotiation(null);
      negotiationsQuery.refetch();
    },
  });

  const sendMessageMutation = (trpc as any).negotiations.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      negotiationsQuery.refetch();
    },
  });

  const stats = statsQuery.data;
  const negotiations = negotiationsQuery.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/20 text-yellow-400 border-0"><Clock className="w-3 h-3 mr-1" />Pending Response</Badge>;
      case "counter_offered": return <Badge className="bg-blue-500/20 text-blue-400 border-0"><ArrowLeftRight className="w-3 h-3 mr-1" />Counter Offered</Badge>;
      case "accepted": return <Badge className="bg-green-500/20 text-green-400 border-0"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-0"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "expired": return <Badge className="bg-slate-500/20 text-slate-400 border-0"><Clock className="w-3 h-3 mr-1" />Expired</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const calculateRatePerMile = (rate: number, distance: number) => {
    return distance > 0 ? (rate / distance).toFixed(2) : "0.00";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
            Rate Negotiations
          </h1>
          <p className="text-slate-400 text-sm mt-1">Negotiate rates and close deals</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-blue-400">{stats?.active || 0}</p>
                )}
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-green-400">{stats?.accepted || 0}</p>
                )}
                <p className="text-xs text-slate-400">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-cyan-400">{stats?.winRate || 0}%</p>
                )}
                <p className="text-xs text-slate-400">Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">${stats?.avgSavings || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/20">
                <History className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                {statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-orange-400">{stats?.avgRounds || 0}</p>
                )}
                <p className="text-xs text-slate-400">Avg Rounds</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Negotiations List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-800/50">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Awaiting Response</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {negotiationsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {negotiations.map((neg: Negotiation) => (
                    <Card 
                      key={neg.id} 
                      className={`bg-slate-800/50 border-slate-700/50 rounded-xl hover:border-cyan-500/30 transition-colors cursor-pointer ${selectedNegotiation?.id === neg.id ? 'border-cyan-500/50' : ''}`}
                      onClick={() => setSelectedNegotiation(neg)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-white font-semibold">Load #{neg.loadNumber}</p>
                              {getStatusBadge(neg.status)}
                            </div>
                            <p className="text-slate-400 text-sm">{neg.origin} → {neg.destination}</p>
                            <p className="text-slate-500 text-xs">{neg.distance} miles • With {neg.otherParty}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-sm line-through">${neg.initialRate}</span>
                              <ArrowRight className="w-4 h-4 text-slate-500" />
                              <span className="text-cyan-400 font-bold">${neg.currentOffer}</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">
                              ${calculateRatePerMile(neg.currentOffer, neg.distance)}/mi
                            </p>
                            {neg.counterOffer && (
                              <p className="text-yellow-400 text-sm mt-1">
                                Counter: ${neg.counterOffer}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {negotiations.length === 0 && (
                    <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400">No negotiations found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Negotiation Detail Panel */}
        <div>
          {selectedNegotiation ? (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center justify-between">
                  <span>Negotiation Details</span>
                  {getStatusBadge(selectedNegotiation.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rate Summary */}
                <div className="p-4 rounded-lg bg-slate-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Initial Rate</span>
                    <span className="text-white">${selectedNegotiation.initialRate}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Current Offer</span>
                    <span className="text-cyan-400 font-bold">${selectedNegotiation.currentOffer}</span>
                  </div>
                  {selectedNegotiation.counterOffer && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-400">Counter Offer</span>
                      <span className="text-yellow-400">${selectedNegotiation.counterOffer}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-600">
                    <span className="text-slate-400">Rate/Mile</span>
                    <span className="text-emerald-400">${calculateRatePerMile(selectedNegotiation.currentOffer, selectedNegotiation.distance)}</span>
                  </div>
                </div>

                {/* Message History */}
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedNegotiation.messages?.map((msg: any) => (
                    <div key={msg.id} className={`p-2 rounded-lg text-sm ${msg.sender === 'you' ? 'bg-cyan-500/20 ml-4' : 'bg-slate-700/50 mr-4'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400 text-xs">{msg.sender}</span>
                        <span className="text-slate-500 text-xs">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {msg.amount && (
                        <p className="text-cyan-400 font-semibold">{msg.type === 'offer' ? 'Offered' : 'Counter'}: ${msg.amount}</p>
                      )}
                      {msg.message && <p className="text-slate-300">{msg.message}</p>}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {selectedNegotiation.status === "pending" || selectedNegotiation.status === "counter_offered" ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Counter amount"
                        value={counterAmount}
                        onChange={(e: any) => setCounterAmount(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Button
                        onClick={() => counterOfferMutation.mutate({
                          negotiationId: selectedNegotiation.id,
                          amount: parseFloat(counterAmount),
                        })}
                        disabled={!counterAmount || counterOfferMutation.isPending}
                        className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        Counter
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => acceptMutation.mutate({ negotiationId: selectedNegotiation.id })}
                        className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />Accept
                      </Button>
                      <Button
                        onClick={() => rejectMutation.mutate({ negotiationId: selectedNegotiation.id })}
                        variant="outline"
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" />Reject
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a message..."
                        value={messageText}
                        onChange={(e: any) => setMessageText(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Button
                        onClick={() => sendMessageMutation.mutate({
                          negotiationId: selectedNegotiation.id,
                          message: messageText,
                        })}
                        disabled={!messageText}
                        size="icon"
                        className="bg-slate-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400">This negotiation is {selectedNegotiation.status}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Select a negotiation to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
