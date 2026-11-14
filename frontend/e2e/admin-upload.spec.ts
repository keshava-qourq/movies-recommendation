import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const HEADER = "title,year,genres,director,cast,plot";
const NON_ENGLISH = new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]");

function sfx(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10);
}
function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function adminLogin(page: Page): Promise<void> {
  const { email, password } = adminCredentials();
  await page.goto("/login");
  await page.locator("#corp-email").fill(email);
  await page.locator("#corp-password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
}

async function viewerSignup(page: Page): Promise<string> {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(uniqueEmail());
  await page.locator("#signup-password").fill(newSecret());
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  return token as string;
}

async function adminToken(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API}/auth/login`, { data: adminCredentials() });
  expect(login.status()).toBe(200);
  return (await login.json()).token as string;
}

async function openUpload(page: Page): Promise<void> {
  await adminLogin(page);
  await page.getByRole("link", { name: "Upload movies" }).click();
  await expect(page).toHaveURL(/\/admin-upload/);
}

async function uploadFile(page: Page, name: string, mimeType: string, content: string) {
  await page.locator("#csv-file").setInputFiles({ name, mimeType, buffer: Buffer.from(content) });
  await page.getByRole("button", { name: /^Upload$/ }).click();
}

async function countFor(request: APIRequestContext, token: string, q: string): Promise<number> {
  const res = await request.get(`${API}/movies?q=${encodeURIComponent(q)}&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).total as number;
}

async function search(page: Page, text: string) {
  await page.goto("/search");
  await page.locator("#movie-search").fill(text);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

function resultButton(page: Page, title: string) {
  return page.getByRole("button", { name: new RegExp(`^${title}, \\d{4}\\.`) });
}

function card(page: Page, name: string) {
  return page.getByRole("group", { name: new RegExp(`^${name}: \\d+$`) });
}

test("[AC-053][AC-054][AC-055][NFR-015] valid upload adds rows, shows counts, splits genres and cast, shows Similar movies", async ({
  page,
  request,
}) => {
  const s = sfx();
  const t1 = `Upl ${s} One`;
  const t2 = `Upl ${s} Two`;
  const csv =
    `${HEADER}\n` +
    `${t1},2001,Drama|Crime${s},Dir ${s},Actor A${s}|Actor B${s},Plot ${s} one\n` +
    `${t2},2002,Drama|Crime${s},Dir ${s},Actor A${s},Plot ${s} two\n`;
  await openUpload(page);
  await uploadFile(page, "movies.csv", "text/csv", csv);
  await expect(card(page, "Added")).toHaveAttribute("aria-label", "Added: 2");
  await expect(card(page, "Skipped as duplicates")).toBeVisible();
  await expect(card(page, "Rejected")).toHaveAttribute("aria-label", "Rejected: 0");

  expect(await countFor(request, await adminToken(request), s)).toBe(2);

  await search(page, t1);
  await resultButton(page, t1).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(t1);
  const body = await page.locator("body").innerText();
  expect(body).toContain(`Crime${s}`);
  expect(body).toContain(`Actor A${s}`);
  expect(body).toContain(`Actor B${s}`);
  expect(body).not.toContain("|");
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: new RegExp(`${t2}.*Open details$`) }),
  ).toBeVisible();
});

test("[AC-056][NFR-015] a .txt file is refused, says nothing was added, and its title is not searchable", async ({
  page,
  request,
}) => {
  const s = sfx();
  const title = `Txt ${s}`;
  await openUpload(page);
  await uploadFile(page, "movies.txt", "text/plain", `${HEADER}\n${title},2001,Drama,D,A,Plot\n`);
  await expect(page.getByRole("alert")).toContainText(/nothing was added/i);
  expect(await countFor(request, await adminToken(request), s)).toBe(0);
});

test("[AC-056][NFR-015] a CSV missing a required column shows an error and adds nothing", async ({
  page,
  request,
}) => {
  const s = sfx();
  const title = `Nocol ${s}`;
  await openUpload(page);
  await uploadFile(
    page,
    "movies.csv",
    "text/csv",
    `title,year,genres,director,cast\n${title},2001,Drama,D,A\n`,
  );
  await expect(page.getByRole("alert")).toContainText(/nothing was added/i);
  expect(await countFor(request, await adminToken(request), s)).toBe(0);
  await search(page, title);
  await expect(page.getByText("No movies found")).toBeVisible();
});

test("[AC-057][NFR-005] a viewer is redirected from /admin-upload and sees no upload control", async ({
  page,
}) => {
  await viewerSignup(page);
  await page.goto("/admin-upload");
  await expect(page).not.toHaveURL(/\/admin-upload/);
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /upload/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /upload/i })).toHaveCount(0);
});

