# EusoTrip Hot Zones — Market Intelligence System

## Overview

**Hot Zones** is EusoTrip's real-time geographic market intelligence engine. It transforms raw freight data, external government APIs, and weather feeds into role-specific actionable intelligence for every user type on the platform.

Unlike generic load boards that show the same data to everyone, Hot Zones understands **who you are** and shows you **what you need**. A catalyst (truck) sees where loads are waiting. A shipper sees where trucks are available. A terminal manager sees where crude oil marketers are active. Every role gets a purpose-built intelligence layer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ HotZones.tsx │  │HotZoneMap.tsx│  │  Role Context      │  │
│  │ (Page)       │──│ (SVG Map)    │──│  (12 user types)   │  │
│  └──────┬───────┘  └──────────────┘  └───────────────────┘  │
│         │ tRPC query (10s polling)                           │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                     SERVER (Node.js + tRPC)                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              hotZones Router (getRateFeed)               │ │
│  │                                                         │ │
│  │  1. Resolve user role from auth context                 │ │
│  │  2. Fetch DB enhancement (real load counts by state)    │ │
│  │  3. Fetch external APIs (EIA fuel + NWS weather)        │ │
│  │  4. Build 18 hot zones + 7 cold zones                   │ │
│  │  5. Overlay live DB data onto zone baselines             │ │
│  │  6. Compute role-specific metrics (buildRoleMetrics)     │ │
│  │  7. Filter zones for role (filterZonesForRole)           │ │
│  │  8. Sort zones by role priority (sortZonesForRole)       │ │
│  │  9. Build role-specific pulse stats (buildRolePulseStats)│ │
│  │ 10. Return: zones, coldZones, roleContext, marketPulse   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  External Data Sources (cached):                             │
│  ├── EIA API (diesel fuel prices by state, 6hr TTL)          │
│  ├── NWS API (active weather alerts, 5min TTL)               │
│  └── MySQL DB (live load counts, rates, truck positions)     │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Pipeline

### Step 1: Authentication & Role Resolution
Every request authenticates via JWT. The user's role (CATALYST, SHIPPER, DRIVER, BROKER, DISPATCH, ESCORT, TERMINAL_MANAGER, FACTORING, COMPLIANCE_OFFICER, SAFETY_MANAGER, ADMIN, SUPER_ADMIN) determines everything downstream.

### Step 2: Database Enhancement
Real platform data overlays the baseline:
```sql
SELECT
  JSON_EXTRACT(pickupLocation, '$.state') AS state,
  COUNT(*) AS loads,
  COUNT(DISTINCT driverId) AS trucks,
  AVG(rate / NULLIF(distance, 0)) AS avgRatePerMile
FROM loads
WHERE status NOT IN ('delivered', 'cancelled', 'draft')
  AND deletedAt IS NULL
GROUP BY state
```

### Step 3: External API Integration

| Source | Data | Cache TTL | Key |
|--------|------|-----------|-----|
| **EIA (Energy Information Administration)** | Diesel fuel prices by state/region | 6 hours | `EIA_API_KEY` |
| **NWS (National Weather Service)** | Active weather alerts (severity, headline, area) | 5 minutes | Free (no key) |

### Step 4: Zone Construction
18 hot zones and 7 cold zones are maintained, each with:
- Geographic center (lat/lng) and radius
- Baseline load count, truck count, load-to-truck ratio
- Surge multiplier and average rate per mile
- Top equipment types (DRY_VAN, TANKER, HAZMAT, FLATBED, REEFER)
- Hazmat class classifications
- Oversized freight frequency
- Peak operating hours

### Step 5: Live Data Overlay
If platform DB has data for a zone's state, the baseline is replaced:
- `liveLoads` = DB load count (or baseline if no DB data)
- `liveTrucks` = DB truck count (or baseline)
- `liveRate` = DB average rate per mile (or baseline)
- `liveRatio` = liveLoads / liveTrucks
- `liveSurge` = computed from ratio (ratio > 2.5 = higher surge)
- `rateChange` = delta from baseline

