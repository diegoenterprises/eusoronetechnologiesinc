/**
 * CROSS-BORDER VERTICALS SERVICE — Phase 3.4
 * Cargo-specific cross-border regulations: Reefer, Hazmat, Oversized, Agriculture/Food
 */
import { logger } from '../_core/logger';
export type VerticalCountry = 'US' | 'CA' | 'MX';

export interface ReeferRegulation { country: VerticalCountry; authority: string; regulation: string; requirements: string[]; tempRanges: { commodity: string; minC: number; maxC: number; }[]; crossBorderNotes: string; }
export interface HazmatCrossBorderRule { country: VerticalCountry; authority: string; regulation: string; requirements: string[]; prohibitions: string[]; borderSpecifics: string[]; emergencyProtocol: string; }
export interface OversizedPermitRule { country: VerticalCountry; authority: string; standardLimits: { dimension: string; limit: string; unit: string; }[]; permitProcess: string[]; crossBorderNotes: string; escortRequirements: string[]; }
export interface AgricultureRule { country: VerticalCountry; authority: string; importRequirements: string[]; phytosanitaryRules: string[]; prohibitedItems: string[]; crossBorderNotes: string; }

export const REEFER_REGULATIONS: ReeferRegulation[] = [
  { country:'US',authority:'FDA / FMCSA / USDA',regulation:'FSMA 21 CFR Part 1, Subpart O',requirements:['FSMA Sanitary Transport Rule compliance','Temperature monitoring devices required','Pre-cooling verification before loading','Written procedures for cleaning/inspection/temp maintenance','Training records for food transport personnel','Shipper must specify temp requirements in writing','Records retained 12 months minimum'],tempRanges:[{commodity:'Fresh produce',minC:0,maxC:4},{commodity:'Frozen foods',minC:-23,maxC:-18},{commodity:'Dairy products',minC:0,maxC:4},{commodity:'Fresh meat/poultry',minC:-2,maxC:2},{commodity:'Seafood/fish',minC:-1,maxC:2},{commodity:'Pharmaceuticals',minC:2,maxC:8},{commodity:'Ice cream',minC:-29,maxC:-23},{commodity:'Flowers/plants',minC:1,maxC:7}],crossBorderNotes:'FDA Prior Notice required for food imports. USDA/APHIS phytosanitary cert for produce entering US.' },
  { country:'CA',authority:'CFIA / Transport Canada',regulation:'Safe Food for Canadians Act (SFCA)',requirements:['CFIA Preventive Control Plan (PCP)','SFCR compliance','Continuous temperature monitoring','CFIA import license for most food products','Bilingual EN/FR labeling','COR certification for organic products'],tempRanges:[{commodity:'Fresh produce',minC:0,maxC:4},{commodity:'Frozen foods',minC:-23,maxC:-18},{commodity:'Dairy products',minC:0,maxC:4},{commodity:'Fresh meat/poultry',minC:-2,maxC:2},{commodity:'Seafood/fish',minC:-1,maxC:2},{commodity:'Pharmaceuticals',minC:2,maxC:8}],crossBorderNotes:'CFIA may inspect at border. Bilingual labels mandatory. CUSMA origin cert for duty-free produce.' },
  { country:'MX',authority:'SENASICA / COFEPRIS / SCT',regulation:'NOM-002-SAG/GAN-2016 + NOM-251-SSA1-2009',requirements:['SENASICA phytosanitary/zoosanitary import permit','COFEPRIS sanitary registration for processed foods','NOM-002-SAG compliance for animal products','Temperature log in Spanish required','Agente Aduanal must verify cold chain at border','VUCEM electronic filing for food imports'],tempRanges:[{commodity:'Fresh produce',minC:0,maxC:4},{commodity:'Frozen foods',minC:-23,maxC:-18},{commodity:'Fresh meat/poultry',minC:-2,maxC:2},{commodity:'Dairy products',minC:0,maxC:4},{commodity:'Seafood/fish',minC:-1,maxC:2}],crossBorderNotes:'SENASICA inspection mandatory. Import permit via VUCEM before arrival. NOM labels required.' },
];

