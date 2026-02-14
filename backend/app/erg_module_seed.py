import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from .embeddings import embed_text
from .erg_models import (
    ErgEmbeddingChunk,
    ErgGuide,
    ErgGuideText,
    ErgHazardClassDefinition,
    ErgMaterial,
    ErgProtectiveDistance,
    ErgEmergencyContact,
    ErgSourceDocument,
    ErgUnIndex,
)


def _sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _make_guide_text_content(g: Dict[str, Any]) -> str:
    num = g.get("number")
    title = g.get("title")
    hazards = g.get("hazards") or {}
    safety = g.get("safety") or {}
    resp = g.get("emergency_response") or {}

    lines = []
    lines.append(f"GUIDE {num} - {title}")

    fire = hazards.get("fire_explosion") or []
    health = hazards.get("health") or []
    if fire:
        lines.append("\nFIRE OR EXPLOSION")
        lines.extend([f"- {x}" for x in fire])
    if health:
        lines.append("\nHEALTH")
        lines.extend([f"- {x}" for x in health])

    iso = safety.get("initial_isolation_distance") or {}
    fire_iso = safety.get("fire_isolation_distance") or {}
    if iso or fire_iso:
        lines.append("\nEVACUATION")
        if iso.get("meters") is not None:
            lines.append(f"- Initial isolation: {iso.get('meters')} m")
        if fire_iso.get("meters") is not None:
            lines.append(f"- Fire isolation: {fire_iso.get('meters')} m")

    if safety.get("protective_clothing"):
        lines.append("\nPROTECTIVE CLOTHING")
        lines.append(str(safety.get("protective_clothing")))

    if resp:
        lines.append("\nEMERGENCY RESPONSE")
        fire_r = resp.get("fire") or {}
        spill_r = resp.get("spill_leak") or {}
        if fire_r:
            lines.append("\nFIRE")
            for k in ("small", "large", "tank"):
                v = fire_r.get(k)
                if v:
                    if isinstance(v, list):
                        for item in v:
                            lines.append(f"- {k}: {item}")
                    else:
                        lines.append(f"- {k}: {v}")
        if spill_r:
            lines.append("\nSPILL OR LEAK")
            for item in spill_r.get("general") or []:
                lines.append(f"- {item}")

    if resp.get("first_aid"):
        lines.append("\nFIRST AID")
        lines.append(str(resp.get("first_aid")))

    return "\n".join(lines).strip() + "\n"


