from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Any, Dict, List, Optional
from datetime import datetime

from .database import get_db
from .erg_models import (
    ErgHazardClassDefinition,
    ErgEmergencyContact,
    ErgGuide,
    ErgIncident,
    ErgLookupLog,
    ErgMaterial,
    ErgProtectiveDistance,
)

router = APIRouter(prefix="/api/v1/erg", tags=["ERG2024"])


def _log_lookup(
    db: Session,
    lookup_type: str,
    query: str,
    results: int,
    un_number: Optional[str] = None,
    guide_number: Optional[int] = None,
    is_emergency: bool = False,
):
    try:
        db.add(
            ErgLookupLog(
                lookup_type=lookup_type,
                search_query=query,
                un_number=un_number,
                guide_number=guide_number,
                results_count=results,
                is_emergency=is_emergency,
                lookup_time=datetime.utcnow(),
            )
        )
        db.commit()
    except Exception:
        db.rollback()


@router.get("/materials/search")
def search_materials(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=100),
    hazard_class: Optional[str] = Query(None),
    tih_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(ErgMaterial)
    term = f"%{q}%"
    query = query.filter(or_(ErgMaterial.un_number.like(term), ErgMaterial.name.ilike(term)))
    if hazard_class:
        query = query.filter(ErgMaterial.hazard_class.like(f"{hazard_class}%"))
    if tih_only:
        query = query.filter(ErgMaterial.is_tih == True)

    rows = query.limit(limit).all()
    _log_lookup(db, "material", q, len(rows))

    return [
        {
            "un_number": r.un_number,
            "name": r.name,
            "guide": r.guide_number,
            "hazard_class": r.hazard_class,
            "is_tih": bool(r.is_tih),
            "is_water_reactive": bool(r.is_water_reactive),
        }
        for r in rows
    ]


@router.get("/materials/{un_number}")
def get_material(un_number: str = Path(...), db: Session = Depends(get_db)):
    un = un_number.upper().replace("UN", "")
    material = db.query(ErgMaterial).filter(ErgMaterial.un_number == un).first()
    if not material:
        raise HTTPException(status_code=404, detail=f"Material UN{un_number} not found")

    guide = db.query(ErgGuide).filter(ErgGuide.guide_number == material.guide_number).first()

    protective = None
    if material.is_tih:
        pd = db.query(ErgProtectiveDistance).filter(ErgProtectiveDistance.un_number == material.un_number).first()
        if pd:
            protective = {
                "un_number": pd.un_number,
                "material_name": pd.material_name,
                "small_spill": {
                    "day": {
                        "isolation_m": pd.small_day_isolation_meters,
                        "isolation_ft": pd.small_day_isolation_feet,
                        "protect_km": pd.small_day_protect_km,
                        "protect_mi": pd.small_day_protect_miles,
                    },
                    "night": {
                        "isolation_m": pd.small_night_isolation_meters,
                        "isolation_ft": pd.small_night_isolation_feet,
                        "protect_km": pd.small_night_protect_km,
                        "protect_mi": pd.small_night_protect_miles,
                    },
                },
                "large_spill": {
                    "day": {
                        "isolation_m": pd.large_day_isolation_meters,
                        "isolation_ft": pd.large_day_isolation_feet,
                        "protect_km": pd.large_day_protect_km,
                        "protect_mi": pd.large_day_protect_miles,
                    },
                    "night": {
                        "isolation_m": pd.large_night_isolation_meters,
                        "isolation_ft": pd.large_night_isolation_feet,
                        "protect_km": pd.large_night_protect_km,
                        "protect_mi": pd.large_night_protect_miles,
                    },
                },
            }

    _log_lookup(db, "material", un_number, 1, un_number=material.un_number, guide_number=material.guide_number)

    return {
        "material": {
            "un_number": material.un_number,
            "na_number": material.na_number,
            "name": material.name,
            "alternate_names": material.alternate_names or [],
            "guide": material.guide_number,
            "hazard_class": material.hazard_class,
            "division": material.division,
            "packing_group": material.packing_group,
            "is_tih": bool(material.is_tih),
            "is_water_reactive": bool(material.is_water_reactive),
            "polymerization_hazard": bool(material.polymerization_hazard),
        },
        "guide": guide_to_dict(guide) if guide else None,
        "protective_distances": protective,
    }


