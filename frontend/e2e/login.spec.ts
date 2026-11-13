import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const GENERIC = "Invalid email or password";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function signupApi(request: import("@playwright/test").APIRequestContext) {
  const email = uniqueEmail();
  const password = newSecret();
  const res = await request.post(`${API}/auth/signup`, { data: { email, password } });
  expect(res.status()).toBe(201);
  return { email, password, token: (await res.json()).token as string };
}

async function uiLogin(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#corp-email").fill(email);
  await page.locator("#corp-password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

test("[AC-006][NFR-013] login with email in another letter case lands on For you", async ({
  page,
  request,
}) => {
  const u = await signupApi(request);
  await uiLogin(page, u.email.toUpperCase(), u.password);
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("button", { name: /log out/i }).first()).toBeVisible();
});

test("[AC-007][NFR-003] wrong password and unknown email show the identical message and 401 body", async ({
  page,
  request,
}) => {
  const u = await signupApi(request);
  await uiLogin(page, u.email, newSecret());
  const first = page.getByRole("alert");
  await expect(first).toContainText(GENERIC);
  const textA = (await first.textContent())?.trim();

  await uiLogin(page, uniqueEmail(), newSecret());
  await expect(page.getByRole("alert")).toContainText(GENERIC);
  const textB = (await page.getByRole("alert").textContent())?.trim();
  expect(textA).toBe(textB);
  await expect(page).toHaveURL(/\/login/);

  const a = await request.post(`${API}/auth/login`, {
    data: { email: u.email, password: newSecret() },
  });
  const b = await request.post(`${API}/auth/login`, {
    data: { email: uniqueEmail(), password: newSecret() },
  });
  expect(a.status()).toBe(401);
  expect(b.status()).toBe(401);
  expect(await a.json()).toEqual(await b.json());
  expect((await a.json()).detail).toBe(GENERIC);
});

test("[AC-008][NFR-002] logout revokes the token, protected page redirects, second session stays valid", async ({
  page,
  request,
}) => {
  const u = await signupApi(request);
  const second = await request.post(`${API}/auth/login`, {
    data: { email: u.email, password: u.password },
  });
  expect(second.status()).toBe(200);
  const secondToken = (await second.json()).token as string;

  await uiLogin(page, u.email, u.password);
  await expect(page).toHaveURL(/\/for-you/);
  const oldToken = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(oldToken).toBeTruthy();

  await page
    .getByRole("button", { name: /log out/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login/);

  const me = await request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${oldToken}` },
  });
  expect(me.status()).toBe(401);

  await page.goto("/for-you");
  await expect(page).toHaveURL(/\/login/);

  const me2 = await request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${secondToken}` },
  });
  expect(me2.status()).toBe(200);
});

test("[AC-010][NFR-004] signed out, For you, Search and Upload redirect to login", async ({
  page,
}) => {
  for (const path of ["/for-you", "/search", "/admin-upload"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("[AC-010][NFR-004] signed out API calls return 401 and change nothing", async ({
  request,
}) => {
  const u = await signupApi(request);
  const auth = { Authorization: `Bearer ${u.token}` };
  const before = await (await request.get(`${API}/me/likes`, { headers: auth })).json();

  const movies = await request.get(`${API}/movies?limit=1`, { headers: auth });
  const movieId = movies.ok() ? (await movies.json()).items?.[0]?.id : undefined;
  expect(movieId).toBeTruthy();

  const like = await request.post(`${API}/movies/${movieId}/like`);
  const forYou = await request.get(`${API}/me/for-you`);
  const likes = await request.get(`${API}/me/likes`);
  expect(like.status()).toBe(401);
  expect(forYou.status()).toBe(401);
  expect(likes.status()).toBe(401);
  expect((await like.json()).detail).toBe("Not authenticated");

  const after = await (await request.get(`${API}/me/likes`, { headers: auth })).json();
  expect(after).toEqual(before);
});

test("[NFR-005] a viewer has no Upload entry and is refused the admin page", async ({
  page,
  request,
}) => {
  const u = await signupApi(request);
  await uiLogin(page, u.email, u.password);
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("link", { name: /upload/i })).toHaveCount(0);
  await page.goto("/admin-upload");
  await expect(page.getByRole("heading", { name: /upload/i })).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/admin-upload/);
});

test("[NFR-005] the bootstrap admin signs in and sees the Upload entry", async ({ page }) => {
  const { email, password } = adminCredentials();
  await uiLogin(page, email, password);
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("link", { name: /upload/i })).toBeVisible();
});

test("[AC-009][NFR-002] a revoked or unknown token sends the user to login with the expired notice", async ({
  page,
}) => {
  await page.goto("/login");
  await page.evaluate((t) => localStorage.setItem("session_token", t), randomUUID());
  await page.goto("/for-you");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("status")).toContainText("Your session has expired. Log in again.");
});
