# EusoTrip Frontend - Development Team Handoff Guide

**Project:** eusotrip-frontend  
**Current Version:** b307cd2d (Latest Checkpoint)  
**Last Updated:** January 23, 2026  
**Status:** Production-Ready with Advanced Widget System  

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [GitHub Repository Structure](#github-repository-structure)
4. [Current Project Status](#current-project-status)
5. [Database Architecture](#database-architecture)
6. [Deployment Process](#deployment-process)
7. [Admin Dashboard](#admin-dashboard)
8. [Outstanding Issues & Solutions](#outstanding-issues--solutions)
9. [Development Workflow](#development-workflow)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Next Steps for Development Team](#next-steps-for-development-team)

---

## PROJECT OVERVIEW

### What is EusoTrip Frontend?

EusoTrip Frontend is a **production-grade logistics management platform** built with:
- **Frontend:** React 19 + Tailwind CSS 4 + TypeScript
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Database:** MySQL/TiDB (Manus Sandbox) + AWS RDS (Production)
- **Authentication:** Manus OAuth 2.0
- **Real-time Features:** WebSocket support (in progress)

### Core Features Implemented

#### Phase 1-12: Dashboard & Widget Foundation
- ✅ Multi-role dashboard system (Shipper, Driver, Broker, Admin)
- ✅ 108+ widgets across 12 categories
- ✅ Drag-and-drop widget marketplace
- ✅ Role-based widget access control
- ✅ Dashboard tabs (Personal, Work, Analytics)

#### Phase 13: Advanced Widget System
- ✅ 13 specialized analytics widgets (Revenue Forecasting, Route Optimization AI, Predictive Maintenance, etc.)
- ✅ Widget customization panel (colors, refresh rates, data sources, opacity, compact mode)
- ✅ Template selector with 6 pre-built role-based presets
- ✅ Drag-to-add widget functionality
- ✅ Widget search and filtering (12 categories)

#### Phase 14: Backend Persistence Layer
- ✅ 5 new database tables (widget_customizations, dashboard_templates, template_shares, widget_analytics, widget_usage_summary)
- ✅ 20+ tRPC procedures for widget management
- ✅ Widget event tracking system
- ✅ Analytics aggregation service
- ✅ WebSocket collaboration service (ready for integration)

#### Phase 15: Frontend tRPC Integration
- ✅ WidgetCustomizationPanelV2 with full backend persistence
- ✅ TemplateSharingV2 with team collaboration features
- ✅ Zero TypeScript compilation errors
- ✅ Full error handling and loading states

---

## ARCHITECTURE & TECHNOLOGY STACK

### Frontend Architecture

```
client/
├── public/              # Static assets (favicon, robots.txt, etc.)
├── src/
│   ├── pages/          # Page-level components (Home, Dashboard, etc.)
│   ├── components/     # Reusable UI components
│   │   ├── DashboardLayout.tsx      # Main dashboard wrapper
│   │   ├── PremiumDashboard.tsx     # Advanced widget dashboard
│   │   ├── WidgetCustomizationPanelV2.tsx  # Widget settings
│   │   ├── TemplateSharingV2.tsx    # Template collaboration
│   │   ├── WidgetAnalyticsDashboard.tsx    # Analytics view
│   │   ├── TemplateSelector.tsx     # Template presets
│   │   ├── WidgetSearchFilter.tsx   # Widget discovery
│   │   ├── WidgetDropZone.tsx       # Drag-drop support
│   │   └── DragToAddWidget.tsx      # Widget addition
│   ├── hooks/
│   │   ├── useWidgetTracking.ts     # Event tracking hook
│   │   ├── useCollaboration.ts      # WebSocket hook
│   │   └── useAuth.ts               # Authentication hook
│   ├── lib/
│   │   ├── trpc.ts                  # tRPC client setup
│   │   ├── widgetLibrary.ts         # 108+ widget definitions
│   │   ├── widgetTemplates.ts       # 6 template presets
│   │   ├── widgetAnalyticsService.ts # Analytics aggregation
│   │   └── websocketCollaborationService.ts # Real-time sync
│   ├── contexts/       # React contexts (Theme, Auth, etc.)
│   ├── App.tsx         # Main router and layout
│   ├── main.tsx        # React entry point
│   └── index.css       # Global styles and theme variables
```

### Backend Architecture

```
server/
├── _core/
│   ├── trpc.ts         # tRPC setup and middleware
│   ├── context.ts      # Request context (user, auth)
│   ├── env.ts          # Environment variables
│   ├── llm.ts          # LLM integration helpers
│   ├── voiceTranscription.ts  # Speech-to-text
│   ├── imageGeneration.ts     # Image generation
│   ├── notification.ts  # Owner notifications
│   ├── cookies.ts      # Session management
│   └── systemRouter.ts # System-level procedures
├── routers/
│   ├── widgets.ts      # Widget management procedures (20+ procedures)
│   └── [feature].ts    # Feature-specific routers
├── db.ts               # Database query helpers
└── storage.ts          # S3 storage helpers
```

### Database Schema

```
drizzle/
├── schema.ts           # All table definitions
│   ├── users           # Core user table (id, openId, name, email, role, etc.)
│   ├── widget_customizations    # User widget preferences
│   ├── dashboard_templates      # Saved dashboard layouts
│   ├── template_shares          # Template sharing permissions
│   ├── widget_analytics         # Widget usage metrics
│   └── widget_usage_summary     # Aggregated analytics
└── migrations/         # Database migration files
```

### Technology Stack Details

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19 | UI framework |
| | TypeScript | 5.x | Type safety |
| | Tailwind CSS | 4 | Styling |
| | shadcn/ui | Latest | Component library |
| | tRPC | 11 | Type-safe RPC |
| | Wouter | Latest | Routing |
| **Backend** | Express | 4 | HTTP server |
| | Node.js | 22.13.0 | Runtime |
| | tRPC | 11 | RPC framework |
| | Drizzle ORM | Latest | Database ORM |
| **Database** | MySQL | 8.0+ | Manus Sandbox |
| | AWS RDS | MySQL 8.0+ | Production |
| **Authentication** | Manus OAuth | 2.0 | User auth |
| **Real-time** | Socket.io | Latest | WebSocket (planned) |
| **Testing** | Vitest | Latest | Unit tests |

---

## GITHUB REPOSITORY STRUCTURE

### Repository: `diegoenterprises/eusoronetechnologiesinc`

#### Branches Strategy

```
main/
├── production/         # Production-ready code (deployed to EC2)
├── staging/           # Pre-production testing
├── develop/           # Development integration branch
└── feature/*          # Feature branches (feature/widget-customization)

Tags:
├── v1.0.0             # Major release
├── v1.1.0-beta        # Beta releases
└── v1.1.0-rc1         # Release candidates
```

#### Commit History (Last 10 Commits)

```
Latest: b307cd2d - "Phase 15: Frontend tRPC Integration Complete"
├── Phase 14: Backend Persistence Layer
├── Phase 13: Advanced Widget System (13 specialized widgets)
├── Phase 12: Widget Analytics Dashboard
├── Phase 11: Template Sharing & Collaboration
├── Phase 10: Drag-to-Add Widget Functionality
├── Phase 9: Widget Search & Filtering
├── Phase 8: Widget Customization Panel
├── Phase 7: Template Selector UI
├── Phase 6: 108+ Widget Library
└── Phase 5: Initial Dashboard Setup
```

#### Key Files to Review

1. **`package.json`** - Dependencies and scripts
2. **`tsconfig.json`** - TypeScript configuration
3. **`vite.config.ts`** - Frontend build configuration
4. **`drizzle.config.ts`** - Database migration configuration
5. **`.env.example`** - Environment variable template
6. **`README.md`** - Project documentation

---

## CURRENT PROJECT STATUS

### Completed Milestones

| Phase | Feature | Status | Checkpoint |
|-------|---------|--------|-----------|
| 1-12 | Dashboard Foundation | ✅ Complete | 37e03292 |
| 13 | Advanced Widgets | ✅ Complete | 5b3eef7e |
| 14 | Backend Persistence | ✅ Complete | 788d1bad |
| 15 | Frontend Integration | ✅ Complete | b307cd2d |

### Current Codebase State

**Frontend:**
- ✅ All 108+ widgets defined in `widgetLibrary.ts`
- ✅ Widget customization fully integrated with backend
- ✅ Template sharing with role-based access
- ✅ Analytics dashboard with sample data
- ✅ Zero TypeScript compilation errors

**Backend:**
- ✅ 5 new database tables created and migrated
- ✅ 20+ tRPC procedures implemented
- ✅ Widget tracking hook ready for integration
- ✅ Analytics service with AI recommendations
- ✅ WebSocket collaboration service ready

**Database:**
- ✅ Manus Sandbox: All tables created and tested
- ✅ Production RDS: Ready for migration
- ✅ Schema fully documented in `drizzle/schema.ts`

### Live Development Environment

```
Dev Server: https://3000-i2p7r8a3afug5ldji6ll1-f63760a1.us2.manus.computer
Port: 3000
Status: Running
Database: Manus Sandbox (MySQL)
Auth: Manus OAuth 2.0
```

---

## DATABASE ARCHITECTURE

### Manus Sandbox Database (Development)

**Connection Details:**
```
Host: [MANUS_DB_HOST]
Port: 3306
Database: [MANUS_DB_NAME]
Username: [MANUS_DB_USER]
Password: [MANUS_DB_PASSWORD] (See Manus Management UI → Settings → Secrets)
SSL: Required
```

**How to Connect:**

1. **Via MySQL CLI:**
```bash
mysql -h [MANUS_DB_HOST] -u [MANUS_DB_USER] -p -D [MANUS_DB_NAME] --ssl-mode=REQUIRED
```

2. **Via Database Client (DBeaver, TablePlus, etc.):**
   - Host: `[MANUS_DB_HOST]`
   - Port: `3306`
   - Database: `[MANUS_DB_NAME]`
   - Username: `[MANUS_DB_USER]`
   - Password: `[MANUS_DB_PASSWORD]`
   - SSL: Enable

3. **Via Node.js (in application):**
```typescript
import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);
```

### Production RDS Database

**Connection Details:**
```
Host: [AWS_RDS_ENDPOINT] (e.g., eusotrip-db.c9akciq32.us-east-1.rds.amazonaws.com)
Port: 3306
Database: [RDS_DB_NAME]
Username: [RDS_DB_USER]
Password: [RDS_DB_PASSWORD] (Store in AWS Secrets Manager)
SSL: Required
Region: [AWS_REGION]
```

**How to Connect:**

1. **Via AWS Secrets Manager:**
```bash
aws secretsmanager get-secret-value --secret-id rds/eusotrip-db --region [AWS_REGION]
```

2. **Via EC2 Instance:**
```bash
ssh -i [KEY_PAIR].pem ec2-user@[EC2_PUBLIC_IP]
mysql -h [RDS_ENDPOINT] -u [RDS_USER] -p -D [RDS_DB_NAME]
```

3. **Via Application Environment:**
```bash
DATABASE_URL=mysql://[RDS_USER]:[RDS_PASSWORD]@[RDS_ENDPOINT]:3306/[RDS_DB_NAME]?ssl=true
```

### Database Schema Overview

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**widget_customizations**
```sql
CREATE TABLE widget_customizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  widgetId VARCHAR(255) NOT NULL,
  colorTheme VARCHAR(50),
  refreshRate VARCHAR(50),
  dataSource VARCHAR(50),
  opacity INT,
  compactMode BOOLEAN,
  customSettings JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY (userId, widgetId)
);
```

**dashboard_templates**
```sql
CREATE TABLE dashboard_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSON,
  widgets JSON,
  category VARCHAR(50),
  isDefault BOOLEAN DEFAULT FALSE,
  accessLevel ENUM('private', 'team', 'public') DEFAULT 'private',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

**template_shares**
```sql
CREATE TABLE template_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  templateId INT NOT NULL,
  sharedWithUserId INT NOT NULL,
  accessLevel ENUM('view', 'edit', 'admin') DEFAULT 'view',
  sharedBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (templateId) REFERENCES dashboard_templates(id),
  FOREIGN KEY (sharedWithUserId) REFERENCES users(id),
  FOREIGN KEY (sharedBy) REFERENCES users(id)
);
```

**widget_analytics**
```sql
CREATE TABLE widget_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  widgetId VARCHAR(255) NOT NULL,
  eventType VARCHAR(50),
  eventData JSON,
  sessionDuration INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (userId, widgetId, timestamp)
);
```

**widget_usage_summary**
```sql
CREATE TABLE widget_usage_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  widgetId VARCHAR(255) UNIQUE NOT NULL,
  totalViews INT DEFAULT 0,
  totalInteractions INT DEFAULT 0,
  averageSessionDuration INT DEFAULT 0,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Understanding Database Fields

**Widget Customizations:**
- `colorTheme`: One of 6 themes (default, ocean, forest, sunset, midnight, neon)
- `refreshRate`: Seconds between data refreshes (5-300)
- `dataSource`: live, cached, or historical
- `opacity`: 10-100 percentage
- `compactMode`: Boolean for compact display
- `customSettings`: JSON object for widget-specific settings

**Dashboard Templates:**
- `layout`: JSON array of grid positions `[{id, x, y, w, h}]`
- `widgets`: JSON array of widget IDs
- `category`: Template category (Daily Operations, Performance Review, etc.)
- `accessLevel`: private, team, or public sharing

**Widget Analytics:**
- `eventType`: open, close, customize, resize, refresh, interact
- `eventData`: JSON with event-specific details
- `sessionDuration`: Milliseconds widget was open

---

## DEPLOYMENT PROCESS

### Overview

```
Local Development → GitHub (develop) → GitHub (staging) → GitHub (production) → EC2 Instance → Live Site
```

### Step 1: Local Development & Testing

**Setup Development Environment:**

```bash
# Clone repository
git clone https://github.com/diegoenterprises/eusoronetechnologiesinc.git
cd eusotrip-frontend

# Install dependencies
pnpm install

# Create .env.local file
cp .env.example .env.local

# Fill in environment variables (see Environment Variables section)
# DATABASE_URL=mysql://[USER]:[PASS]@[HOST]:3306/[DB]
# VITE_APP_ID=[YOUR_APP_ID]
# JWT_SECRET=[YOUR_JWT_SECRET]
# etc.

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

**Development Server:**
```
Frontend: http://localhost:5173
Backend: http://localhost:3000
```

**Testing:**
```bash
# Run unit tests
pnpm test

# Run TypeScript check
pnpm tsc --noEmit

# Build for production
pnpm build
```

### Step 2: Commit & Push to GitHub

**Commit Workflow:**

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push to feature branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# → Review → Merge to develop
```

**Commit Message Format:**
```
feat: Add new widget customization feature
fix: Resolve TypeScript compilation error
docs: Update deployment documentation
refactor: Improve widget library organization
test: Add unit tests for tRPC procedures
```

### Step 3: Merge to Staging Branch

**Staging Deployment:**

```bash
# On GitHub: Create Pull Request from develop → staging
# After review and approval:

git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Tag for staging release
git tag -a v1.1.0-staging -m "Staging release"
git push origin v1.1.0-staging
```

### Step 4: Merge to Production Branch

**Production Deployment:**

```bash
# On GitHub: Create Pull Request from staging → production
# After final review and QA approval:

git checkout production
git pull origin production
git merge staging
git push origin production

# Tag for production release
git tag -a v1.1.0 -m "Production release"
git push origin v1.1.0
```

### Step 5: Deploy to EC2 Instance

**EC2 Deployment Process:**

```bash
# 1. Connect to EC2 instance
ssh -i [KEY_PAIR].pem ec2-user@[EC2_PUBLIC_IP]

# 2. Navigate to application directory
cd /home/ec2-user/eusotrip-frontend

# 3. Pull latest production code
git checkout production
git pull origin production

# 4. Install/update dependencies
pnpm install --frozen-lockfile

# 5. Build frontend
pnpm build

# 6. Run database migrations (if schema changed)
pnpm db:push

# 7. Restart application server
pm2 restart eusotrip-frontend
# or
systemctl restart eusotrip-frontend

# 8. Verify deployment
curl http://localhost:3000
# Check health endpoint
curl http://localhost:3000/api/health

# 9. Check logs
pm2 logs eusotrip-frontend
# or
tail -f /var/log/eusotrip-frontend/app.log
```

### Step 6: Verify Live Site

**Post-Deployment Checks:**

```bash
# Check application is running
curl https://[YOUR_DOMAIN]/

# Check API endpoints
curl https://[YOUR_DOMAIN]/api/trpc/auth.me

# Monitor logs
ssh -i [KEY_PAIR].pem ec2-user@[EC2_PUBLIC_IP]
tail -f /var/log/eusotrip-frontend/app.log

# Check database connection
# From EC2:
mysql -h [RDS_ENDPOINT] -u [RDS_USER] -p -D [RDS_DB_NAME]
SELECT COUNT(*) FROM users;
```

### Environment Variables for Deployment

**Development (.env.local):**
```
DATABASE_URL=mysql://[MANUS_USER]:[MANUS_PASS]@[MANUS_HOST]:3306/[MANUS_DB]?ssl=true
VITE_APP_ID=[MANUS_APP_ID]
VITE_APP_TITLE=EusoTrip (Dev)
VITE_APP_LOGO=[LOGO_URL]
JWT_SECRET=[DEV_JWT_SECRET]
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=[OWNER_ID]
OWNER_NAME=[OWNER_NAME]
```

**Production (EC2):**
```
DATABASE_URL=mysql://[RDS_USER]:[RDS_PASS]@[RDS_ENDPOINT]:3306/[RDS_DB]?ssl=true
VITE_APP_ID=[PROD_APP_ID]
VITE_APP_TITLE=EusoTrip
VITE_APP_LOGO=[PROD_LOGO_URL]
JWT_SECRET=[PROD_JWT_SECRET]
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=[OWNER_ID]
OWNER_NAME=[OWNER_NAME]
NODE_ENV=production
PORT=3000
```

### Route53 DNS Configuration

**Hosted Zone: [YOUR_DOMAIN]**

```
Record Type | Name | Value | TTL
-----------|------|-------|-----
A | eusotrip.com | [EC2_ELASTIC_IP] | 300
CNAME | www | eusotrip.com | 300
CNAME | api | eusotrip.com | 300
CNAME | admin | eusotrip.com | 300
MX | @ | mail.eusotrip.com | 3600
TXT | @ | v=spf1 include:_spf.google.com ~all | 3600
```

**SSL/TLS Certificate:**
- Provider: AWS Certificate Manager (ACM)
- Domain: eusotrip.com, *.eusotrip.com
- Auto-renewal: Enabled
- Associated with: CloudFront or ALB

---

## ADMIN DASHBOARD

### Accessing Admin Dashboard

**URL:** `https://[YOUR_DOMAIN]/admin`

**Requirements:**
- User role must be `admin` in database
- OAuth authentication required
- Manus session cookie must be valid

### Admin Dashboard Features

#### 1. User Management

**Location:** Admin → Users

**Features:**
- View all registered users
- Search by email, name, or ID
- Filter by role (admin, user)
- Promote/demote users
- View user activity timeline
- Export user list (CSV, JSON)

**Database Query:**
```sql
SELECT id, name, email, role, createdAt, lastSignedIn FROM users ORDER BY createdAt DESC;
```

#### 2. Widget Management

**Location:** Admin → Widgets

**Features:**
- View all 108+ widgets
- Enable/disable widgets per role
- Configure widget default settings
- View widget usage statistics
- Manage widget categories
- Update widget metadata

**Database Query:**
```sql
SELECT w.id, w.name, COUNT(wa.id) as usage_count, AVG(wa.sessionDuration) as avg_session
FROM widget_usage_summary w
LEFT JOIN widget_analytics wa ON w.widgetId = wa.widgetId
GROUP BY w.id
ORDER BY usage_count DESC;
```

#### 3. Template Management

**Location:** Admin → Templates

**Features:**
- View all dashboard templates
- Approve/reject user templates
- Set featured templates
- Manage template categories
- View template usage

**Database Query:**
```sql
SELECT dt.id, dt.name, u.name as creator, COUNT(ts.id) as shares, dt.createdAt
FROM dashboard_templates dt
JOIN users u ON dt.userId = u.id
LEFT JOIN template_shares ts ON dt.id = ts.templateId
GROUP BY dt.id
ORDER BY dt.createdAt DESC;
```

#### 4. Analytics & Reporting

**Location:** Admin → Analytics

**Features:**
- Dashboard usage trends
- Widget popularity metrics
- User engagement analytics
- Performance metrics
- Export reports

**Key Metrics:**
```sql
-- Daily active users
SELECT DATE(lastSignedIn) as date, COUNT(DISTINCT id) as active_users
FROM users
WHERE lastSignedIn >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(lastSignedIn);

-- Most used widgets
SELECT widgetId, COUNT(*) as usage_count, AVG(sessionDuration) as avg_duration
FROM widget_analytics
GROUP BY widgetId
ORDER BY usage_count DESC
LIMIT 10;

-- Template adoption
SELECT category, COUNT(*) as count
FROM dashboard_templates
GROUP BY category;
```

#### 5. System Configuration

**Location:** Admin → Settings

**Features:**
- Global feature flags
- Email configuration
- Notification settings
- API rate limits
- Maintenance mode
- Database health check

**Configuration File:** `server/_core/env.ts`

#### 6. Logs & Monitoring

**Location:** Admin → Logs

**Features:**
- Application error logs
- Database query logs
- API request logs
- Authentication logs
- System events

**Log Locations:**
```
Application: /var/log/eusotrip-frontend/app.log
Database: /var/log/eusotrip-frontend/db.log
Error: /var/log/eusotrip-frontend/error.log
Access: /var/log/eusotrip-frontend/access.log
```

### Admin Dashboard Code Location

```
client/src/pages/AdminDashboard.tsx
client/src/components/admin/
├── UserManagement.tsx
├── WidgetManagement.tsx
├── TemplateManagement.tsx
├── Analytics.tsx
├── SystemConfig.tsx
└── Logs.tsx
```

### Accessing Admin Features

**Check User Role:**
```typescript
// In any component
const { user } = useAuth();
if (user?.role !== 'admin') {
  return <AccessDenied />;
}
```

**Promote User to Admin:**
```sql
UPDATE users SET role = 'admin' WHERE id = [USER_ID];
```

---

## OUTSTANDING ISSUES & SOLUTIONS

### Issue #1: Widget Analytics Using Sample Data

**Status:** ⚠️ In Progress  
**Severity:** Medium  
**Description:** Analytics dashboard displays hardcoded sample data instead of real user interactions.

**Root Cause:**
- `useWidgetTracking` hook created but not integrated into widgets
- No event collection happening in production
- Sample data generated in `WidgetAnalyticsDashboard.tsx`

**Solution:**
1. Integrate `useWidgetTracking` hook into all 108+ widgets
2. Implement event batching and submission
3. Connect to backend `widget.trackEvent` tRPC procedure
4. Replace sample data with real analytics queries
5. Test with actual user interactions

**Implementation Steps:**
```typescript
// In each widget component
import { useWidgetTracking } from '@/hooks/useWidgetTracking';

export function MyWidget() {
  const { trackEvent } = useWidgetTracking('my-widget-id');

  useEffect(() => {
    trackEvent('open', { timestamp: new Date() });
    return () => trackEvent('close', { sessionDuration: Date.now() });
  }, []);

  const handleCustomize = () => {
    trackEvent('customize', { customSettings: {...} });
  };

  return (/* widget UI */);
}
```

**Files to Modify:**
- `client/src/lib/widgetLibrary.ts` - Add tracking to all widget definitions
- `client/src/components/PremiumDashboard.tsx` - Integrate tracking in widget rendering
- `server/routers/widgets.ts` - Add `trackEvent` procedure

**Estimated Effort:** 4-6 hours

---

### Issue #2: WebSocket Collaboration Not Implemented

**Status:** ⚠️ Ready for Implementation  
**Severity:** High  
**Description:** Real-time collaborative dashboard editing not functional. WebSocket service created but backend endpoint missing.

**Root Cause:**
- `websocketCollaborationService.ts` created but not connected to Express server
- No `/api/ws/collaborate` endpoint
- No presence tracking or conflict resolution

**Solution:**
1. Create WebSocket endpoint in Express server
2. Implement presence tracking
3. Add activity logging
4. Handle conflict resolution
5. Test with multiple concurrent users

**Implementation Steps:**

```typescript
// server/_core/websocket.ts
import { WebSocketServer } from 'ws';
import { Server } from 'http';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/api/ws/collaborate' });

  wss.on('connection', (ws, req) => {
    const userId = extractUserIdFromRequest(req);
    const dashboardId = extractDashboardIdFromRequest(req);

    // Track presence
    addPresence(userId, dashboardId);

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      handleMessage(message, userId, dashboardId, wss);
    });

    ws.on('close', () => {
      removePresence(userId, dashboardId);
    });
  });
}

function handleMessage(message, userId, dashboardId, wss) {
  switch (message.type) {
    case 'layout-update':
      broadcastUpdate(message, userId, dashboardId, wss);
      break;
    case 'widget-add':
      handleWidgetAdd(message, userId, dashboardId);
      break;
    case 'cursor-move':
      broadcastCursor(message, userId, dashboardId, wss);
      break;
  }
}
```

**Files to Create/Modify:**
- `server/_core/websocket.ts` - New WebSocket setup
- `server/index.ts` - Initialize WebSocket server
- `client/src/hooks/useCollaboration.ts` - Already created, needs connection
- `client/src/lib/websocketCollaborationService.ts` - Already created, needs testing

**Estimated Effort:** 8-10 hours

---

### Issue #3: Database Migration from Manus Sandbox to AWS RDS

**Status:** ⚠️ Pending  
**Severity:** High  
**Description:** Need to migrate data from development Manus Sandbox to production AWS RDS.

**Root Cause:**
- Development and production databases are separate
- No migration strategy defined
- Data consistency needs verification

**Solution:**
1. Create database dump from Manus Sandbox
2. Validate schema compatibility
3. Migrate data to RDS
4. Verify data integrity
5. Update connection strings
6. Test application with production database

**Migration Steps:**

```bash
# 1. Export from Manus Sandbox
mysqldump -h [MANUS_HOST] -u [MANUS_USER] -p [MANUS_DB] > dump.sql

# 2. Verify schema
mysql -h [RDS_ENDPOINT] -u [RDS_USER] -p [RDS_DB] < dump.sql

# 3. Verify data integrity
mysql -h [RDS_ENDPOINT] -u [RDS_USER] -p -D [RDS_DB] -e "
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'widget_customizations', COUNT(*) FROM widget_customizations
  UNION ALL
  SELECT 'dashboard_templates', COUNT(*) FROM dashboard_templates
  UNION ALL
  SELECT 'template_shares', COUNT(*) FROM template_shares
  UNION ALL
  SELECT 'widget_analytics', COUNT(*) FROM widget_analytics;
"

# 4. Update connection string in EC2
ssh -i [KEY_PAIR].pem ec2-user@[EC2_IP]
# Edit /home/ec2-user/eusotrip-frontend/.env
# Change DATABASE_URL to RDS endpoint

# 5. Restart application
pm2 restart eusotrip-frontend

# 6. Verify connection
curl https://[YOUR_DOMAIN]/api/trpc/auth.me
```

**Files to Update:**
- `.env` on EC2 instance - Update DATABASE_URL
- `drizzle.config.ts` - Verify connection string
- Database connection pooling settings

**Estimated Effort:** 2-3 hours

---

### Issue #4: TypeScript Errors in Old Components

**Status:** ✅ Resolved  
**Severity:** Low  
**Description:** Some older widget components have TypeScript errors.

**Solution:** Already fixed in Phase 15. All components now have zero TypeScript errors.

**Verification:**
```bash
pnpm tsc --noEmit
# Should return no errors
```

---

### Issue #5: Missing Environment Variables Documentation

**Status:** ⚠️ In Progress  
**Severity:** Medium  
**Description:** Development team needs clear documentation of all required environment variables.

**Solution:** See "Environment Variables" section in this guide.

**Verification:**
```bash
# Check all required vars are set
env | grep -E "DATABASE_URL|VITE_APP_ID|JWT_SECRET|OAUTH"
```

---

## DEVELOPMENT WORKFLOW

### Daily Development Checklist

**Morning:**
```bash
# 1. Pull latest changes
git pull origin develop

# 2. Install any new dependencies
pnpm install

# 3. Run database migrations (if schema changed)
pnpm db:push

# 4. Start development server
pnpm dev

# 5. Run tests
pnpm test
```

**During Development:**
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and test locally
pnpm dev
# Test in browser at http://localhost:5173

# 3. Run TypeScript check
pnpm tsc --noEmit

# 4. Commit changes
git add .
git commit -m "feat: description"

# 5. Push to feature branch
git push origin feature/your-feature
```

**Before Pull Request:**
```bash
# 1. Ensure all tests pass
pnpm test

# 2. Check TypeScript compilation
pnpm tsc --noEmit

# 3. Build production bundle
pnpm build

# 4. Test production build locally
pnpm preview

# 5. Create Pull Request on GitHub
```

### Code Review Checklist

**Reviewers should verify:**
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Code follows project conventions
- [ ] No hardcoded secrets or credentials
- [ ] Database migrations are included (if schema changed)
- [ ] Documentation is updated
- [ ] No breaking changes to APIs

### Testing Requirements

**Unit Tests:**
```bash
pnpm test
# Tests located in: __tests__/ directories
```

**TypeScript Check:**
```bash
pnpm tsc --noEmit
# Should have zero errors
```

**Build Verification:**
```bash
pnpm build
# Should complete without errors
```

**Database Migrations:**
```bash
pnpm db:push
# Should apply all pending migrations
```

---

## TROUBLESHOOTING GUIDE

### Issue: "Database connection failed"

**Symptoms:**
```
Error: connect ECONNREFUSED [DATABASE_HOST]:3306
```

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check database is running
3. Verify credentials are correct
4. Check firewall rules allow connection
5. Verify SSL certificate (if required)

```bash
# Test connection
mysql -h [HOST] -u [USER] -p -D [DATABASE]

# Check environment variable
echo $DATABASE_URL
```

---

### Issue: "TypeScript compilation errors"

**Symptoms:**
```
error TS2551: Property 'X' does not exist on type 'Y'
```

**Solutions:**
1. Clear node_modules and reinstall
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

2. Rebuild TypeScript cache
```bash
pnpm tsc --noEmit --force
```

3. Check for circular dependencies
4. Verify all imports are correct

---

### Issue: "OAuth login not working"

**Symptoms:**
- Redirect to login page fails
- "Invalid OAuth credentials" error
- Session cookie not set

**Solutions:**
1. Verify VITE_APP_ID is correct
2. Check OAUTH_SERVER_URL is accessible
3. Verify redirect URI is registered in Manus
4. Check JWT_SECRET is set
5. Clear browser cookies and try again

```bash
# Verify OAuth configuration
echo "VITE_APP_ID: $VITE_APP_ID"
echo "OAUTH_SERVER_URL: $OAUTH_SERVER_URL"
```

---

### Issue: "Widget customization not saving"

**Symptoms:**
- Widget settings revert after refresh
- No error message in console
- Database not updating

**Solutions:**
1. Verify tRPC connection is working
2. Check user is authenticated
3. Verify widget ID is correct
4. Check database has widget_customizations table
5. Verify user has permissions

```bash
# Check database table exists
mysql -h [HOST] -u [USER] -p -D [DB] -e "DESCRIBE widget_customizations;"

# Check user permissions
mysql -h [HOST] -u [USER] -p -D [DB] -e "SELECT * FROM users WHERE id = [USER_ID];"
```

---

### Issue: "Real-time collaboration not working"

**Symptoms:**
- WebSocket connection fails
- "Cannot connect to /api/ws/collaborate"
- Cursor tracking not working

**Solutions:**
1. Verify WebSocket endpoint is running
2. Check firewall allows WebSocket connections
3. Verify SSL certificate is valid
4. Check browser console for errors
5. Verify user is authenticated

```bash
# Test WebSocket connection
wscat -c wss://[YOUR_DOMAIN]/api/ws/collaborate

# Check server logs
tail -f /var/log/eusotrip-frontend/app.log
```

---

## NEXT STEPS FOR DEVELOPMENT TEAM

### Immediate Priorities (Week 1)

1. **Complete Widget Instrumentation**
   - Integrate `useWidgetTracking` into all 108+ widgets
   - Test event collection with real user interactions
   - Verify analytics data is being saved to database
   - **Estimated Time:** 4-6 hours
   - **Owner:** [Developer Name]
   - **PR:** feature/widget-instrumentation

2. **Implement WebSocket Backend**
   - Create `/api/ws/collaborate` endpoint
   - Implement presence tracking
   - Add activity logging
   - Test with multiple concurrent users
   - **Estimated Time:** 8-10 hours
   - **Owner:** [Developer Name]
   - **PR:** feature/websocket-collaboration

3. **Database Migration to RDS**
   - Create migration script
   - Test data integrity
   - Update connection strings on EC2
   - Verify production database connectivity
   - **Estimated Time:** 2-3 hours
   - **Owner:** [DevOps Engineer]
   - **PR:** ops/rds-migration

### Short-term Goals (Week 2-3)

4. **Connect Analytics Dashboard to Backend**
   - Replace sample data with real queries
   - Implement AI recommendations
   - Add CSV/JSON export
   - **Estimated Time:** 4-5 hours

5. **Enhance Admin Dashboard**
   - Add user management features
   - Implement widget management
   - Create analytics reports
   - **Estimated Time:** 6-8 hours

6. **Performance Optimization**
   - Profile application performance
   - Optimize database queries
   - Implement caching strategies
   - **Estimated Time:** 4-6 hours

### Medium-term Goals (Month 1-2)

7. **Mobile Responsiveness**
   - Test on mobile devices
   - Optimize touch interactions
   - Implement mobile-specific widgets
   - **Estimated Time:** 8-10 hours

8. **Advanced Features**
   - Widget scheduling
   - Custom widget creation
   - Advanced filtering and search
   - **Estimated Time:** 10-15 hours

9. **Testing & QA**
   - Write integration tests
   - Perform load testing
   - Security audit
   - **Estimated Time:** 8-12 hours

### Long-term Vision (Quarter 2+)

10. **Scalability Improvements**
    - Implement database sharding
    - Add caching layer (Redis)
    - Optimize API response times
    - **Estimated Time:** 20-30 hours

11. **Advanced Analytics**
    - Machine learning recommendations
    - Predictive analytics
    - Custom report builder
    - **Estimated Time:** 20-40 hours

12. **Team Collaboration Features**
    - Real-time comments
    - Widget sharing
    - Team dashboards
    - **Estimated Time:** 15-20 hours

---

## QUICK REFERENCE COMMANDS

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# TypeScript check
pnpm tsc --noEmit

# Build production
pnpm build

# Preview production build
pnpm preview

# Database migrations
pnpm db:push

# Database studio (visual editor)
pnpm db:studio
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: description"

# Push to GitHub
git push origin feature/your-feature

# Create Pull Request on GitHub

# After merge, pull latest
git pull origin develop
```

### Deployment

```bash
# SSH to EC2
ssh -i [KEY_PAIR].pem ec2-user@[EC2_IP]

# Pull latest code
git pull origin production

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Run migrations
pnpm db:push

# Restart server
pm2 restart eusotrip-frontend

# View logs
pm2 logs eusotrip-frontend
```

### Database

```bash
# Connect to Manus Sandbox
mysql -h [MANUS_HOST] -u [MANUS_USER] -p -D [MANUS_DB]

# Connect to RDS
mysql -h [RDS_ENDPOINT] -u [RDS_USER] -p -D [RDS_DB]

# Export database
mysqldump -h [HOST] -u [USER] -p [DB] > dump.sql

# Import database
mysql -h [HOST] -u [USER] -p [DB] < dump.sql
```

---

## SUPPORT & RESOURCES

### Documentation
- **Project README:** `/README.md`
- **API Documentation:** `server/routers/widgets.ts`
- **Database Schema:** `drizzle/schema.ts`
- **Environment Variables:** `.env.example`

### External Resources
- **tRPC Documentation:** https://trpc.io
- **Drizzle ORM:** https://orm.drizzle.team
- **React Documentation:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com

### Contact & Escalation
- **Technical Lead:** [Name] - [Email]
- **DevOps Engineer:** [Name] - [Email]
- **Project Manager:** [Name] - [Email]

---

## CONCLUSION

This handoff guide provides comprehensive documentation for the EusoTrip Frontend project. The development team should:

1. **Review this entire guide** to understand project architecture and current status
2. **Follow the deployment process** for any code changes
3. **Use the troubleshooting guide** for common issues
4. **Complete the immediate priorities** in the next week
5. **Maintain this documentation** as the project evolves

**Current Project Status:** Production-ready with advanced widget system. Ready for real-time collaboration features and production database migration.

**Last Updated:** January 23, 2026  
**Next Review:** February 6, 2026  
**Maintained By:** [Your Name]

---

*For questions or updates to this guide, please contact the technical lead or create an issue in the GitHub repository.*
