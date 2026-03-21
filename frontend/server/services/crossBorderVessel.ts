/**
 * CROSS-BORDER VESSEL SERVICE — Phase 3
 * International maritime operations: ISPS, ISF 10+2, cabotage, IMDG, AMS/ACI Ocean
 */
import { logger } from '../_core/logger';

export type MaritimeCountry = 'US' | 'CA' | 'MX';

export interface CrossBorderPort {
  id: string; name: string; unlocode: string; country: MaritimeCountry;
  stateProvince: string; lat: number; lng: number;
  portType: 'seaport' | 'river_port' | 'lake_port';
  customsAuthority: string; ftzAvailable: boolean;
  maxDraftMeters: number; containerCapacityTEU: number;
  hasRailAccess: boolean; crossBorderNotes: string;
}

export interface ISFRequirement {
  field: string; description: string; timing: string; penalty: string;
}

export interface CabotageRule {
  country: MaritimeCountry; lawName: string; authority: string;
  description: string; keyRestrictions: string[];
  exceptions: string[]; penalties: string;
}

export interface IMDGClassInfo {
  classNumber: string; name: string; description: string;
  packingGroups: string[]; marinePollutant: boolean;
  specialRequirements: string[];
}

export interface VesselCrossBorderCompliance {
  route: string; direction: string;
  checks: { requirement: string; status: 'pass'|'fail'|'warning'; details: string; regulation: string; }[];
  overallCompliant: boolean;
}

