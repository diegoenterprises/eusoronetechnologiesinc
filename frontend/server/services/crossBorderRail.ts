/**
 * CROSS-BORDER RAIL SERVICE — Phase 3
 * US/CA/MX rail interchange points, crew certs, DG regulations, compliance checks
 */
import { logger } from '../_core/logger';

export type RailBorderCountry = 'US' | 'CA' | 'MX';

export interface RailInterchangePoint {
  id: string; name: string; countryA: RailBorderCountry; countryB: RailBorderCountry;
  stateProvinceA: string; stateProvinceB: string;
  railroadsA: string[]; railroadsB: string[];
  lat: number; lng: number; interchangeType: 'bridge' | 'tunnel' | 'yard' | 'direct';
  customsOffice: string; annualVolume: string; hasIntermodal: boolean; hazmatAllowed: boolean; notes: string;
}

export interface RailCrewCertification {
  country: RailBorderCountry; certType: string; description: string;
  issuingAuthority: string; regulation: string; validityYears: number;
  requiredFor: string; crossBorderReciprocity: string;
}

export interface RailDGRegulation {
  country: RailBorderCountry; regulationName: string; authority: string;
  keyRules: string[]; placardDifferences: string; crossBorderNotes: string;
}

export interface CrossBorderRailCompliance {
  interchangePoint: string; direction: string;
  regulatory: { requirement: string; status: 'pass'|'fail'|'warning'; details: string; regulation: string; }[];
  overallCompliant: boolean;
}

