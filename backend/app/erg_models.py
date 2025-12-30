import datetime
import os
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, UniqueConstraint, Float
from sqlalchemy import ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy import Index
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


class ErgHazardClass(enum.Enum):
    CLASS_1 = "1"
    CLASS_2 = "2"
    CLASS_3 = "3"
    CLASS_4 = "4"
    CLASS_5 = "5"
    CLASS_6 = "6"
    CLASS_7 = "7"
    CLASS_8 = "8"
    CLASS_9 = "9"


class ErgSpillSize(enum.Enum):
    SMALL = "small"
    LARGE = "large"


class ErgTimeOfDay(enum.Enum):
    DAY = "day"
    NIGHT = "night"


class ErgGuide(Base):
    __tablename__ = "erg_guides"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    guide_number = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)

    initial_isolation_meters = Column(Integer, nullable=True)
    initial_isolation_feet = Column(Integer, nullable=True)
    fire_isolation_meters = Column(Integer, nullable=True)
    fire_isolation_feet = Column(Integer, nullable=True)

    fire_explosion_hazards = Column(_json_type(), nullable=True)
    health_hazards = Column(_json_type(), nullable=True)

    protective_clothing = Column(Text, nullable=True)
    evacuation_notes = Column(Text, nullable=True)

    fire_small = Column(_json_type(), nullable=True)
    fire_large = Column(_json_type(), nullable=True)
    fire_tank = Column(_json_type(), nullable=True)

    spill_general = Column(_json_type(), nullable=True)
    spill_small = Column(_json_type(), nullable=True)
    spill_large = Column(_json_type(), nullable=True)

    first_aid = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    materials = relationship("ErgMaterial", back_populates="guide")


class ErgMaterial(Base):
    __tablename__ = "erg_materials"
    __table_args__ = (
        Index("idx_erg_material_search", "name", "un_number"),
        Index("idx_erg_hazard_class", "hazard_class"),
        Index("idx_erg_tih", "is_tih"),
        {"schema": "erg"},
    )

    id = Column(Integer, primary_key=True)
    un_number = Column(String(10), unique=True, nullable=False, index=True)
    na_number = Column(String(10), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    alternate_names = Column(_json_type(), nullable=True)

    guide_number = Column(Integer, ForeignKey("erg.erg_guides.guide_number"), nullable=False)
    hazard_class = Column(String(10), nullable=False)
    division = Column(String(10), nullable=True)
    packing_group = Column(String(5), nullable=True)

    is_tih = Column(Boolean, nullable=False, default=False)
    is_water_reactive = Column(Boolean, nullable=False, default=False)
    polymerization_hazard = Column(Boolean, nullable=False, default=False)

    special_provisions = Column(_json_type(), nullable=True)
    erg_page_reference = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    guide = relationship("ErgGuide", back_populates="materials")
    protective_distances = relationship("ErgProtectiveDistance", back_populates="material")
    incidents = relationship("ErgIncident", back_populates="material")


class ErgProtectiveDistance(Base):
    __tablename__ = "erg_protective_distances"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    un_number = Column(String(10), ForeignKey("erg.erg_materials.un_number"), nullable=False, index=True)
    material_name = Column(String(255), nullable=True)

    small_day_isolation_meters = Column(Integer, nullable=True)
    small_day_isolation_feet = Column(Integer, nullable=True)
    small_day_protect_km = Column(Float, nullable=True)
    small_day_protect_miles = Column(Float, nullable=True)

    small_night_isolation_meters = Column(Integer, nullable=True)
    small_night_isolation_feet = Column(Integer, nullable=True)
    small_night_protect_km = Column(Float, nullable=True)
    small_night_protect_miles = Column(Float, nullable=True)

    large_day_isolation_meters = Column(Integer, nullable=True)
    large_day_isolation_feet = Column(Integer, nullable=True)
    large_day_protect_km = Column(Float, nullable=True)
    large_day_protect_miles = Column(Float, nullable=True)

    large_night_isolation_meters = Column(Integer, nullable=True)
    large_night_isolation_feet = Column(Integer, nullable=True)
    large_night_protect_km = Column(Float, nullable=True)
    large_night_protect_miles = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    material = relationship("ErgMaterial", back_populates="protective_distances")


class ErgEmergencyContact(Base):
    __tablename__ = "erg_emergency_contacts"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    country = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    is_primary = Column(Boolean, nullable=False, default=False)
    is_24_hour = Column(Boolean, nullable=False, default=True)
    material_types = Column(_json_type(), nullable=True)
    priority = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


class ErgIncident(Base):
    __tablename__ = "erg_incidents"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    incident_id = Column(String(50), unique=True, nullable=False, index=True)
    incident_type = Column(String(50), nullable=True)

    un_number = Column(String(10), ForeignKey("erg.erg_materials.un_number"), nullable=True)
    guide_number = Column(Integer, ForeignKey("erg.erg_guides.guide_number"), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_description = Column(Text, nullable=True)

    spill_size = Column(SAEnum(ErgSpillSize), nullable=True)
    time_of_day = Column(SAEnum(ErgTimeOfDay), nullable=True)
    quantity_released = Column(String(50), nullable=True)

    isolation_established = Column(Boolean, nullable=False, default=False)
    evacuation_initiated = Column(Boolean, nullable=False, default=False)
    emergency_contacted = Column(Boolean, nullable=False, default=False)
    emergency_contact_used = Column(String(100), nullable=True)

    driver_id = Column(String(50), nullable=True)
    vehicle_id = Column(String(50), nullable=True)
    shipment_id = Column(String(50), nullable=True)

    incident_time = Column(DateTime, nullable=True)
    reported_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    resolved_time = Column(DateTime, nullable=True)

    status = Column(String(20), nullable=False, default="active")
    notes = Column(Text, nullable=True)

    material = relationship("ErgMaterial", back_populates="incidents")


class ErgLookupLog(Base):
    __tablename__ = "erg_lookup_logs"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    lookup_type = Column(String(20), nullable=True)
    search_query = Column(String(100), nullable=True)
    un_number = Column(String(10), nullable=True)
    guide_number = Column(Integer, nullable=True)
    results_count = Column(Integer, nullable=True)
    user_id = Column(String(50), nullable=True)
    driver_id = Column(String(50), nullable=True)
    session_id = Column(String(100), nullable=True)
    device_type = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_emergency = Column(Boolean, nullable=False, default=False)
    incident_id = Column(String(50), nullable=True)
    lookup_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    response_time_ms = Column(Integer, nullable=True)


class ErgHazardClassDefinition(Base):
    __tablename__ = "erg_hazard_classes"
    __table_args__ = ({"schema": "erg"},)

    id = Column(Integer, primary_key=True)
    class_number = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), nullable=True)
    icon = Column(String(10), nullable=True)
    divisions = Column(_json_type(), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)


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
