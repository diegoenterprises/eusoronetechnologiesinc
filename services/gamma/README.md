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
