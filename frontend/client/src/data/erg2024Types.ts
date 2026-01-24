/**
 * ERG2024 TYPE DEFINITIONS
 * Emergency Response Guidebook 2024 - TypeScript Types
 * Powers ESANG AI™ Emergency Response System
 */

export interface ERG2024Database {
  metadata: ERGMetadata;
  emergency_contacts: EmergencyContacts;
  hazard_classes: HazardClass[];
  guides: Record<string, ERGGuide>;
  materials: ERGMaterial[];
  tih_materials: TIHMaterial[];
  protective_action_distances: ProtectiveActionDistance[];
}

export interface ERGMetadata {
  version: string;
  title: string;
  publishers: string[];
  effective_date: string;
  last_updated: string;
  total_materials: number;
  total_guides: number;
  total_tih_materials: number;
}

export interface EmergencyContacts {
  usa: {
    chemtrec: string;
    national_response_center: string;
    poison_control: string;
    military_shipments: string;
  };
  canada: {
    canutec: string;
    canutec_cellular: string;
    canutec_alt: string;
  };
  mexico: {
    cenacom: string;
    setiq: string;
  };
}

export interface HazardClass {
  class: number;
  name: string;
  divisions: HazardDivision[];
}

export interface HazardDivision {
  division: string;
  description: string;
}

export interface ERGGuide {
  number: number;
  title: string;
  description: string;
  potential_hazards: {
    fire_explosion: string[];
    health: string[];
  };
  public_safety: {
    isolation_distance: Distance;
    fire_isolation_distance: Distance;
    protective_clothing: string;
    evacuation_notes: string;
  };
  emergency_response: {
    fire: {
      small: string[];
      large: string[];
      tank: string[];
    };
    spill_leak: {
      general: string[];
      small: string[];
      large: string[];
    };
    first_aid: string;
  };
}

export interface Distance {
  meters: number;
  feet: number;
}

export interface ERGMaterial {
  un_number: string;
  name: string;
  guide_number: number;
  hazard_class: string;
  is_tih: boolean;
  packing_group?: string;
  synonyms?: string[];
}

export interface TIHMaterial {
  un_number: string;
  name: string;
  guide_number: number;
  protective_distances: {
    small_spill: {
      day: Distance;
      night: Distance;
    };
    large_spill: {
      day: Distance;
      night: Distance;
    };
  };
}

export interface ProtectiveActionDistance {
  un_number: string;
  material_name: string;
  small_spill_day: Distance;
  small_spill_night: Distance;
  large_spill_day: Distance;
  large_spill_night: Distance;
}

// ESANG AI Query Types
export type ESANGQueryIntent = 
  | "identification"
  | "emergency_response"
  | "protective_actions"
  | "first_aid"
  | "container_id"
  | "general_chat"
  | "load_management"
  | "compliance"
  | "route_planning";

export interface ESANGERGQuery {
  intent: ESANGQueryIntent;
  un_number?: string;
  material_name?: string;
  guide_number?: number;
  scenario?: {
    fire_present?: boolean;
    spill_size?: "small" | "large";
    time_of_day?: "day" | "night";
    container_type?: string;
    water_proximity?: boolean;
  };
}

export interface ESANGERGResponse {
  material?: ERGMaterial | null;
  guide?: ERGGuide | null;
  protective_distances?: any;
  emergency_contacts: EmergencyContacts;
  safety_message: string;
  follow_up_questions?: string[];
}

// Hazard Class Colors for UI
export const HAZARD_CLASS_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-orange-500", text: "text-orange-500", label: "Explosives" },
  2: { bg: "bg-green-500", text: "text-green-500", label: "Gases" },
  3: { bg: "bg-red-500", text: "text-red-500", label: "Flammable Liquids" },
  4: { bg: "bg-red-400", text: "text-red-400", label: "Flammable Solids" },
  5: { bg: "bg-yellow-500", text: "text-yellow-500", label: "Oxidizers" },
  6: { bg: "bg-purple-500", text: "text-purple-500", label: "Toxic/Infectious" },
  7: { bg: "bg-yellow-400", text: "text-yellow-400", label: "Radioactive" },
  8: { bg: "bg-slate-600", text: "text-slate-400", label: "Corrosives" },
  9: { bg: "bg-white", text: "text-slate-900", label: "Miscellaneous" },
};

// Division 2.x specific colors
export const GAS_DIVISION_COLORS: Record<string, { bg: string; label: string }> = {
  "2.1": { bg: "bg-red-500", label: "Flammable Gas" },
  "2.2": { bg: "bg-green-500", label: "Non-Flammable Gas" },
  "2.3": { bg: "bg-white", label: "Toxic Gas" },
};
