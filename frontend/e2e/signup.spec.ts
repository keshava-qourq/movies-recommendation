import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}

function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function fillSignup(page: Page, email: string, secret: string) {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(secret);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
}

test("[AC-001] new visitor signs up and lands signed in on For you", async ({ page }) => {
  await fillSignup(page, uniqueEmail(), newSecret());
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("button", { name: /log out/i }).first()).toBeVisible();
});

test("[AC-002][NFR-013][NFR-015] duplicate email in another letter case shows already-registered message", async ({
  page,
  request,
}) => {
  const email = uniqueEmail();
  const secret = newSecret();
  await fillSignup(page, email, secret);
  await expect(page).toHaveURL(/\/for-you/);
  await page.evaluate(() => localStorage.clear());

  await fillSignup(page, email.toUpperCase(), newSecret());
  await expect(page.locator("#signup-email-error")).toContainText(
    "An account already exists for this email",
  );
  await expect(page).toHaveURL(/\/signup/);

  const login = await request.post(`${API}/auth/login`, { data: { email, password: secret } });
  expect(login.status()).toBe(200);
});

test("[AC-003][NFR-015] invalid email shows a specific message and creates no account", async ({
  page,
  request,
}) => {
  const secret = newSecret();
  const bad = `not-an-email-${randomUUID().slice(0, 8)}`;
  await fillSignup(page, bad, secret);
  await expect(page.locator("#signup-email-error")).toContainText("name@example.com");
  await expect(page).toHaveURL(/\/signup/);
  const login = await request.post(`${API}/auth/login`, { data: { email: bad, password: secret } });
  expect([401, 422]).toContain(login.status());
});

test("[AC-003][NFR-015] 7-character password shows a specific message and creates no account", async ({
  page,
  request,
}) => {
  const email = uniqueEmail();
  const short = newSecret().slice(0, 7);
  await fillSignup(page, email, short);
  await expect(page.locator("#signup-password-error")).toContainText(
    "Password is 7 characters long. It needs at least 8.",
  );
  await expect(page).toHaveURL(/\/signup/);
  const login = await request.post(`${API}/auth/login`, { data: { email, password: short } });
  expect(login.status()).toBe(401);
});

test("[AC-004][NFR-005] signed-up user is a viewer with no Upload entry", async ({ page }) => {
  await fillSignup(page, uniqueEmail(), newSecret());
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("button", { name: /log out/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /upload/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /upload/i })).toHaveCount(0);

  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  const res = await page.request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).role).toBe("viewer");
});

test("[AC-004][NFR-005] signup request carrying role admin still yields viewer", async ({
  request,
}) => {
  const res = await request.post(`${API}/auth/signup`, {
    data: { email: uniqueEmail(), password: newSecret(), role: "admin" },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.user.role).toBe("viewer");
  const me = await request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${body.token}` },
  });
  expect((await me.json()).role).toBe("viewer");
});
