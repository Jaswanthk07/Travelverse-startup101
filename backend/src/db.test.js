import test from "node:test";
import assert from "node:assert/strict";
import { createDataStore } from "./db.js";

test("memory store creates and logs in a user", async () => {
  delete process.env.MONGODB_URI;
  const store = await createDataStore();

  const user = await store.createUser({
    name: "Test User",
    email: "test@example.com",
    password: "secret123",
    role: "traveler",
  });

  assert.equal(user.email, "test@example.com");
  assert.equal(user.role, "traveler");

  const loggedInUser = await store.loginUser({
    email: "TEST@example.com",
    password: "secret123",
  });

  assert.equal(loggedInUser.email, "test@example.com");
  assert.equal(loggedInUser.name, "Test User");
});

test("memory store tracks summary counts", async () => {
  delete process.env.MONGODB_URI;
  const store = await createDataStore();

  await store.createTrackingEvent({ type: "scan" });
  await store.createTrackingEvent({ type: "landmark_view" });
  await store.createTrackingEvent({ type: "feedback" });
  await store.createTrackingEvent({ type: "event_booking" });

  const summary = await store.getSummary();

  assert.equal(summary.scans, 1);
  assert.equal(summary.landmarkViews, 1);
  assert.equal(summary.feedbackResponses, 1);
  assert.equal(summary.eventBookings, 1);
  assert.equal(summary.totalEvents, 2);
  assert.equal(summary.totalLandmarks, 3);
});

test("memory store creates, updates, and deletes landmark content", async () => {
  delete process.env.MONGODB_URI;
  const store = await createDataStore();

  const landmark = await store.createLandmark({
    name: "Test Fort",
    location: "Hyderabad",
    entryFee: "100",
    bestTime: "Morning",
    description: "Test description",
    image: "",
    audioGuide: "",
    interestingFacts: ["Fact 1"],
  });

  assert.equal(landmark.id, "test-fort");

  const updated = await store.updateLandmark(landmark.id, {
    description: "Updated description",
  });

  assert.deepEqual(updated.description, ["Updated description"]);

  await store.deleteLandmark(landmark.id);

  const missingLandmark = await store.getLandmarkById(landmark.id);
  assert.equal(missingLandmark, null);
});
