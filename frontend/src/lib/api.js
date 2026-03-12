const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }

  return data;
}

export const signupUser = (payload) =>
  request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginUser = (payload) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchLandmarks = () => request("/landmarks");

export const fetchLandmarkById = (id) => request(`/landmarks/${id}`);
export const fetchEvents = () => request("/events");
export const fetchEventsByLandmark = (id) => request(`/landmarks/${id}/events`);

export const createLandmark = (payload) =>
  request("/landmarks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createMonumentEvent = (payload) =>
  request("/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const registerForEvent = (id, payload) =>
  request(`/events/${id}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateLandmark = (id, payload) =>
  request(`/landmarks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteLandmark = (id, role) =>
  request(`/landmarks/${id}`, {
    method: "DELETE",
    headers: {
      "x-user-role": role ?? "",
    },
  });

export const deleteMonumentEvent = (id, role) =>
  request(`/events/${id}`, {
    method: "DELETE",
    headers: {
      "x-user-role": role ?? "",
    },
  });

export const trackEvent = async (payload) => {
  console.log("[TravelVerse track]", payload);

  try {
    return await request("/track", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Tracking request failed:", error.message);
    return { success: false, offline: true };
  }
};

export const getStatsSummary = async () => {
  try {
    return await request("/stats/summary");
  } catch (error) {
    console.warn("Stats request failed:", error.message);
    return { scans: 0, landmarkViews: 0, feedbackResponses: 0 };
  }
};
