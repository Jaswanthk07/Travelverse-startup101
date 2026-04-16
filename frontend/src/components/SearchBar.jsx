function SearchBar({
  query,
  filters,
  cities = [],
  types = [],
  onQueryChange,
  onFilterChange,
  resultCount,
}) {
  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr_0.75fr_0.75fr]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Search landmarks
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Try Taj, Delhi, Mughal, heritage..."
            className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/70 focus:bg-white/15"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">City</span>
          <select
            value={filters.city}
            onChange={(event) => updateFilter("city", event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Type</span>
          <select
            value={filters.type}
            onChange={(event) => updateFilter("type", event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Crowd</span>
          <select
            value={filters.crowd}
            onChange={(event) => updateFilter("crowd", event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            <option value="">Any crowd</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <p>
          {resultCount} landmark{resultCount === 1 ? "" : "s"} ready for your trip
        </p>
        <button
          type="button"
          onClick={() => {
            onQueryChange("");
            onFilterChange({ city: "", type: "", crowd: "" });
          }}
          className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 font-semibold text-white"
        >
          Reset filters
        </button>
      </div>
    </section>
  );
}

export default SearchBar;
