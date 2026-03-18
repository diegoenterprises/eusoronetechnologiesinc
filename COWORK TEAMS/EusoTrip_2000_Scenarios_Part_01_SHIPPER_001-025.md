# ═══════════════════════════════════════════════════════════════════════════════
# EUSOTRIP 2,000 SCENARIO SIMULATION — PART 1A
# SHIPPER SCENARIOS: SHP-001 through SHP-025
# Real-Company Transactional Events Using Platform Ecosystem
# ═══════════════════════════════════════════════════════════════════════════════

**Document:** Part 1A of 80
**Role Focus:** SHIPPER (Hazmat Load Offeror)
**Scenario Range:** SHP-001 → SHP-025
**Companies Used:** Real US companies from EusoTrip Target Research
**Created:** March 7, 2026
**For:** EusoTrip Platform Validation & Investor Bible

---

## SCENARIO CATEGORY: SHIPPER ONBOARDING & REGISTRATION

---

### SHP-001: ExxonMobil Registers as Enterprise Shipper
**Company:** ExxonMobil (Houston, TX)
**Season:** Winter (January) | **Time:** 9:00 AM CST Monday
**Route Context:** N/A — Onboarding

**Narrative:**
ExxonMobil's logistics director initiates enterprise onboarding to centralize their hazmat shipping across 14 refinery locations. They ship Class 3 flammable liquids (gasoline, diesel, jet fuel) at a volume of 3,000+ loads/month.

**Steps:**
1. Logistics director navigates to eusotrip.com/auth/register
2. Creates account with corporate email (logistics@exxonmobil.com)
3. SMS verification sent to corporate phone — verified
4. Enters company profile: ExxonMobil Corporation, EIN verified, DUNS #00-136-8083
5. Selects "Enterprise Shipper" tier (1000+ loads/month)
6. Compliance setup: PHMSA Registration verified against PHMSA portal
7. EPA ID entered — RCRAInfo verification passes
8. Uploads: PHMSA Certificate, EPA confirmation, $500M general liability policy, pollution liability, W-9
9. Adds 14 facility locations (Baytown TX, Baton Rouge LA, Beaumont TX, etc.)
10. Each facility configured with dock count, operating hours, hazmat classes handled
11. Payment setup: Stripe Connect with corporate ACH (net-30 terms)
12. Admin review triggered — flagged as enterprise account
13. Super Admin approves within 4 hours
14. Account activated with enterprise dashboard, API integration keys provided
15. Welcome notification + onboarding tutorial launched

**Expected Outcome:** Enterprise shipper fully onboarded with 14 facilities, API access, and verified compliance
**Platform Features Tested:** Registration flow, PHMSA verification, EPA verification, multi-facility setup, enterprise tier activation, Stripe Connect, admin approval workflow
**Validations:** `account_created`, `phmsa_verified`, `epa_verified`, `14_facilities_added`, `enterprise_tier_set`, `api_keys_generated`, `admin_approved`

---

### SHP-002: Dow Chemical Posts First Hazmat Load (Class 8 — Corrosive)
**Company:** Dow Chemical (Midland, MI)
**Season:** Spring (April) | **Time:** 7:30 AM EST Tuesday
**Route:** Midland, MI → Houston, TX (1,280 miles)

**Narrative:**
Dow Chemical's shipping coordinator posts their first load on EusoTrip — a tanker of hydrochloric acid (UN1789, Class 8 corrosive) heading from their Midland plant to a customer facility in Houston. This tests the full hazmat load creation workflow.

**Steps:**
1. Shipping coordinator logs into EusoTrip dashboard
2. Clicks "Create New Load" from shipper dashboard
3. Selects cargo type: Hazardous Material
4. ESANG AI™ classification assist activated — coordinator enters "hydrochloric acid"
5. AI auto-fills: UN1789, Class 8, Packing Group II, Corrosive
6. Coordinator confirms classification — correct
7. Enters packaging: DOT-approved tanker, 6,500 gallons
8. Weight: 42,000 lbs gross
9. ESANG AI™ generates required placards: Class 8 Corrosive diamond
10. Pickup: Dow Chemical Midland Plant, Dock 7, April 15 at 6:00 AM
11. Delivery: Customer facility Houston TX, April 17 by 5:00 PM
12. Rate entered: $5.00/mile = $6,400 total
13. Requirements: Tanker endorsement, hazmat endorsement, corrosive experience preferred
14. 24/7 emergency contact auto-populated from company profile
15. BOL auto-generated with proper shipping description per 49 CFR 172.202
16. Load posted to marketplace — visible only to qualified carriers
17. Notification pushed to 47 qualified carriers within 200-mile radius of Midland

**Expected Outcome:** Hazmat Class 8 load posted with full regulatory compliance, auto-generated BOL, filtered visibility
**Platform Features Tested:** ESANG AI™ classification, hazmat load creation, UN number lookup, placard generation, BOL auto-generation, carrier qualification filtering, push notifications
**Validations:** `hazmat_classified`, `un_number_correct`, `placard_generated`, `bol_created`, `carrier_filtering_active`, `47_carriers_notified`
**ROI for Dow Chemical:** Eliminated 45 minutes of manual classification and BOL preparation per load. At 300 loads/month = 225 labor hours saved monthly.

---

### SHP-003: BASF Receives Bids and Selects Carrier for Class 3 Flammable
**Company:** BASF Corporation (Florham Park, NJ)
**Season:** Summer (July) | **Time:** 10:15 AM EST Wednesday
**Route:** Geismar, LA → Freeport, TX (290 miles, short-haul)

**Narrative:**
BASF posted a Class 3 flammable liquid load (toluene, UN1294) yesterday. Now 8 carriers have submitted bids. The shipping manager reviews bids using EusoTrip's carrier vetting and selection tools during peak summer shipping season when gas prices are elevated ($4.25/gal average).

**Steps:**
1. Shipping manager opens load SHP-0847 from dashboard
2. Views 8 incoming bids ranging from $1,200 to $1,850
3. Clicks first bid — Schneider National at $1,450
4. Platform displays: Carrier safety score 94/100, SAFER data verified, 15-year authority, $5M insurance
5. Clicks second bid — Quality Carriers at $1,380
6. Platform displays: Carrier safety score 97/100, hazmat specialist, 22-year authority, $10M insurance
7. Clicks third bid — unknown small carrier at $1,200
8. Platform displays: Warning — carrier authority only 4 months old, minimum insurance, no hazmat history
9. ESANG AI™ recommendation appears: "Quality Carriers recommended — highest safety score, hazmat specialist, competitive rate"
10. Manager clicks "View FMCSA Record" for Quality Carriers — clean CSA scores, 0 OOS violations in 24 months
11. Manager accepts Quality Carriers bid at $1,380
12. Quality Carriers receives booking confirmation via push notification and email
13. Load status changes from "Available" to "Booked"
14. Other 7 bidders notified load is no longer available
15. BASF shipping manager and Quality Carriers connected via EusoTrip messaging

**Expected Outcome:** Carrier selected using data-driven vetting; AI recommendation validated; low-quality carrier flagged
**Platform Features Tested:** Bid management, carrier safety scoring, SAFER/FMCSA integration, ESANG AI™ recommendation engine, carrier vetting warnings, booking workflow, automated notifications
**Validations:** `8_bids_received`, `safety_scores_displayed`, `fmcsa_data_pulled`, `ai_recommendation_shown`, `warning_on_new_authority`, `booking_confirmed`, `7_bidders_notified`
**ROI for BASF:** Data-driven carrier selection reduces cargo claims by estimated 35%. AI recommendation saved 30 minutes of manual vetting.

---

### SHP-004: Chevron Tracks Live Hazmat Shipment Across Texas
**Company:** Chevron U.S.A. (San Ramon, CA)
**Season:** Summer (August) | **Time:** 2:00 PM CST Thursday
**Route:** Pasadena, TX → El Paso, TX (750 miles)

