import crypto from "crypto";
import { MongoClient } from "mongodb";
import { seedLandmarks } from "./seedLandmarks.js";
import { seedEvents } from "./seedEvents.js";

const toUserPayload = (user) => ({
  id: user._id?.toString?.() ?? user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");

    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });

const verifyPassword = (password, storedHash) =>
  new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(":");

    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
    });
  });

const createMemoryStore = () => {
  const users = [];
  const events = [];
  const landmarks = seedLandmarks.map((landmark) => ({ ...landmark }));
  const monumentEvents = seedEvents.map((event) => ({ ...event }));
  const eventRegistrations = [];

  return {
    mode: "memory",
    async createUser({ name, email, password, role }) {
      const normalizedEmail = email.toLowerCase();

      if (users.find((user) => user.email === normalizedEmail)) {
        throw new Error("USER_EXISTS");
      }

      const user = {
        id: crypto.randomUUID(),
        name,
        email: normalizedEmail,
        role,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      users.push(user);
      return toUserPayload(user);
    },
    async loginUser({ email, password }) {
      const normalizedEmail = email.toLowerCase();
      const user = users.find((entry) => entry.email === normalizedEmail);

      if (!user) {
        throw new Error("INVALID_CREDENTIALS");
      }

      const matches = await verifyPassword(password, user.passwordHash);

      if (!matches) {
        throw new Error("INVALID_CREDENTIALS");
      }

      return toUserPayload(user);
    },
    async createTrackingEvent(event) {
      events.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...event,
      });
    },
    async getSummary() {
      return events.reduce(
        (summary, event) => {
          if (event.type === "scan") summary.scans += 1;
          if (event.type === "landmark_view") summary.landmarkViews += 1;
          if (event.type === "feedback") summary.feedbackResponses += 1;
          if (event.type === "event_booking") summary.eventBookings += 1;
          return summary;
        },
        { scans: 0, landmarkViews: 0, feedbackResponses: 0, eventBookings: 0 }
      );
    },
    async listEvents() {
      return monumentEvents;
    },
    async listEventsByLandmark(landmarkId) {
      return monumentEvents.filter((event) => event.landmarkId === landmarkId);
    },
    async createMonumentEvent(event) {
      const nextEvent = {
        ...event,
        id:
          event.id ||
          event.eventName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
      };
      monumentEvents.push(nextEvent);
      return nextEvent;
    },
    async deleteEvent(id) {
      const index = monumentEvents.findIndex((event) => event.id === id);

      if (index === -1) {
        throw new Error("EVENT_NOT_FOUND");
      }

      monumentEvents.splice(index, 1);
    },
    async createEventRegistration(registration) {
      const nextRegistration = {
        ...registration,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      eventRegistrations.push(nextRegistration);
      return nextRegistration;
    },
    async listRegistrationsByEvent(eventId) {
      return eventRegistrations.filter((registration) => registration.eventId === eventId);
    },
    async listLandmarks() {
      return landmarks;
    },
    async getLandmarkById(id) {
      return landmarks.find((landmark) => landmark.id === id) ?? null;
    },
    async createLandmark(landmark) {
      const nextLandmark = {
        ...landmark,
        id:
          landmark.id ||
          landmark.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
      };
      landmarks.push(nextLandmark);
      return nextLandmark;
    },
    async updateLandmark(id, updates) {
      const index = landmarks.findIndex((landmark) => landmark.id === id);

      if (index === -1) {
        throw new Error("LANDMARK_NOT_FOUND");
      }

      landmarks[index] = { ...landmarks[index], ...updates, id };
      return landmarks[index];
    },
    async deleteLandmark(id) {
      const index = landmarks.findIndex((landmark) => landmark.id === id);

      if (index === -1) {
        throw new Error("LANDMARK_NOT_FOUND");
      }

      landmarks.splice(index, 1);
    },
  };
};

