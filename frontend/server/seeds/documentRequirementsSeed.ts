/**
 * DOCUMENT CENTER — Role-Based Document Requirements Seed
 * Maps document types to roles with blocking/priority/condition logic
 */

export const documentRequirementsSeed = [
  // DRIVER (Company Employee - W2)
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
  // Driver Hazmat conditionals
  { documentTypeId: 'HAZMAT_ENDORSEMENT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'TWIC', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'TANKER_ENDORSEMENT', requiredForRole: 'DRIVER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'TANKER', conditionValue: true },

  // OWNER_OPERATOR (1099 Independent Contractor)
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
  // O/O Hazmat
  { documentTypeId: 'HAZMAT_ENDORSEMENT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'TWIC', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_REGISTRATION', requiredForRole: 'OWNER_OPERATOR', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },

  // CARRIER (Motor Carrier Company)
  { documentTypeId: 'USDOT_NUMBER', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MC_AUTHORITY', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'MCS150', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'BOC3', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'UCR', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'AUTO_LIABILITY', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'CARGO_INSURANCE', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'GENERAL_LIABILITY', requiredForRole: 'CARRIER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'WORKERS_COMP', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'CARRIER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'VOIDED_CHECK', requiredForRole: 'CARRIER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'IFTA_LICENSE', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'IRP_CAB_CARD', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'DRUG_ALCOHOL_POLICY', requiredForRole: 'CARRIER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'BROKER_CARRIER_AGREEMENT', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  // Carrier Hazmat
  { documentTypeId: 'HAZMAT_REGISTRATION', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_SAFETY_PERMIT', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },
  { documentTypeId: 'HAZMAT_SECURITY_PLAN', requiredForRole: 'CARRIER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },

  // BROKER
  { documentTypeId: 'BROKER_AUTHORITY', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BOC3', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'SURETY_BOND', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'UCR', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1 },
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'GENERAL_LIABILITY', requiredForRole: 'BROKER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'BROKER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'BROKER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // SHIPPER
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'W9', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'SHIPPER_AGREEMENT', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'HAZMAT_TRAINING_CERT', requiredForRole: 'SHIPPER', isRequired: true, isBlocking: true, priority: 1, conditionType: 'HAZMAT', conditionValue: true },

  // DISPATCHER / FLEET_MANAGER
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'DISPATCHER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'DISPATCHER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'DISPATCHER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'FLEET_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'FLEET_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'FLEET_MANAGER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // COMPLIANCE_OFFICER / SAFETY_MANAGER
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'COMPLIANCE_OFFICER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'COMPLIANCE_OFFICER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'COMPLIANCE_OFFICER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'BACKGROUND_CHECK_RESULT', requiredForRole: 'SAFETY_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'NDA', requiredForRole: 'SAFETY_MANAGER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'SAFETY_MANAGER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // LUMPER
  { documentTypeId: 'W9', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'IC_AGREEMENT', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'ACH_AUTH', requiredForRole: 'LUMPER', isRequired: true, isBlocking: false, priority: 2 },
  { documentTypeId: 'BACKGROUND_CHECK_AUTH', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'LUMPER', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },

  // FACTORING_COMPANY
  { documentTypeId: 'EIN_VERIFICATION', requiredForRole: 'FACTORING_COMPANY', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'W9', requiredForRole: 'FACTORING_COMPANY', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'FACTORING_AGREEMENT', requiredForRole: 'FACTORING_COMPANY', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'NDA', requiredForRole: 'FACTORING_COMPANY', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
  { documentTypeId: 'TERMS_OF_SERVICE', requiredForRole: 'FACTORING_COMPANY', isRequired: true, isBlocking: true, priority: 1, requiredAtOnboarding: true },
];