**Narrative:**
Chevron's operations center is tracking a live Class 3 gasoline tanker shipment across Texas during a summer heat advisory (108°F in West Texas). The shipment left Pasadena at 5:00 AM and the logistics team monitors it in real-time via the shipper tracking dashboard.

**Steps:**
1. Operations analyst opens "Active Shipments" widget on shipper dashboard
2. Clicks load CHV-4521 — tanker of gasoline (UN1203) en route to El Paso
3. Live map shows driver position: currently near San Antonio, TX (320 miles in)
4. ETA widget calculates: 6.5 hours remaining, on schedule
5. Telemetry feed shows: speed 62 mph, tanker temperature normal, no alerts
6. Weather widget overlay shows: Heat advisory ahead in West TX, 108°F
7. ESANG AI™ proactive alert: "Recommend driver take extended rest stop in Fort Stockton — heat advisory zone"
8. Analyst clicks "Send Message to Driver" — types: "Please hydrate and rest in Fort Stockton per AI advisory"
9. Driver acknowledges message via mobile app
10. Analyst checks driver HOS: 6.2 hours driven, 4.8 hours remaining — compliant
11. Geo-fence alert triggers: Shipment entered El Paso county
12. Auto-notification sent to receiving facility: "Chevron shipment arriving in approximately 45 minutes"
13. Driver arrives at delivery, checks in via mobile app
14. POD (Proof of Delivery) uploaded — signed by receiving dock manager
15. Load status changes to "Delivered" — Chevron notified

**Expected Outcome:** Real-time tracking with weather-aware AI advisories, geo-fence alerts, and seamless delivery confirmation
**Platform Features Tested:** Live GPS tracking, telemetry dashboard, weather overlay, ESANG AI™ proactive alerts, in-app messaging, HOS monitoring, geo-fence triggers, POD upload, delivery notification chain
**Validations:** `live_tracking_accurate`, `weather_overlay_active`, `ai_advisory_triggered`, `message_delivered`, `hos_compliant`, `geofence_fired`, `pod_uploaded`, `delivery_confirmed`
**ROI for Chevron:** Real-time visibility eliminates 15+ phone calls per shipment to check status. AI weather advisory prevents heat-related driver incidents.

---

### SHP-005: Shell Chemical Posts Multi-Stop Hazmat Load
**Company:** Shell Chemical LP (Houston, TX)
**Season:** Fall (October) | **Time:** 8:00 AM CST Monday
**Route:** Deer Park, TX → Baton Rouge, LA → Lake Charles, LA → Beaumont, TX (multi-stop, 520 total miles)

**Narrative:**
Shell Chemical needs to deliver different quantities of ethylene oxide (UN1040, Class 2.3 poison gas) to three customer sites along the Gulf Coast. This tests the platform's multi-stop hazmat load creation with partial deliveries.

**Steps:**
1. Logistics planner creates new load — selects "Multi-Stop Delivery"
2. Hazmat entry: Ethylene oxide, UN1040, Class 2.3, Packing Group I — HIGHEST DANGER
3. ESANG AI™ flags: "Class 2.3 Poison Gas — Escort may be required per state regulations"
4. Platform auto-checks Louisiana and Texas escort requirements — not required for this UN number but recommended
5. Stop 1: Deer Park TX (pickup) — full load 38,000 lbs
6. Stop 2: Baton Rouge LA (partial delivery) — drop 15,000 lbs at BASF Geismar plant
7. Stop 3: Lake Charles LA (partial delivery) — drop 13,000 lbs at Sasol facility
8. Stop 4: Beaumont TX (final delivery) — remaining 10,000 lbs at Motiva refinery
9. Each stop has appointment windows, dock assignments, and contact persons
10. Rate calculated: $4,800 total ($9.23/mile) — premium for Class 2.3 + multi-stop
11. Platform generates 3 separate BOLs — one per delivery stop with correct quantities
12. Emergency response info (ERG Guide 119) attached to each BOL
13. Load posted — visible to carriers with Class 2.3 endorsement and multi-stop capability
14. Only 12 qualified carriers in marketplace notified
15. Shell receives bid from Trimac Transportation within 2 hours

**Expected Outcome:** Multi-stop hazmat load created with per-stop BOLs, poison gas warnings, and narrow carrier qualification pool
**Platform Features Tested:** Multi-stop load creation, partial delivery workflow, per-stop BOL generation, ERG guide attachment, Class 2.3 specific handling, carrier qualification narrowing, escort recommendation engine
**Validations:** `multi_stop_created`, `3_bols_generated`, `erg_guide_attached`, `class_2_3_filtering`, `12_carriers_qualified`, `escort_recommendation_shown`
**ROI for Shell:** Multi-stop load reduces 3 separate shipments to 1, saving an estimated $3,200 in duplicate freight costs per occurrence.

---

### SHP-006: LyondellBasell Handles Shipper-Side Dispute After Delivery Damage
**Company:** LyondellBasell (Houston, TX)
**Season:** Winter (December) | **Time:** 11:30 AM CST Friday
**Route:** Channelview, TX → Cincinnati, OH (1,050 miles) — Completed

**Narrative:**
LyondellBasell shipped polypropylene pellets (non-hazmat but on the platform) to a customer in Cincinnati. The customer reported water contamination of 8 pallets upon arrival. The shipper initiates a dispute through EusoTrip's claims workflow.

**Steps:**
1. LyondellBasell logistics manager receives call from Cincinnati customer — 8 of 22 pallets water-damaged
2. Manager logs into EusoTrip, opens completed load LYB-1203
3. Clicks "File Claim" — selects "Cargo Damage"
4. Uploads photos from customer showing water damage
5. Platform pulls: Original BOL (22 pallets, good condition at pickup), POD (signed with no exceptions noted)
6. Enters claim amount: $12,800 (8 pallets × $1,600 value)
7. Carrier (Werner Enterprises) receives claim notification
8. Payment for load ($2,625) automatically placed in escrow pending resolution
9. Werner's dispatcher reviews — uploads truck inspection showing no leaks, weather data showing rain in Kentucky
10. Platform creates dispute timeline with all uploaded evidence
11. ESANG AI™ analysis: "Weather data shows heavy rain on I-71 near Louisville. Recommend checking trailer seal condition at pickup."
12. 72-hour resolution window opens — both parties can add documentation
13. LyondellBasell uploads pickup inspection photos showing good trailer seal condition
14. Platform escalates to mediation — EusoTrip claims adjuster reviews
15. Resolution: Carrier liable for $9,600 (75% of claim — shared responsibility due to weather)

**Expected Outcome:** Full dispute lifecycle from filing through AI-assisted evidence analysis to mediated resolution
**Platform Features Tested:** Claims filing workflow, escrow hold, evidence upload, dispute timeline, ESANG AI™ evidence analysis, mediation escalation, partial liability resolution, escrow release
**Validations:** `claim_filed`, `escrow_activated`, `evidence_timeline_created`, `ai_analysis_provided`, `mediation_triggered`, `partial_resolution`, `escrow_released`
**ROI for LyondellBasell:** Platform-mediated disputes resolve in 5 days vs. industry average of 45 days. Structured evidence trail reduces legal costs.

---

### SHP-007: Huntsman Corporation Uses EusoWallet for Load Payment (Net-30)
**Company:** Huntsman Corporation (The Woodlands, TX)
**Season:** Spring (March) | **Time:** 3:00 PM CST Tuesday
**Route:** Port Neches, TX → Charlotte, NC (1,020 miles) — Delivered 28 days ago

**Narrative:**
Huntsman's accounts payable team processes a net-30 payment for a completed MDI (methylene diphenyl diisocyanate, Class 6.1 toxic) shipment through EusoWallet. The payment was due yesterday — the auto-reminder triggered on day 25.

