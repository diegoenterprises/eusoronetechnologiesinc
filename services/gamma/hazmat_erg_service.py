from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import json
import os
import hashlib
import math
import re
from datetime import datetime

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv

# Import the ESANG AI Core for decision support
from esang_ai_core import esang_core

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('HAZMAT_ERG_SERVICE')

load_dotenv()

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

_ENGINE = None
_SessionLocal = None


def _get_db_url() -> str:
    db_url = os.getenv("ERG_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("Missing ERG_DATABASE_URL or DATABASE_URL")
    return db_url


def _get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    db_url = _get_db_url()
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    _ENGINE = create_engine(db_url, connect_args=connect_args)
    return _ENGINE


def _get_sessionmaker():
    global _SessionLocal
    if _SessionLocal is not None:
        return _SessionLocal
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal


def get_db_connection():
    """Database dependency."""
    SessionLocal = _get_sessionmaker()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _tbl(name: str, db_url: str) -> str:
    if db_url.startswith("sqlite"):
        return name
    return f"erg.{name}"


def _lookup_un(db, un_number: str, limit: int = 10) -> List[Dict[str, Any]]:
    db_url = _get_db_url()
    q = text(
        f"SELECT un_number, guide_number, material_name, page_number "
        f"FROM {_tbl('erg_un_index', db_url)} WHERE un_number = :un "
        f"ORDER BY id ASC LIMIT :limit"
    )
    rows = db.execute(q, {"un": un_number, "limit": limit}).fetchall()
    return [
        {
            "un_number": r[0],
            "guide_number": r[1],
            "material_name": r[2],
            "page_number": r[3],
        }
        for r in rows
    ]


def _get_guide_text(db, guide_number: str) -> Optional[Dict[str, Any]]:
    db_url = _get_db_url()
    q = text(
        f"SELECT guide_number, page_numbers, content "
        f"FROM {_tbl('erg_guide_text', db_url)} WHERE guide_number = :g "
        f"ORDER BY id DESC LIMIT 1"
    )
    row = db.execute(q, {"g": guide_number}).fetchone()
    if not row:
        return None

    page_numbers = row[1]
    if isinstance(page_numbers, str):
        try:
            page_numbers = json.loads(page_numbers)
        except Exception:
            page_numbers = []

    return {"guide_number": row[0], "page_numbers": page_numbers, "content": row[2]}


def _embed_text_local_hash(text: str, dim: int = 768) -> List[float]:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9\s]+", " ", text)
    tokens = [t for t in text.split() if t]
    vec = [0.0] * dim
    if not tokens:
        return vec

    for tok in tokens:
        h = hashlib.sha256(tok.encode("utf-8")).digest()
        idx = int.from_bytes(h[:4], "big") % dim
        sign = -1.0 if (h[4] & 1) else 1.0
        vec[idx] += sign

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def _embed_text(text: str) -> List[float]:
    dim = 768
    try:
        dim = int(os.getenv("ERG_EMBED_DIM", "768"))
    except Exception:
        dim = 768
    provider = (os.getenv("ERG_EMBEDDING_PROVIDER") or "local_hash").lower()
    if provider != "local_hash":
        raise RuntimeError("Unsupported ERG_EMBEDDING_PROVIDER for Gamma. Supported: local_hash")
    return _embed_text_local_hash(text, dim=dim)


def _vector_literal(vec: List[float]) -> str:
    return "[" + ",".join(f"{float(x):.8f}" for x in vec) + "]"


def _search_embeddings(db, q: str, k: int = 10) -> Dict[str, Any]:
    db_url = _get_db_url()
    qvec = _embed_text(q)

    if db_url.startswith("sqlite"):
        rows = db.execute(
            text(
                "SELECT chunk_type, guide_number, un_or_na, page_number, content, embedding "
                "FROM erg_embedding_chunk "
                "WHERE embedding IS NOT NULL"
            )
        ).fetchall()

        def _dot(a, b):
            return float(sum(x * y for x, y in zip(a, b)))

        scored = []
        for r in rows:
            emb_raw = r[5]
            if not emb_raw:
                continue
            try:
                vec = json.loads(emb_raw) if isinstance(emb_raw, str) else emb_raw
            except Exception:
                continue
            try:
                s = _dot(qvec, vec)
            except Exception:
                continue
            scored.append((s, r))

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
                for r in results[:k]
            ],
        }

    qvec_lit = _vector_literal(qvec)
    rows = db.execute(
        text(
            "SELECT chunk_type, guide_number, un_or_na, page_number, content, "
            "(1 - (embedding <=> (:qvec)::vector)) AS score "
            "FROM erg.erg_embedding_chunk "
            "WHERE embedding IS NOT NULL "
            "ORDER BY embedding <=> (:qvec)::vector "
            "LIMIT :k"
        ),
        {"qvec": qvec_lit, "k": k},
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

# --- 3. FastAPI Application ---

app = FastAPI(
    title="Team Gamma: Hazmat/ERG Compliance Microservice",
    description="Provides real-time Hazmat identification and Emergency Response Guide (ERG) guidance, powered by ESANG AI.",
    version="1.0.0"
)

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
    
    matches = _lookup_un(db, un_number=un_number, limit=1)
    if matches:
        guide_number = matches[0]["guide_number"]
        
        # Simulate AI decision support processing
        ai_response = esang_core.process_data(query.dict(), "HAZMAT_ERG")
        
        return HazmatCheckResponse(
            is_hazmat=True,
            classification=query.material_state,
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
    
    matches = _lookup_un(db, un_number=un_number, limit=1)
    if not matches:
        raise HTTPException(status_code=404, detail=f"UN Number {un_number} not found in ERG database.")

    guide_number = matches[0]["guide_number"]
    material_name = matches[0]["material_name"]
    un_page = matches[0].get("page_number")

    guide = _get_guide_text(db, guide_number=guide_number)
    if not guide:
        raise HTTPException(status_code=404, detail=f"ERG Guide {guide_number} not found in ERG database.")
    
    # Simulate AI decision support processing
    ai_response = esang_core.process_data(query.dict(), "HAZMAT_ERG")
    
    return ERGResponse(
        un_number=un_number,
        material_name=material_name,
        erg_guide_number=guide_number,
        ai_confidence=ai_response.get('confidence_score', 0.0),
        sections={
            "guide_text": guide["content"],
            "citations": {
                "un_index_page": un_page,
                "guide_pages": guide.get("page_numbers", []),
            },
        }
    )


@app.get("/erg/search")
async def erg_semantic_search(q: str, k: int = 10, db=Depends(get_db_connection)):
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Missing q")
    try:
        return _search_embeddings(db, q=q, k=k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