### Step 6: Role-Specific Processing
Three functions transform generic zone data into role-specific intelligence:

1. **`buildRoleMetrics(role, zone)`** — 3 metrics per zone, tailored to role
2. **`filterZonesForRole(role, zones)`** — removes irrelevant zones
3. **`sortZonesForRole(role, zones)`** — orders by what matters most

---

## Role-Specific Intelligence (All 12 User Types)

### CATALYST (Truck/Carrier)
**Goal:** Find loads to haul

| Field | What They See |
|-------|---------------|
| **Perspective** | `freight_demand` |
| **Zone Metrics** | Open Loads, Rate/mi, Surge multiplier |
| **Sorting** | Most loads first |
| **Filtering** | All zones (freight exists everywhere) |
| **Pulse Stats** | Open Loads, Best Rate, Surge Zones, Diesel |
| **Default Layers** | Freight Demand, Rate Heat, Fuel Prices, Weather Risk |
| **Actions** | View Loads, Route Fleet, Set Demand Alert |
| **Map Dot** | Shows `$X.XX` (rate per mile) |
| **Dot Color** | Red/Orange/Yellow heat scale |

**Why:** Catalysts need to position their trucks where freight demand is highest and rates are best. They see load counts, rates, and surge multipliers to make routing decisions.

---

### SHIPPER
**Goal:** Find available trucks/catalysts for their freight

| Field | What They See |
|-------|---------------|
| **Perspective** | `catalyst_availability` |
| **Zone Metrics** | Avail. Trucks, Est. Rate, Response Time (Fast/Normal/Slow) |
| **Sorting** | Most trucks available first |
| **Filtering** | All zones |
| **Pulse Stats** | Avail. Trucks, Avg Rate, Hot Markets, Weather Alerts |
| **Default Layers** | Catalyst Capacity, Rate Heat, Compliance Risk, Weather Risk |
| **Actions** | Post Load, View Catalysts, Set Rate Alert |
| **Map Dot** | Shows `XT` (truck count) |
| **Dot Color** | Green/Blue/Purple scale |

**Why:** Shippers need to know where trucks are available so they can price loads competitively and get coverage quickly. "Response" metric tells them if a zone has slow or fast carrier response based on the load-to-truck ratio.

---

### DRIVER
**Goal:** Find the best paying loads near them

| Field | What They See |
|-------|---------------|
| **Perspective** | `driver_opportunity` |
| **Zone Metrics** | Loads, Est. Pay ($rate x 250mi avg), Diesel price |
| **Sorting** | Most loads first |
| **Filtering** | All zones |
| **Pulse Stats** | Loads, Best Rate, Avg Diesel, Surge Zones |
| **Default Layers** | Freight Demand, Fuel Stations, Weather Risk, Rate Heat |
| **Actions** | Accept Load, Navigate Zone, Find Fuel |
| **Map Dot** | Shows `$X.X` (rate) |
| **Dot Color** | Amber/Orange/Blue scale |

**Why:** Drivers think in terms of take-home pay. The "Est. Pay" metric converts rate-per-mile into a dollar amount for a typical 250-mile haul. Diesel prices help calculate net earnings.

---

### BROKER
**Goal:** Find the best arbitrage/margin opportunities

| Field | What They See |
|-------|---------------|
| **Perspective** | `spread_opportunity` |
| **Zone Metrics** | Loads, Margin/mi (+$X.XX), Trucks |
| **Sorting** | Best margin first (rate x ratio x 0.15) |
| **Filtering** | None (brokers see everything) |
| **Pulse Stats** | Total Loads, Best Margin, Trucks, Critical Zones |
| **Default Layers** | Spread Opportunity, Freight Demand, Catalyst Capacity, Rate Heat |
| **Actions** | Find Catalysts, Post Counter, Calc Margin |
| **Map Dot** | Shows `+X.X` (margin) |
| **Dot Color** | Emerald/Yellow/Purple scale |

