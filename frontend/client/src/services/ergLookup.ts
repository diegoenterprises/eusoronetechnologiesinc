/**
 * ERG2024 LOOKUP SERVICE
 * Emergency Response Guidebook lookup and search functionality
 * Powers ESANG AI™ Emergency Response System
 */

import ergDatabase from "@/data/erg2024_database.json";
import type { 
  ERGGuide, 
  EmergencyContacts,
  ESANGERGQuery,
  ESANGERGResponse,
  Distance
} from "@/data/erg2024Types";

// Type assertion for the imported JSON - using any for flexibility with JSON structure
const db: any = ergDatabase;

// Common hazmat materials with UN numbers for quick lookup
const COMMON_MATERIALS: Record<string, { un: string; name: string; guide: number; class: string }> = {
  "gasoline": { un: "1203", name: "Gasoline", guide: 128, class: "3" },
  "diesel": { un: "1202", name: "Diesel Fuel", guide: 128, class: "3" },
  "jet fuel": { un: "1863", name: "Fuel, aviation, turbine engine", guide: 128, class: "3" },
  "propane": { un: "1978", name: "Propane", guide: 115, class: "2.1" },
  "ammonia": { un: "1005", name: "Ammonia, anhydrous", guide: 125, class: "2.3" },
  "chlorine": { un: "1017", name: "Chlorine", guide: 124, class: "2.3" },
  "sulfuric acid": { un: "1830", name: "Sulfuric acid", guide: 137, class: "8" },
  "hydrochloric acid": { un: "1789", name: "Hydrochloric acid", guide: 157, class: "8" },
  "sodium hydroxide": { un: "1824", name: "Sodium hydroxide solution", guide: 154, class: "8" },
  "acetone": { un: "1090", name: "Acetone", guide: 127, class: "3" },
  "methanol": { un: "1230", name: "Methanol", guide: 131, class: "3" },
  "ethanol": { un: "1170", name: "Ethanol", guide: 127, class: "3" },
  "hydrogen": { un: "1049", name: "Hydrogen, compressed", guide: 115, class: "2.1" },
  "oxygen": { un: "1072", name: "Oxygen, compressed", guide: 122, class: "2.2" },
  "nitrogen": { un: "1066", name: "Nitrogen, compressed", guide: 121, class: "2.2" },
  "carbon dioxide": { un: "1013", name: "Carbon dioxide", guide: 120, class: "2.2" },
  "crude oil": { un: "1267", name: "Petroleum crude oil", guide: 128, class: "3" },
  "benzene": { un: "1114", name: "Benzene", guide: 130, class: "3" },
  "toluene": { un: "1294", name: "Toluene", guide: 130, class: "3" },
  "xylene": { un: "1307", name: "Xylenes", guide: 130, class: "3" },
  "hydrogen sulfide": { un: "1053", name: "Hydrogen sulfide", guide: 117, class: "2.3" },
  "lpg": { un: "1075", name: "Petroleum gases, liquefied", guide: 115, class: "2.1" },
  "natural gas": { un: "1971", name: "Natural gas, compressed", guide: 115, class: "2.1" },
  "lng": { un: "1972", name: "Natural gas, refrigerated liquid", guide: 115, class: "2.1" },
  "kerosene": { un: "1223", name: "Kerosene", guide: 128, class: "3" },
  "fuel oil": { un: "1993", name: "Flammable liquids, n.o.s.", guide: 128, class: "3" },
};

// TIH (Toxic Inhalation Hazard) materials with protective distances
const TIH_DISTANCES: Record<string, { 
  small_day: Distance; small_night: Distance; 
  large_day: Distance; large_night: Distance 
}> = {
  "1005": { // Ammonia
    small_day: { meters: 30, feet: 100 },
    small_night: { meters: 100, feet: 330 },
    large_day: { meters: 150, feet: 500 },
    large_night: { meters: 600, feet: 2000 },
  },
  "1017": { // Chlorine
    small_day: { meters: 60, feet: 200 },
    small_night: { meters: 200, feet: 660 },
    large_day: { meters: 400, feet: 1300 },
    large_night: { meters: 1600, feet: 5280 },
  },
  "1053": { // Hydrogen sulfide
    small_day: { meters: 30, feet: 100 },
    small_night: { meters: 100, feet: 330 },
    large_day: { meters: 200, feet: 660 },
    large_night: { meters: 800, feet: 2640 },
  },
};

class ERGLookupService {
  /**
   * Look up material by UN/NA number
   */
  lookupByUN(unNumber: string): { material: any; guide: ERGGuide | null } | null {
    const cleanUN = unNumber.replace(/\D/g, "").padStart(4, "0");
    
    // Check common materials first
    for (const [key, mat] of Object.entries(COMMON_MATERIALS)) {
      if (mat.un === cleanUN) {
        const guide = this.getGuide(mat.guide);
        return {
          material: {
            un_number: mat.un,
            name: mat.name,
            guide_number: mat.guide,
            hazard_class: mat.class,
            is_tih: ["1005", "1017", "1053"].includes(mat.un),
          },
          guide,
        };
      }
    }
    
    return null;
  }

