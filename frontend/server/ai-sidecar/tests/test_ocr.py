"""
Tests for the OCR router — document extraction, BOL parsing, rate sheet digitization.
Uses FastAPI TestClient with mocked OCR engines.
"""

import base64
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_b64_image() -> str:
    """Create a minimal valid PNG base64 string for testing."""
    # 1x1 white PNG
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
        b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
        b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return base64.b64encode(png_bytes).decode()


# ---------------------------------------------------------------------------
# /ocr/extract
# ---------------------------------------------------------------------------

class TestOCRExtract:
    def test_extract_missing_image(self):
        resp = client.post("/ocr/extract", json={
            "image_base64": "",
            "mime_type": "image/png",
        })
        assert resp.status_code == 400

    def test_extract_returns_structure(self):
        """Even if engines fail, response shape is correct."""
        resp = client.post("/ocr/extract", json={
            "image_base64": make_b64_image(),
            "mime_type": "image/png",
            "engine": "auto",
        })
        data = resp.json()
        # Should have the expected fields even on failure
        assert "success" in data
        assert "text" in data
        assert "lines" in data
        assert "tables" in data
        assert "engine" in data

    def test_extract_paddle_engine(self):
        resp = client.post("/ocr/extract", json={
            "image_base64": make_b64_image(),
            "mime_type": "image/png",
            "engine": "paddle",
        })
        data = resp.json()
        assert "success" in data
        # Engine should be paddle or error
        if data["success"]:
            assert data["engine"] == "paddle"


# ---------------------------------------------------------------------------
# /ocr/bol
# ---------------------------------------------------------------------------

class TestOCRBol:
    def test_bol_missing_image(self):
        resp = client.post("/ocr/bol", json={
            "image_base64": "",
            "mime_type": "image/png",
        })
        assert resp.status_code == 400

    def test_bol_returns_fields_structure(self):
        resp = client.post("/ocr/bol", json={
            "image_base64": make_b64_image(),
            "mime_type": "image/png",
        })
        data = resp.json()
        assert "success" in data
        assert "fields" in data
        assert "raw_text" in data
        assert "confidence" in data

        # Fields should have expected BOL keys
        fields = data["fields"]
        for key in ["shipper_name", "consignee_name", "bol_number", "carrier_name"]:
            assert key in fields


# ---------------------------------------------------------------------------
# /ocr/ratesheet
# ---------------------------------------------------------------------------

class TestOCRRateSheet:
    def test_ratesheet_missing_file(self):
        resp = client.post("/ocr/ratesheet", json={
            "file_base64": "",
            "mime_type": "application/pdf",
        })
        assert resp.status_code == 400

    def test_ratesheet_returns_structure(self):
        resp = client.post("/ocr/ratesheet", json={
            "file_base64": make_b64_image(),  # Not a real PDF but tests shape
            "mime_type": "image/png",
        })
        data = resp.json()
        assert "success" in data
        assert "rate_tiers" in data
        assert "surcharges" in data
        assert "metadata" in data
        assert "raw_text" in data
