"""
Tests for the Analytics router — DuckDB query, ingest, aggregate.
"""

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# /analytics/ingest + /analytics/query
# ---------------------------------------------------------------------------

class TestIngestAndQuery:
    def test_ingest_basic(self):
        resp = client.post("/analytics/ingest", json={
            "table_name": "test_loads",
            "columns": ["id", "rate", "distance", "origin_state", "dest_state"],
            "rows": [
                [1, 3500.0, 450.0, "TX", "IL"],
                [2, 2800.0, 300.0, "TX", "OK"],
                [3, 5200.0, 800.0, "CA", "WA"],
                [4, 4100.0, 600.0, "TX", "IL"],
                [5, 1900.0, 200.0, "TX", "OK"],
            ],
            "replace": True,
        })
        data = resp.json()
        assert data["success"] is True
        assert data["rows_ingested"] == 5

    def test_query_select(self):
        # First ingest data
        client.post("/analytics/ingest", json={
            "table_name": "test_q",
            "columns": ["id", "value"],
            "rows": [[1, 100], [2, 200], [3, 300]],
            "replace": True,
        })
        # Then query
        resp = client.post("/analytics/query", json={
            "sql": "SELECT * FROM test_q ORDER BY id",
        })
        data = resp.json()
        assert data["success"] is True
        assert data["row_count"] == 3
        assert data["columns"] == ["id", "value"]
        assert data["rows"][0] == [1, 100]

    def test_query_aggregation(self):
        client.post("/analytics/ingest", json={
            "table_name": "test_agg",
            "columns": ["lane", "rate"],
            "rows": [
                ["TX-IL", 3.5], ["TX-IL", 4.0], ["TX-IL", 3.2],
                ["CA-WA", 5.0], ["CA-WA", 4.8],
            ],
            "replace": True,
        })
        resp = client.post("/analytics/query", json={
            "sql": "SELECT lane, COUNT(*) as cnt, ROUND(AVG(rate), 2) as avg_rate FROM test_agg GROUP BY lane ORDER BY cnt DESC",
        })
        data = resp.json()
        assert data["success"] is True
        assert data["row_count"] == 2
        assert data["rows"][0][0] == "TX-IL"
        assert data["rows"][0][1] == 3

    def test_query_max_rows(self):
        client.post("/analytics/ingest", json={
            "table_name": "test_limit",
            "columns": ["id"],
            "rows": [[i] for i in range(50)],
            "replace": True,
        })
        resp = client.post("/analytics/query", json={
            "sql": "SELECT * FROM test_limit",
            "max_rows": 10,
        })
        data = resp.json()
        assert data["success"] is True
        assert data["row_count"] <= 10


# ---------------------------------------------------------------------------
# SQL Safety
# ---------------------------------------------------------------------------

class TestQuerySafety:
    def test_block_drop(self):
        resp = client.post("/analytics/query", json={
            "sql": "DROP TABLE test_loads",
        })
        assert resp.status_code == 400

    def test_block_delete(self):
        resp = client.post("/analytics/query", json={
            "sql": "DELETE FROM test_loads WHERE id = 1",
        })
        assert resp.status_code == 400

    def test_block_update(self):
        resp = client.post("/analytics/query", json={
            "sql": "UPDATE test_loads SET rate = 0",
        })
        assert resp.status_code == 400

    def test_block_insert_via_query(self):
        resp = client.post("/analytics/query", json={
            "sql": "INSERT INTO test_loads VALUES (99, 0, 0, 'XX', 'YY')",
        })
        assert resp.status_code == 400

    def test_allow_with_cte(self):
        client.post("/analytics/ingest", json={
            "table_name": "test_cte",
            "columns": ["id", "val"],
            "rows": [[1, 10], [2, 20]],
            "replace": True,
        })
        resp = client.post("/analytics/query", json={
            "sql": "WITH base AS (SELECT * FROM test_cte) SELECT * FROM base",
        })
        data = resp.json()
        assert data["success"] is True


# ---------------------------------------------------------------------------
# /analytics/aggregate
# ---------------------------------------------------------------------------

class TestAggregate:
    def test_aggregate_no_table(self):
        """Aggregate on non-existent query type should return empty gracefully."""
        resp = client.post("/analytics/aggregate", json={
            "query_type": "lane_stats",
            "filters": {},
        })
        data = resp.json()
        assert data["success"] is True
        # May have results if 'loads' table exists from other tests

    def test_aggregate_unknown_type(self):
        resp = client.post("/analytics/aggregate", json={
            "query_type": "nonexistent_type",
        })
        data = resp.json()
        assert data["success"] is True
        assert "note" in data.get("summary", {}) or data["results"] == []


# ---------------------------------------------------------------------------
# /analytics/ingest edge cases
# ---------------------------------------------------------------------------

class TestIngestEdgeCases:
    def test_ingest_invalid_table_name(self):
        resp = client.post("/analytics/ingest", json={
            "table_name": "drop table;--",
            "columns": ["id"],
            "rows": [[1]],
        })
        assert resp.status_code == 400

    def test_ingest_empty_rows(self):
        resp = client.post("/analytics/ingest", json={
            "table_name": "test_empty",
            "columns": ["id"],
            "rows": [],
        })
        data = resp.json()
        assert data["success"] is True
        assert data["rows_ingested"] == 0

    def test_ingest_replace_mode(self):
        # Insert initial data
        client.post("/analytics/ingest", json={
            "table_name": "test_replace",
            "columns": ["id"],
            "rows": [[1], [2], [3]],
            "replace": True,
        })
        # Replace with new data
        client.post("/analytics/ingest", json={
            "table_name": "test_replace",
            "columns": ["id"],
            "rows": [[10], [20]],
            "replace": True,
        })
        resp = client.post("/analytics/query", json={
            "sql": "SELECT COUNT(*) as c FROM test_replace",
        })
        data = resp.json()
        assert data["success"] is True
        assert data["rows"][0][0] == 2  # Only the replacement rows
