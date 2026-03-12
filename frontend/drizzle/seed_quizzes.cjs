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

  // Get all modules
  const [modules] = await conn.execute(`
    SELECT m.id, m.courseId, m.title, m.orderIndex, c.slug, c.passingScore
    FROM lms_modules m JOIN training_courses c ON m.courseId = c.id
    ORDER BY c.slug, m.orderIndex
  `);
  console.log('Modules:', modules.length);

  // Create one quiz per module
  let quizCount = 0;
  for (const mod of modules) {
    try {
      await conn.execute(
        `INSERT INTO training_quizzes (moduleId, title, description, passingScore, timeLimitMinutes, questionCount, randomizeQuestions, allowRetakes, maxRetakes, status)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, 3, 'active')`,
        [mod.id, `${mod.title} Quiz`, `Assessment for ${mod.title}`, mod.passingScore || 80, 15, 4]
      );
      quizCount++;
    } catch (e) {
      console.log('Quiz ERR:', mod.title, e.message.substring(0, 60));
    }
  }
  console.log('Quizzes created:', quizCount);

  // Get all quiz IDs mapped to module info
  const [quizzes] = await conn.execute(`
    SELECT q.id as quizId, q.moduleId, m.title as mTitle, m.orderIndex, c.slug
    FROM training_quizzes q
    JOIN lms_modules m ON q.moduleId = m.id
    JOIN training_courses c ON m.courseId = c.id
    ORDER BY c.slug, m.orderIndex
  `);
  console.log('Quizzes loaded:', quizzes.length);

  // Generate questions for each quiz
  let qCount = 0;
  for (const quiz of quizzes) {
    const questions = generateQuestions(quiz);
    for (const q of questions) {
      try {
        await conn.execute(
          `INSERT INTO training_quiz_questions (quizId, questionText, questionType, options, correctAnswer, explanation, difficulty, regulationReference, orderIndex)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [quiz.quizId, q.text, q.type, JSON.stringify(q.options), q.correct, q.explanation, q.difficulty, q.ref, q.order]
        );
        qCount++;
      } catch (e) {
        console.log('Q ERR:', q.text.substring(0, 40), e.message.substring(0, 60));
      }
    }
  }
  console.log('Questions inserted:', qCount);

  const [tc] = await conn.execute('SELECT COUNT(*) as c FROM training_quizzes');
  const [tq] = await conn.execute('SELECT COUNT(*) as c FROM training_quiz_questions');
  console.log('TOTAL: Quizzes=' + tc[0].c + ', Questions=' + tq[0].c);
  await conn.end();
  console.log('DONE');
}

function generateQuestions(quiz) {
  const s = quiz.slug;
  const mi = quiz.orderIndex;
  const questions = [];

  // Course-specific questions with real regulatory content
  const bank = getQuestionBank(s, mi);
  bank.forEach((q, i) => {
    questions.push({ ...q, order: i + 1 });
  });
  return questions;
}

function mc(text, opts, correctIdx, explanation, difficulty, ref) {
  const letters = ['A', 'B', 'C', 'D'];
  return {
    text,
    type: 'multiple_choice',
    options: opts.map((o, i) => ({ id: letters[i], text: o, isCorrect: i === correctIdx })),
    correct: letters[correctIdx],
    explanation,
    difficulty: difficulty || 'medium',
    ref: ref || null,
  };
}

function tf(text, isTrue, explanation, difficulty, ref) {
  return {
    text,
    type: 'true_false',
    options: [{ id: 'T', text: 'True', isCorrect: isTrue }, { id: 'F', text: 'False', isCorrect: !isTrue }],
    correct: isTrue ? 'T' : 'F',
    explanation,
    difficulty: difficulty || 'easy',
    ref: ref || null,
  };
}

function getQuestionBank(slug, moduleIndex) {
  const banks = {
    'hos-compliance-mastery': {
      1: [
        mc('What is the maximum daily driving limit for property-carrying CMV drivers under FMCSA HOS rules?', ['10 hours', '11 hours', '12 hours', '14 hours'], 1, 'Under 49 CFR §395.3(a)(3), drivers may drive a maximum of 11 hours after 10 consecutive hours off duty.', 'easy', '49 CFR §395.3(a)(3)'),
        mc('HOS regulations apply to drivers of vehicles with a GVWR exceeding:', ['8,001 lbs', '10,001 lbs', '14,001 lbs', '26,001 lbs'], 1, 'CMVs are defined as vehicles over 10,001 lbs GVWR per 49 CFR §390.5.', 'easy', '49 CFR §390.5'),
        tf('The FMCSA derives its HOS authority from Title 49 of the United States Code.', true, 'FMCSA authority comes from 49 U.S.C. §31136 and §31502.', 'easy', '49 U.S.C. §31136'),
        mc('Approximately what percentage of large truck crashes involve fatigue as a factor?', ['5%', '13%', '25%', '40%'], 1, 'Research indicates fatigue is a factor in approximately 13% of large truck crashes.', 'medium'),
      ],
      2: [
        mc('After 10 consecutive hours off duty, a driver may drive for a maximum of:', ['8 hours', '10 hours', '11 hours', '14 hours'], 2, 'The 11-hour driving limit applies after 10 consecutive hours off duty.', 'easy', '49 CFR §395.3(a)(3)'),
        mc('The 14-hour on-duty window:', ['Can be paused with off-duty time', 'Runs continuously from first on-duty time', 'Only counts driving time', 'Resets after a 30-minute break'], 1, 'The 14-hour window runs continuously and cannot be paused except with qualifying sleeper berth time.', 'medium', '49 CFR §395.3(a)(2)'),
        tf('Off-duty time during the 14-hour window stops the clock from running.', false, 'The 14-hour window runs continuously. Only a full 10-hour off-duty period or qualifying sleeper berth time resets it.', 'medium', '49 CFR §395.3(a)(2)'),
        mc('Adverse driving conditions can extend the driving limit by up to:', ['1 hour', '2 hours', '3 hours', '4 hours'], 1, 'Under §395.1(b), adverse driving conditions can extend the 11-hour driving limit by up to 2 hours.', 'medium', '49 CFR §395.1(b)'),
      ],
      3: [
        mc('Carriers operating every day of the week must follow which cumulative limit?', ['60 hours in 7 days', '70 hours in 8 days', '80 hours in 9 days', '60 hours in 8 days'], 1, 'Carriers operating every day: 70 hours in 8 consecutive days. Otherwise: 60 hours in 7 days.', 'medium', '49 CFR §395.3(b)'),
        mc('A 34-hour restart requires how many consecutive hours off duty?', ['24 hours', '30 hours', '34 hours', '36 hours'], 2, 'The 34-hour restart provision requires 34 or more consecutive hours off duty.', 'easy', '49 CFR §395.3(c)'),
        tf('On-duty not-driving time counts against the 60/70-hour limits.', true, 'All on-duty time (driving and not driving) counts against the 60/70-hour limits.', 'medium', '49 CFR §395.3(b)'),
        tf('There is currently a limit on how frequently a driver may use the 34-hour restart.', false, 'There is currently no limit on restart frequency. Previous restrictions were suspended.', 'hard', '49 CFR §395.3(c)'),
      ],
      4: [
        mc('Which of the following is a valid sleeper berth split under current rules?', ['6/4 split', '7/3 split', '5/5 split', '9/1 split'], 1, 'The 7/3 split (7 hours in sleeper + 3 hours off duty or in sleeper) is a valid split.', 'medium', '49 CFR §395.1(g)'),
        tf('When using a valid sleeper berth split, neither qualifying period counts against the 14-hour window.', true, 'Properly paired sleeper berth periods effectively pause the 14-hour window.', 'hard', '49 CFR §395.1(g)'),
        mc('The minimum sleeper berth period in a split must be at least:', ['2 hours', '3 hours', '5 hours', '7 hours'], 3, 'In a 7/3 split, the sleeper berth period must be at least 7 consecutive hours.', 'medium', '49 CFR §395.1(g)'),
        mc('A driver using the 7/3 split must spend the 7-hour period:', ['Off duty at any location', 'In the sleeper berth', 'At a rest area', 'At a truck stop'], 1, 'The 7-hour portion must be spent in the sleeper berth compartment.', 'easy', '49 CFR §395.1(g)'),
      ],
      5: [
        mc('The short-haul exemption applies within what air-mile radius?', ['75 air miles', '100 air miles', '150 air miles', '200 air miles'], 2, 'The short-haul exemption under §395.1(e) applies within a 150 air-mile radius.', 'easy', '49 CFR §395.1(e)'),
        tf('Short-haul exempt drivers must still maintain time records.', true, 'Short-haul drivers are exempt from RODS/ELD but must maintain time records per §395.1(e)(5).', 'medium', '49 CFR §395.1(e)(5)'),
        mc('Which operation has specific HOS exemptions?', ['Long-haul interstate', 'Agricultural operations', 'Household goods moving', 'Tanker operations'], 1, 'Agricultural operations have specific exemptions under §395.1(k).', 'medium', '49 CFR §395.1(k)'),
        mc('A short-haul driver must return to their reporting location within how many hours?', ['10 hours', '12 hours', '14 hours', '16 hours'], 2, 'Short-haul drivers must return within 14 hours of coming on duty.', 'easy', '49 CFR §395.1(e)'),
      ],
      6: [
        mc('Which is the most common HOS violation at roadside inspections?', ['No RODS', 'False log entries', 'Driving beyond 11-hour limit', 'Exceeding 70-hour limit'], 2, 'Driving beyond the 11-hour limit is consistently among the top HOS violations found at roadside.', 'medium'),
        mc('The maximum civil penalty per HOS violation can reach:', ['$5,000', '$11,000', '$16,000', '$25,000'], 2, 'Civil penalties for HOS violations can reach up to $16,000 per violation.', 'hard'),
        tf('An out-of-service order for HOS requires a driver to take 10 consecutive hours off duty before driving.', true, 'Drivers placed OOS for HOS violations must take 10 consecutive hours off duty.', 'medium'),
        mc('Egregious HOS violations involving fatigue-related crashes can result in carrier fines exceeding:', ['$16,000', '$25,000', '$50,000', '$75,000'], 3, 'Egregious violations can result in penalties exceeding $75,000 for carriers.', 'hard'),
      ],
    },
    'hazmat-transportation-certification': {
      1: [
        mc('How many primary hazard classes exist in the DOT hazmat classification system?', ['5', '7', '9', '12'], 2, 'There are 9 primary hazard classes in the DOT system.', 'easy', '49 CFR §173'),
        mc('Class 1 hazardous materials are:', ['Flammable liquids', 'Explosives', 'Oxidizers', 'Corrosives'], 1, 'Class 1 covers explosives with 6 divisions.', 'easy', '49 CFR §173.50'),
        tf('A material can have both a primary and subsidiary hazard class.', true, 'Many hazardous materials have subsidiary hazards requiring additional labels.', 'medium', '49 CFR §172.402'),
        mc('Class 7 hazardous materials are:', ['Flammable solids', 'Toxic substances', 'Radioactive materials', 'Miscellaneous hazardous materials'], 2, 'Class 7 covers radioactive materials.', 'easy', '49 CFR §173.403'),
      ],
      2: [
        mc('A hazmat shipping paper must include all EXCEPT:', ['Proper shipping name', 'UN/NA identification number', 'Driver license number', 'Hazard class'], 2, 'Shipping papers require proper shipping name, UN/NA number, hazard class, and packing group—not driver license.', 'medium', '49 CFR §172.202'),
        tf('An emergency response telephone number must be on every hazmat shipping paper.', true, 'Per §172.604, an emergency response number must be on shipping papers.', 'easy', '49 CFR §172.604'),
        mc('The proper sequence on a shipping paper is:', ['Hazard class, UN number, proper shipping name', 'Proper shipping name, hazard class, UN number', 'UN number, proper shipping name, hazard class', 'Any order is acceptable'], 1, 'The required sequence is: proper shipping name, hazard class, UN/NA number, packing group.', 'hard', '49 CFR §172.202(a)'),
        mc('Hazmat shipping papers must be retained for:', ['30 days', '6 months', '1 year', '2 years'], 3, 'Shipping papers must be retained for a minimum of 2 years after acceptance.', 'medium', '49 CFR §172.201(e)'),
      ],
      3: [
        mc('Package orientation arrows are required for:', ['All hazmat', 'Liquids in non-bulk packaging', 'Solids only', 'Class 1 only'], 1, 'Orientation arrows are required for non-bulk packages containing liquids.', 'medium', '49 CFR §172.312'),
        tf('The UN specification marking on a package indicates it has been tested to meet performance standards.', true, 'UN markings indicate the package meets performance-oriented packaging standards.', 'easy', '49 CFR §178.503'),
        mc('Hazard warning labels must be at least:', ['2 inches square', '3 inches square', '3.9 inches (100mm) square', '6 inches square'], 2, 'Hazard labels must be at least 100mm (3.9 inches) on each side.', 'medium', '49 CFR §172.407'),
        mc('Which marking is required on all hazmat packages?', ['Proper shipping name and UN number', 'Emergency phone number', 'Driver name', 'Carrier DOT number'], 0, 'All hazmat packages must be marked with the proper shipping name and UN/NA identification number.', 'easy', '49 CFR §172.301'),
      ],
      4: [
        mc('Table 1 placards are required:', ['For any quantity', 'Only for 1,001+ lbs', 'Only for bulk shipments', 'Only with shipping papers'], 0, 'Table 1 materials (most dangerous) require placards for any quantity.', 'medium', '49 CFR §172.504'),
        mc('Table 2 materials require placards when the aggregate amount exceeds:', ['100 lbs', '500 lbs', '1,001 lbs', '5,000 lbs'], 2, 'Table 2 materials require placards when aggregate gross weight exceeds 1,001 lbs.', 'easy', '49 CFR §172.504(c)'),
        tf('The DANGEROUS placard may be used as a substitute for certain Table 2 materials.', true, 'The DANGEROUS placard may substitute for individual placards when carrying multiple Table 2 materials per §172.504(b).', 'medium', '49 CFR §172.504(b)'),
        mc('Placards must be at least:', ['6 inches on each side', '8 inches on each side', '10.8 inches (273mm) on each side', '12 inches on each side'], 2, 'Placards must be at least 273mm (10.8 inches) on each side.', 'medium', '49 CFR §172.519'),
      ],
      5: [
        mc('Performance-oriented packaging standards (POP) are found in:', ['49 CFR Part 171', '49 CFR Part 173', '49 CFR Part 178', '49 CFR Part 180'], 2, 'POP standards for packaging are in 49 CFR Part 178.', 'hard', '49 CFR Part 178'),
        tf('All specification packaging must be retested periodically.', true, 'Specification containers require periodic retesting per 49 CFR Part 180.', 'medium', '49 CFR Part 180'),
        mc('The packing group indicates:', ['Container size', 'Degree of danger', 'Shipping method', 'Insurance requirement'], 1, 'Packing groups (I, II, III) indicate the degree of danger: I=great, II=medium, III=minor.', 'easy', '49 CFR §173.2a'),
        mc('Packing Group I indicates:', ['Minor danger', 'Medium danger', 'Great danger', 'No danger'], 2, 'PG I = great danger, PG II = medium danger, PG III = minor danger.', 'easy', '49 CFR §173.2a'),
      ],
      6: [
        mc('The segregation table in 49 CFR §177.848 specifies:', ['Maximum package weights', 'Separation requirements between hazard classes', 'Stacking height limits', 'Temperature control requirements'], 1, 'The segregation table specifies which hazard classes must be separated during transport.', 'medium', '49 CFR §177.848'),
        tf('Oxidizers and flammable liquids may be loaded together without restriction.', false, 'Oxidizers and flammable liquids require separation per the segregation table.', 'easy', '49 CFR §177.848'),
        mc('Who is responsible for blocking and bracing hazmat cargo?', ['The shipper', 'The driver/carrier', 'The receiver', 'FMCSA'], 1, 'The driver/carrier is responsible for proper loading and securement.', 'medium', '49 CFR §177.834'),
        mc('Temperature-controlled materials require:', ['Special permits only', 'Continuous temperature monitoring', 'Placards only', 'No special requirements'], 1, 'Temperature-controlled materials must be continuously monitored during transport.', 'hard', '49 CFR §173.21'),
      ],
      7: [
        mc('The Emergency Response Guidebook (ERG) is published by:', ['FMCSA', 'EPA', 'DOT/PHMSA/Transport Canada/SCT', 'OSHA'], 2, 'The ERG is jointly published by US DOT/PHMSA, Transport Canada, and Mexico SCT.', 'easy'),
        mc('ERG isolation distances for large spills of toxic materials can exceed:', ['100 feet', '500 feet', '0.5 miles', '7+ miles'], 3, 'Table 1 (TIH) materials can have initial isolation distances exceeding 7 miles downwind.', 'hard'),
        tf('The ERG should be used for the first 30 minutes of a hazmat incident.', false, 'The ERG is designed for the initial response phase, typically the first 15-20 minutes.', 'medium'),
        mc('In the ERG, orange-bordered pages provide:', ['Chemical names', 'Safety recommendations', 'Isolation distances', 'UN numbers'], 1, 'Orange pages provide safety recommendations including fire, spill, and first aid guidance.', 'medium'),
      ],
      8: [
        mc('A hazmat security plan is required for carriers transporting:', ['Any hazmat', 'Certain high-hazard materials (select agents, large quantities)', 'Only Class 1 materials', 'Only radioactive materials'], 1, 'Security plans are required for carriers of certain high-hazard materials per §172.800.', 'hard', '49 CFR §172.800'),
        tf('Hazmat incidents resulting in death must be reported immediately by phone.', true, 'Immediate phone notification to the National Response Center is required for incidents involving death, per §171.15.', 'easy', '49 CFR §171.15'),
        mc('A written hazmat incident report must be filed within:', ['24 hours', '48 hours', '30 days', '90 days'], 2, 'Written incident reports (DOT Form 5800.1) must be filed within 30 days.', 'medium', '49 CFR §171.16'),
        mc('The National Response Center phone number is:', ['911', '1-800-424-8802', '1-800-HM-ALERT', '511'], 1, 'The NRC can be reached at 1-800-424-8802 for immediate hazmat incident reporting.', 'easy', '49 CFR §171.15'),
      ],
    },
  };

  // Get specific bank or generate generic questions
  const courseBank = banks[slug];
  if (courseBank && courseBank[moduleIndex]) {
    return courseBank[moduleIndex];
  }

  // Generic but meaningful questions for modules without specific banks
  return generateGenericQuestions(slug, moduleIndex);
}

function generateGenericQuestions(slug, moduleIndex) {
  // Create 4 relevant generic questions per module based on course topic
  const topicMap = {
    'fmcsa-safety-audit-preparation': { topic: 'FMCSA safety audits', reg: '49 CFR Part 385' },
    'eld-compliance-operation': { topic: 'ELD compliance', reg: '49 CFR Part 395 Subpart B' },
    'driver-wellness-fatigue-management': { topic: 'driver wellness and fatigue management', reg: null },
    'defensive-driving-cmv': { topic: 'defensive driving for CMVs', reg: null },
    'cargo-securement-standards': { topic: 'cargo securement', reg: '49 CFR Part 393' },
    'pre-trip-post-trip-inspection': { topic: 'vehicle inspections', reg: '49 CFR §396.11' },
    'drug-alcohol-compliance': { topic: 'drug and alcohol compliance', reg: '49 CFR Parts 40, 382' },
    'csa-score-management': { topic: 'CSA score management', reg: 'FMCSA SMS' },
    'canadian-tdg-certification': { topic: 'Canadian TDG regulations', reg: 'TDG Act' },
    'canadian-hos-eld-rules': { topic: 'Canadian HOS and ELD rules', reg: 'SOR/2005-313' },
    'normas-oficiales-mexicanas-transporte': { topic: 'Mexican NOM transport regulations', reg: 'NOM-012-SCT' },
    'cross-border-us-canada': { topic: 'US-Canada cross-border operations', reg: 'FAST/ACE/ACI' },
    'cross-border-us-mexico': { topic: 'US-Mexico cross-border operations', reg: 'C-TPAT/CBP' },
    'winter-driving-extreme-weather': { topic: 'winter and extreme weather driving', reg: null },
    'tanker-vehicle-operations': { topic: 'tanker vehicle operations', reg: '49 CFR Part 173' },
    'oversize-overweight-load-compliance': { topic: 'oversize/overweight load compliance', reg: '23 CFR Part 658' },
    'accident-reporting-post-crash': { topic: 'accident reporting and post-crash procedures', reg: '49 CFR §390.5' },
    'environmental-compliance-trucking': { topic: 'environmental compliance for trucking', reg: 'EPA SmartWay' },
  };

  const info = topicMap[slug] || { topic: 'transportation compliance', reg: null };
  const t = info.topic;
  const r = info.ref;

  // Generate 4 unique questions per module using module index for variation
  const templates = [
    [
      mc(`Which of the following is a key requirement of ${t}?`, ['Annual self-audit', 'Proper documentation and recordkeeping', 'Optional compliance only', 'No specific requirements exist'], 1, `Proper documentation and recordkeeping is fundamental to ${t}.`, 'easy', info.reg),
      tf(`Compliance with ${t} regulations is mandatory for all applicable carriers.`, true, `All carriers within scope must comply with ${t} requirements.`, 'easy', info.reg),
      mc(`What is the primary purpose of ${t} regulations?`, ['Revenue generation', 'Safety and compliance', 'Vehicle aesthetics', 'Driver entertainment'], 1, `The primary purpose is ensuring safety and compliance in transportation operations.`, 'easy', info.reg),
      mc(`Non-compliance with ${t} requirements can result in:`, ['No consequences', 'Fines and penalties only', 'Fines, penalties, and out-of-service orders', 'A written warning only'], 2, `Non-compliance can lead to fines, penalties, out-of-service orders, and potential loss of operating authority.`, 'medium', info.reg),
    ],
    [
      mc(`Training on ${t} should be renewed:`, ['Never', 'Every 5 years', 'At the interval specified by regulations', 'Only after an incident'], 2, `Training renewal should follow the regulatory-specified interval to maintain compliance.`, 'medium', info.reg),
      tf(`Employers are responsible for ensuring employees are trained on ${t}.`, true, `Employers bear responsibility for employee training and compliance.`, 'easy', info.reg),
      mc(`The best way to stay current on ${t} is:`, ['Ignore updates', 'Regular training and regulatory monitoring', 'Ask other drivers', 'Check social media'], 1, `Regular training and monitoring regulatory updates is essential for compliance.`, 'easy'),
      mc(`Documentation of ${t} training must be:`, ['Verbal only', 'Kept by the driver only', 'Maintained by the carrier with proper records', 'Not required'], 2, `Carriers must maintain proper training documentation and records.`, 'medium', info.reg),
    ],
    [
      mc(`Who is ultimately responsible for ensuring ${t} compliance?`, ['The government', 'The shipper only', 'Both the carrier and driver', 'No one'], 2, `Both carriers and drivers share responsibility for compliance.`, 'medium', info.reg),
      tf(`Violations of ${t} rules can affect a carrier's safety rating.`, true, `Violations contribute to safety ratings and CSA scores.`, 'medium'),
      mc(`In the event of a ${t} violation during a roadside inspection:`, ['Nothing happens', 'A warning is always issued first', 'The driver may be placed out of service', 'The vehicle is permanently impounded'], 2, `Violations can result in out-of-service orders depending on severity.`, 'medium'),
      mc(`The best practice for ${t} is to:`, ['React only after violations', 'Implement proactive compliance programs', 'Ignore minor issues', 'Delegate all responsibility to drivers'], 1, `Proactive compliance programs prevent violations and improve safety outcomes.`, 'easy'),
    ],
    [
      mc(`How often should ${t} procedures be reviewed?`, ['Only when regulations change', 'Annually at minimum', 'Every 5 years', 'Never after initial training'], 1, `Best practice is annual review at minimum, plus whenever regulations change.`, 'medium'),
      tf(`Record retention requirements for ${t} vary by specific regulation.`, true, `Different regulations specify different retention periods for various documents.`, 'medium', info.reg),
      mc(`A driver discovers a ${t} violation during operations. The correct action is:`, ['Continue and report later', 'Stop operations and address immediately', 'Ignore if minor', 'Call home office only'], 1, `Violations should be addressed immediately to prevent safety risks and escalating penalties.`, 'easy'),
      mc(`Which agency has primary oversight of ${t}?`, ['EPA', 'OSHA', 'The relevant transportation authority (FMCSA/Transport Canada/SCT)', 'FCC'], 2, `Transportation safety agencies have primary regulatory oversight.`, 'easy', info.reg),
    ],
    [
      mc(`Failure to maintain proper ${t} records can result in fines up to:`, ['$100', '$1,000', 'Thousands of dollars per violation', 'No fines apply'], 2, `Recordkeeping violations can result in significant fines per violation.`, 'hard', info.reg),
      tf(`Technology solutions can help automate ${t} compliance.`, true, `Modern technology including ELDs, fleet management software, and compliance platforms significantly aid compliance.`, 'easy'),
      mc(`During an audit, ${t} documentation should be:`, ['Hidden from auditors', 'Readily available and organized', 'Provided only if subpoenaed', 'Memorized only'], 1, `Documentation must be readily available and organized for audits.`, 'easy'),
      mc(`The consequence of repeated ${t} violations includes:`, ['A stern letter', 'Potential loss of operating authority', 'A small fine only', 'No additional consequences'], 1, `Repeated violations can lead to loss of operating authority and increased enforcement actions.`, 'hard', info.reg),
    ],
    [
      mc(`What role does training play in ${t}?`, ['Optional enhancement', 'Critical compliance requirement', 'Unnecessary overhead', 'Only for new employees'], 1, `Training is a critical component of regulatory compliance.`, 'easy'),
      tf(`Carriers with strong ${t} programs tend to have better safety records.`, true, `Proactive compliance programs correlate with improved safety outcomes.`, 'easy'),
      mc(`When regulations for ${t} are updated, carriers should:`, ['Wait for enforcement actions', 'Review and update procedures promptly', 'Ignore until the next audit', 'Continue old practices'], 1, `Carriers should promptly review and update procedures when regulations change.`, 'medium'),
      mc(`A comprehensive ${t} program includes:`, ['Training only', 'Documentation only', 'Training, documentation, auditing, and continuous improvement', 'Nothing specific'], 2, `Effective programs combine training, documentation, regular auditing, and continuous improvement.`, 'medium'),
    ],
    [
      mc(`In ${t}, a "best practice" approach means:`, ['Meeting minimum requirements only', 'Exceeding minimum standards with proactive measures', 'Ignoring regulations', 'Following competitors'], 1, `Best practices exceed minimum requirements through proactive safety measures.`, 'medium'),
      tf(`Third-party audits can help identify gaps in ${t} compliance.`, true, `External audits provide objective assessment of compliance gaps.`, 'easy'),
      mc(`The most effective way to communicate ${t} changes to drivers is:`, ['Post a notice in the break room', 'Conduct formal training with documentation', 'Send a text message', 'Hope they figure it out'], 1, `Formal training with documentation ensures understanding and creates compliance records.`, 'easy'),
      mc(`A new driver should receive ${t} training:`, ['After their first year', 'Before beginning operations', 'Only if they request it', 'After their first violation'], 1, `New drivers must be trained before beginning operations.`, 'easy'),
    ],
    [
      mc(`Self-inspection programs for ${t} should be conducted:`, ['Annually', 'Only when required by regulators', 'Never', 'Every 5 years'], 0, `Regular self-inspections help identify and correct issues before regulatory audits.`, 'medium'),
      tf(`Carrier management is responsible for creating a culture of ${t} compliance.`, true, `Management must establish and maintain a compliance culture throughout the organization.`, 'easy'),
      mc(`The financial impact of ${t} non-compliance includes:`, ['Fines only', 'Fines, increased insurance, lost business, and legal liability', 'No financial impact', 'Tax deductions'], 1, `Non-compliance has broad financial impacts including fines, insurance costs, lost business, and legal liability.`, 'medium'),
      mc(`To prepare for a regulatory audit on ${t}, a carrier should:`, ['Destroy questionable records', 'Conduct internal pre-audits and organize documentation', 'Refuse the audit', 'Hire a lawyer to block access'], 1, `Internal pre-audits and organized documentation are key audit preparation steps.`, 'easy'),
    ],
  ];

  // Use moduleIndex to pick template set (cycle through if more modules than templates)
  const idx = (moduleIndex - 1) % templates.length;
  return templates[idx];
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
