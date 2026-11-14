import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

function uniqueEmail(): string {
  return `e2e-${randomUUID().slice(0, 12)}@example.com`;
}
function newSecret(): string {
  return `${randomUUID().replace(/-/g, "").slice(0, 16)}Aa1`;
}

test("[AC-015] login and signup offer no reset or verification option and send no email request", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (req) => requests.push(req.url()));
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toMatch(/forgot|reset|verify|verification|confirm your email|resend/);
    await expect(page.getByRole("link", { name: /forgot|reset|verif/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /forgot|reset|verif|resend/i })).toHaveCount(0);
  }
  expect(
    requests.filter((u) => /email|reset|verif|forgot|mail/i.test(new URL(u).pathname)),
  ).toEqual([]);
});

test("[AC-015] signing up makes no reset, verify or email API call", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (req.url().startsWith(API)) calls.push(new URL(req.url()).pathname);
  });
  await page.goto("/signup");
  await page.locator("#signup-email").fill(uniqueEmail());
  await page.locator("#signup-password").fill(newSecret());
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
  expect(calls.filter((p) => /reset|verif|forgot|mail/i.test(p))).toEqual([]);
});

test("[AC-016][NFR-013] a new account uses the app immediately with no verification step", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.locator("#signup-email").fill(uniqueEmail());
  await page.locator("#signup-password").fill(newSecret());
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
  const text = (await page.locator("body").innerText()).toLowerCase();
  expect(text).not.toMatch(/verify|verification|check your (email|inbox)/);

  await page.goto("/search");
  await page.locator("#movie-search").fill("heat");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Heat, \d{4}\./ }).first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});
