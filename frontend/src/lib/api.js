export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let authToken = "";

export const setAuthToken = (token) => {
  authToken = token ?? "";
};

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
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

export const fetchCurrentUser = () => request("/auth/me");

export const fetchLandmarks = () => request("/landmarks");

export const searchLandmarks = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return request(`/search/landmarks?${params.toString()}`);
};

export const fetchLandmarkById = (id) => request(`/landmarks/${id}`);
export const fetchCrowdStatus = (id) => request(`/landmarks/${id}/crowd`);
export const fetchEvents = () => request("/events");
export const fetchEventsByLandmark = (id) => request(`/landmarks/${id}/events`);
export const fetchFriendActivity = (userEmail = "") =>
  request(`/friends/activity?userEmail=${encodeURIComponent(userEmail)}`);
export const fetchDiscoverableUsers = () => request("/users/discover");
export const followUser = (userId) =>
  request(`/friends/follow/${userId}`, { method: "POST" });
export const createCheckIn = (payload) =>
  request("/checkins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const fetchPlans = () => request("/plans");

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

export const createBookingCheckout = (payload) =>
  request("/bookings/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchBookingHistory = () => request("/bookings/history");

export const updateLandmark = (id, payload) =>
  request(`/landmarks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteLandmark = (id) =>
  request(`/landmarks/${id}`, {
    method: "DELETE",
  });

export const deleteMonumentEvent = (id) =>
  request(`/events/${id}`, {
    method: "DELETE",
  });

export const trackEvent = async (payload) => {
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
    return {
      scans: 0,
      landmarkViews: 0,
      feedbackResponses: 0,
      eventBookings: 0,
      bookingStarts: 0,
      sessions: 0,
      totalEvents: 0,
      totalUsers: 0,
      totalBookings: 0,
      totalCheckIns: 0,
      totalLandmarks: 0,
      topLandmarks: [],
    };
  }
};
