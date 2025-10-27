# Team Gamma Microservice API Specification for Team Alpha Integration

**TO:** Team Alpha (Core Platform & Backend)
**FROM:** Team Gamma (Specialized Systems & AI)
**DATE:** October 27, 2025
**SUBJECT:** API Specifications for ESANG AI-Powered Microservices

Team Gamma has completed the core development of the six specialized microservices as mandated. These services are now ready for integration into the core EusoTrip backend API structure.

---

## 1. Hazmat/ERG Compliance Microservice

**Base Path:** `/api/v1/gamma/hazmat-erg` (Suggested)
**Core Logic:** Hazmat identification, ERG guidance, Critical Alert Triggering.

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/status` | `GET` | Returns the operational status of the service and the ESANG AI ERG model. | None | `{ "service_name": "...", "status": "Operational", "esang_ai_status": { ... } }` |
| `/check` | `POST` | Identifies a material by UN number and returns its Hazmat classification and associated ERG guide number. | `{ "un_number": "string", "location": "string", "spill_size": "optional string" }` | `{ "is_hazmat": boolean, "classification": "string", "guide_number": "string", "ai_status": "string" }` |
| `/guidance` | `POST` | Retrieves the full Emergency Response Guide (ERG) content for a given UN number, enhanced by ESANG AI decision support. | `{ "un_number": "string", "location": "string", "spill_size": "optional string" }` | `{ "un_number": "string", "material_name": "string", "erg_guide_number": "string", "ai_confidence": float, "sections": { ... } }` |
| `/incident/log` | `POST` | **Critical Alert Endpoint:** Logs a Hazmat incident and simulates triggering a critical alert (e.g., via Amazon Pinpoint). | `{ "un_number": "string", "location": "string", "driver_id": "string", "timestamp": "string" }` | `{ "message": "...", "incident_id": "..." }` |

---

## 2. Spectra-Match™ Oil Identification Microservice

**Base Path:** `/api/v1/gamma/spectra-match` (Suggested)
**Core Logic:** Crude oil grade identification based on physical parameters.

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/status` | `GET` | Returns the operational status of the service and the ESANG AI Spectra-Match model. | None | `{ "service_name": "...", "status": "Operational", "loaded_specs": int, "esang_ai_status": { ... } }` |
| `/identify` | `POST` | Identifies the crude oil grade by matching input parameters (API Gravity, Sulfur, etc.) against the internal specification database using the Adaptive Parameter Weighting (APW) algorithm. | `{ "api_gravity": float, "sulfur_content": float, "bsw": float, "temperature": float, "salt_content": "optional float", ... }` | `{ "input_parameters": { ... }, "ai_status": "string", "matches": [ { "grade": "string", "match_score": float, "confidence_level": "string", ... } ] }` |

---

## 3. PSO-Inspired Gamification Engine Microservice

**Base Path:** `/api/v1/gamma/gamification` (Suggested)
**Core Logic:** Performance tracking, achievement unlocking, and leaderboard management.

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/status` | `GET` | Returns the operational status of the Gamification service. | None | `{ "service_name": "...", "status": "Operational", "engine_version": "..." }` |
| `/process-metrics` | `POST` | Processes a user's performance metrics, calculates experience, and checks for achievement unlocks. | `{ "user_id": "string", "on_time_delivery_rate": float, "incident_free_loads": int, "fuel_efficiency_score": float, "safety_rating": float, "loads_completed": int }` | `{ "user_id": "string", "current_level": int, "total_experience": int, "section_id": "string", "reputation_score": float, "unlocked_achievements": [ ... ] }` |
| `/leaderboard` | `GET` | Simulates fetching the top 10 users from the global leaderboard. | None | `{ "leaderboard": [ { "user_id": "string", "level": int, "xp": int, "section_id": "string" } ], "timestamp": "string" }` |

---

## 4. Geolocation Intelligence Microservice

**Base Path:** `/api/v1/gamma/geolocation` (Suggested)
**Core Logic:** Real-time tracking analysis, geofencing, and route deviation alerts.

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/status` | `GET` | Returns the operational status of the service. | None | `{ "service_name": "...", "status": "Operational", "geofences_monitored": int }` |
| `/track-update` | `POST` | Receives a real-time location update and performs geofencing and route deviation analysis. | `{ "load_id": "string", "current_location": { "latitude": float, "longitude": float, "timestamp": "datetime" }, "planned_route_id": "string" }` | `{ "load_id": "string", "ai_status": "string", "geofence_alert": { "alert_type": "string", "message": "string", ... } or null }` |
| `/geofences` | `GET` | Returns the list of currently monitored geofences. | None | `{ "geofences": { ... } }` |

---

## 5. Load Optimization Microservice

**Base Path:** `/api/v1/gamma/optimization` (Suggested)
**Core Logic:** Intelligent load matching and hazmat-compliant route calculation.

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/status` | `GET` | Returns the operational status of the service. | None | `{ "service_name": "...", "status": "Operational", "algorithm_version": "..." }` |
| `/match-loads` | `POST` | Implements EsangAI.matchLoadsToDrivers for intelligent load assignment. | `{ "loads": [ { "load_id": "string", "hazmat_class": "string", "origin_lat": float, ... } ], "drivers": [ { "driver_id": "string", "hazmat_certifications": [ "string" ], ... } ] }` | `[ { "load_id": "string", "driver_id": "string", "match_score": float, "reasoning": "string" } ]` |
| `/calculate-route` | `POST` | Implements EsangAI.calculateHazmatRoute for hazmat-compliant route planning. | `{ "load_id": "string", "hazmat_class": "string", "origin_lat": float, "origin_lon": float, "destination_lat": float, "destination_lon": float, ... }` | `{ "route_id": "string", "distance_km": float, "is_hazmat_compliant": bool, "hazmat_restrictions_avoided": [ "string" ], "optimal_fuel_stops": int, ... }` |

---

**Next Steps:**

This specification, along with the source code for all six microservices, is being committed to the repository for immediate access by Team Alpha. Please confirm receipt and provide any further instructions.
