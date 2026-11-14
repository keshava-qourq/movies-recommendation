import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

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

async function adminHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  const login = await request.post(`${API}/auth/login`, { data: adminCredentials() });
  expect(login.status()).toBe(200);
  return { Authorization: `Bearer ${(await login.json()).token}` };
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

function entries(page: Page) {
  return page.getByRole("button", { name: /Open details$/ });
}

async function readEntries(page: Page): Promise<{ title: string; score: number }[]> {
  await expect(entries(page).first()).toBeVisible();
  const labels = await entries(page).evaluateAll((els) =>
    els.map((e) => e.getAttribute("aria-label") ?? ""),
  );
  return labels.map((l) => {
    const m = /^(.*) \(\d{4}\), rank \d+, similarity ([0-9.eE+-]+)\. Open details$/.exec(l);
    expect(m, `unexpected label: ${l}`).not.toBeNull();
    return { title: m![1], score: Number(m![2]) };
  });
}

test("[AC-034][AC-035] at most 10 similar entries, scores non-increasing, own title absent", async ({
  page,
  request,
}) => {
  const token = await signedInViewer(page);
  const id = await heatId(request, token);
  await page.goto(`/movie-detail?movie=${id}`);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  const list = await readEntries(page);
  expect(list.length).toBeGreaterThan(0);
  expect(list.length).toBeLessThanOrEqual(10);
  for (let i = 1; i < list.length; i++) {
    expect(list[i].score).toBeLessThanOrEqual(list[i - 1].score);
  }
  expect(list.map((e) => e.title.trim().toLowerCase())).not.toContain("heat");
});

test("[AC-036] a movie sharing director, genres and cast ranks above one sharing nothing", async ({
  page,
  request,
}) => {
  const sfx = randomUUID().replace(/-/g, "").slice(0, 10);
  const g = `genre${sfx}`;
  const d = `director${sfx}`;
  const c = `actor${sfx}`;
  const titles = { a: `SimA ${sfx}`, b: `SimB ${sfx}`, c: `SimC ${sfx}` };
  const csv =
    "title,year,genres,director,cast,plot\n" +
    `${titles.a},2001,${g},${d},${c},plot${sfx} one\n` +
    `${titles.b},2002,${g},${d},${c},plot${sfx} two\n` +
    `${titles.c},2003,othergenre${sfx},otherdir${sfx},othercast${sfx},unrelated${sfx}\n`;
  const admin = await adminHeaders(request);
  const up = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: { file: { name: "movies.csv", mimeType: "text/csv", buffer: Buffer.from(csv) } },
  });
  expect(up.status()).toBe(200);
  const found = await request.get(`${API}/movies?q=${sfx}&limit=100`, { headers: admin });
  const items = (await found.json()).items as { id: number; title: string }[];
  const aId = items.find((m) => m.title === titles.a)?.id;
  expect(aId).toBeTruthy();

  await signedInViewer(page);
  await page.goto(`/movie-detail?movie=${aId}`);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  const list = (await readEntries(page)).map((e) => e.title);
  const bi = list.indexOf(titles.b);
  const ci = list.indexOf(titles.c);
  expect(bi).toBeGreaterThanOrEqual(0);
  expect(ci === -1 || bi < ci).toBeTruthy();
  expect(list).not.toContain(titles.a);
});

test("[AC-037] reloading twice gives the identical order", async ({ page, request }) => {
  const token = await signedInViewer(page);
  const id = await heatId(request, token);
  await page.goto(`/movie-detail?movie=${id}`);
  const first = await readEntries(page);
  await page.reload();
  const second = await readEntries(page);
  await page.reload();
  const third = await readEntries(page);
  expect(second).toEqual(first);
  expect(third).toEqual(first);
});

test("[AC-038][NFR-007] the similar section is visible within 2 seconds of page load", async ({
  page,
  request,
}) => {
  const token = await signedInViewer(page);
  const id = await heatId(request, token);
  const start = Date.now();
  await page.goto(`/movie-detail?movie=${id}`);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible({
    timeout: 2000,
  });
  await expect(entries(page).first()).toBeVisible({ timeout: 2000 });
  expect(Date.now() - start).toBeLessThan(2500);
});

test("[NFR-013] the similar section text is English only", async ({ page, request }) => {
  const token = await signedInViewer(page);
  const id = await heatId(request, token);
  await page.goto(`/movie-detail?movie=${id}`);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]"));
});

// NFR-008 and NFR-012 are covered by backend tests (test_similarity*.py); a 5,000-movie
// catalog (NFR-007 at full size) is not set up here, only the shared catalog is timed.
