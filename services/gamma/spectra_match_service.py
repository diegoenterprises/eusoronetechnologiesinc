from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import csv
import io
import re

# Import the ESANG AI Core for decision support
from esang_ai_core import esang_core

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('SPECTRA_MATCH_SERVICE')

# --- 1. Data Models (Pydantic) ---

class OilInput(BaseModel):
    api_gravity: float
    sulfur_content: float
    bsw: float
    temperature: float
    salt_content: Optional[float] = None
    rvp: Optional[float] = None
    pour_point: Optional[float] = None
    flash_point: Optional[float] = None
    viscosity: Optional[float] = None
    tan: Optional[float] = None

class OilMatch(BaseModel):
    grade: str
    region: str
    type: str
    match_score: float
    confidence_level: str
    details: Dict[str, Any]

class SpectraMatchResponse(BaseModel):
    input_parameters: OilInput
    ai_status: str
    matches: List[OilMatch]

# --- 2. Knowledge Base (Simulated from ultimate-crude-oil-spec-guide.md) ---

# This function parses the Markdown table from the guide into a structured list of dicts.
def parse_crude_oil_specs(markdown_content: str) -> List[Dict[str, Any]]:
    """Parses the crude oil specification tables from the Markdown guide."""
    specs = []
    # Regex to find the tables under the region headers
    table_pattern = re.compile(r'\|\s*Grade\s*\|.*?\n\|-+\|.*?\n((?:\|.*?\|\s*\n)+)', re.DOTALL)
    
    # Extract all tables
    tables = table_pattern.findall(markdown_content)
    
    # Get the header row from the first table to determine column order
    # Header: Grade, API Gravity (°), Sulfur (%), BS&W (%), Salt (PTB), RVP (psi), Pour Point (°C), Flash Point (°C), Viscosity (cSt@40°C), TAN (mg KOH/g), Region/Location, Type
    headers = [
        "Grade", "API Gravity (°)", "Sulfur (%)", "BS&W (%)", "Salt (PTB)", "RVP (psi)", 
        "Pour Point (°C)", "Flash Point (°C)", "Viscosity (cSt@40°C)", "TAN (mg KOH/g)", 
        "Region/Location", "Type"
    ]
    
    for table_str in tables:
        # Use csv reader on a string buffer to handle the pipe-separated values
        reader = csv.reader(io.StringIO(table_str), delimiter='|', skipinitialspace=True)
        
        for row in reader:
            # Clean up empty strings from start/end of row
            clean_row = [item.strip() for item in row if item.strip()]
            
            if len(clean_row) == len(headers):
                spec = dict(zip(headers, clean_row))
                
                # Convert ranges to float/tuple for comparison
                for key in ["API Gravity (°)", "Sulfur (%)", "BS&W (%)", "Salt (PTB)", "RVP (psi)", "Pour Point (°C)", "Flash Point (°C)", "Viscosity (cSt@40°C)", "TAN (mg KOH/g)"]:
                    value = spec.get(key, None)
                    if value:
                        # Handle ranges like "41-44" or "28-30"
                        if '-' in value:
                            try:
                                low, high = map(float, value.split('-'))
                                spec[key] = (low, high)
                            except ValueError:
                                # Handle complex ranges like "5-15" for Salt (PTB)
                                pass
                        # Handle single values
                        else:
                            try:
                                spec[key] = float(value)
                            except ValueError:
                                pass
                specs.append(spec)
                
    return specs

# Load the content of the guide
try:
    with open("/home/ubuntu/upload/ultimate-crude-oil-spec-guide.md", "r") as f:
        CRUDE_OIL_GUIDE_CONTENT = f.read()
    CRUDE_OIL_SPECS = parse_crude_oil_specs(CRUDE_OIL_GUIDE_CONTENT)
    logger.info(f"Loaded {len(CRUDE_OIL_SPECS)} crude oil specifications.")
except FileNotFoundError:
    logger.error("Crude oil specification guide not found.")
    CRUDE_OIL_SPECS = []

# --- 3. Spectra-Match Core Logic (Adaptive Parameter Weighting Simulation) ---

