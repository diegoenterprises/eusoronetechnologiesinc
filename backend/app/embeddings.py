import hashlib
import math
import os
import re
from typing import List


_DIM_DEFAULT = 768


def _tokenize(text: str) -> List[str]:
    if not text:
        return []
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]+", " ", text)
    return [t for t in text.split() if t]


def embed_text_local_hash(text: str, dim: int = _DIM_DEFAULT) -> List[float]:
    """Deterministic, offline embedding.

    This is a hashed bag-of-words embedding:
    - stable across runs
    - no external API required
    - suitable for pgvector cosine similarity
    """

    vec = [0.0] * dim
    tokens = _tokenize(text)
    if not tokens:
        return vec

    for tok in tokens:
        h = hashlib.sha256(tok.encode("utf-8")).digest()
        idx = int.from_bytes(h[:4], "big") % dim
        sign = -1.0 if (h[4] & 1) else 1.0
        vec[idx] += sign

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def get_embedding_dim() -> int:
    try:
        return int(os.getenv("ERG_EMBED_DIM", str(_DIM_DEFAULT)))
    except Exception:
        return _DIM_DEFAULT


def embed_text(text: str) -> List[float]:
    provider = (os.getenv("ERG_EMBEDDING_PROVIDER") or "local_hash").lower()
    dim = get_embedding_dim()

    if provider == "local_hash":
        return embed_text_local_hash(text, dim=dim)

    raise RuntimeError(
        "Unsupported ERG_EMBEDDING_PROVIDER. Supported: local_hash. "
        "Configure a custom provider once you have an embeddings API key."
    )
