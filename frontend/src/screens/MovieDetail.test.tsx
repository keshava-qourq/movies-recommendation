import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MovieDetail from "./MovieDetail";

const fetchMock = vi.fn();
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function setup() {
  render(
    <MemoryRouter>
      <MovieDetail />
    </MemoryRouter>,
  );
}

const pressed = () => screen.getByRole("button", { pressed: undefined, name: /like/i });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("MovieDetail likes", () => {
  it("[AC-044] loads the initial liked state from /me/likes", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [{ title: "Heat" }, { title: "Other" }] }));
    setup();
    await waitFor(() =>
      expect(document.querySelector("button[aria-pressed]")).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(fetchMock.mock.calls[0][0]).toContain("/me/likes");
  });

  it("[AC-042][AC-043] like then unlike use PUT and DELETE and update the note", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [] }));
    setup();
    const user = userEvent.setup();
    const btn = () => document.querySelector("button[aria-pressed]") as HTMLElement;
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(btn()).toHaveAttribute("aria-pressed", "false");

    fetchMock
      .mockResolvedValueOnce(json(200, { items: [{ id: 7, title: "Heat", year: 1995 }] }))
      .mockResolvedValueOnce(json(204));
    await user.click(btn());
    await waitFor(() => expect(btn()).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByRole("status")).toHaveTextContent("Saved to your likes");
    expect(fetchMock.mock.calls[2][0]).toContain("/movies/7/like");
    expect(fetchMock.mock.calls[2][1].method).toBe("PUT");

    fetchMock
      .mockResolvedValueOnce(json(200, { items: [{ id: 7, title: "Heat", year: 1995 }] }))
      .mockResolvedValueOnce(json(204));
    await user.click(btn());
    await waitFor(() => expect(btn()).toHaveAttribute("aria-pressed", "false"));
    expect(screen.getByRole("status")).toHaveTextContent("Removed from your likes");
    expect(fetchMock.mock.calls[4][1].method).toBe("DELETE");
    expect(pressed).toBeDefined();
  });

  it("[AC-045] a double click sends one like request", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [] }));
    setup();
    const btn = document.querySelector("button[aria-pressed]") as HTMLElement;
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    let release: (r: Response) => void = () => {};
    fetchMock
      .mockReturnValueOnce(new Promise<Response>((res) => (release = res)))
      .mockResolvedValueOnce(json(204));
    await userEvent.setup().dblClick(btn);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    release(json(200, { items: [{ id: 7, title: "Heat", year: 1995 }] }));
    await waitFor(() => expect(btn).toHaveAttribute("aria-pressed", "true"));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("[AC-042] a failed request shows the error note", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { items: [] }));
    setup();
    const btn = document.querySelector("button[aria-pressed]") as HTMLElement;
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockResolvedValueOnce(json(500, { detail: "boom" }));
    await userEvent.setup().click(btn);
    expect(await screen.findByText("Could not update your like. Please try again.")).toBeVisible();
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });
});
