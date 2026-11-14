// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

const { Search } = Icons;

// Wireframe item ids, tied to the movie they name (not to the grid position).
const WF_ITEM = { 1: "i-2-0-0", 2: "i-2-0-1", 3: "i-2-0-2", 4: "i-2-0-3" };

const hashOf = (s) => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return h;
};

function Artwork({ title, year, height, brand }) {
  const h = hashOf(title + year);
  const kind = h % 4;
  const ink = brand.backgroundColor;
  const bg = brand.primaryColor;
  const shift = (h % 7) * 9;
  const shapes = [];
  if (kind === 0) {
    for (let i = 0; i < 9; i++)
      shapes.push(
        <rect key={i} x={i * 16 + (shift % 8)} y="0" width={(i % 3) + 2} height="100" fill={ink} />,
      );
  } else if (kind === 1) {
    for (let i = 1; i <= 5; i++)
      shapes.push(
        <circle
          key={i}
          cx={40 + shift}
          cy="50"
          r={i * 11}
          fill="none"
          stroke={ink}
          strokeWidth="2"
        />,
      );
  } else if (kind === 2) {
    for (let i = 0; i < 8; i++)
      shapes.push(
        <line
          key={i}
          x1={i * 22 - 20 + shift}
          y1="100"
          x2={i * 22 + 40 + shift}
          y2="0"
          stroke={ink}
          strokeWidth="2"
        />,
      );
  } else {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 9; c++)
        if ((h >> ((r * 3 + c) % 14)) % 2 === 0)
          shapes.push(
            <rect
              key={r + "-" + c}
              x={c * 16 + 6}
              y={r * 20 + 8}
              width="10"
              height="10"
              fill={ink}
            />,
          );
  }
  const initials = title
    .replace(/^The /, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 144 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: "block", width: "100%", height, backgroundColor: bg }}
    >
      {shapes}
      <rect x="0" y="72" width="144" height="28" fill={bg} />
      <text
        x="8"
        y="94"
        fill={ink}
        fontSize="20"
        fontWeight="700"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
        letterSpacing="-0.5"
      >
        {initials}
      </text>
      <text
        x="136"
        y="94"
        fill={ink}
        fontSize="11"
        textAnchor="end"
        fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
      >
        {year}
      </text>
    </svg>
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const [state, setState] = React.useState("loading");
  const [recs, setRecs] = React.useState([]);
  const [hasLikes, setHasLikes] = React.useState(false);
  const [liked, setLiked] = React.useState([]);
  const [notice, setNotice] = React.useState(null);
  const [failed, setFailed] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const live = React.useRef(true);

  const P = brand.primaryColor;
  const N = brand.neutralColor;
  const rule = "2px solid " + P;
  const label = {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: N,
  };

  const reload = async () => {
    const fy = await apiFetch("/me/for-you");
    const lk = await apiFetch("/me/likes");
    if (!live.current) return;
    setRecs(fy.items);
    setHasLikes(fy.has_likes);
    setLiked(lk.items);
    setState("ready");
  };

  React.useEffect(() => {
    live.current = true;
    setState("loading");
    reload().catch(() => live.current && setState("error"));
    return () => {
      live.current = false;
    };
  }, []);

  const change = async (m, add) => {
    if (busy) return;
    setBusy(true);
    setFailed("");
    try {
      await apiFetch("/movies/" + m.id + "/like", { method: add ? "PUT" : "DELETE" });
      await reload();
      setNotice({
        text: add
          ? "Liked " + m.title + ". It leaves this list and your picks are re-ranked."
          : "Removed " + m.title + " from your likes. Recommendations updated.",
      });
    } catch (e) {
      setFailed("Could not update your like. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const like = (m) => change(m, true);
  const unlike = (m) => change(m, false);

  const btn = {
    fontFamily: brand.fontBody,
    fontSize: 13,
    fontWeight: 600,
    minHeight: 40,
    padding: "0 16px",
    borderRadius: brand.radius,
    border: rule,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };
  const btnSolid = { ...btn, backgroundColor: P, color: brand.backgroundColor };
  const btnOutline = { ...btn, backgroundColor: brand.backgroundColor, color: P };

  const searchButton = (solid) => (
    <div className="grid grid-cols-12 mt-6">
      <button
        type="button"
        data-wf="b-4-0"
        className="wn-btn col-span-12 sm:col-span-4"
        style={solid ? btnSolid : btnOutline}
        onClick={() => navigate("/search")}
      >
        <Icons.Search aria-hidden="true" className="w-4 h-4" />
        Search movies
      </button>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: brand.fontBody,
        color: P,
        backgroundColor: brand.backgroundColor,
        fontVariantNumeric: "tabular-nums",
      }}
      className="w-full px-4 py-6 sm:px-8"
    >
      <style>{`
        .wn-btn:hover, .wn-title:hover { text-decoration: underline; }
        .wn-btn:focus-visible, .wn-title:focus-visible, .wn-chip:focus-visible, .wn-link:focus-visible { outline: 2px solid ${P}; outline-offset: 3px; }
        .wn-btn:active { opacity: .85; }
        .wn-card { animation: wn-in .25s ease-out; }
        @keyframes wn-in { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .wn-card { animation: none; } }
      `}</style>

      <div
        className="grid grid-cols-12 items-end gap-4"
        style={{ borderBottom: rule, paddingBottom: 16 }}
      >
        <div data-wf="b-0-0" className="col-span-8">
          <h1
            style={{
              fontSize: 36,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              margin: 0,
            }}
          >
            For you
          </h1>
        </div>
      </div>

      <p
        data-wf="b-1-0"
        style={{ fontSize: 14, lineHeight: 1.5, margin: "16px 0 24px", color: N, maxWidth: 640 }}
      >
        Movies picked from everything you have liked, highest match first.
      </p>

      <div role="status" aria-live="polite" style={{ minHeight: notice ? undefined : 0 }}>
        {failed && (
          <p role="alert" style={{ fontWeight: 600, color: brand.accentColor, margin: "0 0 12px" }}>
            {failed}
          </p>
        )}
        {notice && !failed && (
          <div
            className="wn-card flex flex-wrap items-center justify-between gap-3 mb-4"
            style={{ border: rule, padding: "8px 12px", borderRadius: brand.radius, fontSize: 13 }}
          >
            <span className="flex items-center gap-2">
              <Icons.CheckCircle aria-hidden="true" className="w-4 h-4" />
              {notice.text}
            </span>
          </div>
        )}
      </div>

      {state === "loading" && <p role="status">Loading recommendations…</p>}
      {state === "error" && (
        <p role="alert" style={{ fontWeight: 600, color: brand.accentColor }}>
          Could not load your recommendations. Check your connection and try again.
        </p>
      )}

      {state === "ready" && hasLikes && (
        <section data-wf="b-2-0" aria-labelledby="rec-h">
          <div
            className="flex items-baseline justify-between"
            style={{ borderBottom: rule, paddingBottom: 8, marginBottom: 16 }}
          >
            <h2 id="rec-h" style={{ ...label, color: P, fontSize: 12, margin: 0 }}>
              Recommended movies
            </h2>
            <span style={{ ...label }}>
              {recs.length} ranked · based on {liked.length} {liked.length === 1 ? "like" : "likes"}
            </span>
          </div>

          {recs.length === 0 ? (
            <div style={{ border: rule, padding: 24, borderRadius: brand.radius }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
                You have liked everything we have.
              </p>
              <p style={{ fontSize: 14, color: N, margin: "4px 0 0" }}>
                Nothing is left to recommend. An admin can add more movies by CSV upload.
              </p>
            </div>
          ) : (
            <ol
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
            >
              {recs.map((r, i) => (
                <li
                  key={r.id}
                  className="wn-card flex flex-col"
                  style={{ border: rule, borderRadius: brand.radius }}
                >
                  <Artwork title={r.title} year={r.year} height={96} brand={brand} />
                  <div className="flex flex-col flex-1" style={{ padding: 12, borderTop: rule }}>
                    <div className="flex justify-between" style={label}>
                      <span>No. {String(i + 1).padStart(2, "0")}</span>
                      <span>Match {r.score.toFixed(3)}</span>
                    </div>
                    <button
                      type="button"
                      data-wf={WF_ITEM[r.id]}
                      className="wn-title"
                      onClick={() => navigate("/movie-detail?movie=" + r.id)}
                      aria-label={"Open " + r.title + " (" + r.year + ")"}
                      style={{
                        textAlign: "left",
                        background: "none",
                        border: 0,
                        padding: 0,
                        margin: "8px 0 2px",
                        cursor: "pointer",
                        color: P,
                        fontFamily: brand.fontHeading,
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.2,
                      }}
                    >
                      {r.title}{" "}
                      <span style={{ fontWeight: 400, color: N, fontSize: 14 }}>({r.year})</span>
                    </button>
                    <p style={{ fontSize: 12, color: N, margin: "0 0 12px" }}>
                      {r.genres.join(" · ")} · {r.director}
                    </p>
                    <button
                      type="button"
                      className="wn-btn mt-auto"
                      aria-pressed="false"
                      aria-label={"Like " + r.title}
                      onClick={() => like(r)}
                      style={{ ...btnOutline, width: "100%", minHeight: 36 }}
                    >
                      <Icons.Plus aria-hidden="true" className="w-4 h-4" /> Like
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div style={{ marginTop: 32, borderTop: rule, paddingTop: 12 }}>
            <h3 style={{ ...label, color: P, margin: "0 0 8px" }}>Your likes ({liked.length})</h3>
            <ul
              className="flex flex-wrap gap-2"
              style={{ listStyle: "none", padding: 0, margin: 0 }}
            >
              {liked.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className="wn-chip"
                    aria-pressed="true"
                    aria-label={"Unlike " + m.title + " (" + m.year + ")"}
                    onClick={() => unlike(m)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minHeight: 32,
                      padding: "0 8px 0 12px",
                      border: rule,
                      borderRadius: brand.radius,
                      backgroundColor: P,
                      color: brand.backgroundColor,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: brand.fontBody,
                    }}
                  >
                    <Icons.Check aria-hidden="true" className="w-4 h-4" />
                    {m.title} <span style={{ fontWeight: 400 }}>{m.year}</span>
                    <Icons.X aria-hidden="true" className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {state === "ready" && !hasLikes && (
        <section
          data-wf="b-3-0"
          aria-labelledby="empty-h"
          style={{ border: rule, borderRadius: brand.radius }}
        >
          <div className="grid grid-cols-3" aria-hidden="true" style={{ borderBottom: rule }}>
            {["Heat", "Casino", "Arrival"].map((t, i) => (
              <div key={t} style={{ borderLeft: i ? rule : 0, opacity: 1 }}>
                <svg
                  viewBox="0 0 144 60"
                  preserveAspectRatio="xMidYMid slice"
                  style={{ display: "block", width: "100%", height: 64 }}
                >
                  <rect width="144" height="60" fill={brand.backgroundColor} />
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                    <line
                      key={k}
                      x1={k * 20 - 10}
                      y1="60"
                      x2={k * 20 + 20}
                      y2="0"
                      stroke={P}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  ))}
                </svg>
              </div>
            ))}
          </div>
          <div style={{ padding: 24 }}>
            <h2
              id="empty-h"
              style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}
            >
              No likes yet, so nothing to rank.
            </h2>
            <p
              style={{ fontSize: 14, lineHeight: 1.5, color: N, margin: "8px 0 0", maxWidth: 560 }}
            >
              Like a few movies to get recommendations. Search for a movie you enjoyed.
            </p>
          </div>
        </section>
      )}

      {state === "ready" && searchButton(!hasLikes)}
    </div>
  );
}
