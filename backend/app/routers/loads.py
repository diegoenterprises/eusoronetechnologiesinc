"""
LOADS ROUTER
FastAPI routes for load management and load board
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/loads", tags=["Loads"])


@router.get("/")
async def list_loads(
    status: Optional[str] = None,
    shipper_id: Optional[str] = None,
    carrier_id: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0
):
    """List all loads with optional filters"""
    loads = [
        {
            "id": "load_001",
            "loadNumber": "LOAD-45850",
            "status": "in_transit",
            "shipper": {"id": "ship_001", "name": "Shell Oil Company"},
            "carrier": {"id": "carr_001", "name": "ABC Transport LLC"},
            "origin": {"city": "Houston", "state": "TX"},
            "destination": {"city": "Dallas", "state": "TX"},
            "pickupDate": "2025-01-23",
            "deliveryDate": "2025-01-23",
            "commodity": "Unleaded Gasoline",
            "weight": 58000,
            "rate": 1250.00,
            "equipment": "tanker",
            "hazmat": True,
        },
        {
            "id": "load_002",
            "loadNumber": "LOAD-45845",
            "status": "delivered",
            "shipper": {"id": "ship_002", "name": "ExxonMobil"},
            "carrier": {"id": "carr_001", "name": "ABC Transport LLC"},
            "origin": {"city": "Houston", "state": "TX"},
            "destination": {"city": "San Antonio", "state": "TX"},
            "pickupDate": "2025-01-22",
            "deliveryDate": "2025-01-22",
            "commodity": "Diesel Fuel",
            "weight": 56000,
            "rate": 980.00,
            "equipment": "tanker",
            "hazmat": True,
        },
    ]
    return {"loads": loads, "total": len(loads)}


@router.get("/board")
async def search_load_board(
    origin_state: str,
    destination_state: Optional[str] = None,
    equipment_type: Optional[str] = None,
    pickup_date_start: Optional[str] = None,
    min_rate: Optional[float] = None,
    hazmat: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    """Search load board for available loads"""
    loads = [
        {
            "id": "lb_001",
            "loadNumber": "LB-2025-00456",
            "shipper": "Shell Oil Company",
            "origin": {"city": "Houston", "state": "TX"},
            "destination": {"city": "Dallas", "state": "TX"},
            "distance": 239,
            "pickupDate": "2025-01-24",
            "deliveryDate": "2025-01-24",
            "equipmentType": "tanker",
            "weight": 58000,
            "commodity": "Unleaded Gasoline",
            "hazmat": True,
            "rate": 850,
            "ratePerMile": 3.56,
            "postedAt": "2025-01-23T08:00:00Z",
        },
    ]
    return {
        "loads": loads,
        "total": len(loads),
        "marketStats": {"avgRate": 3.40, "totalLoads": 156, "loadToTruckRatio": 1.8},
    }


@router.get("/{load_id}")
async def get_load(load_id: str):
    """Get load details by ID"""
    return {
        "id": load_id,
        "loadNumber": "LOAD-45850",
        "status": "in_transit",
        "shipper": {
            "id": "ship_001",
            "name": "Shell Oil Company",
            "contact": "Sarah Shipper",
            "phone": "555-0200",
        },
        "carrier": {
            "id": "carr_001",
            "name": "ABC Transport LLC",
            "mc": "MC-123456",
            "dot": "1234567",
        },
        "driver": {"id": "d1", "name": "Mike Johnson", "phone": "555-0100"},
        "vehicle": {"id": "v1", "unitNumber": "TRK-101"},
        "trailer": {"id": "eq_001", "unitNumber": "TRL-201"},
        "origin": {
            "facility": "Shell Houston Terminal",
            "address": "1234 Refinery Rd",
            "city": "Houston",
            "state": "TX",
            "zip": "77001",
        },
        "destination": {
            "facility": "7-Eleven Distribution Center",
            "address": "5678 Commerce Dr",
            "city": "Dallas",
            "state": "TX",
            "zip": "75201",
        },
        "pickup": {
            "date": "2025-01-23",
            "time": "08:00",
            "actualTime": "08:15",
        },
        "delivery": {
            "date": "2025-01-23",
            "time": "16:00",
            "eta": "15:30",
        },
        "freight": {
            "commodity": "Unleaded Gasoline",
            "weight": 58000,
            "hazmat": True,
            "hazmatClass": "Class 3 Flammable",
            "unNumber": "UN1203",
        },
        "rate": 1250.00,
        "distance": 239,
        "ratePerMile": 5.23,
        "tracking": {
            "currentLocation": {"lat": 31.5493, "lng": -97.1467},
            "lastUpdate": datetime.now().isoformat(),
            "milesRemaining": 85,
        },
    }


@router.post("/")
async def create_load(load_data: dict):
    """Create a new load"""
    return {
        "id": f"load_{datetime.now().timestamp()}",
        "loadNumber": f"LOAD-{datetime.now().strftime('%H%M%S')}",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
    }


@router.put("/{load_id}/status")
async def update_load_status(load_id: str, status_data: dict):
    """Update load status"""
    return {
        "success": True,
        "loadId": load_id,
        "newStatus": status_data.get("status"),
        "updatedAt": datetime.now().isoformat(),
    }


@router.post("/{load_id}/assign")
async def assign_load(load_id: str, assignment_data: dict):
    """Assign carrier/driver to load"""
    return {
        "success": True,
        "loadId": load_id,
        "carrierId": assignment_data.get("carrierId"),
        "driverId": assignment_data.get("driverId"),
        "assignedAt": datetime.now().isoformat(),
    }


@router.get("/{load_id}/tracking")
async def get_load_tracking(load_id: str):
    """Get real-time load tracking"""
    return {
        "loadId": load_id,
        "status": "in_transit",
        "currentLocation": {
            "lat": 31.5493,
            "lng": -97.1467,
            "address": "I-35 N, Waco, TX",
            "updatedAt": datetime.now().isoformat(),
        },
        "eta": "2025-01-23T15:30:00Z",
        "milesRemaining": 85,
        "milesCompleted": 154,
        "driver": {"name": "Mike Johnson", "phone": "555-0100"},
    }


@router.get("/{load_id}/documents")
async def get_load_documents(load_id: str):
    """Get load documents (BOL, POD, etc.)"""
    return {
        "documents": [
            {"id": "doc_001", "type": "bol", "name": "Bill of Lading", "uploadedAt": "2025-01-23T08:00:00Z"},
            {"id": "doc_002", "type": "rate_con", "name": "Rate Confirmation", "uploadedAt": "2025-01-22T14:00:00Z"},
        ],
    }
