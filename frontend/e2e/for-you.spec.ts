import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const NON_ENGLISH = new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]");

type Rec = { id: number; title: string; score: number };

function sfx(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10);
}
function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function viewer(page: Page): Promise<string> {
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

// Four movie pairs: m1/r1 share director, genre and cast; m2/r2 likewise; x shares nothing.
async function uploadSet(request: APIRequestContext, s: string) {
  const t = {
    m1: `FyM1 ${s}`,
    r1: `FyR1 ${s}`,
    m2: `FyM2 ${s}`,
    r2: `FyR2 ${s}`,
    x: `FyX ${s}`,
  };
  const csv =
    "title,year,genres,director,cast,plot\n" +
    `${t.m1},2001,gena${s},dira${s},casta${s},plota${s} alpha${s}\n` +
    `${t.r1},2002,gena${s},dira${s},casta${s},plota${s} alpha${s}\n` +
    `${t.m2},2003,genb${s},dirb${s},castb${s},plotb${s} beta${s}\n` +
    `${t.r2},2004,genb${s},dirb${s},castb${s},plotb${s} beta${s}\n` +
    `${t.x},2005,genx${s},dirx${s},castx${s},plotx${s} gamma${s}\n`;
  const admin = await adminHeaders(request);
  const up = await request.post(`${API}/admin/movies/upload`, {
    headers: admin,
    multipart: { file: { name: "m.csv", mimeType: "text/csv", buffer: Buffer.from(csv) } },
  });
  expect(up.status()).toBe(200);
  const found = await request.get(`${API}/movies?q=${s}&limit=100`, { headers: admin });
  const items = (await found.json()).items as { id: number; title: string }[];
  const id = (title: string) => items.find((m) => m.title === title)!.id;
  return {
    t,
    ids: { m1: id(t.m1), r1: id(t.r1), m2: id(t.m2), r2: id(t.r2), x: id(t.x) },
  };
}

async function forYou(request: APIRequestContext, token: string) {
  const res = await request.get(`${API}/me/for-you`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as { items: Rec[]; has_likes: boolean };
}

async function like(request: APIRequestContext, token: string, id: number) {
  const res = await request.put(`${API}/movies/${id}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
}

async function unlike(request: APIRequestContext, token: string, id: number) {
  const res = await request.delete(`${API}/movies/${id}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(204);
}

function recList(page: Page) {
  return page.locator("section[aria-labelledby=rec-h] ol");
}

test("[AC-051] a new viewer sees the like prompt, a Search movies control and no recommendations", async ({
  page,
}) => {
  await viewer(page);
  await page.goto("/for-you");
  await expect(page.getByText(/like (a few|some) movies/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Search movies/ })).toBeVisible();
  await expect(recList(page)).toHaveCount(0);
});

test("[AC-051][AC-052] liking a first movie removes the prompt and shows a recommendations list", async ({
  page,
  request,
}) => {
  const s = sfx();
  const set = await uploadSet(request, s);
  await viewer(page);
  await page.goto("/for-you");
  await expect(page.getByText(/like (a few|some) movies/i).first()).toBeVisible();

  await page.goto(`/movie-detail?movie=${set.ids.m1}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(set.t.m1);
  const btn = page.locator("button[aria-pressed]");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");

  await page.goto("/for-you");
  await expect(page.getByText(/like (a few|some) movies/i)).toHaveCount(0);
  await expect(recList(page)).toBeVisible();
  await expect(recList(page).locator("li").first()).toBeVisible();
  await expect(page.locator("body")).toContainText(set.t.r1);
});

test("[AC-047][AC-049] recommendations are highest match first, capped at 10, and exclude liked titles", async ({
  page,
  request,
}) => {
  const set = await uploadSet(request, sfx());
  const token = await viewer(page);
  await like(request, token, set.ids.m1);
  await like(request, token, set.ids.m2);
  const body = await forYou(request, token);
  expect(body.has_likes).toBe(true);
  expect(body.items.length).toBeGreaterThan(0);
  expect(body.items.length).toBeLessThanOrEqual(10);
  for (let i = 1; i < body.items.length; i++) {
    expect(body.items[i].score).toBeLessThanOrEqual(body.items[i - 1].score);
  }
  const titles = body.items.map((i) => i.title);
  expect(titles).not.toContain(set.t.m1);
  expect(titles).not.toContain(set.t.m2);

  await page.goto("/for-you");
  await expect(recList(page)).toBeVisible();
  const text = await recList(page).innerText();
  expect(text).not.toContain(set.t.m1);
  expect(text).not.toContain(set.t.m2);
});

test("[AC-048] after liking two movies there are recommendations related to each", async ({
  page,
  request,
}) => {
  const set = await uploadSet(request, sfx());
  const token = await viewer(page);
  await like(request, token, set.ids.m1);
  await like(request, token, set.ids.m2);
  const titles = (await forYou(request, token)).items.map((i) => i.title);
  expect(titles).toContain(set.t.r1);
  expect(titles).toContain(set.t.r2);
  await page.goto("/for-you");
  await expect(page.locator("body")).toContainText(set.t.r1);
  await expect(page.locator("body")).toContainText(set.t.r2);
});

test("[AC-050] unliking a movie, or liking another, changes the list on the next visit", async ({
  page,
  request,
}) => {
  const set = await uploadSet(request, sfx());
  const token = await viewer(page);
  await like(request, token, set.ids.m1);
  let titles = (await forYou(request, token)).items.map((i) => i.title);
  expect(titles).toContain(set.t.r1);
  expect(titles).not.toContain(set.t.r2);

  await like(request, token, set.ids.m2);
  titles = (await forYou(request, token)).items.map((i) => i.title);
  expect(titles).toContain(set.t.r2);
  await page.goto("/for-you");
  await expect(page.locator("body")).toContainText(set.t.r2);

  await unlike(request, token, set.ids.m1);
  titles = (await forYou(request, token)).items.map((i) => i.title);
  expect(titles).toContain(set.t.r2);
  expect(titles).not.toContain(set.t.r1);
  expect(titles).not.toContain(set.t.m1);
  await page.goto("/for-you");
  await expect(page.locator("body")).toContainText(set.t.r2);
  await expect(recList(page)).not.toContainText(set.t.r1);

  await unlike(request, token, set.ids.m2);
  const empty = await forYou(request, token);
  expect(empty.has_likes).toBe(false);
  expect(empty.items).toEqual([]);
});

test("[NFR-004] signed out, /for-you redirects to login and GET /me/for-you returns 401", async ({
  page,
  request,
}) => {
  await page.goto("/for-you");
  await expect(page).toHaveURL(/\/login/);
  const res = await request.get(`${API}/me/for-you`);
  expect(res.status()).toBe(401);
  expect((await res.json()).detail).toBe("Not authenticated");
  const bad = await request.get(`${API}/me/for-you`, {
    headers: { Authorization: `Bearer ${randomUUID()}` },
  });
  expect(bad.status()).toBe(401);
});

test("[NFR-006] a second viewer with no likes sees the prompt, not the first viewer's recommendations", async ({
  page,
  browser,
  request,
}) => {
  const set = await uploadSet(request, sfx());
  const tokenA = await viewer(page);
  await like(request, tokenA, set.ids.m1);
  expect((await forYou(request, tokenA)).items.length).toBeGreaterThan(0);

  const ctx = await browser.newContext();
  const pageB = await ctx.newPage();
  const tokenB = await viewer(pageB);
  const b = await forYou(request, tokenB);
  expect(b.has_likes).toBe(false);
  expect(b.items).toEqual([]);
  await pageB.goto("/for-you");
  await expect(pageB.getByText(/like (a few|some) movies/i).first()).toBeVisible();
  await expect(recList(pageB)).toHaveCount(0);
  await expect(pageB.locator("body")).not.toContainText(set.t.r1);
  await ctx.close();
});

test("[NFR-013] the For you screen is English only", async ({ page }) => {
  await viewer(page);
  await page.goto("/for-you");
  await expect(page.getByRole("button", { name: /Search movies/ })).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(NON_ENGLISH);
});

// NFR-008 (5,000-movie scale) is covered by backend/tests/unit/test_similarity_scale.py.
