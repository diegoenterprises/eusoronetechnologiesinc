/**
 * CANADIAN COMPLIANCE SERVICE
 * Phase 2 - Cross-Border Audit
 *
 * Provincial weight/dimension limits, TDG Act, Canadian insurance,
 * CBSA requirements, IFTA/IRP, fuel tax, FAST/NEXUS programs.
 */

import { logger } from '../_core/logger';

export type Province = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export interface ProvincialWeightLimit {
  province: Province; name: string;
  maxGVW_kg: number; maxSingleAxle_kg: number; maxTandemAxle_kg: number; maxTridemAxle_kg: number;
  maxTrailerLength_m: number; maxCombinationLength_m: number; maxWidth_m: number; maxHeight_m: number;
  winterWeight: boolean; winterBonus_kg: number; ltcvPermitAvailable: boolean; notes: string;
}

export interface TDGClassification {
  class: string; division?: string; name: string; placard: string;
  packingGroups: string[]; erguideNumber: string;
}

export interface CanadianInsuranceReq {
  type: string; minimumLiability_CAD: number; requiredFor: string; regulation: string; notes: string;
}

export interface CBSARequirement {
  document: string; required: boolean; description: string;
  filingDeadline: string; penalty: string; regulation: string;
}

export interface ProvincePermit {
  province: Province; permitType: string; required: boolean;
  issuer: string; cost_CAD: number; validityDays: number; url: string; notes: string;
}

export interface ComplianceCheckResult {
  compliant: boolean; category: string;
  items: { requirement: string; status: 'pass' | 'fail' | 'warning' | 'not_applicable'; details: string; regulation: string; }[];
  score: number; maxScore: number;
}

export const PROVINCIAL_WEIGHTS: ProvincialWeightLimit[] = [
  { province: 'ON', name: 'Ontario', maxGVW_kg: 63500, maxSingleAxle_kg: 10000, maxTandemAxle_kg: 19100, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 23.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: false, winterBonus_kg: 0, ltcvPermitAvailable: true, notes: 'Ontario Highway Traffic Act, R.R.O. 1990, Reg. 413' },
  { province: 'QC', name: 'Quebec', maxGVW_kg: 62500, maxSingleAxle_kg: 10000, maxTandemAxle_kg: 18000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 23.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: true, winterBonus_kg: 2000, ltcvPermitAvailable: true, notes: 'Highway Safety Code, S-3.4. Winter weights Dec 1 - Mar 15.' },
  { province: 'BC', name: 'British Columbia', maxGVW_kg: 63500, maxSingleAxle_kg: 9100, maxTandemAxle_kg: 17000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 25.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: false, winterBonus_kg: 0, ltcvPermitAvailable: true, notes: 'Commercial Transport Act. Mountain routes may have lower limits.' },
  { province: 'AB', name: 'Alberta', maxGVW_kg: 63500, maxSingleAxle_kg: 9100, maxTandemAxle_kg: 17000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 25.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: true, winterBonus_kg: 1500, ltcvPermitAvailable: true, notes: 'Traffic Safety Act. Winter weights Oct 15 - Apr 30.' },
  { province: 'SK', name: 'Saskatchewan', maxGVW_kg: 62500, maxSingleAxle_kg: 9100, maxTandemAxle_kg: 17000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 25.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: true, winterBonus_kg: 3500, ltcvPermitAvailable: true, notes: 'Highest winter weight bonus in Canada.' },
  { province: 'MB', name: 'Manitoba', maxGVW_kg: 62500, maxSingleAxle_kg: 9100, maxTandemAxle_kg: 17000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 25.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: true, winterBonus_kg: 2000, ltcvPermitAvailable: true, notes: 'Highway Traffic Act. Winter Nov 1 - Mar 31.' },
  { province: 'NB', name: 'New Brunswick', maxGVW_kg: 62500, maxSingleAxle_kg: 10000, maxTandemAxle_kg: 18000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 23.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: false, winterBonus_kg: 0, ltcvPermitAvailable: false, notes: 'Motor Vehicle Act.' },
  { province: 'NS', name: 'Nova Scotia', maxGVW_kg: 62500, maxSingleAxle_kg: 10000, maxTandemAxle_kg: 18000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 23.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: false, winterBonus_kg: 0, ltcvPermitAvailable: false, notes: 'Motor Vehicle Act.' },
  { province: 'PE', name: 'Prince Edward Island', maxGVW_kg: 57600, maxSingleAxle_kg: 9100, maxTandemAxle_kg: 17000, maxTridemAxle_kg: 21300, maxTrailerLength_m: 16.2, maxCombinationLength_m: 23.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: false, winterBonus_kg: 0, ltcvPermitAvailable: false, notes: 'Lowest GVW in Canada (Confederation Bridge).' },
  { province: 'NL', name: 'Newfoundland and Labrador', maxGVW_kg: 62500, maxSingleAxle_kg: 9100, maxTandemAxle_kg: 17000, maxTridemAxle_kg: 24000, maxTrailerLength_m: 16.2, maxCombinationLength_m: 23.0, maxWidth_m: 2.6, maxHeight_m: 4.15, winterWeight: false, winterBonus_kg: 0, ltcvPermitAvailable: false, notes: 'Highway Traffic Act.' },
];

