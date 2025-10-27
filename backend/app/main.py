from fastapi import FastAPI, WebSocket
from typing import List, Dict
import json

# Initialize FastAPI application
app = FastAPI(
    title="EusoTrip Core Platform API (Team Alpha)",
    description="The secure, scalable, and highly available microservices architecture for EusoTrip.",
    version="1.0.0"
)

# --- 1. CORE ARCHITECTURE & DATA MODELS (MOCK/PLACEHOLDER) ---
# In a real scenario, these would be SQLAlchemy models and Pydantic schemas.
# For now, we use simple dicts to represent the data structure as per the mandate.

class MockDB:
    def __init__(self):
        self.users = {}
        self.companies = {}
        self.loads = {}
        self.transactions = {}
        self.next_user_id = 1
        self.next_load_id = 1

    def create_user(self, user_data: Dict):
        user_id = self.next_user_id
        self.next_user_id += 1
        user_data['id'] = user_id
        self.users[user_id] = user_data
        return user_data

    def create_load(self, load_data: Dict):
        load_id = self.next_load_id
        self.next_load_id += 1
        load_data['id'] = load_id
        load_data['status'] = 'Pre-Loading' # Initial status
        self.loads[load_id] = load_data
        return load_data

db = MockDB()
db.create_user({'username': 'shipper1', 'role': 'SHIPPER', 'name': 'Eusorone Shipper'})
db.create_load({'shipper_id': 1, 'origin': 'Houston, TX', 'destination': 'Dallas, TX', 'cargo': 'Methanol', 'rate': 4250})


# --- 2. CORE API ENDPOINTS (Mandate: User, Company, Load Management) ---

@app.get("/")
def read_root():
    return {"message": "EusoTrip Core Platform API is Operational"}

@app.get("/users/{user_id}")
def get_user(user_id: int):
    user = db.users.get(user_id)
    if user:
        return user
    return {"error": "User not found"}

@app.post("/loads")
def create_load(load_data: Dict):
    new_load = db.create_load(load_data)
    return {"message": "Load created successfully", "load": new_load}

# --- 3. LOAD LIFECYCLE LOGIC (Mandate: pre-loading-phase.txt, loading-phase.txt, transportation-phase.txt) ---

# This endpoint simulates the state machine transition based on the core logic files.
@app.post("/loads/{load_id}/update_status")
def update_load_status(load_id: int, new_status: str):
    load = db.loads.get(load_id)
    if not load:
        return {"error": "Load not found"}

    # State machine logic based on the text files (simplified mock)
    valid_transitions = {
        'Pre-Loading': ['Loading', 'Cancelled'],
        'Loading': ['In-Transit', 'Cancelled'],
        'In-Transit': ['Delivered', 'Delayed'],
        'Delivered': [],
        'Delayed': ['In-Transit', 'Delivered']
    }

    current_status = load['status']
    if new_status not in valid_transitions.get(current_status, []):
        return {"error": f"Invalid status transition from {current_status} to {new_status}"}

    load['status'] = new_status
    return {"message": f"Load {load_id} status updated to {new_status}", "load": load}


# --- 4. FINTECH / EUROWALLET API (Mandate: eusotrip-fintech-architecture.md, stripe-integration-guide.md) ---

@app.post("/fintech/calculate_commission")
def calculate_commission(load_id: int, driver_id: int):
    # Logic based on eusotrip-fintech-architecture.md (Mocked)
    load = db.loads.get(load_id)
    if not load:
        return {"error": "Load not found"}
    
    commission_rate = 0.15 # 15% flat rate for this mock
    driver_pay = load['rate'] * (1 - commission_rate)
    platform_fee = load['rate'] * commission_rate

    # In a real system, this would trigger a Stripe/PCI-compliant transaction
    transaction = {
        "load_id": load_id,
        "driver_id": driver_id,
        "total_rate": load['rate'],
        "driver_pay": round(driver_pay, 2),
        "platform_fee": round(platform_fee, 2),
        "status": "Pending Payout"
    }
    db.transactions[len(db.transactions) + 1] = transaction
    
    return {"message": "Commission calculated (Mocked)", "transaction": transaction}


# --- 5. COLLABORATIVE ECOSYSTEM API (Mandate: collaborative_api_routes.py, collaborative_business_engine.py) ---

@app.post("/collaborative/share_load")
def share_load(load_id: int, partner_company_id: int):
    # Logic based on collaborative_business_engine.py (Mocked)
    load = db.loads.get(load_id)
    if not load:
        return {"error": "Load not found"}
    
    # In a real system, this would involve complex negotiation and tracking
    return {"message": f"Load {load_id} successfully shared with Partner Company {partner_company_id} (Mocked)"}


# --- 6. REAL-TIME MESSAGING BACKEND (Mandate: eusotrip-messaging-docs.md - WebSocket Shell) ---

# Active WebSocket connections
active_connections: Dict[int, WebSocket] = {}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    print(f"User {user_id} connected via WebSocket")
    
    try:
        while True:
            # Wait for incoming messages (e.g., chat messages, status updates)
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


# --- 7. SYSTEM INTEGRATION (Mandate: complete_backend_integration.py) ---

@app.post("/integration/sync_external_data")
def sync_external_data(source: str):
    # Logic based on backend_ecosystem_enhancement.py and complete_integration_setup.py (Mocked)
    if source == "AI_ERG":
        # Placeholder for Team Gamma's ERG/AI data ingestion pipeline
        return {"message": "Data ingestion pipeline for AI_ERG initiated (Mocked)"}
    elif source == "TELEMATICS":
        # Placeholder for external telematics data sync
        return {"message": "Telematics data sync initiated (Mocked)"}
    else:
        return {"error": "Unknown data source for integration"}
