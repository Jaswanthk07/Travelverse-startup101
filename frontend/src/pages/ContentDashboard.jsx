import { useEffect, useState } from "react";
import EventSignalLoader from "../components/EventSignalLoader";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { useLandmarks } from "../context/LandmarksContext";
import {
  approveCreatorBooking,
  fetchCreatorPendingBookings,
  getStatsSummary,
} from "../lib/api";

const tabs = ["landmarks", "events", "bookings", "analytics"];

function StatPanel({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5">
      <p className="text-sm uppercase tracking-[0.22em] text-sky-100/70">{label}</p>
      <p className="mt-3 font-display text-4xl font-bold text-white">{value}</p>
    </div>
  );
}

function ContentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, isLoading: isEventsLoading, removeEvent } = useEvents();
  const { landmarks, isLoading, removeLandmark } = useLandmarks();
  const [activeTab, setActiveTab] = useState("landmarks");
  const [stats, setStats] = useState({});
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isApprovingId, setIsApprovingId] = useState("");

  useEffect(() => {
    getStatsSummary().then(setStats);
    fetchCreatorPendingBookings()
      .then(setPendingBookings)
      .catch((error) => console.warn("Pending bookings unavailable:", error.message));
  }, []);

  const handleApproveBooking = async (bookingId) => {
    setIsApprovingId(bookingId);

    try {
      const response = await approveCreatorBooking(bookingId);
      setPendingBookings((current) => current.filter((booking) => booking.id !== bookingId));
      setStats((current) => ({
        ...current,
        totalBookings: (current.totalBookings ?? 0) + 1,
      }));
      console.log("Approved booking", response.booking.bookingCode);
    } catch (error) {
      console.warn("Approve booking failed:", error.message);
    } finally {
      setIsApprovingId("");
    }
  };

  return (
    <main className="section-shell py-16">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-300/10 via-white/5 to-sky-400/10 p-8 shadow-glow sm:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
          Admin Dashboard
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
          Manage TravelVerse V2.0
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Review content, events, booking demand, check-ins, and interaction
          signals from one workspace.
        </p>
        <p className="mt-4 text-sm text-amber-100/80">
          Logged in as {user?.name} ({user?.role})
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dashboard/content/new"
            className="rounded-lg bg-gradient-to-r from-amber-300 to-sky-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
          >
            Add Landmark
          </Link>
          <Link
            to="/dashboard/content/events/new"
            className="rounded-lg border border-sky-300/30 bg-sky-300/10 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:-translate-y-0.5"
          >
            Add Event
          </Link>
        </div>
      </section>

      <section className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatPanel label="Landmarks" value={stats.totalLandmarks ?? landmarks.length} />
          <StatPanel label="Events" value={stats.totalEvents ?? events.length} />
          <StatPanel label="Users" value={stats.totalUsers ?? 0} />
          <StatPanel label="Bookings" value={stats.totalBookings ?? 0} />
          <StatPanel label="Check-ins" value={stats.totalCheckIns ?? 0} />
        </div>
      </section>

      <div className="mb-8 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-3 text-sm font-bold capitalize transition ${
              activeTab === tab
                ? "bg-white text-slate-950"
                : "border border-white/15 bg-white/10 text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "landmarks" ? (
        <section className="pb-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">
                Landmarks
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">
                Destination content
              </h2>
            </div>
            <p className="text-sm text-slate-400">{landmarks.length} total</p>
          </div>

          {isLoading ? (
            <div className="glass-panel rounded-lg p-8 text-slate-300">
              Loading landmarks...
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              {landmarks.map((landmark) => (
                <div
                  key={landmark.id}
                  className="grid gap-4 border-b border-white/10 bg-white/5 p-5 last:border-b-0 lg:grid-cols-[1fr_auto]"
                >
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {landmark.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {landmark.location} · {landmark.type ?? "heritage"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/content/edit/${landmark.id}`)}
                      className="rounded-lg border border-sky-300/30 bg-sky-300/10 px-5 py-3 text-sm font-semibold text-sky-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLandmark(landmark.id)}
                      className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "events" ? (
        <section className="pb-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
                Events
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">
                Monument experiences
              </h2>
            </div>
            <p className="text-sm text-slate-400">{events.length} total</p>
          </div>

          {isEventsLoading && events.length === 0 ? (
            <EventSignalLoader
              title="Calibrating monument event listings"
              caption="Checking the backend feed and preparing the latest bookable sessions for your control room."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-white/10">
              {events.map((event) => {
                const landmark = landmarks.find((item) => item.id === event.landmarkId);

                return (
                  <div
                    key={event.id}
                    className="grid gap-4 border-b border-white/10 bg-white/5 p-5 last:border-b-0 lg:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-white">
                        {event.eventName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {landmark?.name ?? event.landmarkId} · {event.date} · {event.time} · ₹
                        {event.ticketPrice}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-amber-100/80">
                        {event.category ?? "festival"} · visible on traveler landmark pages
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEvent(event.id)}
                      className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "analytics" ? (
        <section className="pb-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-100/80">
                Engagement
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <StatPanel label="Sessions" value={stats.sessions ?? 0} />
                <StatPanel label="Views" value={stats.landmarkViews ?? 0} />
                <StatPanel label="Scans" value={stats.scans ?? 0} />
                <StatPanel label="Booking starts" value={stats.bookingStarts ?? 0} />
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/80">
                Top landmarks
              </p>
              <div className="mt-5 space-y-3">
                {(stats.topLandmarks ?? []).length ? (
                  stats.topLandmarks.map((item) => (
                    <div
                      key={item.landmarkId}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="font-semibold text-white">{item.landmarkId}</span>
                      <span className="text-sm text-slate-300">{item.count} signals</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-slate-300">
                    Top landmark rankings appear after visitors scan, view, book, and check in.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "bookings" ? (
        <section className="pb-12">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-100/80">
                Pending Bookings
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">
                Traveler payment approvals
              </h2>
            </div>
            <p className="text-sm text-slate-400">{pendingBookings.length} waiting</p>
          </div>

          {pendingBookings.length ? (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-display text-2xl font-semibold text-white">
                        {booking.eventName}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        {booking.landmarkName} · {booking.visitDate} · {booking.slotTime}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Traveler: {booking.userName} ({booking.userEmail})
                      </p>
                      <p className="mt-2 text-sm text-emerald-100">
                        Paid via {booking.paymentMethod ?? "demo payment"} · ₹{booking.totalAmount}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <span className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
                        {booking.status}
                      </span>
                      <button
                        type="button"
                        disabled={isApprovingId === booking.id}
                        onClick={() => handleApproveBooking(booking.id)}
                        className="rounded-lg bg-gradient-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
                      >
                        {isApprovingId === booking.id ? "Approving..." : "Approve Booking"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-lg p-8 text-slate-300">
              No traveler bookings are waiting for approval right now.
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

export default ContentDashboard;
