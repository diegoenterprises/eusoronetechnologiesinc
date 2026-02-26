"""
NLP Router — spaCy NER + text classification + load query parsing.
"""

import logging
import re
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("ai-sidecar.nlp")
router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class EntityRequest(BaseModel):
    text: str
    entity_types: list[str] = []  # filter to specific types; empty = all


class Entity(BaseModel):
    text: str
    label: str
    start: int
    end: int
    confidence: float = 0.0


class EntityResponse(BaseModel):
    success: bool
    entities: list[Entity] = []
    error: Optional[str] = None


class ParseLoadRequest(BaseModel):
    query: str  # e.g. "flatbed from Houston to Chicago next week under $3/mile"


class ParsedLoadQuery(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    equipment: Optional[str] = None
    cargo_type: Optional[str] = None
    max_rate: Optional[float] = None
    min_rate: Optional[float] = None
    date_range: Optional[str] = None
    weight: Optional[str] = None
    hazmat: bool = False
    keywords: list[str] = []


class ParseLoadResponse(BaseModel):
    success: bool
    parsed: ParsedLoadQuery
    entities: list[Entity] = []
    error: Optional[str] = None


class ClassifyRequest(BaseModel):
    text: str
    categories: list[str] = []  # candidate categories for zero-shot


class ClassifyResponse(BaseModel):
    success: bool
    category: str = ""
    confidence: float = 0.0
    scores: dict = {}
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# spaCy model accessor
# ---------------------------------------------------------------------------

def get_spacy(request: Request):
    """Get the spaCy model from app state."""
    model = request.app.state.models.get("spacy")
    if model is None:
        raise HTTPException(503, "spaCy model not loaded")
    return model


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/entities", response_model=EntityResponse)
async def extract_entities(req: EntityRequest, request: Request):
    """
    Extract named entities from text using spaCy NER.
    Returns locations (GPE, LOC), organizations (ORG), dates (DATE),
    monetary values (MONEY), quantities (QUANTITY), etc.
    """
    try:
        nlp = get_spacy(request)
        doc = nlp(req.text[:10000])

        entities = []
        for ent in doc.ents:
            if req.entity_types and ent.label_ not in req.entity_types:
                continue
            entities.append(Entity(
                text=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char,
                confidence=0.85,
            ))

        return EntityResponse(success=True, entities=entities)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Entity extraction error: {e}")
        return EntityResponse(success=False, error=str(e))


@router.post("/parse-load", response_model=ParseLoadResponse)
async def parse_load_query(req: ParseLoadRequest, request: Request):
    """
    Parse a natural language load search query into structured fields.
    Example: "flatbed from Houston to Chicago next week under $3/mile"
    → { origin: "Houston", destination: "Chicago", equipment: "flatbed",
        max_rate: 3.0, date_range: "next week" }
    """
    try:
        nlp = get_spacy(request)
        doc = nlp(req.query)

        parsed = ParsedLoadQuery()
        entities = []

        # Extract spaCy entities
        for ent in doc.ents:
            entities.append(Entity(
                text=ent.text, label=ent.label_,
                start=ent.start_char, end=ent.end_char, confidence=0.85,
            ))

        # Locations: GPE entities
        locations = [e for e in entities if e.label in ("GPE", "LOC")]

        # "from X to Y" pattern
        text_lower = req.query.lower()
        from_to = re.search(r"from\s+(.+?)\s+to\s+(.+?)(?:\s|$|,|\.)", text_lower)
        if from_to:
            parsed.origin = from_to.group(1).strip().title()
            parsed.destination = from_to.group(2).strip().split()[0].title()
        elif len(locations) >= 2:
            parsed.origin = locations[0].text
            parsed.destination = locations[1].text
        elif len(locations) == 1:
            # Check context: "to X" or "from X"
            if f"to {locations[0].text.lower()}" in text_lower:
                parsed.destination = locations[0].text
            else:
                parsed.origin = locations[0].text

        # Equipment types
        equipment_map = {
            "flatbed": "FLATBED", "flat bed": "FLATBED",
            "dry van": "DRY_VAN", "van": "DRY_VAN",
            "reefer": "REEFER", "refrigerated": "REEFER",
            "tanker": "TANKER", "tank": "TANKER",
            "hopper": "HOPPER",
            "step deck": "STEP_DECK", "stepdeck": "STEP_DECK",
            "lowboy": "LOWBOY", "low boy": "LOWBOY",
            "cryogenic": "CRYOGENIC", "cryo": "CRYOGENIC",
            "mc338": "MC338", "mc331": "MC331",
            "food grade": "FOOD_GRADE",
            "hazmat": "HAZMAT_VAN",
            "conestoga": "CONESTOGA",
            "double drop": "DOUBLE_DROP",
        }
        for keyword, equip in equipment_map.items():
            if keyword in text_lower:
                parsed.equipment = equip
                break

        # Rate constraints
        rate_under = re.search(r"(?:under|below|less than|max|<)\s*\$?([\d.]+)\s*(?:/\s*(?:mi|mile))?", text_lower)
        if rate_under:
            parsed.max_rate = float(rate_under.group(1))

        rate_over = re.search(r"(?:over|above|more than|min|>)\s*\$?([\d.]+)\s*(?:/\s*(?:mi|mile))?", text_lower)
        if rate_over:
            parsed.min_rate = float(rate_over.group(1))

        rate_exact = re.search(r"\$\s*([\d,]+(?:\.\d+)?)\s*(?:/\s*(?:mi|mile))?", text_lower)
        if rate_exact and not rate_under and not rate_over:
            parsed.max_rate = float(rate_exact.group(1).replace(",", ""))

        # Date references
        date_entities = [e for e in entities if e.label in ("DATE", "TIME")]
        if date_entities:
            parsed.date_range = date_entities[0].text
        else:
            for pattern in ["today", "tomorrow", "next week", "this week", "next month",
                           "asap", "urgent", "monday", "tuesday", "wednesday", "thursday",
                           "friday", "saturday", "sunday"]:
                if pattern in text_lower:
                    parsed.date_range = pattern
                    break

        # Hazmat detection
        hazmat_keywords = ["hazmat", "hazardous", "dangerous goods", "dg", "un number",
                          "placard", "haz mat", "chemical", "flammable", "corrosive",
                          "explosive", "toxic", "radioactive"]
        parsed.hazmat = any(kw in text_lower for kw in hazmat_keywords)

        # Cargo type
        cargo_map = {
            "crude": "petroleum", "oil": "petroleum", "petroleum": "petroleum",
            "fuel": "petroleum", "diesel": "petroleum", "gasoline": "petroleum",
            "chemical": "chemicals", "acid": "chemicals",
            "food": "refrigerated", "produce": "refrigerated", "frozen": "refrigerated",
            "lumber": "general", "steel": "general", "machinery": "general",
            "oversized": "oversized", "overweight": "oversized",
        }
        for keyword, cargo in cargo_map.items():
            if keyword in text_lower:
                parsed.cargo_type = cargo
                break

        # Weight
        weight_match = re.search(r"(\d[\d,]*)\s*(?:lbs?|pounds?|tons?|k)", text_lower)
        if weight_match:
            parsed.weight = weight_match.group(0)

        # Remaining keywords
        stop_words = {"a", "an", "the", "from", "to", "in", "for", "with", "and",
                     "or", "load", "loads", "find", "search", "show", "get", "need",
                     "want", "looking", "available", "me", "my", "i"}
        parsed.keywords = [
            token.text for token in doc
            if token.text.lower() not in stop_words
            and not token.is_punct and not token.is_space
            and len(token.text) > 1
        ][:10]

        return ParseLoadResponse(success=True, parsed=parsed, entities=entities)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Parse load error: {e}")
        return ParseLoadResponse(success=False, parsed=ParsedLoadQuery(), error=str(e))


@router.post("/classify", response_model=ClassifyResponse)
async def classify_text(req: ClassifyRequest, request: Request):
    """
    Classify text into categories using keyword matching + spaCy analysis.
    For support tickets, document types, etc.
    """
    try:
        nlp = get_spacy(request)
        doc = nlp(req.text[:5000])

        # Default categories for support tickets
        categories = req.categories or [
            "billing", "technical", "compliance", "loads", "account",
            "agreements", "safety", "general",
        ]

        # Keyword-based scoring
        category_keywords = {
            "billing": ["payment", "invoice", "charge", "fee", "refund", "money",
                       "settlement", "factoring", "commission", "price", "rate", "cost"],
            "technical": ["error", "bug", "crash", "login", "password", "app", "page",
                         "broken", "loading", "slow", "not working", "issue", "problem"],
            "compliance": ["compliance", "regulation", "fmcsa", "dot", "inspection",
                          "violation", "audit", "permit", "license", "certification",
                          "hos", "eld", "hazmat", "drug test", "medical"],
            "loads": ["load", "shipment", "pickup", "delivery", "route", "freight",
                     "dispatch", "tracking", "bol", "carrier", "driver"],
            "account": ["account", "profile", "settings", "email", "phone", "name",
                       "company", "registration", "verify", "approval"],
            "agreements": ["agreement", "contract", "sign", "negotiate", "terms",
                          "clause", "amendment", "terminate"],
            "safety": ["safety", "accident", "incident", "breakdown", "emergency",
                      "injury", "spill", "fire", "crash"],
            "general": [],
        }

        text_lower = req.text.lower()
        scores = {}
        for cat in categories:
            keywords = category_keywords.get(cat, [])
            if not keywords:
                scores[cat] = 0.1  # baseline
                continue
            matches = sum(1 for kw in keywords if kw in text_lower)
            scores[cat] = min(matches / max(len(keywords) * 0.3, 1), 1.0)

        # Boost with entity types
        entity_labels = {ent.label_ for ent in doc.ents}
        if "MONEY" in entity_labels:
            scores["billing"] = scores.get("billing", 0) + 0.2
        if "LAW" in entity_labels:
            scores["compliance"] = scores.get("compliance", 0) + 0.2
        if "GPE" in entity_labels or "LOC" in entity_labels:
            scores["loads"] = scores.get("loads", 0) + 0.1

        best = max(scores, key=scores.get) if scores else "general"
        conf = min(scores.get(best, 0), 1.0)

        return ClassifyResponse(success=True, category=best, confidence=round(conf, 3), scores=scores)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Classify error: {e}")
        return ClassifyResponse(success=False, error=str(e))
