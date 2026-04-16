import { useMemo, useState } from "react";

const STORAGE_KEY = "travelverse-offline-packs";

function OfflineDownload({ landmark }) {
  const initialState = useMemo(() => {
    const packs = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return packs.some((pack) => pack.id === landmark.id);
  }, [landmark.id]);
  const [isDownloaded, setIsDownloaded] = useState(initialState);

  const handleDownload = () => {
    const packs = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const nextPack = {
      id: landmark.id,
      name: landmark.name,
      location: landmark.location,
      description: landmark.description,
      interestingFacts: landmark.interestingFacts,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...packs.filter((pack) => pack.id !== landmark.id), nextPack])
    );
    setIsDownloaded(true);
  };

  return (
    <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-lime-100/80">
        Offline Mode
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-white">
        {isDownloaded ? "Saved for offline visits" : "Download before visiting"}
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        Keep the short guide, facts, and badge data available when mobile
        network is weak near the monument.
      </p>
      <button
        type="button"
        onClick={handleDownload}
        className="mt-4 rounded-full bg-lime-300 px-5 py-3 text-sm font-bold text-slate-950"
      >
        {isDownloaded ? "Refresh Offline Pack" : "Download Offline Pack"}
      </button>
    </section>
  );
}

export default OfflineDownload;
