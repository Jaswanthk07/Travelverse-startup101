function EventSignalLoader({
  title = "Tuning into live monument broadcasts",
  caption = "Pulling the latest creator updates through the signal...",
}) {
  return (
    <div className="event-loader glass-panel rounded-[1.5rem] p-6 sm:p-8" aria-live="polite">
      <div className="event-loader__screen">
        <div className="event-loader__noise" aria-hidden="true" />
        <div className="event-loader__scanline" aria-hidden="true" />

        <div className="relative z-[1] flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-100/70">
                Live feed buffering
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                {title}
              </h3>
            </div>
            <span className="event-loader__badge">Signal syncing</span>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-300">{caption}</p>

          <div className="event-loader__progress" aria-hidden="true">
            <span />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((index) => (
              <div key={index} className="event-loader__card">
                <div className="event-loader__line event-loader__line--short" />
                <div className="event-loader__line event-loader__line--title" />
                <div className="event-loader__line event-loader__line--medium" />
                <div className="event-loader__line event-loader__line--long" />
                <div className="event-loader__line event-loader__line--price" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventSignalLoader;
