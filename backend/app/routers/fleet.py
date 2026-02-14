"""
FLEET ROUTER
FastAPI routes for fleet and vehicle management
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/fleet", tags=["Fleet"])


@router.get("/vehicles")
async def list_vehicles(
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0
):
    """List all fleet vehicles"""
    vehicles = [
        {
            "id": "v1",
            "unitNumber": "TRK-101",
            "vin": "1HTMKAAN5CH123456",
            "type": "tractor",
            "make": "Peterbilt",
            "model": "579",
            "year": 2022,
            "status": "active",
            "mileage": 125000,
            "fuelType": "diesel",
            "assignedDriver": {"id": "d1", "name": "Mike Johnson"},
            "currentLocation": {"lat": 31.5493, "lng": -97.1467},
            "lastInspection": "2025-01-23",
            "nextPM": "2025-02-15",
        },
        {
            "id": "v2",
            "unitNumber": "TRK-102",
            "vin": "1HTMKAAN5CH654321",
            "type": "tractor",
            "make": "Kenworth",
            "model": "T680",
            "year": 2023,
            "status": "active",
            "mileage": 85000,
            "fuelType": "diesel",
            "assignedDriver": {"id": "d2", "name": "Sarah Williams"},
            "currentLocation": {"lat": 29.7604, "lng": -95.3698},
            "lastInspection": "2025-01-22",
            "nextPM": "2025-03-01",
        },
    ]
    return {"vehicles": vehicles, "total": len(vehicles)}


@router.get("/vehicles/{vehicle_id}")
async def get_vehicle(vehicle_id: str):
    """Get vehicle by ID"""
    return {
        "id": vehicle_id,
        "unitNumber": "TRK-101",
        "vin": "1HTMKAAN5CH123456",
        "type": "tractor",
        "make": "Peterbilt",
        "model": "579",
        "year": 2022,
        "status": "active",
        "registration": {
            "plate": "TX-ABC-101",
            "state": "TX",
            "expiration": "2025-12-31",
        },
        "specifications": {
            "engineType": "Cummins X15",
            "horsepower": 500,
            "transmission": "Eaton Fuller 18-speed",
            "fuelCapacity": 300,
            "sleeper": True,
        },
        "maintenance": {
            "lastPM": "2025-01-10",
            "nextPM": "2025-02-15",
            "pmInterval": 25000,
            "currentMileage": 125000,
            "milesUntilPM": 5000,
        },
        "certifications": [
            {"type": "DOT Annual", "expiration": "2025-06-15"},
            {"type": "CARB Compliant", "expiration": "2026-01-01"},
        ],
        "assignedDriver": {"id": "d1", "name": "Mike Johnson"},
        "currentLocation": {"lat": 31.5493, "lng": -97.1467, "updatedAt": datetime.now().isoformat()},
    }


@router.get("/trailers")
async def list_trailers(
    status: Optional[str] = None,
    trailer_type: Optional[str] = None,
    limit: int = 20
):
    """List all trailers"""
    trailers = [
        {
            "id": "eq_001",
            "unitNumber": "TRL-201",
            "type": "tanker",
            "capacity": 9000,
            "status": "in_use",
            "assignedTo": {"vehicleId": "v1", "unitNumber": "TRK-101"},
            "lastInspection": "2025-01-20",
        },
        {
            "id": "eq_002",
            "unitNumber": "TRL-202",
            "type": "tanker",
            "capacity": 9000,
            "status": "available",
            "assignedTo": None,
            "lastInspection": "2025-01-18",
        },
    ]
    return {"trailers": trailers, "total": len(trailers)}


@router.get("/statistics")
async def get_fleet_statistics():
    """Get fleet statistics"""
    return {
        "vehicles": {
            "total": 45,
            "active": 38,
            "maintenance": 5,
            "outOfService": 2,
        },
        "trailers": {
            "total": 60,
            "inUse": 42,
            "available": 15,
            "maintenance": 3,
        },
        "utilization": {
            "vehicleUtilization": 0.84,
            "trailerUtilization": 0.70,
            "avgMilesPerDay": 450,
        },
        "maintenance": {
            "pmsDueThisWeek": 3,
            "openWorkOrders": 8,
            "avgDowntime": 2.5,
        },
        "fuel": {
            "totalGallonsYTD": 125000,
            "avgMPG": 6.8,
            "fuelCostYTD": 375000,
        },
    }


@router.post("/vehicles")
async def create_vehicle(vehicle_data: dict):
    """Add new vehicle to fleet"""
    return {
        "id": f"v_{datetime.now().timestamp()}",
        "status": "pending_inspection",
        "createdAt": datetime.now().isoformat(),
    }


@router.put("/vehicles/{vehicle_id}")
async def update_vehicle(vehicle_id: str, vehicle_data: dict):
    """Update vehicle information"""
    return {
        "success": True,
        "id": vehicle_id,
        "updatedAt": datetime.now().isoformat(),
    }


@router.post("/vehicles/{vehicle_id}/maintenance")
async def schedule_maintenance(vehicle_id: str, maintenance_data: dict):
    """Schedule vehicle maintenance"""
    return {
        "workOrderId": f"wo_{datetime.now().timestamp()}",
        "vehicleId": vehicle_id,
        "scheduledDate": maintenance_data.get("scheduledDate"),
        "status": "scheduled",
    }
