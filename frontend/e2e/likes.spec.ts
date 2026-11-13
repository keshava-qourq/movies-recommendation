import { expect, test, type Browser, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const DETAIL = "/movie-detail?movie=heat";
const TITLE = "Heat";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function signup(page: Page, email: string, secret: string) {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(secret);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
}

async function login(page: Page, email: string, secret: string) {
  await page.goto("/login");
  await page.locator("#corp-email").fill(email);
  await page.locator("#corp-password").fill(secret);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
}

async function likesFor(page: Page): Promise<{ title: string }[]> {
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  const res = await page.request.get(`${API}/me/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  return (await res.json()).items;
}

function likeButton(page: Page) {
  return page.locator("button[aria-pressed]");
}

async function openDetail(page: Page) {
  await page.goto(DETAIL);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(TITLE);
  await expect(likeButton(page)).toBeVisible();
}

async function newViewer(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const email = uniqueEmail();
  const secret = newSecret();
  await signup(page, email, secret);
  return { ctx, page, email, secret };
}

test("[AC-042][AC-043] Like shows liked, pressing again shows not liked", async ({ browser }) => {
  const v = await newViewer(browser);
  await openDetail(v.page);
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "false");
  await likeButton(v.page).click();
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "true");
  await expect(likeButton(v.page)).toContainText(/liked/i);
  await likeButton(v.page).click();
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "false");
  await expect(likeButton(v.page)).toHaveText(/^\s*Like\s*$/);
  expect(await likesFor(v.page)).toHaveLength(0);
  await v.ctx.close();
});

test("[AC-044] a like survives logout/login and shows in a second browser context", async ({
  browser,
}) => {
  const v = await newViewer(browser);
  await openDetail(v.page);
  await likeButton(v.page).click();
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "true");

  await v.page.getByRole("button", { name: /log out/i }).first().click();
  await expect(v.page).toHaveURL(/\/login/);
  await login(v.page, v.email, v.secret);
  await openDetail(v.page);
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "true");

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await login(page2, v.email, v.secret);
  await openDetail(page2);
  await expect(likeButton(page2)).toHaveAttribute("aria-pressed", "true");
  await ctx2.close();
  await v.ctx.close();
});

test("[AC-045] a double click on Like leaves the movie liked once", async ({ browser }) => {
  const v = await newViewer(browser);
  await openDetail(v.page);
  await likeButton(v.page).dblclick();
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "true");
  await v.page.reload();
  await expect(likeButton(v.page)).toHaveAttribute("aria-pressed", "true");
  const items = await likesFor(v.page);
  expect(items.filter((i) => i.title === TITLE)).toHaveLength(1);
  expect(items).toHaveLength(1);
  await expect(v.page.getByRole("status")).toContainText("1 movie.");
  await v.ctx.close();
});

test("[AC-046][NFR-006] a second viewer sees not liked and none of the first viewer's likes", async ({
  browser,
}) => {
  const a = await newViewer(browser);
  await openDetail(a.page);
  await likeButton(a.page).click();
  await expect(likeButton(a.page)).toHaveAttribute("aria-pressed", "true");
  expect(await likesFor(a.page)).toHaveLength(1);

  const b = await newViewer(browser);
  await openDetail(b.page);
  await expect(likeButton(b.page)).toHaveAttribute("aria-pressed", "false");
  await expect(b.page.getByRole("status")).toContainText("0 movies");
  expect(await likesFor(b.page)).toEqual([]);
  await a.ctx.close();
  await b.ctx.close();
});

test("[NFR-004] signed out, the detail page redirects to login and like changes nothing", async ({
  page,
  browser,
}) => {
  await page.goto(DETAIL);
  await expect(page).toHaveURL(/\/login/);
  const v = await newViewer(browser);
  const before = await likesFor(v.page);
  const res = await page.request.post(`${API}/movies/1/like`);
  expect(res.status()).toBe(401);
  expect(await likesFor(v.page)).toEqual(before);
  await v.ctx.close();
});

test("[NFR-013] the movie detail screen is English only", async ({ browser }) => {
  const v = await newViewer(browser);
  await openDetail(v.page);
  const text = await v.page.locator("body").innerText();
  expect(text).not.toMatch(new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]"));
  await v.ctx.close();
});