**Steps:**
1. AP clerk logs into EusoTrip — dashboard shows "1 Payment Due" alert (yellow)
2. Opens payment queue — sees load HNT-0392: $5,100 due to Kenan Advantage Group
3. Reviews: Load delivered March 1, net-30 terms, due March 31, today is March 31
4. Clicks "Process Payment"
5. EusoWallet displays: Load payment $5,100, platform fee 5.5% = $280.50, total charge $5,380.50
6. Payment method: Corporate ACH (linked Chase account ****7891)
7. Clerk approves payment
8. EusoWallet processes: $280.50 retained as platform fee, $5,100 credited to Kenan Advantage wallet
9. Invoice auto-generated for Huntsman (expense) and Kenan Advantage (income)
10. Both parties receive payment confirmation notification
11. Transaction recorded in both wallet histories with full audit trail
12. Kenan Advantage driver who hauled the load sees settlement credited to their earnings
13. Load status updates to "Paid — Closed"
14. Huntsman's payment history shows on-time payment — maintains "Excellent Payer" badge

**Expected Outcome:** Net-30 payment processed on time with correct platform fee, invoice generation, and settlement cascade
**Platform Features Tested:** EusoWallet payment processing, net-30 terms enforcement, auto-reminders, platform fee calculation, ACH processing, invoice generation, settlement cascade to driver, payment badges
**Validations:** `payment_processed`, `fee_5_5_percent`, `invoices_generated`, `driver_settlement_updated`, `on_time_badge_maintained`, `audit_trail_complete`
**ROI for Huntsman:** Automated payment reminders eliminate late fees. Single-click payment replaces manual check-cutting process saving $15/payment in processing costs.

---

### SHP-008: Air Products Posts Compressed Gas Load During Holiday Surge (Thanksgiving Week)
**Company:** Air Products and Chemicals (Allentown, PA)
**Season:** Fall (November — Thanksgiving Week) | **Time:** 6:00 AM EST Monday
**Route:** Allentown, PA → Detroit, MI (530 miles)

**Narrative:**
Air Products needs to ship compressed hydrogen (UN1049, Class 2.1 flammable gas) during Thanksgiving week when carrier capacity is extremely tight. Most drivers are taking the holiday off, and spot rates have surged 40% above normal.

**Steps:**
1. Supply chain manager logs in — dashboard "Market Conditions" widget shows: "Carrier availability LOW — Holiday week"
2. Creates load: Compressed hydrogen, UN1049, Class 2.1, tube trailer, 35,000 lbs
3. Sets rate at normal pricing: $3.80/mile = $2,014
4. Posts load — after 4 hours, only 1 bid received (normally gets 6-8)
5. Single bid: $3,200 from a small carrier — 59% above posted rate
6. Manager rejects bid, increases posted rate to $2,800 (market adjustment)
7. ESANG AI™ suggests: "Current market rate for Class 2.1 holiday week: $4.80-$5.20/mile. Consider $2,700-$2,800 for quick booking."
8. Manager updates to $2,750
9. Within 2 hours, 3 new bids arrive: $2,700, $2,750, $2,900
10. Selects $2,700 bid from Matheson Tri-Gas fleet (specialist in compressed gas)
11. Booking confirmed — pickup scheduled for Tuesday 6 AM
12. Manager notes the $736 premium over normal rate — platform logs for seasonal analytics
13. Dashboard widget "Seasonal Spend Analysis" updates showing Q4 premium trending
14. Load executes successfully — delivered Wednesday before Thanksgiving

**Expected Outcome:** Holiday surge pricing navigated with AI market intelligence; seasonal analytics captured
**Platform Features Tested:** Market conditions widget, carrier availability indicators, ESANG AI™ market rate suggestions, dynamic repricing, seasonal analytics tracking, holiday surge detection
**Validations:** `market_conditions_shown`, `low_availability_flagged`, `ai_rate_suggestion`, `repricing_workflow`, `seasonal_analytics_updated`, `holiday_premium_logged`
**ROI for Air Products:** AI market intelligence prevents overpaying by an estimated $400-600 per holiday load while ensuring coverage.

---

### SHP-009: Celanese Chemical Triggers Emergency Shipment at 2:00 AM
**Company:** Celanese Corporation (Irving, TX)
**Season:** Summer (June) | **Time:** 2:00 AM CST Saturday
**Route:** Clear Lake, TX → Calvert City, KY (830 miles)

**Narrative:**
A Celanese customer's production line is shutting down due to acetic acid shortage. Celanese needs an emergency Class 8 corrosive shipment dispatched ASAP — it's 2 AM on a Saturday. This tests the platform's 24/7 emergency load posting and expedited matching.

**Steps:**
1. On-call logistics coordinator opens EusoTrip mobile app at 2:07 AM
2. Creates load with "EMERGENCY" priority flag
3. Cargo: Acetic acid (glacial), UN2789, Class 8 Corrosive, Packing Group II
4. Tanker required, 44,000 lbs
5. Rate set at emergency premium: $7.50/mile = $6,225 (normal would be $4.50/mile)
6. Platform activates emergency matching protocol — pushes to ALL qualified carriers regardless of time
7. Push notifications with emergency alert tone sent to 31 carriers
8. SMS backup sent to carriers who don't have push enabled
9. Within 18 minutes, Quality Distribution responds — driver available in Houston, 25 miles from pickup
10. Coordinator reviews carrier credentials in real-time from mobile app
11. Books Quality Distribution — driver dispatched immediately
12. Driver arrives at Clear Lake facility at 3:15 AM
13. Night shift dock worker processes loading using EusoTrip terminal checklist
14. Shipment departs at 4:30 AM
15. Customer in Calvert City receives delivery by 6:00 PM Saturday — production line saved

**Expected Outcome:** Emergency 2 AM shipment matched and dispatched within 30 minutes on a weekend
**Platform Features Tested:** Emergency priority flag, 24/7 matching protocol, emergency push + SMS notifications, mobile app full functionality, emergency premium pricing, expedited booking, night shift terminal integration
**Validations:** `emergency_flag_set`, `31_carriers_alerted`, `sms_backup_sent`, `18_min_response_time`, `mobile_booking_complete`, `night_terminal_checklist`, `delivery_on_time`
**ROI for Celanese:** Prevented customer production shutdown worth estimated $180,000/day. Platform emergency response 4x faster than traditional broker phone tree.

---

### SHP-010: Eastman Chemical Onboards 6 Facilities Simultaneously
**Company:** Eastman Chemical Company (Kingsport, TN)
**Season:** Winter (February) | **Time:** 10:00 AM EST Wednesday
**Route Context:** N/A — Onboarding / Facility Setup

**Narrative:**
Eastman Chemical's logistics VP decides to onboard all 6 US manufacturing facilities at once to consolidate hazmat shipping onto EusoTrip. Each facility handles different hazmat classes and has different dock configurations.

**Steps:**
1. Logistics VP creates enterprise account — corporate profile verified
2. Begins multi-facility setup wizard
3. Facility 1: Kingsport, TN (HQ plant) — 8 docks, Class 3/6.1/8, 24/7 operation
4. Facility 2: Longview, TX — 4 docks, Class 3/9, daytime only (6AM-6PM)
5. Facility 3: Columbia, SC — 3 docks, Class 8/9, daytime only
6. Facility 4: Indian Orchard, MA — 2 docks, Class 3/6.1, limited hours (7AM-3PM)
7. Facility 5: Jefferson, PA — 3 docks, Class 3/8, daytime only
8. Facility 6: Martinsville, VA — 2 docks, Class 9 only, daytime only
9. Each facility gets: unique address verification, dock configuration, operating hours, hazmat class restrictions, facility contact person, emergency procedures
10. Platform generates facility-specific QR codes for driver check-in
11. Each facility's loading procedures uploaded as PDF
12. Geo-fences created around each facility for arrival/departure tracking
13. Facility managers at each location receive invitation emails to create sub-accounts
14. All 6 facility managers accept invitations and configure their terminal views
15. Enterprise dashboard now shows all 6 facilities on a single map with real-time activity

