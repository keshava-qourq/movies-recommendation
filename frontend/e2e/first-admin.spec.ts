import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function uiSignup(page: Page, email: string, secret: string) {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(secret);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
}

test("[AC-011][NFR-005] the first admin signs in on the login screen and sees Upload movies", async ({
  page,
  request,
}) => {
  // adminCredentials() throws when the BOOTSTRAP_ADMIN_* settings are absent: the test fails, never skips.
  const { email, password } = adminCredentials();
  await page.goto("/login");
  await page.locator("#corp-email").fill(email);
  await page.locator("#corp-password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("link", { name: "Upload movies" })).toBeVisible();

  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  const me = await request.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  expect(me.status()).toBe(200);
  expect((await me.json()).role).toBe("admin");
});

test("[AC-014][NFR-005] a signup viewer has no Upload movies item and /admin-upload redirects to For you", async ({
  page,
  request,
}) => {
  await uiSignup(page, uniqueEmail(), newSecret());
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page.getByRole("link", { name: "Upload movies" })).toHaveCount(0);

  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  const auth = { Authorization: `Bearer ${token}` };
  const before = await (await request.get(`${API}/movies?limit=1`, { headers: auth })).json();

  await page.goto("/admin-upload");
  await expect(page).toHaveURL(/\/for-you/);
  await expect(page).not.toHaveURL(/\/admin-upload/);

  const after = await (await request.get(`${API}/movies?limit=1`, { headers: auth })).json();
  expect(after.total).toBe(before.total);
});

test("[AC-014][NFR-005] a signed-out visit to /admin-upload ends on the login screen", async ({
  page,
}) => {
  await page.goto("/admin-upload");
  await expect(page).toHaveURL(/\/login/);
});

test("[AC-015][NFR-005] signup creates a viewer, never an admin", async ({ page }) => {
  await uiSignup(page, uniqueEmail(), newSecret());
  await expect(page).toHaveURL(/\/for-you/);
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  const me = await page.request.get(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect((await me.json()).role).toBe("viewer");
});

test("[AC-014][NFR-005] a viewer who signed up on screen is refused an upload with 403 and a signed-out caller gets 401", async ({
  page,
  request,
}) => {
  await uiSignup(page, uniqueEmail(), newSecret());
  await expect(page).toHaveURL(/\/for-you/);
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeTruthy();
  const auth = { Authorization: `Bearer ${token}` };
  const before = await (await request.get(`${API}/movies?limit=1`, { headers: auth })).json();

  const file = {
    name: "movies.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      `title,year,genres,director,cast,plot\nQA ${randomUUID().slice(0, 8)},2001,Drama,Dir,Actor,Plot\n`,
    ),
  };
  const viewer = await request.post(`${API}/admin/movies/upload`, {
    headers: auth,
    multipart: { file },
  });
  expect(viewer.status()).toBe(403);
  expect((await viewer.json()).detail).toBe("Admin access required");

  const anon = await request.post(`${API}/admin/movies/upload`, { multipart: { file } });
  expect(anon.status()).toBe(401);

  const after = await (await request.get(`${API}/movies?limit=1`, { headers: auth })).json();
  expect(after.total).toBe(before.total);
});
