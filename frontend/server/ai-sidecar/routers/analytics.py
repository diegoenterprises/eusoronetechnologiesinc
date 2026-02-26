"""
Analytics Router — DuckDB for fast OLAP queries on platform data.
"""

import logging
import os
import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("ai-sidecar.analytics")
router = APIRouter()

_duckdb_conn = None


def get_duckdb():
    """Lazy-load DuckDB connection."""
    global _duckdb_conn
    if _duckdb_conn is None:
        try:
            import duckdb
            db_path = os.getenv("DUCKDB_PATH", ":memory:")
            _duckdb_conn = duckdb.connect(db_path)
            logger.info(f"DuckDB connected: {db_path}")
        except ImportError:
            raise HTTPException(503, "DuckDB not available")
    return _duckdb_conn


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    sql: str
    params: list = []
    max_rows: int = 1000


class QueryResponse(BaseModel):
    success: bool
    columns: list[str] = []
    rows: list[list] = []
    row_count: int = 0
    execution_ms: float = 0.0
    error: Optional[str] = None


class IngestRequest(BaseModel):
    table_name: str
    columns: list[str]
    rows: list[list]
    replace: bool = False  # True = DROP + CREATE, False = INSERT


class IngestResponse(BaseModel):
    success: bool
    rows_ingested: int = 0
    error: Optional[str] = None


class AggregateRequest(BaseModel):
    query_type: str  # "lane_stats" | "carrier_perf" | "weekly_volume" | "rate_distribution"
    filters: dict = {}
    group_by: list[str] = []
    limit: int = 50


