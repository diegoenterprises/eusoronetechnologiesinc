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
logger = logging.getLogger('LOAD_OPTIMIZATION_SERVICE')

# --- 1. Data Models (Pydantic) ---

class Load(BaseModel):
    load_id: str
    hazmat_class: str
    quantity: float
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    price: float
    
class Driver(BaseModel):
    driver_id: str
    current_lat: float
    current_lon: float
    hazmat_certifications: List[str]
    safety_rating: float

class LoadMatch(BaseModel):
    load_id: str
    driver_id: str
    match_score: float
    reasoning: str

class Route(BaseModel):
    route_id: str
    distance_km: float
    duration_hrs: float
    is_hazmat_compliant: bool
    hazmat_restrictions_avoided: List[str]
    optimal_fuel_stops: int

# --- 2. Load Optimization Logic Simulation ---

def simulate_load_matching(loads: List[Load], drivers: List[Driver]) -> List[LoadMatch]:
    """
    Simulates the EsangAI.matchLoadsToDrivers function from fuel-loading-algorithm.txt.
    Logic: Prioritize drivers with matching certifications and high safety ratings.
    """
    matches = []
    
    for load in loads:
        best_match_score = -1.0
        best_driver = None
        
        for driver in drivers:
            score = 0.0
            
            # 1. Certification Match (High Weight)
            if load.hazmat_class in driver.hazmat_certifications:
                score += 50.0
            
            # 2. Safety Rating (Medium Weight)
            score += driver.safety_rating * 30.0
            
            # 3. Proximity to Origin (Low Weight - simplified)
            distance_score = 20.0 * (1 - (abs(driver.current_lat - load.origin_lat) + abs(driver.current_lon - load.origin_lon)) / 100)
            score += max(0, distance_score)
            
            if score > best_match_score:
                best_match_score = score
                best_driver = driver
        
        if best_driver and best_match_score > 50.0:
            matches.append(LoadMatch(
                load_id=load.load_id,
                driver_id=best_driver.driver_id,
                match_score=round(best_match_score, 2),
                reasoning=f"High match due to {load.hazmat_class} certification and safety rating of {best_driver.safety_rating}."
            ))
            
    return matches

def simulate_hazmat_route_calculation(load: Load) -> Route:
    """
    Simulates the EsangAI.calculateHazmatRoute function from fuel-loading-algorithm.txt.
    Logic: Calculates an optimal, compliant route.
    """
    
    # Simulate a compliant route calculation
    is_compliant = "FLAMMABLE" not in load.hazmat_class
    
    restrictions = []
    if not is_compliant:
        restrictions.append("Tunnel Avoidance (Hazmat Class 3)")
        restrictions.append("Population Density Restriction")
        
    return Route(
        route_id=f"ROUTE-{load.load_id}-{random.randint(1000, 9999)}",
        distance_km=random.uniform(500, 2000),
        duration_hrs=random.uniform(8, 30),
        is_hazmat_compliant=is_compliant,
        hazmat_restrictions_avoided=restrictions,
        optimal_fuel_stops=random.randint(1, 4)
    )

# --- 3. FastAPI Application ---

app = FastAPI(
    title="Team Gamma: Load Optimization Microservice",
    description="Provides AI-driven load matching and hazmat-compliant route calculation, fulfilling the core logic of the Load Lifecycle.",
    version="1.0.0"
)

# Dependency to simulate database connection
def get_db_connection():
    """Simulates a dependency for database access (DynamoDB/PostgreSQL)."""
    yield True

# --- 4. API Endpoints ---

@app.get("/optimization/status")
async def get_service_status():
    """Returns the operational status of the Load Optimization service."""
    return {
        "service_name": "Load Optimization Service",
        "status": "Operational",
        "last_update": datetime.now().isoformat(),
        "algorithm_version": "FuelLoading v1.0"
    }

@app.post("/optimization/match-loads", response_model=List[LoadMatch])
async def match_loads_to_drivers(data: Dict[str, List[Dict[str, Any]]], db=Depends(get_db_connection)):
    """
    Implements EsangAI.matchLoadsToDrivers for intelligent load assignment.
    """
    try:
        loads = [Load(**l) for l in data.get("loads", [])]
        drivers = [Driver(**d) for d in data.get("drivers", [])]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data format: {e}")

    # Simulate ESANG AI decision support processing
    ai_data = {"loads_count": len(loads), "drivers_count": len(drivers)}
    ai_response = esang_core.process_data(ai_data, "LOAD_MATCHING_AI")
    
    matches = simulate_load_matching(loads, drivers)
    
    logger.info(f"Load matching completed. Found {len(matches)} matches. AI Status: {ai_response.get('ai_status')}")
    
    return matches

@app.post("/optimization/calculate-route", response_model=Route)
async def calculate_hazmat_route(load: Load, db=Depends(get_db_connection)):
    """
    Implements EsangAI.calculateHazmatRoute for hazmat-compliant route planning.
    """
    
    # Simulate ESANG AI decision support processing
    ai_data = {"load_id": load.load_id, "hazmat_class": load.hazmat_class}
    ai_response = esang_core.process_data(ai_data, "HAZMAT_ROUTE_AI")
    
    route = simulate_hazmat_route_calculation(load)
    
    logger.info(f"Route calculated for load {load.load_id}. Compliant: {route.is_hazmat_compliant}. AI Status: {ai_response.get('ai_status')}")
    
    return route

# To run: uvicorn load_optimization_service:app --host 0.0.0.0 --port 8004

