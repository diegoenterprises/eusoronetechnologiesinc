# EusoTrip API Reference

tRPC procedures called via `trpc.<router>.<procedure>`. All protected procedures require JWT auth header.

---

## loads

Core load management for trucking freight.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `create` | mutation | `{ pickupLocation, deliveryLocation, cargoType, weight, rate, distance, ... }` | Created load with loadNumber | SHIPPER, BROKER, ADMIN |
| `list` | query | `{ status?, page?, limit?, search? }` | Paginated load array with pickup/delivery info | All authenticated |
| `getById` | query | `{ loadId: number }` | Full load detail with driver, carrier, documents | All authenticated |
| `assign` | mutation | `{ loadId, driverId }` | Updated load with driver assignment | CATALYST, DISPATCH, ADMIN |
| `reassign` | mutation | `{ loadId, newDriverId, reason? }` | Updated load, notifies previous driver | CATALYST, DISPATCH, ADMIN |
| `search` | query | `{ query, status?, cargoType?, minRate?, maxRate? }` | Filtered load results | All authenticated |
| `cancel` | mutation | `{ loadId, reason }` | Cancelled load | SHIPPER, ADMIN |
| `duplicate` | mutation | `{ loadId }` | New load cloned from existing | SHIPPER, BROKER |
| `getStats` | query | none | Load counts by status, revenue totals | All authenticated |
| `book` | mutation | `{ loadId }` | Booked load | CATALYST, BROKER |

---

## loadBidding

Multi-round bidding with counter-offers and auto-accept rules.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `submit` | mutation | `{ loadId, amount, notes?, transitTime?, equipment? }` | Created bid with bidder info | CATALYST, BROKER, DRIVER |
| `accept` | mutation | `{ bidId }` | Accepted bid, load status updated to awarded | SHIPPER, ADMIN |
| `reject` | mutation | `{ bidId, reason? }` | Rejected bid | SHIPPER, ADMIN |
| `counter` | mutation | `{ bidId, counterAmount, notes? }` | Counter-offer linked to original bid | SHIPPER, CATALYST, BROKER |
| `withdraw` | mutation | `{ bidId }` | Withdrawn bid | Bid owner |
| `getByLoad` | query | `{ loadId, status? }` | All bids for load with bidder/company info | Load participants |
| `getMyBids` | query | none | All bids submitted by current user | All authenticated |
| `getReceivedBids` | query | `{ status?, page?, limit? }` | Bids received on user's loads | SHIPPER, ADMIN |
| `getBidChain` | query | `{ bidId }` | Full negotiation chain (bid + counters) | Bid participants |
| `createAutoAcceptRule` | mutation | `{ maxRate, cargoTypes[], lanes[] }` | Auto-accept rule | SHIPPER |

---

## loadLifecycle

37-state engine with role-based guards, geofence triggers, and financial timers.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `transitionState` | mutation | `{ loadId, toState, notes?, geoTag? }` | Updated load state + audit log entry | Role-dependent per transition |
| `executeTransition` | mutation | `{ loadId, transitionId, notes?, location? }` | Validated transition with compliance checks | Role-dependent |
| `getAvailableTransitions` | query | `{ loadId }` | Valid next states for current user's role | All authenticated |
| `getStateHistory` | query | `{ loadId }` | Chronological state change log with timestamps | Load participants |
| `getStateMachine` | query | none | Full state/transition definition (37 states, ~60 transitions) | All authenticated |
| `getActiveTimers` | query | `{ loadId }` | Running detention/demurrage/layover timers | Load participants |
| `waiveTimer` | mutation | `{ loadId, timerId }` | Waived financial timer | SHIPPER, ADMIN |
| `getPendingApprovals` | query | none | Loads requiring approval gate clearance | ADMIN, COMPLIANCE |
| `checkIn` | mutation | `{ loadId, location }` | Geofence check-in with auto state transition | DRIVER |

---

## wallet

