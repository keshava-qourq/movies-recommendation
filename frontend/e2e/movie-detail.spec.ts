import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const APP = process.env.E2E_BASE_URL ?? "http://localhost:4173";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

async function signedInViewer(page: Page): Promise<void> {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(uniqueEmail());
  await page.locator("#signup-password").fill(newSecret());
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
}

async function openHeatFromSearch(page: Page): Promise<void> {
  await page.goto("/search");
  await page.locator("#movie-search").fill("heat");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("button", { name: /^Heat, \d{4}\./ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Heat");
}

test("[AC-029] opening a movie from search shows its details and a like control", async ({
  page,
}) => {
  await signedInViewer(page);
  await openHeatFromSearch(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/\(\d{4}\)/);
  await expect(page.getByText("Genres", { exact: true })).toBeVisible();
  await expect(page.getByText("Director", { exact: true })).toBeVisible();
  await expect(page.getByText("Cast", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Plot" })).toBeVisible();
  await expect(page.locator("button[aria-pressed]")).toBeVisible();
  await expect(page.locator("button[aria-pressed]")).toContainText(/like/i);
});

test("[AC-030] generated placeholder image, no third-party requests, no upload control", async ({
  page,
}) => {
  const allowed = new Set([new URL(APP).origin, new URL(API).origin]);
  const foreign: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (!/^https?:/.test(url)) return;
    const origin = new URL(url).origin;
    if (!allowed.has(origin)) foreign.push(url);
  });
  await signedInViewer(page);
  await openHeatFromSearch(page);
  await expect(page.getByRole("img", { name: "Generated artwork for Heat" }).first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(foreign).toEqual([]);
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /upload/i })).toHaveCount(0);
});

for (const id of ["999999999", "abc"]) {
  test(`[AC-031] /movie-detail?movie=${id} shows Movie not found`, async ({ page }) => {
    await signedInViewer(page);
    await page.goto(`/movie-detail?movie=${id}`);
    await expect(page.getByText("Movie not found")).toBeVisible();
    await expect(page.locator("button[aria-pressed]")).toHaveCount(0);
  });
}

test("[AC-029] Similar movies lists at most 10 and selecting one opens its detail page", async ({
  page,
}) => {
  await signedInViewer(page);
  await openHeatFromSearch(page);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  const items = page.getByRole("button", { name: /Open details$/ });
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(10);
  const label = (await items.first().getAttribute("aria-label")) ?? "";
  const title = label.replace(/ \(\d{4}\), rank.*$/, "");
  expect(title.length).toBeGreaterThan(0);
  await items.first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
});

test("[NFR-013] the movie not found message screen is English only", async ({ page }) => {
  await signedInViewer(page);
  await page.goto("/movie-detail?movie=abc");
  await expect(page.getByText("Movie not found")).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]"));
});
