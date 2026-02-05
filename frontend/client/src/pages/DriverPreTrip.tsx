/**
 * DRIVER PRE-TRIP INSPECTION PAGE
 * Digital pre-trip inspection checklist for drivers
 * 100% dynamic - no mock data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Truck, CheckCircle, AlertTriangle, Camera, 
  ClipboardCheck, RefreshCw, Send
} from "lucide-react";

interface InspectionItem {
  id: string;
  category: string;
  item: string;
  required: boolean;
  checked: boolean;
  defect: boolean;
  notes: string;
}

export default function DriverPreTrip() {
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [notes, setNotes] = useState("");

  const { data: checklist, isLoading, error, refetch } = (trpc as any).inspections.getTemplate.useQuery({ type: "pre_trip" });
  const { data: vehicle } = (trpc as any).vehicles.list.useQuery({});
  const submitMutation = (trpc as any).inspections.submit.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setItems((prev: any) => 
      prev.map((item: any) => 
        item.id === itemId ? { ...item, checked } : item
      )
    );
  };

  const handleDefectToggle = (itemId: string, defect: boolean) => {
    setItems((prev: any) => 
      prev.map((item: any) => 
        item.id === itemId ? { ...item, defect } : item
      )
    );
  };

  const handleSubmit = () => {
    const defects = items.filter((i: any) => i.defect).map((i: any) => ({
      itemId: i.id,
      description: i.notes,
    }));
    
    submitMutation.mutate({
      vehicleId: (vehicle as any)?.[0]?.id || "",
      type: "pre_trip" as const,
      odometer: 0,
      items: items.map((i: any) => ({ id: i.id, category: "general", name: String((i as any).name || i.id), status: (i.checked && !i.defect ? "pass" : "fail") as "pass" | "fail" | "na" })),
      notes,
    } as any);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i: any) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
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
              <h3 className="font-semibold text-red-700">Error Loading Checklist</h3>
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

  const checklistItems = checklist || [];
  const categories = Array.from(new Set((checklistItems as any).categories?.map((cat: any) => cat.name) || []));
  const completedCount = items.filter((i: any) => i.checked).length;
  const totalCount = (checklistItems as any)?.categories?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const hasDefects = items.some((i: any) => i.defect);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" /> Pre-Trip Inspection
          </h1>
          <p className="text-muted-foreground">Complete all items before starting your trip</p>
        </div>
        {vehicle && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Truck className="h-4 w-4 mr-2" /> {(vehicle as any)?.[0]?.unit || (vehicle as any)?.[0]?.id}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Inspection Progress</p>
              <p className="text-2xl font-bold">{completedCount} of {totalCount} items</p>
            </div>
            {hasDefects && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" /> Defects Found
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {(categories as string[]).map((category: string) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {((checklistItems as any)?.categories || [])
              .filter((item: any) => item.name === category)
              .map((item: any) => {
                const currentItem = items.find((i: any) => i.id === item.id) || {
                  ...item,
                  checked: false,
                  defect: false,
                  notes: "",
                };

                return (
                  <div key={item.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <Checkbox
                      checked={currentItem.checked}
                      onCheckedChange={(checked) => handleItemCheck(item.id, !!checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{item.item}</p>
                        {item.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {currentItem.checked && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={currentItem.defect ? "destructive" : "outline"}
                            onClick={() => handleDefectToggle(item.id, !currentItem.defect)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {currentItem.defect ? "Defect Marked" : "Report Defect"}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Camera className="h-3 w-3 mr-1" /> Photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional notes or observations..."
            value={notes}
            onChange={(e: any) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Save Draft</Button>
        <Button 
          onClick={handleSubmit}
          disabled={submitMutation.isPending || completedCount < totalCount}
          className={hasDefects ? "bg-yellow-600 hover:bg-yellow-700" : ""}
        >
          {submitMutation.isPending ? "Submitting..." : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {hasDefects ? "Submit with Defects" : "Complete Inspection"}
            </>
          )}
        </Button>
      </div>

      {submitMutation.isSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">Pre-trip inspection submitted successfully</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
