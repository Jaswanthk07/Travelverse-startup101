import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  createMonumentEvent,
  deleteMonumentEvent,
  fetchEvents,
  fetchEventsByLandmark,
} from "../lib/api";

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedEventsRef = useRef(false);

  const loadEvents = async ({ silent = false } = {}) => {
    const shouldShowLoader = !silent || !hasLoadedEventsRef.current;

    if (shouldShowLoader) {
      setIsLoading(true);
    }

    try {
      const response = await fetchEvents();
      setEvents(response);
      hasLoadedEventsRef.current = true;
    } catch (error) {
      console.warn("Failed to load events:", error.message);

      if (!hasLoadedEventsRef.current) {
        setEvents([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const addEvent = async (payload) => {
    const created = await createMonumentEvent(payload);

    setEvents((current) => [...current, created]);
    return created;
  };

  const removeEvent = async (id) => {
    await deleteMonumentEvent(id);
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  const getEventsForLandmark = async (landmarkId) => {
    try {
      const latest = await fetchEventsByLandmark(landmarkId);

      setEvents((current) => {
        const unrelated = current.filter((event) => event.landmarkId !== landmarkId);
        return [...unrelated, ...latest];
      });

      return latest;
    } catch (error) {
      const existing = events.filter((event) => event.landmarkId === landmarkId);

      if (existing.length > 0) {
        return existing;
      }

      throw error;
    }
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        isLoading,
        loadEvents,
        addEvent,
        removeEvent,
        getEventsForLandmark,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);

  if (!context) {
    throw new Error("useEvents must be used within EventsProvider.");
  }

  return context;
}
