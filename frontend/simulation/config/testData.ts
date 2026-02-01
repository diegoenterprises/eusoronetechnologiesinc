/**
 * EUSOTRIP SIMULATION - Test Data Generators
 * Comprehensive test data for 1,000 scenario simulation
 */

// ═══════════════════════════════════════════════════════════════════════════
// USER PERSONAS - Diverse profiles for realistic testing
// ═══════════════════════════════════════════════════════════════════════════

export interface DriverPersona {
  id: string;
  name: string;
  experience: string;
  age: number;
  creditScore: number;
  equipment: string;
  region: string;
  hazmat: boolean;
  oversize: boolean;
  specialty?: string;
  financial?: string;
  team?: boolean;
  employmentType?: string;
  status?: string;
}

export interface CarrierPersona {
  id: string;
  name: string;
  fleetSize: number;
  authority: string;
  insurance: string;
  creditLine: number;
  specialty?: string;
  region?: string;
  status?: string;
  type?: string;
}

export interface BrokerPersona {
  id: string;
  name: string;
  volume: number;
  authority: string;
  bond: number;
  specialty: string;
  region?: string;
  model?: string;
  status?: string;
}

export interface ShipperPersona {
  id: string;
  name: string;
  industry: string;
  volume: number;
  shipmentType: string;
  credit: string;
  paymentTerms?: string;
}

export const DRIVER_PERSONAS: DriverPersona[] = [
  // EXPERIENCE LEVELS
  { id: 'D001', name: 'Rookie Randy', experience: '6mo', age: 23, creditScore: 580, equipment: 'leased', region: 'southeast', hazmat: false, oversize: false },
  { id: 'D002', name: 'Veteran Vic', experience: '25yr', age: 58, creditScore: 780, equipment: 'owned_fleet_3', region: 'nationwide', hazmat: true, oversize: true },
  { id: 'D003', name: 'Mid-Career Mike', experience: '8yr', age: 35, creditScore: 680, equipment: 'owned_single', region: 'midwest', hazmat: true, oversize: false },
  
  // SPECIALIZATIONS
  { id: 'D004', name: 'Hazmat Harry', experience: '15yr', age: 45, creditScore: 720, equipment: 'owned_single', region: 'nationwide', hazmat: true, oversize: false, specialty: 'hazmat_all_classes' },
  { id: 'D005', name: 'Oversize Olivia', experience: '12yr', age: 40, creditScore: 700, equipment: 'owned_specialized', region: 'west', hazmat: false, oversize: true, specialty: 'superloads' },
  { id: 'D006', name: 'Reefer Rick', experience: '10yr', age: 38, creditScore: 690, equipment: 'owned_reefer', region: 'california', hazmat: false, oversize: false, specialty: 'temperature_controlled' },
  { id: 'D007', name: 'Flatbed Fran', experience: '18yr', age: 50, creditScore: 750, equipment: 'owned_flatbed', region: 'texas', hazmat: false, oversize: true, specialty: 'construction_materials' },
  { id: 'D008', name: 'Tanker Tom', experience: '20yr', age: 52, creditScore: 760, equipment: 'owned_tanker', region: 'gulf_coast', hazmat: true, oversize: false, specialty: 'liquid_bulk' },
  
  // FINANCIAL SITUATIONS
  { id: 'D009', name: 'Struggling Steve', experience: '3yr', age: 28, creditScore: 520, equipment: 'leased_behind', region: 'northeast', hazmat: false, oversize: false, financial: 'needs_quickpay' },
  { id: 'D010', name: 'Prosperous Pete', experience: '15yr', age: 48, creditScore: 800, equipment: 'owned_fleet_10', region: 'nationwide', hazmat: true, oversize: true, financial: 'cash_reserves' },
  { id: 'D011', name: 'Rebuilding Rita', experience: '5yr', age: 32, creditScore: 600, equipment: 'leased', region: 'southeast', hazmat: false, oversize: false, financial: 'rebuilding_credit' },
  
  // TEAM DRIVERS
  { id: 'D012', name: 'Team Alpha (John & Jane)', experience: '7yr', age: 35, creditScore: 700, equipment: 'owned_sleeper', region: 'nationwide', hazmat: true, oversize: false, team: true },
  { id: 'D013', name: 'Team Beta (Carlos & Maria)', experience: '4yr', age: 30, creditScore: 650, equipment: 'leased', region: 'southwest', hazmat: false, oversize: false, team: true },
  
  // COMPANY DRIVERS
  { id: 'D014', name: 'Company Carl', experience: '2yr', age: 26, creditScore: 640, equipment: 'company', region: 'local', hazmat: false, oversize: false, employmentType: 'W2' },
  { id: 'D015', name: 'Company Carla', experience: '6yr', age: 34, creditScore: 680, equipment: 'company', region: 'regional', hazmat: true, oversize: false, employmentType: 'W2' },
  
  // EDGE CASES
  { id: 'D016', name: 'New CDL Nathan', experience: '1mo', age: 21, creditScore: 550, equipment: 'none', region: 'local', hazmat: false, oversize: false, status: 'seeking_first_job' },
  { id: 'D017', name: 'Returning Rachel', experience: '10yr_gap_5yr', age: 45, creditScore: 620, equipment: 'leased', region: 'midwest', hazmat: false, oversize: false, status: 'returning_after_break' },
  { id: 'D018', name: 'International Ivan', experience: '8yr_foreign', age: 38, creditScore: 0, equipment: 'none', region: 'northeast', hazmat: false, oversize: false, status: 'foreign_license_conversion' },
  { id: 'D019', name: 'Disabled Dan', experience: '20yr', age: 55, creditScore: 740, equipment: 'owned_adapted', region: 'southeast', hazmat: false, oversize: false, status: 'ada_accommodations' },
  { id: 'D020', name: 'Semi-Retired Sam', experience: '30yr', age: 62, creditScore: 800, equipment: 'owned_single', region: 'local', hazmat: false, oversize: false, status: 'part_time' },
];

