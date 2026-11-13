// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Search } = Icons;

const CATALOG = [
  { id: 1, title: 'Heat', year: 1995, genres: ['Crime', 'Thriller'], director: 'Michael Mann', cast: ['Al Pacino', 'Robert De Niro', 'Val Kilmer'], plot: 'A meticulous crew leader plans one last bank score while an obsessive detective closes in on him across Los Angeles.' },
  { id: 2, title: 'Collateral', year: 2004, genres: ['Crime', 'Thriller'], director: 'Michael Mann', cast: ['Tom Cruise', 'Jamie Foxx'], plot: 'A cab driver spends one long night ferrying a calm contract killer between his targets across Los Angeles.' },
  { id: 3, title: 'The Departed', year: 2006, genres: ['Crime', 'Thriller', 'Drama'], director: 'Martin Scorsese', cast: ['Leonardo DiCaprio', 'Matt Damon', 'Jack Nicholson'], plot: 'An undercover cop and a mob informant inside the police each race to expose the other in Boston.' },
  { id: 4, title: 'Inception', year: 2010, genres: ['Sci-Fi', 'Thriller', 'Action'], director: 'Christopher Nolan', cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Tom Hardy'], plot: 'A thief who steals secrets from inside dreams is offered a chance to plant an idea instead.' },
  { id: 5, title: 'The Dark Knight', year: 2008, genres: ['Action', 'Crime', 'Drama'], director: 'Christopher Nolan', cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'], plot: 'A masked vigilante faces an anarchic criminal who pushes the city to turn on itself.' },
  { id: 6, title: 'Goodfellas', year: 1990, genres: ['Crime', 'Drama'], director: 'Martin Scorsese', cast: ['Ray Liotta', 'Robert De Niro', 'Joe Pesci'], plot: 'A young man rises through a neighbourhood crew, enjoying the money until loyalty and paranoia collide.' },
  { id: 7, title: 'Casino', year: 1995, genres: ['Crime', 'Drama'], director: 'Martin Scorsese', cast: ['Robert De Niro', 'Sharon Stone', 'Joe Pesci'], plot: 'A gambling expert runs a Las Vegas casino for the mob while his marriage and his violent friend unravel the operation.' },
  { id: 8, title: 'Se7en', year: 1995, genres: ['Crime', 'Thriller', 'Mystery'], director: 'David Fincher', cast: ['Brad Pitt', 'Morgan Freeman'], plot: 'Two detectives, one weary and one eager, hunt a killer whose crimes follow a grim pattern.' },
  { id: 9, title: 'The Prestige', year: 2006, genres: ['Drama', 'Mystery', 'Sci-Fi'], director: 'Christopher Nolan', cast: ['Christian Bale', 'Hugh Jackman', 'Michael Caine'], plot: 'Two rival stage magicians destroy their lives chasing the perfect trick and each other\'s secrets.' },
  { id: 10, title: 'Interstellar', year: 2014, genres: ['Sci-Fi', 'Drama'], director: 'Christopher Nolan', cast: ['Matthew McConaughey', 'Anne Hathaway', 'Michael Caine'], plot: 'A former pilot leaves his family to cross a wormhole in search of a new home for a failing Earth.' },
  { id: 11, title: 'The Matrix', year: 1999, genres: ['Sci-Fi', 'Action'], director: 'The Wachowskis', cast: ['Keanu Reeves', 'Laurence Fishburne'], plot: 'A hacker learns that his everyday world is a simulation and joins a small rebellion against its machine rulers.' },
  { id: 12, title: 'Pulp Fiction', year: 1994, genres: ['Crime', 'Drama'], director: 'Quentin Tarantino', cast: ['John Travolta', 'Samuel L. Jackson', 'Uma Thurman'], plot: 'Hitmen, a boxer and a gangster\'s wife cross paths in interlocking stories told out of order.' },
  { id: 13, title: 'The Godfather', year: 1972, genres: ['Crime', 'Drama'], director: 'Francis Ford Coppola', cast: ['Marlon Brando', 'Al Pacino', 'James Caan'], plot: 'The reluctant youngest son of a crime dynasty is pulled into the family business after an attack on his father.' },
  { id: 14, title: 'Shutter Island', year: 2010, genres: ['Thriller', 'Mystery'], director: 'Martin Scorsese', cast: ['Leonardo DiCaprio', 'Mark Ruffalo', 'Ben Kingsley'], plot: 'A federal marshal investigates a vanished patient at an island asylum and starts to doubt what he sees.' },
  { id: 15, title: 'Gone Girl', year: 2014, genres: ['Thriller', 'Mystery'], director: 'David Fincher', cast: ['Ben Affleck', 'Rosamund Pike'], plot: 'On a couple\'s anniversary the wife disappears, and the husband becomes the prime suspect in the media glare.' },
  { id: 16, title: 'Ronin', year: 1998, genres: ['Action', 'Thriller'], director: 'John Frankenheimer', cast: ['Robert De Niro', 'Jean Reno'], plot: 'Mercenaries are hired in Paris to seize a mysterious case, and nobody on the team trusts anyone else.' },
  { id: 17, title: 'The Town', year: 2010, genres: ['Crime', 'Thriller', 'Drama'], director: 'Ben Affleck', cast: ['Ben Affleck', 'Jeremy Renner', 'Rebecca Hall'], plot: 'A bank robber from a Boston neighbourhood falls for a witness while a federal agent tightens the net on his crew.' },
  { id: 18, title: 'Fight Club', year: 1999, genres: ['Drama', 'Thriller'], director: 'David Fincher', cast: ['Brad Pitt', 'Edward Norton'], plot: 'A bored office worker and a charismatic soap salesman start an underground fighting club that spirals out of control.' },
  { id: 19, title: 'Arrival', year: 2016, genres: ['Sci-Fi', 'Drama'], director: 'Denis Villeneuve', cast: ['Amy Adams', 'Jeremy Renner'], plot: 'A linguist is recruited to decode the language of visitors whose ships hover over twelve places on Earth.' },
];

const STOP = new Set(['the', 'and', 'his', 'her', 'for', 'with', 'who', 'that', 'from', 'into', 'until', 'while', 'one', 'two', 'each', 'other', 'what', 'after', 'over', 'its', 'are', 'was', 'nobody', 'their', 'than', 'has', 'him', 'she', 'they', 'out', 'off']);
const tokens = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w));

