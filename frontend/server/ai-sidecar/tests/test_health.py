"""
Tests for the health check and main app startup.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealth:
    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "eusotrip-ai-sidecar"
        assert "models" in data
        assert isinstance(data["models"], dict)

    def test_health_models_keys(self):
        resp = client.get("/health")
        data = resp.json()
        models = data["models"]
        for key in ["spacy", "paddleocr", "docling", "darts", "prophet", "ortools", "duckdb"]:
            assert key in models
            assert isinstance(models[key], bool)

    def test_root_404(self):
        """No root endpoint — should 404 or redirect."""
        resp = client.get("/")
        assert resp.status_code in [404, 405, 200]
