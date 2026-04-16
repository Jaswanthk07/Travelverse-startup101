import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PaymentModal({ plan, onClose }) {
  const navigate = useNavigate();
  const { upgradeToPremium, refreshUser } = useAuth();
  const [step, setStep] = useState("form");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [error, setError] = useState("");

  const formatCard = (value) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  };

  const handlePay = async () => {
    if (card.number.replace(/\s/g, "").length < 16) {
      setError("Enter a valid 16-digit card number.");
      return;
    }
    if (!card.expiry.includes("/")) {
      setError("Enter expiry as MM/YY.");
      return;
    }
    if (card.cvv.length < 3) {
      setError("Enter a valid CVV.");
      return;
    }
    if (!card.name.trim()) {
      setError("Enter the cardholder name.");
      return;
    }

    setError("");
    setStep("processing");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
      await upgradeToPremium({ plan: plan.id });
      await refreshUser();
      setStep("success");
    } catch (requestError) {
      setError(requestError.message || "Payment failed. Please try again.");
      setStep("form");
    }
  };

  if (step === "processing") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="font-semibold text-white">Processing Payment...</p>
          <p className="mt-1 text-sm text-slate-400">No real charge will be made.</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-lg border border-teal-500/40 bg-slate-900 p-8 text-center">
          <div className="mb-4 text-4xl font-black text-teal-400">OK</div>
          <h2 className="text-2xl font-bold text-white">Welcome to Premium!</h2>
          <p className="mt-3 text-sm text-slate-300">
            Your <span className="font-semibold text-teal-300">{plan.name}</span> plan is active.
          </p>
          <p className="mt-2 text-sm text-amber-300">10% concert discount is now live.</p>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/profile");
            }}
            className="mt-6 w-full rounded-lg bg-teal-500 px-4 py-3 font-bold text-white"
          >
            View Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            <p className="text-sm text-slate-400">
              {plan.name} - Rs. {plan.price}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-lg text-slate-400">
            X
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-teal-500/30 bg-gradient-to-br from-teal-900 to-slate-800 p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-300">TravelVerse Card</p>
          <p className="font-mono text-lg tracking-[0.28em] text-white">
            {card.number || ".... .... .... ...."}
          </p>
          <div className="mt-3 flex justify-between text-xs text-slate-300">
            <span>{card.name || "Card Holder"}</span>
            <span>{card.expiry || "MM/YY"}</span>
          </div>
        </div>

        <div className="space-y-3">
          <input
            value={card.number}
            onChange={(event) => setCard({ ...card, number: formatCard(event.target.value) })}
            placeholder="1234 5678 9012 3456"
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={card.expiry}
              onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })}
              placeholder="MM/YY"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
            />
            <input
              value={card.cvv}
              onChange={(event) =>
                setCard({ ...card, cvv: event.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder="CVV"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
            />
          </div>
          <input
            value={card.name}
            onChange={(event) => setCard({ ...card, name: event.target.value })}
            placeholder="Name on Card"
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="button"
            onClick={handlePay}
            className="w-full rounded-lg bg-teal-500 px-4 py-3 font-bold text-white"
          >
            Pay Rs. {plan.price}
          </button>
          <p className="text-center text-xs text-slate-500">
            Demo payment only. No real charge will be made.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
