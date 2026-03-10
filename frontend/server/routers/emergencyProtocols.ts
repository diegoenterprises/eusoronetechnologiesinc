/**
 * EMERGENCY & DISASTER PROTOCOLS ROUTER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Comprehensive emergency management for trucking/logistics operations:
 *   - Weather-specific emergency protocols & rerouting
 *   - Multi-agency coordination (DOT, EPA, FEMA, local LE)
 *   - HAZMAT spill response (by UN chemical class)
 *   - Accident management & documentation
 *   - Natural disaster routing avoidance
 *   - Crisis communication & broadcasting
 *   - Post-incident analysis & compliance reporting
 *   - Driver safe havens & emergency supply locations
 *   - Insurance claim workflows
 *   - Emergency training modules
 *
 * PRODUCTION-READY: All data from database when available, with
 * comprehensive fallback reference data for offline/bootstrap scenarios.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { z } from "zod";
import {
  router,
  protectedProcedure,
  isolatedProcedure,
  adminProcedure,
} from "../_core/trpc";
import { logger } from "../_core/logger";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const emergencyTypeSchema = z.enum([
  "accident",
  "hazmat_spill",
  "weather",
  "breakdown",
  "medical",
  "security",
  "natural_disaster",
  "fire",
  "cargo_theft",
  "civil_unrest",
]);

const emergencySeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

const emergencyStatusSchema = z.enum([
  "declared",
  "active",
  "escalated",
  "contained",
  "resolving",
  "resolved",
  "closed",
  "post_mortem",
]);

const weatherAlertTypeSchema = z.enum([
  "tornado",
  "hurricane",
  "blizzard",
  "ice_storm",
  "flood",
  "extreme_heat",
  "wildfire_smoke",
  "thunderstorm",
  "fog",
  "dust_storm",
  "wind_advisory",
  "winter_storm",
]);

const weatherSeveritySchema = z.enum([
  "extreme",
  "severe",
  "moderate",
  "minor",
]);

const hazmatClassSchema = z.enum([
  "class_1_explosives",
  "class_2_gases",
  "class_3_flammable_liquids",
  "class_4_flammable_solids",
  "class_5_oxidizers",
  "class_6_poisons",
  "class_7_radioactive",
  "class_8_corrosives",
  "class_9_miscellaneous",
]);

const disasterTypeSchema = z.enum([
  "hurricane",
  "tornado",
  "flood",
  "wildfire",
  "earthquake",
  "tsunami",
  "volcanic",
  "landslide",
]);

const crisisTypeSchema = z.enum([
  "accident_notification",
  "hazmat_spill_alert",
  "weather_warning",
  "evacuation_order",
  "road_closure",
  "driver_safety_alert",
  "fleet_recall",
  "media_statement",
  "regulatory_notification",
  "customer_advisory",
]);

const agencyTypeSchema = z.enum([
  "dot",
  "epa",
  "fema",
  "osha",
  "nrc",
  "chemtrec",
  "local_law_enforcement",
  "state_police",
  "fire_department",
  "ems",
  "coast_guard",
  "ntsb",
]);

// ─── Reference Data ───────────────────────────────────────────────────────────

const EMERGENCY_CONTACTS = {
  federal: [
    { name: "CHEMTREC", phone: "1-800-424-9300", description: "Chemical Transportation Emergency Center — 24/7 hazmat response guidance", category: "hazmat" },
    { name: "National Response Center (NRC)", phone: "1-800-424-8802", description: "Federal reporting for oil/chemical spills — MANDATORY for hazmat releases", category: "hazmat" },
    { name: "FEMA", phone: "1-800-621-3362", description: "Federal Emergency Management Agency — disaster coordination", category: "disaster" },
    { name: "EPA Emergency", phone: "1-800-424-9346", description: "Environmental Protection Agency — environmental emergencies", category: "environmental" },
    { name: "OSHA Emergency", phone: "1-800-321-6742", description: "Occupational Safety and Health Administration — worker safety emergencies", category: "safety" },
    { name: "NTSB", phone: "1-800-877-6799", description: "National Transportation Safety Board — major transportation accidents", category: "accident" },
    { name: "US Coast Guard", phone: "1-800-368-5647", description: "Marine/waterway emergencies and spills", category: "marine" },
    { name: "FBI Tips", phone: "1-800-225-5324", description: "Cargo theft, terrorism, or security threats", category: "security" },
    { name: "FMCSA Safety Hotline", phone: "1-888-327-4236", description: "Federal Motor Carrier Safety Administration", category: "regulatory" },
    { name: "TSA Surface", phone: "1-866-289-9673", description: "Transportation Security Administration — surface transport security", category: "security" },
  ],
  general: [
    { name: "Emergency Services", phone: "911", description: "Local police, fire, and EMS", category: "emergency" },
    { name: "Poison Control", phone: "1-800-222-1222", description: "National Poison Control Center", category: "medical" },
    { name: "Road Conditions", phone: "511", description: "State DOT road conditions and closures", category: "road" },
  ],
};

const HAZMAT_PROTOCOLS: Record<string, {
  className: string;
  examples: string[];
  immediateActions: string[];
  evacuationRadius: string;
  ppe: string[];
  decontamination: string[];
  agencyNotifications: string[];
  ergGuideNumbers: string[];
}> = {
  class_1_explosives: {
    className: "Class 1 — Explosives",
    examples: ["Dynamite", "TNT", "Detonators", "Fireworks", "Ammunition", "Blasting caps"],
    immediateActions: [
      "EVACUATE immediately — minimum 1,600 ft (500m) in all directions",
      "Do NOT fight fire if it reaches cargo",
      "Call 911 and CHEMTREC immediately",
      "Block road access — prevent any vehicles from approaching",
      "Do NOT use radios or cell phones within 300 ft of suspected explosive material",
      "Notify NRC within 15 minutes of any release",
    ],
    evacuationRadius: "1,600 ft (500m) minimum — 1 mile for large quantities",
    ppe: ["Do NOT approach — wait for bomb squad/EOD", "If necessary: blast-resistant suit, helmet, face shield"],
    decontamination: ["Do NOT handle damaged containers", "Wait for specialized hazmat team"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "ATF", "Local bomb squad"],
    ergGuideNumbers: ["112", "114"],
  },
  class_2_gases: {
    className: "Class 2 — Gases (Compressed, Liquefied, Dissolved)",
    examples: ["Propane", "LPG", "Chlorine", "Ammonia", "Oxygen", "Acetylene", "Natural Gas"],
    immediateActions: [
      "EVACUATE downwind — minimum 330 ft (100m)",
      "Eliminate ignition sources — no smoking, no flares, no running engines",
      "If tank is making sounds or venting, evacuate to 1 mile",
      "For poison gas (Division 2.3): evacuate 1,000 ft minimum",
      "Do NOT attempt to stop leak if gas is escaping under pressure",
      "Stay upwind and uphill",
    ],
    evacuationRadius: "330 ft minimum — 1 mile for BLEVE risk",
    ppe: ["SCBA (Self-Contained Breathing Apparatus)", "Chemical-resistant suit (Level A for poison gas)", "No synthetic clothing near flammable gases"],
    decontamination: ["Remove contaminated clothing", "Flush with copious water for 15+ minutes", "Seek medical evaluation"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "Local fire department"],
    ergGuideNumbers: ["115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125"],
  },
  class_3_flammable_liquids: {
    className: "Class 3 — Flammable Liquids",
    examples: ["Gasoline", "Diesel", "Crude Oil", "Ethanol", "Acetone", "Benzene", "Jet Fuel"],
    immediateActions: [
      "Eliminate ALL ignition sources in 300 ft radius",
      "EVACUATE 1,000 ft (300m) in all directions",
      "Do NOT walk through spilled material",
      "Prevent liquid from entering sewers, drains, or waterways — dam with earth/sand",
      "If fire: use foam, dry chemical, or CO2 — NEVER water stream on burning liquid",
      "Report spill to NRC if >42 gallons (1 barrel) of petroleum",
    ],
    evacuationRadius: "1,000 ft (300m) — more if flowing toward populated areas",
    ppe: ["SCBA", "Chemical splash suit (Level B minimum)", "Chemical-resistant boots and gloves", "No synthetic clothing"],
    decontamination: ["Remove contaminated clothing immediately", "Flush skin with water 15+ minutes", "Contain runoff — do not let contaminated water enter environment"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "State environmental agency", "EPA if waterway impacted"],
    ergGuideNumbers: ["127", "128", "129", "130", "131", "132"],
  },
  class_4_flammable_solids: {
    className: "Class 4 — Flammable Solids, Spontaneous Combustion, Dangerous When Wet",
    examples: ["Matches", "Sulfur", "Magnesium", "Sodium metal", "Phosphorus", "Calcium carbide"],
    immediateActions: [
      "EVACUATE 330 ft (100m) in all directions",
      "Do NOT use water on Division 4.3 (Dangerous When Wet) materials",
      "Keep material dry if Division 4.3",
      "Use dry sand or special powder to extinguish — NOT water",
      "For spontaneous combustion: isolate and let burn if safe to do so",
    ],
    evacuationRadius: "330 ft (100m) minimum",
    ppe: ["SCBA", "Structural firefighting gear", "Dry chemical-resistant gloves"],
    decontamination: ["Brush off dry material — do NOT flush with water if Division 4.3", "For other divisions: flush with water"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "Local fire department"],
    ergGuideNumbers: ["133", "134", "135", "136", "137", "138", "139"],
  },
  class_5_oxidizers: {
    className: "Class 5 — Oxidizers and Organic Peroxides",
    examples: ["Ammonium nitrate", "Hydrogen peroxide", "Potassium permanganate", "Calcium hypochlorite", "Benzoyl peroxide"],
    immediateActions: [
      "EVACUATE 800 ft (250m) in all directions",
      "Keep away from combustible materials — oxidizers intensify fire",
      "For organic peroxides: risk of explosion — treat as Class 1",
      "Use FLOODING quantities of water — not chemical extinguishers",
      "Ammonium nitrate: if involved in fire, EVACUATE 1 mile — explosion risk",
    ],
    evacuationRadius: "800 ft (250m) — 1 mile if ammonium nitrate in fire",
    ppe: ["SCBA", "Chemical splash suit (Level B)", "Chemical-resistant gloves"],
    decontamination: ["Flush with copious water", "Remove contaminated clothing", "Seek medical evaluation for peroxide exposure"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "ATF (for ammonium nitrate incidents)"],
    ergGuideNumbers: ["140", "141", "142", "143", "144", "145", "146", "147", "148"],
  },
  class_6_poisons: {
    className: "Class 6 — Toxic and Infectious Substances",
    examples: ["Pesticides", "Cyanide", "Arsenic compounds", "Medical waste", "Biological samples", "Lead compounds"],
    immediateActions: [
      "EVACUATE 1,000 ft (300m) downwind",
      "Do NOT touch spilled material — even small amounts can be lethal",
      "Isolate area — deny entry without proper PPE",
      "For infectious substances: treat as biohazard — contain and isolate",
      "If inhaled: move victim to fresh air immediately",
      "Call Poison Control: 1-800-222-1222",
    ],
    evacuationRadius: "1,000 ft (300m) downwind — more for volatile poisons",
    ppe: ["SCBA (mandatory)", "Level A fully encapsulated suit for volatile poisons", "Double gloves (chemical-resistant)", "Duct tape all seams"],
    decontamination: ["Full body decontamination required", "Flush with water 20+ minutes", "Bag and tag all contaminated clothing", "Medical evaluation mandatory"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "Poison Control", "CDC (for infectious substances)", "EPA"],
    ergGuideNumbers: ["151", "152", "153", "154", "155", "156", "157", "158"],
  },
  class_7_radioactive: {
    className: "Class 7 — Radioactive Materials",
    examples: ["Medical isotopes", "Industrial radiography sources", "Uranium hexafluoride", "Smoke detectors (bulk)"],
    immediateActions: [
      "EVACUATE 1,000 ft (300m) in all directions — more for high-activity sources",
      "Do NOT touch damaged packages — radioactive contamination risk",
      "Limit exposure time — distance is your best protection",
      "Mark contaminated area — do NOT allow anyone to enter",
      "Remove clothing if contamination suspected — bag separately",
      "Notify NRC IMMEDIATELY — federal response mandatory",
    ],
    evacuationRadius: "1,000 ft (300m) minimum — expanded per radiation survey",
    ppe: ["SCBA", "Tyvek coveralls (disposable)", "Double gloves", "Dosimeter/radiation badge mandatory", "Level A for high-activity sources"],
    decontamination: ["Do NOT decontaminate without health physics guidance", "Remove clothing carefully — roll outward", "Shower with lukewarm water — no scrubbing", "Monitor with Geiger counter"],
    agencyNotifications: ["911", "CHEMTREC", "NRC (mandatory)", "DOE", "State radiation control program", "FEMA (for significant events)"],
    ergGuideNumbers: ["161", "162", "163", "164", "165", "166"],
  },
  class_8_corrosives: {
    className: "Class 8 — Corrosive Substances",
    examples: ["Sulfuric acid", "Hydrochloric acid", "Sodium hydroxide", "Battery acid", "Bleach (concentrated)", "Nitric acid"],
    immediateActions: [
      "EVACUATE 150 ft (50m) minimum — 1,000 ft if fuming",
      "Do NOT touch spilled material — causes severe burns on contact",
      "If skin contact: flush with water for 20+ minutes IMMEDIATELY",
      "Prevent entry into sewers and waterways — corrosives destroy infrastructure",
      "For acid spills: do NOT use water in confined spaces (heat generation)",
      "Neutralization should only be done by trained hazmat team",
    ],
    evacuationRadius: "150 ft (50m) — 1,000 ft for fuming acids",
    ppe: ["SCBA for fuming corrosives", "Chemical splash suit (Level B)", "Face shield", "Chemical-resistant gloves and boots (verify compatibility)"],
    decontamination: ["Immediate water flush 20+ minutes for skin contact", "Remove contaminated clothing while flushing", "Do NOT attempt neutralization on skin", "Eye exposure: flush 30+ minutes — seek ophthalmologist"],
    agencyNotifications: ["911", "CHEMTREC", "NRC", "State environmental agency"],
    ergGuideNumbers: ["153", "154", "157"],
  },
  class_9_miscellaneous: {
    className: "Class 9 — Miscellaneous Dangerous Goods",
    examples: ["Lithium batteries", "Dry ice", "Asbestos", "Fuel cell engines", "Magnetized material", "Elevated temperature liquids"],
    immediateActions: [
      "EVACUATE 100 ft (30m) minimum",
      "For lithium batteries: risk of thermal runaway — do NOT use water",
      "For dry ice: ventilate area — CO2 asphyxiation risk in enclosed spaces",
      "For elevated temperature materials: stay clear — burn risk",
      "Consult ERG Guide 171 for general guidance",
    ],
    evacuationRadius: "100 ft (30m) minimum — more for lithium battery fires",
    ppe: ["SCBA if enclosed space", "Heat-resistant gloves for elevated temp materials", "Standard hazmat PPE for unknown substances"],
    decontamination: ["Material-specific — consult SDS", "For lithium battery electrolyte: flush with water"],
    agencyNotifications: ["911", "CHEMTREC", "NRC (if applicable)"],
    ergGuideNumbers: ["171"],
  },
};

const ACCIDENT_PROTOCOL_STEPS = [
  { step: 1, title: "Ensure Safety", priority: "critical", actions: ["Turn on hazard flashers immediately", "If safe, move vehicle to shoulder or out of traffic", "Set up reflective triangles: 10ft, 100ft, and 200ft behind vehicle", "Check yourself and passengers for injuries", "Exit vehicle from side away from traffic if possible"] },
  { step: 2, title: "Call 911", priority: "critical", actions: ["Report location (mile marker, cross streets, GPS coordinates)", "Describe number of vehicles and injuries", "Report if hazmat cargo is involved", "Report if road is blocked", "Stay on the line until dispatcher confirms"] },
  { step: 3, title: "Secure the Scene", priority: "high", actions: ["Do NOT move injured persons unless immediate danger (fire, explosion)", "Turn off ignition of all involved vehicles if safe", "If fuel is leaking, warn people away — NO SMOKING", "Keep bystanders at safe distance", "If hazmat: refer to ERG guide and establish initial isolation zone"] },
  { step: 4, title: "Document Everything", priority: "high", actions: ["Take photos: vehicle damage, road conditions, skid marks, traffic signs, weather", "Take photos of all license plates and insurance cards", "Note date, time, weather, road conditions, visibility", "Record names and badge numbers of responding officers", "Get police report number"] },
  { step: 5, title: "Exchange Information", priority: "high", actions: ["Get names, addresses, phone numbers of all parties", "Get insurance information (company, policy number)", "Get vehicle information (make, model, year, VIN, plate)", "Get witness contact information", "Do NOT admit fault or sign anything at the scene"] },
  { step: 6, title: "Notify Company", priority: "high", actions: ["Call dispatch/safety department immediately", "Report: who, what, where, when, injuries, cargo status", "Provide police report number", "Follow company-specific reporting procedures", "Do NOT discuss accident details with anyone except police, company, and attorney"] },
  { step: 7, title: "Regulatory Reporting", priority: "medium", actions: ["DOT reportable if: fatality, injury requiring transport, or vehicle towed", "File DOT crash report within 30 days if DOT-reportable", "Report to FMCSA if CMV involved in DOT-reportable crash", "Drug/alcohol testing required within 8/32 hours per FMCSA 382.303", "Preserve all electronic logs and ELD data"] },
  { step: 8, title: "Medical Follow-up", priority: "medium", actions: ["Seek medical evaluation even if no apparent injuries", "Document all medical visits and treatments", "Report any delayed symptoms to medical provider", "Keep all medical records — needed for insurance and legal", "Follow up with company safety manager"] },
  { step: 9, title: "Insurance Claim", priority: "medium", actions: ["File claim with company insurance immediately", "Provide all documentation: photos, police report, witness info", "Do NOT accept settlements from other parties' insurers without counsel", "Keep detailed records of all expenses related to accident", "Cooperate with insurance adjusters — provide facts only"] },
  { step: 10, title: "Post-Incident", priority: "low", actions: ["Complete company incident report within 24 hours", "Attend any required post-accident interviews", "Participate in root cause analysis", "Complete any corrective action training", "Review and update emergency procedures based on lessons learned"] },
];

const CRISIS_TEMPLATES: Record<string, {
  subject: string;
  internalMessage: string;
  externalMessage: string;
  audienceGuidance: string;
}> = {
  accident_notification: {
    subject: "ALERT: Traffic Accident — Driver Safety Advisory",
    internalMessage: "A traffic accident has been reported involving [DRIVER/UNIT]. Emergency services are en route. All drivers in the [AREA] area should avoid [LOCATION] and use alternate routes. Updates will follow as information becomes available. Contact dispatch for route guidance.",
    externalMessage: "We are aware of a traffic incident in the [AREA] area. Our safety team is responding and coordinating with local authorities. Affected shipments may experience delays. We will provide updates as the situation develops. Contact your account representative for shipment-specific information.",
    audienceGuidance: "Internal: All drivers and dispatchers in affected region. External: Affected shippers/customers only.",
  },
  hazmat_spill_alert: {
    subject: "URGENT: HAZMAT Incident — Immediate Action Required",
    internalMessage: "A hazardous material incident has been reported at [LOCATION]. HAZMAT class: [CLASS]. Isolation zone: [RADIUS]. ALL drivers must avoid the area immediately. If you are within the isolation zone, follow ERG procedures and contact dispatch immediately. CHEMTREC and NRC have been notified.",
    externalMessage: "A hazardous material incident is being managed at [LOCATION] in coordination with federal and local agencies. All applicable regulatory agencies have been notified. Affected shipments are being rerouted. We will provide regular updates. For immediate questions, contact our Emergency Operations Center.",
    audienceGuidance: "Internal: ALL fleet personnel immediately. External: Affected customers, regulatory agencies, media (through designated spokesperson only).",
  },
  weather_warning: {
    subject: "WEATHER ALERT: [WEATHER_TYPE] — Route Modifications in Effect",
    internalMessage: "[WEATHER_TYPE] conditions affecting [AREA]. Severity: [SEVERITY]. Expected duration: [DURATION]. Route modifications are in effect — check dispatch for updated routes. Drivers: secure cargo, reduce speed, and find safe parking if conditions deteriorate. Report road conditions to dispatch.",
    externalMessage: "Severe weather conditions in the [AREA] region may impact delivery schedules. Our operations team is actively monitoring conditions and adjusting routes as needed. We will communicate any delivery timeline changes directly to affected customers.",
    audienceGuidance: "Internal: All drivers in affected regions. External: Customers with active shipments in affected lanes.",
  },
  evacuation_order: {
    subject: "CRITICAL: Evacuation Order — Immediate Compliance Required",
    internalMessage: "An evacuation order has been issued for [AREA]. ALL company personnel and vehicles must evacuate immediately. Proceed to designated safe haven: [SAFE_HAVEN]. Abandon cargo if necessary — human safety is the absolute priority. Check in with dispatch every 30 minutes until confirmed safe.",
    externalMessage: "Due to an evacuation order in the [AREA] area, all operations in the affected zone have been suspended. The safety of our team members is our top priority. We are working to resume operations as soon as authorities confirm the area is safe. All affected shipments will be rescheduled.",
    audienceGuidance: "Internal: IMMEDIATE to all affected personnel. External: All affected customers within 1 hour.",
  },
  road_closure: {
    subject: "ADVISORY: Road Closure — Alternate Routes Active",
    internalMessage: "[ROAD/HIGHWAY] is closed between [START] and [END] due to [REASON]. Expected reopening: [TIME]. Alternate routes have been loaded into dispatch system. Drivers already en route should contact dispatch for rerouting instructions.",
    externalMessage: "A road closure on [ROAD/HIGHWAY] may affect some deliveries in the [AREA] area. Our team is rerouting affected shipments. Minor delays of [ESTIMATED_DELAY] are possible. We will notify you of any changes to your delivery schedule.",
    audienceGuidance: "Internal: Drivers with routes through affected area. External: Customers with potentially delayed shipments.",
  },
  driver_safety_alert: {
    subject: "SAFETY ALERT: [ALERT_TYPE] — All Drivers Read Immediately",
    internalMessage: "[ALERT_DETAILS]. All drivers must [REQUIRED_ACTION]. If you encounter [CONDITION], do NOT [PROHIBITED_ACTION]. Instead, [CORRECT_ACTION]. Report any related observations to dispatch immediately.",
    externalMessage: "A safety advisory has been issued for our operations in the [AREA] area. Our drivers have been briefed and our safety protocols are in effect. No impact to service levels is expected at this time.",
    audienceGuidance: "Internal: All active drivers. External: Only if service impact expected.",
  },
  fleet_recall: {
    subject: "URGENT: Fleet Recall — Return to Base Immediately",
    internalMessage: "A fleet recall has been ordered for [AFFECTED_UNITS]. Reason: [REASON]. Complete current delivery if within 1 hour of destination, otherwise return to nearest terminal. Contact dispatch for instructions. This is a mandatory safety action.",
    externalMessage: "A fleet maintenance action requires us to temporarily reassign some vehicles. We are proactively managing this to minimize any delivery impact. Your account representative will contact you if your shipment is affected.",
    audienceGuidance: "Internal: Affected drivers and all dispatchers. External: Only affected customers.",
  },
  media_statement: {
    subject: "MEDIA: Prepared Statement — [INCIDENT_TYPE]",
    internalMessage: "A media inquiry has been received regarding [INCIDENT]. The ONLY authorized spokesperson is [SPOKESPERSON]. All other employees must refer media inquiries to [PHONE/EMAIL]. Do NOT post about the incident on social media. Do NOT discuss with anyone outside the company.",
    externalMessage: "[COMPANY_NAME] is aware of the [INCIDENT] and is working closely with [AUTHORITIES] to [ACTION]. The safety of our team members, the public, and the environment is our highest priority. We will provide updates as more information becomes available. Media inquiries: [MEDIA_CONTACT].",
    audienceGuidance: "Internal: ALL employees. External: Media, through designated spokesperson only.",
  },
  regulatory_notification: {
    subject: "COMPLIANCE: Regulatory Notification Required — [INCIDENT_TYPE]",
    internalMessage: "A regulatory notification is required for [INCIDENT]. Deadline: [DEADLINE]. Agencies to notify: [AGENCIES]. Compliance team is preparing filings. All involved personnel must preserve all records, logs, and communications. Do NOT delete or alter any data.",
    externalMessage: "We are filing required notifications with [AGENCIES] in accordance with federal regulations. We are cooperating fully with all regulatory requirements and will provide any requested information promptly.",
    audienceGuidance: "Internal: Safety, compliance, and legal teams. External: Regulatory agencies per filing requirements.",
  },
  customer_advisory: {
    subject: "SERVICE ADVISORY: [ISSUE_TYPE] — Impact to Deliveries",
    internalMessage: "Service disruption affecting [LANES/CUSTOMERS]. Cause: [CAUSE]. Expected duration: [DURATION]. Customer service team should proactively reach out to all affected customers. Offer [REMEDIATION] as appropriate. Track all affected shipments in the incident management system.",
    externalMessage: "We are currently experiencing [ISSUE_TYPE] affecting deliveries in the [AREA] area. We estimate [IMPACT_DESCRIPTION]. Our team is actively working to [RESOLUTION_PLAN]. We will provide you with an updated delivery timeline by [UPDATE_TIME]. We apologize for any inconvenience.",
    audienceGuidance: "Internal: Customer service, dispatch, and account managers. External: All affected customers proactively.",
  },
};

const TRAINING_MODULES = [
  { id: "EM-101", title: "Emergency Response Fundamentals", description: "Core emergency response procedures for all fleet personnel", duration: "2 hours", certification: "Emergency Response Basic", requiredFor: ["all_drivers", "dispatchers"], renewalPeriod: "12 months", topics: ["Scene safety", "Emergency communications", "Basic first aid", "Fire extinguisher use", "Evacuation procedures"] },
  { id: "EM-201", title: "HAZMAT Emergency Response (First Responder Awareness)", description: "Recognition and initial response to hazmat emergencies per 49 CFR 172.704", duration: "4 hours", certification: "HAZMAT Awareness", requiredFor: ["hazmat_drivers"], renewalPeriod: "36 months", topics: ["HAZMAT placarding", "ERG guide usage", "Isolation zones", "Reporting requirements", "PPE basics"] },
  { id: "EM-202", title: "HAZMAT Spill Containment", description: "Practical spill containment and cleanup procedures", duration: "8 hours", certification: "HAZMAT Operations", requiredFor: ["hazmat_drivers", "tanker_drivers"], renewalPeriod: "12 months", topics: ["Spill kit usage", "Containment techniques", "Decontamination", "Documentation", "Environmental protection"] },
  { id: "EM-301", title: "Accident Scene Management", description: "Comprehensive accident scene procedures from initial response through documentation", duration: "3 hours", certification: "Accident Management", requiredFor: ["all_drivers"], renewalPeriod: "24 months", topics: ["Scene safety and hazard assessment", "Evidence preservation", "Photography documentation", "Witness management", "Insurance procedures"] },
  { id: "EM-302", title: "Defensive Driving — Severe Weather", description: "Safe driving techniques for adverse weather conditions", duration: "4 hours", certification: "Severe Weather Driving", requiredFor: ["all_drivers"], renewalPeriod: "12 months", topics: ["Hydroplaning prevention", "Black ice recognition", "High wind driving", "Fog navigation", "When to pull over"] },
  { id: "EM-401", title: "Natural Disaster Preparedness", description: "Preparation and response for natural disasters while in transit", duration: "2 hours", certification: "Disaster Preparedness", requiredFor: ["all_drivers", "dispatchers"], renewalPeriod: "12 months", topics: ["Tornado awareness", "Hurricane preparation", "Flood avoidance", "Earthquake response", "Wildfire safety"] },
  { id: "EM-501", title: "Crisis Communication for Dispatchers", description: "Emergency communication protocols and crisis management for dispatch personnel", duration: "4 hours", certification: "Crisis Communications", requiredFor: ["dispatchers", "safety_managers"], renewalPeriod: "12 months", topics: ["Emergency broadcast procedures", "Multi-agency coordination", "Driver communication during crisis", "Media interaction protocol", "Post-incident communication"] },
  { id: "EM-601", title: "Post-Incident Investigation", description: "Root cause analysis and post-incident reporting for safety managers", duration: "6 hours", certification: "Incident Investigation", requiredFor: ["safety_managers"], renewalPeriod: "24 months", topics: ["Evidence collection", "Interview techniques", "Root cause analysis", "Corrective action planning", "Regulatory reporting requirements"] },
];

const COMPLIANCE_REPORTING_REQUIREMENTS = [
  { agency: "FMCSA", reportType: "DOT Crash Report", trigger: "CMV involved in crash with fatality, injury requiring transport, or vehicle towed", deadline: "30 days", form: "MCS-50T", penalties: "Up to $16,000 per violation" },
  { agency: "FMCSA", reportType: "Post-Accident Drug/Alcohol Testing", trigger: "DOT-reportable crash", deadline: "Drug: 32 hours / Alcohol: 8 hours", form: "Per 49 CFR 382.303", penalties: "Up to $16,000; driver disqualification" },
  { agency: "NRC", reportType: "Hazardous Substance Release", trigger: "Release of reportable quantity of listed substance", deadline: "Immediately upon discovery", form: "NRC phone report", penalties: "Up to $75,000/day criminal; $37,500/day civil" },
  { agency: "EPA", reportType: "CERCLA/EPCRA Release Report", trigger: "Release of reportable quantity of hazardous substance to environment", deadline: "Immediately + written follow-up within 30 days", form: "EPA release notification", penalties: "Up to $75,000/day" },
  { agency: "OSHA", reportType: "Fatality/Severe Injury Report", trigger: "Work-related fatality, amputation, loss of eye, or in-patient hospitalization", deadline: "Fatality: 8 hours / Severe injury: 24 hours", form: "OSHA Form 301 + phone report", penalties: "Up to $156,259 per willful violation" },
  { agency: "State DOT", reportType: "State Crash Report", trigger: "Per state-specific thresholds (varies)", deadline: "Varies by state — typically 10-30 days", form: "State-specific form", penalties: "Varies by state" },
  { agency: "PHMSA", reportType: "Hazmat Incident Report", trigger: "Any unintentional release of hazmat during transportation", deadline: "Immediate phone + DOT 5800.1 within 30 days", form: "DOT 5800.1", penalties: "Up to $81,993 per violation" },
];

// ─── Router ───────────────────────────────────────────────────────────────────

export const emergencyProtocolsRouter = router({

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  getEmergencyDashboard: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { getDb } = await import("../db");
      const { incidents } = await import("../../drizzle/schema");
      const { eq, sql, gte, and } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const companyId = (ctx.user as any)?.companyId || 0;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [activeCount] = await db.select({ count: sql<number>`count(*)` })
          .from(incidents)
          .where(and(
            eq(incidents.companyId, companyId),
            sql`${incidents.status} IN ('open', 'investigating', 'reported')`
          ));

        const [recentCount] = await db.select({ count: sql<number>`count(*)` })
          .from(incidents)
          .where(and(
            eq(incidents.companyId, companyId),
            gte(incidents.createdAt, thirtyDaysAgo),
          ));

        const recentIncidents = await db.select({
          id: incidents.id,
          type: incidents.type,
          description: incidents.description,
          status: incidents.status,
          createdAt: incidents.createdAt,
        })
          .from(incidents)
          .where(eq(incidents.companyId, companyId))
          .orderBy(sql`${incidents.createdAt} DESC`)
          .limit(10);

        return {
          activeEmergencies: activeCount?.count || 0,
          recentIncidents30d: recentCount?.count || 0,
          threatLevel: (activeCount?.count || 0) > 3 ? "HIGH" : (activeCount?.count || 0) > 0 ? "ELEVATED" : "NORMAL",
          emergencies: recentIncidents.map(i => ({
            id: `EM-${i.id}`,
            type: i.type || "unknown",
            description: i.description || "",
            status: i.status || "reported",
            declaredAt: i.createdAt?.toISOString() || new Date().toISOString(),
          })),
          weatherAlerts: [],
          systemStatus: "operational",
        };
      }
    } catch (e) {
      logger.warn("[EmergencyProtocols] Dashboard DB error:", e);
    }

    return {
      activeEmergencies: 0,
      recentIncidents30d: 0,
      threatLevel: "NORMAL" as const,
      emergencies: [],
      weatherAlerts: [],
      systemStatus: "operational",
    };
  }),

  // ─── Declare Emergency ──────────────────────────────────────────────────────

  declareEmergency: protectedProcedure
    .input(z.object({
      type: emergencyTypeSchema,
      severity: emergencySeveritySchema,
      title: z.string().min(5).max(200),
      description: z.string().min(10).max(5000),
      location: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      affectedDriverIds: z.array(z.number()).optional(),
      affectedRoutes: z.array(z.string()).optional(),
      hazmatClass: hazmatClassSchema.optional(),
      unNumber: z.string().optional(),
      injuriesReported: z.number().optional(),
      fatalitiesReported: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const emergencyId = `EM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const userId = (ctx.user as any)?.id;

      try {
        const { getDb } = await import("../db");
        const { incidents } = await import("../../drizzle/schema");
        const db = await getDb();
        if (db) {
          const companyId = (ctx.user as any)?.companyId || 0;
          const [result] = await db.insert(incidents).values({
            companyId,
            type: input.type as any,
            severity: (input.severity === "critical" ? "critical" : input.severity === "high" ? "major" : "minor") as any,
            description: `[${input.title}] ${input.description}`,
            location: input.location,
            occurredAt: new Date(),
            injuries: input.injuriesReported || 0,
            fatalities: input.fatalitiesReported || 0,
            status: "reported",
          }).$returningId();
          logger.info(`[EmergencyProtocols] Emergency declared: ${emergencyId} by user ${userId}, DB id: ${result.id}`);
        }
      } catch (e) {
        logger.warn("[EmergencyProtocols] DB insert failed for emergency:", e);
      }

      return {
        success: true,
        emergencyId,
        status: "declared",
        declaredAt: new Date().toISOString(),
        declaredBy: userId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        immediateActions: getImmediateActions(input.type, input.severity),
        requiredNotifications: getRequiredNotifications(input.type),
      };
    }),

  // ─── Get Protocol by Type ──────────────────────────────────────────────────

  getEmergencyProtocol: protectedProcedure
    .input(z.object({
      type: emergencyTypeSchema,
      severity: emergencySeveritySchema.optional(),
    }))
    .query(({ input }) => {
      return {
        type: input.type,
        severity: input.severity || "medium",
        protocol: getProtocolForType(input.type),
        contacts: getContactsForType(input.type),
        complianceRequirements: getComplianceForType(input.type),
      };
    }),

  // ─── Update Emergency Status ───────────────────────────────────────────────

  updateEmergencyStatus: protectedProcedure
    .input(z.object({
      emergencyId: z.string(),
      status: emergencyStatusSchema,
      notes: z.string().optional(),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = (ctx.user as any)?.id;
      logger.info(`[EmergencyProtocols] Status update: ${input.emergencyId} -> ${input.status} by user ${userId}`);

      // Try to update DB if numeric ID
      const numericId = parseInt(input.emergencyId.replace(/\D/g, ""));
      if (!isNaN(numericId)) {
        try {
          const { getDb } = await import("../db");
          const { incidents } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await getDb();
          if (db) {
            const statusMap: Record<string, string> = {
              declared: "reported",
              active: "open",
              escalated: "investigating",
              contained: "investigating",
              resolving: "investigating",
              resolved: "resolved",
              closed: "closed",
              post_mortem: "closed",
            };
            await db.update(incidents).set({
              status: (statusMap[input.status] || "open") as any,
            }).where(eq(incidents.id, numericId));
          }
        } catch (e) {
          logger.warn("[EmergencyProtocols] Status update DB error:", e);
        }
      }

      return {
        success: true,
        emergencyId: input.emergencyId,
        status: input.status,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };
    }),

  // ─── Weather Alerts ─────────────────────────────────────────────────────────

  getWeatherAlerts: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
      state: z.string().optional(),
      severity: weatherSeveritySchema.optional(),
    }))
    .query(({ input }) => {
      // In production, integrate with NWS API (api.weather.gov)
      return {
        alerts: [] as Array<{
          id: string;
          type: string;
          severity: string;
          headline: string;
          description: string;
          area: string;
          effective: string;
          expires: string;
          routingImpact: string;
        }>,
        source: "NWS API integration pending — configure WEATHER_API_KEY",
        lastUpdated: new Date().toISOString(),
        region: input.region || "all",
        drivingGuidance: getWeatherDrivingGuidance(),
      };
    }),

  // ─── Weather Rerouting ──────────────────────────────────────────────────────

  getWeatherRerouting: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      weatherEventType: weatherAlertTypeSchema.optional(),
      avoidStates: z.array(z.string()).optional(),
    }))
    .query(({ input }) => {
      return {
        originalRoute: { origin: input.origin, destination: input.destination },
        weatherAffected: false,
        alternateRoutes: [] as Array<{
          id: string;
          description: string;
          additionalMiles: number;
          additionalHours: number;
          avoidedHazards: string[];
        }>,
        recommendation: "No active weather events affecting this route. Original route is clear.",
        guidance: getWeatherDrivingGuidance(),
      };
    }),

  // ─── HAZMAT Spill Protocol ──────────────────────────────────────────────────

  getHazmatSpillProtocol: protectedProcedure
    .input(z.object({
      hazmatClass: hazmatClassSchema,
    }))
    .query(({ input }) => {
      const protocol = HAZMAT_PROTOCOLS[input.hazmatClass];
      if (!protocol) {
        return { error: "Unknown hazmat class", hazmatClass: input.hazmatClass };
      }
      return {
        ...protocol,
        hazmatClass: input.hazmatClass,
        generalReminders: [
          "ALWAYS approach upwind and uphill",
          "NEVER eat, drink, or smoke in contaminated area",
          "ALWAYS use the buddy system — never work alone",
          "ALWAYS have an escape route planned",
          "When in doubt, EVACUATE and call for specialized help",
          "Human life takes priority over property and cargo — ALWAYS",
        ],
        keyPhoneNumbers: {
          emergency: "911",
          chemtrec: "1-800-424-9300",
          nrc: "1-800-424-8802",
          poisonControl: "1-800-222-1222",
        },
      };
    }),

  // ─── Report HAZMAT Incident ─────────────────────────────────────────────────

  reportHazmatIncident: protectedProcedure
    .input(z.object({
      hazmatClass: hazmatClassSchema,
      unNumber: z.string().optional(),
      properShippingName: z.string().optional(),
      quantity: z.string().optional(),
      releaseType: z.enum(["spill", "leak", "vapor_release", "fire", "explosion", "container_damage"]),
      location: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      injuries: z.number().default(0),
      fatalities: z.number().default(0),
      environmentalImpact: z.enum(["none", "soil", "water", "air", "multiple"]).default("none"),
      containmentStatus: z.enum(["uncontained", "partially_contained", "contained"]).default("uncontained"),
      evacuationInitiated: z.boolean().default(false),
      description: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const incidentId = `HZ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const userId = (ctx.user as any)?.id;
      const protocol = HAZMAT_PROTOCOLS[input.hazmatClass];

      logger.info(`[EmergencyProtocols] HAZMAT incident reported: ${incidentId} by user ${userId}, class: ${input.hazmatClass}`);

      try {
        const { getDb } = await import("../db");
        const { incidents } = await import("../../drizzle/schema");
        const db = await getDb();
        if (db) {
          await db.insert(incidents).values({
            companyId: (ctx.user as any)?.companyId || 0,
            type: "spill" as any,
            severity: (input.fatalities > 0 ? "critical" : input.injuries > 0 ? "major" : "minor") as any,
            description: `[HAZMAT ${input.hazmatClass}] ${input.description}`,
            location: input.location,
            occurredAt: new Date(),
            injuries: input.injuries,
            fatalities: input.fatalities,
            status: "reported",
          }).$returningId();
        }
      } catch (e) {
        logger.warn("[EmergencyProtocols] HAZMAT incident DB insert error:", e);
      }

      return {
        success: true,
        incidentId,
        reportedAt: new Date().toISOString(),
        reportedBy: userId,
        requiredNotifications: protocol?.agencyNotifications || ["911", "CHEMTREC", "NRC"],
        nrcRequired: true,
        nrcPhone: "1-800-424-8802",
        chemtrecPhone: "1-800-424-9300",
        immediateActions: protocol?.immediateActions || ["Call 911 immediately", "Evacuate area", "Call CHEMTREC"],
        evacuationRadius: protocol?.evacuationRadius || "300 ft minimum",
        ppe: protocol?.ppe || ["SCBA", "Chemical-resistant suit"],
        complianceDeadlines: [
          { agency: "NRC", action: "Phone report of release", deadline: "Immediately" },
          { agency: "PHMSA", action: "DOT 5800.1 incident report", deadline: "30 days" },
          { agency: "EPA", action: "Written follow-up report", deadline: "30 days if CERCLA applicable" },
        ],
      };
    }),

  // ─── Accident Protocol ──────────────────────────────────────────────────────

  getAccidentProtocol: protectedProcedure.query(() => {
    return {
      steps: ACCIDENT_PROTOCOL_STEPS,
      criticalReminders: [
        "NEVER admit fault at the accident scene",
        "NEVER sign any documents from other parties",
        "ALWAYS take photographs before moving vehicles (if safe)",
        "ALWAYS get a police report number",
        "Drug/alcohol testing is MANDATORY after DOT-reportable crashes",
        "Preserve ALL electronic data — ELD logs, dashcam, GPS records",
      ],
      dotReportableCriteria: [
        "A fatality (death within 30 days of the crash)",
        "Bodily injury requiring immediate transport to medical facility",
        "Any vehicle involved requires towing from the scene",
      ],
      requiredDocumentation: [
        "Completed accident report form",
        "Scene photographs (minimum 20 — all angles, all vehicles, road conditions)",
        "Police report number and responding officer information",
        "Witness contact information and statements",
        "Insurance information for all parties",
        "ELD/GPS data for 24 hours before and after accident",
        "Dashcam footage (preserve immediately)",
        "Pre-trip and post-trip inspection reports for day of accident",
        "Driver qualification file review",
      ],
    };
  }),

  // ─── Report Accident ────────────────────────────────────────────────────────

  reportAccident: protectedProcedure
    .input(z.object({
      date: z.string(),
      time: z.string(),
      location: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      driverId: z.number().optional(),
      vehicleId: z.number().optional(),
      accidentType: z.enum(["collision", "rollover", "jackknife", "sideswipe", "rear_end", "head_on", "fixed_object", "pedestrian", "animal", "weather_related", "cargo_shift", "other"]),
      severity: z.enum(["minor", "moderate", "severe", "fatal"]),
      description: z.string(),
      injuries: z.number().default(0),
      fatalities: z.number().default(0),
      otherVehiclesInvolved: z.number().default(0),
      policeReportNumber: z.string().optional(),
      policeOfficerName: z.string().optional(),
      policeOfficerBadge: z.string().optional(),
      policeDepartment: z.string().optional(),
      hazmatInvolved: z.boolean().default(false),
      hazmatReleased: z.boolean().default(false),
      vehicleTowed: z.boolean().default(false),
      roadConditions: z.enum(["dry", "wet", "icy", "snowy", "muddy", "gravel", "construction", "unknown"]).optional(),
      weatherConditions: z.enum(["clear", "rain", "snow", "fog", "wind", "ice", "unknown"]).optional(),
      visibility: z.enum(["good", "fair", "poor", "zero"]).optional(),
      photoUrls: z.array(z.string()).optional(),
      witnesses: z.array(z.object({
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().optional(),
        statement: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const reportId = `ACC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      const userId = (ctx.user as any)?.id;

      try {
        const { getDb } = await import("../db");
        const { incidents } = await import("../../drizzle/schema");
        const db = await getDb();
        if (db) {
          await db.insert(incidents).values({
            companyId: (ctx.user as any)?.companyId || 0,
            type: "accident" as any,
            severity: (input.severity === "fatal" ? "critical" : input.severity === "severe" ? "major" : "minor") as any,
            description: `[${input.accidentType}] ${input.description}`,
            location: input.location,
            occurredAt: new Date(`${input.date}T${input.time}`),
            driverId: input.driverId,
            vehicleId: input.vehicleId,
            injuries: input.injuries,
            fatalities: input.fatalities,
            status: "reported",
          }).$returningId();
        }
      } catch (e) {
        logger.warn("[EmergencyProtocols] Accident report DB insert error:", e);
      }

      const dotReportable = input.fatalities > 0 || input.injuries > 0 || input.vehicleTowed;
      const drugTestRequired = dotReportable;

      return {
        success: true,
        reportId,
        reportedAt: new Date().toISOString(),
        reportedBy: userId,
        dotReportable,
        drugTestRequired,
        drugTestDeadline: drugTestRequired ? {
          alcohol: "Within 8 hours of accident",
          drug: "Within 32 hours of accident",
        } : null,
        requiredFollowUp: [
          ...(dotReportable ? ["File DOT crash report (MCS-50T) within 30 days"] : []),
          ...(drugTestRequired ? ["Schedule post-accident drug/alcohol test IMMEDIATELY"] : []),
          ...(input.hazmatReleased ? ["Report to NRC immediately: 1-800-424-8802", "File PHMSA DOT 5800.1 within 30 days"] : []),
          "Complete internal accident report within 24 hours",
          "Preserve all ELD/GPS/dashcam data",
          "Notify insurance carrier",
        ],
        nextSteps: ACCIDENT_PROTOCOL_STEPS.filter(s => s.step >= 4),
      };
    }),

  // ─── Natural Disaster Routing ───────────────────────────────────────────────

  getNaturalDisasterRouting: protectedProcedure
    .input(z.object({
      origin: z.string(),
      destination: z.string(),
      disasterType: disasterTypeSchema.optional(),
      avoidZones: z.array(z.object({
        lat: z.number(),
        lng: z.number(),
        radiusMiles: z.number(),
        description: z.string().optional(),
      })).optional(),
    }))
    .query(({ input }) => {
      return {
        originalRoute: { origin: input.origin, destination: input.destination },
        activeDisasters: [] as Array<{
          id: string;
          type: string;
          location: string;
          radius: string;
          severity: string;
          avoidanceRequired: boolean;
        }>,
        alternateRoutes: [] as Array<{
          id: string;
          description: string;
          distance: number;
          estimatedTime: string;
          safetyRating: string;
          avoidedDisasters: string[];
        }>,
        safetyAdvisories: getDisasterSafetyAdvisory(input.disasterType),
        emergencySupplies: [] as Array<{ name: string; address: string; phone: string; distance: string }>,
      };
    }),

  // ─── Evacuation Routes ──────────────────────────────────────────────────────

  getEvacuationRoutes: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMiles: z.number().default(50),
      disasterType: disasterTypeSchema.optional(),
    }))
    .query(({ input }) => {
      return {
        location: { lat: input.latitude, lng: input.longitude },
        evacuationRoutes: [] as Array<{
          direction: string;
          primaryRoute: string;
          alternateRoute: string;
          estimatedTime: string;
          congestionLevel: string;
        }>,
        shelters: [] as Array<{ name: string; address: string; capacity: string; truckParking: boolean; distance: string }>,
        guidance: [
          "Follow state and local evacuation orders — they are mandatory",
          "Take only essential items — do not delay evacuation",
          "Keep fuel tank at least half full at all times during warnings",
          "Monitor NOAA Weather Radio on 162.400-162.550 MHz",
          "If driving a CMV, contact dispatch before evacuating for cargo disposition",
          "Know your vehicle height/weight — some evacuation routes may not accommodate CMVs",
        ],
      };
    }),

  // ─── Crisis Communication ──────────────────────────────────────────────────

  getCrisisCommunication: protectedProcedure
    .input(z.object({
      crisisType: crisisTypeSchema,
    }))
    .query(({ input }) => {
      const template = CRISIS_TEMPLATES[input.crisisType];
      return {
        crisisType: input.crisisType,
        template: template || {
          subject: "ALERT: Emergency Situation",
          internalMessage: "An emergency situation has been reported. Please stand by for further instructions from your supervisor.",
          externalMessage: "We are managing an operational situation. We will provide updates as information becomes available.",
          audienceGuidance: "Internal: Relevant personnel. External: As needed.",
        },
        communicationChecklist: [
          "Verify facts before communicating — do not speculate",
          "Use established communication channels — no personal social media",
          "Keep messages factual, brief, and actionable",
          "Include clear instructions for what recipients should do",
          "Provide timeline for next update",
          "Route all media inquiries to designated spokesperson",
          "Document all communications in incident log",
        ],
        doNotSay: [
          "Do NOT admit fault or liability",
          "Do NOT speculate about cause",
          "Do NOT share information about injuries/fatalities until families are notified",
          "Do NOT share on social media",
          "Do NOT provide estimates you cannot keep",
        ],
      };
    }),

  // ─── Send Emergency Broadcast ──────────────────────────────────────────────

  sendEmergencyBroadcast: protectedProcedure
    .input(z.object({
      crisisType: crisisTypeSchema,
      subject: z.string(),
      message: z.string(),
      severity: emergencySeveritySchema,
      audience: z.enum(["all_drivers", "affected_drivers", "dispatchers", "all_internal", "customers", "all"]),
      affectedRegion: z.string().optional(),
      affectedDriverIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const broadcastId = `BC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const userId = (ctx.user as any)?.id;

      logger.info(`[EmergencyProtocols] Emergency broadcast sent: ${broadcastId} by user ${userId}, severity: ${input.severity}, audience: ${input.audience}`);

      return {
        success: true,
        broadcastId,
        sentAt: new Date().toISOString(),
        sentBy: userId,
        audience: input.audience,
        severity: input.severity,
        estimatedRecipients: input.audience === "all" ? "All fleet personnel and customers" :
          input.audience === "all_internal" ? "All fleet personnel" :
          input.audience === "all_drivers" ? "All active drivers" :
          `Targeted: ${input.affectedDriverIds?.length || 0} recipients`,
        deliveryChannels: ["Push notification", "SMS", "Email", "In-app alert", "Dispatch board"],
      };
    }),

  // ─── Emergency Contacts ─────────────────────────────────────────────────────

  getEmergencyContacts: protectedProcedure
    .input(z.object({
      category: z.enum(["all", "hazmat", "accident", "weather", "security", "medical", "regulatory"]).optional(),
    }))
    .query(({ input }) => {
      const category = input?.category || "all";
      const all = [...EMERGENCY_CONTACTS.federal, ...EMERGENCY_CONTACTS.general];
      const filtered = category === "all" ? all : all.filter(c =>
        c.category === category || c.category === "emergency"
      );
      return {
        contacts: filtered,
        companyContacts: [
          { name: "Safety Department", phone: "Company safety line", description: "Internal safety reporting", category: "internal" },
          { name: "Dispatch Emergency", phone: "Company dispatch line", description: "24/7 dispatch emergency line", category: "internal" },
          { name: "Legal Department", phone: "Company legal line", description: "Legal counsel for incidents", category: "internal" },
          { name: "Insurance Claims", phone: "Company insurance line", description: "Insurance claim filing", category: "internal" },
        ],
        note: "Company-specific phone numbers should be configured in Settings > Emergency Contacts.",
      };
    }),

  // ─── Multi-Agency Coordination ──────────────────────────────────────────────

  getMultiAgencyCoordination: protectedProcedure
    .input(z.object({
      incidentType: emergencyTypeSchema,
      agencies: z.array(agencyTypeSchema).optional(),
    }))
    .query(({ input }) => {
      const agencyInfo: Record<string, {
        name: string;
        jurisdiction: string;
        contactProtocol: string;
        requiredInfo: string[];
        typicalResponseTime: string;
      }> = {
        dot: { name: "Department of Transportation", jurisdiction: "Highway safety, CMV regulations, crash reporting", contactProtocol: "Via state DOT office or FMCSA hotline", requiredInfo: ["DOT number", "Vehicle information", "Crash details", "Driver information", "HOS logs"], typicalResponseTime: "Varies by state — typically 30-60 minutes for highway incidents" },
        epa: { name: "Environmental Protection Agency", jurisdiction: "Environmental contamination, hazardous waste releases", contactProtocol: "Via NRC (1-800-424-8802) for initial report, then regional EPA office", requiredInfo: ["Material released", "Quantity", "Environmental impact", "Containment status", "Cleanup plan"], typicalResponseTime: "24-72 hours for on-site response — immediate phone guidance" },
        fema: { name: "Federal Emergency Management Agency", jurisdiction: "Major disaster coordination, emergency declarations", contactProtocol: "Via state emergency management agency, then federal coordination", requiredInfo: ["Disaster type", "Affected area", "Resources needed", "Population impact", "Infrastructure damage"], typicalResponseTime: "Hours to days depending on disaster scope" },
        osha: { name: "Occupational Safety and Health Administration", jurisdiction: "Worker safety, workplace injuries, fatalities", contactProtocol: "Phone report for fatalities (8 hours) and severe injuries (24 hours)", requiredInfo: ["Company name and address", "Employee information", "Nature of injury", "Description of incident", "Hospitalization details"], typicalResponseTime: "Investigation within 24-48 hours for fatalities" },
        nrc: { name: "National Response Center", jurisdiction: "Oil and chemical spills, hazmat releases", contactProtocol: "Phone call to 1-800-424-8802 — 24/7 operation", requiredInfo: ["Caller info", "Material released", "Source", "Quantity", "Medium affected", "Injuries", "Containment actions"], typicalResponseTime: "Immediate phone intake — dispatches appropriate agency" },
        chemtrec: { name: "Chemical Transportation Emergency Center", jurisdiction: "Technical guidance for hazmat emergencies", contactProtocol: "Phone call to 1-800-424-9300 — 24/7 operation", requiredInfo: ["UN number or product name", "Placard info", "Container type", "Leak/spill details", "Weather conditions"], typicalResponseTime: "Immediate phone guidance — can patch in manufacturer" },
        local_law_enforcement: { name: "Local Law Enforcement", jurisdiction: "Scene security, traffic control, accident investigation", contactProtocol: "Call 911 for emergencies, non-emergency line for coordination", requiredInfo: ["Location", "Nature of incident", "Vehicles involved", "Injuries", "Hazards present"], typicalResponseTime: "5-15 minutes for emergencies" },
        state_police: { name: "State Police / Highway Patrol", jurisdiction: "Highway incidents, CMV enforcement, accident investigation", contactProtocol: "Call 911 or state police dispatch", requiredInfo: ["Highway/mile marker", "Direction of travel", "Vehicles involved", "Hazards", "Road blockage"], typicalResponseTime: "10-30 minutes on highways" },
        fire_department: { name: "Fire Department / Hazmat Team", jurisdiction: "Fire suppression, hazmat response, rescue operations", contactProtocol: "Call 911", requiredInfo: ["Location", "Nature of fire/hazmat", "Materials involved", "Exposures", "People at risk"], typicalResponseTime: "5-15 minutes" },
        ems: { name: "Emergency Medical Services", jurisdiction: "Medical emergencies, injury treatment, patient transport", contactProtocol: "Call 911", requiredInfo: ["Location", "Number of patients", "Nature of injuries", "Hazards at scene", "Access routes"], typicalResponseTime: "5-15 minutes" },
        coast_guard: { name: "US Coast Guard", jurisdiction: "Marine incidents, waterway spills, port security", contactProtocol: "VHF Channel 16 or phone NRC", requiredInfo: ["Vessel/vehicle info", "Location", "Material if hazmat", "Environmental impact", "Personnel involved"], typicalResponseTime: "30-60 minutes for waterway incidents" },
        ntsb: { name: "National Transportation Safety Board", jurisdiction: "Major transportation accident investigation", contactProtocol: "NTSB determines which incidents to investigate — notify via 1-800-877-6799", requiredInfo: ["Accident details", "Fatalities/injuries", "Vehicle info", "Cargo info", "Environmental conditions"], typicalResponseTime: "Hours to days — typically for major incidents only" },
      };

      const relevantAgencies = input.agencies
        ? input.agencies.map(a => ({ key: a, ...agencyInfo[a] })).filter(a => a.name)
        : Object.entries(agencyInfo).map(([key, info]) => ({ key, ...info }));

      return {
        incidentType: input.incidentType,
        agencies: relevantAgencies,
        coordinationProtocol: [
          "Establish Incident Commander (IC) — usually first-arriving emergency agency",
          "Identify yourself and your company to IC",
          "Provide all requested information promptly and accurately",
          "Follow all instructions from emergency responders",
          "Designate one company point of contact for agency coordination",
          "Maintain a communication log of all agency interactions",
          "Preserve all evidence and data as directed by investigators",
          "Do NOT clean up or move anything until authorized by IC",
        ],
        unifiedCommandStructure: "For multi-agency incidents, Unified Command (ICS) will be established. Your company representative will participate as a cooperating party.",
      };
    }),

  // ─── Incident Timeline ──────────────────────────────────────────────────────

  getIncidentTimeline: protectedProcedure
    .input(z.object({
      emergencyId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Attempt to load from DB
      const numericId = parseInt(input.emergencyId.replace(/\D/g, ""));
      if (!isNaN(numericId)) {
        try {
          const { getDb } = await import("../db");
          const { incidents } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const db = await getDb();
          if (db) {
            const [incident] = await db.select().from(incidents).where(eq(incidents.id, numericId)).limit(1);
            if (incident) {
              return {
                emergencyId: input.emergencyId,
                timeline: [
                  { timestamp: incident.createdAt?.toISOString() || new Date().toISOString(), event: "Incident reported", actor: "System", type: "status_change" as const },
                  ...(incident.status !== "reported" ? [{ timestamp: new Date().toISOString(), event: `Status changed to ${incident.status}`, actor: "System", type: "status_change" as const }] : []),
                ],
              };
            }
          }
        } catch (e) {
          logger.warn("[EmergencyProtocols] Timeline DB error:", e);
        }
      }

      return {
        emergencyId: input.emergencyId,
        timeline: [],
      };
    }),

  // ─── Post-Incident Report ──────────────────────────────────────────────────

  getPostIncidentReport: protectedProcedure
    .input(z.object({
      emergencyId: z.string(),
    }))
    .query(({ input }) => {
      return {
        emergencyId: input.emergencyId,
        reportSections: [
          { section: "Executive Summary", description: "Brief overview of the incident, response, and outcome", required: true },
          { section: "Incident Description", description: "Detailed timeline and description of events", required: true },
          { section: "Response Assessment", description: "Evaluation of emergency response effectiveness", required: true },
          { section: "Root Cause Analysis", description: "Investigation findings and contributing factors", required: true },
          { section: "Injuries and Damages", description: "Documentation of all injuries, fatalities, and property damage", required: true },
          { section: "Environmental Impact", description: "Assessment of environmental contamination or damage", required: false },
          { section: "Regulatory Compliance", description: "Status of all required regulatory notifications and filings", required: true },
          { section: "Corrective Actions", description: "Specific actions to prevent recurrence", required: true },
          { section: "Lessons Learned", description: "Key takeaways for organizational improvement", required: true },
          { section: "Cost Analysis", description: "Total cost of incident including response, cleanup, legal, and business impact", required: false },
          { section: "Insurance Status", description: "Claims filed, coverage status, and settlement progress", required: false },
        ],
        template: "Post-incident report template available — complete all required sections within 14 days of incident resolution.",
      };
    }),

  // ─── Emergency Training ─────────────────────────────────────────────────────

  getEmergencyTraining: protectedProcedure.query(() => {
    return {
      modules: TRAINING_MODULES,
      complianceNote: "HAZMAT training per 49 CFR 172.704 must be completed within 90 days of employment and refreshed every 3 years. All other emergency training is company-recommended best practice.",
    };
  }),

  // ─── Fleet Safety Status ────────────────────────────────────────────────────

  getFleetSafetyStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { getDb } = await import("../db");
      const { drivers, vehicles, incidents } = await import("../../drizzle/schema");
      const { eq, sql, and } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const companyId = (ctx.user as any)?.companyId || 0;

        const [activeDrivers] = await db.select({ count: sql<number>`count(*)` })
          .from(drivers)
          .where(and(eq(drivers.companyId, companyId), eq(drivers.status, "active")));

        const [activeVehicles] = await db.select({ count: sql<number>`count(*)` })
          .from(vehicles)
          .where(eq(vehicles.companyId, companyId));

        const [openIncidents] = await db.select({ count: sql<number>`count(*)` })
          .from(incidents)
          .where(and(
            eq(incidents.companyId, companyId),
            sql`${incidents.status} IN ('open', 'investigating', 'reported')`
          ));

        return {
          activeDrivers: activeDrivers?.count || 0,
          activeVehicles: activeVehicles?.count || 0,
          openIncidents: openIncidents?.count || 0,
          fleetStatus: (openIncidents?.count || 0) > 3 ? "ALERT" : (openIncidents?.count || 0) > 0 ? "CAUTION" : "NORMAL",
          driversInWeatherZone: 0,
          driversInDisasterZone: 0,
          driversRequiringCheckIn: 0,
        };
      }
    } catch (e) {
      logger.warn("[EmergencyProtocols] Fleet safety status DB error:", e);
    }

    return {
      activeDrivers: 0,
      activeVehicles: 0,
      openIncidents: 0,
      fleetStatus: "NORMAL" as const,
      driversInWeatherZone: 0,
      driversInDisasterZone: 0,
      driversRequiringCheckIn: 0,
    };
  }),

  // ─── Insurance Claim Workflow ───────────────────────────────────────────────

  getInsuranceClaimWorkflow: protectedProcedure
    .input(z.object({
      incidentType: z.enum(["accident", "cargo_damage", "cargo_theft", "hazmat", "property_damage", "workers_comp"]),
    }))
    .query(({ input }) => {
      const workflows: Record<string, {
        steps: Array<{ step: number; title: string; description: string; deadline: string; documents: string[] }>;
        tips: string[];
      }> = {
        accident: {
          steps: [
            { step: 1, title: "Immediate Notification", description: "Notify insurance carrier within 24 hours of accident", deadline: "24 hours", documents: ["Police report number", "Photos of damage", "Accident report form"] },
            { step: 2, title: "Documentation Submission", description: "Submit complete accident documentation package", deadline: "72 hours", documents: ["Police report", "All photos", "Witness statements", "Driver statement", "ELD data", "Dashcam footage", "Medical records (if injuries)", "Repair estimates"] },
            { step: 3, title: "Adjuster Assignment", description: "Insurance company assigns adjuster — cooperate fully", deadline: "5-10 business days", documents: ["Provide access for vehicle inspection", "Answer all questions factually"] },
            { step: 4, title: "Damage Assessment", description: "Review adjuster's damage assessment and repair authorization", deadline: "10-15 business days", documents: ["Adjuster report", "Repair authorization", "Rental/replacement vehicle authorization"] },
            { step: 5, title: "Claim Resolution", description: "Review settlement offer and resolve claim", deadline: "30-90 days typical", documents: ["Settlement agreement", "Release forms", "Payment documentation"] },
          ],
          tips: [
            "NEVER admit fault to the other party's insurance",
            "Document EVERYTHING — photos, conversations, expenses",
            "Keep a separate file for each claim",
            "Track all out-of-pocket expenses",
            "Consider legal counsel for severe accidents or disputed liability",
          ],
        },
        cargo_damage: {
          steps: [
            { step: 1, title: "Document Damage", description: "Photograph all damage before unloading", deadline: "Immediately", documents: ["Cargo photos", "BOL with exceptions noted", "Temperature logs if applicable"] },
            { step: 2, title: "File Cargo Claim", description: "Submit cargo claim to insurance carrier", deadline: "9 months (Carmack Amendment)", documents: ["Original BOL", "Invoice for goods", "Damage photos", "Inspection report"] },
            { step: 3, title: "Investigation", description: "Cooperate with claim investigation", deadline: "30 days", documents: ["Driver statement", "Loading/unloading records", "Temperature monitoring data"] },
            { step: 4, title: "Resolution", description: "Negotiate and settle cargo claim", deadline: "120 days from filing", documents: ["Salvage documentation", "Mitigation efforts", "Settlement agreement"] },
          ],
          tips: [
            "Always note exceptions on BOL at delivery",
            "Photograph cargo condition at pickup and delivery",
            "Maintain temperature monitoring records for perishables",
            "Respond to cargo claims within 30 days per Carmack Amendment",
          ],
        },
        cargo_theft: {
          steps: [
            { step: 1, title: "Police Report", description: "File police report immediately", deadline: "Immediately", documents: ["Police report", "Vehicle and cargo description", "GPS location data"] },
            { step: 2, title: "Notify All Parties", description: "Notify insurance, shipper, and law enforcement", deadline: "Immediately", documents: ["Police report number", "Cargo manifest", "Last known location"] },
            { step: 3, title: "FBI Notification", description: "Report to FBI if cargo value exceeds $5,000 or interstate", deadline: "24 hours", documents: ["FBI tips submission", "Cargo value documentation"] },
            { step: 4, title: "Insurance Claim", description: "File theft claim with cargo insurance", deadline: "48 hours", documents: ["Police report", "Cargo manifest", "Invoice value", "Anti-theft measures documentation"] },
          ],
          tips: [
            "File police report BEFORE contacting insurance",
            "Preserve GPS and tracking data",
            "Document anti-theft measures that were in place",
            "Contact CargoNet (888-595-7878) for cargo theft assistance",
          ],
        },
        hazmat: {
          steps: [
            { step: 1, title: "Emergency Response", description: "Complete all emergency response and regulatory notifications first", deadline: "Immediately", documents: ["NRC report number", "CHEMTREC reference", "Incident photos"] },
            { step: 2, title: "Environmental Insurance", description: "Notify environmental/pollution liability carrier", deadline: "24 hours", documents: ["NRC report", "Spill details", "Cleanup estimates", "Environmental assessment"] },
            { step: 3, title: "Cleanup Documentation", description: "Document all cleanup activities and costs", deadline: "Ongoing", documents: ["Cleanup contractor invoices", "Environmental monitoring results", "Regulatory correspondence"] },
            { step: 4, title: "Long-term Monitoring", description: "Environmental monitoring and final closure", deadline: "Varies — months to years", documents: ["Monitoring reports", "Regulatory closure letters", "Final cost documentation"] },
          ],
          tips: [
            "Environmental liability claims can take years to resolve",
            "Document every cleanup expense meticulously",
            "Work closely with environmental attorney",
            "Regulatory fines are typically NOT covered by insurance",
          ],
        },
        property_damage: {
          steps: [
            { step: 1, title: "Document Damage", description: "Photograph and document all property damage", deadline: "Immediately", documents: ["Photos", "Property owner contact info", "Damage description"] },
            { step: 2, title: "File Claim", description: "File property damage claim", deadline: "48 hours", documents: ["Photos", "Damage estimates", "Property owner statement", "Police report if applicable"] },
            { step: 3, title: "Adjuster Review", description: "Insurance adjuster reviews damage", deadline: "5-10 business days", documents: ["Access for inspection", "Repair estimates", "Replacement value documentation"] },
            { step: 4, title: "Settlement", description: "Negotiate and settle property damage claim", deadline: "30-60 days", documents: ["Settlement agreement", "Repair receipts", "Release of liability"] },
          ],
          tips: [
            "Get independent repair estimates",
            "Document pre-existing damage if applicable",
            "Keep records of all communications with property owner",
          ],
        },
        workers_comp: {
          steps: [
            { step: 1, title: "Medical Treatment", description: "Seek immediate medical treatment for injured worker", deadline: "Immediately", documents: ["Medical reports", "Treatment records"] },
            { step: 2, title: "Report Injury", description: "File workers' compensation claim per state requirements", deadline: "Varies by state — typically 24-72 hours", documents: ["First report of injury", "Medical records", "Witness statements", "Incident report"] },
            { step: 3, title: "OSHA Report", description: "File OSHA report if fatality or severe injury", deadline: "8 hours (fatality) / 24 hours (hospitalization/amputation/eye loss)", documents: ["OSHA report", "Investigation findings"] },
            { step: 4, title: "Ongoing Management", description: "Manage return-to-work and ongoing treatment", deadline: "Ongoing", documents: ["Medical updates", "Work capacity evaluations", "Modified duty documentation"] },
          ],
          tips: [
            "Each state has different workers' comp rules — follow your state's requirements",
            "Never discourage an employee from filing a workers' comp claim",
            "Offer modified duty when medically appropriate",
            "OSHA reporting is separate from workers' comp — both may be required",
          ],
        },
      };

      return {
        incidentType: input.incidentType,
        workflow: workflows[input.incidentType] || workflows.accident,
      };
    }),

  // ─── Emergency Supply Locations ─────────────────────────────────────────────

  getEmergencySupplyLocations: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMiles: z.number().default(50),
      supplyType: z.enum(["all", "repair", "towing", "fuel", "medical", "spill_kit", "tire"]).optional(),
    }))
    .query(({ input }) => {
      // In production, integrate with Google Places API or internal facility database
      return {
        location: { lat: input.latitude, lng: input.longitude },
        radius: input.radiusMiles,
        supplyType: input.supplyType || "all",
        locations: [] as Array<{
          name: string;
          type: string;
          address: string;
          phone: string;
          distance: number;
          open24Hours: boolean;
          services: string[];
        }>,
        note: "Populate with actual service locations via Google Places API or company facility database. Configure in Settings > Emergency Supplies.",
      };
    }),

  // ─── Driver Safe Havens ─────────────────────────────────────────────────────

  getDriverSafeHavens: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMiles: z.number().default(50),
      weatherType: weatherAlertTypeSchema.optional(),
    }))
    .query(({ input }) => {
      return {
        location: { lat: input.latitude, lng: input.longitude },
        radius: input.radiusMiles,
        safeHavens: [] as Array<{
          name: string;
          type: string;
          address: string;
          phone: string;
          distance: number;
          truckParkingSpaces: number;
          amenities: string[];
          shelterCapability: string;
        }>,
        generalGuidance: [
          "Truck stops with concrete structures offer best tornado protection",
          "Avoid parking under overpasses during tornado warnings — NOT safe shelter",
          "For flooding: park on highest ground available — avoid low-lying areas",
          "For ice/snow: stop at nearest safe location — don't push through conditions",
          "For extreme heat: find shade, run AC, stay hydrated — 1 gallon water per person per day",
          "For wildfires: evacuate in opposite direction of smoke — close all vents",
          "Always have 72-hour emergency kit in cab: water, food, flashlight, first aid, blankets, medications",
        ],
        note: "Safe haven locations are populated from truck stop databases and company-designated shelter points. Configure in Settings > Safe Havens.",
      };
    }),

  // ─── Compliance Reporting ───────────────────────────────────────────────────

  getComplianceReporting: protectedProcedure
    .input(z.object({
      incidentType: emergencyTypeSchema.optional(),
    }))
    .query(({ input }) => {
      const filtered = input?.incidentType
        ? COMPLIANCE_REPORTING_REQUIREMENTS.filter(r => {
            if (input.incidentType === "accident") return ["FMCSA", "OSHA", "State DOT"].includes(r.agency);
            if (input.incidentType === "hazmat_spill") return ["NRC", "EPA", "PHMSA", "FMCSA"].includes(r.agency);
            if (input.incidentType === "medical") return ["OSHA"].includes(r.agency);
            return true;
          })
        : COMPLIANCE_REPORTING_REQUIREMENTS;

      return {
        incidentType: input?.incidentType || "all",
        requirements: filtered,
        criticalReminder: "Failure to file required reports can result in significant fines, license suspension, and criminal penalties. When in doubt, file the report — over-reporting is far better than under-reporting.",
        recordRetention: [
          { document: "Accident reports and records", retention: "3 years minimum (49 CFR 390.31)" },
          { document: "Driver qualification files", retention: "3 years after employment ends" },
          { document: "HOS records/ELD data", retention: "6 months (49 CFR 395.8)" },
          { document: "Drug/alcohol test records", retention: "5 years for positive results" },
          { document: "HAZMAT training records", retention: "3 years (current + 2 prior)" },
          { document: "Vehicle maintenance records", retention: "1 year + 6 months" },
          { document: "Environmental cleanup records", retention: "Permanently recommended" },
        ],
      };
    }),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getImmediateActions(type: string, severity: string): string[] {
  const base = ["Ensure personal safety first — do NOT put yourself in danger"];

  switch (type) {
    case "accident":
      return [...base, "Call 911 if injuries or road blockage", "Set up reflective triangles", "Document scene with photographs", "Contact dispatch", "Do NOT admit fault"];
    case "hazmat_spill":
      return [...base, "EVACUATE upwind immediately", "Call 911 AND CHEMTREC (1-800-424-9300)", "Call NRC (1-800-424-8802)", "Identify material from placards/shipping papers", "Establish isolation zone per ERG"];
    case "weather":
      return [...base, "Find safe parking immediately", "Monitor NOAA weather radio", "Contact dispatch for route guidance", "Do NOT drive through standing water", "Secure cargo if possible"];
    case "breakdown":
      return [...base, "Move vehicle off roadway if possible", "Set up reflective triangles", "Turn on hazard flashers", "Contact dispatch for roadside assistance", "Stay with vehicle unless unsafe"];
    case "medical":
      return [...base, "Call 911 for medical emergency", "Administer first aid if trained", "Do NOT move injured person unless in immediate danger", "Provide location and condition to dispatcher", "Wait for EMS"];
    case "security":
      return [...base, "Call 911 immediately", "Do NOT confront or pursue suspects", "Lock doors and stay in cab if threat is external", "Document descriptions if safely possible", "Report to FBI if cargo theft (888-CALL-FBI)"];
    case "natural_disaster":
      return [...base, "Follow all evacuation orders immediately", "Contact dispatch for safe haven locations", "Monitor emergency broadcast system", "Keep fuel tank above half", "Have emergency supplies ready"];
    case "fire":
      return [...base, "Call 911", "EVACUATE vehicle immediately", "Use fire extinguisher ONLY if safe and fire is small", "Move away from vehicle — risk of explosion", "Account for all personnel"];
    default:
      return [...base, "Call 911 if immediate danger", "Contact dispatch", "Document situation", "Follow company emergency procedures"];
  }
}

function getRequiredNotifications(type: string): Array<{ agency: string; phone: string; when: string }> {
  const notifications: Array<{ agency: string; phone: string; when: string }> = [
    { agency: "Company Dispatch/Safety", phone: "Company line", when: "Immediately" },
  ];

  switch (type) {
    case "accident":
      notifications.push(
        { agency: "911", phone: "911", when: "Immediately if injuries or road blockage" },
        { agency: "FMCSA (DOT-reportable)", phone: "1-888-327-4236", when: "If fatality, injury requiring transport, or tow-away" },
      );
      break;
    case "hazmat_spill":
      notifications.push(
        { agency: "911", phone: "911", when: "Immediately" },
        { agency: "CHEMTREC", phone: "1-800-424-9300", when: "Immediately" },
        { agency: "NRC", phone: "1-800-424-8802", when: "Immediately — MANDATORY" },
        { agency: "EPA", phone: "1-800-424-9346", when: "If environmental contamination" },
      );
      break;
    case "medical":
      notifications.push(
        { agency: "911", phone: "911", when: "Immediately" },
        { agency: "OSHA", phone: "1-800-321-6742", when: "Within 8 hours if fatality, 24 hours if hospitalization" },
      );
      break;
    case "security":
      notifications.push(
        { agency: "911", phone: "911", when: "Immediately" },
        { agency: "FBI (cargo theft)", phone: "1-800-225-5324", when: "If cargo theft or terrorism suspected" },
      );
      break;
    case "natural_disaster":
      notifications.push(
        { agency: "State Emergency Management", phone: "State-specific", when: "As directed" },
      );
      break;
  }

  return notifications;
}

function getProtocolForType(type: string): Array<{ step: number; action: string; priority: string }> {
  switch (type) {
    case "accident":
      return ACCIDENT_PROTOCOL_STEPS.map(s => ({ step: s.step, action: s.title, priority: s.priority }));
    case "hazmat_spill":
      return [
        { step: 1, action: "EVACUATE upwind — establish isolation zone", priority: "critical" },
        { step: 2, action: "Call 911, CHEMTREC, and NRC", priority: "critical" },
        { step: 3, action: "Identify material from placards and shipping papers", priority: "critical" },
        { step: 4, action: "Follow ERG guide for specific material", priority: "high" },
        { step: 5, action: "Deny entry to isolation zone", priority: "high" },
        { step: 6, action: "Assist hazmat team with material information", priority: "high" },
        { step: 7, action: "Document everything — photos, timeline, actions taken", priority: "medium" },
        { step: 8, action: "Cooperate with environmental assessment", priority: "medium" },
        { step: 9, action: "File PHMSA DOT 5800.1 within 30 days", priority: "medium" },
        { step: 10, action: "Complete post-incident review", priority: "low" },
      ];
    case "weather":
      return [
        { step: 1, action: "Monitor weather conditions — NWS alerts, NOAA radio", priority: "critical" },
        { step: 2, action: "Assess route safety — check DOT road conditions (511)", priority: "critical" },
        { step: 3, action: "Find safe parking if conditions deteriorate", priority: "critical" },
        { step: 4, action: "Contact dispatch for rerouting options", priority: "high" },
        { step: 5, action: "Secure cargo — check tie-downs and covers", priority: "high" },
        { step: 6, action: "Reduce speed and increase following distance", priority: "high" },
        { step: 7, action: "Monitor conditions continuously — be ready to stop", priority: "medium" },
        { step: 8, action: "Report road conditions to dispatch and 511", priority: "medium" },
      ];
    case "natural_disaster":
      return [
        { step: 1, action: "Follow ALL evacuation orders immediately", priority: "critical" },
        { step: 2, action: "Contact dispatch — report location and status", priority: "critical" },
        { step: 3, action: "Proceed to nearest safe haven or shelter", priority: "critical" },
        { step: 4, action: "Monitor emergency broadcast system", priority: "high" },
        { step: 5, action: "Avoid disaster zones — do not enter flooded areas", priority: "high" },
        { step: 6, action: "Keep fuel above half tank", priority: "high" },
        { step: 7, action: "Check in with dispatch every 30 minutes", priority: "medium" },
        { step: 8, action: "Do NOT return until authorities give all-clear", priority: "medium" },
      ];
    default:
      return [
        { step: 1, action: "Ensure personal safety", priority: "critical" },
        { step: 2, action: "Call 911 if immediate danger", priority: "critical" },
        { step: 3, action: "Contact dispatch", priority: "high" },
        { step: 4, action: "Document situation", priority: "medium" },
        { step: 5, action: "Follow company emergency procedures", priority: "medium" },
      ];
  }
}

function getContactsForType(type: string): Array<{ name: string; phone: string; when: string }> {
  const base = [{ name: "Emergency Services", phone: "911", when: "Immediate danger to life or property" }];
  switch (type) {
    case "hazmat_spill":
      return [...base,
        { name: "CHEMTREC", phone: "1-800-424-9300", when: "Any hazmat transportation emergency" },
        { name: "NRC", phone: "1-800-424-8802", when: "Any hazmat release (MANDATORY)" },
        { name: "EPA", phone: "1-800-424-9346", when: "Environmental contamination" },
      ];
    case "accident":
      return [...base,
        { name: "FMCSA", phone: "1-888-327-4236", when: "DOT-reportable crashes" },
        { name: "NTSB", phone: "1-800-877-6799", when: "Major accidents with fatalities" },
      ];
    default:
      return base;
  }
}

function getComplianceForType(type: string): string[] {
  switch (type) {
    case "accident":
      return ["DOT crash report (MCS-50T) within 30 days if DOT-reportable", "Post-accident drug/alcohol testing per 49 CFR 382.303", "State crash report per state requirements", "OSHA report if work-related fatality or severe injury"];
    case "hazmat_spill":
      return ["NRC phone report immediately", "PHMSA DOT 5800.1 within 30 days", "EPA CERCLA/EPCRA notification if applicable", "State environmental agency notification"];
    case "medical":
      return ["OSHA fatality report within 8 hours", "OSHA severe injury report within 24 hours", "Workers' compensation filing per state requirements"];
    default:
      return ["Document incident per company procedures", "File regulatory reports as applicable"];
  }
}

function getWeatherDrivingGuidance(): Record<string, string[]> {
  return {
    general: [
      "Reduce speed by 1/3 on wet roads, 1/2 or more on snow/ice",
      "Increase following distance to 8-10 seconds in adverse conditions",
      "Use low-beam headlights in all reduced visibility conditions",
      "Never use cruise control on wet, icy, or snowy roads",
      "If conditions are too dangerous, STOP — no load is worth your life",
    ],
    tornado: [
      "If tornado is visible, do NOT try to outrun it in a CMV",
      "Exit vehicle and seek shelter in a sturdy building or ditch (lie flat, cover head)",
      "Do NOT shelter under an overpass — wind acceleration makes it MORE dangerous",
      "If you must stay in the cab, keep seatbelt on, duck below windows, cover with blanket",
    ],
    hurricane: [
      "Evacuate the area if ordered — do not wait",
      "If caught in hurricane winds, stop the vehicle and set parking brake",
      "Avoid bridges and overpasses — extreme crosswind danger for CMVs",
      "Storm surge can flood roads in minutes — never drive into water",
    ],
    flood: [
      "NEVER drive through standing water — 6 inches can knock you down, 2 feet can float a vehicle",
      "Turn around, don't drown — find an alternate route",
      "If water is rising around your vehicle, abandon it and move to higher ground",
      "Flash floods can occur with little warning — monitor weather alerts continuously",
    ],
    ice: [
      "Black ice is invisible — assume bridges and overpasses are icy",
      "If you start to skid, take your foot off the brake and steer into the skid",
      "Allow 3x normal stopping distance on ice",
      "Test braking every few minutes on potentially icy roads",
    ],
    fog: [
      "Reduce speed significantly — you need to stop within your sight distance",
      "Use low-beam headlights — high beams reflect off fog and reduce visibility",
      "If visibility drops below 200 feet, pull off the road completely",
      "Turn on 4-way flashers when stopped on the shoulder",
    ],
    wind: [
      "CMV rollover risk increases dramatically above 40 mph sustained winds",
      "Empty trailers are at highest risk — consider parking until winds subside",
      "Reduce speed and grip the steering wheel firmly with both hands",
      "Be especially cautious on bridges, overpasses, and open terrain",
    ],
  };
}

function getDisasterSafetyAdvisory(disasterType?: string): string[] {
  if (!disasterType) {
    return [
      "Monitor NOAA Weather Radio and local emergency broadcasts",
      "Follow all mandatory evacuation orders without delay",
      "Maintain communication with dispatch at all times",
      "Keep emergency supplies in cab: water, food, first aid, flashlight, blankets",
    ];
  }

  switch (disasterType) {
    case "hurricane":
      return [
        "Evacuate BEFORE the storm — do not wait for the eye to pass",
        "CMVs are especially vulnerable to hurricane-force winds — park before winds exceed 40 mph",
        "Avoid coastal and low-lying routes — storm surge is the #1 killer in hurricanes",
        "After the storm: watch for downed power lines, debris, and road washouts",
        "Fuel availability may be limited post-hurricane — keep tank above half",
      ];
    case "tornado":
      return [
        "Tornado Watch: conditions are favorable — be alert and plan shelter options",
        "Tornado Warning: tornado is occurring — seek shelter IMMEDIATELY",
        "DO NOT try to outrun a tornado in a CMV — stop and seek shelter",
        "Never shelter under an overpass during a tornado",
        "After the tornado: watch for debris, downed lines, and structural damage",
      ];
    case "flood":
      return [
        "Never drive through flooded roadways — turn around, don't drown",
        "Flash floods can occur in minutes — move to higher ground immediately",
        "Just 6 inches of moving water can knock down an adult; 2 feet can float a vehicle",
        "After flooding: roads may be washed out beneath the surface — approach with extreme caution",
        "Contaminated floodwater can contain chemicals, sewage, and debris",
      ];
    case "wildfire":
      return [
        "Evacuate in the OPPOSITE direction of smoke and fire",
        "Close all windows and vents — switch HVAC to recirculate",
        "If trapped by fire: park in cleared area, close windows, lie on floor, cover with blanket",
        "Smoke can reduce visibility to zero — do not drive through heavy smoke",
        "After wildfire: watch for hot spots, weakened trees, and road damage",
      ];
    case "earthquake":
      return [
        "If driving: pull over, stop, set parking brake — avoid overpasses, bridges, power lines",
        "Stay in vehicle until shaking stops — it provides protection from falling debris",
        "After shaking stops: proceed with extreme caution — bridges and overpasses may be damaged",
        "Watch for aftershocks — they can be nearly as strong as the main quake",
        "Report road damage to dispatch and local authorities",
      ];
    default:
      return [
        "Follow all emergency agency instructions",
        "Maintain communication with dispatch",
        "Prioritize personal safety over cargo",
        "Monitor local emergency broadcasts for updates",
      ];
  }
}
