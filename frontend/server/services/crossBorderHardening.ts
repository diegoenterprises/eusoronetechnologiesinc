/**
 * CROSS-BORDER HARDENING SERVICE — Phase 3.3
 * Placards (DOT/TDG/SCT), USMCA/CUSMA Rules of Origin, FAST/SENTRI/NEXUS trusted traveler
 */
import { logger } from '../_core/logger';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: HAZMAT PLACARD SYSTEMS (DOT / TDG / SCT)
// ═══════════════════════════════════════════════════════════════════════════

export type PlacardCountry = 'US' | 'CA' | 'MX';

export interface PlacardClass {
  classNumber: string; division?: string; name: string;
  color: string; symbol: string; unNumberRequired: boolean;
  compatibility: { country: PlacardCountry; accepted: boolean; notes: string }[];
}

export interface PlacardRequirement {
  country: PlacardCountry; regulation: string; authority: string;
  rules: string[]; crossBorderNotes: string;
}

export const PLACARD_CLASSES: PlacardClass[] = [
  { classNumber:'1',division:'1.1',name:'Explosives (mass explosion)',color:'Orange',symbol:'Exploding bomb',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:'DOT 49 CFR 172.522'},{country:'CA',accepted:true,notes:'TDG SOR/2001-286'},{country:'MX',accepted:true,notes:'NOM-004-SCT/2008'}] },
  { classNumber:'1',division:'1.2',name:'Explosives (projection hazard)',color:'Orange',symbol:'Exploding bomb',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'1',division:'1.3',name:'Explosives (fire/minor blast)',color:'Orange',symbol:'Exploding bomb',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'2',division:'2.1',name:'Flammable Gas',color:'Red',symbol:'Flame',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:'DOT 49 CFR 172.532'},{country:'CA',accepted:true,notes:'TDG accepts DOT placards on cross-border'},{country:'MX',accepted:true,notes:'SCT accepts DOT/UN placards'}] },
  { classNumber:'2',division:'2.2',name:'Non-Flammable Gas',color:'Green',symbol:'Gas cylinder',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'2',division:'2.3',name:'Toxic Gas',color:'White',symbol:'Skull & crossbones',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'3',name:'Flammable Liquid',color:'Red',symbol:'Flame',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:'DOT 49 CFR 172.542'},{country:'CA',accepted:true,notes:'DOT placard accepted cross-border'},{country:'MX',accepted:true,notes:'UN placard format accepted'}] },
  { classNumber:'4',division:'4.1',name:'Flammable Solid',color:'Red/White stripes',symbol:'Flame',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'4',division:'4.2',name:'Spontaneously Combustible',color:'Red/White',symbol:'Flame',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'4',division:'4.3',name:'Dangerous When Wet',color:'Blue',symbol:'Flame',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'5',division:'5.1',name:'Oxidizer',color:'Yellow',symbol:'Flame over circle',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'5',division:'5.2',name:'Organic Peroxide',color:'Red/Yellow',symbol:'Flame',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'6',division:'6.1',name:'Toxic',color:'White',symbol:'Skull & crossbones',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'6',division:'6.2',name:'Infectious Substance',color:'White',symbol:'Biohazard',unNumberRequired:false,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'7',name:'Radioactive',color:'White/Yellow',symbol:'Trefoil',unNumberRequired:false,compatibility:[{country:'US',accepted:true,notes:'NRC + DOT'},{country:'CA',accepted:true,notes:'CNSC + TC'},{country:'MX',accepted:true,notes:'CNSNS + SCT'}] },
  { classNumber:'8',name:'Corrosive',color:'Black/White',symbol:'Liquids corroding',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:''},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
  { classNumber:'9',name:'Miscellaneous DG',color:'White/Black stripes',symbol:'9 stripes',unNumberRequired:true,compatibility:[{country:'US',accepted:true,notes:'Lithium batteries, elevated temp'},{country:'CA',accepted:true,notes:''},{country:'MX',accepted:true,notes:''}] },
];

