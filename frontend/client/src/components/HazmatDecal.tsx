/**
 * HAZMAT DECAL COMPONENT
 * DOT-compliant hazmat placard visualization
 * Shows UN number with proper class colors
 */

import React from "react";
import { cn } from "@/lib/utils";

interface HazmatDecalProps {
  hazmatClass: string;
  unNumber?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const HAZMAT_CLASSES: Record<string, { 
  name: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  symbol: string;
  textColor: string;
}> = {
  "1": { 
    name: "Explosives", 
    color: "#FF6B00", 
    bgColor: "bg-orange-500", 
    borderColor: "border-orange-600",
    symbol: "EXPLOSIVE",
    textColor: "text-black"
  },
  "1.1": { 
    name: "Explosives 1.1", 
    color: "#FF6B00", 
    bgColor: "bg-orange-500", 
    borderColor: "border-orange-600",
    symbol: "1.1",
    textColor: "text-black"
  },
  "1.2": { 
    name: "Explosives 1.2", 
    color: "#FF6B00", 
    bgColor: "bg-orange-500", 
    borderColor: "border-orange-600",
    symbol: "1.2",
    textColor: "text-black"
  },
  "1.3": { 
    name: "Explosives 1.3", 
    color: "#FF6B00", 
    bgColor: "bg-orange-500", 
    borderColor: "border-orange-600",
    symbol: "1.3",
    textColor: "text-black"
  },
  "2.1": { 
    name: "Flammable Gas", 
    color: "#FF0000", 
    bgColor: "bg-red-500", 
    borderColor: "border-red-600",
    symbol: "FLAMMABLE GAS",
    textColor: "text-white"
  },
  "2.2": { 
    name: "Non-Flammable Gas", 
    color: "#00AA00", 
    bgColor: "bg-green-500", 
    borderColor: "border-green-600",
    symbol: "NON-FLAMMABLE GAS",
    textColor: "text-white"
  },
  "2.3": { 
    name: "Poison Gas", 
    color: "#FFFFFF", 
    bgColor: "bg-white", 
    borderColor: "border-black",
    symbol: "POISON GAS",
    textColor: "text-black"
  },
  "3": { 
    name: "Flammable Liquid", 
    color: "#FF0000", 
    bgColor: "bg-red-500", 
    borderColor: "border-red-600",
    symbol: "FLAMMABLE",
    textColor: "text-white"
  },
  "4.1": { 
    name: "Flammable Solid", 
    color: "#FF0000", 
    bgColor: "bg-gradient-to-b from-white to-red-500", 
    borderColor: "border-red-600",
    symbol: "FLAMMABLE SOLID",
    textColor: "text-black"
  },
  "4.2": { 
    name: "Spontaneously Combustible", 
    color: "#FF0000", 
    bgColor: "bg-gradient-to-b from-white to-red-500", 
    borderColor: "border-red-600",
    symbol: "SPONTANEOUSLY COMBUSTIBLE",
    textColor: "text-black"
  },
  "4.3": { 
    name: "Dangerous When Wet", 
    color: "#0066FF", 
    bgColor: "bg-blue-500", 
    borderColor: "border-blue-600",
    symbol: "DANGEROUS WHEN WET",
    textColor: "text-white"
  },
  "5.1": { 
    name: "Oxidizer", 
    color: "#FFFF00", 
    bgColor: "bg-yellow-400", 
    borderColor: "border-yellow-500",
    symbol: "OXIDIZER",
    textColor: "text-black"
  },
  "5.2": { 
    name: "Organic Peroxide", 
    color: "#FFFF00", 
    bgColor: "bg-gradient-to-b from-yellow-400 to-red-500", 
    borderColor: "border-yellow-500",
    symbol: "ORGANIC PEROXIDE",
    textColor: "text-black"
  },
  "6.1": { 
    name: "Poison", 
    color: "#FFFFFF", 
    bgColor: "bg-white", 
    borderColor: "border-black",
    symbol: "POISON",
    textColor: "text-black"
  },
  "6.2": { 
    name: "Infectious Substance", 
    color: "#FFFFFF", 
    bgColor: "bg-white", 
    borderColor: "border-black",
    symbol: "INFECTIOUS",
    textColor: "text-black"
  },
  "7": { 
    name: "Radioactive", 
    color: "#FFFF00", 
    bgColor: "bg-gradient-to-b from-yellow-400 to-white", 
    borderColor: "border-yellow-500",
    symbol: "RADIOACTIVE",
    textColor: "text-black"
  },
  "8": { 
    name: "Corrosive", 
    color: "#FFFFFF", 
    bgColor: "bg-gradient-to-b from-white to-black", 
    borderColor: "border-black",
    symbol: "CORROSIVE",
    textColor: "text-black"
  },
  "9": { 
    name: "Miscellaneous", 
    color: "#FFFFFF", 
    bgColor: "bg-white", 
    borderColor: "border-black",
    symbol: "MISC",
    textColor: "text-black"
  },
};

const HazmatDecal: React.FC<HazmatDecalProps> = ({
  hazmatClass,
  unNumber,
  size = "md",
  showLabel = true,
}) => {
  const classInfo = HAZMAT_CLASSES[hazmatClass] || HAZMAT_CLASSES["9"];
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const fontSizes = {
    sm: "text-[6px]",
    md: "text-[8px]",
    lg: "text-xs",
  };

  const unFontSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          sizeClasses[size],
          "relative transform rotate-45 border-4",
          classInfo.borderColor
        )}
        style={{
          background: classInfo.bgColor.includes("gradient") 
            ? undefined 
            : classInfo.color === "#FFFFFF" ? "white" : classInfo.color,
        }}
      >
        <div 
          className={cn(
            "absolute inset-0",
            classInfo.bgColor
          )}
        />
        
        <div className="absolute inset-0 transform -rotate-45 flex flex-col items-center justify-center p-1">
          <div className={cn("font-bold text-center leading-tight", fontSizes[size], classInfo.textColor)}>
            {classInfo.symbol.split(" ").slice(0, 2).join(" ")}
          </div>
          
          {unNumber && (
            <div className={cn(
              "mt-1 px-2 py-0.5 bg-white border border-black font-bold",
              unFontSizes[size],
              "text-black"
            )}>
              {unNumber}
            </div>
          )}
          
          <div className={cn(
            "absolute bottom-1 font-bold",
            fontSizes[size],
            classInfo.textColor
          )}>
            {hazmatClass}
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="text-center mt-2">
          <p className="text-white font-medium text-sm">{classInfo.name}</p>
          {unNumber && (
            <p className="text-slate-400 text-xs">UN {unNumber}</p>
          )}
        </div>
      )}
    </div>
  );
};

export const HazmatDecalPreview: React.FC<{
  hazmatClass: string;
  unNumber?: string;
  productName?: string;
}> = ({ hazmatClass, unNumber, productName }) => {
  const classInfo = HAZMAT_CLASSES[hazmatClass] || HAZMAT_CLASSES["9"];

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <p className="text-slate-400 text-xs mb-3 text-center">Required Placard</p>
      
      <div className="flex items-center justify-center gap-6">
        <HazmatDecal 
          hazmatClass={hazmatClass} 
          unNumber={unNumber} 
          size="lg"
          showLabel={false}
        />
        
        <div className="text-left">
          <p className="text-white font-bold text-lg">{classInfo.name}</p>
          <p className="text-slate-400 text-sm">Class {hazmatClass}</p>
          {unNumber && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <span className="text-orange-400 font-bold">{unNumber}</span>
            </div>
          )}
          {productName && (
            <p className="text-slate-500 text-xs mt-2">Product: {productName}</p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-yellow-400 text-xs flex items-center gap-2">
          <span className="font-bold">[!]</span>
          This placard must be displayed on all four sides of the transport vehicle
        </p>
      </div>
    </div>
  );
};

export default HazmatDecal;
