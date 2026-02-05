import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  FileText,
  Search,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Trash2,
  Copy,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  name: string;
  type: string;
  category: string;
  status: "ready" | "generating" | "scheduled" | "failed";
  lastGenerated: string;
  schedule: string | null;
  format: string;
  size: string;
  createdBy: string;
}

interface ReportStats {
  totalReports: number;
  scheduledReports: number;
  generatedToday: number;
  failedReports: number;
}

export default function AdminReporting() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: stats, isLoading: statsLoading } = useQuery<ReportStats>({
    queryKey: ["/api/admin/reporting/stats"],
  });

  const { data: reports, isLoading: reportsLoading, error, refetch } = useQuery<Report[]>({
    queryKey: ["/api/admin/reporting/list", searchQuery, categoryFilter, statusFilter],
  });

  const generateMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/admin/reporting/${reportId}/generate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate report");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Report generation started");
      refetch();
    },
    onError: () => {
      toast.error("Failed to generate report");
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/admin/reporting/${reportId}/download`);
      if (!response.ok) throw new Error("Failed to download report");
      return response.blob();
    },
    onSuccess: () => {
      toast.success("Report download started");
    },
    onError: () => {
      toast.error("Failed to download report");
    },
  });

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>;
      case "generating":
        return <Badge className="bg-blue-100 text-blue-800">Generating</Badge>;
      case "scheduled":
        return <Badge className="bg-purple-100 text-purple-800">Scheduled</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chart":
        return <BarChart3 className="h-4 w-4" />;
      case "pie":
        return <PieChart className="h-4 w-4" />;
      case "trend":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Failed to load reports</p>
                <p className="text-sm text-red-600">Please try again later</p>
              </div>
              <Button variant="outline" onClick={() => refetch()} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Report Management
          </h1>
          <p className="text-muted-foreground mt-1">Generate and manage system reports</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{stats?.totalReports || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold">{stats?.scheduledReports || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Generated Today</p>
                    <p className="text-2xl font-bold">{stats?.generatedToday || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold">{stats?.failedReports || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Library
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    {getTypeIcon(report.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{report.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="capitalize">{report.category}</span>
                      <span>|</span>
                      <span>{report.format.toUpperCase()}</span>
                      <span>|</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(report.status)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{report.lastGenerated}</span>
                    </div>
                  </div>
                  {report.schedule && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {report.schedule}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateMutation.mutate(report.id)}
                      disabled={report.status === "generating"}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadMutation.mutate(report.id)}
                      disabled={report.status !== "ready"}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reports found</p>
              <Button variant="outline" className="mt-4">
                Create Your First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