export const CROSS_BORDER_PORTS: CrossBorderPort[] = [
  // US Major
  { id:'USP-001',name:'Port of Los Angeles',unlocode:'USLAX',country:'US',stateProvince:'CA',lat:33.74,lng:-118.27,portType:'seaport',customsAuthority:'CBP Los Angeles',ftzAvailable:true,maxDraftMeters:16.2,containerCapacityTEU:10000000,hasRailAccess:true,crossBorderNotes:'Largest US container port. Major Asia-Pacific gateway.' },
  { id:'USP-002',name:'Port of Long Beach',unlocode:'USLGB',country:'US',stateProvince:'CA',lat:33.75,lng:-118.19,portType:'seaport',customsAuthority:'CBP Long Beach',ftzAvailable:true,maxDraftMeters:15.8,containerCapacityTEU:9000000,hasRailAccess:true,crossBorderNotes:'Second largest US port. BNSF/UP on-dock rail.' },
  { id:'USP-003',name:'Port of Houston',unlocode:'USHOU',country:'US',stateProvince:'TX',lat:29.73,lng:-95.27,portType:'seaport',customsAuthority:'CBP Houston',ftzAvailable:true,maxDraftMeters:13.7,containerCapacityTEU:3500000,hasRailAccess:true,crossBorderNotes:'Gulf coast hub. Major petrochemical & container traffic.' },
  { id:'USP-004',name:'Port of Savannah',unlocode:'USSAV',country:'US',stateProvince:'GA',lat:32.08,lng:-81.09,portType:'seaport',customsAuthority:'CBP Savannah',ftzAvailable:true,maxDraftMeters:14.0,containerCapacityTEU:5800000,hasRailAccess:true,crossBorderNotes:'Fastest growing US port. CSX/NS rail access.' },
  { id:'USP-005',name:'Port of New York/New Jersey',unlocode:'USNYC',country:'US',stateProvince:'NJ',lat:40.68,lng:-74.04,portType:'seaport',customsAuthority:'CBP New York',ftzAvailable:true,maxDraftMeters:15.2,containerCapacityTEU:8500000,hasRailAccess:true,crossBorderNotes:'Largest East Coast port. ExpressRail intermodal.' },
  { id:'USP-006',name:'Port of Seattle/Tacoma',unlocode:'USSEA',country:'US',stateProvince:'WA',lat:47.58,lng:-122.35,portType:'seaport',customsAuthority:'CBP Seattle',ftzAvailable:true,maxDraftMeters:15.5,containerCapacityTEU:3700000,hasRailAccess:true,crossBorderNotes:'NW SEAPORT Alliance. Asia-Pacific trade.' },
  // Canada Major
  { id:'CAP-001',name:'Port of Vancouver',unlocode:'CAVAN',country:'CA',stateProvince:'BC',lat:49.29,lng:-123.11,portType:'seaport',customsAuthority:'CBSA Vancouver',ftzAvailable:false,maxDraftMeters:18.3,containerCapacityTEU:3800000,hasRailAccess:true,crossBorderNotes:'Largest CA port. CN/CPKC rail. Asia-Pacific gateway.' },
  { id:'CAP-002',name:'Port of Montreal',unlocode:'CAMTR',country:'CA',stateProvince:'QC',lat:45.56,lng:-73.52,portType:'seaport',customsAuthority:'CBSA Montreal',ftzAvailable:false,maxDraftMeters:11.3,containerCapacityTEU:1800000,hasRailAccess:true,crossBorderNotes:'St. Lawrence Seaway. Closest NA port to Europe.' },
  { id:'CAP-003',name:'Port of Halifax',unlocode:'CAHAL',country:'CA',stateProvince:'NS',lat:44.65,lng:-63.57,portType:'seaport',customsAuthority:'CBSA Halifax',ftzAvailable:false,maxDraftMeters:16.0,containerCapacityTEU:600000,hasRailAccess:true,crossBorderNotes:'Deep water. First/last port of call for transatlantic.' },
  { id:'CAP-004',name:'Port of Prince Rupert',unlocode:'CAPRR',country:'CA',stateProvince:'BC',lat:54.31,lng:-130.32,portType:'seaport',customsAuthority:'CBSA Prince Rupert',ftzAvailable:false,maxDraftMeters:17.1,containerCapacityTEU:1500000,hasRailAccess:true,crossBorderNotes:'Closest NA port to Asia. CN rail only.' },
  { id:'CAP-005',name:'Port of Hamilton',unlocode:'CAHAM',country:'CA',stateProvince:'ON',lat:43.27,lng:-79.87,portType:'lake_port',customsAuthority:'CBSA Hamilton',ftzAvailable:false,maxDraftMeters:8.2,containerCapacityTEU:0,hasRailAccess:true,crossBorderNotes:'Great Lakes. Bulk cargo hub.' },
  // Mexico Major
  { id:'MXP-001',name:'Port of Manzanillo',unlocode:'MXZLO',country:'MX',stateProvince:'COL',lat:19.06,lng:-104.32,portType:'seaport',customsAuthority:'SAT Manzanillo',ftzAvailable:true,maxDraftMeters:16.5,containerCapacityTEU:3400000,hasRailAccess:true,crossBorderNotes:'Largest MX container port. Ferromex/CPKC rail.' },
  { id:'MXP-002',name:'Port of Lazaro Cardenas',unlocode:'MXLZC',country:'MX',stateProvince:'MIC',lat:17.94,lng:-102.17,portType:'seaport',customsAuthority:'SAT Lazaro Cardenas',ftzAvailable:true,maxDraftMeters:16.5,containerCapacityTEU:1700000,hasRailAccess:true,crossBorderNotes:'Deep water Pacific. CPKC direct rail to US.' },
  { id:'MXP-003',name:'Port of Veracruz',unlocode:'MXVER',country:'MX',stateProvince:'VER',lat:19.18,lng:-96.13,portType:'seaport',customsAuthority:'SAT Veracruz',ftzAvailable:true,maxDraftMeters:14.0,containerCapacityTEU:1200000,hasRailAccess:true,crossBorderNotes:'Gulf coast. Oldest MX port. Ferromex rail.' },
  { id:'MXP-004',name:'Port of Altamira',unlocode:'MXATM',country:'MX',stateProvince:'TAM',lat:22.41,lng:-97.91,portType:'seaport',customsAuthority:'SAT Altamira',ftzAvailable:true,maxDraftMeters:12.0,containerCapacityTEU:800000,hasRailAccess:true,crossBorderNotes:'Gulf petrochemical hub. Near US border.' },
  { id:'MXP-005',name:'Port of Ensenada',unlocode:'MXESE',country:'MX',stateProvince:'BCN',lat:31.85,lng:-116.62,portType:'seaport',customsAuthority:'SAT Ensenada',ftzAvailable:true,maxDraftMeters:12.0,containerCapacityTEU:300000,hasRailAccess:false,crossBorderNotes:'Pacific Baja. Short-sea shipping to US West Coast.' },
];

