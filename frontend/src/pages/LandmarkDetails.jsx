import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AudioPlayer from "../components/AudioPlayer";
import FeedbackButtons from "../components/FeedbackButtons";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { useLandmarks } from "../context/LandmarksContext";
import { registerForEvent, trackEvent } from "../lib/api";

const BOOKINGS_STORAGE_KEY = "travelverse-bookings";

const formatEventDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

function LandmarkDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { getEventsForLandmark } = useEvents();
  const { landmarks, getLandmark } = useLandmarks();
  const [landmark, setLandmark] = useState(
    landmarks.find((item) => item.id === id) ?? null
  );
  const [isResolving, setIsResolving] = useState(!landmark);
  const [feedback, setFeedback] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    if (landmark) {
      setIsResolving(false);
      return;
    }

    getLandmark(id)
      .then(setLandmark)
      .finally(() => setIsResolving(false));
  }, [getLandmark, id, landmark]);

  useEffect(() => {
    if (!landmark) {
      return undefined;
    }

    trackEvent({
      type: "landmark_view",
      landmarkId: landmark.id,
      userEmail: user?.email ?? "",
    });

    return undefined;
  }, [landmark, user]);

  useEffect(() => {
    if (!id) {
      return;
    }

    getEventsForLandmark(id).then(setEvents);
  }, [getEventsForLandmark, id]);

  if (isResolving) {
    return (
      <main className="section-shell py-20">
        <div className="glass-panel rounded-[2rem] p-10 text-center text-slate-300">
          Loading landmark story...
        </div>
      </main>
    );
  }

  if (!landmark) {
    return (
      <main className="section-shell py-20">
        <div className="glass-panel rounded-[2rem] p-10 text-center">
          <h1 className="font-display text-3xl font-bold text-white">
            Landmark not found
          </h1>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const handleFeedback = async (value) => {
    setFeedback(value);
    await trackEvent({
      type: "feedback",
      landmarkId: landmark.id,
      userEmail: user?.email ?? "",
      feedback: value,
    });
  };

  const handleBookTickets = (eventItem) => {
    setSelectedEvent(eventItem);
    setTicketCount(1);
    setBookingMessage("");
  };

  const confirmBooking = async () => {
    if (!selectedEvent) {
      return;
    }

    const response = await registerForEvent(selectedEvent.id, {
      travelerName: user?.name ?? "Traveler",
      travelerEmail: user?.email ?? "",
      landmarkId: landmark.id,
      landmarkName: landmark.name,
      eventName: selectedEvent.eventName,
      ticketCount,
      totalPrice: Number(selectedEvent.ticketPrice) * Number(ticketCount),
    });

    const booking = response.registration;
    const existing = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) ?? "[]");
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify([...existing, booking]));
    setBookingMessage(`Booking Successful. Booking ID: ${booking.bookingId}`);
    setSelectedEvent(null);

    await trackEvent({
      type: "event_booking",
      landmarkId: landmark.id,
      userEmail: user?.email ?? "",
      feedback: booking.bookingId,
    });
  };

  return (
    <main className="section-shell py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.92fr]">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-glow">
          <img
            src={landmark.image}
            alt={landmark.name}
            className="h-full w-full object-cover"
          />
        </div>

        <section className="glass-panel rounded-[2rem] p-8 shadow-soft sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-100/80">
            Landmark Story
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white">
            {landmark.name}
          </h1>
          <p className="mt-3 text-base text-slate-300">{landmark.location}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-100/70">Entry Fee</p>
              <p className="mt-2 text-lg font-semibold text-white">{landmark.entryFee}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-100/70">Best Time</p>
              <p className="mt-2 text-lg font-semibold text-white">{landmark.bestTime}</p>
            </div>
          </div>

          <div className="mt-8 space-y-5 text-sm leading-8 text-slate-300">
            {landmark.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <AudioPlayer src={landmark.audioGuide} />

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-100/80">
              Interesting Facts
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              {landmark.interestingFacts.map((fact) => (
                <li key={fact} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/80">Events</p>
            {events.length === 0 ? (
              <p className="mt-4 text-sm text-slate-300">No events available for this monument yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {event.eventName}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Date: {formatEventDate(event.date)} • Time: {event.time} • Price: ₹
                      {event.ticketPrice}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{event.description}</p>
                    <button
                      type="button"
                      onClick={() => handleBookTickets(event)}
                      className="mt-4 rounded-full bg-gradient-to-r from-amber-300 to-sky-300 px-5 py-3 text-sm font-bold text-slate-950"
                    >
                      Book Ticket
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEvent ? (
            <div className="mt-8 rounded-[1.5rem] border border-sky-300/20 bg-sky-300/10 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-sky-100/80">Book Event Tickets</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                {selectedEvent.eventName}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Location: {landmark.name} • Entry Fee: ₹{selectedEvent.ticketPrice}
              </p>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Number of Tickets
                </span>
                <input
                  type="number"
                  min="1"
                  value={ticketCount}
                  onChange={(event) => setTicketCount(Number(event.target.value) || 1)}
                  className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </label>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={confirmBooking}
                  className="rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Book Now
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {bookingMessage ? (
            <div className="mt-6 rounded-[1.25rem] border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              {bookingMessage}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              to="/dashboard"
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back
            </Link>
          </div>

          <FeedbackButtons value={feedback} onChange={handleFeedback} />
          {feedback ? (
            <p className="mt-4 text-sm text-sky-100/80">
              Feedback recorded for assignment proof: {feedback === "yes" ? "Yes" : "No"}.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default LandmarkDetails;