export const TDG_CLASSES: TDGClassification[] = [
  { class: '1', name: 'Explosives', placard: 'EXPLOSIVE', packingGroups: [], erguideNumber: '112' },
  { class: '2', division: '2.1', name: 'Flammable Gases', placard: 'FLAMMABLE GAS', packingGroups: [], erguideNumber: '115' },
  { class: '2', division: '2.2', name: 'Non-Flammable Gases', placard: 'NON-FLAMMABLE GAS', packingGroups: [], erguideNumber: '120' },
  { class: '2', division: '2.3', name: 'Toxic Gases', placard: 'TOXIC GAS', packingGroups: [], erguideNumber: '119' },
  { class: '3', name: 'Flammable Liquids', placard: 'FLAMMABLE', packingGroups: ['I','II','III'], erguideNumber: '128' },
  { class: '4', division: '4.1', name: 'Flammable Solids', placard: 'FLAMMABLE SOLID', packingGroups: ['I','II','III'], erguideNumber: '133' },
  { class: '4', division: '4.2', name: 'Spontaneously Combustible', placard: 'SPONTANEOUSLY COMBUSTIBLE', packingGroups: ['I','II','III'], erguideNumber: '135' },
  { class: '4', division: '4.3', name: 'Dangerous When Wet', placard: 'DANGEROUS WHEN WET', packingGroups: ['I','II','III'], erguideNumber: '138' },
  { class: '5', division: '5.1', name: 'Oxidizing Substances', placard: 'OXIDIZER', packingGroups: ['I','II','III'], erguideNumber: '140' },
  { class: '5', division: '5.2', name: 'Organic Peroxides', placard: 'ORGANIC PEROXIDE', packingGroups: [], erguideNumber: '145' },
  { class: '6', division: '6.1', name: 'Toxic Substances', placard: 'TOXIC', packingGroups: ['I','II','III'], erguideNumber: '151' },
  { class: '6', division: '6.2', name: 'Infectious Substances', placard: 'INFECTIOUS SUBSTANCE', packingGroups: [], erguideNumber: '158' },
  { class: '7', name: 'Radioactive Materials', placard: 'RADIOACTIVE', packingGroups: [], erguideNumber: '161' },
  { class: '8', name: 'Corrosives', placard: 'CORROSIVE', packingGroups: ['I','II','III'], erguideNumber: '154' },
  { class: '9', name: 'Miscellaneous', placard: 'MISCELLANEOUS', packingGroups: ['II','III'], erguideNumber: '171' },
];

export const CA_INSURANCE_REQUIREMENTS: CanadianInsuranceReq[] = [
  { type: 'Public Liability', minimumLiability_CAD: 2_000_000, requiredFor: 'All carriers in Canada', regulation: 'MVTA 1987', notes: 'Minimum $2M CAD interprovincial/international' },
  { type: 'Cargo Insurance', minimumLiability_CAD: 100_000, requiredFor: 'All for-hire carriers', regulation: 'Provincial motor carrier regs', notes: 'Varies by cargo type' },
  { type: 'Environmental Liability', minimumLiability_CAD: 5_000_000, requiredFor: 'TDG carriers', regulation: 'TDG Act, Section 10', notes: 'ERAP may also be needed' },
  { type: 'Workers Compensation', minimumLiability_CAD: 0, requiredFor: 'Employers with CA workers', regulation: 'Provincial WCB legislation', notes: 'Required per province' },
];