EusoWallet digital payment system with Stripe Connect integration.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `getBalance` | query | none | `{ available, pending, reserved, currency }` | All authenticated |
| `getSummary` | query | none | Balance + recent transactions + payout methods | All authenticated |
| `getTransactions` | query | `{ page?, limit?, type?, dateFrom?, dateTo? }` | Paginated transaction history | All authenticated |
| `requestPayout` | mutation | `{ amount, payoutMethodId }` | Payout request, Stripe transfer initiated | All authenticated |
| `transfer` | mutation | `{ toUserId, amount, note? }` | P2P transfer between wallets | All authenticated |
| `sendMoney` | mutation | `{ recipientId, amount, note? }` | Direct money send with fee calculation | All authenticated |
| `addPayoutMethod` | mutation | `{ type, details }` | Linked bank account or card | All authenticated |
| `requestCashAdvance` | mutation | `{ amount, loadId? }` | Cash advance request (pending approval) | DRIVER, CATALYST |
| `approveCashAdvance` | mutation | `{ advanceId, approved }` | Approve/deny cash advance | ADMIN |
| `sendChatPayment` | mutation | `{ conversationId, amount, note? }` | In-chat payment request | All authenticated |
| `requestInstantPay` | mutation | `{ loadId }` | Instant payout for completed load (fee applies) | CATALYST, DRIVER |

---

## settlementBatching

3-level settlement batching: shipper payable, carrier receivable, driver payable.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `createBatch` | mutation | `{ batchType, periodStart, periodEnd, loadIds[] }` | Batch with items and totals | ADMIN, ACCOUNTING |
| `getBatches` | query | `{ status?, type?, page?, limit? }` | Paginated batch list | ADMIN, ACCOUNTING |
| `getBatchDetail` | query | `{ batchId }` | Batch with expanded settlement items | ADMIN, ACCOUNTING |
| `approveBatch` | mutation | `{ batchId }` | Approved batch, ready for payment | ADMIN |
| `processBatchPayment` | mutation | `{ batchId }` | Stripe payment processed for batch | ADMIN |
| `addToBatch` | mutation | `{ batchId, settlementId }` | Settlement added, totals recalculated | ADMIN |
| `removeFromBatch` | mutation | `{ batchId, settlementId }` | Settlement removed, totals recalculated | ADMIN |
| `getDriverBatchView` | query | none | Driver-facing payable batch summary | DRIVER |
| `autoBatch` | mutation | `{ batchType, periodStart, periodEnd }` | Auto-created batches for completed settlements | ADMIN |
| `getInvoiceForLoad` | query | `{ loadId }` | Settlement invoice for specific load | Load participants |

---

## dashboard

Role-specific dashboard statistics aggregated from live database.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `getStats` | query | none | Role-filtered stats: load counts, revenue, active drivers, fleet status, compliance scores | All authenticated |

Returns different data shape per role (SHIPPER sees shipment stats, CATALYST sees earnings, DRIVER sees trip stats, ADMIN sees platform-wide metrics).

---

## factoring

Freight factoring and quick-pay services with internal credit scoring.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `create` | mutation | `{ companyName, contactEmail, factoringType }` | New factoring account | CATALYST, BROKER |
| `update` | mutation | `{ id, status?, terms? }` | Updated factoring account | ADMIN |
| `getInvoices` | query | `{ status?, page?, limit? }` | Paginated factoring invoices | Account owner, ADMIN |
| `submitInvoice` | mutation | `{ loadId, amount, debtorName }` | Submitted invoice for factoring | CATALYST, BROKER |
| `requestCreditCheck` | mutation | `{ entityName, mcNumber?, dotNumber? }` | Credit score (300-850), rating, recommendation | All authenticated |
| `quickPay` | mutation | `{ invoiceId }` | Instant payment at factoring rate | CATALYST, BROKER |
| `getOverview` | query | none | Account summary with balances and rates | Account owner |
| `disputeInvoice` | mutation | `{ invoiceId, reason }` | Invoice dispute filed | SHIPPER |
| `getRevenueStats` | query | `{ period? }` | Revenue and fee analytics | ADMIN |

---

## railShipments

Rail freight operations with 28 procedures. Key procedures:

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `createRailShipment` | mutation | `{ originYardId, destinationYardId, carType?, commodity?, hazmatClass?, numberOfCars }` | Created shipment with shipment number | SHIPPER (rail mode) |
| `getRailShipments` | query | `{ status?, page?, limit? }` | Paginated rail shipment list | All rail users |
| `getRailShipmentDetail` | query | `{ shipmentId }` | Full detail with events, cars, waybill | All rail users |
| `updateRailShipmentStatus` | mutation | `{ shipmentId, status, notes? }` | Updated status with event logged | CARRIER, ADMIN |
| `liveTrackShipment` | query | `{ shipmentId }` | Real-time position via Vizion/Railinc integration | All rail users |
| `getRailYards` | query | `{ region?, carrierId? }` | Yard list with capacity info | All rail users |
| `getRailDashboardStats` | query | none | Rail-specific KPIs and metrics | All rail users |
| `getTariffRate` | query | `{ originYard, destYard, carType, commodity }` | Rate quote from Class I railroad APIs | All rail users |

