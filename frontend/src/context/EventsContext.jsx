import { createContext, useContext, useEffect, useState } from "react";
import {
  createMonumentEvent,
  deleteMonumentEvent,
  fetchEvents,
  fetchEventsByLandmark,
} from "../lib/api";
import { useAuth } from "./AuthContext";

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    setIsLoading(true);

    try {
      const response = await fetchEvents();
      setEvents(response);
    } catch (error) {
      console.warn("Failed to load events:", error.message);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const addEvent = async (payload) => {
    const created = await createMonumentEvent({
      ...payload,
      requesterRole: user?.role,
    });

    setEvents((current) => [...current, created]);
    return created;
  };

  const removeEvent = async (id) => {
    await deleteMonumentEvent(id, user?.role);
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  const getEventsForLandmark = async (landmarkId) => {
    const existing = events.filter((event) => event.landmarkId === landmarkId);

    if (existing.length > 0) {
      return existing;
    }

    return fetchEventsByLandmark(landmarkId);
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
