"""
DRIVERS ROUTER
FastAPI routes for driver management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/")
async def list_drivers(
    status: Optional[str] = None,
    company_id: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0
):
    """List all drivers with optional filters"""
    drivers = [
        {
            "id": "d1",
            "name": "Mike Johnson",
            "email": "mike.johnson@example.com",
            "phone": "555-0100",
            "status": "active",
            "cdlNumber": "TX-12345678",
            "cdlState": "TX",
            "cdlExpiration": "2026-03-15",
            "hosStatus": "driving",
            "hoursRemaining": 6.5,
            "currentLocation": {"lat": 31.5493, "lng": -97.1467},
            "assignedVehicle": "TRK-101",
            "rating": 4.8,
            "loadsCompleted": 342,
        },
        {
            "id": "d2",
            "name": "Sarah Williams",
            "email": "sarah.williams@example.com",
            "phone": "555-0101",
            "status": "active",
            "cdlNumber": "TX-87654321",
            "cdlState": "TX",
            "cdlExpiration": "2025-11-20",
            "hosStatus": "off_duty",
            "hoursRemaining": 11.0,
            "currentLocation": {"lat": 29.7604, "lng": -95.3698},
            "assignedVehicle": "TRK-102",
            "rating": 4.7,
            "loadsCompleted": 289,
        },
    ]
    return {"drivers": drivers, "total": len(drivers)}


@router.get("/{driver_id}")
async def get_driver(driver_id: str):
    """Get driver by ID"""
    return {
        "id": driver_id,
        "name": "Mike Johnson",
        "email": "mike.johnson@example.com",
        "phone": "555-0100",
        "status": "active",
        "cdl": {
            "number": "TX-12345678",
            "state": "TX",
            "class": "A",
            "endorsements": ["H", "N", "T"],
            "restrictions": [],
            "expiration": "2026-03-15",
        },
        "medical": {
            "cardNumber": "MED-2024-12345",
            "expiration": "2026-01-15",
            "examiner": "Dr. Smith Medical",
        },
        "hos": {
            "status": "driving",
            "drivingRemaining": 6.5,
            "onDutyRemaining": 8.5,
            "cycleRemaining": 45.0,
            "lastBreak": "2025-01-23T06:00:00Z",
        },
        "performance": {
            "loadsCompleted": 342,
            "onTimeRate": 0.96,
            "safetyScore": 98,
            "rating": 4.8,
        },
        "assignedVehicle": {"id": "v1", "unitNumber": "TRK-101"},
        "hireDate": "2022-03-15",
    }


@router.get("/{driver_id}/hos")
async def get_driver_hos(driver_id: str):
    """Get driver HOS status"""
    return {
        "driverId": driver_id,
        "status": "driving",
        "currentDutyStatus": "D",
        "drivingTime": {
            "used": 4.5,
            "remaining": 6.5,
            "limit": 11.0,
        },
        "onDutyTime": {
            "used": 5.5,
            "remaining": 8.5,
            "limit": 14.0,
        },
        "cycleTime": {
            "used": 25.0,
            "remaining": 45.0,
            "limit": 70.0,
        },
        "lastBreak": "2025-01-23T06:00:00Z",
        "nextBreakDue": "2025-01-23T14:00:00Z",
        "violations": [],
        "logs": [
            {"status": "OFF", "start": "2025-01-22T22:00:00Z", "end": "2025-01-23T06:00:00Z", "duration": 8.0},
            {"status": "ON", "start": "2025-01-23T06:00:00Z", "end": "2025-01-23T06:30:00Z", "duration": 0.5},
            {"status": "D", "start": "2025-01-23T06:30:00Z", "end": None, "duration": 4.5},
        ],
    }


@router.get("/{driver_id}/loads")
async def get_driver_loads(
    driver_id: str,
    status: Optional[str] = None,
    limit: int = 20
):
    """Get loads assigned to driver"""
    return {
        "loads": [
            {
                "id": "load_001",
                "loadNumber": "LOAD-45850",
                "status": "in_transit",
                "origin": "Houston, TX",
                "destination": "Dallas, TX",
                "pickupDate": "2025-01-23",
                "deliveryDate": "2025-01-23",
                "rate": 1250.00,
            },
        ],
        "total": 1,
    }


@router.post("/")
async def create_driver(driver_data: dict):
    """Create a new driver"""
    return {
        "id": f"d_{datetime.now().timestamp()}",
        "status": "pending",
        "createdAt": datetime.now().isoformat(),
    }


@router.put("/{driver_id}")
async def update_driver(driver_id: str, driver_data: dict):
    """Update driver information"""
    return {
        "success": True,
        "id": driver_id,
        "updatedAt": datetime.now().isoformat(),
    }


@router.post("/{driver_id}/assign-vehicle")
async def assign_vehicle(driver_id: str, vehicle_id: str):
    """Assign vehicle to driver"""
    return {
        "success": True,
        "driverId": driver_id,
        "vehicleId": vehicle_id,
        "assignedAt": datetime.now().isoformat(),
    }
