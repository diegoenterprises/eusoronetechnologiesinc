# EusoTrip Comprehensive Build Plan
## Cross-Referenced from User Journeys & To-Do Audit

**Generated:** January 23, 2026  
**Audit Results:** 206 items completed, 1191 items pending  
**Widgets:** 48 widgets connected to tRPC (100%)

---

# WHAT'S COMPLETED ✅

## Infrastructure & Foundation
- [x] React 19 + TypeScript + Vite setup
- [x] tRPC backend with 62+ procedures
- [x] 48 dynamic dashboard widgets with real-time data
- [x] 10 role-based dashboards (SHIPPER, CARRIER, BROKER, DRIVER, CATALYST, ESCORT, TERMINAL_MANAGER, COMPLIANCE_OFFICER, SAFETY_MANAGER, ADMIN)
- [x] Responsive widget system with drag-and-drop
- [x] Test login system for all 10 roles
- [x] ESANG AI integration (Gemini API)
- [x] JWT authentication system
- [x] Menu configuration for all roles

## Pages Created (50+ pages)
- [x] Dashboard router with role switching
- [x] Home, Profile, Settings
- [x] Shipments, MyLoads, FindLoads, ActiveLoads
- [x] Carriers, Drivers, Fleet
- [x] Messages, Channels, CompanyChannels
- [x] Documents, Payments, Earnings, Commission
- [x] Companies, Facility, Analytics
- [x] Diagnostics, Support, NewsFeed
- [x] Zeun Mechanics pages (Breakdown, Maintenance, Provider)
- [x] ERG 2024 lookup

---

# PRIORITY BUILD LIST (From User Journeys)

## PHASE 1: USER REGISTRATION & ONBOARDING (Critical)
Based on: `EUSOTRIP_USER_REGISTRATION_ONBOARDING.md`

### 1.1 Registration Flow Pages
- [ ] `/register` - Role selection landing page
- [ ] `/register/shipper` - SHIPPER registration wizard
- [ ] `/register/carrier` - CARRIER registration wizard  
- [ ] `/register/broker` - BROKER registration wizard
- [ ] `/register/driver` - DRIVER registration wizard
- [ ] `/register/catalyst` - CATALYST registration wizard
- [ ] `/register/escort` - ESCORT registration wizard
- [ ] `/register/terminal` - TERMINAL_MANAGER registration wizard
- [ ] `/register/compliance` - COMPLIANCE_OFFICER registration wizard
- [ ] `/register/safety` - SAFETY_MANAGER registration wizard

### 1.2 Registration Components
- [ ] Multi-step form wizard component
- [ ] Document upload component (with preview)
- [ ] Identity verification component
- [ ] FMCSA SAFER lookup integration
- [ ] PHMSA verification integration
- [ ] Insurance certificate upload & validation
- [ ] CDL verification component
- [ ] Background check consent form
- [ ] Terms & conditions acceptance

### 1.3 Backend Registration APIs
- [ ] `auth.registerShipper` - SHIPPER registration procedure
- [ ] `auth.registerCarrier` - CARRIER registration procedure
- [ ] `auth.registerBroker` - BROKER registration procedure
- [ ] `auth.registerDriver` - DRIVER registration procedure
- [ ] `auth.verifyDocument` - Document verification procedure
- [ ] `auth.lookupFMCSA` - FMCSA SAFER lookup
- [ ] `auth.lookupPHMSA` - PHMSA verification
- [ ] `auth.sendVerificationEmail` - Email verification

### 1.4 Database Schema Extensions
- [ ] `user_documents` table - Store uploaded documents
- [ ] `user_verifications` table - Track verification status
- [ ] `company_insurance` table - Insurance certificates
- [ ] `driver_qualifications` table - DQ file (49 CFR 391.51)
- [ ] `user_certifications` table - Training certifications

---

## PHASE 2: LOAD CREATION WIZARD (Shipper Journey)
Based on: `01_SHIPPER_USER_JOURNEY.md`

### 2.1 7-Step Load Creation Wizard
- [ ] Step 1: Hazmat Classification
  - [ ] Proper Shipping Name input
  - [ ] UN/NA Number lookup
  - [ ] Hazard Class dropdown (Classes 2-9)
  - [ ] Packing Group selection (I, II, III)
  - [ ] ESANG AI™ auto-classification
  
