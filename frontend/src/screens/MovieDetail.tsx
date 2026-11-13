// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Empty } = UI;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Search } = Icons;

const CATALOG = [
  { id: 'heat', title: 'Heat', year: 1995, genres: ['Crime', 'Thriller'], director: 'Michael Mann', cast: ['Al Pacino', 'Robert De Niro', 'Val Kilmer'], plot: 'A veteran detective hunts a disciplined crew of thieves while both sides struggle to keep their personal lives intact.' },
  { id: 'collateral', title: 'Collateral', year: 2004, genres: ['Crime', 'Thriller'], director: 'Michael Mann', cast: ['Tom Cruise', 'Jamie Foxx', 'Jada Pinkett Smith'], plot: 'A cab driver spends one long night ferrying a contract killer between his targets across Los Angeles.' },
  { id: 'the-departed', title: 'The Departed', year: 2006, genres: ['Crime', 'Drama', 'Thriller'], director: 'Martin Scorsese', cast: ['Leonardo DiCaprio', 'Matt Damon', 'Jack Nicholson'], plot: 'An undercover officer and a mole inside the police each race to unmask the other in the Boston underworld.' },
  { id: 'sicario', title: 'Sicario', year: 2015, genres: ['Crime', 'Thriller', 'Action'], director: 'Denis Villeneuve', cast: ['Emily Blunt', 'Benicio del Toro', 'Josh Brolin'], plot: 'An idealistic federal agent joins a task force that crosses the border to pursue a violent drug cartel.' },
  { id: 'se7en', title: 'Se7en', year: 1995, genres: ['Crime', 'Mystery', 'Thriller'], director: 'David Fincher', cast: ['Brad Pitt', 'Morgan Freeman', 'Kevin Spacey'], plot: 'Two detectives, one close to retirement and one new to the city, track a killer whose crimes follow a deliberate pattern.' },
  { id: 'the-dark-knight', title: 'The Dark Knight', year: 2008, genres: ['Action', 'Crime', 'Drama'], director: 'Christopher Nolan', cast: ['Christian Bale', 'Heath Ledger', 'Gary Oldman'], plot: 'A masked vigilante and a police lieutenant face a criminal who wants to push their city into chaos.' },
  { id: 'goodfellas', title: 'Goodfellas', year: 1990, genres: ['Crime', 'Drama'], director: 'Martin Scorsese', cast: ['Ray Liotta', 'Robert De Niro', 'Joe Pesci'], plot: 'A young man rises through a neighborhood crew and slowly sees the cost of the life he chose.' },
  { id: 'casino', title: 'Casino', year: 1995, genres: ['Crime', 'Drama'], director: 'Martin Scorsese', cast: ['Robert De Niro', 'Sharon Stone', 'Joe Pesci'], plot: 'A gambling expert is sent to run a Las Vegas casino, and old loyalties and new rivalries pull his empire apart.' },
  { id: 'the-godfather', title: 'The Godfather', year: 1972, genres: ['Crime', 'Drama'], director: 'Francis Ford Coppola', cast: ['Marlon Brando', 'Al Pacino', 'James Caan'], plot: 'The aging head of a crime family hands control to his reluctant youngest son after an attempt on his life.' },
  { id: 'inception', title: 'Inception', year: 2010, genres: ['Action', 'Sci-Fi', 'Thriller'], director: 'Christopher Nolan', cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'], plot: 'A thief who steals secrets from sleeping minds is offered one last job: planting an idea instead of taking one.' },
  { id: 'prisoners', title: 'Prisoners', year: 2013, genres: ['Crime', 'Drama', 'Thriller'], director: 'Denis Villeneuve', cast: ['Hugh Jackman', 'Jake Gyllenhaal', 'Viola Davis'], plot: 'When two children vanish, a desperate father and a methodical detective pursue very different ideas of justice.' },
  { id: 'arrival', title: 'Arrival', year: 2016, genres: ['Drama', 'Sci-Fi'], director: 'Denis Villeneuve', cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker'], plot: 'A linguist is recruited to find a way to communicate with visitors whose ships have settled across the globe.' },
  { id: 'training-day', title: 'Training Day', year: 2001, genres: ['Crime', 'Drama', 'Thriller'], director: 'Antoine Fuqua', cast: ['Denzel Washington', 'Ethan Hawke'], plot: 'A rookie narcotics officer spends one long day under a veteran partner whose methods blur the line he swore to hold.' },
  { id: 'zodiac', title: 'Zodiac', year: 2007, genres: ['Crime', 'Mystery', 'Thriller'], director: 'David Fincher', cast: ['Jake Gyllenhaal', 'Mark Ruffalo', 'Robert Downey Jr.'], plot: 'A cartoonist, a reporter and an inspector spend years chasing an unseen killer who mails taunting letters to newspapers.' },
  { id: 'mystic-river', title: 'Mystic River', year: 2003, genres: ['Crime', 'Drama', 'Mystery'], director: 'Clint Eastwood', cast: ['Sean Penn', 'Tim Robbins', 'Kevin Bacon'], plot: 'A murder reunites three childhood friends whose lives were split apart by one afternoon long ago.' },
  { id: 'the-prestige', title: 'The Prestige', year: 2006, genres: ['Drama', 'Mystery', 'Sci-Fi'], director: 'Christopher Nolan', cast: ['Christian Bale', 'Hugh Jackman', 'Michael Caine'], plot: 'Two rival stage magicians sabotage each other in pursuit of the perfect illusion, whatever it costs them.' },
];

const SIMILAR_LIMIT = 10;
const STOP = new Set(['with', 'that', 'while', 'their', 'from', 'into', 'whose', 'when', 'over', 'each', 'other', 'both', 'than', 'then', 'they', 'them', 'have', 'been', 'this', 'what', 'where', 'which', 'after', 'about', 'only', 'very', 'long', 'ones', 'one', 'two']);
const FIELD_WEIGHT = { p: 1, g: 2, d: 2, c: 1.5 };

// In-house TF-IDF over plot, genres, director and cast, plus cosine similarity.
const SIMILAR = (function () {
  const docs = CATALOG.map((m) => {
    const tf = {};
    const add = (term, w) => { tf[term] = (tf[term] || 0) + w; };
    (m.plot || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).forEach((w) => {
      if (w.length > 3 && !STOP.has(w)) add('p:' + w.replace(/s$/, ''), FIELD_WEIGHT.p);
    });
    (m.genres || []).forEach((g) => add('g:' + g.toLowerCase(), FIELD_WEIGHT.g));
    if (m.director) add('d:' + m.director.toLowerCase(), FIELD_WEIGHT.d);
    (m.cast || []).forEach((c) => add('c:' + c.toLowerCase(), FIELD_WEIGHT.c));
    return tf;
  });
  const df = {};
  docs.forEach((tf) => Object.keys(tf).forEach((t) => { df[t] = (df[t] || 0) + 1; }));
  const N = docs.length;
  const vecs = docs.map((tf) => {
    const v = {};
    let norm = 0;
    Object.keys(tf).forEach((t) => {
      const x = tf[t] * (Math.log((1 + N) / (1 + df[t])) + 1);
      v[t] = x;
      norm += x * x;
    });
    return { v, norm: Math.sqrt(norm) };
  });
  const out = {};
  CATALOG.forEach((m, i) => {
    const rows = [];
    CATALOG.forEach((o, j) => {
      if (i === j) return;
      let dot = 0;
      Object.keys(vecs[i].v).forEach((t) => { if (vecs[j].v[t]) dot += vecs[i].v[t] * vecs[j].v[t]; });
      const score = vecs[i].norm && vecs[j].norm ? dot / (vecs[i].norm * vecs[j].norm) : 0;
      rows.push({ id: o.id, score });
    });
    rows.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    out[m.id] = rows.slice(0, SIMILAR_LIMIT);
  });
  return out;
})();

const BY_ID = {};
CATALOG.forEach((m) => { BY_ID[m.id] = m; });

function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Deterministic generated artwork: the same movie always draws the same mark.
function Art({ movie, ink }) {
  let seed = hashOf(movie.title + movie.year);
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      if (next() > 0.45) {
        cells.push([c, r]);
        if (c < 2) cells.push([4 - c, r]);
      }
    }
  }
  const initials = movie.title.replace(/^The\s+/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <svg viewBox="0 0 100 132" role="img" aria-label={'Generated artwork for ' + movie.title} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <rect x="0" y="0" width="100" height="132" fill="#ffffff" />
      {cells.map((p, i) => (<rect key={i} x={p[0] * 20} y={p[1] * 20} width="20" height="20" fill={ink} />))}
      <rect x="0" y="100" width="100" height="32" fill={ink} />
      <text x="8" y="123" fill="#ffffff" fontSize="20" fontWeight="700" letterSpacing="-0.5" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif">{initials}</text>
      <text x="92" y="123" fill="#ffffff" fontSize="11" textAnchor="end" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{movie.year}</text>
    </svg>
  );
}

