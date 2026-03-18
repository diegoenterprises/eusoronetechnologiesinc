# EusoTrip 2,000 Scenarios — Part 27
## Compliance & Regulatory Deep Dive (CRD-651 through CRD-675)

**Document:** Part 27 of 80  
**Scenario Range:** CRD-651 → CRD-675  
**Category:** PHMSA Special Permits, DOT Audits, FMCSA CSA Disputes, EPA RMP, State Permits, HOS Exemptions, Canadian TDG, Mexican NOM, OSHA PSM, Drug Testing, DQF Audits, Security Plans, Tank Age Compliance, Retest Scheduling, Radioactive Routing  
**Cumulative Total After This Document:** 675 of 2,000  
**Platform Gaps (Running):** GAP-083 + new  

---

## CRD-651: PHMSA SPECIAL PERMIT APPLICATION — TRANSPORTING ABOVE STANDARD LIMITS
**Company:** Targa Resources (Houston, TX — NGL gathering & processing)  
**Season:** Summer | **Time:** 9:00 AM CDT | **Route:** Targa Mont Belvieu, TX → Targa Channelview, TX (22 miles)

**Narrative:** Targa needs to transport 11,500 gallons of propane in a single MC-331 tanker that's rated for 10,500 gallons. Rather than split into two loads, Targa applies for a PHMSA Special Permit (DOT-SP) to exceed the standard capacity limit by 9.5%. Tests the platform's special permit application support, permit tracking, and compliance enforcement during transport.

**Steps:**
1. **Shipper** (Targa) creates load → propane (UN1978, Class 2.1) → 11,500 gallons → MC-331 tanker
2. **System flags:** "⚠️ QUANTITY EXCEEDS STANDARD LIMIT — 11,500 gal exceeds MC-331 standard capacity of 10,500 gal. PHMSA Special Permit (DOT-SP) may be required."
3. **ESANG AI™** advises: "Under 49 CFR 107.105, you may apply for a Special Permit to exceed packaging standards. Requirements: engineering analysis, risk assessment, and public comment period (typically 120+ days)."
4. **Compliance Officer** (Targa) initiates DOT-SP application through platform:
   - Form: DOT-SP application (49 CFR 107.105)
   - Engineering analysis: MC-331 stress test shows safe at 11,500 gal (109.5% capacity)
   - Risk assessment: 22-mile route, low speed, no population centers
   - Proposed compensatory measures: Reduced speed (45 mph max), escort vehicle, real-time pressure monitoring
5. **Platform tracks** application status: "DOT-SP-XXXXX — Submitted → Under Review → Public Comment Period → Approved/Denied"
6. **Day 90:** PHMSA grants Special Permit DOT-SP-21847 → valid for 2 years → conditions: max 11,500 gal, specific route only, escort required, 45 mph max
7. **Permit entered into platform:** Compliance Officer uploads DOT-SP-21847 → system links to Targa's company profile → permit conditions auto-enforced
8. **Load creation:** Shipper creates load with 11,500 gal → system checks: DOT-SP-21847 valid ✅ → route matches permit route ✅ → escort required ✅
9. **Driver dispatched** with permit documentation → escort vehicle arranged → speed limited to 45 mph per permit conditions
10. **En route monitoring:** GPS confirms speed ≤45 mph → pressure sensors log real-time data → all permit conditions met
11. **Delivery complete:** 11,500 gal delivered → permit usage logged → 1 of 24 permitted trips/year consumed
12. **Permit renewal tracking:** System alerts 90 days before DOT-SP-21847 expiration: "Your PHMSA Special Permit expires in 90 days — initiate renewal?"

**Expected Outcome:** Platform supports PHMSA Special Permit application, tracks permit status, auto-enforces permit conditions during transport, and manages renewal timelines.

**Platform Features Tested:** PHMSA Special Permit detection (exceeds standard limits), DOT-SP application tracking, permit condition enforcement (route, speed, escort), permit linkage to company profile, usage counting (trips/year), renewal alerting, real-time condition monitoring

**Validations:**
- ✅ Over-capacity flagged with regulatory citation
- ✅ Special permit application tracked through stages
- ✅ Permit conditions auto-enforced during transport
- ✅ Speed compliance monitored via GPS
- ✅ Renewal alert generated 90 days before expiry

**ROI:** Targa saves $2,200 per trip (1 load vs. 2) × 24 trips/year = $52,800/year under special permit.

> **Platform Gap GAP-084:** No PHMSA Special Permit tracking system — platform cannot store, link, or enforce DOT-SP conditions. Need permit database with condition enforcement, usage tracking, and renewal management.

---

## CRD-652: DOT COMPLIANCE REVIEW (AUDIT) SIMULATION — 3-DAY FEDERAL AUDIT
**Company:** Groendyke Transport (Enid, OK — largest US bulk tanker carrier)  
**Season:** Fall | **Time:** Monday 8:00 AM CDT | **Route:** N/A — Groendyke headquarters, company-wide audit

**Narrative:** FMCSA notifies Groendyke of a scheduled Compliance Review (CR) — a comprehensive 3-day audit of their entire operation. The auditor will examine driver qualification files (DQF), HOS records, vehicle maintenance, drug testing, hazmat training, accident register, and financial responsibility. EusoTrip must generate all required documentation from the platform. Tests the platform's audit readiness and document generation.

**Steps:**
1. **Notification:** FMCSA sends Compliance Review letter → Groendyke has 30 days to prepare → enters audit date into platform
2. **Platform's Audit Preparation Module activates:**
   - Auto-generates audit readiness checklist based on FMCSA's Compliance Review format
   - Identifies potential issues BEFORE auditor arrives
   - Pre-generates all required documentation packages
3. **Day 1 — Driver Qualification Files (49 CFR 391):**
   - Auditor requests DQFs for 25 randomly selected drivers
   - Platform generates each DQF package: CDL copy, medical certificate (DOT physical), driving record (MVR), employment application, road test certificate, annual review of driving record, list of violations
   - System pre-check: 24/25 DQFs complete ✅ → 1 driver missing current MVR (expired 12 days ago)
   - **Pre-audit fix:** Platform flagged the expired MVR 12 days ago → if Groendyke updated it, clean audit; if not, violation
4. **Day 2 — HOS & Vehicle Maintenance:**
   - Auditor requests 6 months of HOS records for 25 drivers → platform exports ELD data in FMCSA-required format
   - Vehicle maintenance records: 50 randomly selected trucks → platform generates maintenance logs, inspection reports, out-of-service repairs
   - DVIR (Driver Vehicle Inspection Reports): Platform exports daily DVIRs for requested period
5. **Day 3 — Drug Testing & Hazmat:**
   - Drug/alcohol testing program records: random selection rates (50% drug, 10% alcohol minimum), test results, chain of custody, SAP follow-up documentation
   - Hazmat training records: 49 CFR 172.704 — initial training, recurrent training (every 3 years), function-specific, safety, security awareness
   - Accident register (49 CFR 390.15): All DOT-reportable accidents in past 3 years
6. **Audit scoring:** FMCSA rates each area: Satisfactory, Conditional, or Unsatisfactory
   - Driver Safety: Satisfactory (1 expired MVR — marginal finding)
   - Vehicle Maintenance: Satisfactory (all records complete)
   - HOS Compliance: Satisfactory (ELD data clean)
   - Drug Testing: Satisfactory (52% random rate, all documented)
   - Hazmat: Satisfactory (all training current)
7. **Overall rating:** SATISFACTORY → Groendyke maintains clean safety record
8. **Post-audit:** Platform generates "Audit Report Card" → stores audit results → tracks corrective actions for the 1 expired MVR

**Expected Outcome:** Platform generates all FMCSA Compliance Review documentation, pre-identifies issues, exports data in required formats, and tracks post-audit corrective actions.

**Platform Features Tested:** Audit preparation module, DQF generation (7 document types per driver), HOS export in FMCSA format, vehicle maintenance log generation, DVIR export, drug testing program documentation, hazmat training record management, accident register, pre-audit issue detection, post-audit corrective action tracking

**Validations:**
- ✅ 25 DQFs generated with 7 documents each
- ✅ 6 months HOS data exported in FMCSA format
- ✅ Drug testing records complete with chain of custody
- ✅ Hazmat training certificates current for all drivers
- ✅ Pre-audit flagged expired MVR before auditor found it

**ROI:** Groendyke's audit preparation time: 8 hours via platform vs. 120 hours manual (3 staff × 40 hours) → saves $11,200 in labor → Satisfactory rating maintained (Conditional rating would cost $85,000+ in remediation).

> **Platform Gap GAP-085:** No Audit Preparation Module — platform stores individual records but cannot auto-generate FMCSA Compliance Review documentation packages, pre-identify issues, or export in FMCSA-required formats. Need comprehensive audit readiness system.

---

## CRD-653: FMCSA CSA SCORE DISPUTE — CARRIER CHALLENGES UNSAFE DRIVING BASIC
**Company:** Kenan Advantage Group (North Canton, OH — 2nd largest US tanker carrier)  
**Season:** Winter | **Time:** 10:00 AM EST | **Route:** N/A — CSA score dispute

**Narrative:** Kenan Advantage's Unsafe Driving BASIC score jumps from 42% to 78% (above the 65% intervention threshold) due to 3 recent roadside inspections with violations. However, 2 of the 3 inspections contain errors: one violation was for a vehicle Kenan sold 6 months ago (still showing under their DOT number), and another was a data entry error (Class 3 placards cited as violation when they were properly displayed — officer checked wrong box). Tests the platform's CSA monitoring and DataQs dispute support.

**Steps:**
1. **System monitors** Kenan's FMCSA BASICs scores via SAFER API → detects jump: Unsafe Driving 42% → 78%
2. **Alert:** "⚠️ CSA SCORE ALERT — Unsafe Driving BASIC at 78% (intervention threshold: 65%). 3 recent inspections contributing to increase."
3. **Safety Manager** (Kenan) reviews the 3 inspections in platform:
   - Inspection #1: Valid violation (driver speeding 12 mph over) → no dispute → accept
   - Inspection #2: Vehicle VIN matches truck sold 6 months ago → NOT Kenan's vehicle → dispute
   - Inspection #3: "Placards not displayed" violation → driver had photos proving placards were correct → dispute
4. **DataQs dispute process (49 CFR 385.13):**
   - Platform pre-fills FMCSA DataQs form for each disputed inspection
   - Inspection #2: Uploads bill of sale showing vehicle transfer → "Vehicle no longer in our fleet"
   - Inspection #3: Uploads timestamped driver photos showing correct Class 3 placards → "Violation issued in error"
5. **Platform tracks** DataQs submissions:
   - #2: Submitted → Under Review → ACCEPTED (violation removed from Kenan's record, 14 days)
   - #3: Submitted → Under Review → ACCEPTED (violation removed, 21 days)
6. **Score recalculation:** After 2 violations removed → Unsafe Driving BASIC recalculates: 78% → 38% (below intervention threshold) ✅
7. **Platform updates:** Kenan's safety score on EusoTrip adjusted → carrier profile shows clean score → no longer flagged for shippers
8. **Ongoing monitoring:** Platform checks BASICs scores weekly → alerts on threshold approaches → tracks DataQs dispute success rates
9. **Carrier scorecard:** "Kenan Advantage — CSA Dispute History: 2 disputes filed, 2 accepted (100% success rate)"

**Expected Outcome:** Platform monitors CSA scores, identifies disputable violations, supports DataQs filing, tracks dispute outcomes, and updates scores after successful disputes.

**Platform Features Tested:** FMCSA BASICs score monitoring, threshold alert (65%), inspection review interface, DataQs dispute pre-fill, evidence upload (photos, documents), dispute status tracking, score recalculation after dispute, carrier profile score update, dispute success rate tracking

**Validations:**
- ✅ BASICs score jump detected automatically
- ✅ 2 disputable violations identified
- ✅ DataQs forms pre-filled from platform data
- ✅ Both disputes accepted → violations removed
- ✅ Score recalculated below intervention threshold

