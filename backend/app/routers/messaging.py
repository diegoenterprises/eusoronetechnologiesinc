"""
MESSAGING ROUTER
FastAPI routes for messaging and notifications
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/messaging", tags=["Messaging"])


@router.get("/conversations")
async def list_conversations(
    user_id: Optional[str] = None,
    conversation_type: Optional[str] = None,
    limit: int = 20
):
    """List conversations"""
    return {
        "conversations": [
            {
                "id": "conv_001",
                "type": "load",
                "loadNumber": "LOAD-45850",
                "participants": [
                    {"id": "u1", "name": "Dispatch", "role": "dispatcher"},
                    {"id": "d1", "name": "Mike Johnson", "role": "driver"},
                ],
                "lastMessage": {"content": "ETA update: 15:30", "timestamp": "2025-01-23T12:00:00Z"},
                "unreadCount": 2,
            },
            {
                "id": "conv_002",
                "type": "support",
                "subject": "Billing inquiry",
                "participants": [
                    {"id": "u1", "name": "John Broker"},
                    {"id": "support", "name": "Support Team"},
                ],
                "lastMessage": {"content": "Your issue has been resolved", "timestamp": "2025-01-22T16:00:00Z"},
                "unreadCount": 0,
            },
        ],
        "total": 15,
        "unreadTotal": 2,
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation details with messages"""
    return {
        "id": conversation_id,
        "type": "load",
        "loadNumber": "LOAD-45850",
        "participants": [
            {"id": "u1", "name": "Dispatch", "role": "dispatcher"},
            {"id": "d1", "name": "Mike Johnson", "role": "driver"},
        ],
        "messages": [
            {"id": "msg_001", "senderId": "u1", "content": "Please confirm pickup", "timestamp": "2025-01-23T08:00:00Z"},
            {"id": "msg_002", "senderId": "d1", "content": "Confirmed. On my way", "timestamp": "2025-01-23T08:05:00Z"},
            {"id": "msg_003", "senderId": "d1", "content": "Arrived at pickup", "timestamp": "2025-01-23T08:30:00Z"},
            {"id": "msg_004", "senderId": "u1", "content": "Great. Update when loaded", "timestamp": "2025-01-23T08:32:00Z"},
            {"id": "msg_005", "senderId": "d1", "content": "Loading complete. Departing now", "timestamp": "2025-01-23T09:15:00Z"},
            {"id": "msg_006", "senderId": "d1", "content": "ETA update: 15:30", "timestamp": "2025-01-23T12:00:00Z"},
        ],
    }


@router.post("/conversations")
async def create_conversation(conversation_data: dict):
    """Create a new conversation"""
    return {
        "id": f"conv_{datetime.now().timestamp()}",
        "type": conversation_data.get("type"),
        "createdAt": datetime.now().isoformat(),
    }


@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, message_data: dict):
    """Send a message in conversation"""
    return {
        "id": f"msg_{datetime.now().timestamp()}",
        "conversationId": conversation_id,
        "content": message_data.get("content"),
        "sentAt": datetime.now().isoformat(),
    }


@router.put("/conversations/{conversation_id}/read")
async def mark_conversation_read(conversation_id: str):
    """Mark conversation as read"""
    return {
        "success": True,
        "conversationId": conversation_id,
        "markedAt": datetime.now().isoformat(),
    }


# --- Notifications ---
@router.get("/notifications")
async def list_notifications(
    user_id: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 20
):
    """List notifications"""
    return {
        "notifications": [
            {
                "id": "notif_001",
                "type": "load_update",
                "title": "Load Status Update",
                "message": "LOAD-45850 has been picked up",
                "timestamp": "2025-01-23T09:15:00Z",
                "read": True,
                "data": {"loadId": "load_001", "status": "picked_up"},
            },
            {
                "id": "notif_002",
                "type": "document_required",
                "title": "Document Required",
                "message": "POD required for LOAD-45845",
                "timestamp": "2025-01-22T18:00:00Z",
                "read": False,
                "data": {"loadId": "load_002"},
            },
            {
                "id": "notif_003",
                "type": "payment_received",
                "title": "Payment Received",
                "message": "Payment of $2,800 received from ExxonMobil",
                "timestamp": "2025-01-20T14:00:00Z",
                "read": True,
                "data": {"invoiceId": "inv_002", "amount": 2800},
            },
        ],
        "total": 25,
        "unreadCount": 3,
    }


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    return {
        "success": True,
        "notificationId": notification_id,
        "markedAt": datetime.now().isoformat(),
    }


@router.put("/notifications/read-all")
async def mark_all_notifications_read():
    """Mark all notifications as read"""
    return {
        "success": True,
        "count": 3,
        "markedAt": datetime.now().isoformat(),
    }


@router.get("/notifications/preferences")
async def get_notification_preferences():
    """Get notification preferences"""
    return {
        "email": {
            "loadUpdates": True,
            "paymentNotifications": True,
            "documentReminders": True,
            "marketingEmails": False,
        },
        "push": {
            "loadUpdates": True,
            "paymentNotifications": True,
            "documentReminders": True,
            "chatMessages": True,
        },
        "sms": {
            "urgentAlerts": True,
            "loadUpdates": False,
        },
    }


@router.put("/notifications/preferences")
async def update_notification_preferences(preferences: dict):
    """Update notification preferences"""
    return {
        "success": True,
        "updatedAt": datetime.now().isoformat(),
    }
