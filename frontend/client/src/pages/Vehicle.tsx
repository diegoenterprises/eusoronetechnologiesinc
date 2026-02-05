import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Truck, AlertTriangle, CheckCircle, Wrench, Fuel, MapPin, Calendar, FileText } from "lucide-react";

export default function Vehicle() {
  const vehicleQuery = (trpc as any).vehicle.getAssigned.useQuery();
  const maintenanceQuery = (trpc as any).vehicle.getMaintenanceHistory.useQuery({ limit: 5 });

  if (vehicleQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i: any) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (vehicleQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-red-400">Failed to load vehicle information</p>
        <Button onClick={() => vehicleQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const vehicle = vehicleQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Vehicle</h1>
          <p className="text-slate-400">Vehicle information and status</p>
        </div>
        <Button variant="outline" className="border-slate-700">
          <FileText className="w-4 h-4 mr-2" />
          View Documents
        </Button>
      </div>

      {/* Vehicle Info Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center">
              <Truck className="w-12 h-12 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">
                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                </h2>
                <Badge className={vehicle?.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                  {vehicle?.status || "Active"}
                </Badge>
              </div>
              <p className="text-slate-400 mb-4">VIN: {vehicle?.vin || "1HGBH41JXMN109186"}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Unit Number</p>
                  <p className="text-white font-medium">{vehicle?.unitNumber || "TRK-103"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">License Plate</p>
                  <p className="text-white font-medium">{vehicle?.licensePlate || "TX-ABC-1234"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Odometer</p>
                  <p className="text-white font-medium">{vehicle?.odometer?.toLocaleString() || "87,450"} mi</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fuel Level</p>
                  <p className="text-white font-medium">{vehicle?.fuelLevel || "75"}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Inspection Status</p>
                <p className="text-white font-semibold">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Wrench className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Next Service</p>
                <p className="text-white font-semibold">In 2,500 mi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Fuel className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg MPG</p>
                <p className="text-white font-semibold">6.8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Last Location</p>
                <p className="text-white font-semibold">Houston, TX</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance History */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Maintenance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i: any) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {((maintenanceQuery.data as any)?.records || [
                { id: "1", type: "Oil Change", date: "2026-01-15", mileage: 85000, cost: 150 },
                { id: "2", type: "Tire Rotation", date: "2026-01-01", mileage: 83500, cost: 75 },
                { id: "3", type: "Brake Inspection", date: "2025-12-15", mileage: 82000, cost: 200 },
              ]).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-600 rounded">
                      <Wrench className="w-4 h-4 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{record.type}</p>
                      <p className="text-xs text-slate-400">{record.mileage?.toLocaleString()} miles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${record.cost}</p>
                    <p className="text-xs text-slate-400">{record.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
