/**
 * ADDRESS AUTOCOMPLETE
 * Google Maps Places API powered address input with dropdown suggestions.
 * Parses selected place into address, city, state, zip, lat, lng.
 * Theme-aware | Reusable across LoadWizard, Dispatch Control, etc.
 */
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (parsed: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search address...",
  className,
}: AddressAutocompleteProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Wait for Google Maps
  useEffect(() => {
    const check = () => !!(window as any).google?.maps?.places;
    if (check()) { setReady(true); return; }
    const interval = setInterval(() => {
      if (check()) { setReady(true); clearInterval(interval); }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Attach autocomplete
  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    const g = (window as any).google.maps.places;
    const ac = new g.Autocomplete(inputRef.current, {
      types: ["geocode", "establishment"],
      componentRestrictions: { country: ["us", "ca", "mx"] },
      fields: ["address_components", "formatted_address", "geometry"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place?.address_components) return;
      const comp = (type: string) => place.address_components.find((c: any) => c.types.includes(type));
      const parsed: ParsedAddress = {
        address: place.formatted_address || "",
        city: comp("locality")?.long_name || comp("sublocality")?.long_name || comp("administrative_area_level_2")?.long_name || "",
        state: comp("administrative_area_level_1")?.short_name || "",
        zip: comp("postal_code")?.long_name || "",
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0,
      };
      onChange(parsed.address);
      onSelect(parsed);
    });
    autocompleteRef.current = ac;
  }, [ready]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 z-10" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pl-10 rounded-xl h-11 border",
          isLight
            ? "bg-white border-slate-200 focus:border-purple-400"
            : "bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500",
          className
        )}
      />
    </div>
  );
}
