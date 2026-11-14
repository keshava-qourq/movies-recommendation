"""TF-IDF similarity against a hand-built catalog."""

import math
from types import SimpleNamespace

from app import similarity


def _m(id, plot="", genres=(), director="", cast=()):
    return SimpleNamespace(
        id=id, plot=plot, genres=list(genres), director=director, cast_members=list(cast)
    )


# Catalog (N=3): 1 "red fox", 2 "red dog", 3 "blue cat". df(red)=2, others 1.
# idf(red)=ln(4/3)+1=a, idf(other)=ln(4/2)+1=b.  v1={red:a,fox:b}  v2={red:a,dog:b}
# cos(1,2)=a^2/(a^2+b^2)=0.366..; movie 3 shares nothing so scores 0 and is omitted.
A = math.log(4 / 3) + 1
B = math.log(2) + 1
CATALOG = [_m(1, "Red fox"), _m(2, "red DOG!"), _m(3, "blue cat")]


def test_ac040_hand_calculated_scores_and_range() -> None:
    vecs = similarity.vectorise(CATALOG)
    assert abs(vecs[1]["p:red"] - A) < 1e-6 and abs(vecs[1]["p:fox"] - B) < 1e-6
    ranked = similarity.rank(vecs[1], vecs, {1})
    assert [i for i, _ in ranked] == [2]
    assert abs(ranked[0][1] - A * A / (A * A + B * B)) < 1e-6
    assert 0 <= ranked[0][1] <= 1


def test_ac039_each_field_changes_vector_and_scores() -> None:
    base = dict(plot="red fox", genres=["Drama"], director="Ann Lee", cast=["Bo Kim"])
    other = _m(2, **base)
    ref = similarity.vectorise([_m(1, **base), other])
    assert similarity.rank(ref[1], ref, {1}) == [(2, 1.0)]
    changes = dict(plot="blue fox", genres=["Comedy"], director="Zed Ray", cast=["Cy Ng"])
    for field, value in changes.items():
        vecs = similarity.vectorise([_m(1, **{**base, field: value}), other])
        assert vecs[1] != ref[1]
        assert similarity.rank(vecs[1], vecs, {1})[0][1] < 1.0


def test_ac039_terms_are_namespaced_and_lowercased() -> None:
    c = similarity.terms(_m(1, "Hi, hi X2", ["Sci-Fi"], " Ann Lee ", ["Bo Kim"]))
    assert c == {"p:hi": 2, "p:x2": 1, "g:sci-fi": 1, "d:ann lee": 1, "c:bo kim": 1}


def test_ac041_empty_fields_are_scored_without_error() -> None:
    movies = [_m(1, genres=["Drama"]), _m(2, plot="x", genres=["Drama"]), _m(3), _m(4)]
    vecs = similarity.vectorise(movies)
    assert vecs[3] == {}
    assert similarity.rank(vecs[3], vecs, {3}) == []
    ranked = similarity.rank(vecs[1], vecs, {1})
    assert [i for i, _ in ranked] == [2]


def test_nfr012_order_is_deterministic_with_ties_by_id() -> None:
    movies = [_m(5, "cat"), _m(2, "cat"), _m(9, "cat"), _m(1, "cat dog"), _m(7, "dog")]
    runs = []
    for _ in range(2):
        vecs = similarity.vectorise(movies)
        runs.append(similarity.rank(vecs[1], vecs, {1}))
    assert runs[0] == runs[1]
    tied = [i for i, s in runs[0] if s == runs[0][0][1]]
    assert tied == sorted(tied)
    scores = [s for _, s in runs[0]]
    assert scores == sorted(scores, reverse=True)


def test_nfr012_rank_caps_at_ten() -> None:
    movies = [_m(i, "cat") for i in range(1, 30)]
    vecs = similarity.vectorise(movies)
    assert len(similarity.rank(vecs[1], vecs, {1})) == 10