**Expected Outcome:** 6 facilities onboarded with unique configurations, QR codes, geo-fences, and sub-accounts
**Platform Features Tested:** Multi-facility wizard, per-facility hazmat class restrictions, dock configuration, QR code generation, geo-fence creation, sub-account invitations, enterprise map dashboard
**Validations:** `6_facilities_created`, `hazmat_restrictions_set`, `qr_codes_generated`, `geofences_active`, `6_subaccounts_created`, `enterprise_map_active`
**ROI for Eastman:** Consolidating 6 facilities onto one platform eliminates 6 separate broker relationships, saving estimated $45,000/year in overhead.

---

### SHP-011: Westlake Chemical Uses ESANG AI™ to Classify Unknown Chemical
**Company:** Westlake Chemical Corporation (Houston, TX)
**Season:** Spring (May) | **Time:** 1:30 PM CST Thursday
**Route:** Lake Charles, LA → Geismar, LA (85 miles, short-haul)

**Narrative:**
A new Westlake employee is unsure of the exact DOT classification for a specialty polymer intermediate being shipped for the first time. They use ESANG AI™'s chemical classification assistant to determine the proper UN number and hazmat class.

**Steps:**
1. New shipping clerk opens load creation form
2. Types product name: "Vinyl chloride monomer" into cargo description
3. ESANG AI™ activates classification mode
4. AI displays: "Vinyl chloride, stabilized — UN1086, Class 2.1 (Flammable Gas), Packing Group: N/A (gas)"
5. AI also shows: "DANGER — Extremely flammable. Known carcinogen. Special Provision T50 applies."
6. AI recommends: Cylinder or tube trailer transport only
7. AI generates Safety Data Sheet (SDS) summary with key hazards
8. AI populates required placards: Flammable Gas diamond + Poison/Toxic secondary
9. Clerk confirms classification — all fields auto-populated
10. Clerk enters remaining load details: 22,000 lbs, pressurized tank
11. Platform cross-checks: Carrier must have pressure vessel certification
12. Load posted with full hazmat compliance package
13. Clerk's supervisor receives notification for approval (new employee flag)
14. Supervisor reviews AI classification, approves load posting
15. Clerk receives confirmation — load live on marketplace

**Expected Outcome:** AI correctly classifies complex chemical with dual hazard labels; supervisor approval workflow for new employees
**Platform Features Tested:** ESANG AI™ chemical classification, UN number database, dual-hazard labeling, SDS integration, pressure vessel carrier filtering, new employee supervisor approval workflow
**Validations:** `ai_classification_correct`, `un1086_identified`, `dual_placards_generated`, `sds_summary_shown`, `supervisor_approval_triggered`, `carrier_filtering_pressure_vessel`
**ROI for Westlake:** AI classification prevents mis-classification incidents (average cost: $125,000 per incident in fines). New employee safeguard prevents shipping errors.

---

### SHP-012: Valero Energy Manages Weekly Recurring Shipments
**Company:** Valero Energy Corporation (San Antonio, TX)
**Season:** Year-round | **Time:** 7:00 AM CST Monday (recurring)
**Route:** Port Arthur, TX → Memphis, TN (560 miles) — Weekly

**Narrative:**
Valero ships gasoline (UN1203, Class 3) from their Port Arthur refinery to a Memphis terminal every Monday. They set up a recurring shipment template to automate weekly load creation.

**Steps:**
1. Logistics manager opens "Shipment Templates" from dashboard
2. Creates new template: "Port Arthur → Memphis Weekly Gasoline"
3. Template details: UN1203 gasoline, Class 3, tanker, 44,000 lbs, $2,800 flat rate
4. Pickup: Every Monday at 6:00 AM from Port Arthur Dock 3
5. Delivery: Every Tuesday by 4:00 PM at Memphis Terminal
6. Preferred carrier list: Kenan Advantage Group, Quality Distribution, Schneider National
7. Auto-post setting: Post load every Sunday at 8:00 PM (24 hours before pickup)
8. Auto-assign setting: If preferred carrier confirms, auto-book without manual review
9. Template saved and activated
10. Sunday 8:00 PM: System auto-creates load VAL-W-0048 from template
11. Push notification sent to 3 preferred carriers
12. Kenan Advantage Group auto-accepts (standing agreement)
13. Load auto-booked — logistics manager receives confirmation Monday morning
14. This has repeated successfully for 47 consecutive weeks
15. Dashboard "Recurring Shipments" widget shows 47/48 on-time rate (1 weather delay)

**Expected Outcome:** Fully automated weekly recurring shipment with preferred carrier auto-assignment
**Platform Features Tested:** Shipment templates, recurring schedule automation, preferred carrier lists, auto-posting, auto-assignment, standing agreements, recurring shipment analytics widget
**Validations:** `template_created`, `auto_post_sunday`, `preferred_carriers_notified`, `auto_book_activated`, `47_week_streak`, `analytics_widget_accurate`
**ROI for Valero:** Eliminates 52 manual load postings/year + 52 carrier selection processes. Saves estimated 3 hours/week = 156 hours/year of logistics staff time.

---

### SHP-013: PPG Industries Ships Temperature-Sensitive Hazmat in Summer Heat
**Company:** PPG Industries (Pittsburgh, PA)
**Season:** Summer (July — Heat Wave) | **Time:** 5:00 AM EST Wednesday
**Route:** Lake Charles, LA → Shelby, NC (950 miles)

**Narrative:**
PPG needs to ship organic peroxide (UN3105, Class 5.2) which requires temperature-controlled transport below 77°F. A heat wave is hitting the Southeast with temperatures exceeding 105°F. This tests the platform's temperature-sensitive hazmat workflow.

**Steps:**
1. Shipping coordinator creates load — enters "organic peroxide Type D"
2. ESANG AI™ flags: "CLASS 5.2 — TEMPERATURE CONTROLLED. Maximum transport temperature: 75°F. Emergency temperature: 95°F"
3. AI requires: Reefer or temperature-controlled tanker only
4. Coordinator sets temperature requirement: Maintain below 75°F continuously
5. Platform checks weather along route: Heat advisory — 102-108°F across Louisiana, Mississippi, Alabama
6. ESANG AI™ alert: "CAUTION — Extreme heat along route. Recommend: (1) Night driving through hottest zones, (2) Reefer unit backup power, (3) Temperature alarm threshold set to 70°F for early warning"
7. Coordinator adds AI recommendations to load requirements
8. Rate premium applied: $6.50/mile (30% heat-wave premium) = $6,175
9. Load posted with temperature monitoring requirement
10. Carrier must have: Reefer with continuous telemetry, GPS temperature logging
11. Superior Carriers bids — has temperature-monitored reefer fleet
12. Booking confirmed with temperature SLA: If temp exceeds 77°F, emergency protocol activates
13. During transit: Driver's reefer telemetry feeds real-time to PPG's dashboard
14. Temperature graph shows: maintained 68-72°F throughout journey
15. Delivery successful — temperature log report auto-generated and stored

**Expected Outcome:** Temperature-sensitive Class 5.2 shipped safely during heat wave with continuous monitoring
**Platform Features Tested:** ESANG AI™ temperature requirements, weather-route intersection analysis, temperature SLA creation, real-time reefer telemetry, temperature graph dashboard, heat-wave premium pricing, temperature compliance report
**Validations:** `temp_requirements_set`, `weather_alert_triggered`, `ai_recommendations_generated`, `telemetry_active`, `temp_maintained_below_75`, `compliance_report_generated`
**ROI for PPG:** Prevents Class 5.2 thermal decomposition incident (average cost: $500,000+ including cleanup, fines, and liability). Real-time telemetry provides insurance documentation.

---

### SHP-014: Olin Corporation Handles Shipment Rejection at Delivery
**Company:** Olin Corporation (Clayton, MO)
**Season:** Fall (September) | **Time:** 2:30 PM EST Monday
**Route:** McIntosh, AL → Niagara Falls, NY (1,050 miles) — In Transit

**Narrative:**
Olin shipped chlorine (UN1017, Class 2.3 Poison Gas) from Alabama to New York. Upon arrival, the receiving terminal rejects the shipment due to a damaged valve on the tanker. This tests the platform's delivery rejection and exception handling workflow.

