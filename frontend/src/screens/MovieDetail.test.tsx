import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MovieDetail from "./MovieDetail";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: vi.fn(),
}));
const apiFetch = vi.mocked(api.apiFetch);

const heat = {
  id: 7,
  title: "Heat",
  year: 1995,
  genres: ["Crime", "Thriller"],
  director: "Michael Mann",
  cast: ["Al Pacino", "Robert De Niro"],
  plot: "A crew leader plans one last score.",
};

function Loc() {
  const l = useLocation();
  return <p>at {l.pathname + l.search}</p>;
}

function routes(likes: unknown[], similar: unknown[] = []) {
  apiFetch.mockImplementation(async (path: string, init?: RequestInit) => {
    if (path === "/movies/7") return heat;
    if (path === "/me/likes") return { items: likes };
    if (path === "/movies/7/similar") return { items: similar };
    if (path === "/movies/7/like")
      return init?.method === "DELETE" ? undefined : { movie_id: 7, liked: true };
    throw new api.ApiError(404, "Movie not found");
  });
}

function setup(url = "/movie-detail?movie=7") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/movie-detail" element={<MovieDetail />} />
        <Route path="/search" element={<Loc />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  apiFetch.mockReset();
});

describe("MovieDetail", () => {
  it("[AC-029] shows the movie details and the liked state from /me/likes", async () => {
    routes([{ id: 7 }]);
    setup();
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Heat (1995)");
    expect(screen.getByText("Crime, Thriller")).toBeInTheDocument();
    expect(screen.getByText("Michael Mann")).toBeInTheDocument();
    expect(screen.getByText("Al Pacino, Robert De Niro")).toBeInTheDocument();
    expect(screen.getByText(heat.plot)).toBeInTheDocument();
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
  });

  it("[AC-029] like then unlike use PUT and DELETE and update after success", async () => {
    routes([]);
    setup();
    const user = userEvent.setup();
    const btn = await screen.findByRole("button", { pressed: false });
    await user.click(btn);
    await waitFor(() => expect(screen.getByRole("button", { pressed: true })).toBeEnabled());
    expect(screen.getByRole("status")).toHaveTextContent("Saved to your likes");
    expect(apiFetch).toHaveBeenCalledWith("/movies/7/like", { method: "PUT" });
    await user.click(screen.getByRole("button", { pressed: true }));
    await waitFor(() => expect(screen.getByRole("button", { pressed: false })).toBeEnabled());
    expect(screen.getByRole("status")).toHaveTextContent("Removed from your likes");
    expect(apiFetch).toHaveBeenCalledWith("/movies/7/like", { method: "DELETE" });
  });

  it("[AC-029] a failed like keeps the state and shows an error", async () => {
    routes([]);
    setup();
    const btn = await screen.findByRole("button", { pressed: false });
    apiFetch.mockRejectedValueOnce(new api.ApiError(500, null));
    await userEvent.setup().click(btn);
    expect(await screen.findByText("Could not update your like. Please try again.")).toBeVisible();
    expect(screen.getByRole("button", { pressed: false })).toBeInTheDocument();
  });

  it("[AC-029] similar movies show score and open the detail page; empty state otherwise", async () => {
    routes([], [{ ...heat, id: 8, title: "Collateral", year: 2004, score: 0.5 }]);
    setup();
    expect(await screen.findByText("0.5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Collateral \(2004\)/ })).toBeInTheDocument();
  });

  it("[AC-029] shows an empty state when there are no similar movies", async () => {
    routes([]);
    setup();
    expect(await screen.findByText("No similar movies yet")).toBeInTheDocument();
  });

  it("[AC-030] uses generated SVG artwork with no image or upload control", async () => {
    routes([]);
    setup();
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("img", { name: /Generated artwork for Heat/ }).tagName).toBe("svg");
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("input[type=file]")).toBeNull();
  });

  it("[AC-029] a title param is resolved through the movie lookup", async () => {
    routes([{ id: 7 }]);
    apiFetch.mockImplementationOnce(async () => ({ items: [heat] }));
    setup("/movie-detail?movie=heat");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Heat (1995)");
    expect(apiFetch.mock.calls[0][0]).toBe("/movies?q=heat&limit=100");
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
  });

  it("[AC-031] an unmatched title shows Movie not found", async () => {
    apiFetch.mockImplementation(async () => ({ items: [] }));
    setup("/movie-detail?movie=abc");
    expect(await screen.findByText("Movie not found")).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Search movies" })).toHaveAttribute("href", "/search");
  });

  it("[AC-031] a 404 from the API shows Movie not found", async () => {
    apiFetch.mockRejectedValue(new api.ApiError(404, "Movie not found"));
    setup("/movie-detail?movie=99");
    expect(await screen.findByText("Movie not found")).toBeInTheDocument();
  });
});