@router.get("/materials/un/{un_number}/quick")
def quick_lookup(
    un_number: str,
    spill_size: str = Query("large"),
    time: str = Query("day"),
    db: Session = Depends(get_db),
):
    un = un_number.replace("UN", "")
    material = db.query(ErgMaterial).filter(ErgMaterial.un_number == un).first()
    if not material:
        guide = db.query(ErgGuide).filter(ErgGuide.guide_number == 111).first()
        return {
            "status": "UNKNOWN_MATERIAL",
            "guide": 111,
            "guide_title": "Mixed Load/Unidentified Cargo",
            "isolate_meters": 100,
            "isolate_feet": 330,
            "fire_isolate_meters": 800,
            "immediate_actions": [
                "ISOLATE 100m (330 ft) in all directions",
                "Call CHEMTREC: 1-800-424-9300",
                "Wear SCBA and protective equipment",
                "Eliminate ignition sources",
            ],
            "call_chemtrec": "1-800-424-9300",
            "guide_details": guide_to_dict(guide) if guide else None,
        }

    guide = db.query(ErgGuide).filter(ErgGuide.guide_number == material.guide_number).first()

    response: Dict[str, Any] = {
        "un_number": material.un_number,
        "name": material.name,
        "guide": material.guide_number,
        "guide_title": guide.title if guide else "Unknown",
        "hazard_class": material.hazard_class,
        "is_tih": bool(material.is_tih),
        "isolate_meters": guide.initial_isolation_meters if guide else 100,
        "isolate_feet": guide.initial_isolation_feet if guide else 330,
        "fire_isolate_meters": guide.fire_isolation_meters if guide else 800,
        "call_chemtrec": "1-800-424-9300",
    }

    if material.is_tih:
        pd = db.query(ErgProtectiveDistance).filter(ErgProtectiveDistance.un_number == material.un_number).first()
        if pd:
            if spill_size == "small":
                if time == "day":
                    response["protect_km"] = pd.small_day_protect_km
                    response["protect_miles"] = pd.small_day_protect_miles
                else:
                    response["protect_km"] = pd.small_night_protect_km
                    response["protect_miles"] = pd.small_night_protect_miles
            else:
                if time == "day":
                    response["protect_km"] = pd.large_day_protect_km
                    response["protect_miles"] = pd.large_day_protect_miles
                else:
                    response["protect_km"] = pd.large_night_protect_km
                    response["protect_miles"] = pd.large_night_protect_miles

    _log_lookup(db, "quick", un_number, 1, un_number=material.un_number, guide_number=material.guide_number, is_emergency=True)
    return response


@router.get("/guides")
def list_guides(db: Session = Depends(get_db)):
    guides = db.query(ErgGuide).order_by(ErgGuide.guide_number).all()
    return {
        "total": len(guides),
        "guides": [
            {
                "guide_number": g.guide_number,
                "title": g.title,
                "color": g.color,
                "isolate_meters": g.initial_isolation_meters,
            }
            for g in guides
        ],
    }


@router.get("/hazard-classes")
def list_hazard_classes(db: Session = Depends(get_db)):
    rows = db.query(ErgHazardClassDefinition).order_by(ErgHazardClassDefinition.class_number).all()
    return {
        "total": len(rows),
        "hazard_classes": [
            {
                "class": r.class_number,
                "name": r.name,
                "color": r.color,
                "icon": r.icon,
                "divisions": r.divisions or [],
            }
            for r in rows
        ],
    }


