import React from "react";
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";

import { apiFetch, getSessionToken, setUnauthorizedHandler, type AuthUser } from "@/lib/api";
import { SESSION_EXPIRED_NOTICE, logout, setNotice, setUser } from "@/lib/auth";

import { Icons } from "@/lib/icons";
import Login from "@/screens/Login";
import Signup from "@/screens/Signup";
import ForYou from "@/screens/ForYou";
import Search from "@/screens/Search";
import MovieDetail from "@/screens/MovieDetail";
import AdminUpload from "@/screens/AdminUpload";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-[var(--brand-radius)] px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-[var(--brand-hover)] text-[var(--brand-fg)]" : "text-[var(--brand-fg-muted)]",
  ].join(" ");

// The app's menu, drawn around every screen except the ones routed outside it below.
function AppShellLayout({ user }: { user: AuthUser }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--brand-surface)",
          borderColor: "var(--brand-border)",
        }}
      >
        <div className="flex items-center gap-6 px-6 py-2">
          <p
            className="shrink-0 text-sm font-semibold"
            style={{ fontFamily: "var(--brand-font-heading)" }}
          >
            {"WatchNext"}
          </p>
          <nav aria-label="App menu" className="flex flex-wrap items-center gap-1">
            <NavLink to="/for-you" className={navLinkClass}>
              {"For you"}
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              <Icons.Search size={16} />
              {"Search"}
            </NavLink>
            {user.role === "admin" ? (
              <NavLink to="/admin-upload" className={navLinkClass}>
                <Icons.Plus size={16} />
                {"Upload movies"}
              </NavLink>
            ) : null}
            <button
              type="button"
              className={navLinkClass({ isActive: false })}
              onClick={() => logout().then(() => navigate("/login", { replace: true }))}
            >
              {"Log out"}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Keeps signed-out users off the pages: no token redirects at once, a token is checked with /auth/me.
function RequireAuth() {
  const [user, setGuardUser] = React.useState<AuthUser | null>(null);
  const [rejected, setRejected] = React.useState(false);
  const hasToken = getSessionToken() !== null;

  React.useEffect(() => {
    if (!hasToken) return;
    let live = true;
    apiFetch<AuthUser>("/auth/me")
      .then((me) => {
        if (!live) return;
        setUser(me);
        setGuardUser(me);
      })
      .catch(() => {
        if (live) setRejected(true);
      });
    return () => {
      live = false;
    };
  }, [hasToken]);

  if (!hasToken || rejected) return <Navigate to="/login" replace />;
  if (!user) return null;
  return <AppShellLayout user={user} />;
}

export default function App() {
  const navigate = useNavigate();
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setNotice(SESSION_EXPIRED_NOTICE);
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/for-you" element={<ForYou />} />
        <Route path="/search" element={<Search />} />
        <Route path="/movie-detail" element={<MovieDetail />} />
        <Route path="/admin-upload" element={<AdminUpload />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
