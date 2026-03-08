/**
 * CANUTEC Integration — Canadian Transport Emergency Centre
 * ═══════════════════════════════════════════════════════════════
 * 
 * CANUTEC is operated by Transport Canada and provides 24/7
 * emergency response guidance for dangerous goods incidents.
 * This module provides TDG class mappings, CANUTEC emergency numbers,
 * and province-specific permit code references.
 */

// ── TDG Document Types ──
export enum TDGDocumentType {
  TDG_SHIPPING_DOCUMENT = "TDG_SHIPPING_DOCUMENT",
  TDG_DANGEROUS_GOODS_DECLARATION = "TDG_DANGEROUS_GOODS_DECLARATION",
  TDG_EMERGENCY_RESPONSE_PLAN = "TDG_EMERGENCY_RESPONSE_PLAN",
  TDG_MEANS_OF_CONTAINMENT = "TDG_MEANS_OF_CONTAINMENT",
}

// ── TDG Classification ──
export interface TDGClassification {
  unNumber: string;
  properShippingName: string;
  properShippingNameFr: string; // French bilingual requirement
  tdgClass: string;
  subsidiaryClass?: string;
  packagingGroup?: "I" | "II" | "III";
  specialProvisions?: string[];
  canutecNumber: string;
  exemptionCode?: string;
  limitedQuantityIndex?: string;
  exceptedQuantityCode?: string;
  ergGuideNumber?: string;
}

// ── Province Permit Codes ──
export interface ProvincePermit {
  provinceCode: string;
  provinceName: string;
  provinceNameFr: string;
  permitRequired: boolean;
  permitType: string;
  issuingAuthority: string;
  notes: string;
}

// ── CANUTEC Emergency Numbers ──
export const CANUTEC_EMERGENCY = {
  primary: "1-888-CANUTEC (226-8837)",
  primaryNumeric: "1-888-226-8837",
  cellular: "*666",
  satellite: "613-996-6666",
  fax: "613-954-5101",
  available: "24/7/365",
};

// ── TDG Class Definitions ──
export const TDG_CLASSES: Record<string, { name: string; nameFr: string; canutecGuide: string; placard: string; placardFr: string }> = {
  "1":   { name: "Explosives", nameFr: "Explosifs", canutecGuide: "112", placard: "EXPLOSIVES", placardFr: "EXPLOSIFS" },
  "1.1": { name: "Explosives – Mass explosion hazard", nameFr: "Explosifs – Danger d'explosion en masse", canutecGuide: "112", placard: "EXPLOSIVES 1.1", placardFr: "EXPLOSIFS 1.1" },
  "1.2": { name: "Explosives – Projection hazard", nameFr: "Explosifs – Danger de projection", canutecGuide: "112", placard: "EXPLOSIVES 1.2", placardFr: "EXPLOSIFS 1.2" },
  "1.3": { name: "Explosives – Fire hazard", nameFr: "Explosifs – Danger d'incendie", canutecGuide: "112", placard: "EXPLOSIVES 1.3", placardFr: "EXPLOSIFS 1.3" },
  "2.1": { name: "Flammable Gases", nameFr: "Gaz inflammables", canutecGuide: "115", placard: "FLAMMABLE GAS", placardFr: "GAZ INFLAMMABLE" },
  "2.2": { name: "Non-flammable Gases", nameFr: "Gaz ininflammables", canutecGuide: "120", placard: "NON-FLAMMABLE GAS", placardFr: "GAZ ININFLAMMABLE" },
  "2.3": { name: "Toxic Gases", nameFr: "Gaz toxiques", canutecGuide: "123", placard: "TOXIC GAS", placardFr: "GAZ TOXIQUE" },
  "3":   { name: "Flammable Liquids", nameFr: "Liquides inflammables", canutecGuide: "128", placard: "FLAMMABLE", placardFr: "INFLAMMABLE" },
  "4.1": { name: "Flammable Solids", nameFr: "Matières solides inflammables", canutecGuide: "133", placard: "FLAMMABLE SOLID", placardFr: "MATIÈRE SOLIDE INFLAMMABLE" },
  "4.2": { name: "Spontaneously Combustible", nameFr: "Matières sujettes à l'inflammation spontanée", canutecGuide: "135", placard: "SPONTANEOUSLY COMBUSTIBLE", placardFr: "MATIÈRE SUJETTE À L'INFLAMMATION SPONTANÉE" },
  "4.3": { name: "Dangerous When Wet", nameFr: "Matières hydroréactives", canutecGuide: "138", placard: "DANGEROUS WHEN WET", placardFr: "MATIÈRE HYDRORÉACTIVE" },
  "5.1": { name: "Oxidizing Substances", nameFr: "Matières comburantes", canutecGuide: "140", placard: "OXIDIZER", placardFr: "MATIÈRE COMBURANTE" },
  "5.2": { name: "Organic Peroxides", nameFr: "Peroxydes organiques", canutecGuide: "145", placard: "ORGANIC PEROXIDE", placardFr: "PEROXYDE ORGANIQUE" },
  "6.1": { name: "Toxic Substances", nameFr: "Matières toxiques", canutecGuide: "151", placard: "TOXIC", placardFr: "MATIÈRE TOXIQUE" },
  "6.2": { name: "Infectious Substances", nameFr: "Matières infectieuses", canutecGuide: "158", placard: "INFECTIOUS SUBSTANCE", placardFr: "MATIÈRE INFECTIEUSE" },
  "7":   { name: "Radioactive Materials", nameFr: "Matières radioactives", canutecGuide: "161", placard: "RADIOACTIVE", placardFr: "MATIÈRE RADIOACTIVE" },
  "8":   { name: "Corrosives", nameFr: "Matières corrosives", canutecGuide: "153", placard: "CORROSIVE", placardFr: "MATIÈRE CORROSIVE" },
  "9":   { name: "Miscellaneous Products", nameFr: "Produits, matières ou organismes divers", canutecGuide: "171", placard: "MISCELLANEOUS", placardFr: "PRODUIT DIVERS" },
};

