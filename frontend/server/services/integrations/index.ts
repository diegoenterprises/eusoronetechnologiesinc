/**
 * EUSOCONNECT INTEGRATION SERVICES INDEX
 * Factory for creating provider-specific integration services
 */

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

/**
 * Get integration service by provider slug
 */
export function getIntegrationService(providerSlug: string): BaseIntegrationService | null {
  const ServiceClass = serviceRegistry[providerSlug];
  if (!ServiceClass) {
    console.warn(`[Integrations] No service implementation for provider: ${providerSlug}`);
    return null;
  }
  return new ServiceClass();
}

/**
 * Check if a provider has a service implementation
 */
export function hasServiceImplementation(providerSlug: string): boolean {
  return providerSlug in serviceRegistry;
}

/**
 * Get list of implemented provider slugs
 */
export function getImplementedProviders(): string[] {
  return Object.keys(serviceRegistry);
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
