import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  createBookingCheckout,
  simulateBookingPayment,
  trackEvent,
} from "../lib/api";
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
  const [slotTime, setSlotTime] = useState(event?.time || "10:00 AM");
  const [adults, setAdults] = useState(1);
  const [students, setStudents] = useState(0);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoTicket, setDemoTicket] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const basePrice = Number(event?.ticketPrice) || 100;
  const discountPercent =
    user?.role === "traveler" &&
    user?.isPremium &&
    (["concert", "live-event"].includes(String(event?.category ?? "").toLowerCase()) ||
      String(event?.eventName ?? "").toLowerCase().includes("concert"))
      ? 10
      : 0;
  const savings = Math.round((basePrice * discountPercent) / 100) * (adults + students + children);
  const quote = useMemo(() => {
    const discountMultiplier = 1 - discountPercent / 100;
    const lines = [
      { label: "Adults", quantity: adults, unitAmount: Math.round(basePrice * discountMultiplier) },
      {
        label: "Students",
        quantity: students,
        unitAmount: Math.round(basePrice * 0.7 * discountMultiplier),
      },
      {
        label: "Children",
        quantity: children,
        unitAmount: Math.round(basePrice * 0.5 * discountMultiplier),
      },
    ].filter((item) => item.quantity > 0);

    return {
      lines,
      total: lines.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0),
    };
  }, [adults, basePrice, children, discountPercent, students]);
  const slotOptions = [
    event?.time,
    "09:00 AM",
    "11:00 AM",
    "01:00 PM",
    "03:00 PM",
    "05:00 PM",
    "07:00 PM",
  ].filter((value, index, array) => value && array.indexOf(value) === index);

  const handleCheckout = async () => {
    setError("");
    setDemoTicket(null);
    setPendingBooking(null);
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
        slotTime,
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

  const handleDemoPayment = async () => {
    setError("");
    setDemoTicket(null);
    setPendingBooking(null);
    setIsSubmitting(true);

    try {
      await trackEvent({
        type: "booking_start",
        landmarkId: landmark.id,
        metadata: { eventId: event.id, source: "rupay_demo_checkout" },
      });

      const response = await simulateBookingPayment({
        landmarkId: landmark.id,
        eventId: event.id,
        visitDate,
        slotTime,
        adults,
        students,
        children,
        paymentMethod: "rupay-demo",
      });

      setPendingBooking(response.booking);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
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
      {discountPercent ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Premium concert discount applied: {discountPercent}% off. Saving Rs. {savings}.
        </div>
      ) : null}

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

        <label>
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Slot time
          </span>
          <select
            value={slotTime}
            onChange={(event) => setSlotTime(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
          >
            {slotOptions.map((option) => (
              <option key={option} value={option} className="bg-slate-900">
                {option}
              </option>
            ))}
          </select>
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

      {demoTicket ? (
        <div className="mt-5 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/80">
            Ticket Generated
          </p>
          <h4 className="mt-2 font-display text-2xl font-semibold text-white">
            {demoTicket.ticketCode}
          </h4>
          <div className="mt-4 grid gap-2 text-sm text-emerald-50 sm:grid-cols-2">
            <p>Event: {demoTicket.eventName}</p>
            <p>Landmark: {demoTicket.landmarkName}</p>
            <p>Visit date: {demoTicket.visitDate}</p>
            <p>Payment: {demoTicket.paymentMethod}</p>
            <p>Total paid: ₹{demoTicket.totalAmount}</p>
            <p>Booking code: {demoTicket.bookingCode}</p>
          </div>
          <p className="mt-3 text-sm text-emerald-100/90">
            Demo payment completed. This ticket will also appear in booking history.
          </p>
        </div>
      ) : null}
      {pendingBooking ? (
        <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-100/80">
            Payment Received
          </p>
          <h4 className="mt-2 font-display text-2xl font-semibold text-white">
            Booking pending approval
          </h4>
          <div className="mt-4 grid gap-2 text-sm text-amber-50 sm:grid-cols-2">
            <p>Event: {pendingBooking.eventName}</p>
            <p>Landmark: {pendingBooking.landmarkName}</p>
            <p>Date: {pendingBooking.visitDate}</p>
            <p>Slot: {pendingBooking.slotTime}</p>
            <p>Total paid: ₹{pendingBooking.totalAmount}</p>
            <p>Status: {pendingBooking.status}</p>
          </div>
          <p className="mt-3 text-sm text-amber-100/90">
            A content creator has been notified. Your booking history now shows this as pending
            until they approve it.
          </p>
        </div>
      ) : null}

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
          disabled={isSubmitting}
          onClick={handleDemoPayment}
          className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Processing..." : "Fake Pay and Request Approval"}
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
