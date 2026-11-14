import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

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

async function search(page: Page, text: string) {
  await page.goto("/search");
  await page.locator("#movie-search").fill(text);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

test("[AC-025] searching heat and HEAT both list the movie Heat", async ({ page }) => {
  await signedInViewer(page);
  for (const text of ["heat", "HEAT"]) {
    await search(page, text);
    await expect(page.getByRole("button", { name: /^Heat, \d{4}\./ }).first()).toBeVisible();
  }
});

test("[AC-026] every movie whose title contains the text is listed with title and year", async ({
  page,
  request,
}) => {
  const token = await signedInViewer(page);
  const res = await request.get(`${API}/movies?q=heat&limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.total).toBeGreaterThan(0);

  await search(page, "heat");
  for (const m of body.items as { title: string; year: number }[]) {
    await expect(
      page.getByRole("button", { name: `${m.title}, ${m.year}. Open movie details` }),
    ).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /Open movie details/ })).toHaveCount(
    body.items.length,
  );
});

test("[AC-027] a nonsense string shows No movies found", async ({ page }) => {
  await signedInViewer(page);
  await search(page, `zzq${randomUUID().replace(/-/g, "")}`);
  await expect(page.getByText("No movies found")).toBeVisible();
  await expect(page.getByRole("button", { name: /Open movie details/ })).toHaveCount(0);
});

test("[AC-028][NFR-004] a signed-out visit to /search ends on the login screen", async ({
  page,
}) => {
  await page.goto("/search");
  await expect(page).toHaveURL(/\/login/);
});

test("[AC-025] clicking a result opens the movie detail page", async ({ page }) => {
  await signedInViewer(page);
  await search(page, "heat");
  await page
    .getByRole("button", { name: /^Heat, \d{4}\./ })
    .first()
    .click();
  await expect(page).not.toHaveURL(/\/search/);
  await expect(page).toHaveURL(/\/movie/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("[NFR-013] the search screen is English only", async ({ page }) => {
  await signedInViewer(page);
  await search(page, "heat");
  const text = await page.locator("body").innerText();
  expect(text).toContain("Search movies");
  expect(text).not.toMatch(new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]"));
});
