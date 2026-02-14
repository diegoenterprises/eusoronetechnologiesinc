# EusoTrip by Eusorone Technologies, Inc.

The unified logistics and transportation platform. Live at **[eusotrip.com](https://eusotrip.com)**

---

## Platform Overview

EusoTrip connects shippers, carriers, brokers, drivers, escorts, terminal operators, and fleet managers on a single intelligent network. The platform handles the full freight lifecycle from load creation and bidding through real-time tracking, delivery confirmation, and financial settlement.

**12 user roles** | **370+ screens** | **120+ tRPC procedures** | **94 database tables** | **14 agreement types**

---

## Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5, Tailwind CSS 4, Vite 7 |
| **Backend** | Express 4, tRPC 11, Node.js 20 |
| **Database** | MySQL via Drizzle ORM |
| **AI** | ESANG AI (Gemini 2.0 Flash) |
| **Auth** | JWT + session-based authentication |
| **Payments** | Stripe + EUSOBANK (in-house ACH) |
| **Hosting** | Azure App Service |
| **DNS** | eusotrip.com via Azure DNS |

### Repository Structure

```
frontend/
  client/src/          React app (pages, components, hooks, config)
  server/              Express + tRPC server
    routers/           120+ tRPC routers
    services/          Business logic (eusobank, gamification, etc.)
    _core/             Auth, tRPC context, ESANG AI, WebSocket
  drizzle/             Schema definitions (94 tables)
docs/                  Founder documents, development directives
```

---

## Core Systems

### Load Management and Brokerage
Full load lifecycle: creation, bidding, carrier assignment, real-time status progression (posted through delivered), detention tracking, TONU fee handling, and post-delivery documentation (BOL, POD, invoice).

### EusoWallet and Financial Engine
Wallet balances, P2P transfers, instant pay, cash advances, chat payments, escrow holds, Stripe integration, EUSOBANK ACH transfers, payout scheduling, tax document generation, and invoice factoring.

### ESANG AI Intelligence Layer
Voice-enabled AI assistant powered by Gemini 2.0 Flash. Capabilities include ERG 2024 hazmat guidance, Spectra-Match crude oil identification (90+ grades), smart rate negotiation, emergency response, and per-user contextual learning.

### The Haul (Gamification)
Mission system, loot crates, badges, achievements, XP/leveling, seasonal content, leaderboards, digital truck stop lobby chat, and AI-generated missions.

### Zeun Mechanics
AI-powered breakdown reporting, DTC fault code lookup, diagnostic results, repair provider search with reviews, maintenance logging and scheduling, vehicle recall checks, fleet cost analytics, and 10 emergency procedure guides.

### Agreements Engine
14 agreement types (carrier-shipper, broker-carrier, factoring, NDA, etc.) with AI-generated legal clauses, role-aware creation wizard, digital signatures, and version tracking.

### Real-Time Messaging
Database-backed conversations with participant management, unread counts, typing indicators, and WebSocket event broadcasting.

---

## Getting Started

```bash
# Clone
git clone https://github.com/diegoenterprises/eusoronetechnologiesinc.git

# Install dependencies
cd frontend
pnpm install

# Set environment variables
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, STRIPE_SECRET_KEY, etc.

# Run development server
pnpm dev
```

The app runs at `http://localhost:5000`.

---

## Deployment

EusoTrip deploys to **Azure App Service** via blob-based package deployment.

```bash
npm run build                    # Vite + esbuild -> dist/
zip -r deploy.zip dist/ package.json
# Upload to Azure Blob Storage, set WEBSITE_RUN_FROM_PACKAGE, restart
```

See `AZURE_INFRASTRUCTURE_SETUP.md` and `frontend/AZURE_DEPLOYMENT_GUIDE.md` for full details.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Authentication token signing |
| `GEMINI_API_KEY` | ESANG AI (Google Gemini) |
| `STRIPE_SECRET_KEY` | Payment processing |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe |
| `ENCRYPTION_KEY` | Sensitive data encryption |
| `FMCSA_API_KEY` | FMCSA carrier verification |
| `FRED_API_KEY` | Economic data feeds |
| `EIA_API_KEY` | Energy/fuel price data |
| `NREL_API_KEY` | Alternative fuel station data |
| `AZURE_EMAIL_CONNECTION_STRING` | Azure Communication Services |

---

**Eusorone Technologies, Inc.** | Intelligence. Compliance. Collaboration.