// ── Province Permits for Dangerous Goods ──
export const PROVINCE_PERMITS: ProvincePermit[] = [
  { provinceCode: "ON", provinceName: "Ontario", provinceNameFr: "Ontario", permitRequired: true, permitType: "Dangerous Goods Permit", issuingAuthority: "Ontario Ministry of Transportation", notes: "Required for Class 1, 2.3, 6.1 (PG I), 7" },
  { provinceCode: "QC", provinceName: "Quebec", provinceNameFr: "Québec", permitRequired: true, permitType: "Permis de transport de matières dangereuses", issuingAuthority: "Ministère des Transports du Québec", notes: "French-language documentation mandatory" },
  { provinceCode: "BC", provinceName: "British Columbia", provinceNameFr: "Colombie-Britannique", permitRequired: true, permitType: "Dangerous Goods Transport Permit", issuingAuthority: "BC Ministry of Transportation", notes: "Mountain route restrictions for Class 1, 7" },
  { provinceCode: "AB", provinceName: "Alberta", provinceNameFr: "Alberta", permitRequired: true, permitType: "DG Transport Permit", issuingAuthority: "Alberta Transportation", notes: "Oil sands region special handling for Class 3" },
  { provinceCode: "SK", provinceName: "Saskatchewan", provinceNameFr: "Saskatchewan", permitRequired: false, permitType: "N/A", issuingAuthority: "Saskatchewan Highways", notes: "General DG permit not required; weight restrictions apply" },
  { provinceCode: "MB", provinceName: "Manitoba", provinceNameFr: "Manitoba", permitRequired: false, permitType: "N/A", issuingAuthority: "Manitoba Infrastructure", notes: "Seasonal road restrictions may limit DG transport" },
  { provinceCode: "NB", provinceName: "New Brunswick", provinceNameFr: "Nouveau-Brunswick", permitRequired: true, permitType: "DG Transit Permit", issuingAuthority: "NB Department of Transportation", notes: "Bilingual documentation required" },
  { provinceCode: "NS", provinceName: "Nova Scotia", provinceNameFr: "Nouvelle-Écosse", permitRequired: false, permitType: "N/A", issuingAuthority: "NS Transportation", notes: "Halifax port DG restrictions apply" },
  { provinceCode: "PE", provinceName: "Prince Edward Island", provinceNameFr: "Île-du-Prince-Édouard", permitRequired: false, permitType: "N/A", issuingAuthority: "PEI Transportation", notes: "Confederation Bridge DG schedule restrictions" },
  { provinceCode: "NL", provinceName: "Newfoundland and Labrador", provinceNameFr: "Terre-Neuve-et-Labrador", permitRequired: false, permitType: "N/A", issuingAuthority: "NL Transportation", notes: "Marine ferry DG schedules apply" },
];

