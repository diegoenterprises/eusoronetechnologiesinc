# EusoTrip AI Sidecar

Python FastAPI microservice that provides AI-powered capabilities to the EusoTrip Node.js backend via HTTP. All tools are MIT/permissively-licensed open-source libraries.

## Architecture

```
┌─────────────────────┐     HTTP/JSON      ┌──────────────────────┐
│  Node.js Backend     │ ◄──────────────►  │  Python AI Sidecar   │
│  (aiSidecar.ts)      │   port 8091       │  (FastAPI + uvicorn) │
│                      │                    │                      │
│  documentOCR.ts      │                    │  /ocr/*    Docling   │
│  rateSheetDigitizer  │                    │           PaddleOCR  │
│  routeIntelligence   │                    │  /route/* OSRM       │
│  mlEngine.ts         │                    │           OR-Tools   │
│  support.ts          │                    │  /nlp/*   spaCy      │
│  loads.ts            │                    │  /forecast/* Darts   │
│  marketDataService   │                    │              Prophet │
│  hotZones.ts         │                    │  /analytics/* DuckDB │
└─────────────────────┘                    └──────────────────────┘
```

**Key design principle:** Every TypeScript caller wraps sidecar calls in `try/catch` and falls back gracefully if the sidecar is offline. The platform runs fine without it — the sidecar only enhances.

## Quick Start

### Local Development

```bash
cd frontend/server/ai-sidecar

# Create virtualenv
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Run server
uvicorn main:app --host 0.0.0.0 --port 8091 --reload
```

### Docker

```bash
docker build -t eusotrip-ai-sidecar .
docker run -p 8091:8091 eusotrip-ai-sidecar
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AI_SIDECAR_PORT` | `8091` | Server port |
| `OSRM_URL` | `http://router.project-osrm.org` | OSRM routing server URL |
| `DUCKDB_PATH` | `:memory:` | DuckDB database path (`:memory:` or file path) |

## API Reference

### Health Check

```
GET /health
```

Returns model availability status:

```json
{
  "status": "ok",
  "service": "eusotrip-ai-sidecar",
  "models": {
    "spacy": true,
    "paddleocr": false,
    "docling": true,
    "darts": true,
    "prophet": true,
    "ortools": true,
    "duckdb": true
  }
}
```

---

### OCR / Document Processing

#### `POST /ocr/extract`

Extract text from document images or PDFs.

| Field | Type | Required | Description |
|---|---|---|---|
| `image_base64` | string | ✅ | Base64-encoded file |
| `mime_type` | string | ✅ | `image/png`, `image/jpeg`, `application/pdf` |
| `engine` | string | | `auto` (default), `docling`, `paddle` |
| `extract_tables` | bool | | Extract table structures (default: `true`) |

**Response:** `{ success, engine, text, lines[], tables[], avg_confidence }`

#### `POST /ocr/bol`

Extract structured Bill of Lading fields from a scanned document.

| Field | Type | Required |
|---|---|---|
| `image_base64` | string | ✅ |
| `mime_type` | string | ✅ |

**Response:** `{ success, fields: { shipper_name, consignee_name, bol_number, ... }, raw_text, confidence }`

#### `POST /ocr/ratesheet`

Extract structured rate tiers and surcharges from a rate sheet PDF/image.

| Field | Type | Required |
|---|---|---|
| `file_base64` | string | ✅ |
| `mime_type` | string | ✅ |

**Response:** `{ success, rate_tiers[], surcharges{}, metadata{}, raw_text }`

---

### Route Optimization

#### `POST /route/directions`

Get driving directions between two points via OSRM.

| Field | Type | Required | Description |
|---|---|---|---|
| `origin` | `{lat, lng}` | ✅ | Start point |
| `destination` | `{lat, lng}` | ✅ | End point |
| `profile` | string | | `driving` (default) |
| `alternatives` | bool | | Return alternative routes |
| `steps` | bool | | Include turn-by-turn steps |

**Response:** `{ success, distance_miles, duration_hours, duration_minutes, geometry, steps[], alternatives[] }`

#### `POST /route/matrix`

Get distance/duration matrix between all location pairs.

| Field | Type | Required |
|---|---|---|
| `locations` | `{lat, lng}[]` | ✅ (2–100 points) |

**Response:** `{ success, distances[][], durations[][] }`

#### `POST /route/optimize`

Solve multi-stop Vehicle Routing Problem (VRP) using OR-Tools.

| Field | Type | Required | Description |
|---|---|---|---|
| `depot` | `{lat, lng}` | ✅ | Starting location |
| `stops` | `{lat, lng, name?}[]` | ✅ | Delivery stops |
| `vehicle_capacity` | int | | Max load per vehicle (default: 1000) |
| `stop_demands` | int[] | | Demand at each stop |
| `max_vehicles` | int | | Max vehicles (default: 1) |
| `max_route_time_minutes` | int | | HOS limit (default: 660 = 11h) |

**Response:** `{ success, routes[], total_distance_miles, total_duration_hours, unassigned_stops[] }`

---

### NLP / Entity Extraction

#### `POST /nlp/entities`

Extract named entities from text using spaCy NER.

| Field | Type | Required |
|---|---|---|
| `text` | string | ✅ |
| `entity_types` | string[] | Filter to specific types (e.g. `["GPE", "DATE"]`) |

