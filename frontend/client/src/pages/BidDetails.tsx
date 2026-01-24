/**
 * BID DETAILS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Truck, MapPin, Clock, Calendar, User, Building,
  TrendingUp, CheckCircle, XCircle, AlertTriangle, MessageSquare,
  FileText, Calculator, ChevronRight, Shield, Star, Phone, Mail,
  Navigation, Package, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BidDetails() {
  const params = useParams<{ bidId: string }>();
  const [activeTab, setActiveTab] = useState("details");
  const [counterOffer, setCounterOffer] = useState("");
  const [counterNotes, setCounterNotes] = useState("");

  const bidQuery = trpc.bids.getById.useQuery({ id: params.bidId || "" }, { enabled: !!params.bidId });
  const historyQuery = trpc.bids.getHistory.useQuery({ bidId: params.bidId || "" }, { enabled: !!params.bidId });

  const acceptMutation = trpc.bids.accept.useMutation({
    onSuccess: () => {
      toast.success("Bid accepted!", { description: "Carrier has been notified" });
      bidQuery.refetch();
    },
    onError: (error) => toast.error("Failed to accept bid", { description: error.message }),
  });

  const rejectMutation = trpc.bids.reject.useMutation({
    onSuccess: () => {
      toast.info("Bid rejected", { description: "Carrier has been notified" });
      bidQuery.refetch();
    },
    onError: (error) => toast.error("Failed to reject bid", { description: error.message }),
  });

  const counterMutation = trpc.bids.counter.useMutation({
    onSuccess: () => {
      toast.success("Counter offer sent");
      setCounterOffer("");
      setCounterNotes("");
      bidQuery.refetch();
      historyQuery.refetch();
    },
    onError: (error) => toast.error("Failed to send counter", { description: error.message }),
  });

  if (bidQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading bid</p>
        <p className="text-sm text-slate-500 mt-2">{bidQuery.error.message}</p>
        <Button className="mt-4" onClick={() => bidQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const bid = bidQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/20 text-green-400";
      case "pending": return "bg-yellow-500/20 text-yellow-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "countered": return "bg-blue-500/20 text-blue-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const submitCounterOffer = () => {
    if (!counterOffer || !params.bidId) return;
    counterMutation.mutate({
      bidId: params.bidId,
      amount: parseFloat(counterOffer),
      notes: counterNotes || undefined,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {bidQuery.isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">BID-{params.bidId}</h1>
              <Badge className={getStatusColor(bid?.status || "")}>{bid?.status}</Badge>
            </div>
          )}
          <p className="text-slate-400 mt-1">
            {bidQuery.isLoading ? <Skeleton className="h-4 w-64" /> : `Load: ${bid?.loadNumber}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400"
            onClick={() => params.bidId && rejectMutation.mutate({ bidId: params.bidId })}
            disabled={rejectMutation.isPending || bid?.status !== "pending"}
          >
            {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" />Reject</>}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => params.bidId && acceptMutation.mutate({ bidId: params.bidId })}
            disabled={acceptMutation.isPending || bid?.status !== "pending"}
          >
            {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Accept Bid</>}
          </Button>
        </div>
      </div>

      {/* Bid Amount Card */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Current Bid</p>
              {bidQuery.isLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <>
                  <p className="text-4xl font-bold text-green-400">${bid?.amount?.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 mt-1">${bid?.ratePerMile?.toFixed(2)}/mile</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Expires</p>
              {bidQuery.isLoading ? <Skeleton className="h-6 w-32" /> : (
                <p className="text-white font-medium">{bid?.expiresAt}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-blue-400" />
              <div>
                {bidQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{bid?.distance}</p>
                )}
                <p className="text-xs text-slate-400">Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                {bidQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-green-400">${bid?.estimatedProfit}</p>
                )}
                <p className="text-xs text-slate-400">Est. Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-purple-400" />
              <div>
                {bidQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-purple-400">{bid?.margin}%</p>
                )}
                <p className="text-xs text-slate-400">Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                {bidQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-yellow-400">{bid?.carrier?.rating}</p>
                )}
                <p className="text-xs text-slate-400">Carrier Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-green-600">Bid Details</TabsTrigger>
          <TabsTrigger value="carrier" className="data-[state=active]:bg-green-600">Carrier</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">Bid History</TabsTrigger>
          <TabsTrigger value="counter" className="data-[state=active]:bg-green-600">Counter Offer</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          {bidQuery.isLoading ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />Load Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Load Number</span>
                  <span className="text-white font-medium">{bid?.loadNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Commodity</span>
                  <span className="text-white">{bid?.commodity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weight</span>
                  <span className="text-white">{bid?.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Equipment</span>
                  <span className="text-white">{bid?.equipment}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div>
                  <p className="text-xs text-slate-500 mb-2">ORIGIN</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-white">{bid?.origin?.city}, {bid?.origin?.state}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">DESTINATION</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span className="text-white">{bid?.destination?.city}, {bid?.destination?.state}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="carrier" className="mt-6">
          {bidQuery.isLoading ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-400" />Carrier Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-white">{bid?.carrier?.name}</p>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-500/20 text-blue-400">{bid?.carrier?.mcNumber}</Badge>
                    <Badge className="bg-slate-500/20 text-slate-400">{bid?.carrier?.dotNumber}</Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">{bid?.carrier?.saferScore}</p>
                        <p className="text-xs text-slate-500">SAFER Score</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <div>
                        <p className="text-white font-medium">{bid?.carrier?.rating}</p>
                        <p className="text-xs text-slate-500">Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Bid History</CardTitle></CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : historyQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No bid history</p>
              ) : (
                <div className="space-y-4">
                  {historyQuery.data?.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                        </div>
                        {idx < (historyQuery.data?.length || 0) - 1 && <div className="w-0.5 h-12 bg-slate-700 mt-2" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">${item.amount?.toLocaleString()}</p>
                            <p className="text-sm text-slate-400">{item.bidder}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(item.type)}>{item.type}</Badge>
                            <p className="text-xs text-slate-500 mt-1">{item.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counter" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Submit Counter Offer</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Current Bid: ${bid?.amount?.toLocaleString()}</p>
                    <p className="text-sm text-slate-400 mt-1">Consider your counter carefully.</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Counter Offer Amount</Label>
                <div className="relative mt-1">
                  <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    value={counterOffer}
                    onChange={(e) => setCounterOffer(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Notes (Optional)</Label>
                <Textarea
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="mt-1 bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Add any notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="border-slate-600">Cancel</Button>
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={submitCounterOffer}
                  disabled={counterMutation.isPending || !counterOffer}
                >
                  {counterMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Counter Offer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
