from fastapi import FastAPI, WebSocket, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
from typing import List, Dict, Optional, Any
import json
import os

from . import crud, schemas
from .database import SessionLocal, engine, Base, get_db, User, Load, Transaction
from .erg_models import ensure_erg_schema, ErgUnIndex, ErgGuideText, ErgSourceDocument
from .erg_ingestion import ingest_from_extraction
from .erg_module_seed import seed_erg_from_json
from .erg_api import router as erg_api_router
from .embeddings import embed_text

# Import new routers
from .routers.drivers import router as drivers_router
from .routers.fleet import router as fleet_router
from .routers.compliance import router as compliance_router
from .routers.loads import router as loads_router
from .routers.accounting import router as accounting_router
from .routers.terminals import router as terminals_router
from .routers.gamification import router as gamification_router
from .routers.analytics import router as analytics_router
from .routers.messaging import router as messaging_router

# Initialize FastAPI application
app = FastAPI(
    title="EusoTrip Core Platform API (Team Alpha - Production Ready)",
    description="The secure, scalable, and highly available microservices architecture for EusoTrip.",
    version="1.0.0"
)

# Create database tables (only if they don't exist)
ensure_erg_schema(engine)
Base.metadata.create_all(bind=engine)

app.include_router(erg_api_router)

# Include new API routers
app.include_router(drivers_router)
app.include_router(fleet_router)
app.include_router(compliance_router)
app.include_router(loads_router)
app.include_router(accounting_router)
app.include_router(terminals_router)
app.include_router(gamification_router)
app.include_router(analytics_router)
app.include_router(messaging_router)

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
def sync_external_data(
    source: str,
    extraction_dir: Optional[str] = None,
    erg_json_path: Optional[str] = None,
    force: bool = False,
    db: Session = Depends(get_db),
):
    # Logic based on backend_ecosystem_enhancement.py and complete_integration_setup.py (Production Ready Mock)
    if source == "AI_ERG":
        if not extraction_dir:
            extraction_dir = os.getenv("ERG_EXTRACTION_DIR")
        if not extraction_dir:
            raise HTTPException(status_code=400, detail="Missing extraction_dir (or ERG_EXTRACTION_DIR env var)")
        result = ingest_from_extraction(db=db, extraction_dir=extraction_dir, force=force)
        return {"message": "AI_ERG ingestion completed", "result": result}
    elif source == "AI_ERG_MODULE":
        if not erg_json_path:
            erg_json_path = os.getenv("ERG_JSON_PATH")
        if not erg_json_path:
            erg_json_path = os.path.join(os.path.dirname(__file__), "erg2024_database.json")
        result = seed_erg_from_json(db=db, json_path=erg_json_path, force=force, build_embeddings=True)
        return {"message": "AI_ERG_MODULE seed completed", "result": result}
    elif source == "TELEMATICS":
        # Placeholder for external telematics data sync
        return {"message": "Telematics data sync initiated (Ready for External Integration)"}
    else:
        raise HTTPException(status_code=400, detail="Unknown data source for integration")


@app.get("/erg/status")
def erg_status(db: Session = Depends(get_db)):
    latest = db.query(ErgSourceDocument).order_by(ErgSourceDocument.id.desc()).first()
    if not latest:
        return {"erg_installed": True, "latest_source_document": None}

    un_count = db.query(ErgUnIndex).filter(ErgUnIndex.source_document_id == latest.id).count()
    guide_count = db.query(ErgGuideText).filter(ErgGuideText.source_document_id == latest.id).count()
    return {
        "erg_installed": True,
        "latest_source_document": {
            "id": latest.id,
            "version_tag": latest.version_tag,
            "created_at": latest.created_at.isoformat() if latest.created_at else None,
            "counts": {"un_index": un_count, "guide_text": guide_count},
        }
    }


@app.get("/erg/un/{un_number}")
def erg_lookup_un(un_number: str, limit: int = 10, db: Session = Depends(get_db)):
    rows = (
        db.query(ErgUnIndex)
        .filter(ErgUnIndex.un_number == un_number)
        .order_by(ErgUnIndex.id.asc())
        .limit(limit)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail=f"UN/NA {un_number} not found")
    return {
        "un_number": un_number,
        "matches": [
            {
                "guide_number": r.guide_number,
                "material_name": r.material_name,
                "page_number": r.page_number,
            }
            for r in rows
        ],
    }