**Why:** Brokers profit from the spread between what a shipper pays and what a carrier accepts. The margin metric identifies zones where high demand + limited trucks = highest arbitrage potential.

---

### DISPATCH
**Goal:** Optimize driver assignments and fleet positioning

| Field | What They See |
|-------|---------------|
| **Perspective** | `dispatch_intelligence` |
| **Zone Metrics** | Open Loads, Drivers (available), Imbalance (ratio) |
| **Sorting** | Worst imbalance first |
| **Filtering** | All zones |
| **Pulse Stats** | Open Loads, Drivers Avail., Avg Imbalance, Critical |
| **Default Layers** | Freight Demand, Driver HOS, Fuel Prices, Weather Risk |
| **Actions** | Assign Driver, Reposition Fleet, View HOS |
| **Map Dot** | Shows `X/Y` (loads/trucks) |
| **Dot Color** | Red/Orange/Cyan scale |

**Why:** Dispatchers need to see the load-to-truck ratio to reposition drivers from oversupplied zones to undersupplied zones. The "Imbalance" metric highlights where intervention is most needed.

---

### ESCORT
**Goal:** Find oversized/overweight escort opportunities

| Field | What They See |
|-------|---------------|
| **Perspective** | `oversized_demand` |
| **Zone Metrics** | Oversized frequency (Very High/High/Moderate), Rate/mi, Permits Required |
| **Sorting** | Highest oversized frequency first |
| **Filtering** | Only zones with FLATBED/HAZMAT equipment or HIGH/VERY_HIGH oversized |
| **Pulse Stats** | Oversized Zones, Best Rate, Permit Corridors, Weather |
| **Default Layers** | Escort Corridors, Weather Risk, Fuel Stations |
| **Actions** | Bid Escort, View Requirements, Check Clearances |
| **Map Dot** | Shows `OVS!` for very high, `OVS` for high |
| **Dot Color** | Purple/Indigo/Lavender scale |

**Why:** Escort vehicles only care about zones with oversized/overweight freight that requires pilot car services. The system filters out irrelevant zones entirely, showing only corridors where escort demand exists.

---

### TERMINAL_MANAGER
**Goal:** Find crude oil marketers and monitor facility throughput

| Field | What They See |
|-------|---------------|
| **Perspective** | `facility_throughput` |
| **Zone Metrics** | Inbound Volume, Marketers (activity score), Crude/Chem % |
| **Sorting** | Tanker/HAZMAT priority, then by volume |
| **Filtering** | Only zones with TANKER/HAZMAT/FLATBED equipment or 3+ hazmat classes |
| **Pulse Stats** | Inbound Freight, Active Marketers, Crude Zones, Weather |
| **Default Layers** | Facility Throughput, Freight Demand, Weather Risk |
| **Actions** | Manage Appointments, Alert Catalysts, View Docks |
| **Map Dot** | Shows `XL` (load count) |
| **Dot Color** | Cyan/Blue/Purple scale |

**Why:** Terminal managers at crude oil and chemical terminals need to know which zones have active marketers bringing product. The "Marketers" score is derived from tanker/hazmat activity in the zone. "Crude/Chem %" estimates the percentage of freight that is crude oil or chemical.

---

### FACTORING
**Goal:** Assess invoice volume and credit risk by geography

| Field | What They See |
|-------|---------------|
| **Perspective** | `invoice_intelligence` |
| **Zone Metrics** | Est. Invoices (70% of loads), Avg Invoice Value, Credit Risk (High/Med/Low) |
| **Sorting** | Highest volume first |
| **Filtering** | All zones |
| **Pulse Stats** | Est. Invoices, Avg Value, High Risk zones, Active Zones |
| **Default Layers** | Factoring Risk, Freight Demand, Rate Heat |
| **Actions** | View Invoices, Assess Credit, Adjust Rate |
| **Map Dot** | Shows `$X.X` (rate) |
| **Dot Color** | Orange/Yellow/Green scale |