export const ISF_10_PLUS_2: ISFRequirement[] = [
  { field:'Manufacturer/Supplier',description:'Name and address of entity that last manufactured/assembled the goods',timing:'24hrs before vessel loading at foreign port',penalty:'$5,000 per violation' },
  { field:'Seller',description:'Name and address of the last known entity selling goods for export to US',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Buyer',description:'Name and address of the purchaser in the US',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Ship-to Party',description:'Name and address of first deliver-to party after cargo arrives in US',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Container Stuffing Location',description:'Name and address where goods were loaded into the container',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Consolidator',description:'Name and address of the entity that consolidated the cargo',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Importer of Record Number',description:'IRS number, EIN, SSN, or CBP assigned number',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Consignee Number',description:'IRS number, EIN, SSN, or CBP assigned number of consignee',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Country of Origin',description:'Country of manufacture, production, or growth',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'HTS Number (6-digit)',description:'Harmonized Tariff Schedule classification at 6-digit level',timing:'24hrs before loading',penalty:'$5,000 per violation' },
  { field:'Vessel Stow Plan (+1)',description:'Carrier must submit container stow plan',timing:'48hrs after departure from last foreign port',penalty:'$5,000 per violation' },
  { field:'Container Status Messages (+2)',description:'Carrier must report container status milestones',timing:'24hrs before arrival at US port',penalty:'$5,000 per violation' },
];

export const CABOTAGE_RULES: CabotageRule[] = [
  { country:'US',lawName:'Jones Act (Merchant Marine Act of 1920)',authority:'US Maritime Administration (MARAD)',description:'Goods shipped between US ports must be carried on US-built, US-owned, US-flagged, US-crewed vessels',keyRestrictions:['US-built vessel','US-owned (75% US citizens)','US-flagged','US-crewed (all officers + 75% crew US citizens)','Applies to all coastwise trade including containers, bulk, tankers'],exceptions:['Foreign-flag vessels with coastwise waiver','Government cargo under certain conditions','Virgin Islands trade (partial)','Empty container repositioning (debated)'],penalties:'Seizure of cargo and vessel. Fines up to $10,000 per violation.' },
  { country:'CA',lawName:'Coasting Trade Act (1992)',authority:'Transport Canada / Canadian Transportation Agency',description:'Coasting trade in Canadian waters restricted to Canadian-flagged or duty-paid foreign vessels',keyRestrictions:['Canadian-flagged vessel preferred','Foreign vessels must obtain coasting trade license','Temporary import duty on foreign vessel hull value','Canadian crew requirements for licensed vessels'],exceptions:['Coasting trade license for specific voyages','CUSMA provisions for certain repositioning','Waiver from Transport Canada if no Canadian vessel available'],penalties:'Denial of port access. Vessel detained. Customs penalties.' },
  { country:'MX',lawName:'Ley de Navegacion y Comercio Maritimos (2006)',authority:'SCT / Secretaria de Marina',description:'Cabotage reserved for Mexican-flagged vessels with Mexican crew',keyRestrictions:['Mexican flag required','Mexican crew required','Mexican ownership majority','Applies to cargo between Mexican ports'],exceptions:['Temporary permit for foreign vessels when no Mexican vessel available','International voyage stopping at multiple MX ports (with permit)'],penalties:'Port denial. Vessel seizure. Fines per SCT schedule.' },
];

export const IMDG_CLASSES: IMDGClassInfo[] = [
  { classNumber:'1',name:'Explosives',description:'Substances and articles with mass explosion hazard',packingGroups:[],marinePollutant:false,specialRequirements:['Segregation from all other DG classes','Specific stowage category (magazine/deck/under deck)','Master notification 24hrs before loading','Port state notification required'] },
  { classNumber:'2.1',name:'Flammable Gases',description:'Gases flammable in air at 20C and standard pressure',packingGroups:[],marinePollutant:false,specialRequirements:['Deck stowage preferred','Away from sources of heat','Segregation from oxidizers'] },
  { classNumber:'2.2',name:'Non-Flammable Non-Toxic Gases',description:'Gases that are asphyxiant or oxidizing',packingGroups:[],marinePollutant:false,specialRequirements:['Standard stowage','Ventilation requirements for enclosed spaces'] },
  { classNumber:'2.3',name:'Toxic Gases',description:'Gases known to be toxic or corrosive to humans',packingGroups:[],marinePollutant:false,specialRequirements:['Under deck stowage only','Emergency equipment required','Segregation from foodstuffs'] },
  { classNumber:'3',name:'Flammable Liquids',description:'Liquids with flash point up to 60C',packingGroups:['I','II','III'],marinePollutant:true,specialRequirements:['Away from heat sources','Deck or under deck per flash point','Fire-fighting equipment accessible'] },
  { classNumber:'4.1',name:'Flammable Solids',description:'Solids readily combustible through friction',packingGroups:['I','II','III'],marinePollutant:false,specialRequirements:['Keep dry','Away from heat sources','Segregation from oxidizers'] },
  { classNumber:'5.1',name:'Oxidizing Substances',description:'Substances that yield oxygen and cause/enhance combustion',packingGroups:['I','II','III'],marinePollutant:false,specialRequirements:['Segregation from flammables','Under deck stowage preferred'] },
  { classNumber:'6.1',name:'Toxic Substances',description:'Substances liable to cause death or injury if swallowed/inhaled/skin contact',packingGroups:['I','II','III'],marinePollutant:false,specialRequirements:['Segregation from foodstuffs','Emergency medical supplies'] },
  { classNumber:'7',name:'Radioactive Material',description:'Material with specific activity > 70 kBq/kg',packingGroups:[],marinePollutant:false,specialRequirements:['Transport Index limits per vessel','Segregation from crew quarters','Radiation monitoring required','Competent authority approval'] },
  { classNumber:'8',name:'Corrosive Substances',description:'Substances that cause visible necrosis or corrode steel/aluminum',packingGroups:['I','II','III'],marinePollutant:false,specialRequirements:['Stow away from metals','Under deck preferred','Spill containment'] },
  { classNumber:'9',name:'Miscellaneous DG',description:'Substances presenting danger not covered by other classes',packingGroups:['II','III'],marinePollutant:true,specialRequirements:['Includes environmentally hazardous substances','Lithium batteries','Elevated temperature substances'] },
];

export function getCrossBorderPorts(params?: { country?: MaritimeCountry; hasRailAccess?: boolean; minDraft?: number; }): CrossBorderPort[] {
  let r = [...CROSS_BORDER_PORTS];
  if (params?.country) r = r.filter(p => p.country === params.country);
  if (params?.hasRailAccess) r = r.filter(p => p.hasRailAccess);
  if (params?.minDraft) r = r.filter(p => p.maxDraftMeters >= params.minDraft!);
  return r;
}

export function getISFRequirements() { return ISF_10_PLUS_2; }
export function getCabotageRules(country?: MaritimeCountry) { return country ? CABOTAGE_RULES.filter(r => r.country === country) : CABOTAGE_RULES; }
export function getIMDGClasses() { return IMDG_CLASSES; }

export function getRequiredVesselDocs(direction: 'US_import'|'US_export'|'CA_import'|'CA_export'|'MX_import'|'MX_export'): string[] {
  const common = ['Bill of Lading (B/L)','Commercial Invoice','Packing List','Certificate of Origin'];
  const m: Record<string, string[]> = {
    US_import: [...common,'ISF 10+2 (24hrs before loading)','AMS (Automated Manifest System)','CBP Entry Summary (7501)','Customs Bond (continuous/single)','FDA Prior Notice (if food)','USDA/APHIS permit (if agriculture)','ISF bond','HTS classification','Arrival Notice'],
    US_export: [...common,'AES/EEI (Electronic Export Information)','SED if value > $2,500','EAR/ITAR license if controlled','Shipper Export Declaration','Dock receipt'],
    CA_import: [...common,'ACI Ocean eManifest (CBSA)','Canada Customs Invoice (CCI)','Form B3 (Customs Declaration)','CUSMA Certificate of Origin','CFIA import permits (food/agriculture)','CBSA release prior to arrival'],
    CA_export: [...common,'Canadian Export Declaration (B13A)','Export permits if controlled goods','CBSA export reporting'],
    MX_import: [...common,'Pedimento de Importacion','Carta Porte (if inland leg)','Agente Aduanal assignment','VUCEM electronic filing','NOM compliance certificates','MX import license if required'],
    MX_export: [...common,'Pedimento de Exportacion','Carta Porte (if inland leg)','VUCEM export filing','Certificate of Origin (T-MEC/USMCA)'],
  };
  return m[direction] || common;
}

export function checkVesselCrossBorderCompliance(params: {
  direction: 'US_import'|'US_export'|'CA_import'|'CA_export'|'MX_import'|'MX_export';
  originPortId: string; destPortId: string;
  hasManifest: boolean; hasISF: boolean; hasBOL: boolean; hasCustomsDocs: boolean;
  hasDangerousGoods: boolean; hasIMDGDocs: boolean;
  isISPSCompliant: boolean; hasInsurance: boolean;
  isCabotageMove: boolean; hasCabotageWaiver: boolean;
}): VesselCrossBorderCompliance {
  const items: VesselCrossBorderCompliance['checks'] = [];
  const oPort = CROSS_BORDER_PORTS.find(p => p.id === params.originPortId);
  const dPort = CROSS_BORDER_PORTS.find(p => p.id === params.destPortId);

  // Port validation
  items.push({ requirement:'Valid origin port', status: oPort ? 'pass' : 'warning', details: oPort ? `${oPort.name} (${oPort.unlocode})` : 'Unknown port', regulation:'Port regulations' });
  items.push({ requirement:'Valid destination port', status: dPort ? 'pass' : 'warning', details: dPort ? `${dPort.name} (${dPort.unlocode})` : 'Unknown port', regulation:'Port regulations' });

  // ISPS compliance
  items.push({ requirement:'ISPS Code compliance', status: params.isISPSCompliant ? 'pass' : 'fail', details: params.isISPSCompliant ? 'Vessel ISPS certified' : 'ISPS certification required', regulation:'SOLAS Chapter XI-2 / ISPS Code' });

  // Manifest
  const manifestReq = params.direction.startsWith('US') ? 'AMS Manifest' : params.direction.startsWith('CA') ? 'ACI Ocean eManifest' : 'VUCEM Manifest';
  items.push({ requirement: manifestReq, status: params.hasManifest ? 'pass' : 'fail', details: params.hasManifest ? 'Filed' : 'Not filed', regulation: params.direction.startsWith('US') ? '19 CFR Part 4' : params.direction.startsWith('CA') ? 'Customs Act 12.1' : 'Ley Aduanera' });

  // ISF (US imports only)
  if (params.direction === 'US_import') {
    items.push({ requirement:'ISF 10+2 Filing', status: params.hasISF ? 'pass' : 'fail', details: params.hasISF ? 'Filed 24hrs+ before loading' : 'ISF not filed — $5,000/violation penalty', regulation:'19 CFR Part 149 (SAFE Port Act)' });
  }

  // BOL
  items.push({ requirement:'Bill of Lading', status: params.hasBOL ? 'pass' : 'fail', details: params.hasBOL ? 'B/L issued' : 'B/L required', regulation:'Hague-Visby Rules / COGSA' });

  // Customs docs
  items.push({ requirement:'Customs documentation', status: params.hasCustomsDocs ? 'pass' : 'fail', details: params.hasCustomsDocs ? 'Complete' : 'Incomplete customs docs', regulation:'Customs regulations' });

  // IMDG / DG
  if (params.hasDangerousGoods) {
    items.push({ requirement:'IMDG Code compliance', status: params.hasIMDGDocs ? 'pass' : 'fail', details: params.hasIMDGDocs ? 'IMDG documentation complete' : 'Missing IMDG dangerous goods declaration', regulation:'IMDG Code (IMO)' });
  }

  // Insurance
  items.push({ requirement:'Marine cargo insurance', status: params.hasInsurance ? 'pass' : 'fail', details: params.hasInsurance ? 'P&I and cargo insurance valid' : 'Marine insurance required', regulation:'International maritime insurance requirements' });

  // Cabotage
  if (params.isCabotageMove) {
    items.push({ requirement:'Cabotage compliance', status: params.hasCabotageWaiver ? 'pass' : 'fail', details: params.hasCabotageWaiver ? 'Cabotage waiver/license obtained' : 'Cabotage violation — domestic port-to-port requires flagged vessel', regulation: params.direction.startsWith('US') ? 'Jones Act (46 USC 55102)' : params.direction.startsWith('CA') ? 'Coasting Trade Act' : 'Ley de Navegacion' });
  }

  const ok = items.every(i => i.status === 'pass');
  logger.info(`[CrossBorderVessel] Compliance ${params.direction} ${params.originPortId}->${params.destPortId}: ${ok ? 'PASS' : 'FAIL'}`);
  return { route: `${oPort?.unlocode || params.originPortId} -> ${dPort?.unlocode || params.destPortId}`, direction: params.direction, checks: items, overallCompliant: ok };
}

export function estimateVesselCustomsClearanceTime(direction: string, hasDG: boolean, containerCount: number): { estimatedHours: number; breakdown: { step: string; hours: number }[] } {
  const bd: { step: string; hours: number }[] = [];
  bd.push({ step: 'Document review & manifest verification', hours: 4 });
  if (direction.includes('import')) bd.push({ step: 'Customs examination selection', hours: 2 });
  if (hasDG) bd.push({ step: 'IMDG dangerous goods inspection', hours: 3 });
  if (containerCount > 500) bd.push({ step: 'Large vessel discharge (>500 containers)', hours: 24 });
  else if (containerCount > 100) bd.push({ step: 'Medium vessel discharge (100-500)', hours: 12 });
  else bd.push({ step: 'Small vessel discharge (<100)', hours: 6 });
  if (direction.startsWith('US') && direction.includes('import')) bd.push({ step: 'CBP hold review (random or targeted)', hours: 4 });
  bd.push({ step: 'Release & gate-out', hours: 2 });
  const total = bd.reduce((s, b) => s + b.hours, 0);
  return { estimatedHours: Math.round(total * 10) / 10, breakdown: bd };
}