**ROI:** Kenan avoids FMCSA intervention (targeted for compliance review at 78%) → saves $125,000 in audit costs and potential Conditional rating → maintains Satisfactory rating for shipper contracts.

> **Platform Gap GAP-086:** No CSA score monitoring or DataQs dispute support — platform doesn't track carrier BASICs scores or facilitate FMCSA dispute filings. Need SAFER API integration, weekly score monitoring, threshold alerts, and DataQs form pre-fill.

---

## CRD-654: EPA RISK MANAGEMENT PLAN — TERMINAL EXCEEDS THRESHOLD QUANTITY
**Company:** NGL Energy Partners (Tulsa, OK — crude & NGL terminal operations)  
**Season:** Spring | **Time:** 8:00 AM CDT | **Route:** NGL Cushing Terminal (storage facility, not transport)

**Narrative:** NGL Energy's Cushing terminal stores 2.4 million barrels of crude oil and butane. When their butane storage exceeds 10,000 lbs (EPA's threshold quantity for flammable mixtures), EPA's Risk Management Plan (RMP) regulations (40 CFR 68) kick in. A new shipment arriving via EusoTrip would push butane inventory above the threshold. Tests the platform's awareness of RMP thresholds and terminal inventory interaction.

**Steps:**
1. **Load LD-17000:** 180 BBL butane (UN1011, Class 2.1) destined for NGL Cushing Terminal
2. **Terminal Manager** (NGL) reviews incoming load → current butane inventory: 9,200 lbs → incoming: 1,800 lbs → post-delivery total: 11,000 lbs
3. **System detects:** "⚠️ EPA RMP THRESHOLD ALERT — Accepting this delivery will push butane inventory above 10,000 lbs (EPA threshold quantity under 40 CFR 68). This triggers Risk Management Plan requirements."
4. **RMP implications:**
   - Hazard Assessment: Must perform worst-case release scenario analysis
   - Prevention Program: Must implement management system, process hazard analysis, operating procedures
   - Emergency Response: Must coordinate with local fire department and LEPC (Local Emergency Planning Committee)
   - 5-Year Accident History: Must report any accidental releases
   - RMP submission to EPA: Due within 3 years of exceeding threshold (or immediately if already exceeded)
5. **Terminal Manager** reviews options:
   - A: Accept delivery → trigger RMP requirements (already partially compliant as large terminal)
   - B: Redirect delivery to another terminal below threshold
   - C: Reduce current inventory before accepting delivery
6. **Terminal Manager selects** Option A → accepts delivery → platform logs RMP threshold exceedance
7. **Compliance Officer** notified: "NGL Cushing now subject to EPA RMP Program 3 requirements for butane. Ensure Hazard Assessment, Prevention Program, and Emergency Response plan are current."
8. **Platform tracks:** RMP compliance status per terminal → "Cushing: RMP Status — Active, Last Updated: 2025-06-15, Next Review: 2028-06-15"
9. **Ongoing monitoring:** Every incoming flammable/toxic load → platform checks against terminal inventory thresholds → alerts before exceeding
10. **ESANG AI™:** "NGL Cushing's current RMP covers 14 regulated substances. Adding butane above threshold adds 1 more regulated process. Recommend updating Process Hazard Analysis within 90 days."

**Expected Outcome:** Platform tracks terminal chemical inventories against EPA RMP thresholds, alerts before threshold exceedance, and manages RMP compliance documentation.

**Platform Features Tested:** EPA RMP threshold tracking per terminal, chemical inventory monitoring, threshold exceedance prediction from incoming loads, compliance officer notification, RMP status tracking, ESANG AI regulatory advisory, terminal-level compliance dashboard

**Validations:**
- ✅ Threshold exceedance predicted from incoming load
- ✅ Terminal manager alerted before delivery
- ✅ Options presented (accept/redirect/reduce)
- ✅ RMP status tracked per terminal
- ✅ ESANG AI provides regulatory guidance

**ROI:** NGL avoids $37,500 EPA fine for operating without current RMP documentation → proactive compliance saves 200 staff-hours of reactive emergency compliance work.

> **Platform Gap GAP-087:** No terminal chemical inventory tracking or EPA RMP threshold monitoring — platform tracks loads but not terminal storage levels. Need inventory integration with RMP threshold alerting per regulated substance.

---

## CRD-655: STATE-BY-STATE HAZMAT PERMIT MATRIX — 48-STATE PERMIT COMPLIANCE CHECK
**Company:** Schneider National (Green Bay, WI — one of largest truckload carriers)  
**Season:** Any | **Time:** 7:00 AM CST | **Route:** Schneider nationwide fleet — all 48 contiguous states

**Narrative:** Schneider operates hazmat tankers in all 48 contiguous states. Each state has different hazmat permit requirements — some require annual permits, some require per-trip permits, some don't require any. Schneider needs to verify which states they're currently permitted for, which permits are expiring, and which states have changed requirements. Tests the platform's multi-state permit compliance matrix.

**Steps:**
1. **Compliance Officer** (Schneider) opens "Permit Compliance Dashboard" → requests 48-state hazmat permit status
2. **Platform generates** permit matrix:
   - **No permit required (14 states):** AL, AR, CO, GA, IA, ID, KS, LA, MO, NE, ND, OK, SD, WY
   - **Annual permit required (22 states):** AZ, CA, CT, FL, IL, IN, KY, MA, MD, ME, MI, MN, MS, NC, NH, NJ, NM, NY, OH, PA, TN, VA
   - **Per-trip permit required (4 states):** MT, NV, SC, WV
   - **Unified Carrier Registration required (8 states):** DE, OR, RI, TX, UT, VT, WA, WI
3. **Schneider's current status:**
   - 22 annual permits: 19 current ✅, 2 expiring within 30 days ⚠️ (OH, PA), 1 expired ❌ (NJ — expired 5 days ago)
   - UCR: Current for 2026 ✅
   - Per-trip: Valid process in place ✅
4. **Immediate alert:** "❌ NEW JERSEY HAZMAT PERMIT EXPIRED — Schneider cannot legally operate hazmat vehicles in NJ until renewed. 12 loads currently active in NJ routes."
5. **System actions:**
   - Flags 12 NJ-routed loads: "Route passes through NJ — permit expired — reroute or suspend?"
   - 7 loads can be rerouted to avoid NJ (slight mileage increase)
   - 5 loads must pass through NJ (no alternative) → suspended until permit renewed
6. **Compliance Officer** initiates NJ permit renewal → platform pre-fills application → emergency processing requested ($150 expedite fee)
7. **Expiring permits (OH, PA):** System auto-generates renewal applications → Compliance Officer reviews and submits → both renewed within 10 days
8. **ESANG AI™ regulatory update:** "⚠️ REGULATORY CHANGE — Texas now requires annual hazmat permit effective July 1 (previously UCR only). Schneider must obtain TX hazmat permit before July 1."
9. **Platform updates** permit matrix: TX moves from "UCR required" to "Annual permit required" → Schneider has 90 days to comply
10. **Annual compliance report:** "Schneider 48-State Hazmat Permit Status: 45/48 compliant, 3 actions required"

**Expected Outcome:** Platform maintains 48-state permit matrix, tracks expiration dates, auto-generates renewals, detects regulatory changes, and reroutes loads when permits expire.

**Platform Features Tested:** 48-state permit compliance matrix, permit expiration tracking, auto-renewal generation, expired permit load rerouting, regulatory change detection, ESANG AI regulatory updates, per-state permit type categorization, expedite processing, annual compliance reporting

**Validations:**
- ✅ All 48 states categorized by permit type
- ✅ Expired NJ permit detected and loads flagged
- ✅ Rerouting options for 7 of 12 affected loads
- ✅ Renewal applications auto-generated
- ✅ Regulatory change (TX) detected and flagged

**ROI:** Schneider avoids $47,000 in fines for operating without NJ permit (12 loads × $3,917 avg fine) + $125,000 potential OOS orders.

> **Platform Gap GAP-088:** No 48-state hazmat permit tracking matrix — each state's permit requirements tracked separately (if at all). Need unified multi-state permit dashboard with expiration tracking, auto-renewal, regulatory change monitoring, and load-route permit matching.

---

## CRD-656: HOURS OF SERVICE AGRICULTURAL EXEMPTION — HARVEST SEASON ANHYDROUS AMMONIA
**Company:** CF Industries (Deerfield, IL — largest US nitrogen fertilizer producer)  
**Season:** Spring (planting season) | **Time:** 5:00 AM CDT | **Route:** CF Industries Donaldsonville, LA → Farm cooperatives across Iowa (1,100+ miles)

**Narrative:** During spring planting season, anhydrous ammonia (Class 2.2 Non-Flammable Gas, Division 2.3 Toxic) demand spikes 400%. Under 49 CFR 395.1(k), agricultural carriers transporting farm supplies during planting/harvest season qualify for HOS exemptions within 150 air-miles of the source. Tests the platform's HOS exemption handling for agricultural operations.

**Steps:**
1. **CF Industries** ships 500 loads of anhydrous ammonia in March-May planting window
2. **Driver** (farm supply carrier) picks up at CF Donaldsonville → delivers to Iowa co-op → standard HOS limits would restrict operations
3. **Agricultural exemption check:** 49 CFR 395.1(k) allows:
   - Extended driving hours during planting/harvest season
   - Within 150 air-mile radius of source (farm)
   - Only for agricultural commodities or farm supplies
4. **ESANG AI™ determines:** 
   - Anhydrous ammonia = farm supply (fertilizer) ✅
   - Delivery to farm cooperative ✅
   - Season: March-May in Iowa = planting season ✅
   - **BUT:** Pickup in Louisiana (1,100+ miles from Iowa farms) — exemption only applies within 150 air-miles of farm
5. **System calculates:** Exemption NOT valid for the 1,100-mile long-haul segment (LA → IA) → standard HOS applies → but exemption DOES apply for last 150 air-miles (local Iowa delivery from distribution center to farm)
6. **Split HOS enforcement:**
   - Long-haul segment (Donaldsonville → Iowa distribution center): Standard 11-hour driving, 14-hour on-duty, 10-hour rest
   - Local delivery (distribution center → farm within 150 miles): Agricultural exemption active → extended hours permitted
7. **Driver's ELD** configured for dual-mode: Standard HOS for long-haul → switches to ag-exempt for local delivery
8. **Compliance Officer** verifies: State of Iowa has declared planting season emergency → extends ag exemption dates through May 31
9. **Platform documents:** Each load marked "AG-EXEMPT: Local delivery segment" with exemption citation and farm destination verification
10. **Post-season:** June 1 → agricultural exemption expires in Iowa → platform reverts all CF Industries loads to standard HOS

**Expected Outcome:** Platform correctly applies partial HOS agricultural exemptions (local segment only), handles seasonal exemption activation/expiration, and configures ELD for dual-mode operation.

**Platform Features Tested:** HOS agricultural exemption (49 CFR 395.1(k)), 150-air-mile radius calculation, seasonal exemption dates, split HOS enforcement (standard + exempt), ELD dual-mode configuration, state-level exemption extensions, exemption documentation, seasonal auto-expiration

**Validations:**
- ✅ Long-haul segment uses standard HOS
- ✅ Local delivery segment applies ag exemption
- ✅ 150-air-mile radius correctly calculated
- ✅ Iowa planting season dates verified
- ✅ Exemption auto-expires June 1

**ROI:** CF Industries delivers 15% more loads during planting season using ag exemption (local segment efficiency) → $2.4M additional fertilizer revenue during critical planting window.

---

## CRD-657: CANADIAN TDG EQUIVALENCY — SHIPPING UNDER BILATERAL AGREEMENT
**Company:** Imperial Oil (Calgary, AB — ExxonMobil subsidiary)  
**Season:** Winter | **Time:** 6:00 AM MST | **Route:** Imperial Cold Lake, AB → ExxonMobil Joliet, IL (1,900 miles, cross-border)

**Narrative:** Imperial Oil ships diluted bitumen (DilBit) from Alberta to Illinois. Under the Canada-US bilateral agreement on hazmat transport, Canadian TDG (Transportation of Dangerous Goods) regulations are accepted in the US for the first leg, and US DOT regulations apply after crossing the border. Tests the platform's bilateral regulatory equivalency management.

