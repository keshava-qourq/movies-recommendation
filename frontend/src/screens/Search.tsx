// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "react-router-dom";
import { apiFetch, getSessionToken } from "@/lib/api";
import { getUser } from "@/lib/auth";

const PAGE = 100;

const WF_IDS = { Heat: "i-2-0-0", "Heat Wave": "i-2-0-1", "Fever Pitch": "i-2-0-2" };

function hashTitle(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initials(title) {
  const words = title
    .replace(/^The\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return words
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Deterministic artwork: same title -> same image on every page and visit.
function Artwork({ title, brand }) {
  let seed = hashTitle(title);
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cells = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 3; c++) {
      const v = next();
      if (v > 0.45) {
        const fill = v > 0.82 ? brand.neutralColor : brand.primaryColor;
        cells.push({ r, c, fill });
        if (c < 2) cells.push({ r, c: 5 - c, fill });
        else cells.push({ r, c: 3, fill });
      }
    }
  }
  const uniq = new Map();
  cells.forEach((k) => uniq.set(k.r + "-" + k.c, k));
  return (
    <svg
      viewBox="0 0 60 90"
      width="100%"
      style={{ display: "block", aspectRatio: "2 / 3" }}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="60" height="90" fill={brand.backgroundColor} />
      {Array.from(uniq.values()).map((k) => (
        <rect
          key={k.r + "-" + k.c}
          x={k.c * 10}
          y={k.r * 10}
          width="10"
          height="10"
          fill={k.fill}
        />
      ))}
      <rect x="0" y="80" width="60" height="10" fill={brand.primaryColor} />
      <text
        x="4"
        y="87.5"
        fontSize="7"
        fontWeight="700"
        letterSpacing="1.5"
        fill={brand.backgroundColor}
        fontFamily={brand.fontHeading}
      >
        {initials(title)}
      </text>
    </svg>
  );
}

function Highlight({ text, query }) {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span
        style={{ textDecoration: "underline", textDecorationThickness: 2, textUnderlineOffset: 3 }}
      >
        {text.slice(i, i + q.length)}
      </span>
      {text.slice(i + q.length)}
    </>
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [activeQ, setActiveQ] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const req = React.useRef(0);
  const isAdmin = getUser()?.role === "admin";

  const load = React.useCallback((text, offset) => {
    if (!getSessionToken()) return;
    const id = ++req.current;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ q: text, limit: String(PAGE), offset: String(offset) });
    apiFetch("/movies?" + params.toString())
      .then((res) => {
        if (id !== req.current) return;
        setItems((prev) => (offset === 0 ? res.items : prev.concat(res.items)));
        setTotal(res.total);
        setActiveQ(text);
        setLoaded(true);
        setLoading(false);
      })
      .catch(() => {
        if (id !== req.current) return;
        setError("Could not load movies. Check your connection and try again.");
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    load("", 0);
    return () => {
      req.current++;
    };
  }, [load]);

  const q = activeQ.trim();
  const showEmpty = loaded && !error && !loading && total === 0;

  const rule = "2px solid " + brand.primaryColor;
  const label = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: brand.neutralColor,
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    load(query.trim(), 0);
  };

  const css = `
    .wn-tile{background:${brand.backgroundColor};color:${brand.primaryColor};border:${rule};border-radius:${brand.radius};text-align:left;cursor:pointer;display:block;width:100%;padding:0;font-family:${brand.fontBody};transition:background-color .12s linear,color .12s linear;animation:wn-in .18s ease-out both}
    .wn-tile:hover{background:${brand.primaryColor};color:${brand.backgroundColor}}
    .wn-tile:hover .wn-sub{color:${brand.backgroundColor}}
    .wn-tile:focus-visible,.wn-field:focus-visible,.wn-link:focus-visible{outline:3px solid ${brand.accentColor};outline-offset:2px}
    .wn-tile:active{opacity:.85}
    .wn-field::placeholder{color:${brand.neutralColor};opacity:1}
    .wn-link{background:none;border:0;padding:0;color:${brand.primaryColor};text-decoration:underline;text-underline-offset:3px;font-weight:700;cursor:pointer;font-family:inherit;font-size:inherit}
    .wn-link:hover{text-decoration-thickness:2px}
    .wn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
    @keyframes wn-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){.wn-tile{animation:none;transition:none}}
  `;

  return (
    <div
      style={{
        fontFamily: brand.fontBody,
        color: brand.primaryColor,
        backgroundColor: brand.backgroundColor,
        fontVariantNumeric: "tabular-nums",
        padding: "24px 24px 48px",
        maxWidth: 1200,
      }}
    >
      <style>{css}</style>

      <header data-wf="b-0-0" style={{ borderBottom: rule, paddingBottom: 16 }}>
        <div style={label}>Catalog{loaded && !q ? " · " + total + " movies" : ""}</div>
        <h1
          style={{
            fontSize: 36,
            lineHeight: 1.1,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "8px 0 0",
          }}
        >
          Search movies
        </h1>
      </header>

      <form
        data-wf="b-1-0"
        role="search"
        onSubmit={onSubmit}
        style={{ display: "flex", gap: 8, alignItems: "stretch", marginTop: 24, flexWrap: "wrap" }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <UI.Label htmlFor="movie-search" style={{ ...label, display: "block", marginBottom: 8 }}>
            Title
          </UI.Label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            >
              <Icons.Search width={16} height={16} />
            </span>
            <UI.Input
              id="movie-search"
              name="q"
              type="search"
              autoComplete="off"
              className="wn-field"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSubmitted(false);
              }}
              placeholder="Search by title, e.g. Heat"
              style={{
                width: "100%",
                height: 44,
                paddingLeft: 36,
                paddingRight: 12,
                border: rule,
                borderRadius: brand.radius,
                backgroundColor: brand.backgroundColor,
                color: brand.primaryColor,
                fontSize: 15,
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <UI.Button
            type="submit"
            style={{
              height: 44,
              padding: "0 24px",
              backgroundColor: brand.primaryColor,
              color: brand.backgroundColor,
              border: rule,
              borderRadius: brand.radius,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: 13,
            }}
          >
            Search
          </UI.Button>
        </div>
      </form>

      <section data-wf="b-2-0" aria-labelledby="results-heading" style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: rule,
            paddingBottom: 8,
            marginBottom: 16,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h2 id="results-heading" style={{ ...label, color: brand.primaryColor, margin: 0 }}>
            Results
          </h2>
          <p
            role="status"
            aria-live="polite"
            style={{ fontSize: 13, margin: 0, color: brand.neutralColor }}
          >
            {loading && !loaded
              ? "Loading movies…"
              : error
                ? ""
                : q
                  ? `${total} ${total === 1 ? "title contains" : "titles contain"} “${q}”`
                  : `Showing all ${total} titles, A–Z`}
            {submitted && total > 0 && !loading ? " · search applied" : ""}
          </p>
        </div>

        {items.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 16,
            }}
          >
            {items.map((m, idx) => (
              <li key={m.id} style={{ margin: 0 }}>
                <button
                  type="button"
                  className="wn-tile"
                  data-wf={WF_IDS[m.title]}
                  onClick={() => navigate("/movie-detail?movie=" + m.id)}
                  aria-label={`${m.title}, ${m.year}. Open movie details`}
                  style={{ animationDelay: Math.min(idx, 10) * 15 + "ms" }}
                >
                  <div style={{ borderBottom: rule }}>
                    <Artwork title={m.title} brand={brand} />
                  </div>
                  <div style={{ padding: "8px 8px 12px" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      <Highlight text={m.title} query={activeQ} />
                    </div>
                    <div
                      className="wn-sub"
                      style={{ fontSize: 13, marginTop: 4, color: brand.neutralColor }}
                    >
                      {m.year}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {loading ? <p role="status">Loading…</p> : null}
        {error ? (
          <p role="alert" style={{ fontWeight: 600, color: brand.accentColor }}>
            {error}
          </p>
        ) : null}
        {!loading && !error && items.length < total ? (
          <div style={{ marginTop: 16 }}>
            <UI.Button
              type="button"
              onClick={() => load(activeQ, items.length)}
              style={{
                height: 44,
                padding: "0 16px",
                backgroundColor: brand.primaryColor,
                color: brand.backgroundColor,
                border: rule,
                borderRadius: brand.radius,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Load more
            </UI.Button>
          </div>
        ) : null}
      </section>

      {showEmpty && (
        <div
          data-wf="b-3-0"
          style={{ border: rule, borderRadius: brand.radius, padding: 24, marginTop: 8 }}
        >
          <UI.Empty
            title="No movies found"
            description={`Nothing in the catalog has “${activeQ.trim()}” in its title. Check the spelling or try a shorter part of the title.`}
            action={
              <UI.Button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSubmitted(false);
                  load("", 0);
                }}
                style={{
                  height: 44,
                  padding: "0 16px",
                  backgroundColor: brand.primaryColor,
                  color: brand.backgroundColor,
                  border: rule,
                  borderRadius: brand.radius,
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Clear search
              </UI.Button>
            }
          />
          {isAdmin ? (
            <p
              style={{
                fontSize: 13,
                color: brand.neutralColor,
                margin: "16px 0 0",
                textAlign: "center",
              }}
            >
              Missing a title? Admins can{" "}
              <button type="button" className="wn-link" onClick={() => navigate("/admin-upload")}>
                upload movies
              </button>
              .
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
