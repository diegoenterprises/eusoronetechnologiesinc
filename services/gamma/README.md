# Team Gamma: Hazmat/ERG Compliance Microservice (First Major Commit)

**Service Name:** `hazmat_erg_service`
**Team:** Gamma (Specialized Systems & AI)
**Language/Framework:** Python / FastAPI
**Core Logic Files:** `esang_ai_core.py`, `hazmat_erg_service.py`
**IP Integrated:** `5.ESANGAI™INTELLIGENCELAYER`, `erg-ai-architecture.md`, `erg_parser.py` (simulated data)

## API Endpoints for Team Alpha Integration

This microservice provides the core Hazmat identification and ERG guidance logic, powered by the ESANG AI Core.

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/hazmat/status` | `GET` | Returns the operational status of the service and the ESANG AI ERG model. | None | `{ "service_name": "...", "status": "Operational", "esang_ai_status": { ... } }` |
| `/hazmat/check` | `POST` | Identifies a material by UN number and returns its Hazmat classification and associated ERG guide number. | `{ "un_number": "string", "location": "string", "spill_size": "optional string" }` | `{ "is_hazmat": boolean, "classification": "string", "guide_number": "string", "ai_status": "string" }` |
| `/erg/guidance` | `POST` | Retrieves the full Emergency Response Guide (ERG) content for a given UN number, enhanced by ESANG AI decision support. | `{ "un_number": "string", "location": "string", "spill_size": "optional string" }` | `{ "un_number": "string", "material_name": "string", "erg_guide_number": "string", "ai_confidence": float, "sections": { ... } }` |
| `/hazmat/incident/log` | `POST` | **Critical Alert Endpoint:** Logs a Hazmat incident and simulates triggering a critical alert (e.g., via Amazon Pinpoint). Team Alpha/Delta should call this on incident detection. | `{ "un_number": "string", "location": "string", "driver_id": "string", "timestamp": "string" }` | `{ "message": "...", "incident_id": "..." }` |

## Deployment Notes

*   **Technology Stack:** Python 3.11, FastAPI, Uvicorn.
*   **Dependencies:** `fastapi`, `uvicorn`, `pydantic`.
*   **Execution:** `uvicorn hazmat_erg_service:app --host 0.0.0.0 --port 8000`
*   **AI Integration:** The service imports and utilizes `esang_ai_core.py` to provide AI confidence scores and decision support, fulfilling the **ESANG AI Intelligence Layer** mandate.

**This service is ready for integration testing by Team Alpha.**


## Spectra-Match™ Oil Identification Microservice

**Service Name:** `spectra_match_service`
**IP Integrated:** `spectra-match-patent-guide.md`, `ultimate-crude-oil-spec-guide.md`

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/spectra-match/status` | `GET` | Returns the operational status of the service and the ESANG AI Spectra-Match model. | None | `{ "service_name": "...", "status": "Operational", "loaded_specs": int, "esang_ai_status": { ... } }` |
| `/spectra-match/identify` | `POST` | Identifies the crude oil grade by matching input parameters (API Gravity, Sulfur, etc.) against the internal specification database using the Adaptive Parameter Weighting (APW) algorithm. | `{ "api_gravity": float, "sulfur_content": float, "bsw": float, "temperature": float, ... }` | `{ "input_parameters": { ... }, "ai_status": "string", "matches": [ { "grade": "string", "match_score": float, ... } ] }` |

## PSO-Inspired Gamification Engine Microservice

**Service Name:** `gamification_engine_service`
**IP Integrated:** `pso-inspired-eusotrip-gamification.py`, `enhanced-gamification-routes.py`

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/gamification/status` | `GET` | Returns the operational status of the Gamification service. | None | `{ "service_name": "...", "status": "Operational", "engine_version": "..." }` |
| `/gamification/process-metrics` | `POST` | Processes a user's performance metrics, calculates experience, and checks for achievement unlocks. | `{ "user_id": "string", "on_time_delivery_rate": float, "incident_free_loads": int, ... }` | `{ "user_id": "string", "current_level": int, "total_experience": int, "unlocked_achievements": [ ... ] }` |
| `/gamification/leaderboard` | `GET` | Simulates fetching the top 10 users from the global leaderboard. | None | `{ "leaderboard": [ ... ], "timestamp": "string" }` |

**All services are now ready for Team Alpha integration and integration testing.**


## Geolocation Intelligence Microservice

**Service Name:** `geolocation_intelligence_service`
**IP Integrated:** `geolocation_intelligence_framework.md`

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/geolocation/status` | `GET` | Returns the operational status of the service. | None | `{ "service_name": "...", "status": "Operational", "geofences_monitored": int }` |
| `/geolocation/track-update` | `POST` | Receives a real-time location update and performs geofencing and route deviation analysis. | `{ "load_id": "string", "current_location": { "latitude": float, "longitude": float, "timestamp": "datetime" }, "planned_route_id": "string" }` | `{ "load_id": "string", "ai_status": "string", "geofence_alert": { ... } or null }` |
| `/geolocation/geofences` | `GET` | Returns the list of currently monitored geofences. | None | `{ "geofences": { ... } }` |

## Load Optimization Microservice

**Service Name:** `load_optimization_service`
**IP Integrated:** `fuel-loading-algorithm.txt`

| Endpoint | Method | Description | Request Body (JSON) | Response Body (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/optimization/status` | `GET` | Returns the operational status of the service. | None | `{ "service_name": "...", "status": "Operational", "algorithm_version": "..." }` |
| `/optimization/match-loads` | `POST` | Implements EsangAI.matchLoadsToDrivers for intelligent load assignment based on certifications, safety, and proximity. | `{ "loads": [ { ... } ], "drivers": [ { ... } ] }` | `[ { "load_id": "string", "driver_id": "string", "match_score": float, "reasoning": "string" } ]` |
| `/optimization/calculate-route` | `POST` | Implements EsangAI.calculateHazmatRoute for hazmat-compliant route planning, avoiding restrictions. | `{ "load_id": "string", "hazmat_class": "string", "origin_lat": float, "origin_lon": float, "destination_lat": float, "destination_lon": float, ... }` | `{ "route_id": "string", "distance_km": float, "is_hazmat_compliant": bool, "hazmat_restrictions_avoided": [ "string" ], ... }` |

**All six core specialized microservices are now complete and ready for Team Alpha integration.**
