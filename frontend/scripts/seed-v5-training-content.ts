/**
 * V5 MULTI-MODAL: SEED MODULES, LESSONS & QUIZZES FOR 22 NEW COURSES
 * Run: cd frontend && npx tsx scripts/seed-v5-training-content.ts
 *
 * For each course: 3-6 modules, 2-3 lessons per module, 1 quiz per module with 5 questions
 * All content references REAL regulations (49 CFR for rail, IMO/STCW/MARPOL for maritime)
 */
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { trainingCourses, lmsModules, trainingLessons, trainingQuizzes, trainingQuizQuestions } from "../drizzle/schema";
import mysql from "mysql2/promise";
import { getRailCoursesPart2 } from "./training-content/rail-courses-2";
import { getRail3 } from "./training-content/rail-3";
import { getRail4 } from "./training-content/rail-4";
import { getRail5 } from "./training-content/rail-5";
import { getMaritime1 } from "./training-content/maritime-1";
import { getMaritime2 } from "./training-content/maritime-2";
import { getMaritime3 } from "./training-content/maritime-3";
import { getMaritime4 } from "./training-content/maritime-4";
import { getMaritime5 } from "./training-content/maritime-5";
import { getMaritime6 } from "./training-content/maritime-6";

const DATABASE_URL = process.env.DATABASE_URL || "";

interface ModuleDef {
  title: string;
  description: string;
  orderIndex: number;
  contentType: "text" | "video" | "interactive" | "quiz" | "case_study";
  estimatedDurationMinutes: number;
  lessons: LessonDef[];
  quiz: QuizDef;
}

interface LessonDef {
  title: string;
  contentHtml: string;
  orderIndex: number;
  lessonType: "reading" | "video" | "interactive" | "case_study";
  estimatedDurationMinutes: number;
  keyRegulations?: Array<{ code: string; title: string; jurisdiction: string; summary: string }>;
}

interface QuizDef {
  title: string;
  description: string;
  questions: QuestionDef[];
}

interface QuestionDef {
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "scenario";
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  regulationReference: string;
}

// ============================================================================
// COURSE CONTENT DEFINITIONS
// ============================================================================

