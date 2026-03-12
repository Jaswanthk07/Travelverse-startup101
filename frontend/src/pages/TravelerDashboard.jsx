import { useEffect, useState } from "react";
import LandmarkCard from "../components/LandmarkCard";
import ScannerModal from "../components/ScannerModal";
import { useAuth } from "../context/AuthContext";
import { useLandmarks } from "../context/LandmarksContext";
import { getStatsSummary, trackEvent } from "../lib/api";

function TravelerDashboard() {
  const { user } = useAuth();
  const { landmarks, isLoading } = useLandmarks();
  const [query, setQuery] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [stats, setStats] = useState({
    scans: 0,
    landmarkViews: 0,
    feedbackResponses: 0,
    eventBookings: 0,
  });

  useEffect(() => {
    getStatsSummary().then(setStats);
  }, []);

  const filteredLandmarks = landmarks.filter((landmark) => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return (
      landmark.name.toLowerCase().includes(term) ||
      landmark.location.toLowerCase().includes(term)
    );
  });

  const handleScanOpen = async () => {
    setIsScannerOpen(true);
    await trackEvent({
      type: "scan",
      landmarkId: filteredLandmarks[0]?.id ?? "taj-mahal",
      userEmail: user?.email ?? "",
    });
    setStats((current) => ({ ...current, scans: current.scans + 1 }));
  };

  return (
    <main className="section-shell py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-400/10 via-white/5 to-amber-300/10 p-8 shadow-glow sm:p-10">
        <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-amber-300/15 blur-3xl" />
        <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">
          Traveler Dashboard
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
          Welcome Traveler
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Search landmarks, scan a location, explore educational stories, and
          leave feedback for the TravelVerse MVP.
        </p>
        <p className="mt-4 text-sm text-sky-100/80">
          Logged in as {user?.name} ({user?.email})
        </p>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full max-w-xl">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Search landmark...
              </span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Taj Mahal, Delhi, Hyderabad..."
                className="w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/70 focus:bg-white/15"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleScanOpen}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-8 py-4 text-base font-bold text-slate-950 transition hover:-translate-y-1 hover:shadow-glow"
          >
            Scan Landmark
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Scans", stats.scans],
            ["Landmark Views", stats.landmarkViews],
            ["Feedback Responses", stats.feedbackResponses],
            ["Event Bookings", stats.eventBookings],
          ].map(([label, value]) => (
            <div key={label} className="glass-panel rounded-[1.5rem] p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-100/70">{label}</p>
              <p className="mt-3 font-display text-4xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
              Featured Landmarks
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">
              Explore landmarks
            </h2>
          </div>
          <p className="hidden text-sm text-slate-400 sm:block">
            {filteredLandmarks.length} landmark
            {filteredLandmarks.length === 1 ? "" : "s"} found
          </p>
        </div>

        {isLoading ? (
          <div className="glass-panel rounded-[1.5rem] p-8 text-slate-300">
            Loading landmarks...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {filteredLandmarks.map((landmark) => (
              <LandmarkCard key={landmark.id} landmark={landmark} />
            ))}
          </div>
        )}

        {!isLoading && filteredLandmarks.length === 0 ? (
          <div className="glass-panel mt-6 rounded-[1.5rem] p-8 text-center text-slate-300">
            No landmarks match your search. Try a city name like Delhi or Hyderabad.
          </div>
        ) : null}
      </section>

      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </main>
  );
}

export default TravelerDashboard;