// In-house TF-IDF over plot, genres, director and cast; cosine similarity on the normalised vectors.
const VECTORS = (() => {
  const docs = CATALOG.map((m) => {
    const t = {};
    tokens(m.plot).forEach((w) => { t[w] = (t[w] || 0) + 1; });
    m.genres.forEach((g) => { t['g:' + g.toLowerCase()] = 2; });
    t['d:' + m.director.toLowerCase()] = 3;
    m.cast.forEach((c) => { t['c:' + c.toLowerCase()] = 2; });
    return t;
  });
  const df = {};
  docs.forEach((d) => Object.keys(d).forEach((k) => { df[k] = (df[k] || 0) + 1; }));
  const N = docs.length;
  const out = {};
  docs.forEach((d, i) => {
    const v = {};
    let norm = 0;
    Object.keys(d).forEach((k) => {
      const w = d[k] * (Math.log((1 + N) / (1 + df[k])) + 1);
      v[k] = w;
      norm += w * w;
    });
    norm = Math.sqrt(norm) || 1;
    Object.keys(v).forEach((k) => { v[k] = v[k] / norm; });
    out[CATALOG[i].id] = v;
  });
  return out;
})();

const cosine = (a, b) => {
  let s = 0;
  Object.keys(a).forEach((k) => { if (b[k]) s += a[k] * b[k]; });
  return s;
};

const recommend = (likedIds) => {
  if (likedIds.length === 0) return [];
  return CATALOG.filter((m) => !likedIds.includes(m.id))
    .map((m) => {
      const total = likedIds.reduce((acc, id) => acc + cosine(VECTORS[m.id], VECTORS[id]), 0);
      return { movie: m, score: total / likedIds.length };
    })
    .sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title));
};

