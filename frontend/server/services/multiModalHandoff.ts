/**
 * MULTI-MODAL HANDOFF + BILLING SERVICE — Phase 4.1
 * Intermodal transfer logistics, cross-border handoff points, and multi-modal billing
 */
import { logger } from '../_core/logger';

export type TransportMode = 'TRUCK' | 'RAIL' | 'VESSEL';
export type HandoffCountry = 'US' | 'CA' | 'MX';
export type HandoffCurrency = 'USD' | 'CAD' | 'MXN';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: INTERMODAL HANDOFF POINTS
// ═══════════════════════════════════════════════════════════════════════════

export interface IntermodalFacility {
  id: string; name: string; country: HandoffCountry; state: string;
  lat: number; lng: number;
  modesServed: TransportMode[];
  handoffTypes: string[];
  nearestBorderCrossing?: string;
  distanceToBorderKm?: number;
  railroads?: string[];
  portAuthority?: string;
  capabilities: string[];
  operatingHours: string;
}

export const INTERMODAL_FACILITIES: IntermodalFacility[] = [
  { id:'IMF-CHI-01',name:'Chicago BNSF Logistics Park',country:'US',state:'IL',lat:41.72,lng:-87.83,modesServed:['TRUCK','RAIL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK'],railroads:['BNSF','UP','NS','CSX'],capabilities:['Container lift','Trailer-on-flatcar (TOFC)','Container-on-flatcar (COFC)','Transload facility','Reefer plug-ins','Hazmat capable'],operatingHours:'24/7' },
  { id:'IMF-LA-01',name:'Los Angeles / Long Beach Intermodal',country:'US',state:'CA',lat:33.77,lng:-118.19,modesServed:['TRUCK','RAIL','VESSEL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK','VESSEL_TO_TRUCK','VESSEL_TO_RAIL','TRUCK_TO_VESSEL','RAIL_TO_VESSEL'],portAuthority:'Port of Los Angeles / Port of Long Beach',railroads:['BNSF','UP'],capabilities:['Container lift','Ship-to-shore crane','On-dock rail','Chassis pool','Reefer plug-ins','Hazmat capable','FTZ available'],operatingHours:'24/7' },
  { id:'IMF-LRD-01',name:'Laredo Intermodal Terminal',country:'US',state:'TX',lat:27.51,lng:-99.49,modesServed:['TRUCK','RAIL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK'],nearestBorderCrossing:'Laredo/Nuevo Laredo',distanceToBorderKm:2,railroads:['UP','KCS'],capabilities:['Container lift','COFC/TOFC','Cross-border rail interchange','Customs bonded area','C-TPAT/FAST processing'],operatingHours:'06:00-22:00 Mon-Sat' },
  { id:'IMF-DET-01',name:'Detroit Intermodal Freight Terminal',country:'US',state:'MI',lat:42.33,lng:-83.05,modesServed:['TRUCK','RAIL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK'],nearestBorderCrossing:'Ambassador Bridge / Detroit-Windsor Tunnel',distanceToBorderKm:3,railroads:['CN','CP','NS','CSX'],capabilities:['Container lift','COFC/TOFC','Cross-border rail to Canada','Customs bonded'],operatingHours:'24/7' },
  { id:'IMF-MTL-01',name:'Montreal Intermodal (Port + Rail)',country:'CA',state:'QC',lat:45.55,lng:-73.53,modesServed:['TRUCK','RAIL','VESSEL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK','VESSEL_TO_TRUCK','VESSEL_TO_RAIL','TRUCK_TO_VESSEL','RAIL_TO_VESSEL'],portAuthority:'Port of Montreal',railroads:['CN','CP'],capabilities:['Container lift','Ship-to-shore crane','On-dock rail','Reefer plug-ins','Hazmat capable','CBSA sufferance warehouse'],operatingHours:'24/7' },
  { id:'IMF-VAN-01',name:'Vancouver Intermodal (Deltaport + Centerm)',country:'CA',state:'BC',lat:49.01,lng:-123.13,modesServed:['TRUCK','RAIL','VESSEL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK','VESSEL_TO_TRUCK','VESSEL_TO_RAIL','TRUCK_TO_VESSEL','RAIL_TO_VESSEL'],portAuthority:'Vancouver Fraser Port Authority',railroads:['CN','CP'],capabilities:['Container lift','Ship-to-shore crane','On-dock rail','Reefer plug-ins','Hazmat capable','CBSA examination facility'],operatingHours:'24/7' },
  { id:'IMF-MZT-01',name:'Manzanillo Intermodal',country:'MX',state:'COL',lat:19.05,lng:-104.32,modesServed:['TRUCK','RAIL','VESSEL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK','VESSEL_TO_TRUCK','VESSEL_TO_RAIL'],portAuthority:'API Manzanillo',railroads:['Ferromex','KCSM'],capabilities:['Container lift','Ship-to-shore crane','On-dock rail','Customs bonded area','SAT/Aduana inspection'],operatingHours:'24/7' },
  { id:'IMF-NVL-01',name:'Nuevo Laredo Rail Terminal',country:'MX',state:'TAMPS',lat:27.48,lng:-99.51,modesServed:['TRUCK','RAIL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK'],nearestBorderCrossing:'Nuevo Laredo/Laredo',distanceToBorderKm:1,railroads:['KCSM','Ferromex'],capabilities:['Container lift','Cross-border rail interchange','Customs bonded','NEEC processing'],operatingHours:'06:00-22:00 Mon-Sat' },
  { id:'IMF-SAV-01',name:'Savannah Intermodal (Garden City)',country:'US',state:'GA',lat:32.11,lng:-81.15,modesServed:['TRUCK','RAIL','VESSEL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK','VESSEL_TO_TRUCK','VESSEL_TO_RAIL'],portAuthority:'Georgia Ports Authority',railroads:['NS','CSX'],capabilities:['Container lift','Ship-to-shore crane','On-dock rail','Mega-rail terminal','Reefer plug-ins'],operatingHours:'24/7' },
  { id:'IMF-KC-01',name:'Kansas City Intermodal Hub',country:'US',state:'MO',lat:39.12,lng:-94.58,modesServed:['TRUCK','RAIL'],handoffTypes:['TRUCK_TO_RAIL','RAIL_TO_TRUCK'],railroads:['BNSF','UP','NS','KCS'],capabilities:['Container lift','COFC/TOFC','FTZ 15','Transload','Reefer plug-ins'],operatingHours:'24/7' },
];


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: HANDOFF WORKFLOW & DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════