export const PLACARD_REQUIREMENTS: PlacardRequirement[] = [
  { country:'US',regulation:'49 CFR Parts 172.500-560',authority:'PHMSA/DOT',rules:['Placards required on all 4 sides of vehicle/container','UN number on placard or orange panel','DANGEROUS placard for mixed loads (1,000+ lbs each of 2+ hazard classes)','Subsidiary risk placards required','Fumigation placard (FUMIGANT) for fumigated containers','ELEVATED TEMPERATURE placard for hot loads','Placard must be 250mm diamond, readable at 50 feet'],crossBorderNotes:'DOT placards accepted in Canada and Mexico for cross-border moves. No need to switch at border.' },
  { country:'CA',regulation:'TDG Regulations SOR/2001-286 Part 4',authority:'Transport Canada',rules:['Placards on all 4 sides','TDG placard format follows UN GHS closely','Bilingual (EN/FR) shipping documents required','Safety marks must comply with CGSB 43.150','Orange panel with UN number alternative accepted','DANGER/DANGEROUS placard for mixed class loads','Explosive placards: compatibility group letter required'],crossBorderNotes:'DOT placards accepted for cross-border moves. TDG requires bilingual shipping documents even with DOT placards.' },
  { country:'MX',regulation:'NOM-004-SCT/2008',authority:'SCT/SEMARNAT',rules:['Placards on all 4 sides per NOM-004-SCT','UN-format placards accepted','Orange panel (Kemler number + UN number) accepted','Tarjeta de Emergencia (emergency card) required in cab','Environmental hazard placard for marine pollutants','Bilingual (ES/EN) recommended for cross-border'],crossBorderNotes:'DOT and UN format placards accepted. Mexican Tarjeta de Emergencia must accompany shipment in Mexico.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: USMCA / CUSMA / T-MEC RULES OF ORIGIN
// ═══════════════════════════════════════════════════════════════════════════

export interface USMCARuleOfOrigin {
  code: string; name: string; description: string;
  rvcThreshold: number; tariffShift: string;
  applicableSectors: string[];
}

export interface USMCACertificate {
  fields: string[];
  validityPeriod: string;
  blanketPeriod: string;
  languages: string[];
  penalties: string;
}

export const USMCA_ORIGIN_RULES: USMCARuleOfOrigin[] = [
  { code:'WO',name:'Wholly Obtained/Produced',description:'Good is entirely obtained or produced in one or more USMCA countries',rvcThreshold:0,tariffShift:'N/A',applicableSectors:['Agriculture','Mining','Fisheries'] },
  { code:'PE',name:'Produced Entirely',description:'Good produced entirely in USMCA territory using originating materials only',rvcThreshold:0,tariffShift:'N/A',applicableSectors:['Manufacturing','Assembly'] },
  { code:'RVC-TV',name:'Regional Value Content - Transaction Value',description:'RVC calculated using transaction value method',rvcThreshold:75,tariffShift:'Applicable per product-specific rules',applicableSectors:['Automotive','Textiles','Chemicals'] },
  { code:'RVC-NC',name:'Regional Value Content - Net Cost',description:'RVC calculated using net cost method',rvcThreshold:75,tariffShift:'Applicable per product-specific rules',applicableSectors:['Automotive','Electronics','Machinery'] },
  { code:'TSR',name:'Tariff Shift Rule',description:'Non-originating materials undergo tariff classification change',rvcThreshold:0,tariffShift:'Change at heading (CTH) or subheading (CTSH) level',applicableSectors:['All goods with product-specific rules'] },
  { code:'AUTO-LVC',name:'Automotive Labor Value Content',description:'Automotive-specific: minimum labor content from high-wage ($16/hr+) production',rvcThreshold:75,tariffShift:'CTH for auto parts',applicableSectors:['Passenger vehicles','Light trucks','Auto parts'] },
  { code:'STEEL-ALUM',name:'Steel & Aluminum Requirement',description:'70% of steel/aluminum purchases must be melted and poured in USMCA',rvcThreshold:70,tariffShift:'N/A',applicableSectors:['Automotive (steel)','Automotive (aluminum)'] },
  { code:'DE-MINIMIS',name:'De Minimis',description:'Non-originating materials <= 10% of transaction value may be disregarded',rvcThreshold:10,tariffShift:'N/A',applicableSectors:['General goods (except dairy, peanuts, some textiles)'] },
];

export const USMCA_CERTIFICATE: USMCACertificate = {
  fields: [
    'Certifier information (importer, exporter, or producer)',
    'Exporter information (if different from certifier)',
    'Producer information (if known and different)',
    'Importer information',
    'Description of goods',
    'HTS classification (6-digit minimum)',
    'Origin criterion (WO, PE, RVC, TSR, etc.)',
    'Blanket period (if applicable)',
    'Authorized signature and date',
  ],
  validityPeriod: '4 years from date of issuance',
  blanketPeriod: 'Up to 12 months for identical goods',
  languages: ['English', 'French', 'Spanish'],
  penalties: 'False certification: up to $10,000 fine per occurrence. Importer liable for duties + interest if origin claim denied.',
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: TRUSTED TRAVELER / TRUSTED SHIPPER PROGRAMS
// ═══════════════════════════════════════════════════════════════════════════

export interface TrustedProgram {
  id: string; name: string; countries: PlacardCountry[];
  administeredBy: string; description: string;
  benefits: string[]; requirements: string[];
  enrollmentFee: string; renewalPeriod: string;
  applicationType: 'individual' | 'company' | 'both';
  mode: 'truck' | 'all' | 'commercial';
}

export const TRUSTED_PROGRAMS: TrustedProgram[] = [
  { id:'FAST',name:'Free and Secure Trade (FAST)',countries:['US','CA'],administeredBy:'CBP (US) / CBSA (Canada)',description:'Pre-approved, low-risk commercial shipments get expedited border processing at dedicated FAST lanes',benefits:['Dedicated FAST lanes at border','Reduced examination rates','Reduced wait times (avg 50% faster)','Front-of-line privileges','Streamlined customs processing','Access to all FAST-designated ports'],requirements:['C-TPAT membership (US shipper/carrier)','PIP membership (CA shipper/carrier)','FAST card for driver','Clean criminal record','Valid commercial drivers license','Approved by both CBP and CBSA'],enrollmentFee:'$50 USD (driver card)',renewalPeriod:'5 years',applicationType:'both',mode:'truck' },
  { id:'CTPAT',name:'Customs-Trade Partnership Against Terrorism (C-TPAT)',countries:['US'],administeredBy:'CBP',description:'Voluntary public-private partnership strengthening international supply chains and US border security',benefits:['Reduced CBP examinations (4-6x fewer)','Priority processing','Front-of-line at border','Eligibility for FAST','Reduced ISF penalties','Access to C-TPAT Portal','Business resumption priority after incident'],requirements:['Active US importer, carrier, broker, or warehouse','Supply chain security profile','Self-assessment questionnaire','Site validation visit','Ongoing compliance monitoring'],enrollmentFee:'No fee (voluntary)',renewalPeriod:'Annual revalidation',applicationType:'company',mode:'commercial' },
  { id:'PIP',name:'Partners in Protection (PIP)',countries:['CA'],administeredBy:'CBSA',description:'Canadian voluntary security partnership — equivalent to C-TPAT',benefits:['Reduced CBSA examinations','Expedited clearance','Eligibility for FAST','Front-of-line processing','Priority during border disruptions'],requirements:['Canadian importer, exporter, or carrier','Security profile submission','CBSA validation','Ongoing compliance'],enrollmentFee:'No fee',renewalPeriod:'Annual review',applicationType:'company',mode:'commercial' },
  { id:'NEXUS',name:'NEXUS',countries:['US','CA'],administeredBy:'CBP / CBSA (joint)',description:'Expedited border crossing for pre-approved, low-risk travelers between US and Canada',benefits:['Dedicated NEXUS lanes at land borders','Expedited airport processing (kiosks)','Marine telephone reporting','TSA PreCheck eligibility','Global Entry eligibility'],requirements:['Citizen or permanent resident of US or CA','Background check (both countries)','Interview at NEXUS enrollment center','No criminal record','No customs/immigration violations'],enrollmentFee:'$50 USD',renewalPeriod:'5 years',applicationType:'individual',mode:'all' },
  { id:'SENTRI',name:'Secure Electronic Network for Travelers Rapid Inspection',countries:['US','MX'],administeredBy:'CBP',description:'Expedited border crossing for pre-approved travelers at US-Mexico border',benefits:['Dedicated SENTRI lanes','NEXUS lane access','Global Entry eligibility','TSA PreCheck eligibility','Reduced wait times at US-MX ports of entry'],requirements:['US citizen, permanent resident, or Mexican national','Background check','Interview at enrollment center','Vehicle inspection (if vehicle enrolled)','No criminal record'],enrollmentFee:'$122 USD',renewalPeriod:'5 years',applicationType:'individual',mode:'all' },
  { id:'NEEC',name:'Nuevo Esquema de Empresas Certificadas (NEEC)',countries:['MX'],administeredBy:'SAT (Servicio de Administracion Tributaria)',description:'Mexican certified company program — equivalent to C-TPAT/AEO',benefits:['Expedited Mexican customs processing','Reduced SAT examinations','Priority lane at border','Mutual recognition with C-TPAT','Deferred duty payment options','Simplified customs procedures'],requirements:['Active Mexican company with import/export ops','Security profile per SAT guidelines','SAT validation audit','AEO compliance standards','Agente Aduanal involvement'],enrollmentFee:'No fee',renewalPeriod:'Annual audit',applicationType:'company',mode:'commercial' },
  { id:'AEO',name:'Authorized Economic Operator (WCO Framework)',countries:['US','CA','MX'],administeredBy:'World Customs Organization (WCO) / National customs',description:'International framework for trusted traders — C-TPAT, PIP, and NEEC are national AEO implementations',benefits:['Mutual recognition between AEO countries','Simplified customs globally','Reduced inspections worldwide','Priority processing after disruptions'],requirements:['National AEO program membership (C-TPAT/PIP/NEEC)','WCO SAFE Framework compliance','Supply chain security standards'],enrollmentFee:'Via national program',renewalPeriod:'Per national program',applicationType:'company',mode:'commercial' },
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getPlacardClasses(classNumber?: string) {
  if (classNumber) return PLACARD_CLASSES.filter(p => p.classNumber === classNumber);
  return PLACARD_CLASSES;
}

export function getPlacardRequirements(country?: PlacardCountry) {
  if (country) return PLACARD_REQUIREMENTS.filter(r => r.country === country);
  return PLACARD_REQUIREMENTS;
}

export function checkPlacardCrossBorderAcceptance(classNumber: string, division: string | undefined, fromCountry: PlacardCountry, toCountry: PlacardCountry): { accepted: boolean; notes: string; additionalRequirements: string[] } {
  const cls = PLACARD_CLASSES.find(p => p.classNumber === classNumber && (!division || p.division === division));
  if (!cls) return { accepted: false, notes: 'Unknown placard class', additionalRequirements: [] };
  const destCompat = cls.compatibility.find(c => c.country === toCountry);
  const additional: string[] = [];
  if (toCountry === 'CA') additional.push('Bilingual (EN/FR) shipping documents required under TDG');
  if (toCountry === 'MX') additional.push('Tarjeta de Emergencia required in cab for Mexican territory');
  if (fromCountry === 'MX' && toCountry === 'US') additional.push('Verify DOT-equivalent placard format or switch at border');
  return { accepted: destCompat?.accepted ?? true, notes: destCompat?.notes || 'Generally accepted under mutual recognition', additionalRequirements: additional };
}

export function getUSMCAOriginRules(sector?: string) {
  if (sector) return USMCA_ORIGIN_RULES.filter(r => r.applicableSectors.some(s => s.toLowerCase().includes(sector.toLowerCase())));
  return USMCA_ORIGIN_RULES;
}

export function getUSMCACertificateRequirements() { return USMCA_CERTIFICATE; }

export function checkUSMCAEligibility(params: { rvcPercent: number; originCountries: PlacardCountry[]; hasOriginCert: boolean; htsCovered: boolean; }): { eligible: boolean; checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string; }[] } {
  const checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] = [];
  const usmcaCountries = ['US', 'CA', 'MX'];
  const allUSMCA = params.originCountries.every(c => usmcaCountries.includes(c));
  checks.push({ rule: 'Origin countries', status: allUSMCA ? 'pass' : 'fail', detail: allUSMCA ? 'All origin countries are USMCA members' : 'Non-USMCA origin country detected' });
  checks.push({ rule: 'Regional Value Content', status: params.rvcPercent >= 75 ? 'pass' : params.rvcPercent >= 60 ? 'warning' : 'fail', detail: `RVC: ${params.rvcPercent}% (threshold: 75% TV or NC method)` });
  checks.push({ rule: 'Certificate of Origin', status: params.hasOriginCert ? 'pass' : 'fail', detail: params.hasOriginCert ? 'USMCA certification of origin provided' : 'Missing USMCA certificate — duties will apply' });
  checks.push({ rule: 'HTS classification', status: params.htsCovered ? 'pass' : 'warning', detail: params.htsCovered ? 'HTS code covered by USMCA product-specific rules' : 'Verify HTS product-specific rules apply' });
  const eligible = checks.every(c => c.status === 'pass');
  logger.info(`[USMCA] Eligibility check: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (RVC: ${params.rvcPercent}%)`);
  return { eligible, checks };
}

export function getTrustedPrograms(params?: { country?: PlacardCountry; mode?: string; type?: 'individual'|'company'|'both'; }) {
  let r = [...TRUSTED_PROGRAMS];
  if (params?.country) r = r.filter(p => p.countries.includes(params.country!));
  if (params?.mode) r = r.filter(p => p.mode === params.mode || p.mode === 'all' || p.mode === 'commercial');
  if (params?.type) r = r.filter(p => p.applicationType === params.type || p.applicationType === 'both');
  return r;
}

export function checkFASTEligibility(params: { hasCtpat: boolean; hasPip: boolean; driverHasFastCard: boolean; cleanRecord: boolean; }): { eligible: boolean; checks: { requirement: string; status: 'pass'|'fail'; detail: string; }[] } {
  const checks: { requirement: string; status: 'pass'|'fail'; detail: string }[] = [
    { requirement: 'C-TPAT membership', status: params.hasCtpat ? 'pass' : 'fail', detail: params.hasCtpat ? 'Active C-TPAT member' : 'C-TPAT required for FAST eligibility' },
    { requirement: 'PIP membership', status: params.hasPip ? 'pass' : 'fail', detail: params.hasPip ? 'Active PIP member' : 'PIP required for Canadian side of FAST' },
    { requirement: 'Driver FAST card', status: params.driverHasFastCard ? 'pass' : 'fail', detail: params.driverHasFastCard ? 'Valid FAST card' : 'Driver must apply for FAST card' },
    { requirement: 'Clean record', status: params.cleanRecord ? 'pass' : 'fail', detail: params.cleanRecord ? 'No criminal/customs violations' : 'Record issues may disqualify' },
  ];
  const eligible = checks.every(c => c.status === 'pass');
  logger.info(`[FAST] Eligibility: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
  return { eligible, checks };
}

export function estimateBorderTimeSavings(programId: string): { standardMinutes: number; programMinutes: number; savingsPercent: number } {
  const estimates: Record<string, { standard: number; program: number }> = {
    FAST: { standard: 90, program: 25 },
    CTPAT: { standard: 90, program: 45 },
    PIP: { standard: 75, program: 35 },
    NEXUS: { standard: 60, program: 15 },
    SENTRI: { standard: 120, program: 30 },
    NEEC: { standard: 100, program: 40 },
  };
  const est = estimates[programId] || { standard: 90, program: 45 };
  return { standardMinutes: est.standard, programMinutes: est.program, savingsPercent: Math.round((1 - est.program / est.standard) * 100) };
}