export const HAZMAT_CROSS_BORDER: HazmatCrossBorderRule[] = [
  { country:'US',authority:'PHMSA / DOT / CBP',regulation:'49 CFR Parts 100-185',requirements:['Hazmat endorsement (H) on CDL','TSA security threat assessment','Shipping papers per 49 CFR 172.200','Emergency response info (ERG or 24-hr number)','Placards per 49 CFR 172 Subpart F','DOT-spec packaging per 49 CFR 178','Hazmat registration PHMSA F 5800.2'],prohibitions:['Class 1.1 explosives banned from tunnels','Class 7 route restrictions near population centers','Some chemicals banned from specific border crossings'],borderSpecifics:['Hazmat loads directed to specific inspection lanes','X-ray/physical inspection likely for Class 1,6,7','C-TPAT reduces inspection probability','ACE pre-notification required for hazmat imports'],emergencyProtocol:'911 + CHEMTREC 1-800-424-9300' },
  { country:'CA',authority:'Transport Canada / CBSA / CANUTEC',regulation:'TDG Act + SOR/2001-286',requirements:['TDG training certificate (valid 3 years)','Bilingual EN/FR shipping document','Safety marks per TDG Part 4','ERAP for certain DG','CBSA advance reporting for DG imports'],prohibitions:['Certain explosives prohibited on passenger ferries','Route restrictions near population centers for Class 1,7'],borderSpecifics:['CBSA may require ERAP number at border','PIP/C-TPAT mutual recognition speeds DG processing','DOT placards accepted; TDG shipping documents required','CANUTEC number must be on documents'],emergencyProtocol:'911 + CANUTEC 613-996-6666' },
  { country:'MX',authority:'SCT / SEMARNAT / Proteccion Civil',regulation:'NOM-002-SCT/2011 + NOM-004-SCT/2008',requirements:['SCT hazmat transport license','NOM-002-SCT compliance','NOM-004-SCT placards','Tarjeta de Emergencia in cab (Spanish)','Seguro ambiental for certain materials','SEMARNAT permit for hazardous waste','Agente Aduanal for hazmat imports'],prohibitions:['Certain explosives banned from urban routes','Nuclear materials require CNSNS authorization'],borderSpecifics:['SAT/Aduana dedicated hazmat inspection lane','NEEC certification reduces inspection time','Tarjeta de Emergencia mandatory from border','Environmental insurance proof required'],emergencyProtocol:'911 + SETIQ 800-002-1400' },
];

export const OVERSIZED_RULES: OversizedPermitRule[] = [
  { country:'US',authority:'FHWA / State DOTs',standardLimits:[{dimension:'Width',limit:'8.5',unit:'ft (2.6m)'},{dimension:'Height',limit:'13.5',unit:'ft (4.1m) varies by state'},{dimension:'Length (semi)',limit:'48-53',unit:'ft varies by state'},{dimension:'GVW',limit:'80,000',unit:'lbs (36,287 kg)'},{dimension:'Single axle',limit:'20,000',unit:'lbs'},{dimension:'Tandem axle',limit:'34,000',unit:'lbs'}],permitProcess:['Apply to each state DOT','Route survey for super-loads','Time-of-travel restrictions (sunrise-sunset)','Bridge analysis for overweight','Federal Bridge Formula compliance'],crossBorderNotes:'US permit does not cover MX/CA territory. Separate permits required. Coordinate with CBP for oversized at border.',escortRequirements:['Width >12ft: 1 escort','Width >14ft: 2 escorts + law enforcement','Width >16ft: Full escort + route survey','Super-loads >200k lbs: Full engineering + multi-escort'] },
  { country:'CA',authority:'Provincial Ministries of Transport',standardLimits:[{dimension:'Width',limit:'2.6',unit:'m'},{dimension:'Height',limit:'4.15',unit:'m'},{dimension:'Length (semi)',limit:'16.2',unit:'m'},{dimension:'GVW',limit:'63,500',unit:'kg varies by province'},{dimension:'Tridem axle',limit:'24,000',unit:'kg'},{dimension:'Tandem axle',limit:'17,000',unit:'kg'}],permitProcess:['Apply to each province','MOU between provinces may simplify','National Safety Code compliance','B-train/LCV permits for specific corridors'],crossBorderNotes:'CA permits not valid in US. GVW limits differ from US (higher in CA for some configs).',escortRequirements:['Width >3.5m: 1 escort','Width >4.0m: 2 escorts + police','Super-loads: Provincial engineering review'] },
  { country:'MX',authority:'SCT',standardLimits:[{dimension:'Width',limit:'2.6',unit:'m'},{dimension:'Height',limit:'4.25',unit:'m'},{dimension:'Length (semi)',limit:'16.7',unit:'m'},{dimension:'GVW (semi)',limit:'44,000',unit:'kg'},{dimension:'GVW (full trailer)',limit:'66,500',unit:'kg'}],permitProcess:['SCT Permiso Especial de Transporte','NOM-012-SCT-2-2017 compliance','State transit permits in addition to federal','Insurance for oversized load liability'],crossBorderNotes:'MX double-trailer configs longer/heavier than US. MX permits not valid in US/CA.',escortRequirements:['Width >3.0m: 1 escort','Width >3.5m: 2 escorts + SCT notification','Night travel often restricted'] },
];

