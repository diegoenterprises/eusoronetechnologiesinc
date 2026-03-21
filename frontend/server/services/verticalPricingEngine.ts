/**
 * VERTICAL PRICING ENGINE — Phase 4.4
 * Mode-specific rate structures, surcharges, cross-border premiums,
 * accessorial charges, and multi-currency quoting for TRUCK / RAIL / VESSEL
 */
import { logger } from '../_core/logger';

export type PricingMode = 'TRUCK' | 'RAIL' | 'VESSEL';
export type PricingCurrency = 'USD' | 'CAD' | 'MXN';
export type PricingUnit = 'PER_MILE' | 'PER_KM' | 'PER_CWT' | 'PER_TON' | 'PER_CONTAINER' | 'PER_CAR' | 'PER_BBL' | 'PER_LOAD' | 'FLAT';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: BASE RATE STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

export interface BaseRate {
  id: string; mode: PricingMode; name: string;
  unit: PricingUnit; baseRate: number; currency: PricingCurrency;
  minCharge: number; effectiveDate: string;
  conditions: string[];
}

export const BASE_RATES: BaseRate[] = [
  // TRUCK
  { id:'TR-DRY-MI',mode:'TRUCK',name:'Dry Van — Per Mile',unit:'PER_MILE',baseRate:2.85,currency:'USD',minCharge:350,effectiveDate:'2024-01-01',conditions:['48 contiguous US states','Max 44,000 lbs payload','Standard 53ft trailer'] },
  { id:'TR-DRY-KM',mode:'TRUCK',name:'Dry Van — Per KM (Canada)',unit:'PER_KM',baseRate:2.25,currency:'CAD',minCharge:450,effectiveDate:'2024-01-01',conditions:['Canadian provinces','Max 20,000 kg payload','Standard 53ft trailer'] },
  { id:'TR-FLAT-MI',mode:'TRUCK',name:'Flatbed — Per Mile',unit:'PER_MILE',baseRate:3.45,currency:'USD',minCharge:500,effectiveDate:'2024-01-01',conditions:['Open deck','Max 48,000 lbs','Tarping extra'] },
  { id:'TR-REEF-MI',mode:'TRUCK',name:'Reefer — Per Mile',unit:'PER_MILE',baseRate:3.65,currency:'USD',minCharge:500,effectiveDate:'2024-01-01',conditions:['Temperature controlled','Continuous monitoring','Pre-cool required'] },
  { id:'TR-HAZ-MI',mode:'TRUCK',name:'Hazmat — Per Mile',unit:'PER_MILE',baseRate:4.25,currency:'USD',minCharge:750,effectiveDate:'2024-01-01',conditions:['Hazmat endorsed driver','Placarded load','Route compliance required'] },
  { id:'TR-TANK-MI',mode:'TRUCK',name:'Tanker — Per Mile',unit:'PER_MILE',baseRate:3.95,currency:'USD',minCharge:600,effectiveDate:'2024-01-01',conditions:['MC-306/DOT-406 or MC-307/DOT-407','Crude/refined products','Washout may apply'] },
  { id:'TR-CRUDE-BBL',mode:'TRUCK',name:'Crude Oil — Per Barrel',unit:'PER_BBL',baseRate:1.85,currency:'USD',minCharge:300,effectiveDate:'2024-01-01',conditions:['Min 160 BBL load','MC-306 trailer','Lease pickup'] },
  { id:'TR-OW-MI',mode:'TRUCK',name:'Oversized/Overweight — Per Mile',unit:'PER_MILE',baseRate:5.50,currency:'USD',minCharge:1500,effectiveDate:'2024-01-01',conditions:['Permits required','Escort may be required','Route survey needed for super loads'] },
  { id:'TR-LTL-CWT',mode:'TRUCK',name:'LTL — Per CWT',unit:'PER_CWT',baseRate:12.50,currency:'USD',minCharge:75,effectiveDate:'2024-01-01',conditions:['Less than truckload','NMFC class-based','Density pricing available'] },
  { id:'TR-MX-KM',mode:'TRUCK',name:'Dry Van — Per KM (Mexico)',unit:'PER_KM',baseRate:28.00,currency:'MXN',minCharge:8500,effectiveDate:'2024-01-01',conditions:['Mexican domestic','NOM-012 compliance','Carta Porte required'] },

  // RAIL
  { id:'RL-INTER-CTR',mode:'RAIL',name:'Intermodal Container',unit:'PER_CONTAINER',baseRate:1850,currency:'USD',minCharge:1850,effectiveDate:'2024-01-01',conditions:['53ft domestic container','Door-to-door with drayage','2-5 day transit'] },
  { id:'RL-CAR-TON',mode:'RAIL',name:'Carload — Per Ton',unit:'PER_TON',baseRate:45,currency:'USD',minCharge:2500,effectiveDate:'2024-01-01',conditions:['Single carload','Min 20 tons','Commodity-specific pricing'] },
  { id:'RL-UNIT-CAR',mode:'RAIL',name:'Unit Train — Per Car',unit:'PER_CAR',baseRate:3200,currency:'USD',minCharge:3200,effectiveDate:'2024-01-01',conditions:['Min 75-car train','Single commodity','Origin-destination pair contract'] },
  { id:'RL-CRUDE-BBL',mode:'RAIL',name:'Crude by Rail — Per Barrel',unit:'PER_BBL',baseRate:8.50,currency:'USD',minCharge:85000,effectiveDate:'2024-01-01',conditions:['Unit train 100+ cars','DOT-117 tank cars required','Loading/unloading terminal'] },
  { id:'RL-HAZ-CAR',mode:'RAIL',name:'Hazmat Carload',unit:'PER_CAR',baseRate:4500,currency:'USD',minCharge:4500,effectiveDate:'2024-01-01',conditions:['DOT-spec tank car or boxcar','Placarded per 49 CFR','TIH/PIH surcharges extra'] },
  { id:'RL-CA-CTR',mode:'RAIL',name:'Intermodal Container (Canada)',unit:'PER_CONTAINER',baseRate:2350,currency:'CAD',minCharge:2350,effectiveDate:'2024-01-01',conditions:['CN/CP intermodal','53ft or 20/40ft containers','Cross-border with customs'] },

  // VESSEL
  { id:'VS-FCL-20',mode:'VESSEL',name:'FCL 20ft Container',unit:'PER_CONTAINER',baseRate:2800,currency:'USD',minCharge:2800,effectiveDate:'2024-01-01',conditions:['Full container load','20ft standard','Port-to-port'] },
  { id:'VS-FCL-40',mode:'VESSEL',name:'FCL 40ft Container',unit:'PER_CONTAINER',baseRate:3500,currency:'USD',minCharge:3500,effectiveDate:'2024-01-01',conditions:['Full container load','40ft standard or high-cube','Port-to-port'] },
  { id:'VS-REEF-40',mode:'VESSEL',name:'Reefer 40ft Container',unit:'PER_CONTAINER',baseRate:5500,currency:'USD',minCharge:5500,effectiveDate:'2024-01-01',conditions:['Refrigerated container','Power plug required','Temperature monitoring'] },
  { id:'VS-BULK-TON',mode:'VESSEL',name:'Bulk Cargo — Per Ton',unit:'PER_TON',baseRate:18,currency:'USD',minCharge:5000,effectiveDate:'2024-01-01',conditions:['Dry bulk','Min parcel size','Vessel size dependent'] },
  { id:'VS-TANKER-TON',mode:'VESSEL',name:'Tanker — Per Ton',unit:'PER_TON',baseRate:25,currency:'USD',minCharge:10000,effectiveDate:'2024-01-01',conditions:['Liquid bulk','Crude/refined/chemicals','Worldscale rate may apply'] },
  { id:'VS-RORO-UNIT',mode:'VESSEL',name:'RoRo — Per Unit',unit:'PER_LOAD',baseRate:1200,currency:'USD',minCharge:1200,effectiveDate:'2024-01-01',conditions:['Roll-on/Roll-off','Vehicles, machinery','CBM-based for oversized'] },
];


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: SURCHARGES & ACCESSORIALS
// ═══════════════════════════════════════════════════════════════════════════

