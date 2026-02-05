/**
 * BROKER LOAD BOARD PAGE
 * Load matching and carrier assignment for brokers
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Truck, DollarSign, MapPin, Clock, 
  AlertTriangle, RefreshCw, Search, Filter, ArrowRight
} from "lucide-react";

export default function BrokerLoadBoard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("available");

  const { data: availableLoads, isLoading: loadsLoading, error: loadsError, refetch: refetchLoads } = 
    (trpc as any).loads.list.useQuery({});
  const { data: carriers, isLoading: carriersLoading } = 
    (trpc as any).carriers.list.useQuery({ limit: 20 });
  const { data: stats } = (trpc as any).brokers.getDashboardStats.useQuery();

  const assignMutation = (trpc as any).loads.create.useMutation({
    onSuccess: () => refetchLoads(),
  });

  if (loadsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i: any) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (loadsError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700">Error Loading Data</h3>
              <p className="text-red-600 text-sm">{loadsError.message}</p>
            </div>
            <Button variant="outline" onClick={() => refetchLoads()} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loads = availableLoads || [];
  const carrierList = carriers || [];
  const brokerStats = stats || { activeLoads: 0, pendingMatches: 0, weeklyVolume: 0, commission: 0 };

  const filteredLoads = loads.filter((load: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      load.loadNumber?.toLowerCase().includes(query) ||
      load.originCity?.toLowerCase().includes(query) ||
      load.destinationCity?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" /> Load Board
          </h1>
          <p className="text-muted-foreground">Match loads with carriers</p>
        </div>
        <Button onClick={() => refetchLoads()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{brokerStats.activeLoads}</p>
            <p className="text-sm text-muted-foreground">Active Loads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{brokerStats.pendingMatches}</p>
            <p className="text-sm text-muted-foreground">Pending Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{brokerStats.weeklyVolume}</p>
            <p className="text-sm text-muted-foreground">Weekly Volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">${(brokerStats as any).commission?.toLocaleString() || (brokerStats as any).commissionEarned?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground">Commission Earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loads by number, origin, or destination..."
            className="pl-10"
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="available">Available Loads ({loads.length})</TabsTrigger>
          <TabsTrigger value="carriers">Available Carriers ({carrierList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {filteredLoads.length > 0 ? (
            filteredLoads.map((load: any) => (
              <Card key={load.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{load.loadNumber}</Badge>
                        <Badge className={load.cargoType === "hazmat" ? "bg-red-500" : "bg-blue-500"}>
                          {load.cargoType}
                        </Badge>
                        {load.hazmatClass && (
                          <Badge variant="destructive">Class {load.hazmatClass}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span>{load.pickupLocation?.city}, {load.pickupLocation?.state}</span>
                        <ArrowRight className="h-4 w-4" />
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>{load.deliveryLocation?.city}, {load.deliveryLocation?.state}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{load.weight} {load.weightUnit}</span>
                        <span>{load.distance} miles</span>
                        <span className="font-medium text-green-600">${load.rate?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm">
                        Match Carrier
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Loads Found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          {carrierList.length > 0 ? (
            carrierList.map((carrier: any) => (
              <Card key={carrier.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{carrier.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>MC# {carrier.mcNumber}</span>
                        <span>DOT# {carrier.dotNumber}</span>
                        <Badge variant={carrier.saferVerified ? "default" : "secondary"}>
                          {carrier.saferVerified ? "SAFER Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{carrier.availableCapacity || 0} trucks available</p>
                      <p className="text-sm text-muted-foreground">Safety Score: {carrier.safetyScore || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Carriers Available</h3>
                <p className="text-muted-foreground">No carriers match your criteria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
