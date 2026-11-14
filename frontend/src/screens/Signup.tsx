// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.

import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { apiFetch, ApiError, setSessionToken, type AuthResponse } from "@/lib/api";
import { setUser } from "@/lib/auth";

const { Button, Input, Label } = UI;

const TAKEN_MESSAGE =
  "An account already exists for this email. Log in instead, or use a different address.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Screen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [touched, setTouched] = React.useState({ email: false, password: false });
  const [submitted, setSubmitted] = React.useState(false);
  const [status, setStatus] = React.useState("idle"); // idle | creating | done

  const ink = brand.primaryColor;
  const muted = brand.neutralColor;
  const accent = brand.accentColor;
  const font = brand.fontBody;

  const trimmed = email.trim();
  const [server, setServer] = React.useState({ taken: false, email: "", password: "", other: "" });
  const taken = server.taken;

  let emailError = "";
  if (!trimmed) emailError = "Enter your email address.";
  else if (!EMAIL_RE.test(trimmed))
    emailError = "That email is missing something. Use the form name@example.com.";

  let passwordError = "";
  if (!password) passwordError = "Enter a password of at least 8 characters.";
  else if (password.length < 8)
    passwordError =
      "Password is " +
      password.length +
      " character" +
      (password.length === 1 ? "" : "s") +
      " long. It needs at least 8.";

  const showEmailError =
    (taken ? TAKEN_MESSAGE : "") || server.email || ((touched.email || submitted) && emailError);
  const showPasswordError = server.password || ((touched.password || submitted) && passwordError);
  const shownEmailText = taken ? TAKEN_MESSAGE : server.email || emailError;
  const shownPasswordText = server.password || passwordError;
  const busy = status !== "idle";

  React.useEffect(() => {
    if (status !== "done") return undefined;
    const t = setTimeout(() => navigate("for-you"), 500);
    return () => clearTimeout(t);
  }, [status]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setServer({ taken: false, email: "", password: "", other: "" });
    if (emailError || passwordError) return;
    setStatus("creating");
    try {
      const res = await apiFetch<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: trimmed, password }),
      });
      setSessionToken(res.token);
      setUser(res.user);
      setStatus("done");
    } catch (err) {
      const next = { taken: false, email: "", password: "", other: "" };
      if (err instanceof ApiError && err.status === 409) {
        next.taken = true;
      } else if (err instanceof ApiError && err.status === 422 && Array.isArray(err.detail)) {
        err.detail.forEach((d) => {
          const field = d.loc && d.loc[d.loc.length - 1];
          if (field === "email") next.email = next.email || d.msg;
          else if (field === "password") next.password = next.password || d.msg;
          else next.other = next.other || d.msg;
        });
      } else {
        next.other = "Something went wrong. Nothing was created. Try again.";
      }
      setServer(next);
      setStatus("idle");
    }
  }

  const fieldStyle = (hasError) => ({
    height: 40,
    width: "100%",
    border: "2px solid " + (hasError ? accent : ink),
    borderRadius: 2,
    padding: "0 12px",
    fontFamily: font,
    fontSize: 14,
    color: ink,
    backgroundColor: brand.backgroundColor,
  });

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: ink,
    marginBottom: 8,
  };

  const errorStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.4,
    color: accent,
    fontWeight: 600,
  };

  const meetsLength = password.length >= 8;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: brand.backgroundColor,
        color: ink,
        fontFamily: font,
      }}
    >
      <style>{`
        .wn-focus:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
        .wn-btn { transition: background-color 120ms linear, color 120ms linear; }
        .wn-btn:hover:not(:disabled) { background-color: ${accent} !important; border-color: ${accent} !important; }
        .wn-link { transition: color 120ms linear; }
        .wn-link:hover { color: ${accent}; }
        @keyframes wn-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .wn-msg { animation: wn-in 160ms ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .wn-btn, .wn-link { transition: none; }
          .wn-msg { animation: none; }
        }
      `}</style>

      <div
        className="mx-auto w-full px-4 sm:px-8"
        style={{ maxWidth: 1040, paddingTop: 24, paddingBottom: 64 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingBottom: 12,
            borderBottom: "2px solid " + ink,
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 16, height: 16, backgroundColor: ink, display: "inline-block" }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            WatchNext
          </span>
        </div>

        <main className="grid grid-cols-12" style={{ columnGap: 24, paddingTop: 48 }}>
          <div className="col-span-12" data-wf="b-0-0" style={{ marginBottom: 48 }}>
            <h1
              style={{
                fontSize: 40,
                lineHeight: 1.1,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                margin: 0,
                fontFamily: brand.fontHeading,
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 16,
                lineHeight: 1.5,
                color: muted,
                maxWidth: 560,
              }}
            >
              Your likes are saved to your account, so “For you” gets better every time you come
              back.
            </p>
          </div>

          <div className="col-span-12 md:col-span-6">
            <form
              id="signup-form"
              data-wf="b-1-0"
              noValidate
              onSubmit={handleSubmit}
              aria-labelledby="signup-heading"
              style={{ borderTop: "2px solid " + ink, paddingTop: 16 }}
            >
              <h2
                id="signup-heading"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  margin: "0 0 24px",
                  color: muted,
                }}
              >
                Sign up
              </h2>

              <div style={{ marginBottom: 24 }}>
                <Label htmlFor="signup-email" style={labelStyle}>
                  Email
                </Label>
                <Input
                  id="signup-email"
                  data-wf="i-1-0-0"
                  className="wn-focus"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  disabled={busy}
                  placeholder="name@example.com"
                  aria-invalid={showEmailError ? "true" : "false"}
                  aria-describedby={
                    showEmailError ? "signup-email-error signup-help" : "signup-help"
                  }
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  style={fieldStyle(showEmailError)}
                />
                {showEmailError ? (
                  <div id="signup-email-error" className="wn-msg" style={errorStyle}>
                    <span
                      aria-hidden="true"
                      style={{ flex: "none", marginTop: 1, display: "inline-flex" }}
                    >
                      <Icons.AlertCircle size={16} />
                    </span>
                    <span>
                      {shownEmailText}
                      {taken ? (
                        <>
                          {" "}
                          <button
                            type="button"
                            className="wn-focus"
                            onClick={() => navigate("login")}
                            style={{
                              color: accent,
                              textDecoration: "underline",
                              fontWeight: 700,
                              background: "none",
                              border: 0,
                              padding: 0,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: "inherit",
                            }}
                          >
                            Go to log in
                          </button>
                        </>
                      ) : null}
                    </span>
                  </div>
                ) : null}
              </div>

              <div style={{ marginBottom: 8 }}>
                <Label htmlFor="signup-password" style={labelStyle}>
                  Password (at least 8 characters)
                </Label>
                <Input
                  id="signup-password"
                  data-wf="i-1-0-1"
                  className="wn-focus"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={busy}
                  aria-invalid={showPasswordError ? "true" : "false"}
                  aria-describedby={
                    showPasswordError ? "signup-password-error signup-count" : "signup-count"
                  }
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  style={fieldStyle(showPasswordError)}
                />
                {showPasswordError ? (
                  <div id="signup-password-error" className="wn-msg" style={errorStyle}>
                    <span
                      aria-hidden="true"
                      style={{ flex: "none", marginTop: 1, display: "inline-flex" }}
                    >
                      <Icons.AlertCircle size={16} />
                    </span>
                    <span>{shownPasswordText}</span>
                  </div>
                ) : null}
              </div>

              <div
                id="signup-count"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: meetsLength ? ink : muted,
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: meetsLength ? 700 : 400,
                  marginBottom: 24,
                }}
              >
                {meetsLength ? (
                  <span aria-hidden="true" style={{ display: "inline-flex" }}>
                    <Icons.Check size={16} />
                  </span>
                ) : null}
                <span>
                  {password.length} / 8 characters{meetsLength ? " — long enough" : ""}
                </span>
              </div>
            </form>
          </div>

          <div className="col-span-12 md:col-span-6" />

          <div className="col-span-12 md:col-span-6" style={{ marginTop: 0 }}>
            <Button
              type="submit"
              form="signup-form"
              data-wf="b-2-0"
              className="wn-btn wn-focus"
              disabled={busy}
              style={{
                width: "100%",
                height: 44,
                backgroundColor: ink,
                color: brand.backgroundColor,
                border: "2px solid " + ink,
                borderRadius: 2,
                fontFamily: font,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.04em",
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.85 : 1,
              }}
            >
              {status === "creating"
                ? "Creating your account…"
                : status === "done"
                  ? "Account created"
                  : "Sign up"}
            </Button>

            <div aria-live="polite" role="status" style={{ minHeight: 0 }}>
              {status === "done" ? (
                <div
                  className="wn-msg"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <span aria-hidden="true" style={{ display: "inline-flex" }}>
                    <Icons.CheckCircle size={16} />
                  </span>
                  Account created with the viewer role. Taking you to For you…
                </div>
              ) : null}
              {server.other ? (
                <div role="alert" style={{ ...errorStyle, marginTop: 12 }}>
                  {server.other}
                </div>
              ) : null}
            </div>
          </div>
          <div className="col-span-12 md:col-span-6" />

          <div className="col-span-12 md:col-span-6" style={{ marginTop: 24 }}>
            <p
              id="signup-help"
              data-wf="b-3-0"
              style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: muted }}
            >
              Enter a valid email. Password must be at least 8 characters.
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.5, color: muted }}>
              You are signed in as soon as the account exists.
            </p>
          </div>
          <div className="col-span-12 md:col-span-6" />

          <div className="col-span-12 md:col-span-6" style={{ marginTop: 24 }}>
            <div style={{ borderTop: "2px solid " + ink, paddingTop: 16 }}>
              <button
                type="button"
                data-wf="b-4-0"
                className="wn-link wn-focus"
                disabled={busy}
                onClick={() => navigate("login")}
                style={{
                  background: "none",
                  border: 0,
                  padding: "8px 0",
                  fontFamily: font,
                  fontSize: 14,
                  color: ink,
                  cursor: busy ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                Already have an account?{" "}
                <span
                  style={{ fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  Log in
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
