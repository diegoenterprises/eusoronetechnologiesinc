import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function FactoringRisk() {
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const creditCheckMutation = (trpc as any).factoring.requestCreditCheck.useMutation({
    onSuccess: (data: any) => toast.success(`Credit check complete: ${data.status}`),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Risk Assessment
        </h1>
        <p className="text-muted-foreground mt-1">Credit risk analysis and customer credit checks</p>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Search className="w-4 h-4" /> Request Credit Check
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Input placeholder="Customer Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
          </div>
          <Button
            className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white"
            onClick={() => creditCheckMutation.mutate({ customerName, customerAddress })}
            disabled={!customerName || creditCheckMutation.isPending}
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Run Credit Check
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No risk alerts</p>
          <p className="text-sm text-muted-foreground">Risk alerts for your portfolio will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
