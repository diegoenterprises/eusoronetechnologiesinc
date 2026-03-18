# Windsurf E2E Instructions Index

This directory contains 7 self-contained build instruction files ready to paste into Windsurf for development. Each file follows the standard format with database schema, backend router specifications, frontend component layouts, validation rules, integration points, and testing checklists.

## Files Overview

### 1. WS-DC-001: Dispatch Planner (Drag-and-Drop)
**Priority:** P0 | **File:** WS-DC-001-DispatchPlanner.md
- Real-time drag-and-drop load assignment to driver timelines
- HOS, hazmat, equipment, and proximity validation
- WebSocket real-time updates
- Gamification events on assignment
- Lines: 116

### 2. WS-DC-002: Allocation Tracker (Barrels/Day)
**Priority:** P0 | **File:** WS-DC-002-AllocationTracker.md
- Daily allocation contract fulfillment tracking
- Nominated vs loaded vs delivered volume metrics
- Terminal-specific views and 7-day trends
- Bulk load creation from allocations
- Auto-status calculation (behind/on-track/ahead)
- Lines: 136

### 3. WS-DC-003: 3-Level Settlement Batching
**Priority:** P0 | **File:** WS-DC-003-SettlementBatching.md
- Multi-level batching: shipper payable, carrier receivable, driver payable
- Batch approval workflow with Stripe payment integration
- FSC, accessorials, and deductions auto-calculation
- Dispute integration and double-batch prevention
- Driver earnings view
- Lines: 160

### 4. WS-DC-004: Pricebook (Rate Sheets)
**Priority:** P1 | **File:** WS-DC-004-Pricebook.md
- Flexible rate sheet system (per-mile, flat, per-barrel, per-gallon, per-ton)
- Cascading lookup priority (terminal > city > state, customer-specific > general)
- Rate history tracking with trend analysis
- CSV import/export functionality
- Auto-fill rates on load creation
- Lines: 140

### 5. WS-DC-005: FSC Engine (Per-Contract Fuel Surcharge)
**Priority:** P1 | **File:** WS-DC-005-FSCEngine.md
- Fuel surcharge calculation engine
- Multiple methodologies: CPM, percentage, table-based
- PADD regional pricing integration with EIA API
- Weekly auto-update of PADD prices
- Schedule preview calculator
- Auto-apply FSC to settlements and contracts
- Lines: 155

### 6. WS-DC-006: Bulk Load Import (CSV)
**Priority:** P1 | **File:** WS-DC-006-BulkLoadImport.md
- 4-step CSV import flow: upload, validate, confirm, results
- Multi-row validation with inline error correction
- Auto-population from product profiles
- Allocation contract linking (auto-match by origin + product)
- Pricebook rate lookup auto-fill
- Error report download and import history tracking
- Lines: 195

### 7. WS-DC-007: Customer Portal (Read-Only)
**Priority:** P2 | **File:** WS-DC-007-CustomerPortal.md
- Secure token-based customer portal (no user login required)
- Load tracking with status timeline and map view
- GPS deliberately delayed 2 minutes for security
- Admin token management and analytics dashboard
- Auto-link by allocation contract
- Rate limiting and audit logging
- Mobile responsive interface
- Lines: 205

## Total Lines of Documentation: 1,107

## Usage Instructions

1. Open each `.md` file in your preferred editor
2. Copy the entire content for the feature you want to build
3. Paste into Windsurf with `/build` or your preferred build command
4. Windsurf will parse the structured format and generate implementation plans

## File Structure in Each Document

Each file includes these standardized sections:
- **WS-DC-XXX: [Title]** - File identifier and feature name
- **Priority:** - P0, P1, or P2
- **Target Roles:** - Which user roles interact with this feature
- **Objective** - Feature description and key goals
- **Database Schema** - Complete SQL CREATE TABLE statements with indices
- **Backend Router** - File path and all procedures with input/output specs
- **Frontend Component** - Component path and detailed layout description
- **Validation Rules** - All business logic constraints
- **Integration Points** - How it connects to existing systems
- **Testing Checklist** - Verification points (checkbox format)

## Additional Notes

- All files are in Markdown (.md) format
- Database schemas use PostgreSQL syntax with UUID primary keys
- Router procedures specify input/output contracts clearly
- Frontend components show responsive design considerations
- Validation rules are explicit and testable
- Integration points reference existing tables and systems
- Testing checklists contain 10-20 discrete verification steps each

## Directory Location

All files are located in:
```
/sessions/keen-sharp-cray/mnt/COWORK TEAMS/windsurf_instructions_e2e/
```
