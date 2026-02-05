/**
 * AuditLog Page
 * Single audit log entry view
 */

import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Clock, Activity } from "lucide-react";

export default function AuditLog() {
  const [, params] = useRoute("/audit-log/:id");
  const id = params?.id;
  const { data: log, isLoading } = (trpc as any).admin.getAuditLog.useQuery({ logId: id || "" });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Audit Log Details</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Log Entry {id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">User:</span>
              <span className="font-medium">{log?.userId || "System"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Action:</span>
              <Badge variant="outline">{log?.action || "unknown"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Timestamp:</span>
              <span>{log?.timestamp || new Date().toISOString()}</span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Details</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(log?.details || {}, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
