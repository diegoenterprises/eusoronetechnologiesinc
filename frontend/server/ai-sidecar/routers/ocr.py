"""
OCR & Document Processing Router
Docling (structured extraction) + PaddleOCR (raw OCR) + specialized extractors.
"""

import base64
import io
import json
import logging
import tempfile
import os
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("ai-sidecar.ocr")
router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class OCRRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/png"
    engine: str = "auto"  # "auto" | "docling" | "paddle"
    extract_tables: bool = True


class BOLExtractRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/png"


class RateSheetExtractRequest(BaseModel):
    file_base64: str
    mime_type: str = "application/pdf"


class OCRLine(BaseModel):
    text: str
    confidence: float
    bbox: Optional[list] = None


class OCRResponse(BaseModel):
    success: bool
    engine: str
    text: str
    lines: list[OCRLine]
    tables: list[dict] = []
    avg_confidence: float = 0.0
    error: Optional[str] = None


class BOLFields(BaseModel):
    shipper_name: Optional[str] = None
    shipper_address: Optional[str] = None
    consignee_name: Optional[str] = None
    consignee_address: Optional[str] = None
    carrier_name: Optional[str] = None
    bol_number: Optional[str] = None
    date: Optional[str] = None
    commodity: Optional[str] = None
    weight: Optional[str] = None
    pieces: Optional[str] = None
    hazmat_class: Optional[str] = None
    un_number: Optional[str] = None
    packing_group: Optional[str] = None
    emergency_phone: Optional[str] = None
    special_instructions: Optional[str] = None
    po_number: Optional[str] = None
    pro_number: Optional[str] = None


class BOLResponse(BaseModel):
    success: bool
    fields: BOLFields
    raw_text: str
    confidence: float
    error: Optional[str] = None


class RateSheetResponse(BaseModel):
    success: bool
    rate_tiers: list[dict]
    surcharges: dict
    metadata: dict
    raw_text: str
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Lazy model loaders
# ---------------------------------------------------------------------------

_paddle_ocr = None
_docling_converter = None


def get_paddle_ocr():
    global _paddle_ocr
    if _paddle_ocr is None:
        try:
            from paddleocr import PaddleOCR
            _paddle_ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            logger.info("PaddleOCR loaded")
        except ImportError:
            logger.warning("PaddleOCR not installed")
            raise HTTPException(503, "PaddleOCR not available")
    return _paddle_ocr


def get_docling():
    global _docling_converter
    if _docling_converter is None:
        try:
            from docling.document_converter import DocumentConverter
            _docling_converter = DocumentConverter()
            logger.info("Docling DocumentConverter loaded")
        except ImportError:
            logger.warning("Docling not installed")
            raise HTTPException(503, "Docling not available")
    return _docling_converter


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def decode_to_tempfile(b64_data: str, mime_type: str) -> str:
    """Decode base64 to a temp file, return path."""
    raw = b64_data
    if "," in raw:
        raw = raw.split(",", 1)[1]
    data = base64.b64decode(raw)

    ext_map = {
        "application/pdf": ".pdf",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/tiff": ".tiff",
    }
    ext = ext_map.get(mime_type, ".bin")
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    tmp.write(data)
    tmp.close()
    return tmp.name


def run_paddle(file_path: str) -> tuple[str, list[OCRLine], float]:
    """Run PaddleOCR on a file, return (full_text, lines, avg_confidence)."""
    ocr = get_paddle_ocr()
    result = ocr.ocr(file_path, cls=True)

    lines = []
    text_parts = []
    if result and result[0]:
        for line in result[0]:
            bbox = line[0]
            txt = line[1][0]
            conf = float(line[1][1])
            lines.append(OCRLine(
                text=txt,
                confidence=round(conf, 4),
                bbox=[[int(p[0]), int(p[1])] for p in bbox],
            ))
            text_parts.append(txt)

    full_text = "\n".join(text_parts)
    avg_conf = sum(l.confidence for l in lines) / len(lines) if lines else 0.0
    return full_text, lines, round(avg_conf, 4)


