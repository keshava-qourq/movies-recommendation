// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.

import React from "react";

import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { apiFetch, ApiError, setSessionToken, type AuthResponse } from "@/lib/api";
import { getNotice, setNotice, setUser } from "@/lib/auth";

const PRODUCT = "Movies recommendation";

export default function Screen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [notice] = React.useState(() => {
    const n = getNotice();
    setNotice(null);
    return n;
  });
  const rule = `2px solid ${brand.primaryColor}`;
  const field = { border: rule, borderRadius: brand.radius, height: 44 };

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      setSessionToken(res.token);
      setUser(res.user);
      navigate("for-you");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError("Enter a valid email address and your password.");
      } else {
        setError("Could not log in right now. Check your connection and try again.");
      }
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-white"
      style={{ color: brand.primaryColor, fontFamily: brand.fontBody }}
    >
      <header
        className="flex items-center justify-between px-10 py-5"
        style={{ borderBottom: rule }}
      >
        <p className="text-lg font-bold tracking-tight" style={{ fontFamily: brand.fontHeading }}>
          {PRODUCT}
        </p>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">WatchNext</p>
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,440px)]">
        <main className="flex flex-col justify-center px-10 py-12">
          <h1
            data-wf="b-0-0"
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: brand.fontHeading }}
          >
            Log in to WatchNext
          </h1>
          <p className="mt-2 text-sm" style={{ color: brand.neutralColor }}>
            Log in with your email and password.
          </p>
          {notice ? (
            <p role="status" className="mt-4 text-sm font-semibold">
              {notice}
            </p>
          ) : null}
          <form data-wf="b-1-0" aria-label="Log in" className="mt-10 space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="corp-email"
                className="block text-[11px] font-bold uppercase tracking-[0.16em]"
              >
                Email
              </label>
              <input
                data-wf="i-1-0-0"
                id="corp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white px-3 text-sm outline-none focus:ring-2"
                style={field}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label
                  htmlFor="corp-password"
                  className="block text-[11px] font-bold uppercase tracking-[0.16em]"
                >
                  Password
                </label>
              </div>
              <input
                data-wf="i-1-0-1"
                id="corp-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white px-3 text-sm outline-none focus:ring-2"
                style={field}
              />
            </div>
            <button
              data-wf="b-2-0"
              type="submit"
              disabled={busy}
              className="h-11 w-full text-sm font-bold uppercase tracking-[0.16em] text-white"
              style={{ backgroundColor: brand.primaryColor, borderRadius: brand.radius }}
            >
              Log in
            </button>
          </form>
          {error ? (
            <p
              data-wf="b-3-0"
              role="alert"
              className="mt-4 text-sm font-semibold"
              style={{ color: brand.accentColor }}
            >
              {error}
            </p>
          ) : null}
          <button
            data-wf="b-4-0"
            type="button"
            onClick={() => navigate("signup")}
            className="mt-6 self-start text-sm font-semibold underline"
          >
            New here? Create an account
          </button>
        </main>
      </div>
    </div>
  );
}
