const cities = [
  {
    name: "Vijayawada",
    anchor: "Kanaka Durga Temple",
    status: "Next city pack",
  },
  {
    name: "Chennai",
    anchor: "Kapaleeshwarar Temple",
    status: "Content mapping",
  },
  {
    name: "Bengaluru",
    anchor: "Bangalore Palace",
    status: "Partner outreach",
  },
];

function ExpansionCities() {
  return (
    <section className="pb-20">
      <div className="section-shell">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/80">
            More Cities
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-white">
            Hyderabad first, South India next
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cities.map((city) => (
            <article
              key={city.name}
              className="glass-panel rounded-[1.5rem] p-6 shadow-soft"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                {city.status}
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-white">
                {city.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                First guide target: {city.anchor}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ExpansionCities;
