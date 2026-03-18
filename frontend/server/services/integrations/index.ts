/**
 * EUSOCONNECT INTEGRATION SERVICES INDEX
 * Factory for creating provider-specific integration services
 */

import { logger } from "../../_core/logger";
import { BaseIntegrationService } from "./BaseIntegrationService";
import { CanopyConnectService } from "./CanopyConnectService";
import { ISNetworldService } from "./ISNetworldService";
import { VeriforceService } from "./VeriforceService";
import { MotiveELDService } from "./MotiveELDService";
import { EnverusService } from "./EnverusService";
import { OPISService } from "./OPISService";
import { GenscapeService } from "./GenscapeService";
import { BuckeyeTASService } from "./BuckeyeTASService";
import { FMCSAService } from "./FMCSAService";
import { DearmanService } from "./DearmanService";
import { RailincService } from "./RailincService";
import { FRAService } from "./FRAService";
import { ClassIRailroadService } from "./ClassIRailroadService";
import { VizionRailService } from "./VizionRailService";
import { CloudMoyoCrewService } from "./CloudMoyoCrewService";
import { RailRateService } from "./RailRateService";

const serviceRegistry: Record<string, new () => BaseIntegrationService> = {
  canopy_connect: CanopyConnectService,
  isnetworld: ISNetworldService,
  veriforce: VeriforceService,
  keeptruckin: MotiveELDService,
  motive: MotiveELDService,
  enverus: EnverusService,
  opis: OPISService,
  genscape: GenscapeService,
  buckeye_tas: BuckeyeTASService,
  buckeye: BuckeyeTASService,
  fmcsa: FMCSAService,
  dearman: DearmanService,
};

// Standalone rail integration services (not BaseIntegrationService subclasses)
const railServiceRegistry: Record<string, { getInstance: () => any }> = {
  railinc:           { getInstance: () => new RailincService() },
  fra:               { getInstance: () => new FRAService() },
  class_i_railroad:  { getInstance: () => new ClassIRailroadService() },
  vizion_rail:       { getInstance: () => new VizionRailService() },
  cloudmoyo_crew:    { getInstance: () => new CloudMoyoCrewService() },
  rail_rates:        { getInstance: () => new RailRateService() },
};

/**
 * Get integration service by provider slug
 */
export function getIntegrationService(providerSlug: string): BaseIntegrationService | null {
  const ServiceClass = serviceRegistry[providerSlug];
  if (!ServiceClass) {
    logger.warn(`[Integrations] No service implementation for provider: ${providerSlug}`);
    return null;
  }
  return new ServiceClass();
}

/**
 * Get standalone rail integration service by provider slug
 */
export function getRailIntegrationService(providerSlug: string): any | null {
  const entry = railServiceRegistry[providerSlug];
  if (!entry) {
    logger.warn(`[Integrations] No rail service implementation for provider: ${providerSlug}`);
    return null;
  }
  return entry.getInstance();
}

/**
 * Check if a provider has a service implementation
 */
export function hasServiceImplementation(providerSlug: string): boolean {
  return providerSlug in serviceRegistry || providerSlug in railServiceRegistry;
}

/**
 * Get list of implemented provider slugs
 */
export function getImplementedProviders(): string[] {
  return [...Object.keys(serviceRegistry), ...Object.keys(railServiceRegistry)];
}

export { BaseIntegrationService } from "./BaseIntegrationService";
export { CanopyConnectService } from "./CanopyConnectService";
export { ISNetworldService } from "./ISNetworldService";
export { VeriforceService } from "./VeriforceService";
export { MotiveELDService } from "./MotiveELDService";
export { EnverusService, enverusService, ENVERUS_ENDPOINTS } from "./EnverusService";
export { OPISService, opisService, OPIS_ENDPOINTS } from "./OPISService";
export { GenscapeService, genscapeService, GENSCAPE_ENDPOINTS } from "./GenscapeService";
export { BuckeyeTASService, buckeyeTASService, BUCKEYE_ENDPOINTS } from "./BuckeyeTASService";
export { FMCSAService, fmcsaService, FMCSA_ENDPOINTS } from "./FMCSAService";
export { DearmanService, dearmanService, DEARMAN_ENDPOINTS } from "./DearmanService";
export { RailincService, railincService, RAILINC_ENDPOINTS } from "./RailincService";
export { FRAService, fraService, FRA_ENDPOINTS } from "./FRAService";
export { ClassIRailroadService, classIRailroadService, CLASS_I_ENDPOINTS } from "./ClassIRailroadService";
export { VizionRailService, vizionRailService, VIZION_ENDPOINTS } from "./VizionRailService";
export { CloudMoyoCrewService, cloudMoyoCrewService, CLOUDMOYO_ENDPOINTS } from "./CloudMoyoCrewService";
export { RailRateService, railRateService, RAIL_RATE_ENDPOINTS } from "./RailRateService";
