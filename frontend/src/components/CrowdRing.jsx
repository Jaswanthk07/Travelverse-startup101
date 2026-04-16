const levelColors = {
  Low: "#34d399",
  Moderate: "#fbbf24",
  High: "#fb7185",
};

function CrowdRing({ crowd, size = "md" }) {
  const percentage = Math.min(100, Math.max(0, Number(crowd?.percentage) || 0));
  const color = levelColors[crowd?.level] ?? levelColors.Moderate;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const dimensions = size === "sm" ? "h-20 w-20" : "h-28 w-28";

  return (
    <div className={`relative ${dimensions} shrink-0`} aria-label={`${percentage}% crowd`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96" role="img">
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="9"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-xl font-bold text-white">{percentage}%</span>
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-300">
          {crowd?.level ?? "Live"}
        </span>
      </div>
    </div>
  );
}

export default CrowdRing;
