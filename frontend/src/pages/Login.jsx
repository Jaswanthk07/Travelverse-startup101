import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login(formData);
      navigate(
        redirectTo ??
          (user.role === "content-manager" ? "/dashboard/content" : "/dashboard/traveler"),
        { replace: true }
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="section-shell flex min-h-[calc(100vh-145px)] items-center justify-center py-16">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.22),rgba(2,6,23,0.82))] p-10 shadow-glow lg:block">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-100/75">
            Welcome Back
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-white">
            Step back into your next immersive journey.
          </h1>
          <p className="mt-6 max-w-md text-base leading-8 text-slate-300">
            Access your demo account, test the scan simulation, and continue
            exploring landmark stories built for TravelVerse MVP validation.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-sky-400/20 via-cyan-300/10 to-amber-300/20 blur-2xl" />
          <form
            onSubmit={handleSubmit}
            className="glass-panel relative rounded-[2rem] border-white/15 p-8 shadow-glow sm:p-10"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-sky-100/75">
              Login
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold text-white">
              Continue to Dashboard
            </h2>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/70 focus:bg-white/15"
                  placeholder="traveler@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({ ...formData, password: event.target.value })
                  }
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/70 focus:bg-white/15"
                  placeholder="Enter your password"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-6 py-3 text-base font-bold text-slate-950 transition hover:-translate-y-1 hover:shadow-glow"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-300">
              Don&apos;t have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-sky-200 transition hover:text-white"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default Login;
