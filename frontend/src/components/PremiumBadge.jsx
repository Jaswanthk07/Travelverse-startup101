function PremiumBadge({ plan, size = "sm" }) {
  if (!plan) return null;

  const isAnnual = plan === "annual";
  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${
        sizes[size]
      } ${
        isAnnual
          ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
          : "border-teal-500/40 bg-teal-500/15 text-teal-400"
      }`}
    >
      <span>{isAnnual ? "Crown" : "Star"}</span>
      <span>{isAnnual ? "Annual Member" : "Premium"}</span>
    </span>
  );
}

export default PremiumBadge;
