import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { clearSessionToken, getSessionToken, setSessionToken } from "@/lib/api";
import { getUser } from "@/lib/auth";

const fetchMock = vi.fn();
const reply = (status: number, body?: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

function setup(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  clearSessionToken();
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("[AC-010] redirects to login without a token and renders no page", () => {
    setup("/for-you");
    expect(screen.getByRole("heading", { name: "Log in to WatchNext" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("[AC-010] validates the token with /auth/me and shows the page", async () => {
    setSessionToken(crypto.randomUUID());
    reply(200, { id: 1, email: "a@b.co", role: "viewer" });
    setup("/for-you");
    expect((await screen.findAllByText("For you")).length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls[0][0]).toContain("/auth/me");
    expect(screen.queryByText("Upload movies")).not.toBeInTheDocument();
  });

  it("[AC-009] a 401 from /auth/me redirects to login with the expiry notice", async () => {
    setSessionToken(crypto.randomUUID());
    reply(401, { detail: "Not authenticated" });
    setup("/search");
    expect(await screen.findByText("Your session has expired. Log in again.")).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-010] shows Upload movies only for admins", async () => {
    setSessionToken(crypto.randomUUID());
    reply(200, { id: 1, email: "a@b.co", role: "admin" });
    setup("/for-you");
    expect(await screen.findByText("Upload movies")).toBeInTheDocument();
  });

  it("[AC-008] logout clears the token even when the call fails", async () => {
    setSessionToken(crypto.randomUUID());
    reply(200, { id: 1, email: "a@b.co", role: "viewer" });
    setup("/search");
    const user = userEvent.setup();
    await screen.findByRole("navigation", { name: "App menu" });
    fetchMock.mockRejectedValueOnce(new Error("network"));
    await user.click(screen.getAllByRole("button", { name: "Log out" })[0]);
    expect(await screen.findByRole("heading", { name: "Log in to WatchNext" })).toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
    expect(getUser()).toBeNull();
  });
});