class AggregateResponse(BaseModel):
    success: bool
    query_type: str = ""
    results: list[dict] = []
    summary: dict = {}
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/query", response_model=QueryResponse)
async def run_query(req: QueryRequest):
    """
    Run a read-only SQL query on DuckDB.
    Only SELECT statements allowed for safety.
    """
    sql_upper = req.sql.strip().upper()
    if not sql_upper.startswith("SELECT") and not sql_upper.startswith("WITH"):
        raise HTTPException(400, "Only SELECT/WITH queries allowed")

    # Block dangerous keywords
    for forbidden in ["DROP", "DELETE", "TRUNCATE", "ALTER", "UPDATE", "INSERT"]:
        if forbidden in sql_upper:
            raise HTTPException(400, f"Query contains forbidden keyword: {forbidden}")

    try:
        import time
        conn = get_duckdb()
        start = time.monotonic()
        result = conn.execute(req.sql, req.params).fetchall()
        elapsed = (time.monotonic() - start) * 1000

        columns = [desc[0] for desc in conn.description] if conn.description else []
        rows = [list(row) for row in result[:req.max_rows]]

        # Serialize non-JSON-safe types
        for row in rows:
            for i, val in enumerate(row):
                if hasattr(val, "isoformat"):
                    row[i] = val.isoformat()
                elif isinstance(val, (bytes, bytearray)):
                    row[i] = val.hex()

        return QueryResponse(
            success=True, columns=columns, rows=rows,
            row_count=len(rows), execution_ms=round(elapsed, 2),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query error: {e}")
        return QueryResponse(success=False, error=str(e))


@router.post("/ingest", response_model=IngestResponse)
async def ingest_data(req: IngestRequest):
    """
    Ingest data into a DuckDB table for offline analytics.
    Used to snapshot platform data for fast OLAP queries.
    """
    if not req.table_name.isidentifier():
        raise HTTPException(400, "Invalid table name")

    try:
        conn = get_duckdb()

        if req.replace:
            conn.execute(f"DROP TABLE IF EXISTS {req.table_name}")

        # Create table from first row types if needed
        if req.rows:
            col_defs = []
            for i, col in enumerate(req.columns):
                sample = req.rows[0][i] if i < len(req.rows[0]) else None
                if isinstance(sample, int):
                    col_defs.append(f"{col} BIGINT")
                elif isinstance(sample, float):
                    col_defs.append(f"{col} DOUBLE")
                elif isinstance(sample, bool):
                    col_defs.append(f"{col} BOOLEAN")
                else:
                    col_defs.append(f"{col} VARCHAR")

            conn.execute(f"CREATE TABLE IF NOT EXISTS {req.table_name} ({', '.join(col_defs)})")

            # Batch insert
            placeholders = ", ".join(["?" for _ in req.columns])
            for row in req.rows:
                conn.execute(f"INSERT INTO {req.table_name} VALUES ({placeholders})", row)

        return IngestResponse(success=True, rows_ingested=len(req.rows))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingest error: {e}")
        return IngestResponse(success=False, error=str(e))


@router.post("/aggregate", response_model=AggregateResponse)
async def run_aggregate(req: AggregateRequest):
    """
    Run pre-built aggregation queries optimized for logistics analytics.
    """
    try:
        conn = get_duckdb()

        # Check which tables exist
        tables = [r[0] for r in conn.execute("SHOW TABLES").fetchall()]

        if req.query_type == "lane_stats" and "loads" in tables:
            result = conn.execute("""
                SELECT
                    origin_state || '-' || dest_state AS lane,
                    COUNT(*) AS load_count,
                    ROUND(AVG(rate_per_mile), 2) AS avg_rate,
                    ROUND(STDDEV(rate_per_mile), 2) AS rate_stddev,
                    ROUND(AVG(distance), 0) AS avg_distance,
                    ROUND(AVG(weight), 0) AS avg_weight
                FROM loads
                GROUP BY lane
                ORDER BY load_count DESC
                LIMIT ?
            """, [req.limit]).fetchall()

            columns = ["lane", "load_count", "avg_rate", "rate_stddev", "avg_distance", "avg_weight"]
            results = [dict(zip(columns, row)) for row in result]

            return AggregateResponse(
                success=True, query_type="lane_stats", results=results,
                summary={"total_lanes": len(results), "total_loads": sum(r["load_count"] for r in results)},
            )

        elif req.query_type == "carrier_perf" and "carrier_loads" in tables:
            result = conn.execute("""
                SELECT
                    carrier_id, carrier_name,
                    COUNT(*) AS total_loads,
                    ROUND(AVG(on_time::INT) * 100, 1) AS on_time_pct,
                    ROUND(AVG(rating), 2) AS avg_rating
                FROM carrier_loads
                GROUP BY carrier_id, carrier_name
                HAVING COUNT(*) >= 3
                ORDER BY on_time_pct DESC
                LIMIT ?
            """, [req.limit]).fetchall()

            columns = ["carrier_id", "carrier_name", "total_loads", "on_time_pct", "avg_rating"]
            results = [dict(zip(columns, row)) for row in result]

            return AggregateResponse(
                success=True, query_type="carrier_perf", results=results,
                summary={"carriers_analyzed": len(results)},
            )

        elif req.query_type == "weekly_volume" and "loads" in tables:
            result = conn.execute("""
                SELECT
                    DATE_TRUNC('week', created_at) AS week,
                    COUNT(*) AS volume,
                    ROUND(AVG(rate_per_mile), 2) AS avg_rate
                FROM loads
                GROUP BY week
                ORDER BY week DESC
                LIMIT ?
            """, [req.limit]).fetchall()

            columns = ["week", "volume", "avg_rate"]
            results = []
            for row in result:
                d = dict(zip(columns, row))
                if hasattr(d["week"], "isoformat"):
                    d["week"] = d["week"].isoformat()
                results.append(d)

            return AggregateResponse(
                success=True, query_type="weekly_volume", results=results,
                summary={"weeks_analyzed": len(results)},
            )

        elif req.query_type == "rate_distribution" and "loads" in tables:
            result = conn.execute("""
                SELECT
                    CASE
                        WHEN rate_per_mile < 1.5 THEN '<$1.50'
                        WHEN rate_per_mile < 2.0 THEN '$1.50-$2.00'
                        WHEN rate_per_mile < 2.5 THEN '$2.00-$2.50'
                        WHEN rate_per_mile < 3.0 THEN '$2.50-$3.00'
                        WHEN rate_per_mile < 4.0 THEN '$3.00-$4.00'
                        ELSE '$4.00+'
                    END AS bucket,
                    COUNT(*) AS count
                FROM loads
                WHERE rate_per_mile > 0
                GROUP BY bucket
                ORDER BY MIN(rate_per_mile)
            """).fetchall()

            results = [{"bucket": r[0], "count": r[1]} for r in result]
            return AggregateResponse(
                success=True, query_type="rate_distribution", results=results,
                summary={"total_loads": sum(r["count"] for r in results)},
            )

        else:
            return AggregateResponse(
                success=True, query_type=req.query_type, results=[],
                summary={"note": f"No data table found for query type '{req.query_type}'. Ingest data first."},
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Aggregate error: {e}")
        return AggregateResponse(success=False, query_type=req.query_type, error=str(e))