**Why:** Factoring companies buy carrier invoices at a discount. They need to see where invoice volume is highest and where credit risk is concentrated. High load-to-truck ratios correlate with payment risk (carriers in high-demand zones may take riskier loads).

---

### COMPLIANCE_OFFICER
**Goal:** Monitor regulatory compliance risk across zones

| Field | What They See |
|-------|---------------|
| **Perspective** | `compliance_risk` |
| **Zone Metrics** | Risk Score (0-100), Hazmat classes count, Weather risk level |
| **Sorting** | Highest risk score first |
| **Filtering** | All zones (compliance monitors everything) |
| **Pulse Stats** | Risk Zones (score > 40), Hazmat Active, Avg Risk, Weather |
| **Default Layers** | Compliance Risk, Safety Score, Incident History, Weather Risk |
| **Actions** | View Non-Compliant, Generate Audit, Send CAP |
| **Map Dot** | Shows `RXX` (risk score) |
| **Dot Color** | Red/Yellow/Green scale |

**Risk Score Formula:**
```
riskScore = (weatherAlerts.length * 20) + (hazmatClasses.length * 15) + (ratio > 2.5 ? 20 : 0)
```

**Why:** Compliance officers need to proactively identify zones where regulatory risk is highest — areas with active hazmat, severe weather, and high demand create the perfect storm for compliance violations.

---

### SAFETY_MANAGER
**Goal:** Monitor safety risk zones and incident hotspots

| Field | What They See |
|-------|---------------|
| **Perspective** | `safety_risk` |
| **Zone Metrics** | Safety Score (0-100, higher = safer), Hazmat classes, Incidents (Active/Clear) |
| **Sorting** | Worst safety score first |
| **Filtering** | All zones |
| **Pulse Stats** | Low Safety zones, Hazmat Zones, Active Incidents, Monitored zones |
| **Default Layers** | Incident History, Safety Score, Weather Risk, Compliance Risk |
| **Actions** | Issue Alert, Schedule Meeting, Investigate |
| **Map Dot** | Shows `SXX` (safety score) |
| **Dot Color** | Red/Yellow/Cyan scale |

**Safety Score Formula:**
```
safetyScore = max(0, 100 - (weatherAlerts.length * 15) - (hazmatClasses.length * 10))
```

**Why:** Safety managers need to see where conditions are most dangerous so they can issue proactive alerts, investigate incidents, and schedule safety meetings for drivers operating in high-risk zones.

---

### ADMIN
**Goal:** Platform-wide operational oversight

