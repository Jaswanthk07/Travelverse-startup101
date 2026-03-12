import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
];

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="section-shell flex flex-wrap items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-amber-300 shadow-glow">
            <span className="font-display text-lg font-bold text-slate-950">
              TV
            </span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-white">
              TravelVerse
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
              AR Travel MVP
            </p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto md:order-2 md:w-auto md:justify-center">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                Signup
              </NavLink>
            </>
          ) : null}
        </nav>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{user?.name ?? "Traveler"}</p>
              <p className="text-xs text-slate-400">
                {user?.role === "content-manager" ? "Content Creator" : "Traveler"} • {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-rose-300/30 bg-rose-300/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:-translate-y-0.5 hover:bg-rose-300/20"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/signup"
            className="rounded-full border border-sky-300/30 bg-sky-400/15 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-300/20"
          >
            Start Exploring
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
