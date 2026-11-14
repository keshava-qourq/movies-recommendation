import { expect, test, type Page, type APIRequestContext } from "@playwright/test";
import { randomUUID } from "node:crypto";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const APP = process.env.E2E_BASE_URL ?? "http://localhost:4173";
const ART = "[data-testid=movie-artwork]";
const NON_ENGLISH = new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]");

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function signedInViewer(page: Page): Promise<string> {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(uniqueEmail());
  await page.locator("#signup-password").fill(newSecret());
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  return token as string;
}

async function search(page: Page, text: string) {
  await page.goto("/search");
  await page.locator("#movie-search").fill(text);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

async function heatId(request: APIRequestContext, token: string): Promise<number> {
  const res = await request.get(`${API}/movies?q=heat&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const items = (await res.json()).items as { id: number; title: string }[];
  const heat = items.find((m) => m.title.trim().toLowerCase() === "heat");
  expect(heat).toBeTruthy();
  return heat!.id;
}

function tiles(page: Page) {
  return page.getByRole("button", { name: /Open movie details/ });
}
function similar(page: Page) {
  return page.getByRole("button", { name: /Open details$/ });
}
function byKey(page: Page, key: string) {
  return page.locator(`${ART}[data-artwork-key="${key.replace(/"/g, '\\"')}"]`);
}
async function html(page: Page, key: string): Promise<string> {
  const el = byKey(page, key).first();
  await expect(el).toBeVisible();
  return el.evaluate((e) => e.outerHTML);
}
async function keyOf(scope: ReturnType<Page["locator"]>): Promise<string> {
  const el = scope.locator(ART).first();
  await expect(el).toBeVisible();
  const key = await el.getAttribute("data-artwork-key");
  expect(key).toBeTruthy();
  return key as string;
}
async function heatTileKey(page: Page): Promise<string> {
  await search(page, "heat");
  return keyOf(page.getByRole("button", { name: /^Heat, \d{4}\./ }).first());
}

test("[AC-032] every Search tile, the detail main and similar movies, and For you cards have artwork", async ({
  page,
  request,
}) => {
  const token = await signedInViewer(page);
  const id = await heatId(request, token);

  await search(page, "a");
  await expect(tiles(page).first()).toBeVisible();
  const n = await tiles(page).count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(tiles(page).nth(i).locator(ART)).toHaveCount(1);
  }

  await page.goto(`/movie-detail?movie=${id}`);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  await expect(similar(page).first()).toBeVisible();
  const s = await similar(page).count();
  for (let i = 0; i < s; i++) {
    await expect(similar(page).nth(i).locator(ART)).toHaveCount(1);
  }
  await expect(page.locator(ART)).toHaveCount(s + 1);

  const like = await request.put(`${API}/movies/${id}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(like.status()).toBe(200);
  await page.goto("/for-you");
  const cards = page.locator("section[aria-labelledby=rec-h] ol li");
  await expect(cards.first()).toBeVisible();
  const c = await cards.count();
  for (let i = 0; i < c; i++) {
    await expect(cards.nth(i).locator(ART)).toHaveCount(1);
  }
});

test("[AC-032][NFR-009] artwork uses no <img> and no image is requested from another origin", async ({
  page,
  request,
}) => {
  const allowed = new Set([new URL(APP).origin, new URL(API).origin]);
  const foreign: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!/^https?:/.test(url)) return;
    if (req.resourceType() === "image" && !allowed.has(new URL(url).origin)) foreign.push(url);
  });
  const token = await signedInViewer(page);
  const id = await heatId(request, token);
  await request.put(`${API}/movies/${id}/like`, { headers: { Authorization: `Bearer ${token}` } });
  for (const path of ["/search", `/movie-detail?movie=${id}`, "/for-you"]) {
    if (path === "/search") await search(page, "heat");
    else await page.goto(path);
    await expect(page.locator(ART).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await page.locator(`img${ART}, ${ART} img`).count()).toBe(0);
    expect(await page.locator(ART).evaluateAll((els) => els.map((e) => e.tagName))).not.toContain(
      "IMG",
    );
  }
  expect(foreign).toEqual([]);
});

test("[AC-033][NFR-014] Heat artwork is identical on Search, detail, similar and For you, after reload and in a second context", async ({
  page,
  browser,
  request,
}) => {
  const token = await signedInViewer(page);
  const id = await heatId(request, token);
  const key = await heatTileKey(page);
  const onSearch = await html(page, key);
  expect(onSearch).toContain("svg");

  await page.goto(`/movie-detail?movie=${id}`);
  const onDetail = await html(page, key);
  expect(onDetail).toBe(onSearch);

  // Heat as a similar movie of another movie
  const first = similar(page).first();
  await expect(first).toBeVisible();
  const simLabel = (await first.getAttribute("aria-label")) ?? "";
  const simTitle = simLabel.replace(/ \(\d{4}\), rank.*$/, "");
  const simKey = await keyOf(first);
  const simHtml = await first
    .locator(ART)
    .first()
    .evaluate((e) => e.outerHTML);
  await search(page, simTitle);
  const simOnSearch = await html(page, simKey);
  expect(simOnSearch).toBe(simHtml);

  // For you card of another page
  await request.put(`${API}/movies/${id}/like`, { headers: { Authorization: `Bearer ${token}` } });
  const fy = await request.get(`${API}/me/for-you`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rec = (await fy.json()).items[0] as { title: string };
  await page.goto("/for-you");
  const card = page.locator("section[aria-labelledby=rec-h] ol li").first();
  const recKey = await keyOf(card);
  const recHtml = await card
    .locator(ART)
    .first()
    .evaluate((e) => e.outerHTML);
  await search(page, rec.title);
  expect(await html(page, recKey)).toBe(recHtml);

  // reload
  await heatTileKey(page);
  await page.reload();
  await expect(byKey(page, key).first()).toBeVisible();
  expect(await html(page, key)).toBe(onSearch);

  // second browser context
  const ctx = await browser.newContext();
  const page2 = await ctx.newPage();
  await signedInViewer(page2);
  const key2 = await heatTileKey(page2);
  expect(key2).toBe(key);
  expect(await html(page2, key2)).toBe(onSearch);
  await page2.goto(`/movie-detail?movie=${id}`);
  expect(await html(page2, key)).toBe(onSearch);
  await ctx.close();
});

test("[AC-033][NFR-014] different movies have different artwork keys and markup", async ({
  page,
}) => {
  await signedInViewer(page);
  await search(page, "a");
  await expect(tiles(page).first()).toBeVisible();
  const items = await page
    .locator(ART)
    .evaluateAll((els) =>
      els.map((e) => ({ key: e.getAttribute("data-artwork-key") ?? "", html: e.outerHTML })),
    );
  expect(items.length).toBeGreaterThan(1);
  const keys = items.map((i) => i.key);
  expect(keys.every((k) => k.length > 0)).toBe(true);
  expect(new Set(keys).size).toBe(keys.length);
  expect(new Set(items.map((i) => i.html)).size).toBe(items.length);
});

test("[NFR-013] artwork pages are English only", async ({ page }) => {
  await signedInViewer(page);
  await search(page, "heat");
  await expect(page.locator(ART).first()).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(NON_ENGLISH);
});