@router.get("/guides/{guide_number}")
def get_guide(guide_number: int, db: Session = Depends(get_db)):
    guide = db.query(ErgGuide).filter(ErgGuide.guide_number == guide_number).first()
    if not guide:
        raise HTTPException(status_code=404, detail=f"Guide {guide_number} not found")
    _log_lookup(db, "guide", str(guide_number), 1, guide_number=guide_number)
    return guide_to_dict(guide)


@router.get("/guides/{guide_number}/materials")
def get_guide_materials(
    guide_number: int,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    total = db.query(func.count(ErgMaterial.id)).filter(ErgMaterial.guide_number == guide_number).scalar()
    rows = (
        db.query(ErgMaterial)
        .filter(ErgMaterial.guide_number == guide_number)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "guide_number": guide_number,
        "total_materials": int(total or 0),
        "offset": offset,
        "limit": limit,
        "materials": [
            {
                "un_number": r.un_number,
                "name": r.name,
                "guide": r.guide_number,
                "hazard_class": r.hazard_class,
                "is_tih": bool(r.is_tih),
                "is_water_reactive": bool(r.is_water_reactive),
            }
            for r in rows
        ],
    }


@router.get("/distances/tih")
def list_tih_materials(db: Session = Depends(get_db)):
    rows = db.query(ErgProtectiveDistance).all()
    return {
        "total": len(rows),
        "materials": [
            {
                "un_number": r.un_number,
                "material_name": r.material_name,
                "small_spill": {
                    "day": {
                        "isolation_m": r.small_day_isolation_meters,
                        "isolation_ft": r.small_day_isolation_feet,
                        "protect_km": r.small_day_protect_km,
                        "protect_mi": r.small_day_protect_miles,
                    },
                    "night": {
                        "isolation_m": r.small_night_isolation_meters,
                        "isolation_ft": r.small_night_isolation_feet,
                        "protect_km": r.small_night_protect_km,
                        "protect_mi": r.small_night_protect_miles,
                    },
                },
                "large_spill": {
                    "day": {
                        "isolation_m": r.large_day_isolation_meters,
                        "isolation_ft": r.large_day_isolation_feet,
                        "protect_km": r.large_day_protect_km,
                        "protect_mi": r.large_day_protect_miles,
                    },
                    "night": {
                        "isolation_m": r.large_night_isolation_meters,
                        "isolation_ft": r.large_night_isolation_feet,
                        "protect_km": r.large_night_protect_km,
                        "protect_mi": r.large_night_protect_miles,
                    },
                },
            }
            for r in rows
        ],
    }


@router.get("/distances/{un_number}")
def get_protective_distance(un_number: str, db: Session = Depends(get_db)):
    un = un_number.replace("UN", "")
    r = db.query(ErgProtectiveDistance).filter(ErgProtectiveDistance.un_number == un).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"No protective distances found for UN{un_number}")
    return {
        "un_number": r.un_number,
        "material_name": r.material_name,
        "small_spill": {
            "day": {
                "isolation_m": r.small_day_isolation_meters,
                "isolation_ft": r.small_day_isolation_feet,
                "protect_km": r.small_day_protect_km,
                "protect_mi": r.small_day_protect_miles,
            },
            "night": {
                "isolation_m": r.small_night_isolation_meters,
                "isolation_ft": r.small_night_isolation_feet,
                "protect_km": r.small_night_protect_km,
                "protect_mi": r.small_night_protect_miles,
            },
        },
        "large_spill": {
            "day": {
                "isolation_m": r.large_day_isolation_meters,
                "isolation_ft": r.large_day_isolation_feet,
                "protect_km": r.large_day_protect_km,
                "protect_mi": r.large_day_protect_miles,
            },
            "night": {
                "isolation_m": r.large_night_isolation_meters,
                "isolation_ft": r.large_night_isolation_feet,
                "protect_km": r.large_night_protect_km,
                "protect_mi": r.large_night_protect_miles,
            },
        },
    }