export const CBSA_REQUIREMENTS: CBSARequirement[] = [
  { document: 'ACI eManifest (Highway)', required: true, description: 'Advance Commercial Information to CBSA', filingDeadline: 'Before first CA port', penalty: 'Up to $25,000 CAD', regulation: 'Customs Act, Section 12.1' },
  { document: 'PARS Number', required: true, description: 'Pre-Arrival Review System bar-coded label', filingDeadline: '1hr before arrival (24hr recommended)', penalty: 'Delay/refusal of entry', regulation: 'CBSA D-Memo D3-5-1' },
  { document: 'Canada Customs Invoice (CCI)', required: true, description: 'Form CI1 for goods > $2,500 CAD', filingDeadline: 'At release or within 5 business days', penalty: 'Up to $25,000 CAD; goods detained', regulation: 'Customs Act, Section 32' },
  { document: 'B3 Customs Declaration', required: true, description: 'Accounting for duties, taxes, GST', filingDeadline: 'Within 5 business days of release', penalty: 'Interest/penalties', regulation: 'Customs Act, Sections 32-33' },
  { document: 'Certificate of Origin (CUSMA)', required: false, description: 'For preferential tariff under CUSMA/USMCA', filingDeadline: 'At B3 filing', penalty: 'Full duty rate applied', regulation: 'CUSMA Chapter 4' },
  { document: 'TDG Shipping Document', required: false, description: 'Required for dangerous goods (UN#, class, PG, ERG)', filingDeadline: 'Must accompany goods', penalty: 'Up to $50,000 CAD; imprisonment', regulation: 'TDG Act, 1992' },
  { document: 'CFIA Import Permit', required: false, description: 'For food, plants, animals, agriculture', filingDeadline: 'Before arrival', penalty: 'Goods refused/destroyed', regulation: 'Safe Food for Canadians Act' },
  { document: 'FAST Card', required: false, description: 'Pre-approved trusted traveller for expedited processing', filingDeadline: 'N/A', penalty: 'Standard processing lane', regulation: 'CBSA FAST Program' },
];

export const PROVINCIAL_PERMITS: ProvincePermit[] = [
  { province: 'ON', permitType: 'CVOR', required: true, issuer: 'MTO', cost_CAD: 250, validityDays: 365, url: 'https://www.ontario.ca/page/register-commercial-motor-vehicle', notes: 'Annual for regular operators' },
  { province: 'QC', permitType: 'Extra-Provincial Carrier Permit', required: true, issuer: 'CTQ', cost_CAD: 100, validityDays: 365, url: 'https://www.ctq.gouv.qc.ca/', notes: 'French signage requirements' },
  { province: 'BC', permitType: 'NSC Carrier Profile', required: true, issuer: 'CVSE', cost_CAD: 0, validityDays: 365, url: 'https://www.cvse.ca/', notes: 'Free; BC safety rating required' },
  { province: 'AB', permitType: 'Operating Authority', required: true, issuer: 'Alberta Transportation', cost_CAD: 50, validityDays: 365, url: 'https://www.alberta.ca/commercial-vehicle-permits', notes: 'Annual with safety fitness cert' },
  { province: 'SK', permitType: 'Operating Authority', required: true, issuer: 'SGI', cost_CAD: 45, validityDays: 365, url: 'https://www.sgi.sk.ca/', notes: 'Annual' },
  { province: 'MB', permitType: 'Extra-Provincial Trucking Permit', required: true, issuer: 'Manitoba Infrastructure', cost_CAD: 60, validityDays: 365, url: 'https://www.gov.mb.ca/mit/', notes: 'Display MB permit number on vehicle' },
];

export const PROVINCIAL_FUEL_TAX: Record<Province, { diesel_per_litre_CAD: number; carbon_tax_per_litre_CAD: number; total_per_litre_CAD: number }> = {
  AB: { diesel_per_litre_CAD: 0.13, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3061 },
  BC: { diesel_per_litre_CAD: 0.27, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.4461 },
  MB: { diesel_per_litre_CAD: 0.14, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3161 },
  NB: { diesel_per_litre_CAD: 0.215, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3911 },
  NL: { diesel_per_litre_CAD: 0.165, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3411 },
  NS: { diesel_per_litre_CAD: 0.154, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3301 },
  NT: { diesel_per_litre_CAD: 0.091, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.2671 },
  NU: { diesel_per_litre_CAD: 0.091, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.2671 },
  ON: { diesel_per_litre_CAD: 0.143, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3191 },
  PE: { diesel_per_litre_CAD: 0.204, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3801 },
  QC: { diesel_per_litre_CAD: 0.202, carbon_tax_per_litre_CAD: 0.0, total_per_litre_CAD: 0.202 },
  SK: { diesel_per_litre_CAD: 0.15, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.3261 },
  YT: { diesel_per_litre_CAD: 0.073, carbon_tax_per_litre_CAD: 0.1761, total_per_litre_CAD: 0.2491 },
};

