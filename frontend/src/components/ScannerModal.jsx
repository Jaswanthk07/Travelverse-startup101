function ScannerModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <div className="glass-panel relative w-full max-w-2xl rounded-[2rem] border border-sky-300/25 p-5 shadow-glow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/15"
        >
          Close
        </button>

        <div className="overflow-hidden rounded-[1.5rem] bg-slate-950 p-4">
          <div className="relative aspect-video rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),rgba(15,23,42,0.94))]">
            <div className="absolute inset-0 bg-grid bg-[size:32px_32px]" />
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-2 border-dashed border-cyan-300/80 shadow-[0_0_40px_rgba(34,211,238,0.25)]" />
            <div className="absolute inset-x-10 top-10 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-300">
              <span>Camera Active</span>
              <span>AR Vision</span>
            </div>
            <div className="absolute bottom-10 left-1/2 w-[85%] -translate-x-1/2 rounded-[1.5rem] border border-white/15 bg-slate-950/75 p-6 text-center backdrop-blur-xl">
              <p className="text-sm font-semibold text-slate-300">Camera scanning...</p>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                Taj Mahal detected
              </p>
              <p className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">
                Tap to Explore Story
              </p>
              <p className="mt-2 text-sm text-slate-300">
                This modal simulates the TravelVerse AR scanning experience for
                MVP testing.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScannerModal;
