import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "traveler",
};

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "role") {
        return;
      }

      if (!value.trim()) {
        nextErrors[key] = "This field is required.";
      }
    });

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      navigate("/login");
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (key, value) => {
    setFormData({ ...formData, [key]: value });
    setErrors({ ...errors, [key]: "" });
  };

  return (
    <main className="section-shell flex min-h-[calc(100vh-145px)] items-center justify-center py-16">
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-amber-300/20 via-sky-300/10 to-cyan-300/20 blur-2xl" />
        <form
          onSubmit={handleSubmit}
          className="glass-panel relative rounded-[2rem] p-8 shadow-glow sm:p-10"
          noValidate
        >
          <p className="text-sm uppercase tracking-[0.35em] text-amber-100/80">
            Signup
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold text-white">
            Create your TravelVerse account
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This signup flow validates required fields so you can use it in MVP
            user testing immediately.
          </p>

          {formError ? (
            <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {formError}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              ['name', 'Name', 'Your full name', 'text'],
              ['email', 'Email', 'traveler@example.com', 'email'],
              ['password', 'Password', 'Choose a secure password', 'password'],
              [
                'confirmPassword',
                'Confirm Password',
                'Re-enter your password',
                'password',
              ],
            ].map(([key, label, placeholder, type]) => (
              <label
                key={key}
                className={`${key === 'name' || key === 'email' ? 'sm:col-span-2' : ''}`}
              >
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  {label}
                </span>
                <input
                  type={type}
                  value={formData[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-white outline-none transition placeholder:text-slate-400 ${
                    errors[key]
                      ? 'border-rose-300/60 bg-rose-300/10'
                      : 'border-white/15 bg-white/10 focus:border-sky-300/70 focus:bg-white/15'
                  }`}
                  placeholder={placeholder}
                />
                {errors[key] ? (
                  <span className="mt-2 block text-sm text-rose-200">
                    {errors[key]}
                  </span>
                ) : null}
              </label>
            ))}
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-slate-200">Select Role</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["traveler", "Traveler", "Browse landmarks, scan, learn, and give feedback."],
                [
                  "content-manager",
                  "Content Creator",
                  "Add new landmarks, upload media, and manage location stories.",
                ],
              ].map(([value, label, copy]) => (
                <label
                  key={value}
                  className={`rounded-[1.5rem] border p-4 transition ${
                    formData.role === value
                      ? "border-sky-300/60 bg-sky-300/10"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={formData.role === value}
                      onChange={(event) => updateField("role", event.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-white">{label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{copy}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-amber-300 to-sky-300 px-6 py-3 text-base font-bold text-slate-950 transition hover:-translate-y-1 hover:shadow-glow"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>

          <p className="mt-6 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-sky-200 transition hover:text-white"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default Signup;
