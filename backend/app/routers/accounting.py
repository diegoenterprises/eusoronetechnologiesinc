"""
ACCOUNTING ROUTER
FastAPI routes for accounting, invoicing, and financial management
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/accounting", tags=["Accounting"])


@router.get("/receivables")
async def get_accounts_receivable(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 20
):
    """Get accounts receivable (invoices)"""
    return {
        "invoices": [
            {
                "id": "inv_001",
                "invoiceNumber": "INV-2025-00450",
                "customer": {"id": "cust_001", "name": "Shell Oil Company"},
                "amount": 3500,
                "paid": 0,
                "balance": 3500,
                "status": "sent",
                "dueDate": "2025-02-15",
                "createdAt": "2025-01-15",
            },
            {
                "id": "inv_002",
                "invoiceNumber": "INV-2025-00445",
                "customer": {"id": "cust_002", "name": "ExxonMobil"},
                "amount": 2800,
                "paid": 2800,
                "balance": 0,
                "status": "paid",
                "dueDate": "2025-02-01",
                "paidAt": "2025-01-20",
            },
        ],
        "summary": {"totalOutstanding": 5600, "totalOverdue": 2100},
    }


@router.get("/payables")
async def get_accounts_payable(
    status: Optional[str] = None,
    vendor_id: Optional[str] = None,
    limit: int = 20
):
    """Get accounts payable"""
    return {
        "payables": [
            {"id": "pay_001", "vendor": "FleetPro Maintenance", "amount": 850, "status": "pending", "dueDate": "2025-01-30"},
            {"id": "pay_002", "vendor": "Pilot Flying J", "amount": 4500, "status": "approved", "dueDate": "2025-02-05"},
        ],
        "summary": {"totalPending": 850, "totalApproved": 4500},
    }


@router.post("/invoices")
async def create_invoice(invoice_data: dict):
    """Create a new invoice"""
    return {
        "id": f"inv_{datetime.now().timestamp()}",
        "invoiceNumber": f"INV-2025-{datetime.now().strftime('%H%M%S')}",
        "status": "draft",
        "createdAt": datetime.now().isoformat(),
    }


@router.post("/invoices/{invoice_id}/send")
async def send_invoice(invoice_id: str, send_data: dict):
    """Send invoice to customer"""
    return {
        "success": True,
        "invoiceId": invoice_id,
        "status": "sent",
        "sentTo": send_data.get("email"),
        "sentAt": datetime.now().isoformat(),
    }


@router.post("/payments")
async def record_payment(payment_data: dict):
    """Record a payment"""
    return {
        "paymentId": f"pmt_{datetime.now().timestamp()}",
        "invoiceId": payment_data.get("invoiceId"),
        "amount": payment_data.get("amount"),
        "recordedAt": datetime.now().isoformat(),
    }


@router.get("/expenses")
async def get_expenses(
    expense_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    """Get expense transactions"""
    return {
        "expenses": [
            {"id": "exp_001", "type": "fuel", "description": "Fuel - TRK-101", "amount": 458.08, "date": "2025-01-23"},
            {"id": "exp_002", "type": "maintenance", "description": "PM Service", "amount": 850, "date": "2025-01-20"},
            {"id": "exp_003", "type": "tolls", "description": "Toll Charges", "amount": 45.50, "date": "2025-01-23"},
        ],
        "total": 3,
    }


@router.get("/profit-loss")
async def get_profit_loss(period: str = "month"):
    """Get profit and loss statement"""
    return {
        "period": period,
        "revenue": {
            "linehaul": 125000,
            "fuelSurcharge": 18500,
            "accessorials": 4500,
            "total": 148000,
        },
        "expenses": {
            "fuel": 42000,
            "driverPay": 38000,
            "maintenance": 8500,
            "insurance": 12000,
            "total": 113500,
        },
        "grossProfit": 34500,
        "grossMargin": 0.233,
    }


@router.get("/cash-flow")
async def get_cash_flow(period: str = "month"):
    """Get cash flow statement"""
    return {
        "period": period,
        "openingBalance": 85000,
        "inflows": {"customerPayments": 125000, "other": 2500, "total": 127500},
        "outflows": {"vendorPayments": 45000, "payroll": 38000, "fuel": 28000, "total": 119500},
        "netCashFlow": 8000,
        "closingBalance": 93000,
    }


@router.get("/aging")
async def get_aging_report():
    """Get accounts receivable aging report"""
    return {
        "current": {"count": 8, "amount": 25000},
        "days1to30": {"count": 5, "amount": 15000},
        "days31to60": {"count": 3, "amount": 8500},
        "days61to90": {"count": 2, "amount": 4200},
        "over90": {"count": 1, "amount": 2100},
        "total": {"count": 19, "amount": 54800},
    }


# --- Factoring ---
@router.get("/factoring/overview")
async def get_factoring_overview():
    """Get factoring account overview"""
    return {
        "account": {
            "status": "active",
            "creditLimit": 100000,
            "availableCredit": 75000,
            "usedCredit": 25000,
            "factoringRate": 0.025,
            "advanceRate": 0.95,
        },
        "currentPeriod": {
            "invoicesSubmitted": 12,
            "totalFactored": 45000,
            "feesCharged": 1125,
        },
    }


@router.post("/factoring/submit")
async def submit_for_factoring(factoring_data: dict):
    """Submit invoice for factoring"""
    return {
        "factoringId": f"fact_{datetime.now().timestamp()}",
        "invoiceAmount": factoring_data.get("invoiceAmount"),
        "advanceAmount": factoring_data.get("invoiceAmount", 0) * 0.95,
        "status": "submitted",
        "submittedAt": datetime.now().isoformat(),
    }


@router.get("/factoring/invoices")
async def get_factored_invoices(status: Optional[str] = None, limit: int = 20):
    """Get factored invoices"""
    return {
        "invoices": [
            {
                "id": "fact_001",
                "invoiceNumber": "INV-2025-00450",
                "customer": "Shell Oil Company",
                "invoiceAmount": 5000,
                "advanceAmount": 4750,
                "status": "funded",
                "fundedAt": "2025-01-23T14:00:00Z",
            },
        ],
        "total": 12,
    }
