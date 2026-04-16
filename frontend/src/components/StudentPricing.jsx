import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPlans } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const fallbackPlans = [
  {
    id: "free",
    name: "Explorer",
    price: 0,
    billing: "month",
    audience: "Guests and casual travelers",
    role: "traveler",
    perks: ["Browse all landmarks", "Friend activity feed", "3 bookings per month"],
  },
  {
    id: "monthly",
    name: "Premium",
    price: 299,
    billing: "month",
    audience: "Travelers who want full access",
    role: "traveler",
    perks: ["Audio guides", "Priority booking", "10% concert discount"],
  },
];

function StudentPricing() {
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState(fallbackPlans);
  const hasActivePlan = user?.role === "traveler" && user?.isPremium;

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((fetchError) => console.warn("Plans unavailable:", fetchError.message));
  }, []);

  return (
    <section className="pb-20" id="pricing">
      <div className="section-shell">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-lime-100/80">
              Traveler Pricing
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-white">
              Buy passes only after traveler login
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Travelers can unlock premium access with a fake RuPay demo payment. Content creators
              and admins keep their management tools without a paid pass.
            </p>
          </div>
          {user?.role === "traveler" && user?.subscription?.status === "active" ? (
            <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-5 py-4 text-sm text-emerald-100">
              <p className="font-semibold">{user.subscription.planName} active</p>
              <p className="mt-1">
                Pass {user.subscription.passCode} • Concert bookings get 10% off.
              </p>
            </div>
          ) : (
            <Link
              to={isAuthenticated ? "/dashboard/traveler" : "/login"}
              className="inline-flex rounded-lg border border-lime-300/30 bg-lime-300/10 px-5 py-3 text-sm font-semibold text-lime-100"
            >
              {isAuthenticated ? "Open Traveler Dashboard" : "Login for Pricing"}
            </Link>
          )}
        </div>

        {hasActivePlan ? (
          <div className="rounded-[1.5rem] border border-emerald-300/25 bg-emerald-300/10 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-100/80">
              Already Included
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold text-white">
              Your current plan already covers this
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-emerald-50/90">
              You already have premium access, so pricing options are hidden here. Your plan keeps
              concert discounts, premium booking access, and traveler perks active whenever you book
              upcoming events.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {plans.map((plan) => (
                <article key={plan.id} className="glass-panel rounded-[1.5rem] p-6 shadow-soft">
                  <p className="text-sm text-slate-300">{plan.audience}</p>
                  <h3 className="mt-2 font-display text-3xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-4 text-4xl font-bold text-lime-100">
                    Rs. {plan.price}
                    <span className="text-base font-medium text-slate-300">/{plan.billing}</span>
                  </p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-300">
                    {plan.perks.map((perk) => (
                      <li key={perk}>✓ {perk}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-6 rounded-lg bg-gradient-to-r from-lime-300 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {plan.id === "free" ? "Included" : "View on Pricing Page"}
                  </button>
                </article>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to={!isAuthenticated ? "/login?redirect=/pricing" : "/pricing"}
                className="inline-flex rounded-lg border border-teal-500/30 bg-teal-500/10 px-5 py-3 text-sm font-semibold text-teal-100"
              >
                Open Full Pricing Page
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default StudentPricing;
