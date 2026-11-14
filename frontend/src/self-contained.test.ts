import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";

const modules = import.meta.glob(["./**/*.{ts,tsx,css}", "!./**/*.test.{ts,tsx}"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const files: Record<string, string> = { "index.html": indexHtml, ...modules };

function offenders(re: RegExp): string[] {
  return Object.keys(files).filter((f) => re.test(files[f]));
}

describe("self-contained build", () => {
  it("[AC-021] scans index.html and the source files", () => {
    expect(Object.keys(files).length).toBeGreaterThan(5);
  });

  it("[AC-021] no src, href, url() or @import points at a web address", () => {
    const bad =
      /(?:\b(?:src|href)\s*=\s*["'`]?\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\/|@import\s+(?:url\()?\s*["']?(?:https?:)?\/\/)/i;
    expect(offenders(bad)).toEqual([]);
  });

  it("[AC-021] no web font is loaded from a web address", () => {
    const font =
      /fonts\.(googleapis|gstatic)\.com|use\.typekit|@font-face[^}]*url\(\s*["']?https?:/i;
    expect(offenders(font)).toEqual([]);
  });

  it("[AC-021] other http(s) URLs are only SVG xmlns declarations", () => {
    const found: string[] = [];
    for (const text of Object.values(files)) {
      for (const m of text.matchAll(/.{0,12}https?:\/\/[^\s"'`)]+/g)) {
        const before = m[0].slice(0, m[0].indexOf("http"));
        if (!/xmlns(:\w+)?\s*=\s*["']?$/.test(before)) found.push(m[0]);
      }
    }
    expect(found).toEqual([]);
  });
});