export interface Surcharge {
  id: string; name: string; applicableModes: PricingMode[];
  type: 'PERCENTAGE' | 'FLAT' | 'PER_UNIT';
  amount: number; unit?: string; currency: PricingCurrency;
  conditions: string[];
}

export const SURCHARGES: Surcharge[] = [
  // Fuel
  { id:'SC-FSC',name:'Fuel Surcharge (Truck)',applicableModes:['TRUCK'],type:'PERCENTAGE',amount:22,currency:'USD',conditions:['Based on DOE national avg diesel','Adjusted weekly','Formula: (current - base) / base * line haul'] },
  { id:'SC-BAF',name:'Bunker Adjustment Factor (Vessel)',applicableModes:['VESSEL'],type:'PER_UNIT',amount:450,unit:'per container',currency:'USD',conditions:['Based on Rotterdam/Singapore bunker index','Adjusted monthly'] },
  { id:'SC-FSC-RL',name:'Fuel Surcharge (Rail)',applicableModes:['RAIL'],type:'PERCENTAGE',amount:18,currency:'USD',conditions:['Based on WTI or highway diesel index','Adjusted quarterly by Class I railroads'] },

  // Cross-border
  { id:'SC-XBORDER',name:'Cross-Border Premium',applicableModes:['TRUCK','RAIL','VESSEL'],type:'PERCENTAGE',amount:15,currency:'USD',conditions:['US-MX or US-CA movements','Includes customs coordination','Does not include duties/taxes'] },
  { id:'SC-XBORDER-MX',name:'Mexico Border Premium',applicableModes:['TRUCK'],type:'FLAT',amount:350,currency:'USD',conditions:['Additional for US-MX movements','Carta Porte generation','Agente aduanal coordination'] },
  { id:'SC-BROKER',name:'Customs Brokerage Fee',applicableModes:['TRUCK','RAIL','VESSEL'],type:'FLAT',amount:175,currency:'USD',conditions:['Per customs entry','Does not include duties','Document preparation included'] },

  // Equipment
  { id:'SC-TARP',name:'Tarping',applicableModes:['TRUCK'],type:'FLAT',amount:75,currency:'USD',conditions:['Flatbed loads requiring tarp','Lumber wrap extra'] },
  { id:'SC-TEAM',name:'Team Driver',applicableModes:['TRUCK'],type:'PERCENTAGE',amount:50,currency:'USD',conditions:['Two-driver team for expedited','No 10hr rest requirement','Continuous driving'] },
  { id:'SC-PRECOOL',name:'Pre-Cool Reefer',applicableModes:['TRUCK','VESSEL'],type:'FLAT',amount:125,currency:'USD',conditions:['Pre-cool trailer to temp before loading','Min 2hr pre-cool'] },
  { id:'SC-GENSET',name:'Generator Set (Reefer)',applicableModes:['RAIL','VESSEL'],type:'FLAT',amount:200,currency:'USD',conditions:['External genset for reefer containers','Rail/vessel only'] },

  // Handling
  { id:'SC-DET-TR',name:'Detention (Truck)',applicableModes:['TRUCK'],type:'PER_UNIT',amount:75,unit:'per hour',currency:'USD',conditions:['After 2hr free time at shipper/consignee','Billed in 15-min increments'] },
  { id:'SC-DEM-RL',name:'Demurrage (Rail)',applicableModes:['RAIL'],type:'PER_UNIT',amount:150,unit:'per car per day',currency:'USD',conditions:['After 24hr free time','Applies at origin and destination'] },
  { id:'SC-DEM-VS',name:'Demurrage (Vessel)',applicableModes:['VESSEL'],type:'PER_UNIT',amount:200,unit:'per container per day',currency:'USD',conditions:['After 5 free days at port','Import and export'] },
  { id:'SC-DRAY',name:'Drayage',applicableModes:['RAIL','VESSEL'],type:'FLAT',amount:450,currency:'USD',conditions:['Local truck move to/from rail yard or port','Within 50-mile radius'] },
  { id:'SC-CHASSIS',name:'Chassis Usage',applicableModes:['RAIL','VESSEL'],type:'PER_UNIT',amount:35,unit:'per day',currency:'USD',conditions:['Container chassis rental','Pool or carrier-owned'] },

  // Hazmat
  { id:'SC-HAZ',name:'Hazmat Surcharge',applicableModes:['TRUCK','RAIL','VESSEL'],type:'PERCENTAGE',amount:25,currency:'USD',conditions:['Hazmat placarded loads','Includes DOT/TDG/SCT compliance','Class 1 explosives: additional 50%'] },
  { id:'SC-TIH',name:'Toxic by Inhalation',applicableModes:['RAIL'],type:'FLAT',amount:2500,currency:'USD',conditions:['TIH/PIH materials (chlorine, ammonia, etc.)','Additional security and routing requirements'] },

  // Specialty
  { id:'SC-OW-PERMIT',name:'Overweight/Oversized Permit',applicableModes:['TRUCK'],type:'FLAT',amount:250,currency:'USD',conditions:['Per state/province permit','Escort extra','Route survey for super loads extra'] },
  { id:'SC-ESCORT',name:'Escort Vehicle',applicableModes:['TRUCK'],type:'PER_UNIT',amount:3.50,unit:'per mile',currency:'USD',conditions:['Required for oversized loads per state law','Front and/or rear escort'] },
  { id:'SC-LAYOVER',name:'Layover',applicableModes:['TRUCK'],type:'FLAT',amount:350,currency:'USD',conditions:['Driver required to wait overnight','Includes meals and lodging allowance'] },
  { id:'SC-STOP',name:'Stop-Off Charge',applicableModes:['TRUCK'],type:'FLAT',amount:100,currency:'USD',conditions:['Additional pickup or delivery stop','Max 4 stops per load'] },
  { id:'SC-INSIDE',name:'Inside Delivery/Pickup',applicableModes:['TRUCK'],type:'FLAT',amount:150,currency:'USD',conditions:['Driver assists with loading/unloading inside facility','Liftgate may be additional'] },
  { id:'SC-LIFTGATE',name:'Liftgate',applicableModes:['TRUCK'],type:'FLAT',amount:75,currency:'USD',conditions:['Hydraulic liftgate for ground-level delivery','LTL or partial loads'] },
  { id:'SC-WASHOUT',name:'Tank Washout',applicableModes:['TRUCK'],type:'FLAT',amount:250,currency:'USD',conditions:['Interior tank cleaning between loads','Kosher/food-grade wash extra'] },
];


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: CROSS-BORDER PREMIUM MATRIX
// ═══════════════════════════════════════════════════════════════════════════

