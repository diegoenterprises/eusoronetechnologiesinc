/**
 * QUICK LOAD DIALOG — 3-field load creation for dispatchers
 * Replaces the 8-step shipper wizard with a fast, minimal dialog
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  X, MapPin, Package, DollarSign, Truck, Clock,
  ChevronDown, ChevronUp, Flame, Plus, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuickLoadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: QuickLoadData) => void;
  isSubmitting?: boolean;
}

export interface QuickLoadData {
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  cargoType: string;
  rate: number;
  trailerType?: string;
  pickupDate?: string;
  specialInstructions?: string;
  hazmatClass?: string;
}

const CARGO_TYPES = [
  { value: "crude_oil", label: "Crude Oil", hazmat: "3" },
  { value: "ngl", label: "NGL", hazmat: "2.1" },
  { value: "propane", label: "Propane", hazmat: "2.1" },
  { value: "water", label: "Water", hazmat: "" },
  { value: "sand", label: "Sand / Frac Sand", hazmat: "" },
  { value: "diesel", label: "Diesel Fuel", hazmat: "3" },
  { value: "condensate", label: "Condensate", hazmat: "3" },
  { value: "produced_water", label: "Produced Water", hazmat: "" },
  { value: "chemicals", label: "Chemicals", hazmat: "8" },
  { value: "dry_bulk", label: "Dry Bulk", hazmat: "" },
  { value: "general", label: "General Freight", hazmat: "" },
];

const TRAILER_TYPES = [
  { value: "tanker", label: "Tanker" },
  { value: "flatbed", label: "Flatbed" },
  { value: "dry_van", label: "Dry Van" },
  { value: "reefer", label: "Reefer" },
  { value: "pneumatic", label: "Pneumatic" },
  { value: "hopper", label: "Hopper" },
  { value: "lowboy", label: "Lowboy" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

export default function QuickLoadDialog({ open, onClose, onSubmit, isSubmitting }: QuickLoadDialogProps) {
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [rate, setRate] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [trailerType, setTrailerType] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const selectedCargo = CARGO_TYPES.find(c => c.value === cargoType);
  const isHazmat = !!(selectedCargo?.hazmat);

  const canSubmit = originCity.trim() && originState && destCity.trim() && destState && cargoType && rate;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      originCity: originCity.trim(),
      originState,
      destinationCity: destCity.trim(),
      destinationState: destState,
      cargoType,
      rate: parseFloat(rate) || 0,
      trailerType: trailerType || undefined,
      pickupDate: pickupDate || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      hazmatClass: selectedCargo?.hazmat || undefined,
    });
  };

  const handleReset = () => {
    setOriginCity(""); setOriginState(""); setDestCity(""); setDestState("");
    setCargoType(""); setRate(""); setTrailerType(""); setPickupDate("");
    setSpecialInstructions("");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Quick load creation"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0d1224] shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" aria-hidden="true" />
                Quick Load
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Create a load in seconds — 3 required fields</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Close quick load dialog"
            >
              <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Field 1: Route */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
                Route <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    placeholder="Origin city"
                    value={originCity}
                    onChange={e => setOriginCity(e.target.value)}
                    className="h-9 text-sm bg-white/[0.04] border-white/[0.08]"
                    aria-label="Origin city"
                  />
                </div>
                <Select value={originState} onValueChange={setOriginState}>
                  <SelectTrigger className="h-9 text-sm bg-white/[0.04] border-white/[0.08]" aria-label="Origin state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Destination city"
                  value={destCity}
                  onChange={e => setDestCity(e.target.value)}
                  className="h-9 text-sm bg-white/[0.04] border-white/[0.08]"
                  aria-label="Destination city"
                />
                <Select value={destState} onValueChange={setDestState}>
                  <SelectTrigger className="h-9 text-sm bg-white/[0.04] border-white/[0.08]" aria-label="Destination state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={`d-${s}`} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field 2: Cargo */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                Cargo <span className="text-red-400">*</span>
              </Label>
              <Select value={cargoType} onValueChange={setCargoType}>
                <SelectTrigger className="h-9 text-sm bg-white/[0.04] border-white/[0.08]" aria-label="Cargo type">
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_TYPES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-1.5">
                        {c.label}
                        {c.hazmat && <Flame className="w-3 h-3 text-red-400 inline" aria-hidden="true" />}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isHazmat && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <Flame className="w-3 h-3" aria-hidden="true" />
                  HazMat Class {selectedCargo?.hazmat} — Hazmat endorsement required for driver
                </div>
              )}
            </div>

            {/* Field 3: Rate */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
                Rate <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  className="h-9 pl-7 text-sm bg-white/[0.04] border-white/[0.08]"
                  aria-label="Load rate in dollars"
                />
              </div>
            </div>

            {/* More Details Toggle */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
              aria-expanded={showMore}
            >
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showMore ? "Less details" : "More details"}
            </button>

            {/* Optional Fields */}
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
                    Trailer Type
                  </Label>
                  <Select value={trailerType} onValueChange={setTrailerType}>
                    <SelectTrigger className="h-9 text-sm bg-white/[0.04] border-white/[0.08]" aria-label="Trailer type">
                      <SelectValue placeholder="Auto-detect from cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAILER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
                    Pickup Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    className="h-9 text-sm bg-white/[0.04] border-white/[0.08]"
                    aria-label="Pickup date and time"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Special Instructions</Label>
                  <Textarea
                    placeholder="Any special requirements..."
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    className="text-sm bg-white/[0.04] border-white/[0.08] min-h-[60px]"
                    aria-label="Special instructions"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-300"
              onClick={handleReset}
            >
              Reset
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-white/[0.08]"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!canSubmit || isSubmitting}
                className="text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" aria-hidden="true" />Creating...</>
                ) : (
                  <><Plus className="w-3.5 h-3.5 mr-1" aria-hidden="true" />Create Load</>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
