"""In-house TF-IDF vectoriser and cosine similarity (standard library only).

Definition, so a score can be checked by hand:
  term   = a field-namespaced feature: "p:<word>" for each plot token ([a-z0-9]+ on the
           lowercased plot), "g:<genre>" per genre, "d:<director>" and "c:<name>" per cast
           member, each lowercased and trimmed; empty values give no term.
  tf     = raw count of the term in the movie
  idf    = ln((1 + N) / (1 + df)) + 1, N = movies in the catalog, df = movies with the term
  weight = tf * idf
  score  = cosine of two weight vectors (0 when either vector is empty)
Ranking: score (rounded to 6 decimals) descending, then id ascending; 0 scores are omitted.
"""

import math
import re
from collections import Counter
from collections.abc import Iterable
from typing import Any

Vector = dict[str, float]
LIMIT = 10


def terms(movie: Any) -> Counter[str]:
    """Raw term counts of one movie (needs plot, genres, director, cast_members)."""
    counts: Counter[str] = Counter()
    for word in re.findall(r"[a-z0-9]+", (movie.plot or "").lower()):
        counts["p:" + word] += 1
    for genre in movie.genres or []:
        if genre.strip():
            counts["g:" + genre.strip().lower()] += 1
    if (movie.director or "").strip():
        counts["d:" + movie.director.strip().lower()] += 1
    for name in movie.cast_members or []:
        if name.strip():
            counts["c:" + name.strip().lower()] += 1
    return counts


def vectorise(movies: Iterable[Any]) -> dict[int, Vector]:
    """TF-IDF vector of every movie, keyed by movie id."""
    counted = {m.id: terms(m) for m in movies}
    n = len(counted)
    df: Counter[str] = Counter()
    for c in counted.values():
        df.update(c.keys())
    idf = {t: math.log((1 + n) / (1 + d)) + 1 for t, d in df.items()}
    return {mid: {t: tf * idf[t] for t, tf in c.items()} for mid, c in counted.items()}


def cosine(a: Vector, b: Vector) -> float:
    if not a or not b:
        return 0.0
    if len(b) < len(a):
        a, b = b, a
    dot = sum(w * b[t] for t, w in a.items() if t in b)
    na = math.sqrt(sum(w * w for w in a.values()))
    nb = math.sqrt(sum(w * w for w in b.values()))
    if not na or not nb:
        return 0.0
    return min(1.0, max(0.0, dot / (na * nb)))


def add_vectors(vectors: Iterable[Vector]) -> Vector:
    total: Vector = {}
    for v in vectors:
        for t, w in v.items():
            total[t] = total.get(t, 0.0) + w
    return total


def rank(
    target: Vector, vectors: dict[int, Vector], exclude: set[int], limit: int = LIMIT
) -> list[tuple[int, float]]:
    """(id, score) pairs, best first, ties by id, zero scores left out."""
    scored = []
    for mid, vec in vectors.items():
        if mid in exclude:
            continue
        score = round(cosine(target, vec), 6)
        if score > 0:
            scored.append((mid, score))
    scored.sort(key=lambda t: (-t[1], t[0]))
    return scored[:limit]