**Steps:**
1. **Shipper** (Imperial Oil) creates cross-border load → DilBit (UN1267, Class 3, PG II) → origin: Canada → destination: US
2. **Platform applies** bilateral agreement rules (49 CFR 171.12 — Canadian shipments):
   - Canadian TDG shipping document accepted in US for 30 days after border crossing
   - Canadian marks/labels/placards accepted if conforming to TDG regulations
   - BUT: driver must carry both TDG document AND equivalent US DOT shipping paper
3. **Document generation:**
   - TDG Shipping Document (Canadian format): Product name, UN number, class, PG, quantity, 24-hour emergency number (CANUTEC: 613-996-6666)
   - US DOT Shipping Paper (equivalent): Same information in 49 CFR 172.202 format, 24-hour emergency (CHEMTREC: 1-800-424-9300)
4. **Placard equivalency:**
   - Canada: TDG Class 3 diamond placard (red, flame symbol, "3") → equivalent to US DOT Class 3 placard ✅
   - No placard swap needed at border
5. **Border crossing (Portal, ND):**
   - CBP officer checks: US DOT shipping paper ✅, TDG document ✅, placards match ✅
   - System logs: Border crossing timestamp, officer badge number, both document versions verified
6. **Post-border compliance switch:**
   - In Canada: CANUTEC is the emergency contact
   - In US: CHEMTREC becomes primary emergency contact
   - Driver's app shows: "You've crossed into the US — primary emergency contact is now CHEMTREC: 1-800-424-9300"
7. **US-side inspection:** DOT officer in Kansas stops driver → accepts Canadian TDG document (within 30-day validity) → also reviews US DOT shipping paper → compliant ✅
8. **Delivery at Joliet:** Receiver accepts both documents → delivery confirmed

**Expected Outcome:** Platform manages bilateral agreement compliance, generates dual-format documents, handles emergency contact transition at border, and tracks 30-day TDG validity in the US.

**Platform Features Tested:** Canada-US bilateral agreement (49 CFR 171.12), dual document generation (TDG + DOT), placard equivalency verification, emergency contact transition (CANUTEC → CHEMTREC), 30-day TDG validity tracking, border crossing documentation, bilateral compliance verification

**Validations:**
- ✅ Dual shipping documents generated (TDG + DOT)
- ✅ Placard equivalency confirmed (no swap needed)
- ✅ Emergency contact switches at border
- ✅ 30-day TDG validity tracked in US
- ✅ Both documents accepted at delivery

**ROI:** Imperial Oil eliminates $1,200/load in customs broker fees for separate document preparation → 200 cross-border loads/year = $240,000 saved.

---

## CRD-658: MEXICAN NOM CERTIFICATION — CARRIER COMPLIANCE FOR MEXICO OPERATIONS
**Company:** PEMEX Logistics (Mexico City — Mexican state oil company logistics arm)  
**Season:** Summer | **Time:** 10:00 AM CDT | **Route:** PEMEX Cadereyta, Monterrey, MX → US border at Laredo, TX (150 miles Mexican segment)

**Narrative:** A US-based carrier (Trimac Transportation) needs to operate in Mexico for the Mexican segment of a cross-border load. Mexico requires compliance with NOM-002-SCT/2011 (land transport of hazardous materials) and NOM-012-SCT-2/2017 (vehicle weight and dimensions). The carrier must obtain Mexican operating authority and NOM certification. Tests the platform's Mexican regulatory compliance management.

**Steps:**
1. **Load created:** PEMEX crude oil → Cadereyta, MX → Laredo, TX → US carrier Trimac needs to operate in Mexico
2. **System checks** Trimac's Mexican compliance:
   - NOM-002-SCT compliance: ❌ NOT FOUND → "Carrier not certified for Mexican hazmat transport"
   - Mexican operating authority (autotransporte federal): ❌ NOT FOUND
   - SCT vehicle registration: ❌ NOT FOUND
3. **ESANG AI™ advises:** "To operate in Mexico, Trimac needs: (1) SCT autotransporte permit, (2) NOM-002-SCT hazmat certification, (3) Vehicle inspection at Mexican SCT facility, (4) Mexican liability insurance. Process: 45-90 days."
4. **Alternative:** Use Mexican carrier for Mexico segment → transfer cargo at border → Trimac handles US segment
5. **Platform suggests** border transfer arrangement:
   - Mexican carrier (Autotanques de México) handles Cadereyta → Laredo border
   - Transfer at Laredo border facility
   - Trimac handles Laredo → final US destination