@router.get("/distances/{un_number}/calculate")
def calculate_distance(
    un_number: str,
    spill_size: str = Query(...),
    time_of_day: str = Query(...),
    db: Session = Depends(get_db),
):
    un = un_number.replace("UN", "")
    pd = db.query(ErgProtectiveDistance).filter(ErgProtectiveDistance.un_number == un).first()
    if not pd:
        raise HTTPException(status_code=404, detail="Material not found in TIH table")

    if spill_size == "small":
        isolation = pd.small_day_isolation_meters if time_of_day == "day" else pd.small_night_isolation_meters
        protect = pd.small_day_protect_km if time_of_day == "day" else pd.small_night_protect_km
    else:
        isolation = pd.large_day_isolation_meters if time_of_day == "day" else pd.large_night_isolation_meters
        protect = pd.large_day_protect_km if time_of_day == "day" else pd.large_night_protect_km

    return {
        "un_number": un,
        "material_name": pd.material_name,
        "conditions": {"spill_size": spill_size, "time_of_day": time_of_day},
        "initial_isolation": {"meters": isolation, "feet": round((isolation or 0) * 3.28)},
        "protective_action_distance": {"kilometers": protect, "miles": round((protect or 0) * 0.621, 1)},
        "action": f"ISOLATE {isolation}m in all directions. Protect persons downwind for {protect} km.",
    }


@router.get("/contacts")
def list_contacts(country: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ErgEmergencyContact)
    if country:
        query = query.filter(ErgEmergencyContact.country.ilike(f"%{country}%"))
    rows = query.order_by(ErgEmergencyContact.priority, ErgEmergencyContact.country).all()
    return {
        "total": len(rows),
        "contacts": [
            {
                "name": c.name,
                "phone": c.phone,
                "country": c.country,
                "description": c.description,
                "is_primary": bool(c.is_primary),
                "is_24_hour": bool(c.is_24_hour),
            }
            for c in rows
        ],
    }


@router.get("/stats")
def get_statistics(db: Session = Depends(get_db)):
    total_materials = db.query(func.count(ErgMaterial.id)).scalar() or 0
    total_guides = db.query(func.count(ErgGuide.id)).scalar() or 0
    total_tih = db.query(func.count(ErgMaterial.id)).filter(ErgMaterial.is_tih == True).scalar() or 0
    total_incidents = db.query(func.count(ErgIncident.id)).scalar() or 0
    active_incidents = db.query(func.count(ErgIncident.id)).filter(ErgIncident.status == "active").scalar() or 0

    return {
        "database": {
            "total_materials": int(total_materials),
            "total_guides": int(total_guides),
            "tih_materials": int(total_tih),
            "version": "2024",
        },
        "incidents": {"total": int(total_incidents), "active": int(active_incidents)},
    }


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ERG2024 API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


def guide_to_dict(guide: ErgGuide) -> Dict[str, Any]:
    if guide is None:
        return {}
    return {
        "guide_number": guide.guide_number,
        "title": guide.title,
        "description": guide.description,
        "color": guide.color,
        "isolation": {
            "initial": {"meters": guide.initial_isolation_meters, "feet": guide.initial_isolation_feet},
            "fire": {"meters": guide.fire_isolation_meters, "feet": guide.fire_isolation_feet},
        },
        "hazards": {
            "fire_explosion": guide.fire_explosion_hazards or [],
            "health": guide.health_hazards or [],
        },
        "public_safety": {
            "protective_clothing": guide.protective_clothing,
            "evacuation_notes": guide.evacuation_notes,
        },
        "emergency_response": {
            "fire": {"small": guide.fire_small or [], "large": guide.fire_large or [], "tank": guide.fire_tank or []},
            "spill": {
                "general": guide.spill_general or [],
                "small": guide.spill_small or [],
                "large": guide.spill_large or [],
            },
            "first_aid": guide.first_aid,
        },
    }
