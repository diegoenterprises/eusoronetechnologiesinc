/**
 * DOCUMENT CENTER — Role-Based Document Requirements Seed
 * Maps document types to roles with blocking/priority/condition logic
 *
 * conditionType values:
 *   'HAZMAT'   — user operates any hazmat trailer (liquid_tank, gas_tank, hazmat_van, cryogenic)
 *   'TANKER'   — user operates tanker trailers (liquid_tank, gas_tank, cryogenic)
 *   'REEFER'   — user operates reefer trailers
 *   'OVERSIZE'   — user operates flatbed (oversize/overweight loads)
 *   'BULK'       — user operates dry bulk / hopper trailers
 *   'FOOD_GRADE' — user operates food-grade liquid tankers (milk, juice, oil)
 *
 * The calculateDocumentAwareness function reads the user's trailerTypes
 * (stored in registration metadata → equipmentTypes) and resolves each
 * conditionType to true/false before filtering requirements.
 */

/**
 * Maps trailer type IDs → which condition flags they activate.
 * Consumed by calculateDocumentAwareness at runtime.
 */
export const TRAILER_TYPE_CONDITIONS: Record<string, string[]> = {
  liquid_tank:      ['HAZMAT', 'TANKER'],
  gas_tank:         ['HAZMAT', 'TANKER'],
  cryogenic:        ['HAZMAT', 'TANKER', 'CRYOGENIC'],
  hazmat_van:       ['HAZMAT'],
  food_grade_tank:  ['TANKER', 'FOOD_GRADE'],
  water_tank:       ['TANKER', 'WATER'],
  reefer:           ['REEFER'],
  flatbed:          ['OVERSIZE'],
  bulk_hopper:      ['BULK'],
  dry_van:          [],
};

