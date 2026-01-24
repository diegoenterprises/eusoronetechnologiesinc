"""
TERMINALS ROUTER
FastAPI routes for terminal operations and SCADA integration
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/terminals", tags=["Terminals"])


@router.get("/")
async def list_terminals(status: Optional[str] = None, limit: int = 20):
    """List all terminals"""
    return {
        "terminals": [
            {
                "id": "term_001",
                "name": "Houston Distribution Terminal",
                "address": "1234 Refinery Rd, Houston, TX 77001",
                "status": "operational",
                "type": "distribution",
                "products": ["unleaded", "premium", "diesel"],
                "racksTotal": 12,
                "racksAvailable": 6,
            },
            {
                "id": "term_002",
                "name": "Dallas North Terminal",
                "address": "5678 Industrial Blvd, Dallas, TX 75201",
                "status": "operational",
                "type": "distribution",
                "products": ["unleaded", "diesel"],
                "racksTotal": 8,
                "racksAvailable": 4,
            },
        ],
        "total": 2,
    }


@router.get("/{terminal_id}")
async def get_terminal(terminal_id: str):
    """Get terminal details"""
    return {
        "id": terminal_id,
        "name": "Houston Distribution Terminal",
        "address": "1234 Refinery Rd, Houston, TX 77001",
        "status": "operational",
        "contact": {"name": "Terminal Manager", "phone": "555-0400"},
        "hours": "24/7",
        "products": ["unleaded", "premium", "diesel"],
        "racks": {"total": 12, "available": 6, "loading": 4, "maintenance": 2},
        "inventory": {
            "unleaded": {"level": 805000, "capacity": 1000000},
            "premium": {"level": 175000, "capacity": 250000},
            "diesel": {"level": 620000, "capacity": 750000},
        },
    }


# --- SCADA Integration ---
@router.get("/{terminal_id}/scada/overview")
async def get_scada_overview(terminal_id: str):
    """Get terminal SCADA overview"""
    return {
        "terminalId": terminal_id,
        "status": "operational",
        "lastUpdate": datetime.now().isoformat(),
        "racks": {"total": 12, "available": 6, "loading": 4, "maintenance": 1, "offline": 1},
        "throughput": {"today": 450000, "target": 500000, "unit": "gallons"},
        "alerts": [{"type": "low_inventory", "product": "premium", "severity": "warning"}],
    }


@router.get("/{terminal_id}/scada/racks")
async def get_rack_status(terminal_id: str):
    """Get rack status"""
    return {
        "racks": [
            {
                "id": "rack_001",
                "number": "R-01",
                "status": "loading",
                "product": "unleaded",
                "currentLoad": {
                    "loadNumber": "LOAD-45850",
                    "carrier": "ABC Transport LLC",
                    "gallonsLoaded": 4500,
                    "targetGallons": 8500,
                    "progress": 53,
                },
            },
            {
                "id": "rack_002",
                "number": "R-02",
                "status": "available",
                "product": "unleaded",
                "currentLoad": None,
            },
            {
                "id": "rack_003",
                "number": "R-03",
                "status": "loading",
                "product": "diesel",
                "currentLoad": {
                    "loadNumber": "LOAD-45852",
                    "carrier": "FastHaul LLC",
                    "gallonsLoaded": 6200,
                    "targetGallons": 8000,
                    "progress": 77.5,
                },
            },
        ],
    }


@router.get("/{terminal_id}/scada/tanks")
async def get_tank_levels(terminal_id: str):
    """Get tank inventory levels"""
    return {
        "tanks": [
            {"id": "tank_001", "name": "Tank A1", "product": "unleaded", "capacity": 500000, "level": 425000, "percent": 85},
            {"id": "tank_002", "name": "Tank A2", "product": "unleaded", "capacity": 500000, "level": 380000, "percent": 76},
            {"id": "tank_003", "name": "Tank B1", "product": "diesel", "capacity": 750000, "level": 620000, "percent": 82.7},
            {"id": "tank_004", "name": "Tank C1", "product": "premium", "capacity": 250000, "level": 175000, "percent": 70},
        ],
    }


@router.post("/{terminal_id}/scada/racks/{rack_id}/start")
async def start_loading(terminal_id: str, rack_id: str, load_data: dict):
    """Start loading at rack"""
    return {
        "transactionId": f"txn_{datetime.now().timestamp()}",
        "rackId": rack_id,
        "status": "loading_started",
        "startTime": datetime.now().isoformat(),
    }


@router.post("/{terminal_id}/scada/racks/{rack_id}/stop")
async def stop_loading(terminal_id: str, rack_id: str, stop_data: dict):
    """Stop loading at rack"""
    return {
        "rackId": rack_id,
        "status": "loading_stopped",
        "stoppedAt": datetime.now().isoformat(),
        "finalGallons": 8500,
    }


@router.get("/{terminal_id}/scada/alarms")
async def get_scada_alarms(terminal_id: str, active: bool = True):
    """Get SCADA alarms"""
    return {
        "alarms": [
            {
                "id": "alarm_001",
                "type": "low_level",
                "severity": "warning",
                "source": "Tank C1",
                "message": "Tank level below 75%",
                "timestamp": "2025-01-23T08:00:00Z",
                "acknowledged": False,
            },
        ],
        "summary": {"critical": 0, "warning": 1, "info": 1},
    }


# --- EIA Reporting ---
@router.get("/{terminal_id}/eia/report")
async def get_eia_report_data(terminal_id: str, report_week: str):
    """Get EIA report data"""
    return {
        "terminalId": terminal_id,
        "reportWeek": report_week,
        "reportingThreshold": 50000,
        "meetsThreshold": True,
        "data": {
            "beginningStocks": {"unleaded": 780000, "premium": 165000, "diesel": 580000},
            "receipts": {"pipeline": 350000, "truck": 50000},
            "shipments": {"truck": 300000},
            "endingStocks": {"unleaded": 805000, "premium": 175000, "diesel": 620000},
        },
        "submissionStatus": "pending",
        "dueDate": "2025-01-29",
    }


@router.post("/{terminal_id}/eia/submit")
async def submit_eia_report(terminal_id: str, report_data: dict):
    """Submit EIA report"""
    return {
        "reportId": f"eia_{datetime.now().timestamp()}",
        "status": "submitted",
        "submittedAt": datetime.now().isoformat(),
        "confirmationNumber": f"EIA-2025-{datetime.now().strftime('%H%M%S')}",
    }


# --- Appointments ---
@router.get("/{terminal_id}/appointments")
async def list_appointments(terminal_id: str, date: Optional[str] = None, limit: int = 20):
    """List terminal appointments"""
    return {
        "appointments": [
            {
                "id": "appt_001",
                "terminalId": terminal_id,
                "loadNumber": "LOAD-45850",
                "carrier": "ABC Transport LLC",
                "driver": "Mike Johnson",
                "product": "unleaded",
                "gallons": 8500,
                "appointmentTime": "2025-01-23T10:00:00Z",
                "status": "loading",
                "rack": "R-01",
            },
            {
                "id": "appt_002",
                "terminalId": terminal_id,
                "loadNumber": "LOAD-45855",
                "carrier": "Reliable Transport",
                "driver": "Tom Brown",
                "product": "diesel",
                "gallons": 8000,
                "appointmentTime": "2025-01-23T11:30:00Z",
                "status": "scheduled",
                "rack": "R-06",
            },
        ],
        "total": 24,
    }


@router.post("/{terminal_id}/appointments")
async def create_appointment(terminal_id: str, appointment_data: dict):
    """Create terminal appointment"""
    return {
        "id": f"appt_{datetime.now().timestamp()}",
        "terminalId": terminal_id,
        "status": "confirmed",
        "createdAt": datetime.now().isoformat(),
    }
