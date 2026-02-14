import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Banknote, Clock } from "lucide-react";

export default function FactoringCollections() {
  const reserveQuery = (trpc as any).factoring.getReserveBalance.useQuery();
  const reserve = reserveQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
          Collections
        </h1>
        <p className="text-muted-foreground mt-1">Outstanding collections and reserve balance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserve Balance</p>
                <p className="text-2xl font-bold">${(reserve?.currentBalance || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Release</p>
                <p className="text-2xl font-bold">${(reserve?.pendingRelease || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-8 text-center">
          <Banknote className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No outstanding collections</p>
          <p className="text-sm text-muted-foreground">Collections from funded invoices will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