**Response:** `{ success, entities: [{ text, label, start, end, confidence }] }`

#### `POST /nlp/parse-load`

Parse a natural language load search query into structured fields.

| Field | Type | Required |
|---|---|---|
| `query` | string | ✅ |

**Response:**
```json
{
  "success": true,
  "parsed": {
    "origin": "Houston",
    "destination": "Chicago",
    "equipment": "FLATBED",
    "max_rate": 3.0,
    "hazmat": false,
    "keywords": ["next", "week"]
  },
  "entities": [...]
}
```

#### `POST /nlp/classify`

Classify text into categories (support tickets, document types, etc).

| Field | Type | Required |
|---|---|---|
| `text` | string | ✅ |
| `categories` | string[] | Custom categories (default: billing, technical, compliance, etc.) |

**Response:** `{ success, category, confidence, scores{} }`

---

### Demand Forecasting

#### `POST /forecast/demand`

Forecast weekly load volume for a lane. Uses **Darts → Prophet → built-in exponential smoothing** (fallback chain).

| Field | Type | Required | Description |
|---|---|---|---|
| `lane` | string | ✅ | e.g. `"TX-IL"` |
| `history` | `{date, value}[]` | ✅ | ≥4 weekly data points |
| `horizon_weeks` | int | | Weeks to forecast (default: 4) |
| `include_confidence` | bool | | Include confidence intervals |

**Response:** `{ success, lane, forecast[], trend, seasonal_factor, model_used }`

#### `POST /forecast/rates`

Forecast rate-per-mile trends for a lane. Same engine chain.

| Field | Type | Required |
|---|---|---|
| `lane` | string | ✅ |
| `history` | `{date, value}[]` | ✅ |
| `horizon_weeks` | int | |

**Response:** `{ success, lane, forecast[], trend, volatility, model_used }`

#### `POST /forecast/seasonal`

Decompose a time series into trend, seasonal, and residual components.

| Field | Type | Required |
|---|---|---|
| `history` | `{date, value}[]` | ✅ (≥ `period` points) |
| `period` | int | Annual cycle length (default: 52 for weekly) |

**Response:** `{ success, trend[], seasonal[], residual[], seasonal_strength }`

---

### Analytics (DuckDB)

#### `POST /analytics/query`

Run a **read-only** SQL query on DuckDB. Only `SELECT`/`WITH` statements allowed.

| Field | Type | Required |
|---|---|---|
| `sql` | string | ✅ |
| `params` | any[] | Parameterized values |
| `max_rows` | int | Limit results (default: 1000) |

**Response:** `{ success, columns[], rows[][], row_count, execution_ms }`

#### `POST /analytics/ingest`

Ingest data into a DuckDB table for offline analytics.

| Field | Type | Required |
|---|---|---|
| `table_name` | string | ✅ |
| `columns` | string[] | ✅ |
| `rows` | any[][] | ✅ |
| `replace` | bool | Drop and recreate table (default: false) |

**Response:** `{ success, rows_ingested }`

#### `POST /analytics/aggregate`

Run pre-built aggregation queries optimized for logistics analytics.

| Field | Type | Required | Description |
|---|---|---|---|
| `query_type` | string | ✅ | `lane_stats`, `carrier_perf`, `weekly_volume`, `rate_distribution` |
| `filters` | object | | Additional filters |
| `limit` | int | | Max results (default: 50) |

**Response:** `{ success, query_type, results[], summary{} }`

---

## TypeScript Client

All sidecar endpoints are accessible via `server/services/aiSidecar.ts`:

```typescript
import { ocrExtract, getDirections, parseLoadQuery, forecastDemand, analyticsQuery } from "./aiSidecar";

// All methods return null if sidecar is unavailable
const ocr = await ocrExtract(base64Data, "image/png");
const route = await getDirections({ lat: 29.76, lng: -95.37 }, { lat: 32.78, lng: -96.80 });
const parsed = await parseLoadQuery("flatbed from Houston to Chicago under $3/mile");
const forecast = await forecastDemand("TX-IL", history, 4);
const analytics = await analyticsQuery("SELECT * FROM loads LIMIT 10");
```

## Running Tests

```bash
cd frontend/server/ai-sidecar
pip install pytest
pytest tests/ -v
```

## Open-Source Libraries Used

| Library | License | Purpose |
|---|---|---|
| [Docling](https://github.com/DS4SD/docling) | MIT | Structured document extraction with tables |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Apache-2.0 | High-accuracy OCR with layout analysis |
| [OSRM](https://github.com/Project-OSRM/osrm-backend) | BSD-2 | Real driving distance and routing |
| [OR-Tools](https://github.com/google/or-tools) | Apache-2.0 | Vehicle Routing Problem (VRP) optimization |
| [spaCy](https://github.com/explosion/spaCy) | MIT | Named entity recognition and NLP |
| [Darts](https://github.com/unit8co/darts) | Apache-2.0 | Time series forecasting |
| [Prophet](https://github.com/facebook/prophet) | MIT | Seasonality-aware forecasting |
| [DuckDB](https://github.com/duckdb/duckdb) | MIT | Fast in-process OLAP analytics |
| [Polars](https://github.com/pola-rs/polars) | MIT | High-performance DataFrames |
