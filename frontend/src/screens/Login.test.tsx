import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Login from "./Login";
import { clearSessionToken, getSessionToken } from "@/lib/api";
import { getUser } from "@/lib/auth";

const fetchMock = vi.fn();
const reply = (status: number, body: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

async function submit() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/for-you" element={<p>For you page</p>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "a@b.co");
  await user.type(screen.getByLabelText("Password"), crypto.randomUUID());
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  clearSessionToken();
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("Login", () => {
  it("[AC-006] stores the token and user and goes to For you", async () => {
    const token = crypto.randomUUID();
    reply(200, { token, user: { id: 1, email: "a@b.co", role: "viewer" } });
    await submit();
    expect(await screen.findByText("For you page")).toBeInTheDocument();
    expect(getSessionToken()).toBe(token);
    expect(getUser()?.id).toBe(1);
  });

  it("[AC-007] shows one generic message on 401 and does not navigate", async () => {
    reply(401, { detail: "Invalid email or password" });
    await submit();
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.queryByText("For you page")).not.toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
  });

  it("[AC-007] shows a specific message on 422", async () => {
    reply(422, { detail: [{ loc: ["body", "email"], msg: "bad", type: "value_error" }] });
    await submit();
    expect(await screen.findByText(/Enter a valid email address/)).toBeInTheDocument();
  });
});
