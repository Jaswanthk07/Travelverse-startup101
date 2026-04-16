import { useMemo, useState } from "react";

const languageCopy = {
  en: {
    label: "English",
    text: "A short guide for quick landmark learning while you are standing at the monument.",
  },
  te: {
    label: "Telugu",
    text: "Sthalam daggara nilabadi vinadaniki chinna Telugu audio guide.",
  },
  hi: {
    label: "Hindi",
    text: "Smarak par khade hokar sunne ke liye chhota Hindi audio guide.",
  },
};

function RegionalAudioGuide({ src }) {
  const [language, setLanguage] = useState("en");
  const selected = useMemo(() => languageCopy[language], [language]);

  return (
    <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-sky-100/80">
            Regional Audio
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {selected.label} guide
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">{selected.text}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(languageCopy).map(([code, item]) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                language === code
                  ? "border-cyan-200 bg-cyan-200 text-slate-950"
                  : "border-white/15 bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <audio className="mt-4 w-full" controls src={src}>
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export default RegionalAudioGuide;
