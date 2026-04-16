import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentModal from "../components/PaymentModal";
import PremiumBadge from "../components/PremiumBadge";
import { useAuth } from "../context/AuthContext";
import { fetchPlans } from "../lib/api";

const normalizePlan = (plan) => ({
  ...plan,
  label:
    plan.label ??
    (plan.price === 0
      ? "Free"
      : `Rs. ${plan.price} / ${plan.billing === "year" ? "year" : "month"}`),
  color:
    plan.color ??
    (plan.id === "annual"
      ? "border-amber-500/60"
      : plan.id === "monthly"
        ? "border-teal-500/60"
        : "border-white/10"),
  accent:
    plan.accent ??
    (plan.id === "annual" ? "#f59e0b" : plan.id === "monthly" ? "#14b8a6" : "#94a3b8"),
  features: plan.features ?? plan.perks ?? [],
  locked: plan.locked ?? [],
});

const fallbackPlans = [
  {
    id: "free",
    name: "Explorer",
    price: 0,
    label: "Free",
    color: "border-white/10",
    accent: "#94a3b8",
    features: [
      "Browse all landmarks",
      "Basic landmark info",
      "Crowd level indicators",
      "Friend activity feed",
      "3 bookings per month",
    ],
    locked: ["AR audio guide", "PDF ticket download", "Priority booking", "Concert discounts"],
  },
  {
    id: "monthly",
    name: "Premium",
    price: 299,
    label: "Rs. 299 / month",
    color: "border-teal-500/60",
    accent: "#14b8a6",
    badge: "Most Popular",
    features: [
      "Everything in Explorer",
      "AR audio guide",
      "PDF ticket download",
      "Priority booking",
      "10% discount on concerts",
      "Unlimited bookings",
    ],
    locked: [],
  },
  {
    id: "annual",
    name: "Premium Annual",
    price: 1999,
    label: "Rs. 1,999 / year",
    color: "border-amber-500/60",
    accent: "#f59e0b",
    badge: "Best Value",
    features: [
      "Everything in Premium",
      "10% discount on concerts",
      "Exclusive annual badge",
      "Priority support",
    ],
    locked: [],
  },
];

function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState(fallbackPlans.map(normalizePlan));
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState("");
  const hasActivePlan = user?.role === "traveler" && user?.isPremium;

  useEffect(() => {
    fetchPlans()
      .then((response) => setPlans(response.map(normalizePlan)))
      .catch(() => {});
  }, []);

  const handleBuy = (plan) => {
    setError("");

    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    if (user.role === "content-manager") {
      setError("Pricing plans are for travelers only. Content creator accounts are free.");
      return;
    }
    if (plan.id === "free") return;
    setSelectedPlan(plan);
  };

  return (
    <main className="section-shell py-16">
      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-teal-300/80">Pricing</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
          Travel Smarter with Premium
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Unlock audio guides, concert discounts, and unlimited bookings. Guests can view plans,
          but only traveler accounts can purchase them.
        </p>
        {user?.isPremium ? (
          <div className="mt-6 inline-flex items-center gap-3 rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3">
            <PremiumBadge plan={user.premiumPlan} size="md" />
            <span className="text-sm text-teal-100">Your pass is active.</span>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {hasActivePlan ? (
        <section className="mx-auto mt-12 max-w-3xl rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-100/80">Already Included</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-white">
            Your current plan already includes this feature set
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-emerald-50/90">
            Pricing options are hidden because your premium membership is active. That means your
            traveler account already gets the booking perks, audio guide access, and automatic
            concert discount support whenever eligible events appear.
          </p>
        </section>
      ) : (
        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex flex-col rounded-lg border ${plan.color} bg-slate-900/70 p-7`}
            >
              {plan.badge ? (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500 px-4 py-1 text-xs font-bold text-white">
                  {plan.badge}
                </span>
              ) : null}
              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="mt-3 text-3xl font-black" style={{ color: plan.accent }}>
                {plan.price === 0 ? "Free" : `Rs. ${plan.price}`}
              </p>
              <p className="mt-1 text-sm text-slate-400">{plan.label ?? ""}</p>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature}>+ {feature}</li>
                ))}
                {plan.locked?.map((feature) => (
                  <li key={feature} className="text-slate-500 line-through">
                    - {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleBuy(plan)}
                disabled={Boolean(user?.isPremium && plan.id !== "free")}
                className="mt-6 rounded-lg bg-white px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
              >
                {user?.isPremium && plan.id !== "free"
                  ? "Current Plan"
                  : plan.id === "free"
                    ? "Included"
                    : `Get ${plan.name}`}
              </button>
            </article>
          ))}
        </section>
      )}

      <section className="mx-auto mt-12 max-w-2xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <p className="text-lg font-bold text-amber-300">Concert Discount</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          Premium members get 10% off concert and live-event bookings automatically at checkout.
        </p>
      </section>

      {selectedPlan ? <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} /> : null}
    </main>
  );
}

export default PricingPage;