export const AGRICULTURE_RULES: AgricultureRule[] = [
  { country:'US',authority:'USDA APHIS / FDA / CBP',importRequirements:['USDA APHIS import permit for plants/fruits/vegetables','Phytosanitary certificate from exporting country','FDA Prior Notice (2-8 hrs before arrival)','FSVP for importers','COOL labeling for meats/produce','Fumigation cert (ISPM-15 wood packaging)','Animal products: USDA FSIS import inspection'],phytosanitaryRules:['ISPM-15 wood packaging (heat treated, stamped)','Pest-free area certification','Cold treatment for certain fruits','Systems approach programs for specific pairs'],prohibitedItems:['Soil and earth','Most fresh fruits from non-approved regions','Raw meat from FMD countries','Citrus from canker regions'],crossBorderNotes:'CBP ag specialists inspect at ports. APHIS preclearance for some CA/MX commodities. USMCA duty-free for qualifying produce.' },
  { country:'CA',authority:'CFIA',importRequirements:['CFIA import permit for plants/animals/food','Phytosanitary certificate','SFC license for food importers','Bilingual EN/FR labeling','COR certification for organic claims','AIRS system lists all commodity requirements'],phytosanitaryRules:['ISPM-15 wood packaging','Soil prohibition','Pest-free certification','Cold treatment for certain US/MX fruits'],prohibitedItems:['Soil and growing media','Fresh potatoes (most countries except US certified)','Unprocessed logs without treatment','Raw poultry from avian influenza countries'],crossBorderNotes:'CFIA inspection at border. USMCA preferential access for US/MX produce.' },
  { country:'MX',authority:'SENASICA / SADER / COFEPRIS',importRequirements:['SENASICA import permit (via VUCEM)','Phytosanitary certificate','COFEPRIS sanitary registration','NOM labeling (Spanish, metric)','Agente Aduanal mandatory','SENASICA inspection at entry'],phytosanitaryRules:['ISPM-15 wood packaging','SENASICA phytosanitary verification','Pest-free area requirements','Lab analysis may be required'],prohibitedItems:['Unprocessed potatoes from certain origins','Fresh fruits without Medfly clearance','Live animals without SENASICA health cert','GMO without CIBIOGEM authorization'],crossBorderNotes:'SENASICA inspection can take 24-48 hrs. Perishable priority lanes at some crossings. VUCEM permits required before arrival.' },
];


// ═══════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getReeferRegulations(country?: VerticalCountry) {
  if (country) return REEFER_REGULATIONS.filter(r => r.country === country);
  return REEFER_REGULATIONS;
}

export function getReeferTempRange(commodity: string, country?: VerticalCountry): { commodity: string; minC: number; maxC: number; country: VerticalCountry }[] {
  const results: { commodity: string; minC: number; maxC: number; country: VerticalCountry }[] = [];
  const regs = country ? REEFER_REGULATIONS.filter(r => r.country === country) : REEFER_REGULATIONS;
  for (const reg of regs) {
    for (const tr of reg.tempRanges) {
      if (tr.commodity.toLowerCase().includes(commodity.toLowerCase())) {
        results.push({ ...tr, country: reg.country });
      }
    }
  }
  return results;
}

export function getHazmatCrossBorderRules(country?: VerticalCountry) {
  if (country) return HAZMAT_CROSS_BORDER.filter(r => r.country === country);
  return HAZMAT_CROSS_BORDER;
}

export function getOversizedRules(country?: VerticalCountry) {
  if (country) return OVERSIZED_RULES.filter(r => r.country === country);
  return OVERSIZED_RULES;
}

export function getAgricultureRules(country?: VerticalCountry) {
  if (country) return AGRICULTURE_RULES.filter(r => r.country === country);
  return AGRICULTURE_RULES;
}

