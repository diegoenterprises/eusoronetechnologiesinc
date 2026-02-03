/**
 * EUSOCONNECT INTEGRATION SERVICES INDEX
 * Factory for creating provider-specific integration services
 */

import { BaseIntegrationService } from "./BaseIntegrationService";
import { CanopyConnectService } from "./CanopyConnectService";
import { ISNetworldService } from "./ISNetworldService";
import { VeriforceService } from "./VeriforceService";
import { MotiveELDService } from "./MotiveELDService";

const serviceRegistry: Record<string, new () => BaseIntegrationService> = {
  canopy_connect: CanopyConnectService,
  isnetworld: ISNetworldService,
  veriforce: VeriforceService,
  keeptruckin: MotiveELDService,
  motive: MotiveELDService,
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
