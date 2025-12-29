import datetime
import os

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, UniqueConstraint
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import text as sql_text

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON

from .database import Base


try:
    from pgvector.sqlalchemy import Vector  # type: ignore
except Exception:  # pragma: no cover
    Vector = None


def _json_type():
    return JSONB().with_variant(JSON(), "sqlite")


class ErgSourceDocument(Base):
    __tablename__ = "erg_source_document"
    __table_args__ = (UniqueConstraint("version_tag", name="uq_erg_source_version"), {"schema": "erg"})

    id = Column(Integer, primary_key=True)
    version_tag = Column(String, nullable=False)
    language = Column(String, nullable=True)
    source_filename = Column(String, nullable=True)
    sha256 = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    pages = relationship("ErgPage", back_populates="source_document")


class ErgPage(Base):
    __tablename__ = "erg_page"
    __table_args__ = (UniqueConstraint("source_document_id", "page_number", name="uq_erg_page"), {"schema": "erg"})

    id = Column(Integer, primary_key=True)
    source_document_id = Column(Integer, ForeignKey("erg.erg_source_document.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    section = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    source_document = relationship("ErgSourceDocument", back_populates="pages")


class ErgTable(Base):
    __tablename__ = "erg_table"
    __table_args__ = (UniqueConstraint("source_document_id", "page_number", "table_number", name="uq_erg_table"), {"schema": "erg"})

    id = Column(Integer, primary_key=True)
    source_document_id = Column(Integer, ForeignKey("erg.erg_source_document.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    table_number = Column(Integer, nullable=False)
    non_empty_cells = Column(Integer, nullable=False, default=0)
    data = Column(_json_type(), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class ErgUnIndex(Base):
    __tablename__ = "erg_un_index"
    __table_args__ = (UniqueConstraint("source_document_id", "un_number", "guide_number", "material_name", name="uq_erg_un_index"), {"schema": "erg"})

    id = Column(Integer, primary_key=True)
    source_document_id = Column(Integer, ForeignKey("erg.erg_source_document.id"), nullable=False)
    un_number = Column(String, nullable=False)
    guide_number = Column(String, nullable=False)
    material_name = Column(String, nullable=False)
    page_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class ErgGuideText(Base):
    __tablename__ = "erg_guide_text"
    __table_args__ = (UniqueConstraint("source_document_id", "guide_number", name="uq_erg_guide_text"), {"schema": "erg"})

    id = Column(Integer, primary_key=True)
    source_document_id = Column(Integer, ForeignKey("erg.erg_source_document.id"), nullable=False)
    guide_number = Column(String, nullable=False)
    page_numbers = Column(_json_type(), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class ErgIngestionJob(Base):
    __tablename__ = "erg_ingestion_job"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    status = Column(String, nullable=False, default="PENDING")
    extraction_dir = Column(String, nullable=False)
    force = Column(Boolean, nullable=False, default=False)
    message = Column(Text, nullable=True)
    result = Column(_json_type(), nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class ErgEmbeddingChunk(Base):
    __tablename__ = "erg_embedding_chunk"
    __table_args__ = (UniqueConstraint("source_document_id", "content_sha256", name="uq_erg_embedding_content"), {"schema": "erg"})

    id = Column(Integer, primary_key=True)
    source_document_id = Column(Integer, ForeignKey("erg.erg_source_document.id"), nullable=False)
    chunk_type = Column(String, nullable=False)
    page_number = Column(Integer, nullable=True)
    guide_number = Column(String, nullable=True)
    un_or_na = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    content_sha256 = Column(String, nullable=False)

    if Vector is not None:
        dim = int(os.getenv("ERG_EMBED_DIM", "768"))
        embedding = Column(Vector(dim).with_variant(Text(), "sqlite"), nullable=True)
    else:
        embedding = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


def ensure_erg_schema(engine):
    dialect = getattr(engine, "dialect", None)
    name = getattr(dialect, "name", "")
    if name != "postgresql":
        return

    with engine.begin() as conn:
        conn.execute(sql_text("CREATE SCHEMA IF NOT EXISTS erg"))
        try:
            conn.execute(sql_text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception:
            pass
