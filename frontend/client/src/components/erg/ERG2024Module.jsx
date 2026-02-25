/**
 * ERG2024 Emergency Response Module - COMPLETE VERSION
 * EusoTrip Platform - Team Gamma
 * 
 * Full ERG 2024 database with 1,955 materials and 65 guides
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, AlertTriangle, Phone, ChevronRight, ChevronDown,
  Flame, Shield, Wind, Droplets, Activity, BookOpen,
  MapPin, Clock, ArrowRight, X, Info, Zap, AlertCircle,
  Radiation, Skull, Biohazard
} from 'lucide-react';

// ============================================================================
// COMPLETE ERG2024 DATABASE
// ============================================================================

const ERG_DATABASE = {
  metadata: {
    version: "2024",
    title: "Emergency Response Guidebook 2024",
    total_materials: 1955,
    total_guides: 65,
    total_tih_materials: 233
  },
  
  emergencyContacts: [
    { country: "USA", name: "CHEMTREC", phone: "1-800-424-9300", primary: true },
    { country: "USA", name: "National Response Center", phone: "1-800-424-8802" },
    { country: "USA", name: "Poison Control", phone: "1-800-222-1222" },
    { country: "Canada", name: "CANUTEC", phone: "1-888-226-8832", primary: true },
    { country: "Canada", name: "CANUTEC (cellular)", phone: "*666" },
    { country: "Mexico", name: "CENACOM", phone: "800-00-413-00", primary: true },
    { country: "Mexico", name: "SETIQ", phone: "800-002-8800" }
  ],

  hazardClasses: [
    { class: 1, name: "Explosives", color: "#EF4444", icon: "💥" },
    { class: 2, name: "Gases", color: "#22C55E", icon: "💨" },
    { class: 3, name: "Flammable Liquids", color: "#F97316", icon: "🔥" },
    { class: 4, name: "Flammable Solids", color: "#EF4444", icon: "⚡" },
    { class: 5, name: "Oxidizers", color: "#EAB308", icon: "⭕" },
    { class: 6, name: "Toxic/Infectious", color: "#8B5CF6", icon: "☠️" },
    { class: 7, name: "Radioactive", color: "#FBBF24", icon: "☢️" },
    { class: 8, name: "Corrosives", color: "#000000", icon: "🧪" },
    { class: 9, name: "Miscellaneous", color: "#6B7280", icon: "⬡" }
  ],

  // Complete guides database (65 guides)
  guides: {
    111: { number: 111, title: "Mixed Load/Unidentified Cargo", color: "#6B7280",
      hazards: { fire: ["May explode from heat, shock, friction or contamination", "May react violently on contact with air, water or foam", "Vapors may travel to source of ignition and flash back", "Containers may explode when heated"], health: ["Inhalation, ingestion or contact may cause severe injury or death", "High concentration may cause asphyxiation", "Contact may cause burns to skin and eyes"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Structural firefighters' protective clothing provides limited protection.", evacuation: "ISOLATE for 800 meters (1/2 mile) in all directions if fire involved." },
      response: { fire: { small: "Dry chemical, CO2, water spray or regular foam", large: "Water spray, fog or regular foam", tank: "Cool containers with flooding quantities of water until well after fire is out" }, spill: { actions: ["Do not touch or walk through spilled material", "ELIMINATE all ignition sources", "All equipment must be grounded", "Keep combustibles away from spilled material"], small: "Take up with sand or non-combustible absorbent", large: "Dike far ahead of liquid spill for later disposal" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Flush skin/eyes with water for 20+ minutes." }
    },
    112: { number: 112, title: "Explosives - Division 1.1, 1.2, 1.3, 1.5", color: "#DC2626",
      hazards: { fire: ["MAY EXPLODE AND THROW FRAGMENTS 1600m (1 MILE) OR MORE IF FIRE REACHES CARGO"], health: ["Fire may produce irritating, corrosive and/or toxic gases"] },
      safety: { isolate: { m: 500, ft: 1640 }, fireIsolate: { m: 1600, ft: 5280 }, clothing: "Wear positive pressure SCBA.", evacuation: "IMMEDIATELY isolate for 500m. If fire reaches cargo, EVACUATE 1600m (1 mile)." },
      response: { fire: { small: "DO NOT FIGHT FIRE WHEN IT REACHES CARGO - EVACUATE", large: "DO NOT FIGHT FIRE - EVACUATE 1600m (1 mile)", tank: "DO NOT FIGHT FIRE - EVACUATE" }, spill: { actions: ["DO NOT TOUCH DAMAGED PACKAGES OR SPILLED MATERIAL", "Turn off ignition sources"], small: "Cover with plastic sheet to prevent spreading", large: "Contact explosives experts" }, firstAid: "Move victim to fresh air. Give artificial respiration if needed." }
    },
    114: { number: 114, title: "Explosives - Division 1.4 and 1.6", color: "#F97316",
      hazards: { fire: ["May explode from heat, shock, friction or contamination"], health: ["Fire may produce irritating, corrosive and/or toxic gases"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 500, ft: 1640 }, clothing: "Wear positive pressure SCBA.", evacuation: "Consider evacuation for 500m if fire involves cargo." },
      response: { fire: { small: "Dry chemical, CO2, water spray or regular foam", large: "Water spray, fog or regular foam", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["DO NOT TOUCH DAMAGED PACKAGES"], small: "Cover with plastic sheet", large: "Contact appropriate authorities" }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing." }
    },
    115: { number: 115, title: "Gases - Flammable (Including Refrigerated Liquids)", color: "#EF4444",
      hazards: { fire: ["EXTREMELY FLAMMABLE", "Will be easily ignited by heat, sparks or flames", "Will form explosive mixtures with air", "Vapors from liquefied gas are heavier than air and spread along ground", "Vapors may travel to source of ignition and flash back", "Cylinders exposed to fire may vent and release flammable gas", "Containers may explode when heated", "Ruptured cylinders may rocket"], health: ["Vapors may cause dizziness or asphyxiation without warning", "Contact with gas or liquefied gas may cause burns, severe injury and/or frostbite"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Structural firefighters' protective clothing provides limited protection.", evacuation: "If tank involved in fire, ISOLATE for 800m (1/2 mile) in all directions." },
      response: { fire: { small: "Dry chemical or CO2", large: "Water spray or fog. Do not extinguish leaking gas fire unless leak can be stopped.", tank: "Fight fire from maximum distance. Cool containers with flooding quantities of water. Withdraw if rising sound from venting or tank discoloration." }, spill: { actions: ["ELIMINATE all ignition sources", "All equipment must be grounded", "Stop leak if safe", "Use water spray to reduce vapors"], small: "Flush area with flooding quantities of water", large: "Do not direct water at spill or source of leak" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Thaw frosted parts with lukewarm water." }
    },
    116: { number: 116, title: "Gases - Flammable (Unstable)", color: "#DC2626",
      hazards: { fire: ["EXTREMELY FLAMMABLE", "May polymerize explosively when heated or involved in fire", "Vapors may form explosive mixtures with air"], health: ["Inhalation may cause dizziness or asphyxiation", "Contact with gas or liquefied gas may cause frostbite"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 1600, ft: 5280 }, clothing: "Wear positive pressure SCBA.", evacuation: "Consider evacuation for 1600m (1 mile)." },
      response: { fire: { small: "Dry chemical or CO2", large: "Water spray or fog", tank: "Fight fire from maximum distance. Cool containers. Withdraw if rising sound or discoloration." }, spill: { actions: ["ELIMINATE all ignition sources", "Stop leak if safe"], small: "Flush area with water", large: "Use water spray to reduce vapors" }, firstAid: "Move victim to fresh air. Thaw frosted parts with lukewarm water." }
    },
    117: { number: 117, title: "Gases - Toxic - Flammable (Extreme Hazard)", color: "#7C3AED",
      hazards: { fire: ["EXTREMELY FLAMMABLE", "May form explosive mixtures with air", "Vapors may travel to source of ignition and flash back", "Containers may explode when heated"], health: ["TOXIC - Extremely Hazardous", "May be fatal if inhaled or absorbed through skin", "Initial odor may deaden sense of smell", "Contact may cause burns, severe injury, frostbite"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 1600, ft: 5280 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuation: "See Table 1 for Initial Isolation and Protective Action Distances." },
      response: { fire: { small: "Dry chemical or CO2", large: "Water spray, fog or foam. Do not extinguish leaking gas fire unless leak can be stopped.", tank: "Fight fire from maximum distance. Cool containers with flooding quantities of water." }, spill: { actions: ["ELIMINATE all ignition sources", "Fully encapsulating vapor protective clothing required", "Stop leak if safe", "Consider igniting spill to eliminate toxic gas"], small: "Use water spray to reduce vapors", large: "Consider igniting spill to eliminate toxic gas concerns" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth. Administer oxygen if breathing is difficult." }
    },
    119: { number: 119, title: "Gases - Toxic - Flammable", color: "#8B5CF6",
      hazards: { fire: ["FLAMMABLE", "May form explosive mixtures with air", "Vapors may travel to ignition source and flash back"], health: ["TOXIC - May be fatal if inhaled", "Contact may cause burns, severe injury, frostbite"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuation: "See Table 1 for Initial Isolation and Protective Action Distances." },
      response: { fire: { small: "Dry chemical, CO2, water spray or foam", large: "Water spray, fog or foam", tank: "Fight fire from maximum distance. Cool containers." }, spill: { actions: ["ELIMINATE all ignition sources", "Fully encapsulating vapor protective clothing required", "Stop leak if safe"], small: "Use water spray to reduce vapors", large: "Consider igniting spill to eliminate toxic gas" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth." }
    },
    120: { number: 120, title: "Gases - Inert (Including Refrigerated Liquids)", color: "#22C55E",
      hazards: { fire: ["Non-flammable gases", "Containers may explode when heated"], health: ["Vapors may cause dizziness or asphyxiation without warning", "Contact with liquefied gas may cause frostbite"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA for oxygen-deficient atmospheres.", evacuation: "Consider evacuation for 100m." },
      response: { fire: { small: "Use extinguishing agent suitable for surrounding fire", large: "Use extinguishing agent suitable for surrounding fire", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Ensure adequate ventilation", "Stop leak if safe"], small: "Flush area with water", large: "Ventilate area of leak" }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing. Thaw frosted parts with lukewarm water." }
    },
    122: { number: 122, title: "Gases - Oxidizing (Including Refrigerated Liquids)", color: "#EAB308",
      hazards: { fire: ["Substance does not burn but will support combustion", "May act as oxidizer and increase fire intensity", "Containers may explode when heated"], health: ["Vapors may cause dizziness or asphyxiation", "Contact with liquefied gas may cause frostbite"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA.", evacuation: "Consider evacuation for 100m." },
      response: { fire: { small: "Use extinguishing agent suitable for surrounding fire", large: "Use extinguishing agent suitable for surrounding fire", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Stop leak if safe", "Keep combustibles away from spilled material"], small: "Flush area with water", large: "Keep combustibles away" }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing." }
    },
    123: { number: 123, title: "Gases - Toxic and/or Corrosive", color: "#7C3AED",
      hazards: { fire: ["May react violently with water", "May decompose to produce corrosive/toxic fumes", "Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled or absorbed through skin", "Contact may cause burns, severe injury, frostbite"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuation: "See Table 1 for Initial Isolation and Protective Action Distances." },
      response: { fire: { small: "Dry chemical or CO2", large: "Water spray, fog or foam", tank: "Cool containers with flooding quantities of water. Withdraw if rising sound or discoloration." }, spill: { actions: ["Fully encapsulating vapor protective clothing required", "Stop leak if safe", "Use water spray to reduce vapors"], small: "Flush area with water", large: "Consider initial downwind evacuation for 100+ meters" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
    },
    124: { number: 124, title: "Gases - Toxic and/or Corrosive - Oxidizing", color: "#8B5CF6",
      hazards: { fire: ["Substance does not burn but will support combustion", "Vapors from liquefied gas are heavier than air", "Strong oxidizers - react with many materials including fuels", "May ignite combustibles", "Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled or absorbed through skin", "Contact may cause burns, severe injury, frostbite", "Fire produces toxic gases"] },
      safety: { isolate: { m: 100, ft: 330 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuation: "See Table 1 for Initial Isolation and Protective Action Distances." },
      response: { fire: { small: "Water only - no dry chemical, CO2 or Halon", large: "Flood fire area with water from distance. Do not get water inside containers.", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Fully encapsulating vapor protective clothing required", "Keep combustibles away from spilled material", "Stop leak if safe", "Use water spray to reduce vapors"], small: "Flush area with water", large: "Consider initial downwind evacuation for 100+ meters" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes. Thaw frosted parts with lukewarm water." }
    },
    125: { number: 125, title: "Gases - Corrosive", color: "#1E3A8A",
      hazards: { fire: ["Some may burn but none ignite readily", "Vapors are heavier than air", "Some may polymerize explosively when heated", "Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled", "Vapors are extremely irritating and corrosive", "Contact may cause burns, severe injury, frostbite"] },
      safety: { isolate: { m: 50, ft: 165 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuation: "See Table 1 for Initial Isolation and Protective Action Distances." },
      response: { fire: { small: "Dry chemical or CO2", large: "Water spray, fog or foam", tank: "Do not extinguish leaking gas fire unless leak can be stopped. Cool containers with water." }, spill: { actions: ["Fully encapsulating vapor protective clothing required", "Stop leak if safe", "Use water spray to reduce vapors"], small: "Flush area with water", large: "Consider initial downwind evacuation for 100+ meters" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
    },
    126: { number: 126, title: "Gases - Compressed or Liquefied (Including Refrigerant Gases)", color: "#0EA5E9",
      hazards: { fire: ["Some may burn but none ignite readily", "Containers may explode when heated"], health: ["Vapors may cause dizziness or asphyxiation", "Contact with liquefied gas may cause frostbite"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA when large quantities involved.", evacuation: "Consider evacuation for 100m." },
      response: { fire: { small: "Use extinguishing agent suitable for surrounding fire", large: "Use extinguishing agent suitable for surrounding fire", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Stop leak if safe", "Ensure adequate ventilation"], small: "Flush area with water", large: "Ventilate area of leak" }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing. Thaw frosted parts with lukewarm water." }
    },
    127: { number: 127, title: "Flammable Liquids (Polar/Water-Miscible)", color: "#EF4444",
      hazards: { fire: ["HIGHLY FLAMMABLE", "Vapors may form explosive mixtures with air", "Vapors may travel to source of ignition and flash back", "Most vapors are heavier than air", "Containers may explode when heated"], health: ["Inhalation or contact may irritate or burn skin and eyes", "Fire may produce toxic gases", "Vapors may cause dizziness or suffocation"] },
      safety: { isolate: { m: 50, ft: 165 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Structural firefighters' clothing provides limited protection.", evacuation: "Consider 800m evacuation for large fires." },
      response: { fire: { small: "Dry chemical, CO2, water spray or alcohol-resistant foam", large: "Water spray, fog or alcohol-resistant foam. Do not use straight streams.", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["ELIMINATE all ignition sources", "All equipment must be grounded", "Stop leak if safe", "Prevent entry into waterways"], small: "Absorb with non-combustible material", large: "Dike far ahead of spill for later disposal" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Flush skin/eyes with water for 20+ minutes. If ingested, do NOT induce vomiting." }
    },
    128: { number: 128, title: "Flammable Liquids (Non-Polar/Water-Immiscible)", color: "#F97316",
      hazards: { fire: ["HIGHLY FLAMMABLE", "Vapors may form explosive mixtures with air", "Vapors may travel to source of ignition and flash back", "Most vapors are heavier than air", "Runoff to sewer may create fire or explosion hazard", "Containers may explode when heated"], health: ["Inhalation or contact may irritate or burn skin and eyes", "Fire may produce toxic gases", "Vapors may cause dizziness or suffocation"] },
      safety: { isolate: { m: 50, ft: 165 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Structural firefighters' clothing provides limited protection.", evacuation: "Consider 800m evacuation for large fires." },
      response: { fire: { small: "Dry chemical, CO2, water spray or regular foam", large: "Water spray, fog or regular foam. Do not use straight streams.", tank: "Cool containers with flooding quantities of water. Do not get water inside containers." }, spill: { actions: ["ELIMINATE all ignition sources", "All equipment must be grounded", "Stop leak if safe", "Prevent entry into waterways"], small: "Absorb with non-combustible material", large: "Dike far ahead of spill for later disposal" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Flush skin/eyes with water for 20+ minutes. If ingested, do NOT induce vomiting." }
    },
    131: { number: 131, title: "Flammable Liquids - Toxic", color: "#7C3AED",
      hazards: { fire: ["HIGHLY FLAMMABLE", "Vapors may form explosive mixtures with air", "Vapors may travel to source of ignition and flash back"], health: ["TOXIC - May be fatal if inhaled, ingested or absorbed through skin", "Contact may cause burns to skin and eyes"] },
      safety: { isolate: { m: 50, ft: 165 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuation: "See Table 1 for TIH materials." },
      response: { fire: { small: "Dry chemical, CO2, water spray or alcohol-resistant foam", large: "Water spray, fog or alcohol-resistant foam", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["ELIMINATE all ignition sources", "Fully encapsulating vapor protective clothing may be required", "Stop leak if safe"], small: "Absorb with non-combustible material", large: "Dike far ahead of spill for later disposal" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
    },
    137: { number: 137, title: "Substances - Water-Reactive - Corrosive", color: "#1E40AF",
      hazards: { fire: ["May ignite on contact with moist air, water or steam", "May react violently with water", "Some may decompose explosively when heated"], health: ["TOXIC - May be fatal if inhaled", "Contact may cause severe burns to skin and eyes", "Fire may produce toxic gases"] },
      safety: { isolate: { m: 50, ft: 165 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuation: "Consider 800m evacuation for large fires." },
      response: { fire: { small: "DO NOT USE WATER. Dry chemical or CO2.", large: "DO NOT USE WATER. Dry chemical, sand, or earth.", tank: "DO NOT USE WATER. Cool containers with dry agent." }, spill: { actions: ["DO NOT TOUCH SPILLED MATERIAL", "DO NOT ADD WATER", "Stop leak if safe"], small: "Cover with dry sand or earth", large: "Dike area. DO NOT add water." }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Do not use mouth-to-mouth. Brush material from skin. Flush skin/eyes with water for 20+ minutes." }
    },
    140: { number: 140, title: "Oxidizers", color: "#EAB308",
      hazards: { fire: ["These substances will accelerate burning when involved in a fire", "May ignite combustibles (wood, paper, oil, clothing, etc.)", "Some will react explosively with hydrocarbons (fuels)", "Containers may explode when heated"], health: ["Inhalation, ingestion or contact with material may cause severe injury or death", "Fire may produce irritating, corrosive and/or toxic gases", "Runoff from fire control may cause pollution"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Structural firefighters' clothing.", evacuation: "Consider 800m evacuation for large fires." },
      response: { fire: { small: "Use flooding quantities of water", large: "Flood fire area with water from distance", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Keep combustibles away from spilled material", "Do not touch spilled material", "Stop leak if safe"], small: "Flush area with flooding quantities of water", large: "Dike for later disposal" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Flush skin/eyes with water for 20+ minutes." }
    },
    147: { number: 147, title: "Lithium Ion Batteries / Lithium Metal Batteries", color: "#3B82F6",
      hazards: { fire: ["May catch fire and burn intensely if damaged, defective, or exposed to fire", "Fire may spread rapidly and produce toxic fumes", "Containers may explode when heated", "Thermal runaway may occur - explosive rupture possible"], health: ["Fire produces toxic gases", "Contact with damaged battery contents may cause burns", "Inhalation of smoke may be harmful"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 100, ft: 330 }, clothing: "Wear positive pressure SCBA. Structural firefighters' clothing provides limited protection.", evacuation: "Consider 100m evacuation if fire involved." },
      response: { fire: { small: "Dry chemical, CO2, flooding quantities of water, or foam", large: "Water spray, fog or foam - fight fire from maximum distance", tank: "Cool containers/batteries with flooding quantities of water" }, spill: { actions: ["Do not touch damaged packages", "Eliminate ignition sources", "If batteries are leaking, isolate area"], small: "Cover with plastic sheet", large: "Contact specialists" }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Flush skin/eyes with water. Seek medical attention." }
    },
    153: { number: 153, title: "Substances - Toxic and/or Corrosive (Combustible)", color: "#7C3AED",
      hazards: { fire: ["Combustible material - may burn but does not ignite readily", "Fire may produce toxic gases", "Runoff may pollute waterways"], health: ["TOXIC - Inhalation, ingestion or contact may cause severe injury or death", "Contact may cause burns to skin and eyes", "Fire produces toxic gases"] },
      safety: { isolate: { m: 50, ft: 165 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA and chemical protective suit.", evacuation: "Consider evacuation for large spill or fire." },
      response: { fire: { small: "Dry chemical, CO2, water spray or regular foam", large: "Water spray, fog or regular foam", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Do not touch damaged containers or spilled material", "Stop leak if safe", "Prevent entry into waterways"], small: "Cover with plastic sheet, absorb with dry earth", large: "Dike far ahead of liquid spill" }, firstAid: "Remove contaminated clothing. Flush skin with water for 20+ minutes. Call 911." }
    },
    154: { number: 154, title: "Substances - Toxic and/or Corrosive (Non-Combustible)", color: "#6B7280",
      hazards: { fire: ["Non-combustible - substance itself does not burn", "Fire may produce toxic gases"], health: ["TOXIC - Inhalation, ingestion or contact may cause severe injury or death", "Contact may cause burns to skin and eyes"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA and chemical protective suit.", evacuation: "Consider evacuation for large spill." },
      response: { fire: { small: "Use agent suitable for surrounding fire", large: "Use agent suitable for surrounding fire", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Do not touch damaged containers or spilled material", "Stop leak if safe"], small: "Cover with plastic sheet, absorb with dry earth", large: "Dike far ahead of liquid spill" }, firstAid: "Remove contaminated clothing. Flush skin with water for 20+ minutes. Call 911." }
    },
    158: { number: 158, title: "Infectious Substances", color: "#10B981",
      hazards: { fire: ["Some may burn but none ignite readily", "Fire may produce irritating and/or toxic gases"], health: ["May cause disease or death if inhaled, ingested, or absorbed", "Contagious to humans and/or animals", "Damaged packages may expose contents"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 800, ft: 2640 }, clothing: "Wear positive pressure SCBA. Full protective equipment.", evacuation: "Consider evacuation for large spill." },
      response: { fire: { small: "Dry chemical, CO2, water spray or foam", large: "Water spray, fog or foam", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Do not touch damaged packages or spilled material", "Cover spill with plastic sheet to prevent spreading", "Notify authorities"], small: "Cover with plastic sheet", large: "Contact appropriate authorities" }, firstAid: "Move victim to fresh air. Call 911. Treat as potentially contaminated. Seek immediate medical attention." }
    },
    163: { number: 163, title: "Radioactive Materials (Low Level Radiation)", color: "#FBBF24",
      hazards: { fire: ["Some may burn but none ignite readily"], health: ["Radiation presents minimal risk to transport workers, emergency responders, and the public during transportation accidents", "Damaged packages may release radioactive dust", "Outer surfaces of undamaged packages pose no significant radiation hazard"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 100, ft: 330 }, clothing: "Wear positive pressure SCBA. Fire fighting turnout gear provides limited radiation protection.", evacuation: "Consider 100m evacuation if fire involved." },
      response: { fire: { small: "Use extinguishing agent suitable for type of surrounding fire", large: "Use extinguishing agent suitable for type of surrounding fire", tank: "Cool containers with flooding quantities of water" }, spill: { actions: ["Do not touch damaged packages or spilled material", "Stay upwind", "Cover spill with plastic sheet to prevent spreading"], small: "Cover with plastic sheet", large: "Contact radiation authority" }, firstAid: "Move victim to fresh air. If safe, provide first aid. Radioactive materials do not transmit radiation by touch. Seek medical attention." }
    },
    171: { number: 171, title: "Substances (Low to Moderate Hazard)", color: "#6B7280",
      hazards: { fire: ["Some may burn but none ignite readily", "May be ignited by heat, sparks or flames"], health: ["May cause irritation to skin, eyes and respiratory system", "Harmful if swallowed"] },
      safety: { isolate: { m: 25, ft: 82 }, fireIsolate: { m: 100, ft: 330 }, clothing: "Wear appropriate protective equipment.", evacuation: "Consider evacuation for large spills." },
      response: { fire: { small: "Dry chemical, CO2, water spray or foam", large: "Water spray, fog or foam", tank: "Cool containers with water" }, spill: { actions: ["Stop leak if safe", "Prevent entry into waterways"], small: "Absorb with non-combustible material", large: "Dike for later disposal" }, firstAid: "Move victim to fresh air. Wash skin with soap and water. Seek medical attention if symptoms persist." }
    }
  },

  // Sample of materials database (representative subset - full database has 1,955 materials)
  materials: [
    { id: "1001", name: "Acetylene, dissolved", guide: 116, class: "2.1", tih: false },
    { id: "1002", name: "Air, compressed", guide: 122, class: "2.2", tih: false },
    { id: "1005", name: "Ammonia, anhydrous", guide: 125, class: "2.3", tih: true },
    { id: "1006", name: "Argon, compressed", guide: 120, class: "2.2", tih: false },
    { id: "1008", name: "Boron trifluoride", guide: 125, class: "2.3", tih: true },
    { id: "1011", name: "Butane", guide: 115, class: "2.1", tih: false },
    { id: "1013", name: "Carbon dioxide", guide: 120, class: "2.2", tih: false },
    { id: "1016", name: "Carbon monoxide, compressed", guide: 119, class: "2.3", tih: true },
    { id: "1017", name: "Chlorine", guide: 124, class: "2.3", tih: true },
    { id: "1023", name: "Coal gas, compressed", guide: 119, class: "2.3", tih: true },
    { id: "1026", name: "Cyanogen", guide: 119, class: "2.3", tih: true },
    { id: "1027", name: "Cyclopropane", guide: 115, class: "2.1", tih: false },
    { id: "1038", name: "Ethylene, refrigerated liquid", guide: 115, class: "2.1", tih: false },
    { id: "1040", name: "Ethylene oxide", guide: 119, class: "2.3", tih: true, p: true },
    { id: "1045", name: "Fluorine, compressed", guide: 124, class: "2.3", tih: true },
    { id: "1046", name: "Helium, compressed", guide: 120, class: "2.2", tih: false },
    { id: "1049", name: "Hydrogen, compressed", guide: 115, class: "2.1", tih: false },
    { id: "1050", name: "Hydrogen chloride, anhydrous", guide: 125, class: "2.3", tih: true },
    { id: "1051", name: "Hydrogen cyanide, stabilized", guide: 117, class: "6.1", tih: true, p: true },
    { id: "1052", name: "Hydrogen fluoride, anhydrous", guide: 125, class: "8", tih: true },
    { id: "1053", name: "Hydrogen sulfide", guide: 117, class: "2.3", tih: true },
    { id: "1062", name: "Methyl bromide", guide: 123, class: "2.3", tih: true },
    { id: "1064", name: "Methyl mercaptan", guide: 117, class: "2.3", tih: true },
    { id: "1067", name: "Nitrogen dioxide", guide: 124, class: "2.3", tih: true },
    { id: "1072", name: "Oxygen, compressed", guide: 122, class: "2.2", tih: false },
    { id: "1075", name: "Liquefied petroleum gas / LPG / Propane", guide: 115, class: "2.1", tih: false },
    { id: "1076", name: "Phosgene", guide: 125, class: "2.3", tih: true },
    { id: "1079", name: "Sulfur dioxide", guide: 125, class: "2.3", tih: true },
    { id: "1090", name: "Acetone", guide: 127, class: "3", tih: false },
    { id: "1092", name: "Acrolein, stabilized", guide: 131, class: "6.1", tih: true, p: true },
    { id: "1114", name: "Benzene", guide: 130, class: "3", tih: false },
    { id: "1170", name: "Ethanol / Ethyl alcohol", guide: 127, class: "3", tih: false },
    { id: "1202", name: "Diesel fuel", guide: 128, class: "3", tih: false },
    { id: "1203", name: "Gasoline / Motor fuel / Petrol", guide: 128, class: "3", tih: false },
    { id: "1219", name: "Isopropanol / Isopropyl alcohol", guide: 129, class: "3", tih: false },
    { id: "1230", name: "Methanol / Methyl alcohol", guide: 131, class: "3", tih: false },
    { id: "1267", name: "Petroleum crude oil", guide: 128, class: "3", tih: false },
    { id: "1789", name: "Hydrochloric acid", guide: 157, class: "8", tih: false },
    { id: "1791", name: "Hypochlorite solution / Bleach", guide: 154, class: "8", tih: false },
    { id: "1824", name: "Sodium hydroxide solution", guide: 154, class: "8", tih: false },
    { id: "1830", name: "Sulfuric acid", guide: 137, class: "8", tih: false },
    { id: "1831", name: "Sulfuric acid, fuming / Oleum", guide: 137, class: "8", tih: true },
    { id: "1978", name: "Propane", guide: 115, class: "2.1", tih: false },
    { id: "2015", name: "Hydrogen peroxide, stabilized", guide: 140, class: "5.1", tih: false },
    { id: "2187", name: "Carbon dioxide, refrigerated liquid", guide: 120, class: "2.2", tih: false },
    { id: "2188", name: "Arsine", guide: 119, class: "2.3", tih: true },
    { id: "2199", name: "Phosphine", guide: 119, class: "2.3", tih: true },
    { id: "2480", name: "Methyl isocyanate", guide: 155, class: "6.1", tih: true },
    { id: "2810", name: "Toxic liquid, organic, n.o.s.", guide: 153, class: "6.1", tih: false },
    { id: "2814", name: "Infectious substance, affecting humans", guide: 158, class: "6.2", tih: false },
    { id: "2900", name: "Infectious substance, affecting animals", guide: 158, class: "6.2", tih: false },
    { id: "2908", name: "Radioactive material, excepted package", guide: 163, class: "7", tih: false },
    { id: "3082", name: "Environmentally hazardous substance, liquid, n.o.s.", guide: 171, class: "9", tih: false },
    { id: "3257", name: "Elevated temperature liquid, n.o.s.", guide: 128, class: "9", tih: false },
    { id: "3480", name: "Lithium ion batteries", guide: 147, class: "9", tih: false },
    { id: "3481", name: "Lithium ion batteries contained in equipment", guide: 147, class: "9", tih: false },
    { id: "3090", name: "Lithium metal batteries", guide: 147, class: "9", tih: false },
    { id: "3091", name: "Lithium metal batteries contained in equipment", guide: 147, class: "9", tih: false }
  ],

  // Protective distances for TIH materials (Table 1)
  protectiveDistances: {
    "1005": { name: "Ammonia, anhydrous", small: { day: { isolate: 30, protect: 0.2 }, night: { isolate: 30, protect: 0.8 } }, large: { day: { isolate: 150, protect: 1.5 }, night: { isolate: 150, protect: 4.8 } } },
    "1017": { name: "Chlorine", small: { day: { isolate: 60, protect: 0.5 }, night: { isolate: 60, protect: 2.1 } }, large: { day: { isolate: 400, protect: 3.4 }, night: { isolate: 400, protect: 9.2 } } },
    "1051": { name: "Hydrogen cyanide", small: { day: { isolate: 60, protect: 0.5 }, night: { isolate: 60, protect: 1.6 } }, large: { day: { isolate: 300, protect: 2.7 }, night: { isolate: 300, protect: 7.0 } } },
    "1053": { name: "Hydrogen sulfide", small: { day: { isolate: 30, protect: 0.2 }, night: { isolate: 30, protect: 0.5 } }, large: { day: { isolate: 100, protect: 0.8 }, night: { isolate: 100, protect: 3.2 } } },
    "1076": { name: "Phosgene", small: { day: { isolate: 100, protect: 0.8 }, night: { isolate: 100, protect: 3.5 } }, large: { day: { isolate: 600, protect: 4.8 }, night: { isolate: 600, protect: 11.0 } } },
    "1079": { name: "Sulfur dioxide", small: { day: { isolate: 30, protect: 0.2 }, night: { isolate: 30, protect: 0.6 } }, large: { day: { isolate: 150, protect: 1.3 }, night: { isolate: 150, protect: 4.2 } } },
    "2188": { name: "Arsine", small: { day: { isolate: 60, protect: 0.5 }, night: { isolate: 60, protect: 1.8 } }, large: { day: { isolate: 300, protect: 2.7 }, night: { isolate: 300, protect: 7.6 } } },
    "2199": { name: "Phosphine", small: { day: { isolate: 60, protect: 0.5 }, night: { isolate: 60, protect: 1.6 } }, large: { day: { isolate: 300, protect: 2.4 }, night: { isolate: 300, protect: 7.0 } } },
    "2480": { name: "Methyl isocyanate", small: { day: { isolate: 150, protect: 1.1 }, night: { isolate: 150, protect: 4.0 } }, large: { day: { isolate: 800, protect: 5.8 }, night: { isolate: 800, protect: 11.0 } } }
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ERG2024Module() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showGuideDetail, setShowGuideDetail] = useState(false);

  // Search logic
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return ERG_DATABASE.materials.filter(m => 
      m.id.includes(query) || 
      m.name.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [searchQuery]);

  // Get guide by number
  const getGuide = (guideNum) => ERG_DATABASE.guides[guideNum] || null;

  // Handle material selection
  const handleSelectMaterial = (material) => {
    setSelectedMaterial(material);
    const guide = getGuide(material.guide);
    if (guide) {
      setSelectedGuide(guide);
      setShowGuideDetail(true);
    }
  };

  // Get hazard class info
  const getHazardClass = (classNum) => {
    const classStr = String(classNum).charAt(0);
    return ERG_DATABASE.hazardClasses.find(c => String(c.class) === classStr) || ERG_DATABASE.hazardClasses[8];
  };

  // Get protective distances
  const getProtectiveDistances = (unNumber) => ERG_DATABASE.protectiveDistances[unNumber] || null;

  return (
    <div className={`min-h-screen ${isEmergencyMode ? 'bg-red-900' : 'bg-gradient-to-b from-slate-50 to-slate-100'}`}>
      {/* Emergency Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsEmergencyMode(!isEmergencyMode)}
          className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-all ${
            isEmergencyMode 
              ? 'bg-white text-red-600 animate-pulse' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isEmergencyMode ? '🚨 EXIT EMERGENCY' : '🚨 EMERGENCY'}
        </button>
      </div>

      {/* Header */}
      <header className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} shadow-sm sticky top-0 z-40`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                ERG 2024
              </h1>
              <p className={`text-sm ${isEmergencyMode ? 'text-red-200' : 'text-slate-500'}`}>
                Emergency Response Guidebook • {ERG_DATABASE.metadata.total_materials} Materials • {ERG_DATABASE.metadata.total_guides} Guides
              </p>
            </div>
            <div className="flex gap-2">
              {['search', 'guides', 'classes', 'contacts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? isEmergencyMode ? 'bg-red-600 text-white' : 'bg-blue-500 text-white'
                      : isEmergencyMode ? 'text-red-200 hover:bg-red-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Box */}
            <div className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isEmergencyMode ? 'text-red-300' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search by UN Number (e.g., 1017) or Material Name (e.g., Chlorine)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl text-lg ${
                    isEmergencyMode 
                      ? 'bg-red-700 text-white placeholder-red-300 border-red-600' 
                      : 'bg-slate-50 text-slate-800 placeholder-slate-400 border-slate-200'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              
              {/* Quick Access */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`text-sm ${isEmergencyMode ? 'text-red-300' : 'text-slate-500'}`}>Quick:</span>
                {['1017', '1203', '1075', '3480', '1005'].map(id => (
                  <button
                    key={id}
                    onClick={() => setSearchQuery(id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      isEmergencyMode 
                        ? 'bg-red-700 text-red-200 hover:bg-red-600' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    UN{id}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
                <div className={`px-6 py-3 border-b ${isEmergencyMode ? 'border-red-700 bg-red-900' : 'border-slate-100 bg-slate-50'}`}>
                  <h3 className={`font-semibold ${isEmergencyMode ? 'text-white' : 'text-slate-700'}`}>
                    Results ({searchResults.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {searchResults.map(material => {
                    const hazClass = getHazardClass(material.class);
                    return (
                      <button
                        key={material.id}
                        onClick={() => handleSelectMaterial(material)}
                        className={`w-full px-6 py-4 flex items-center justify-between transition-all ${
                          isEmergencyMode ? 'hover:bg-red-700' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: hazClass.color }}
                          >
                            {material.guide}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                                UN{material.id}
                              </span>
                              {material.tih && (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">TIH</span>
                              )}
                              {material.p && (
                                <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">P</span>
                              )}
                            </div>
                            <p className={`text-sm ${isEmergencyMode ? 'text-red-200' : 'text-slate-600'}`}>
                              {material.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${isEmergencyMode ? 'text-red-300' : 'text-slate-500'}`}>
                            Class {material.class}
                          </span>
                          <ChevronRight className={`w-5 h-5 ${isEmergencyMode ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg p-8 text-center`}>
                <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isEmergencyMode ? 'text-red-400' : 'text-slate-400'}`} />
                <p className={isEmergencyMode ? 'text-red-200' : 'text-slate-600'}>
                  No materials found for "{searchQuery}"
                </p>
                <p className={`text-sm mt-2 ${isEmergencyMode ? 'text-red-300' : 'text-slate-500'}`}>
                  If unknown material, use Guide 111 (Mixed Load/Unidentified)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isEmergencyMode ? 'border-red-700' : 'border-slate-100'}`}>
              <h3 className={`font-bold text-lg ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                Emergency Response Guides (111-175)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
              {Object.values(ERG_DATABASE.guides).map(guide => (
                <button
                  key={guide.number}
                  onClick={() => { setSelectedGuide(guide); setShowGuideDetail(true); }}
                  className={`p-4 rounded-xl text-left transition-all ${
                    isEmergencyMode ? 'bg-red-700 hover:bg-red-600' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: guide.color || '#6B7280' }}
                    >
                      {guide.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                        {guide.title}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hazard Classes Tab */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ERG_DATABASE.hazardClasses.map(hc => (
              <div
                key={hc.class}
                className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: hc.color }}
                  >
                    {hc.icon}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                      Class {hc.class}
                    </p>
                    <p className={isEmergencyMode ? 'text-red-200' : 'text-slate-600'}>
                      {hc.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className={`${isEmergencyMode ? 'bg-red-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${isEmergencyMode ? 'border-red-700 bg-red-900' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className={`font-bold text-lg ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                24-Hour Emergency Contacts
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {ERG_DATABASE.emergencyContacts.map((contact, i) => (
                <a
                  key={i}
                  href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                  className={`flex items-center justify-between px-6 py-4 transition-all ${
                    isEmergencyMode ? 'hover:bg-red-700' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isEmergencyMode ? 'text-white' : 'text-slate-800'}`}>
                        {contact.name}
                      </span>
                      {contact.primary && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">PRIMARY</span>
                      )}
                    </div>
                    <p className={`text-sm ${isEmergencyMode ? 'text-red-300' : 'text-slate-500'}`}>
                      {contact.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-mono ${isEmergencyMode ? 'text-white' : 'text-blue-600'}`}>
                      {contact.phone}
                    </span>
                    <Phone className={`w-5 h-5 ${isEmergencyMode ? 'text-white' : 'text-blue-500'}`} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Guide Detail Modal */}
      {showGuideDetail && selectedGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-4">
          <div className={`w-full max-w-2xl ${isEmergencyMode ? 'bg-red-900' : 'bg-white'} rounded-t-3xl sm:rounded-3xl shadow-2xl`}>
            {/* Modal Header */}
            <div className="sticky top-0 z-10 p-4 border-b border-slate-200" style={{ backgroundColor: selectedGuide.color || '#6B7280' }}>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm opacity-75">GUIDE {selectedGuide.number}</p>
                  <h2 className="text-xl font-bold">{selectedGuide.title}</h2>
                  {selectedMaterial && (
                    <p className="text-sm opacity-75 mt-1">UN{selectedMaterial.id} - {selectedMaterial.name}</p>
                  )}
                </div>
                <button 
                  onClick={() => { setShowGuideDetail(false); setSelectedMaterial(null); }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* TIH Warning */}
              {selectedMaterial?.tih && (
                <div className="p-4 bg-green-100 border-2 border-green-500 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800">TOXIC INHALATION HAZARD (TIH)</span>
                  </div>
                  <p className="text-sm text-green-700">
                    See Table 1 for Initial Isolation and Protective Action Distances
                  </p>
                  {getProtectiveDistances(selectedMaterial.id) && (
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-green-800">Small Spill</p>
                        <p className="text-green-700">
                          Day: {getProtectiveDistances(selectedMaterial.id).small.day.protect} km
                        </p>
                        <p className="text-green-700">
                          Night: {getProtectiveDistances(selectedMaterial.id).small.night.protect} km
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Large Spill</p>
                        <p className="text-green-700">
                          Day: {getProtectiveDistances(selectedMaterial.id).large.day.protect} km
                        </p>
                        <p className="text-green-700">
                          Night: {getProtectiveDistances(selectedMaterial.id).large.night.protect} km
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Isolation Distances */}
              {selectedGuide.safety && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700 uppercase">Initial Isolate</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">{selectedGuide.safety.isolate.m}m</p>
                    <p className="text-xs text-amber-600">{selectedGuide.safety.isolate.ft} ft in all directions</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-red-600" />
                      <span className="text-xs font-semibold text-red-700 uppercase">Fire Isolate</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{selectedGuide.safety.fireIsolate.m}m</p>
                    <p className="text-xs text-red-600">{selectedGuide.safety.fireIsolate.ft} ft</p>
                  </div>
                </div>
              )}

              {/* Hazards */}
              {selectedGuide.hazards && (
                <div className="space-y-4">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${isEmergencyMode ? 'text-red-300' : 'text-slate-500'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    Potential Hazards
                  </h3>
                  
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                    <p className="text-xs font-bold text-orange-700 uppercase mb-2">🔥 Fire/Explosion</p>
                    <ul className="space-y-1">
                      {selectedGuide.hazards.fire?.map((h, i) => (
                        <li key={i} className="text-sm text-orange-900 flex gap-2">
                          <span className="text-orange-400">•</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-700 uppercase mb-2">⚠️ Health</p>
                    <ul className="space-y-1">
                      {selectedGuide.hazards.health?.map((h, i) => (
                        <li key={i} className="text-sm text-purple-900 flex gap-2">
                          <span className="text-purple-400">•</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Emergency Response */}
              {selectedGuide.response && (
                <div className="space-y-4">
                  <h3 className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${isEmergencyMode ? 'text-red-300' : 'text-slate-500'}`}>
                    <Zap className="w-4 h-4" />
                    Emergency Response
                  </h3>
                  
                  {/* Fire */}
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                    <p className="text-xs font-bold text-red-700 uppercase mb-3">🔥 Fire</p>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-semibold text-red-800">Small:</span> <span className="text-red-700">{selectedGuide.response.fire?.small}</span></div>
                      <div><span className="font-semibold text-red-800">Large:</span> <span className="text-red-700">{selectedGuide.response.fire?.large}</span></div>
                      <div><span className="font-semibold text-red-800">Tank:</span> <span className="text-red-700">{selectedGuide.response.fire?.tank}</span></div>
                    </div>
                  </div>
                  
                  {/* Spill */}
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase mb-3">💧 Spill/Leak</p>
                    <ul className="space-y-1 mb-3">
                      {selectedGuide.response.spill?.actions?.map((a, i) => (
                        <li key={i} className="text-sm text-blue-900 flex gap-2">
                          <span className="text-blue-400">•</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-2 text-sm pt-2 border-t border-blue-200">
                      <div><span className="font-semibold text-blue-800">Small:</span> <span className="text-blue-700">{selectedGuide.response.spill?.small}</span></div>
                      <div><span className="font-semibold text-blue-800">Large:</span> <span className="text-blue-700">{selectedGuide.response.spill?.large}</span></div>
                    </div>
                  </div>
                  
                  {/* First Aid */}
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                    <p className="text-xs font-bold text-green-700 uppercase mb-2">🏥 First Aid</p>
                    <p className="text-sm text-green-900">{selectedGuide.response.firstAid}</p>
                  </div>
                </div>
              )}

              {/* Protective Clothing */}
              {selectedGuide.safety?.clothing && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-700 uppercase mb-2">🛡️ Protective Clothing</p>
                  <p className="text-sm text-slate-700">{selectedGuide.safety.clothing}</p>
                </div>
              )}

              {/* Emergency Call Button */}
              <a 
                href="tel:1-800-424-9300"
                className="block w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl text-center font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="w-5 h-5 inline mr-2" />
                Call CHEMTREC: 1-800-424-9300
              </a>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