function getRailCourseContent(): Record<string, ModuleDef[]> {
  return {
    "fra-railroad-safety": [
      {
        title: "Track Safety Standards",
        description: "FRA track safety standards under 49 CFR Part 213",
        orderIndex: 1,
        contentType: "text",
        estimatedDurationMinutes: 45,
        lessons: [
          {
            title: "Track Classes and Speed Limits",
            contentHtml: "<h2>Track Classification System</h2><p>FRA classifies railroad track into Classes 1-9 (49 CFR §213.9). Each class determines maximum allowable operating speeds for freight and passenger trains. Class 1 track (the lowest) permits freight speeds up to 10 mph and passenger speeds up to 15 mph. Class 4 track permits freight up to 60 mph and passenger up to 80 mph. Track exceeding Class 5 requires additional FRA approval.</p><h3>Key Speed Limits by Class</h3><ul><li>Class 1: 10 mph freight / 15 mph passenger</li><li>Class 2: 25 mph / 30 mph</li><li>Class 3: 40 mph / 60 mph</li><li>Class 4: 60 mph / 80 mph</li><li>Class 5: 80 mph / 90 mph</li></ul><p>Track owners must inspect track to ensure compliance with the class standards. Failure to maintain track to its designated class requires either upgrading the track or imposing slow orders to reduce speed to a lower class level.</p>",
            orderIndex: 1,
            lessonType: "reading",
            estimatedDurationMinutes: 20,
            keyRegulations: [{ code: "49 CFR §213.9", title: "Classes of track: operating speed limits", jurisdiction: "US", summary: "Defines the 9 track classes and associated maximum operating speeds for freight and passenger trains." }],
          },
          {
            title: "Track Geometry and Defect Standards",
            contentHtml: "<h2>Track Geometry Requirements</h2><p>49 CFR Part 213 Subpart C establishes requirements for track geometry including gauge, alignment, surface, and cross level. Standard gauge is 56.5 inches (4 feet 8.5 inches). Gauge tolerances vary by track class — Class 1 allows gauge from 56 to 58 inches, while Class 5 allows only 56 to 57.5 inches.</p><h3>Common Track Defects</h3><ul><li><strong>Wide gauge</strong>: Gauge exceeding maximum for track class — requires slow order or track out of service</li><li><strong>Rail defects</strong>: Detail fractures, transverse fissures, bolt hole cracks — classified by FRA defect codes</li><li><strong>Joint bar defects</strong>: Broken or cracked joint bars require immediate repair per §213.121</li></ul><p>Track inspectors must be qualified under 49 CFR §213.7 and perform inspections at frequencies determined by track class and tonnage.</p>",
            orderIndex: 2,
            lessonType: "reading",
            estimatedDurationMinutes: 25,
            keyRegulations: [{ code: "49 CFR Part 213 Subpart C", title: "Track Geometry", jurisdiction: "US", summary: "Standards for gauge, alignment, surface, and cross level by track class." }],
          },
        ],
        quiz: {
          title: "Track Safety Standards Quiz",
          description: "Test your knowledge of FRA track safety standards",
          questions: [
            { questionText: "What is the maximum freight speed allowed on Class 3 track under 49 CFR §213.9?", questionType: "multiple_choice", options: [{ id: "a", text: "25 mph", isCorrect: false }, { id: "b", text: "40 mph", isCorrect: true }, { id: "c", text: "60 mph", isCorrect: false }, { id: "d", text: "80 mph", isCorrect: false }], correctAnswer: "b", explanation: "49 CFR §213.9 establishes Class 3 freight speed limit at 40 mph.", difficulty: "easy", regulationReference: "49 CFR §213.9" },
            { questionText: "What is the standard railroad gauge in the United States?", questionType: "multiple_choice", options: [{ id: "a", text: "56 inches", isCorrect: false }, { id: "b", text: "56.5 inches", isCorrect: true }, { id: "c", text: "57 inches", isCorrect: false }, { id: "d", text: "58 inches", isCorrect: false }], correctAnswer: "b", explanation: "Standard gauge is 56.5 inches (4 feet 8.5 inches) per 49 CFR §213.53.", difficulty: "easy", regulationReference: "49 CFR §213.53" },
            { questionText: "A broken joint bar requires immediate repair under which section?", questionType: "multiple_choice", options: [{ id: "a", text: "§213.109", isCorrect: false }, { id: "b", text: "§213.121", isCorrect: true }, { id: "c", text: "§213.133", isCorrect: false }, { id: "d", text: "§213.9", isCorrect: false }], correctAnswer: "b", explanation: "49 CFR §213.121 requires that joint bars be maintained in accordance with prescribed standards; broken bars require immediate action.", difficulty: "medium", regulationReference: "49 CFR §213.121" },
            { questionText: "True or False: Class 1 track permits passenger train speeds up to 25 mph.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "Class 1 track permits passenger speeds up to 15 mph, not 25 mph. 25 mph is the Class 2 freight limit.", difficulty: "medium", regulationReference: "49 CFR §213.9" },
            { questionText: "Who must be qualified under 49 CFR §213.7 to perform track inspections?", questionType: "multiple_choice", options: [{ id: "a", text: "Any railroad employee", isCorrect: false }, { id: "b", text: "Qualified track inspectors only", isCorrect: true }, { id: "c", text: "FRA inspectors only", isCorrect: false }, { id: "d", text: "Locomotive engineers", isCorrect: false }], correctAnswer: "b", explanation: "49 CFR §213.7 requires that track inspections be performed by individuals who meet the qualification requirements.", difficulty: "easy", regulationReference: "49 CFR §213.7" },
          ],
        },
      },
      {
        title: "Signal and Train Control",
        description: "Signal systems and positive train control under 49 CFR Part 236",
        orderIndex: 2,
        contentType: "text",
        estimatedDurationMinutes: 45,
        lessons: [
          {
            title: "Signal System Types",
            contentHtml: "<h2>Railroad Signal Systems</h2><p>49 CFR Part 236 governs all railroad signal, train control, and communication systems. The major signal system types include:</p><ul><li><strong>Automatic Block Signal (ABS)</strong>: Uses track circuits to detect train presence and display appropriate signal aspects. Provides following-move protection only.</li><li><strong>Centralized Traffic Control (CTC)</strong>: Dispatcher-controlled signals and power switches. Provides both following-move and opposing-move protection.</li><li><strong>Track Warrant Control (TWC)</strong>: Authority conveyed verbally by dispatcher via radio. Common on single-track territory without signals.</li><li><strong>Direct Traffic Control (DTC)</strong>: Authority conveyed by dispatcher assigning specific blocks of track.</li></ul><p>All signal systems must be maintained and tested per Part 236 Subpart C requirements. Signal failures must be reported to the FRA.</p>",
            orderIndex: 1,
            lessonType: "reading",
            estimatedDurationMinutes: 20,
            keyRegulations: [{ code: "49 CFR Part 236", title: "Rules, Standards, and Instructions Governing the Installation, Inspection, Maintenance, and Repair of Signal and Train Control Systems", jurisdiction: "US", summary: "Comprehensive regulations for all railroad signal and train control systems." }],
          },
          {
            title: "Positive Train Control (PTC)",
            contentHtml: "<h2>Positive Train Control Requirements</h2><p>The Rail Safety Improvement Act of 2008 mandated PTC on certain railroad lines. PTC systems must be capable of:</p><ul><li>Preventing train-to-train collisions</li><li>Preventing overspeed derailments</li><li>Preventing incursions into established work zones</li><li>Preventing movements through misaligned switches</li></ul><p>PTC is required on Class I railroad main lines handling poison-by-inhalation hazmat and on lines with regularly scheduled intercity or commuter rail passenger service. Implementation was completed by December 31, 2020 per the FAST Act extension.</p><h3>PTC Technologies</h3><p>The primary PTC systems in use are ITCS (Incremental Train Control System), ACSES (Advanced Civil Speed Enforcement System), and I-ETMS (Interoperable Electronic Train Management System). I-ETMS is the most widely deployed system.</p>",
            orderIndex: 2,
            lessonType: "reading",
            estimatedDurationMinutes: 25,
            keyRegulations: [{ code: "49 CFR Part 236 Subpart I", title: "Positive Train Control Systems", jurisdiction: "US", summary: "Requirements for PTC implementation, operation, and maintenance." }],
          },
        ],
        quiz: {
          title: "Signal and Train Control Quiz",
          description: "Test your knowledge of railroad signal systems and PTC",
          questions: [
            { questionText: "Which signal system provides both following-move and opposing-move protection?", questionType: "multiple_choice", options: [{ id: "a", text: "Automatic Block Signal (ABS)", isCorrect: false }, { id: "b", text: "Centralized Traffic Control (CTC)", isCorrect: true }, { id: "c", text: "Track Warrant Control (TWC)", isCorrect: false }, { id: "d", text: "Dark Territory", isCorrect: false }], correctAnswer: "b", explanation: "CTC provides both following-move and opposing-move protection through dispatcher-controlled signals.", difficulty: "medium", regulationReference: "49 CFR Part 236" },
            { questionText: "PTC must prevent all of the following EXCEPT:", questionType: "multiple_choice", options: [{ id: "a", text: "Train-to-train collisions", isCorrect: false }, { id: "b", text: "Overspeed derailments", isCorrect: false }, { id: "c", text: "Grade crossing accidents", isCorrect: true }, { id: "d", text: "Work zone incursions", isCorrect: false }], correctAnswer: "c", explanation: "PTC is required to prevent train-to-train collisions, overspeed, work zone incursions, and misaligned switch movements. Grade crossing protection is not a PTC requirement.", difficulty: "medium", regulationReference: "49 CFR Part 236 Subpart I" },
            { questionText: "The most widely deployed PTC system in the US is:", questionType: "multiple_choice", options: [{ id: "a", text: "ACSES", isCorrect: false }, { id: "b", text: "ITCS", isCorrect: false }, { id: "c", text: "I-ETMS", isCorrect: true }, { id: "d", text: "ERTMS", isCorrect: false }], correctAnswer: "c", explanation: "I-ETMS (Interoperable Electronic Train Management System) is the most widely deployed PTC system on US railroads.", difficulty: "hard", regulationReference: "49 CFR Part 236 Subpart I" },
            { questionText: "True or False: Track Warrant Control (TWC) relies on physical signal displays.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "TWC conveys authority verbally via radio from the dispatcher. It does not use physical signal displays — it is common on non-signaled (dark) territory.", difficulty: "easy", regulationReference: "49 CFR Part 236" },
            { questionText: "PTC implementation was required to be completed by:", questionType: "multiple_choice", options: [{ id: "a", text: "December 31, 2018", isCorrect: false }, { id: "b", text: "December 31, 2020", isCorrect: true }, { id: "c", text: "December 31, 2022", isCorrect: false }, { id: "d", text: "December 31, 2015", isCorrect: false }], correctAnswer: "b", explanation: "The FAST Act extended the PTC deadline to December 31, 2020.", difficulty: "easy", regulationReference: "RSIA 2008, FAST Act" },
          ],
        },
      },
      {
        title: "Railroad Operating Rules",
        description: "Operating rules and practices under 49 CFR Part 217",
        orderIndex: 3,
        contentType: "text",
        estimatedDurationMinutes: 45,
        lessons: [
          {
            title: "Railroad Operating Rules Program",
            contentHtml: "<h2>Operating Rules Requirements</h2><p>49 CFR Part 217 requires each railroad to have a program for periodic testing of its employees on their knowledge of and compliance with operating rules. Key requirements include:</p><ul><li>Written operating rules filed with FRA</li><li>Periodic testing (operational and written) of all employees covered by the rules</li><li>Qualification of employees before they perform service</li><li>Recording and reporting of test results</li></ul><p>Operating rules cover train movements, signal compliance, speed restrictions, train handling, switching operations, and radio communication protocols. Each Class I railroad maintains its own General Code of Operating Rules (GCOR) or equivalent.</p>",
            orderIndex: 1,
            lessonType: "reading",
            estimatedDurationMinutes: 20,
            keyRegulations: [{ code: "49 CFR Part 217", title: "Railroad Operating Rules", jurisdiction: "US", summary: "Requirements for operating rules programs including testing and qualification." }],
          },
          {
            title: "Accident Reporting Requirements",
            contentHtml: "<h2>FRA Accident/Incident Reporting</h2><p>49 CFR Part 225 requires railroads to report railroad accidents/incidents to FRA. The reporting thresholds include:</p><ul><li><strong>Rail Equipment Accident</strong>: Any event involving on-track equipment that results in damages exceeding the current reporting threshold (adjusted annually — approximately $12,500 in 2024)</li><li><strong>Highway-Rail Grade Crossing Accident</strong>: Any impact at a crossing regardless of damage amount</li><li><strong>Death or injury</strong>: Any rail-related fatality or injury requiring medical treatment beyond first aid</li></ul><p>Reports are submitted monthly via FRA's Accident/Incident Reporting System. Falsification of accident reports is a federal offense under 49 USC §20901.</p>",
            orderIndex: 2,
            lessonType: "reading",
            estimatedDurationMinutes: 25,
            keyRegulations: [{ code: "49 CFR Part 225", title: "Railroad Accidents/Incidents: Reports Classification, and Investigations", jurisdiction: "US", summary: "Accident reporting requirements and thresholds." }],
          },
        ],
        quiz: {
          title: "Operating Rules Quiz",
          description: "Test your knowledge of railroad operating rules",
          questions: [
            { questionText: "49 CFR Part 217 requires railroads to periodically test employees on:", questionType: "multiple_choice", options: [{ id: "a", text: "Physical fitness only", isCorrect: false }, { id: "b", text: "Operating rules knowledge and compliance", isCorrect: true }, { id: "c", text: "Drug and alcohol screening", isCorrect: false }, { id: "d", text: "Financial literacy", isCorrect: false }], correctAnswer: "b", explanation: "Part 217 specifically requires testing on knowledge of and compliance with operating rules.", difficulty: "easy", regulationReference: "49 CFR Part 217" },
            { questionText: "Highway-rail grade crossing accidents must be reported to FRA:", questionType: "multiple_choice", options: [{ id: "a", text: "Only if damages exceed $12,500", isCorrect: false }, { id: "b", text: "Only if there is an injury", isCorrect: false }, { id: "c", text: "Regardless of damage amount", isCorrect: true }, { id: "d", text: "Only if the train derails", isCorrect: false }], correctAnswer: "c", explanation: "All highway-rail grade crossing impacts must be reported regardless of damage amount under 49 CFR Part 225.", difficulty: "medium", regulationReference: "49 CFR Part 225" },
            { questionText: "Falsification of railroad accident reports is:", questionType: "multiple_choice", options: [{ id: "a", text: "A state misdemeanor", isCorrect: false }, { id: "b", text: "A federal offense", isCorrect: true }, { id: "c", text: "An administrative violation only", isCorrect: false }, { id: "d", text: "Not addressed by law", isCorrect: false }], correctAnswer: "b", explanation: "Falsification of accident reports is a federal offense under 49 USC §20901.", difficulty: "medium", regulationReference: "49 USC §20901" },
            { questionText: "True or False: Each Class I railroad uses identical operating rules.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "While there is commonality (many use GCOR), each Class I railroad maintains its own set of operating rules.", difficulty: "easy", regulationReference: "49 CFR Part 217" },
            { questionText: "What type of injury must be reported under 49 CFR Part 225?", questionType: "multiple_choice", options: [{ id: "a", text: "Any injury at all", isCorrect: false }, { id: "b", text: "Injuries requiring hospitalization only", isCorrect: false }, { id: "c", text: "Injuries requiring medical treatment beyond first aid", isCorrect: true }, { id: "d", text: "Only fatalities", isCorrect: false }], correctAnswer: "c", explanation: "Part 225 requires reporting of injuries requiring medical treatment beyond first aid.", difficulty: "medium", regulationReference: "49 CFR Part 225" },
          ],
        },
      },
      {
        title: "Employee Safety and Protection",
        description: "Employee on-track safety and railroad workplace safety",
        orderIndex: 4,
        contentType: "text",
        estimatedDurationMinutes: 45,
        lessons: [
          {
            title: "Roadway Worker Protection",
            contentHtml: "<h2>Roadway Worker Protection (RWP)</h2><p>49 CFR Part 214 Subpart C establishes requirements to protect roadway workers (employees working on or near track). Key protections include:</p><ul><li><strong>On-Track Safety</strong>: All roadway workers must be provided with on-track safety through one of four methods: exclusive track occupancy, foul time, train approach warning, or individual train detection</li><li><strong>Job Briefings</strong>: Required before work begins and whenever conditions change</li><li><strong>Lone Worker Protection</strong>: Special rules for workers operating alone</li><li><strong>Watchman/Lookout</strong>: Designated employees who provide train approach warning</li></ul><p>Railroads must establish RWP programs and train all roadway workers. Violations carry severe civil penalties.</p>",
            orderIndex: 1,
            lessonType: "reading",
            estimatedDurationMinutes: 25,
            keyRegulations: [{ code: "49 CFR Part 214 Subpart C", title: "Roadway Worker Protection", jurisdiction: "US", summary: "Requirements for protecting railroad workers on or near track." }],
          },
          {
            title: "Personal Protective Equipment",
            contentHtml: "<h2>PPE Requirements for Railroad Workers</h2><p>Railroad workers must use appropriate PPE based on the hazards of their work environment. Key requirements include:</p><ul><li><strong>High-visibility apparel</strong>: Required for all roadway workers per 49 CFR §214.343</li><li><strong>Hearing protection</strong>: Required in areas exceeding 85 dB per OSHA 29 CFR 1910.95</li><li><strong>Eye protection</strong>: Required for grinding, welding, and similar operations</li><li><strong>Hard hats</strong>: Required in designated hard hat areas (bridges, tunnels, construction zones)</li><li><strong>Steel-toed boots</strong>: Standard requirement for most railroad field operations</li></ul>",
            orderIndex: 2,
            lessonType: "reading",
            estimatedDurationMinutes: 20,
            keyRegulations: [{ code: "49 CFR §214.343", title: "High-visibility apparel requirements", jurisdiction: "US", summary: "Requirements for high-visibility safety apparel for roadway workers." }],
          },
        ],
        quiz: {
          title: "Employee Safety Quiz",
          description: "Test your knowledge of railroad employee safety requirements",
          questions: [
            { questionText: "How many methods of on-track safety does 49 CFR Part 214 recognize?", questionType: "multiple_choice", options: [{ id: "a", text: "Two", isCorrect: false }, { id: "b", text: "Three", isCorrect: false }, { id: "c", text: "Four", isCorrect: true }, { id: "d", text: "Five", isCorrect: false }], correctAnswer: "c", explanation: "Part 214 recognizes four methods: exclusive track occupancy, foul time, train approach warning, and individual train detection.", difficulty: "medium", regulationReference: "49 CFR Part 214 Subpart C" },
            { questionText: "Job briefings for roadway workers are required:", questionType: "multiple_choice", options: [{ id: "a", text: "Only at the start of each shift", isCorrect: false }, { id: "b", text: "Before work begins and whenever conditions change", isCorrect: true }, { id: "c", text: "Only when working near mainline track", isCorrect: false }, { id: "d", text: "Weekly", isCorrect: false }], correctAnswer: "b", explanation: "Job briefings must be conducted before work begins AND whenever conditions change.", difficulty: "easy", regulationReference: "49 CFR Part 214 Subpart C" },
            { questionText: "High-visibility apparel is required for:", questionType: "multiple_choice", options: [{ id: "a", text: "Locomotive engineers only", isCorrect: false }, { id: "b", text: "All roadway workers", isCorrect: true }, { id: "c", text: "Conductors only", isCorrect: false }, { id: "d", text: "Management staff only", isCorrect: false }], correctAnswer: "b", explanation: "49 CFR §214.343 requires high-visibility apparel for all roadway workers.", difficulty: "easy", regulationReference: "49 CFR §214.343" },
            { questionText: "True or False: OSHA noise standards (29 CFR 1910.95) apply to railroad operations.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: true }, { id: "b", text: "False", isCorrect: false }], correctAnswer: "a", explanation: "OSHA standards, including noise exposure limits, apply to railroad operations where FRA has not preempted with specific regulations.", difficulty: "medium", regulationReference: "29 CFR 1910.95" },
            { questionText: "A watchman/lookout in the context of roadway worker protection is:", questionType: "multiple_choice", options: [{ id: "a", text: "A security guard", isCorrect: false }, { id: "b", text: "An employee who provides train approach warning", isCorrect: true }, { id: "c", text: "An FRA inspector", isCorrect: false }, { id: "d", text: "A dispatcher", isCorrect: false }], correctAnswer: "b", explanation: "A watchman/lookout is a designated employee specifically assigned to provide train approach warning to roadway workers.", difficulty: "easy", regulationReference: "49 CFR Part 214 Subpart C" },
          ],
        },
      },
    ],

    "locomotive-engineer-cert": [
      {
        title: "Qualification Standards",
        description: "Locomotive engineer qualification requirements under Part 240",
        orderIndex: 1, contentType: "text", estimatedDurationMinutes: 50,
        lessons: [
          { title: "Eligibility Requirements", contentHtml: "<h2>Locomotive Engineer Eligibility</h2><p>49 CFR Part 240 establishes the minimum federal standards for locomotive engineer certification. Candidates must meet vision and hearing acuity standards (§240.121), pass a knowledge examination (§240.125), pass a skills performance test (§240.127), and demonstrate familiarity with the physical characteristics of the territory they will operate over.</p><p>Railroads may impose additional requirements beyond the FRA minimums. Engineers must be recertified every 36 months. Certification may be revoked for operating rule violations per §240.117.</p>", orderIndex: 1, lessonType: "reading", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR Part 240", title: "Qualification and Certification of Locomotive Engineers", jurisdiction: "US", summary: "Federal standards for locomotive engineer qualification, certification, and recertification." }] },
          { title: "Revocation and Denial", contentHtml: "<h2>Certification Revocation</h2><p>Under §240.117, a locomotive engineer's certification shall be revoked for: operating a locomotive or train past a signal requiring a stop, exceeding authorized speed by more than 10 mph, failing to comply with railroad operating rules that cause an FRA reportable accident, or occupying main track or controlled siding without authority. The revocation period ranges from 30 days to permanent depending on the offense and whether it is a first or subsequent violation.</p>", orderIndex: 2, lessonType: "reading", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR §240.117", title: "Criteria for consideration of operating rules compliance data", jurisdiction: "US", summary: "Grounds for revocation and denial of locomotive engineer certification." }] },
        ],
        quiz: {
          title: "Engineer Qualification Quiz", description: "Test your knowledge of Part 240 requirements",
          questions: [
            { questionText: "How often must locomotive engineers be recertified?", questionType: "multiple_choice", options: [{ id: "a", text: "Every 12 months", isCorrect: false }, { id: "b", text: "Every 24 months", isCorrect: false }, { id: "c", text: "Every 36 months", isCorrect: true }, { id: "d", text: "Every 60 months", isCorrect: false }], correctAnswer: "c", explanation: "49 CFR Part 240 requires recertification every 36 months (3 years).", difficulty: "easy", regulationReference: "49 CFR Part 240" },
            { questionText: "Running past a stop signal can result in:", questionType: "multiple_choice", options: [{ id: "a", text: "A verbal warning only", isCorrect: false }, { id: "b", text: "Certification revocation", isCorrect: true }, { id: "c", text: "A fine but no certification impact", isCorrect: false }, { id: "d", text: "Mandatory retraining only", isCorrect: false }], correctAnswer: "b", explanation: "Operating past a signal requiring a stop is grounds for certification revocation under §240.117.", difficulty: "medium", regulationReference: "49 CFR §240.117" },
            { questionText: "Exceeding authorized speed by how much triggers revocation?", questionType: "multiple_choice", options: [{ id: "a", text: "5 mph", isCorrect: false }, { id: "b", text: "10 mph", isCorrect: true }, { id: "c", text: "15 mph", isCorrect: false }, { id: "d", text: "20 mph", isCorrect: false }], correctAnswer: "b", explanation: "Exceeding authorized speed by more than 10 mph is grounds for revocation under §240.117.", difficulty: "medium", regulationReference: "49 CFR §240.117" },
            { questionText: "True or False: Railroads cannot impose stricter requirements than FRA minimums for engineer certification.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "Railroads may impose additional requirements beyond the FRA minimums.", difficulty: "easy", regulationReference: "49 CFR Part 240" },
            { questionText: "Territorial qualification requires:", questionType: "multiple_choice", options: [{ id: "a", text: "Knowledge of the physical characteristics of the territory", isCorrect: true }, { id: "b", text: "Residency in the territory", isCorrect: false }, { id: "c", text: "A separate federal license", isCorrect: false }, { id: "d", text: "State DOT approval", isCorrect: false }], correctAnswer: "a", explanation: "Engineers must demonstrate familiarity with the physical characteristics (curves, grades, signals, bridges) of the territory.", difficulty: "easy", regulationReference: "49 CFR Part 240" },
          ],
        },
      },
      {
        title: "Knowledge Examination",
        description: "Required knowledge areas for locomotive engineer certification",
        orderIndex: 2, contentType: "text", estimatedDurationMinutes: 50,
        lessons: [
          { title: "Signal Aspect Knowledge", contentHtml: "<h2>Signal Aspect Recognition</h2><p>Engineers must demonstrate knowledge of all signal aspects and indications used on their territory. This includes:</p><ul><li>Wayside signal aspects (color, position, number of heads)</li><li>Cab signal indications</li><li>Hand and flag signals</li><li>Speed restrictions associated with each signal indication</li></ul><p>Signal aspects vary between railroads — an engineer qualified on one railroad must learn the specific signal system of any new railroad before operating on it.</p>", orderIndex: 1, lessonType: "reading", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR §240.125", title: "Locomotive engineer knowledge examination requirements", jurisdiction: "US", summary: "Required knowledge areas for engineer certification examination." }] },
          { title: "Air Brake Knowledge", contentHtml: "<h2>Air Brake Proficiency</h2><p>The knowledge examination must cover air brake system operation including:</p><ul><li>26-L automatic brake valve operation (service, emergency, release)</li><li>Independent brake valve operation</li><li>Dynamic braking principles and limitations</li><li>Train air brake test procedures (Class I, IA, II, III)</li><li>Emergency brake application procedures</li><li>End-of-train device (EOT/FRED) operation</li></ul><p>Engineers must understand the critical relationship between train length, tonnage, grade, and braking distance.</p>", orderIndex: 2, lessonType: "reading", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR Part 232", title: "Brake System Safety Standards for Freight and Other Non-Passenger Trains", jurisdiction: "US", summary: "Air brake inspection and test requirements." }] },
        ],
        quiz: {
          title: "Knowledge Examination Quiz", description: "Practice questions for the engineer knowledge exam",
          questions: [
            { questionText: "An engineer must know signal aspects for:", questionType: "multiple_choice", options: [{ id: "a", text: "Only their home railroad", isCorrect: false }, { id: "b", text: "All railroads in the US", isCorrect: false }, { id: "c", text: "The specific territory they operate on", isCorrect: true }, { id: "d", text: "Only CTC territory", isCorrect: false }], correctAnswer: "c", explanation: "Engineers must know the signal system specific to the territory they are qualified to operate on.", difficulty: "easy", regulationReference: "49 CFR §240.125" },
            { questionText: "The 26-L brake valve is used for:", questionType: "multiple_choice", options: [{ id: "a", text: "Independent locomotive braking only", isCorrect: false }, { id: "b", text: "Automatic train air brake operation", isCorrect: true }, { id: "c", text: "Dynamic braking", isCorrect: false }, { id: "d", text: "Parking brake application", isCorrect: false }], correctAnswer: "b", explanation: "The 26-L is the standard automatic brake valve used for train air brake operation.", difficulty: "medium", regulationReference: "49 CFR Part 232" },
            { questionText: "Dynamic braking converts locomotive traction motors into:", questionType: "multiple_choice", options: [{ id: "a", text: "Compressors", isCorrect: false }, { id: "b", text: "Generators that resist wheel rotation", isCorrect: true }, { id: "c", text: "Hydraulic pumps", isCorrect: false }, { id: "d", text: "Air brake amplifiers", isCorrect: false }], correctAnswer: "b", explanation: "Dynamic braking uses traction motors as generators, creating resistance that slows the train.", difficulty: "hard", regulationReference: "General railroad knowledge" },
            { questionText: "True or False: Signal aspects are identical across all US railroads.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "Signal aspects vary between railroads. Engineers must learn the specific system for each railroad they operate on.", difficulty: "easy", regulationReference: "49 CFR Part 236" },
            { questionText: "EOT/FRED stands for:", questionType: "multiple_choice", options: [{ id: "a", text: "End-of-Train / Flashing Rear End Device", isCorrect: true }, { id: "b", text: "Electronic Operations Terminal", isCorrect: false }, { id: "c", text: "Emergency Override Transponder", isCorrect: false }, { id: "d", text: "Engine Output Throttle", isCorrect: false }], correctAnswer: "a", explanation: "EOT = End-of-Train device, FRED = Flashing Rear End Device. These monitor brake pipe pressure and provide a visual marker.", difficulty: "easy", regulationReference: "49 CFR Part 232" },
          ],
        },
      },
      {
        title: "Skills Performance Testing",
        description: "Hands-on skills testing requirements for engineers",
        orderIndex: 3, contentType: "interactive", estimatedDurationMinutes: 50,
        lessons: [
          { title: "Operating Scenarios", contentHtml: "<h2>Skills Performance Test Requirements</h2><p>49 CFR §240.127 requires skills testing to evaluate an engineer's ability to safely operate a locomotive or train. The test must include scenarios covering:</p><ul><li>Proper train handling on grades (ascending and descending)</li><li>Proper use of air brakes and dynamic brakes</li><li>Compliance with all signal indications</li><li>Compliance with speed restrictions</li><li>Proper radio communication procedures</li><li>Emergency stop procedures</li></ul><p>The skills test must be conducted on the actual territory the engineer will operate on, or a simulator that replicates that territory.</p>", orderIndex: 1, lessonType: "interactive", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR §240.127", title: "Skills performance test requirements", jurisdiction: "US", summary: "Requirements for hands-on skills testing of locomotive engineers." }] },
          { title: "Emergency Procedures", contentHtml: "<h2>Emergency Response for Engineers</h2><p>Engineers must demonstrate competency in emergency procedures including:</p><ul><li>Emergency brake application and train stopping distance estimation</li><li>Response to signal failures</li><li>Response to air brake system failures</li><li>Hazmat emergency procedures (§172.600-§172.604 emergency response information)</li><li>Grade crossing accident response</li><li>Communication with dispatcher during emergencies</li></ul>", orderIndex: 2, lessonType: "reading", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR §240.127", title: "Skills performance test — emergency scenarios", jurisdiction: "US", summary: "Emergency procedure competency requirements for locomotive engineers." }] },
        ],
        quiz: {
          title: "Skills Performance Quiz", description: "Test your understanding of skills test requirements",
          questions: [
            { questionText: "The skills performance test must be conducted on:", questionType: "multiple_choice", options: [{ id: "a", text: "Any available railroad track", isCorrect: false }, { id: "b", text: "The actual territory or a simulator replicating it", isCorrect: true }, { id: "c", text: "A standardized FRA test track only", isCorrect: false }, { id: "d", text: "A classroom setting", isCorrect: false }], correctAnswer: "b", explanation: "The skills test must be on the actual territory or an approved simulator per §240.127.", difficulty: "medium", regulationReference: "49 CFR §240.127" },
            { questionText: "Train handling on grades is a required component of skills testing.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: true }, { id: "b", text: "False", isCorrect: false }], correctAnswer: "a", explanation: "Proper train handling on ascending and descending grades is a required skills test component.", difficulty: "easy", regulationReference: "49 CFR §240.127" },
            { questionText: "During the skills test, which braking methods must be demonstrated?", questionType: "multiple_choice", options: [{ id: "a", text: "Air brakes only", isCorrect: false }, { id: "b", text: "Dynamic brakes only", isCorrect: false }, { id: "c", text: "Both air brakes and dynamic brakes", isCorrect: true }, { id: "d", text: "Hand brakes only", isCorrect: false }], correctAnswer: "c", explanation: "Engineers must demonstrate proper use of both air brakes and dynamic brakes during the skills test.", difficulty: "easy", regulationReference: "49 CFR §240.127" },
            { questionText: "Emergency response information for hazmat is found in:", questionType: "multiple_choice", options: [{ id: "a", text: "49 CFR §172.600-604", isCorrect: true }, { id: "b", text: "49 CFR Part 240", isCorrect: false }, { id: "c", text: "49 CFR Part 213", isCorrect: false }, { id: "d", text: "49 CFR Part 236", isCorrect: false }], correctAnswer: "a", explanation: "Emergency response information requirements for hazmat are in 49 CFR §172.600 through §172.604.", difficulty: "hard", regulationReference: "49 CFR §172.600-604" },
            { questionText: "Radio communication is part of the skills performance test.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: true }, { id: "b", text: "False", isCorrect: false }], correctAnswer: "a", explanation: "Proper radio communication procedures are a required component of the skills test.", difficulty: "easy", regulationReference: "49 CFR §240.127" },
          ],
        },
      },
      {
        title: "Territorial Qualification",
        description: "Territory-specific qualification requirements",
        orderIndex: 4, contentType: "text", estimatedDurationMinutes: 45,
        lessons: [
          { title: "Territory Familiarization", contentHtml: "<h2>Territorial Qualification</h2><p>Before operating on any territory, a locomotive engineer must be qualified on the physical characteristics of that territory. This includes knowledge of:</p><ul><li>Station locations and names</li><li>Signal locations, types, and aspects</li><li>Speed restrictions (permanent and temporary)</li><li>Grade profiles (steep grades, helper districts)</li><li>Track configurations (sidings, crossovers, junctions)</li><li>Bridge and tunnel locations with associated restrictions</li></ul><p>Territorial qualification is typically achieved through a combination of classroom instruction, territory guide review, and cab rides with a qualified pilot. The number of required cab rides varies by railroad and territory complexity.</p>", orderIndex: 1, lessonType: "reading", estimatedDurationMinutes: 25, keyRegulations: [{ code: "49 CFR §240.123", title: "Territorial qualification requirements", jurisdiction: "US", summary: "Requirements for territory-specific qualification." }] },
          { title: "Maintaining Qualification", contentHtml: "<h2>Maintaining Territorial Qualification</h2><p>Engineers must maintain their territorial qualification through regular trips over the territory. If an engineer has not operated over a territory for an extended period (typically 6-12 months per railroad rules), they may need to re-qualify by:</p><ul><li>Reviewing updated territory guides and speed restrictions</li><li>Making cab rides over the territory</li><li>Passing a territory-specific knowledge test</li></ul>", orderIndex: 2, lessonType: "reading", estimatedDurationMinutes: 20, keyRegulations: [{ code: "49 CFR §240.123", title: "Territorial qualification maintenance", jurisdiction: "US", summary: "Requirements for maintaining territorial qualification currency." }] },
        ],
        quiz: {
          title: "Territorial Qualification Quiz", description: "Test your knowledge of territory requirements",
          questions: [
            { questionText: "Territorial qualification requires knowledge of:", questionType: "multiple_choice", options: [{ id: "a", text: "Station locations and signal types only", isCorrect: false }, { id: "b", text: "The full physical characteristics including grades, signals, and restrictions", isCorrect: true }, { id: "c", text: "Only the route between two terminals", isCorrect: false }, { id: "d", text: "Adjacent railroad territories as well", isCorrect: false }], correctAnswer: "b", explanation: "Engineers must know all physical characteristics including stations, signals, speeds, grades, and restrictions.", difficulty: "easy", regulationReference: "49 CFR §240.123" },
            { questionText: "A pilot engineer is used to:", questionType: "multiple_choice", options: [{ id: "a", text: "Test new locomotives", isCorrect: false }, { id: "b", text: "Familiarize an engineer with unfamiliar territory", isCorrect: true }, { id: "c", text: "Train new conductors", isCorrect: false }, { id: "d", text: "Inspect track conditions", isCorrect: false }], correctAnswer: "b", explanation: "A pilot is a qualified engineer who rides in the cab to provide territory familiarization.", difficulty: "easy", regulationReference: "49 CFR Part 240" },
            { questionText: "True or False: Territorial qualification never expires.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "Territorial qualification can lapse if an engineer hasn't operated over the territory for an extended period.", difficulty: "easy", regulationReference: "49 CFR §240.123" },
            { questionText: "Temporary speed restrictions:", questionType: "multiple_choice", options: [{ id: "a", text: "Are not part of territorial qualification", isCorrect: false }, { id: "b", text: "Must be known by the engineer before operating", isCorrect: true }, { id: "c", text: "Only apply to freight trains", isCorrect: false }, { id: "d", text: "Are issued by the FRA only", isCorrect: false }], correctAnswer: "b", explanation: "Engineers must be aware of both permanent and temporary speed restrictions on their territory.", difficulty: "medium", regulationReference: "49 CFR Part 240" },
            { questionText: "Helper districts are areas where:", questionType: "multiple_choice", options: [{ id: "a", text: "Additional crew members are required", isCorrect: false }, { id: "b", text: "Additional locomotives assist trains over steep grades", isCorrect: true }, { id: "c", text: "Trains must stop for inspection", isCorrect: false }, { id: "d", text: "Speed restrictions are always in effect", isCorrect: false }], correctAnswer: "b", explanation: "Helper districts are steep grade areas where helper locomotives are added to assist trains.", difficulty: "medium", regulationReference: "General railroad operations" },
          ],
        },
      },
      {
        title: "Physical Requirements",
        description: "Medical fitness standards for locomotive engineers",
        orderIndex: 5, contentType: "text", estimatedDurationMinutes: 40,
        lessons: [
          { title: "Vision and Hearing Standards", contentHtml: "<h2>Physical Qualification Standards</h2><p>49 CFR §240.121 establishes vision and hearing acuity requirements for locomotive engineers:</p><h3>Vision Requirements</h3><ul><li>Corrected visual acuity of 20/40 in each eye</li><li>Ability to recognize and distinguish colors of railroad signals (red, green, yellow, lunar white)</li><li>Field of vision meeting minimum standards</li></ul><h3>Hearing Requirements</h3><ul><li>Ability to hear a whispered voice at not less than 15 feet with hearing aids if needed</li><li>Or pass audiometric testing at specified frequencies</li></ul><p>These are MINIMUM federal standards. Railroads may require additional medical examinations.</p>", orderIndex: 1, lessonType: "reading", estimatedDurationMinutes: 20, keyRegulations: [{ code: "49 CFR §240.121", title: "Vision and hearing acuity standards", jurisdiction: "US", summary: "Physical fitness standards for locomotive engineers." }] },
          { title: "Drug and Alcohol Requirements", contentHtml: "<h2>Drug and Alcohol Regulations</h2><p>Under 49 CFR Part 219 (Railroad Operating Employee Drug and Alcohol Testing), locomotive engineers are subject to:</p><ul><li>Pre-employment drug testing</li><li>Random drug and alcohol testing</li><li>Post-accident testing (when thresholds are met)</li><li>Reasonable cause/suspicion testing</li><li>Return-to-duty and follow-up testing</li></ul><p>A positive drug test or BAC of 0.04 or above results in removal from service and potential certification revocation.</p>", orderIndex: 2, lessonType: "reading", estimatedDurationMinutes: 20, keyRegulations: [{ code: "49 CFR Part 219", title: "Control of Alcohol and Drug Use", jurisdiction: "US", summary: "Drug and alcohol testing requirements for railroad operating employees." }] },
        ],
        quiz: {
          title: "Physical Requirements Quiz", description: "Test your knowledge of medical and D&A requirements",
          questions: [
            { questionText: "The minimum corrected visual acuity for engineers is:", questionType: "multiple_choice", options: [{ id: "a", text: "20/20", isCorrect: false }, { id: "b", text: "20/30", isCorrect: false }, { id: "c", text: "20/40", isCorrect: true }, { id: "d", text: "20/50", isCorrect: false }], correctAnswer: "c", explanation: "49 CFR §240.121 requires corrected visual acuity of 20/40 in each eye.", difficulty: "easy", regulationReference: "49 CFR §240.121" },
            { questionText: "The BAC threshold for railroad operating employees is:", questionType: "multiple_choice", options: [{ id: "a", text: "0.02", isCorrect: false }, { id: "b", text: "0.04", isCorrect: true }, { id: "c", text: "0.08", isCorrect: false }, { id: "d", text: "Zero tolerance", isCorrect: false }], correctAnswer: "b", explanation: "A BAC of 0.04 or above results in removal from service under 49 CFR Part 219.", difficulty: "medium", regulationReference: "49 CFR Part 219" },
            { questionText: "Color vision requirements exist because engineers must:", questionType: "multiple_choice", options: [{ id: "a", text: "Read track warrant forms", isCorrect: false }, { id: "b", text: "Recognize signal colors (red, green, yellow, lunar white)", isCorrect: true }, { id: "c", text: "Identify hazmat placards at distance", isCorrect: false }, { id: "d", text: "Read switch plates", isCorrect: false }], correctAnswer: "b", explanation: "Engineers must be able to recognize and distinguish the colors of railroad signals.", difficulty: "easy", regulationReference: "49 CFR §240.121" },
            { questionText: "True or False: Hearing aids are prohibited for locomotive engineers.", questionType: "true_false", options: [{ id: "a", text: "True", isCorrect: false }, { id: "b", text: "False", isCorrect: true }], correctAnswer: "b", explanation: "Hearing aids are permitted if the engineer can meet the hearing standard with their use.", difficulty: "easy", regulationReference: "49 CFR §240.121" },
            { questionText: "Random drug testing under Part 219 applies to:", questionType: "multiple_choice", options: [{ id: "a", text: "Management only", isCorrect: false }, { id: "b", text: "All railroad operating employees", isCorrect: true }, { id: "c", text: "New hires only", isCorrect: false }, { id: "d", text: "Employees with prior violations only", isCorrect: false }], correctAnswer: "b", explanation: "Part 219 random testing applies to all covered railroad operating employees.", difficulty: "easy", regulationReference: "49 CFR Part 219" },
          ],
        },
      },
    ],
  };
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  console.log("V5 Training Content Seed Starting...\n");

  const allCourseContent: Record<string, ModuleDef[]> = {
    ...getRailCourseContent(),
    ...getRailCoursesPart2(),
    ...getRail3(),
    ...getRail4(),
    ...getRail5(),
    ...getMaritime1(),
    ...getMaritime2(),
    ...getMaritime3(),
    ...getMaritime4(),
    ...getMaritime5(),
    ...getMaritime6(),
  };

  // Process each course
  for (const [courseSlug, modules] of Object.entries(allCourseContent)) {
    console.log(`\n[Course] ${courseSlug}`);

    // Find course ID
    const [course] = await db
      .select({ id: trainingCourses.id })
      .from(trainingCourses)
      .where(sql`slug = ${courseSlug}`)
      .limit(1);

    if (!course) {
      console.log(`  !! Course not found: ${courseSlug} — skipping`);
      continue;
    }

    const courseId = course.id;

    // Check if modules already exist
    const existingModules = await db
      .select({ id: lmsModules.id })
      .from(lmsModules)
      .where(sql`courseId = ${courseId}`)
      .limit(1);

    if (existingModules.length > 0) {
      console.log(`  -> Already seeded, skipping.`);
      continue;
    }

    for (const mod of modules) {
      // Insert module
      const moduleResult = await db.insert(lmsModules).values({
        courseId,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        contentType: mod.contentType,
        estimatedDurationMinutes: mod.estimatedDurationMinutes,
        status: "active",
      });
      const moduleId = (moduleResult as any)[0]?.insertId;
      console.log(`  + Module: ${mod.title} (id=${moduleId})`);

      // Insert lessons
      for (const lesson of mod.lessons) {
        await db.insert(trainingLessons).values({
          moduleId,
          title: lesson.title,
          contentHtml: lesson.contentHtml,
          orderIndex: lesson.orderIndex,
          lessonType: lesson.lessonType,
          estimatedDurationMinutes: lesson.estimatedDurationMinutes,
          keyRegulations: lesson.keyRegulations || [],
          status: "active",
        });
        console.log(`    + Lesson: ${lesson.title}`);
      }

      // Insert quiz
      const quizResult = await db.insert(trainingQuizzes).values({
        moduleId,
        title: mod.quiz.title,
        description: mod.quiz.description,
        passingScore: 80,
        questionCount: mod.quiz.questions.length,
        randomizeQuestions: true,
        showAnswersImmediately: false,
        allowRetakes: true,
        maxRetakes: 3,
        status: "active",
      });
      const quizId = (quizResult as any)[0]?.insertId;
      console.log(`    + Quiz: ${mod.quiz.title} (${mod.quiz.questions.length} questions)`);

      // Insert quiz questions
      for (let i = 0; i < mod.quiz.questions.length; i++) {
        const q = mod.quiz.questions[i];
        await db.insert(trainingQuizQuestions).values({
          quizId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          regulationReference: q.regulationReference,
          orderIndex: i + 1,
        });
      }
    }
  }

  // Print summary
  const [modCount] = await db.execute(sql`SELECT COUNT(*) as c FROM lms_modules`);
  const [lessonCount] = await db.execute(sql`SELECT COUNT(*) as c FROM training_lessons`);
  const [quizCount] = await db.execute(sql`SELECT COUNT(*) as c FROM training_quizzes`);
  const [questionCount] = await db.execute(sql`SELECT COUNT(*) as c FROM training_quiz_questions`);
  console.log(`\n=== Summary ===`);
  console.log(`Modules: ${(modCount as any)[0]?.c}`);
  console.log(`Lessons: ${(lessonCount as any)[0]?.c}`);
  console.log(`Quizzes: ${(quizCount as any)[0]?.c}`);
  console.log(`Questions: ${(questionCount as any)[0]?.c}`);
  console.log("V5 Training Content Seed Complete!");
  await connection.end();
}

main().catch(console.error);