- [ ] Step 2: Quantity & Packaging
  - [ ] Quantity input with units
  - [ ] Gross/Net Weight
  - [ ] Container Type (MC-306, MC-307, MC-312, MC-331)
  - [ ] Bulk/Residue/Limited Quantity flags
  - [ ] Cargo Value for insurance

- [ ] Step 3: Origin & Destination
  - [ ] Origin facility/terminal/address selection
  - [ ] Pickup window (datetime range)
  - [ ] Loading requirements (TWIC, pump-off)
  - [ ] Destination address with consignee
  - [ ] Delivery window
  - [ ] Route preview with hazmat-compliant routing

- [ ] Step 4: Equipment & Requirements
  - [ ] Vehicle type selection
  - [ ] Tank specifications
  - [ ] Required endorsements (H, N, X)
  - [ ] Temperature requirements
  - [ ] Escort requirements
  - [ ] Special equipment needs

- [ ] Step 5: Carrier Requirements
  - [ ] Minimum insurance coverage
  - [ ] Safety rating requirements
  - [ ] Hazmat authorization verification
  - [ ] Preferred carriers list
  - [ ] Blocked carriers list

- [ ] Step 6: Pricing & Bidding Strategy
  - [ ] Book Now (fixed price)
  - [ ] Accept First (minimum bid)
  - [ ] Auction (competitive bidding)
  - [ ] Contract Tender
  - [ ] AI-suggested spot rate
  - [ ] Accessorial rates

- [ ] Step 7: Review & Post
  - [ ] Complete load summary
  - [ ] Compliance checklist
  - [ ] Terms acceptance
  - [ ] Post to marketplace

### 2.2 Backend Load APIs
- [ ] `loads.create` - Create load with all details
- [ ] `loads.draft` - Save load as draft
- [ ] `loads.validateHazmat` - Validate hazmat classification
- [ ] `loads.calculateRate` - AI rate suggestion
- [ ] `loads.getRoutePreview` - Hazmat-compliant routing

---

## PHASE 3: BIDDING & CARRIER SELECTION
Based on: `01_SHIPPER_USER_JOURNEY.md` & `02_CARRIER_USER_JOURNEY.md`

### 3.1 Bid Management Pages
- [ ] `/loads/:id/bids` - View bids on a load
- [ ] `/marketplace` - Enhanced load marketplace with filters
- [ ] `/bids` - Carrier's active bids
- [ ] `/bids/:id` - Bid detail page

### 3.2 Bidding Components
- [ ] Bid submission form
- [ ] Profitability analysis widget
- [ ] Counter-offer dialog
- [ ] Carrier qualification checklist (auto-verified)
- [ ] Driver/Equipment assignment dropdown
- [ ] Rate confirmation generator

### 3.3 Backend Bidding APIs
- [ ] `bids.submit` - Submit bid with driver/equipment
- [ ] `bids.counter` - Counter-offer flow
- [ ] `bids.accept` - Award load to carrier
- [ ] `bids.reject` - Reject bid
- [ ] `bids.calculateProfitability` - Deadhead + fuel analysis
- [ ] `bids.verifyCarrierQualification` - Check carrier meets requirements

---

## PHASE 4: REAL-TIME TRACKING & HOS
Based on: `02_CARRIER_USER_JOURNEY.md` & `04_DRIVER_USER_JOURNEY.md`

### 4.1 Tracking Components
- [ ] Real-time GPS map component (30-second updates)
- [ ] ETA calculation with traffic/weather
- [ ] Geofence alerts component
- [ ] Route deviation alerts
- [ ] HOS status display component
- [ ] Driver status timeline

### 4.2 Load Status Management
- [ ] Status progression UI:
  ```
  POSTED → BIDDING → AWARDED → CONFIRMED → ASSIGNED → DISPATCHED
  → AT_PICKUP → LOADING → LOADED → IN_TRANSIT 
  → AT_DELIVERY → UNLOADING → DELIVERED → COMPLETED → CLOSED
  ```
- [ ] Status update buttons for driver
- [ ] Exception reporting (breakdown, delay, incident)