// ── TDG Common Commodity Mappings (Oil & Gas focus) ──
export const TDG_COMMODITY_MAP: Record<string, TDGClassification> = {
  "UN1267": {
    unNumber: "1267",
    properShippingName: "PETROLEUM CRUDE OIL",
    properShippingNameFr: "PÉTROLE BRUT",
    tdgClass: "3",
    packagingGroup: "I",
    specialProvisions: ["16", "T11"],
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "128",
  },
  "UN1203": {
    unNumber: "1203",
    properShippingName: "GASOLINE",
    properShippingNameFr: "ESSENCE",
    tdgClass: "3",
    packagingGroup: "II",
    specialProvisions: ["T4"],
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "128",
  },
  "UN1202": {
    unNumber: "1202",
    properShippingName: "DIESEL FUEL",
    properShippingNameFr: "CARBURANT DIESEL",
    tdgClass: "3",
    packagingGroup: "III",
    specialProvisions: ["T4"],
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "128",
  },
  "UN1075": {
    unNumber: "1075",
    properShippingName: "PETROLEUM GASES, LIQUEFIED",
    properShippingNameFr: "GAZ DE PÉTROLE LIQUÉFIÉS",
    tdgClass: "2.1",
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "115",
  },
  "UN1005": {
    unNumber: "1005",
    properShippingName: "AMMONIA, ANHYDROUS",
    properShippingNameFr: "AMMONIAC ANHYDRE",
    tdgClass: "2.3",
    subsidiaryClass: "8",
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "125",
  },
  "UN1830": {
    unNumber: "1830",
    properShippingName: "SULPHURIC ACID",
    properShippingNameFr: "ACIDE SULFURIQUE",
    tdgClass: "8",
    packagingGroup: "II",
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "137",
  },
  "UN2794": {
    unNumber: "2794",
    properShippingName: "BATTERIES, WET, FILLED WITH ACID",
    properShippingNameFr: "ACCUMULATEURS ÉLECTRIQUES REMPLIS D'ÉLECTROLYTE LIQUIDE ACIDE",
    tdgClass: "8",
    packagingGroup: "III",
    canutecNumber: CANUTEC_EMERGENCY.primaryNumeric,
    ergGuideNumber: "154",
  },
};

// ── TDG Validation ──
export interface TDGValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  tdgClass?: typeof TDG_CLASSES[string];
  classification?: TDGClassification;
  requiredPermits: ProvincePermit[];
}

export function validateTDGCompliance(
  shipment: {
    unNumber?: string;
    hazmatClass?: string;
    origin?: { country?: string; state?: string };
    destination?: { country?: string; state?: string };
    weight?: number;
    packagingGroup?: string;
  },
  routeProvinces: string[] = []
): TDGValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredPermits: ProvincePermit[] = [];

  // Must have UN number
  if (!shipment.unNumber) {
    errors.push("UN number required for TDG shipping document");
  }

  // Must have class
  if (!shipment.hazmatClass) {
    errors.push("TDG primary class required");
  }

  // Lookup classification
  const classification = shipment.unNumber ? TDG_COMMODITY_MAP[`UN${shipment.unNumber}`] : undefined;
  const tdgClass = shipment.hazmatClass ? TDG_CLASSES[shipment.hazmatClass] : undefined;

  if (!tdgClass && shipment.hazmatClass) {
    errors.push(`Unknown TDG class: ${shipment.hazmatClass}`);
  }

  // Packaging group validation
  if (shipment.packagingGroup && !["I", "II", "III"].includes(shipment.packagingGroup)) {
    errors.push(`Invalid packing group: ${shipment.packagingGroup}. Must be I, II, or III`);
  }

  // Check if limited/excepted quantity applies
  if (shipment.weight && shipment.weight < 500 && classification?.limitedQuantityIndex) {
    warnings.push(`Shipment may qualify for TDG Limited Quantity exemption (Index: ${classification.limitedQuantityIndex})`);
  }

  // Province permit checks
  for (const prov of routeProvinces) {
    const permit = PROVINCE_PERMITS.find(p => p.provinceCode === prov);
    if (permit?.permitRequired) {
      requiredPermits.push(permit);
    }
  }

  // Special provisions
  if (classification?.specialProvisions?.length) {
    warnings.push(`Special provisions apply: ${classification.specialProvisions.join(", ")}`);
  }

  // Bilingual requirement check for Quebec
  if (routeProvinces.includes("QC")) {
    warnings.push("Quebec route: French-language documentation is mandatory (TDG Act s. 5)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    tdgClass,
    classification,
    requiredPermits,
  };
}

// ── TDG Document Generator ──
export function generateTDGShippingDescription(classification: TDGClassification): { en: string; fr: string } {
  const pgSuffix = classification.packagingGroup ? `, PG ${classification.packagingGroup}` : "";
  return {
    en: `UN${classification.unNumber}, ${classification.properShippingName}, ${classification.tdgClass}${classification.subsidiaryClass ? ` (${classification.subsidiaryClass})` : ""}${pgSuffix}`,
    fr: `UN${classification.unNumber}, ${classification.properShippingNameFr}, ${classification.tdgClass}${classification.subsidiaryClass ? ` (${classification.subsidiaryClass})` : ""}${pgSuffix}`,
  };
}
