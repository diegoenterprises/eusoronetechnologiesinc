/**
 * CAAT (Certificado de Aptitud Ambiental para el Transporte) Validation
 * Required for hazmat vehicle certification in Mexico per NOM-002-SCT/2011
 */
import { logger } from "../_core/logger";

export interface CAATValidation {
  isValid: boolean;
  certificateNumber: string | null;
  expiryDate: string | null;
  vehicleType: string | null;
  hazmatClasses: string[];
  issues: string[];
}

const CAAT_REQUIRED_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function validateCAATRequirement(hazmatClass: string | null, destinationCountry: string): { required: boolean; reason: string } {
  if (destinationCountry !== 'MX' && destinationCountry !== 'Mexico') {
    return { required: false, reason: 'CAAT only required for Mexico operations' };
  }
  if (!hazmatClass) {
    return { required: false, reason: 'Non-hazmat load — CAAT not required' };
  }
  if (CAAT_REQUIRED_CLASSES.some(c => hazmatClass.startsWith(c))) {
    return { required: true, reason: `CAAT required for Class ${hazmatClass} hazmat in Mexico per NOM-002-SCT/2011` };
  }
  return { required: false, reason: 'Hazmat class not regulated under CAAT' };
}

export async function validateCAAT(vehicleVIN: string, hazmatClass: string): Promise<CAATValidation> {
  // In production, this would query Mexico's SCT database or partner API
  // For now, return a validation result based on available data
  logger.info(`[CAAT] Validating vehicle ${vehicleVIN} for class ${hazmatClass}`);

  return {
    isValid: false, // Default to false until verified
    certificateNumber: null,
    expiryDate: null,
    vehicleType: null,
    hazmatClasses: [],
    issues: [`CAAT certificate not on file for vehicle ${vehicleVIN}. Required for Class ${hazmatClass} transport in Mexico.`],
  };
}
