import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CrowdStatus from "./CrowdStatus";

function LandmarkCard({ landmark, compact = false }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const bullets = useMemo(() => {
    const facts = Array.isArray(landmark.interestingFacts)
      ? landmark.interestingFacts
      : [];

    return [landmark.shortDescription, ...facts].filter(Boolean);
  }, [landmark]);
  const visibleBullets = isExpanded ? bullets : bullets.slice(0, compact ? 2 : 3);

  return (
    <article className="group glass-panel overflow-hidden rounded-lg shadow-soft transition duration-300 hover:-translate-y-2 hover:border-sky-300/30 hover:shadow-glow">
      <div className={`relative overflow-hidden ${compact ? "h-48" : "h-60"}`}>
        <div
          className={`absolute inset-0 bg-gradient-to-br from-slate-800 via-sky-900/50 to-slate-950 transition-opacity duration-500 ${
            isImageLoaded ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={landmark.image}
          alt={landmark.name}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${
            isImageLoaded ? "blur-0" : "scale-105 blur-lg"
          }`}
        />
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">
              {landmark.name}
            </h3>
            <p className="mt-1 text-sm text-slate-300">{landmark.location}</p>
          </div>
          <span className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
            {landmark.type ?? landmark.badge ?? "heritage"}
          </span>
        </div>

        <ul className="space-y-2 text-sm leading-6 text-slate-300">
          {visibleBullets.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {bullets.length > visibleBullets.length || isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="mt-3 text-sm font-semibold text-sky-200"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        ) : null}

        {!compact ? <div className="mt-5"><CrowdStatus landmarkId={landmark.id} compact /></div> : null}

        <Link
          to={`/landmark/${landmark.id}`}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
        >
          Explore
        </Link>
      </div>
    </article>
  );
}

export default LandmarkCard;
