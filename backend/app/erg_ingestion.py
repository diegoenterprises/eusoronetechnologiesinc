import hashlib
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session

from .database import engine
from .erg_models import (
    ErgEmbeddingChunk,
    ErgGuideText,
    ErgIngestionJob,
    ErgPage,
    ErgSourceDocument,
    ErgTable,
    ErgUnIndex,
    ensure_erg_schema,
)

from .embeddings import embed_text


_UN_RE = re.compile(r"^(\d{4})$")
_GUIDE_RE = re.compile(r"^(\d{3}P?)$")
_GUIDE_HEADER_RE = re.compile(r"\bGUIDE\b[\s\S]{0,200}?\b(\d{3}P?)\b", re.IGNORECASE)


def _tbl(name: str) -> str:
    if engine.url.drivername.startswith("sqlite"):
        return name
    return f"erg.{name}"


def _sha256_file(path: Path) -> Optional[str]:
    try:
        h = hashlib.sha256()
        with path.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


def _coerce_text(v) -> str:
    if v is None:
        return ""
    if isinstance(v, str):
        return v.strip()
    return str(v).strip()


def _extract_un_index_from_table(table: List[List[object]]) -> List[Tuple[str, str, str]]:
    out: List[Tuple[str, str, str]] = []

    # 1) Triplet scan across cells (works when PDF extraction yields separate columns)
    for row in table or []:
        if not row:
            continue
        cells = [_coerce_text(c) for c in row]
        for i in range(0, len(cells) - 2):
            un = cells[i]
            guide = cells[i + 1]
            name = cells[i + 2]
            if not un or not guide or not name:
                continue
            if _UN_RE.match(un) and _GUIDE_RE.match(guide):
                out.append((un, guide, name))

    # 2) Many ERG index pages collapse multiple rows into a single cell using pipes/newlines.
    # Parse line-by-line for patterns like:
    #   1203 128 GASOLINE
    #   1005 | 125 | Ammonia, anhydrous | 1005 | 125 | Anhydrous ammonia
    text_blob = "\n".join(
        " ".join(_coerce_text(c) for c in (row or []) if _coerce_text(c))
        for row in (table or [])
    )
    for line in (text_blob or "").splitlines():
        l = line.strip()
        if not l:
            continue

        if "|" in l:
            parts = [p.strip() for p in l.split("|") if p.strip()]
            for i in range(0, len(parts) - 2):
                un = parts[i]
                guide = parts[i + 1]
                name = parts[i + 2]
                if _UN_RE.match(un) and _GUIDE_RE.match(guide) and name:
                    out.append((un, guide, name))
            continue

        m = re.match(r"^\D*(\d{4})\s+(\d{3}P?)\s+(.+)$", l)
        if m:
            un, guide, name = m.group(1), m.group(2), m.group(3).strip()
            if _UN_RE.match(un) and _GUIDE_RE.match(guide) and name:
                out.append((un, guide, name))

    # De-dupe
    dedup: Dict[Tuple[str, str, str], None] = {}
    for item in out:
        dedup[item] = None
    return list(dedup.keys())


def _is_valid_guide(g: str) -> bool:
    if not _GUIDE_RE.match(g):
        return False
    try:
        n = int(g[:3])
    except Exception:
        return False
    return 100 <= n <= 199


def _extract_un_index_from_text(page_text: str) -> List[Tuple[str, str, str]]:
    if not page_text:
        return []

    out: Dict[Tuple[str, str, str], None] = {}
    txt = page_text.replace("\u00a0", " ")

    for m in re.finditer(r"\b(\d{4})\s+(\d{3}P?)\s+([^\n\r]{2,120})", txt):
        un = m.group(1)
        guide = m.group(2)
        name = m.group(3).strip()
        if _UN_RE.match(un) and _is_valid_guide(guide) and name:
            out[(un, guide, name)] = None

    for m in re.finditer(r"\b([^\n\r]{2,120}?)\s+(\d{3}P?)\s+(\d{4})\b", txt):
        name = m.group(1).strip()
        guide = m.group(2)
        un = m.group(3)
        if _UN_RE.match(un) and _is_valid_guide(guide) and name:
            out[(un, guide, name)] = None

    return list(out.keys())


