# WS-DC-007: Customer Portal (Read-Only)
## Priority: P2
## Target Roles: SHIPPER, BROKER, ADMIN

## Objective
Build a secure, read-only customer portal allowing shippers and brokers to track their loads in real-time with map view and status timeline. Implement token-based authentication for easy customer onboarding. Admin interface for token management, load linking, and analytics. GPS tracking deliberately delayed 2 minutes for operational security.

## Database Schema
```sql
CREATE TABLE portal_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companyId UUID NOT NULL REFERENCES companies(id),
  issuedBy UUID NOT NULL REFERENCES users(id),
  customerName VARCHAR(255) NOT NULL,
  customerEmail VARCHAR(255),
  accessToken VARCHAR(64) UNIQUE NOT NULL,
  permissions JSON DEFAULT '{"loads": "read", "map": "read", "timeline": "read"}',
  expiresAt TIMESTAMP NOT NULL,
  lastAccessAt TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK(expiresAt > CURRENT_TIMESTAMP)
);

CREATE TABLE portal_load_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portalTokenId UUID NOT NULL REFERENCES portal_access_tokens(id) ON DELETE CASCADE,
  loadId UUID NOT NULL REFERENCES loads(id),
  linkedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(portalTokenId, loadId)
);

CREATE TABLE portal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portalTokenId UUID NOT NULL REFERENCES portal_access_tokens(id),
  action VARCHAR(100) NOT NULL,
  resourceType VARCHAR(100),
  resourceId UUID,
  accessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portal_tokens_company ON portal_access_tokens(companyId);
CREATE INDEX idx_portal_tokens_active ON portal_access_tokens(isActive, expiresAt);
CREATE INDEX idx_portal_links_token ON portal_load_links(portalTokenId);
CREATE INDEX idx_portal_links_load ON portal_load_links(loadId);
CREATE INDEX idx_portal_audit_token ON portal_audit_log(portalTokenId);
```

## Backend Router
**File Path:** `frontend/server/routers/customerPortal.ts`

**Procedures:**
- **createPortalAccess(companyId, createdBy, customerName, customerEmail, permissions?, expiresInDays?)**
  - Input: companyId, createdBy (userId), customerName, customerEmail, optional permissions, optional expiresInDays (default 365)
  - Generates unique accessToken (64-char alphanumeric)
  - Creates portal_access_tokens record
  - Output: { tokenId, accessToken, customerName, expiresAt, portalUrl }
  
- **listPortalAccess(companyId)**
  - Input: companyId
  - Output: [{ tokenId, customerName, customerEmail, isActive, expiresAt, lastAccessAt, loadCount }]
  
- **revokeAccess(companyId, tokenId)**
  - Input: companyId, tokenId
  - Sets isActive = FALSE
  - Output: { tokenId, isActive }
  
- **linkLoads(companyId, tokenId, loadIds[])**
  - Input: companyId, tokenId, array of loadIds
  - Bulk create portal_load_links
  - Output: { linkedCount, failures: [] }
  
- **autoLinkByAllocation(companyId, tokenId, allocationContractId)**
  - Input: companyId, tokenId, allocationContractId
  - Finds all loads in this allocation contract
  - Links all matching loads to token
  - Output: { linkedCount }
  
- **portalGetLoads(accessToken)**
  - Input: accessToken (from query param, PUBLIC auth)
  - Validates token, checks expiry, checks isActive
  - Returns loads linked to this token with status
  - Output: [{ loadId, loadNumber, pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType, status, estimatedDelivery, lastUpdate }]
  
- **portalGetLoadDetail(accessToken, loadId)**
  - Input: accessToken, loadId (PUBLIC auth)
  - Validates token and load link
  - Returns full load details with timeline events (no rate/settlement info)
  - Output: { loadId, pickupLocation, deliveryLocation, pickupDate, deliveryDate, cargoType, currentStatus, driverName, vehicleId, timeline: [{ timestamp, event, status, location }] }
  
- **portalGetMap(accessToken)**
  - Input: accessToken (PUBLIC auth)
  - Returns GPS locations for all linked loads
  - GPS data DELAYED 2 MINUTES (query recent GPS with 2-min offset)
  - Output: [{ loadId, latitude, longitude, heading, speed, lastUpdate, status }]
  
