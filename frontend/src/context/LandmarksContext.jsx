import { createContext, useContext, useEffect, useState } from "react";
import {
  createLandmark,
  deleteLandmark,
  fetchLandmarkById,
  fetchLandmarks,
  updateLandmark,
} from "../lib/api";
import { normalizeLandmarkMedia } from "../lib/landmarkMedia";
import { useAuth } from "./AuthContext";

const LandmarksContext = createContext(null);

export function LandmarksProvider({ children }) {
  const { user } = useAuth();
  const [landmarks, setLandmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLandmarks = async () => {
    setIsLoading(true);

    try {
      const response = await fetchLandmarks();
      setLandmarks(response.map(normalizeLandmarkMedia));
    } catch (error) {
      console.warn("Failed to load landmarks:", error.message);
      setLandmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLandmarks();
  }, []);

  const addLandmark = async (payload) => {
    const created = await createLandmark({
      ...payload,
      requesterRole: user?.role,
    });

    setLandmarks((current) => [...current, normalizeLandmarkMedia(created)]);
    return created;
  };

  const editLandmark = async (id, payload) => {
    const updated = await updateLandmark(id, {
      ...payload,
      requesterRole: user?.role,
    });

    setLandmarks((current) =>
      current.map((landmark) =>
        landmark.id === id ? normalizeLandmarkMedia(updated) : landmark
      )
    );

    return updated;
  };

  const removeLandmark = async (id) => {
    await deleteLandmark(id, user?.role);
    setLandmarks((current) => current.filter((landmark) => landmark.id !== id));
  };

  const getLandmark = async (id) => {
    const existing = landmarks.find((landmark) => landmark.id === id);

    if (existing) {
      return existing;
    }

    const landmark = await fetchLandmarkById(id);
    return normalizeLandmarkMedia(landmark);
  };

  return (
    <LandmarksContext.Provider
      value={{
        landmarks,
        isLoading,
        loadLandmarks,
        addLandmark,
        editLandmark,
        removeLandmark,
        getLandmark,
      }}
    >
      {children}
    </LandmarksContext.Provider>
  );
}

export function useLandmarks() {
  const context = useContext(LandmarksContext);

  if (!context) {
    throw new Error("useLandmarks must be used within LandmarksProvider.");
  }

  return context;
}
