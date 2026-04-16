import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import FriendActivityFeed from "../components/FriendActivityFeed";
import LandmarkCard from "../components/LandmarkCard";
import ScannerModal from "../components/ScannerModal";
import SearchBar from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";
import { useLandmarks } from "../context/LandmarksContext";
import {
  fetchBookingHistory,
  getStatsSummary,
  searchLandmarks,
  trackEvent,
} from "../lib/api";
import { normalizeLandmarkMedia } from "../lib/landmarkMedia";

const emptyStats = {
  scans: 0,
  landmarkViews: 0,
  feedbackResponses: 0,
  eventBookings: 0,
  bookingStarts: 0,
  sessions: 0,
  totalBookings: 0,
  totalCheckIns: 0,
};

function TravelerDashboard() {
  const { user } = useAuth();
  const { landmarks, isLoading } = useLandmarks();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ city: "", type: "", crowd: "" });
  const [serverResults, setServerResults] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    getStatsSummary().then((response) => setStats({ ...emptyStats, ...response }));
    fetchBookingHistory()
      .then(setBookingHistory)
      .catch((error) => console.warn("Booking history unavailable:", error.message));
    trackEvent({
      type: "session_start",
      userEmail: user?.email ?? "",
      metadata: { surface: "traveler_dashboard" },
    });
  }, [user]);

  useEffect(() => {
    const hasServerFilter = query.trim() || filters.city || filters.type || filters.crowd;

    if (!hasServerFilter) {
      setServerResults(null);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      searchLandmarks({
        q: query,
        city: filters.city,
        type: filters.type,
        crowd: filters.crowd,
      })
        .then((response) => setServerResults(response.map(normalizeLandmarkMedia)))
        .catch((error) => {
          console.warn("Server search unavailable, using local search:", error.message);
          setServerResults(null);
        });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [filters, query]);

  const cities = useMemo(
    () => [...new Set(landmarks.map((landmark) => landmark.location).filter(Boolean))],
    [landmarks]
  );
  const types = useMemo(
    () => [
      ...new Set(
        landmarks.map((landmark) => landmark.type ?? landmark.badge ?? "heritage")
      ),
    ],
    [landmarks]
  );

  const filteredLandmarks = useMemo(() => {
    const source = serverResults ?? landmarks;
    const locallyFiltered = source.filter((landmark) => {
      const matchesCity = !filters.city || landmark.location === filters.city;
      const type = landmark.type ?? landmark.badge ?? "heritage";
      const matchesType = !filters.type || type === filters.type;

      return matchesCity && matchesType;
    });

    if (!query.trim()) {
      return locallyFiltered;
    }

    const fuse = new Fuse(locallyFiltered, {
      threshold: 0.36,
      keys: [
        "name",
        "location",
        "type",
        "shortDescription",
        "interestingFacts",
        "description",
      ],
    });

    return fuse.search(query).map((result) => result.item);
  }, [filters.city, filters.type, landmarks, query, serverResults]);

  const handleScanOpen = async () => {
    setScanTarget(filteredLandmarks[0] ?? landmarks[0] ?? null);
    setIsScannerOpen(true);
    await trackEvent({
      type: "scan",
      landmarkId: filteredLandmarks[0]?.id ?? "taj-mahal",
      userEmail: user?.email ?? "",
      metadata: { query, filters },
    });
    setStats((current) => ({ ...current, scans: current.scans + 1 }));
  };

  return (
    <main className="section-shell py-16">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-400/10 via-white/5 to-amber-300/10 p-8 shadow-glow sm:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">
          Traveler Dashboard
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
          Welcome Traveler
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Search landmarks, scan a location, check live crowd levels, and book
          verified cultural experiences through Stripe.
        </p>
        <p className="mt-4 text-sm text-sky-100/80">
          Logged in as {user?.name} ({user?.email})
        </p>

        <div className="mt-8">
          <SearchBar
            query={query}
            filters={filters}
            cities={cities}
            types={types}
            resultCount={filteredLandmarks.length}
            onQueryChange={setQuery}
            onFilterChange={setFilters}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleScanOpen}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-400 to-cyan-300 px-8 py-4 text-base font-bold text-slate-950 transition hover:-translate-y-1 hover:shadow-glow"
          >
            Scan Landmark
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Scans", stats.scans],
            ["Views", stats.landmarkViews],
            ["Bookings", stats.totalBookings || stats.eventBookings],
            ["Check-ins", stats.totalCheckIns],
          ].map(([label, value]) => (
            <div key={label} className="glass-panel rounded-lg p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-100/70">{label}</p>
              <p className="mt-3 font-display text-4xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 pb-12 pt-10 lg:grid-cols-[0.82fr_1.18fr]">
        <FriendActivityFeed userEmail={user?.email ?? ""} />

        <div className="glass-panel rounded-lg p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.25em] text-lime-100/80">
            Booking History
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-white">
            Your confirmed plans
          </h2>
          <div className="mt-5 space-y-3">
            {bookingHistory.length ? (
              bookingHistory.slice(0, 4).map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{booking.eventName}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {booking.landmarkName} · {booking.visitDate} · ₹{booking.totalAmount}
                      </p>
                    </div>
                    <span className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
                      {booking.status}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm leading-7 text-slate-300">
                Bookings appear here after checkout confirmation.
              </p>
            )}
          </div>
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
          <div className="glass-panel rounded-lg p-8 text-slate-300">
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
          <div className="glass-panel mt-6 rounded-lg p-8 text-center text-slate-300">
            No landmarks match your filters. Try a city name like Delhi or Hyderabad.
          </div>
        ) : null}
      </section>

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        landmark={scanTarget}
      />
    </main>
  );
}

export default TravelerDashboard;
