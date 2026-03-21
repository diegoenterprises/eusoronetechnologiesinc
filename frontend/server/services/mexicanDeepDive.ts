/**
 * MEXICAN DEEP-DIVE SERVICE — Phase 4.2
 * VUCEM portal, NOM standards, Mexican tax (IVA/IEPS/DTA), IMMEX/maquiladora,
 * border crossing infrastructure, and Mexican regulatory authorities
 */
import { logger } from '../_core/logger';

export type MXState = 'AGU'|'BCN'|'BCS'|'CAM'|'CHP'|'CHH'|'COA'|'COL'|'DUR'|'GUA'|'GRO'|'HID'|'JAL'|'MEX'|'MIC'|'MOR'|'NAY'|'NLE'|'OAX'|'PUE'|'QUE'|'ROO'|'SLP'|'SIN'|'SON'|'TAB'|'TAM'|'TLA'|'VER'|'YUC'|'ZAC'|'CMX';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: VUCEM (Ventanilla Unica de Comercio Exterior Mexicano)
// ═══════════════════════════════════════════════════════════════════════════

export interface VUCEMProcedure {
  id: string; name: string; nameEs: string; authority: string;
  description: string; requiredFor: string[];
  estimatedDays: number; digitalSignature: boolean; cost: { amount: number; currency: 'MXN' };
}

