import express from "express";
import cors from "cors";
import { createDataStore } from "./db.js";

const port = process.env.PORT || 4000;
const app = express();
const store = await createDataStore();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["*"],
  })
);
// Landmark creation currently sends image/audio uploads as base64 strings.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const sendValidationError = (response, message) =>
  response.status(400).json({ error: message });

const isContentManager = (value) => value === "content-manager";

app.get("/api/health", (request, response) => {
  response.json({ status: "ok", datastore: store.mode });
});

app.post("/api/auth/signup", async (request, response) => {
  const { name = "", email = "", password = "", role = "traveler" } = request.body ?? {};

  if (!name.trim() || !email.trim() || !password.trim()) {
    sendValidationError(response, "Name, email, and password are required.");
    return;
  }

  if (!["traveler", "content-manager"].includes(role)) {
    sendValidationError(response, "A valid role is required.");
    return;
  }

  try {
    const user = await store.createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });

    response.status(201).json({
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    if (error.message === "USER_EXISTS") {
      response.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Unable to create account." });
  }
});

app.get("/api/landmarks", async (request, response) => {
  const landmarks = await store.listLandmarks();
  response.json(landmarks);
});

app.get("/api/landmarks/:id", async (request, response) => {
  const landmark = await store.getLandmarkById(request.params.id);

  if (!landmark) {
    response.status(404).json({ error: "Landmark not found." });
    return;
  }

  response.json(landmark);
});

app.get("/api/landmarks/:id/events", async (request, response) => {
  const events = await store.listEventsByLandmark(request.params.id);
  response.json(events);
});

app.get("/api/events", async (request, response) => {
  const events = await store.listEvents();
  response.json(events);
});

app.get("/api/events/:id/registrations", async (request, response) => {
  const registrations = await store.listRegistrationsByEvent(request.params.id);
  response.json(registrations);
});

app.post("/api/landmarks", async (request, response) => {
  const {
    name = "",
    location = "",
    entryFee = "",
    bestTime = "",
    description = "",
    image = "",
    audioGuide = "",
    interestingFacts = [],
    requesterRole = "",
  } = request.body ?? {};

  if (!isContentManager(requesterRole)) {
    response.status(403).json({ error: "Only content managers can add landmarks." });
    return;
  }

  if (!name.trim() || !location.trim() || !description.trim()) {
    sendValidationError(response, "Name, location, and description are required.");
    return;
  }

  const landmark = await store.createLandmark({
    name: name.trim(),
    location: location.trim(),
    entryFee: entryFee.trim(),
    bestTime: bestTime.trim(),
    description: description.trim(),
    image: image.trim(),
    audioGuide: audioGuide.trim(),
    interestingFacts: Array.isArray(interestingFacts)
      ? interestingFacts.filter(Boolean)
      : [],
  });

  response.status(201).json(landmark);
});

app.post("/api/events", async (request, response) => {
  const {
    landmarkId = "",
    eventName = "",
    date = "",
    time = "",
    ticketPrice = "",
    description = "",
    requesterRole = "",
  } = request.body ?? {};

  if (!isContentManager(requesterRole)) {
    response.status(403).json({ error: "Only content managers can add events." });
    return;
  }

  if (!landmarkId.trim() || !eventName.trim() || !date.trim() || !time.trim()) {
    sendValidationError(response, "Landmark, event name, date, and time are required.");
    return;
  }

  const event = await store.createMonumentEvent({
    landmarkId: landmarkId.trim(),
    eventName: eventName.trim(),
    date: date.trim(),
    time: time.trim(),
    ticketPrice: Number(ticketPrice) || 0,
    description: description.trim(),
  });

  response.status(201).json(event);
});

app.post("/api/events/:id/register", async (request, response) => {
  const {
    travelerName = "",
    travelerEmail = "",
    landmarkId = "",
    landmarkName = "",
    eventName = "",
    ticketCount = 1,
    totalPrice = 0,
  } = request.body ?? {};

  if (!travelerName.trim() || !travelerEmail.trim()) {
    sendValidationError(response, "Traveler name and email are required.");
    return;
  }

  const bookingId = `TRV${Math.floor(1000 + Math.random() * 9000)}`;
  const registration = await store.createEventRegistration({
    bookingId,
    eventId: request.params.id,
    travelerName: travelerName.trim(),
    travelerEmail: travelerEmail.trim().toLowerCase(),
    landmarkId: landmarkId.trim(),
    landmarkName: landmarkName.trim(),
    eventName: eventName.trim(),
    ticketCount: Number(ticketCount) || 1,
    totalPrice: Number(totalPrice) || 0,
  });

  response.status(201).json({
    message: "Booking successful.",
    registration,
  });
});

app.delete("/api/events/:id", async (request, response) => {
  const requesterRole = request.headers["x-user-role"];

  if (!isContentManager(requesterRole)) {
    response.status(403).json({ error: "Only content managers can delete events." });
    return;
  }

  try {
    await store.deleteEvent(request.params.id);
    response.status(204).end();
  } catch (error) {
    if (error.message === "EVENT_NOT_FOUND") {
      response.status(404).json({ error: "Event not found." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Unable to delete event." });
  }
});

app.put("/api/landmarks/:id", async (request, response) => {
  const { requesterRole = "", ...updates } = request.body ?? {};

  if (!isContentManager(requesterRole)) {
    response.status(403).json({ error: "Only content managers can edit landmarks." });
    return;
  }

  try {
    const updatedLandmark = await store.updateLandmark(request.params.id, updates);
    response.json(updatedLandmark);
  } catch (error) {
    if (error.message === "LANDMARK_NOT_FOUND") {
      response.status(404).json({ error: "Landmark not found." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Unable to update landmark." });
  }
});

app.delete("/api/landmarks/:id", async (request, response) => {
  const requesterRole = request.headers["x-user-role"];

  if (!isContentManager(requesterRole)) {
    response.status(403).json({ error: "Only content managers can delete landmarks." });
    return;
  }

  try {
    await store.deleteLandmark(request.params.id);
    response.status(204).end();
  } catch (error) {
    if (error.message === "LANDMARK_NOT_FOUND") {
      response.status(404).json({ error: "Landmark not found." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Unable to delete landmark." });
  }
});

app.post("/api/auth/login", async (request, response) => {
  const { email = "", password = "" } = request.body ?? {};

  if (!email.trim() || !password.trim()) {
    sendValidationError(response, "Email and password are required.");
    return;
  }

  try {
    const user = await store.loginUser({
      email: email.trim(),
      password,
    });

    response.json({
      message: "Login successful.",
      user,
    });
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      response.status(401).json({ error: "Invalid email or password." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Unable to login." });
  }
});

app.post("/api/track", async (request, response) => {
  const { type = "", landmarkId = "", userEmail = "", feedback = "" } = request.body ?? {};

  if (!type.trim()) {
    sendValidationError(response, "Tracking type is required.");
    return;
  }

  await store.createTrackingEvent({
    type: type.trim(),
    landmarkId: landmarkId.trim(),
    userEmail: userEmail.trim().toLowerCase(),
    feedback: feedback.trim(),
  });

  console.log(`[track] ${type} ${landmarkId} ${feedback}`.trim());
  response.status(201).json({ success: true });
});

app.get("/api/stats/summary", async (request, response) => {
  const summary = await store.getSummary();
  response.json(summary);
});

app.listen(port, () => {
  console.log(`TravelVerse backend running on http://localhost:${port}`);
  console.log(`Datastore mode: ${store.mode}`);
});
