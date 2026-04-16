import { useState } from "react";

function ShareVisitBadge({ landmark }) {
  const [message, setMessage] = useState("");
  const shareText = `I explored ${landmark.name} with TravelVerse.`;

  const handleShare = async (channel) => {
    const url = window.location.href;

    if (navigator.share && channel === "native") {
      await navigator.share({
        title: `${landmark.name} visit badge`,
        text: shareText,
        url,
      });
      setMessage("Badge shared.");
      return;
    }

    const target =
      channel === "whatsapp"
        ? `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`
        : `https://www.instagram.com/?url=${encodeURIComponent(url)}`;

    window.open(target, "_blank", "noopener,noreferrer");
    setMessage(`${channel === "whatsapp" ? "WhatsApp" : "Instagram"} share opened.`);
  };

  return (
    <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-100/80">
        Visit Badge
      </p>
      <div className="mt-4 rounded-[1rem] border border-cyan-200/25 bg-cyan-200/10 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">
          TravelVerse Explorer
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold text-white">
          {landmark.name}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{landmark.location}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleShare("whatsapp")}
          className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950"
        >
          Share on WhatsApp
        </button>
        <button
          type="button"
          onClick={() => handleShare("instagram")}
          className="rounded-full bg-rose-300 px-5 py-3 text-sm font-bold text-slate-950"
        >
          Share on Instagram
        </button>
        <button
          type="button"
          onClick={() => handleShare("native")}
          className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
        >
          Share
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-cyan-100">{message}</p> : null}
    </section>
  );
}

export default ShareVisitBadge;