**Steps:**
1. Driver arrives at Niagara Falls terminal — checks in via mobile app
2. Terminal manager inspects tanker — discovers damaged pressure relief valve
3. Terminal manager opens EusoTrip terminal interface — clicks "Reject Delivery"
4. Selects reason: "Equipment defect — damaged pressure relief valve"
5. Uploads 4 photos of damaged valve
6. Platform immediately notifies: Olin (shipper), carrier, broker, and safety team
7. Load status changes to "DELIVERY REJECTED — EXCEPTION"
8. ESANG AI™ safety assessment: "Class 2.3 chlorine with damaged pressure relief valve — ELEVATED RISK. Recommend: Do not move vehicle. Contact CHEMTREC. Notify local fire department."
9. Emergency protocol widget activates on all dashboards
10. Olin's safety manager opens incident management workflow
11. CHEMTREC contacted via platform integration — case #CT-2026-14892 opened
12. Local fire department notified automatically based on facility address
13. Hazmat response team dispatched — valve assessed as minor (no leak)
14. Carrier dispatches replacement tanker for transload operation
15. Original load transferred to new tanker — delivery completed 8 hours late
16. Incident report auto-generated with full timeline, photos, and response actions
17. Detention fee of $850 auto-calculated for 8-hour delay
18. Post-incident review scheduled for all parties

**Expected Outcome:** Delivery rejection triggers full emergency protocol chain for Class 2.3 poison gas
**Platform Features Tested:** Delivery rejection workflow, equipment defect documentation, ESANG AI™ emergency assessment, CHEMTREC integration, emergency notification chain, incident management, transload coordination, detention fee calculation, incident report generation
**Validations:** `rejection_processed`, `photos_uploaded`, `all_parties_notified`, `ai_safety_assessment`, `chemtrec_contacted`, `fire_dept_notified`, `incident_report_generated`, `detention_fee_calculated`
**ROI for Olin:** Automated emergency response chain activates in under 3 minutes vs. 20+ minutes of manual phone calls. Incident documentation is complete and audit-ready.

---

### SHP-015: Albemarle Posts Lithium Battery Shipment (Class 9 — Regulatory Gray Area)
**Company:** Albemarle Corporation (Charlotte, NC)
**Season:** Spring (April) | **Time:** 9:00 AM EST Tuesday
**Route:** Kings Mountain, NC → Sparks, NV (2,350 miles)

**Narrative:**
Albemarle needs to ship lithium battery materials that fall into the often-confusing Class 9 miscellaneous dangerous goods category. The exact regulatory requirements depend on battery type, state of charge, and quantity — a common source of compliance errors industry-wide.

**Steps:**
1. Shipper opens load creation — enters "lithium ion battery cells"
2. ESANG AI™ activates detailed classification wizard
3. AI asks: "What type? (a) Lithium ion cells, (b) Lithium ion batteries, (c) Lithium metal cells, (d) Lithium metal batteries"
4. Shipper selects: (a) Lithium ion cells
5. AI asks: "Watt-hour rating per cell?" — Shipper enters: 45 Wh
6. AI asks: "State of charge?" — Shipper enters: 30% (standard shipping SOC)
7. AI asks: "Quantity?" — Shipper enters: 4,800 cells in 24 boxes
8. AI determines: UN3480, Class 9, Packing Group: N/A, Section II applies (>100 Wh aggregate)
9. AI generates: Special Provision 188 applies, limited quantity NOT eligible at this volume
10. AI specifies required packaging: UN-rated fiber drums with inner packing per 49 CFR 173.185
11. AI generates required marks: Class 9 lithium battery handling mark + Class 9 diamond placard
12. AI warning: "Multiple state restrictions: CA requires advance notification. NV requires permit for battery shipments >1,000 lbs"
13. Platform auto-generates state compliance checklist for route through TN, AR, OK, NM, AZ, NV
14. Shipper reviews and confirms — all documentation auto-generated
15. Load posted with cross-country logistics requirements

**Expected Outcome:** Complex Class 9 lithium battery shipment correctly classified through AI wizard with state-by-state compliance
**Platform Features Tested:** ESANG AI™ classification wizard (multi-step), lithium battery specific regulations, Section I/II determination, special provisions lookup, state-by-state compliance checker, cross-country route regulatory analysis
**Validations:** `ai_wizard_completed`, `un3480_correct`, `section_II_determined`, `sp188_applied`, `state_restrictions_flagged`, `6_state_compliance_checklist`, `documentation_complete`
**ROI for Albemarle:** AI wizard prevents lithium battery mis-classification (most common hazmat shipping violation — $50,000+ fines per occurrence). Cross-country compliance checklist would take 4+ hours to research manually.

---

### SHP-016: Nutrien Ships Fertilizer (Ammonium Nitrate) with Security Plan
**Company:** Nutrien Ltd. (US Operations — Loveland, CO)
**Season:** Spring (March — Fertilizer Season) | **Time:** 7:00 AM MST Monday
**Route:** Borger, TX → Des Moines, IA (870 miles)

**Narrative:**
Nutrien ships ammonium nitrate (UN1942, Class 5.1 Oxidizer) during peak spring fertilizer season. Ammonium nitrate requires enhanced security measures due to its dual-use potential. EusoTrip's security plan compliance features are tested.

**Steps:**
1. Shipper creates load: Ammonium nitrate fertilizer, UN1942, Class 5.1
2. ESANG AI™ flags: "SECURITY SENSITIVE MATERIAL — Enhanced security plan required per 49 CFR 172.800"
3. Platform checks Nutrien's security plan status — verified and current (expires Dec 2026)
4. AI requires: Background-checked driver, GPS tracking mandatory, no unattended vehicle
5. Additional requirement generated: Driver cannot stop in population centers >50,000 for more than 1 hour
6. Route planning: Platform calculates route avoiding major metropolitan areas where possible
7. Shipper reviews AI-optimized route: Borger → Amarillo → Dodge City → Wichita → Kansas City → Des Moines
8. Alternative shown: Through Oklahoma City (saves 40 miles but passes through metro)
9. Shipper selects security-optimized route (avoids OKC metro)
10. Load posted with security requirements — carrier must have TSA-compliant security program
11. Only carriers with verified security programs can view this load (8 carriers qualify)
12. Groendyke Transport bids and books — verified security program, background-checked drivers
13. During transit: Real-time tracking with 15-minute ping interval (standard is 30 min)
14. Any route deviation triggers immediate alert to shipper security team
15. Delivery successful — security compliance log auto-generated for DHS reporting

**Expected Outcome:** Security-sensitive material shipped with enhanced security protocol, route optimization to avoid metros, and DHS-compliant documentation
**Platform Features Tested:** Security plan verification, ESANG AI™ security requirements, background-checked driver filtering, security-optimized routing, metro avoidance, enhanced tracking intervals, route deviation alerts, DHS compliance reporting
**Validations:** `security_plan_verified`, `enhanced_requirements_set`, `metro_avoidance_route`, `tsa_carrier_filtering`, `15_min_tracking`, `deviation_alerts_active`, `dhs_report_generated`
**ROI for Nutrien:** Automated security compliance prevents DHS violations ($100,000+ fines). Security-optimized routing reduces risk exposure.

---

### SHP-017: Hexion Inc. Manages Shipper Dashboard During Peak Season
**Company:** Hexion Inc. (Columbus, OH)
**Season:** Summer (June — Construction Peak) | **Time:** 8:00 AM EST Monday
**Route Context:** N/A — Dashboard Management

**Narrative:**
Hexion's logistics team manages 85 active loads across their epoxy resin and formaldehyde product lines during peak construction season. The shipper dashboard and widget system are stress-tested with high volume.