// Wireframe item ids, tied to the movie they name (not to the grid position).
const WF_ITEM = { 1: 'i-2-0-0', 2: 'i-2-0-1', 3: 'i-2-0-2', 4: 'i-2-0-3' };

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
    for (let i = 0; i < 9; i++) shapes.push(<rect key={i} x={i * 16 + (shift % 8)} y="0" width={(i % 3) + 2} height="100" fill={ink} />);
  } else if (kind === 1) {
    for (let i = 1; i <= 5; i++) shapes.push(<circle key={i} cx={40 + shift} cy="50" r={i * 11} fill="none" stroke={ink} strokeWidth="2" />);
  } else if (kind === 2) {
    for (let i = 0; i < 8; i++) shapes.push(<line key={i} x1={i * 22 - 20 + shift} y1="100" x2={i * 22 + 40 + shift} y2="0" stroke={ink} strokeWidth="2" />);
  } else {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) if ((h >> ((r * 3 + c) % 14)) % 2 === 0) shapes.push(<rect key={r + '-' + c} x={c * 16 + 6} y={r * 20 + 8} width="10" height="10" fill={ink} />);
  }
  const initials = title.replace(/^The /, '').split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 144 100" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', width: '100%', height, backgroundColor: bg }}>
      {shapes}
      <rect x="0" y="72" width="144" height="28" fill={bg} />
      <text x="8" y="94" fill={ink} fontSize="20" fontWeight="700" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" letterSpacing="-0.5">{initials}</text>
      <text x="136" y="94" fill={ink} fontSize="11" textAnchor="end" fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif">{year}</text>
    </svg>
  );
}

