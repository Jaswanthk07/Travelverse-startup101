import { Link } from 'react-router-dom'
import ExpansionCities from '../components/ExpansionCities'
import HeroSection from '../components/HeroSection'
import LandmarkCard from '../components/LandmarkCard'
import StudentPricing from '../components/StudentPricing'
import { useAuth } from '../context/AuthContext'
import { useLandmarks } from '../context/LandmarksContext'

const features = [
  {
    title: 'Fast AR Scan',
    description:
      'Point your camera at a landmark and get a simulated detection result in under two seconds.',
  },
  {
    title: 'Live Crowd + Booking',
    description:
      'Check hourly crowd levels, pick the best time to visit, and book event tickets inside the app.',
  },
  {
    title: 'Regional Offline Guides',
    description:
      'Use short guides, Telugu and Hindi audio modes, shareable badges, and saved content packs.',
  },
  {
    title: 'Creator Control Room',
    description:
      'Content creators add monuments, launch events, and watch live demand, scans, and check-ins in one flow.',
  },
]

function Home() {
  const { landmarks } = useLandmarks()
  const { user } = useAuth()

  return (
    <main>
      <HeroSection />

      <section className="pb-20" id="about">
        <div className="section-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="glass-panel rounded-[2rem] p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-100/80">
              About TravelVerse
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold text-white">
              An AR-powered travel companion for educational tourism
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              TravelVerse helps tourists scan landmarks and instantly access
              historical stories through images, text, and audio. This MVP is
              designed for assignment demos and early user validation.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Scan", "Recognize landmarks through a simulated AR flow."],
              ["Learn", "Read stories and interesting facts in context."],
              ["Listen", "Play simple audio narration for each landmark."],
              ["Validate", "Capture feedback, scans, and page views."],
            ].map(([title, copy]) => (
              <div key={title} className="glass-panel rounded-[1.5rem] p-6 shadow-soft">
                <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 pt-4" id="features">
        <div className="section-shell">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200/70">
              Features
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-white">
              A startup-style MVP built around delight and clarity
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="glass-panel rounded-[1.75rem] p-7 shadow-soft transition duration-300 hover:-translate-y-2 hover:border-white/20"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/25 to-amber-300/20 text-xl font-bold text-sky-100">
                  0{index + 1}
                </div>
                <h3 className="font-display text-2xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20" id="landmarks">
        <div className="section-shell">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">
                Featured Landmarks
              </p>
              <h2 className="mt-3 font-display text-4xl font-bold text-white">
                Test immersive stories across iconic destinations
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-slate-300">
              These cards demonstrate how TravelVerse can preview landmark
              stories before a tourist begins scanning in the real-world
              product.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {landmarks.map((landmark) => (
              <LandmarkCard key={landmark.id} landmark={landmark} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="section-shell grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded-[1.75rem] p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
              For Content Creators
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-white">
              Publish monuments, push events, and monitor live traction
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Add monuments', 'New landmarks are created from the content dashboard and appear on the live traveler side.'],
                ['Launch events', 'Concerts, heritage festivals, and special entries can be added for each monument.'],
                ['Live tracking', 'Scans, bookings, sessions, and check-ins feed the analytics view in real time.'],
                ['Faster updates', 'Creators are not limited to the original seeded monuments anymore.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[1.75rem] p-8 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">
              Traveler Access
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-white">
              Pricing and passes are traveler-only
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              Travelers can log in, activate a pass, and use fake RuPay demo payments. Premium
              travelers automatically get 10% off concert events and see their pass status in the
              dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!user ? (
                <Link
                  to="/login"
                  className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Login First
                </Link>
              ) : user.role === 'traveler' ? (
                <Link
                  to="/dashboard/traveler"
                  className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Open Traveler Dashboard
                </Link>
              ) : (
                <Link
                  to="/creator"
                  className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Open Creator Dashboard
                </Link>
              )}
              <Link
                to="/pricing"
                className="rounded-lg border border-sky-300/30 bg-sky-300/10 px-5 py-3 text-sm font-semibold text-sky-100"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ExpansionCities />

      <StudentPricing />

      {user && user.role === 'traveler' && !user.isPremium ? (
        <section className="pb-16">
          <div className="section-shell">
            <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 p-6 text-center">
              <p className="text-lg font-bold text-white">Unlock Premium</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Get 10% concert discounts, audio guides, and premium booking access.
              </p>
              <Link
                to="/pricing"
                className="mt-5 inline-flex rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold text-white"
              >
                View Premium Plans
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="pb-24">
        <div className="section-shell">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-sky-400/15 via-white/10 to-amber-300/15 p-8 shadow-glow sm:p-12">
            <div className="absolute -left-12 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-sky-300/20 blur-3xl" />
            <div className="absolute -right-8 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
            <p className="text-sm uppercase tracking-[0.35em] text-sky-100/80">
              Call To Action
            </p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold text-white sm:text-5xl">
              Turn passive sightseeing into an interactive cultural experience
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200">
              Launch the dashboard, simulate the scan flow, and use this MVP to
              collect feedback from your first 10 test users.
            </p>
            {!user ? (
              <Link
                to="/signup"
                className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
              >
                Explore the MVP
              </Link>
            ) : user.role === 'traveler' ? (
              <Link
                to="/dashboard/traveler"
                className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
              >
                Open Traveler Dashboard
              </Link>
            ) : (
              <Link
                to="/creator"
                className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
              >
                Open Creator Dashboard
              </Link>
            )}
            <Link
              to="/pricing"
              className="mt-8 ml-3 inline-flex rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
