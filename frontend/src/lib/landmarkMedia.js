import tajMahalImage from "../assets/taj-mahal.svg";
import qutubMinarImage from "../assets/qutub-minar.svg";
import charminarImage from "../assets/charminar.svg";

const fallbackImageMap = {
  "taj-mahal": tajMahalImage,
  "qutub-minar": qutubMinarImage,
  charminar: charminarImage,
};

export const normalizeLandmarkMedia = (landmark) => ({
  ...landmark,
  description: Array.isArray(landmark.description)
    ? landmark.description
    : String(landmark.description ?? "")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
  image:
    landmark.image && !landmark.image.startsWith("/images/")
      ? landmark.image
      : fallbackImageMap[landmark.id] ?? tajMahalImage,
  audioGuide:
    landmark.audioGuide || "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
  interestingFacts: Array.isArray(landmark.interestingFacts)
    ? landmark.interestingFacts
    : [],
  entryFee: landmark.entryFee || "Not available",
  bestTime: landmark.bestTime || "Anytime",
  shortDescription:
    landmark.shortDescription ||
    (Array.isArray(landmark.description)
      ? landmark.description[0]
      : String(landmark.description ?? "")),
});
