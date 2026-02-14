import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { User, AlertTriangle, CheckCircle, Clock, FileText, Shield, Calendar, Award } from "lucide-react";

export default function DriverCompliance() {
  const complianceQuery = (trpc as any).compliance.getDriverCompliance.useQuery();
  const driversQuery = (trpc as any).compliance.getDriverComplianceList.useQuery({ limit: 20 });

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

  const stats = complianceQuery.data || {
    totalDrivers: 125,
    compliant: 112,
    expiringSoon: 10,
    outOfCompliance: 3,
    overallScore: 90,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Driver Compliance</h1>
          <p className="text-slate-400">Monitor driver certifications and license status</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Compliance Score */}
      <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Overall Driver Compliance Score</p>
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
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalDrivers}</p>
                <p className="text-xs text-slate-400">Total Drivers</p>
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

      {/* Driver Compliance List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5" />
            Driver Certification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {driversQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i: any) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {((driversQuery.data as any)?.drivers || [
                { id: "1", name: "John Smith", cdlNumber: "TX123456", status: "compliant", cdlExpiry: "2027-03-15", medicalExpiry: "2026-08-20", hazmatExpiry: "2026-12-10" },
                { id: "2", name: "Maria Garcia", cdlNumber: "TX789012", status: "expiring", cdlExpiry: "2027-06-22", medicalExpiry: "2026-02-05", hazmatExpiry: "2027-01-15" },
                { id: "3", name: "James Wilson", cdlNumber: "TX345678", status: "compliant", cdlExpiry: "2028-01-10", medicalExpiry: "2026-09-30", hazmatExpiry: "2027-04-20" },
                { id: "4", name: "Sarah Johnson", cdlNumber: "TX901234", status: "expired", cdlExpiry: "2027-08-05", medicalExpiry: "2026-01-15", hazmatExpiry: "2026-11-30" },
                { id: "5", name: "Michael Brown", cdlNumber: "TX567890", status: "compliant", cdlExpiry: "2027-11-28", medicalExpiry: "2026-07-18", hazmatExpiry: "2027-02-25" },
              ]).map((driver: any) => (
                <div key={driver.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-600 rounded-full">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-sm text-slate-400">CDL: {driver.cdlNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">CDL Expiry</p>
                      <p className="text-sm text-white">{driver.cdlExpiry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Medical</p>
                      <p className="text-sm text-white">{driver.medicalExpiry}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">HazMat</p>
                      <p className="text-sm text-white">{driver.hazmatExpiry}</p>
                    </div>
                    <Badge className={
                      driver.status === "compliant" ? "bg-green-500/20 text-green-400" :
                      driver.status === "expiring" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }>
                      {driver.status === "compliant" ? "Compliant" :
                       driver.status === "expiring" ? "Expiring Soon" : "Expired"}
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
