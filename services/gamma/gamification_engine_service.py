from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import random
from datetime import datetime
import uuid

# Import the ESANG AI Core for decision support
from esang_ai_core import esang_core

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('GAMIFICATION_ENGINE_SERVICE')

# --- 1. Data Models (Pydantic) ---

class PerformanceMetrics(BaseModel):
    user_id: str
    on_time_delivery_rate: float
    incident_free_loads: int
    fuel_efficiency_score: float
    safety_rating: float
    loads_completed: int

class Achievement(BaseModel):
    id: str
    name: str
    rarity: str
    points: int
    unlocked_at: datetime

class GamificationSummary(BaseModel):
    user_id: str
    current_level: int
    total_experience: int
    section_id: str
    reputation_score: float
    unlocked_achievements: List[Achievement]
    
# --- 2. PSO-Inspired Logic Simulation ---

SECTION_IDS = ["REDRIA", "BLUEFULL", "YELLOWBOZE", "GREENHILL", "WHITILL"]
ACHIEVEMENTS = [
    {"id": str(uuid.uuid4()), "name": "Zero Incident Run", "rarity": "Rare", "points": 500, "requirement": "incident_free_loads >= 10"},
    {"id": str(uuid.uuid4()), "name": "Efficiency Master", "rarity": "Uncommon", "points": 200, "requirement": "fuel_efficiency_score >= 0.95"},
    {"id": str(uuid.uuid4()), "name": "Speed Demon", "rarity": "Common", "points": 100, "requirement": "on_time_delivery_rate >= 0.99"},
    {"id": str(uuid.uuid4()), "name": "Hazmat Specialist", "rarity": "Legendary", "points": 1000, "requirement": "loads_completed >= 50 and safety_rating >= 0.98"},
]

def calculate_level(xp: int) -> int:
    """Simple level calculation based on experience points."""
    return int((xp / 1000) ** 0.5) + 1

def evaluate_achievements(metrics: PerformanceMetrics) -> List[Achievement]:
    """Evaluates metrics against achievement requirements."""
    unlocked = []
    
    # Simple simulation of achievement logic
    if metrics.incident_free_loads >= 10:
        unlocked.append(Achievement(
            id=ACHIEVEMENTS[0]["id"],
            name=ACHIEVEMENTS[0]["name"],
            rarity=ACHIEVEMENTS[0]["rarity"],
            points=ACHIEVEMENTS[0]["points"],
            unlocked_at=datetime.now()
        ))
        
    if metrics.fuel_efficiency_score >= 0.95:
        unlocked.append(Achievement(
            id=ACHIEVEMENTS[1]["id"],
            name=ACHIEVEMENTS[1]["name"],
            rarity=ACHIEVEMENTS[1]["rarity"],
            points=ACHIEVEMENTS[1]["points"],
            unlocked_at=datetime.now()
        ))
        
    return unlocked

# --- 3. FastAPI Application ---

app = FastAPI(
    title="Team Gamma: PSO-Inspired Gamification Engine Microservice",
    description="Calculates performance metrics, tracks achievements, and manages the PSO-inspired gamification system for EusoTrip.",
    version="1.0.0"
)

# Dependency to simulate database connection
def get_db_connection():
    """Simulates a dependency for database access (DynamoDB/PostgreSQL)."""
    yield True

# --- 4. API Endpoints ---

@app.get("/gamification/status")
async def get_service_status():
    """Returns the operational status of the Gamification service."""
    return {
        "service_name": "Gamification Engine Service",
        "status": "Operational",
        "last_update": datetime.now().isoformat(),
        "engine_version": "PSO-Inspired v1.0"
    }

@app.post("/gamification/process-metrics", response_model=GamificationSummary)
async def process_user_metrics(metrics: PerformanceMetrics, db=Depends(get_db_connection)):
    """
    Processes a user's performance metrics, calculates experience, and checks for achievement unlocks.
    """
    # 1. Simulate XP Calculation (weighted by safety/efficiency)
    base_xp = metrics.loads_completed * 100
    safety_bonus = int(metrics.safety_rating * 500)
    efficiency_bonus = int(metrics.fuel_efficiency_score * 300)
    total_xp = base_xp + safety_bonus + efficiency_bonus
    
    # 2. Simulate AI decision support (ESANG AI for reputation/risk adjustment)
    ai_data = {"user_id": metrics.user_id, "metrics": metrics.dict()}
    ai_response = esang_core.process_data(ai_data, "GAMIFICATION_ENGINE")
    
    # 3. Calculate Level and Reputation
    current_level = calculate_level(total_xp)
    # Reputation is influenced by AI risk assessment
    reputation_modifier = 1.0 + (random.random() - 0.5) * 0.1 # Base reputation
    reputation_score = 1000 * reputation_modifier
    
    # 4. Evaluate Achievements
    unlocked_achievements = evaluate_achievements(metrics)
    
    # 5. Simulate Section ID assignment (based on specialization)
    assigned_section_id = random.choice(SECTION_IDS)
    
    # 6. Log to DynamoDB (Simulated)
    logger.info(f"User {metrics.user_id} processed. Level: {current_level}, XP: {total_xp}, Achievements: {len(unlocked_achievements)}")
    
    return GamificationSummary(
        user_id=metrics.user_id,
        current_level=current_level,
        total_experience=total_xp,
        section_id=assigned_section_id,
        reputation_score=round(reputation_score, 2),
        unlocked_achievements=unlocked_achievements
    )

@app.get("/gamification/leaderboard")
async def get_leaderboard():
    """
    Simulates fetching the top 10 users from the global leaderboard (DynamoDB).
    """
    # In a real system, this would query DynamoDB for the top users by XP/Reputation
    simulated_leaderboard = [
        {"user_id": "user-a", "level": 52, "xp": 28000, "section_id": "REDRIA"},
        {"user_id": "user-b", "level": 48, "xp": 25000, "section_id": "BLUEFULL"},
        {"user_id": "user-c", "level": 45, "xp": 22000, "section_id": "WHITILL"},
    ]
    return {"leaderboard": simulated_leaderboard, "timestamp": datetime.now().isoformat()}

# To run: uvicorn gamification_engine_service:app --host 0.0.0.0 --port 8002

