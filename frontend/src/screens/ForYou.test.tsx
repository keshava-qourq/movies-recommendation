import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ForYou from "./ForYou";
import * as api from "@/lib/api";

vi.mock("@/lib/api", async (orig) => ({
  ...(await orig<typeof import("@/lib/api")>()),
  apiFetch: vi.fn(),
}));
const apiFetch = vi.mocked(api.apiFetch);

const movie = (id: number, title: string) => ({
  id,
  title,
  year: 2000 + id,
  genres: ["Crime"],
  director: "Dir",
  cast: [],
  plot: "",
});

function Loc() {
  const l = useLocation();
  return <p>at {l.pathname + l.search}</p>;
}

function setup() {
  render(
    <MemoryRouter initialEntries={["/for-you"]}>
      <Routes>
        <Route path="/for-you" element={<ForYou />} />
        <Route path="/search" element={<Loc />} />
        <Route path="/movie-detail" element={<Loc />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => apiFetch.mockReset());

describe("ForYou", () => {
  it("[AC-051] no likes shows the prompt and no list, and Search movies goes to /search", async () => {
    apiFetch.mockImplementation(async (p: string) =>
      p === "/me/for-you" ? { items: [], has_likes: false } : { items: [] },
    );
    setup();
    expect(await screen.findByText(/No likes yet/)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Search movies" }));
    expect(await screen.findByText("at /search")).toBeInTheDocument();
  });

  it("[AC-047] shows the ranked list in server order and opens a movie", async () => {
    apiFetch.mockImplementation(async (p: string) =>
      p === "/me/for-you"
        ? {
            items: [
              { ...movie(5, "Zed"), score: 0.9 },
              { ...movie(2, "Alpha"), score: 0.4 },
            ],
            has_likes: true,
          }
        : { items: [movie(1, "Liked")] },
    );
    setup();
    const open = await screen.findAllByRole("button", { name: /^Open / });
    expect(open[0]).toHaveTextContent("Zed");
    expect(open[1]).toHaveTextContent("Alpha");
    expect(screen.getByText("Match 0.900")).toBeInTheDocument();
    await userEvent.click(open[0]);
    expect(await screen.findByText("at /movie-detail?movie=5")).toBeInTheDocument();
  });

  it("[AC-050] like and unlike call the API then reload", async () => {
    let likes: unknown[] = [movie(1, "Liked")];
    apiFetch.mockImplementation(async (p: string, init?: RequestInit) => {
      if (p === "/me/for-you")
        return { items: [{ ...movie(2, "Alpha"), score: 0.4 }], has_likes: likes.length > 0 };
      if (p === "/me/likes") return { items: likes };
      if (init?.method === "PUT") likes = [movie(2, "Alpha"), movie(1, "Liked")];
      if (init?.method === "DELETE") likes = [];
      return undefined;
    });
    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Like Alpha" }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith("/movies/2/like", { method: "PUT" }));
    expect(await screen.findByText(/Your likes \(2\)/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Unlike Liked/ }));
    expect(apiFetch).toHaveBeenCalledWith("/movies/1/like", { method: "DELETE" });
    expect(await screen.findByText(/No likes yet/)).toBeInTheDocument();
  });

  it("[AC-050] a failed like shows an error and keeps the list", async () => {
    apiFetch.mockImplementation(async (p: string, init?: RequestInit) => {
      if (init?.method === "PUT") throw new api.ApiError(500, null);
      return p === "/me/for-you"
        ? { items: [{ ...movie(2, "Alpha"), score: 0.4 }], has_likes: true }
        : { items: [movie(1, "Liked")] };
    });
    setup();
    await userEvent.click(await screen.findByRole("button", { name: "Like Alpha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not update/);
    expect(screen.getByRole("button", { name: "Like Alpha" })).toBeInTheDocument();
  });

  it("[AC-047] shows an error when loading fails", async () => {
    apiFetch.mockRejectedValueOnce(new api.ApiError(500, null));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not load/);
  });

  it("[AC-049] has_likes with no items shows the liked-everything state", async () => {
    apiFetch.mockImplementation(async (p: string) =>
      p === "/me/for-you" ? { items: [], has_likes: true } : { items: [movie(1, "Liked")] },
    );
    setup();
    expect(await screen.findByText(/You have liked everything we have/)).toBeInTheDocument();
  });
});
