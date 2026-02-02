import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  Palmtree,
  Stethoscope,
  Users,
  FileText,
  Trash2,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function DriverTimeOff() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const {
    data: timeOffData,
    isLoading,
    error,
    refetch,
  } = trpc.driver.getTimeOffRequests.useQuery({
    status: statusFilter,
    year: yearFilter,
  });

  const submitRequestMutation = trpc.driver.submitTimeOffRequest.useMutation({
    onSuccess: () => {
      toast.success("Time off request submitted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit request");
    },
  });

  const cancelRequestMutation = trpc.driver.cancelTimeOffRequest.useMutation({
    onSuccess: () => {
      toast.success("Request cancelled successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel request");
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vacation":
        return <Palmtree className="h-4 w-4" />;
      case "sick":
        return <Stethoscope className="h-4 w-4" />;
      case "personal":
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Time Off Data</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Time Off Requests</h1>
                <p className="text-indigo-100">Request and manage your time off</p>
              </div>
            </div>
            <Button className="bg-white text-indigo-700 hover:bg-indigo-50">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Available PTO</p>
                    <p className="text-2xl font-bold">{timeOffData?.balance?.availableDays || 0} days</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Palmtree className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Used This Year</p>
                    <p className="text-2xl font-bold">{timeOffData?.balance?.usedDays || 0} days</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-bold">{timeOffData?.balance?.pendingDays || 0} days</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Sick Days Used</p>
                    <p className="text-2xl font-bold">{timeOffData?.balance?.sickDaysUsed || 0} days</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <Stethoscope className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Request History
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                  </div>
                ) : timeOffData?.requests?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-500">Submit your first time off request</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeOffData?.requests?.map((request: any) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getTypeIcon(request.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium capitalize">{request.type} Leave</h4>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span>{request.totalDays} day(s)</span>
                              </div>
                              {request.reason && (
                                <p className="text-sm text-gray-600 mt-2">{request.reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {request.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => cancelRequestMutation.mutate({ requestId: request.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {request.status === "rejected" && request.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong>Reason:</strong> {request.rejectionReason}
                            </p>
                          </div>
                        )}
                        {request.approvedBy && (
                          <div className="mt-3 text-sm text-gray-500">
                            Approved by: {request.approvedBy} on {new Date(request.approvedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Time Off
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : timeOffData?.upcoming?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No upcoming time off scheduled</p>
                ) : (
                  <div className="space-y-3">
                    {timeOffData?.upcoming?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="font-medium capitalize">{item.type}</span>
                          </div>
                          <span className="text-sm text-gray-600">{item.totalDays} day(s)</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PTO Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>- Requests must be submitted at least 2 weeks in advance for vacation</p>
                <p>- Sick leave can be submitted same-day with documentation</p>
                <p>- Maximum consecutive days: 14</p>
                <p>- Unused PTO rolls over up to 5 days</p>
                <Button variant="link" className="p-0 h-auto text-indigo-600">
                  View Full Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
