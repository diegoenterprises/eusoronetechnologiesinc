"""
GAMIFICATION ROUTER
FastAPI routes for driver achievements, points, and rewards
"""

from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/profile")
async def get_gamification_profile(user_id: Optional[str] = None):
    """Get user gamification profile"""
    return {
        "userId": user_id or "d1",
        "name": "Mike Johnson",
        "level": 12,
        "title": "Road Warrior",
        "totalPoints": 4850,
        "pointsToNextLevel": 150,
        "rank": 15,
        "totalUsers": 450,
        "percentile": 96.7,
        "streaks": {
            "currentOnTime": 28,
            "longestOnTime": 45,
            "currentSafe": 156,
        },
    }


@router.get("/achievements")
async def get_achievements(
    user_id: Optional[str] = None,
    category: str = "all"
):
    """Get user achievements"""
    return {
        "earned": [
            {"id": "ach_001", "name": "First Load", "category": "milestones", "points": 100, "earnedAt": "2022-03-20"},
            {"id": "ach_002", "name": "Century Club", "category": "milestones", "points": 500, "earnedAt": "2023-05-15"},
            {"id": "ach_003", "name": "Safety First", "category": "safety", "points": 250, "earnedAt": "2022-04-20"},
            {"id": "ach_004", "name": "Road Warrior", "category": "milestones", "points": 1000, "earnedAt": "2024-08-10"},
        ],
        "locked": [
            {"id": "ach_007", "name": "Legend", "category": "milestones", "points": 2500, "progress": 342, "target": 1000},
        ],
        "totalEarned": 6,
        "totalPoints": 2800,
    }


@router.get("/leaderboard")
async def get_leaderboard(
    period: str = "month",
    category: str = "points",
    limit: int = 20
):
    """Get leaderboard"""
    return {
        "period": period,
        "category": category,
        "leaders": [
            {"rank": 1, "userId": "d5", "name": "James Wilson", "value": 5200, "badge": "champion"},
            {"rank": 2, "userId": "d8", "name": "Emily Martinez", "value": 5150, "badge": "gold"},
            {"rank": 3, "userId": "d2", "name": "Sarah Williams", "value": 5050, "badge": "silver"},
            {"rank": 4, "userId": "d10", "name": "Robert Davis", "value": 4950, "badge": "bronze"},
            {"rank": 5, "userId": "d1", "name": "Mike Johnson", "value": 4850},
        ],
        "myRank": 5,
        "totalParticipants": 450,
    }


@router.get("/rewards")
async def get_rewards_catalog():
    """Get rewards catalog"""
    return {
        "availablePoints": 4850,
        "rewards": [
            {"id": "reward_001", "name": "EusoTrip Cap", "category": "merchandise", "pointsCost": 500},
            {"id": "reward_002", "name": "$25 Fuel Card", "category": "gift_cards", "pointsCost": 2500},
            {"id": "reward_003", "name": "$50 Amazon Gift Card", "category": "gift_cards", "pointsCost": 5000},
            {"id": "reward_004", "name": "Priority Dispatch", "category": "perks", "pointsCost": 1000},
        ],
    }


@router.post("/rewards/redeem")
async def redeem_reward(redemption_data: dict):
    """Redeem a reward"""
    return {
        "redemptionId": f"redeem_{datetime.now().timestamp()}",
        "rewardId": redemption_data.get("rewardId"),
        "pointsDeducted": 500,
        "remainingPoints": 4350,
        "status": "processing",
        "redeemedAt": datetime.now().isoformat(),
    }


@router.get("/points/history")
async def get_points_history(limit: int = 20, offset: int = 0):
    """Get points transaction history"""
    return {
        "transactions": [
            {"id": "pt_001", "type": "earned", "amount": 50, "reason": "On-time delivery bonus", "date": "2025-01-23"},
            {"id": "pt_002", "type": "earned", "amount": 25, "reason": "Customer 5-star rating", "date": "2025-01-22"},
            {"id": "pt_003", "type": "earned", "amount": 100, "reason": "Weekly streak bonus", "date": "2025-01-21"},
            {"id": "pt_004", "type": "redeemed", "amount": -500, "reason": "Reward: EusoTrip Cap", "date": "2025-01-20"},
        ],
        "total": 125,
    }


@router.get("/challenges")
async def get_challenges():
    """Get active and upcoming challenges"""
    return {
        "active": [
            {
                "id": "challenge_001",
                "name": "January Sprint",
                "description": "Complete 20 loads in January",
                "reward": 500,
                "progress": 15,
                "target": 20,
                "endsAt": "2025-01-31T23:59:59Z",
            },
        ],
        "upcoming": [
            {
                "id": "challenge_003",
                "name": "Safety Month",
                "description": "Zero incidents in February",
                "reward": 1000,
                "startsAt": "2025-02-01T00:00:00Z",
            },
        ],
    }


@router.get("/badges")
async def get_badges(user_id: Optional[str] = None):
    """Get user badges"""
    return {
        "displayBadges": [
            {"id": "badge_001", "name": "Safety Star", "icon": "shield", "tier": "gold"},
            {"id": "badge_002", "name": "On-Time Pro", "icon": "clock", "tier": "platinum"},
        ],
        "allBadges": [
            {"id": "badge_001", "name": "Safety Star", "tier": "gold", "earned": True},
            {"id": "badge_002", "name": "On-Time Pro", "tier": "platinum", "earned": True},
            {"id": "badge_006", "name": "Legend", "tier": "legendary", "earned": False, "progress": 34.2},
        ],
    }
