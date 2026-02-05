import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { MapPin, Package, Clock, Truck, AlertTriangle, CheckCircle, Phone, Navigation, FileText } from "lucide-react";

export default function CurrentJob() {
  const jobQuery = (trpc as any).jobs.getCurrent.useQuery();

  if (jobQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const job = jobQuery.data || {
    id: "JOB-45901",
    loadNumber: "45901",
    status: "in_transit",
    progress: 65,
    pickup: { location: "Houston Ship Channel Terminal", address: "123 Terminal Road, Houston, TX", scheduledTime: "2026-01-25 08:00", completed: true },
    delivery: { location: "Dallas Distribution Center", address: "456 Industrial Blvd, Dallas, TX", scheduledTime: "2026-01-25 16:00", eta: "15:30" },
    cargo: { description: "Gasoline", unNumber: "UN1203", hazClass: "Class 3", weight: "54,000 lbs" },
    pay: 367.50,
    miles: 239,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Current Job</h1>
          <p className="text-slate-400">Load #{job.loadNumber}</p>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400">In Transit</Badge>
      </div>

      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Trip Progress</span>
            <span className="text-white font-bold">{job.progress}%</span>
          </div>
          <Progress value={job.progress} className="h-3 mb-4" />
          <div className="flex justify-between text-sm">
            <span className="text-green-400">Houston, TX ✓</span>
            <span className="text-blue-400">On I-45 N</span>
            <span className="text-slate-400">Dallas, TX</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" /> Pickup (Completed)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-medium">{job.pickup.location}</p>
            <p className="text-slate-400 text-sm">{job.pickup.address}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" /> Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white font-medium">{job.delivery.location}</p>
            <p className="text-slate-400 text-sm">{job.delivery.address}</p>
            <p className="text-blue-400 text-sm mt-2">ETA: {job.delivery.eta}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" /> Cargo Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-slate-500">Description</p><p className="text-white">{job.cargo.description}</p></div>
            <div><p className="text-xs text-slate-500">UN Number</p><p className="text-white">{job.cargo.unNumber}</p></div>
            <div><p className="text-xs text-slate-500">Hazard Class</p><p className="text-white">{job.cargo.hazClass}</p></div>
            <div><p className="text-xs text-slate-500">Weight</p><p className="text-white">{job.cargo.weight}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700 flex-1"><Navigation className="w-4 h-4 mr-2" />Navigate</Button>
        <Button variant="outline" className="border-slate-700 flex-1"><Phone className="w-4 h-4 mr-2" />Call Dispatch</Button>
        <Button variant="outline" className="border-slate-700 flex-1"><FileText className="w-4 h-4 mr-2" />View BOL</Button>
      </div>
    </div>
  );
}