export interface HandoffStep {
  order: number; action: string; responsible: string;
  estimatedMinutes: number; documents: string[];
  crossBorderNote?: string;
}

export interface HandoffWorkflow {
  type: string; fromMode: TransportMode; toMode: TransportMode;
  description: string; steps: HandoffStep[];
  averageDwellHours: number;
}

export const HANDOFF_WORKFLOWS: HandoffWorkflow[] = [
  { type:'TRUCK_TO_RAIL',fromMode:'TRUCK',toMode:'RAIL',description:'Drayage truck delivers container to rail terminal for line-haul',averageDwellHours:4,steps:[
    {order:1,action:'Truck arrives at rail terminal gate',responsible:'Truck driver',estimatedMinutes:15,documents:['BOL','Delivery order','Gate appointment confirmation']},
    {order:2,action:'Gate check — verify container/trailer ID, seal integrity',responsible:'Terminal operator',estimatedMinutes:10,documents:['Gate ticket','Seal verification form']},
    {order:3,action:'Container/trailer placed in staging area',responsible:'Terminal operator',estimatedMinutes:20,documents:['Yard location assignment']},
    {order:4,action:'Lift container to railcar (COFC) or drive trailer onto flatcar (TOFC)',responsible:'Terminal crane operator',estimatedMinutes:15,documents:['Load plan','Railcar assignment']},
    {order:5,action:'Rail manifest updated, car added to train consist',responsible:'Railroad dispatch',estimatedMinutes:30,documents:['Rail waybill','Train consist','EDI 404/417']},
    {order:6,action:'Cross-border documents filed if international',responsible:'Customs broker',estimatedMinutes:60,documents:['ACE/ACI manifest','Customs entry','USMCA cert if applicable'],crossBorderNote:'eManifest must be filed before train departs for border'},
  ]},
  { type:'RAIL_TO_TRUCK',fromMode:'RAIL',toMode:'TRUCK',description:'Container offloaded from railcar for truck drayage to final destination',averageDwellHours:6,steps:[
    {order:1,action:'Train arrives at destination rail terminal',responsible:'Railroad',estimatedMinutes:60,documents:['Arrival notice','Rail waybill']},
    {order:2,action:'Container/trailer grounded in yard',responsible:'Terminal operator',estimatedMinutes:30,documents:['Yard placement record']},
    {order:3,action:'Notification to consignee/trucker',responsible:'Terminal operator',estimatedMinutes:5,documents:['Availability notice','EDI 322']},
    {order:4,action:'Customs clearance if international shipment',responsible:'Customs broker',estimatedMinutes:120,documents:['Customs release','Duty payment receipt'],crossBorderNote:'Customs hold possible — allow extra dwell time'},
    {order:5,action:'Truck driver arrives, gate-in and pickup',responsible:'Truck driver',estimatedMinutes:20,documents:['Gate appointment','Pickup order','BOL']},
    {order:6,action:'Truck departs for final delivery',responsible:'Truck driver',estimatedMinutes:5,documents:['Signed BOL','Seal record']},
  ]},
  { type:'VESSEL_TO_TRUCK',fromMode:'VESSEL',toMode:'TRUCK',description:'Container discharged from vessel for truck drayage',averageDwellHours:48,steps:[
    {order:1,action:'Vessel berths, discharge begins',responsible:'Terminal/stevedore',estimatedMinutes:240,documents:['Vessel manifest','Discharge list']},
    {order:2,action:'Container placed in container yard',responsible:'Terminal operator',estimatedMinutes:30,documents:['Yard location']},
    {order:3,action:'Customs examination (if selected)',responsible:'CBP/CBSA/SAT',estimatedMinutes:480,documents:['Customs entry','ISF (US)','Cargo release'],crossBorderNote:'ISF 10+2 must be filed 24 hrs before vessel loading at origin port'},
    {order:4,action:'Customs release issued',responsible:'Customs',estimatedMinutes:60,documents:['Release notice','Duty payment']},
    {order:5,action:'Truck driver gate-in, pickup container',responsible:'Truck driver',estimatedMinutes:30,documents:['Gate appointment','Delivery order','Equipment interchange receipt']},
    {order:6,action:'Truck departs port for delivery',responsible:'Truck driver',estimatedMinutes:5,documents:['BOL','Seal record']},
  ]},
  { type:'VESSEL_TO_RAIL',fromMode:'VESSEL',toMode:'RAIL',description:'Container discharged from vessel to on-dock or near-dock rail',averageDwellHours:24,steps:[
    {order:1,action:'Vessel berths, discharge to on-dock rail stack',responsible:'Terminal/stevedore',estimatedMinutes:240,documents:['Vessel manifest','Discharge list']},
    {order:2,action:'Customs clearance',responsible:'Customs broker',estimatedMinutes:480,documents:['Customs entry','ISF (US)','Release'],crossBorderNote:'In-bond movement possible to defer clearance to inland port'},
    {order:3,action:'Container lifted to railcar',responsible:'Terminal crane',estimatedMinutes:20,documents:['Load plan','Railcar assignment']},
    {order:4,action:'Train built, manifest filed',responsible:'Railroad',estimatedMinutes:120,documents:['Rail waybill','Train consist']},
    {order:5,action:'Train departs for inland destination',responsible:'Railroad',estimatedMinutes:10,documents:['Departure notice']},
  ]},
  { type:'TRUCK_TO_VESSEL',fromMode:'TRUCK',toMode:'VESSEL',description:'Truck delivers container to port for vessel loading',averageDwellHours:24,steps:[
    {order:1,action:'Truck arrives at port gate',responsible:'Truck driver',estimatedMinutes:20,documents:['Booking confirmation','BOL','Gate appointment']},
    {order:2,action:'Container inspected, placed in yard',responsible:'Terminal operator',estimatedMinutes:30,documents:['Equipment interchange receipt','Yard location']},
    {order:3,action:'Export customs filing',responsible:'Customs broker',estimatedMinutes:60,documents:['AES/SED filing','Export declaration'],crossBorderNote:'AES required for exports >$2,500 value'},
    {order:4,action:'Container loaded to vessel',responsible:'Terminal/stevedore',estimatedMinutes:30,documents:['Load plan','Stowage plan']},
    {order:5,action:'Vessel departs',responsible:'Vessel operator',estimatedMinutes:60,documents:['Bill of Lading issued','Departure manifest']},
  ]},
  { type:'RAIL_TO_VESSEL',fromMode:'RAIL',toMode:'VESSEL',description:'Container arrives by rail at port, transferred to vessel',averageDwellHours:36,steps:[
    {order:1,action:'Train arrives at port rail terminal',responsible:'Railroad',estimatedMinutes:60,documents:['Rail waybill','Arrival notice']},
    {order:2,action:'Container grounded in port yard',responsible:'Terminal operator',estimatedMinutes:30,documents:['Yard placement']},
    {order:3,action:'Export customs filing',responsible:'Customs broker',estimatedMinutes:60,documents:['AES/SED','Export declaration'],crossBorderNote:'AES required for exports >$2,500'},
    {order:4,action:'Container loaded to vessel',responsible:'Terminal/stevedore',estimatedMinutes:30,documents:['Load plan','Stowage plan']},
    {order:5,action:'Vessel departs',responsible:'Vessel operator',estimatedMinutes:60,documents:['BOL issued','Departure manifest']},
  ]},
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: MULTI-MODAL BILLING
// ═══════════════════════════════════════════════════════════════════════════

export interface BillingLineItem {
  code: string; description: string; mode: TransportMode | 'INTERMODAL';
  unit: string; typicalRange: { min: number; max: number; currency: HandoffCurrency };
  taxable: boolean; crossBorderApplicable: boolean;
}

export const BILLING_LINE_ITEMS: BillingLineItem[] = [
  { code:'DRAY-ORIG',description:'Origin drayage (truck pickup to rail/port)',mode:'TRUCK',unit:'per move',typicalRange:{min:250,max:1200,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'DRAY-DEST',description:'Destination drayage (rail/port to delivery)',mode:'TRUCK',unit:'per move',typicalRange:{min:250,max:1200,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'RAIL-LINE',description:'Rail line-haul',mode:'RAIL',unit:'per container/car',typicalRange:{min:800,max:4500,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'VESSEL-OCEAN',description:'Ocean freight',mode:'VESSEL',unit:'per TEU',typicalRange:{min:1500,max:8000,currency:'USD'},taxable:false,crossBorderApplicable:true },
  { code:'LIFT-ON',description:'Container lift-on at terminal',mode:'INTERMODAL',unit:'per lift',typicalRange:{min:150,max:400,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'LIFT-OFF',description:'Container lift-off at terminal',mode:'INTERMODAL',unit:'per lift',typicalRange:{min:150,max:400,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'TRANSLOAD',description:'Transload (floor-loaded to container or vice versa)',mode:'INTERMODAL',unit:'per CWT or per hour',typicalRange:{min:500,max:3000,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'CUSTOMS-ENTRY',description:'Customs entry/brokerage fee',mode:'INTERMODAL',unit:'per entry',typicalRange:{min:75,max:250,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'CUSTOMS-DUTY',description:'Import duty (varies by HTS + origin)',mode:'INTERMODAL',unit:'% of value',typicalRange:{min:0,max:25,currency:'USD'},taxable:false,crossBorderApplicable:true },
  { code:'ISF-FILING',description:'ISF 10+2 filing fee (US imports)',mode:'INTERMODAL',unit:'per filing',typicalRange:{min:25,max:50,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'EMANIFEST',description:'eManifest filing fee (ACE/ACI)',mode:'INTERMODAL',unit:'per filing',typicalRange:{min:15,max:50,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'CHASSIS-USE',description:'Chassis usage fee',mode:'TRUCK',unit:'per day',typicalRange:{min:20,max:60,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'DEMURRAGE',description:'Demurrage (container at terminal beyond free time)',mode:'INTERMODAL',unit:'per day',typicalRange:{min:75,max:350,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'DETENTION',description:'Detention (container at shipper/consignee beyond free time)',mode:'INTERMODAL',unit:'per day',typicalRange:{min:75,max:250,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'REEFER-PLUG',description:'Reefer plug-in at terminal',mode:'INTERMODAL',unit:'per day',typicalRange:{min:100,max:300,currency:'USD'},taxable:true,crossBorderApplicable:false },
  { code:'HAZMAT-SURCHARGE',description:'Hazmat handling surcharge',mode:'INTERMODAL',unit:'per container',typicalRange:{min:200,max:1000,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'OVERSIZE-SURCHARGE',description:'Oversize/overweight surcharge',mode:'INTERMODAL',unit:'per move',typicalRange:{min:500,max:5000,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'FUEL-SURCHARGE',description:'Fuel surcharge',mode:'INTERMODAL',unit:'% of line-haul',typicalRange:{min:10,max:35,currency:'USD'},taxable:true,crossBorderApplicable:true },
  { code:'BORDER-CROSSING',description:'Border crossing fee / bridge toll',mode:'TRUCK',unit:'per crossing',typicalRange:{min:5,max:50,currency:'USD'},taxable:false,crossBorderApplicable:true },
  { code:'USMCA-CERT',description:'USMCA certificate of origin processing',mode:'INTERMODAL',unit:'per cert',typicalRange:{min:25,max:100,currency:'USD'},taxable:true,crossBorderApplicable:true },
];


// ═══════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getIntermodalFacilities(params?: { country?: HandoffCountry; mode?: TransportMode; nearBorder?: boolean }) {
  let r = [...INTERMODAL_FACILITIES];
  if (params?.country) r = r.filter(f => f.country === params.country);
  if (params?.mode) r = r.filter(f => f.modesServed.includes(params.mode!));
  if (params?.nearBorder) r = r.filter(f => f.distanceToBorderKm !== undefined && f.distanceToBorderKm <= 50);
  return r;
}

export function getHandoffWorkflow(fromMode: TransportMode, toMode: TransportMode): HandoffWorkflow | null {
  const type = `${fromMode}_TO_${toMode}`;
  return HANDOFF_WORKFLOWS.find(w => w.type === type) || null;
}

export function getAllHandoffWorkflows() { return HANDOFF_WORKFLOWS; }

export function getBillingLineItems(params?: { mode?: TransportMode | 'INTERMODAL'; crossBorderOnly?: boolean }) {
  let r = [...BILLING_LINE_ITEMS];
  if (params?.mode) r = r.filter(i => i.mode === params.mode || i.mode === 'INTERMODAL');
  if (params?.crossBorderOnly) r = r.filter(i => i.crossBorderApplicable);
  return r;
}

export interface MultiModalQuoteInput {
  legs: { mode: TransportMode; originFacilityId?: string; destFacilityId?: string; distanceKm: number; containerCount: number }[];
  crossBorder: boolean;
  hasHazmat: boolean;
  hasReefer: boolean;
  hasOversized: boolean;
  direction?: string;
  currency: HandoffCurrency;
}

export interface MultiModalQuoteOutput {
  legs: { mode: TransportMode; lineItems: { code: string; description: string; amount: number; currency: HandoffCurrency }[]; subtotal: number }[];
  handoffCharges: { type: string; amount: number; currency: HandoffCurrency }[];
  crossBorderCharges: { code: string; description: string; amount: number; currency: HandoffCurrency }[];
  totalEstimate: number;
  currency: HandoffCurrency;
  notes: string[];
}

export function estimateMultiModalQuote(input: MultiModalQuoteInput): MultiModalQuoteOutput {
  const legs: MultiModalQuoteOutput['legs'] = [];
  const handoffCharges: MultiModalQuoteOutput['handoffCharges'] = [];
  const crossBorderCharges: MultiModalQuoteOutput['crossBorderCharges'] = [];
  const notes: string[] = [];
  let total = 0;

  for (const leg of input.legs) {
    const items: { code: string; description: string; amount: number; currency: HandoffCurrency }[] = [];

    if (leg.mode === 'TRUCK') {
      const drayRate = leg.distanceKm <= 100 ? 450 : 450 + (leg.distanceKm - 100) * 3.5;
      items.push({ code: 'DRAY-ORIG', description: 'Truck drayage', amount: Math.round(drayRate * leg.containerCount), currency: input.currency });
    } else if (leg.mode === 'RAIL') {
      const railRate = 1200 + leg.distanceKm * 0.8;
      items.push({ code: 'RAIL-LINE', description: 'Rail line-haul', amount: Math.round(railRate * leg.containerCount), currency: input.currency });
    } else if (leg.mode === 'VESSEL') {
      const oceanRate = 2500 + leg.distanceKm * 0.3;
      items.push({ code: 'VESSEL-OCEAN', description: 'Ocean freight', amount: Math.round(oceanRate * leg.containerCount), currency: input.currency });
    }

    // Fuel surcharge 18%
    const lineHaul = items.reduce((s, i) => s + i.amount, 0);
    items.push({ code: 'FUEL-SURCHARGE', description: 'Fuel surcharge (18%)', amount: Math.round(lineHaul * 0.18), currency: input.currency });

    if (input.hasHazmat) items.push({ code: 'HAZMAT-SURCHARGE', description: 'Hazmat surcharge', amount: 500 * leg.containerCount, currency: input.currency });
    if (input.hasReefer && leg.mode !== 'VESSEL') items.push({ code: 'REEFER-PLUG', description: 'Reefer plug-in (est 2 days)', amount: 400 * leg.containerCount, currency: input.currency });
    if (input.hasOversized) items.push({ code: 'OVERSIZE-SURCHARGE', description: 'Oversize surcharge', amount: 1500 * leg.containerCount, currency: input.currency });

    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    legs.push({ mode: leg.mode, lineItems: items, subtotal });
    total += subtotal;
  }

  // Handoff charges between legs
  for (let i = 0; i < input.legs.length - 1; i++) {
    const liftCharge = 350 * input.legs[i].containerCount;
    handoffCharges.push({ type: `${input.legs[i].mode}_TO_${input.legs[i+1].mode}`, amount: liftCharge, currency: input.currency });
    total += liftCharge;
  }

  // Cross-border charges
  if (input.crossBorder) {
    crossBorderCharges.push({ code: 'CUSTOMS-ENTRY', description: 'Customs brokerage', amount: 175 * input.legs[0].containerCount, currency: input.currency });
    crossBorderCharges.push({ code: 'EMANIFEST', description: 'eManifest filing', amount: 35, currency: input.currency });
    if (input.direction?.includes('US_import')) {
      crossBorderCharges.push({ code: 'ISF-FILING', description: 'ISF 10+2 filing', amount: 35, currency: input.currency });
    }
    crossBorderCharges.push({ code: 'BORDER-CROSSING', description: 'Border crossing fee', amount: 25 * input.legs[0].containerCount, currency: input.currency });
    crossBorderCharges.push({ code: 'USMCA-CERT', description: 'USMCA cert processing', amount: 50, currency: input.currency });
    const cbTotal = crossBorderCharges.reduce((s, c) => s + c.amount, 0);
    total += cbTotal;
    notes.push('Cross-border charges estimated. Actual customs duties depend on HTS classification and origin.');
  }

  notes.push('Estimate only — actual rates vary by market conditions, carrier, and service level.');
  logger.info(`[MultiModalQuote] ${input.legs.length} legs, cross-border=${input.crossBorder}, total=${total} ${input.currency}`);

  return { legs, handoffCharges, crossBorderCharges, totalEstimate: total, currency: input.currency, notes };
}

export function getHandoffDocumentChecklist(fromMode: TransportMode, toMode: TransportMode, crossBorder: boolean): string[] {
  const workflow = getHandoffWorkflow(fromMode, toMode);
  if (!workflow) return ['No workflow found for this mode combination'];
  const docs = new Set<string>();
  for (const step of workflow.steps) {
    for (const doc of step.documents) docs.add(doc);
    if (crossBorder && step.crossBorderNote) docs.add(`[CROSS-BORDER] ${step.crossBorderNote}`);
  }
  return Array.from(docs);
}
