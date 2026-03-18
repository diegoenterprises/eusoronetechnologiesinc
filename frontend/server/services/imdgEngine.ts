/**
 * IMDG CODE ENGINE FOR MARITIME HAZMAT
 * International Maritime Dangerous Goods Code compliance engine.
 * Maritime equivalent of the DOT/ERG hazmat system used for trucking.
 *
 * Implements:
 *  - DOT-to-IMDG class mapping
 *  - IMDG segregation matrix (9x9, 4 segregation levels + X)
 *  - Marine pollutant identification per IMDG 2.10
 *  - EmS (Emergency Schedule) lookup per MSC.1/Circ.1588
 *  - Stowage category assignment (A-E, SW1-SW22)
 *  - Full IMDG validation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IMDGClassMapping {
  dotClass: string;
  imdgClass: string;
  label: string;
  placard: string;
  subsidiaryRisks?: string[];
}

export type SegregationLevel = 0 | 1 | 2 | 3 | 4 | 'X';

export interface EmSCode {
  fire: string;
  spillage: string;
  combined: string;
}

export interface StowageRequirement {
  category: string; // A-E
  specialProvisions: string[];
  onDeck: boolean;
  underDeck: boolean;
  description: string;
}

export interface IMDGValidationParams {
  hazmatClass: string;
  unNumber: string;
  packingGroup?: string;
  marinePollutant?: boolean;
  containerType?: string;
  stowageCategory?: string;
}

export interface IMDGValidationResult {
  compliant: boolean;
  issues: string[];
  requirements: string[];
  emsCode: EmSCode | null;
  segregation: Record<string, SegregationLevel>;
  marinePollutant: boolean;
  stowage: StowageRequirement | null;
}

// ---------------------------------------------------------------------------
// DOT-to-IMDG class mapping
// ---------------------------------------------------------------------------

const DOT_TO_IMDG: IMDGClassMapping[] = [
  { dotClass: '1.1', imdgClass: '1.1', label: 'Explosives - Mass explosion hazard', placard: 'EXPLOSIVE 1.1' },
  { dotClass: '1.2', imdgClass: '1.2', label: 'Explosives - Projection hazard', placard: 'EXPLOSIVE 1.2' },
  { dotClass: '1.3', imdgClass: '1.3', label: 'Explosives - Fire/minor blast/projection', placard: 'EXPLOSIVE 1.3' },
  { dotClass: '1.4', imdgClass: '1.4', label: 'Explosives - Minor hazard', placard: 'EXPLOSIVE 1.4' },
  { dotClass: '1.5', imdgClass: '1.5', label: 'Explosives - Very insensitive', placard: 'EXPLOSIVE 1.5' },
  { dotClass: '1.6', imdgClass: '1.6', label: 'Explosives - Extremely insensitive', placard: 'EXPLOSIVE 1.6' },
  { dotClass: '2.1', imdgClass: '2.1', label: 'Flammable Gas', placard: 'FLAMMABLE GAS' },
  { dotClass: '2.2', imdgClass: '2.2', label: 'Non-Flammable Non-Toxic Gas', placard: 'NON-FLAMMABLE GAS' },
  { dotClass: '2.3', imdgClass: '2.3', label: 'Toxic Gas', placard: 'TOXIC GAS' },
  { dotClass: '3', imdgClass: '3', label: 'Flammable Liquid', placard: 'FLAMMABLE LIQUID' },
  { dotClass: '4.1', imdgClass: '4.1', label: 'Flammable Solid', placard: 'FLAMMABLE SOLID' },
  { dotClass: '4.2', imdgClass: '4.2', label: 'Spontaneously Combustible', placard: 'SPONTANEOUSLY COMBUSTIBLE' },
  { dotClass: '4.3', imdgClass: '4.3', label: 'Dangerous When Wet', placard: 'DANGEROUS WHEN WET' },
  { dotClass: '5.1', imdgClass: '5.1', label: 'Oxidizing Substances', placard: 'OXIDIZER' },
  { dotClass: '5.2', imdgClass: '5.2', label: 'Organic Peroxides', placard: 'ORGANIC PEROXIDE' },
  { dotClass: '6.1', imdgClass: '6.1', label: 'Toxic Substances', placard: 'TOXIC' },
  { dotClass: '6.2', imdgClass: '6.2', label: 'Infectious Substances', placard: 'INFECTIOUS SUBSTANCE' },
  { dotClass: '7', imdgClass: '7', label: 'Radioactive Material', placard: 'RADIOACTIVE' },
  { dotClass: '8', imdgClass: '8', label: 'Corrosive Substances', placard: 'CORROSIVE' },
  { dotClass: '9', imdgClass: '9', label: 'Miscellaneous Dangerous Goods', placard: 'MISCELLANEOUS' },
];

// ---------------------------------------------------------------------------
// IMDG Segregation Matrix
// Levels: 1="Away from", 2="Separated from", 3="Separated by complete compartment",
//         4="Separated longitudinally by intervening complete compartment", X=see entries
// ---------------------------------------------------------------------------

const IMDG_CLASSES = ['1', '2.1', '2.2', '2.3', '3', '4.1', '4.2', '4.3', '5.1', '5.2', '6.1', '6.2', '7', '8', '9'] as const;

// Row-major matrix indexed by IMDG_CLASSES order
const SEGREGATION_MATRIX: SegregationLevel[][] = [
  //  1   2.1  2.2  2.3  3   4.1  4.2  4.3  5.1  5.2  6.1  6.2  7    8   9
  [ 'X',  4,   2,   4,   4,   4,   4,   4,   4,   4,   2,   4,   2,   4, 'X'], // 1
  [  4,  'X', 'X', 'X',  2,   1,   2,  'X',  2,   2,  'X', 'X',  2,  'X','X'], // 2.1
  [  2,  'X', 'X', 'X',  1,  'X',  1,  'X',  2,   2,  'X', 'X',  1,  'X','X'], // 2.2
  [  4,  'X', 'X', 'X',  2,  'X',  2,   1,   2,   2,  'X', 'X',  2,  'X','X'], // 2.3
  [  4,   2,   1,   2,  'X', 'X',  2,   1,   2,   2,  'X', 'X',  2,  'X','X'], // 3
  [  4,   1,  'X', 'X', 'X', 'X',  1,  'X',  2,   2,  'X', 'X',  2,   1, 'X'], // 4.1
  [  4,   2,   1,   2,   2,   1,  'X',  1,   2,   2,   1,  'X',  2,   1, 'X'], // 4.2
  [  4,  'X', 'X',  1,   1,  'X',  1,  'X',  2,   2,  'X', 'X',  2,   1, 'X'], // 4.3
  [  4,   2,   2,   2,   2,   2,   2,   2,  'X',  2,   1,  'X',  1,   2, 'X'], // 5.1
  [  4,   2,   2,   2,   2,   2,   2,   2,   2,  'X',  1,  'X',  2,   2, 'X'], // 5.2
  [  2,  'X', 'X', 'X', 'X', 'X',  1,  'X',  1,   1,  'X', 'X', 'X', 'X','X'], // 6.1
  [  4,  'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X','X'], // 6.2
  [  2,   2,   1,   2,   2,   2,   2,   2,   1,   2,  'X', 'X', 'X',  2, 'X'], // 7
  [  4,  'X', 'X', 'X', 'X',  1,   1,   1,   2,   2,  'X', 'X',  2,  'X','X'], // 8
  [ 'X','X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X','X'], // 9
];

// ---------------------------------------------------------------------------
// Marine Pollutants (IMDG Chapter 2.10)
// ---------------------------------------------------------------------------

const MARINE_POLLUTANT_UN_NUMBERS = new Set([
  'UN1203', // Gasoline / Motor spirit
  'UN1267', // Petroleum crude oil
  'UN1863', // Fuel, aviation, turbine engine (jet fuel)
  'UN1993', // Flammable liquid, n.o.s.
  'UN2055', // Styrene monomer, stabilized
  'UN2078', // Toluene diisocyanate
  'UN2215', // Maleic anhydride
  'UN2312', // Phenol, molten
  'UN2587', // Benzoquinone
  'UN2761', // Organochlorine pesticide, solid, toxic
  'UN2762', // Organochlorine pesticide, liquid, flammable, toxic
  'UN2810', // Toxic liquid, organic, n.o.s.
  'UN2903', // Pesticide, liquid, toxic, flammable
  'UN2927', // Toxic liquid, corrosive, organic, n.o.s.
  'UN3077', // Environmentally hazardous substance, solid, n.o.s.
  'UN3082', // Environmentally hazardous substance, liquid, n.o.s.
  'UN3295', // Hydrocarbons, liquid, n.o.s.
  'UN3334', // Aviation regulated liquid, n.o.s.
  'UN3432', // Polychlorinated biphenyls, solid
]);

// ---------------------------------------------------------------------------
// EmS (Emergency Schedule) codes — MSC.1/Circ.1588
// F = fire schedule, S = spillage schedule
// ---------------------------------------------------------------------------

const EMS_TABLE: Record<string, EmSCode> = {
  'UN1203': { fire: 'F-E', spillage: 'S-E', combined: 'F-E, S-E' },
  'UN1267': { fire: 'F-E', spillage: 'S-E', combined: 'F-E, S-E' },
  'UN1863': { fire: 'F-E', spillage: 'S-E', combined: 'F-E, S-E' },
  'UN1993': { fire: 'F-E', spillage: 'S-D', combined: 'F-E, S-D' },
  'UN1075': { fire: 'F-D', spillage: 'S-U', combined: 'F-D, S-U' }, // LPG
  'UN1049': { fire: 'F-D', spillage: 'S-U', combined: 'F-D, S-U' }, // Hydrogen compressed
  'UN1001': { fire: 'F-D', spillage: 'S-U', combined: 'F-D, S-U' }, // Acetylene dissolved
  'UN1005': { fire: 'F-C', spillage: 'S-R', combined: 'F-C, S-R' }, // Anhydrous ammonia
  'UN1017': { fire: 'F-C', spillage: 'S-R', combined: 'F-C, S-R' }, // Chlorine
  'UN1090': { fire: 'F-E', spillage: 'S-D', combined: 'F-E, S-D' }, // Acetone
  'UN1170': { fire: 'F-E', spillage: 'S-D', combined: 'F-E, S-D' }, // Ethanol
  'UN1230': { fire: 'F-E', spillage: 'S-D', combined: 'F-E, S-D' }, // Methanol
  'UN1263': { fire: 'F-E', spillage: 'S-E', combined: 'F-E, S-E' }, // Paint
  'UN1294': { fire: 'F-E', spillage: 'S-D', combined: 'F-E, S-D' }, // Toluene
  'UN1789': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Hydrochloric acid
  'UN1791': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Hypochlorite solution
  'UN1805': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Phosphoric acid
  'UN1823': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Sodium hydroxide solid
  'UN1824': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Sodium hydroxide solution
  'UN1830': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Sulfuric acid
  'UN1942': { fire: 'F-A', spillage: 'S-A', combined: 'F-A, S-A' }, // Ammonium nitrate
  'UN2014': { fire: 'F-A', spillage: 'S-Q', combined: 'F-A, S-Q' }, // Hydrogen peroxide >20%
  'UN2031': { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' }, // Nitric acid
  'UN2794': { fire: 'F-A', spillage: 'S-P', combined: 'F-A, S-P' }, // Batteries wet, acid
  'UN2912': { fire: 'F-A', spillage: 'S-I', combined: 'F-A, S-I' }, // Radioactive material low specific activity
  'UN3077': { fire: 'F-A', spillage: 'S-F', combined: 'F-A, S-F' },
  'UN3082': { fire: 'F-A', spillage: 'S-F', combined: 'F-A, S-F' },
  'UN3166': { fire: 'F-A', spillage: 'S-W', combined: 'F-A, S-W' }, // Vehicle, engine
  'UN3480': { fire: 'F-A', spillage: 'S-I', combined: 'F-A, S-I' }, // Lithium ion batteries
  'UN3481': { fire: 'F-A', spillage: 'S-I', combined: 'F-A, S-I' }, // Lithium ion batteries in equipment
};

// Default EmS by IMDG class (fallback when UN not in table)
const EMS_BY_CLASS: Record<string, EmSCode> = {
  '1':   { fire: 'F-B', spillage: 'S-A', combined: 'F-B, S-A' },
  '2.1': { fire: 'F-D', spillage: 'S-U', combined: 'F-D, S-U' },
  '2.2': { fire: 'F-C', spillage: 'S-V', combined: 'F-C, S-V' },
  '2.3': { fire: 'F-C', spillage: 'S-R', combined: 'F-C, S-R' },
  '3':   { fire: 'F-E', spillage: 'S-D', combined: 'F-E, S-D' },
  '4.1': { fire: 'F-A', spillage: 'S-G', combined: 'F-A, S-G' },
  '4.2': { fire: 'F-A', spillage: 'S-J', combined: 'F-A, S-J' },
  '4.3': { fire: 'F-G', spillage: 'S-N', combined: 'F-G, S-N' },
  '5.1': { fire: 'F-A', spillage: 'S-Q', combined: 'F-A, S-Q' },
  '5.2': { fire: 'F-J', spillage: 'S-R', combined: 'F-J, S-R' },
  '6.1': { fire: 'F-A', spillage: 'S-A', combined: 'F-A, S-A' },
  '6.2': { fire: 'F-A', spillage: 'S-A', combined: 'F-A, S-A' },
  '7':   { fire: 'F-A', spillage: 'S-I', combined: 'F-A, S-I' },
  '8':   { fire: 'F-A', spillage: 'S-B', combined: 'F-A, S-B' },
  '9':   { fire: 'F-A', spillage: 'S-F', combined: 'F-A, S-F' },
};

// ---------------------------------------------------------------------------
// Stowage categories (IMDG 7.1.3)
// ---------------------------------------------------------------------------

interface StowageCategoryDef {
  category: string;
  onDeck: boolean;
  underDeck: boolean;
  description: string;
}

const STOWAGE_CATEGORIES: Record<string, StowageCategoryDef> = {
  A: { category: 'A', onDeck: true, underDeck: true, description: 'On deck or under deck in cargo transport units' },
  B: { category: 'B', onDeck: true, underDeck: true, description: 'On deck or under deck, but protected from sources of heat' },
  C: { category: 'C', onDeck: true, underDeck: false, description: 'On deck only, in cargo transport units' },
  D: { category: 'D', onDeck: true, underDeck: false, description: 'On deck only, protected from direct sunlight' },
  E: { category: 'E', onDeck: true, underDeck: false, description: 'On deck only, protected from heat and direct sunlight' },
};

// Special stowage provisions
const SPECIAL_STOWAGE_PROVISIONS: Record<string, string> = {
  SW1: 'Protected from sources of heat when stowed under deck',
  SW2: 'Clear of living quarters',
  SW3: 'Shall be transported in a mechanically refrigerated cargo transport unit',
  SW4: 'Shall be stowed under deck or in enclosed cargo transport units on deck',
  SW5: 'As remote as practicable from magazines and living quarters',
  SW6: 'Not permitted to be stowed on deck on passenger ships',
  SW7: 'Only with the approval of the competent authority on a case-by-case basis',
  SW8: 'Not in the same hold or cargo transport unit as foodstuffs',
  SW9: 'Protected from direct sunlight',
  SW10: 'Protected from any source of ignition',
  SW11: 'Temperature control provisions shall apply',
  SW12: 'In well-ventilated cargo spaces or on deck',
  SW13: 'In a dry cargo space or under deck in a container ship',
  SW14: 'Only in or on a container ship',
  SW15: 'Keep dry',
  SW16: 'Shall be stowed in well-ventilated spaces',
  SW17: 'Stowage on deck preferred; if under deck, well-ventilated',
  SW18: 'Shaded from direct sunlight; stowed in cool place',
  SW19: 'Keep as cool as reasonably practicable',
  SW20: 'Not to be stowed together with explosives of Class 1 Div 1.4, Compatibility Group S',
  SW21: 'Not to be stowed together with combustible material',
  SW22: 'For metal IBCs, stowage under deck only in closed cargo transport units on container ships',
};

// UN-to-stowage mapping (common commodities)
const STOWAGE_BY_UN: Record<string, { category: string; provisions: string[] }> = {
  'UN1203': { category: 'A', provisions: ['SW2'] },
  'UN1267': { category: 'A', provisions: ['SW2'] },
  'UN1863': { category: 'A', provisions: ['SW2'] },
  'UN1993': { category: 'B', provisions: [] },
  'UN1075': { category: 'D', provisions: ['SW10'] },
  'UN3077': { category: 'A', provisions: ['SW8'] },
  'UN3082': { category: 'A', provisions: ['SW8'] },
  'UN3480': { category: 'C', provisions: ['SW9', 'SW19'] },
  'UN3481': { category: 'A', provisions: ['SW9', 'SW19'] },
  'UN1942': { category: 'B', provisions: ['SW15', 'SW21'] },
};

// Default stowage by class
const STOWAGE_BY_CLASS: Record<string, { category: string; provisions: string[] }> = {
  '1':   { category: 'E', provisions: ['SW5'] },
  '2.1': { category: 'D', provisions: ['SW10'] },
  '2.2': { category: 'A', provisions: [] },
  '2.3': { category: 'D', provisions: ['SW2', '16'] },
  '3':   { category: 'A', provisions: ['SW2'] },
  '4.1': { category: 'B', provisions: [] },
  '4.2': { category: 'B', provisions: ['SW16'] },
  '4.3': { category: 'D', provisions: ['SW15'] },
  '5.1': { category: 'B', provisions: ['SW21'] },
  '5.2': { category: 'D', provisions: ['SW9', 'SW11'] },
  '6.1': { category: 'B', provisions: ['SW2'] },
  '6.2': { category: 'A', provisions: ['SW2', 'SW8'] },
  '7':   { category: 'A', provisions: ['SW5'] },
  '8':   { category: 'B', provisions: [] },
  '9':   { category: 'A', provisions: [] },
};

// ---------------------------------------------------------------------------
// Engine class
// ---------------------------------------------------------------------------

class IMDGEngine {
  // ---- DOT to IMDG mapping ----

  mapDotToIMDG(dotClass: string): IMDGClassMapping | null {
    return DOT_TO_IMDG.find(m => m.dotClass === dotClass) ?? null;
  }

  getIMDGClass(dotClass: string): string | null {
    return this.mapDotToIMDG(dotClass)?.imdgClass ?? null;
  }

  // ---- Segregation ----

  private classIndex(imdgClass: string): number {
    return IMDG_CLASSES.indexOf(imdgClass as typeof IMDG_CLASSES[number]);
  }

  getSegregationLevel(classA: string, classB: string): SegregationLevel {
    const a = this.classIndex(classA);
    const b = this.classIndex(classB);
    if (a === -1 || b === -1) return 'X';
    return SEGREGATION_MATRIX[a][b];
  }

  getSegregationRequirements(imdgClass: string): Record<string, SegregationLevel> {
    const idx = this.classIndex(imdgClass);
    if (idx === -1) return {};
    const result: Record<string, SegregationLevel> = {};
    IMDG_CLASSES.forEach((cls, i) => {
      result[cls] = SEGREGATION_MATRIX[idx][i];
    });
    return result;
  }

  describeSegregationLevel(level: SegregationLevel): string {
    switch (level) {
      case 0: return 'No segregation required';
      case 1: return 'Away from — different compartment or hold';
      case 2: return 'Separated from — different compartment with intervening barrier';
      case 3: return 'Separated by a complete compartment or hold';
      case 4: return 'Separated longitudinally by an intervening complete compartment or hold';
      case 'X': return 'Refer to individual IMDG schedule entries';
      default: return 'Unknown';
    }
  }

  // ---- Marine pollutant ----

  isMarinePollutant(unNumber: string): boolean {
    const normalized = unNumber.toUpperCase().startsWith('UN')
      ? unNumber.toUpperCase()
      : `UN${unNumber}`;
    return MARINE_POLLUTANT_UN_NUMBERS.has(normalized);
  }

  // ---- EmS lookup ----

  getEmSCode(unNumber: string, fallbackClass?: string): EmSCode | null {
    const normalized = unNumber.toUpperCase().startsWith('UN')
      ? unNumber.toUpperCase()
      : `UN${unNumber}`;
    if (EMS_TABLE[normalized]) return EMS_TABLE[normalized];
    if (fallbackClass && EMS_BY_CLASS[fallbackClass]) return EMS_BY_CLASS[fallbackClass];
    return null;
  }

  // ---- Stowage ----

  getStowageRequirement(unNumber: string, imdgClass: string): StowageRequirement {
    const normalized = unNumber.toUpperCase().startsWith('UN')
      ? unNumber.toUpperCase()
      : `UN${unNumber}`;

    const specific = STOWAGE_BY_UN[normalized];
    const lookup = specific ?? STOWAGE_BY_CLASS[imdgClass] ?? { category: 'A', provisions: [] };
    const catDef = STOWAGE_CATEGORIES[lookup.category] ?? STOWAGE_CATEGORIES['A'];

    return {
      category: catDef.category,
      specialProvisions: lookup.provisions,
      onDeck: catDef.onDeck,
      underDeck: catDef.underDeck,
      description: catDef.description,
    };
  }

  // ---- Full validation ----

  validateIMDGCompliance(params: IMDGValidationParams): IMDGValidationResult {
    const issues: string[] = [];
    const requirements: string[] = [];

    const imdgClass = this.getIMDGClass(params.hazmatClass) ?? params.hazmatClass;

    // Validate class is known
    if (this.classIndex(imdgClass) === -1) {
      issues.push(`Unknown IMDG class: ${imdgClass}. Cannot validate segregation or stowage.`);
    }

    // UN number format
    const un = params.unNumber.toUpperCase().startsWith('UN')
      ? params.unNumber.toUpperCase()
      : `UN${params.unNumber}`;
    if (!/^UN\d{4}$/.test(un)) {
      issues.push(`Invalid UN number format: ${params.unNumber}. Must be UN followed by 4 digits.`);
    }

    // Packing group
    if (params.packingGroup) {
      const validPG = ['I', 'II', 'III'];
      if (!validPG.includes(params.packingGroup.toUpperCase())) {
        issues.push(`Invalid packing group: ${params.packingGroup}. Must be I, II, or III.`);
      }
    }

    // Marine pollutant
    const mp = params.marinePollutant ?? this.isMarinePollutant(un);
    if (mp) {
      requirements.push('MARINE POLLUTANT mark required on package and cargo transport unit');
      requirements.push('Marine pollutant must be declared on Dangerous Goods Declaration (DGD)');
      if (!params.marinePollutant && this.isMarinePollutant(un)) {
        issues.push(`UN ${un} is a known marine pollutant but was not declared as such`);
      }
    }

    // EmS
    const emsCode = this.getEmSCode(un, imdgClass);
    if (emsCode) {
      requirements.push(`EmS code: ${emsCode.combined}`);
    } else {
      issues.push('No EmS code found — crew must have emergency procedures for this substance');
    }

    // Segregation
    const segregation = this.classIndex(imdgClass) !== -1
      ? this.getSegregationRequirements(imdgClass)
      : {};

    // Stowage
    const stowage = this.getStowageRequirement(un, imdgClass);
    requirements.push(`Stowage category ${stowage.category}: ${stowage.description}`);
    if (!stowage.underDeck) {
      requirements.push('MUST be stowed ON DECK only');
    }
    for (const sp of stowage.specialProvisions) {
      const desc = SPECIAL_STOWAGE_PROVISIONS[sp];
      if (desc) requirements.push(`${sp}: ${desc}`);
    }

    // Container type checks
    if (params.containerType) {
      const ct = params.containerType.toUpperCase();
      if (['4.2', '4.3', '5.2'].includes(imdgClass) && ct === 'OPEN-TOP') {
        issues.push(`Open-top containers not suitable for IMDG class ${imdgClass}`);
      }
      if (imdgClass === '2.1' && ct === 'FLAT-RACK') {
        issues.push('Flat-rack containers not permitted for flammable gases');
      }
    }

    // Stowage category override check
    if (params.stowageCategory) {
      const provided = params.stowageCategory.toUpperCase();
      if (!STOWAGE_CATEGORIES[provided]) {
        issues.push(`Invalid stowage category: ${provided}. Must be A-E.`);
      } else if (provided < stowage.category) {
        issues.push(`Declared stowage category ${provided} is less restrictive than required ${stowage.category}`);
      }
    }

    // General requirements
    requirements.push('Dangerous Goods Declaration (DGD) required per IMDG 5.4');
    requirements.push('Container/vehicle packing certificate required per IMDG 5.4.2');
    if (['1', '5.2', '4.1'].includes(imdgClass)) {
      requirements.push('Competent authority approval may be required');
    }

    return {
      compliant: issues.length === 0,
      issues,
      requirements,
      emsCode,
      segregation,
      marinePollutant: mp,
      stowage,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const imdgEngine = new IMDGEngine();
export default imdgEngine;
