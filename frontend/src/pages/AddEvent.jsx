import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEvents } from "../context/EventsContext";
import { useLandmarks } from "../context/LandmarksContext";

const initialState = {
  landmarkId: "",
  eventName: "",
  category: "festival",
  date: "",
  time: "",
  ticketPrice: "",
  description: "",
};

function AddEvent() {
  const navigate = useNavigate();
  const { landmarks } = useLandmarks();
  const { addEvent } = useEvents();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await addEvent({
        landmarkId: formData.landmarkId,
        eventName: formData.eventName.trim(),
        category: formData.category,
        date: formData.date,
        time: formData.time.trim(),
        ticketPrice: formData.ticketPrice,
        description: formData.description.trim(),
      });

      navigate("/dashboard/content");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="section-shell py-16">
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-[2rem] p-8 shadow-glow sm:p-10"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">Add Event</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white">
            Create event for a monument
          </h1>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Monument Name
              </span>
              <select
                required
                value={formData.landmarkId}
                onChange={(event) => updateField("landmarkId", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="">Select a monument</option>
                {landmarks.map((landmark) => (
                  <option key={landmark.id} value={landmark.id}>
                    {landmark.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Event Name
              </span>
              <input
                required
                value={formData.eventName}
                onChange={(event) => updateField("eventName", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Event Category
              </span>
              <select
                value={formData.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="festival">Festival</option>
                <option value="concert">Concert</option>
                <option value="tour">Tour</option>
                <option value="workshop">Workshop</option>
              </select>
            </label>

            <div className="grid gap-5 sm:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-200">Date</span>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(event) => updateField("date", event.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-200">Time</span>
                <input
                  required
                  value={formData.time}
                  onChange={(event) => updateField("time", event.target.value)}
                  placeholder="6 PM"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Ticket Price
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.ticketPrice}
                  onChange={(event) => updateField("ticketPrice", event.target.value)}
                  placeholder="200"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Description
              </span>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-6 py-3 text-sm font-bold text-slate-950"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <Link
              to="/dashboard/content"
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AddEvent;