export default function Screen() {
  const navigate = useNavigate();
  const [likedIds, setLikedIds] = React.useState([17, 6, 9]);
  const [notice, setNotice] = React.useState(null);

  const P = brand.primaryColor;
  const N = brand.neutralColor;
  const rule = '2px solid ' + P;
  const label = { fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: N };
  const byId = (id) => CATALOG.find((m) => m.id === id);
  const recs = React.useMemo(() => recommend(likedIds), [likedIds]);
  const liked = likedIds.map(byId);

  const like = (id) => {
    if (likedIds.includes(id)) return;
    setLikedIds((l) => [...l, id]);
    setNotice({ id, type: 'like', text: 'Liked ' + byId(id).title + '. It leaves this list and your picks are re-ranked.' });
  };
  const unlike = (id) => {
    setLikedIds((l) => l.filter((x) => x !== id));
    setNotice({ id, type: 'unlike', text: 'Removed ' + byId(id).title + ' from your likes. Recommendations updated.' });
  };

  const btn = {
    fontFamily: brand.fontBody, fontSize: 13, fontWeight: 600, minHeight: 40, padding: '0 16px',
    borderRadius: brand.radius, border: rule, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };
  const btnSolid = { ...btn, backgroundColor: P, color: brand.backgroundColor };
  const btnOutline = { ...btn, backgroundColor: brand.backgroundColor, color: P };

  const searchButton = (solid) => (
    <div className="grid grid-cols-12 mt-6">
      <button type="button" data-wf="b-4-0" className="wn-btn col-span-12 sm:col-span-4" style={solid ? btnSolid : btnOutline} onClick={() => navigate('search')}>
        <Icons.Search aria-hidden="true" className="w-4 h-4" />
        Search movies
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: brand.fontBody, color: P, backgroundColor: brand.backgroundColor, fontVariantNumeric: 'tabular-nums' }} className="w-full px-4 py-6 sm:px-8">
      <style>{`
        .wn-btn:hover, .wn-title:hover { text-decoration: underline; }
        .wn-btn:focus-visible, .wn-title:focus-visible, .wn-chip:focus-visible, .wn-link:focus-visible { outline: 2px solid ${P}; outline-offset: 3px; }
        .wn-btn:active { opacity: .85; }
        .wn-card { animation: wn-in .25s ease-out; }
        @keyframes wn-in { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .wn-card { animation: none; } }
      `}</style>

      <div className="grid grid-cols-12 items-end gap-4" style={{ borderBottom: rule, paddingBottom: 16 }}>
        <div data-wf="b-0-0" className="col-span-8">
          <h1 style={{ fontSize: 36, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.035em', margin: 0 }}>For you</h1>
        </div>
        <button type="button" data-wf="b-0-1" className="wn-btn col-span-4 justify-self-end" style={btnOutline} onClick={() => navigate('login')}>
          Log out
        </button>
      </div>

      <p data-wf="b-1-0" style={{ fontSize: 14, lineHeight: 1.5, margin: '16px 0 24px', color: N, maxWidth: 640 }}>
        Movies picked from everything you have liked, highest match first.
      </p>

      <div role="status" aria-live="polite" style={{ minHeight: notice ? undefined : 0 }}>
        {notice && (
          <div className="wn-card flex flex-wrap items-center justify-between gap-3 mb-4" style={{ border: rule, padding: '8px 12px', borderRadius: brand.radius, fontSize: 13 }}>
            <span className="flex items-center gap-2"><Icons.CheckCircle aria-hidden="true" className="w-4 h-4" />{notice.text}</span>
          </div>
        )}
      </div>

      {likedIds.length > 0 && (
        <section data-wf="b-2-0" aria-labelledby="rec-h">
          <div className="flex items-baseline justify-between" style={{ borderBottom: rule, paddingBottom: 8, marginBottom: 16 }}>
            <h2 id="rec-h" style={{ ...label, color: P, fontSize: 12, margin: 0 }}>Recommended movies</h2>
            <span style={{ ...label }}>{recs.length} ranked · based on {likedIds.length} {likedIds.length === 1 ? 'like' : 'likes'}</span>
          </div>

          {recs.length === 0 ? (
            <div style={{ border: rule, padding: 24, borderRadius: brand.radius }}>
              <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>You have liked everything we have.</p>
              <p style={{ fontSize: 14, color: N, margin: '4px 0 0' }}>Nothing is left to recommend. An admin can add more movies by CSV upload.</p>
            </div>
          ) : (
            <ol className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {recs.map((r, i) => (
                <li key={r.movie.id} className="wn-card flex flex-col" style={{ border: rule, borderRadius: brand.radius }}>
                  <Artwork title={r.movie.title} year={r.movie.year} height={96} brand={brand} />
                  <div className="flex flex-col flex-1" style={{ padding: 12, borderTop: rule }}>
                    <div className="flex justify-between" style={label}>
                      <span>No. {String(i + 1).padStart(2, '0')}</span>
                      <span>Match {r.score.toFixed(3)}</span>
                    </div>
                    <button type="button" data-wf={WF_ITEM[r.movie.id]} className="wn-title" onClick={() => navigate('movie-detail')} aria-label={'Open ' + r.movie.title + ' (' + r.movie.year + ')'} style={{ textAlign: 'left', background: 'none', border: 0, padding: 0, margin: '8px 0 2px', cursor: 'pointer', color: P, fontFamily: brand.fontHeading, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                      {r.movie.title} <span style={{ fontWeight: 400, color: N, fontSize: 14 }}>({r.movie.year})</span>
                    </button>
                    <p style={{ fontSize: 12, color: N, margin: '0 0 12px' }}>{r.movie.genres.join(' · ')} · {r.movie.director}</p>
                    <button type="button" className="wn-btn mt-auto" aria-pressed="false" aria-label={'Like ' + r.movie.title} onClick={() => like(r.movie.id)} style={{ ...btnOutline, width: '100%', minHeight: 36 }}>
                      <Icons.Plus aria-hidden="true" className="w-4 h-4" /> Like
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div style={{ marginTop: 32, borderTop: rule, paddingTop: 12 }}>
            <h3 style={{ ...label, color: P, margin: '0 0 8px' }}>Your likes ({likedIds.length})</h3>
            <ul className="flex flex-wrap gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {liked.map((m) => (
                <li key={m.id}>
                  <button type="button" className="wn-chip" aria-pressed="true" aria-label={'Unlike ' + m.title + ' (' + m.year + ')'} onClick={() => unlike(m.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 32, padding: '0 8px 0 12px', border: rule, borderRadius: brand.radius, backgroundColor: P, color: brand.backgroundColor, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: brand.fontBody }}>
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

      {likedIds.length === 0 && (
        <section data-wf="b-3-0" aria-labelledby="empty-h" style={{ border: rule, borderRadius: brand.radius }}>
          <div className="grid grid-cols-3" aria-hidden="true" style={{ borderBottom: rule }}>
            {['Heat', 'Casino', 'Arrival'].map((t, i) => (
              <div key={t} style={{ borderLeft: i ? rule : 0, opacity: 1 }}>
                <svg viewBox="0 0 144 60" preserveAspectRatio="xMidYMid slice" style={{ display: 'block', width: '100%', height: 64 }}>
                  <rect width="144" height="60" fill={brand.backgroundColor} />
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                    <line key={k} x1={k * 20 - 10} y1="60" x2={k * 20 + 20} y2="0" stroke={P} strokeWidth="2" strokeDasharray="4 4" />
                  ))}
                </svg>
              </div>
            ))}
          </div>
          <div style={{ padding: 24 }}>
            <h2 id="empty-h" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>No likes yet, so nothing to rank.</h2>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: N, margin: '8px 0 0', maxWidth: 560 }}>
              Like a few movies to get recommendations. Search for a movie you enjoyed.
            </p>
          </div>
        </section>
      )}

      {searchButton(likedIds.length === 0)}
    </div>
  );
}
