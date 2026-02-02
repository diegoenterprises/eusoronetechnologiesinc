import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  Calendar,
  RefreshCw,
  AlertCircle,
  Fuel,
  Utensils,
  Bed,
  Wrench,
  MoreHorizontal,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export default function DriverExpenseReport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("current_month");

  const {
    data: expensesData,
    isLoading,
    error,
    refetch,
  } = trpc.driver.getExpenseReports.useQuery({
    search: searchQuery,
    status: statusFilter,
    category: categoryFilter,
    period: periodFilter,
  });

  const submitExpenseMutation = trpc.driver.submitExpenseReport.useMutation({
    onSuccess: () => {
      toast.success("Expense report submitted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit expense report");
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "fuel":
        return <Fuel className="h-4 w-4" />;
      case "meals":
        return <Utensils className="h-4 w-4" />;
      case "lodging":
        return <Bed className="h-4 w-4" />;
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
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
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
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
            <h3 className="text-lg font-semibold mb-2">Error Loading Expenses</h3>
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
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Expense Reports</h1>
                <p className="text-green-100">Submit and track your expense claims</p>
              </div>
            </div>
            <Button className="bg-white text-green-700 hover:bg-green-50">
              <Plus className="h-4 w-4 mr-2" />
              New Expense
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
                    <p className="text-sm text-gray-500">Total Submitted</p>
                    <p className="text-2xl font-bold">${expensesData?.summary?.totalSubmitted?.toLocaleString() || "0"}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Review</p>
                    <p className="text-2xl font-bold">${expensesData?.summary?.pendingAmount?.toLocaleString() || "0"}</p>
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
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-2xl font-bold">${expensesData?.summary?.approvedAmount?.toLocaleString() || "0"}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-2xl font-bold">${expensesData?.summary?.rejectedAmount?.toLocaleString() || "0"}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Expense History
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="lodging">Lodging</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : expensesData?.expenses?.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-500 mb-4">Start by submitting your first expense report</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {expensesData?.expenses?.map((expense: any) => (
                  <div
                    key={expense.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{expense.description}</h4>
                            {getStatusBadge(expense.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                            <span className="capitalize">{expense.category}</span>
                            {expense.loadId && (
                              <span>Load #{expense.loadId}</span>
                            )}
                          </div>
                          {expense.notes && (
                            <p className="text-sm text-gray-600 mt-2">{expense.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${expense.amount?.toFixed(2)}</p>
                        {expense.receipt && (
                          <Button variant="ghost" size="sm" className="text-blue-600">
                            <FileText className="h-3 w-3 mr-1" />
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                    {expense.status === "rejected" && expense.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {expense.rejectionReason}
                        </p>
                      </div>
                    )}
                    {expense.status === "draft" && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm">Submit for Review</Button>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600">Delete</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Quick Submit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Upload Receipt</p>
              <p className="text-sm text-gray-500 mt-1">Drag and drop or click to upload</p>
              <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, PDF up to 10MB</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