def seed_erg_from_json(
    db: Session,
    json_path: str,
    force: bool = False,
    build_embeddings: bool = True,
    version_tag: str = "ERG2024_JSON",
) -> Dict[str, Any]:
    path = Path(json_path)
    if not path.exists():
        raise FileNotFoundError(f"ERG JSON not found: {json_path}")

    data = json.loads(path.read_text(encoding="utf-8"))

    existing_doc = db.query(ErgSourceDocument).filter(ErgSourceDocument.version_tag == version_tag).first()
    if existing_doc and not force:
        return {
            "status": "skipped",
            "reason": "already_seeded",
            "version_tag": version_tag,
        }

    if existing_doc and force:
        # Keep incidents/logs; wipe data tables + the derived un_index/guide_text/chunks
        db.query(ErgEmbeddingChunk).filter(ErgEmbeddingChunk.source_document_id == existing_doc.id).delete()
        db.query(ErgGuideText).filter(ErgGuideText.source_document_id == existing_doc.id).delete()
        db.query(ErgUnIndex).filter(ErgUnIndex.source_document_id == existing_doc.id).delete()
        db.delete(existing_doc)
        db.commit()

        db.query(ErgProtectiveDistance).delete()
        db.query(ErgMaterial).delete()
        db.query(ErgGuide).delete()
        db.query(ErgEmergencyContact).delete()
        db.commit()

    doc = ErgSourceDocument(
        version_tag=version_tag,
        language="en",
        source_filename=path.name,
        sha256=None,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    guides = data.get("guides") or {}
    materials = data.get("materials") or {}
    distances = data.get("protective_distances") or {}
    contacts = data.get("emergency_contacts") or {}
    hazard_classes = data.get("hazard_classes") or []

    dialect_name = getattr(getattr(db, "bind", None), "dialect", None)
    dialect_name = getattr(dialect_name, "name", "")
    store_as_pgvector = dialect_name == "postgresql"

    guide_rows = 0
    material_rows = 0
    distance_rows = 0
    contact_rows = 0
    hazard_class_rows = 0
    un_index_rows = 0
    guide_text_rows = 0
    embedding_rows = 0

    # Hazard classes (division descriptions)
    if hazard_classes:
        db.query(ErgHazardClassDefinition).delete()
        for hc in hazard_classes:
            try:
                cls_num = int(hc.get("class"))
            except Exception:
                continue
            db.add(
                ErgHazardClassDefinition(
                    class_number=cls_num,
                    name=str(hc.get("name") or ""),
                    divisions=hc.get("divisions") or [],
                    color=None,
                    icon=None,
                )
            )
            hazard_class_rows += 1
        db.commit()

    # Guides
    for k, g in guides.items():
        num = int(g.get("number") or k)
        safety = g.get("public_safety") or g.get("safety") or {}
        iso = safety.get("initial_isolation_distance") or safety.get("isolation") or {}
        fire_iso = safety.get("fire_isolation_distance") or safety.get("fireIsolate") or {}

        hazards = g.get("hazards") or {}
        emergency_response = g.get("emergency_response") or {}

        row = ErgGuide(
            guide_number=num,
            title=str(g.get("title") or ""),
            description=g.get("description"),
            color=g.get("color"),
            initial_isolation_meters=(iso.get("meters") if isinstance(iso, dict) else None),
            initial_isolation_feet=(iso.get("feet") if isinstance(iso, dict) else None),
            fire_isolation_meters=(fire_iso.get("meters") if isinstance(fire_iso, dict) else None),
            fire_isolation_feet=(fire_iso.get("feet") if isinstance(fire_iso, dict) else None),
            fire_explosion_hazards=hazards.get("fire_explosion") or hazards.get("fire") or [],
            health_hazards=hazards.get("health") or [],
            protective_clothing=safety.get("protective_clothing") or safety.get("clothing"),
            evacuation_notes=safety.get("evacuation_notes") or safety.get("evacuation"),
            fire_small=(emergency_response.get("fire", {}) or {}).get("small"),
            fire_large=(emergency_response.get("fire", {}) or {}).get("large"),
            fire_tank=(emergency_response.get("fire", {}) or {}).get("tank"),
            spill_general=(emergency_response.get("spill_leak", {}) or {}).get("general"),
            spill_small=(emergency_response.get("spill_leak", {}) or {}).get("small"),
            spill_large=(emergency_response.get("spill_leak", {}) or {}).get("large"),
            first_aid=emergency_response.get("first_aid"),
        )
        db.add(row)
        guide_rows += 1

        # Derived guide_text row for compatibility with /erg/guide/{guide}
        content = _make_guide_text_content({
            "number": num,
            "title": row.title,
            "hazards": {
                "fire_explosion": row.fire_explosion_hazards or [],
                "health": row.health_hazards or [],
            },
            "safety": {
                "initial_isolation_distance": {"meters": row.initial_isolation_meters, "feet": row.initial_isolation_feet},
                "fire_isolation_distance": {"meters": row.fire_isolation_meters, "feet": row.fire_isolation_feet},
                "protective_clothing": row.protective_clothing,
                "evacuation_notes": row.evacuation_notes,
            },
            "emergency_response": {
                "fire": {"small": row.fire_small, "large": row.fire_large, "tank": row.fire_tank},
                "spill_leak": {"general": row.spill_general, "small": row.spill_small, "large": row.spill_large},
                "first_aid": row.first_aid,
            },
        })

        gt = ErgGuideText(
            source_document_id=doc.id,
            guide_number=str(num),
            page_numbers=[],
            content=content,
        )
        db.add(gt)
        guide_text_rows += 1

        if build_embeddings:
            emb = embed_text(content)
            emb_val = emb if store_as_pgvector else json.dumps(emb)
            chunk_content = content
            sha = _sha256_text(chunk_content)
            db.add(
                ErgEmbeddingChunk(
                    source_document_id=doc.id,
                    chunk_type="guide_text",
                    page_number=None,
                    guide_number=str(num),
                    un_or_na=None,
                    content=chunk_content,
                    content_sha256=sha,
                    embedding=emb_val,
                )
            )
            embedding_rows += 1

    db.commit()

    # Materials + un_index compatibility
    for un, m in materials.items():
        un_str = str(m.get("id") or un)
        guide_num = int(m.get("guide"))
        hazard_class = str(m.get("class") or "")

        row = ErgMaterial(
            un_number=un_str,
            name=str(m.get("name") or ""),
            alternate_names=m.get("alternate_names") or [],
            guide_number=guide_num,
            hazard_class=hazard_class,
            division=m.get("division"),
            packing_group=m.get("packing_group"),
            is_tih=bool(m.get("is_tih")),
            is_water_reactive=bool(m.get("is_water_reactive")) if m.get("is_water_reactive") is not None else False,
            polymerization_hazard=bool(m.get("polymerization_hazard")),
            special_provisions=m.get("special_provisions"),
            erg_page_reference=m.get("erg_page_reference"),
        )
        db.add(row)
        material_rows += 1

        ui = ErgUnIndex(
            source_document_id=doc.id,
            un_number=un_str,
            guide_number=str(guide_num),
            material_name=row.name,
            page_number=None,
        )
        db.add(ui)
        un_index_rows += 1

        if build_embeddings:
            chunk_content = f"UN{un_str} GUIDE{guide_num} {row.name}".strip()
            emb = embed_text(chunk_content)
            emb_val = emb if store_as_pgvector else json.dumps(emb)
            sha = _sha256_text(chunk_content)
            db.add(
                ErgEmbeddingChunk(
                    source_document_id=doc.id,
                    chunk_type="un_index",
                    page_number=None,
                    guide_number=str(guide_num),
                    un_or_na=un_str,
                    content=chunk_content,
                    content_sha256=sha,
                    embedding=emb_val,
                )
            )
            embedding_rows += 1

    db.commit()

    # Protective distances
    for un, d in distances.items():
        small = d.get("small_spill") or {}
        large = d.get("large_spill") or {}

        row = ErgProtectiveDistance(
            un_number=str(un),
            material_name=d.get("name"),
            small_day_isolation_meters=(small.get("day") or {}).get("isolation_m"),
            small_day_isolation_feet=(small.get("day") or {}).get("isolation_ft"),
            small_day_protect_km=(small.get("day") or {}).get("protect_km"),
            small_day_protect_miles=(small.get("day") or {}).get("protect_mi"),
            small_night_isolation_meters=(small.get("night") or {}).get("isolation_m"),
            small_night_isolation_feet=(small.get("night") or {}).get("isolation_ft"),
            small_night_protect_km=(small.get("night") or {}).get("protect_km"),
            small_night_protect_miles=(small.get("night") or {}).get("protect_mi"),
            large_day_isolation_meters=(large.get("day") or {}).get("isolation_m"),
            large_day_isolation_feet=(large.get("day") or {}).get("isolation_ft"),
            large_day_protect_km=(large.get("day") or {}).get("protect_km"),
            large_day_protect_miles=(large.get("day") or {}).get("protect_mi"),
            large_night_isolation_meters=(large.get("night") or {}).get("isolation_m"),
            large_night_isolation_feet=(large.get("night") or {}).get("isolation_ft"),
            large_night_protect_km=(large.get("night") or {}).get("protect_km"),
            large_night_protect_miles=(large.get("night") or {}).get("protect_mi"),
        )
        db.add(row)
        distance_rows += 1

    db.commit()

    # Emergency contacts
    # JSON is organized by country -> {name: phone}
    for country, entries in contacts.items():
        if not isinstance(entries, dict):
            continue
        for name, phone in entries.items():
            row = ErgEmergencyContact(
                name=str(name).replace("_", " ").title(),
                phone=str(phone),
                country=str(country).upper(),
                description=None,
                is_primary=("chemtrec" in str(name).lower() or "canutec" in str(name).lower() or "cenacom" in str(name).lower()),
                is_24_hour=True,
                material_types=None,
                priority=1 if ("chemtrec" in str(name).lower() or "canutec" in str(name).lower() or "cenacom" in str(name).lower()) else 100,
            )
            db.add(row)
            contact_rows += 1

    db.commit()

    return {
        "status": "seeded",
        "version_tag": version_tag,
        "counts": {
            "hazard_classes": hazard_class_rows,
            "guides": guide_rows,
            "materials": material_rows,
            "protective_distances": distance_rows,
            "contacts": contact_rows,
            "un_index": un_index_rows,
            "guide_text": guide_text_rows,
            "embedding_rows": embedding_rows,
        },
    }
