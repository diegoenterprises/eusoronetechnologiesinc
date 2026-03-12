const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'eusotrip-mysql.mysql.database.azure.com',
    user: 'eusotripadmin',
    password: 'EusoTrip2026Prod!',
    database: 'eusotrip',
    port: 3306,
    ssl: { rejectUnauthorized: true },
  });
  console.log('Connected');

  // Get course IDs by slug
  const [courses] = await conn.execute('SELECT id, slug FROM training_courses');
  const cMap = {};
  for (const c of courses) cMap[c.slug] = c.id;
  console.log('Courses loaded:', Object.keys(cMap).length);

  // Module definitions: [courseSlug, orderIndex, title, description, contentType, durationMin]
  const modules = [
    // HOS Compliance Mastery (6 modules)
    ['hos-compliance-mastery', 1, 'Introduction to HOS Regulations', 'Overview of FMCSA Hours of Service rules, history, and purpose', 'text', 60],
    ['hos-compliance-mastery', 2, '11-Hour Driving & 14-Hour Duty Limits', 'Deep dive into daily driving and on-duty time limits', 'text', 90],
    ['hos-compliance-mastery', 3, '60/70-Hour Limits & 34-Hour Restart', 'Weekly cumulative limits and restart provisions', 'text', 80],
    ['hos-compliance-mastery', 4, 'Sleeper Berth Provisions', 'Split sleeper berth rules and 7/3 split options', 'text', 80],
    ['hos-compliance-mastery', 5, 'Exemptions & Special Rules', 'Short-haul, adverse driving, agricultural exemptions', 'text', 90],
    ['hos-compliance-mastery', 6, 'HOS Violations & Enforcement', 'Common violations, penalties, and out-of-service criteria', 'quiz', 80],

    // FMCSA Safety Audit Preparation (5 modules)
    ['fmcsa-safety-audit-preparation', 1, 'Understanding Safety Audits & Reviews', 'Types of FMCSA audits: new entrant, compliance review, focused review', 'text', 60],
    ['fmcsa-safety-audit-preparation', 2, 'Driver Qualification Files (DQ Files)', 'Required documents, medical certificates, MVR reviews', 'text', 80],
    ['fmcsa-safety-audit-preparation', 3, 'Vehicle Maintenance & Inspection Records', 'Annual inspections, preventive maintenance, DVIR requirements', 'text', 70],
    ['fmcsa-safety-audit-preparation', 4, 'Drug & Alcohol Testing Program Audit', 'Random pool compliance, MRO records, clearinghouse queries', 'text', 80],
    ['fmcsa-safety-audit-preparation', 5, 'Insurance & Financial Responsibility', 'BMC-91 filing, MCS-90, cargo insurance requirements', 'quiz', 70],

    // Hazmat Transportation Certification (8 modules)
    ['hazmat-transportation-certification', 1, 'Hazmat Classification System', '9 hazard classes, divisions, and proper identification', 'text', 90],
    ['hazmat-transportation-certification', 2, 'Shipping Papers & Documentation', 'Proper shipping names, UN/NA numbers, emergency contacts', 'text', 90],
    ['hazmat-transportation-certification', 3, 'Marking & Labeling Requirements', 'Package marking, hazard labels, and orientation arrows', 'text', 80],
    ['hazmat-transportation-certification', 4, 'Placarding Requirements', 'Vehicle placarding rules, tables 1 & 2, subsidiary placards', 'text', 80],
    ['hazmat-transportation-certification', 5, 'Packaging & Containment', 'UN packaging standards, performance testing, specification packaging', 'text', 90],
    ['hazmat-transportation-certification', 6, 'Loading & Unloading Procedures', 'Segregation tables, securement, temperature controls', 'text', 90],
    ['hazmat-transportation-certification', 7, 'Emergency Response & ERG', 'Using the Emergency Response Guidebook, isolation distances', 'interactive', 100],
    ['hazmat-transportation-certification', 8, 'Security Plans & Incident Reporting', 'Hazmat security plans, release reporting requirements', 'quiz', 100],

    // ELD Compliance & Operation (4 modules)
    ['eld-compliance-operation', 1, 'ELD Mandate Overview', 'Who must use ELDs, exemptions, AOBRD transition', 'text', 60],
    ['eld-compliance-operation', 2, 'Daily ELD Operation', 'Status changes, annotations, RODS editing, unassigned time', 'interactive', 60],
    ['eld-compliance-operation', 3, 'Malfunctions & Diagnostics', 'Malfunction criteria, diagnostic events, paper log fallback', 'text', 60],
    ['eld-compliance-operation', 4, 'Roadside Inspections & Data Transfer', 'Web services, email, Bluetooth transfer methods', 'quiz', 60],

    // Driver Wellness & Fatigue Management (4 modules)
    ['driver-wellness-fatigue-management', 1, 'Understanding Driver Fatigue', 'Circadian rhythms, fatigue warning signs, crash statistics', 'text', 45],
    ['driver-wellness-fatigue-management', 2, 'Sleep Hygiene & Sleep Disorders', 'Sleep apnea screening, CPAP compliance, rest strategies', 'text', 45],
    ['driver-wellness-fatigue-management', 3, 'Nutrition & Physical Fitness', 'Healthy eating on the road, exercise routines, hydration', 'text', 45],
    ['driver-wellness-fatigue-management', 4, 'Mental Health & Stress Management', 'Isolation coping, family separation, substance abuse prevention', 'quiz', 45],

    // Defensive Driving for CMV (5 modules)
    ['defensive-driving-cmv', 1, 'Space Management & Following Distance', 'Proper following distance for CMVs, space cushion management', 'text', 60],
    ['defensive-driving-cmv', 2, 'Speed Management & Stopping Distance', 'Speed adaptation, brake lag, total stopping distance calculations', 'text', 60],
    ['defensive-driving-cmv', 3, 'Hazard Perception & Scanning', 'Mirror usage, blind spots, intersection scanning patterns', 'interactive', 60],
    ['defensive-driving-cmv', 4, 'Night & Adverse Condition Driving', 'Reduced visibility techniques, rain, fog, glare management', 'text', 60],
    ['defensive-driving-cmv', 5, 'Emergency Maneuvers', 'Evasive steering, controlled braking, tire blowout recovery', 'quiz', 60],

    // Cargo Securement Standards (5 modules)
    ['cargo-securement-standards', 1, 'General Securement Requirements', 'Working load limits, aggregate WLL, deceleration forces', 'text', 60],
    ['cargo-securement-standards', 2, 'Tiedown Assemblies & Devices', 'Chains, straps, binders, anchor points, D-ring ratings', 'text', 60],
    ['cargo-securement-standards', 3, 'Blocking & Bracing Techniques', 'Friction mats, chocks, bulkheads, void fillers', 'text', 60],
    ['cargo-securement-standards', 4, 'Commodity-Specific Rules', 'Logs, metal coils, paper rolls, vehicles, heavy equipment', 'text', 60],
    ['cargo-securement-standards', 5, 'Inspection & Enforcement', 'En-route inspections, violation severity, OOS criteria', 'quiz', 60],

    // Pre-Trip & Post-Trip Inspection (4 modules)
    ['pre-trip-post-trip-inspection', 1, 'Legal Requirements & DVIR', '49 CFR 396.11/396.13, defect reporting, carrier response', 'text', 60],
    ['pre-trip-post-trip-inspection', 2, 'Engine Compartment & Cab Inspection', 'Fluid levels, belts, steering, instruments, safety equipment', 'interactive', 60],
    ['pre-trip-post-trip-inspection', 3, 'Exterior Walkabout & Coupling', 'Tires, wheels, brakes, lights, fifth wheel, glad hands', 'interactive', 60],
    ['pre-trip-post-trip-inspection', 4, 'Post-Trip Procedures & Documentation', 'End-of-day inspection, defect reporting, maintenance requests', 'quiz', 60],

    // Drug & Alcohol Compliance (5 modules)
    ['drug-alcohol-compliance', 1, 'Federal D&A Testing Requirements', '49 CFR Part 40 and 382 overview, covered employees', 'text', 60],
    ['drug-alcohol-compliance', 2, 'Testing Categories & Procedures', 'Pre-employment, random, post-accident, reasonable suspicion', 'text', 60],
    ['drug-alcohol-compliance', 3, 'FMCSA Clearinghouse', 'Registration, queries, reporting requirements, consent', 'text', 60],
    ['drug-alcohol-compliance', 4, 'Positive Results & Return to Duty', 'SAP evaluation, follow-up testing, RTD process', 'text', 60],
    ['drug-alcohol-compliance', 5, 'Supervisor Training & Reasonable Suspicion', 'Behavioral indicators, documentation, confrontation', 'quiz', 60],

    // CSA Score Management (5 modules)
    ['csa-score-management', 1, 'CSA SMS Methodology Overview', 'Seven BASICs categories, percentile rankings, peer groups', 'text', 70],
    ['csa-score-management', 2, 'Understanding BASICs Scores', 'Time weighting, severity weighting, violation groups', 'text', 70],
    ['csa-score-management', 3, 'Intervention Thresholds & Alerts', 'Warning letters, investigations, cooperative safety plans', 'text', 70],
    ['csa-score-management', 4, 'DataQs Challenge Process', 'Filing challenges, supporting evidence, timeline expectations', 'interactive', 70],
    ['csa-score-management', 5, 'Improving CSA Performance', 'Driver coaching, preventive maintenance, compliance culture', 'quiz', 80],

    // Canadian TDG Certification (7 modules)
    ['canadian-tdg-certification', 1, 'TDG Act & Regulations Overview', 'Canadian TDG framework, classes and divisions, TDGR', 'text', 80],
    ['canadian-tdg-certification', 2, 'Classification of Dangerous Goods', 'Classification process, precedence of classes, special provisions', 'text', 90],
    ['canadian-tdg-certification', 3, 'Documentation Requirements', 'Shipping documents, ERAP certificates, 24-month retention', 'text', 80],
    ['canadian-tdg-certification', 4, 'Safety Marks: Labels & Placards', 'Label specifications, placard requirements, UN number display', 'text', 80],
    ['canadian-tdg-certification', 5, 'Means of Containment', 'Container standards, selection criteria, inspection', 'text', 90],
    ['canadian-tdg-certification', 6, 'Emergency Response (CANUTEC)', 'CANUTEC services, ERAP, response procedures', 'interactive', 90],
    ['canadian-tdg-certification', 7, 'Reporting & Provincial Variations', 'Release reporting, provincial rules (AB, ON, QC specifics)', 'quiz', 90],

    // Canadian HOS & ELD Rules (5 modules)
    ['canadian-hos-eld-rules', 1, 'Canadian HOS Framework', 'SOR/2005-313 overview, federal vs provincial jurisdiction', 'text', 80],
    ['canadian-hos-eld-rules', 2, 'Daily & Cycle Limits', '13-hr driving, 14-hr on-duty, Cycle 1 (7-day) and Cycle 2 (14-day)', 'text', 90],
    ['canadian-hos-eld-rules', 3, 'Off-Duty & Sleeper Berth', 'Mandatory off-duty periods, sleeper berth splits, deferral', 'text', 80],
    ['canadian-hos-eld-rules', 4, 'Canadian ELD Technical Standard', 'CAN/CSA-ELD standard, certification, approved devices', 'text', 90],
    ['canadian-hos-eld-rules', 5, 'Provincial Variations & Enforcement', 'Alberta, Ontario, Quebec specific rules, penalties', 'quiz', 80],

    // NOM para Transporte (5 modules)
    ['normas-oficiales-mexicanas-transporte', 1, 'Mexican Transport Regulatory Framework', 'SCT authority, NOM system, autotransporte federal', 'text', 70],
    ['normas-oficiales-mexicanas-transporte', 2, 'NOM-012-SCT: Weight & Dimensions', 'Maximum weights, axle loads, vehicle configurations', 'text', 70],
    ['normas-oficiales-mexicanas-transporte', 3, 'NOM-002-SCT: Hazardous Materials', 'Mexican hazmat classification, compatibility, documentation', 'text', 80],
    ['normas-oficiales-mexicanas-transporte', 4, 'Licencia Federal de Conductor', 'Federal driver license categories, medical requirements, renewal', 'text', 70],
    ['normas-oficiales-mexicanas-transporte', 5, 'SCT Inspections & Compliance', 'Verification centers, penalties, modernization programs', 'quiz', 70],

    // Cross-Border US-Canada (6 modules)
    ['cross-border-us-canada', 1, 'Cross-Border Framework Overview', 'NAFTA/USMCA provisions, bilateral agreements, cabotage rules', 'text', 80],
    ['cross-border-us-canada', 2, 'FAST Card & Trusted Trader Programs', 'FAST enrollment, C-TPAT, PIP, benefits at border', 'text', 80],
    ['cross-border-us-canada', 3, 'Customs Documentation', 'ACE manifest, ACI eManifest, commercial invoices, PARS/PAPS', 'text', 80],
    ['cross-border-us-canada', 4, 'Insurance & Registration Requirements', 'Insurance reciprocity, IRP, IFTA cross-border provisions', 'text', 80],
    ['cross-border-us-canada', 5, 'HOS Reconciliation Between Jurisdictions', 'When US rules apply vs Canadian rules, border crossing logs', 'text', 80],
    ['cross-border-us-canada', 6, 'Hazmat Cross-Border Protocols', 'TDG vs PHMSA equivalencies, documentation bridging', 'quiz', 80],

    // Cross-Border US-Mexico (6 modules)
    ['cross-border-us-mexico', 1, 'US-Mexico Trucking Framework', 'Bilateral agreements, long-haul pilot program, zone restrictions', 'text', 80],
    ['cross-border-us-mexico', 2, 'C-TPAT & Security Requirements', 'C-TPAT enrollment, supply chain security, driver vetting', 'text', 80],
    ['cross-border-us-mexico', 3, 'Customs & Border Processing', 'CBP procedures, commercial zones, Form 7533, drayage', 'text', 80],
    ['cross-border-us-mexico', 4, 'Mexican Vehicle & Insurance Requirements', 'SCT permits, Mexican liability insurance, vehicle standards', 'text', 80],
    ['cross-border-us-mexico', 5, 'Maquiladora & Free Trade Zone Operations', 'In-bond movements, IMMEX program, twin-plant operations', 'text', 80],
    ['cross-border-us-mexico', 6, 'Safety Standards & Enforcement', 'FMCSA oversight of Mexican carriers, inspection requirements', 'quiz', 80],

    // Winter Driving & Extreme Weather (5 modules)
    ['winter-driving-extreme-weather', 1, 'Winter Driving Fundamentals', 'Reduced traction, increased stopping distance, black ice', 'text', 60],
    ['winter-driving-extreme-weather', 2, 'Tire Chains & Traction Devices', 'Chain law states/provinces, installation, speed limits', 'interactive', 60],
    ['winter-driving-extreme-weather', 3, 'Mountain Pass & Grade Driving', 'Descent techniques, jake brake usage, runaway ramps', 'text', 60],
    ['winter-driving-extreme-weather', 4, 'Extreme Heat & Tire Management', 'Tire pressure monitoring, blowout prevention, heat indexes', 'text', 60],
    ['winter-driving-extreme-weather', 5, 'Fog, Wind & Flood Conditions', 'Low visibility protocols, high-profile vehicle wind, water depth', 'quiz', 60],

    // Tanker Vehicle Operations (6 modules)
    ['tanker-vehicle-operations', 1, 'Tanker Vehicle Types & Configurations', 'MC-306/DOT-406, MC-307/DOT-407, MC-312/DOT-412 specifications', 'text', 70],
    ['tanker-vehicle-operations', 2, 'Liquid Surge & Center of Gravity', 'Surge dynamics, baffled vs smooth bore, partial loads', 'text', 70],
    ['tanker-vehicle-operations', 3, 'Rollover Prevention', 'Speed on curves, load distribution, emergency maneuvers', 'interactive', 70],
    ['tanker-vehicle-operations', 4, 'Loading & Unloading Procedures', 'Grounding, bonding, vapor recovery, overfill protection', 'text', 70],
    ['tanker-vehicle-operations', 5, 'Tank Inspection & Maintenance', 'Hydrostatic testing, visual inspections, valve maintenance', 'text', 70],
    ['tanker-vehicle-operations', 6, 'Emergency Procedures', 'Tank rupture response, product containment, evacuation', 'quiz', 70],

    // Oversize/Overweight Load (5 modules)
    ['oversize-overweight-load-compliance', 1, 'Federal Bridge Formula & Weight Limits', 'Bridge formula calculations, federal weight limits, tandem/tridem', 'text', 70],
    ['oversize-overweight-load-compliance', 2, 'State Permit Requirements', 'Single trip vs annual permits, state-by-state variations', 'text', 70],
    ['oversize-overweight-load-compliance', 3, 'Route Planning & Surveys', 'Bridge clearances, overhead obstructions, turning radius', 'interactive', 80],
    ['oversize-overweight-load-compliance', 4, 'Escort & Pilot Car Requirements', 'Front/rear escorts, flagging, sign requirements, communication', 'text', 70],
    ['oversize-overweight-load-compliance', 5, 'Loading, Securement & Travel Restrictions', 'Time-of-day restrictions, weekend/holiday blackouts, lighting', 'quiz', 70],

    // Accident Reporting & Post-Crash (4 modules)
    ['accident-reporting-post-crash', 1, 'Immediate Post-Accident Response', 'Scene safety, emergency contacts, first aid, hazard mitigation', 'text', 60],
    ['accident-reporting-post-crash', 2, 'DOT Reportable Crash Criteria', 'Fatality, injury requiring transport, tow-away thresholds', 'text', 60],
    ['accident-reporting-post-crash', 3, 'Post-Accident Drug & Alcohol Testing', 'Testing triggers, 8-hour/32-hour windows, documentation', 'text', 60],
    ['accident-reporting-post-crash', 4, 'Documentation & Reporting Requirements', 'Scene documentation, photos, witness info, carrier reporting', 'quiz', 60],

    // Environmental Compliance (5 modules)
    ['environmental-compliance-trucking', 1, 'EPA SmartWay Program', 'SmartWay partnership, fleet benchmarking, technology adoption', 'text', 60],
    ['environmental-compliance-trucking', 2, 'Emissions Standards & DEF', 'GHG Phase 2 standards, diesel exhaust fluid, DPF maintenance', 'text', 60],
    ['environmental-compliance-trucking', 3, 'Idle Reduction Technologies', 'APUs, battery HVAC, shore power, state idle laws', 'text', 60],
    ['environmental-compliance-trucking', 4, 'CARB California Regulations', 'Truck & bus rule, CARB compliance, drayage requirements', 'text', 60],
    ['environmental-compliance-trucking', 5, 'Spill Prevention & Environmental Response', 'Fuel spill cleanup, EPA reporting, SPCC plans', 'quiz', 60],
  ];

  console.log('Inserting', modules.length, 'modules...');
  let ok = 0;
  for (const m of modules) {
    const courseId = cMap[m[0]];
    if (!courseId) { console.log('  SKIP (no course):', m[0]); continue; }
    try {
      await conn.execute(
        `INSERT INTO lms_modules (courseId, orderIndex, title, description, contentType, estimatedDurationMinutes, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [courseId, m[1], m[2], m[3], m[4], m[5]]
      );
      ok++;
    } catch (e) {
      console.log('  ERR:', m[2], e.message.substring(0, 80));
    }
  }
  console.log('Modules inserted:', ok);

  const [count] = await conn.execute('SELECT COUNT(*) as c FROM lms_modules');
  console.log('Total modules in DB:', count[0].c);
  await conn.end();
  console.log('DONE');
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
