import { Link } from "react-router-dom";
import PremiumBadge from "../components/PremiumBadge";
import { useAuth } from "../context/AuthContext";

const planLabels = {
  monthly: "Premium Monthly (Rs. 299/month)",
  annual: "Premium Annual (Rs. 1,999/year)",
};

function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <main className="section-shell py-12">
      <div className="mx-auto max-w-lg">
        <section className="rounded-lg border border-white/10 bg-slate-900/70 p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-teal-600 text-3xl font-bold text-white">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-300">
              {user.role}
            </span>
            {user.isPremium ? <PremiumBadge plan={user.premiumPlan} size="sm" /> : null}
          </div>
        </section>

        {user.isPremium ? (
          <section className="mt-6 rounded-lg border border-teal-500/30 bg-teal-500/10 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Premium Status</h2>
              <PremiumBadge plan={user.premiumPlan} size="md" />
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan</span>
                <span className="font-medium text-white">
                  {planLabels[user.premiumPlan] ?? user.subscription?.planName ?? "Premium"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member since</span>
                <span className="font-medium text-white">
                  {user.premiumSince
                    ? new Date(user.premiumSince).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Just activated"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Concert discount</span>
                <span className="font-bold text-amber-300">10% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pass code</span>
                <span className="font-medium text-teal-200">
                  {user.subscription?.passCode ?? "Premium active"}
                </span>
              </div>
            </div>
          </section>
        ) : user.role === "traveler" ? (
          <section className="mt-6 rounded-lg border border-white/10 bg-slate-900/70 p-6 text-center">
            <p className="text-sm text-slate-300">
              Upgrade to unlock audio guides, concert discounts, and premium booking perks.
            </p>
            <Link
              to="/pricing"
              className="mt-5 inline-flex rounded-lg bg-teal-500 px-5 py-3 font-bold text-white"
            >
              View Premium Plans
            </Link>
          </section>
        ) : null}

        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full rounded-lg bg-slate-800 px-4 py-3 font-medium text-slate-200"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}

export default ProfilePage;
