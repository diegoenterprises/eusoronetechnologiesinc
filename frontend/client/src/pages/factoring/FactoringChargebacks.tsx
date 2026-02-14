import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function FactoringChargebacks() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Chargebacks
        </h1>
        <p className="text-muted-foreground mt-1">Manage and resolve chargeback disputes</p>
      </div>
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No chargebacks</p>
          <p className="text-sm text-muted-foreground">Chargebacks from disputed invoices will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