| Field | What They See |
|-------|---------------|
| **Perspective** | `platform_health` |
| **Zone Metrics** | Loads, Trucks, L:T Ratio |
| **Sorting** | By ratio (highest demand first) |
| **Filtering** | All zones |
| **Pulse Stats** | Total Loads, Avg Rate, L:T Ratio, Critical, Diesel |
| **Default Layers** | Freight Demand, Catalyst Capacity, Compliance Risk |
| **Actions** | View Users, Manage Zones, Generate Report |
| **Map Dot** | Shows `$X.XX` (rate) |
| **Dot Color** | Brand gradient (#1473FF to #BE01FF) |

---

### SUPER_ADMIN
**Goal:** Complete platform oversight and business intelligence

| Field | What They See |
|-------|---------------|
| **Perspective** | `executive_intelligence` |
| **Zone Metrics** | Loads, Trucks, L:T Ratio |
| **Sorting** | By ratio |
| **Filtering** | All zones |
| **Pulse Stats** | Total Loads, Avg Rate, L:T Ratio, Critical, Diesel |
| **Default Layers** | Freight Demand, Catalyst Capacity, Compliance Risk, Factoring Risk, Incident History |
| **Actions** | Platform Overview, Adjust Pricing, Export Data |

---

## Frontend Components

### `HotZones.tsx` (Page)
The main page component that orchestrates everything:
- Polls `hotZones.getRateFeed` every 10 seconds
- Renders the header with role-specific title and description
- Market pulse stat bar with `rolePulseStats` from backend
- Layer toggle panel (role-specific default layers)
- Interactive SVG heatmap (`HotZoneMap` component)
- Zone cards grid with role-specific metrics
- Cold zones footer
- Equipment filter

### `HotZoneMap.tsx` (Interactive SVG Map)
A fully custom SVG map of the continental US:
- **48 state outlines** projected from real lat/lng coordinates
- **7 interstate highway** overlays (I-10, I-20, I-40, I-70, I-80, I-90, I-95, I-35, I-65, I-75)
- **34 major cities** with zoom-dependent labels
- **Zoom controls**: Scroll wheel, pinch-to-zoom, button controls, minimap at high zoom
- **Pan controls**: Click-drag with pointer capture
- **Hot zone dots**: Size driven by `sizeMetric(zone)`, color by demand level
- **Cold zone dots**: Blue, smaller, lower opacity
- **Layer overlays**: Fuel prices, weather risk, catalyst capacity, compliance risk, rate intelligence, safety score, incident history, freight demand, spread opportunity
- **Tooltips**: Role-specific metrics on hover + universal Rate/Surge/Demand
- **Role-adaptive visualization**: Each role sees different colors, dot labels, sizing, and emphasis via `getRoleViz(perspective)`

---

## Data Layers (14 Available)

| Layer | Description | Visual |
|-------|-------------|--------|
| `freight_demand` | Load count per zone | Red load count badge |
| `catalyst_capacity` | Available truck count | Green dashed ring + truck count |
| `rate_heat` | Rate intensity | Amber ring, width proportional to rate |
| `fuel_prices` | Diesel price by state (EIA) | Yellow price tag badge |
| `fuel_stations` | Fuel station density | Green markers |
| `weather_risk` | Active NWS alerts | Red/amber weather circle + alert count |
| `compliance_risk` | Regulatory risk score | Risk score badge, red/yellow/green |
| `incident_history` | Hazmat class count | Purple incident circle |
| `terminal_throughput` | Facility volume | Cyan volume indicators |
| `escort_corridors` | Oversized demand | Purple corridor markers |
| `spread_opportunity` | Broker margin | Green margin per mile |
| `factoring_risk` | Credit risk | Orange risk indicators |
| `safety_score` | Safety score (0-100) | Color-coded safety badge |
| `driver_hos` | HOS availability | Purple availability ring |

Each role has a default set of active layers. Users can toggle layers on/off.

---

## Zone Inventory

### 18 Hot Zones
| ID | Zone | State | Equipment Focus | Oversized |
|----|------|-------|-----------------|-----------|
| hz-lax | Los Angeles Basin | CA | DRY_VAN, REEFER, FLATBED | Moderate |
| hz-chi | Chicago Metro | IL | DRY_VAN, REEFER | Low |
| hz-hou | Houston / Gulf Coast | TX | TANKER, HAZMAT, FLATBED | High |
| hz-atl | Atlanta Corridor | GA | DRY_VAN, REEFER | Low |
| hz-dal | Dallas-Fort Worth | TX | DRY_VAN, FLATBED, REEFER | Moderate |
| hz-nwk | New York / New Jersey | NJ | DRY_VAN, REEFER | Low |
| hz-mid | Midland-Odessa (Permian) | TX | TANKER, HAZMAT, FLATBED | Very High |
| hz-sav | Savannah Port | GA | DRY_VAN, FLATBED | Moderate |
| hz-mem | Memphis Hub | TN | DRY_VAN, REEFER | Low |
| hz-bak | Bakken Formation | ND | TANKER, HAZMAT | High |
| hz-phl | Philadelphia / Delaware Valley | PA | DRY_VAN, REEFER, TANKER | Moderate |
| hz-lac | Lake Charles / Beaumont | LA | TANKER, HAZMAT, FLATBED | Very High |
| hz-det | Detroit / SE Michigan | MI | DRY_VAN, FLATBED | Moderate |
| hz-sea | Seattle / Tacoma | WA | DRY_VAN, REEFER, FLATBED | Moderate |
| hz-den | Denver / Front Range | CO | DRY_VAN, REEFER, FLATBED | Moderate |
| hz-jax | Jacksonville / NE Florida | FL | DRY_VAN, REEFER | Low |
| hz-eag | Eagle Ford Shale | TX | TANKER, HAZMAT, FLATBED | High |
| hz-pit | Pittsburgh / Marcellus Shale | PA | TANKER, FLATBED, DRY_VAN | High |

### 7 Cold Zones (Excess Capacity)
| ID | Zone | State | Reason |
|----|------|-------|--------|
| cz-bil | Billings, MT | MT | Low demand, driver excess |
| cz-far | Fargo, ND | ND | Seasonal freight decline |
| cz-chy | Cheyenne, WY | WY | Very limited freight volume |
| cz-boi | Boise, ID | ID | Regional imbalance |
| cz-lit | Little Rock, AR | AR | Low industrial output |
| cz-abq | Albuquerque, NM | NM | Transit corridor, limited origin freight |
| cz-oma | Omaha, NE | NE | Seasonal agricultural gap |

---

## Additional Endpoints

| Endpoint | Purpose |
|----------|---------|
| `getActiveZones` | Simplified zone list with role filtering |
| `getZoneDetail` | Single zone with fuel + weather enrichment |
| `getDriverOpportunities` | Nearby zones from a lat/lng position |
| `getSurgeHistory` | Hourly surge/rate/ratio history (DB + baseline) |
| `getZonesByEquipment` | Filter zones by equipment type |
| `getZonesByRegion` | Filter zones by US region |
| `subscribe` / `unsubscribe` | Zone alert subscriptions |
| `getPredictions` | Rate/surge predictions (time-series baseline) |
| `getHeatmapData` | Raw heatmap points for map visualization |
| `getTopLanes` | Highest-rate origin-destination lanes |
| `getMarketPulse` | Market summary statistics |

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React 18 + Vite |
| State/Data | tRPC + React Query (10s polling) |
| Map Rendering | Custom SVG (no map library dependency) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Tailwind CSS |
| Backend | Node.js + tRPC |
| Database | MySQL (Drizzle ORM) |
| Authentication | JWT (role-based) |
| External APIs | EIA (fuel), NWS (weather) |
| Deployment | Azure App Service |
| Caching | In-memory TTL cache |

---

## Key Design Principles

1. **Role-First Architecture**: The user's role determines everything — what data they see, how zones are sorted, which zones are visible, what metrics matter, and what actions are available.

2. **Live + Baseline Hybrid**: Real platform data overlays static baselines. When the platform has data, it's used. When it doesn't, industry-standard baselines ensure the map is never empty.

3. **External API Enrichment**: Government data (EIA fuel prices, NWS weather) adds real-world context that no internal database can provide.

4. **Zero-Dependency Map**: The SVG map has no Google Maps, Mapbox, or Leaflet dependency. It's a custom projection with state outlines, highways, and cities — fully self-contained, fast, and free.

5. **Progressive Disclosure**: Low zoom shows the big picture. Medium zoom reveals city labels and highway names. High zoom shows state abbreviations, equipment tags, and detailed metrics.

6. **Turbocharge, Not Overwhelm**: Each role gets exactly 3 metrics per zone, a curated pulse bar, role-specific sorting, and filtered zones. More data, less noise.

---

*Built by Eusorone Technologies Inc. — EusoTrip Platform*
*Last updated: February 2026*