export interface CrossBorderPremium {
  direction: string; mode: PricingMode;
  premiumPct: number; flatFee: number; currency: PricingCurrency;
  includedServices: string[]; excludedCosts: string[];
}

export const CROSS_BORDER_PREMIUMS: CrossBorderPremium[] = [
  { direction:'US_TO_CA',mode:'TRUCK',premiumPct:12,flatFee:200,currency:'USD',includedServices:['ACI eManifest filing','CBSA pre-arrival','Border wait time coordination'],excludedCosts:['GST/HST','Customs brokerage','Bond fees'] },
  { direction:'CA_TO_US',mode:'TRUCK',premiumPct:12,flatFee:200,currency:'USD',includedServices:['ACE eManifest filing','CBP pre-arrival','FAST lane coordination'],excludedCosts:['US customs duties','Customs brokerage','ISF filing (if applicable)'] },
  { direction:'US_TO_MX',mode:'TRUCK',premiumPct:20,flatFee:450,currency:'USD',includedServices:['Carta Porte generation','Border transfer coordination','Agente aduanal liaison','NOM compliance check'],excludedCosts:['Mexican duties (IGI)','IVA','DTA','IEPS','Mexican insurance'] },
  { direction:'MX_TO_US',mode:'TRUCK',premiumPct:20,flatFee:450,currency:'USD',includedServices:['ACE eManifest','FDA prior notice (food)','USDA inspection coordination','Transfer at border'],excludedCosts:['US customs duties','FDA fees','USDA fees'] },
  { direction:'US_TO_CA',mode:'RAIL',premiumPct:10,flatFee:500,currency:'USD',includedServices:['ACI filing','Interchange coordination','Crew change at border'],excludedCosts:['Canadian duties','Brokerage'] },
  { direction:'CA_TO_US',mode:'RAIL',premiumPct:10,flatFee:500,currency:'USD',includedServices:['ACE filing','FRA/TC compliance bridge','Interchange coordination'],excludedCosts:['US duties','Brokerage'] },
  { direction:'US_TO_MX',mode:'RAIL',premiumPct:18,flatFee:800,currency:'USD',includedServices:['Pedimento coordination','FXE/KCSM interchange','Carta Porte','SCT compliance'],excludedCosts:['Mexican duties','IVA','Agente aduanal fees'] },
  { direction:'MX_TO_US',mode:'RAIL',premiumPct:18,flatFee:800,currency:'USD',includedServices:['ACE filing','UP/BNSF interchange','Customs coordination'],excludedCosts:['US duties','Brokerage','FDA/USDA fees'] },
  { direction:'INTERNATIONAL',mode:'VESSEL',premiumPct:8,flatFee:350,currency:'USD',includedServices:['ISF 10+2 filing','24-hour rule compliance','Port coordination'],excludedCosts:['Customs duties','Brokerage','Port fees','THC'] },
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getBaseRates(params?: { mode?: PricingMode; currency?: PricingCurrency }) {
  let r = [...BASE_RATES];
  if (params?.mode) r = r.filter(rate => rate.mode === params.mode);
  if (params?.currency) r = r.filter(rate => rate.currency === params.currency);
  return r;
}

export function getSurcharges(params?: { mode?: PricingMode; category?: string }) {
  let r = [...SURCHARGES];
  if (params?.mode) r = r.filter(s => s.applicableModes.includes(params.mode!));
  if (params?.category) {
    const cat = params.category.toLowerCase();
    r = r.filter(s => s.name.toLowerCase().includes(cat) || s.id.toLowerCase().includes(cat));
  }
  return r;
}

export function getCrossBorderPremiums(params?: { direction?: string; mode?: PricingMode }) {
  let r = [...CROSS_BORDER_PREMIUMS];
  if (params?.direction) r = r.filter(p => p.direction === params.direction);
  if (params?.mode) r = r.filter(p => p.mode === params.mode);
  return r;
}

export interface QuoteRequest {
  mode: PricingMode;
  rateId: string;
  quantity: number;
  distance?: number;
  surchargeIds: string[];
  crossBorder: boolean;
  direction?: string;
  currency: PricingCurrency;
}

export interface QuoteResult {
  lineItems: { description: string; amount: number; currency: PricingCurrency }[];
  subtotal: number;
  crossBorderPremium: number;
  surchargeTotal: number;
  grandTotal: number;
  currency: PricingCurrency;
  notes: string[];
}

const FX_RATES: Record<string, number> = { USD_USD: 1, CAD_CAD: 1, MXN_MXN: 1, USD_CAD: 1.36, CAD_USD: 0.735, USD_MXN: 17.5, MXN_USD: 0.057, CAD_MXN: 12.87, MXN_CAD: 0.0777 };

function convertCurrency(amount: number, from: PricingCurrency, to: PricingCurrency): number {
  if (from === to) return amount;
  const key = `${from}_${to}`;
  return amount * (FX_RATES[key] ?? 1);
}

export function generateQuote(req: QuoteRequest): QuoteResult {
  const base = BASE_RATES.find(r => r.id === req.rateId);
  if (!base) {
    logger.warn(`[Pricing] Rate not found: ${req.rateId}`);
    return { lineItems: [], subtotal: 0, crossBorderPremium: 0, surchargeTotal: 0, grandTotal: 0, currency: req.currency, notes: [`Rate ID "${req.rateId}" not found`] };
  }

  const notes: string[] = [];
  const lineItems: { description: string; amount: number; currency: PricingCurrency }[] = [];

  // Base charge
  let baseAmount: number;
  if (base.unit === 'PER_MILE' || base.unit === 'PER_KM') {
    baseAmount = (req.distance ?? req.quantity) * base.baseRate;
  } else {
    baseAmount = req.quantity * base.baseRate;
  }
  baseAmount = Math.max(baseAmount, base.minCharge);
  const baseConverted = convertCurrency(baseAmount, base.currency, req.currency);
  lineItems.push({ description: `${base.name} (${req.quantity} × $${base.baseRate}/${base.unit})`, amount: Math.round(baseConverted * 100) / 100, currency: req.currency });

  // Surcharges
  let surchargeTotal = 0;
  for (const sid of req.surchargeIds) {
    const sc = SURCHARGES.find(s => s.id === sid);
    if (!sc) { notes.push(`Surcharge "${sid}" not found, skipped`); continue; }
    if (!sc.applicableModes.includes(req.mode)) { notes.push(`Surcharge "${sc.name}" not applicable to ${req.mode}, skipped`); continue; }
    let scAmount: number;
    if (sc.type === 'PERCENTAGE') {
      scAmount = baseConverted * (sc.amount / 100);
    } else if (sc.type === 'PER_UNIT') {
      scAmount = convertCurrency(sc.amount * req.quantity, sc.currency, req.currency);
    } else {
      scAmount = convertCurrency(sc.amount, sc.currency, req.currency);
    }
    surchargeTotal += scAmount;
    lineItems.push({ description: sc.name, amount: Math.round(scAmount * 100) / 100, currency: req.currency });
  }

  // Cross-border premium
  let cbPremium = 0;
  if (req.crossBorder && req.direction) {
    const prem = CROSS_BORDER_PREMIUMS.find(p => p.direction === req.direction && p.mode === req.mode);
    if (prem) {
      cbPremium = baseConverted * (prem.premiumPct / 100) + convertCurrency(prem.flatFee, prem.currency, req.currency);
      lineItems.push({ description: `Cross-Border Premium (${req.direction})`, amount: Math.round(cbPremium * 100) / 100, currency: req.currency });
      notes.push(`Included: ${prem.includedServices.join(', ')}`);
      notes.push(`Excluded (bill separately): ${prem.excludedCosts.join(', ')}`);
    }
  }

  const grandTotal = Math.round((baseConverted + surchargeTotal + cbPremium) * 100) / 100;
  logger.info(`[Pricing] Quote: mode=${req.mode} rate=${req.rateId} total=${grandTotal} ${req.currency}`);

  return {
    lineItems,
    subtotal: Math.round(baseConverted * 100) / 100,
    crossBorderPremium: Math.round(cbPremium * 100) / 100,
    surchargeTotal: Math.round(surchargeTotal * 100) / 100,
    grandTotal,
    currency: req.currency,
    notes,
  };
}
