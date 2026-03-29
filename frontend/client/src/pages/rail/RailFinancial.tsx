/**
 * RAIL FINANCIAL — V5 Multi-Modal
 * Rail billing & financial management: Rate Quotes, Settlements,
 * Demurrage charges, and Invoice tracking
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
  Receipt,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  expired: "bg-red-500/20 text-red-400",
  paid: "bg-green-500/20 text-green-400",
  disputed: "bg-orange-500/20 text-orange-400",
  accruing: "bg-blue-500/20 text-blue-400",
  billed: "bg-purple-500/20 text-purple-400",
};

function TariffRateLookup({ isLight, cardBg, text, muted }: { isLight: boolean; cardBg: string; text: string; muted: string }) {
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [carType, setCarType] = useState("boxcar");
  const [commodity, setCommodity] = useState("");
  const [enabled, setEnabled] = useState(false);

  const rateQuery = (trpc as any).railShipments.getTariffRate.useQuery(
    { originStation: origin, destStation: dest, carType, commodity },
    { enabled: enabled && !!origin && !!dest && !!commodity }
  );

  const handleLookup = () => {
    if (origin && dest && commodity) setEnabled(true);
  };

  const rate = rateQuery.data;
  const inputCls = cn(
    "h-9 text-sm",
    isLight ? "bg-white border-slate-300" : "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
  );

  return (
    <Card className={cn("border", cardBg)}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", text)}>
          <Calculator className="w-5 h-5" /> Tariff Rate Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Origin Station</label>
            <Input placeholder="e.g. CHI" value={origin} onChange={e => { setOrigin(e.target.value); setEnabled(false); }} className={inputCls} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Destination Station</label>
            <Input placeholder="e.g. LAX" value={dest} onChange={e => { setDest(e.target.value); setEnabled(false); }} className={inputCls} />
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Car Type</label>
            <select
              value={carType}
              onChange={e => { setCarType(e.target.value); setEnabled(false); }}
              className={cn("w-full rounded-md border px-3 h-9 text-sm", inputCls)}
            >
              <option value="boxcar">Boxcar</option>
              <option value="hopper">Hopper</option>
              <option value="tanker">Tank Car</option>
              <option value="flatcar">Flatcar</option>
              <option value="gondola">Gondola</option>
              <option value="refrigerated">Refrigerated</option>
              <option value="intermodal">Intermodal</option>
            </select>
          </div>
          <div>
            <label className={cn("text-xs font-medium mb-1 block", muted)}>Commodity</label>
            <Input placeholder="e.g. grain" value={commodity} onChange={e => { setCommodity(e.target.value); setEnabled(false); }} className={inputCls} />
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleLookup}
          disabled={!origin || !dest || !commodity}
          className={cn("gap-1.5 mb-4", isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600/90 hover:bg-blue-600 text-white")}
        >
          <Search className="w-3.5 h-3.5" /> Get Rate Quote
        </Button>

        {rateQuery.isLoading && enabled && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        )}

        {rate && !rateQuery.isLoading && (
          <div className={cn("rounded-lg border p-4", isLight ? "border-slate-200 bg-slate-50" : "border-slate-700/50 bg-slate-800/40")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className={cn("text-xs", muted)}>Base Rate</div>
                <div className={cn("text-lg font-bold", text)}>${Number(rate.baseRate ?? rate.rate ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div className={cn("text-xs", muted)}>Fuel Surcharge</div>
                <div className={cn("text-lg font-bold", text)}>${Number(rate.fuelSurcharge ?? rate.fsc ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div className={cn("text-xs", muted)}>Total Rate</div>
                <div className={cn("text-lg font-bold text-emerald-500")}>${Number(rate.totalRate ?? rate.total ?? (Number(rate.baseRate ?? rate.rate ?? 0) + Number(rate.fuelSurcharge ?? rate.fsc ?? 0))).toLocaleString()}</div>
              </div>
              <div>
                <div className={cn("text-xs", muted)}>Transit Days</div>
                <div className={cn("text-lg font-bold", text)}>{rate.transitDays ?? rate.estimatedDays ?? "—"}</div>
              </div>
            </div>
            {(rate.railroad || rate.carrier) && (
              <div className={cn("mt-3 pt-3 border-t text-sm", isLight ? "border-slate-200" : "border-slate-700/50", muted)}>
                Railroad: <span className={text}>{rate.railroad || rate.carrier}</span>
                {rate.tariffNumber && <> &bull; Tariff: <span className={text}>{rate.tariffNumber}</span></>}
                {rate.effectiveDate && <> &bull; Effective: <span className={text}>{rate.effectiveDate}</span></>}
              </div>
            )}
          </div>
        )}

        {enabled && !rateQuery.isLoading && !rate && (
          <div className={cn("text-center py-8", muted)}>
            <Calculator className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No rate found for this route. Try different stations or commodity.</p>
          </div>
        )}

        {!enabled && (
          <div className={cn("text-center py-8", muted)}>
            <Calculator className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Enter origin, destination, and commodity to look up tariff rates.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RailFinancial() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [tab, setTab] = useState("rates");
  const finQuery = (trpc as any).railShipments.getRailFinancialSummary.useQuery();
  const stlData: any[] = finQuery.data?.settlements || [];
  const demData: any[] = finQuery.data?.demurrage || [];

  const bg = isLight ? "bg-slate-50" : "bg-[#0a0a0a]";
  const cardBg = isLight ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/50";
  const text = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-500" : "text-slate-400";

  return (
    <div className={cn("min-h-screen p-6", bg)}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn("p-2.5 rounded-xl", isLight ? "bg-gradient-to-br from-green-100 to-emerald-100" : "bg-gradient-to-br from-green-500/20 to-emerald-500/20")}>
          <DollarSign className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className={cn("text-2xl font-bold", text)}>Rail Financial</h1>
          <p className={cn("text-sm", muted)}>Rate quotes, settlements, demurrage & invoices</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Calculator className="w-5 h-5" />, label: "Settlements", value: String(stlData.length), accent: "blue" },
          { icon: <CheckCircle className="w-5 h-5" />, label: "Settled", value: String(stlData.filter((s: any) => s.status === "paid" || s.status === "settled").length), accent: "emerald" },
          { icon: <AlertTriangle className="w-5 h-5" />, label: "Demurrage Records", value: String(demData.length), accent: "amber" },
          { icon: <Receipt className="w-5 h-5" />, label: "Pending", value: String(stlData.filter((s: any) => s.status === "pending").length), accent: "purple" },
        ].map((kpi) => (
          <Card key={kpi.label} className={cn("border", cardBg)}>
            <CardContent className="p-4">
              <div className={cn("p-2 rounded-lg w-fit mb-2", isLight ? "bg-slate-100" : "bg-slate-700/50")}>{kpi.icon}</div>
              <div className={cn("text-xl font-bold", text)}>{kpi.value}</div>
              <div className={cn("text-xs", muted)}>{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={cn("mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
          <TabsTrigger value="rates">Rate Quotes</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="demurrage">Demurrage</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <TariffRateLookup isLight={isLight} cardBg={cardBg} text={text} muted={muted} />
        </TabsContent>

        <TabsContent value="settlements">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Settlements</CardTitle></CardHeader>
            <CardContent>
              {stlData.length === 0 ? (
                <div className={cn("text-center py-12", muted)}>
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No settlements yet</p>
                  <p className="text-sm mt-1">Settlements will appear here as rail shipments are invoiced.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stlData.map((s: any) => (
                    <div key={s.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>STL-{s.id}</span>
                        <p className={cn("text-xs", muted)}>Shipment #{s.shipmentId || s.loadId || "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", text)}>${Number(s.amount || 0).toLocaleString()}</span>
                        <Badge className={STATUS_BADGE[s.status] || "bg-slate-500/20 text-slate-400"}>{s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demurrage">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Demurrage Charges</CardTitle></CardHeader>
            <CardContent>
              {demData.length === 0 ? (
                <div className={cn("text-center py-12", muted)}>
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No demurrage charges</p>
                  <p className="text-sm mt-1">Demurrage will be tracked here when railcars exceed free time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {demData.map((d: any) => (
                    <div key={d.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isLight ? "border-slate-200" : "border-slate-700/50")}>
                      <div>
                        <span className={cn("font-mono text-sm font-semibold", text)}>DEM-{d.id}</span>
                        <p className={cn("text-xs", muted)}>Railcar #{d.railcarId || "—"} • ${Number(d.dailyRate || 75)}/day</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", text)}>${Number(d.totalCharge || d.amount || 0).toLocaleString()}</span>
                        <Badge className={STATUS_BADGE[d.status] || "bg-blue-500/20 text-blue-400"}>{d.status || "accruing"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className={cn("border", cardBg)}>
            <CardHeader><CardTitle className={text}>Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className={cn("text-center py-12", muted)}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium">No open invoices</p>
                <p className="text-sm mt-1">Rail invoices will appear here once generated from settlements</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
