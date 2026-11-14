// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { apiFetch, ApiError } from "@/lib/api";

const { Empty } = UI;

function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic generated artwork: the same movie always draws the same mark.
function Art({ movie, ink }) {
  let seed = hashOf(movie.title + movie.year);
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      if (next() > 0.45) {
        cells.push([c, r]);
        if (c < 2) cells.push([4 - c, r]);
      }
    }
  }
  const initials = movie.title
    .replace(/^The\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <svg
      viewBox="0 0 100 132"
      role="img"
      aria-label={"Generated artwork for " + movie.title}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <rect x="0" y="0" width="100" height="132" fill="#ffffff" />
      {cells.map((p, i) => (
        <rect key={i} x={p[0] * 20} y={p[1] * 20} width="20" height="20" fill={ink} />
      ))}
      <rect x="0" y="100" width="100" height="32" fill={ink} />
      <text
        x="8"
        y="123"
        fill="#ffffff"
        fontSize="20"
        fontWeight="700"
        letterSpacing="-0.5"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      >
        {initials}
      </text>
      <text
        x="92"
        y="123"
        fill="#ffffff"
        fontSize="11"
        textAnchor="end"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {movie.year}
      </text>
    </svg>
  );
}

function Heart({ filled }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.4 5c2.1 0 3.9 1.2 5.6 3.2C13.7 6.200 15.500 5 17.600 5 21 5 22.800 8.600 21.500 11.800 19.500 16.400 12 21 12 21z" />
    </svg>
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const raw = params.get("movie");
  const ink = brand.primaryColor;
  const muted = brand.neutralColor;
  const accent = brand.accentColor;
  const rule = "2px solid " + ink;

  const [state, setState] = React.useState("loading");
  const [movie, setMovie] = React.useState(null);
  const [isLiked, setIsLiked] = React.useState(false);
  const [similar, setSimilar] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const inflight = React.useRef(false);
  const [note, setNote] = React.useState("");
  const [failed, setFailed] = React.useState(false);
  const headingRef = React.useRef(null);

  React.useEffect(() => {
    setNote("");
    setFailed(false);
    if (raw === null || raw.trim() === "") {
      setMovie(null);
      setState("notfound");
      return undefined;
    }
    let live = true;
    setState("loading");
    const resolveId = async () => {
      if (/^\d+$/.test(raw)) return Number(raw);
      const wanted = raw.trim().toLowerCase();
      const found = await apiFetch("/movies?q=" + encodeURIComponent(raw.trim()) + "&limit=100");
      const hit = found.items.find((x) => x.title.trim().toLowerCase() === wanted);
      if (!hit) throw new ApiError(404, "Movie not found");
      return hit.id;
    };
    resolveId()
      .then((id) =>
        Promise.all([
          apiFetch("/movies/" + id),
          apiFetch("/me/likes"),
          apiFetch("/movies/" + id + "/similar"),
        ]).then(([m, likes, sim]) => [m, likes, sim, id]),
      )
      .then(([m, likes, sim, id]) => {
        if (!live) return;
        setMovie(m);
        setIsLiked(likes.items.some((x) => x.id === id));
        setSimilar(sim.items);
        setState("ready");
      })
      .catch((e) => {
        if (!live) return;
        setState(e instanceof ApiError && e.status === 404 ? "notfound" : "error");
      });
    return () => {
      live = false;
    };
  }, [raw]);

  React.useEffect(() => {
    if (state === "ready" && headingRef.current) headingRef.current.focus();
  }, [state, raw]);

  const toggleLike = async () => {
    if (!movie || inflight.current) return;
    inflight.current = true;
    setBusy(true);
    const wasLiked = isLiked;
    try {
      await apiFetch("/movies/" + movie.id + "/like", { method: wasLiked ? "DELETE" : "PUT" });
      setIsLiked(!wasLiked);
      setFailed(false);
      setNote(
        wasLiked
          ? "Removed from your likes. Your For you list will update."
          : "Saved to your likes. Your For you list will update.",
      );
    } catch (e) {
      setFailed(true);
      setNote("Could not update your like. Please try again.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  };

  const label = {
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: muted,
    fontWeight: 600,
  };

  const outer = {
    fontFamily: brand.fontBody,
    color: ink,
    backgroundColor: brand.backgroundColor,
    padding: 24,
    fontSize: 14,
    lineHeight: 1.5,
  };

  const backButton = (
    <div className="grid grid-cols-12 gap-4" style={{ marginBottom: 24 }}>
      <div className="col-span-12 sm:col-span-6 lg:col-span-3">
        <button
          type="button"
          data-wf="b-0-0"
          className="wd-back inline-flex items-center gap-2 w-full justify-center"
          onClick={() => navigate("/search")}
          style={{
            border: rule,
            borderRadius: brand.radius,
            background: "#ffffff",
            color: ink,
            minHeight: 40,
            padding: "8px 16px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <Icons.ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to search
        </button>
      </div>
    </div>
  );

  if (state === "loading") {
    return (
      <div className="wd" style={outer}>
        {backButton}
        <p role="status">Loading movie…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="wd" style={outer}>
        {backButton}
        <p role="alert" style={{ fontWeight: 600, color: accent }}>
          Could not load this movie. Check your connection and try again.
        </p>
      </div>
    );
  }

  if (state === "notfound" || !movie) {
    return (
      <div className="wd" style={outer}>
        {backButton}
        <div data-wf="b-5-0" style={{ border: rule, borderRadius: brand.radius, padding: 32 }}>
          <Empty
            title="Movie not found"
            description="This movie is not in the catalog. Search by title to find it."
            action={
              <Link
                to="/search"
                style={{
                  border: rule,
                  borderRadius: brand.radius,
                  background: ink,
                  color: "#ffffff",
                  minHeight: 40,
                  padding: "8px 16px",
                  fontWeight: 600,
                }}
              >
                Search movies
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const genres = movie.genres || [];
  const cast = movie.cast || [];

  return (
    <div className="wd" style={outer}>
      <style>{`
        .wd button { font-family: inherit; }
        .wd button:focus-visible, .wd a:focus-visible, .wd h1:focus-visible { outline: 2px solid ${ink}; outline-offset: 2px; }
        .wd .wd-fade { animation: wdfade 200ms ease-out; }
        .wd .wd-back:hover { background: ${ink}; color: #ffffff; }
        .wd .wd-cell:hover { background: #f2f2f2; }
        @keyframes wdfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .wd .wd-fade { animation: none; } }
      `}</style>

      {backButton}

      <div key={movie.id} className="wd-fade">
        <div className="grid grid-cols-12 gap-6" style={{ marginBottom: 24 }}>
          <div
            data-wf="b-1-0"
            className="col-span-12 sm:col-span-5 lg:col-span-4"
            style={{ alignSelf: "start" }}
          >
            <div style={{ border: rule, borderRadius: brand.radius, maxWidth: 320 }}>
              <Art movie={movie} ink={ink} />
            </div>
            <p style={{ ...label, marginTop: 8 }}>Generated artwork · no poster</p>
          </div>

          <section
            data-wf="b-1-1"
            aria-labelledby="movie-title"
            className="col-span-12 sm:col-span-7 lg:col-span-8"
          >
            <p style={label}>Movie · Record {String(movie.id).padStart(3, "0")}</p>
            <h1
              id="movie-title"
              ref={headingRef}
              tabIndex={-1}
              style={{
                fontFamily: brand.fontHeading,
                fontSize: 40,
                lineHeight: 1.1,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: "4px 0 16px",
                outline: "none",
              }}
            >
              {movie.title}{" "}
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 400 }}>
                ({movie.year})
              </span>
            </h1>
            <dl style={{ borderTop: rule, margin: 0 }}>
              {[
                { id: "i-1-1-0", k: "Genres", v: genres.join(", ") },
                { id: "i-1-1-1", k: "Director", v: movie.director },
                { id: "i-1-1-2", k: "Cast", v: cast.join(", ") },
              ].map((row) => (
                <div
                  key={row.id}
                  data-wf={row.id}
                  className="grid grid-cols-12 gap-4"
                  style={{ padding: "8px 0", borderBottom: "1px solid " + ink }}
                >
                  <dt className="col-span-4 sm:col-span-3" style={label}>
                    {row.k}
                  </dt>
                  <dd className="col-span-8 sm:col-span-9" style={{ margin: 0, fontSize: 16 }}>
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="grid grid-cols-12 gap-4" style={{ marginBottom: 8 }}>
          <div className="col-span-12 sm:col-span-6 lg:col-span-4">
            <button
              type="button"
              data-wf="b-2-0"
              className="wd-like inline-flex items-center gap-2 w-full justify-center"
              aria-pressed={isLiked}
              disabled={busy}
              onClick={toggleLike}
              style={{
                border: rule,
                borderRadius: brand.radius,
                background: isLiked ? "#ffffff" : ink,
                color: isLiked ? ink : "#ffffff",
                minHeight: 44,
                padding: "8px 16px",
                fontWeight: 700,
                fontSize: 14,
                cursor: busy ? "progress" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              <Heart filled={isLiked} />
              {isLiked ? "Liked · Unlike" : "Like"}
            </button>
          </div>
          <div
            className="col-span-12 sm:col-span-6 lg:col-span-8 flex items-center"
            style={{ color: failed ? accent : muted, fontSize: 13 }}
          >
            <span role="status" aria-live="polite">
              {note || (isLiked ? "You have liked this movie." : "You have not liked this movie.")}
            </span>
          </div>
        </div>

        <div data-wf="b-3-0" style={{ margin: "24px 0", paddingTop: 16, borderTop: rule }}>
          <h2 style={{ ...label, margin: "0 0 8px" }}>Plot</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: "68ch", margin: 0 }}>{movie.plot}</p>
        </div>

        <section
          data-wf="b-4-0"
          aria-labelledby="similar-h"
          style={{ borderTop: rule, paddingTop: 16 }}
        >
          <div
            className="flex flex-wrap items-baseline justify-between gap-2"
            style={{ marginBottom: 16 }}
          >
            <h2
              id="similar-h"
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}
            >
              Similar movies
            </h2>
            <p style={{ ...label, margin: 0 }}>Ranked by similarity · score 0–1</p>
          </div>
          {similar.length === 0 ? (
            <Empty
              title="No similar movies yet"
              description="The catalog needs at least one other movie before similarity can be ranked. An admin can upload more."
            />
          ) : (
            <ol
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
              style={{ listStyle: "none", margin: 0, padding: 0 }}
            >
              {similar.map((m, idx) => (
                <li key={m.id}>
                  <button
                    type="button"
                    data-wf={idx < 3 ? "i-4-0-" + idx : undefined}
                    className="wd-cell"
                    onClick={() => navigate("/movie-detail?movie=" + m.id)}
                    aria-label={
                      m.title +
                      " (" +
                      m.year +
                      "), rank " +
                      (idx + 1) +
                      ", similarity " +
                      m.score +
                      ". Open details"
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      border: rule,
                      borderRadius: brand.radius,
                      background: "#ffffff",
                      color: ink,
                      padding: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ border: "1px solid " + ink, marginBottom: 8 }}>
                      <Art movie={m} ink={ink} />
                    </div>
                    <div
                      className="flex items-baseline justify-between"
                      style={{ ...label, color: ink, marginBottom: 4 }}
                    >
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{m.score}</span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "#ffffff",
                        border: "1px solid " + ink,
                        marginBottom: 8,
                      }}
                      aria-hidden="true"
                    >
                      <div
                        style={{
                          height: "100%",
                          width: Math.round(Math.min(1, m.score) * 100) + "%",
                          background: ink,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.25,
                      }}
                    >
                      {m.title}
                    </div>
                    <div style={{ color: muted, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                      {m.year}
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
