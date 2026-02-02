/**
 * SERVICES INDEX
 * Central export for all external integration services
 */

// FMCSA SAFER System
export { fmcsaService } from './fmcsa';
export type {
  FMCSACarrierInfo,
  FMCSASafetyRating,
  FMCSAAuthority,
  FMCSAInsurance,
  CarrierVerificationResult,
} from './fmcsa';

// ELD Integration
export { eldService } from './eld';
export type {
  DutyStatus,
  ELDDriverLog,
  ELDLogEntry,
  ELDViolation,
  ELDVehicleInfo,
  HOSSummary,
} from './eld';

// Clearinghouse Integration
export { clearinghouseService } from './clearinghouse';
export type {
  QueryType,
  QueryStatus,
  ViolationStatus,
  ClearinghouseQuery,
  ClearinghouseResult,
  ClearinghouseViolation,
  ReturnToDutyStatus,
  DriverConsent,
  QueryStats,
} from './clearinghouse';

// BOL (Bill of Lading) Generation
export { bolService } from './bol';
export type {
  BOLType,
  BOLStatus,
  BOLDocument,
  BOLGenerationInput,
  BOLItem,
  BOLParty,
  HazmatInfo,
  SignatureInfo,
} from './bol';

// Driver Settlement Calculation
export { settlementService } from './settlement';
export type {
  PayStructure,
  SettlementStatus,
  DeductionType,
  DriverPayProfile,
  LoadSettlementItem,
  AccessorialCharge,
  Deduction,
  Reimbursement,
  SettlementDocument,
} from './settlement';

// Digital Signatures
export { signatureService } from './signatures';
export type {
  SignatureType,
  DocumentType,
  SignatureStatus,
  SignatureRequest,
  SignerInfo,
  SignatureData,
  SignedDocument,
  AuditEntry,
  SignatureVerification,
} from './signatures';

// Factoring Integration
export { factoringService } from './factoring';
export type {
  FactoringProvider,
  InvoiceStatus,
  AdvanceType,
  FactoringAccount,
  FactoringInvoice,
  FuelAdvance,
  DebtorCreditCheck,
  FactoringStats,
} from './factoring';