export const RAIL_INTERCHANGE_POINTS: RailInterchangePoint[] = [
  { id:'INT-001',name:'International Falls/Fort Frances',countryA:'US',countryB:'CA',stateProvinceA:'MN',stateProvinceB:'ON',railroadsA:['CN'],railroadsB:['CN'],lat:48.601,lng:-93.411,interchangeType:'bridge',customsOffice:'CBP Int Falls/CBSA Fort Frances',annualVolume:'~50k',hasIntermodal:false,hazmatAllowed:true,notes:'CN mainline' },
  { id:'INT-002',name:'Portal/North Portal',countryA:'US',countryB:'CA',stateProvinceA:'ND',stateProvinceB:'SK',railroadsA:['CPKC'],railroadsB:['CPKC'],lat:49.0,lng:-102.55,interchangeType:'direct',customsOffice:'CBP Portal/CBSA North Portal',annualVolume:'~200k',hasIntermodal:true,hazmatAllowed:true,notes:'Busiest prairie rail crossing' },
  { id:'INT-003',name:'Sault Ste. Marie',countryA:'US',countryB:'CA',stateProvinceA:'MI',stateProvinceB:'ON',railroadsA:['CN','CPKC'],railroadsB:['CN','CPKC'],lat:46.5,lng:-84.35,interchangeType:'bridge',customsOffice:'CBP/CBSA Sault Ste Marie',annualVolume:'~60k',hasIntermodal:false,hazmatAllowed:true,notes:'International Bridge' },
  { id:'INT-004',name:'Detroit/Windsor Tunnel',countryA:'US',countryB:'CA',stateProvinceA:'MI',stateProvinceB:'ON',railroadsA:['CN','NS','CSX'],railroadsB:['CN'],lat:42.322,lng:-83.049,interchangeType:'tunnel',customsOffice:'CBP Detroit/CBSA Windsor',annualVolume:'~400k',hasIntermodal:true,hazmatAllowed:false,notes:'NO hazmat—tunnel restriction' },
  { id:'INT-005',name:'Buffalo/Fort Erie',countryA:'US',countryB:'CA',stateProvinceA:'NY',stateProvinceB:'ON',railroadsA:['CN','CSX','NS'],railroadsB:['CN'],lat:42.91,lng:-78.926,interchangeType:'bridge',customsOffice:'CBP Buffalo/CBSA Fort Erie',annualVolume:'~350k',hasIntermodal:true,hazmatAllowed:true,notes:'2nd busiest US-CA rail' },
  { id:'INT-006',name:'Rouses Point/Lacolle',countryA:'US',countryB:'CA',stateProvinceA:'NY',stateProvinceB:'QC',railroadsA:['CN','CPKC'],railroadsB:['CN','CPKC'],lat:45.007,lng:-73.351,interchangeType:'direct',customsOffice:'CBP Champlain/CBSA Lacolle',annualVolume:'~100k',hasIntermodal:true,hazmatAllowed:true,notes:'QC-US NE gateway' },
  { id:'INT-007',name:'Blaine/Surrey',countryA:'US',countryB:'CA',stateProvinceA:'WA',stateProvinceB:'BC',railroadsA:['BNSF'],railroadsB:['CN','CPKC'],lat:49.004,lng:-122.756,interchangeType:'yard',customsOffice:'CBP Blaine/CBSA Pacific Hwy',annualVolume:'~250k',hasIntermodal:true,hazmatAllowed:true,notes:'Port of Vancouver gateway' },
  { id:'INT-008',name:'Sweetgrass/Coutts',countryA:'US',countryB:'CA',stateProvinceA:'MT',stateProvinceB:'AB',railroadsA:['BNSF'],railroadsB:['CPKC'],lat:49.0,lng:-111.964,interchangeType:'direct',customsOffice:'CBP Sweetgrass/CBSA Coutts',annualVolume:'~80k',hasIntermodal:false,hazmatAllowed:true,notes:'Grain & energy corridor' },
  { id:'INT-009',name:'Laredo/Nuevo Laredo',countryA:'US',countryB:'MX',stateProvinceA:'TX',stateProvinceB:'TAM',railroadsA:['UP','BNSF','CPKC'],railroadsB:['CPKC','FXE'],lat:27.501,lng:-99.508,interchangeType:'bridge',customsOffice:'CBP Laredo/SAT Nuevo Laredo',annualVolume:'~600k',hasIntermodal:true,hazmatAllowed:true,notes:'BUSIEST US-MX rail crossing' },
  { id:'INT-010',name:'El Paso/Ciudad Juarez',countryA:'US',countryB:'MX',stateProvinceA:'TX',stateProvinceB:'CHH',railroadsA:['UP','BNSF'],railroadsB:['FXE'],lat:31.759,lng:-106.487,interchangeType:'bridge',customsOffice:'CBP El Paso/SAT Cd Juarez',annualVolume:'~180k',hasIntermodal:true,hazmatAllowed:true,notes:'Auto parts corridor' },
  { id:'INT-011',name:'Eagle Pass/Piedras Negras',countryA:'US',countryB:'MX',stateProvinceA:'TX',stateProvinceB:'COA',railroadsA:['UP'],railroadsB:['FXE'],lat:28.709,lng:-100.5,interchangeType:'bridge',customsOffice:'CBP Eagle Pass/SAT Piedras Negras',annualVolume:'~120k',hasIntermodal:false,hazmatAllowed:true,notes:'Coal & energy' },
  { id:'INT-012',name:'Brownsville/Matamoros',countryA:'US',countryB:'MX',stateProvinceA:'TX',stateProvinceB:'TAM',railroadsA:['UP','BNSF'],railroadsB:['CPKC'],lat:25.896,lng:-97.492,interchangeType:'bridge',customsOffice:'CBP Brownsville/SAT Matamoros',annualVolume:'~80k',hasIntermodal:false,hazmatAllowed:true,notes:'Gulf coast industrial' },
  { id:'INT-013',name:'Nogales AZ/SON',countryA:'US',countryB:'MX',stateProvinceA:'AZ',stateProvinceB:'SON',railroadsA:['UP'],railroadsB:['FXE'],lat:31.333,lng:-110.94,interchangeType:'yard',customsOffice:'CBP/SAT Nogales',annualVolume:'~40k',hasIntermodal:false,hazmatAllowed:true,notes:'Produce & mining' },
  { id:'INT-014',name:'Calexico/Mexicali',countryA:'US',countryB:'MX',stateProvinceA:'CA',stateProvinceB:'BCN',railroadsA:['UP'],railroadsB:['FXE'],lat:32.674,lng:-115.499,interchangeType:'yard',customsOffice:'CBP Calexico/SAT Mexicali',annualVolume:'~20k',hasIntermodal:false,hazmatAllowed:true,notes:'Pacific coast gateway' },
];

