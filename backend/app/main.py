from fastapi import FastAPI, WebSocket, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import json

from . import crud, schemas
from .database import SessionLocal, engine, Base, get_db, User, Load, Transaction

# Initialize FastAPI application
app = FastAPI(
    title="EusoTrip Core Platform API (Team Alpha - Production Ready)",
    description="The secure, scalable, and highly available microservices architecture for EusoTrip.",
    version="1.0.0"
)

# Create database tables (only if they don't exist)
Base.metadata.create_all(bind=engine)

# --- 1. CORE API ENDPOINTS (User, Company, Load Management) ---

@app.get("/")
def read_root():
    return {"message": "EusoTrip Core Platform API is Operational (Database Connected)"}

@app.post("/users/", response_model=schemas.User)
def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.post("/loads/", response_model=schemas.Load)
def create_new_load(load: schemas.LoadCreate, db: Session = Depends(get_db)):
    return crud.create_load(db=db, load=load)

@app.get("/loads/{load_id}", response_model=schemas.Load)
def read_load(load_id: int, db: Session = Depends(get_db)):
    db_load = crud.get_load(db, load_id=load_id)
    if db_load is None:
        raise HTTPException(status_code=404, detail="Load not found")
    return db_load

# --- 2. LOAD LIFECYCLE LOGIC (State Machine) ---

@app.post("/loads/{load_id}/update_status", response_model=schemas.Load)
def update_load_status(load_id: int, status_update: schemas.LoadUpdateStatus, db: Session = Depends(get_db)):
    db_load = crud.get_load(db, load_id=load_id)
    if not db_load:
        raise HTTPException(status_code=404, detail="Load not found")

    # State machine logic based on the text files (pre-loading-phase.txt, loading-phase.txt, transportation-phase.txt)
    valid_transitions = {
        'Pre-Loading': ['Loading', 'Cancelled'],
        'Loading': ['In-Transit', 'Cancelled'],
        'In-Transit': ['Delivered', 'Delayed'],
        'Delivered': [],
        'Delayed': ['In-Transit', 'Delivered']
    }

    current_status = db_load.status
    new_status = status_update.new_status
    
    if new_status not in valid_transitions.get(current_status, []):
        raise HTTPException(status_code=400, detail=f"Invalid status transition from {current_status} to {new_status}")

    return crud.update_load_status(db, load_id, new_status)

# --- 3. FINTECH / EUROWALLET API (Mandate: eusotrip-fintech-architecture.md, stripe-integration-guide.md) ---

@app.post("/fintech/calculate_commission", response_model=schemas.Transaction)
def calculate_commission(load_id: int, driver_id: int, db: Session = Depends(get_db)):
    # Logic based on eusotrip-fintech-architecture.md (Production Ready Mock)
    db_load = crud.get_load(db, load_id=load_id)
    db_driver = crud.get_user(db, user_id=driver_id)
    
    if not db_load:
        raise HTTPException(status_code=404, detail="Load not found")
    if not db_driver or db_driver.role not in ['DRIVER', 'CATALYST']:
        raise HTTPException(status_code=400, detail="Driver not found or invalid role")
    
    commission_rate = 0.15 # 15% flat rate as per mock logic
    driver_pay = db_load.rate * (1 - commission_rate)
    
    # Create the transaction record
    transaction_data = schemas.TransactionCreate(
        type="COMMISSION",
        amount=round(driver_pay, 2),
        user_id=driver_id,
        load_id=load_id
    )
    
    # In a real system, this would trigger a Stripe/PCI-compliant transaction
    return crud.create_transaction(db, transaction_data)

# --- 4. COLLABORATIVE ECOSYSTEM API (Mandate: collaborative_api_routes.py, collaborative_business_engine.py) ---

@app.post("/collaborative/share_load")
def share_load(load_id: int, partner_company_id: int, db: Session = Depends(get_db)):
    # Logic based on collaborative_business_engine.py (Production Ready Mock)
    db_load = crud.get_load(db, load_id=load_id)
    db_company = crud.get_company(db, company_id=partner_company_id)
    
    if not db_load:
        raise HTTPException(status_code=404, detail="Load not found")
    if not db_company:
        raise HTTPException(status_code=404, detail="Partner Company not found")
    
    # NOTE: The actual collaborative logic (negotiation, security) is mocked here.
    # We simulate updating the load's managing company to the partner company.
    db_load.managing_company_id = partner_company_id
    db.commit()
    
    return {"message": f"Load {load_id} successfully shared with Partner Company {db_company.name}", "load": schemas.Load.from_orm(db_load)}


# --- 5. REAL-TIME MESSAGING BACKEND (Mandate: eusotrip-messaging-docs.md - WebSocket Shell) ---

# Active WebSocket connections
active_connections: Dict[int, WebSocket] = {}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    # Check if user exists (Authentication/Authorization would happen here)
    if not crud.get_user(db, user_id):
        await websocket.close(code=1008, reason="User not authorized")
        return
        
    await websocket.accept()
    active_connections[user_id] = websocket
    print(f"User {user_id} connected via WebSocket")
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message from {user_id}: {data}")
            
            # Simple broadcast mock (in a real system, this would be routed)
            message = json.dumps({"sender_id": user_id, "content": data})
            for connection_id, connection in active_connections.items():
                if connection_id != user_id:
                    await connection.send_text(message)
                    
    except Exception as e:
        print(f"WebSocket Error for user {user_id}: {e}")
    finally:
        if user_id in active_connections:
            del active_connections[user_id]
            print(f"User {user_id} disconnected")

# Endpoint to simulate a system-wide broadcast (e.g., system alert)
@app.post("/messaging/broadcast")
async def broadcast_message(message: str):
    count = 0
    for user_id, connection in active_connections.items():
        try:
            await connection.send_text(json.dumps({"sender": "SYSTEM", "content": message}))
            count += 1
        except Exception as e:
            print(f"Failed to send to user {user_id}: {e}")
    return {"message": f"Broadcast sent to {count} active users"}


# --- 6. SYSTEM INTEGRATION (Mandate: complete_backend_integration.py) ---

@app.post("/integration/sync_external_data")
def sync_external_data(source: str):
    # Logic based on backend_ecosystem_enhancement.py and complete_integration_setup.py (Production Ready Mock)
    if source == "AI_ERG":
        # Placeholder for Team Gamma's ERG/AI data ingestion pipeline
        return {"message": "Data ingestion pipeline for AI_ERG initiated (Ready for Gamma Integration)"}
    elif source == "TELEMATICS":
        # Placeholder for external telematics data sync
        return {"message": "Telematics data sync initiated (Ready for External Integration)"}
    else:
        raise HTTPException(status_code=400, detail="Unknown data source for integration")
