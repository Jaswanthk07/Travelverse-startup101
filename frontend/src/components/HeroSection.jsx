import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import heroOrb from '../assets/hero-orb.svg'

function HeroSection() {
  const { user } = useAuth()
  const isGuest = !user
  const primaryCta =
    user?.role === 'content-manager'
      ? { to: '/creator', label: 'Open Creator Dashboard' }
      : user?.role === 'traveler'
        ? { to: '/dashboard/traveler', label: 'Open Traveler Dashboard' }
        : { to: '/signup', label: 'Start Exploring' }

  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pb-24 sm:pt-20">
      <div className="section-shell grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative z-10 animate-fadeUp">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-sky-100 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            AR-powered storytelling for modern tourism
          </div>

          <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            TravelVerse
            <span className="mt-3 block text-gradient">
              Making Tourism Educational, Engaging & Rewarding
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Scan landmarks, unlock layered stories, and turn every city walk
            into an immersive learning experience with visuals, audio, and
            location-based discovery.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to={primaryCta.to}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-7 py-4 text-base font-bold text-slate-950 shadow-glow transition hover:-translate-y-1"
            >
              {primaryCta.label}
            </Link>
            {isGuest ? (
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
              >
                Create Demo Account
              </Link>
            ) : null}
          </div>

          <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
            {[
              ['50+', 'story moments designed'],
              ['3', 'immersive landmark demos'],
              ['1 tap', 'from scan to story'],
            ].map(([value, label]) => (
              <div key={label} className="glass-panel rounded-3xl p-5 shadow-soft">
                <p className="font-display text-3xl font-bold text-white">
                  {value}
                </p>
                <p className="mt-2 text-sm text-slate-300">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-float">
          <div className="absolute inset-0 -translate-x-4 translate-y-5 rounded-[2rem] bg-gradient-to-br from-sky-400/25 to-amber-300/15 blur-3xl" />
          <div className="glass-panel relative overflow-hidden rounded-[2rem] p-4 shadow-glow">
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-300/80" />
              <span className="h-3 w-3 rounded-full bg-amber-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-300/80" />
            </div>
            <img
              src={heroOrb}
              alt="Stylized travel interface preview"
              className="w-full rounded-[1.5rem] object-cover"
            />
            <div className="absolute bottom-10 left-8 right-8 rounded-[1.5rem] border border-white/20 bg-slate-950/60 p-5 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.32em] text-sky-200/70">
                Live Scan Preview
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-white">
                Historical story layers appear in seconds
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Image cards, voice narration, and contextual facts designed for
                tourist testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
