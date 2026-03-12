import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { useLandmarks } from "../context/LandmarksContext";

function ContentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, isLoading: isEventsLoading, removeEvent } = useEvents();
  const { landmarks, isLoading, removeLandmark } = useLandmarks();

  const handleDelete = async (id) => {
    await removeLandmark(id);
  };

  return (
    <main className="section-shell py-16">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-300/10 via-white/5 to-sky-400/10 p-8 shadow-glow sm:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
          Content Creator Panel
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
          Manage landmark content
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Add new locations, upload media, and edit or delete landmark stories for the
          TravelVerse MVP.
        </p>
        <p className="mt-4 text-sm text-amber-100/80">
          Logged in as {user?.name} (Content Creator)
        </p>

        <Link
          to="/dashboard/content/new"
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-amber-300 to-sky-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
        >
          Add New Landmark
        </Link>
        <Link
          to="/dashboard/content/events/new"
          className="ml-3 mt-8 inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:-translate-y-0.5"
        >
          Add Event
        </Link>
      </section>

      <section className="py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">
              Landmarks List
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">
              Existing locations
            </h2>
          </div>
          <p className="text-sm text-slate-400">{landmarks.length} total landmarks</p>
        </div>

        {isLoading ? (
          <div className="glass-panel rounded-[1.5rem] p-8 text-slate-300">
            Loading landmarks...
          </div>
        ) : (
          <div className="space-y-4">
            {landmarks.map((landmark) => (
              <div
                key={landmark.id}
                className="glass-panel flex flex-col gap-4 rounded-[1.5rem] p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {landmark.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">{landmark.location}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/content/edit/${landmark.id}`)}
                    className="rounded-full border border-sky-300/30 bg-sky-300/10 px-5 py-3 text-sm font-semibold text-sky-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(landmark.id)}
                    className="rounded-full border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pb-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
              Events
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-white">
              Monument events
            </h2>
          </div>
          <p className="text-sm text-slate-400">{events.length} total events</p>
        </div>

        {isEventsLoading ? (
          <div className="glass-panel rounded-[1.5rem] p-8 text-slate-300">Loading events...</div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const landmark = landmarks.find((item) => item.id === event.landmarkId);

              return (
                <div
                  key={event.id}
                  className="glass-panel flex flex-col gap-4 rounded-[1.5rem] p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {event.eventName}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {landmark?.name ?? event.landmarkId} • {event.date} • {event.time} • ₹
                      {event.ticketPrice}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvent(event.id)}
                    className="rounded-full border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default ContentDashboard;