function Heart({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
      <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.4 5c2.1 0 3.9 1.2 5.6 3.2C13.7 6.200 15.500 5 17.600 5 21 5 22.800 8.600 21.500 11.800 19.500 16.400 12 21 12 21z" />
    </svg>
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const ink = brand.primaryColor;
  const muted = brand.neutralColor;
  const accent = brand.accentColor;
  const rule = '2px solid ' + ink;

  const initial = (function () {
    try {
      const q = new URLSearchParams(window.location.search).get('movie');
      return q || 'heat';
    } catch (e) { return 'heat'; }
  })();

  const [movieId, setMovieId] = React.useState(initial);
  const [liked, setLiked] = React.useState(['goodfellas', 'the-godfather']);
  const [note, setNote] = React.useState('');
  const headingRef = React.useRef(null);
  const first = React.useRef(true);

  const movie = BY_ID[movieId];
  const isLiked = movie ? liked.indexOf(movie.id) !== -1 : false;
  const similar = movie ? SIMILAR[movie.id] : [];

  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (headingRef.current) headingRef.current.focus();
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }, [movieId]);

  const toggleLike = () => {
    if (!movie) return;
    if (isLiked) {
      setLiked(liked.filter((x) => x !== movie.id));
      setNote('Removed from your likes. Your For you list will update.');
    } else {
      setLiked(liked.concat(movie.id));
      setNote('Saved to your likes. Your For you list will update.');
    }
  };

  const open = (id) => { setNote(''); setMovieId(id); };

  const label = { fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: muted, fontWeight: 600 };

  return (
    <div className="wd" style={{ fontFamily: brand.fontBody, color: ink, backgroundColor: brand.backgroundColor, padding: 24, fontSize: 14, lineHeight: 1.5 }}>
      <style>{`
        .wd button { font-family: inherit; cursor: pointer; }
        .wd button:focus-visible, .wd a:focus-visible, .wd h1:focus-visible { outline: 2px solid ${ink}; outline-offset: 2px; }
        .wd .wd-fade { animation: wdfade 200ms ease-out; }
        .wd .wd-back:hover { background: ${ink}; color: #ffffff; }
        .wd .wd-like:hover { background: ${isLiked ? '#ffffff' : '#2b2b2b'}; color: ${isLiked ? ink : '#ffffff'}; }
        .wd .wd-cell { transition: background-color 120ms ease; }
        .wd .wd-cell:hover { background: #f2f2f2; }
        .wd .wd-cell:active { background: #e6e6e6; }
        .wd .wd-like:active, .wd .wd-back:active { transform: translateY(1px); }
        @keyframes wdfade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .wd .wd-fade { animation: none; } .wd * { transition: none !important; } }
      `}</style>

      <div className="grid grid-cols-12 gap-4" style={{ marginBottom: 24 }}>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <button
            type="button"
            data-wf="b-0-0"
            className="wd-back inline-flex items-center gap-2 w-full justify-center"
            onClick={() => navigate('search')}
            style={{ border: rule, borderRadius: brand.radius, background: '#ffffff', color: ink, minHeight: 40, padding: '8px 16px', fontWeight: 600, fontSize: 14 }}
          >
            <Icons.ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to search
          </button>
        </div>
      </div>

      {!movie ? (
        <div data-wf="b-5-0" className="wd-fade" style={{ border: rule, borderRadius: brand.radius, padding: 32 }}>
          <p style={label}>404 · movie-detail</p>
          <Empty
            title="Movie not found"
            description={'Nothing in the catalog matches "' + movieId + '". It may have been mistyped, or it is not in this catalog. Search by title to find it.'}
            action={
              <button type="button" onClick={() => navigate('search')} style={{ border: rule, borderRadius: brand.radius, background: ink, color: '#ffffff', minHeight: 40, padding: '8px 16px', fontWeight: 600 }}>
                Search movies
              </button>
            }
          />
        </div>
      ) : (
        <div key={movie.id} className="wd-fade">
          <div className="grid grid-cols-12 gap-6" style={{ marginBottom: 24 }}>
            <div data-wf="b-1-0" className="col-span-12 sm:col-span-5 lg:col-span-4" style={{ alignSelf: 'start' }}>
              <div style={{ border: rule, borderRadius: brand.radius, maxWidth: 320 }}>
                <Art movie={movie} ink={ink} />
              </div>
              <p style={{ ...label, marginTop: 8 }}>Generated artwork · no poster</p>
            </div>

            <section data-wf="b-1-1" aria-labelledby="movie-title" className="col-span-12 sm:col-span-7 lg:col-span-8">
              <p style={label}>Movie · Record {String(CATALOG.indexOf(movie) + 1).padStart(3, '0')}</p>
              <h1 id="movie-title" ref={headingRef} tabIndex={-1} style={{ fontFamily: brand.fontHeading, fontSize: 40, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.03em', margin: '4px 0 16px', outline: 'none' }}>
                {movie.title} <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 400 }}>({movie.year})</span>
              </h1>
              <dl style={{ borderTop: rule, margin: 0 }}>
                {[
                  { id: 'i-1-1-0', k: 'Genres', v: movie.genres.join(', ') },
                  { id: 'i-1-1-1', k: 'Director', v: movie.director },
                  { id: 'i-1-1-2', k: 'Cast', v: movie.cast.join(', ') },
                ].map((row) => (
                  <div key={row.id} data-wf={row.id} className="grid grid-cols-12 gap-4" style={{ padding: '8px 0', borderBottom: '1px solid ' + ink }}>
                    <dt className="col-span-4 sm:col-span-3" style={label}>{row.k}</dt>
                    <dd className="col-span-8 sm:col-span-9" style={{ margin: 0, fontSize: 16 }}>{row.v}</dd>
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
                onClick={toggleLike}
                style={{ border: rule, borderRadius: brand.radius, background: isLiked ? '#ffffff' : ink, color: isLiked ? ink : '#ffffff', minHeight: 44, padding: '8px 16px', fontWeight: 700, fontSize: 14, transition: 'background-color 120ms ease, color 120ms ease' }}
              >
                <Heart filled={isLiked} />
                {isLiked ? 'Liked · Unlike' : 'Like'}
              </button>
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-8 flex items-center" style={{ color: muted, fontSize: 13 }}>
              <span role="status" aria-live="polite">
                {note || ('You have liked ' + liked.length + ' movie' + (liked.length === 1 ? '' : 's') + '.')}
              </span>
            </div>
          </div>

          <div data-wf="b-3-0" style={{ margin: '24px 0', paddingTop: 16, borderTop: rule }}>
            <h2 style={{ ...label, margin: '0 0 8px' }}>Plot</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: '68ch', margin: 0 }}>{movie.plot}</p>
          </div>

          <section data-wf="b-4-0" aria-labelledby="similar-h" style={{ borderTop: rule, paddingTop: 16 }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2" style={{ marginBottom: 16 }}>
              <h2 id="similar-h" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Similar movies</h2>
              <p style={{ ...label, margin: 0 }}>Ranked by cosine similarity · top {SIMILAR_LIMIT} · score 0–1</p>
            </div>
            {similar.length === 0 ? (
              <Empty title="No similar movies yet" description="The catalog needs at least one other movie before similarity can be ranked. An admin can upload more." />
            ) : (
              <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {similar.map((s, idx) => {
                  const m = BY_ID[s.id];
                  const itemId = idx < 3 ? 'i-4-0-' + idx : undefined;
                  const likedIt = liked.indexOf(m.id) !== -1;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        data-wf={itemId}
                        className="wd-cell"
                        onClick={() => open(m.id)}
                        aria-label={m.title + ' (' + m.year + '), rank ' + (idx + 1) + ', similarity ' + s.score.toFixed(3) + (likedIt ? ', liked' : '') + '. Open details'}
                        style={{ display: 'block', width: '100%', textAlign: 'left', border: rule, borderRadius: brand.radius, background: '#ffffff', color: ink, padding: 8 }}
                      >
                        <div style={{ border: '1px solid ' + ink, marginBottom: 8 }}>
                          <Art movie={m} ink={ink} />
                        </div>
                        <div className="flex items-baseline justify-between" style={{ ...label, color: ink, marginBottom: 4 }}>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>#{String(idx + 1).padStart(2, '0')}</span>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.score.toFixed(3)}</span>
                        </div>
                        <div style={{ height: 4, background: '#ffffff', border: '1px solid ' + ink, marginBottom: 8 }} aria-hidden="true">
                          <div style={{ height: '100%', width: Math.round(Math.min(1, s.score) * 100) + '%', background: ink }} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{m.title}</div>
                        <div className="flex items-center justify-between" style={{ color: muted, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          <span>{m.year} · {m.genres[0]}</span>
                          {likedIt && <span style={{ color: ink, fontWeight: 600 }}>Liked</span>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