**Steps:**
1. Logistics director logs in — dashboard loads with 8 active widgets
2. "Active Loads" widget shows: 85 in-transit, 12 pending pickup, 4 delivered awaiting POD
3. "Spending This Month" widget: $487,000 across 142 completed loads
4. "Carrier Performance" widget: Top carrier Quality Distribution at 98% on-time
5. "Marketplace Activity" widget: 6 loads with no bids after 24 hours (flagged yellow)
6. Director clicks the 6 flagged loads — all are short-haul formaldehyde (Class 9) runs under $800
7. ESANG AI™ suggestion: "Low-value loads underperforming. Consider bundling into multi-stop or increasing rate by 15%"
8. Director bundles 3 loads into 1 multi-stop, increases rate on remaining 3 by $120 each
9. Within 4 hours, all 6 loads are covered
10. "On-Time Delivery" widget shows: 94.2% this month vs. 96.1% last month — trending down
11. Director drills into late deliveries — 5 of 8 late loads were Florida-bound during tropical storm
12. Adds weather context note to monthly report
13. "Compliance Alerts" widget: 2 carriers have expiring insurance this week — platform auto-flagged
14. Director sends messages to both carriers requesting updated certificates
15. Customizes dashboard — adds "Seasonal Comparison" widget showing Q2 vs Q1 volumes

**Expected Outcome:** High-volume shipper dashboard accurately reflects 85+ active loads with actionable AI insights
**Platform Features Tested:** Dashboard widget system at scale (85+ loads), spending analytics, carrier performance tracking, marketplace stagnation detection, ESANG AI™ bundling suggestions, on-time trending, compliance alerts, dashboard customization
**Validations:** `85_loads_displayed`, `spending_accurate`, `carrier_rankings_correct`, `stagnant_loads_flagged`, `ai_suggestion_actionable`, `compliance_alerts_active`, `widget_customization_saved`
**ROI for Hexion:** AI bundling suggestion saved $1,400 in duplicate freight costs. Compliance alerts prevent shipping with uninsured carriers (potential $250,000 liability exposure).

---

### SHP-018: Brenntag Uses Messaging System to Coordinate Multi-Party Shipment
**Company:** Brenntag North America (Reading, PA)
**Season:** Fall (October) | **Time:** 11:00 AM EST Thursday
**Route:** Houston, TX → Philadelphia, PA (1,550 miles)

**Narrative:**
Brenntag is coordinating a complex shipment involving a shipper (origin), broker (Coyote Logistics), carrier (Trimac Transportation), and receiving terminal. The EusoTrip messaging system connects all parties in one thread.

**Steps:**
1. Brenntag creates load: Sulfuric acid (UN1830, Class 8), tanker, 42,000 lbs
2. Coyote Logistics (broker) books the load, assigns Trimac as carrier
3. EusoTrip auto-creates group message thread: Brenntag + Coyote + Trimac + Philadelphia terminal
4. Brenntag sends message: "Pickup ready at Houston Dock 4, driver needs hard hat and face shield"
5. Coyote responds: "Trimac driver en route, ETA 45 minutes to pickup"
6. Trimac driver sends photo from mobile app: "At gate, checking in now"
7. Message shows real-time: Driver location pin on mini-map within chat
8. Brenntag sends document in chat: Updated SDS for this batch (higher concentration than standard)
9. All parties receive and can view the SDS inline
10. During transit — driver sends update: "Stopped for fuel in Dallas, back on road in 20 min"
11. Philadelphia terminal sends message: "Dock 2 assigned for arrival, appointment confirmed for Oct 15 8:00 AM"
12. Coyote sends rate confirmation document to all parties via chat
13. Chat thread shows 47 messages over 3-day transit — complete communication record
14. Upon delivery: Terminal confirms receipt in chat with timestamp
15. Thread archived — searchable in messaging history for all parties

**Expected Outcome:** Multi-party real-time coordination through unified messaging with document sharing and location pins
**Platform Features Tested:** Auto-created group threads, multi-party messaging, in-chat document sharing, SDS inline viewing, driver location pins, message archiving, searchable history, mobile-to-web messaging
**Validations:** `group_thread_created`, `4_parties_connected`, `document_shared_inline`, `location_pin_shown`, `47_messages_tracked`, `thread_archived`, `searchable_history`
**ROI for Brenntag:** Unified thread replaces 30+ individual emails and phone calls per shipment. Complete communication record provides liability protection.

---

### SHP-019: Cabot Corporation Earns "The Haul" Gamification Achievements
**Company:** Cabot Corporation (Boston, MA)
**Season:** Year-round milestone | **Time:** 4:00 PM EST Friday
**Route Context:** N/A — Gamification

**Narrative:**
Cabot Corporation's shipping team has been on EusoTrip for 8 months and consistently uses platform features. They're about to unlock several "The Haul" achievements that drive engagement and provide competitive differentiation.

**Steps:**
1. Shipping coordinator opens "The Haul" section from dashboard
2. Current level: "Road Captain" (Level 7 of 15)
3. XP Progress: 6,800/8,000 to next level
4. Achievement unlocked: "Century Shipper" — 100 loads shipped successfully (badge appears with animation)
5. Achievement progress: "Zero Claims Streak" — 87/100 loads with no claims (87% to badge)
6. Achievement progress: "Speed Booker" — average time from post to book: 2.1 hours (need <2.0 for badge)
7. Leaderboard shows: Cabot ranked #14 among shippers in "On-Time Pickup" category
8. Coordinator clicks "View Rewards" — sees available rewards: Featured shipper badge (visible to carriers), priority marketplace placement, reduced platform fee tier
9. Redeems 5,000 XP for "Featured Shipper" badge — badge now visible on all Cabot loads
10. Carriers browsing marketplace see Cabot loads with gold "Featured" border
11. Team challenge active: "Ship 25 loads this month for team bonus XP"
12. Current progress: 19/25 — 6 more loads needed in 8 days
13. Coordinator sends team update via EusoTrip: "6 more loads to hit our challenge — let's push!"
14. Weekly digest email shows team's Haul progress, achievements, and ranking

**Expected Outcome:** Gamification drives engagement — achievements, leaderboards, rewards, and team challenges functioning
**Platform Features Tested:** The Haul gamification engine, XP tracking, achievement system, badge unlocks, leaderboards, reward redemption, featured shipper marketplace effect, team challenges, digest emails
**Validations:** `xp_tracked_accurately`, `achievement_unlocked`, `badge_animation_played`, `leaderboard_rank_correct`, `reward_redeemed`, `featured_badge_visible_marketplace`, `team_challenge_progress`, `digest_email_sent`
**ROI for Cabot:** Featured shipper badge increased carrier bid volume by 22% (more carriers bidding = more competitive rates). Team challenges increased load posting consistency by 15%.

---

### SHP-020: Covestro Runs Compliance Audit Report for DOT Inspection
**Company:** Covestro LLC (Pittsburgh, PA)
**Season:** Winter (January) | **Time:** 9:00 AM EST Tuesday
**Route Context:** N/A — Compliance & Reporting

**Narrative:**
Covestro received notice of an upcoming DOT compliance audit. They need to pull comprehensive shipping records for the past 12 months to demonstrate regulatory compliance. EusoTrip's compliance reporting tools are tested.