export function checkReeferCrossBorderCompliance(params: {
  direction: string; commodity: string; tempSetC: number;
  hasTempLog: boolean; hasFSMACompliance: boolean;
  hasPhytoCert: boolean; hasPriorNotice: boolean;
}): { compliant: boolean; checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] } {
  const checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] = [];
  const parts = params.direction.split('_to_');
  const destCountry = (parts[1] || 'US') as VerticalCountry;
  const regs = REEFER_REGULATIONS.find(r => r.country === destCountry);

  if (regs) {
    const match = regs.tempRanges.find(t => t.commodity.toLowerCase().includes(params.commodity.toLowerCase()));
    if (match) {
      const inRange = params.tempSetC >= match.minC && params.tempSetC <= match.maxC;
      checks.push({ rule: `Temperature for ${match.commodity}`, status: inRange ? 'pass' : 'fail', detail: inRange ? `${params.tempSetC}C within ${match.minC}C-${match.maxC}C` : `${params.tempSetC}C OUTSIDE ${match.minC}C-${match.maxC}C` });
    } else {
      checks.push({ rule: 'Temperature range', status: 'warning', detail: `No range for "${params.commodity}" — verify manually` });
    }
  }

  checks.push({ rule: 'Temperature monitoring log', status: params.hasTempLog ? 'pass' : 'fail', detail: params.hasTempLog ? 'Continuous temp log available' : 'Temp log required' });

  if (destCountry === 'US') {
    checks.push({ rule: 'FSMA Sanitary Transport', status: params.hasFSMACompliance ? 'pass' : 'fail', detail: params.hasFSMACompliance ? 'FSMA compliant' : 'FSMA 21 CFR Part 1 Subpart O required' });
    checks.push({ rule: 'FDA Prior Notice', status: params.hasPriorNotice ? 'pass' : 'fail', detail: params.hasPriorNotice ? 'Filed' : 'Prior Notice required 2-8 hrs before arrival' });
  }
  if (destCountry === 'CA') {
    checks.push({ rule: 'CFIA cold chain verification', status: params.hasTempLog ? 'pass' : 'warning', detail: 'CFIA may verify cold chain at border' });
  }
  if (destCountry === 'MX') {
    checks.push({ rule: 'SENASICA inspection', status: 'warning', detail: 'SENASICA mandatory inspection — allow 24-48 hrs for fresh produce' });
  }

  checks.push({ rule: 'Phytosanitary certificate', status: params.hasPhytoCert ? 'pass' : 'warning', detail: params.hasPhytoCert ? 'Phytosanitary cert provided' : 'May be required for produce/plants' });

  const compliant = checks.every(c => c.status !== 'fail');
  logger.info(`[ReeferCompliance] ${params.direction} ${params.commodity}: ${compliant ? 'PASS' : 'FAIL'}`);
  return { compliant, checks };
}

export function checkOversizedCrossBorderCompliance(params: {
  direction: string; widthM: number; heightM: number; lengthM: number; gvwKg: number;
  hasOriginPermit: boolean; hasDestPermit: boolean; hasEscort: boolean;
}): { compliant: boolean; oversize: boolean; overweight: boolean; checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] } {
  const checks: { rule: string; status: 'pass'|'fail'|'warning'; detail: string }[] = [];
  const parts = params.direction.split('_to_');
  const destCountry = (parts[1] || 'US') as VerticalCountry;
  const destRules = OVERSIZED_RULES.find(r => r.country === destCountry);

  let oversize = false;
  let overweight = false;

  if (destRules) {
    const widthLimit = destCountry === 'US' ? 2.6 : parseFloat(destRules.standardLimits.find(l => l.dimension === 'Width')?.limit || '2.6');
    if (params.widthM > widthLimit) { oversize = true; checks.push({ rule: 'Width', status: 'warning', detail: `${params.widthM}m exceeds ${widthLimit}m limit — permit required` }); }
    const heightLimit = destCountry === 'US' ? 4.1 : parseFloat(destRules.standardLimits.find(l => l.dimension === 'Height')?.limit || '4.15');
    if (params.heightM > heightLimit) { oversize = true; checks.push({ rule: 'Height', status: 'warning', detail: `${params.heightM}m exceeds ${heightLimit}m limit — permit required` }); }

    const gvwLimitStr = destRules.standardLimits.find(l => l.dimension.startsWith('GVW'))?.limit || '80000';
    const gvwLimit = parseFloat(gvwLimitStr.replace(/,/g, ''));
    const gvwKgLimit = destCountry === 'US' ? gvwLimit * 0.453592 : gvwLimit;
    if (params.gvwKg > gvwKgLimit) { overweight = true; checks.push({ rule: 'GVW', status: 'warning', detail: `${params.gvwKg}kg exceeds ${Math.round(gvwKgLimit)}kg limit — permit required` }); }
  }

  if (oversize || overweight) {
    checks.push({ rule: 'Origin country permit', status: params.hasOriginPermit ? 'pass' : 'fail', detail: params.hasOriginPermit ? 'Origin permit obtained' : 'Origin country oversized permit required' });
    checks.push({ rule: 'Destination country permit', status: params.hasDestPermit ? 'pass' : 'fail', detail: params.hasDestPermit ? 'Destination permit obtained' : 'Destination country oversized permit required' });
    if (oversize) {
      checks.push({ rule: 'Escort vehicles', status: params.hasEscort ? 'pass' : 'warning', detail: params.hasEscort ? 'Escort arranged' : 'Escort may be required — check dimensions vs thresholds' });
    }
  } else {
    checks.push({ rule: 'Dimensions', status: 'pass', detail: 'Within standard limits — no oversized permit needed' });
  }

  const compliant = checks.every(c => c.status !== 'fail');
  logger.info(`[OversizedCompliance] ${params.direction}: oversize=${oversize} overweight=${overweight} ${compliant ? 'PASS' : 'FAIL'}`);
  return { compliant, oversize, overweight, checks };
}