export function getProvinceWeightLimits(province: Province): ProvincialWeightLimit | undefined {
  return PROVINCIAL_WEIGHTS.find(p => p.province === province);
}

export function checkWeightCompliance(province: Province, gvw_kg: number, isWinter: boolean) {
  const limits = getProvinceWeightLimits(province);
  if (!limits) return { compliant: true, maxAllowed_kg: 63500, overage_kg: 0, winterBonusApplied: false };
  const winterBonus = (isWinter && limits.winterWeight) ? limits.winterBonus_kg : 0;
  const maxAllowed = limits.maxGVW_kg + winterBonus;
  return { compliant: gvw_kg <= maxAllowed, maxAllowed_kg: maxAllowed, overage_kg: Math.max(0, gvw_kg - maxAllowed), winterBonusApplied: winterBonus > 0 };
}

export function getTDGRequirements(tdgClass: string): TDGClassification | undefined {
  return TDG_CLASSES.find(c => c.class === tdgClass || c.division === tdgClass);
}

export function checkTDGCompliance(params: {
  hasDangerousGoods: boolean; tdgClass?: string; hasShippingDoc: boolean;
  hasPlacards: boolean; hasERAP: boolean; driverTDGTrained: boolean;
}): ComplianceCheckResult {
  const items: ComplianceCheckResult['items'] = [];
  if (!params.hasDangerousGoods) {
    return { compliant: true, category: 'TDG', items: [{ requirement: 'TDG', status: 'not_applicable', details: 'No dangerous goods', regulation: 'TDG Act' }], score: 1, maxScore: 1 };
  }
  items.push({ requirement: 'TDG Training Certificate', status: params.driverTDGTrained ? 'pass' : 'fail', details: params.driverTDGTrained ? 'Valid TDG training' : 'Missing TDG training (required every 3 years)', regulation: 'TDG Regulations, Part 6' });
  items.push({ requirement: 'TDG Shipping Document', status: params.hasShippingDoc ? 'pass' : 'fail', details: params.hasShippingDoc ? 'TDG doc present' : 'Missing TDG shipping document', regulation: 'TDG Regulations, Part 3' });
  items.push({ requirement: 'Safety Marks (Placards)', status: params.hasPlacards ? 'pass' : 'fail', details: params.hasPlacards ? 'Properly placarded' : 'Missing TDG placards', regulation: 'TDG Regulations, Part 4' });
  const erap_classes = ['1', '2.3', '6.1', '7'];
  const needsERAP = params.tdgClass ? erap_classes.some(c => params.tdgClass!.startsWith(c)) : false;
  if (needsERAP) {
    items.push({ requirement: 'Emergency Response Assistance Plan', status: params.hasERAP ? 'pass' : 'fail', details: params.hasERAP ? 'ERAP approved' : `ERAP required for TDG class ${params.tdgClass}`, regulation: 'TDG Act, Section 7' });
  }
  const passing = items.filter(i => i.status === 'pass').length;
  return { compliant: items.every(i => i.status === 'pass'), category: 'TDG', items, score: passing, maxScore: items.length };
}

export function getRequiredCBSADocuments(params: { hasDangerousGoods: boolean; hasFood: boolean; claimingUSMCA: boolean }) {
  return CBSA_REQUIREMENTS.filter(r => {
    if (r.required) return true;
    if (r.document.includes('TDG') && params.hasDangerousGoods) return true;
    if (r.document.includes('CFIA') && params.hasFood) return true;
    if (r.document.includes('CUSMA') && params.claimingUSMCA) return true;
    return false;
  });
}

export function getProvincialPermits(provinces: Province[]) {
  return PROVINCIAL_PERMITS.filter(p => provinces.includes(p.province));
}

