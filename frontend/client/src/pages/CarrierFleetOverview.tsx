/**
 * CARRIER FLEET OVERVIEW PAGE
 * Fleet management dashboard for carriers
 * 100% dynamic - no mock data
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, Users, MapPin, Fuel, Wrench, 
  AlertTriangle, CheckCircle, RefreshCw, Plus
} from "lucide-react";
import { Link } from "wouter";

export default function CarrierFleetOverview() {
  const { data: fleetStats, isLoading, error, refetch } = trpc.fleet.getStats.useQuery();
  const { data: vehicles } = trpc.vehicles.list.useQuery({ limit: 10 });
  const { data: drivers } = trpc.drivers.list.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700">Error Loading Fleet Data</h3>
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = fleetStats || { totalVehicles: 0, activeVehicles: 0, totalDrivers: 0, activeDrivers: 0 };
  const vehicleList = vehicles || [];
  const driverList = drivers || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" /> Fleet Overview
          </h1>
          <p className="text-muted-foreground">Manage your vehicles and drivers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/fleet/drivers/add">
              <Users className="h-4 w-4 mr-2" /> Add Driver
            </Link>
          </Button>
          <Button asChild>
            <Link href="/fleet/vehicles/add">
              <Plus className="h-4 w-4 mr-2" /> Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="text-3xl font-bold">{stats.totalVehicles}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Active</span>
                <span>{stats.activeVehicles} / {stats.totalVehicles}</span>
              </div>
              <Progress value={stats.totalVehicles > 0 ? (stats.activeVehicles / stats.totalVehicles) * 100 : 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-3xl font-bold">{stats.totalDrivers}</p>
              </div>
              <Users className="h-10 w-10 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>On Duty</span>
                <span>{stats.activeDrivers} / {stats.totalDrivers}</span>
              </div>
              <Progress value={stats.totalDrivers > 0 ? (stats.activeDrivers / stats.totalDrivers) * 100 : 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                <p className="text-3xl font-bold">{stats.utilization || 0}%</p>
              </div>
              <MapPin className="h-10 w-10 text-purple-500" />
            </div>
            <div className="mt-4">
              <Progress value={stats.utilization || 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Due</p>
                <p className="text-3xl font-bold">{stats.maintenanceDue || 0}</p>
              </div>
              <Wrench className="h-10 w-10 text-orange-500" />
            </div>
            <div className="mt-4">
              <Badge variant={stats.maintenanceDue > 0 ? "destructive" : "secondary"}>
                {stats.maintenanceDue > 0 ? "Action Required" : "All Good"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Vehicles</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/fleet/vehicles">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicleList.length > 0 ? (
              <div className="space-y-3">
                {vehicleList.slice(0, 5).map((vehicle: any) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{vehicle.unitNumber || vehicle.licensePlate}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</p>
                      </div>
                    </div>
                    <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>
                      {vehicle.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No vehicles added yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Drivers</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/fleet/drivers">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driverList.length > 0 ? (
              <div className="space-y-3">
                {driverList.slice(0, 5).map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                        <p className="text-sm text-muted-foreground">CDL: {driver.cdlNumber || "N/A"}</p>
                      </div>
                    </div>
                    <Badge variant={driver.status === "active" ? "default" : "secondary"}>
                      {driver.hosStatus || driver.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No drivers added yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
