/**
 * RATE MANAGEMENT PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Search, Plus, TrendingUp, MapPin,
  Edit, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ConfirmationDialog";

export default function RateManagement() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  const ratesQuery = (trpc as any).rates.getAll.useQuery({ search, type });
  const statsQuery = (trpc as any).rates.getStats.useQuery();

  const deleteMutation = (trpc as any).rates.delete.useMutation({
    onSuccess: () => { toast.success("Rate deleted"); ratesQuery.refetch(); },
    onError: (error: any) => toast.error("Failed", { description: error.message }),
  });

  const stats = statsQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">Rate Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage shipping rates</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Rate
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyan-500/20"><DollarSign className="w-6 h-6 text-cyan-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-cyan-400">{stats?.totalRates || 0}</p>}<p className="text-xs text-slate-400">Total Rates</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/20"><TrendingUp className="w-6 h-6 text-green-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${stats?.avgRate}</p>}<p className="text-xs text-slate-400">Avg Rate/Mi</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20"><MapPin className="w-6 h-6 text-purple-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-purple-400">{stats?.lanes || 0}</p>}<p className="text-xs text-slate-400">Lanes</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20"><DollarSign className="w-6 h-6 text-yellow-400" /></div>
              <div>{statsQuery.isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-yellow-400">${stats?.highestRate}</p>}<p className="text-xs text-slate-400">Highest</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Search rates..." className="pl-9 bg-white/[0.02] border-white/[0.06] rounded-lg" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px] bg-white/[0.02] border-white/[0.06] rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="spot">Spot</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06] rounded-xl">
        <CardHeader className="pb-3"><CardTitle className="text-white text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-cyan-400" />Rates</CardTitle></CardHeader>
        <CardContent className="p-0">
          {ratesQuery.isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i: any) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : (ratesQuery.data as any)?.length === 0 ? (
            <div className="text-center py-16"><DollarSign className="w-10 h-10 text-slate-500 mx-auto mb-3" /><p className="text-slate-400">No rates found</p></div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {(ratesQuery.data as any)?.map((rate: any) => (
                <div key={rate.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", rate.type === "contract" ? "bg-green-500/20" : "bg-yellow-500/20")}>
                      <DollarSign className={cn("w-5 h-5", rate.type === "contract" ? "text-green-400" : "text-yellow-400")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-bold">{rate.origin} → {rate.destination}</p>
                        <Badge className={cn("border-0", rate.type === "contract" ? "bg-green-500/20 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent" : "bg-yellow-500/20 text-yellow-400")}>{rate.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{rate.distance} mi</span>
                        <span>{rate.equipment}</span>
                        {rate.customer && <span>Customer: {rate.customer}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Valid: {rate.validFrom} - {rate.validTo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${rate.ratePerMile}/mi</p>
                      <p className="text-sm text-slate-500">Total: ${rate.totalRate?.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="bg-white/[0.04] border-white/[0.06] rounded-lg"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" className="bg-red-500/20 border-red-500/30 text-red-400 rounded-lg" onClick={() => setDeleteId(rate.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        itemName="this item"
        onConfirm={() => { if (deleteId) deleteMutation.mutate({ id: deleteId }); setDeleteId(null); }}
        isLoading={deleteMutation?.isPending}
      />
    </div>
  );
}