export const RAIL_CREW_CERTS: RailCrewCertification[] = [
  { country:'US',certType:'FRA Locomotive Engineer',description:'Required for US track ops',issuingAuthority:'FRA',regulation:'49 CFR Part 240',validityYears:3,requiredFor:'Locomotive engineers',crossBorderReciprocity:'Not valid in CA/MX' },
  { country:'US',certType:'FRA Conductor',description:'Required for US conductors',issuingAuthority:'FRA',regulation:'49 CFR Part 242',validityYears:3,requiredFor:'Conductors',crossBorderReciprocity:'Not valid in CA/MX' },
  { country:'US',certType:'DOT Hazmat Employee',description:'Hazmat handling cert',issuingAuthority:'PHMSA',regulation:'49 CFR Part 172 Subpart H',validityYears:3,requiredFor:'Hazmat handlers',crossBorderReciprocity:'CA accepts with TDG bridge training' },
  { country:'CA',certType:'TC Locomotive Operating Certificate',description:'Transport Canada locomotive cert',issuingAuthority:'Transport Canada',regulation:'Railway Safety Act',validityYears:3,requiredFor:'Engineers in Canada',crossBorderReciprocity:'Not valid in US/MX' },
  { country:'CA',certType:'TC Conductor Certificate',description:'Transport Canada conductor cert',issuingAuthority:'Transport Canada',regulation:'Railway Safety Act',validityYears:3,requiredFor:'Conductors in Canada',crossBorderReciprocity:'Not valid in US/MX' },
  { country:'CA',certType:'TDG Rail Certificate',description:'DG training for rail',issuingAuthority:'Transport Canada',regulation:'TDG Regulations Part 6',validityYears:3,requiredFor:'Rail DG handlers',crossBorderReciprocity:'US accepts with bridge training' },
  { country:'MX',certType:'SCT Railway Operator License',description:'SCT/ARTF railway cert',issuingAuthority:'SCT/ARTF',regulation:'Ley Reglamentaria del Servicio Ferroviario',validityYears:5,requiredFor:'All MX railway operators',crossBorderReciprocity:'Not valid outside Mexico' },
  { country:'MX',certType:'SCT Hazmat Rail Cert',description:'MX rail hazmat cert',issuingAuthority:'SCT/SEMARNAT',regulation:'NOM-002-SCT/2011',validityYears:2,requiredFor:'Hazmat rail in Mexico',crossBorderReciprocity:'Not valid outside Mexico' },
];

export const RAIL_DG_REGULATIONS: RailDGRegulation[] = [
  { country:'US',regulationName:'DOT HMR',authority:'PHMSA',keyRules:['49 CFR 171-180','Key trains: 20+ tank cars or 35+ hazmat','50mph max key trains','40mph in HCAs','ECP brakes HHFT >70 cars'],placardDifferences:'DOT placards per 49 CFR 172',crossBorderNotes:'DOT placards accepted at CA/MX borders' },
  { country:'CA',regulationName:'TDG Regulations',authority:'Transport Canada',keyRules:['TDG Act 1992, SOR/2001-286','TC-117 enhanced tank cars','Route risk assessments (RAC OT-55-N)','Municipal DG train notification','10-car block rule Class 3','ERAP for specific DG'],placardDifferences:'TDG placards SOR/2001-286 Sch2. Bilingual docs.',crossBorderNotes:'DOT placards accepted cross-border. Bilingual shipping docs required.' },
  { country:'MX',regulationName:'NOM-002-SCT/2011',authority:'SCT/ARTF',keyRules:['UN-based classification','NOM-005-SCT emergency info','40km/h urban speed limit with DG','Escort car for Class 1','Tarjetas de Emergencia required'],placardDifferences:'UN/GHS format. Bilingual ES/EN for cross-border.',crossBorderNotes:'DOT/TDG placards accepted at border. MX docs required in MX territory.' },
];

export function getInterchangePoints(params?: { countryA?: RailBorderCountry; countryB?: RailBorderCountry; railroad?: string; hazmatOnly?: boolean; intermodalOnly?: boolean; }): RailInterchangePoint[] {
  let r = [...RAIL_INTERCHANGE_POINTS];
  if (params?.countryA) r = r.filter(p => p.countryA === params.countryA || p.countryB === params.countryA);
  if (params?.countryB) r = r.filter(p => p.countryA === params.countryB || p.countryB === params.countryB);
  if (params?.railroad) { const rr = params.railroad.toUpperCase(); r = r.filter(p => p.railroadsA.includes(rr) || p.railroadsB.includes(rr)); }
  if (params?.hazmatOnly) r = r.filter(p => p.hazmatAllowed);
  if (params?.intermodalOnly) r = r.filter(p => p.hasIntermodal);
  return r;
}

export function getCrewCertRequirements(country: RailBorderCountry) { return RAIL_CREW_CERTS.filter(c => c.country === country); }
export function getDGRailRegulations(country: RailBorderCountry) { return RAIL_DG_REGULATIONS.find(r => r.country === country); }

export function getRequiredCrossBorderDocs(direction: 'US_to_CA'|'CA_to_US'|'US_to_MX'|'MX_to_US'): string[] {
  const common = ['Train consist list','Car loading reports','Waybills for all cars'];
  const m: Record<string, string[]> = {
    US_to_CA: [...common,'ACI eManifest (Rail)','PARS per shipment','Canada Customs Invoice','Certificate of Origin (CUSMA)','TDG bilingual doc if DG','TC Locomotive Operating Certificate','TC Conductor Certificate'],
    CA_to_US: [...common,'ACE eManifest (Rail)','US Customs Bond','Commercial invoice','CUSMA cert if applicable','DOT hazmat papers if DG','FRA Engineer Cert','FRA Conductor Cert'],
    US_to_MX: [...common,'Carta Porte (rail)','Pedimento de Importacion','Agente Aduanal assignment','NOM-002-SCT docs if DG','SCT Railway Operator License','Mexican insurance (CNSF)'],
    MX_to_US: [...common,'ACE eManifest (Rail)','US Customs Bond','Pedimento de Exportacion','USMCA/T-MEC cert','FDA/USDA permits if food','FRA Engineer Cert','FRA Conductor Cert'],
  };
  return m[direction] || common;
}

