/**
 * TERMINAL PRODUCT MANAGEMENT PAGE
 * 100% Dynamic - Manage terminal products and specifications
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
  Droplets, Plus, Search, AlertTriangle, CheckCircle,
  Thermometer, Gauge, FileText, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TerminalProductManagement() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const productsQuery = (trpc as any).terminals.getProducts.useQuery();
  const statsQuery = (trpc as any).terminals.getSummary.useQuery();

  const products = productsQuery.data || [];
  const stats = statsQuery.data as any;

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Product Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage terminal products</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-lg">
          <Plus className="w-4 h-4 mr-2" />Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400 text-sm">Total Products</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-sm">Active</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats?.active || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400 text-sm">Hazmat</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats?.hazmat || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-sm">Categories</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats?.categories || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10 bg-slate-700/50 border-slate-600/50 rounded-lg"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-slate-700/50 border-slate-600/50 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="gasoline">Gasoline</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="jet_fuel">Jet Fuel</SelectItem>
                <SelectItem value="biofuel">Biofuel</SelectItem>
                <SelectItem value="chemicals">Chemicals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product List */}
      <Card className="bg-slate-800/50 border-slate-700/50 rounded-xl">
        <CardContent className="p-0">
          {productsQuery.isLoading ? (
            <div className="p-4 space-y-3">{Array(5).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Droplets className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No products found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="p-5 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        product.hazmat ? "bg-yellow-500/20" : "bg-cyan-500/20"
                      )}>
                        <Droplets className={cn(
                          "w-6 h-6",
                          product.hazmat ? "text-yellow-400" : "text-cyan-400"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{product.name}</p>
                          <Badge className="bg-slate-600/50 text-slate-300 border-0 text-xs">
                            {product.code}
                          </Badge>
                          {product.hazmat && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />Class {product.hazmatClass}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{product.category} • {product.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Tanks</p>
                        <p className="text-white font-bold">{product.tankCount || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Inventory</p>
                        <p className="text-cyan-400 font-bold">{product.currentInventory?.toLocaleString() || 0} bbl</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />Temp Range
                        </p>
                        <p className="text-white">{product.minTemp}°F - {product.maxTemp}°F</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Gravity</p>
                        <p className="text-white">{product.apiGravity || "—"}</p>
                      </div>
                      <Badge className={cn(
                        "border-0",
                        product.status === "active" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
                      )}>
                        {product.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {product.specifications && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Flash Point</p>
                        <p className="text-white">{product.specifications.flashPoint}°F</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Reid Vapor Pressure</p>
                        <p className="text-white">{product.specifications.rvp} psi</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Sulfur Content</p>
                        <p className="text-white">{product.specifications.sulfur} ppm</p>
                      </div>
                      <div>
                        <p className="text-slate-500">UN Number</p>
                        <p className="text-white">{product.unNumber || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
