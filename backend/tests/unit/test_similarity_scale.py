"""Similarity at catalog scale and the in-memory catalog cache (AC-034..038, NFR-007/008/012)."""

import random
import secrets
import time
from types import SimpleNamespace

from app import similarity
from app.routers import movies as movies_router

WORDS = [f"w{i}" for i in range(400)]


def _catalog(n: int):
    rng = random.Random(7)
    return [
        SimpleNamespace(
            id=i,
            plot=" ".join(rng.choices(WORDS, k=30)),
            genres=rng.sample(["a", "b", "c", "d", "e", "f"], 2),
            director=f"dir{rng.randrange(300)}",
            cast_members=[f"cast{rng.randrange(2000)}" for _ in range(4)],
        )
        for i in range(1, n + 1)
    ]


def test_ac038_nfr007_nfr008_5000_movies_vectorise_and_rank_fast() -> None:
    catalog = _catalog(5000)
    start = time.perf_counter()
    vectors = similarity.vectorise(catalog)
    ranked = similarity.rank(vectors[1], vectors, {1})
    elapsed = time.perf_counter() - start
    assert elapsed < 2.0
    assert len(ranked) == 10


def test_ac034_ac035_ac037_nfr012_ranked_output_is_bounded_sorted_and_stable() -> None:
    vectors = similarity.vectorise(_catalog(500))
    first = similarity.rank(vectors[5], vectors, {5})
    assert first == similarity.rank(vectors[5], vectors, {5})
    assert len(first) <= 10 and all(i != 5 for i, _ in first)
    assert all(0 < s <= 1 for _, s in first)
    keys = [(-s, i) for i, s in first]
    assert keys == sorted(keys)


def test_nfr012_scores_stay_in_range_with_empty_fields() -> None:
    empty = dict(plot="", genres=[], director="", cast_members=[])
    movies = [SimpleNamespace(id=i, **empty) for i in (1, 2)]
    movies.append(SimpleNamespace(id=3, plot="x", genres=[" "], director=None, cast_members=None))
    vectors = similarity.vectorise(movies)
    assert similarity.rank(vectors[3], vectors, {3}) == []


def test_ac038_catalog_cache_rebuilds_only_when_fingerprint_changes(monkeypatch) -> None:
    calls = []
    real = similarity.vectorise
    monkeypatch.setattr(similarity, "vectorise", lambda ms: calls.append(1) or real(ms))
    fingerprint = [(1, 1, "t")]

    class FakeDB:
        def execute(self, _stmt):
            return SimpleNamespace(one=lambda: fingerprint[0])

        def scalars(self, _stmt):
            return [
                SimpleNamespace(
                    id=1, title="T", year=2000, genres=[], director="", cast_members=[], plot="x"
                )
            ]

    monkeypatch.setitem(movies_router._cache, "key", None)
    tag = secrets.token_hex(2)
    fingerprint[0] = (1, 1, tag)
    movies_router._catalog(FakeDB())
    movies_router._catalog(FakeDB())
    assert len(calls) == 1
    fingerprint[0] = (2, 2, tag)
    movies_router._catalog(FakeDB())
    assert len(calls) == 2
