import { Link } from 'react-router-dom'

function LandmarkCard({ landmark, compact = false }) {
  return (
    <article className="group glass-panel overflow-hidden rounded-[1.75rem] shadow-soft transition duration-300 hover:-translate-y-2 hover:border-sky-300/30 hover:shadow-glow">
      <div className={`overflow-hidden ${compact ? 'h-48' : 'h-60'}`}>
        <img
          src={landmark.image}
          alt={landmark.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold text-white">
              {landmark.name}
            </h3>
            <p className="mt-1 text-sm text-slate-300">{landmark.location}</p>
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
            {landmark.badge}
          </span>
        </div>

        <p className="text-sm leading-7 text-slate-300">
          {landmark.shortDescription.slice(0, 160)}...
        </p>

        <Link
          to={`/landmark/${landmark.id}`}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
        >
          Explore
        </Link>
      </div>
    </article>
  )
}

export default LandmarkCard