**Steps:**
1. Compliance manager logs in — navigates to "Compliance & Reporting" section
2. Selects "DOT Audit Preparation" report template
3. Sets date range: January 1, 2025 — December 31, 2025
4. Report generates in 45 seconds covering 487 hazmat shipments
5. Report sections auto-populated:
   - All loads listed with UN numbers, hazmat classes, and proper shipping names
   - BOL copies linked for every shipment (487 BOLs)
   - Carrier qualification verification records (every carrier's SAFER data at time of booking)
   - Emergency contact verification logs
   - PHMSA registration status at time of each shipment
   - All incident reports (3 incidents in 12 months — all resolved)
   - Training records for all shipping personnel
6. Compliance score calculated: 98.7% (6 minor documentation delays out of 487)
7. Manager reviews the 6 flagged items — 4 were late BOL uploads (within 24 hours), 2 were carrier insurance gaps (resolved same day)
8. Manager adds explanatory notes to each flagged item
9. Exports full report as PDF — 142 pages with appendices
10. Also exports as structured data (CSV) for DOT electronic submission
11. Report includes: Executive summary, detailed shipment log, incident summaries, corrective actions taken, training compliance matrix
12. Manager shares report link with legal team for review before audit
13. Legal team accesses via EusoTrip read-only share link
14. Audit preparation complete — all documentation accessible from one platform

**Expected Outcome:** Comprehensive DOT audit report generated from 12 months of platform data in under 2 minutes
**Platform Features Tested:** DOT audit report template, 12-month data aggregation, BOL linking, carrier verification records, incident report compilation, compliance scoring, PDF export, CSV export, read-only sharing, legal team access
**Validations:** `487_shipments_compiled`, `bols_linked`, `carrier_records_included`, `incident_reports_attached`, `compliance_score_calculated`, `pdf_export_142_pages`, `csv_export_complete`, `share_link_active`
**ROI for Covestro:** Audit preparation reduced from 3 weeks of manual compilation to 2 minutes. Estimated savings: $35,000 in legal/compliance staff time per audit.

---

### SHP-021: Solvay Specialty Chemicals Ships Cross-Border (US to Canada)
**Company:** Solvay Specialty Polymers (Alpharetta, GA)
**Season:** Spring (May) | **Time:** 8:30 AM EST Monday
**Route:** Augusta, GA → Mississauga, ON, Canada (930 miles, cross-border)

**Narrative:**
Solvay needs to ship hydrogen peroxide (UN2014, Class 5.1 Oxidizer) from their Georgia plant to a customer in Ontario, Canada. This tests the platform's cross-border hazmat shipping workflow including TDG (Transportation of Dangerous Goods) compliance.

**Steps:**
1. Shipper creates load — enters hydrogen peroxide, 50% concentration
2. ESANG AI™ classifies: UN2014, Class 5.1, Packing Group II
3. AI detects destination is Canada — activates dual-compliance mode
4. US side: 49 CFR compliance package generated (standard)
5. Canadian side: TDG (Transportation of Dangerous Goods Act) compliance package generated
6. AI shows differences: "Canada requires TDG shipping document format. UN number same. Classification same. Canadian ERAP (Emergency Response Assistance Plan) may be required."
7. Platform generates BOTH US BOL and Canadian TDG shipping document
8. Customs documentation auto-populated: Commercial invoice, NAFTA/CUSMA certificate
9. AI flag: "Border crossing at Buffalo/Fort Erie requires hazmat pre-notification to CBSA (Canada Border Services)"
10. Platform generates CBSA pre-notification form
11. Carrier requirements updated: Must have FAST (Free and Secure Trade) card, C-TPAT certified
12. Only 6 carriers qualify for cross-border hazmat
13. Bison Transport (Canadian carrier with US authority) bids — selected
14. During transit: GPS tracking continues across border without interruption
15. Border crossing logged: Time, inspection status, all clear
16. Delivery in Mississauga confirmed — dual-country compliance report archived

**Expected Outcome:** Cross-border hazmat shipment with dual US/Canadian regulatory compliance
**Platform Features Tested:** Dual-compliance mode (49 CFR + TDG), cross-border documentation, CBSA pre-notification, CUSMA certificate generation, cross-border carrier filtering, continuous GPS across border, border crossing logging
**Validations:** `dual_compliance_activated`, `tdg_document_generated`, `cbsa_prenotification_created`, `cusma_certificate_generated`, `cross_border_carrier_filter`, `gps_continuous_across_border`, `crossing_logged`
**Platform Gap Identified:** **GAP-001** — Platform currently does not auto-generate Mexican customs documentation (SEMARNAT permits) for US-Mexico hazmat shipments. Only US-Canada is supported.
**ROI for Solvay:** Eliminates need for separate Canadian customs broker ($250-400 per shipment). Dual-compliance documentation saves 3+ hours of manual preparation.

---

### SHP-022: Kraton Polymers Handles Rate Negotiation Through Platform
**Company:** Kraton Polymers (Houston, TX)
**Season:** Summer (August) | **Time:** 10:00 AM CST Wednesday
**Route:** Belpre, OH → Houston, TX (1,150 miles)

**Narrative:**
Kraton posted a Class 3 load at $3.50/mile but all 5 bids came in higher due to tight summer capacity. The shipper uses EusoTrip's counter-offer and negotiation features to find a fair rate.

**Steps:**
1. Load posted 24 hours ago: Styrene monomer (UN2055, Class 3), tanker, $3.50/mile = $4,025
2. 5 bids received: $4,600, $4,400, $4,350, $4,200, $4,800
3. Lowest bid is $4,200 from Groendyke Transport — 17% above posted rate
4. Shipper clicks "Counter Offer" on Groendyke bid
5. Platform opens negotiation panel — shows market data: "Average rate for this lane: $3.85/mile this week"
6. ESANG AI™ suggests: "Fair market counter: $4,050-$4,150 based on current conditions"
7. Shipper counters at $4,100
8. Groendyke receives counter-offer notification with 4-hour acceptance window
9. Groendyke counters back: $4,150 with note: "Need extra $50 for Houston tolls"
10. Platform shows negotiation thread: Original $3,500 → Bid $4,200 → Counter $4,100 → Counter $4,150
11. Shipper accepts $4,150 — saves $50 from Groendyke's original bid
12. Booking confirmed at negotiated rate
13. Negotiation history saved in load record for audit
14. Platform analytics updated: "Lane Belpre-Houston trending 18% above Q1 rates"

**Expected Outcome:** Multi-round rate negotiation completed within platform with AI market intelligence
**Platform Features Tested:** Counter-offer system, negotiation panel, market rate data, ESANG AI™ rate suggestions, acceptance windows, negotiation thread history, lane rate analytics
**Validations:** `counter_offer_sent`, `market_data_displayed`, `ai_rate_suggestion`, `multi_round_negotiation`, `acceptance_window_enforced`, `negotiation_history_saved`, `lane_analytics_updated`
**ROI for Kraton:** AI market intelligence and counter-offer tools saved $50 on this load. Across 150 loads/month, negotiation tools save an estimated $7,500/month.

---

### SHP-023: FMC Corporation Manages Document Expiration Alerts
**Company:** FMC Corporation (Philadelphia, PA)
**Season:** Winter (November) | **Time:** 8:00 AM EST Monday
**Route Context:** N/A — Document Management

**Narrative:**
FMC's compliance documents are approaching expiration. The platform's document management system sends proactive alerts and prevents shipping with expired credentials.

**Steps:**
1. Compliance officer logs in — dashboard shows red alert: "2 Documents Expiring Within 30 Days"
2. Opens document management center
3. Alert 1: PHMSA Registration — expires November 28 (21 days away)
4. Alert 2: Pollution Liability Insurance — expires December 1 (24 days away)
5. Platform already sent 60-day warning email (October 1)
6. Platform sent 30-day warning email (October 28) — now showing dashboard alert
7. Officer clicks PHMSA alert — sees renewal instructions and direct link to PHMSA portal
8. Officer uploads renewed PHMSA certificate (good through November 2027)
9. Platform verifies against PHMSA database — verified ✓
10. Alert cleared for PHMSA
11. Insurance renewal still pending — officer contacts insurer
12. Platform shows: "If insurance expires, load posting will be SUSPENDED until renewed"
13. Officer sets calendar reminder — uploads renewed insurance on November 29
14. Platform verifies new insurance policy — verified ✓
15. All documents current — compliance status returns to green
16. Monthly compliance summary email sent to VP of Logistics showing document status

**Expected Outcome:** Proactive document expiration management prevents shipping disruption
**Platform Features Tested:** Document expiration tracking, 60/30-day email alerts, dashboard alerts, PHMSA verification on renewal, insurance verification, load posting suspension trigger, compliance summary emails
**Validations:** `expiration_tracked`, `60_day_email_sent`, `30_day_email_sent`, `dashboard_alert_shown`, `phmsa_renewal_verified`, `insurance_renewal_verified`, `suspension_warning_shown`, `monthly_summary_sent`
**ROI for FMC:** Prevents PHMSA registration lapse ($10,000+ fine per violation). Prevents shipping without insurance (potential unlimited liability). Proactive alerts save compliance staff from manual calendar tracking.

---

### SHP-024: Chemours Ships Fluorochemicals via 5-Mile Local Route
**Company:** The Chemours Company (Wilmington, DE)
**Season:** Year-round | **Time:** 2:00 PM EST Thursday
**Route:** Fayetteville, NC → Local customer (5 miles)

**Narrative:**
Not all shipments are cross-country. Chemours needs to ship fluorosurfactants (Class 6.1, Toxic) just 5 miles from their plant to a local customer. This tests the platform's handling of ultra-short-haul hazmat, where minimum charges and local regulations apply.

**Steps:**
1. Shipper creates load: Fluorosurfactant solution, UN2810, Class 6.1, PG III
2. Distance calculated: 5.2 miles
3. Rate calculation: $4.00/mile = $20.80 — platform flags: "Below minimum load charge"
4. ESANG AI™ adjusts: "Minimum tanker load charge applies: $350 (covers mobilization, compliance overhead)"
5. Shipper accepts $350 minimum charge
6. Platform checks: Local Fayetteville hazmat route restrictions — no restrictions on this route
7. Load posted — only carriers within 25-mile radius notified (local match)
8. 3 local carriers see the load
9. Fayetteville Tank Lines bids $350 (minimum) — accepted
10. Pickup at 3:00 PM, delivery at 3:25 PM same day
11. Full compliance package still generated: BOL, placards, emergency info (regardless of distance)
12. POD uploaded 30 minutes after posting
13. Fastest load lifecycle on the platform: 1 hour 25 minutes from post to delivered
14. Platform logs as "local delivery" — separate analytics category
15. Monthly report shows: 12 local deliveries averaging $400 each, 100% on-time

**Expected Outcome:** Ultra-short-haul hazmat handled with minimum charges and full compliance regardless of distance
**Platform Features Tested:** Minimum load charge enforcement, local route hazmat restriction check, local carrier radius matching, full compliance on short-haul, local delivery analytics category
**Validations:** `minimum_charge_applied`, `local_route_checked`, `25_mile_radius_matching`, `full_compliance_generated`, `local_delivery_category`, `1_hour_25_min_lifecycle`
**ROI for Chemours:** Platform handles local 5-mile runs with same compliance rigor as 2,000-mile shipments. No compliance shortcuts regardless of distance. Local carrier matching fills loads that big carriers ignore.

---

### SHP-025: Ashland Global Evaluates Shipper Analytics & Seasonal Spend Report
**Company:** Ashland Global Holdings (Wilmington, DE)
**Season:** End of Q4 (December 31) | **Time:** 3:00 PM EST Wednesday
**Route Context:** N/A — Analytics & Reporting

**Narrative:**
Ashland's VP of Supply Chain pulls the annual analytics report to present to the board. EusoTrip's shipper analytics provide comprehensive operational and financial insights for executive decision-making.

**Steps:**
1. VP logs into EusoTrip — navigates to "Analytics & Reports"
2. Selects "Annual Executive Summary" report — date range: Jan 1 - Dec 31, 2025
3. Report generates covering 1,247 loads shipped in 2025
4. **Volume Analytics:** 1,247 loads | Peak month: July (142 loads) | Lowest: December (78 loads)
5. **Spend Analytics:** Total freight spend: $4,128,000 | Average cost/load: $3,310 | Average $/mile: $3.92
6. **Seasonal Breakdown:** Q1: $892K (289 loads) | Q2: $1,145K (348 loads) | Q3: $1,234K (372 loads) | Q4: $857K (238 loads)
7. **Carrier Performance:** Top 5 carriers by volume, on-time %, safety scores
8. **Rate Trends:** Q1 avg $3.65/mile → Q2 $3.85 → Q3 $4.15 (summer peak) → Q4 $3.78
9. **Compliance Scorecard:** 99.1% compliance rate (11 minor issues out of 1,247 loads)
10. **Cost Savings Estimate:** AI recommendations saved estimated $156,000 vs. manual operations
11. **Claims Report:** 4 claims filed, 3 resolved, 1 pending, total claim value: $18,400
12. VP exports as PowerPoint-formatted PDF for board presentation
13. Also exports raw data as CSV for finance team's model
14. Compares 2025 to 2024 (pre-EusoTrip): 22% cost reduction, 8% improvement in on-time delivery
15. Schedules Q1 2026 review meeting directly from platform calendar integration

**Expected Outcome:** Comprehensive annual analytics demonstrating clear ROI and operational improvement
**Platform Features Tested:** Annual executive summary report, volume/spend/seasonal analytics, carrier performance rankings, rate trend tracking, compliance scorecard, AI savings estimation, claims summary, multi-format export (PDF/CSV), year-over-year comparison, calendar integration
**Validations:** `1247_loads_compiled`, `seasonal_breakdown_accurate`, `carrier_rankings_correct`, `rate_trends_calculated`, `compliance_score_99_1`, `ai_savings_estimated`, `pdf_export_complete`, `csv_export_complete`, `yoy_comparison_shown`
**ROI for Ashland:** 22% freight cost reduction = $1,164,000 saved in first year. Board-ready analytics eliminate 40+ hours of manual report compilation. AI savings tracking provides clear platform ROI justification.

---

# ═══════════════════════════════════════════════════════════════════════════════
# END OF PART 1A — SHIPPER SCENARIOS SHP-001 through SHP-025
# ═══════════════════════════════════════════════════════════════════════════════

## PLATFORM GAPS IDENTIFIED IN THIS BATCH:
| Gap ID | Description | Severity | Affected Role |
|--------|-------------|----------|---------------|
| GAP-001 | No auto-generated Mexican customs documentation (SEMARNAT) for US-Mexico hazmat | Medium | Shipper, Broker |

## PLATFORM FEATURES COVERED (25 scenarios):
- Shipper onboarding & registration (enterprise tier)
- ESANG AI™ chemical classification (5 scenarios)
- Hazmat load creation (Classes 2.1, 2.3, 3, 5.1, 5.2, 6.1, 8, 9)
- BOL auto-generation & multi-stop BOLs
- Carrier bid management & vetting
- FMCSA/SAFER integration
- Real-time GPS tracking & telemetry
- Weather overlay & AI advisories
- Emergency 24/7 load posting
- Multi-facility onboarding
- Recurring shipment templates
- Temperature-sensitive monitoring
- Delivery rejection & incident management
- CHEMTREC integration
- Lithium battery classification wizard
- Security-sensitive material routing
- Cross-border (US-Canada) compliance
- Rate negotiation & counter-offers
- Document expiration management
- The Haul gamification
- DOT audit report generation
- Shipper messaging (multi-party)
- EusoWallet payments (net-30)
- Short-haul minimum charges
- Annual executive analytics

## SEASONS COVERED:
- Winter: SHP-001, SHP-006, SHP-020, SHP-023
- Spring: SHP-003, SHP-011, SHP-015, SHP-016, SHP-021
- Summer: SHP-004, SHP-008, SHP-009, SHP-013, SHP-017, SHP-022
- Fall: SHP-005, SHP-014, SHP-018, SHP-019
- Year-round: SHP-012, SHP-024, SHP-025
- Holiday: SHP-008 (Thanksgiving week)

## TIME-OF-DAY COVERED:
- Early morning (5-7 AM): SHP-005, SHP-009, SHP-012, SHP-016
- Morning (7-10 AM): SHP-001, SHP-002, SHP-008, SHP-010, SHP-015, SHP-017, SHP-021, SHP-022, SHP-023
- Midday (10 AM-2 PM): SHP-003, SHP-011, SHP-018
- Afternoon (2-5 PM): SHP-004, SHP-007, SHP-014, SHP-019, SHP-024, SHP-025
- Night (2 AM): SHP-009

## NEXT: Part 1B — Shipper Scenarios SHP-026 through SHP-050