def calculate_match_score(input_oil: OilInput, spec: Dict[str, Any]) -> float:
    """
    Simulates the Adaptive Parameter Weighting (APW) algorithm.
    It calculates a match score based on how closely the input parameters 
    fall within the specified ranges of a known crude oil grade.
    
    Weights are assigned dynamically, prioritizing Primary Parameters (API, Sulfur, BS&W).
    """
    score = 0.0
    max_score = 0.0
    
    # Define parameters and their weights (simulating APW)
    # Primary parameters get higher weight
    parameters = {
        'API Gravity (°)': 5.0,
        'Sulfur (%)': 4.0,
        'BS&W (%)': 3.0,
        'Salt (PTB)': 2.0,
        'RVP (psi)': 1.5,
        'Pour Point (°C)': 1.0,
        'Flash Point (°C)': 1.0,
        # Temperature is for correction, not identification, so it's excluded from matching
    }
    
    input_values = {
        'API Gravity (°)': input_oil.api_gravity,
        'Sulfur (%)': input_oil.sulfur_content,
        'BS&W (%)': input_oil.bsw,
        'Salt (PTB)': input_oil.salt_content,
        'RVP (psi)': input_oil.rvp,
        'Pour Point (°C)': input_oil.pour_point,
        'Flash Point (°C)': input_oil.flash_point,
    }

    for param, weight in parameters.items():
        max_score += weight
        input_val = input_values.get(param)
        spec_val = spec.get(param)
        
        if input_val is None or spec_val is None:
            # If input is missing, reduce max_score for normalization
            max_score -= weight
            continue
            
        is_match = False
        
        if isinstance(spec_val, tuple):
            # Range match (e.g., 41-44)
            low, high = spec_val
            if low <= input_val <= high:
                is_match = True
        elif isinstance(spec_val, float):
            # Single value match with tolerance (simulating tolerance from guide)
            tolerance = 0.5 # Default tolerance for API Gravity
            if param == 'Sulfur (%)': tolerance = 0.1
            elif param == 'BS&W (%)': tolerance = 0.2
            elif param == 'Salt (PTB)': tolerance = 2.0
            elif param == 'RVP (psi)': tolerance = 0.5
            elif param in ('Pour Point (°C)', 'Flash Point (°C)'): tolerance = 3.0
            
            if abs(input_val - spec_val) <= tolerance:
                is_match = True
        
        if is_match:
            score += weight
            
    # Normalize score to 0-100%
    if max_score == 0:
        return 0.0
        
    return round((score / max_score) * 100, 2)

# --- 4. FastAPI Application ---

app = FastAPI(
    title="Team Gamma: Spectra-Match™ Oil Identification Microservice",
    description="Provides AI-driven crude oil identification based on run ticket parameters and the Ultimate Crude Oil Specification Guide.",
    version="1.0.0"
)

# Dependency to simulate database connection
def get_db_connection():
    """Simulates a dependency for database access (DynamoDB/PostgreSQL)."""
    yield True

# --- 5. API Endpoints ---

@app.get("/spectra-match/status")
async def get_service_status():
    """Returns the operational status of the Spectra-Match service and its AI components."""
    ai_status = esang_core.get_model_status()
    return {
        "service_name": "Spectra-Match Oil Identification Service",
        "status": "Operational",
        "last_update": datetime.now().isoformat(),
        "loaded_specs": len(CRUDE_OIL_SPECS),
        "esang_ai_status": ai_status['spectra_match_model']
    }

@app.post("/spectra-match/identify", response_model=SpectraMatchResponse)
async def identify_oil(input_oil: OilInput, db=Depends(get_db_connection)):
    """
    Identifies the crude oil grade by matching input parameters against the 
    internal specification database using the Adaptive Parameter Weighting (APW) algorithm.
    """
    if not CRUDE_OIL_SPECS:
        raise HTTPException(status_code=500, detail="Crude oil specification database is empty or failed to load.")

    matches = []
    
    for spec in CRUDE_OIL_SPECS:
        match_score = calculate_match_score(input_oil, spec)
        
        if match_score > 50.0: # Only consider matches above a threshold
            
            # Determine confidence level based on score (simulating Contextual Confidence Scoring)
            if match_score >= 95.0:
                confidence = "High Confidence (WTI-Grade Match)"
            elif match_score >= 80.0:
                confidence = "Medium Confidence (Regional Match)"
            else:
                confidence = "Low Confidence (Broad Match)"
                
            matches.append(OilMatch(
                grade=spec["Grade"],
                region=spec["Region/Location"],
                type=spec["Type"],
                match_score=match_score,
                confidence_level=confidence,
                details=spec
            ))

    # Sort matches by score in descending order
    matches.sort(key=lambda x: x.match_score, reverse=True)
    
    # Simulate ESANG AI processing for final decision support
    ai_response = esang_core.process_data(input_oil.dict(), "SPECTRA_MATCH")
    
    return SpectraMatchResponse(
        input_parameters=input_oil,
        ai_status=f"ESANG AI: {ai_response.get('ai_status')}",
        matches=matches[:5] # Return top 5 matches
    )

# To run: uvicorn spectra_match_service:app --host 0.0.0.0 --port 8001

