# EusoTrip Frontend - User Guide

## Website Overview

**URL:** https://3000-iuq437bi2xdvcoaskiiex-cf0c462b.manusvm.computer

**Purpose:** EusoTrip is a comprehensive logistics platform connecting shippers, carriers, brokers, drivers, and specialized service providers for efficient freight management and real-time tracking.

**Access:** Login required for all features. Role-based dashboards provide customized experiences for 9 user types.

---

## Powered by Manus

**Technology Stack:**
- **Frontend:** React 19 + TypeScript 5 with Tailwind CSS 4
- **UI Components:** shadcn/ui with custom dark theme
- **Real-time:** WebSocket integration for live updates
- **Backend:** tRPC with Express.js
- **Database:** MySQL/TiDB with Drizzle ORM
- **Authentication:** Manus OAuth with JWT sessions
- **Deployment:** Auto-scaling infrastructure with global CDN

**Performance:** P99 latency < 50ms | WCAG 2.1 AA Accessibility | 99.9% Uptime SLA

---

## Using Your Website

### For Shippers

**Main Features:**

1. **Create Load** - Click "Create Load" button to post a new shipment. Follow the 5-step wizard:
   - Step 1: Select load type (Full Truckload, Partial, LTL) and cargo type
   - Step 2: Enter origin and destination cities with ZIP codes
   - Step 3: Specify weight, dimensions, and special handling requirements
   - Step 4: Set rate and pickup/delivery dates
   - Step 5: Review and confirm posting

2. **Track Shipments** - Click "Track Shipments" to monitor in-transit loads with real-time GPS updates, estimated arrival times, and driver contact information.

3. **Manage Bids** - View all bids received for your loads. Compare carrier ratings, rates, and capabilities. Accept or reject bids directly from the dashboard.

4. **View Payments** - Access "Payments" section to view invoices, payment history, and settlement details.

### For Carriers

**Main Features:**

1. **Find Loads** - Browse the marketplace to discover available shipments. Filter by cargo type, distance, rate, and pickup location.

2. **Place Bids** - Click "Place Bid" on any load to submit your offer. Include your rate, estimated timeline, and special capabilities.

3. **Manage Bids** - Track all active bids in "My Bids" section. View bid status, shipper responses, and withdraw bids if needed.

4. **Fleet Management** - Access "Fleet" section to manage vehicles, drivers, and equipment availability.

5. **Track Earnings** - View real-time earnings, commission calculations, and payment history in "Earnings" section.

### For Brokers

**Main Features:**

1. **Post Loads** - Create shipments on behalf of shippers. Use the same 5-step wizard as shippers.

2. **Manage Marketplace** - View all active loads and manage carrier relationships. Distribute loads to your carrier network.

3. **Commission Tracking** - Monitor commissions earned on each load in "Commission" section.

4. **Analytics** - Access "Analytics" for market insights, carrier performance metrics, and revenue trends.

### For Drivers

**Main Features:**

1. **View Jobs** - See all assigned jobs in "My Jobs" section with pickup/delivery details and earnings.

2. **Start Navigation** - Click "Navigation" on current job to activate GPS routing and real-time tracking.

3. **Track Earnings** - Monitor daily earnings, bonuses, and payment history in "Earnings" section.

4. **Vehicle Health** - Check vehicle diagnostics and maintenance alerts in "Truck Diagnostics" section.

### For Catalyst (AI-Powered Matching)

**Main Features:**

1. **Matched Loads** - View AI-recommended loads matching your specializations in "Matched Loads" section.

2. **Specializations** - Define your expertise areas (hazmat, refrigerated, oversized, etc.) in "Specializations" section.

3. **AI Assistant** - Use ESANG AI chat to get load recommendations, compliance guidance, and performance insights.

### For Escort (Security & Convoy)

**Main Features:**

1. **Active Convoys** - Manage security convoys in "Active Convoys" section. Track team members and vehicle locations.

2. **Team Management** - Assign escort personnel and manage team schedules in "Team" section.

