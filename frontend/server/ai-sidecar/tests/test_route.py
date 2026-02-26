"""
Tests for the Route Optimization router — OSRM directions, matrix, OR-Tools VRP.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# /route/directions
# ---------------------------------------------------------------------------

class TestDirections:
    def test_directions_valid_request(self):
        """Test directions between Houston and Dallas."""
        resp = client.post("/route/directions", json={
            "origin": {"lat": 29.7604, "lng": -95.3698},
            "destination": {"lat": 32.7767, "lng": -96.7970},
            "profile": "driving",
        })
        data = resp.json()
        assert "success" in data
        assert "distance_miles" in data
        assert "duration_hours" in data
        assert "duration_minutes" in data
        # If OSRM is reachable, should succeed
        if data["success"]:
            assert data["distance_miles"] > 0
            assert data["duration_hours"] > 0

    def test_directions_with_steps(self):
        resp = client.post("/route/directions", json={
            "origin": {"lat": 29.7604, "lng": -95.3698},
            "destination": {"lat": 30.2672, "lng": -97.7431},
            "steps": True,
        })
        data = resp.json()
        assert "success" in data
        assert "steps" in data
        if data["success"]:
            assert isinstance(data["steps"], list)

    def test_directions_same_point(self):
        resp = client.post("/route/directions", json={
            "origin": {"lat": 29.7604, "lng": -95.3698},
            "destination": {"lat": 29.7604, "lng": -95.3698},
        })
        data = resp.json()
        assert "success" in data

    @patch("routers.route.requests.get")
    def test_directions_osrm_unavailable(self, mock_get):
        mock_get.side_effect = Exception("Connection refused")
        resp = client.post("/route/directions", json={
            "origin": {"lat": 29.7604, "lng": -95.3698},
            "destination": {"lat": 32.7767, "lng": -96.7970},
        })
        data = resp.json()
        assert data["success"] is False
        assert "error" in data


# ---------------------------------------------------------------------------
# /route/matrix
# ---------------------------------------------------------------------------

class TestMatrix:
    def test_matrix_valid_request(self):
        resp = client.post("/route/matrix", json={
            "locations": [
                {"lat": 29.7604, "lng": -95.3698},
                {"lat": 32.7767, "lng": -96.7970},
                {"lat": 30.2672, "lng": -97.7431},
            ]
        })
        data = resp.json()
        assert "success" in data
        assert "distances" in data
        assert "durations" in data
        if data["success"]:
            assert len(data["distances"]) == 3
            assert len(data["durations"]) == 3

    def test_matrix_too_few_locations(self):
        resp = client.post("/route/matrix", json={
            "locations": [{"lat": 29.7604, "lng": -95.3698}]
        })
        assert resp.status_code == 400

    def test_matrix_too_many_locations(self):
        locs = [{"lat": 29.0 + i * 0.01, "lng": -95.0} for i in range(101)]
        resp = client.post("/route/matrix", json={"locations": locs})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# /route/optimize
# ---------------------------------------------------------------------------

class TestOptimize:
    def test_optimize_valid_request(self):
        resp = client.post("/route/optimize", json={
            "depot": {"lat": 29.7604, "lng": -95.3698},
            "stops": [
                {"lat": 30.2672, "lng": -97.7431, "name": "Austin"},
                {"lat": 32.7767, "lng": -96.7970, "name": "Dallas"},
                {"lat": 29.4241, "lng": -98.4936, "name": "San Antonio"},
            ],
            "max_vehicles": 1,
        })
        data = resp.json()
        assert "success" in data
        assert "routes" in data
        assert "total_distance_miles" in data
        assert "total_duration_hours" in data

    def test_optimize_no_stops(self):
        resp = client.post("/route/optimize", json={
            "depot": {"lat": 29.7604, "lng": -95.3698},
            "stops": [],
        })
        assert resp.status_code == 400

    def test_optimize_with_capacity(self):
        resp = client.post("/route/optimize", json={
            "depot": {"lat": 29.7604, "lng": -95.3698},
            "stops": [
                {"lat": 30.2672, "lng": -97.7431, "name": "Austin"},
                {"lat": 32.7767, "lng": -96.7970, "name": "Dallas"},
            ],
            "vehicle_capacity": 500,
            "stop_demands": [200, 300],
            "max_vehicles": 1,
        })
        data = resp.json()
        assert "success" in data