def _discover_guide_numbers_in_text(page_text: str) -> List[str]:
    if not page_text:
        return []
    matches = _GUIDE_HEADER_RE.findall(page_text)
    out: List[str] = []
    for m in matches:
        g = m.strip()
        if g and _is_valid_guide(g) and g not in out:
            out.append(g)
    return out


def ingest_from_extraction(db: Session, extraction_dir: str, force: bool = False) -> Dict[str, object]:
    ensure_erg_schema(engine)

    root = Path(extraction_dir)
    summary_path = root / "extraction_summary.json"
    if not summary_path.exists():
        raise FileNotFoundError(f"extraction_summary.json not found in {extraction_dir}")

    with summary_path.open("r", encoding="utf-8") as f:
        summary = json.load(f)

    if not isinstance(summary, list) or not summary:
        raise ValueError("extraction_summary.json is not a list or is empty")

    doc = summary[0]
    pdf_name = doc.get("filename") or "ERG2024"
    version_tag = str(doc.get("metadata", {}).get("title") or pdf_name)
    language = "en"
    pdf_path = Path(str(doc.get("filepath") or ""))
    sha256 = _sha256_file(pdf_path) if pdf_path.exists() else None

    existing = (
        db.query(ErgSourceDocument)
        .filter(ErgSourceDocument.version_tag == version_tag)
        .order_by(ErgSourceDocument.id.desc())
        .first()
    )

    if existing and not force:
        return {
            "status": "SKIPPED",
            "message": f"Source document already ingested: {version_tag}",
            "source_document_id": existing.id,
        }

    if existing and force:
        db.execute(sql_text(f"DELETE FROM {_tbl('erg_embedding_chunk')} WHERE source_document_id=:sid"), {"sid": existing.id})
        db.execute(sql_text(f"DELETE FROM {_tbl('erg_guide_text')} WHERE source_document_id=:sid"), {"sid": existing.id})
        db.execute(sql_text(f"DELETE FROM {_tbl('erg_un_index')} WHERE source_document_id=:sid"), {"sid": existing.id})
        db.execute(sql_text(f"DELETE FROM {_tbl('erg_table')} WHERE source_document_id=:sid"), {"sid": existing.id})
        db.execute(sql_text(f"DELETE FROM {_tbl('erg_page')} WHERE source_document_id=:sid"), {"sid": existing.id})
        db.execute(sql_text(f"DELETE FROM {_tbl('erg_source_document')} WHERE id=:sid"), {"sid": existing.id})
        db.commit()

    source = ErgSourceDocument(
        version_tag=version_tag,
        language=language,
        source_filename=pdf_name,
        sha256=sha256,
        created_at=datetime.utcnow(),
    )
    db.add(source)
    db.commit()
    db.refresh(source)

    pages = doc.get("text_pdfplumber") or doc.get("text_pypdf") or []
    page_rows: List[ErgPage] = []
    guide_hits: Dict[str, List[int]] = {}
    guide_text_parts: Dict[str, List[str]] = {}

    # Build guide text using a page-ordered scan across the Orange section.
    # ERG2024 orange guides begin around the mid-150s and end before the green tables (~280).
    current_guide: Optional[str] = None
    un_index_set: Dict[Tuple[str, str, str], int] = {}

    for p in pages:
        page_num = int(p.get("page"))
        text = p.get("text") or ""
        page_rows.append(
            ErgPage(
                source_document_id=source.id,
                page_number=page_num,
                section=None,
                extracted_text=text,
                created_at=datetime.utcnow(),
            )
        )

        if 150 <= page_num < 280:
            found = _discover_guide_numbers_in_text(text)
            if found:
                current_guide = found[0]
                guide_hits.setdefault(current_guide, []).append(page_num)
                guide_text_parts.setdefault(current_guide, []).append(text)
            else:
                if current_guide:
                    guide_hits.setdefault(current_guide, []).append(page_num)
                    guide_text_parts.setdefault(current_guide, []).append(text)

        for un, guide, name in _extract_un_index_from_text(text):
            key = (un, guide, name)
            if key not in un_index_set:
                un_index_set[key] = page_num

    if page_rows:
        db.bulk_save_objects(page_rows)
        db.commit()

    tables = doc.get("tables") or []
    table_rows: List[ErgTable] = []

    for t in tables:
        page_num = int(t.get("page"))
        table_num = int(t.get("table_number"))
        non_empty = int(t.get("non_empty_cells") or 0)
        data = t.get("data") or []

        table_rows.append(
            ErgTable(
                source_document_id=source.id,
                page_number=page_num,
                table_number=table_num,
                non_empty_cells=non_empty,
                data=data,
                created_at=datetime.utcnow(),
            )
        )

        for un, guide, name in _extract_un_index_from_table(data):
            key = (un, guide, name)
            if key not in un_index_set:
                un_index_set[key] = page_num

    for i in range(0, len(table_rows), 500):
        db.bulk_save_objects(table_rows[i : i + 500])
        db.commit()

    un_rows: List[ErgUnIndex] = []
    for (un, guide, name), page_num in un_index_set.items():
        un_rows.append(
            ErgUnIndex(
                source_document_id=source.id,
                un_number=un,
                guide_number=guide,
                material_name=name,
                page_number=page_num,
                created_at=datetime.utcnow(),
            )
        )

    for i in range(0, len(un_rows), 1000):
        db.bulk_save_objects(un_rows[i : i + 1000])
        db.commit()

    guide_rows: List[ErgGuideText] = []
    for guide_number, page_nums in guide_hits.items():
        content = "\n\n".join(guide_text_parts.get(guide_number, []))
        if not content.strip():
            continue
        guide_rows.append(
            ErgGuideText(
                source_document_id=source.id,
                guide_number=guide_number,
                page_numbers=sorted(list(set(page_nums))),
                content=content,
                created_at=datetime.utcnow(),
            )
        )

    for i in range(0, len(guide_rows), 200):
        db.bulk_save_objects(guide_rows[i : i + 200])
        db.commit()

    # --- Embeddings ---
    build_embeddings = (os.getenv("ERG_BUILD_EMBEDDINGS", "true").lower() == "true")
    embedding_rows: List[ErgEmbeddingChunk] = []

    if build_embeddings:
        sqlite_mode = engine.url.drivername.startswith("sqlite")

        # UN index chunks
        for (un, guide, name), page_num in un_index_set.items():
            content = f"UN{un} GUIDE{guide} {name}".strip()
            sha = hashlib.sha256(content.encode("utf-8")).hexdigest()
            vec = embed_text(content)
            emb_val = json.dumps(vec) if sqlite_mode else vec
            embedding_rows.append(
                ErgEmbeddingChunk(
                    source_document_id=source.id,
                    chunk_type="un_index",
                    page_number=page_num,
                    guide_number=guide,
                    un_or_na=un,
                    content=content,
                    content_sha256=sha,
                    embedding=emb_val,
                    created_at=datetime.utcnow(),
                )
            )

        # Guide chunks
        def chunk_text(text: str, max_chars: int = 1800, overlap: int = 200) -> List[str]:
            if not text:
                return []
            parts = [p.strip() for p in text.split("\n\n") if p.strip()]
            chunks: List[str] = []
            buf = ""
            for p in parts:
                if not buf:
                    buf = p
                    continue
                if len(buf) + 2 + len(p) <= max_chars:
                    buf = buf + "\n\n" + p
                else:
                    chunks.append(buf)
                    tail = buf[-overlap:] if overlap > 0 and len(buf) > overlap else ""
                    buf = (tail + "\n\n" + p).strip()
            if buf:
                chunks.append(buf)
            return chunks

        for g in guide_rows:
            for ch in chunk_text(g.content):
                content = ch
                sha = hashlib.sha256(content.encode("utf-8")).hexdigest()
                vec = embed_text(content)
                emb_val = json.dumps(vec) if sqlite_mode else vec
                embedding_rows.append(
                    ErgEmbeddingChunk(
                        source_document_id=source.id,
                        chunk_type="guide_text",
                        page_number=None,
                        guide_number=g.guide_number,
                        un_or_na=None,
                        content=content,
                        content_sha256=sha,
                        embedding=emb_val,
                        created_at=datetime.utcnow(),
                    )
                )

        for i in range(0, len(embedding_rows), 500):
            db.bulk_save_objects(embedding_rows[i : i + 500])
            db.commit()

    return {
        "status": "OK",
        "source_document_id": source.id,
        "pages": len(page_rows),
        "tables": len(table_rows),
        "un_index_rows": len(un_rows),
        "guide_text_rows": len(guide_rows),
        "embedding_rows": len(embedding_rows) if build_embeddings else 0,
    }
