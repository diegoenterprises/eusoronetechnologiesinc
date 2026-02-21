/**
 * INSTANT RATE QUOTE WIDGET
 * Shipper-facing component for instant freight rate quotes
 * Powered by Hot Zones intelligence, hazmat class premiums, lane learning
 * 
 * Embeddable in: Dashboard, Create Load wizard pricing step, QuoteRequests page
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign, MapPin, Truck, ArrowRight, Clock, Fuel,
  AlertTriangle, TrendingUp, TrendingDown, Minus, Shield,
  Zap, BarChart3, Loader2, ChevronDown, ChevronUp, CloudRain,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface QuoteWidgetProps {
  defaultOrigin?: { city: string; state: string; lat?: number; lng?: number };
  defaultDestination?: { city: string; state: string; lat?: number; lng?: number };
  defaultEquipment?: string;
  defaultHazmat?: boolean;
  defaultHazmatClass?: string;
  compact?: boolean;
  onQuoteGenerated?: (quote: any) => void;
  className?: string;
}

const EQUIPMENT_OPTIONS = [
  { value: "dry_van", label: "Dry Van" },
  { value: "flatbed", label: "Flatbed" },
  { value: "reefer", label: "Refrigerated" },
  { value: "tanker", label: "Liquid Tank (DOT-406)" },
  { value: "mc331", label: "Pressurized Gas (MC-331)" },
  { value: "mc338", label: "Cryogenic Tank (MC-338)" },
  { value: "hopper", label: "Dry Bulk / Hopper" },
  { value: "hazmat_van", label: "Hazmat Box Van" },
  { value: "food_grade", label: "Food-Grade Tank" },
  { value: "lowboy", label: "Lowboy / Oversize" },
];

const HAZMAT_CLASSES = [
  { value: "1.1", label: "1.1 - Explosives (Mass)" },
  { value: "1.4", label: "1.4 - Explosives (Minor)" },
  { value: "2.1", label: "2.1 - Flammable Gas" },
  { value: "2.2", label: "2.2 - Non-Flammable Gas" },
  { value: "2.3", label: "2.3 - Poison Gas" },
  { value: "3", label: "3 - Flammable Liquid" },
  { value: "4.1", label: "4.1 - Flammable Solid" },
  { value: "4.2", label: "4.2 - Spont. Combustible" },
  { value: "4.3", label: "4.3 - Dangerous When Wet" },
  { value: "5.1", label: "5.1 - Oxidizer" },
  { value: "5.2", label: "5.2 - Organic Peroxide" },
  { value: "6.1", label: "6.1 - Poison / Toxic" },
  { value: "7", label: "7 - Radioactive" },
  { value: "8", label: "8 - Corrosive" },
  { value: "9", label: "9 - Misc. Dangerous Goods" },
];

function DemandBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    VERY_HIGH: "bg-red-500/15 text-red-400 border-red-500/25",
    HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    MODERATE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    NORMAL: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  };
  const icons: Record<string, React.ReactNode> = {
    VERY_HIGH: <TrendingUp className="w-3 h-3" />,
    HIGH: <TrendingUp className="w-3 h-3" />,
    MODERATE: <Minus className="w-3 h-3" />,
    NORMAL: <TrendingDown className="w-3 h-3" />,
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[level] || colors.NORMAL} gap-1`}>
      {icons[level] || icons.NORMAL}
      {level.replace("_", " ")}
    </Badge>
  );
}

export default function QuoteWidget({
  defaultOrigin,
  defaultDestination,
  defaultEquipment = "dry_van",
  defaultHazmat = false,
  defaultHazmatClass = "3",
  compact = false,
  onQuoteGenerated,
  className = "",
}: QuoteWidgetProps) {
  const [originCity, setOriginCity] = useState(defaultOrigin?.city || "");
  const [originState, setOriginState] = useState(defaultOrigin?.state || "");
  const [destCity, setDestCity] = useState(defaultDestination?.city || "");
  const [destState, setDestState] = useState(defaultDestination?.state || "");
  const [equipment, setEquipment] = useState(defaultEquipment);
  const [hazmat, setHazmat] = useState(defaultHazmat);
  const [hazmatClass, setHazmatClass] = useState(defaultHazmatClass);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const canQuery = originCity.length >= 2 && originState.length === 2 && destCity.length >= 2 && destState.length === 2;

  const quoteQuery = (trpc as any).quotes.getInstant.useQuery(
    {
      origin: { city: originCity, state: originState, lat: defaultOrigin?.lat, lng: defaultOrigin?.lng },
      destination: { city: destCity, state: destState, lat: defaultDestination?.lat, lng: defaultDestination?.lng },
      equipmentType: equipment,
      hazmat,
      hazmatClass: hazmat ? hazmatClass : undefined,
      pickupDate: new Date().toISOString(),
    },
    { enabled: canQuery && hasQueried, staleTime: 60_000 }
  );

  const quote = quoteQuery.data;

  const handleGetQuote = () => {
    setHasQueried(true);
    if (quoteQuery.data) quoteQuery.refetch();
  };

  // Notify parent
  useMemo(() => {
    if (quote && onQuoteGenerated) onQuoteGenerated(quote);
  }, [quote]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Input Form ── */}
      <div className="rounded-2xl border border-slate-700/40 overflow-hidden">
        <div className="px-5 py-3 bg-slate-800/80 border-b border-slate-700/40 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#1473FF]" />
          <span className="text-sm font-semibold text-white">Instant Rate Quote</span>
          <Badge className="bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white border-0 text-[9px] px-2 py-0 ml-auto">HOT ZONES AI</Badge>
        </div>
        <div className="p-5 space-y-4">
          {/* Origin / Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Origin City</Label>
              <div className="flex gap-2">
                <Input value={originCity} onChange={(e) => { setOriginCity(e.target.value); setHasQueried(false); }} placeholder="Houston" className="bg-slate-900/50 border-slate-700/40 text-white text-sm" />
                <Input value={originState} onChange={(e) => { setOriginState(e.target.value.toUpperCase().slice(0, 2)); setHasQueried(false); }} placeholder="TX" maxLength={2} className="bg-slate-900/50 border-slate-700/40 text-white text-sm w-16" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Destination City</Label>
              <div className="flex gap-2">
                <Input value={destCity} onChange={(e) => { setDestCity(e.target.value); setHasQueried(false); }} placeholder="Dallas" className="bg-slate-900/50 border-slate-700/40 text-white text-sm" />
                <Input value={destState} onChange={(e) => { setDestState(e.target.value.toUpperCase().slice(0, 2)); setHasQueried(false); }} placeholder="TX" maxLength={2} className="bg-slate-900/50 border-slate-700/40 text-white text-sm w-16" />
              </div>
            </div>
          </div>

          {/* Equipment + Hazmat */}
          <div className={`grid ${compact ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
            <div>
              <Label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block">Equipment Type</Label>
              <Select value={equipment} onValueChange={(v) => { setEquipment(v); setHasQueried(false); }}>
                <SelectTrigger className="bg-slate-900/50 border-slate-700/40 text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_OPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Switch checked={hazmat} onCheckedChange={(v) => { setHazmat(v); setHasQueried(false); }} />
                <Label className="text-slate-300 text-sm">Hazmat Load</Label>
              </div>
              {hazmat && (
                <Select value={hazmatClass} onValueChange={(v) => { setHazmatClass(v); setHasQueried(false); }}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700/40 text-white text-sm h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HAZMAT_CLASSES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-[#1473FF] to-[#BE01FF] hover:opacity-90 text-white font-semibold rounded-xl"
            onClick={handleGetQuote}
            disabled={!canQuery || quoteQuery.isFetching}
          >
            {quoteQuery.isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Get Instant Quote
          </Button>
        </div>
      </div>

      {/* ── Quote Result ── */}
      {quote && (
        <div className="rounded-2xl border border-slate-700/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header with total */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#1473FF]/10 to-[#BE01FF]/10 border-b border-slate-700/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estimated Total</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">
                  ${quote.pricing.totalEstimate.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Rate / Mile</p>
                <p className="text-2xl font-bold text-white">${quote.pricing.ratePerMile}<span className="text-sm text-slate-400 font-normal">/mi</span></p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{quote.distance} mi</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quote.estimatedTransitTime}</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{quote.intelligence.equipmentLabel}</span>
              {hazmat && <Badge variant="outline" className="text-[9px] border-orange-500/30 text-orange-400">{quote.pricing.hazmatClassLabel}</Badge>}
            </div>
          </div>

          {/* Route summary */}
          <div className="px-5 py-3 border-b border-slate-700/30 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-white text-sm font-medium truncate">{quote.origin.city}, {quote.origin.state}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-white text-sm font-medium truncate">{quote.destination.city}, {quote.destination.state}</span>
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
          </div>

          {/* Intelligence Section */}
          <div className="px-5 py-3 space-y-3">
            {/* Hot Zone badges */}
            {(quote.intelligence.originZone || quote.intelligence.destZone) && (
              <div className="flex flex-wrap gap-2">
                {quote.intelligence.originZone && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-400">Origin:</span>
                    <span className="text-[10px] text-white font-medium">{quote.intelligence.originZone}</span>
                    <DemandBadge level={quote.intelligence.originDemand} />
                  </div>
                )}
                {quote.intelligence.destZone && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] text-slate-400">Dest:</span>
                    <span className="text-[10px] text-white font-medium">{quote.intelligence.destZone}</span>
                    <DemandBadge level={quote.intelligence.destDemand} />
                  </div>
                )}
              </div>
            )}

            {/* Market comparison bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>Market Range</span>
                <span>{quote.marketComparison.source === "lane_learning" ? "Lane Data" : "National Avg"}</span>
              </div>
              <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-[#1473FF] rounded-full" style={{ width: "100%" }} />
                {/* Position marker */}
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#1473FF] shadow-lg"
                  style={{ left: `${Math.min(Math.max(((quote.pricing.totalEstimate - quote.marketComparison.low) / (quote.marketComparison.high - quote.marketComparison.low)) * 100, 5), 95)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="text-emerald-400">${quote.marketComparison.low.toLocaleString()}</span>
                <span className="text-slate-400">Avg: ${quote.marketComparison.average.toLocaleString()}</span>
                <span className="text-red-400">${quote.marketComparison.high.toLocaleString()}</span>
              </div>
            </div>

            {/* Lane intelligence */}
            {quote.intelligence.laneAvgRate && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                <BarChart3 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500">Historical Lane Rate</p>
                  <p className="text-sm text-white font-semibold">${quote.intelligence.laneAvgRate}/mi
                    {quote.intelligence.laneOnTimePercent && <span className="text-slate-400 font-normal ml-2">{quote.intelligence.laneOnTimePercent}% on-time</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Weather alerts */}
            {quote.intelligence.weatherAlerts?.length > 0 && (
              <div className="px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <div className="flex items-center gap-1.5 mb-1">
                  <CloudRain className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Weather Alerts</span>
                </div>
                {quote.intelligence.weatherAlerts.map((a: string, i: number) => (
                  <p key={i} className="text-[11px] text-slate-300 leading-tight">{a}</p>
                ))}
              </div>
            )}

            {/* Expandable breakdown */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showBreakdown ? "Hide" : "Show"} Price Breakdown
            </button>

            {showBreakdown && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Linehaul ({quote.distance} mi x ${quote.pricing.ratePerMile}/mi)</span>
                  <span className="text-white font-medium">${quote.pricing.linehaul.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Fuel Surcharge (Diesel: ${quote.pricing.fuelPricePerGal}/gal)</span>
                  <span className="text-white font-medium">${quote.pricing.fuelSurcharge.toLocaleString()}</span>
                </div>
                {quote.pricing.hazmatFlatFee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-400">Hazmat Fee ({quote.pricing.hazmatClassLabel})</span>
                    <span className="text-orange-400 font-medium">${quote.pricing.hazmatFlatFee}</span>
                  </div>
                )}
                {quote.pricing.hazmatPremiumPerMile > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-400">Hazmat Premium (+${quote.pricing.hazmatPremiumPerMile}/mi)</span>
                    <span className="text-orange-400 font-medium">${Math.round(quote.pricing.hazmatPremiumPerMile * quote.distance).toLocaleString()}</span>
                  </div>
                )}
                {(quote.intelligence.originSurge > 1.05 || quote.intelligence.destSurge > 1.05) && (
                  <div className="flex justify-between text-xs">
                    <span className="text-purple-400">Hot Zone Surge ({Math.round(((quote.intelligence.originSurge + quote.intelligence.destSurge) / 2 - 1) * 100)}%)</span>
                    <span className="text-purple-400 font-medium">Included</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700/30">
                  <span className="text-white font-semibold">Total Estimate</span>
                  <span className="font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${quote.pricing.totalEstimate.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-800/40 border-t border-slate-700/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-500">Quote ID: {quote.quoteId} | Valid 24h</p>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Hot Zones Verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
