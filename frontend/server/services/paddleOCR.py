#!/usr/bin/env python3
"""
PaddleOCR Helper for EusoTrip Document Center
Extracts text from document images using PaddleOCR.
Called from Node.js via child_process.

Usage: python3 paddleOCR.py <base64_image_path>
Output: JSON with extracted text lines and confidence scores.

Install deps: pip3 install paddlepaddle paddleocr
"""

import sys
import json
import os
import base64
import tempfile

def run_ocr(image_path: str) -> dict:
    try:
        from paddleocr import PaddleOCR
    except ImportError:
        return {
            "success": False,
            "error": "PaddleOCR not installed. Run: pip3 install paddlepaddle paddleocr",
            "text": "",
            "lines": [],
        }

    try:
        ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        result = ocr.ocr(image_path, cls=True)

        lines = []
        full_text_parts = []

        if result and result[0]:
            for line in result[0]:
                bbox = line[0]
                text = line[1][0]
                confidence = float(line[1][1])
                lines.append({
                    "text": text,
                    "confidence": round(confidence, 4),
                    "bbox": [[int(p[0]), int(p[1])] for p in bbox],
                })
                full_text_parts.append(text)

        return {
            "success": True,
            "text": "\n".join(full_text_parts),
            "lines": lines,
            "lineCount": len(lines),
            "avgConfidence": round(
                sum(l["confidence"] for l in lines) / len(lines), 4
            ) if lines else 0,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "text": "",
            "lines": [],
        }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No input provided", "text": "", "lines": []}))
        sys.exit(1)

    input_arg = sys.argv[1]

    # If input is a file path to a base64-encoded file, decode it first
    if input_arg.endswith(".b64"):
        with open(input_arg, "r") as f:
            b64_data = f.read()
        # Strip data URI prefix if present
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        raw = base64.b64decode(b64_data)
        # Detect extension from magic bytes
        ext = ".png"
        if raw[:3] == b"\xff\xd8\xff":
            ext = ".jpg"
        elif raw[:4] == b"%PDF":
            ext = ".pdf"
        elif raw[:4] == b"\x89PNG":
            ext = ".png"
        tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
        tmp.write(raw)
        tmp.close()
        result = run_ocr(tmp.name)
        os.unlink(tmp.name)
    else:
        result = run_ocr(input_arg)

    print(json.dumps(result))


if __name__ == "__main__":
    main()
