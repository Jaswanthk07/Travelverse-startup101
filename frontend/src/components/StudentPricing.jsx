import { useEffect, useState } from "react";
import { fetchPlans } from "../lib/api";

const fallbackPlans = [
  {
    id: "student",
    name: "Student Pass",
    price: 49,
    billing: "month",
    audience: "College students",
    perks: ["Regional audio", "Offline packs", "Visit badges"],
  },
];

function StudentPricing() {
  const [plans, setPlans] = useState(fallbackPlans);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch((error) => console.warn("Plans unavailable:", error.message));
  }, []);

  return (
    <section className="pb-20">
      <div className="section-shell">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-lime-100/80">
            Student Pricing
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-white">
            Affordable passes for college trips
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="glass-panel rounded-[1.5rem] p-6 shadow-soft"
            >
              <p className="text-sm text-slate-300">{plan.audience}</p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-white">
                {plan.name}
              </h3>
              <p className="mt-4 text-4xl font-bold text-lime-100">
                Rs. {plan.price}
                <span className="text-base font-medium text-slate-300">
                  /{plan.billing}
                </span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {plan.perks.map((perk) => (
                  <li key={perk}>✓ {perk}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StudentPricing;
