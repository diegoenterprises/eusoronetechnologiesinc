from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime
import random

# Import the ESANG AI Core for decision support
from esang_ai_core import esang_core

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('GEOLOCATION_SERVICE')

# --- 1. Data Models (Pydantic) ---

class Location(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    speed_kph: Optional[float] = 0.0

class RouteCheck(BaseModel):
    load_id: str
    current_location: Location
    planned_route_id: str
    
class GeofenceAlert(BaseModel):
    alert_type: str
    location: Location
    message: str
    confidence: float

# --- 2. Geolocation Logic Simulation ---

# Simulated Geofence Database (e.g., Refinery, Restricted Zone)
GEOFENCES = {
    "REF_HOUSTON": {"lat": 29.7604, "lon": -95.3698, "radius_km": 5.0, "type": "Refinery"},
    "RESTRICTED_ZONE_LA": {"lat": 34.0522, "lon": -118.2437, "radius_km": 2.0, "type": "Restricted"},
}

def check_geofence_violation(location: Location) -> Optional[GeofenceAlert]:
    """Simulates checking for geofence violations (e.g., unauthorized entry or deviation)."""
    
    # Simple distance check simulation
    for name, fence in GEOFENCES.items():
        # In a real system, this would be a complex Haversine distance calculation
        # For simulation, we check if the location is near the restricted zone LA
        if name == "RESTRICTED_ZONE_LA" and abs(location.latitude - fence["lat"]) < 0.01 and abs(location.longitude - fence["lon"]) < 0.01:
            return GeofenceAlert(
                alert_type="Geofence Violation",
                location=location,
                message=f"Unauthorized entry into {name} (Restricted Zone LA).",
                confidence=0.99
            )
            
    # Simulate a random route deviation alert for demonstration
    if random.random() < 0.05:
        return GeofenceAlert(
            alert_type="Route Deviation Alert",
            location=location,
            message=f"Significant route deviation detected for load {location.latitude}. ESANG AI is re-optimizing.",
            confidence=0.85
        )
        
    return None

# --- 3. FastAPI Application ---

app = FastAPI(
    title="Team Gamma: Geolocation Intelligence Microservice",
    description="Provides advanced location services, geofencing, and route deviation intelligence, feeding data back into the Load Management system.",
    version="1.0.0"
)

# Dependency to simulate database connection
def get_db_connection():
    """Simulates a dependency for database access (DynamoDB/PostgreSQL)."""
    yield True

# --- 4. API Endpoints ---

@app.get("/geolocation/status")
async def get_service_status():
    """Returns the operational status of the Geolocation service."""
    return {
        "service_name": "Geolocation Intelligence Service",
        "status": "Operational",
        "last_update": datetime.now().isoformat(),
        "geofences_monitored": len(GEOFENCES)
    }

@app.post("/geolocation/track-update", response_model=Dict[str, Any])
async def track_update(update: RouteCheck, db=Depends(get_db_connection)):
    """
    Receives a real-time location update and performs geofencing and route deviation analysis.
    """
    
    # 1. ESANG AI Processing (Pattern Recognition)
    ai_data = {"load_id": update.load_id, "location": update.current_location.dict()}
    ai_response = esang_core.process_data(ai_data, "GEOLOCATION_INTELLIGENCE")
    
    # 2. Geofence/Deviation Check
    alert = check_geofence_violation(update.current_location)
    
    response = {
        "load_id": update.load_id,
        "timestamp": datetime.now().isoformat(),
        "ai_status": ai_response.get("ai_status"),
        "geofence_alert": alert.dict() if alert else None
    }
    
    if alert:
        logger.warning(f"ALERT: {alert.message} at {update.current_location.latitude}, {update.current_location.longitude}")
        # Here, we would send the alert back to Team Alpha's core API for logging and notification
        
    return response

@app.get("/geolocation/geofences", response_model=Dict[str, Any])
async def get_geofence_list():
    """Returns the list of currently monitored geofences."""
    return {"geofences": GEOFENCES}

# To run: uvicorn geolocation_intelligence_service:app --host 0.0.0.0 --port 8003

