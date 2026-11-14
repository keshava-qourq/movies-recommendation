import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Login from "./Login";
import Signup from "./Signup";
import { clearSessionToken, getSessionToken } from "@/lib/api";

const fetchMock = vi.fn();

function setup(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/for-you" element={<p>For you page</p>} />
      </Routes>
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

describe("no reset or verification", () => {
  it("[AC-015] login page has no reset or verification text, links or calls", () => {
    setup("/login");
    expect(document.body.textContent).not.toMatch(/forgot|reset|verif|confirm/i);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("[AC-015] signup page has no reset or verification text, links or calls", () => {
    setup("/signup");
    expect(document.body.textContent).not.toMatch(/forgot|reset|verif|confirm/i);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("[AC-016] signup signs in from the response token and goes to For you", async () => {
    const token = crypto.randomUUID();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ token, user: { id: 6, email: "n@b.co", role: "viewer" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    setup("/signup");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "n@b.co");
    await user.type(screen.getByLabelText(/^Password/), crypto.randomUUID());
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await waitFor(() => expect(getSessionToken()).toBe(token));
    expect(await screen.findByText("For you page")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/auth\/signup$/);
  });
});