---

## vesselShipments

Maritime/vessel operations with 30+ procedures. Key procedures:

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `createVesselBooking` | mutation | `{ originPortId, destinationPortId, cargoType?, commodity?, numberOfContainers?, hazmatClass? }` | Booking with booking number | SHIPPER (vessel mode) |
| `getVesselShipments` | query | `{ status?, page?, limit? }` | Paginated vessel shipment list | All vessel users |
| `getVesselShipmentDetail` | query | `{ shipmentId }` | Full detail with BOL, customs, containers | All vessel users |
| `updateVesselShipmentStatus` | mutation | `{ shipmentId, status, notes? }` | Updated status with event logged | CARRIER, ADMIN |
| `liveVesselPosition` | query | `{ vesselId }` | Real-time AIS position via MarineTraffic | All vessel users |
| `createBOL` | mutation | `{ shipmentId, consignee, shipper, ... }` | Bill of Lading document | SHIPPER, BROKER |
| `createCustomsEntry` | mutation | `{ shipmentId, declarationType, htsCode, ... }` | Customs declaration | SHIPPER, BROKER |
| `getContainerTracking` | query | `{ containerId }` | Container position and status history | All vessel users |
| `searchRates` | query | `{ originPort, destPort, cargoType }` | Freight rate comparison | All vessel users |

---

## spectraMatch

Crude oil identification system using parameter-based matching against 130+ global grades.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `identify` | mutation | `{ apiGravity, bsw, sulfur?, salt?, rvp?, pourPoint?, flashPoint?, viscosity?, tan? }` | Top matches with confidence scores, ERG data, safety info | All authenticated |
| `getDestinationIntelligence` | query | `{ productSpec, location? }` | Optimal refinery/terminal destinations for identified product | All authenticated |
| `identifyWithAI` | mutation | `{ ...identifyInput }` | AI-enhanced identification via ESANG Gemini | All authenticated |
| `searchCrudes` | query | `{ query }` | Search crude oil database by name/country/basin | All authenticated |
| `saveToRunTicket` | mutation | `{ matchResult, terminalId?, loadId? }` | Save identification to run ticket record | All authenticated |
| `getBlendingRecommendations` | query | `{ productIds[] }` | Blending compatibility and ratios | All authenticated |

---

## registration

User registration with FMCSA verification, per-role flows, and admin approval.

| Procedure | Type | Input | Returns | Roles |
|-----------|------|-------|---------|-------|
| `registerShipper` | mutation | `{ email, password, name, companyName, address, ... }` | Created user + company (pending approval) | Public |
| `registerCatalyst` | mutation | `{ email, password, name, dotNumber, mcNumber, insurance, ... }` | Created carrier user + FMCSA verification | Public |
| `registerDriver` | mutation | `{ email, password, name, cdlNumber, cdlState, endorsements, ... }` | Created driver user + CDL record | Public |
| `registerBroker` | mutation | `{ email, password, name, mcNumber, bondInfo, ... }` | Created broker user | Public |
| `registerEscort` | mutation | `{ email, password, name, certifications, ... }` | Created escort user | Public |
| `fmcsaPrefill` | mutation | `{ dotNumber }` | Auto-filled company data from FMCSA SAFER | Public |
| `verifyEmail` | mutation | `{ token }` | Email verification confirmed | Public |
| `getPendingRegistrations` | query | `{ page?, limit? }` | Users awaiting approval | ADMIN |
| `approveRegistration` | mutation | `{ userId }` | User activated | ADMIN |
| `rejectRegistration` | mutation | `{ userId, reason }` | User rejected with notification | ADMIN |

---

## Router Registry

All routers are merged in `server/routers.ts`. The full list includes 180+ routers. Beyond the core routers above, notable ones include:

- `dispatch` — Dispatch board and load assignment
- `compliance` — DOT/FMCSA compliance tracking
- `fleet` — Vehicle and fleet management
- `drivers` — Driver qualification files
- `hos` — Hours of Service tracking
- `inspections` — Vehicle inspection records
- `safety` — Safety incidents and CSA scores
- `gamification` — Driver rewards and missions
- `intermodal` — Cross-modal shipment coordination
- `geolocation` — Real-time GPS tracking
- `eld` — Electronic Logging Device integration
- `zeun` — Fleet maintenance AI assistant
- `hazmat` — Hazardous materials compliance
- `escorts` — Escort vehicle coordination
- `convoys` — Multi-truck convoy management