const createMongoStore = async (connectionString) => {
  const client = new MongoClient(connectionString);
  await client.connect();

  const database = client.db("travelverse");
  const usersCollection = database.collection("users");
  const eventsCollection = database.collection("events");
  const landmarksCollection = database.collection("landmarks");
  const monumentEventsCollection = database.collection("monumentEvents");
  const registrationsCollection = database.collection("eventRegistrations");

  await Promise.all([
    usersCollection.createIndex({ email: 1 }, { unique: true }),
    eventsCollection.createIndex({ type: 1, createdAt: -1 }),
    landmarksCollection.createIndex({ id: 1 }, { unique: true }),
    monumentEventsCollection.createIndex({ id: 1 }, { unique: true }),
    monumentEventsCollection.createIndex({ landmarkId: 1, date: 1 }),
    registrationsCollection.createIndex({ eventId: 1, createdAt: -1 }),
  ]);

  if ((await landmarksCollection.countDocuments()) === 0) {
    await landmarksCollection.insertMany(seedLandmarks);
  }

  if ((await monumentEventsCollection.countDocuments()) === 0) {
    await monumentEventsCollection.insertMany(seedEvents);
  }

  return {
    mode: "mongodb",
    async createUser({ name, email, password, role }) {
      const normalizedEmail = email.toLowerCase();
      const document = {
        name,
        email: normalizedEmail,
        role,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      try {
        const result = await usersCollection.insertOne(document);
        return toUserPayload({ ...document, _id: result.insertedId });
      } catch (error) {
        if (error?.code === 11000) {
          throw new Error("USER_EXISTS");
        }

        throw error;
      }
    },
    async loginUser({ email, password }) {
      const normalizedEmail = email.toLowerCase();
      const user = await usersCollection.findOne({ email: normalizedEmail });

      if (!user) {
        throw new Error("INVALID_CREDENTIALS");
      }

      const matches = await verifyPassword(password, user.passwordHash);

      if (!matches) {
        throw new Error("INVALID_CREDENTIALS");
      }

      return toUserPayload(user);
    },
    async createTrackingEvent(event) {
      await eventsCollection.insertOne({
        ...event,
        createdAt: new Date().toISOString(),
      });
    },
    async getSummary() {
      const summary = { scans: 0, landmarkViews: 0, feedbackResponses: 0 };

      const grouped = await eventsCollection
        .aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ])
        .toArray();

      grouped.forEach(({ _id, count }) => {
        if (_id === "scan") summary.scans = count;
        if (_id === "landmark_view") summary.landmarkViews = count;
        if (_id === "feedback") summary.feedbackResponses = count;
        if (_id === "event_booking") summary.eventBookings = count;
      });

      return summary;
    },
    async listEvents() {
      return monumentEventsCollection.find({}, { projection: { _id: 0 } }).toArray();
    },
    async listEventsByLandmark(landmarkId) {
      return monumentEventsCollection
        .find({ landmarkId }, { projection: { _id: 0 } })
        .toArray();
    },
    async createMonumentEvent(event) {
      const nextEvent = {
        ...event,
        id:
          event.id ||
          event.eventName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
      };

      await monumentEventsCollection.insertOne(nextEvent);
      return nextEvent;
    },
    async deleteEvent(id) {
      const result = await monumentEventsCollection.deleteOne({ id });

      if (!result.deletedCount) {
        throw new Error("EVENT_NOT_FOUND");
      }
    },
    async createEventRegistration(registration) {
      const nextRegistration = {
        ...registration,
        createdAt: new Date().toISOString(),
      };

      const result = await registrationsCollection.insertOne(nextRegistration);
      return {
        id: result.insertedId.toString(),
        ...nextRegistration,
      };
    },
    async listRegistrationsByEvent(eventId) {
      return registrationsCollection
        .find({ eventId }, { projection: { _id: 0 } })
        .toArray();
    },
    async listLandmarks() {
      return landmarksCollection.find({}, { projection: { _id: 0 } }).toArray();
    },
    async getLandmarkById(id) {
      return landmarksCollection.findOne({ id }, { projection: { _id: 0 } });
    },
    async createLandmark(landmark) {
      const nextLandmark = {
        ...landmark,
        id:
          landmark.id ||
          landmark.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
      };

      await landmarksCollection.insertOne(nextLandmark);
      return nextLandmark;
    },
    async updateLandmark(id, updates) {
      const result = await landmarksCollection.findOneAndUpdate(
        { id },
        { $set: { ...updates, id } },
        { returnDocument: "after", projection: { _id: 0 } }
      );

      if (!result) {
        throw new Error("LANDMARK_NOT_FOUND");
      }

      return result;
    },
    async deleteLandmark(id) {
      const result = await landmarksCollection.deleteOne({ id });

      if (!result.deletedCount) {
        throw new Error("LANDMARK_NOT_FOUND");
      }
    },
    async close() {
      await client.close();
    },
  };
};

export const createDataStore = async () => {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    return createMemoryStore();
  }

  try {
    return await createMongoStore(connectionString);
  } catch (error) {
    console.error("MongoDB connection failed. Falling back to memory store.", error);
    return createMemoryStore();
  }
};
