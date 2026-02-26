"""
Tests for the Forecast router — demand, rates, seasonal decomposition.
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_weekly_history(weeks: int = 12, base: float = 100.0, trend: float = 2.0) -> list:
    """Generate synthetic weekly time series data."""
    now = datetime.now()
    return [
        {
            "date": (now - timedelta(weeks=weeks - i)).strftime("%Y-%m-%d"),
            "value": round(base + trend * i + (i % 3) * 5, 2),
        }
        for i in range(weeks)
    ]


def make_rate_history(weeks: int = 12, base: float = 2.50) -> list:
    now = datetime.now()
    return [
        {
            "date": (now - timedelta(weeks=weeks - i)).strftime("%Y-%m-%d"),
            "value": round(base + 0.05 * (i % 4) - 0.02 * (i % 3), 2),
        }
        for i in range(weeks)
    ]


# ---------------------------------------------------------------------------
# /forecast/demand
# ---------------------------------------------------------------------------

class TestDemandForecast:
    def test_demand_basic(self):
        resp = client.post("/forecast/demand", json={
            "lane": "TX-IL",
            "history": make_weekly_history(12),
            "horizon_weeks": 4,
        })
        data = resp.json()
        assert data["success"] is True
        assert data["lane"] == "TX-IL"
        assert len(data["forecast"]) == 4
        assert data["trend"] in ["RISING", "STABLE", "DECLINING"]
        assert data["model_used"] != ""

    def test_demand_short_history(self):
        resp = client.post("/forecast/demand", json={
            "lane": "TX-IL",
            "history": make_weekly_history(4),
            "horizon_weeks": 2,
        })
        data = resp.json()
        assert data["success"] is True
        assert len(data["forecast"]) == 2

    def test_demand_too_few_points(self):
        resp = client.post("/forecast/demand", json={
            "lane": "TX-IL",
            "history": [{"date": "2026-01-01", "value": 10}],
            "horizon_weeks": 4,
        })
        assert resp.status_code == 400

    def test_demand_confidence_intervals(self):
        resp = client.post("/forecast/demand", json={
            "lane": "TX-OK",
            "history": make_weekly_history(20),
            "horizon_weeks": 4,
            "include_confidence": True,
        })
        data = resp.json()
        if data["success"]:
            for pt in data["forecast"]:
                assert "predicted" in pt
                assert "lower" in pt
                assert "upper" in pt
                assert pt["lower"] <= pt["predicted"] <= pt["upper"]

    def test_demand_seasonal_factor(self):
        resp = client.post("/forecast/demand", json={
            "lane": "ALL",
            "history": make_weekly_history(16),
            "horizon_weeks": 4,
        })
        data = resp.json()
        if data["success"]:
            assert isinstance(data["seasonal_factor"], (int, float))


# ---------------------------------------------------------------------------
# /forecast/rates
# ---------------------------------------------------------------------------

class TestRateForecast:
    def test_rates_basic(self):
        resp = client.post("/forecast/rates", json={
            "lane": "TX-IL",
            "history": make_rate_history(12),
            "horizon_weeks": 4,
        })
        data = resp.json()
        assert data["success"] is True
        assert data["lane"] == "TX-IL"
        assert len(data["forecast"]) == 4
        assert "volatility" in data
        assert data["model_used"] != ""

    def test_rates_too_few_points(self):
        resp = client.post("/forecast/rates", json={
            "lane": "TX-IL",
            "history": [{"date": "2026-01-01", "value": 2.5}],
            "horizon_weeks": 4,
        })
        assert resp.status_code == 400

    def test_rates_trend_detection(self):
        # Create rising rate data
        now = datetime.now()
        rising = [
            {"date": (now - timedelta(weeks=12 - i)).strftime("%Y-%m-%d"), "value": 2.0 + 0.1 * i}
            for i in range(12)
        ]
        resp = client.post("/forecast/rates", json={
            "lane": "TX-CA",
            "history": rising,
            "horizon_weeks": 4,
        })
        data = resp.json()
        if data["success"]:
            assert data["trend"] == "RISING"


# ---------------------------------------------------------------------------
# /forecast/seasonal
# ---------------------------------------------------------------------------

class TestSeasonalDecomposition:
    def test_seasonal_basic(self):
        # Need at least `period` data points
        resp = client.post("/forecast/seasonal", json={
            "history": make_weekly_history(52, base=50, trend=0.5),
            "period": 12,
        })
        data = resp.json()
        assert "success" in data
        if data["success"]:
            assert len(data["trend"]) > 0
            assert len(data["seasonal"]) > 0
            assert isinstance(data["seasonal_strength"], (int, float))

    def test_seasonal_too_few_points(self):
        resp = client.post("/forecast/seasonal", json={
            "history": make_weekly_history(10),
            "period": 52,
        })
        assert resp.status_code == 400