export const documentRequirementsSeed = [
  // ═══════════════════════════════════════════════════════════════
  // DRIVER (Company Employee - W2)
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'CDL', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MEDICAL_CERT', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MVR', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'PSP_REPORT', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'DOT_DRUG_TEST', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'CLEARINGHOUSE_QUERY', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'DRIVER_APPLICATION', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'EMPLOYMENT_HISTORY', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ROAD_TEST_CERT', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 7 },
  { documentTypeId: 'W4', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'I9', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'EMPLOYMENT_AGREEMENT', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BACKGROUND_CHECK_AUTH', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 14 },
  { documentTypeId: 'EMERGENCY_CONTACT', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: false, priority: 3 },
  { documentTypeId: 'HANDBOOK_ACK', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: false, priority: 3 },
  { documentTypeId: 'ELD_TRAINING', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 30 },
  { documentTypeId: 'DVIR_TRAINING', requiredForRole: 'DRIVER', requiredForEmploymentType: 'W2_EMPLOYEE', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 30 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  // Driver — hazmat trailer conditionals
  { documentTypeId: 'HAZMAT_ENDORSEMENT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'TWIC', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  // Driver — tanker trailer conditionals (liquid_tank, gas_tank, cryogenic)
  { documentTypeId: 'TANKER_ENDORSEMENT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },
  // Driver — reefer trailer conditionals
  { documentTypeId: 'FOOD_SAFETY_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'REEFER', conditionValue: true },
  // Driver — flatbed/oversize trailer conditionals
  { documentTypeId: 'OVERSIZE_PERMIT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'OVERSIZE', conditionValue: true },
  // Driver — food-grade tanker conditionals (milk, juice, oil)
  { documentTypeId: 'FOOD_SAFETY_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'FOOD_GRADE', conditionValue: true },
  // Driver — tanker inspection conditionals (all tank trailers)
  { documentTypeId: 'CARGO_TANK_TEST', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },
  { documentTypeId: 'TANK_WASHOUT_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'TANKER', conditionValue: true },
  // Driver — cryogenic-specific conditionals
  { documentTypeId: 'CRYOGENIC_HANDLING_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'CRYOGENIC', conditionValue: true },
  { documentTypeId: 'PRESSURE_RELIEF_TEST', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'CRYOGENIC', conditionValue: true },
  // Driver — flatbed/oversize additional conditionals
  { documentTypeId: 'LOAD_SECUREMENT_TRAINING', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'OVERSIZE', conditionValue: true },
  { documentTypeId: 'ROUTE_SURVEY', requiredForRole: 'DRIVER', isRequired: false, isBlocking: false, priority: 3, conditionType: 'OVERSIZE', conditionValue: true },
  // Driver — dry bulk/hopper conditionals
  { documentTypeId: 'BULK_LOADING_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'BULK', conditionValue: true },
  // Driver — water tank conditionals
  { documentTypeId: 'POTABLE_WATER_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'WATER', conditionValue: true },
  { documentTypeId: 'WATER_QUALITY_TEST', requiredForRole: 'DRIVER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'WATER', conditionValue: true },

  // ═══════════════════════════════════════════════════════════════
  // OWNER_OPERATOR (1099 Independent Contractor)
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'CDL', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MEDICAL_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MVR', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'PSP_REPORT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'DOT_DRUG_TEST', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'CLEARINGHOUSE_QUERY', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'IC_AGREEMENT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'DRIVER_APPLICATION', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'EMPLOYMENT_HISTORY', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ROAD_TEST_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 7 },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 14 },
  { documentTypeId: 'VOIDED_CHECK', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, gracePeriodDays: 14 },
  { documentTypeId: 'EMERGENCY_CONTACT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 3 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  // O/O Vehicle docs
  { documentTypeId: 'VEHICLE_REGISTRATION', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'VEHICLE_TITLE', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'ANNUAL_INSPECTION', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'AUTO_LIABILITY', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'CARGO_INSURANCE', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'FORM_2290', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'IFTA_LICENSE', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'IRP_CAB_CARD', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1 },
  // O/O — hazmat trailer conditionals
  { documentTypeId: 'HAZMAT_ENDORSEMENT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'TWIC', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_REGISTRATION', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  // O/O — tanker trailer conditionals
  { documentTypeId: 'TANKER_ENDORSEMENT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },
  // O/O — hazmat security plan (O/O with own authority needs this)
  { documentTypeId: 'HAZMAT_SECURITY_PLAN', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'EPA_ID', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'HAZMAT', conditionValue: true },
  // O/O — reefer trailer conditionals
  { documentTypeId: 'FOOD_SAFETY_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'REEFER', conditionValue: true },
  // O/O — flatbed/oversize trailer conditionals
  { documentTypeId: 'OVERSIZE_PERMIT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'OVERSIZE', conditionValue: true },
  // O/O — food-grade tanker conditionals (milk, juice, oil)
  { documentTypeId: 'FOOD_SAFETY_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'FOOD_GRADE', conditionValue: true },
  { documentTypeId: 'KOSHER_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: false, isBlocking: false, priority: 3, conditionType: 'FOOD_GRADE', conditionValue: true },
  { documentTypeId: 'ORGANIC_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: false, isBlocking: false, priority: 3, conditionType: 'FOOD_GRADE', conditionValue: true },
  // O/O — tanker inspection conditionals (all tank trailers)
  { documentTypeId: 'CARGO_TANK_TEST', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },
  { documentTypeId: 'TANK_WASHOUT_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'TANKER', conditionValue: true },
  // O/O — cryogenic-specific conditionals
  { documentTypeId: 'CRYOGENIC_HANDLING_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'CRYOGENIC', conditionValue: true },
  { documentTypeId: 'PRESSURE_RELIEF_TEST', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'CRYOGENIC', conditionValue: true },
  // O/O — flatbed/oversize additional conditionals
  { documentTypeId: 'LOAD_SECUREMENT_TRAINING', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'OVERSIZE', conditionValue: true },
  { documentTypeId: 'ROUTE_SURVEY', requiredForRole: 'OWNER_OPERATOR', isRequired: false, isBlocking: false, priority: 3, conditionType: 'OVERSIZE', conditionValue: true },
  // O/O — dry bulk/hopper conditionals
  { documentTypeId: 'BULK_LOADING_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'BULK', conditionValue: true },
  { documentTypeId: 'HOPPER_INSPECTION', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'BULK', conditionValue: true },
  // O/O — water tank conditionals
  { documentTypeId: 'POTABLE_WATER_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'WATER', conditionValue: true },
  { documentTypeId: 'WATER_QUALITY_TEST', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: false, priority: 2, conditionType: 'WATER', conditionValue: true },
  // O/O — reefer pharma conditional
  { documentTypeId: 'PHARMA_GDP_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: false, isBlocking: false, priority: 3, conditionType: 'REEFER', conditionValue: true },

  // ═══════════════════════════════════════════════════════════════
  // CATALYST (Motor Carrier Company — called "Catalyst" in EusoTrip)
  // A catalyst may operate MULTIPLE trailer types. conditionType is
  // resolved from the company's registered equipmentTypes array.
  // ═══════════════════════════════════════════════════════════════
  // --- Base docs (all catalysts regardless of trailer type) ---
  { documentTypeId: 'USDOT_NUMBER', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MC_AUTHORITY', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MCS150', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'BOC3', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'UCR', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'AUTO_LIABILITY', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'CARGO_INSURANCE', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'GENERAL_LIABILITY', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'WORKERS_COMP', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'VOIDED_CHECK', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'IFTA_LICENSE', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'IRP_CAB_CARD', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'DRUG_ALCOHOL_POLICY', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'BROKER_CARRIER_AGREEMENT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  // --- Catalyst hazmat trailer conditionals (liquid_tank | gas_tank | hazmat_van | cryogenic) ---
  { documentTypeId: 'HAZMAT_REGISTRATION', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_SAFETY_PERMIT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_SECURITY_PLAN', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  // --- Catalyst tanker trailer conditionals (liquid_tank | gas_tank | cryogenic) ---
  { documentTypeId: 'TANKER_ENDORSEMENT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },
  // --- Catalyst reefer trailer conditionals ---
  { documentTypeId: 'FOOD_SAFETY_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'REEFER', conditionValue: true },
  // --- Catalyst flatbed/oversize trailer conditionals ---
  { documentTypeId: 'OVERSIZE_PERMIT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'OVERSIZE', conditionValue: true },
  // --- Catalyst hazmat EPA ID (hazardous waste transport) ---
  { documentTypeId: 'EPA_ID', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'HAZMAT', conditionValue: true },
  // --- Catalyst food-grade tanker conditionals ---
  { documentTypeId: 'FOOD_SAFETY_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'FOOD_GRADE', conditionValue: true },
  { documentTypeId: 'KOSHER_CERT', requiredForRole: 'CATALYST', isRequired: false, isBlocking: false, priority: 3, conditionType: 'FOOD_GRADE', conditionValue: true },
  { documentTypeId: 'ORGANIC_CERT', requiredForRole: 'CATALYST', isRequired: false, isBlocking: false, priority: 3, conditionType: 'FOOD_GRADE', conditionValue: true },
  // --- Catalyst tanker inspection conditionals (all tank trailers) ---
  { documentTypeId: 'CARGO_TANK_TEST', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },
  { documentTypeId: 'TANK_WASHOUT_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'TANKER', conditionValue: true },
  // --- Catalyst cryogenic-specific conditionals ---
  { documentTypeId: 'CRYOGENIC_HANDLING_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: true, priority: 1, conditionType: 'CRYOGENIC', conditionValue: true },
  { documentTypeId: 'PRESSURE_RELIEF_TEST', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'CRYOGENIC', conditionValue: true },
  // --- Catalyst flatbed/oversize additional conditionals ---
  { documentTypeId: 'LOAD_SECUREMENT_TRAINING', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'OVERSIZE', conditionValue: true },
  { documentTypeId: 'ROUTE_SURVEY', requiredForRole: 'CATALYST', isRequired: false, isBlocking: false, priority: 3, conditionType: 'OVERSIZE', conditionValue: true },
  // --- Catalyst dry bulk/hopper conditionals ---
  { documentTypeId: 'BULK_LOADING_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'BULK', conditionValue: true },
  { documentTypeId: 'HOPPER_INSPECTION', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'BULK', conditionValue: true },
  // --- Catalyst water tank conditionals ---
  { documentTypeId: 'POTABLE_WATER_CERT', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'WATER', conditionValue: true },
  { documentTypeId: 'WATER_QUALITY_TEST', requiredForRole: 'CATALYST', isRequired: true, isBlocking: false, priority: 2, conditionType: 'WATER', conditionValue: true },
  // --- Catalyst reefer pharma conditional ---
  { documentTypeId: 'PHARMA_GDP_CERT', requiredForRole: 'CATALYST', isRequired: false, isBlocking: false, priority: 3, conditionType: 'REEFER', conditionValue: true },

  // ═══════════════════════════════════════════════════════════════
  // BROKER
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'BROKER_AUTHORITY', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BOC3', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'SURETY_BOND', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'UCR', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'GENERAL_LIABILITY', requiredForRole: 'BROKER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'BROKER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // ═══════════════════════════════════════════════════════════════
  // SHIPPER
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'W9', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'SHIPPER_AGREEMENT', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'PRIVACY_POLICY_ACK', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'VOIDED_CHECK', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'GENERAL_LIABILITY', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'CARGO_INSURANCE', requiredForRole: 'SHIPPER', isRequired: false, isBlocking: false, priority: 3 },
  { documentTypeId: 'NDA', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 3 },
  // Shipper hazmat conditionals (ships hazmat products)
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_BOL_TEMPLATE', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2, conditionType: 'HAZMAT', conditionValue: true },

  // ═══════════════════════════════════════════════════════════════
  // DISPATCH (role stored as "DISPATCH" in DB)
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'DISPATCH', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'DISPATCH', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'DISPATCH', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  // Dispatch hazmat conditional
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'DISPATCH', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE_OFFICER / SAFETY_MANAGER
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'COMPLIANCE_OFFICER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'COMPLIANCE_OFFICER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'COMPLIANCE_OFFICER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'SAFETY_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'SAFETY_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'SAFETY_MANAGER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // ═══════════════════════════════════════════════════════════════
  // LUMPER
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'W9', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'IC_AGREEMENT', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'LUMPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'BACKGROUND_CHECK_AUTH', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // ═══════════════════════════════════════════════════════════════
  // FACTORING (Factoring Company)
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'FACTORING', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'FACTORING', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'FACTORING_AGREEMENT', requiredForRole: 'FACTORING', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'NDA', requiredForRole: 'FACTORING', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'FACTORING', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // ═══════════════════════════════════════════════════════════════
  // ESCORT (Pilot/Escort Vehicle Operator)
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'CDL', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'VEHICLE_REGISTRATION', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'AUTO_LIABILITY', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'IC_AGREEMENT', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BACKGROUND_CHECK_AUTH', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'ESCORT', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'ESCORT', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // ═══════════════════════════════════════════════════════════════
  // TERMINAL_MANAGER (Terminal/Facility Manager)
  // ═══════════════════════════════════════════════════════════════
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'EPA_ID', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'GENERAL_LIABILITY', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'NDA', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  // Terminal hazmat conditionals (facilities handling hazmat)
  { documentTypeId: 'HAZMAT_SECURITY_PLAN', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_REGISTRATION', requiredForRole: 'TERMINAL_MANAGER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
];
