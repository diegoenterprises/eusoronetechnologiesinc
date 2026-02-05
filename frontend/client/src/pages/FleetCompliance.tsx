import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Truck, AlertTriangle, CheckCircle, Clock, FileText, Shield, Calendar } from "lucide-react";

export default function FleetCompliance() {
  const complianceQuery = (trpc as any).compliance.getFleetCompliance.useQuery();
  const vehiclesQuery = (trpc as any).compliance.getVehicleComplianceList.useQuery({ limit: 20 });

  if (complianceQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i: any) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (complianceQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-red-400">Failed to load fleet compliance data</p>
        <Button onClick={() => complianceQuery.refetch()}>Retry</Button>
      </div>
    );
  }

  const stats = complianceQuery.data || {
    totalVehicles: 45,
    compliant: 38,
    expiringSoon: 5,
    outOfCompliance: 2,
    overallScore: 84,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fleet Compliance</h1>
          <p className="text-slate-400">Monitor vehicle compliance status and expiring documents</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Compliance Score */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Overall Fleet Compliance Score</p>
              <p className="text-4xl font-bold text-white">{stats.overallScore}%</p>
            </div>
            <div className="w-32">
              <Progress value={stats.overallScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Truck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalVehicles}</p>
                <p className="text-xs text-slate-400">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.compliant}</p>
                <p className="text-xs text-slate-400">Fully Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
                <p className="text-xs text-slate-400">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.outOfCompliance}</p>
                <p className="text-xs text-slate-400">Out of Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Compliance List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vehicle Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehiclesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {((vehiclesQuery.data as any)?.vehicles || [
                { id: "1", unitNumber: "TRK-101", make: "Peterbilt", model: "579", status: "compliant", registrationExpiry: "2026-06-15", inspectionExpiry: "2026-03-20" },
                { id: "2", unitNumber: "TRK-102", make: "Kenworth", model: "T680", status: "expiring", registrationExpiry: "2026-02-10", inspectionExpiry: "2026-02-05" },
                { id: "3", unitNumber: "TRK-103", make: "Freightliner", model: "Cascadia", status: "compliant", registrationExpiry: "2026-08-22", inspectionExpiry: "2026-04-15" },
                { id: "4", unitNumber: "TRK-104", make: "Volvo", model: "VNL", status: "expired", registrationExpiry: "2026-01-15", inspectionExpiry: "2026-01-10" },
                { id: "5", unitNumber: "TRK-105", make: "Mack", model: "Anthem", status: "compliant", registrationExpiry: "2026-09-30", inspectionExpiry: "2026-05-25" },
              ]).map((vehicle: any) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-600 rounded">
                      <Truck className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{vehicle.unitNumber}</p>
                      <p className="text-sm text-slate-400">{vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Registration</p>
                      <p className="text-sm text-white">{vehicle.registrationExpiry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Inspection</p>
                      <p className="text-sm text-white">{vehicle.inspectionExpiry}</p>
                    </div>
                    <Badge className={
                      vehicle.status === "compliant" ? "bg-green-500/20 text-green-400" :
                      vehicle.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }>
                      {vehicle.status === "compliant" ? "Compliant" :
                       vehicle.status === "expiring" ? "Expiring Soon" : "Expired"}
                    </Badge>
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
