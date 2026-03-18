/**
 * V5 MULTI-MODAL: SEED 22 NEW TRAINING COURSES (Rail + Maritime)
 * Run: cd frontend && npx tsx scripts/seed-v5-training-courses.ts
 *
 * 10 Rail courses + 12 Maritime courses
 * All status: "active", publishedAt: NOW(), passing_score: 80
 */
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { trainingCourses } from "../drizzle/schema";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "";

async function main() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  console.log("V5 Training Courses Seed Starting...\n");

  await seedRailCourses(db);
  await seedMaritimeCourses(db);

  // Verify
  const [count] = await db.execute(
    sql`SELECT COUNT(*) as total FROM training_courses`
  );
  console.log("\nTotal training courses:", (count as any)[0]?.total);
  console.log("V5 Training Courses Seed Complete!");
  await connection.end();
}

async function seedRailCourses(db: any) {
  console.log("[V5] Seeding 10 Rail training courses...");

  const railCourses = [
    {
      slug: "fra-railroad-safety",
      title: "FRA Railroad Safety Rules",
      description:
        "Comprehensive overview of Federal Railroad Administration safety regulations covering track standards, signal systems, operating practices, and accident reporting under 49 CFR Parts 200-299.",
      longDescription:
        "This course covers the full spectrum of FRA railroad safety regulations including track safety standards (Part 213), signal and train control (Part 236), railroad operating rules (Part 217), and accident/incident reporting (Part 225). Students will learn how to identify safety violations, implement corrective action plans, and maintain compliance with all applicable FRA regulations.",
      category: "compliance" as const,
      countryScope: ["US"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_ENGINEER", "RAIL_CONDUCTOR", "RAIL_DISPATCHER"],
      renewalIntervalMonths: 24,
      regulatoryReference: "49 CFR Parts 200-299",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["fra", "railroad", "safety", "compliance", "rail"],
      keywords: ["FRA", "railroad safety", "49 CFR", "track standards", "signal systems"],
      publishedAt: new Date(),
    },
    {
      slug: "locomotive-engineer-cert",
      title: "Locomotive Engineer Certification",
      description:
        "Complete certification program for locomotive engineers covering operating rules, air brake systems, physical requirements, and qualification standards under 49 CFR Part 240.",
      longDescription:
        "This course prepares candidates for FRA locomotive engineer certification under 49 CFR Part 240. Topics include qualification standards, knowledge testing requirements, skills performance testing, physical fitness standards, and the certification revocation process. Includes modules on territorial qualification, speed restrictions, and emergency procedures.",
      category: "specialized" as const,
      countryScope: ["US"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 5,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_ENGINEER"],
      renewalIntervalMonths: 36,
      regulatoryReference: "49 CFR Part 240",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["locomotive", "engineer", "certification", "part240", "rail"],
      keywords: ["locomotive engineer", "certification", "Part 240", "operating rules"],
      publishedAt: new Date(),
    },
    {
      slug: "conductor-certification",
      title: "Conductor Certification",
      description:
        "Complete certification program for conductors covering train handling, switching operations, passenger safety, and qualification standards under 49 CFR Part 242.",
      longDescription:
        "This course covers all requirements for FRA conductor certification under 49 CFR Part 242. Topics include conductor responsibilities, train handling rules, switching operations, blue signal protection, passenger train emergency procedures, and the certification/decertification process. Emphasizes the critical differences between conductor and engineer responsibilities.",
      category: "specialized" as const,
      countryScope: ["US"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 5,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_CONDUCTOR"],
      renewalIntervalMonths: 36,
      regulatoryReference: "49 CFR Part 242",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["conductor", "certification", "part242", "rail"],
      keywords: ["conductor certification", "Part 242", "switching", "train handling"],
      publishedAt: new Date(),
    },
    {
      slug: "rail-hazmat-transport",
      title: "Rail Hazmat Transportation",
      description:
        "Hazardous materials transportation by rail covering DOT/PHMSA requirements, placarding, emergency response, and the unique challenges of bulk rail hazmat shipments under 49 CFR Parts 171-180.",
      longDescription:
        "This course addresses hazmat transportation specific to rail operations. Topics include rail-specific placarding and marking requirements, tank car specifications (DOT-111, DOT-117), train placement rules for hazmat cars, key train requirements, speed restrictions for hazmat trains, emergency response procedures, and the critical differences between highway and rail hazmat regulations. Cross-border considerations for US/Canada/Mexico are included.",
      category: "hazmat" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 210,
      moduleCount: 5,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_ENGINEER", "RAIL_CONDUCTOR", "RAIL_DISPATCHER"],
      renewalIntervalMonths: 36,
      regulatoryReference: "49 CFR Parts 171-180",
      hazmatSpecific: true,
      crossBorder: true,
      status: "active" as const,
      passingScore: 80,
      tags: ["hazmat", "rail", "tank-car", "dot117", "cross-border"],
      keywords: ["rail hazmat", "tank car", "DOT-117", "placarding", "key train"],
      publishedAt: new Date(),
    },
    {
      slug: "train-dispatching-ops",
      title: "Train Dispatching Operations",
      description:
        "Advanced dispatching operations covering track warrant control, direct traffic control, centralized traffic control, and dispatcher responsibilities under 49 CFR Parts 236 and 241.",
      longDescription:
        "This course covers the full range of train dispatching operations including track warrant control (TWC), direct traffic control (DTC), centralized traffic control (CTC), and automatic block signal (ABS) territory management. Students learn about dispatcher qualifications, mandatory directives, speed restrictions, track authority management, and emergency response coordination. Includes the dispatcher hours of service rules unique to dispatching operations.",
      category: "specialized" as const,
      countryScope: ["US"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 5,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_DISPATCHER"],
      renewalIntervalMonths: 24,
      regulatoryReference: "49 CFR Parts 236, 241",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["dispatching", "twc", "ctc", "part241", "rail"],
      keywords: ["train dispatching", "track warrant", "CTC", "Part 241"],
      publishedAt: new Date(),
    },
    {
      slug: "rail-yard-safety",
      title: "Rail Yard Safety",
      description:
        "Rail yard safety procedures including blue signal protection, switching operations, track vehicle safety, and employee on-track safety under 49 CFR Part 218.",
      longDescription:
        "This course covers safety procedures specific to rail yard operations. Topics include blue signal protection (Subpart C), derail usage, employee on-track safety, switching operations safety, shoving and pushing movements, remote control locomotive operations, and hazard awareness in yard environments. Students learn the critical safety rules that prevent injuries and fatalities in high-risk yard operations.",
      category: "safety" as const,
      countryScope: ["US"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_CONDUCTOR", "RAIL_ENGINEER"],
      renewalIntervalMonths: 12,
      regulatoryReference: "49 CFR Part 218",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["yard-safety", "blue-signal", "switching", "part218", "rail"],
      keywords: ["rail yard", "blue signal", "switching safety", "Part 218"],
      publishedAt: new Date(),
    },
    {
      slug: "grade-crossing-safety",
      title: "Grade Crossing Safety",
      description:
        "Highway-rail grade crossing safety covering warning systems, locomotive horn requirements, quiet zones, and incident prevention under 49 CFR Part 234.",
      longDescription:
        "This course covers highway-rail grade crossing safety regulations and best practices. Topics include warning system maintenance, locomotive horn requirements (Part 222/228), quiet zone establishment, grade crossing signal testing, incident investigation and reporting, and the Operation Lifesaver program. All rail roles must understand grade crossing safety as it is one of the leading causes of rail-related fatalities.",
      category: "safety" as const,
      countryScope: ["US"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 150,
      moduleCount: 3,
      isMandatory: true,
      mandatoryForRoles: [
        "RAIL_SHIPPER", "RAIL_CATALYST", "RAIL_DISPATCHER",
        "RAIL_ENGINEER", "RAIL_CONDUCTOR", "RAIL_BROKER",
      ],
      renewalIntervalMonths: 24,
      regulatoryReference: "49 CFR Part 234",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["grade-crossing", "safety", "horn", "part234", "rail"],
      keywords: ["grade crossing", "warning system", "quiet zone", "Part 234"],
      publishedAt: new Date(),
    },
    {
      slug: "air-brakes-rail",
      title: "Air Brake Systems (Rail)",
      description:
        "Rail air brake systems covering automatic brake valve operation, end-of-train devices, brake inspections, and the train air brake system under 49 CFR Part 232.",
      longDescription:
        "This course provides comprehensive training on rail air brake systems. Topics include the basic pneumatic principles, automatic air brake systems, dynamic braking, end-of-train (EOT) devices, Class I/IA/II/III brake inspections, single-car testing, brake pipe gradient, train handling in mountainous territory, and emergency brake applications. Critical differences from highway vehicle air brakes are emphasized throughout.",
      category: "equipment" as const,
      countryScope: ["US"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 210,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_ENGINEER", "RAIL_CONDUCTOR"],
      renewalIntervalMonths: 24,
      regulatoryReference: "49 CFR Part 232",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["air-brakes", "eot", "brake-inspection", "part232", "rail"],
      keywords: ["air brakes", "EOT device", "brake inspection", "Part 232"],
      publishedAt: new Date(),
    },
    {
      slug: "rail-hours-of-service",
      title: "Rail Hours of Service",
      description:
        "Rail hours of service rules covering the 12-hour rule, limbo time, 276-hour monthly cap, and mandatory rest periods under 49 CFR Part 228.",
      longDescription:
        "This course covers the Federal Hours of Service Act (49 USC 21103) and implementing regulations at 49 CFR Part 228. Topics include the 12-hour on-duty limit for train employees, the critical distinction from trucking HOS (no driving/on-duty split), limbo time rules, the 10-hour mandatory rest period, the 276-hour monthly cap, communication-based exceptions, and electronic recordkeeping requirements. Emphasis on how rail HOS differs fundamentally from FMCSA trucking HOS.",
      category: "compliance" as const,
      countryScope: ["US"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_ENGINEER", "RAIL_CONDUCTOR", "RAIL_DISPATCHER"],
      renewalIntervalMonths: 12,
      regulatoryReference: "49 CFR Part 228",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["hours-of-service", "hos", "12-hour-rule", "part228", "rail"],
      keywords: ["rail HOS", "12-hour rule", "limbo time", "Part 228", "276-hour cap"],
      publishedAt: new Date(),
    },
    {
      slug: "intermodal-operations",
      title: "Intermodal Operations",
      description:
        "Intermodal freight operations covering container handling, chassis management, drayage coordination, and cross-modal documentation across truck, rail, and vessel modes.",
      longDescription:
        "This course covers intermodal freight transportation across truck, rail, and vessel modes. Topics include container types and specifications, intermodal loading and securement (AAR Circular OT-55), chassis management and maintenance, drayage operations, intermodal marketing company (IMC) operations, cross-modal documentation requirements, customs and border procedures for international intermodal, and technology systems (EDI, AEI readers). Cross-border considerations for US/Canada/Mexico included.",
      category: "specialized" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["RAIL_DISPATCHER", "RAIL_BROKER"],
      renewalIntervalMonths: 24,
      regulatoryReference: "AAR Circular OT-55, 49 CFR",
      hazmatSpecific: false,
      crossBorder: true,
      status: "active" as const,
      passingScore: 80,
      tags: ["intermodal", "container", "drayage", "cross-border", "rail"],
      keywords: ["intermodal", "container", "chassis", "drayage", "OT-55"],
      publishedAt: new Date(),
    },
  ];

  for (const course of railCourses) {
    const existing = await db
      .select({ id: trainingCourses.id })
      .from(trainingCourses)
      .where(sql`slug = ${course.slug}`)
      .limit(1);
    if (existing.length > 0) {
      console.log(`  -> ${course.slug} already exists, skipping.`);
      continue;
    }
    await db.insert(trainingCourses).values(course);
    console.log(`  + ${course.slug}`);
  }
  console.log("  Rail courses done.");
}

async function seedMaritimeCourses(db: any) {
  console.log("[V5] Seeding 12 Maritime training courses...");

  const maritimeCourses = [
    {
      slug: "stcw-basic-safety",
      title: "STCW Basic Safety Training",
      description:
        "Standards of Training, Certification and Watchkeeping basic safety training covering personal survival, fire prevention, first aid, and personal safety under the STCW Convention and 46 CFR Part 11.",
      longDescription:
        "This course covers the four mandatory STCW basic safety training components: Personal Survival Techniques (A-VI/1-1), Fire Prevention and Fire Fighting (A-VI/1-2), Elementary First Aid (A-VI/1-3), and Personal Safety and Social Responsibilities (A-VI/1-4). Required for all seafarers before service on any seagoing vessel. Includes practical exercises and assessments per STCW Code Table A-VI/1.",
      category: "safety" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN", "VESSEL_OPERATOR"],
      renewalIntervalMonths: 60,
      regulatoryReference: "STCW Convention, 46 CFR Part 11",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["stcw", "basic-safety", "survival", "fire", "maritime"],
      keywords: ["STCW", "basic safety", "personal survival", "fire fighting"],
      publishedAt: new Date(),
    },
    {
      slug: "maritime-hazmat-imdg",
      title: "Maritime Hazmat (IMDG Code)",
      description:
        "International Maritime Dangerous Goods Code training covering IMDG classification, marking/labeling, stowage segregation, and documentation for dangerous goods by sea under IMDG Code and 49 CFR 176.",
      longDescription:
        "This course covers hazardous materials transportation by sea under the IMDG Code. Topics include the IMDG classification system vs DOT hazmat classes, marine pollutant designation, container packing requirements, stowage and segregation rules, documentation (Dangerous Goods Declaration), EmS (Emergency Schedules) vs ERG, CTU Code compliance, and lithium battery maritime provisions. Key differences between highway and maritime hazmat regulations are emphasized throughout.",
      category: "hazmat" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 210,
      moduleCount: 5,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN", "VESSEL_OPERATOR", "PORT_MASTER"],
      renewalIntervalMonths: 36,
      regulatoryReference: "IMDG Code, 49 CFR 176",
      hazmatSpecific: true,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["imdg", "hazmat", "dangerous-goods", "maritime", "marine-pollutant"],
      keywords: ["IMDG Code", "dangerous goods", "marine pollutant", "EmS"],
      publishedAt: new Date(),
    },
    {
      slug: "vessel-navigation",
      title: "Vessel Navigation & Watchkeeping",
      description:
        "Advanced vessel navigation covering celestial and electronic navigation, COLREGS, passage planning, and watchkeeping standards under STCW Chapter II.",
      longDescription:
        "This course covers navigation and watchkeeping for deck officers. Topics include COLREGS (International Regulations for Preventing Collisions at Sea), ECDIS operation, radar and ARPA, GPS/GNSS navigation, passage planning (voyage plan appraisal, planning, execution, monitoring), bridge team management, and watchkeeping responsibilities per STCW Code A-II/1. Includes restricted visibility navigation and Traffic Separation Schemes.",
      category: "specialized" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 5,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN"],
      renewalIntervalMonths: 60,
      regulatoryReference: "STCW Chapter II, COLREGS",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["navigation", "colregs", "ecdis", "watchkeeping", "maritime"],
      keywords: ["navigation", "COLREGS", "ECDIS", "passage planning", "watchkeeping"],
      publishedAt: new Date(),
    },
    {
      slug: "port-operations-safety",
      title: "Port Operations & Terminal Safety",
      description:
        "Port and marine terminal safety covering cargo handling, longshoring operations, container terminal safety, and regulatory requirements under OSHA 29 CFR 1917/1918 and MTSA.",
      longDescription:
        "This course covers safety requirements for port and marine terminal operations. Topics include marine terminal operations (29 CFR 1917), longshoring (29 CFR 1918), container handling equipment safety, STS crane operations, yard tractor safety, vessel-to-shore cargo transfer, fumigation hazards, MTSA facility security requirements, and emergency response procedures. Includes TWIC program requirements and access control.",
      category: "safety" as const,
      countryScope: ["US"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 150,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["PORT_MASTER", "VESSEL_OPERATOR"],
      renewalIntervalMonths: 24,
      regulatoryReference: "OSHA 29 CFR 1917/1918, MTSA",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["port-safety", "terminal", "longshoring", "mtsa", "maritime"],
      keywords: ["port operations", "terminal safety", "longshoring", "MTSA", "TWIC"],
      publishedAt: new Date(),
    },
    {
      slug: "maritime-security-isps",
      title: "Maritime Security Awareness (ISPS)",
      description:
        "International Ship and Port Facility Security Code training covering security levels, CSO/SSO/PFSO responsibilities, security drills, and threat assessment under ISPS Code and 33 CFR 104/105.",
      longDescription:
        "This course covers the ISPS Code as implemented through SOLAS Chapter XI-2 and US regulations at 33 CFR Parts 104 (vessels) and 105 (facilities). Topics include MARSEC security levels, Company Security Officer (CSO) duties, Ship Security Officer (SSO) duties, Port Facility Security Officer (PFSO) duties, security assessments, Declaration of Security (DoS), access control procedures, cargo screening, and security drills/exercises.",
      category: "compliance" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: [
        "VESSEL_SHIPPER", "VESSEL_OPERATOR", "PORT_MASTER",
        "SHIP_CAPTAIN", "VESSEL_BROKER", "CUSTOMS_BROKER",
      ],
      renewalIntervalMonths: 24,
      regulatoryReference: "ISPS Code, 33 CFR 104/105",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["isps", "security", "marsec", "maritime", "solas"],
      keywords: ["ISPS Code", "maritime security", "MARSEC", "CSO", "SSO"],
      publishedAt: new Date(),
    },
    {
      slug: "cargo-handling-stowage",
      title: "Cargo Handling & Stowage",
      description:
        "Cargo handling and stowage operations covering container lashing, VGM verification, cargo securing, and stability considerations under SOLAS Chapter VI and CSS Code.",
      longDescription:
        "This course covers cargo handling, stowage, and securing for maritime operations. Topics include SOLAS Chapter VI requirements, the Cargo Securing Manual (CSM), container lashing systems, Verified Gross Mass (VGM) requirements per SOLAS VI/2, break-bulk and project cargo handling, bulk cargo operations (IMSBC Code), grain loading (International Grain Code), and vessel stability during loading/discharging operations. Includes cargo damage prevention and P&I club requirements.",
      category: "specialized" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN", "PORT_MASTER"],
      renewalIntervalMonths: 24,
      regulatoryReference: "SOLAS Chapter VI, CSS Code",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["cargo", "stowage", "lashing", "vgm", "maritime"],
      keywords: ["cargo handling", "stowage", "VGM", "CSS Code", "lashing"],
      publishedAt: new Date(),
    },
    {
      slug: "marpol-environmental",
      title: "Maritime Environmental Compliance (MARPOL)",
      description:
        "MARPOL Convention compliance covering all six annexes: oil pollution, noxious liquids, harmful substances, sewage, garbage, and air pollution (SOx/NOx/GHG) plus OPA 90.",
      longDescription:
        "This course covers the International Convention for the Prevention of Pollution from Ships (MARPOL) and US Oil Pollution Act of 1990 (OPA 90). Topics include Annex I (Oil), Annex II (Noxious Liquid Substances), Annex III (Harmful Substances in Packaged Form), Annex IV (Sewage), Annex V (Garbage), and Annex VI (Air Pollution). Includes Emission Control Areas (ECAs), ballast water management (BWM Convention), the IMO 2020 sulfur cap, and the Energy Efficiency Design Index (EEDI).",
      category: "compliance" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 6,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN", "VESSEL_OPERATOR"],
      renewalIntervalMonths: 60,
      regulatoryReference: "MARPOL Annexes I-VI, OPA 90",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["marpol", "environmental", "opa90", "emissions", "maritime"],
      keywords: ["MARPOL", "oil pollution", "OPA 90", "sulfur cap", "ECA"],
      publishedAt: new Date(),
    },
    {
      slug: "lifesaving-fire",
      title: "Lifesaving & Fire Prevention",
      description:
        "Advanced lifesaving appliance and fire prevention training covering lifeboat operations, fire detection systems, fixed firefighting systems, and emergency procedures under STCW Chapter VI and SOLAS Chapter III.",
      longDescription:
        "This course covers lifesaving and fire prevention at the advanced level per STCW Code A-VI/2 and A-VI/3. Topics include lifeboat/liferaft launching and recovery, rescue boat operations, Marine Evacuation Systems (MES), fire detection and alarm systems, fixed CO2 and water spray systems, foam and dry chemical systems, breathing apparatus (SCBA), firefighting strategy and tactics, and fire investigation. Practical competency demonstrations required.",
      category: "safety" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 240,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN"],
      renewalIntervalMonths: 60,
      regulatoryReference: "STCW Chapter VI, SOLAS III",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["lifesaving", "fire", "lifeboat", "solas", "maritime"],
      keywords: ["lifesaving", "fire prevention", "lifeboat", "SOLAS III", "STCW VI"],
      publishedAt: new Date(),
    },
    {
      slug: "bridge-resource-mgmt",
      title: "Bridge Resource Management",
      description:
        "Bridge Resource Management (BRM) training covering team coordination, situational awareness, communication, error management, and decision-making under STCW A-II/1 and IMO Model Course 1.22.",
      longDescription:
        "This course covers Bridge Resource Management per IMO Model Course 1.22 and STCW Code A-II/1. Topics include bridge team organization, effective communication, situational awareness, workload management, cultural factors, authority gradient, error chains and intervention strategies, voyage planning team exercises, and emergency bridge procedures. Uses case studies from maritime casualty investigations (NTSB, MAIB) to illustrate BRM failures and lessons learned.",
      category: "specialized" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN"],
      renewalIntervalMonths: 60,
      regulatoryReference: "STCW A-II/1, IMO Model Course 1.22",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["brm", "bridge", "teamwork", "situational-awareness", "maritime"],
      keywords: ["BRM", "bridge resource management", "situational awareness", "IMO 1.22"],
      publishedAt: new Date(),
    },
    {
      slug: "maritime-hours-rest",
      title: "Maritime Hours of Rest",
      description:
        "Maritime hours of work and rest regulations covering MLC 2006 requirements, STCW rest period rules, fatigue management, and record-keeping obligations.",
      longDescription:
        "This course covers hours of work and rest for seafarers under the Maritime Labour Convention (MLC 2006) and STCW Code A-VIII/1. Topics include the minimum 10-hour rest in any 24-hour period, the 77-hour per 7-day minimum rest, the two-period division rule, exceptions and dispensations, fatigue risk management systems (FRMS), and electronic record-keeping requirements. Critical comparisons to trucking HOS (FMCSA) and rail HOS (FRA) are included to highlight mode-specific differences.",
      category: "compliance" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "intermediate" as const,
      estimatedDurationMinutes: 150,
      moduleCount: 3,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN", "VESSEL_OPERATOR"],
      renewalIntervalMonths: 24,
      regulatoryReference: "MLC 2006, STCW A-VIII/1",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["hours-of-rest", "mlc", "fatigue", "stcw", "maritime"],
      keywords: ["hours of rest", "MLC 2006", "fatigue management", "STCW VIII"],
      publishedAt: new Date(),
    },
    {
      slug: "customs-trade-compliance",
      title: "Customs & Trade Compliance",
      description:
        "Customs and trade compliance covering CBP entry procedures, ISF 10+2 filing, USMCA rules of origin, duty drawback, and bonded warehouse operations under 19 CFR.",
      longDescription:
        "This course covers US customs and international trade compliance for freight professionals. Topics include CBP entry types (consumption, warehouse, FTZ), the Importer Security Filing (ISF 10+2), Harmonized Tariff Schedule (HTS) classification, USMCA/CUSMA rules of origin and certificates of origin, duty rates and calculations, duty drawback programs, bonded warehouse operations, Customs-Trade Partnership Against Terrorism (C-TPAT), and Automated Commercial Environment (ACE) system. Cross-border considerations for US/Canada/Mexico trade lanes.",
      category: "compliance" as const,
      countryScope: ["US", "CA", "MX"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["CUSTOMS_BROKER", "VESSEL_BROKER"],
      renewalIntervalMonths: 24,
      regulatoryReference: "19 CFR, ISF 10+2, USMCA",
      hazmatSpecific: false,
      crossBorder: true,
      status: "active" as const,
      passingScore: 80,
      tags: ["customs", "trade", "isf", "usmca", "hts", "maritime"],
      keywords: ["customs", "ISF 10+2", "HTS classification", "USMCA", "C-TPAT"],
      publishedAt: new Date(),
    },
    {
      slug: "inland-waterway-ops",
      title: "Inland Waterway Operations",
      description:
        "Inland waterway and towing operations covering river navigation, lock transit, barge fleeting, Subchapter M compliance, and towing vessel safety under 33 CFR and 46 CFR Subchapter M.",
      longDescription:
        "This course covers inland waterway operations for towing vessels and barges. Topics include river navigation and current management, lock and dam transit procedures, barge fleeting and assembly, Subchapter M (Towing Vessel Safety) compliance, towing vessel inspection program (TVIP), bridge-to-bridge communication, river buoyage systems (IALA Region B), and high water/flood operations. Includes the unique regulatory framework for brown-water operations vs blue-water vessels.",
      category: "specialized" as const,
      countryScope: ["US"],
      difficultyLevel: "advanced" as const,
      estimatedDurationMinutes: 180,
      moduleCount: 4,
      isMandatory: true,
      mandatoryForRoles: ["SHIP_CAPTAIN", "VESSEL_OPERATOR"],
      renewalIntervalMonths: 24,
      regulatoryReference: "33 CFR, 46 CFR Subchapter M",
      hazmatSpecific: false,
      crossBorder: false,
      status: "active" as const,
      passingScore: 80,
      tags: ["inland-waterway", "towing", "barge", "subchapter-m", "maritime"],
      keywords: ["inland waterway", "towing vessel", "Subchapter M", "barge", "lock transit"],
      publishedAt: new Date(),
    },
  ];

  for (const course of maritimeCourses) {
    const existing = await db
      .select({ id: trainingCourses.id })
      .from(trainingCourses)
      .where(sql`slug = ${course.slug}`)
      .limit(1);
    if (existing.length > 0) {
      console.log(`  -> ${course.slug} already exists, skipping.`);
      continue;
    }
    await db.insert(trainingCourses).values(course);
    console.log(`  + ${course.slug}`);
  }
  console.log("  Maritime courses done.");
}

main().catch(console.error);