export const CARRIER_PERSONAS: CarrierPersona[] = [
  { id: 'C001', name: 'Small Fleet Sally', fleetSize: 5, authority: 'new_6mo', insurance: 'minimum', creditLine: 50000 },
  { id: 'C002', name: 'Medium Fleet Marcus', fleetSize: 25, authority: 'established_3yr', insurance: 'comprehensive', creditLine: 500000 },
  { id: 'C003', name: 'Large Fleet Larry', fleetSize: 150, authority: 'established_10yr', insurance: 'premium', creditLine: 5000000 },
  { id: 'C004', name: 'Specialized Carrier SC', fleetSize: 40, authority: 'established_15yr', insurance: 'premium', creditLine: 2000000, specialty: 'hazmat_only' },
  { id: 'C005', name: 'Regional Carrier RC', fleetSize: 15, authority: 'established_5yr', insurance: 'comprehensive', creditLine: 250000, region: 'texas_only' },
  { id: 'C006', name: 'Struggling Carrier', fleetSize: 8, authority: 'established_2yr', insurance: 'lapsed', creditLine: 10000, status: 'financial_trouble' },
  { id: 'C007', name: 'Growing Carrier GC', fleetSize: 30, authority: 'established_4yr', insurance: 'comprehensive', creditLine: 750000, status: 'rapid_expansion' },
  { id: 'C008', name: 'Family Carrier FC', fleetSize: 12, authority: 'established_20yr', insurance: 'comprehensive', creditLine: 300000, type: 'family_owned' },
  { id: 'C009', name: 'New Authority NA', fleetSize: 3, authority: 'new_1mo', insurance: 'minimum', creditLine: 25000, status: 'just_started' },
  { id: 'C010', name: 'Intermodal Carrier IC', fleetSize: 50, authority: 'established_8yr', insurance: 'premium', creditLine: 1500000, specialty: 'intermodal' },
];

export const BROKER_PERSONAS: BrokerPersona[] = [
  { id: 'B001', name: 'Small Brokerage SB', volume: 50, authority: 'new_1yr', bond: 75000, specialty: 'general' },
  { id: 'B002', name: 'Major Brokerage MB', volume: 5000, authority: 'established_15yr', bond: 500000, specialty: 'all' },
  { id: 'B003', name: 'Niche Broker NB', volume: 200, authority: 'established_5yr', bond: 100000, specialty: 'refrigerated' },
  { id: 'B004', name: 'Hazmat Broker HB', volume: 100, authority: 'established_10yr', bond: 250000, specialty: 'hazmat' },
  { id: 'B005', name: 'Tech-Forward TF', volume: 1000, authority: 'established_3yr', bond: 150000, specialty: 'digital_first' },
  { id: 'B006', name: 'Regional Broker RB', volume: 300, authority: 'established_7yr', bond: 100000, specialty: 'regional', region: 'midwest' },
  { id: 'B007', name: 'Asset-Light AL', volume: 2000, authority: 'established_12yr', bond: 300000, specialty: 'general', model: 'pure_brokerage' },
  { id: 'B008', name: 'Struggling Broker', volume: 30, authority: 'established_2yr', bond: 75000, specialty: 'general', status: 'low_volume' },
];

