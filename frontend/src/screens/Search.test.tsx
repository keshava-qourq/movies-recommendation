import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Search from "./Search";
import * as api from "@/lib/api";
import { setUser } from "@/lib/auth";

vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: vi.fn(),
}));
const apiFetch = vi.mocked(api.apiFetch);

const movie = (id: number, title: string, year: number) => ({
  id,
  title,
  year,
  genres: [],
  director: "",
  cast: [],
  plot: "",
});

function Loc() {
  const l = useLocation();
  return <p>at {l.pathname + l.search}</p>;
}

function setup() {
  render(
    <MemoryRouter initialEntries={["/search"]}>
      <Routes>
        <Route path="/search" element={<Search />} />
        <Route path="/movie-detail" element={<Loc />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  apiFetch.mockReset();
  api.setSessionToken(crypto.randomUUID());
  setUser(null);
});

describe("Search", () => {
  it("[AC-025] submitting Heat calls GET /movies?q=Heat and lists Heat", async () => {
    apiFetch.mockResolvedValueOnce({ items: [movie(1, "Alien", 1979)], total: 1 });
    setup();
    await screen.findByText("Alien");
    apiFetch.mockResolvedValueOnce({ items: [movie(2, "Heat", 1995)], total: 1 });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Title"), "HeAt");
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByRole("button", { name: /Heat, 1995/ })).toBeInTheDocument();
    const url = String(apiFetch.mock.calls[1][0]);
    expect(url).toMatch(/^\/movies\?/);
    expect(new URLSearchParams(url.split("?")[1]).get("q")).toBe("HeAt");
  });

  it("[AC-026] lists title and year, shows total and pages with Load more", async () => {
    apiFetch.mockResolvedValueOnce({ items: [movie(1, "Alien", 1979)], total: 2 });
    setup();
    expect(await screen.findByText("1979")).toBeInTheDocument();
    expect(screen.getByText(/Showing all 2 titles/)).toBeInTheDocument();
    apiFetch.mockResolvedValueOnce({ items: [movie(2, "Heat", 1995)], total: 2 });
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("1995")).toBeInTheDocument();
    const p = new URLSearchParams(String(apiFetch.mock.calls[1][0]).split("?")[1]);
    expect(p.get("limit")).toBe("100");
    expect(p.get("offset")).toBe("1");
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("[AC-027] shows No movies found when total is 0", async () => {
    apiFetch.mockResolvedValueOnce({ items: [], total: 0 });
    setup();
    expect(await screen.findByText("No movies found")).toBeInTheDocument();
  });

  it("[AC-027] a failed request shows an error, not No movies found", async () => {
    apiFetch.mockRejectedValueOnce(new api.ApiError(500, null));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not load/);
    expect(screen.queryByText("No movies found")).not.toBeInTheDocument();
  });

  it("[AC-028] makes no request without a session token", async () => {
    api.clearSessionToken();
    setup();
    await screen.findByText("Search movies");
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("[AC-026] a result opens the detail screen by numeric id", async () => {
    apiFetch.mockResolvedValueOnce({ items: [movie(7, "Heat", 1995)], total: 1 });
    setup();
    await userEvent.click(await screen.findByRole("button", { name: /Heat, 1995/ }));
    expect(await screen.findByText("at /movie-detail?movie=7")).toBeInTheDocument();
  });

  it("[AC-027] upload hint is hidden for non-admins", async () => {
    apiFetch.mockResolvedValue({ items: [], total: 0 });
    setup();
    await screen.findByText("No movies found");
    expect(screen.queryByText("upload movies")).not.toBeInTheDocument();
  });
});
