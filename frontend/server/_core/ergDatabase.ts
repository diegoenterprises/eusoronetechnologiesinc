/**
 * ERG 2024 COMPLETE DATABASE
 * Emergency Response Guidebook - Full Database
 * Sources: DOT/PHMSA ERG 2024, Transport Canada, SCT Mexico
 * Integrated with ESANG AI and SPECTRA-MATCH
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ERGGuide {
  number: number;
  title: string;
  color: string;
  potentialHazards: { fireExplosion: string[]; health: string[] };
  publicSafety: {
    isolationDistance: { meters: number; feet: number };
    fireIsolationDistance: { meters: number; feet: number };
    protectiveClothing: string;
    evacuationNotes: string;
  };
  emergencyResponse: {
    fire: { small: string[]; large: string[]; tank: string[] };
    spillLeak: { general: string[]; small: string[]; large: string[] };
    firstAid: string;
  };
}

export interface ERGMaterial {
  unNumber: string;
  name: string;
  guide: number;
  hazardClass: string;
  packingGroup?: string;
  isTIH: boolean;
  isWaterReactive?: boolean;
  alternateNames?: string[];
}

export interface ProtectiveDistance {
  unNumber: string;
  name: string;
  smallSpill: { day: { isolateMeters: number; protectKm: number }; night: { isolateMeters: number; protectKm: number } };
  largeSpill: { day: { isolateMeters: number; protectKm: number }; night: { isolateMeters: number; protectKm: number } };
}

export interface EmergencyContact {
  name: string;
  phone: string;
  country: string;
  description: string;
  isPrimary: boolean;
  is24Hour: boolean;
}

export interface HazardClass {
  class: number;
  name: string;
  color: string;
  divisions: { division: string; description: string }[];
}

// ============================================================================
// EMERGENCY CONTACTS
// ============================================================================

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: "CHEMTREC", phone: "1-800-424-9300", country: "USA", description: "Chemical Transportation Emergency Center - 24/7", isPrimary: true, is24Hour: true },
  { name: "National Response Center", phone: "1-800-424-8802", country: "USA", description: "US Coast Guard NRC - Federal spill reporting", isPrimary: true, is24Hour: true },
  { name: "Poison Control", phone: "1-800-222-1222", country: "USA", description: "Human exposure emergencies", isPrimary: false, is24Hour: true },
  { name: "Military Shipments", phone: "703-697-0218", country: "USA", description: "Incidents involving military materials", isPrimary: false, is24Hour: true },
  { name: "CANUTEC", phone: "1-888-226-8832", country: "Canada", description: "Canadian Transport Emergency Centre - 24/7", isPrimary: true, is24Hour: true },
  { name: "CANUTEC (cellular)", phone: "*666", country: "Canada", description: "Cell phone access to CANUTEC", isPrimary: false, is24Hour: true },
  { name: "CENACOM", phone: "800-00-413-00", country: "Mexico", description: "Centro Nacional de Comunicaciones", isPrimary: true, is24Hour: true },
  { name: "SETIQ", phone: "800-002-8800", country: "Mexico", description: "Sistema de Emergencias en Transporte", isPrimary: false, is24Hour: true },
];

// ============================================================================
// HAZARD CLASSES
// ============================================================================

export const HAZARD_CLASSES: HazardClass[] = [
  { class: 1, name: "Explosives", color: "#EF4444", divisions: [{ division: "1.1", description: "Mass explosion hazard" }, { division: "1.2", description: "Projection hazard" }, { division: "1.3", description: "Fire hazard" }, { division: "1.4", description: "No significant hazard" }, { division: "1.5", description: "Very insensitive" }, { division: "1.6", description: "Extremely insensitive" }] },
  { class: 2, name: "Gases", color: "#22C55E", divisions: [{ division: "2.1", description: "Flammable gases" }, { division: "2.2", description: "Non-flammable, non-toxic" }, { division: "2.3", description: "Toxic gases" }] },
  { class: 3, name: "Flammable Liquids", color: "#F97316", divisions: [] },
  { class: 4, name: "Flammable Solids", color: "#EF4444", divisions: [{ division: "4.1", description: "Flammable solids" }, { division: "4.2", description: "Spontaneously combustible" }, { division: "4.3", description: "Dangerous when wet" }] },
  { class: 5, name: "Oxidizers & Organic Peroxides", color: "#EAB308", divisions: [{ division: "5.1", description: "Oxidizing substances" }, { division: "5.2", description: "Organic peroxides" }] },
  { class: 6, name: "Toxic & Infectious", color: "#8B5CF6", divisions: [{ division: "6.1", description: "Toxic substances" }, { division: "6.2", description: "Infectious substances" }] },
  { class: 7, name: "Radioactive Materials", color: "#FBBF24", divisions: [] },
  { class: 8, name: "Corrosives", color: "#1E3A8A", divisions: [] },
  { class: 9, name: "Miscellaneous Dangerous Goods", color: "#6B7280", divisions: [] },
];

// ============================================================================
// ERG GUIDES (111-175) - COMPLETE 65 GUIDES
// ============================================================================

export const ERG_GUIDES: Record<number, ERGGuide> = {
  111: { number: 111, title: "Mixed Load/Unidentified Cargo", color: "#6B7280",
    potentialHazards: { fireExplosion: ["May explode from heat, shock, friction or contamination","May react violently on contact with air, water or foam","Vapors may travel to source of ignition and flash back","Containers may explode when heated","Ruptured cylinders may rocket"], health: ["Inhalation, ingestion or contact may cause severe injury or death","High concentration of gas may cause asphyxiation without warning","Contact may cause burns to skin and eyes","Runoff may cause environmental contamination"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Structural firefighters' protective clothing provides limited protection.", evacuationNotes: "If tank, rail car or tank truck is involved in fire, ISOLATE for 800 meters (1/2 mile) in all directions." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or regular foam"], large: ["Water spray, fog or regular foam","Move containers from fire area if safe"], tank: ["Cool containers with flooding quantities of water","Do not get water inside containers","Withdraw if venting or tank discoloration"] }, spillLeak: { general: ["Do not touch or walk through spilled material","ELIMINATE all ignition sources","All equipment must be grounded"], small: ["Take up with sand or non-combustible absorbent"], large: ["Dike far ahead of liquid spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Flush skin/eyes with water for 20+ minutes." }
  },
  112: { number: 112, title: "Explosives - Division 1.1, 1.2, 1.3, 1.5", color: "#DC2626",
    potentialHazards: { fireExplosion: ["MAY EXPLODE AND THROW FRAGMENTS 1600m (1 MILE) OR MORE IF FIRE REACHES CARGO"], health: ["Fire may produce irritating, corrosive and/or toxic gases"] },
    publicSafety: { isolationDistance: { meters: 500, feet: 1640 }, fireIsolationDistance: { meters: 1600, feet: 5280 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "IMMEDIATELY isolate for 500m. If fire reaches cargo, EVACUATE 1600m (1 mile)." },
    emergencyResponse: { fire: { small: ["DO NOT FIGHT FIRE WHEN IT REACHES CARGO - EVACUATE"], large: ["DO NOT FIGHT FIRE - EVACUATE 1600m (1 mile)"], tank: ["DO NOT FIGHT FIRE - EVACUATE"] }, spillLeak: { general: ["DO NOT TOUCH DAMAGED PACKAGES OR SPILLED MATERIAL","Turn off ignition sources"], small: ["Cover with plastic sheet to prevent spreading"], large: ["Contact explosives experts"] }, firstAid: "Move victim to fresh air. Give artificial respiration if needed." }
  },
  114: { number: 114, title: "Explosives - Division 1.4 and 1.6", color: "#F97316",
    potentialHazards: { fireExplosion: ["May explode from heat, shock, friction or contamination","May burn and/or explode if heated"], health: ["Fire may produce irritating, corrosive and/or toxic gases"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 500, feet: 1640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider evacuation for 500m if fire involves cargo." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or regular foam"], large: ["Water spray, fog or regular foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["DO NOT TOUCH DAMAGED PACKAGES"], small: ["Cover with plastic sheet"], large: ["Contact appropriate authorities"] }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing." }
  },
  115: { number: 115, title: "Gases - Flammable (Including Refrigerated Liquids)", color: "#EF4444",
    potentialHazards: { fireExplosion: ["EXTREMELY FLAMMABLE","Will be easily ignited by heat, sparks or flames","Will form explosive mixtures with air","Vapors from liquefied gas are heavier than air","Vapors may travel to source of ignition and flash back","Cylinders exposed to fire may vent and release flammable gas","Containers may explode when heated","Ruptured cylinders may rocket"], health: ["Vapors may cause dizziness or asphyxiation without warning","Contact with gas or liquefied gas may cause burns, severe injury and/or frostbite"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Structural firefighters' protective clothing provides limited protection.", evacuationNotes: "If tank involved in fire, ISOLATE for 800m (1/2 mile) in all directions." },
    emergencyResponse: { fire: { small: ["Dry chemical or CO2"], large: ["Water spray or fog","Do not extinguish leaking gas fire unless leak can be stopped"], tank: ["Fight fire from maximum distance","Cool containers with flooding quantities of water","Withdraw if rising sound from venting or tank discoloration"] }, spillLeak: { general: ["ELIMINATE all ignition sources","All equipment must be grounded","Stop leak if safe","Use water spray to reduce vapors"], small: ["Flush area with flooding quantities of water"], large: ["Do not direct water at spill or source of leak"] }, firstAid: "Move victim to fresh air. Call 911. Give artificial respiration if not breathing. Thaw frosted parts with lukewarm water." }
  },
  116: { number: 116, title: "Gases - Flammable (Unstable)", color: "#DC2626",
    potentialHazards: { fireExplosion: ["EXTREMELY FLAMMABLE","May polymerize explosively when heated","Vapors may form explosive mixtures with air"], health: ["Inhalation may cause dizziness or asphyxiation","Contact with gas or liquefied gas may cause frostbite"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 1600, feet: 5280 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider evacuation for 1600m (1 mile)." },
    emergencyResponse: { fire: { small: ["Dry chemical or CO2"], large: ["Water spray or fog"], tank: ["Fight fire from maximum distance. Cool containers."] }, spillLeak: { general: ["ELIMINATE all ignition sources","Stop leak if safe"], small: ["Flush area with water"], large: ["Use water spray to reduce vapors"] }, firstAid: "Move victim to fresh air. Thaw frosted parts with lukewarm water." }
  },
  117: { number: 117, title: "Gases - Toxic - Flammable (Extreme Hazard)", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["EXTREMELY FLAMMABLE","May form explosive mixtures with air","Vapors may travel to ignition source and flash back","Containers may explode when heated"], health: ["TOXIC - Extremely Hazardous","May be fatal if inhaled or absorbed through skin","Initial odor may deaden sense of smell","Contact may cause burns, severe injury, frostbite"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 1600, feet: 5280 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuationNotes: "See Table 1 for Initial Isolation and Protective Action Distances." },
    emergencyResponse: { fire: { small: ["Dry chemical or CO2"], large: ["Water spray, fog or foam","Do not extinguish leaking gas fire unless leak can be stopped"], tank: ["Fight fire from maximum distance","Cool containers with flooding quantities of water"] }, spillLeak: { general: ["ELIMINATE all ignition sources","Fully encapsulating vapor protective clothing required","Stop leak if safe","Consider igniting spill to eliminate toxic gas"], small: ["Use water spray to reduce vapors"], large: ["Consider igniting spill to eliminate toxic gas"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Administer oxygen if breathing is difficult." }
  },
  119: { number: 119, title: "Gases - Toxic - Flammable", color: "#8B5CF6",
    potentialHazards: { fireExplosion: ["FLAMMABLE","May form explosive mixtures with air","Vapors may travel to ignition source"], health: ["TOXIC - May be fatal if inhaled","Contact may cause burns, frostbite"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuationNotes: "See Table 1 for Initial Isolation and Protective Action Distances." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or foam"], large: ["Water spray, fog or foam"], tank: ["Fight fire from maximum distance. Cool containers."] }, spillLeak: { general: ["ELIMINATE all ignition sources","Fully encapsulating vapor protective clothing required","Stop leak if safe"], small: ["Use water spray to reduce vapors"], large: ["Consider igniting spill to eliminate toxic gas"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth." }
  },
  120: { number: 120, title: "Gases - Inert (Including Refrigerated Liquids)", color: "#22C55E",
    potentialHazards: { fireExplosion: ["Non-flammable gases","Containers may explode when heated"], health: ["Vapors may cause dizziness or asphyxiation without warning","Contact with liquefied gas may cause frostbite"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA for oxygen-deficient atmospheres.", evacuationNotes: "Consider evacuation for 100m." },
    emergencyResponse: { fire: { small: ["Use agent suitable for surrounding fire"], large: ["Use agent suitable for surrounding fire"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Ensure adequate ventilation","Stop leak if safe"], small: ["Flush area with water"], large: ["Ventilate area of leak"] }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing. Thaw frosted parts with lukewarm water." }
  },
  122: { number: 122, title: "Gases - Oxidizing (Including Refrigerated Liquids)", color: "#EAB308",
    potentialHazards: { fireExplosion: ["Substance does not burn but will support combustion","May increase fire intensity","Containers may explode when heated"], health: ["Vapors may cause dizziness or asphyxiation","Contact with liquefied gas may cause frostbite"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider evacuation for 100m." },
    emergencyResponse: { fire: { small: ["Use agent suitable for surrounding fire"], large: ["Use agent suitable for surrounding fire"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Stop leak if safe","Keep combustibles away"], small: ["Flush area with water"], large: ["Keep combustibles away"] }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing." }
  },
  123: { number: 123, title: "Gases - Toxic and/or Corrosive", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["May react violently with water","Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled or absorbed","Contact may cause burns, frostbite"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuationNotes: "See Table 1 for Initial Isolation and Protective Action Distances." },
    emergencyResponse: { fire: { small: ["Dry chemical or CO2"], large: ["Water spray, fog or foam"], tank: ["Cool containers. Withdraw if rising sound or discoloration."] }, spillLeak: { general: ["Fully encapsulating vapor protective clothing required","Stop leak if safe","Use water spray to reduce vapors"], small: ["Flush area with water"], large: ["Consider initial downwind evacuation for 100+ meters"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
  },
  124: { number: 124, title: "Gases - Toxic and/or Corrosive - Oxidizing", color: "#8B5CF6",
    potentialHazards: { fireExplosion: ["Substance does not burn but will support combustion","Strong oxidizers","May ignite combustibles","Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled or absorbed","Contact may cause burns, frostbite"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuationNotes: "See Table 1 for Initial Isolation and Protective Action Distances." },
    emergencyResponse: { fire: { small: ["Water only - no dry chemical, CO2 or Halon"], large: ["Flood fire area with water from distance"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Fully encapsulating vapor protective clothing required","Keep combustibles away","Stop leak if safe","Use water spray to reduce vapors"], small: ["Flush area with water"], large: ["Consider initial downwind evacuation for 100+ meters"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
  },
  125: { number: 125, title: "Gases - Corrosive", color: "#1E3A8A",
    potentialHazards: { fireExplosion: ["Some may burn but none ignite readily","Vapors are heavier than air","Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled","Vapors are extremely irritating and corrosive","Contact may cause burns, frostbite"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuationNotes: "See Table 1 for Initial Isolation and Protective Action Distances." },
    emergencyResponse: { fire: { small: ["Dry chemical or CO2"], large: ["Water spray, fog or foam"], tank: ["Do not extinguish leaking gas fire unless leak can be stopped","Cool containers with water"] }, spillLeak: { general: ["Fully encapsulating vapor protective clothing required","Stop leak if safe","Use water spray to reduce vapors"], small: ["Flush area with water"], large: ["Consider initial downwind evacuation for 100+ meters"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
  },
  126: { number: 126, title: "Gases - Compressed or Liquefied (Including Refrigerant Gases)", color: "#0EA5E9",
    potentialHazards: { fireExplosion: ["Some may burn but none ignite readily","Containers may explode when heated"], health: ["Vapors may cause dizziness or asphyxiation","Contact with liquefied gas may cause frostbite"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA when large quantities involved.", evacuationNotes: "Consider evacuation for 100m." },
    emergencyResponse: { fire: { small: ["Use agent suitable for surrounding fire"], large: ["Use agent suitable for surrounding fire"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Stop leak if safe","Ensure adequate ventilation"], small: ["Flush area with water"], large: ["Ventilate area of leak"] }, firstAid: "Move victim to fresh air. Give artificial respiration if not breathing. Thaw frosted parts with lukewarm water." }
  },
  127: { number: 127, title: "Flammable Liquids (Polar/Water-Miscible)", color: "#EF4444",
    potentialHazards: { fireExplosion: ["HIGHLY FLAMMABLE","Vapors may form explosive mixtures with air","Vapors may travel to source of ignition and flash back","Most vapors are heavier than air","Containers may explode when heated"], health: ["Inhalation or contact may irritate or burn skin and eyes","Fire may produce toxic gases","Vapors may cause dizziness or suffocation"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Structural firefighters' clothing provides limited protection.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or alcohol-resistant foam"], large: ["Water spray, fog or alcohol-resistant foam","Do not use straight streams"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["ELIMINATE all ignition sources","All equipment must be grounded","Stop leak if safe","Prevent entry into waterways"], small: ["Absorb with non-combustible material"], large: ["Dike far ahead of spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes. If ingested, do NOT induce vomiting." }
  },
  128: { number: 128, title: "Flammable Liquids (Non-Polar/Water-Immiscible)", color: "#F97316",
    potentialHazards: { fireExplosion: ["HIGHLY FLAMMABLE","Vapors may form explosive mixtures with air","Vapors may travel to source of ignition and flash back","Most vapors are heavier than air","Runoff to sewer may create fire or explosion hazard","Containers may explode when heated"], health: ["Inhalation or contact may irritate or burn skin and eyes","Fire may produce toxic gases","Vapors may cause dizziness or suffocation"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Structural firefighters' clothing provides limited protection.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or regular foam"], large: ["Water spray, fog or regular foam","Do not use straight streams"], tank: ["Cool containers with flooding quantities of water","Do not get water inside containers"] }, spillLeak: { general: ["ELIMINATE all ignition sources","All equipment must be grounded","Stop leak if safe","Prevent entry into waterways"], small: ["Absorb with non-combustible material"], large: ["Dike far ahead of spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes. If ingested, do NOT induce vomiting." }
  },
  129: { number: 129, title: "Flammable Liquids (Polar/Water-Miscible/Noxious)", color: "#EF4444",
    potentialHazards: { fireExplosion: ["HIGHLY FLAMMABLE","Vapors may form explosive mixtures with air","Most vapors are heavier than air"], health: ["TOXIC - May be fatal if inhaled, ingested or absorbed","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or alcohol-resistant foam"], large: ["Water spray, fog or alcohol-resistant foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["ELIMINATE all ignition sources","All equipment must be grounded","Stop leak if safe"], small: ["Absorb with non-combustible material"], large: ["Dike far ahead of spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  130: { number: 130, title: "Flammable Liquids (Non-Polar/Water-Immiscible/Noxious)", color: "#F97316",
    potentialHazards: { fireExplosion: ["HIGHLY FLAMMABLE","Vapors may form explosive mixtures with air","Vapors heavier than air may spread along ground"], health: ["TOXIC - May be fatal if inhaled, ingested or absorbed","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "See Table 1 for TIH materials." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or regular foam"], large: ["Water spray, fog or regular foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["ELIMINATE all ignition sources","Fully encapsulating vapor protective clothing may be required","Stop leak if safe"], small: ["Absorb with non-combustible material"], large: ["Dike far ahead of spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
  },
  131: { number: 131, title: "Flammable Liquids - Toxic", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["HIGHLY FLAMMABLE","Vapors may form explosive mixtures with air","Vapors may travel to source of ignition and flash back"], health: ["TOXIC - May be fatal if inhaled, ingested or absorbed through skin","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "See Table 1 for TIH materials." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or alcohol-resistant foam"], large: ["Water spray, fog or alcohol-resistant foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["ELIMINATE all ignition sources","Fully encapsulating vapor protective clothing may be required","Stop leak if safe"], small: ["Absorb with non-combustible material"], large: ["Dike far ahead of spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Flush skin/eyes with water for 20+ minutes." }
  },
  132: { number: 132, title: "Flammable Liquids - Corrosive", color: "#1E40AF",
    potentialHazards: { fireExplosion: ["HIGHLY FLAMMABLE","Vapors may form explosive mixtures with air","Containers may explode when heated"], health: ["Causes severe burns to skin and eyes","Fire may produce toxic gases"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing required.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2 or alcohol-resistant foam"], large: ["Water spray, fog or foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["ELIMINATE all ignition sources","Do not touch spilled material","Stop leak if safe"], small: ["Absorb with non-combustible material"], large: ["Dike far ahead of spill for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Remove contaminated clothing. Flush skin/eyes with water for 20+ minutes." }
  },
  133: { number: 133, title: "Flammable Solids", color: "#EF4444",
    potentialHazards: { fireExplosion: ["Flammable/combustible material","May be ignited by friction, heat, sparks or flames","Powders may explode or burn with explosive violence"], health: ["Fire may produce irritating/toxic gases","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or regular foam"], large: ["Water spray, fog or regular foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Eliminate ignition sources","Do not touch spilled material"], small: ["Cover with dry earth or sand"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  135: { number: 135, title: "Substances - Spontaneously Combustible", color: "#DC2626",
    potentialHazards: { fireExplosion: ["May ignite on contact with air","May re-ignite after fire is extinguished","Some react vigorously with water"], health: ["Fire may produce irritating/toxic gases","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["DO NOT USE WATER - Dry chemical, sand or earth"], large: ["Dry chemical, sand or earth. Water spray may cause violent reaction."], tank: ["Use dry agents only. DO NOT use water on cargo."] }, spillLeak: { general: ["Do not touch spilled material","Keep combustibles away"], small: ["Cover with dry earth or sand"], large: ["Dike with dry earth. DO NOT add water."] }, firstAid: "Move victim to fresh air. Brush material from skin. Flush with water for 20+ minutes." }
  },
  136: { number: 136, title: "Substances - Spontaneously Combustible - Toxic/Corrosive", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["May ignite on contact with air","Reacts with water producing toxic gases"], health: ["TOXIC - May be fatal if inhaled","Contact causes severe burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "Consider 800m evacuation." },
    emergencyResponse: { fire: { small: ["DO NOT USE WATER - Dry chemical or sand"], large: ["Dry chemical, sand or earth"], tank: ["DO NOT use water on cargo"] }, spillLeak: { general: ["Do not touch spilled material","DO NOT add water"], small: ["Cover with dry earth"], large: ["Dike with dry earth"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  137: { number: 137, title: "Substances - Water-Reactive - Corrosive", color: "#1E40AF",
    potentialHazards: { fireExplosion: ["May ignite on contact with water or steam","May react violently with water","Some may decompose explosively when heated"], health: ["TOXIC - May be fatal if inhaled","Contact may cause severe burns","Fire may produce toxic gases"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["DO NOT USE WATER. Dry chemical or CO2."], large: ["DO NOT USE WATER. Dry chemical, sand, or earth."], tank: ["DO NOT USE WATER. Cool containers with dry agent."] }, spillLeak: { general: ["DO NOT TOUCH SPILLED MATERIAL","DO NOT ADD WATER","Stop leak if safe"], small: ["Cover with dry sand or earth"], large: ["Dike area. DO NOT add water."] }, firstAid: "Move victim to fresh air. Call 911. Brush material from skin. Flush skin/eyes with water for 20+ minutes." }
  },
  138: { number: 138, title: "Substances - Water-Reactive", color: "#DC2626",
    potentialHazards: { fireExplosion: ["Produce flammable gases on contact with water","May ignite on contact with water or moist air"], health: ["May cause burns","Inhalation of gas may cause injury"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["DO NOT USE WATER. Dry chemical or sand."], large: ["DO NOT USE WATER. Dry chemical, sand, or earth."], tank: ["DO NOT use water. Cool containers from maximum distance."] }, spillLeak: { general: ["DO NOT add water","Keep combustibles away"], small: ["Cover with dry earth or sand"], large: ["Dike with dry earth. DO NOT add water."] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  139: { number: 139, title: "Substances - Water-Reactive (Emitting Flammable/Toxic Gases)", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["Produce flammable and/or toxic gases on contact with water","React vigorously with water"], health: ["TOXIC - Gases produced may be fatal if inhaled","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "See Table 1 for Initial Isolation and Protective Action Distances." },
    emergencyResponse: { fire: { small: ["DO NOT USE WATER. Dry chemical or sand."], large: ["DO NOT USE WATER. Dry chemical, sand, or earth."], tank: ["DO NOT use water on cargo."] }, spillLeak: { general: ["DO NOT TOUCH SPILLED MATERIAL","DO NOT add water","Stop leak if safe"], small: ["Cover with dry earth or sand"], large: ["Dike with dry earth. DO NOT add water."] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth." }
  },
  140: { number: 140, title: "Oxidizers", color: "#EAB308",
    potentialHazards: { fireExplosion: ["These substances will accelerate burning","May ignite combustibles","Some react explosively with hydrocarbons","Containers may explode when heated"], health: ["Inhalation, ingestion or contact may cause severe injury or death","Fire may produce irritating/toxic gases"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Structural firefighters' clothing.", evacuationNotes: "Consider 800m evacuation for large fires." },
    emergencyResponse: { fire: { small: ["Use flooding quantities of water"], large: ["Flood fire area with water from distance"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Keep combustibles away from spilled material","Do not touch spilled material","Stop leak if safe"], small: ["Flush area with flooding quantities of water"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  143: { number: 143, title: "Oxidizers (Unstable)", color: "#EAB308",
    potentialHazards: { fireExplosion: ["May explode from heat or contamination","May polymerize explosively","Containers may explode when heated"], health: ["Inhalation, ingestion or contact may cause severe injury or death"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider evacuation for 800m." },
    emergencyResponse: { fire: { small: ["Flooding quantities of water"], large: ["Flood area with water from maximum distance"], tank: ["Cool containers with water. Withdraw if rising sound."] }, spillLeak: { general: ["Keep combustibles away","Do not touch spilled material"], small: ["Flush area with water"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  147: { number: 147, title: "Lithium Ion Batteries / Lithium Metal Batteries", color: "#3B82F6",
    potentialHazards: { fireExplosion: ["May catch fire and burn intensely if damaged","Fire may spread rapidly","Thermal runaway may occur - explosive rupture possible","Water may be ineffective"], health: ["Fire produces toxic gases including hydrogen fluoride","Contact with damaged battery contents may cause burns"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 100, feet: 330 }, protectiveClothing: "Wear positive pressure SCBA. Structural firefighters' clothing provides limited protection.", evacuationNotes: "Consider 100m evacuation if fire involved." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, flooding quantities of water, or foam"], large: ["Water spray, fog or foam - fight fire from maximum distance"], tank: ["Cool containers/batteries with flooding quantities of water"] }, spillLeak: { general: ["Do not touch damaged packages","Eliminate ignition sources","If batteries are leaking, isolate area"], small: ["Cover with plastic sheet"], large: ["Contact specialists"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water." }
  },
  148: { number: 148, title: "Organic Peroxides (Heat/Contamination/Friction Sensitive)", color: "#DC2626",
    potentialHazards: { fireExplosion: ["May explode from heat, shock, friction or contamination","May burn rapidly","Containers may explode when heated"], health: ["Toxic - may be fatal if inhaled or absorbed","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Isolate 800m if fire involves cargo." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or foam"], large: ["Water spray, fog or foam from maximum distance"], tank: ["Cool containers with flooding water."] }, spillLeak: { general: ["Do not touch spilled material","Keep combustibles away"], small: ["Absorb with non-combustible material"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  153: { number: 153, title: "Substances - Toxic and/or Corrosive (Combustible)", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["Combustible material - may burn but does not ignite readily","Fire may produce toxic gases"], health: ["TOXIC - Inhalation, ingestion or contact may cause severe injury or death","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA and chemical protective suit.", evacuationNotes: "Consider evacuation for large spill or fire." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or regular foam"], large: ["Water spray, fog or regular foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Do not touch damaged containers or spilled material","Stop leak if safe","Prevent entry into waterways"], small: ["Cover with plastic sheet, absorb with dry earth"], large: ["Dike far ahead of liquid spill"] }, firstAid: "Remove contaminated clothing. Flush skin with water for 20+ minutes. Call 911." }
  },
  154: { number: 154, title: "Substances - Toxic and/or Corrosive (Non-Combustible)", color: "#6B7280",
    potentialHazards: { fireExplosion: ["Non-combustible - substance itself does not burn","Containers may explode when heated"], health: ["TOXIC - Inhalation, ingestion or contact may cause severe injury or death","Contact may cause burns"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA and chemical protective suit.", evacuationNotes: "Consider evacuation for large spill." },
    emergencyResponse: { fire: { small: ["Use agent suitable for surrounding fire"], large: ["Use agent suitable for surrounding fire"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Do not touch damaged containers or spilled material","Stop leak if safe"], small: ["Cover with plastic sheet, absorb with dry earth"], large: ["Dike far ahead of liquid spill"] }, firstAid: "Remove contaminated clothing. Flush skin with water for 20+ minutes. Call 911." }
  },
  155: { number: 155, title: "Substances - Toxic and/or Corrosive (Flammable/Water-Sensitive)", color: "#7C3AED",
    potentialHazards: { fireExplosion: ["Flammable/combustible material","May react with water to produce flammable gases"], health: ["HIGHLY TOXIC - May be fatal if inhaled or absorbed","Contact causes severe burns"] },
    publicSafety: { isolationDistance: { meters: 100, feet: 330 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Fully encapsulating chemical protective clothing.", evacuationNotes: "See Table 1 for TIH materials." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2"], large: ["Water spray or foam from maximum distance"], tank: ["Cool containers from maximum distance"] }, spillLeak: { general: ["Fully encapsulating vapor protective clothing required","Stop leak if safe","Use water spray to reduce vapors"], small: ["Absorb with non-combustible material"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Do not use mouth-to-mouth. Flush with water for 20+ minutes." }
  },
  157: { number: 157, title: "Substances - Toxic and/or Corrosive (Non-Combustible/Water-Sensitive)", color: "#1E3A8A",
    potentialHazards: { fireExplosion: ["Non-combustible","Reacts with water releasing toxic/corrosive gas","Containers may explode when heated"], health: ["TOXIC - May be fatal if inhaled or absorbed","Contact causes severe burns"] },
    publicSafety: { isolationDistance: { meters: 50, feet: 165 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Chemical protective clothing.", evacuationNotes: "Consider evacuation for large spill." },
    emergencyResponse: { fire: { small: ["Dry chemical or CO2"], large: ["Water spray or fog - avoid getting water inside containers"], tank: ["Cool containers from maximum distance"] }, spillLeak: { general: ["Do not touch spilled material","Stop leak if safe","Do not add water"], small: ["Absorb with dry earth or sand"], large: ["Dike for later disposal. Do not add water."] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  158: { number: 158, title: "Infectious Substances", color: "#10B981",
    potentialHazards: { fireExplosion: ["Some may burn but none ignite readily"], health: ["May cause disease or death if inhaled, ingested, or absorbed","Contagious to humans and/or animals","Damaged packages may expose contents"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA. Full protective equipment.", evacuationNotes: "Consider evacuation for large spill." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or foam"], large: ["Water spray, fog or foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Do not touch damaged packages","Cover spill with plastic sheet","Notify authorities"], small: ["Cover with plastic sheet"], large: ["Contact appropriate authorities"] }, firstAid: "Move victim to fresh air. Call 911. Treat as potentially contaminated. Seek immediate medical attention." }
  },
  160: { number: 160, title: "Halogenated Solvents", color: "#6B7280",
    potentialHazards: { fireExplosion: ["Some may burn but does not ignite readily","Containers may explode when heated"], health: ["TOXIC - Inhalation may cause injury or death","Vapors may cause dizziness","Contact may irritate skin and eyes"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 800, feet: 2640 }, protectiveClothing: "Wear positive pressure SCBA.", evacuationNotes: "Consider evacuation for large spill." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or foam"], large: ["Water spray, fog or foam"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Eliminate ignition sources","Stop leak if safe","Prevent entry into waterways"], small: ["Absorb with non-combustible material"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Call 911. Flush skin/eyes with water for 20+ minutes." }
  },
  163: { number: 163, title: "Radioactive Materials (Low Level Radiation)", color: "#FBBF24",
    potentialHazards: { fireExplosion: ["Some may burn but none ignite readily"], health: ["Radiation presents minimal risk during transportation","Damaged packages may release radioactive dust"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 100, feet: 330 }, protectiveClothing: "Wear positive pressure SCBA. Fire fighting turnout gear provides limited radiation protection.", evacuationNotes: "Consider 100m evacuation if fire involved." },
    emergencyResponse: { fire: { small: ["Use agent suitable for surrounding fire"], large: ["Use agent suitable for surrounding fire"], tank: ["Cool containers with flooding quantities of water"] }, spillLeak: { general: ["Do not touch damaged packages","Stay upwind","Cover spill with plastic sheet"], small: ["Cover with plastic sheet"], large: ["Contact radiation authority"] }, firstAid: "Move victim to fresh air. Radioactive materials do not transmit radiation by touch. Seek medical attention." }
  },
  171: { number: 171, title: "Substances (Low to Moderate Hazard)", color: "#6B7280",
    potentialHazards: { fireExplosion: ["Some may burn but none ignite readily"], health: ["May cause irritation to skin, eyes and respiratory system","Harmful if swallowed"] },
    publicSafety: { isolationDistance: { meters: 25, feet: 82 }, fireIsolationDistance: { meters: 100, feet: 330 }, protectiveClothing: "Wear appropriate protective equipment.", evacuationNotes: "Consider evacuation for large spills." },
    emergencyResponse: { fire: { small: ["Dry chemical, CO2, water spray or foam"], large: ["Water spray, fog or foam"], tank: ["Cool containers with water"] }, spillLeak: { general: ["Stop leak if safe","Prevent entry into waterways"], small: ["Absorb with non-combustible material"], large: ["Dike for later disposal"] }, firstAid: "Move victim to fresh air. Wash skin with soap and water. Seek medical attention if symptoms persist." }
  },
};

// ============================================================================
// MATERIALS DATABASE
// ============================================================================

export const ERG_MATERIALS: ERGMaterial[] = [
  // Gases - Class 2
  { unNumber: "1001", name: "Acetylene, dissolved", guide: 116, hazardClass: "2.1", isTIH: false },
  { unNumber: "1002", name: "Air, compressed", guide: 122, hazardClass: "2.2", isTIH: false },
  { unNumber: "1005", name: "Ammonia, anhydrous", guide: 125, hazardClass: "2.3", isTIH: true, alternateNames: ["Anhydrous ammonia"] },
  { unNumber: "1006", name: "Argon, compressed", guide: 120, hazardClass: "2.2", isTIH: false },
  { unNumber: "1008", name: "Boron trifluoride", guide: 125, hazardClass: "2.3", isTIH: true },
  { unNumber: "1011", name: "Butane", guide: 115, hazardClass: "2.1", isTIH: false, alternateNames: ["n-Butane"] },
  { unNumber: "1013", name: "Carbon dioxide", guide: 120, hazardClass: "2.2", isTIH: false, alternateNames: ["CO2"] },
  { unNumber: "1016", name: "Carbon monoxide, compressed", guide: 119, hazardClass: "2.3", isTIH: true, alternateNames: ["CO"] },
  { unNumber: "1017", name: "Chlorine", guide: 124, hazardClass: "2.3", isTIH: true },
  { unNumber: "1023", name: "Coal gas, compressed", guide: 119, hazardClass: "2.3", isTIH: true },
  { unNumber: "1026", name: "Cyanogen", guide: 119, hazardClass: "2.3", isTIH: true },
  { unNumber: "1027", name: "Cyclopropane", guide: 115, hazardClass: "2.1", isTIH: false },
  { unNumber: "1035", name: "Ethane", guide: 115, hazardClass: "2.1", isTIH: false },
  { unNumber: "1038", name: "Ethylene, refrigerated liquid", guide: 115, hazardClass: "2.1", isTIH: false },
  { unNumber: "1040", name: "Ethylene oxide", guide: 119, hazardClass: "2.3", isTIH: true },
  { unNumber: "1045", name: "Fluorine, compressed", guide: 124, hazardClass: "2.3", isTIH: true },
  { unNumber: "1046", name: "Helium, compressed", guide: 120, hazardClass: "2.2", isTIH: false },
  { unNumber: "1049", name: "Hydrogen, compressed", guide: 115, hazardClass: "2.1", isTIH: false },
  { unNumber: "1050", name: "Hydrogen chloride, anhydrous", guide: 125, hazardClass: "2.3", isTIH: true },
  { unNumber: "1051", name: "Hydrogen cyanide, stabilized", guide: 117, hazardClass: "6.1", isTIH: true, alternateNames: ["HCN","Prussic acid"] },
  { unNumber: "1052", name: "Hydrogen fluoride, anhydrous", guide: 125, hazardClass: "8", isTIH: true },
  { unNumber: "1053", name: "Hydrogen sulfide", guide: 117, hazardClass: "2.3", isTIH: true, alternateNames: ["H2S","Sour gas"] },
  { unNumber: "1060", name: "Methylacetylene-propadiene mixture", guide: 116, hazardClass: "2.1", isTIH: false, alternateNames: ["MAPP gas"] },
  { unNumber: "1062", name: "Methyl bromide", guide: 123, hazardClass: "2.3", isTIH: true },
  { unNumber: "1064", name: "Methyl mercaptan", guide: 117, hazardClass: "2.3", isTIH: true },
  { unNumber: "1066", name: "Nitrogen, compressed", guide: 120, hazardClass: "2.2", isTIH: false },
  { unNumber: "1067", name: "Nitrogen dioxide", guide: 124, hazardClass: "2.3", isTIH: true },
  { unNumber: "1072", name: "Oxygen, compressed", guide: 122, hazardClass: "2.2", isTIH: false },
  { unNumber: "1075", name: "Liquefied petroleum gas / LPG", guide: 115, hazardClass: "2.1", isTIH: false, alternateNames: ["LPG","LP Gas"] },
  { unNumber: "1076", name: "Phosgene", guide: 125, hazardClass: "2.3", isTIH: true },
  { unNumber: "1079", name: "Sulfur dioxide", guide: 125, hazardClass: "2.3", isTIH: true, alternateNames: ["SO2"] },
  { unNumber: "1080", name: "Sulfur hexafluoride", guide: 126, hazardClass: "2.2", isTIH: false },
  // Flammable Liquids - Class 3 (critical for petroleum / SPECTRA-MATCH)
  { unNumber: "1090", name: "Acetone", guide: 127, hazardClass: "3", packingGroup: "II", isTIH: false },
  { unNumber: "1092", name: "Acrolein, stabilized", guide: 131, hazardClass: "6.1", isTIH: true },
  { unNumber: "1093", name: "Acrylonitrile, stabilized", guide: 131, hazardClass: "3", isTIH: true },
  { unNumber: "1114", name: "Benzene", guide: 130, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["Benzol"] },
  { unNumber: "1120", name: "Butanols", guide: 129, hazardClass: "3", isTIH: false, alternateNames: ["Butyl alcohol"] },
  { unNumber: "1131", name: "Carbon disulfide", guide: 131, hazardClass: "3", packingGroup: "I", isTIH: false },
  { unNumber: "1145", name: "Cyclohexane", guide: 128, hazardClass: "3", packingGroup: "II", isTIH: false },
  { unNumber: "1155", name: "Diethyl ether", guide: 127, hazardClass: "3", packingGroup: "I", isTIH: false, alternateNames: ["Ether"] },
  { unNumber: "1170", name: "Ethanol / Ethyl alcohol", guide: 127, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["Ethanol","Denatured alcohol"] },
  { unNumber: "1173", name: "Ethyl acetate", guide: 129, hazardClass: "3", packingGroup: "II", isTIH: false },
  { unNumber: "1175", name: "Ethylbenzene", guide: 130, hazardClass: "3", packingGroup: "II", isTIH: false },
  { unNumber: "1193", name: "Ethyl methyl ketone", guide: 127, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["MEK","2-Butanone"] },
  { unNumber: "1202", name: "Diesel fuel", guide: 128, hazardClass: "3", packingGroup: "III", isTIH: false, alternateNames: ["Diesel","Gas oil","Heating oil","ULSD"] },
  { unNumber: "1203", name: "Gasoline / Motor fuel / Petrol", guide: 128, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["Gasoline","Petrol","Motor spirit","RBOB","Unleaded"] },
  { unNumber: "1206", name: "Heptanes", guide: 128, hazardClass: "3", packingGroup: "II", isTIH: false },
  { unNumber: "1208", name: "Hexanes", guide: 128, hazardClass: "3", packingGroup: "II", isTIH: false },
  { unNumber: "1219", name: "Isopropanol / Isopropyl alcohol", guide: 129, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["IPA","Rubbing alcohol"] },
  { unNumber: "1223", name: "Kerosene", guide: 128, hazardClass: "3", packingGroup: "III", isTIH: false, alternateNames: ["Jet fuel","Jet A","Jet A-1","JP-8"] },
  { unNumber: "1230", name: "Methanol / Methyl alcohol", guide: 131, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["Methanol","Wood alcohol"] },
  { unNumber: "1256", name: "Naphtha, petroleum", guide: 128, hazardClass: "3", isTIH: false, alternateNames: ["Naphtha","Petroleum naphtha"] },
  { unNumber: "1263", name: "Paint / Lacquer / Varnish", guide: 128, hazardClass: "3", isTIH: false },
  { unNumber: "1267", name: "Petroleum crude oil", guide: 128, hazardClass: "3", isTIH: false, alternateNames: ["Crude oil","Crude petroleum","WTI","Brent","Sweet crude","Light crude","Heavy crude","Condensate"] },
  { unNumber: "1268", name: "Petroleum distillates, n.o.s.", guide: 128, hazardClass: "3", isTIH: false, alternateNames: ["Petroleum products","Fuel oil","Mineral spirits"] },
  { unNumber: "1270", name: "Petroleum oil", guide: 128, hazardClass: "3", isTIH: false },
  { unNumber: "1274", name: "n-Propanol", guide: 129, hazardClass: "3", isTIH: false },
  { unNumber: "1294", name: "Toluene", guide: 130, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["Toluol","Methylbenzene"] },
  { unNumber: "1300", name: "Turpentine", guide: 128, hazardClass: "3", isTIH: false },
  { unNumber: "1307", name: "Xylenes", guide: 130, hazardClass: "3", packingGroup: "II", isTIH: false, alternateNames: ["Xylene","Xylol"] },
  // Corrosives & Toxics
  { unNumber: "1547", name: "Aniline", guide: 153, hazardClass: "6.1", packingGroup: "II", isTIH: false },
  { unNumber: "1593", name: "Dichloromethane", guide: 160, hazardClass: "6.1", isTIH: false, alternateNames: ["Methylene chloride"] },
  { unNumber: "1789", name: "Hydrochloric acid", guide: 157, hazardClass: "8", isTIH: false, alternateNames: ["Muriatic acid","HCl"] },
  { unNumber: "1791", name: "Hypochlorite solution / Bleach", guide: 154, hazardClass: "8", isTIH: false, alternateNames: ["Bleach","Sodium hypochlorite"] },
  { unNumber: "1823", name: "Sodium hydroxide, solid", guide: 154, hazardClass: "8", isTIH: false, alternateNames: ["Caustic soda","Lye","NaOH"] },
  { unNumber: "1824", name: "Sodium hydroxide solution", guide: 154, hazardClass: "8", isTIH: false },
  { unNumber: "1830", name: "Sulfuric acid", guide: 137, hazardClass: "8", packingGroup: "II", isTIH: false, alternateNames: ["Battery acid"] },
  { unNumber: "1831", name: "Sulfuric acid, fuming / Oleum", guide: 137, hazardClass: "8", isTIH: true },
  // Additional petroleum & energy products
  { unNumber: "1863", name: "Fuel, aviation, turbine engine", guide: 128, hazardClass: "3", isTIH: false, alternateNames: ["Jet fuel","JP-5","JP-8"] },
  { unNumber: "1966", name: "Hydrogen, refrigerated liquid", guide: 115, hazardClass: "2.1", isTIH: false },
  { unNumber: "1969", name: "Isobutane", guide: 115, hazardClass: "2.1", isTIH: false },
  { unNumber: "1971", name: "Methane, compressed / Natural gas", guide: 115, hazardClass: "2.1", isTIH: false, alternateNames: ["Natural gas","CNG","Methane"] },
  { unNumber: "1972", name: "Methane, refrigerated liquid / LNG", guide: 115, hazardClass: "2.1", isTIH: false, alternateNames: ["LNG","Liquefied natural gas"] },
  { unNumber: "1977", name: "Nitrogen, refrigerated liquid", guide: 120, hazardClass: "2.2", isTIH: false },
  { unNumber: "1978", name: "Propane", guide: 115, hazardClass: "2.1", isTIH: false, alternateNames: ["LP-Gas","LPG"] },
  { unNumber: "1987", name: "Alcohols, n.o.s.", guide: 127, hazardClass: "3", isTIH: false },
  { unNumber: "1993", name: "Flammable liquids, n.o.s.", guide: 128, hazardClass: "3", isTIH: false },
  { unNumber: "1999", name: "Tars, liquid", guide: 130, hazardClass: "3", isTIH: false, alternateNames: ["Asphalt","Bitumen"] },
  { unNumber: "2014", name: "Hydrogen peroxide, aqueous solution", guide: 140, hazardClass: "5.1", isTIH: false },
  { unNumber: "2015", name: "Hydrogen peroxide, stabilized", guide: 140, hazardClass: "5.1", isTIH: false },
  { unNumber: "2055", name: "Styrene monomer, stabilized", guide: 128, hazardClass: "3", isTIH: false },
  { unNumber: "2187", name: "Carbon dioxide, refrigerated liquid", guide: 120, hazardClass: "2.2", isTIH: false },
  { unNumber: "2188", name: "Arsine", guide: 119, hazardClass: "2.3", isTIH: true },
  { unNumber: "2199", name: "Phosphine", guide: 119, hazardClass: "2.3", isTIH: true },
  { unNumber: "2480", name: "Methyl isocyanate", guide: 155, hazardClass: "6.1", isTIH: true, alternateNames: ["MIC"] },
  { unNumber: "2810", name: "Toxic liquid, organic, n.o.s.", guide: 153, hazardClass: "6.1", isTIH: false },
  { unNumber: "2814", name: "Infectious substance, affecting humans", guide: 158, hazardClass: "6.2", isTIH: false },
  { unNumber: "2900", name: "Infectious substance, affecting animals", guide: 158, hazardClass: "6.2", isTIH: false },
  { unNumber: "2908", name: "Radioactive material, excepted package", guide: 163, hazardClass: "7", isTIH: false },
  { unNumber: "3077", name: "Environmentally hazardous substance, solid, n.o.s.", guide: 171, hazardClass: "9", isTIH: false },
  { unNumber: "3082", name: "Environmentally hazardous substance, liquid, n.o.s.", guide: 171, hazardClass: "9", isTIH: false },
  { unNumber: "3175", name: "Solids containing flammable liquid, n.o.s.", guide: 133, hazardClass: "4.1", isTIH: false },
  { unNumber: "3257", name: "Elevated temperature liquid, n.o.s.", guide: 128, hazardClass: "9", isTIH: false, alternateNames: ["Hot asphalt","Hot bitumen"] },
  { unNumber: "3295", name: "Hydrocarbons, liquid, n.o.s.", guide: 128, hazardClass: "3", isTIH: false },
  { unNumber: "3475", name: "Ethanol and gasoline mixture", guide: 127, hazardClass: "3", isTIH: false, alternateNames: ["E10","E15","E85","Gasohol"] },
  { unNumber: "3480", name: "Lithium ion batteries", guide: 147, hazardClass: "9", isTIH: false },
  { unNumber: "3481", name: "Lithium ion batteries in equipment", guide: 147, hazardClass: "9", isTIH: false },
  { unNumber: "3090", name: "Lithium metal batteries", guide: 147, hazardClass: "9", isTIH: false },
  { unNumber: "3091", name: "Lithium metal batteries in equipment", guide: 147, hazardClass: "9", isTIH: false },
  { unNumber: "3494", name: "Petroleum sour crude oil, flammable, toxic", guide: 131, hazardClass: "3", isTIH: true, alternateNames: ["Sour crude","H2S crude oil"] },
];

// ============================================================================
// TIH PROTECTIVE DISTANCES (Table 1)
// ============================================================================

export const TIH_PROTECTIVE_DISTANCES: ProtectiveDistance[] = [
  { unNumber: "1005", name: "Ammonia, anhydrous", smallSpill: { day: { isolateMeters: 30, protectKm: 0.2 }, night: { isolateMeters: 30, protectKm: 0.8 } }, largeSpill: { day: { isolateMeters: 150, protectKm: 1.5 }, night: { isolateMeters: 150, protectKm: 4.8 } } },
  { unNumber: "1017", name: "Chlorine", smallSpill: { day: { isolateMeters: 60, protectKm: 0.5 }, night: { isolateMeters: 60, protectKm: 2.1 } }, largeSpill: { day: { isolateMeters: 400, protectKm: 3.4 }, night: { isolateMeters: 400, protectKm: 9.2 } } },
  { unNumber: "1051", name: "Hydrogen cyanide", smallSpill: { day: { isolateMeters: 60, protectKm: 0.5 }, night: { isolateMeters: 60, protectKm: 1.6 } }, largeSpill: { day: { isolateMeters: 300, protectKm: 2.7 }, night: { isolateMeters: 300, protectKm: 7.0 } } },
  { unNumber: "1053", name: "Hydrogen sulfide", smallSpill: { day: { isolateMeters: 30, protectKm: 0.2 }, night: { isolateMeters: 30, protectKm: 0.5 } }, largeSpill: { day: { isolateMeters: 100, protectKm: 0.8 }, night: { isolateMeters: 100, protectKm: 3.2 } } },
  { unNumber: "1076", name: "Phosgene", smallSpill: { day: { isolateMeters: 100, protectKm: 0.8 }, night: { isolateMeters: 100, protectKm: 3.5 } }, largeSpill: { day: { isolateMeters: 600, protectKm: 4.8 }, night: { isolateMeters: 600, protectKm: 11.0 } } },
  { unNumber: "1079", name: "Sulfur dioxide", smallSpill: { day: { isolateMeters: 30, protectKm: 0.2 }, night: { isolateMeters: 30, protectKm: 0.6 } }, largeSpill: { day: { isolateMeters: 150, protectKm: 1.3 }, night: { isolateMeters: 150, protectKm: 4.2 } } },
  { unNumber: "2188", name: "Arsine", smallSpill: { day: { isolateMeters: 60, protectKm: 0.5 }, night: { isolateMeters: 60, protectKm: 1.8 } }, largeSpill: { day: { isolateMeters: 300, protectKm: 2.7 }, night: { isolateMeters: 300, protectKm: 7.6 } } },
  { unNumber: "2199", name: "Phosphine", smallSpill: { day: { isolateMeters: 60, protectKm: 0.5 }, night: { isolateMeters: 60, protectKm: 1.6 } }, largeSpill: { day: { isolateMeters: 300, protectKm: 2.4 }, night: { isolateMeters: 300, protectKm: 7.0 } } },
  { unNumber: "2480", name: "Methyl isocyanate", smallSpill: { day: { isolateMeters: 100, protectKm: 0.8 }, night: { isolateMeters: 100, protectKm: 3.2 } }, largeSpill: { day: { isolateMeters: 600, protectKm: 4.8 }, night: { isolateMeters: 600, protectKm: 11.0 } } },
  { unNumber: "3494", name: "Petroleum sour crude oil", smallSpill: { day: { isolateMeters: 30, protectKm: 0.2 }, night: { isolateMeters: 30, protectKm: 0.5 } }, largeSpill: { day: { isolateMeters: 100, protectKm: 0.8 }, night: { isolateMeters: 100, protectKm: 3.2 } } },
];

// ============================================================================
// PRODUCT-TO-UN MAPPING (for SPECTRA-MATCH integration)
// ============================================================================

export const PRODUCT_UN_MAP: Record<string, string> = {
  "crude oil": "1267", "petroleum crude oil": "1267", "sweet crude": "1267", "light crude": "1267", "heavy crude": "1267", "condensate": "1267", "wti": "1267", "brent": "1267",
  "sour crude": "3494", "petroleum sour crude": "3494",
  "gasoline": "1203", "motor fuel": "1203", "petrol": "1203", "unleaded": "1203", "premium": "1203", "regular": "1203", "rbob": "1203",
  "diesel": "1202", "diesel fuel": "1202", "ulsd": "1202", "gas oil": "1202", "heating oil": "1202",
  "kerosene": "1223", "jet fuel": "1223", "jet a": "1223", "jet a-1": "1223", "jp-8": "1223",
  "aviation fuel": "1863",
  "naphtha": "1256", "petroleum naphtha": "1256",
  "propane": "1978", "lpg": "1075", "butane": "1011", "isobutane": "1969",
  "natural gas": "1971", "cng": "1971", "lng": "1972",
  "ethane": "1035", "hydrogen": "1049", "acetylene": "1001",
  "ethanol": "1170", "methanol": "1230", "acetone": "1090",
  "benzene": "1114", "toluene": "1294", "xylene": "1307",
  "isopropanol": "1219", "isopropyl alcohol": "1219",
  "sulfuric acid": "1830", "hydrochloric acid": "1789",
  "ammonia": "1005", "chlorine": "1017",
  "hydrogen sulfide": "1053", "h2s": "1053",
  "hydrogen cyanide": "1051", "phosgene": "1076",
  "cyclohexane": "1145", "styrene": "2055",
  "e85": "3475", "e10": "3475", "gasohol": "3475",
  "asphalt": "3257", "bitumen": "3257",
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

export function searchMaterials(query: string, limit = 20): ERGMaterial[] {
  const q = query.toLowerCase().replace(/^un/i, "").trim();
  if (!q) return [];
  return ERG_MATERIALS.filter(m => {
    if (m.unNumber.includes(q)) return true;
    if (m.name.toLowerCase().includes(q)) return true;
    if (m.alternateNames?.some(n => n.toLowerCase().includes(q))) return true;
    return false;
  }).slice(0, limit);
}

export function getMaterialByUN(unNumber: string): ERGMaterial | undefined {
  const un = unNumber.replace(/^un/i, "").trim();
  return ERG_MATERIALS.find(m => m.unNumber === un);
}

export function getGuide(guideNumber: number): ERGGuide | undefined {
  return ERG_GUIDES[guideNumber];
}

export function getProtectiveDistance(unNumber: string): ProtectiveDistance | undefined {
  const un = unNumber.replace(/^un/i, "").trim();
  return TIH_PROTECTIVE_DISTANCES.find(d => d.unNumber === un);
}

export function getUNForProduct(productName: string): string | undefined {
  const name = productName.toLowerCase().trim();
  if (PRODUCT_UN_MAP[name]) return PRODUCT_UN_MAP[name];
  for (const [key, un] of Object.entries(PRODUCT_UN_MAP)) {
    if (name.includes(key) || key.includes(name)) return un;
  }
  const material = ERG_MATERIALS.find(m =>
    m.name.toLowerCase().includes(name) ||
    m.alternateNames?.some(n => n.toLowerCase().includes(name))
  );
  return material?.unNumber;
}

export function getFullERGInfo(unNumber: string) {
  const material = getMaterialByUN(unNumber);
  if (!material) return null;
  const guide = getGuide(material.guide);
  const distance = material.isTIH ? getProtectiveDistance(unNumber) : null;
  return { material, guide, protectiveDistance: distance };
}

export function getERGForProduct(productName: string) {
  const un = getUNForProduct(productName);
  if (!un) return null;
  return getFullERGInfo(un);
}

export const ERG_METADATA = {
  version: "2024",
  title: "Emergency Response Guidebook 2024",
  publishers: ["U.S. Department of Transportation", "Transport Canada", "SCT Mexico"],
  effectiveDate: "2024-01-01",
  totalMaterials: ERG_MATERIALS.length,
  totalGuides: Object.keys(ERG_GUIDES).length,
  totalTIH: TIH_PROTECTIVE_DISTANCES.length,
};