def run_docling(file_path: str) -> tuple[str, list[dict]]:
    """Run Docling on a file, return (markdown_text, tables)."""
    converter = get_docling()
    result = converter.convert(file_path)
    md_text = result.document.export_to_markdown()

    tables = []
    for table in result.document.tables:
        try:
            table_data = table.export_to_dataframe()
            tables.append({
                "headers": list(table_data.columns),
                "rows": table_data.values.tolist(),
                "num_rows": len(table_data),
            })
        except Exception:
            tables.append({"headers": [], "rows": [], "num_rows": 0})

    return md_text, tables


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/extract", response_model=OCRResponse)
async def extract_text(req: OCRRequest):
    """
    Extract text from a document image/PDF.
    Engine: 'auto' tries Docling first (structured), falls back to PaddleOCR.
    """
    tmp_path = None
    try:
        tmp_path = decode_to_tempfile(req.image_base64, req.mime_type)

        # Auto: try Docling for PDFs, PaddleOCR for images
        if req.engine == "auto":
            if req.mime_type == "application/pdf":
                try:
                    md_text, tables = run_docling(tmp_path)
                    lines = [OCRLine(text=l, confidence=0.95) for l in md_text.split("\n") if l.strip()]
                    return OCRResponse(
                        success=True, engine="docling", text=md_text,
                        lines=lines, tables=tables, avg_confidence=0.95,
                    )
                except Exception as e:
                    logger.warning(f"Docling failed, falling back to PaddleOCR: {e}")

            # Fallback / images: PaddleOCR
            text, lines, avg_conf = run_paddle(tmp_path)
            return OCRResponse(
                success=True, engine="paddleocr", text=text,
                lines=lines, avg_confidence=avg_conf,
            )

        elif req.engine == "docling":
            md_text, tables = run_docling(tmp_path)
            lines = [OCRLine(text=l, confidence=0.95) for l in md_text.split("\n") if l.strip()]
            return OCRResponse(
                success=True, engine="docling", text=md_text,
                lines=lines, tables=tables, avg_confidence=0.95,
            )

        elif req.engine == "paddle":
            text, lines, avg_conf = run_paddle(tmp_path)
            return OCRResponse(
                success=True, engine="paddleocr", text=text,
                lines=lines, avg_confidence=avg_conf,
            )

        else:
            raise HTTPException(400, f"Unknown engine: {req.engine}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR extract error: {e}")
        return OCRResponse(success=False, engine="none", text="", lines=[], error=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/bol", response_model=BOLResponse)
async def extract_bol(req: BOLExtractRequest):
    """
    Extract structured BOL fields from a scanned Bill of Lading.
    Uses PaddleOCR for text extraction, then regex/NLP for field parsing.
    """
    tmp_path = None
    try:
        tmp_path = decode_to_tempfile(req.image_base64, req.mime_type)
        text, lines, avg_conf = run_paddle(tmp_path)

        if not text.strip():
            return BOLResponse(success=False, fields=BOLFields(), raw_text="", confidence=0, error="No text extracted")

        fields = parse_bol_fields(text)
        return BOLResponse(success=True, fields=fields, raw_text=text, confidence=avg_conf)

    except Exception as e:
        logger.error(f"BOL extract error: {e}")
        return BOLResponse(success=False, fields=BOLFields(), raw_text="", confidence=0, error=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/ratesheet", response_model=RateSheetResponse)
async def extract_ratesheet(req: RateSheetExtractRequest):
    """
    Extract structured rate tiers from a rate sheet PDF/image.
    Uses Docling for table extraction, falls back to PaddleOCR + regex.
    """
    tmp_path = None
    try:
        tmp_path = decode_to_tempfile(req.file_base64, req.mime_type)

        tables = []
        raw_text = ""

        # Try Docling first for structured table extraction
        try:
            md_text, doc_tables = run_docling(tmp_path)
            raw_text = md_text
            tables = doc_tables
        except Exception:
            # Fallback to PaddleOCR
            text, _, _ = run_paddle(tmp_path)
            raw_text = text

        rate_tiers, surcharges, metadata = parse_rate_sheet(raw_text, tables)
        return RateSheetResponse(
            success=True, rate_tiers=rate_tiers, surcharges=surcharges,
            metadata=metadata, raw_text=raw_text[:3000],
        )

    except Exception as e:
        logger.error(f"Rate sheet extract error: {e}")
        return RateSheetResponse(
            success=False, rate_tiers=[], surcharges={},
            metadata={}, raw_text="", error=str(e),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Field parsers
# ---------------------------------------------------------------------------

import re


def parse_bol_fields(text: str) -> BOLFields:
    """Parse BOL fields from raw OCR text using regex patterns."""
    fields = BOLFields()
    upper = text.upper()
    lines_list = text.split("\n")

    # BOL Number
    m = re.search(r"(?:BOL|B/L|BILL OF LADING)\s*(?:#|NO\.?|NUMBER)?\s*:?\s*([A-Z0-9\-]+)", upper)
    if m:
        fields.bol_number = m.group(1)

    # Date
    m = re.search(r"(?:DATE|SHIP DATE|PICKUP DATE)\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})", upper)
    if m:
        fields.date = m.group(1)

    # PO Number
    m = re.search(r"(?:P\.?O\.?|PURCHASE ORDER)\s*(?:#|NO\.?)?\s*:?\s*([A-Z0-9\-]+)", upper)
    if m:
        fields.po_number = m.group(1)

    # PRO Number
    m = re.search(r"(?:PRO)\s*(?:#|NO\.?)?\s*:?\s*([A-Z0-9\-]+)", upper)
    if m:
        fields.pro_number = m.group(1)

    # Weight
    m = re.search(r"(?:WEIGHT|WT\.?|GROSS\s*WT)\s*:?\s*([\d,]+)\s*(?:LBS?|POUNDS?|KG)?", upper)
    if m:
        fields.weight = m.group(1).replace(",", "")

    # Pieces / Quantity
    m = re.search(r"(?:PIECES?|QTY|QUANTITY|UNITS?)\s*:?\s*(\d+)", upper)
    if m:
        fields.pieces = m.group(1)

    # Hazmat class
    m = re.search(r"(?:HAZMAT|HAZ\s*MAT|HAZARD)\s*(?:CLASS)?\s*:?\s*(\d+\.?\d*)", upper)
    if m:
        fields.hazmat_class = m.group(1)

    # UN Number
    m = re.search(r"UN\s*(\d{4})", upper)
    if m:
        fields.un_number = f"UN{m.group(1)}"

    # Packing Group
    m = re.search(r"(?:PACKING\s*GROUP|PG)\s*:?\s*(I{1,3}|[123])", upper)
    if m:
        fields.packing_group = m.group(1)

    # Emergency phone
    m = re.search(r"(?:EMERGENCY|CHEMTREC|24.?HR)\s*(?:PHONE|CONTACT|#)?\s*:?\s*([\d\-\(\)\s]{10,})", upper)
    if m:
        fields.emergency_phone = m.group(1).strip()

    # Shipper / Consignee — look for labeled sections
    for i, line in enumerate(lines_list):
        line_upper = line.upper().strip()
        if "SHIPPER" in line_upper or "SHIP FROM" in line_upper or "FROM:" in line_upper:
            fields.shipper_name = _extract_next_name(lines_list, i)
            fields.shipper_address = _extract_next_address(lines_list, i)
        elif "CONSIGNEE" in line_upper or "SHIP TO" in line_upper or "DELIVER TO" in line_upper:
            fields.consignee_name = _extract_next_name(lines_list, i)
            fields.consignee_address = _extract_next_address(lines_list, i)
        elif "CARRIER" in line_upper and "NAME" in line_upper:
            fields.carrier_name = _extract_next_name(lines_list, i)

    # Commodity — look near "DESCRIPTION" or "COMMODITY"
    m = re.search(r"(?:DESCRIPTION|COMMODITY|PRODUCT)\s*(?:OF\s*GOODS?)?\s*:?\s*(.+)", upper)
    if m:
        fields.commodity = m.group(1).strip()[:200]

    return fields


def _extract_next_name(lines: list[str], idx: int) -> Optional[str]:
    """Get the next non-empty line after a label as the name."""
    for j in range(idx + 1, min(idx + 4, len(lines))):
        stripped = lines[j].strip()
        if stripped and len(stripped) > 2 and not stripped.upper().startswith(("CONSIGNEE", "CARRIER", "SHIPPER")):
            return stripped
    return None


def _extract_next_address(lines: list[str], idx: int) -> Optional[str]:
    """Get address lines after a name (look for city/state/zip pattern)."""
    parts = []
    for j in range(idx + 1, min(idx + 6, len(lines))):
        stripped = lines[j].strip()
        if stripped:
            parts.append(stripped)
            if re.search(r"\d{5}", stripped):  # ZIP code likely ends address
                break
    return ", ".join(parts[:3]) if parts else None


def parse_rate_sheet(text: str, tables: list[dict]) -> tuple[list[dict], dict, dict]:
    """Parse rate tiers and surcharges from extracted text/tables."""
    rate_tiers = []
    surcharges = {}
    metadata = {}

    # If Docling extracted tables, parse them for rate tiers
    for table in tables:
        headers = [str(h).lower() for h in table.get("headers", [])]
        rows = table.get("rows", [])

        # Look for mile/rate columns
        mile_col = next((i for i, h in enumerate(headers) if "mile" in h or "distance" in h), None)
        rate_col = next((i for i, h in enumerate(headers) if "rate" in h or "price" in h or "per" in h), None)

        if mile_col is not None and rate_col is not None:
            for row in rows:
                try:
                    mile_str = str(row[mile_col]).replace(",", "")
                    rate_str = str(row[rate_col]).replace("$", "").replace(",", "")

                    # Parse mile range (e.g., "0-50" or "50")
                    mile_match = re.match(r"(\d+)\s*[-–]\s*(\d+)", mile_str)
                    if mile_match:
                        min_miles = int(mile_match.group(1))
                        max_miles = int(mile_match.group(2))
                    else:
                        miles = int(float(mile_str))
                        min_miles = miles
                        max_miles = miles + 49

                    rate = float(rate_str)
                    rate_tiers.append({
                        "minMiles": min_miles,
                        "maxMiles": max_miles,
                        "ratePerBarrel": rate,
                    })
                except (ValueError, IndexError):
                    continue

    # Fallback: regex extraction from raw text
    if not rate_tiers:
        for m in re.finditer(r"(\d+)\s*[-–]\s*(\d+)\s*(?:miles?)?\s*[\$:]?\s*(\d+\.?\d*)", text, re.IGNORECASE):
            rate_tiers.append({
                "minMiles": int(m.group(1)),
                "maxMiles": int(m.group(2)),
                "ratePerBarrel": float(m.group(3)),
            })

    # Surcharges
    upper = text.upper()
    fsc_match = re.search(r"(?:FUEL\s*SURCHARGE|FSC)\s*:?\s*\$?([\d.]+)", upper)
    if fsc_match:
        surcharges["fuelSurcharge"] = float(fsc_match.group(1))

    wait_match = re.search(r"(?:WAIT\s*TIME|DETENTION)\s*:?\s*\$?([\d.]+)\s*/?\s*(?:HR|HOUR)?", upper)
    if wait_match:
        surcharges["waitTimeRatePerHour"] = float(wait_match.group(1))

    split_match = re.search(r"(?:SPLIT\s*LOAD)\s*:?\s*\$?([\d.]+)", upper)
    if split_match:
        surcharges["splitLoadFee"] = float(split_match.group(1))

    # Metadata
    date_match = re.search(r"(?:EFFECTIVE|EFF\.?\s*DATE)\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})", upper)
    if date_match:
        metadata["effectiveDate"] = date_match.group(1)

    exp_match = re.search(r"(?:EXPIR|EXP\.?\s*DATE)\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})", upper)
    if exp_match:
        metadata["expirationDate"] = exp_match.group(1)

    return rate_tiers, surcharges, metadata
