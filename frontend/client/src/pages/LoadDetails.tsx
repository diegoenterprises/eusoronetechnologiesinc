/**
 * LOAD DETAILS PAGE
 * 100% Dynamic - No mock data
 */

import React, { useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Clock, Calendar, Truck, User, Building,
  DollarSign, FileText, Phone, Mail, Navigation, CheckCircle,
  AlertTriangle, Download, Eye, MessageSquare, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function LoadDetails() {
  const params = useParams<{ loadId: string }>();
  const [activeTab, setActiveTab] = useState("details");

  const loadQuery = trpc.loads.getById.useQuery({ id: params.loadId || "" }, { enabled: !!params.loadId });
  const documentsQuery = trpc.loads.getDocuments.useQuery({ loadId: params.loadId || "" }, { enabled: !!params.loadId });
  const trackingQuery = trpc.tracking.getLoadTracking.useQuery({ loadId: params.loadId || "" }, { enabled: !!params.loadId });

  const acceptMutation = trpc.loads.accept.useMutation({
    onSuccess: () => { toast.success("Load accepted"); loadQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  const updateStatusMutation = trpc.loads.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); loadQuery.refetch(); trackingQuery.refetch(); },
    onError: (error) => toast.error("Failed", { description: error.message }),
  });

  if (loadQuery.error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400">Error loading load details</p>
        <Button className="mt-4" onClick={() => loadQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const load = loadQuery.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-500/20 text-green-400";
      case "in_transit": return "bg-blue-500/20 text-blue-400";
      case "at_pickup": case "at_delivery": return "bg-yellow-500/20 text-yellow-400";
      case "available": return "bg-purple-500/20 text-purple-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {loadQuery.isLoading ? <Skeleton className="h-8 w-48" /> : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{load?.loadNumber}</h1>
              <Badge className={getStatusColor(load?.status || "")}>{load?.status?.replace("_", " ")}</Badge>
            </div>
          )}
          <p className="text-slate-400 mt-1">
            {loadQuery.isLoading ? <Skeleton className="h-4 w-64" /> : `${load?.commodity} - ${load?.weight}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-600"><Download className="w-4 h-4 mr-2" />BOL</Button>
          <Button variant="outline" className="border-slate-600"><MessageSquare className="w-4 h-4 mr-2" />Message</Button>
          {load?.status === "available" && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => params.loadId && acceptMutation.mutate({ loadId: params.loadId })} disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" />Accept Load</>}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-blue-400" />
              <div>
                {loadQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">{load?.distance}</p>
                )}
                <p className="text-xs text-slate-400">Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                {loadQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-green-400">${load?.rate?.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-400">Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-400" />
              <div>
                {loadQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-purple-400">{load?.weight}</p>
                )}
                <p className="text-xs text-slate-400">Weight</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-orange-400" />
              <div>
                {loadQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-orange-400">${load?.ratePerMile?.toFixed(2)}</p>
                )}
                <p className="text-xs text-slate-400">Per Mile</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div className="w-0.5 h-16 bg-slate-600" />
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <p className="text-xs text-slate-500">PICKUP</p>
                    {loadQuery.isLoading ? <Skeleton className="h-6 w-48" /> : (
                      <>
                        <p className="text-white font-medium">{load?.origin?.facility}</p>
                        <p className="text-slate-400">{load?.origin?.city}, {load?.origin?.state}</p>
                        <p className="text-sm text-slate-500">{load?.pickupDate} - {load?.pickupTime}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">DELIVERY</p>
                    {loadQuery.isLoading ? <Skeleton className="h-6 w-48" /> : (
                      <>
                        <p className="text-white font-medium">{load?.destination?.facility}</p>
                        <p className="text-slate-400">{load?.destination?.city}, {load?.destination?.state}</p>
                        <p className="text-sm text-slate-500">{load?.deliveryDate} - {load?.deliveryTime}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-64 h-40 bg-slate-700/50 rounded-lg flex items-center justify-center">
              <Navigation className="w-8 h-8 text-slate-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-blue-600">Details</TabsTrigger>
          <TabsTrigger value="tracking" className="data-[state=active]:bg-blue-600">Tracking</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600">Documents</TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-blue-600">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Load Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {loadQuery.isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-slate-400">Commodity</span><span className="text-white">{load?.commodity}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Weight</span><span className="text-white">{load?.weight}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Equipment</span><span className="text-white">{load?.equipment}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Temperature</span><span className="text-white">{load?.temperature || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Hazmat</span><Badge className={load?.hazmat ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>{load?.hazmat ? "Yes" : "No"}</Badge></div>
                    {load?.hazmat && <div className="flex justify-between"><span className="text-slate-400">UN Number</span><span className="text-white">{load?.unNumber}</span></div>}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Shipper Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {loadQuery.isLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-slate-400" />
                      <span className="text-white">{load?.shipper?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-white">{load?.shipper?.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="text-white">{load?.shipper?.email}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Tracking History</CardTitle></CardHeader>
            <CardContent>
              {trackingQuery.isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : trackingQuery.data?.events?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No tracking events yet</p>
              ) : (
                <div className="space-y-4">
                  {trackingQuery.data?.events?.map((event, idx) => (
                    <div key={event.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-4 h-4 rounded-full", idx === 0 ? "bg-blue-500" : "bg-slate-600")} />
                        {idx < (trackingQuery.data?.events?.length || 0) - 1 && <div className="w-0.5 h-12 bg-slate-700 mt-2" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{event.status}</p>
                          <span className="text-xs text-slate-500">{event.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-400">{event.location}</p>
                        {event.notes && <p className="text-sm text-slate-500 mt-1">{event.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="text-white">Documents</CardTitle></CardHeader>
            <CardContent>
              {documentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : documentsQuery.data?.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No documents uploaded</p>
              ) : (
                <div className="space-y-3">
                  {documentsQuery.data?.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.type} - {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loadQuery.isLoading ? (
              [1, 2].map((i) => <Card key={i} className="bg-slate-800/50 border-slate-700"><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>)
            ) : (
              <>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-green-400" />Pickup Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><span className="text-white">{load?.origin?.contact?.name}</span></div>
                    <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span className="text-white">{load?.origin?.contact?.phone}</span></div>
                    <Button variant="outline" className="w-full border-slate-600"><Phone className="w-4 h-4 mr-2" />Call</Button>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-red-400" />Delivery Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><span className="text-white">{load?.destination?.contact?.name}</span></div>
                    <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span className="text-white">{load?.destination?.contact?.phone}</span></div>
                    <Button variant="outline" className="w-full border-slate-600"><Phone className="w-4 h-4 mr-2" />Call</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