export function estimateCanadianFuelTax(provinces: Province[], litresPerProvince: Record<string, number>) {
  let totalTax = 0;
  const breakdown: { province: Province; litres: number; taxRate: number; tax: number }[] = [];
  for (const prov of provinces) {
    const litres = litresPerProvince[prov] || 0;
    const rate = PROVINCIAL_FUEL_TAX[prov];
    if (rate && litres > 0) {
      const tax = Math.round(litres * rate.total_per_litre_CAD * 100) / 100;
      totalTax += tax;
      breakdown.push({ province: prov, litres, taxRate: rate.total_per_litre_CAD, tax });
    }
  }
  return { totalTax_CAD: Math.round(totalTax * 100) / 100, breakdown };
}

export function runFullCanadianComplianceCheck(params: {
  provinces: Province[]; gvw_kg: number; isWinter: boolean;
  hasDangerousGoods: boolean; tdgClass?: string; hasShippingDoc: boolean;
  hasPlacards: boolean; hasERAP: boolean; driverTDGTrained: boolean;
  hasInsurance: boolean; insuranceAmount_CAD: number;
  hasACIeManifest: boolean; hasPARS: boolean; hasCCI: boolean; hasB3: boolean;
}): { overall: boolean; sections: ComplianceCheckResult[] } {
  const sections: ComplianceCheckResult[] = [];

  // Weight compliance (first province)
  if (params.provinces.length > 0) {
    const wc = checkWeightCompliance(params.provinces[0], params.gvw_kg, params.isWinter);
    sections.push({
      compliant: wc.compliant, category: 'Weight & Dimensions',
      items: [{ requirement: `GVW limit for ${params.provinces[0]}`, status: wc.compliant ? 'pass' : 'fail', details: wc.compliant ? `${params.gvw_kg}kg within ${wc.maxAllowed_kg}kg limit${wc.winterBonusApplied ? ' (winter bonus)' : ''}` : `${wc.overage_kg}kg over limit`, regulation: 'Provincial weight regulations' }],
      score: wc.compliant ? 1 : 0, maxScore: 1,
    });
  }

  // TDG
  sections.push(checkTDGCompliance(params));

  // Insurance
  const insOk = params.hasInsurance && params.insuranceAmount_CAD >= 2_000_000;
  sections.push({
    compliant: insOk, category: 'Insurance',
    items: [
      { requirement: 'Public Liability ($2M CAD min)', status: insOk ? 'pass' : 'fail', details: insOk ? `$${params.insuranceAmount_CAD.toLocaleString()} CAD coverage` : params.hasInsurance ? `$${params.insuranceAmount_CAD.toLocaleString()} CAD below $2M minimum` : 'No Canadian insurance', regulation: 'MVTA 1987' },
    ],
    score: insOk ? 1 : 0, maxScore: 1,
  });

  // CBSA Documents
  const cbsaItems: ComplianceCheckResult['items'] = [
    { requirement: 'ACI eManifest', status: params.hasACIeManifest ? 'pass' : 'fail', details: params.hasACIeManifest ? 'Filed' : 'Not filed', regulation: 'Customs Act 12.1' },
    { requirement: 'PARS Number', status: params.hasPARS ? 'pass' : 'fail', details: params.hasPARS ? 'Assigned' : 'Not assigned', regulation: 'D-Memo D3-5-1' },
    { requirement: 'Canada Customs Invoice', status: params.hasCCI ? 'pass' : 'warning', details: params.hasCCI ? 'Prepared' : 'Not yet prepared (needed within 5 days)', regulation: 'Customs Act 32' },
    { requirement: 'B3 Declaration', status: params.hasB3 ? 'pass' : 'warning', details: params.hasB3 ? 'Filed' : 'Due within 5 business days of release', regulation: 'Customs Act 32-33' },
  ];
  const cbsaPassing = cbsaItems.filter(i => i.status === 'pass').length;
  sections.push({ compliant: cbsaItems.filter(i => i.status === 'fail').length === 0, category: 'CBSA Documents', items: cbsaItems, score: cbsaPassing, maxScore: cbsaItems.length });

  const overall = sections.every(s => s.compliant);
  logger.info(`[CanadianCompliance] Full check: ${overall ? 'PASS' : 'FAIL'} (${sections.length} sections)`);
  return { overall, sections };
}
