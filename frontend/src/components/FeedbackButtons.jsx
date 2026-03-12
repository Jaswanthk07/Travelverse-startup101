function FeedbackButtons({ value, onChange }) {
  return (
    <div className="mt-10 border-t border-white/10 pt-6">
      <p className="text-sm font-medium text-slate-200">
        Was this information useful?
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
            value === "yes"
              ? "bg-emerald-300 text-slate-950"
              : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          👍 Yes
        </button>
        <button
          type="button"
          onClick={() => onChange("no")}
          className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
            value === "no"
              ? "bg-rose-300 text-slate-950"
              : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
          }`}
        >
          👎 No
        </button>
      </div>
    </div>
  );
}

export default FeedbackButtons;