@app.get("/erg/guide/{guide_number}")
def erg_get_guide(guide_number: str, db: Session = Depends(get_db)):
    row = (
        db.query(ErgGuideText)
        .filter(ErgGuideText.guide_number == guide_number)
        .order_by(ErgGuideText.id.desc())
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail=f"Guide {guide_number} not found")
    return {
        "guide_number": guide_number,
        "page_numbers": row.page_numbers,
        "content": row.content,
    }


@app.get("/erg/search")
def erg_search(q: str, k: int = 10, db: Session = Depends(get_db)):
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Missing q")

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("sqlite"):
        qvec = embed_text(q)

        # SQLite semantic search: embeddings are stored as JSON strings.
        # For local dev scale (~4k rows), a full scan is acceptable and provides better recall
        # than pre-filtering by tokens (guide text often doesn't contain the material name).
        params: Dict[str, Any] = {"limit": max(5000, k * 200)}
        rows = db.execute(
            sql_text(
                "SELECT chunk_type, guide_number, un_or_na, page_number, content, embedding "
                "FROM erg_embedding_chunk "
                "WHERE embedding IS NOT NULL "
                "LIMIT :limit"
            ),
            params,
        ).fetchall()

        def _dot(a, b):
            return float(sum(x * y for x, y in zip(a, b)))

        scored = []
        for r in rows:
            emb_raw = r[5]
            vec = None
            if isinstance(emb_raw, str) and emb_raw:
                try:
                    vec = json.loads(emb_raw)
                except Exception:
                    vec = None
            elif isinstance(emb_raw, list):
                vec = emb_raw

            if vec is None:
                continue

            try:
                score = _dot(qvec, vec)
            except Exception:
                continue

            scored.append((score, r))

        # Anchor logic: the query may match an UN/material index row strongly (e.g., "Gasoline"),
        # but the corresponding orange guide text may not contain that material name. In local
        # SQLite mode, prioritize showing the guide text for the guide(s) identified via UN index.
        un_index_scored = [(s, rr) for s, rr in scored if rr[0] == "un_index" and rr[1]]
        un_index_scored.sort(key=lambda x: x[0], reverse=True)
        anchor_guides = {rr[1] for s, rr in un_index_scored[:5] if s >= 0.15}

        if anchor_guides:
            boosted = []
            for s, rr in scored:
                if rr[0] == "guide_text" and rr[1] in anchor_guides:
                    boosted.append((s + 0.60, rr))
                elif rr[0] == "un_index" and rr[1] in anchor_guides:
                    boosted.append((s + 0.20, rr))
                else:
                    boosted.append((s, rr))
            scored = boosted

        scored.sort(key=lambda x: x[0], reverse=True)

        # Ensure at least one guide_text chunk per anchored guide is included.
        results = []
        seen = set()

        if anchor_guides:
            for g in anchor_guides:
                best = None
                best_s = None
                for s, rr in scored:
                    if rr[0] == "guide_text" and rr[1] == g:
                        best = rr
                        best_s = s
                        break
                if best is not None:
                    key = (best[0], best[1], best[2], best[3], best[4])
                    if key not in seen:
                        results.append((float(best_s), best))
                        seen.add(key)

        for s, rr in scored:
            key = (rr[0], rr[1], rr[2], rr[3], rr[4])
            if key in seen:
                continue
            results.append((float(s), rr))
            seen.add(key)
            if len(results) >= k:
                break

        top = results[:k]
        return {
            "query": q,
            "mode": "sqlite_vector",
            "results": [
                {
                    "chunk_type": r[1][0],
                    "guide_number": r[1][1],
                    "un_or_na": r[1][2],
                    "page_number": r[1][3],
                    "score": float(r[0]),
                    "content": r[1][4],
                }
                for r in top
            ],
        }

    qvec = embed_text(q)
    rows = db.execute(
        sql_text(
            "SELECT chunk_type, guide_number, un_or_na, page_number, content, "
            "(1 - (embedding <=> :qvec)) AS score "
            "FROM erg.erg_embedding_chunk "
            "WHERE embedding IS NOT NULL "
            "ORDER BY embedding <=> :qvec "
            "LIMIT :k"
        ),
        {"qvec": qvec, "k": k},
    ).fetchall()

    return {
        "query": q,
        "mode": "pgvector_cosine",
        "results": [
            {
                "chunk_type": r[0],
                "guide_number": r[1],
                "un_or_na": r[2],
                "page_number": r[3],
                "content": r[4],
                "score": float(r[5]) if r[5] is not None else None,
            }
            for r in rows
        ],
    }
