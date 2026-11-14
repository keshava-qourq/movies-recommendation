// One shared, deterministic placeholder: a pure function of title and year.
const PALETTE = [
  "#1f3a5f",
  "#7a2e2e",
  "#2e6b4f",
  "#5b3a7a",
  "#8a5a14",
  "#1d6a72",
  "#4a4a4a",
  "#8c2f5d",
];
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function Artwork({
  title,
  year,
  decorative = true,
}: {
  title: string;
  year: number | string;
  decorative?: boolean;
}) {
  const key = `${title.trim().toLowerCase()}|${year}`;
  let seed = hash(key);
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const color = PALETTE[hash(key) % PALETTE.length];
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 3; c++) {
      if (next() > 0.5) {
        cells.push([c, r]);
        if (c < 2) cells.push([4 - c, r]);
      }
    }
  }
  const initials = title
    .trim()
    .replace(/^The\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
  const svg = (
    <svg
      data-testid="movie-artwork"
      data-artwork-key={key}
      viewBox="0 0 100 150"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "auto", aspectRatio: "2 / 3" }}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="100" height="150" fill={color} />
      {cells.map(([c, r], i) => (
        <rect key={i} x={c * 20} y={r * 20} width="20" height="20" fill="#ffffff" opacity="0.28" />
      ))}
      <rect x="0" y="118" width="100" height="32" fill="#000000" opacity="0.45" />
      <text x="8" y="141" fill="#ffffff" fontSize="20" fontWeight="700" fontFamily={FONT}>
        {initials}
      </text>
      <text x="92" y="141" fill="#ffffff" fontSize="11" textAnchor="end" fontFamily={FONT}>
        {year}
      </text>
    </svg>
  );
  if (decorative) return svg;
  return (
    <span role="img" aria-label={`Generated artwork for ${title}`} style={{ display: "block" }}>
      {svg}
    </span>
  );
}

export default Artwork;