- **validatePortalToken(accessToken)**
  - Input: accessToken
  - Internal middleware for token validation
  - Checks: token exists, isActive=true, expiresAt > now
  - Updates lastAccessAt on successful validation
  - Logs access to portal_audit_log
  - Output: { valid, tokenId, permissions } or { valid: false, error }

## Frontend Components

### CustomerPortal.tsx (Public, /portal?token=XXX)
**Layout:**
- Header: "Load Tracking Portal" with company branding
- Three-tab interface: Loads / Map / Settings

**Tab 1: Loads**
- Table view: Load #, Pickup, Delivery, Cargo Type, Status Badge, Est. Delivery
- Status badges: SCHEDULED (blue), PICKED_UP (yellow), IN_TRANSIT (orange), DELIVERED (green), DELAYED (red)
- Click row to expand detail view showing:
  - Full pickup/delivery locations with addresses
  - Timeline of events (Pickup confirmed, En route, Delivery in progress, Delivered)
  - Estimated vs actual timing
  - Driver name and vehicle info
  - Special instructions (if any)
  
- Mobile responsive: cards instead of table

**Tab 2: Map**
- Map showing current locations of all loads
- Load markers with color coding by status
- Click marker to show load info card
- GPS updated every 30 seconds (but always 2 min delayed)
- Mobile responsive

**Tab 3: Settings**
- Display notification preferences (read-only message: "Contact support to modify")
- Show token expiry date
- Export load data button (CSV)

### PortalManagement.tsx (Admin, /admin/portal)
**Layout:**
- Two sections: Token Management / Analytics

**Section 1: Token Management**
- Table: Customer Name, Email, Created Date, Expires, Last Access, Load Count, Actions
- "Create New Token" button → modal with customerName, customerEmail, expiresInDays, permissions
- Row actions:
  - View linked loads (expandable list)
  - Link/unlink loads (modal with load search)
  - Auto-link by allocation (dropdown)
  - Revoke token (confirmation dialog)
  - Extend expiry (date picker)
  
- Bulk actions: export tokens, revoke multiple

**Section 2: Analytics**
- Metrics cards: Total active tokens, Total linked loads, Portal views (last 7 days)
- Chart: Portal access trend (line chart over 30 days)
- Audit log table: Token access history (sortable by date)
- Filter by customer name, date range

## Validation Rules
- **Token validation middleware:** Runs on all portal endpoints
  - Must exist in database
  - isActive = true
  - expiresAt > current time
  - Return 401 if invalid
  
- **Load access control:** Portal can only see loads in portal_load_links for their token
- **No financial data:** Never expose rates, settlements, margins in portal view
- **GPS delay enforcement:** Query GPS with timestamp offset of -2 minutes
- **Rate limiting:** 10 API calls per minute per token (return 429 if exceeded)
- **Expiry auto-management:** Tokens expire based on expiresAt date
- **Permission enforcement:** Check permissions JSON against requested action

## Integration Points
- Existing tables: loads, gps_tracking, allocation_contracts, companies, users
- Register procedures in `frontend/server/routers.ts`
- Separate auth middleware: `validatePortalToken` (not user-based auth)
- Public route: `/portal?token={accessToken}` (no login required)
- Admin route: `/admin/portal` (requires ADMIN or CATALYST role)
- Subscribe to load status changes to update portal in real-time
- Auto-link by allocation contract when token created with allocationContractId
- Fire audit log entry on each portal API call
- Use WebSocket for real-time updates if loads count < 50

## Testing Checklist
- [ ] Admin creates portal token with valid customer info
- [ ] Token generation creates unique 64-char accessToken
- [ ] Portal URL with token displays load list
- [ ] Load list shows only linked loads
- [ ] Click load row to expand detail view with timeline
- [ ] Map shows current load positions
- [ ] Verify GPS positions are 2 minutes delayed (check timestamps)
- [ ] Status badges change color based on load status
- [ ] Public access without login works with valid token
- [ ] Public access returns 401 with invalid token
- [ ] Public access returns 401 with expired token
- [ ] Rate limiting kicks in at 10 requests per minute
- [ ] Admin can revoke token and access denied after
- [ ] Admin can link/unlink loads to token
- [ ] Auto-link by allocation links all matching loads
- [ ] Audit log records all portal API access
- [ ] Export load data generates CSV
- [ ] Mobile responsive on small screens
- [ ] No rates, settlements, financial data exposed in portal
- [ ] Token last access updates on each API call
- [ ] WebSocket real-time updates work (if applicable)