test("[AC-057][NFR-005] a viewer gets 403 and an anonymous caller 401 on upload, and the catalog is unchanged", async ({
  page,
  request,
}) => {
  const token = await viewerSignup(page);
  const s = sfx();
  const file = {
    name: "movies.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`${HEADER}\nBlock ${s},2001,Drama,D,A,Plot\n`),
  };
  const viewer = await request.post(`${API}/admin/movies/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: { file },
  });
  expect(viewer.status()).toBe(403);
  const anon = await request.post(`${API}/admin/movies/upload`, { multipart: { file } });
  expect(anon.status()).toBe(401);
  expect(await countFor(request, token, s)).toBe(0);
});

test("[AC-058][NFR-015] rejected rows list row number and reason, and valid rows are added", async ({
  page,
  request,
}) => {
  const s = sfx();
  const good = `Good ${s}`;
  const csv =
    `${HEADER}\n` +
    `${good},2001,Drama,D,A,Plot ${s}\n` +
    `,2002,Drama,D,A,Plot ${s}\n` +
    `BadYear ${s},abcd,Drama,D,A,Plot ${s}\n` +
    `NoPlot ${s},2003,Drama,D,A,\n`;
  await openUpload(page);
  await uploadFile(page, "movies.csv", "text/csv", csv);
  await expect(card(page, "Added")).toHaveAttribute("aria-label", "Added: 1");
  await expect(card(page, "Rejected")).toHaveAttribute("aria-label", "Rejected: 3");
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(3);
  for (const n of ["2", "3", "4"]) {
    const row = rows.filter({ has: page.getByRole("cell", { name: n, exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(/rejected/i);
    expect((await row.innerText()).replace(/\s+/g, " ").trim().length).toBeGreaterThan(12);
  }
  expect(await countFor(request, await adminToken(request), s)).toBe(1);
});

test("[AC-059] re-uploading the same title and year in another letter case is skipped", async ({
  page,
  request,
}) => {
  const s = sfx();
  const title = `Case ${s}`;
  await openUpload(page);
  await uploadFile(page, "a.csv", "text/csv", `${HEADER}\n${title},2001,Drama,D,A,Plot\n`);
  await expect(card(page, "Added")).toHaveAttribute("aria-label", "Added: 1");
  await uploadFile(
    page,
    "b.csv",
    "text/csv",
    `${HEADER}\n${title.toUpperCase()},2001,Drama,D,A,Plot\n`,
  );
  await expect(card(page, "Added")).toHaveAttribute("aria-label", "Added: 0");
  await expect(card(page, "Skipped as duplicates")).toHaveAttribute(
    "aria-label",
    "Skipped as duplicates: 1",
  );
  expect(await countFor(request, await adminToken(request), s)).toBe(1);
});

test("[AC-060] the same title and year twice in one file adds the first and skips the second", async ({
  page,
  request,
}) => {
  const s = sfx();
  const title = `Dup ${s}`;
  await openUpload(page);
  await uploadFile(
    page,
    "dup.csv",
    "text/csv",
    `${HEADER}\n${title},2001,Drama,D,A,Plot\n${title},2001,Drama,D,A,Plot\n`,
  );
  await expect(card(page, "Added")).toHaveAttribute("aria-label", "Added: 1");
  await expect(card(page, "Skipped as duplicates")).toHaveAttribute(
    "aria-label",
    "Skipped as duplicates: 1",
  );
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText(/duplicate/i);
  expect(await countFor(request, await adminToken(request), s)).toBe(1);
});

test("[AC-061] no edit or delete control on upload page or detail page, and PUT/PATCH/DELETE on /movies/{id} are refused", async ({
  page,
  request,
}) => {
  const s = sfx();
  const title = `Ro ${s}`;
  await openUpload(page);
  await uploadFile(page, "ro.csv", "text/csv", `${HEADER}\n${title},2001,Drama,D,A,Plot\n`);
  await expect(card(page, "Added")).toHaveAttribute("aria-label", "Added: 1");
  const control = /edit|delete|remove/i;
  await expect(page.getByRole("button", { name: control })).toHaveCount(0);
  await expect(page.getByRole("link", { name: control })).toHaveCount(0);

  await search(page, title);
  await resultButton(page, title).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
  await expect(page.getByRole("button", { name: control })).toHaveCount(0);
  await expect(page.getByRole("link", { name: control })).toHaveCount(0);

  const token = await adminToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  const found = await request.get(`${API}/movies?q=${s}`, { headers });
  const id = (await found.json()).items[0].id as number;
  for (const method of ["put", "patch", "delete"] as const) {
    const res = await request[method](`${API}/movies/${id}`, { headers, data: {} });
    expect([404, 405]).toContain(res.status());
  }
  expect(await countFor(request, token, s)).toBe(1);
});

test("[NFR-013][NFR-015] the upload page and its result are English only", async ({ page }) => {
  const s = sfx();
  await openUpload(page);
  expect(await page.locator("body").innerText()).not.toMatch(NON_ENGLISH);
  await uploadFile(
    page,
    "e.csv",
    "text/csv",
    `${HEADER}\nEng ${s},2001,Drama,D,A,Plot\n,2002,D,D,A,P\n`,
  );
  await expect(card(page, "Added")).toBeVisible();
  expect(await page.locator("body").innerText()).not.toMatch(NON_ENGLISH);
});

// NFR-008 (5,000-movie scale) is covered by backend/tests/unit/test_similarity_scale.py; not repeated in the browser.