### 4.3 HOS/ELD Integration
- [ ] HOS dashboard widget (already exists, enhance)
- [ ] Available driving hours display
- [ ] Break requirement alerts
- [ ] 60/70 hour cycle tracking
- [ ] Predicted availability calculator

### 4.4 Backend Tracking APIs
- [ ] `tracking.updateLocation` - GPS update endpoint
- [ ] `tracking.getLoadLocation` - Get current location
- [ ] `tracking.calculateETA` - ETA with traffic
- [ ] `tracking.updateStatus` - Load status progression
- [ ] `tracking.reportException` - Exception handling
- [ ] `hos.getDriverStatus` - Current HOS status
- [ ] `hos.predictAvailability` - HOS predictions

---

## PHASE 5: DOCUMENT MANAGEMENT & COMPLIANCE
Based on: `08_COMPLIANCE_OFFICER_USER_JOURNEY.md`

### 5.1 Document Management Pages
- [ ] `/documents/upload` - Document upload page
- [ ] `/documents/expiring` - Expiring documents dashboard
- [ ] `/compliance/dq-files` - Driver Qualification Files (49 CFR 391.51)
- [ ] `/compliance/vehicle-inspections` - Vehicle inspection records
- [ ] `/compliance/training` - Training records management

### 5.2 Document Components
- [ ] Document upload with OCR extraction
- [ ] Document expiration tracker
- [ ] Compliance score calculator
- [ ] Audit checklist component
- [ ] Document viewer/preview

### 5.3 Compliance Tracking
- [ ] DQ File management per 49 CFR 391.51:
  - [ ] Employment application
  - [ ] MVR (annual)
  - [ ] Medical certificate
  - [ ] CDL copy
  - [ ] Road test certificate
  - [ ] Drug test results
  - [ ] Hazmat training certificates
  - [ ] TWIC card status
  
### 5.4 Backend Compliance APIs
- [ ] `compliance.uploadDocument` - Upload and categorize
- [ ] `compliance.getExpirations` - Upcoming expirations
- [ ] `compliance.getComplianceScore` - Calculate score
- [ ] `compliance.getDQFile` - Get driver DQ file
- [ ] `compliance.runAudit` - Audit preparation

---

## PHASE 6: FINANCIAL & PAYMENT PROCESSING
Based on: All user journeys + Stripe integration

### 6.1 Payment Pages
- [ ] `/payments/invoices` - Invoice management
- [ ] `/payments/process` - Process payments
- [ ] `/wallet` - Enhanced EusoWallet (already exists, enhance)
- [ ] `/payments/factoring` - Factoring options

### 6.2 Payment Components
- [ ] Invoice generation component
- [ ] Payment method selector (ACH, Card, Wire)
- [ ] Quick Pay/Instant Pay options
- [ ] Factoring integration
- [ ] Payment status tracker

### 6.3 Backend Payment APIs
- [ ] `payments.createInvoice` - Auto-generate invoice
- [ ] `payments.processPayment` - Process via Stripe
- [ ] `payments.setupQuickPay` - Quick pay enrollment
- [ ] `payments.getPaymentHistory` - Payment history
- [ ] `stripe.createPaymentIntent` - Stripe integration
- [ ] `stripe.createTransfer` - Carrier payouts

---

## PHASE 7: MESSAGING & COMMUNICATION
Based on: `eusotrip-messaging-docs.md`

### 7.1 Enhanced Messaging
- [ ] 10 message types support:
  - [ ] Text, Image, Document, Location
  - [ ] Payment request, Job update
  - [ ] Voice message, Video
  - [ ] Contract, System notification
  
- [ ] 6 conversation types:
  - [ ] Direct, Group, Job-specific
  - [ ] Channel, Company, Support

### 7.2 Real-time Features
- [ ] WebSocket message delivery
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Offline message queuing
- [ ] Push notifications

### 7.3 Backend Messaging APIs
- [ ] `messages.send` - Send message
- [ ] `messages.getConversation` - Get conversation
- [ ] `messages.markRead` - Mark as read
- [ ] `messages.uploadAttachment` - File upload
- [ ] WebSocket handlers for real-time

---

