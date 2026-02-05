/**
 * ADMIN PLATFORM FEES PAGE
 * 100% Dynamic - No mock data
 * UI Style: Gradient headers, stat cards with icons, rounded cards
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  DollarSign, Percent, Settings, Plus, Edit, Trash2,
  TrendingUp, Users, Tag, Gift, ArrowRight, RefreshCw
} from "lucide-react";

export default function AdminPlatformFees() {
  const [activeTab, setActiveTab] = useState("configs");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const feeConfigsQuery = (trpc as any).platformFees.getFeeConfigs.useQuery();
  const volumeDiscountsQuery = (trpc as any).platformFees.getVolumeDiscounts.useQuery();
  const promoCodesQuery = (trpc as any).platformFees.getPromoCodes.useQuery();
  const revenueSummaryQuery = (trpc as any).platformFees.getRevenueSummary.useQuery({ period: "month" });

  const createFeeConfigMutation = (trpc as any).platformFees.createFeeConfig.useMutation({
    onSuccess: () => {
      feeConfigsQuery.refetch();
      setShowCreateDialog(false);
    },
  });

  const updateFeeConfigMutation = (trpc as any).platformFees.updateFeeConfig.useMutation({
    onSuccess: () => {
      feeConfigsQuery.refetch();
      setSelectedConfig(null);
    },
  });

  const revenue = revenueSummaryQuery.data;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Platform Fee Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configure fees, discounts, and promo codes</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-500"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />New Fee Config
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                {revenueSummaryQuery.isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold text-emerald-400">
                    ${(revenue?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-xs text-slate-400">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                {revenueSummaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-blue-400">
                    ${(revenue?.totalFees || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-xs text-slate-400">Total Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                {revenueSummaryQuery.isLoading ? <Skeleton className="h-8 w-12" /> : (
                  <p className="text-2xl font-bold text-purple-400">{revenue?.transactionCount || 0}</p>
                )}
                <p className="text-xs text-slate-400">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/20">
                <Tag className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                {revenueSummaryQuery.isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl font-bold text-yellow-400">
                    ${(revenue?.totalDiscounts || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-xs text-slate-400">Discounts Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="configs" className="data-[state=active]:bg-slate-700">
            <Settings className="w-4 h-4 mr-2" />Fee Configs
          </TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:bg-slate-700">
            <Percent className="w-4 h-4 mr-2" />Volume Discounts
          </TabsTrigger>
          <TabsTrigger value="promos" className="data-[state=active]:bg-slate-700">
            <Gift className="w-4 h-4 mr-2" />Promo Codes
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="w-4 h-4 mr-2" />Revenue
          </TabsTrigger>
        </TabsList>

        {/* Fee Configs Tab */}
        <TabsContent value="configs">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-slate-200">Fee Configurations</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => feeConfigsQuery.refetch()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {feeConfigsQuery.isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-slate-700/30">
                      <TableHead className="text-slate-400">Fee Code</TableHead>
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Transaction</TableHead>
                      <TableHead className="text-slate-400">Rate</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(feeConfigsQuery.data || []).map((config: any) => (
                      <TableRow key={config.id} className="border-slate-700/50 hover:bg-slate-700/30">
                        <TableCell className="font-mono text-cyan-400">{config.feeCode}</TableCell>
                        <TableCell className="text-slate-200">{config.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {config.feeType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">{config.transactionType}</TableCell>
                        <TableCell className="text-emerald-400">
                          {config.feeType === "percentage" ? `${config.baseRate}%` : 
                           config.feeType === "flat" ? `$${config.flatAmount}` : "Tiered"}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedConfig(config)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(feeConfigsQuery.data || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                          No fee configurations found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume Discounts Tab */}
        <TabsContent value="discounts">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-lg text-slate-200">Volume Discounts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {volumeDiscountsQuery.isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-slate-700/30">
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Threshold</TableHead>
                      <TableHead className="text-slate-400">Discount</TableHead>
                      <TableHead className="text-slate-400">Period</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(volumeDiscountsQuery.data || []).map((discount: any) => (
                      <TableRow key={discount.id} className="border-slate-700/50 hover:bg-slate-700/30">
                        <TableCell className="text-slate-200">{discount.name}</TableCell>
                        <TableCell className="text-slate-400">{discount.discountType}</TableCell>
                        <TableCell className="text-cyan-400">{discount.thresholdValue}</TableCell>
                        <TableCell className="text-emerald-400">{discount.discountPercent}%</TableCell>
                        <TableCell className="text-slate-400">{discount.periodType}</TableCell>
                        <TableCell>
                          <Badge className={discount.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                            {discount.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(volumeDiscountsQuery.data || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                          No volume discounts configured.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promos">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-lg text-slate-200">Promo Codes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {promoCodesQuery.isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-slate-700/30">
                      <TableHead className="text-slate-400">Code</TableHead>
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Value</TableHead>
                      <TableHead className="text-slate-400">Uses</TableHead>
                      <TableHead className="text-slate-400">Valid Until</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(promoCodesQuery.data || []).map((promo: any) => (
                      <TableRow key={promo.id} className="border-slate-700/50 hover:bg-slate-700/30">
                        <TableCell className="font-mono text-yellow-400">{promo.code}</TableCell>
                        <TableCell className="text-slate-200">{promo.name}</TableCell>
                        <TableCell className="text-slate-400">{promo.discountType}</TableCell>
                        <TableCell className="text-emerald-400">
                          {promo.discountType === "percentage" ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {promo.currentUses}/{promo.maxUses || "Unlimited"}
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {promo.validTo ? new Date(promo.validTo).toLocaleDateString() : "No expiry"}
                        </TableCell>
                        <TableCell>
                          <Badge className={promo.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                            {promo.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(promoCodesQuery.data || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                          No promo codes configured.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-lg text-slate-200">Revenue by Transaction Type</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {revenueSummaryQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {(revenue?.byTransactionType || []).map((item: any) => (
                    <div key={item.type} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-slate-600/50">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium capitalize">{item.type.replace(/_/g, " ")}</p>
                          <p className="text-slate-400 text-sm">{item.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">
                          ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-slate-500 text-sm">
                          ${item.fees.toLocaleString(undefined, { minimumFractionDigits: 2 })} fees
                        </p>
                      </div>
                    </div>
                  ))}
                  {(revenue?.byTransactionType || []).length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                      No revenue data available for this period.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Fee Config Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Create Fee Configuration</DialogTitle>
          </DialogHeader>
          <CreateFeeConfigForm 
            onSubmit={(data: any) => createFeeConfigMutation.mutate(data)}
            isLoading={createFeeConfigMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Fee Config Dialog */}
      <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-200">Edit Fee Configuration</DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <EditFeeConfigForm
              config={selectedConfig}
              onSubmit={(data: any) => updateFeeConfigMutation.mutate({ id: selectedConfig.id, ...data })}
              isLoading={updateFeeConfigMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateFeeConfigForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    feeCode: "",
    name: "",
    description: "",
    transactionType: "load_completion",
    feeType: "percentage",
    baseRate: 2.5,
    flatAmount: 0,
    minFee: 0,
    maxFee: 0,
  });

  return (
    <form onSubmit={(e: any) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Fee Code</Label>
          <Input
            className="bg-slate-700 border-slate-600 text-slate-200"
            value={formData.feeCode}
            onChange={(e: any) => setFormData({ ...formData, feeCode: e.target.value })}
            placeholder="LOAD_FEE_01"
            required
          />
        </div>
        <div>
          <Label className="text-slate-300">Name</Label>
          <Input
            className="bg-slate-700 border-slate-600 text-slate-200"
            value={formData.name}
            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Load Completion Fee"
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-slate-300">Transaction Type</Label>
        <Select value={formData.transactionType} onValueChange={(v: any) => setFormData({ ...formData, transactionType: v })}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="load_booking">Load Booking</SelectItem>
            <SelectItem value="load_completion">Load Completion</SelectItem>
            <SelectItem value="instant_pay">Instant Pay</SelectItem>
            <SelectItem value="cash_advance">Cash Advance</SelectItem>
            <SelectItem value="p2p_transfer">P2P Transfer</SelectItem>
            <SelectItem value="wallet_withdrawal">Wallet Withdrawal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-slate-300">Fee Type</Label>
        <Select value={formData.feeType} onValueChange={(v: any) => setFormData({ ...formData, feeType: v })}>
          <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-700 border-slate-600">
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="flat">Flat Amount</SelectItem>
            <SelectItem value="tiered">Tiered</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(formData.feeType === "percentage" || formData.feeType === "hybrid") && (
          <div>
            <Label className="text-slate-300">Base Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              className="bg-slate-700 border-slate-600 text-slate-200"
              value={formData.baseRate}
              onChange={(e: any) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) })}
            />
          </div>
        )}
        {(formData.feeType === "flat" || formData.feeType === "hybrid") && (
          <div>
            <Label className="text-slate-300">Flat Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              className="bg-slate-700 border-slate-600 text-slate-200"
              value={formData.flatAmount}
              onChange={(e: any) => setFormData({ ...formData, flatAmount: parseFloat(e.target.value) })}
            />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Fee Config"}
      </Button>
    </form>
  );
}

function EditFeeConfigForm({ config, onSubmit, isLoading }: { config: any; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: config.name || "",
    baseRate: config.baseRate || 0,
    flatAmount: config.flatAmount || 0,
    minFee: config.minFee || 0,
    maxFee: config.maxFee || 0,
    isActive: config.isActive !== false,
  });

  return (
    <form onSubmit={(e: any) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <Label className="text-slate-300">Name</Label>
        <Input
          className="bg-slate-700 border-slate-600 text-slate-200"
          value={formData.name}
          onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Base Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            className="bg-slate-700 border-slate-600 text-slate-200"
            value={formData.baseRate}
            onChange={(e: any) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-slate-300">Flat Amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            className="bg-slate-700 border-slate-600 text-slate-200"
            value={formData.flatAmount}
            onChange={(e: any) => setFormData({ ...formData, flatAmount: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Min Fee ($)</Label>
          <Input
            type="number"
            step="0.01"
            className="bg-slate-700 border-slate-600 text-slate-200"
            value={formData.minFee}
            onChange={(e: any) => setFormData({ ...formData, minFee: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-slate-300">Max Fee ($)</Label>
          <Input
            type="number"
            step="0.01"
            className="bg-slate-700 border-slate-600 text-slate-200"
            value={formData.maxFee}
            onChange={(e: any) => setFormData({ ...formData, maxFee: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Active</Label>
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
