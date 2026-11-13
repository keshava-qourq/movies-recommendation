import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

test("[NFR-001] signup and /auth/me never return the password or a hash", async ({
  page,
  request,
}) => {
  const email = uniqueEmail();
  const secret = newSecret();
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(secret);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await me.text();
  expect(text).not.toContain(secret);
  expect(text).not.toContain("argon2");
  expect(text.toLowerCase()).not.toContain("hash");

  const admin = adminCredentials();
  const login = await request.post(`${API}/auth/login`, { data: admin });
  expect(login.status()).toBe(200);
  const body = await login.text();
  expect(body).not.toContain(admin.password);
  expect(body).not.toContain("argon2");
});

test("[NFR-010] the first admin exists once and the sample catalog has no duplicates", async ({
  request,
}) => {
  const admin = adminCredentials();
  const login = await request.post(`${API}/auth/login`, { data: admin });
  expect(login.status()).toBe(200);
  const { token } = await login.json();
  const res = await request.get(`${API}/movies?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.total).toBeGreaterThanOrEqual(40);
  const keys = body.items.map(
    (m: { title: string; year: number }) => `${m.title.trim().toLowerCase()}|${m.year}`,
  );
  expect(new Set(keys).size).toBe(keys.length);
});

test("[NFR-013] login and signup screens are English only", async ({ page }) => {
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    const text = await page.locator("body").innerText();
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]"));
  }
});
