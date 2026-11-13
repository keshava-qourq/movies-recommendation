import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Signup from "./Signup";
import { getSessionToken, clearSessionToken } from "@/lib/api";
import { getUser } from "@/lib/auth";

const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function setup() {
  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/for-you" element={<p>For you page</p>} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fill(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText(/^Password/), password);
  await user.click(screen.getByRole("button", { name: "Sign up" }));
  return user;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  clearSessionToken();
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("Signup", () => {
  it("[AC-001] stores the token and user and goes to For you on 201", async () => {
    const token = crypto.randomUUID();
    reply(201, { token, user: { id: 5, email: "a@b.co", role: "viewer" } });
    setup();
    await fill("a@b.co", "longenough");
    expect(await screen.findByText(/Account created with the viewer role/)).toBeInTheDocument();
    expect(getSessionToken()).toBe(token);
    expect(getUser()).toEqual({ id: 5, email: "a@b.co", role: "viewer" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.co", password: "longenough" });
    expect(init.credentials).toBeUndefined();
    expect(await screen.findByText("For you page")).toBeInTheDocument();
  });

  it("[AC-002] shows the taken message and Go to log in on 409", async () => {
    reply(409, { detail: "Email already registered" });
    setup();
    const user = await fill("a@b.co", "longenough");
    expect(await screen.findByText(/An account already exists for this email/)).toBeInTheDocument();
    expect(screen.queryByText(/Account created/)).not.toBeInTheDocument();
    expect(getSessionToken()).toBeNull();
    await user.click(screen.getByRole("button", { name: "Go to log in" }));
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("[AC-003] maps a 422 by loc to the email and password fields", async () => {
    reply(422, {
      detail: [
        { loc: ["body", "email"], msg: "Bad email from server", type: "value_error" },
        { loc: ["body", "password"], msg: "Bad password from server", type: "value_error" },
      ],
    });
    setup();
    await fill("a@b.co", "longenough");
    expect(await screen.findByText("Bad email from server")).toBeInTheDocument();
    expect(screen.getByText("Bad password from server")).toBeInTheDocument();
    expect(screen.queryByText(/Account created/)).not.toBeInTheDocument();
  });

  it("[AC-003] validates on the client and sends no request", async () => {
    setup();
    await fill("not-an-email", "short");
    await waitFor(() => expect(screen.getByText(/missing something/)).toBeInTheDocument());
    expect(screen.getByText(/It needs at least 8/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("[AC-003] shows specific messages for empty fields", async () => {
    setup();
    await fill("", "");
    expect(screen.getByText("Enter your email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a password of at least 8 characters.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
