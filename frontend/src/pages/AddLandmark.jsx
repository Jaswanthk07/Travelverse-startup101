import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLandmarks } from "../context/LandmarksContext";

const initialState = {
  name: "",
  location: "",
  entryFee: "",
  bestTime: "",
  description: "",
  image: "",
  audioGuide: "",
  interestingFacts: "",
};

function AddLandmark() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getLandmark, addLandmark, editLandmark } = useLandmarks();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    getLandmark(id).then((landmark) => {
      setFormData({
        name: landmark.name,
        location: landmark.location,
        entryFee: landmark.entryFee,
        bestTime: landmark.bestTime,
        description: landmark.description.join("\n\n"),
        image: landmark.image,
        audioGuide: landmark.audioGuide,
        interestingFacts: landmark.interestingFacts.join("\n"),
      });
    });
  }, [getLandmark, id, isEditing]);

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleFileChange = (key, file) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField(key, reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      entryFee: formData.entryFee.trim(),
      bestTime: formData.bestTime.trim(),
      description: formData.description.trim(),
      image: formData.image,
      audioGuide: formData.audioGuide,
      interestingFacts: formData.interestingFacts
        .split("\n")
        .map((fact) => fact.trim())
        .filter(Boolean),
    };

    try {
      if (isEditing) {
        await editLandmark(id, payload);
      } else {
        await addLandmark(payload);
      }

      navigate("/dashboard/content");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="section-shell py-16">
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-[2rem] p-8 shadow-glow sm:p-10"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-amber-100/80">
            {isEditing ? "Edit Landmark" : "Add New Landmark"}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white">
            {isEditing ? "Update landmark content" : "Create landmark content"}
          </h1>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Landmark Name
              </span>
              <input
                required
                value={formData.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Location
              </span>
              <input
                required
                value={formData.location}
                onChange={(event) => updateField("location", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Entry Fee
                </span>
                <input
                  value={formData.entryFee}
                  onChange={(event) => updateField("entryFee", event.target.value)}
                  placeholder="₹50 (Indians)"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Best Time
                </span>
                <input
                  value={formData.bestTime}
                  onChange={(event) => updateField("bestTime", event.target.value)}
                  placeholder="Morning"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Description
              </span>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Interesting Facts
              </span>
              <textarea
                rows={4}
                value={formData.interestingFacts}
                onChange={(event) => updateField("interestingFacts", event.target.value)}
                placeholder="One fact per line"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Upload Image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange("image", event.target.files?.[0])}
                className="block w-full text-sm text-slate-300"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Upload Audio Guide
              </span>
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => handleFileChange("audioGuide", event.target.files?.[0])}
                className="block w-full text-sm text-slate-300"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-r from-amber-300 to-sky-300 px-6 py-3 text-sm font-bold text-slate-950"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <Link
              to="/dashboard/content"
              className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AddLandmark;
