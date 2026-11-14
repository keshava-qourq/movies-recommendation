import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Artwork } from "./Artwork";

const html = (title: string, year: number) =>
  render(<Artwork title={title} year={year} />).container.innerHTML;

describe("Artwork", () => {
  it("[AC-033] same input renders identical markup twice", () => {
    expect(html("Heat", 1995)).toBe(html("Heat", 1995));
  });
  it("[AC-033] different titles differ", () => {
    expect(html("Heat", 1995)).not.toBe(html("Alien", 1995));
  });
  it("[AC-033] same title in a different year differs", () => {
    expect(html("Heat", 1995)).not.toBe(html("Heat", 1996));
  });
  it("[AC-033] casing and whitespace do not change the output", () => {
    const a = html("Heat", 1995).replace(/aria-label="[^"]*"/, "");
    expect(html("  HEAT ", 1995).replace(/aria-label="[^"]*"/, "")).toBe(
      a.replace(/Heat/g, "HEAT"),
    );
  });
  it("[AC-032] has no image element and no http(s) URL", () => {
    const out = html("Heat", 1995);
    expect(out).not.toContain("<image");
    expect(out).not.toMatch(/https?:/);
    expect(out).toContain('data-artwork-key="heat|1995"');
  });
});
