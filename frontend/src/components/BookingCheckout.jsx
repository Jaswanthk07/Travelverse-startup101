import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { createBookingCheckout, trackEvent } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const today = new Date().toISOString().slice(0, 10);

function Counter({ label, value, onChange, min = 0 }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <span className="font-semibold text-white">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-9 w-9 rounded-lg border border-white/15 bg-white/10 text-lg font-bold text-white"
        >
          -
        </button>
        <span className="w-8 text-center text-white">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-9 w-9 rounded-lg border border-white/15 bg-white/10 text-lg font-bold text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}

function BookingCheckout({ landmark, event, onCancel }) {
  const { user } = useAuth();
  const [visitDate, setVisitDate] = useState(event?.date || today);
  const [adults, setAdults] = useState(1);
  const [students, setStudents] = useState(0);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const basePrice = Number(event?.ticketPrice) || 100;
  const quote = useMemo(() => {
    const lines = [
      { label: "Adults", quantity: adults, unitAmount: basePrice },
      { label: "Students", quantity: students, unitAmount: Math.round(basePrice * 0.7) },
      { label: "Children", quantity: children, unitAmount: Math.round(basePrice * 0.5) },
    ].filter((item) => item.quantity > 0);

    return {
      lines,
      total: lines.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0),
    };
  }, [adults, basePrice, children, students]);

  const handleCheckout = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      await trackEvent({
        type: "booking_start",
        landmarkId: landmark.id,
        metadata: { eventId: event.id, source: "checkout_component" },
      });

      const response = await createBookingCheckout({
        landmarkId: landmark.id,
        eventId: event.id,
        visitDate,
        adults,
        students,
        children,
      });

      if (stripePromise && response.sessionId) {
        const stripe = await stripePromise;
        if (stripe) {
          const redirect = await stripe.redirectToCheckout({
            sessionId: response.sessionId,
          });

          if (redirect?.error) {
            throw new Error(redirect.error.message);
          }

          return;
        }
      }

      window.location.assign(response.checkoutUrl);
    } catch (requestError) {
      setError(requestError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-8 rounded-[1.5rem] border border-sky-300/20 bg-sky-300/10 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-sky-100/80">
        Secure Checkout
      </p>
      <h3 className="mt-3 font-display text-2xl font-semibold text-white">
        {event.eventName}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        {landmark.name} · signed in as {user?.name}
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <label>
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Visit date
          </span>
          <input
            type="date"
            min={today}
            value={visitDate}
            onChange={(event) => setVisitDate(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
          />
        </label>

        <Counter label="Adults" value={adults} min={1} onChange={setAdults} />
        <Counter label="Students" value={students} onChange={setStudents} />
        <Counter label="Children" value={children} onChange={setChildren} />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
        {quote.lines.map((item) => (
          <div key={item.label} className="flex justify-between py-1 text-sm text-slate-300">
            <span>
              {item.label} x {item.quantity}
            </span>
            <span>₹{item.quantity * item.unitAmount}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-display text-2xl font-bold text-white">
          <span>Total</span>
          <span>₹{quote.total}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleCheckout}
          className="rounded-lg bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Opening Stripe..." : "Continue to Stripe"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

export default BookingCheckout;
