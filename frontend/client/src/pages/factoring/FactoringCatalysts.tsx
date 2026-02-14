import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Users, Building2, DollarSign, ShieldCheck } from "lucide-react";

export default function FactoringCatalysts() {
  const customersQuery = (trpc as any).factoring.getApprovedCustomers.useQuery();
  const customers = customersQuery.data || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Catalyst Portfolio
        </h1>
        <p className="text-muted-foreground mt-1">Manage approved catalysts and credit limits</p>
      </div>

      {customersQuery.isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : customers.length === 0 ? (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No catalysts in portfolio</p>
            <p className="text-sm text-muted-foreground">Approved catalysts will appear here after credit check</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c: any, i: number) => (
            <Card key={i} className="border-border/50 bg-card/50 hover:border-[#1473FF]/30 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1473FF]/20 to-[#BE01FF]/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#1473FF]" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name || "Catalyst"}</p>
                    <p className="text-sm text-muted-foreground">MC# {c.mcNumber || "N/A"}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-0">Approved</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
