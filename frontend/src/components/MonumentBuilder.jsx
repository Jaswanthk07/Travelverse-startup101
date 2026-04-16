import { useRef, useState } from "react";
import { useLandmarks } from "../context/LandmarksContext";

const CATEGORIES = ["monument", "temple", "museum", "fort", "park", "beach", "concert", "live-event", "other"];
const CITIES = ["Hyderabad", "Chennai", "Bengaluru", "Mysuru", "Mumbai", "Delhi", "Kolkata"];

function MonumentBuilder({ onSuccess }) {
  const { addLandmark } = useLandmarks();
  const [form, setForm] = useState({
    name: "",
    location: "",
    city: "",
    type: "monument",
    description: "",
    price: "",
    audioGuide: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setError("");
      update("image", loadEvent.target?.result ?? "");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim() || !form.city.trim()) {
      setError("Name, location, and city are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await addLandmark({
        name: form.name,
        location: form.location,
        city: form.city,
        type: form.type,
        description: form.description,
        entryFee: form.price ? `Rs. ${form.price}` : "Free",
        image: form.image,
        audioGuide: form.audioGuide,
        interestingFacts: [],
      });
      onSuccess(created);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">Add New Monument</h2>
          <p className="mt-2 text-sm text-slate-400">
            Fill in the monument details. The card on the right updates live.
          </p>
        </div>

        <input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          placeholder="Monument Name"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            placeholder="Location"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          />
          <select
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            <option value="">Select city</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.type}
            onChange={(event) => update("type", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            value={form.price}
            onChange={(event) => update("price", event.target.value.replace(/\D/g, ""))}
            placeholder="Entry Price"
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          />
        </div>

        <textarea
          rows={4}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="Description"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
        />

        <input
          value={form.audioGuide}
          onChange={(event) => update("audioGuide", event.target.value)}
          placeholder="Audio guide URL"
          className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-white/15 bg-slate-900 px-4 py-6 text-sm text-slate-300"
        >
          {form.image ? "Change image" : "Upload image"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-teal-500 px-4 py-3 font-bold text-white disabled:opacity-60"
        >
          {saving ? "Adding Monument..." : "Add Monument"}
        </button>
      </div>

      <div className="self-start lg:sticky lg:top-24">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-500">Live Preview</p>
        <div className="overflow-hidden rounded-lg border border-teal-500/30 bg-slate-900 shadow-lg shadow-teal-950/40">
          <div className="h-52 bg-slate-800">
            {form.image ? (
              <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">Image preview</div>
            )}
          </div>
          <div className="p-5">
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
              {form.type}
            </p>
            <h3 className="mt-3 text-xl font-bold text-white">{form.name || "Monument Name"}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {form.location || "Location"}
              {form.city ? ` · ${form.city}` : ""}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {form.description || "Description preview appears here."}
            </p>
            <p className="mt-3 font-semibold text-teal-300">
              {form.price ? `Rs. ${form.price} / person` : "Free entry"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonumentBuilder;