  /**
   * Look up material by name (fuzzy search)
   */
  lookupByName(name: string): { material: any; guide: ERGGuide | null } | null {
    const searchTerm = name.toLowerCase().trim();
    
    // Check common materials
    for (const [key, mat] of Object.entries(COMMON_MATERIALS)) {
      if (key.includes(searchTerm) || mat.name.toLowerCase().includes(searchTerm)) {
        const guide = this.getGuide(mat.guide);
        return {
          material: {
            un_number: mat.un,
            name: mat.name,
            guide_number: mat.guide,
            hazard_class: mat.class,
            is_tih: ["1005", "1017", "1053"].includes(mat.un),
          },
          guide,
        };
      }
    }
    
    return null;
  }

  /**
   * Get guide by number
   */
  getGuide(guideNumber: number): ERGGuide | null {
    const guide = db.guides[guideNumber.toString()];
    return guide || null;
  }

  /**
   * Get emergency contacts
   */
  getEmergencyContacts(): EmergencyContacts {
    return db.emergency_contacts;
  }

  /**
   * Get protective action distances for TIH material
   */
  getProtectiveDistances(unNumber: string): {
    small_spill: { day: Distance; night: Distance };
    large_spill: { day: Distance; night: Distance };
  } | null {
    const distances = TIH_DISTANCES[unNumber];
    if (!distances) return null;
    
    return {
      small_spill: {
        day: distances.small_day,
        night: distances.small_night,
      },
      large_spill: {
        day: distances.large_day,
        night: distances.large_night,
      },
    };
  }

  /**
   * Get hazard classes
   */
  getHazardClasses() {
    return db.hazard_classes;
  }

  /**
   * Process ESANG AI query
   */
  processQuery(query: ESANGERGQuery): ESANGERGResponse {
    let material = null;
    let guide = null;
    let protectiveDistances = null;
    let safetyMessage = "";
    const followUpQuestions: string[] = [];

    // Look up by UN number
    if (query.un_number) {
      const result = this.lookupByUN(query.un_number);
      if (result) {
        material = result.material;
        guide = result.guide;
        if (material?.is_tih) {
          protectiveDistances = this.getProtectiveDistances(query.un_number);
        }
      }
    }

    // Look up by name
    if (!material && query.material_name) {
      const result = this.lookupByName(query.material_name);
      if (result) {
        material = result.material;
        guide = result.guide;
        if (material?.is_tih && material.un_number) {
          protectiveDistances = this.getProtectiveDistances(material.un_number);
        }
      }
    }

    // Look up guide directly
    if (!guide && query.guide_number) {
      guide = this.getGuide(query.guide_number);
    }

    // Default to Guide 111 for unknown
    if (!guide) {
      guide = this.getGuide(111);
      safetyMessage = "[WARNING] CAUTION: Material not positively identified. Using Guide 111 (Mixed Load/Unidentified Cargo). Exercise maximum caution and contact CHEMTREC immediately.";
      followUpQuestions.push(
        "Can you provide the UN/NA number from the placard or shipping papers?",
        "What does the placard/label look like?",
        "Is there any marking visible on the container?"
      );
    } else if (material?.is_tih) {
      safetyMessage = "[WARNING] TOXIC INHALATION HAZARD (TIH): This material requires immediate protective action distances. Approach from UPWIND. Evacuate downwind population.";
      if (!query.scenario?.spill_size) {
        followUpQuestions.push("What is the approximate spill size? (Small: ≤208L/55gal, Large: >208L)");
      }
      if (!query.scenario?.time_of_day) {
        followUpQuestions.push("Is it currently day or night? (Protective distances vary)");
      }
    } else {
      safetyMessage = "[OK] Material identified. Follow the emergency response guide procedures below.";
    }

    // Add scenario-based follow-ups
    if (query.scenario?.fire_present === undefined) {
      followUpQuestions.push("Is fire currently involved?");
    }

    return {
      material,
      guide,
      protective_distances: protectiveDistances,
      emergency_contacts: this.getEmergencyContacts(),
      safety_message: safetyMessage,
      follow_up_questions: followUpQuestions.slice(0, 3),
    };
  }

  /**
   * Search materials
   */
  searchMaterials(query: string, limit = 10): any[] {
    const searchTerm = query.toLowerCase().trim();
    const results: any[] = [];

    for (const [key, mat] of Object.entries(COMMON_MATERIALS)) {
      if (
        key.includes(searchTerm) ||
        mat.name.toLowerCase().includes(searchTerm) ||
        mat.un.includes(searchTerm)
      ) {
        results.push({
          un_number: mat.un,
          name: mat.name,
          guide_number: mat.guide,
          hazard_class: mat.class,
        });
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Get all guides list
   */
  getAllGuides(): { number: number; title: string }[] {
    return Object.values(db.guides).map((g: any) => ({
      number: g.number,
      title: g.title,
    }));
  }
}

export const ergLookup = new ERGLookupService();
export default ergLookup;
