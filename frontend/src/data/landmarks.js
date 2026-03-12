import landmarkData from "./landmarks.json";
import tajMahalImage from "../assets/taj-mahal.svg";
import qutubMinarImage from "../assets/qutub-minar.svg";
import charminarImage from "../assets/charminar.svg";

const imageMap = {
  "taj-mahal": tajMahalImage,
  "qutub-minar": qutubMinarImage,
  charminar: charminarImage,
};

const factsMap = {
  "taj-mahal": [
    "The complex combines Persian, Islamic, and Indian design influences.",
    "Its marble reflects different hues through the day, especially at sunrise and sunset.",
    "UNESCO recognized the Taj Mahal as a World Heritage Site in 1983.",
  ],
  "qutub-minar": [
    "At over 72 meters, it is one of the tallest brick minarets in the world.",
    "The tower was built in stages by multiple rulers of the Delhi Sultanate.",
    "The surrounding Qutub complex includes the Iron Pillar and early mosque ruins.",
  ],
  charminar: [
    "Charminar was built in 1591 and became the symbolic center of Hyderabad.",
    "Its name literally refers to the monument's four minarets.",
    "The nearby bazaars make it a living heritage destination, not just a static monument.",
  ],
};

const audioGuideMap = {
  "taj-mahal": "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
  "qutub-minar": "https://samplelib.com/lib/preview/mp3/sample-15s.mp3",
  charminar: "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
};

const badgeMap = {
  "taj-mahal": "Most Scanned",
  "qutub-minar": "Heritage Pick",
  charminar: "City Favorite",
};

const landmarks = landmarkData.map((landmark) => ({
  ...landmark,
  image: imageMap[landmark.id],
  audioGuide: audioGuideMap[landmark.id],
  interestingFacts: factsMap[landmark.id],
  badge: badgeMap[landmark.id],
  shortDescription: landmark.description[0],
}));

export const getLandmarkById = (id) =>
  landmarks.find((landmark) => landmark.id === id);

export default landmarks;
