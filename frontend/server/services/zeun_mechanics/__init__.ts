
/**
 * ZEUN MECHANICS™ ULTIMATE EDITION
 * Complete Breakdown & Repair Intelligence System
 * Version: 2.0.0
 */

export {
  VehicleType,
  EngineManufacturer,
  IssueCategory,
  IssueSeverity,
  ServiceType,
  BreakdownReportSchema,
  DiagnosticResultSchema,
  VehicleDatabaseUltimate,
  DiagnosticEngineUltimate,
  ProviderNetworkUltimate,
  ZeunMechanicsUltimateCore,
} from "./core";

export {
  zeunMechanicsRouter,
  ZeunNotificationService,
  ZeunDocumentStorageService,
  ZeunMechanicsWebSocketHandler,
  zeunNotificationService,
  zeunDocumentStorageService,
  zeunWebSocketHandler,
} from "./integration";

export const ZEUN_VERSION = "2.0.0";
export const ZEUN_NAME = "Zeun Mechanics™ Ultimate Edition";