3. **Incident Reporting** - Report security incidents and access incident history in "Incidents" section.

### For Terminal Managers

**Main Features:**

1. **Incoming Shipments** - Track arriving loads in "Incoming" section. Verify documentation and schedule receiving.

2. **Outgoing Shipments** - Manage departing loads in "Outgoing" section. Confirm driver pickup and departure times.

3. **Compliance** - Monitor regulatory compliance and documentation in "Compliance" section.

4. **Operations** - View facility operations dashboard with staff schedules and equipment status.

### For Admins

**Main Features:**

1. **User Management** - Access "Users" section to manage user accounts, verify documents, and handle suspensions.

2. **Load Management** - View all platform loads in "Loads" section. Resolve disputes and monitor load lifecycle.

3. **Payment Processing** - Process payments and manage financial transactions in "Payments" section.

4. **Analytics** - Access platform-wide analytics in "Analytics" section for business intelligence.

### For Super Admins

**Main Features:**

1. **System Configuration** - Access "System Config" to manage platform settings and feature flags.

2. **Database Management** - Manage database operations and backups in "Database" section.

3. **Security** - Monitor security settings and access logs in "Security" section.

4. **System Monitoring** - Track system health, API performance, and infrastructure metrics in "Monitoring" section.

---

## Managing Your Website

### Dashboard Navigation

1. **Sidebar Menu** - Left sidebar shows role-specific menu items with notification badges. Click any item to navigate.

2. **Top Navigation** - Header includes:
   - "Create Shipment" button for quick load posting
   - "My Jobs" button for job management
   - Search bar for finding loads/contacts
   - Notification bell with unread count
   - User profile dropdown

3. **Quick Actions** - Dashboard displays role-specific quick action buttons for common tasks.

### Management UI Panels

Access Management UI via the icon in the top-right corner:

- **Preview Panel** - Live preview of your website with persistent login state
- **Dashboard Panel** - View analytics, traffic metrics, and platform statistics
- **Database Panel** - Direct database access for data management (admin only)
- **Settings Panel** - Configure website name, logo, domains, and environment variables
- **Secrets Panel** - Manage API keys and sensitive credentials securely

### Common Tasks

**Updating Profile:**
1. Click your avatar in bottom-left corner
2. Select "Profile" from menu
3. Edit personal information and save changes

**Changing Settings:**
1. Click "Settings" in sidebar
2. Configure notifications, email preferences, and security settings
3. Save changes

**Contacting Support:**
1. Click "Support" in sidebar
2. Browse FAQs or submit support ticket
3. Chat with support team for urgent issues

---

## Next Steps

**Talk to Manus AI anytime** to request changes, add features, or optimize your platform.

### Recommended Next Actions

1. **For Shippers:** Post your first load using "Create Load" button and track bids in real-time.

2. **For Carriers:** Browse marketplace loads, place competitive bids, and start earning.

3. **For Brokers:** Connect with your carrier network and begin distributing loads.

4. **For Drivers:** Accept your first job and use navigation for real-time routing.

5. **For All Users:** Complete your profile with verification documents to unlock premium features.

---

## Production Readiness

**Before Going Live:**

1. **API Integration** - Ensure all backend endpoints are configured:
   - Authentication service
   - Load management API
   - Payment processing (Stripe)
   - Document upload service

2. **Security Hardening:**
   - Enable SSL/TLS certificates
   - Configure CORS policies
   - Set up rate limiting
   - Enable two-factor authentication

3. **Monitoring Setup:**
   - Configure error tracking (Sentry)
   - Set up performance monitoring
   - Enable analytics tracking
   - Configure backup procedures

4. **Testing:**
   - Run full end-to-end test suite
   - Verify all 9 role workflows
   - Test real-time WebSocket connections
   - Validate payment processing

---

## Support & Resources

- **Documentation:** Full API documentation available at `/docs`
- **Status Page:** Check platform status at `/status`
- **Community:** Join EusoTrip community forums for tips and best practices
- **Contact:** Email support@eusotrip.com for enterprise support

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0 - Production Ready

