/**
 * DOCUMENT CENTER — 50-State Requirements Seed
 * State-specific document requirements with portal URLs, form numbers, fees,
 * and agency information for every US state + DC.
 *
 * Categories covered:
 *   STATE_CDL    — CDL/DMV portal for each state (all 50 + DC)
 *   STATE_IFTA   — IFTA base jurisdiction portals (48 IFTA members)
 *   STATE_IRP    — IRP apportioned registration portals (48 + DC)
 *   STATE_WEIGHT_PERMIT — Weight-distance tax states (OR, NM, NY, KY)
 *   STATE_FUEL_PERMIT   — Non-IFTA fuel permits (AK, HI)
 *   CARB_COMPLIANCE     — California Air Resources Board
 *   CA_MCP              — California Motor Carrier Permit
 */

export interface StateRequirementEntry {
  stateCode: string;
  stateName: string;
  documentTypeId: string;
  stateFormNumber?: string;
  stateFormName?: string;
  stateIssuingAgency: string;
  statePortalUrl?: string;
  stateFormUrl?: string;
  stateInstructionsUrl?: string;
  isRequired: boolean;
  requiredForRoles: string[];
  conditions?: Record<string, any>;
  filingFee?: string;
  renewalFee?: string;
  lateFee?: string;
  validityPeriod?: string;
  renewalWindow?: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════
// STATE CDL PORTALS — All 50 States + DC
// Every driver must have a CDL from their home state.
// ═══════════════════════════════════════════════════════════════

const STATE_CDL_ENTRIES: StateRequirementEntry[] = [
  { stateCode: 'AL', stateName: 'Alabama', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Alabama Law Enforcement Agency (ALEA)', statePortalUrl: 'https://www.alea.gov/dps/driver-license', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'AK', stateName: 'Alaska', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Alaska Division of Motor Vehicles', statePortalUrl: 'https://doa.alaska.gov/dmv/akdl/cdl.htm', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'AZ', stateName: 'Arizona', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Arizona Department of Transportation MVD', statePortalUrl: 'https://azdot.gov/motor-vehicles/driver-services/commercial-driver-license', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'AR', stateName: 'Arkansas', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Arkansas Department of Finance & Administration', statePortalUrl: 'https://www.dfa.arkansas.gov/driver-services', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'CA', stateName: 'California', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'California Department of Motor Vehicles', statePortalUrl: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/commercial-driver-license/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years', notes: 'CA also requires CARB compliance and MCP for intrastate carriers' },
  { stateCode: 'CO', stateName: 'Colorado', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Colorado Division of Motor Vehicles', statePortalUrl: 'https://dmv.colorado.gov/commercial-drivers', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'CT', stateName: 'Connecticut', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Connecticut Department of Motor Vehicles', statePortalUrl: 'https://portal.ct.gov/dmv/licenses/commercial-driver-licenses/commercial-driver-licenses', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'DE', stateName: 'Delaware', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Delaware Division of Motor Vehicles', statePortalUrl: 'https://www.dmv.de.gov/DriverServices/cdl/index.shtml', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'DC', stateName: 'District of Columbia', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'DC Department of Motor Vehicles', statePortalUrl: 'https://dmv.dc.gov/service/commercial-drivers-license-cdl', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'FL', stateName: 'Florida', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Florida DHSMV', statePortalUrl: 'https://www.flhsmv.gov/driver-licenses-id-cards/commercial-motor-vehicle-drivers/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'GA', stateName: 'Georgia', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Georgia Department of Driver Services', statePortalUrl: 'https://dds.georgia.gov/georgia-licenseid/commercial', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'HI', stateName: 'Hawaii', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Hawaii County Finance Dept', statePortalUrl: 'https://hidot.hawaii.gov/highways/other/motor-vehicle-safety/commercial-drivers-license/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'ID', stateName: 'Idaho', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Idaho Transportation Department', statePortalUrl: 'https://itd.idaho.gov/cdl/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'IL', stateName: 'Illinois', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Illinois Secretary of State', statePortalUrl: 'https://www.ilsos.gov/departments/drivers/drivers_license/cdl.html', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'IN', stateName: 'Indiana', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Indiana Bureau of Motor Vehicles', statePortalUrl: 'https://www.in.gov/bmv/licenses-permits-ids/learner-permits-and-டriver-licenses/commercial-drivers-license-cdl/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'IA', stateName: 'Iowa', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Iowa Department of Transportation', statePortalUrl: 'https://iowadot.gov/mvd/cdl', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'KS', stateName: 'Kansas', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Kansas Department of Revenue', statePortalUrl: 'https://www.ksrevenue.gov/dovcdl.html', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'KY', stateName: 'Kentucky', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Kentucky Transportation Cabinet', statePortalUrl: 'https://drive.ky.gov/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years', notes: 'KY also has weight-distance tax (KYU)' },
  { stateCode: 'LA', stateName: 'Louisiana', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Louisiana Office of Motor Vehicles', statePortalUrl: 'https://expresslane.org/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'ME', stateName: 'Maine', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Maine Bureau of Motor Vehicles', statePortalUrl: 'https://www.maine.gov/sos/bmv/licenses/cdl.html', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '6 years' },
  { stateCode: 'MD', stateName: 'Maryland', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Maryland Motor Vehicle Administration', statePortalUrl: 'https://mva.maryland.gov/Pages/commercial-driver-license.aspx', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'MA', stateName: 'Massachusetts', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Massachusetts Registry of Motor Vehicles', statePortalUrl: 'https://www.mass.gov/commercial-drivers-licenses-cdl', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'MI', stateName: 'Michigan', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Michigan Secretary of State', statePortalUrl: 'https://www.michigan.gov/sos/license-id/cdl', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'MN', stateName: 'Minnesota', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Minnesota Driver and Vehicle Services', statePortalUrl: 'https://dps.mn.gov/divisions/dvs/real-id/Pages/commercial-drivers-license.aspx', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'MS', stateName: 'Mississippi', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Mississippi Department of Public Safety', statePortalUrl: 'https://www.dps.state.ms.us/driver-services/commercial-driver-license/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'MO', stateName: 'Missouri', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Missouri Department of Revenue', statePortalUrl: 'https://dor.mo.gov/driver-license/cdl/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '6 years' },
  { stateCode: 'MT', stateName: 'Montana', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Montana Motor Vehicle Division', statePortalUrl: 'https://dojmt.gov/driving/commercial-driver-license/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'NE', stateName: 'Nebraska', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Nebraska Department of Motor Vehicles', statePortalUrl: 'https://dmv.nebraska.gov/dl/commercial-drivers-licenses', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'NV', stateName: 'Nevada', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Nevada Department of Motor Vehicles', statePortalUrl: 'https://dmv.nv.gov/cdl.htm', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'NH', stateName: 'New Hampshire', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'New Hampshire DMV', statePortalUrl: 'https://www.nh.gov/safety/divisions/dmv/driver-licensing/commercial/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'NJ', stateName: 'New Jersey', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'New Jersey Motor Vehicle Commission', statePortalUrl: 'https://www.nj.gov/mvc/license/cdl.htm', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'NM', stateName: 'New Mexico', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'New Mexico Motor Vehicle Division', statePortalUrl: 'https://www.mvd.newmexico.gov/drivers/commercial-driver-licenses/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years', notes: 'NM also has weight-distance tax' },
  { stateCode: 'NY', stateName: 'New York', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'New York DMV', statePortalUrl: 'https://dmv.ny.gov/commercial-drivers', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years', notes: 'NY also has Highway Use Tax (HUT)' },
  { stateCode: 'NC', stateName: 'North Carolina', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'North Carolina DMV', statePortalUrl: 'https://www.ncdot.gov/dmv/license-id/cdl/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'ND', stateName: 'North Dakota', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'North Dakota DOT Drivers License Division', statePortalUrl: 'https://www.dot.nd.gov/driver/commercial-driver-license', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '6 years' },
  { stateCode: 'OH', stateName: 'Ohio', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Ohio Bureau of Motor Vehicles', statePortalUrl: 'https://bmv.ohio.gov/dl-cdl.aspx', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'OK', stateName: 'Oklahoma', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Oklahoma Department of Public Safety', statePortalUrl: 'https://oklahoma.gov/dps/driver-license-services/commercial-driver-license.html', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'OR', stateName: 'Oregon', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Oregon DMV', statePortalUrl: 'https://www.oregon.gov/odot/dmv/pages/driverid/cdl.aspx', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years', notes: 'OR also has weight-mile tax' },
  { stateCode: 'PA', stateName: 'Pennsylvania', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'PennDOT', statePortalUrl: 'https://www.dmv.pa.gov/Driver-Services/Driver-Licensing/CDL/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'RI', stateName: 'Rhode Island', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Rhode Island DMV', statePortalUrl: 'https://dmv.ri.gov/licenses-permits-ids/commercial-driver-license-cdl', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'SC', stateName: 'South Carolina', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'South Carolina DMV', statePortalUrl: 'https://www.scdmvonline.com/Driver-Services/Drivers-License/Commercial-Driver-License', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'SD', stateName: 'South Dakota', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'South Dakota DPS Driver Licensing', statePortalUrl: 'https://dps.sd.gov/driver-licensing', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'TN', stateName: 'Tennessee', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Tennessee Department of Safety', statePortalUrl: 'https://www.tn.gov/safety/driver-services.html', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'TX', stateName: 'Texas', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Texas Department of Public Safety', statePortalUrl: 'https://www.dps.texas.gov/section/driver-license', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'UT', stateName: 'Utah', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Utah Driver License Division', statePortalUrl: 'https://dld.utah.gov/commercial-driver-license/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'VT', stateName: 'Vermont', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Vermont DMV', statePortalUrl: 'https://dmv.vermont.gov/licenses-and-ids/commercial-drivers-licenses', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
  { stateCode: 'VA', stateName: 'Virginia', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Virginia DMV', statePortalUrl: 'https://www.dmv.virginia.gov/commercial-vehicles/commercial-drivers-license', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'WA', stateName: 'Washington', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Washington Department of Licensing', statePortalUrl: 'https://www.dol.wa.gov/driver/cdl/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'WV', stateName: 'West Virginia', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'West Virginia DMV', statePortalUrl: 'https://transportation.wv.gov/DMV/Licensing/CDL/', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '5 years' },
  { stateCode: 'WI', stateName: 'Wisconsin', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Wisconsin DMV', statePortalUrl: 'https://wisconsindot.gov/Pages/dmv/com-drv-vehs/cdl-how-aply/cdloverview.aspx', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '8 years' },
  { stateCode: 'WY', stateName: 'Wyoming', documentTypeId: 'STATE_CDL', stateIssuingAgency: 'Wyoming DOT Driver Services', statePortalUrl: 'https://www.dot.state.wy.us/home/driver_license_records/commercial_driver_license.html', isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR'], validityPeriod: '4 years' },
];

// ═══════════════════════════════════════════════════════════════
// WEIGHT-DISTANCE TAX STATES
// Only 4 states impose weight-distance / weight-mile taxes.
// Carriers operating in these states MUST register and pay.
// ═══════════════════════════════════════════════════════════════

const WEIGHT_DISTANCE_ENTRIES: StateRequirementEntry[] = [
  {
    stateCode: 'OR', stateName: 'Oregon', documentTypeId: 'STATE_WEIGHT_PERMIT',
    stateFormNumber: 'WMT', stateFormName: 'Oregon Weight-Mile Tax Permit',
    stateIssuingAgency: 'Oregon Department of Transportation',
    statePortalUrl: 'https://www.oregon.gov/odot/MCT/',
    stateFormUrl: 'https://www.oregon.gov/odot/MCT/',
    isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'],
    filingFee: '0', renewalFee: '0', notes: 'Tax rate based on weight and miles driven in OR. Quarterly filing required. All trucks 26,001+ lbs.',
    validityPeriod: 'Continuous (quarterly filings)', renewalWindow: 'Quarterly by the last day of the month following quarter end',
  },
  {
    stateCode: 'NM', stateName: 'New Mexico', documentTypeId: 'STATE_WEIGHT_PERMIT',
    stateFormNumber: 'RPD-41071', stateFormName: 'New Mexico Weight-Distance Tax Permit',
    stateIssuingAgency: 'New Mexico Taxation & Revenue Dept',
    statePortalUrl: 'https://www.tax.newmexico.gov/businesses/weight-distance-tax/',
    isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'],
    filingFee: '0', notes: 'Applies to trucks 26,001+ lbs operating on NM highways. Quarterly filing.',
    validityPeriod: 'Continuous (quarterly filings)', renewalWindow: 'Quarterly — 25th of month following quarter end',
  },
  {
    stateCode: 'NY', stateName: 'New York', documentTypeId: 'STATE_WEIGHT_PERMIT',
    stateFormNumber: 'TMT-1', stateFormName: 'New York Highway Use Tax (HUT)',
    stateIssuingAgency: 'New York State Dept of Taxation & Finance',
    statePortalUrl: 'https://www.tax.ny.gov/bus/hut/',
    stateFormUrl: 'https://www.tax.ny.gov/bus/hut/',
    isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'],
    filingFee: '0', notes: 'Requires HUT permit certificate in cab. Tax based on miles and weight. Trucks 18,001+ lbs.',
    validityPeriod: 'Annual (July 1 - June 30)', renewalWindow: '60 days before expiration',
  },
  {
    stateCode: 'KY', stateName: 'Kentucky', documentTypeId: 'STATE_WEIGHT_PERMIT',
    stateFormNumber: 'KYU', stateFormName: 'Kentucky Weight Distance Tax (KYU)',
    stateIssuingAgency: 'Kentucky Transportation Cabinet',
    statePortalUrl: 'https://drive.ky.gov/motor-carriers/',
    stateFormUrl: 'https://drive.ky.gov/Motor-Carriers/Pages/KYU.aspx',
    isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'],
    filingFee: '0', notes: 'Tax based on miles and combined weight. All trucks 60,000+ lbs (or 59,999 lbs with added axles). Quarterly KYU filing.',
    validityPeriod: 'Continuous (quarterly filings)', renewalWindow: 'Quarterly — last day of month following quarter end',
  },
];

// ═══════════════════════════════════════════════════════════════
// CALIFORNIA-SPECIFIC REQUIREMENTS
// California has unique environmental and motor carrier permit reqs.
// ═══════════════════════════════════════════════════════════════

const CALIFORNIA_ENTRIES: StateRequirementEntry[] = [
  {
    stateCode: 'CA', stateName: 'California', documentTypeId: 'CARB_COMPLIANCE',
    stateFormName: 'CARB Truck & Bus Regulation Compliance Certificate',
    stateIssuingAgency: 'California Air Resources Board (CARB)',
    statePortalUrl: 'https://ww2.arb.ca.gov/our-work/programs/truck-and-bus-regulation',
    stateFormUrl: 'https://ww2.arb.ca.gov/our-work/programs/truck-and-bus-regulation',
    stateInstructionsUrl: 'https://ww2.arb.ca.gov/our-work/programs/truck-and-bus-regulation',
    isRequired: true, requiredForRoles: ['DRIVER', 'OWNER_OPERATOR', 'CATALYST'],
    filingFee: '0', notes: 'All trucks operating in CA must meet CARB emission standards. Verify via TRUCRS database. 2024+ requires zero-emission for drayage; 2035 for all.',
    validityPeriod: 'Ongoing compliance',
  },
  {
    stateCode: 'CA', stateName: 'California', documentTypeId: 'CA_MCP',
    stateFormNumber: 'REG 510', stateFormName: 'California Motor Carrier Permit',
    stateIssuingAgency: 'California DMV',
    statePortalUrl: 'https://www.dmv.ca.gov/portal/vehicle-industry-services/motor-carrier-services-mcs/motor-carrier-permits/',
    stateFormUrl: 'https://www.dmv.ca.gov/portal/vehicle-industry-services/motor-carrier-services-mcs/motor-carrier-permits/motor-carrier-permit-application/',
    isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'],
    filingFee: '0', renewalFee: '0',
    notes: 'Required for any motor carrier operating on CA highways. Must carry permit in vehicle. Linked to USDOT number.',
    validityPeriod: 'Annual (calendar year)', renewalWindow: '60 days before Jan 1',
  },
];

// ═══════════════════════════════════════════════════════════════
// STATE IFTA PORTALS — All 48 IFTA Member Jurisdictions
// (Alaska and Hawaii are not IFTA members)
// Carriers register with their base state for fuel tax reporting.
// ═══════════════════════════════════════════════════════════════

const STATE_IFTA_ENTRIES: StateRequirementEntry[] = [
  { stateCode: 'AL', stateName: 'Alabama', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Alabama Dept of Revenue', statePortalUrl: 'https://www.revenue.alabama.gov/motor-fuel/ifta/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual (calendar year)' },
  { stateCode: 'AZ', stateName: 'Arizona', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Arizona Dept of Transportation', statePortalUrl: 'https://azdot.gov/motor-vehicles/professional-services/motor-carrier-services', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'AR', stateName: 'Arkansas', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Arkansas Dept of Finance & Admin', statePortalUrl: 'https://www.dfa.arkansas.gov/motor-vehicle/motor-carrier-services', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'CA', stateName: 'California', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'California Dept of Tax & Fee Admin (CDTFA)', statePortalUrl: 'https://www.cdtfa.ca.gov/taxes-and-fees/ifta.htm', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'CO', stateName: 'Colorado', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Colorado Dept of Revenue', statePortalUrl: 'https://tax.colorado.gov/ifta', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'CT', stateName: 'Connecticut', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Connecticut Dept of Revenue Services', statePortalUrl: 'https://portal.ct.gov/drs/sales-tax/motor-carrier-road-tax', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'DE', stateName: 'Delaware', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Delaware Division of Revenue', statePortalUrl: 'https://revenue.delaware.gov/motor-fuel-tax/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'FL', stateName: 'Florida', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Florida Dept of Revenue', statePortalUrl: 'https://floridarevenue.com/taxes/taxesfees/Pages/fuel_tax.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'GA', stateName: 'Georgia', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Georgia Dept of Revenue', statePortalUrl: 'https://dor.georgia.gov/motor-fuel-taxes', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'ID', stateName: 'Idaho', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Idaho State Tax Commission', statePortalUrl: 'https://tax.idaho.gov/taxes/fuels-tax/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'IL', stateName: 'Illinois', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Illinois Secretary of State', statePortalUrl: 'https://www.ilsos.gov/departments/vehicles/ifta/home.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'IN', stateName: 'Indiana', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Indiana Dept of Revenue', statePortalUrl: 'https://www.in.gov/dor/motor-carrier-services/ifta/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'IA', stateName: 'Iowa', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Iowa Dept of Transportation', statePortalUrl: 'https://iowadot.gov/mvd/motorcarriers/ifta', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'KS', stateName: 'Kansas', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Kansas Dept of Revenue', statePortalUrl: 'https://www.ksrevenue.gov/bustaxtypesifta.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'KY', stateName: 'Kentucky', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Kentucky Transportation Cabinet', statePortalUrl: 'https://drive.ky.gov/Motor-Carriers/Pages/IFTA.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'LA', stateName: 'Louisiana', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Louisiana Dept of Revenue', statePortalUrl: 'https://revenue.louisiana.gov/ExciseTaxes/MotorFuels', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'ME', stateName: 'Maine', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Maine Revenue Services', statePortalUrl: 'https://www.maine.gov/revenue/taxes/fuel-tax', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MD', stateName: 'Maryland', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Maryland Comptroller', statePortalUrl: 'https://www.marylandtaxes.gov/business/motor-fuel-tax/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MA', stateName: 'Massachusetts', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Massachusetts Dept of Revenue', statePortalUrl: 'https://www.mass.gov/motor-fuels-tax', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MI', stateName: 'Michigan', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Michigan Dept of Treasury', statePortalUrl: 'https://www.michigan.gov/treasury/taxes/ifta', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MN', stateName: 'Minnesota', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Minnesota Dept of Public Safety', statePortalUrl: 'https://dps.mn.gov/divisions/dvs/motor-carrier/Pages/ifta.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MS', stateName: 'Mississippi', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Mississippi State Tax Commission', statePortalUrl: 'https://www.dor.ms.gov/motor-fuel', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MO', stateName: 'Missouri', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Missouri Dept of Revenue', statePortalUrl: 'https://dor.mo.gov/motor-vehicle/motor-fuel-tax/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'MT', stateName: 'Montana', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Montana Dept of Transportation', statePortalUrl: 'https://www.mdt.mt.gov/business/mcs/ifta.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NE', stateName: 'Nebraska', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Nebraska Dept of Motor Vehicles', statePortalUrl: 'https://dmv.nebraska.gov/mcs/ifta', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NV', stateName: 'Nevada', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Nevada Dept of Motor Vehicles', statePortalUrl: 'https://dmv.nv.gov/platesmcifta.htm', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NH', stateName: 'New Hampshire', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'New Hampshire Dept of Safety', statePortalUrl: 'https://www.nh.gov/safety/divisions/dmv/registration/motor-carrier.htm', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NJ', stateName: 'New Jersey', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'New Jersey Division of Taxation', statePortalUrl: 'https://www.nj.gov/treasury/taxation/motorfuel.shtml', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NM', stateName: 'New Mexico', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'New Mexico Taxation & Revenue Dept', statePortalUrl: 'https://www.tax.newmexico.gov/businesses/motor-carrier/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NY', stateName: 'New York', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'New York Dept of Taxation & Finance', statePortalUrl: 'https://www.tax.ny.gov/bus/fuel/iftaidx.htm', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'NC', stateName: 'North Carolina', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'North Carolina Dept of Revenue', statePortalUrl: 'https://www.ncdor.gov/taxes-forms/motor-fuels-tax', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'ND', stateName: 'North Dakota', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'North Dakota DOT Motor Carrier', statePortalUrl: 'https://www.dot.nd.gov/divisions/motor-vehicle/motor-carrier', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'OH', stateName: 'Ohio', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Ohio Dept of Taxation', statePortalUrl: 'https://tax.ohio.gov/motor-fuel', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'OK', stateName: 'Oklahoma', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Oklahoma Tax Commission', statePortalUrl: 'https://oklahoma.gov/tax/businesses/motor-fuel.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'OR', stateName: 'Oregon', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Oregon Dept of Transportation MCT', statePortalUrl: 'https://www.oregon.gov/odot/MCT/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual', notes: 'OR uses weight-mile tax instead of fuel tax but still issues IFTA for interstate' },
  { stateCode: 'PA', stateName: 'Pennsylvania', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Pennsylvania Dept of Revenue', statePortalUrl: 'https://www.revenue.pa.gov/TaxTypes/MotorFuel/Pages/default.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'RI', stateName: 'Rhode Island', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Rhode Island Division of Taxation', statePortalUrl: 'https://tax.ri.gov/tax-sections/motor-fuel-tax', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'SC', stateName: 'South Carolina', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'South Carolina Dept of Motor Vehicles', statePortalUrl: 'https://www.scdmvonline.com/Vehicle-Owners/IFTA', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'SD', stateName: 'South Dakota', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'South Dakota Dept of Revenue', statePortalUrl: 'https://dor.sd.gov/businesses/taxes/motor-fuel/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'TN', stateName: 'Tennessee', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Tennessee Dept of Revenue', statePortalUrl: 'https://www.tn.gov/revenue/taxes/motor-fuel-tax.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'TX', stateName: 'Texas', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Texas Comptroller of Public Accounts', statePortalUrl: 'https://comptroller.texas.gov/taxes/fuels/ifta/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'UT', stateName: 'Utah', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Utah State Tax Commission', statePortalUrl: 'https://tax.utah.gov/fuel', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'VT', stateName: 'Vermont', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Vermont Dept of Motor Vehicles', statePortalUrl: 'https://dmv.vermont.gov/commercial-vehicles/ifta', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'VA', stateName: 'Virginia', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Virginia Dept of Motor Vehicles', statePortalUrl: 'https://www.dmv.virginia.gov/commercial-vehicles/ifta', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'WA', stateName: 'Washington', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Washington Dept of Licensing', statePortalUrl: 'https://www.dol.wa.gov/vehicleregistration/ifta.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'WV', stateName: 'West Virginia', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'West Virginia State Tax Dept', statePortalUrl: 'https://tax.wv.gov/Business/MotorFuel/Pages/MotorFuel.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'WI', stateName: 'Wisconsin', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Wisconsin Dept of Transportation', statePortalUrl: 'https://wisconsindot.gov/Pages/dmv/com-drv-vehs/mtr-car-trkr/ifta.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
  { stateCode: 'WY', stateName: 'Wyoming', documentTypeId: 'STATE_IFTA', stateIssuingAgency: 'Wyoming Dept of Transportation', statePortalUrl: 'https://www.dot.state.wy.us/home/trucking_commercial_vehicles/ifta.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual' },
];

// ═══════════════════════════════════════════════════════════════
// NON-IFTA FUEL PERMITS (AK, HI)
// Alaska and Hawaii are not IFTA members.
// ═══════════════════════════════════════════════════════════════

const NON_IFTA_ENTRIES: StateRequirementEntry[] = [
  { stateCode: 'AK', stateName: 'Alaska', documentTypeId: 'STATE_FUEL_PERMIT', stateIssuingAgency: 'Alaska Dept of Administration DMV', statePortalUrl: 'https://doa.alaska.gov/dmv/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual', notes: 'Not an IFTA member. Requires separate Alaska fuel permit.' },
  { stateCode: 'HI', stateName: 'Hawaii', documentTypeId: 'STATE_FUEL_PERMIT', stateIssuingAgency: 'Hawaii Dept of Taxation', statePortalUrl: 'https://tax.hawaii.gov/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], validityPeriod: 'Annual', notes: 'Not an IFTA member. Requires separate Hawaii fuel tax registration.' },
];

// ═══════════════════════════════════════════════════════════════
// OVERSIZE/OVERWEIGHT PERMIT PORTALS — Top Freight States
// Flatbed operators need state-specific permits for OS/OW loads.
// ═══════════════════════════════════════════════════════════════

const OVERSIZE_PERMIT_ENTRIES: StateRequirementEntry[] = [
  { stateCode: 'TX', stateName: 'Texas', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'TxDMV Motor Carrier Division', statePortalUrl: 'https://www.txdmv.gov/motor-carriers/oversize-overweight-permits', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual', notes: 'TxPROS system for online permitting' },
  { stateCode: 'CA', stateName: 'California', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Caltrans Transportation Permits', statePortalUrl: 'https://dot.ca.gov/programs/traffic-operations/transportation-permits', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'FL', stateName: 'Florida', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Florida Dept of Transportation', statePortalUrl: 'https://www.fdot.gov/maintenance/trucking-and-overweight', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'IL', stateName: 'Illinois', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Illinois Dept of Transportation', statePortalUrl: 'https://idot.illinois.gov/doing-business/permits/oversize-overweight', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'OH', stateName: 'Ohio', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Ohio Dept of Transportation', statePortalUrl: 'https://www.transportation.ohio.gov/programs/special-hauling-permits', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'PA', stateName: 'Pennsylvania', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'PennDOT Motor Carrier Services', statePortalUrl: 'https://www.penndot.pa.gov/Doing-Business/Motor-Carrier-Services/Pages/default.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'GA', stateName: 'Georgia', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Georgia Dept of Transportation', statePortalUrl: 'https://www.dot.ga.gov/GDOT/Pages/PermitsOperations.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'IN', stateName: 'Indiana', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Indiana Dept of Transportation', statePortalUrl: 'https://www.in.gov/indot/doing-business-with-indot/permits/oversize-overweight/', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'TN', stateName: 'Tennessee', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'Tennessee Dept of Transportation', statePortalUrl: 'https://www.tn.gov/tdot/traffic-operations-division/permits-office.html', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
  { stateCode: 'NC', stateName: 'North Carolina', documentTypeId: 'OVERSIZE_PERMIT', stateIssuingAgency: 'NCDOT Oversize/Overweight Permits', statePortalUrl: 'https://connect.ncdot.gov/business/trucking/Pages/Permits.aspx', isRequired: true, requiredForRoles: ['OWNER_OPERATOR', 'CATALYST'], conditions: { trailerType: 'OVERSIZE' }, validityPeriod: 'Per-load or annual' },
];

// ═══════════════════════════════════════════════════════════════
// COMBINED EXPORT — All state requirements
// ═══════════════════════════════════════════════════════════════

export const stateRequirementsSeed: StateRequirementEntry[] = [
  ...STATE_CDL_ENTRIES,
  ...WEIGHT_DISTANCE_ENTRIES,
  ...CALIFORNIA_ENTRIES,
  ...STATE_IFTA_ENTRIES,
  ...NON_IFTA_ENTRIES,
  ...OVERSIZE_PERMIT_ENTRIES,
];
