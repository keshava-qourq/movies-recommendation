import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { adminCredentials } from "./support/admin";

const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const APP = process.env.E2E_BASE_URL ?? "http://localhost:4173";
const ALLOWED = new Set([new URL(APP).origin, new URL(API).origin]);
const HEADER = "title,year,genres,director,cast,plot";
const NON_ENGLISH = new RegExp("[^\\s\\u0021-\\u007E\\u00A0-\\u024F\\u2000-\\u206F]");

function isWeb(url: string): boolean {
  return /^(https?|wss?):/i.test(url);
}
function foreignOf(urls: string[]): string[] {
  return urls.filter((u) => isWeb(u) && !ALLOWED.has(new URL(u).origin));
}

function watch(page: Page) {
  const urls: string[] = [];
  const fonts: string[] = [];
  page.on("request", (req) => {
    urls.push(req.url());
    if (req.resourceType() === "font" && isWeb(req.url()) && !ALLOWED.has(new URL(req.url()).origin))
      fonts.push(req.url());
  });
  page.on("response", (res) => urls.push(res.url()));
  return { urls, fonts };
}

async function block(page: Page): Promise<string[]> {
  const aborted: string[] = [];
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (isWeb(url) && !ALLOWED.has(new URL(url).origin)) {
      aborted.push(url);
      await route.abort();
    } else {
      await route.continue();
    }
  });
  return aborted;
}

// Every third-party http(s) reference in stylesheets and script/link/img attributes of the page.
async function domRefs(page: Page): Promise<string[]> {
  const refs: string[] = await page.evaluate(() => {
    const out: string[] = [];
    const add = (v: string | null | undefined) => {
      if (v && /^(https?:)?\/\//i.test(v.trim())) out.push(new URL(v.trim(), location.href).href);
    };
    document.querySelectorAll("script[src], img[src], source[src]").forEach((e) =>
      add(e.getAttribute("src")),
    );
    document.querySelectorAll("link[href]").forEach((e) => add(e.getAttribute("href")));
    for (const sheet of Array.from(document.styleSheets)) {
      add(sheet.href);
      let text = "";
      try {
        text = Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join("\n");
      } catch {
        continue;
      }
      for (const m of text.matchAll(/url\(\s*["']?(https?:\/\/[^"')\s]+)/gi)) add(m[1]);
      for (const m of text.matchAll(/@import\s+(?:url\()?\s*["']?(https?:\/\/[^"')\s;]+)/gi))
        add(m[1]);
    }
    return out;
  });
  return refs.filter((u) => !ALLOWED.has(new URL(u).origin));
}

async function adminLogin(page: Page): Promise<void> {
  const { email, password } = adminCredentials();
  await page.goto("/login");
  await page.locator("#corp-email").fill(email);
  await page.locator("#corp-password").fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/for-you/);
}

async function search(page: Page, text: string) {
  await page.goto("/search");
  await page.locator("#movie-search").fill(text);
  await page.getByRole("button", { name: "Search", exact: true }).click();
}

async function openHeat(page: Page) {
  await search(page, "heat");
  await page
    .getByRole("button", { name: /^Heat, \d{4}\./ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Heat");
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
}

async function upload(page: Page) {
  const s = randomUUID().replace(/-/g, "").slice(0, 10);
  const csv = `${HEADER}\nSc ${s},2001,Drama|Crime${s},Dir ${s},Actor${s},Plot ${s}\n`;
  await page.goto("/admin-upload");
  await page.locator("#csv-file").setInputFiles({
    name: "m.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.getByRole("button", { name: /^Upload$/ }).click();
  await expect(page.getByRole("group", { name: /^Added: 1$/ })).toBeVisible();
}

// All flows of AC-021 and AC-022 as the admin; returns the DOM audit findings.
async function allFlows(page: Page): Promise<string[]> {
  const refs: string[] = [];
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    await settle(page);
    refs.push(...(await domRefs(page)));
  }
  await adminLogin(page);
  await settle(page);
  refs.push(...(await domRefs(page)));

  await search(page, "heat");
  await expect(page.getByRole("button", { name: /^Heat, \d{4}\./ }).first()).toBeVisible();
  await settle(page);
  refs.push(...(await domRefs(page)));

  await openHeat(page);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open details$/ }).first()).toBeVisible();
  const like = page.locator("button[aria-pressed]");
  await settle(page);
  if ((await like.getAttribute("aria-pressed")) === "true") {
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "false");
  }
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await settle(page);
  refs.push(...(await domRefs(page)));
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "false");
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");

  await page.goto("/for-you");
  await expect(page.locator("section[aria-labelledby=rec-h] ol li").first()).toBeVisible();
  await settle(page);
  refs.push(...(await domRefs(page)));

  await upload(page);
  await settle(page);
  refs.push(...(await domRefs(page)));
  return refs;
}

test("[AC-021][NFR-009] every request on every page goes to the SPA or API origin and no font comes from elsewhere", async ({
  page,
}) => {
  const seen = watch(page);
  await allFlows(page);
  expect(seen.urls.some((u) => u.startsWith(new URL(API).origin))).toBe(true);
  expect(foreignOf(seen.urls)).toEqual([]);
  expect(seen.fonts).toEqual([]);
});

test("[AC-021][NFR-009] no stylesheet, script, link or image references a third-party host", async ({
  page,
}) => {
  const refs = await allFlows(page);
  expect(refs).toEqual([]);
});

test("[AC-022][NFR-009] search, similar, like and unlike, For you and upload contact only the SPA and API hosts", async ({
  page,
}) => {
  const seen = watch(page);
  await adminLogin(page);
  await search(page, "heat");
  await openHeat(page);
  await expect(page.getByRole("heading", { name: "Similar movies" })).toBeVisible();
  const like = page.locator("button[aria-pressed]");
  await settle(page);
  if ((await like.getAttribute("aria-pressed")) === "true") {
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "false");
  }
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "false");
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await page.goto("/for-you");
  await expect(page.locator("section[aria-labelledby=rec-h] ol li").first()).toBeVisible();
  await upload(page);
  await settle(page);
  const hosts = new Set(seen.urls.filter(isWeb).map((u) => new URL(u).host));
  const allowedHosts = new Set([...ALLOWED].map((o) => new URL(o).host));
  expect([...hosts].filter((h) => !allowedHosts.has(h))).toEqual([]);
  expect(hosts.has(new URL(API).host)).toBe(true);
});

test("[NFR-009][AC-021][AC-022] with all other hosts aborted every flow still works and nothing was blocked", async ({
  page,
}) => {
  const aborted = await block(page);
  const refs = await allFlows(page);
  expect(refs).toEqual([]);
  expect(aborted).toEqual([]);
});

test("[NFR-013] the pages visited in the self-contained flows are English only", async ({ page }) => {
  await adminLogin(page);
  for (const path of ["/for-you", "/search", "/admin-upload"]) {
    await page.goto(path);
    await settle(page);
    expect(await page.locator("body").innerText()).not.toMatch(NON_ENGLISH);
  }
});