export const VUCEM_PROCEDURES: VUCEMProcedure[] = [
  { id:'VUCEM-01',name:'Importer Registry (Padron de Importadores)',nameEs:'Padron de Importadores',authority:'SAT',description:'Register as authorized importer in Mexico',requiredFor:['All imports into Mexico'],estimatedDays:5,digitalSignature:true,cost:{amount:0,currency:'MXN'} },
  { id:'VUCEM-02',name:'Importer Registry - Specific Sectors',nameEs:'Padron de Importadores de Sectores Especificos',authority:'SAT',description:'Additional registry for controlled goods (chemicals, textiles, electronics, steel)',requiredFor:['Controlled sector imports'],estimatedDays:10,digitalSignature:true,cost:{amount:0,currency:'MXN'} },
  { id:'VUCEM-03',name:'Phytosanitary Import Permit',nameEs:'Permiso Fitosanitario de Importacion',authority:'SENASICA',description:'Import permit for plants, fruits, vegetables, seeds',requiredFor:['Agriculture imports','Fresh produce','Seeds','Plants'],estimatedDays:7,digitalSignature:true,cost:{amount:1500,currency:'MXN'} },
  { id:'VUCEM-04',name:'Zoosanitary Import Permit',nameEs:'Permiso Zoosanitario de Importacion',authority:'SENASICA',description:'Import permit for live animals, animal products',requiredFor:['Live animals','Meat products','Dairy','Animal feed'],estimatedDays:7,digitalSignature:true,cost:{amount:1500,currency:'MXN'} },
  { id:'VUCEM-05',name:'COFEPRIS Sanitary Registration',nameEs:'Registro Sanitario COFEPRIS',authority:'COFEPRIS',description:'Sanitary registration for processed foods, beverages, supplements, cosmetics',requiredFor:['Processed foods','Beverages','Supplements','Cosmetics','Medicines'],estimatedDays:30,digitalSignature:true,cost:{amount:15000,currency:'MXN'} },
  { id:'VUCEM-06',name:'SEMARNAT Import License',nameEs:'Licencia de Importacion SEMARNAT',authority:'SEMARNAT',description:'Environmental import license for hazardous materials, chemicals, waste',requiredFor:['Hazardous materials','Chemicals','Waste','CITES species'],estimatedDays:15,digitalSignature:true,cost:{amount:3000,currency:'MXN'} },
  { id:'VUCEM-07',name:'SCT Hazmat Transport Permit',nameEs:'Permiso SCT Transporte de Materiales Peligrosos',authority:'SCT',description:'Federal permit for transporting hazardous materials on Mexican roads/rails',requiredFor:['Hazmat transport in Mexico'],estimatedDays:10,digitalSignature:true,cost:{amount:5000,currency:'MXN'} },
  { id:'VUCEM-08',name:'NOM Compliance Certificate',nameEs:'Certificado de Cumplimiento NOM',authority:'SE (Secretaria de Economia)',description:'Certificate proving product meets applicable NOM standards',requiredFor:['Consumer products','Electronics','Textiles','Toys','Automotive parts'],estimatedDays:20,digitalSignature:true,cost:{amount:8000,currency:'MXN'} },
  { id:'VUCEM-09',name:'IMMEX Program Registration',nameEs:'Registro Programa IMMEX',authority:'SE',description:'Register for IMMEX (maquiladora) temporary import program',requiredFor:['Maquiladora operations','Temporary imports for manufacturing'],estimatedDays:30,digitalSignature:true,cost:{amount:0,currency:'MXN'} },
  { id:'VUCEM-10',name:'Carta Porte Complement',nameEs:'Complemento Carta Porte CFDI',authority:'SAT',description:'Digital tax document required for all freight transport in Mexico',requiredFor:['All domestic and cross-border freight in Mexico'],estimatedDays:0,digitalSignature:true,cost:{amount:0,currency:'MXN'} },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: NOM STANDARDS (Normas Oficiales Mexicanas)
// ═══════════════════════════════════════════════════════════════════════════

export interface NOMStandard {
  id: string; title: string; titleEs: string; authority: string;
  sector: string; scope: string; requirements: string[];
  penaltyForNonCompliance: string;
}

export const NOM_STANDARDS: NOMStandard[] = [
  { id:'NOM-012-SCT-2-2017',title:'Weight and Dimensions for Vehicles',titleEs:'Peso y Dimensiones Maximas para Vehiculos',authority:'SCT',sector:'Transport',scope:'Max weight and dimensions for all freight vehicles on federal roads',requirements:['Max GVW per vehicle type (semi: 44t, full: 66.5t)','Axle weight limits','Dimension limits (width 2.6m, height 4.25m)','Weight verification at inspection stations','Vehicle configuration compliance'],penaltyForNonCompliance:'Fines 500-10,000 UMA ($54,000-$1,080,000 MXN approx), vehicle impoundment' },
  { id:'NOM-002-SCT-2011',title:'Hazmat Transport Conditions',titleEs:'Condiciones para el Transporte de Materiales Peligrosos',authority:'SCT',sector:'Hazmat',scope:'Safety conditions for transporting hazardous materials',requirements:['UN-approved packaging','Placards and safety marks per SCT classification','Emergency response card (Tarjeta de Emergencia)','Driver training certification','Vehicle safety equipment','Environmental insurance'],penaltyForNonCompliance:'Fines 1,000-20,000 UMA, vehicle impoundment, criminal charges for spills' },
  { id:'NOM-004-SCT-2008',title:'Hazmat Placards and Safety Marks',titleEs:'Sistema de Identificacion de Unidades para Materiales Peligrosos',authority:'SCT',sector:'Hazmat',scope:'Placard system for hazmat vehicles — compatible with UN/DOT system',requirements:['Diamond placards per UN class','UN number display','Emergency contact number','Bilingual labels (Spanish primary)'],penaltyForNonCompliance:'Fines 500-5,000 UMA, vehicle detained until compliant' },
  { id:'NOM-051-SCFI/SSA1-2010',title:'Food and Beverage Labeling',titleEs:'Especificaciones de Etiquetado para Alimentos y Bebidas',authority:'SE/SSA',sector:'Food',scope:'Labeling requirements for pre-packaged food and non-alcoholic beverages',requirements:['Spanish language labeling','Nutritional facts table (NOM format)','Front-of-pack warning labels (octagonal)','Ingredient list','Allergen warnings','Net content in metric','Manufacturer/importer info'],penaltyForNonCompliance:'Product seizure, fines, import refusal by COFEPRIS' },
  { id:'NOM-020-SCFI-1997',title:'Commercial Information for Products',titleEs:'Informacion Comercial — Etiquetado de Productos Textiles',authority:'SE',sector:'Textiles',scope:'Labeling requirements for textile products',requirements:['Fiber composition in Spanish','Country of origin','Importer/manufacturer name and address','Care instructions','Size information'],penaltyForNonCompliance:'Product seizure, fines 500-5,000 UMA' },
  { id:'NOM-141-SSA1/SCFI-2012',title:'Cosmetics Labeling',titleEs:'Etiquetado de Productos Cosmeticos',authority:'SE/SSA',sector:'Cosmetics',scope:'Labeling and ingredient requirements for cosmetic products',requirements:['Spanish labeling','INCI ingredient list','Net content','Manufacturer/distributor info','Batch number','Expiry date if applicable'],penaltyForNonCompliance:'Product seizure, COFEPRIS sanctions' },
  { id:'NOM-251-SSA1-2009',title:'Food Safety Practices',titleEs:'Practicas de Higiene para el Proceso de Alimentos',authority:'SSA',sector:'Food Safety',scope:'Hygiene and food safety practices for food processing and transport',requirements:['Temperature control documentation','Clean transport vehicles','Personnel hygiene','Pest control','Traceability records'],penaltyForNonCompliance:'Facility closure, product seizure, fines' },
];


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: MEXICAN TAX (IVA / IEPS / DTA)
// ═══════════════════════════════════════════════════════════════════════════

export interface MexicanImportTax {
  code: string; name: string; nameEs: string;
  rate: number | string; base: string;
  exemptions: string[]; notes: string;
}

export const MEXICAN_IMPORT_TAXES: MexicanImportTax[] = [
  { code:'IGI',name:'General Import Tax (Tariff)',nameEs:'Impuesto General de Importacion',rate:'0-35% (per HTS fraction)',base:'Customs value (CIF)',exemptions:['USMCA/T-MEC qualifying goods (0%)','IMMEX temporary imports','Diplomatic goods'],notes:'Rate depends on HTS tariff fraction. USMCA certificate of origin eliminates or reduces IGI.' },
  { code:'IVA',name:'Value Added Tax',nameEs:'Impuesto al Valor Agregado',rate:16,base:'Customs value + IGI + DTA',exemptions:['IMMEX temporary imports (deferred)','Border region reduced rate ended 2014','Some food/medicine at 0%'],notes:'Standard 16% IVA applies to most imports. Creditable against domestic IVA for registered taxpayers.' },
  { code:'IEPS',name:'Special Production/Services Tax',nameEs:'Impuesto Especial sobre Produccion y Servicios',rate:'Variable (3-160%)',base:'Customs value or per unit',exemptions:['Products not subject to IEPS'],notes:'Applies to: alcohol (26.5-53%), tobacco (160%), sugary beverages (MXN $1.17/L), fuel, pesticides. Not all imports subject.' },
  { code:'DTA',name:'Customs Processing Fee',nameEs:'Derecho de Tramite Aduanero',rate:'0.8% (general) or fixed fee',base:'Customs value',exemptions:['USMCA goods: fixed fee ~MXN $400','IMMEX: fixed fee ~MXN $400','Temporary imports for events'],notes:'General imports pay 0.8% of customs value. USMCA and IMMEX imports pay reduced fixed fee.' },
  { code:'PRV',name:'Prevalidation Fee',nameEs:'Derecho de Prevalidacion',rate:'Fixed ~MXN $238 per pedimento',base:'Per pedimento',exemptions:[],notes:'Fee charged by authorized prevalidation companies for pedimento electronic submission.' },
  { code:'CC',name:'Countervailing Duty',nameEs:'Cuota Compensatoria',rate:'Variable per product/origin',base:'Customs value',exemptions:['Origins not subject to anti-dumping order'],notes:'Applied to specific products from specific countries subject to anti-dumping/countervailing duty orders by SE.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: IMMEX / MAQUILADORA PROGRAM
// ═══════════════════════════════════════════════════════════════════════════

export interface IMMEXProgram {
  type: string; name: string; nameEs: string;
  description: string; benefits: string[];
  requirements: string[]; temporaryImportPeriod: string;
}

export const IMMEX_PROGRAMS: IMMEXProgram[] = [
  { type:'IMMEX-IND',name:'Industrial IMMEX',nameEs:'IMMEX Industrial',description:'Standard maquiladora program for manufacturing/assembly for export',benefits:['Temporary duty-free import of raw materials','Temporary duty-free import of machinery/equipment','IVA deferral on temporary imports','Simplified customs procedures','No IGI on inputs destined for export'],requirements:['Export min 10% of total sales (value) or $500K USD annually','SE authorization via VUCEM','Annual report to SE','Annex 24 inventory control system','Annex 31 for virtual transfers','IMMEX company RFC registration'],temporaryImportPeriod:'18 months for raw materials, up to 4 years for machinery' },
  { type:'IMMEX-SRV',name:'Services IMMEX',nameEs:'IMMEX de Servicios',description:'IMMEX for service companies (repair, recalibration, testing)',benefits:['Temporary import of goods for servicing','IVA deferral','Simplified procedures'],requirements:['Provide export services','SE authorization','Demonstrate service export activity'],temporaryImportPeriod:'18 months for serviced goods' },
  { type:'IMMEX-ALB',name:'Shelter IMMEX (Albergue)',nameEs:'IMMEX Albergue (Shelter)',description:'Shelter program for foreign companies operating in Mexico without own legal entity',benefits:['Foreign company operates under Mexican shelter company IMMEX','No need for own Mexican entity initially','Temporary duty-free imports under shelter','Full compliance handled by shelter operator'],requirements:['Contract with authorized shelter company','Foreign company provides technical direction','Shelter company handles all regulatory compliance','Transition to own IMMEX after 4 years'],temporaryImportPeriod:'18 months for materials, 4 years for equipment' },
  { type:'IMMEX-3PL',name:'Third-Party Logistics IMMEX',nameEs:'IMMEX de Terciarizacion',description:'IMMEX for logistics/warehouse companies managing goods for multiple IMMEX holders',benefits:['Manage inventory for multiple IMMEX companies','Consolidated customs operations','IVA deferral on handled goods'],requirements:['SE authorization as 3PL IMMEX','Annex 24 inventory for each client','Separate accounting per IMMEX client'],temporaryImportPeriod:'Same as client IMMEX program' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: MAJOR MX BORDER CROSSINGS
// ═══════════════════════════════════════════════════════════════════════════

export interface MXBorderCrossing {
  id: string; nameMX: string; nameUS: string; state: MXState; usState: string;
  type: 'commercial' | 'commercial_and_passenger' | 'rail';
  annualTruckCrossings: number; avgWaitMinutes: number;
  infrastructure: string[]; specialPrograms: string[];
}

export const MX_BORDER_CROSSINGS: MXBorderCrossing[] = [
  { id:'MX-LRD',nameMX:'Nuevo Laredo (World Trade Bridge)',nameUS:'Laredo, TX',state:'TAM',usState:'TX',type:'commercial',annualTruckCrossings:2500000,avgWaitMinutes:45,infrastructure:['16 northbound commercial lanes','FAST/SENTRI lanes','X-ray inspection','Pre-clearance area','Bonded warehouses','Rail bridge (separate)'],specialPrograms:['C-TPAT','NEEC','FAST','AEO mutual recognition'] },
  { id:'MX-TIJ',nameMX:'Tijuana (Otay Mesa)',nameUS:'San Diego (Otay Mesa), CA',state:'BCN',usState:'CA',type:'commercial',annualTruckCrossings:1200000,avgWaitMinutes:60,infrastructure:['12 northbound commercial lanes','FAST/SENTRI lanes','X-ray','Bonded area','Cross-border Xpress (passenger)'],specialPrograms:['C-TPAT','NEEC','FAST','SENTRI'] },
  { id:'MX-CJZ',nameMX:'Ciudad Juarez (BOTA/Zaragoza)',nameUS:'El Paso, TX',state:'CHH',usState:'TX',type:'commercial_and_passenger',annualTruckCrossings:900000,avgWaitMinutes:50,infrastructure:['10 commercial lanes','FAST lanes','X-ray','Maquiladora corridor access'],specialPrograms:['C-TPAT','NEEC','FAST'] },
  { id:'MX-REY',nameMX:'Reynosa (Pharr Bridge)',nameUS:'Pharr/McAllen, TX',state:'TAM',usState:'TX',type:'commercial',annualTruckCrossings:700000,avgWaitMinutes:40,infrastructure:['8 commercial lanes','FAST lanes','X-ray','Agricultural inspection'],specialPrograms:['C-TPAT','NEEC','FAST'] },
  { id:'MX-NOG',nameMX:'Nogales (Mariposa)',nameUS:'Nogales, AZ',state:'SON',usState:'AZ',type:'commercial',annualTruckCrossings:400000,avgWaitMinutes:35,infrastructure:['6 commercial lanes','FAST lanes','Fresh produce inspection facility','USDA pre-clearance'],specialPrograms:['C-TPAT','NEEC','FAST'] },
  { id:'MX-MXL',nameMX:'Mexicali',nameUS:'Calexico, CA',state:'BCN',usState:'CA',type:'commercial',annualTruckCrossings:350000,avgWaitMinutes:30,infrastructure:['6 commercial lanes','FAST lanes','X-ray'],specialPrograms:['C-TPAT','NEEC','FAST'] },
  { id:'MX-PNE',nameMX:'Piedras Negras',nameUS:'Eagle Pass, TX',state:'COA',usState:'TX',type:'commercial',annualTruckCrossings:250000,avgWaitMinutes:25,infrastructure:['4 commercial lanes','X-ray','Rail crossing nearby'],specialPrograms:['C-TPAT','NEEC'] },
  { id:'MX-MAT',nameMX:'Matamoros (Veterans Bridge)',nameUS:'Brownsville, TX',state:'TAM',usState:'TX',type:'commercial',annualTruckCrossings:200000,avgWaitMinutes:30,infrastructure:['4 commercial lanes','FAST lanes','X-ray','Port of Brownsville nearby'],specialPrograms:['C-TPAT','NEEC','FAST'] },
];


// ═══════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getVUCEMProcedures(authority?: string) {
  if (authority) return VUCEM_PROCEDURES.filter(p => p.authority === authority);
  return VUCEM_PROCEDURES;
}

export function getVUCEMForProduct(productType: string): VUCEMProcedure[] {
  const lower = productType.toLowerCase();
  return VUCEM_PROCEDURES.filter(p =>
    p.requiredFor.some(r => r.toLowerCase().includes(lower))
  );
}

export function getNOMStandards(sector?: string) {
  if (sector) return NOM_STANDARDS.filter(n => n.sector.toLowerCase() === sector.toLowerCase());
  return NOM_STANDARDS;
}

export function getMexicanImportTaxes() { return MEXICAN_IMPORT_TAXES; }

export function estimateMexicanImportTaxes(params: {
  customsValueUSD: number; htsRate: number; isUSMCA: boolean;
  isIMMEX: boolean; hasIEPS: boolean; iepsRate: number;
}): { taxes: { code: string; name: string; amount: number; currency: string }[]; total: number; totalMXN: number; exchangeRate: number; notes: string[] } {
  const fxRate = 17.5; // approximate USD/MXN
  const cvMXN = params.customsValueUSD * fxRate;
  const taxes: { code: string; name: string; amount: number; currency: string }[] = [];
  const notes: string[] = [];
  let total = 0;

  // IGI (tariff)
  const igiRate = params.isUSMCA ? 0 : params.htsRate;
  const igi = cvMXN * (igiRate / 100);
  taxes.push({ code: 'IGI', name: 'General Import Tax', amount: Math.round(igi), currency: 'MXN' });
  total += igi;
  if (params.isUSMCA) notes.push('IGI eliminated under USMCA/T-MEC preferential treatment');

  // DTA
  const dta = (params.isUSMCA || params.isIMMEX) ? 400 : cvMXN * 0.008;
  taxes.push({ code: 'DTA', name: 'Customs Processing Fee', amount: Math.round(dta), currency: 'MXN' });
  total += dta;

  // PRV
  taxes.push({ code: 'PRV', name: 'Prevalidation Fee', amount: 238, currency: 'MXN' });
  total += 238;

  // IEPS if applicable
  if (params.hasIEPS) {
    const ieps = cvMXN * (params.iepsRate / 100);
    taxes.push({ code: 'IEPS', name: 'Special Tax (IEPS)', amount: Math.round(ieps), currency: 'MXN' });
    total += ieps;
  }

  // IVA (16% on customs value + IGI + DTA)
  const ivaBase = cvMXN + igi + dta;
  const iva = params.isIMMEX ? 0 : ivaBase * 0.16;
  taxes.push({ code: 'IVA', name: 'Value Added Tax (16%)', amount: Math.round(iva), currency: 'MXN' });
  total += iva;
  if (params.isIMMEX) notes.push('IVA deferred under IMMEX program');

  const totalRounded = Math.round(total);
  logger.info(`[MXImportTax] Value: $${params.customsValueUSD} USD, Total tax: ${totalRounded} MXN, USMCA=${params.isUSMCA}, IMMEX=${params.isIMMEX}`);
  return { taxes, total: totalRounded, totalMXN: totalRounded, exchangeRate: fxRate, notes };
}

export function getIMMEXPrograms(type?: string) {
  if (type) return IMMEX_PROGRAMS.filter(p => p.type === type);
  return IMMEX_PROGRAMS;
}

export function getMXBorderCrossings(params?: { state?: MXState; type?: string; minCapacity?: number }) {
  let r = [...MX_BORDER_CROSSINGS];
  if (params?.state) r = r.filter(c => c.state === params.state);
  if (params?.type) r = r.filter(c => c.type === params.type || c.type === 'commercial_and_passenger');
  if (params?.minCapacity) r = r.filter(c => c.annualTruckCrossings >= params.minCapacity!);
  return r;
}

export function checkMexicanImportCompliance(params: {
  hasRFC: boolean; hasPadronImportadores: boolean;
  hasAgenteAduanal: boolean; hasCartaPorte: boolean;
  productType: string; hasNOMCert: boolean;
  isUSMCA: boolean; hasOriginCert: boolean;
}): { compliant: boolean; checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] } {
  const checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] = [];

  checks.push({ rule: 'RFC (Tax ID)', status: params.hasRFC ? 'pass' : 'fail', detail: params.hasRFC ? 'Valid RFC registered' : 'Mexican RFC required for imports' });
  checks.push({ rule: 'Padron de Importadores', status: params.hasPadronImportadores ? 'pass' : 'fail', detail: params.hasPadronImportadores ? 'Registered in Padron' : 'Must register in Padron de Importadores via VUCEM' });
  checks.push({ rule: 'Agente Aduanal', status: params.hasAgenteAduanal ? 'pass' : 'fail', detail: params.hasAgenteAduanal ? 'Licensed agente aduanal engaged' : 'Agente Aduanal required for customs clearance' });
  checks.push({ rule: 'Carta Porte CFDI', status: params.hasCartaPorte ? 'pass' : 'fail', detail: params.hasCartaPorte ? 'Carta Porte generated' : 'Carta Porte CFDI 2.0 required for all freight in Mexico' });

  const vucem = getVUCEMForProduct(params.productType);
  if (vucem.length > 0) {
    checks.push({ rule: 'VUCEM permits', status: params.hasNOMCert ? 'pass' : 'warning', detail: `Product "${params.productType}" may require: ${vucem.map(v => v.name).join(', ')}` });
  }

  const noms = NOM_STANDARDS.filter(n => n.scope.toLowerCase().includes(params.productType.toLowerCase()));
  if (noms.length > 0) {
    checks.push({ rule: 'NOM compliance', status: params.hasNOMCert ? 'pass' : 'warning', detail: `Applicable NOMs: ${noms.map(n => n.id).join(', ')}` });
  }

  if (params.isUSMCA) {
    checks.push({ rule: 'USMCA/T-MEC origin cert', status: params.hasOriginCert ? 'pass' : 'fail', detail: params.hasOriginCert ? 'Origin certificate provided' : 'USMCA certificate of origin required for preferential tariff' });
  }

  const compliant = checks.every(c => c.status !== 'fail');
  logger.info(`[MXImportCompliance] product=${params.productType} USMCA=${params.isUSMCA}: ${compliant ? 'PASS' : 'FAIL'}`);
  return { compliant, checks };
}