export const SHIPPER_PERSONAS: ShipperPersona[] = [
  { id: 'S001', name: 'Manufacturer M1', industry: 'automotive', volume: 500, shipmentType: 'just_in_time', credit: 'excellent' },
  { id: 'S002', name: 'Retailer R1', industry: 'retail', volume: 2000, shipmentType: 'distribution', credit: 'good' },
  { id: 'S003', name: 'Food Producer FP', industry: 'food', volume: 800, shipmentType: 'temperature_controlled', credit: 'excellent' },
  { id: 'S004', name: 'Chemical Company CC', industry: 'chemicals', volume: 300, shipmentType: 'hazmat', credit: 'excellent' },
  { id: 'S005', name: 'Construction Co', industry: 'construction', volume: 400, shipmentType: 'flatbed_oversize', credit: 'good' },
  { id: 'S006', name: 'E-commerce EC', industry: 'ecommerce', volume: 5000, shipmentType: 'ltl_parcel', credit: 'excellent' },
  { id: 'S007', name: 'Agriculture AG', industry: 'agriculture', volume: 600, shipmentType: 'bulk_seasonal', credit: 'fair' },
  { id: 'S008', name: 'Pharmaceutical PH', industry: 'pharma', volume: 200, shipmentType: 'high_value_controlled', credit: 'excellent' },
  { id: 'S009', name: 'Small Business SB', industry: 'misc', volume: 20, shipmentType: 'occasional', credit: 'fair' },
  { id: 'S010', name: 'Government GOV', industry: 'government', volume: 150, shipmentType: 'contract', credit: 'excellent', paymentTerms: 'net_60' },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOAD SCENARIOS - Diverse freight situations
// ═══════════════════════════════════════════════════════════════════════════

export interface LoadScenario {
  type: string;
  weight: number;
  miles: number;
  rate: number;
  urgency: string;
  special: string | null;
  escort?: boolean | string;
}

export const LOAD_SCENARIOS: LoadScenario[] = [
  // STANDARD LOADS
  { type: 'DRY_VAN', weight: 35000, miles: 500, rate: 2.50, urgency: 'standard', special: null },
  { type: 'DRY_VAN', weight: 42000, miles: 1500, rate: 2.20, urgency: 'standard', special: null },
  { type: 'DRY_VAN', weight: 20000, miles: 200, rate: 3.00, urgency: 'hot', special: 'appointment_strict' },
  
  // REFRIGERATED
  { type: 'REEFER', weight: 38000, miles: 800, rate: 3.50, urgency: 'standard', special: 'temp_34F' },
  { type: 'REEFER', weight: 40000, miles: 2000, rate: 3.20, urgency: 'standard', special: 'temp_0F_frozen' },
  { type: 'REEFER', weight: 25000, miles: 300, rate: 4.00, urgency: 'hot', special: 'temp_sensitive_pharma' },
  
  // FLATBED
  { type: 'FLATBED', weight: 45000, miles: 600, rate: 3.80, urgency: 'standard', special: 'tarped' },
  { type: 'FLATBED', weight: 48000, miles: 400, rate: 4.50, urgency: 'standard', special: 'steel_coils' },
  { type: 'STEP_DECK', weight: 42000, miles: 800, rate: 4.20, urgency: 'standard', special: 'machinery' },
  
  // HAZMAT
  { type: 'HAZMAT_CLASS_3', weight: 35000, miles: 500, rate: 4.50, urgency: 'standard', special: 'flammable_liquid' },
  { type: 'HAZMAT_CLASS_8', weight: 40000, miles: 700, rate: 5.00, urgency: 'standard', special: 'corrosive' },
  { type: 'HAZMAT_CLASS_2', weight: 30000, miles: 300, rate: 5.50, urgency: 'hot', special: 'compressed_gas' },
  { type: 'HAZMAT_CLASS_1', weight: 25000, miles: 400, rate: 8.00, urgency: 'standard', special: 'explosives', escort: true },
  { type: 'HAZMAT_CLASS_7', weight: 15000, miles: 600, rate: 12.00, urgency: 'standard', special: 'radioactive', escort: true },
  
  // OVERSIZE/OVERWEIGHT
  { type: 'OVERSIZE', weight: 80000, miles: 500, rate: 8.00, urgency: 'standard', special: 'wide_load_12ft', escort: true },
  { type: 'OVERSIZE', weight: 120000, miles: 300, rate: 15.00, urgency: 'standard', special: 'superload', escort: 'front_rear' },
  { type: 'OVERWEIGHT', weight: 95000, miles: 400, rate: 6.00, urgency: 'standard', special: 'permit_required' },
  
  // SPECIALIZED
  { type: 'TANKER', weight: 48000, miles: 600, rate: 3.80, urgency: 'standard', special: 'food_grade' },
  { type: 'TANKER', weight: 45000, miles: 400, rate: 5.00, urgency: 'standard', special: 'chemical_hazmat' },
  { type: 'AUTO_CARRIER', weight: 42000, miles: 1000, rate: 2.80, urgency: 'standard', special: '9_car_load' },
  { type: 'LIVESTOCK', weight: 35000, miles: 500, rate: 4.00, urgency: 'hot', special: 'cattle_welfare_stops' },
  
  // LTL
  { type: 'LTL', weight: 5000, miles: 300, rate: 150, urgency: 'standard', special: '4_pallets' },
  { type: 'LTL', weight: 2000, miles: 150, rate: 80, urgency: 'standard', special: '2_pallets' },
  
  // EXPEDITED
  { type: 'EXPEDITED', weight: 15000, miles: 800, rate: 6.00, urgency: 'critical', special: 'team_required' },
  { type: 'EXPEDITED', weight: 5000, miles: 400, rate: 8.00, urgency: 'emergency', special: 'hotshot' },
  
  // EDGE CASES
  { type: 'DRY_VAN', weight: 100, miles: 50, rate: 5.00, urgency: 'standard', special: 'minimum_charge' },
  { type: 'DRY_VAN', weight: 44000, miles: 3000, rate: 1.80, urgency: 'flexible', special: 'cross_country' },
  { type: 'INTERMODAL', weight: 42000, miles: 2500, rate: 1.50, urgency: 'standard', special: 'rail_dray' },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOCATIONS - US geography coverage
// ═══════════════════════════════════════════════════════════════════════════

export interface USLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
  type: string;
  timezone: string;
}

export const US_LOCATIONS: USLocation[] = [
  // MAJOR PORTS
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437, type: 'port', timezone: 'America/Los_Angeles' },
  { city: 'Long Beach', state: 'CA', lat: 33.7701, lng: -118.1937, type: 'port', timezone: 'America/Los_Angeles' },
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060, type: 'port', timezone: 'America/New_York' },
  { city: 'Newark', state: 'NJ', lat: 40.7357, lng: -74.1724, type: 'port', timezone: 'America/New_York' },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698, type: 'port', timezone: 'America/Chicago' },
  { city: 'Savannah', state: 'GA', lat: 32.0809, lng: -81.0912, type: 'port', timezone: 'America/New_York' },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321, type: 'port', timezone: 'America/Los_Angeles' },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918, type: 'port', timezone: 'America/New_York' },
  { city: 'Charleston', state: 'SC', lat: 32.7765, lng: -79.9311, type: 'port', timezone: 'America/New_York' },
  { city: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712, type: 'port', timezone: 'America/Los_Angeles' },
  
  // MAJOR HUBS
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298, type: 'hub', timezone: 'America/Chicago' },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970, type: 'hub', timezone: 'America/Chicago' },
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880, type: 'hub', timezone: 'America/New_York' },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lng: -90.0490, type: 'hub', timezone: 'America/Chicago' },
  { city: 'Louisville', state: 'KY', lat: 38.2527, lng: -85.7585, type: 'hub', timezone: 'America/New_York' },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581, type: 'hub', timezone: 'America/Indiana/Indianapolis' },
  { city: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786, type: 'hub', timezone: 'America/Chicago' },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988, type: 'hub', timezone: 'America/New_York' },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740, type: 'hub', timezone: 'America/Phoenix' },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903, type: 'hub', timezone: 'America/Denver' },
  
  // MANUFACTURING CENTERS
  { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458, type: 'manufacturing', timezone: 'America/Detroit' },
  { city: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944, type: 'manufacturing', timezone: 'America/New_York' },
  { city: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065, type: 'manufacturing', timezone: 'America/Chicago' },
  { city: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959, type: 'manufacturing', timezone: 'America/New_York' },
  { city: 'Birmingham', state: 'AL', lat: 33.5207, lng: -86.8025, type: 'manufacturing', timezone: 'America/Chicago' },
  
  // BORDER CROSSINGS
  { city: 'Laredo', state: 'TX', lat: 27.5306, lng: -99.4803, type: 'border', timezone: 'America/Chicago' },
  { city: 'El Paso', state: 'TX', lat: 31.7619, lng: -106.4850, type: 'border', timezone: 'America/Denver' },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611, type: 'border', timezone: 'America/Los_Angeles' },
  { city: 'Buffalo', state: 'NY', lat: 42.8864, lng: -78.8784, type: 'border', timezone: 'America/New_York' },
  
  // RURAL/REMOTE
  { city: 'Billings', state: 'MT', lat: 45.7833, lng: -108.5007, type: 'rural', timezone: 'America/Denver' },
  { city: 'Fargo', state: 'ND', lat: 46.8772, lng: -96.7898, type: 'rural', timezone: 'America/Chicago' },
  { city: 'Cheyenne', state: 'WY', lat: 41.1400, lng: -104.8202, type: 'rural', timezone: 'America/Denver' },
  { city: 'Boise', state: 'ID', lat: 43.6150, lng: -116.2023, type: 'rural', timezone: 'America/Boise' },
  { city: 'Anchorage', state: 'AK', lat: 61.2181, lng: -149.9003, type: 'remote', timezone: 'America/Anchorage' },
  { city: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583, type: 'remote', timezone: 'Pacific/Honolulu' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TIME SCENARIOS - Various timing conditions
// ═══════════════════════════════════════════════════════════════════════════

export interface TimeScenario {
  name: string;
  day: string;
  time: string;
  traffic: string;
  weather?: string;
}

export const TIME_SCENARIOS: TimeScenario[] = [
  { name: 'weekday_morning', day: 'Tuesday', time: '09:00', traffic: 'moderate' },
  { name: 'weekday_afternoon', day: 'Wednesday', time: '14:00', traffic: 'moderate' },
  { name: 'weekday_evening', day: 'Thursday', time: '18:00', traffic: 'heavy' },
  { name: 'weekend_morning', day: 'Saturday', time: '08:00', traffic: 'light' },
  { name: 'late_night', day: 'Monday', time: '02:00', traffic: 'minimal' },
  { name: 'rush_hour', day: 'Friday', time: '17:30', traffic: 'severe' },
  { name: 'holiday', day: 'thanksgiving', time: '10:00', traffic: 'holiday_heavy' },
  { name: 'end_of_month', day: 'last_friday', time: '15:00', traffic: 'moderate' },
  { name: 'quarter_end', day: 'mar_31', time: '16:00', traffic: 'moderate' },
  { name: 'winter_storm', day: 'January', time: '12:00', traffic: 'severe', weather: 'blizzard' },
];

// ═══════════════════════════════════════════════════════════════════════════
// DATA GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

export function generateLoadNumber(): string {
  return `LD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

export function generateTransactionId(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function generateRandomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export function getRandomLocation(): USLocation {
  return US_LOCATIONS[Math.floor(Math.random() * US_LOCATIONS.length)];
}

export function getRandomDriver(): DriverPersona {
  return DRIVER_PERSONAS[Math.floor(Math.random() * DRIVER_PERSONAS.length)];
}

export function getRandomCarrier(): CarrierPersona {
  return CARRIER_PERSONAS[Math.floor(Math.random() * CARRIER_PERSONAS.length)];
}

export function getRandomBroker(): BrokerPersona {
  return BROKER_PERSONAS[Math.floor(Math.random() * BROKER_PERSONAS.length)];
}

export function getRandomShipper(): ShipperPersona {
  return SHIPPER_PERSONAS[Math.floor(Math.random() * SHIPPER_PERSONAS.length)];
}

export function getRandomLoad(): LoadScenario {
  return LOAD_SCENARIOS[Math.floor(Math.random() * LOAD_SCENARIOS.length)];
}

export function calculateDistance(loc1: USLocation, loc2: USLocation): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

export function generateRoute(): { origin: USLocation; destination: USLocation; distance: number } {
  const origin = getRandomLocation();
  let destination = getRandomLocation();
  while (destination.city === origin.city) {
    destination = getRandomLocation();
  }
  return {
    origin,
    destination,
    distance: calculateDistance(origin, destination)
  };
}
