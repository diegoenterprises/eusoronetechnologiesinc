"""
Tests for the NLP router — entity extraction, load query parsing, text classification.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# /nlp/entities
# ---------------------------------------------------------------------------

class TestEntities:
    def test_entities_basic(self):
        resp = client.post("/nlp/entities", json={
            "text": "Ship 40,000 lbs of crude oil from Houston, Texas to Chicago, Illinois by January 15th."
        })
        data = resp.json()
        assert "success" in data
        assert "entities" in data
        if data["success"]:
            labels = [e["label"] for e in data["entities"]]
            # Should detect at least locations and dates
            assert any(l in labels for l in ["GPE", "LOC", "DATE"])

    def test_entities_filter_types(self):
        resp = client.post("/nlp/entities", json={
            "text": "Deliver to Dallas, TX for $5,000 by Friday",
            "entity_types": ["GPE"],
        })
        data = resp.json()
        if data["success"] and data["entities"]:
            assert all(e["label"] == "GPE" for e in data["entities"])

    def test_entities_empty_text(self):
        resp = client.post("/nlp/entities", json={"text": ""})
        data = resp.json()
        assert data["success"] is True
        assert data["entities"] == []


# ---------------------------------------------------------------------------
# /nlp/parse-load
# ---------------------------------------------------------------------------

class TestParseLoad:
    def test_parse_basic_query(self):
        resp = client.post("/nlp/parse-load", json={
            "query": "flatbed from Houston to Chicago next week under $3/mile"
        })
        data = resp.json()
        assert data["success"] is True
        p = data["parsed"]
        assert p.get("equipment") == "FLATBED"
        assert p.get("max_rate") == 3.0
        # Should detect origin/dest
        assert p.get("origin") is not None or p.get("destination") is not None

    def test_parse_hazmat_query(self):
        resp = client.post("/nlp/parse-load", json={
            "query": "hazmat tanker load from Midland TX"
        })
        data = resp.json()
        assert data["success"] is True
        assert data["parsed"]["hazmat"] is True

    def test_parse_rate_over(self):
        resp = client.post("/nlp/parse-load", json={
            "query": "reefer loads over $4/mile"
        })
        data = resp.json()
        assert data["success"] is True
        p = data["parsed"]
        assert p.get("equipment") == "REEFER"
        assert p.get("min_rate") == 4.0

    def test_parse_equipment_types(self):
        """Test various equipment type detection."""
        cases = [
            ("dry van loads", "DRY_VAN"),
            ("step deck from Dallas", "STEP_DECK"),
            ("tanker load near Houston", "TANKER"),
            ("lowboy needed", "LOWBOY"),
        ]
        for query, expected in cases:
            resp = client.post("/nlp/parse-load", json={"query": query})
            data = resp.json()
            assert data["success"] is True
            assert data["parsed"]["equipment"] == expected, f"Failed for '{query}': got {data['parsed']['equipment']}"

    def test_parse_empty_query(self):
        resp = client.post("/nlp/parse-load", json={"query": ""})
        data = resp.json()
        assert data["success"] is True

    def test_parse_weight(self):
        resp = client.post("/nlp/parse-load", json={
            "query": "40000 lbs flatbed"
        })
        data = resp.json()
        assert data["success"] is True
        assert data["parsed"].get("weight") is not None


# ---------------------------------------------------------------------------
# /nlp/classify
# ---------------------------------------------------------------------------

class TestClassify:
    def test_classify_billing(self):
        resp = client.post("/nlp/classify", json={
            "text": "I was charged twice for the last invoice. I need a refund for the duplicate payment."
        })
        data = resp.json()
        assert data["success"] is True
        assert data["category"] == "billing"
        assert data["confidence"] > 0

    def test_classify_technical(self):
        resp = client.post("/nlp/classify", json={
            "text": "The app keeps crashing when I try to login. The page won't load."
        })
        data = resp.json()
        assert data["success"] is True
        assert data["category"] == "technical"

    def test_classify_compliance(self):
        resp = client.post("/nlp/classify", json={
            "text": "I need help with my FMCSA inspection report and DOT compliance audit"
        })
        data = resp.json()
        assert data["success"] is True
        assert data["category"] == "compliance"

    def test_classify_custom_categories(self):
        resp = client.post("/nlp/classify", json={
            "text": "The truck engine is making a weird noise",
            "categories": ["maintenance", "billing", "routing"],
        })
        data = resp.json()
        assert data["success"] is True
        assert "scores" in data

    def test_classify_empty(self):
        resp = client.post("/nlp/classify", json={"text": ""})
        data = resp.json()
        assert data["success"] is True