## PHASE 8: TERMINAL MANAGER FEATURES
Based on: `07_TERMINAL_MANAGER_USER_JOURNEY.md`

### 8.1 Terminal Management Pages
- [ ] `/terminal/appointments` - Appointment scheduling grid
- [ ] `/terminal/yard` - Yard management dashboard
- [ ] `/terminal/inventory` - Tank inventory levels
- [ ] `/terminal/racks` - Rack status (SCADA integration)

### 8.2 Terminal Components
- [ ] Appointment calendar by rack
- [ ] Yard map with spot status
- [ ] Tank level gauges
- [ ] Loading/unloading status board
- [ ] Gate activity monitor

### 8.3 Backend Terminal APIs
- [ ] `terminal.scheduleAppointment` - Schedule dock time
- [ ] `terminal.getYardStatus` - Yard occupancy
- [ ] `terminal.getInventory` - Tank levels
- [ ] `terminal.checkInTruck` - Gate check-in
- [ ] `terminal.checkOutTruck` - Gate check-out

---

## PHASE 9: ESCORT/PILOT VEHICLE FEATURES
Based on: `06_ESCORT_USER_JOURNEY.md`

### 9.1 Escort Management Pages
- [ ] `/escort/jobs` - Job marketplace
- [ ] `/escort/certifications` - State certifications tracker
- [ ] `/escort/active` - Active escort assignments
- [ ] `/escort/routes` - Route clearance checker

### 9.2 Escort Components
- [ ] Job marketplace with filters
- [ ] State certification matrix
- [ ] Lead/Chase position assignment
- [ ] Route clearance alerts (height/width)
- [ ] Emergency protocols display

### 9.3 Backend Escort APIs
- [ ] `escort.getAvailableJobs` - Job marketplace
- [ ] `escort.acceptJob` - Accept escort job
- [ ] `escort.getCertifications` - State certifications
- [ ] `escort.checkClearances` - Route clearances

---

## PHASE 10: SAFETY MANAGER FEATURES
Based on: `09_SAFETY_MANAGER_USER_JOURNEY.md`

### 10.1 Safety Management Pages
- [ ] `/safety/dashboard` - Safety overview
- [ ] `/safety/incidents` - Incident tracker
- [ ] `/safety/csa-scores` - CSA BASIC scores
- [ ] `/safety/training` - Training management
- [ ] `/safety/investigations` - Accident investigations

### 10.2 Safety Components
- [ ] CSA BASIC scores visualization (7 categories)
- [ ] Driver safety scorecard
- [ ] Incident reporting form
- [ ] Investigation workflow
- [ ] Corrective action tracker

### 10.3 Backend Safety APIs
- [ ] `safety.reportIncident` - Report incident
- [ ] `safety.getCSAScores` - CSA BASIC scores
- [ ] `safety.getDriverScorecard` - Driver safety score
- [ ] `safety.createInvestigation` - Start investigation
- [ ] `safety.trackCorrectiveAction` - Track actions

---

# IMPLEMENTATION PRIORITY

## Week 1-2: Registration & Authentication
1. Registration wizard component
2. All 10 role registration flows
3. Document upload & verification
4. FMCSA/PHMSA lookups

## Week 3-4: Load Management
1. 7-step load creation wizard
2. Load marketplace enhancement
3. Bidding system
4. Rate confirmation generation

## Week 5-6: Tracking & Status
1. Real-time GPS tracking
2. Status progression system
3. Exception handling
4. HOS integration enhancement

## Week 7-8: Compliance & Payments
1. Document management
2. Compliance scoring
3. Stripe payment integration
4. Invoice automation

## Week 9-10: Role-Specific Features
1. Terminal manager features
2. Escort/Pilot features
3. Safety manager features
4. Enhanced messaging

---

# TECHNICAL DEBT TO ADDRESS

- [ ] Remove duplicate page files (*.2.tsx files)
- [ ] Add unit tests (target 80% coverage)
- [ ] E2E tests for critical flows
- [ ] Performance optimization
- [ ] Mobile responsiveness audit
- [ ] WCAG 2.1 AA compliance audit
- [ ] Security hardening
- [ ] Error monitoring (Sentry)
- [ ] Analytics integration

---

*This document should be updated as features are completed.*
