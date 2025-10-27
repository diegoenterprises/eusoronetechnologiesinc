from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import json
import os
from datetime import datetime

# Import the ESANG AI Core for decision support
from esang_ai_core import esang_core

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('HAZMAT_ERG_SERVICE')

# --- 1. Data Models (Pydantic) ---

class HazmatQuery(BaseModel):
    un_number: str
    location: str
    spill_size: Optional[str] = "small"
    material_state: Optional[str] = "liquid"
    
class ERGResponse(BaseModel):
    un_number: str
    material_name: str
    erg_guide_number: str
    ai_confidence: float
    sections: Dict[str, Any]
    
class HazmatCheckResponse(BaseModel):
    is_hazmat: bool
    classification: Optional[str] = None
    guide_number: Optional[str] = None
    ai_status: str
    
# --- 2. ERG Data Simulation (In a real system, this would be a database lookup) ---

# Load simulated ERG data from the uploaded files
# NOTE: The erg_parser.py was designed to process a PDF, but since we don't have the PDF,
# we will simulate the *result* of the parser using the logic it implies.

def load_simulated_erg_data():
    """Simulates loading the parsed ERG data."""
    # Based on erg_parser.py, we expect a mapping from UN/NA number to a guide number
    un_to_guide = {
        "1203": "128", # Gasoline
        "1993": "128", # Flammable liquid, n.o.s.
        "1005": "125", # Ammonia, anhydrous
        "3082": "171", # Environmentally hazardous substance, liquid, n.o.s.
        "1267": "128", # Petroleum crude oil
        "1830": "137"  # Sulfuric acid
    }
    
    # Simulate content for a few guides (Orange Section)
    guide_content = {
        "128": {
            "guide": "128",
            "material_name": "FLAMMABLE LIQUIDS (Non-Polar/Water-Immiscible)",
            "sections": {
                "potential_hazards": "HIGHLY FLAMMABLE. Vapors may form explosive mixtures with air. Vapors are heavier than air and may spread along ground.",
                "public_safety": "CALL EMERGENCY RESPONSE TELEPHONE NUMBER. Isolate spill or leak area immediately for at least 50 meters (150 feet) in all directions.",
                "emergency_response": "FIRE: Dry chemical, CO2, water spray or regular foam. SPILL: Eliminate all ignition sources. Absorb with earth, sand or other non-combustible material."
            }
        },
        "125": {
            "guide": "125",
            "material_name": "GASES, TOXIC and/or CORROSIVE",
            "sections": {
                "potential_hazards": "TOXIC; may be fatal if inhaled or absorbed through skin. Contact with gas or liquefied gas may cause burns, severe injury and/or frostbite.",
                "public_safety": "EVACUATE immediately in all directions for 500 meters (1/3 mile).",
                "emergency_response": "FIRE: Do not extinguish fire unless flow can be stopped. Use water spray to keep fire-exposed containers cool."
            }
        }
    }
    
    return un_to_guide, guide_content

UN_TO_GUIDE, GUIDE_CONTENT = load_simulated_erg_data()

# --- 3. FastAPI Application ---

app = FastAPI(
    title="Team Gamma: Hazmat/ERG Compliance Microservice",
    description="Provides real-time Hazmat identification and Emergency Response Guide (ERG) guidance, powered by ESANG AI.",
    version="1.0.0"
)

# Dependency to simulate database connection (as per marching orders)
def get_db_connection():
    """Simulates a dependency for database access (DynamoDB/PostgreSQL)."""
    # In a real scenario, this would yield a connection object
    logger.debug("Simulating DB connection...")
    yield True

# --- 4. API Endpoints ---

@app.get("/hazmat/status")
async def get_service_status():
    """Returns the operational status of the Hazmat/ERG service and its AI components."""
    ai_status = esang_core.get_model_status()
    return {
        "service_name": "Hazmat/ERG Compliance Service",
        "status": "Operational",
        "last_update": datetime.now().isoformat(),
        "esang_ai_status": ai_status['erg_ai_model']
    }

@app.post("/hazmat/check", response_model=HazmatCheckResponse)
async def hazmat_identification(query: HazmatQuery, db=Depends(get_db_connection)):
    """
    Identifies a material by UN number and returns its Hazmat classification 
    and associated ERG guide number.
    """
    un_number = query.un_number
    
    if un_number in UN_TO_GUIDE:
        guide_number = UN_TO_GUIDE[un_number]
        
        # Simulate AI decision support processing
        ai_response = esang_core.process_data(query.dict(), "HAZMAT_ERG")
        
        return HazmatCheckResponse(
            is_hazmat=True,
            classification="HAZMAT Class 3 (Flammable Liquid)", # Simplified classification
            guide_number=guide_number,
            ai_status=f"AI Confidence: {ai_response.get('confidence_score')}%"
        )
    else:
        # Simulate AI decision support processing for unknown material
        ai_response = esang_core.process_data(query.dict(), "HAZMAT_ERG")
        
        return HazmatCheckResponse(
            is_hazmat=False,
            ai_status=f"AI Processed Unknown Material. {ai_response.get('ai_status')}"
        )

@app.post("/erg/guidance", response_model=ERGResponse)
async def get_erg_guidance(query: HazmatQuery, db=Depends(get_db_connection)):
    """
    Retrieves the full Emergency Response Guide (ERG) content for a given UN number, 
    enhanced by ESANG AI decision support.
    """
    un_number = query.un_number
    
    if un_number not in UN_TO_GUIDE:
        raise HTTPException(status_code=404, detail=f"UN Number {un_number} not found in ERG database.")
        
    guide_number = UN_TO_GUIDE[un_number]
    
    if guide_number not in GUIDE_CONTENT:
        raise HTTPException(status_code=500, detail=f"ERG Guide {guide_number} content missing.")
        
    guide_data = GUIDE_CONTENT[guide_number]
    
    # Simulate AI decision support processing
    ai_response = esang_core.process_data(query.dict(), "HAZMAT_ERG")
    
    return ERGResponse(
        un_number=un_number,
        material_name=guide_data['material_name'],
        erg_guide_number=guide_number,
        ai_confidence=ai_response.get('confidence_score', 0.0),
        sections=guide_data['sections']
    )

# --- 5. Integration with Team Alpha (Simulated) ---

@app.post("/hazmat/incident/log")
async def log_incident(incident_data: Dict[str, Any], db=Depends(get_db_connection)):
    """
    Endpoint for Team Alpha/Delta to log a Hazmat incident, triggering a critical alert.
    This simulates the use of Amazon Pinpoint for critical alerts.
    """
    logger.warning(f"CRITICAL INCIDENT LOGGED: UN={incident_data.get('un_number')}, Location={incident_data.get('location')}")
    # Here, we would integrate with Amazon Pinpoint to send an immediate push notification
    # to all relevant mobile users (Team Delta's domain).
    return {
        "message": "Incident logged successfully. Critical alert triggered via simulated Amazon Pinpoint integration.",
        "incident_id": f"INC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }

# To run: uvicorn hazmat_erg_service:app --host 0.0.0.0 --port 8000