6. **NOM-002-SCT requirements for Mexican carrier:**
   - Vehicle meets NOM-002 specifications (tank construction, safety equipment, placards per NOM)
   - Driver has Licencia Federal de Conductor (Mexican federal driver's license) with hazmat endorsement
   - Emergency response equipment per NOM-002 Appendix B
   - Mexican liability insurance (póliza de seguro)
7. **Platform verifies** Autotanques de México: NOM-002 certified ✅, SCT permit active ✅, insurance current ✅
8. **Border transfer:** Mexican carrier delivers to Laredo staging area → cargo transferred to Trimac → documentation handoff (NOM → DOT placards swapped)
9. **Platform manages** dual-carrier coordination, documentation transition, and placard swap at border

**Expected Outcome:** Platform identifies Mexican regulatory gaps for US carriers, suggests border transfer alternatives, verifies Mexican carrier NOM compliance, and manages cross-border handoff.

**Platform Features Tested:** NOM-002-SCT compliance verification, Mexican operating authority check, border transfer arrangement, dual-carrier coordination, NOM-to-DOT placard transition, Mexican carrier verification, SCT permit tracking, cross-border documentation management

**Validations:**
- ✅ US carrier flagged as non-compliant for Mexico
- ✅ Border transfer alternative suggested
- ✅ Mexican carrier NOM-002 verified
- ✅ Placard swap managed at border
- ✅ Dual-carrier documentation coordinated

**ROI:** Trimac avoids $28,000 SCT fine for operating in Mexico without permits + potential vehicle impoundment → border transfer saves 45-90 days of certification delay.

---

## CRD-659: OSHA PROCESS SAFETY MANAGEMENT — TERMINAL LOADING RACK COMPLIANCE
**Company:** Delek US Holdings (Brentwood, TN — Tyler, TX refinery)  
**Season:** Fall | **Time:** 7:00 AM CDT | **Route:** Delek Tyler Refinery loading rack → outbound trucks

**Narrative:** OSHA's Process Safety Management (PSM) standard (29 CFR 1910.119) applies to the Delek Tyler refinery's loading rack where tanker trucks are filled. A driver reports a near-miss (vapor release during loading) that triggers PSM investigation requirements. Tests the platform's integration with terminal PSM compliance.

**Steps:**
1. **Incident:** During loading of gasoline (Class 3) at Rack #4, a vapor cloud releases when the loading arm disconnects prematurely → driver reports near-miss in EusoTrip app
2. **Near-miss report fields:**
   - Time: 7:12 AM CDT
   - Location: Tyler Refinery, Loading Rack #4
   - Product: Gasoline, UN1203, Class 3
   - Description: "Loading arm disconnected while product still flowing — vapor cloud approximately 10 feet diameter — dissipated in 30 seconds — no ignition"
   - Photos: 2 photos of wet rack area (gasoline spill)
   - Weather: Wind 5 mph NE, Temp 68°F, No ignition sources nearby
3. **OSHA PSM requirements triggered:**
   - 29 CFR 1910.119(m): Incident Investigation — must investigate within 48 hours
   - Root cause analysis required
   - Investigation team: At least one person knowledgeable in the process, contractor employee (driver), and other relevant persons
4. **Platform creates** PSM Incident Investigation record:
   - Auto-populates from driver's near-miss report
   - Assigns investigation team: Terminal Manager (process knowledge), Driver (witness), Safety Manager (investigation lead)
   - Sets 48-hour investigation deadline
   - Links to Loading Rack #4's process history
5. **Investigation (Day 1):**
   - Root cause: Loading arm quick-disconnect latch worn → premature release
   - Contributing factor: Last inspection of Rack #4 was 90 days ago (should be monthly per PSM)
   - Corrective action: Replace quick-disconnect → implement monthly inspection checklist → retrain loading operators
6. **Platform tracks** corrective actions:
   - CA-001: Replace latch → Due: 24 hours → Assigned: Maintenance → Status: Completed Day 1
   - CA-002: Monthly inspection checklist → Due: 7 days → Assigned: Terminal Manager → Status: In Progress
   - CA-003: Operator retraining → Due: 30 days → Assigned: Safety Manager → Status: Pending
7. **PSM documentation:** Investigation report generated per 29 CFR 1910.119(m)(6) → retained for 5 years per PSM requirements
8. **Compliance Dashboard:** Terminal's PSM status: "1 active investigation, 3 corrective actions (1 complete, 1 in progress, 1 pending)"

**Expected Outcome:** Platform captures near-miss reports from drivers, triggers PSM investigation workflow, tracks corrective actions, and generates OSHA-compliant investigation documentation.

**Platform Features Tested:** Driver near-miss reporting, PSM investigation creation, investigation team assignment, 48-hour deadline tracking, root cause analysis template, corrective action tracking, 5-year document retention, terminal PSM dashboard, OSHA 29 CFR 1910.119 compliance documentation

**Validations:**
- ✅ Driver near-miss captured with photos and details
- ✅ PSM investigation created within 48-hour deadline
- ✅ Root cause analysis documented
- ✅ 3 corrective actions tracked with deadlines
- ✅ Investigation report meets OSHA PSM format

**ROI:** Delek avoids $156,000 OSHA PSM willful violation penalty (§17(a) OSH Act) → investigation prevents future actual release that could cost $2M+ in cleanup + liability.

---

## CRD-660: DRUG TESTING PROGRAM — RANDOM SELECTION HITS DRIVER MID-TRANSIT
**Company:** Sunoco LP (Philadelphia, PA)  
**Season:** Spring | **Time:** 2:00 PM EDT | **Route:** Sunoco Philadelphia → Sunoco Montello, WI (980 miles — driver mid-transit)

**Narrative:** DOT requires a minimum 50% annual random drug testing rate for hazmat drivers. The platform's random selection algorithm selects Driver Maria Lopez while she's mid-transit, 500 miles from Philadelphia, carrying gasoline. Under 49 CFR 382.305, the driver must be tested "as soon as practicable" but can't abandon a hazmat load. Tests the platform's drug testing program integration.

**Steps:**
1. **Random selection:** Platform's quarterly random drug test pool → computer algorithm selects 25% of eligible drivers for this quarter → Maria Lopez selected
2. **System checks** Maria's status: Currently in transit, Load LD-18000, mile 500 of 980, carrying gasoline (Class 3)
3. **Policy decision:** "As soon as practicable" + active hazmat load = cannot abandon load → test scheduled at next reasonable stop
4. **System identifies** DOT-approved collection sites near Maria's route:
   - Site A: Concentra, Indianapolis, IN (12 miles off route) — open until 5 PM
   - Site B: Quest Diagnostics, Terre Haute, IN (2 miles off route) — open until 4 PM
   - Site C: Concentra, Springfield, IL (on route) — open until 6 PM
5. **Optimal scheduling:** ESANG AI calculates: Maria will reach Springfield, IL at approximately 5:30 PM CDT → Site C is on route and open until 6 PM → schedule test at Site C
6. **Driver notified:** "Random DOT drug test selected. Report to Concentra Springfield, IL upon arrival (est. 5:30 PM). Bring CDL and this notification. Do not deviate from schedule."
7. **Critical safeguards:**
   - Driver cannot refuse (refusal = treated as positive → immediate disqualification)
   - Driver must not be notified too far in advance (prevents "preparation")
   - Platform notification sent 2 hours before collection site → driver notified at 3:30 PM
8. **Maria arrives** at Concentra Springfield at 5:22 PM → reports for testing → provides urine sample → chain of custody form completed
9. **Test processing:** Sample sent to SAMHSA-certified lab → results in 2-3 business days
10. **Platform tracks:** Test status: "Collected → In Transit to Lab → Analyzed → Result: NEGATIVE" → Maria cleared
11. **Compliance documentation:** Random selection record, collection form, chain of custody, lab result → all stored in Maria's DQF
12. **Quarterly report:** "Q2 Random Testing: 47 drivers selected, 47 tested, 0 positive, 0 refused → 50.2% annual rate (meets minimum)"

**Expected Outcome:** Platform manages random drug testing selection, schedules collection at convenient DOT-approved sites for in-transit drivers, tracks results, and maintains compliance documentation.

**Platform Features Tested:** Random selection algorithm (DOT-compliant), in-transit driver scheduling, DOT-approved collection site finder, 2-hour advance notification, chain of custody tracking, lab result management, DQF integration, quarterly compliance reporting, annual rate tracking

**Validations:**
- ✅ Random selection algorithm is truly random (auditable)
- ✅ In-transit driver scheduled at on-route collection site
- ✅ 2-hour advance notification (not too early, not too late)
- ✅ Results tracked through chain of custody
- ✅ 50%+ annual testing rate maintained

**ROI:** Sunoco's DOT drug testing program fully automated → saves $24,000/year in third-party administrator (TPA) fees → zero compliance gaps.

> **Platform Gap GAP-089:** No drug testing program management — random selection, scheduling, collection site finder, and result tracking done outside the platform. Need integrated DOT drug/alcohol testing program with random selection, site scheduling, result tracking, and compliance reporting.

---

## CRD-661: DRIVER QUALIFICATION FILE AUDIT — 47 DOCUMENTS FOR 1 DRIVER
**Company:** Groendyke Transport (Enid, OK)  
**Season:** Any | **Time:** 9:00 AM CDT | **Route:** N/A — compliance audit

**Narrative:** FMCSA's Driver Qualification File (DQF) requirements (49 CFR 391 Subpart F) mandate that carriers maintain up to 47 different documents for each hazmat driver. A single driver's DQF must be audited for completeness. Tests the platform's DQF management comprehensiveness.

**Steps:**
1. **Compliance Officer** opens Driver Profile for Thomas Rodriguez → DQF Compliance tab
2. **Platform's DQF checklist (49 CFR 391.51):**
   - Employment application (§391.21) ✅
   - Driving record inquiry (MVR) from each state (§391.23) ✅
   - Driving record from FMCSA (§391.23(a)(1)) ✅
   - Previous employer investigation (§391.23(d)) — 3 previous employers ✅ ✅ ✅
   - Road test certificate OR equivalent (§391.31/33) ✅
   - Medical examiner's certificate (§391.43) ⚠️ EXPIRING IN 14 DAYS
   - Medical examiner's National Registry verification (§391.23(m)) ✅
   - Annual review of driving record (§391.25) ✅
   - Annual certification of violations (§391.27) ✅
   - CDL copy with endorsements (§383.23) ✅
   - Hazmat endorsement verification (TSA background check) ✅
   - Entry-Level Driver Training (ELDT) certificate (§380.503) ✅
   - Drug test — pre-employment (§382.301) ✅
   - Drug test — random (most recent) (§382.305) ✅
   - Drug test — return-to-duty (if applicable) — N/A
   - Alcohol test — pre-employment (§382.301) ✅
   - Alcohol test — random (most recent) (§382.305) ✅
   - Drug/alcohol testing policy acknowledgment (§382.601) ✅
   - Hazmat training — initial (§172.704) ✅
   - Hazmat training — recurrent (3-year cycle) ✅
   - Hazmat training — function-specific ✅
   - Hazmat training — security awareness (§172.704(a)(4)) ✅
   - Hazmat security plan training (§172.802) ✅
   - Tank vehicle inspection training ✅
   - Emergency response training ✅
   - Skill Performance Evaluation (SPE) certificate (if applicable) — N/A
   - English proficiency verification ✅
   - Criminal background check (TSA) ✅
   - Workers' compensation documentation ✅
   - Social Security Number verification ✅
3. **DQF completeness score:** 29/31 required documents present (93.5%) → 2 issues:
   - ⚠️ Medical certificate expiring in 14 days → action required
   - ⚠️ Annual MVR due for renewal (11 months old, due at 12)
4. **Auto-generated actions:**
   - "Schedule DOT physical for Thomas Rodriguez — medical certificate expires in 14 days"
   - "Order MVR from Texas DPS — annual renewal due in 30 days"
5. **DQF export:** Compliance Officer can export complete DQF as PDF package (47 pages) for auditor review

**Expected Outcome:** Platform maintains comprehensive DQF for each driver with 31+ document types, expiration tracking, and audit-ready export.

**Platform Features Tested:** Complete DQF management (31+ document types), expiration tracking for time-sensitive documents (medical cert, MVR, drug tests, training), auto-generated renewal actions, DQF completeness scoring, audit-ready PDF export, regulatory citation for each document, N/A handling for non-applicable documents

**Validations:**
- ✅ 31 document types tracked per driver
- ✅ Expiring documents flagged with countdown
- ✅ Auto-generated renewal actions created
- ✅ DQF completeness score calculated (93.5%)
- ✅ Full DQF exportable as PDF package

**ROI:** Groendyke manages 800 drivers' DQFs through platform → saves $480,000/year in compliance staff (vs. manual file management for 800 × 31 documents = 24,800 document tracking items).

---

## CRD-662: HAZMAT SECURITY PLAN REVIEW — 49 CFR 172.802 ANNUAL UPDATE
**Company:** Brenntag North America (Reading, PA — largest chemical distributor)  
**Season:** January (annual review) | **Time:** 9:00 AM EST | **Route:** N/A — company-wide compliance

**Narrative:** 49 CFR 172.802 requires companies that transport certain hazmat quantities to maintain a security plan addressing personnel security, unauthorized access prevention, and en route security. Brenntag's annual security plan review is due. Tests the platform's security plan management and annual review workflow.

**Steps:**
1. **System triggers** annual alert: "Hazmat Security Plan annual review due — last reviewed January 15, 2025 — 49 CFR 172.802 requires annual review and update"
2. **Security Plan components (per 172.802(b)):**
   - Personnel security: Background checks, security training, employee identification
   - Unauthorized access: Facility security, cargo seal integrity, trailer tracking
   - En route security: Route planning, communication protocols, delay reporting
3. **Platform's Security Plan template** pre-populated with Brenntag's current plan → Compliance Officer reviews each section
4. **Review checklist:**
   - ✅ All drivers have current TSA background checks (TWIC/HME)
   - ✅ Security awareness training completed within last 12 months (all 400 drivers)
   - ⚠️ 3 drivers' TSA background checks expire in 60 days
   - ✅ All trailers equipped with GPS tracking (en route security)
   - ✅ Cargo seals used on all hazmat loads (tamper-evident)
   - ⚠️ Facility security: 2 terminals lack updated camera systems (recommended upgrade)
   - ✅ Incident reporting procedures current
   - ✅ Communication protocols tested (quarterly drill completed)
5. **Updates needed:**
   - Add new routes added in past year (12 new lanes)
   - Update emergency contact list (3 personnel changes)
   - Incorporate new regulatory guidance (PHMSA advisory 2025-12)
6. **Compliance Officer** updates plan → signs digital attestation: "I have reviewed and updated this security plan per 49 CFR 172.802"
7. **Platform stores:** Updated security plan version 2026 → retains previous versions for 3 years → accessible to DOT inspectors upon request
8. **Training trigger:** Updated plan → platform generates security awareness training update → assigns to all 400 drivers → due within 90 days
9. **Monitoring:** Platform tracks TSA background check expirations for all hazmat-endorsed drivers → alerts 90 days before expiry

**Expected Outcome:** Platform manages hazmat security plan lifecycle — annual review workflow, version control, compliance attestation, training triggers, and TSA background check monitoring.

**Platform Features Tested:** Security plan template management, annual review workflow, checklist-based review, digital attestation, version control (historical plans retained), training trigger on plan update, TSA background check expiration monitoring, DOT inspector access, PHMSA advisory integration

**Validations:**
- ✅ Annual review triggered automatically
- ✅ All security plan components reviewed against checklist
- ✅ Updated plan versioned and stored
- ✅ Training update assigned to 400 drivers
- ✅ TSA expiration monitoring active

**ROI:** Brenntag's security plan compliance automated → saves $18,000/year in compliance consulting fees → avoids $75,000 PHMSA civil penalty for security plan deficiency.


---

## CRD-663: CARGO TANK RETEST SCHEDULING — MC-306 5-YEAR HYDROSTATIC TEST DUE
**Company:** Kenan Advantage Group (North Canton, OH)  
**Season:** Summer | **Time:** 8:00 AM EDT | **Route:** N/A — fleet maintenance compliance

**Narrative:** DOT requires cargo tanks (MC-306, MC-307, MC-312, MC-331, MC-338) to undergo periodic retesting per 49 CFR 180.407: external visual (annually), internal visual (every 5 years), hydrostatic pressure test (every 5 years), lining test (annually if lined), and leakage test (annually). Kenan has 2,400 tanker trailers — managing retest schedules for all of them is a massive compliance task. Tests the platform's cargo tank retest management.

**Steps:**
1. **Fleet overview:** Kenan's 2,400 tankers → each has 5 test types with different intervals:
   - External visual: ANNUAL → 2,400 tests/year
   - Internal visual: Every 5 YEARS → 480 tests/year (staggered)
   - Hydrostatic pressure: Every 5 YEARS → 480 tests/year
   - Lining test: ANNUAL (if lined) → 1,200 tests/year (50% are lined)
   - Leakage test: ANNUAL → 2,400 tests/year
   - **Total: ~6,960 tests/year** (19 per day on average)
2. **Platform's Fleet Retest Dashboard:**
   - Current month: 580 tests due (96 per week)
   - Overdue: 12 tests (0.5% — flagged red)
   - Due within 30 days: 248 tests (yellow)
   - Compliant: 2,140 tankers (89.2%)
3. **Overdue trailer alert:** "⚠️ Trailer KAG-2847 (MC-306) — hydrostatic test overdue by 17 days. CANNOT be used for hazmat transport until tested."
4. **System action:** Trailer KAG-2847 automatically marked "OUT OF SERVICE — RETEST REQUIRED" → removed from available trailer pool → cannot be assigned to loads
5. **Scheduling:** Platform schedules KAG-2847 for hydrostatic test:
   - Finds nearest DOT-approved test facility (Tank Test LLC, Canton, OH)
   - Books appointment for Thursday
   - Estimated downtime: 4 hours test + 2 hours travel = 6 hours
   - Estimated cost: $1,200 for hydrostatic test
6. **Test completed:** Tank Test LLC uploads results to platform → PASS (withstood 110% MAWP for 10 minutes)
7. **Trailer returned to service:** Status: "COMPLIANT" → test certificate uploaded → next hydrostatic test due: July 2031
8. **Sticker verification:** Platform generates updated CTMV-1 (Cargo Tank Motor Vehicle) inspection sticker data → physical sticker applied at facility
9. **Predictive scheduling:** ESANG AI analyzes fleet → "14 trailers with hydrostatic tests due in October will conflict with peak harvest season. Recommend testing in September to avoid peak."
10. **Annual compliance report:** "Kenan 2026 Cargo Tank Testing: 6,847/6,960 tests completed on time (98.4%). 113 tests completed 1-30 days late. 0 trailers operating with overdue tests."

**Expected Outcome:** Platform manages 6,960 annual cargo tank tests across 2,400 trailers with scheduling, out-of-service enforcement, facility booking, result tracking, and predictive planning.

**Platform Features Tested:** Cargo tank retest scheduling (5 test types), fleet-wide compliance dashboard, overdue auto-OOS enforcement, test facility booking, test result upload, CTMV-1 sticker tracking, predictive scheduling (ESANG AI), annual compliance reporting, 49 CFR 180.407 compliance

**Validations:**
- ✅ 6,960 annual tests tracked across 2,400 trailers
- ✅ Overdue trailer auto-removed from service
- ✅ Test facility booked and results uploaded
- ✅ Predictive scheduling avoids peak season conflicts
- ✅ 98.4% on-time testing rate

**ROI:** Kenan avoids $36,000/year in DOT fines for overdue cargo tank tests ($3,000 per violation × 12 overdue trailers) → automated scheduling saves 2,400 hours/year of manual tracking.

> **Platform Gap GAP-090:** No cargo tank retest scheduling system — trailer maintenance tracking exists but doesn't manage DOT-required cargo tank testing intervals (5 types, varying schedules). Need per-trailer test scheduling, auto-OOS on overdue, facility booking, and result tracking per 49 CFR 180.407.

---

## CRD-664: RADIOACTIVE MATERIALS (CLASS 7) — ROUTING THROUGH PREFERRED ROUTES
**Company:** Energy Solutions (Salt Lake City, UT — radioactive waste disposal)  
**Season:** Fall | **Time:** 6:00 AM MDT | **Route:** Energy Solutions Clive, UT facility → Los Alamos National Lab, NM (680 miles)

**Narrative:** Energy Solutions transports low-level radioactive waste (Class 7, Yellow II transport index) from their Clive disposal site to Los Alamos. Under 49 CFR 397.101, radioactive shipments must use "preferred routes" (Interstate highways or state-designated alternatives). Certain cities prohibit Class 7 transit. Tests the platform's Class 7 routing compliance.

**Steps:**
1. **Shipper** (Energy Solutions) creates load → Class 7 Radioactive Material → Yellow II label → Transport Index 2.4
2. **ESANG AI™** activates Class 7 routing module:
   - 49 CFR 397.101: Must use preferred routes (Interstate highway system)
   - Cannot deviate from Interstate except for pickup/delivery, rest stops, or emergencies
   - Must minimize transit time through populated areas
3. **Route calculation:** Preferred route: I-15 South → I-70 East → I-25 South → NM-502 to Los Alamos
4. **City restriction check:**
   - Salt Lake City: Class 7 transit through downtown restricted (city ordinance) → I-15 bypass available ✅
   - Denver metro: Class 7 preferred route is I-270/I-76 bypass (avoids downtown) ✅
   - Albuquerque: I-25 through city is the preferred route (no bypass available) → permitted on Interstate ✅
   - Santa Fe: NM-599 bypass for Class 7 (avoids historic downtown) ✅
5. **State-specific requirements:**
   - Utah: Radioactive material transport permit required → Permit #UT-RAD-2026-847 verified ✅
   - Colorado: Radioactive materials transport notification required 72 hours in advance → auto-generated
   - New Mexico: No additional state permit required for Yellow II → verified ✅
6. **Pre-trip requirements:**
   - Radiation survey of vehicle (before loading and after) → logged in app
   - Exclusive Use shipment designation (Transport Index 2.4 requires it above 1.0 for Yellow II in non-exclusive)
   - Wait — Transport Index 2.4 with Yellow II label → check if Exclusive Use is required: Per 49 CFR 173.441, non-exclusive TI must be ≤1.0 at package surface → TI 2.4 requires Exclusive Use ✅
7. **Driver requirements:** CDL-A + hazmat endorsement + specific Class 7 training certificate (49 CFR 172.704 + radiation safety)
8. **En route:** Driver stays on preferred route → GPS monitors for deviations → system alerts if driver approaches restricted area
9. **Delivery:** Los Alamos security gate → radiation survey → acceptance → delivery confirmed
10. **Post-delivery:** Vehicle decontamination survey → radiation levels below DOT limits → vehicle released for next load

**Expected Outcome:** Platform enforces Class 7 preferred routing, verifies state-specific radioactive transport permits, manages Exclusive Use designation, and monitors route compliance.

**Platform Features Tested:** Class 7 radioactive routing (49 CFR 397.101), preferred route enforcement, city restriction database, state radioactive transport permits, Exclusive Use determination, Transport Index classification, 72-hour advance notification, radiation survey logging, GPS route compliance for Class 7, post-delivery decontamination tracking

**Validations:**
- ✅ Preferred routes calculated per 49 CFR 397.101
- ✅ City restrictions identified (SLC, Denver, Santa Fe)
- ✅ State permits verified (UT radioactive permit)
- ✅ Exclusive Use correctly required for TI > 1.0
- ✅ GPS monitors preferred route compliance

**ROI:** Energy Solutions avoids $125,000 NRC fine for radioactive routing violation + $500,000 potential cleanup costs if accident in restricted area.

> **Platform Gap GAP-091:** No Class 7 (Radioactive) routing module — platform doesn't distinguish Class 7 preferred routing requirements from general hazmat routing. Need preferred route enforcement, Transport Index classification, Exclusive Use determination, and state radioactive permit tracking.

---

## CRD-665: TANK TRUCK AGE COMPLIANCE — 25-YEAR-OLD MC-306 STILL IN SERVICE
**Company:** Superior Bulk Logistics (Stoughton, WI — bulk tanker fleet)  
**Season:** Winter | **Time:** 7:00 AM CST | **Route:** Superior fleet inspection — 847 tankers

**Narrative:** FMCSA and NTSB have repeatedly recommended cargo tank age limits, and some shippers require tanks newer than 20 years. Superior has an MC-306 tanker built in 2001 (25 years old). While no federal law sets a maximum age, the carrier's insurance, shipper contracts, and FMCSA BASICs inspections make old tanks a liability. Tests the platform's tank age tracking and compliance.

**Steps:**
1. **Fleet audit:** Platform scans all 847 Superior tankers → pulls manufacture dates from tank data plates
2. **Age distribution:**
   - 0-5 years: 212 tankers (25%)
   - 6-10 years: 298 tankers (35%)
   - 11-15 years: 187 tankers (22%)
   - 16-20 years: 108 tankers (13%)
   - 21-25 years: 38 tankers (4.5%)
   - 25+ years: 4 tankers (0.5%) ← flagged
3. **Oldest tanker:** VIN ending 1023 — MC-306, built January 2001 — 25 years old
4. **Risk assessment for 25-year-old tank:**
   - Structural fatigue: Higher risk of corrosion, weld failure, valve degradation
   - Insurance: Current policy covers tanks up to 25 years → THIS TANK IS AT LIMIT
   - Shipper contracts: Marathon requires <20 years → cannot be used for Marathon loads
   - FMCSA inspections: Older tanks receive enhanced scrutiny → higher OOS rate (industry data: 12% OOS for 20+ year tanks vs. 4% for <10 year)
5. **Platform actions:**
   - Flags 4 tanks as "AGE ALERT — Enhanced Inspection Required"
   - Cross-references shipper age requirements: 3 of 15 shippers require <20 years → 38 tankers excluded from these shippers' loads
   - Alerts insurance team: 4 tankers at policy age limit → renewal may exclude them
   - Recommends: "Consider replacing 4 tanks aged 25+ years — estimated ROI of replacement: payback in 3 years from reduced OOS and expanded shipper eligibility"
6. **Compliance Officer** reviews → schedules enhanced inspection for all 4 tanks → 2 pass enhanced inspection, 2 fail (corrosion on barrel)
7. **2 failed tanks:** Retired from hazmat service → converted to water tanker (no DOT cargo tank requirements) or scrapped
8. **Replacement plan:** Platform generates fleet age projection: "At current utilization rates, 42 additional tanks will exceed 20-year mark in next 3 years. Replacement budget: $4.2M."

**Expected Outcome:** Platform tracks cargo tank ages, cross-references shipper and insurance age requirements, flags older tanks for enhanced inspection, and generates fleet replacement projections.

**Platform Features Tested:** Cargo tank age tracking, manufacture date database, fleet age distribution analytics, shipper age requirement matching, insurance policy age limits, enhanced inspection scheduling, retirement recommendation, fleet replacement budget projection, OOS rate correlation with age

**Validations:**
- ✅ All 847 tanks tracked by manufacture date
- ✅ 4 tanks aged 25+ flagged for enhanced inspection
- ✅ Shipper age requirements cross-referenced
- ✅ Insurance age limits tracked
- ✅ Replacement projection generated

**ROI:** Superior avoids $84,000/year in OOS penalties from aging tanks + gains access to 3 additional shipper contracts worth $1.2M/year by maintaining younger fleet.

---

## CRD-666: EMERGENCY RESPONSE INFORMATION — ERG GUIDE MISMATCH
**Company:** Dow Chemical (Midland, MI — specialty chemicals)  
**Season:** Spring | **Time:** 3:00 PM CDT | **Route:** Dow Freeport, TX → Dow St. Charles, LA (267 miles)

**Narrative:** A DOT inspector stops a Dow Chemical driver and checks the Emergency Response Guide (ERG) information on the shipping paper. The shipping paper references ERG Guide #127 (Flammable Liquids — water reactive). But the cargo (ethylene oxide, UN1040) should reference ERG Guide #119P (Gases — Toxic/Flammable). The mismatch could cause emergency responders to use the wrong procedures. Tests the platform's ERG guide auto-assignment and validation.

**Steps:**
1. **Load creation:** Dow ships ethylene oxide (UN1040, Class 2.3 Toxic Gas, subsidiary 2.1 Flammable) → 49 CFR 172.101 → ERG Guide #119P
2. **Error scenario:** System's shipping paper generation assigns ERG Guide #127 (incorrect — this is for flammable liquids, not toxic gases)
3. **Root cause:** ESANG AI classification engine matched "ethylene" keyword → associated with ethylene (UN1962, Guide #115) but shipping paper template defaulted to generic flammable liquid guide
4. **DOT inspection:** Inspector checks shipping paper → sees Guide #127 → looks up UN1040 in ERG → should be Guide #119P → VIOLATION: "Incorrect emergency response information — 49 CFR 172.602(c)"
5. **Fine:** $1,200 for incorrect emergency response information
6. **Platform fix needed:**
   - ERG guide assignment must match 49 CFR 172.101 Table → lookup by UN number, not product name
   - UN1040 → Column 11 → ERG Guide #119P
   - Auto-validation: After shipping paper generation, cross-check assigned ERG guide against 49 CFR 172.101 lookup
7. **Corrective implementation:**
   - Database updated: Every UN number mapped to correct ERG guide per 172.101 Table
   - Validation rule: ERG guide on shipping paper must match 172.101 lookup → if mismatch, flag for correction before printing
   - ESANG AI retrained: Ethylene oxide (UN1040) ≠ Ethylene (UN1962) → distinct UN numbers, distinct ERG guides
8. **Post-fix verification:** System regenerates shipping papers for all active loads with ethylene oxide → all now show ERG #119P ✅
9. **Broader audit:** Platform cross-checks ERG guides on all 178,000 historical loads → finds 47 additional mismatches → generates correction report

**Expected Outcome:** Platform auto-assigns correct ERG guide from 49 CFR 172.101 Table by UN number, validates before shipping paper generation, and corrects historical mismatches.

**Platform Features Tested:** ERG guide auto-assignment (by UN number), 49 CFR 172.101 Table lookup, pre-generation validation, historical audit for mismatches, ESANG AI correction for similar product names, shipping paper regeneration, compliance violation tracking

**Validations:**
- ✅ ERG guide assigned by UN number (not product name)
- ✅ Pre-print validation catches mismatches
- ✅ Historical audit identifies 47 past errors
- ✅ ESANG AI corrected for ethylene vs. ethylene oxide
- ✅ All active shipping papers regenerated with correct ERG

**ROI:** Dow avoids $1,200 per violation × estimated 15 violations/year from ERG mismatches = $18,000/year → more critically, correct ERG prevents wrong emergency response that could cost lives.

> **Platform Gap GAP-092:** No ERG guide validation against 49 CFR 172.101 Table — shipping papers may contain incorrect ERG references. Need UN-number-based ERG lookup with pre-print validation.

---

## CRD-667: VAPOR RECOVERY COMPLIANCE — CALIFORNIA CARB RULE AT LOADING
**Company:** Valero Energy (San Antonio, TX → California operations)  
**Season:** Summer | **Time:** 6:00 AM PDT | **Route:** Valero Benicia Refinery, CA → various CA distribution terminals

**Narrative:** California Air Resources Board (CARB) requires vapor recovery systems during gasoline loading operations (California Health & Safety Code §41960.2). A driver loading at Valero Benicia must connect the vapor recovery hose before the product loading hose. If the vapor recovery connection isn't verified, loading cannot proceed. Tests the platform's CARB-specific compliance enforcement.

**Steps:**
1. **Load created:** Valero gasoline → Benicia Refinery loading rack → California destination
2. **System detects** California origin → activates CARB-specific compliance requirements
3. **Pre-loading checklist (CARB enhanced):**
   - Standard DOT: Pre-trip inspection, hazmat placards, shipping papers ✅
   - CARB addition: "Verify vapor recovery system connection BEFORE product loading hose"
   - CARB addition: "Confirm vapor recovery system pressure test current (annual requirement)"
   - CARB addition: "Stage II vapor recovery certification on trailer — verify sticker current"
4. **Driver's mobile app** shows CARB-enhanced loading sequence:
   - Step 1: Connect vapor recovery hose → photograph connection → app verifies photo shows connected hose
   - Step 2: Activate vapor recovery system → verify pressure gauge reading
   - Step 3: ONLY THEN connect product loading hose
   - Step 4: Begin loading
5. **Photo verification:** ESANG AI analyzes driver's photo → confirms vapor recovery hose is connected (green adapter visible) → "Vapor recovery verified ✅"
6. **What if driver skips vapor recovery?** If driver photographs product hose without vapor recovery → AI detects: "⚠️ Vapor recovery hose not visible in photo. CARB compliance requires vapor recovery connection before product loading. Please connect vapor recovery first."
7. **Loading proceeds:** Vapor recovery verified → product hose connected → 8,800 gal gasoline loaded → vapors captured (estimated 4.2 lbs VOC recovered)
8. **CARB compliance documentation:** Platform generates CARB-compliant loading record with vapor recovery verification, pressure readings, and photo evidence
9. **If loading at non-California facility:** CARB requirements don't appear → standard DOT loading checklist only
10. **State-specific rule engine:** Platform maintains state-by-state additional requirements → California: CARB vapor recovery → Texas: TCEQ requirements → etc.

**Expected Outcome:** Platform enforces state-specific environmental compliance (CARB vapor recovery) in addition to federal DOT requirements, with photo verification and AI validation.

**Platform Features Tested:** State-specific compliance engine (California CARB), enhanced loading checklist, photo verification with ESANG AI, vapor recovery connection validation, sequential step enforcement (VR before product), CARB documentation generation, state detection from load origin

**Validations:**
- ✅ CARB requirements activated for California loads
- ✅ Vapor recovery photo verified by AI
- ✅ Sequential loading steps enforced
- ✅ CARB compliance documentation generated
- ✅ Non-California loads show standard checklist only

**ROI:** Valero avoids $10,000 CARB fine per violation × estimated 8 violations/year = $80,000 → plus environmental benefit of 4.2 lbs VOC recovered per load × 12,000 CA loads/year = 50,400 lbs VOC prevented.

---

## CRD-668: ELECTRONIC LOGGING DEVICE (ELD) DATA TRANSFER — ROADSIDE INSPECTION
**Company:** Trimac Transportation (Calgary, AB — US & Canadian operations)  
**Season:** Winter | **Time:** 11:00 AM CST | **Route:** I-35, Kansas — roadside inspection

**Narrative:** A DOT officer at a Kansas weigh station requests ELD data transfer from a Trimac driver. Under 49 CFR 395.22, drivers must be able to transfer ELD data to inspectors via wireless web services, USB, or Bluetooth. Tests the platform's ELD data transfer compliance.

**Steps:**
1. **DOT officer** signals Trimac driver to pull into Kansas I-35 weigh station for Level 1 inspection
2. **Officer requests:** "Transfer your ELD records for the past 8 days via wireless web services"
3. **Driver** opens EusoTrip ELD module → taps "Transfer Data to Inspector" → selects method: Wireless Web Services (FMCSA eRODS — ELD Records of Duty Status)
4. **Data transfer:** Platform compiles 8 days of HOS data in FMCSA-standardized format:
   - Driver identification (name, CDL #, carrier name, DOT #)
   - 8 days of daily logs (duty status changes, timestamps, locations)
   - Vehicle identification (VIN, license plate)
   - Malfunctions and data diagnostics (if any)
   - Annotations and edits
5. **Transfer format:** eRODS file generated → transmitted to FMCSA web service → officer receives on their inspection tablet
6. **Officer reviews:** 8 days of logs → checks for:
   - 11-hour driving limit compliance ✅
   - 14-hour on-duty limit compliance ✅
   - 30-minute break requirement ✅
   - 70-hour/8-day limit compliance ✅
   - Unidentified driving time ✅ (none)
   - ELD malfunctions ✅ (none in 8 days)
7. **Inspection result:** No HOS violations found → Clean inspection → Level 1 inspection pass
8. **Platform logs:** Inspection event: Date, location, officer badge number, inspection level, result, data transfer method
9. **Backup methods:** If wireless fails → driver can provide data via:
   - USB flash drive (driver carries EusoTrip-provided USB)
   - Bluetooth transfer
   - Display on ELD screen (fallback for viewing)
10. **FMCSA scoring:** Clean inspection data sent to FMCSA → improves Trimac's HOS Compliance BASIC score

**Expected Outcome:** Platform enables instant ELD data transfer to DOT inspectors via FMCSA-compliant methods, maintains inspection records, and supports backup transfer methods.

**Platform Features Tested:** ELD data transfer (wireless web services/eRODS), FMCSA-standardized format, 8-day log compilation, multiple transfer methods (wireless, USB, Bluetooth), inspection event logging, HOS compliance verification, FMCSA BASIC score impact tracking

**Validations:**
- ✅ eRODS file generated in FMCSA format
- ✅ Wireless transfer completed to inspection tablet
- ✅ 8 days of logs transferred in under 30 seconds
- ✅ All HOS fields included (status, location, vehicle, annotations)
- ✅ Inspection logged in platform

**ROI:** Clean inspections improve Trimac's CSA score → lower insurance premiums → estimated $420,000/year savings on fleet insurance.

---

## CRD-669: HAZMAT EMPLOYEE TRAINING TRACKING — 400 EMPLOYEES, 6 TRAINING TYPES
**Company:** Brenntag North America (Reading, PA)  
**Season:** Ongoing | **Time:** N/A — continuous compliance | **Route:** N/A — company-wide training

**Narrative:** 49 CFR 172.704 requires hazmat employers to ensure employees receive 6 types of training: general awareness, function-specific, safety, security awareness, in-depth security, and driver-specific (if applicable). Brenntag has 400 hazmat employees — each needs different combinations of these 6 training types based on their role, with recurrent training every 3 years. Tests the platform's training compliance management.

**Steps:**
1. **Training matrix (400 employees × 6 training types):**
   - General Awareness (172.704(a)(1)): ALL 400 employees
   - Function-Specific (172.704(a)(2)): 400 employees (varies by function)
   - Safety (172.704(a)(3)): ALL 400 employees
   - Security Awareness (172.704(a)(4)): ALL 400 employees
   - In-Depth Security (172.704(a)(5)): 85 employees (those with security plan responsibilities)
   - Driver-Specific: 200 employees (drivers only)
   - **Total training requirements: 1,885 training items**
2. **Recurrence:** Each training valid for 3 years (36 months) → staggered across workforce
3. **Platform's Training Dashboard:**
   - Current compliance: 372/400 employees fully compliant (93%)
   - Expiring within 90 days: 47 training items across 28 employees
   - Expired: 12 training items across 8 employees (⚠️ non-compliant)
   - Never trained: 3 employees (new hires in onboarding)
4. **Expired training alert:** "❌ 8 employees have expired hazmat training — cannot perform hazmat functions until retrained"
5. **Auto-actions for expired employees:**
   - Removed from hazmat-eligible assignment pool
   - Supervisor notified: "Your employee [name] has expired hazmat training — schedule retraining within 30 days"
   - Loads assigned to these employees: If any in-transit → "TRAINING COMPLIANCE ALERT" (not an emergency — training was valid at time of dispatch)
6. **Training delivery options:**
   - Online modules: 4 of 6 training types available via platform's integrated LMS
   - In-person: Function-specific and driver-specific require hands-on
   - Blended: Online theory + in-person practical
7. **New hire onboarding:** 3 new employees → system creates training plan:
   - Must complete all applicable training within 90 days of hire
   - Can perform hazmat functions during 90-day window if supervised by trained employee
   - Training deadline countdown visible on employee profile
8. **Training completion:** Employee completes online module → platform records: completion date, score (must pass 80%), certificate generated, next recurrence date (3 years)
9. **Audit readiness:** Inspector requests training records for 10 randomly selected employees → platform generates training record packets in under 60 seconds

**Expected Outcome:** Platform manages 1,885 training requirements across 400 employees with expiration tracking, auto-removal from hazmat assignments, training delivery (LMS), and audit-ready documentation.

**Platform Features Tested:** Training requirement matrix (6 types × employee roles), 3-year recurrence tracking, expiration alerts (90-day warning), auto-removal from hazmat pool on expiry, integrated LMS (online modules), training completion recording, certificate generation, new hire 90-day onboarding, audit-ready training records, supervisor notifications

**Validations:**
- ✅ 1,885 training items tracked across 400 employees
- ✅ Expired employees removed from hazmat assignments
- ✅ 90-day warning for approaching expirations
- ✅ Online training delivery via integrated LMS
- ✅ Audit-ready records generated in 60 seconds

**ROI:** Brenntag's training compliance automated → saves $120,000/year in training administration → avoids $50,000 PHMSA fine per untrained employee violation.

> **Platform Gap GAP-093:** No hazmat employee training management system — training tracking done in separate LMS or spreadsheets. Need integrated training matrix per 49 CFR 172.704, recurrence tracking, auto-assignment, LMS integration, and compliance reporting.

---

## CRD-670: SHIPPER'S DECLARATION FOR DANGEROUS GOODS — AIR MODAL TRANSFER
**Company:** FedEx Custom Critical (Greenville, SC — time-critical hazmat shipping)  
**Season:** Fall | **Time:** 6:00 AM EDT | **Route:** FedEx Memphis hub → air transfer to LAX → ground delivery Los Angeles

**Narrative:** A hazmat shipment initially moves by truck but is urgently switched to air transport. Air transport requires a completely different set of documentation: IATA Dangerous Goods Regulations (DGR) replace DOT 49 CFR, and a "Shipper's Declaration for Dangerous Goods" replaces the DOT shipping paper. Tests the platform's multi-modal compliance — switching from ground to air hazmat documentation.

**Steps:**
1. **Original load:** Class 3 Flammable Liquid (perfume extract, UN1266, PG II) → ground transport Memphis → Los Angeles (1,800 miles, 3 days)
2. **Emergency change:** Client needs delivery in 12 hours → must switch to air transport
3. **Modal switch trigger:** Dispatcher changes transport mode: Ground → Air
4. **System detects** critical compliance change:
   - Ground (49 CFR): DOT shipping paper, DOT hazmat placards, no quantity limits per package for PG II
   - Air (IATA DGR): Shipper's Declaration for Dangerous Goods, IATA labels, strict quantity limits (5L per package for PG II, passenger aircraft limited), packaging requirements (UN specification required)
5. **ESANG AI™ alert:** "⚠️ MODAL CHANGE — Switching to air transport changes ALL hazmat documentation. 49 CFR shipping papers are NOT valid for air transport. IATA Shipper's Declaration required. Quantity limits may restrict this shipment."
6. **Quantity check:** Package contains 20L of UN1266 PG II → IATA limit for cargo aircraft only: 60L per package ✅ → but passenger aircraft limit: 5L ❌ → must use cargo aircraft only
7. **Platform generates** IATA Shipper's Declaration for Dangerous Goods:
   - Format: IATA standard (different from DOT)
   - Fields: Shipper name/address, consignee, 2 copies to carrier
   - Nature and quantity: "UN1266, Perfumery Products, 3, II, 20L"
   - Packing instruction: PI 305 (for cargo aircraft only)
   - Aircraft type: CARGO AIRCRAFT ONLY (CAO) box checked
   - "This shipment is within the limitations prescribed for CARGO AIRCRAFT ONLY"
   - Signed shipper certification
8. **Packaging verification:** Original ground packaging may not meet UN specification for air → system flags: "Verify packaging meets IATA PI 305 requirements before tender to airline"
9. **Label change:** DOT Class 3 hazmat label → IATA Flammable Liquid label (similar but not identical — IATA requires size/color specifications)
10. **Documentation handed to airline:** Shipper's Declaration (2 copies) + overpack marking (if applicable) → FedEx air operations accepts

**Expected Outcome:** Platform manages modal change from ground to air, auto-generates IATA documentation replacing DOT documents, checks quantity limits, and verifies packaging compatibility.

**Platform Features Tested:** Multi-modal compliance engine (ground → air), IATA DGR integration, Shipper's Declaration generation, quantity limit checking (passenger vs. cargo aircraft), packaging instruction reference, CAO (Cargo Aircraft Only) determination, IATA label requirements, ground-to-air documentation conversion

**Validations:**
- ✅ Modal change triggers documentation regeneration
- ✅ IATA Shipper's Declaration auto-generated
- ✅ Quantity limits checked (cargo aircraft only)
- ✅ Packaging verification flagged
- ✅ IATA-specific labels identified

**ROI:** FedEx avoids $175,000 FAA fine for undeclared/misdeclared dangerous goods on aircraft + potential aircraft incident → client receives time-critical shipment in 12 hours.

> **Platform Gap GAP-094:** No IATA Dangerous Goods Regulations (DGR) module — platform handles DOT ground transport only. Need multi-modal support (ground, air, sea, rail) with automatic documentation conversion when transport mode changes.

---

## CRD-671: ALCOHOL & DRUG TESTING — POST-ACCIDENT TESTING REQUIREMENTS
**Company:** Sunoco LP (Philadelphia, PA)  
**Season:** Winter | **Time:** 4:30 PM EST | **Route:** I-95, Delaware — accident scene

**Narrative:** A Sunoco driver is involved in a DOT-reportable accident on I-95: the tanker rear-ends a passenger vehicle, the other driver is injured and transported by ambulance, and there's a small fuel spill. Under 49 CFR 382.303, the driver MUST be tested for drugs and alcohol — but the clock is ticking: alcohol test must occur within 8 hours, drug test within 32 hours. Tests the platform's post-accident testing compliance.

**Steps:**
1. **4:30 PM:** Accident occurs → driver reports via app → Safety Manager and Dispatcher alerted
2. **System evaluates** DOT post-accident testing criteria (49 CFR 382.303(a)):
   - Was there a fatality? NO → but continue evaluation
   - Was there a bodily injury requiring medical treatment away from scene? YES (other driver transported) → post-accident testing REQUIRED
   - Was the CMV driver issued a citation? TBD (pending police report)
3. **Immediate alert:** "⚠️ POST-ACCIDENT TESTING REQUIRED — Alcohol test must be completed by 12:30 AM (8 hours from accident). Drug test must be completed by 12:30 AM tomorrow +1 day (32 hours)."
4. **Clock starts:** 4:30 PM accident time:
   - Alcohol deadline: 12:30 AM EST (8 hours) — tonight!
   - Drug deadline: 12:30 AM EST Day 3 (32 hours) — tomorrow night
   - ⚠️ If alcohol test not completed in 8 hours → cannot be administered AND must document why → but alcohol test result is lost forever
5. **Collection site finder (URGENT):** Platform locates nearest DOT-approved collection site:
   - Concentra, Wilmington, DE (4 miles from accident) — closes at 6 PM → 1.5 hours remaining
   - CareFirst, Newark, DE (12 miles) — closes at 8 PM
   - Emergency after-hours: MedExpress, Philadelphia (35 miles) — open 24/7
6. **Dispatcher** arranges transport for driver to Concentra Wilmington → driver cannot drive (post-accident protocol)
7. **5:45 PM:** Driver arrives at Concentra → alcohol test (breath) administered → BAC: 0.000 ✅
8. **5:50 PM:** Drug test (urine collection) → sample collected → chain of custody completed → sent to SAMHSA lab
9. **Deadlines met:** Alcohol: 1 hour 15 min after accident (within 8-hour window ✅) → Drug: 1 hour 20 min (within 32-hour window ✅)
10. **Platform documents:** Post-accident testing record: accident time, criteria met, collection time, results, chain of custody → linked to accident report
11. **Results (Day 3):** Drug test → NEGATIVE ✅ → driver cleared to return to duty
12. **If alcohol test had been missed (>8 hours):** Platform generates Form 382.303 documentation: "Alcohol test not administered within 8 hours — reasons documented per 49 CFR 382.303(d)(1)"

**Expected Outcome:** Platform triggers post-accident testing requirements, calculates deadlines, locates collection sites, tracks collection timing, and documents results per DOT requirements.

**Platform Features Tested:** Post-accident testing criteria evaluation (49 CFR 382.303), deadline calculation (8-hour alcohol, 32-hour drug), urgent collection site finder, deadline countdown visible to all parties, chain of custody tracking, result management, missed-test documentation, linked accident report

**Validations:**
- ✅ Post-accident testing correctly required (injury criterion met)
- ✅ 8-hour alcohol deadline calculated from accident time
- ✅ Collection site found within time constraints
- ✅ Both tests completed within deadlines
- ✅ Results linked to accident report

**ROI:** Sunoco maintains DOT compliance → avoids $16,000 fine for failure to conduct post-accident testing → clean test results protect carrier in liability lawsuit.

---

## CRD-672: UNIFIED CARRIER REGISTRATION (UCR) — MULTI-STATE FILING
**Company:** Schneider National (Green Bay, WI)  
**Season:** October (annual UCR filing period) | **Time:** 9:00 AM CDT | **Route:** N/A — compliance filing

**Narrative:** The Unified Carrier Registration (UCR) Agreement requires all interstate carriers to register and pay annual fees based on fleet size. Schneider operates 15,000+ power units — the highest UCR fee bracket. Registration must be completed by December 31 or carrier faces $500/day penalty. Tests the platform's UCR management.

**Steps:**
1. **October 1:** UCR filing window opens → platform alerts: "2027 UCR filing now open. Deadline: December 31, 2026. Based on your fleet size (15,247 power units), your bracket and fee are calculated below."
2. **Fee calculation (UCR brackets):**
   - 0-2 vehicles: $69
   - 3-5 vehicles: $206
   - 6-20 vehicles: $344
   - 21-100 vehicles: $1,373
   - 101-1,000 vehicles: $6,393
   - 1,001+ vehicles: $73,346 ← Schneider's bracket
3. **Platform auto-fills** UCR application:
   - Legal name: Schneider National Carriers, Inc.
   - USDOT#: 264184
   - Fleet size: 15,247 power units (from fleet management data)
   - Operating authority types: Common carrier, contract carrier, broker
   - States of operation: 48 contiguous states
4. **UCR filing:** Platform submits electronically through UCR online system → payment processed: $73,346
5. **Confirmation:** UCR receipt number issued → platform stores receipt → UCR status updated to "ACTIVE 2027"
6. **Subsidiary check:** Schneider has 3 subsidiary DOT numbers → each needs separate UCR filing:
   - Schneider National Carriers: 15,247 units → $73,346
   - Schneider Brokerage: 0 units (broker only) → $69
   - Schneider Intermodal: 2,847 units → $73,346
   - **Total UCR fees: $146,761**
7. **Platform tracks** all 3 filings → single dashboard shows UCR status for parent and subsidiaries
8. **Verification:** DOT officer can verify UCR status at roadside → platform provides UCR receipt number for driver's records

**Expected Outcome:** Platform manages annual UCR filing, calculates fees by fleet bracket, files electronically, tracks subsidiaries, and provides verification for roadside inspections.

**Platform Features Tested:** UCR filing management, fleet-size-based fee calculation, electronic filing submission, subsidiary tracking, multi-DOT-number management, deadline alerting, receipt storage, roadside verification data

**Validations:**
- ✅ Fleet size correctly calculated (15,247)
- ✅ Correct fee bracket applied ($73,346)
- ✅ All subsidiaries filed
- ✅ Electronic filing submitted
- ✅ Receipt available for roadside verification

**ROI:** Automated UCR filing saves Schneider $8,400/year in compliance staff time → avoids $500/day late penalty ($15,000 for 30-day delay).

---

## CRD-673: INTERNATIONAL FUEL TAX AGREEMENT (IFTA) — QUARTERLY FILING
**Company:** Groendyke Transport (Enid, OK)  
**Season:** Quarterly (January filing) | **Time:** 9:00 AM CST | **Route:** All Groendyke interstate operations — 48 states

**Narrative:** IFTA requires carriers operating in 2+ jurisdictions to file quarterly fuel tax returns, reporting miles driven and fuel purchased in each jurisdiction. Groendyke's 1,200 trucks operate in 48 states — the quarterly IFTA return involves calculating miles per state, fuel purchased per state, and net tax owed or credit per state. Tests the platform's IFTA data aggregation.

**Steps:**
1. **Q4 IFTA filing due:** January 31 → platform aggregates Q4 data from all 1,200 trucks
2. **Data aggregation (automated from ELD/GPS):**
   - Total fleet miles Q4: 47,200,000 miles
   - Miles per jurisdiction: 48 states broken down (Texas: 8.4M, Oklahoma: 4.2M, Louisiana: 3.8M, ...)
   - Total fuel purchased Q4: 8,581,818 gallons (at avg 5.5 MPG)
   - Fuel purchased per jurisdiction: 48 states broken down
3. **IFTA calculation per state:**
   - For each state: (Miles driven ÷ fleet MPG = fuel consumed) vs. (fuel actually purchased in state)
   - If consumed > purchased → owe tax to that state
   - If purchased > consumed → credit from that state
4. **Example — Texas:**
   - Miles in Texas: 8,400,000
   - Fuel consumed in Texas: 8,400,000 ÷ 5.5 = 1,527,273 gal
   - Fuel purchased in Texas: 1,842,000 gal
   - Surplus purchased: 314,727 gal → CREDIT from Texas
   - Texas fuel tax rate: $0.20/gal → Credit: $62,945.40
5. **Example — New York:**
   - Miles in NY: 1,200,000
   - Fuel consumed: 218,182 gal
   - Fuel purchased in NY: 142,000 gal (drivers avoid buying in NY due to high tax)
   - Deficit: 76,182 gal → OWE to New York
   - NY fuel tax rate: $0.4445/gal → Owed: $33,872.88
6. **Net IFTA:** Total across 48 states: Owed $847,000 — Credits $712,000 = Net payment: $135,000
7. **Platform generates** IFTA quarterly return with all 48 jurisdictions pre-filled → Compliance Officer reviews → submits electronically
8. **Payment:** $135,000 net IFTA payment submitted to base jurisdiction (Oklahoma) → Oklahoma distributes to other states

**Expected Outcome:** Platform aggregates ELD/GPS mileage data and fuel purchase records to auto-generate IFTA quarterly returns for 48 jurisdictions.

**Platform Features Tested:** IFTA mileage aggregation from ELD/GPS, per-state fuel purchase tracking, IFTA calculation engine (consumed vs. purchased), 48-jurisdiction tax rate database, quarterly return generation, electronic filing, base jurisdiction payment, credit/debit per state

**Validations:**
- ✅ 47.2M miles correctly allocated across 48 states
- ✅ Fuel purchases tracked per jurisdiction
- ✅ Per-state tax calculation (rate × deficit/surplus)
- ✅ Net IFTA payment calculated correctly
- ✅ Quarterly return auto-generated

**ROI:** Groendyke saves $84,000/year in IFTA filing preparation (4 quarterly filings × $21,000 each in CPA fees) → automated calculation eliminates $12,000/year in filing errors.

> **Platform Gap GAP-095:** No IFTA quarterly return automation — mileage and fuel data exist in ELD/GPS and fuel card systems but not aggregated for IFTA reporting. Need automated mileage allocation, fuel purchase matching, 48-jurisdiction tax rate database, and electronic filing.

---

## CRD-674: HAZMAT SHIPPER CERTIFICATION — 49 CFR 172.204 COMPLIANCE
**Company:** BASF Corporation (Florham Park, NJ — world's largest chemical company)  
**Season:** Any | **Time:** 10:00 AM EDT | **Route:** BASF Geismar, LA → BASF Freeport, TX (278 miles)

**Narrative:** Every hazmat shipping paper requires a shipper certification statement (49 CFR 172.204) — the shipper certifies that the material is properly classified, described, packaged, marked, labeled, and in proper condition for transport. If the certification is missing, incorrect, or the signatory isn't authorized, it's a violation. Tests the platform's automated shipper certification management.

**Steps:**
1. **Load created:** BASF ships methanol (UN1230, Class 3, PG II) → shipping paper auto-generated
2. **Shipper certification (49 CFR 172.204(a)):** "This is to certify that the above-named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation."
3. **Platform auto-inserts** certification text on shipping paper → but WHO signs?
4. **Authorized signatory verification:**
   - BASF has designated 12 authorized signatories in the platform
   - System verifies that the person creating/approving the load is an authorized signatory
   - Shipper (Sarah Kim, BASF Logistics Manager) is on the authorized list ✅
5. **Digital signature:** Sarah applies digital signature via platform → timestamp, name, title recorded
6. **Certification variations required by route:**
   - Standard ground: 49 CFR 172.204(a) certification ✅
   - If load included air leg: Additional IATA DGR certification required
   - If load included water leg: Additional IMDG Code certification required
   - This load is ground only → standard certification sufficient
7. **Validation checks before certification:**
   - Proper shipping name matches UN number ✅ (Methanol = UN1230)
   - Hazard class matches substance ✅ (Class 3)
   - Packing group correct ✅ (PG II)
   - ERG guide correct ✅ (Guide #131)
   - Emergency contact current ✅ (CHEMTREC)
   - Quantity within packaging limits ✅
8. **If any validation fails:** System blocks certification: "Cannot certify — discrepancy found: [specific issue]. Correct before signing."
9. **Shipping paper generated** with certification → PDF created → available to driver and carrier
10. **Audit trail:** Certification record: who signed, when, what they certified, all validations passed → stored for 2 years per DOT requirements

**Expected Outcome:** Platform auto-generates shipper certification with validation checks, authorized signatory verification, and digital signature — preventing improper certification.

**Platform Features Tested:** Shipper certification text (49 CFR 172.204), authorized signatory management, digital signature, pre-certification validation (PSN, class, PG, ERG), modal-specific certification variants, certification blocking on discrepancy, audit trail, 2-year retention

**Validations:**
- ✅ Certification text auto-inserted per 49 CFR 172.204
- ✅ Signatory verified against authorized list
- ✅ All validation checks passed before signing
- ✅ Digital signature with timestamp
- ✅ 2-year audit trail maintained

**ROI:** BASF eliminates 100% of certification errors (industry avg: 3.2% of shipping papers have certification issues) → 3.2% of 5,000 annual loads = 160 violations avoided × $1,200 avg fine = $192,000/year.

---

## CRD-675: COMPREHENSIVE REGULATORY CHANGE TRACKER — 12 REGULATIONS CHANGED IN Q4
**Company:** EusoTrip Platform (regulatory compliance feature)  
**Season:** Q4 (October-December) | **Time:** Ongoing | **Route:** N/A — platform-wide regulatory monitoring

**Narrative:** In Q4 2026, 12 different regulatory changes affect hazmat transport: 3 PHMSA final rules, 2 FMCSA updates, 1 EPA rule, 2 state-level changes, 2 Canadian TDG amendments, and 2 OSHA updates. The platform must track all changes, determine which users are affected, and ensure compliance before effective dates. Tests the platform's regulatory change management.

**Steps:**
1. **Regulatory feed:** Platform monitors Federal Register, Canada Gazette, state DOT bulletins → detects 12 changes in Q4:
   - PHMSA-2026-0147: Updated Class 9 lithium battery marking requirements (effective Jan 1)
   - PHMSA-2026-0189: New e-shipping paper pilot program (voluntary, effective immediately)
   - PHMSA-2026-0201: Revised Table 172.101 — 47 new UN entries
   - FMCSA-2026-0892: Updated ELD technical specifications v3.0 (effective July 1)
   - FMCSA-2026-0934: Modified HOS short-haul exemption radius (150→200 air-miles)
   - EPA-2026-0411: Updated RMP threshold for hydrofluoric acid
   - Texas: New hazmat permit fee structure (effective Jan 1)
   - California: CARB Phase 3 vapor recovery requirements (effective April 1)
   - Canada TDG: Amendment 19 — new placarding for Class 2.1 (effective March 1)
   - Canada TDG: Updated ERAP requirements (effective June 1)
   - OSHA: Revised PSM covered process list (effective Feb 1)
   - OSHA: Updated HCS GHS Revision 7 labels (effective July 1)
2. **Platform's regulatory engine** processes each change:
   - Determines which users/loads/carriers are affected
   - Calculates days until effective date
   - Prioritizes by impact and urgency
3. **Dashboard:** "Regulatory Changes: 12 pending for Q4-Q1"
   - Critical (effective <30 days): 3 changes → red
   - Important (effective 30-90 days): 5 changes → yellow
   - Informational (effective >90 days): 4 changes → green
4. **Per-change impact analysis:**
   - PHMSA 172.101 update: Affects ESANG AI classification engine → 47 new entries must be added → Engineering ticket auto-created
   - HOS short-haul change: 200-mile radius benefits 847 drivers → those within 150-200 mile lanes gain exemption eligibility
   - Texas permit fees: Affects 2,400 carriers operating in TX → fee schedule update in platform
5. **Compliance Officer** reviews each change → acknowledges awareness → assigns action items
6. **Training impact:** 4 of 12 changes require employee training updates → platform auto-generates training update modules
7. **System updates:** 
   - ESANG AI: 47 new UN entries added to classification engine
   - HOS calculator: Short-haul radius updated to 200 miles
   - Permit fees: Texas schedule updated
   - Shipping papers: Updated certification text (if applicable)
8. **Compliance verification:** Before each change's effective date → platform confirms all updates implemented → "Regulatory Change CRD-675-01: PHMSA Table update — IMPLEMENTED ✅"

**Expected Outcome:** Platform monitors regulatory changes across 5+ agencies, determines impact on platform users, prioritizes by urgency, auto-generates engineering tickets and training updates, and verifies implementation before effective dates.

**Platform Features Tested:** Multi-agency regulatory monitoring (PHMSA, FMCSA, EPA, OSHA, state, Canadian TDG), regulatory change impact analysis, user notification, prioritization dashboard, engineering ticket auto-generation, training update creation, implementation verification, compliance calendar, ESANG AI model update pipeline

**Validations:**
- ✅ 12 regulatory changes detected from 5+ agencies
- ✅ Impact analysis per change (users, loads, carriers affected)
- ✅ Priority ranking (critical/important/informational)
- ✅ Action items assigned with deadlines
- ✅ Implementation verified before effective dates

**ROI:** Platform stays ahead of regulatory changes → zero "surprise" compliance gaps → estimated $340,000/year in avoided fines and operational disruptions across all platform users.

> **Platform Gap GAP-096:** No regulatory change monitoring and management system — compliance officers manually track Federal Register and state bulletins. Need automated regulatory feed monitoring, impact analysis, and implementation tracking across all agencies.

---

# PART 27 SUMMARY

| ID | Company | Compliance Topic | Key Test |
|---|---|---|---|
| CRD-651 | Targa Resources | PHMSA Special Permit (DOT-SP) | Over-capacity permit tracking |
| CRD-652 | Groendyke Transport | DOT Compliance Review (3-day audit) | Audit preparation & documentation |
| CRD-653 | Kenan Advantage | FMCSA CSA Score dispute | DataQs dispute support |
| CRD-654 | NGL Energy | EPA Risk Management Plan (RMP) | Terminal threshold monitoring |
| CRD-655 | Schneider National | 48-state hazmat permit matrix | Multi-state permit compliance |
| CRD-656 | CF Industries | HOS agricultural exemption | Seasonal HOS exemption handling |
| CRD-657 | Imperial Oil | Canada-US bilateral TDG agreement | Cross-border document equivalency |
| CRD-658 | PEMEX Logistics | Mexican NOM certification | NOM-002-SCT compliance |
| CRD-659 | Delek US Holdings | OSHA Process Safety Management | Near-miss investigation |
| CRD-660 | Sunoco LP | DOT random drug testing | Mid-transit random selection |
| CRD-661 | Groendyke Transport | Driver Qualification File (47 docs) | DQF completeness management |
| CRD-662 | Brenntag | Hazmat Security Plan review | Annual 49 CFR 172.802 review |
| CRD-663 | Kenan Advantage | Cargo tank retest scheduling | 6,960 annual tests for 2,400 tanks |
| CRD-664 | Energy Solutions | Class 7 radioactive routing | Preferred route enforcement |
| CRD-665 | Superior Bulk | Cargo tank age compliance | 25-year-old tank management |
| CRD-666 | Dow Chemical | ERG guide mismatch | Emergency response info validation |
| CRD-667 | Valero Energy | California CARB vapor recovery | State-specific environmental compliance |
| CRD-668 | Trimac Transport | ELD data transfer to inspector | eRODS roadside inspection |
| CRD-669 | Brenntag | Hazmat training tracking (400 emp) | 49 CFR 172.704 compliance |
| CRD-670 | FedEx Custom Critical | Ground → air modal change | IATA DGR documentation |
| CRD-671 | Sunoco LP | Post-accident drug/alcohol testing | 8-hour/32-hour deadline management |
| CRD-672 | Schneider National | UCR annual filing | Fleet-size fee calculation |
| CRD-673 | Groendyke Transport | IFTA quarterly filing | 48-state fuel tax allocation |
| CRD-674 | BASF Corporation | Shipper certification (172.204) | Authorized signatory management |
| CRD-675 | Platform-wide | 12 regulatory changes in Q4 | Multi-agency change tracking |

## New Platform Gaps Identified (This Document)

| Gap ID | Description |
|---|---|
| GAP-084 | No PHMSA Special Permit (DOT-SP) tracking and enforcement system |
| GAP-085 | No FMCSA Audit Preparation Module for Compliance Review documentation |
| GAP-086 | No CSA BASICs score monitoring or DataQs dispute support |
| GAP-087 | No terminal chemical inventory tracking or EPA RMP threshold monitoring |
| GAP-088 | No 48-state hazmat permit tracking matrix with expiration management |
| GAP-089 | No integrated DOT drug/alcohol testing program management |
| GAP-090 | No cargo tank retest scheduling system per 49 CFR 180.407 |
| GAP-091 | No Class 7 (Radioactive) preferred routing module |
| GAP-092 | No ERG guide validation against 49 CFR 172.101 Table |
| GAP-093 | No hazmat employee training management system (49 CFR 172.704) |
| GAP-094 | No IATA DGR module for air modal hazmat documentation |
| GAP-095 | No IFTA quarterly return automation |
| GAP-096 | No multi-agency regulatory change monitoring and management system |

## Cumulative Progress

- **Scenarios Complete:** 675 of 2,000 (33.8%)
- **Platform Gaps Identified:** 96 (GAP-001 through GAP-096)
- **Documents Created:** 27 (Parts 01-27)
- **Categories Complete:** Individual Roles (500), Cross-Role (50), Seasonal/Disaster (25), Edge Case/Stress Test (25), Financial/Settlement (25), AI & Technology (25), Compliance & Regulatory (25)

## NEXT: Part 28 — Gamification & User Engagement (GUE-676 through GUE-700)
Topics: The Haul season launch, XP farming prevention, leaderboard manipulation, guild war competition, badge unlock edge cases, gamification across all 11 roles, team challenge orchestration, reward redemption, streak maintenance during holidays, prestige levels, rare achievement unlocks, new user onboarding gamification, driver retention through gamification, seasonal events, gamification analytics.