export function checkCrossBorderRailCompliance(params: {
  direction: 'US_to_CA'|'CA_to_US'|'US_to_MX'|'MX_to_US'; interchangePointId: string;
  hasManifest: boolean; hasCrewCerts: boolean; hasDangerousGoods: boolean;
  hasDGDocs: boolean; hasCustomsDocs: boolean; hasInsurance: boolean;
}): CrossBorderRailCompliance {
  const items: CrossBorderRailCompliance['regulatory'] = [];
  const pt = RAIL_INTERCHANGE_POINTS.find(p => p.id === params.interchangePointId);
  items.push({ requirement:'Valid interchange point', status: pt ? 'pass' : 'fail', details: pt ? `${pt.name} (${pt.interchangeType})` : 'Unknown point', regulation:'Rail crossing regulations' });
  items.push({ requirement:'eManifest filed', status: params.hasManifest ? 'pass' : 'fail', details: params.hasManifest ? 'Filed' : 'Not filed', regulation: params.direction.includes('CA') ? 'Customs Act 12.1' : '19 CFR Part 123' });
  const dest = params.direction.split('_to_')[1] as RailBorderCountry;
  items.push({ requirement:`Crew certs for ${dest}`, status: params.hasCrewCerts ? 'pass' : 'fail', details: params.hasCrewCerts ? 'Valid' : `Need ${dest} certs`, regulation: dest==='US' ? '49 CFR 240/242' : dest==='CA' ? 'Railway Safety Act' : 'Ley Servicio Ferroviario' });
  if (params.hasDangerousGoods) {
    if (pt && !pt.hazmatAllowed) items.push({ requirement:'Hazmat allowed', status:'fail', details:`${pt.name} NO hazmat—reroute`, regulation:'Interchange restrictions' });
    items.push({ requirement:'DG docs', status: params.hasDGDocs ? 'pass' : 'fail', details: params.hasDGDocs ? 'Present' : 'Missing DG docs', regulation: dest==='CA' ? 'TDG Regs' : dest==='MX' ? 'NOM-002-SCT' : '49 CFR 172' });
  }
  items.push({ requirement:'Customs docs', status: params.hasCustomsDocs ? 'pass' : 'fail', details: params.hasCustomsDocs ? 'Ready' : 'Missing', regulation:'Customs regs' });
  items.push({ requirement:'Cross-border insurance', status: params.hasInsurance ? 'pass' : 'fail', details: params.hasInsurance ? 'Valid' : 'Invalid/missing', regulation: dest==='CA' ? 'MVTA 1987' : dest==='MX' ? 'CNSF' : 'FMCSA' });
  const ok = items.every(i => i.status === 'pass');
  logger.info(`[CrossBorderRail] ${params.direction} at ${params.interchangePointId}: ${ok ? 'PASS' : 'FAIL'}`);
  return { interchangePoint: params.interchangePointId, direction: params.direction, regulatory: items, overallCompliant: ok };
}

export function estimateRailBorderCrossingTime(interchangePointId: string, hasDG: boolean, carCount: number) {
  const pt = RAIL_INTERCHANGE_POINTS.find(p => p.id === interchangePointId);
  const bd: { step: string; hours: number }[] = [{ step:'Customs inspection', hours:2 }];
  if (hasDG) bd.push({ step:'DG inspection', hours:1.5 });
  if (carCount > 100) bd.push({ step:'Extended train inspection (>100 cars)', hours:1 });
  else if (carCount > 50) bd.push({ step:'Standard inspection (50-100 cars)', hours:0.5 });
  bd.push({ step:'Crew change & cert verification', hours:1 });
  if (pt?.interchangeType === 'tunnel') bd.push({ step:'Tunnel clearance', hours:0.5 });
  if (pt && ['INT-009','INT-004','INT-005','INT-007'].includes(pt.id)) bd.push({ step:'High-volume queue', hours:1.5 });
  const total = bd.reduce((s, b) => s + b.hours, 0);
  return { estimatedHours: Math.round(total * 10) / 10, breakdown: bd };
}
