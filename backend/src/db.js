import crypto from "crypto";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { seedLandmarks } from "./seedLandmarks.js";
import { seedEvents } from "./seedEvents.js";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const createSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeDescription = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value ?? "")
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

const toIso = () => new Date().toISOString();

const toUserPayload = (user) => ({
  id: user._id?.toString?.() ?? user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl,
  subscription: user.subscription ?? null,
  createdAt: user.createdAt,
});

const enrichLandmark = (landmark) => ({
  ...landmark,
  id: landmark.id || createSlug(landmark.name),
  type: landmark.type || landmark.badge || "heritage",
  city: landmark.city || landmark.location,
  description: normalizeDescription(landmark.description),
  shortDescription:
    landmark.shortDescription ||
    normalizeDescription(landmark.description)[0] ||
    "",
});

const parseEntryFee = (value) => {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : 100;
};

const summarizeTracking = (events, extras = {}) => {
  const summary = {
    scans: 0,
    landmarkViews: 0,
    feedbackResponses: 0,
    eventBookings: 0,
    bookingStarts: 0,
    sessions: 0,
    totalEvents: extras.totalEvents ?? 0,
    totalUsers: extras.totalUsers ?? 0,
    totalBookings: extras.totalBookings ?? 0,
    totalCheckIns: extras.totalCheckIns ?? 0,
    totalLandmarks: extras.totalLandmarks ?? 0,
    topLandmarks: [],
  };

  const landmarkScores = new Map();

  events.forEach((event) => {
    if (event.type === "scan") summary.scans += 1;
    if (event.type === "landmark_view") summary.landmarkViews += 1;
    if (event.type === "feedback") summary.feedbackResponses += 1;
    if (event.type === "event_booking") summary.eventBookings += 1;
    if (event.type === "booking_start") summary.bookingStarts += 1;
    if (event.type === "session_start") summary.sessions += 1;

    if (event.landmarkId) {
      landmarkScores.set(
        event.landmarkId,
        (landmarkScores.get(event.landmarkId) ?? 0) + 1
      );
    }
  });

  summary.topLandmarks = [...landmarkScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([landmarkId, count]) => ({ landmarkId, count }));

  return summary;
};

const createDemoActivity = () => [
  {
    id: "friend-1",
    actorName: "Koushik",
    actorAvatar: "https://api.dicebear.com/8.x/initials/svg?seed=Koushik",
    action: "visited",
    landmarkName: "Charminar",
    landmarkId: "charminar",
    image: "/images/charminar.svg",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "friend-2",
    actorName: "Saikiran",
    actorAvatar: "https://api.dicebear.com/8.x/initials/svg?seed=Saikiran",
    action: "saved",
    landmarkName: "Qutub Minar",
    landmarkId: "qutub-minar",
    image: "/images/qutub-minar.svg",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "friend-3",
    actorName: "Bhargav",
    actorAvatar: "https://api.dicebear.com/8.x/initials/svg?seed=Bhargav",
    action: "booked",
    landmarkName: "Taj Mahal",
    landmarkId: "taj-mahal",
    image: "/images/taj-mahal.svg",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

const createMemoryStore = () => {
  const users = [];
  const trackingEvents = [];
  const landmarks = seedLandmarks.map(enrichLandmark);
  const monumentEvents = seedEvents.map((event) => ({ ...event }));
  const eventRegistrations = [];
  const bookings = [];
  const follows = [];
  const checkIns = [];

  const findUserById = (id) => users.find((user) => user.id === id);

  return {
    mode: "memory",
    async createUser({ name, email, password, role }) {
      const normalizedEmail = normalizeEmail(email);

      if (users.find((user) => user.email === normalizedEmail)) {
        throw new Error("USER_EXISTS");
      }

      const user = {
        id: crypto.randomUUID(),
        name,
        email: normalizedEmail,
        role,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
        passwordHash: await bcrypt.hash(password, 12),
        subscription: null,
        createdAt: toIso(),
      };

      users.push(user);
      return toUserPayload(user);
    },
    async loginUser({ email, password }) {
      const user = users.find((entry) => entry.email === normalizeEmail(email));

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new Error("INVALID_CREDENTIALS");
      }

      return toUserPayload(user);
    },
    async getUserById(id) {
      const user = findUserById(id);
      return user ? toUserPayload(user) : null;
    },
    async updateUserSubscription(userId, subscription) {
      const user = findUserById(userId);

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      user.subscription = subscription;
      user.updatedAt = toIso();
      return toUserPayload(user);
    },
    async listDiscoverableUsers(currentUserId = "") {
      const people = users
        .filter((user) => user.id !== currentUserId)
        .map(toUserPayload);

      return people.length
        ? people
        : [
            {
              id: "demo-koushik",
              name: "Koushik",
              email: "koushik@example.com",
              role: "traveler",
              avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Koushik",
            },
            {
              id: "demo-saikiran",
              name: "Saikiran",
              email: "saikiran@example.com",
              role: "traveler",
              avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Saikiran",
            },
          ];
    },
    async followUser({ followerId, followingId }) {
      if (!follows.find((follow) => follow.followerId === followerId && follow.followingId === followingId)) {
        follows.push({ id: crypto.randomUUID(), followerId, followingId, createdAt: toIso() });
      }
      return { success: true };
    },
    async createCheckIn(checkIn) {
      const landmark = landmarks.find((item) => item.id === checkIn.landmarkId);
      const user = findUserById(checkIn.userId);
      const document = {
        id: crypto.randomUUID(),
        ...checkIn,
        landmarkName: landmark?.name ?? checkIn.landmarkName ?? checkIn.landmarkId,
        image: checkIn.image || landmark?.image,
        actorName: user?.name ?? checkIn.actorName ?? "Traveler",
        actorAvatar: user?.avatarUrl,
        createdAt: toIso(),
      };
      checkIns.push(document);
      trackingEvents.push({
        id: crypto.randomUUID(),
        type: "check_in",
        landmarkId: document.landmarkId,
        userId: document.userId,
        createdAt: document.createdAt,
      });
      return document;
    },
    async listFriendActivity(userId = "", userEmail = "") {
      const followedIds = follows
        .filter((follow) => follow.followerId === userId)
        .map((follow) => follow.followingId);

      const visibleCheckIns = checkIns
        .filter((item) => !followedIds.length || followedIds.includes(item.userId))
        .map((item) => ({ ...item, action: "checked in" }));

      const visibleBookings = bookings
        .filter((booking) => booking.userEmail !== userEmail)
        .map((booking) => ({
          id: booking.id,
          actorName: booking.userName,
          actorAvatar: booking.userAvatar,
          action: booking.status === "confirmed" ? "booked" : "started booking",
          landmarkId: booking.landmarkId,
          landmarkName: booking.landmarkName,
          image: booking.landmarkImage,
          createdAt: booking.createdAt,
        }));

      return [...visibleCheckIns, ...visibleBookings, ...createDemoActivity()]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);
    },
    async createTrackingEvent(event) {
      trackingEvents.push({
        id: crypto.randomUUID(),
        createdAt: toIso(),
        ...event,
      });
    },
    async getSummary() {
      return summarizeTracking(trackingEvents, {
        totalEvents: monumentEvents.length,
        totalUsers: users.length,
        totalBookings: bookings.length,
        totalCheckIns: checkIns.length,
        totalLandmarks: landmarks.length,
      });
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
        id: event.id || createSlug(event.eventName),
        category: event.category || "festival",
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
        createdAt: toIso(),
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
    async listCreatorLandmarks(creatorId) {
      return landmarks.filter((landmark) => landmark.createdBy === creatorId);
    },
    async searchLandmarks({ q = "", city = "", type = "" } = {}) {
      const term = q.trim().toLowerCase();
      return landmarks.filter((landmark) => {
        const matchesTerm =
          !term ||
          [landmark.name, landmark.location, landmark.type, landmark.shortDescription]
            .join(" ")
            .toLowerCase()
            .includes(term);
        const matchesCity =
          !city || landmark.location.toLowerCase() === city.toLowerCase();
        const matchesType =
          !type || String(landmark.type).toLowerCase() === type.toLowerCase();

        return matchesTerm && matchesCity && matchesType;
      });
    },
    async getLandmarkById(id) {
      return landmarks.find((landmark) => landmark.id === id) ?? null;
    },
    async createLandmark(landmark) {
      const nextLandmark = enrichLandmark({
        ...landmark,
        id: landmark.id || createSlug(landmark.name),
      });
      landmarks.push(nextLandmark);
      return nextLandmark;
    },
    async getCreatorStats(creatorId) {
      const creatorLandmarks = landmarks.filter((landmark) => landmark.createdBy === creatorId);
      const creatorLandmarkIds = new Set(creatorLandmarks.map((landmark) => landmark.id));
      const totalViews = trackingEvents.filter(
        (event) => event.type === "landmark_view" && creatorLandmarkIds.has(event.landmarkId)
      ).length;
      const totalBookings = bookings.filter(
        (booking) => booking.status === "confirmed" && creatorLandmarkIds.has(booking.landmarkId)
      ).length;
      const recentActivity = trackingEvents
        .filter(
          (event) => event.type === "landmark_view" && creatorLandmarkIds.has(event.landmarkId)
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map((event) => ({
          ...event,
          timestamp: event.createdAt,
        }));

      return {
        monumentCount: creatorLandmarks.length,
        totalViews,
        totalBookings,
        recentActivity,
      };
    },
    async updateLandmark(id, updates) {
      const index = landmarks.findIndex((landmark) => landmark.id === id);

      if (index === -1) {
        throw new Error("LANDMARK_NOT_FOUND");
      }

      landmarks[index] = enrichLandmark({ ...landmarks[index], ...updates, id });
      return landmarks[index];
    },
    async deleteLandmark(id) {
      const index = landmarks.findIndex((landmark) => landmark.id === id);

      if (index === -1) {
        throw new Error("LANDMARK_NOT_FOUND");
      }

      landmarks.splice(index, 1);
    },
    async createBooking(booking) {
      const landmark = landmarks.find((item) => item.id === booking.landmarkId);
      const event = monumentEvents.find((item) => item.id === booking.eventId);
      const user = findUserById(booking.userId);
      const document = {
        id: crypto.randomUUID(),
        bookingCode: `TRV${Math.floor(100000 + Math.random() * 900000)}`,
        status: "pending",
        currency: "inr",
        landmarkName: landmark?.name ?? booking.landmarkName,
        landmarkImage: landmark?.image,
        eventName: event?.eventName ?? booking.eventName,
        userName: user?.name ?? booking.userName,
        userEmail: user?.email ?? booking.userEmail,
        userAvatar: user?.avatarUrl,
        createdAt: toIso(),
        ...booking,
      };
      bookings.push(document);
      return document;
    },
    async updateBooking(id, updates) {
      const index = bookings.findIndex((booking) => booking.id === id);
      if (index === -1) throw new Error("BOOKING_NOT_FOUND");
      bookings[index] = { ...bookings[index], ...updates, updatedAt: toIso() };
      return bookings[index];
    },
    async confirmBookingByStripeSession(stripeSessionId, updates = {}) {
      const index = bookings.findIndex((booking) => booking.stripeSessionId === stripeSessionId);
      if (index === -1) return null;
      bookings[index] = {
        ...bookings[index],
        ...updates,
        status: "confirmed",
        paidAt: toIso(),
        updatedAt: toIso(),
      };
      trackingEvents.push({
        id: crypto.randomUUID(),
        type: "event_booking",
        landmarkId: bookings[index].landmarkId,
        userId: bookings[index].userId,
        metadata: { bookingId: bookings[index].id },
        createdAt: toIso(),
      });
      return bookings[index];
    },
    async listBookingsByUser(userId) {
      return bookings
        .filter((booking) => booking.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async listCreatorPendingBookings(creatorId) {
      return bookings
        .filter(
          (booking) =>
            booking.creatorId === creatorId &&
            ["pending-approval", "pending"].includes(booking.status)
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async approveBooking(id, updates = {}) {
      const index = bookings.findIndex((booking) => booking.id === id);
      if (index === -1) throw new Error("BOOKING_NOT_FOUND");
      bookings[index] = {
        ...bookings[index],
        ...updates,
        status: "confirmed",
        approvalStatus: "approved",
        approvedAt: toIso(),
        updatedAt: toIso(),
      };
      trackingEvents.push({
        id: crypto.randomUUID(),
        type: "event_booking",
        landmarkId: bookings[index].landmarkId,
        userId: bookings[index].userId,
        metadata: { bookingId: bookings[index].id },
        createdAt: toIso(),
      });
      return bookings[index];
    },
    calculateBookingQuote({
      landmarkId,
      eventId,
      adults = 1,
      students = 0,
      children = 0,
      discountPercent = 0,
    }) {
      const landmark = landmarks.find((item) => item.id === landmarkId);
      const event = monumentEvents.find((item) => item.id === eventId);
      const base = Number(event?.ticketPrice) || parseEntryFee(landmark?.entryFee);
      const discountMultiplier = Math.max(0, 1 - Number(discountPercent || 0) / 100);
      const lineItems = [
        {
          label: "Adults",
          quantity: Number(adults) || 0,
          unitAmount: Math.round(base * discountMultiplier),
        },
        {
          label: "Students",
          quantity: Number(students) || 0,
          unitAmount: Math.round(base * 0.7 * discountMultiplier),
        },
        {
          label: "Children",
          quantity: Number(children) || 0,
          unitAmount: Math.round(base * 0.5 * discountMultiplier),
        },
      ].filter((item) => item.quantity > 0);
      const totalAmount = lineItems.reduce(
        (total, item) => total + item.quantity * item.unitAmount,
        0
      );

      return { landmark, event, lineItems, totalAmount, discountPercent: Number(discountPercent || 0) };
    },
  };
};

const createMongoStore = async (connectionString) => {
  const client = new MongoClient(connectionString);
  await client.connect();

  const database = client.db(process.env.MONGODB_DB_NAME || "travelverse");
  const usersCollection = database.collection("users");
  const trackingCollection = database.collection("trackingEvents");
  const landmarksCollection = database.collection("landmarks");
  const monumentEventsCollection = database.collection("monumentEvents");
  const registrationsCollection = database.collection("eventRegistrations");
  const bookingsCollection = database.collection("bookings");
  const followsCollection = database.collection("follows");
  const checkInsCollection = database.collection("checkIns");

  await Promise.all([
    usersCollection.createIndex({ email: 1 }, { unique: true }),
    trackingCollection.createIndex({ type: 1, createdAt: -1 }),
    trackingCollection.createIndex({ userId: 1, createdAt: -1 }),
    landmarksCollection.createIndex({ id: 1 }, { unique: true }),
    landmarksCollection.createIndex({
      name: "text",
      location: "text",
      type: "text",
      shortDescription: "text",
      description: "text",
    }),
    monumentEventsCollection.createIndex({ id: 1 }, { unique: true }),
    monumentEventsCollection.createIndex({ landmarkId: 1, date: 1 }),
    registrationsCollection.createIndex({ eventId: 1, createdAt: -1 }),
    bookingsCollection.createIndex({ userId: 1, createdAt: -1 }),
    bookingsCollection.createIndex({ stripeSessionId: 1 }, { sparse: true }),
    bookingsCollection.createIndex({ status: 1, createdAt: -1 }),
    followsCollection.createIndex({ followerId: 1, followingId: 1 }, { unique: true }),
    checkInsCollection.createIndex({ userId: 1, createdAt: -1 }),
    checkInsCollection.createIndex({ landmarkId: 1, createdAt: -1 }),
  ]);

  if ((await landmarksCollection.countDocuments()) === 0) {
    await landmarksCollection.insertMany(seedLandmarks.map(enrichLandmark));
  }

  if ((await monumentEventsCollection.countDocuments()) === 0) {
    await monumentEventsCollection.insertMany(seedEvents);
  }

  const getUserByIdInternal = async (id) => {
    if (!id) return null;
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { id };
    return usersCollection.findOne(query);
  };

  const getLandmark = (id) =>
    landmarksCollection.findOne({ id }, { projection: { _id: 0 } });

  const getEvent = (id) =>
    monumentEventsCollection.findOne({ id }, { projection: { _id: 0 } });

  return {
    mode: "mongodb",
    async createUser({ name, email, password, role }) {
      const normalizedEmail = normalizeEmail(email);
      const document = {
        name,
        email: normalizedEmail,
        role,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`,
        passwordHash: await bcrypt.hash(password, 12),
        subscription: null,
        createdAt: toIso(),
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
      const user = await usersCollection.findOne({ email: normalizeEmail(email) });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new Error("INVALID_CREDENTIALS");
      }

      return toUserPayload(user);
    },
    async getUserById(id) {
      const user = await getUserByIdInternal(id);
      return user ? toUserPayload(user) : null;
    },
    async updateUserSubscription(userId, subscription) {
      const query = ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { id: userId };
      const result = await usersCollection.findOneAndUpdate(
        query,
        { $set: { subscription, updatedAt: toIso() } },
        { returnDocument: "after" }
      );

      if (!result) {
        throw new Error("USER_NOT_FOUND");
      }

      return toUserPayload(result);
    },
    async listDiscoverableUsers(currentUserId = "") {
      const users = await usersCollection
        .find(
          currentUserId && ObjectId.isValid(currentUserId)
            ? { _id: { $ne: new ObjectId(currentUserId) } }
            : {},
          { projection: { passwordHash: 0 } }
        )
        .limit(10)
        .toArray();

      return users.map(toUserPayload);
    },
    async followUser({ followerId, followingId }) {
      await followsCollection.updateOne(
        { followerId, followingId },
        { $setOnInsert: { followerId, followingId, createdAt: toIso() } },
        { upsert: true }
      );
      return { success: true };
    },
    async createCheckIn(checkIn) {
      const [landmark, user] = await Promise.all([
        getLandmark(checkIn.landmarkId),
        getUserByIdInternal(checkIn.userId),
      ]);
      const document = {
        ...checkIn,
        landmarkName: landmark?.name ?? checkIn.landmarkName ?? checkIn.landmarkId,
        image: checkIn.image || landmark?.image,
        actorName: user?.name ?? checkIn.actorName ?? "Traveler",
        actorAvatar: user?.avatarUrl,
        createdAt: toIso(),
      };

      const result = await checkInsCollection.insertOne(document);
      await trackingCollection.insertOne({
        type: "check_in",
        landmarkId: document.landmarkId,
        userId: document.userId,
        createdAt: document.createdAt,
      });

      return { id: result.insertedId.toString(), ...document };
    },
    async listFriendActivity(userId = "", userEmail = "") {
      const followed = await followsCollection
        .find({ followerId: userId }, { projection: { _id: 0, followingId: 1 } })
        .toArray();
      const followedIds = followed.map((item) => item.followingId);
      const checkInQuery = followedIds.length ? { userId: { $in: followedIds } } : {};

      const [checkIns, bookings] = await Promise.all([
        checkInsCollection.find(checkInQuery).sort({ createdAt: -1 }).limit(6).toArray(),
        bookingsCollection
          .find(userEmail ? { userEmail: { $ne: userEmail } } : {})
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray(),
      ]);

      return [
        ...checkIns.map((item) => ({
          id: item._id.toString(),
          actorName: item.actorName,
          actorAvatar: item.actorAvatar,
          action: "checked in",
          landmarkId: item.landmarkId,
          landmarkName: item.landmarkName,
          image: item.image,
          createdAt: item.createdAt,
        })),
        ...bookings.map((booking) => ({
          id: booking._id.toString(),
          actorName: booking.userName,
          actorAvatar: booking.userAvatar,
          action: booking.status === "confirmed" ? "booked" : "started booking",
          landmarkId: booking.landmarkId,
          landmarkName: booking.landmarkName,
          image: booking.landmarkImage,
          createdAt: booking.createdAt,
        })),
        ...createDemoActivity(),
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);
    },
    async createTrackingEvent(event) {
      await trackingCollection.insertOne({
        ...event,
        createdAt: toIso(),
      });
    },
    async getSummary() {
      const [
        grouped,
        topLandmarks,
        totalEvents,
        totalUsers,
        totalBookings,
        totalCheckIns,
        totalLandmarks,
      ] = await Promise.all([
        trackingCollection.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]).toArray(),
        trackingCollection
          .aggregate([
            { $match: { landmarkId: { $nin: [null, ""] } } },
            { $group: { _id: "$landmarkId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ])
          .toArray(),
        monumentEventsCollection.countDocuments(),
        usersCollection.countDocuments(),
        bookingsCollection.countDocuments(),
        checkInsCollection.countDocuments(),
        landmarksCollection.countDocuments(),
      ]);

      const summary = summarizeTracking([], {
        totalEvents,
        totalUsers,
        totalBookings,
        totalCheckIns,
        totalLandmarks,
      });

      grouped.forEach(({ _id, count }) => {
        if (_id === "scan") summary.scans = count;
        if (_id === "landmark_view") summary.landmarkViews = count;
        if (_id === "feedback") summary.feedbackResponses = count;
        if (_id === "event_booking") summary.eventBookings = count;
        if (_id === "booking_start") summary.bookingStarts = count;
        if (_id === "session_start") summary.sessions = count;
      });

      summary.topLandmarks = topLandmarks.map(({ _id, count }) => ({
        landmarkId: _id,
        count,
      }));

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
        id: event.id || createSlug(event.eventName),
        category: event.category || "festival",
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
        createdAt: toIso(),
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
    async listCreatorLandmarks(creatorId) {
      return landmarksCollection.find({ createdBy: creatorId }, { projection: { _id: 0 } }).toArray();
    },
    async searchLandmarks({ q = "", city = "", type = "" } = {}) {
      const query = {};

      if (q.trim()) {
        query.$text = { $search: q.trim() };
      }

      if (city) {
        query.location = city;
      }

      if (type) {
        query.type = type;
      }

      return landmarksCollection
        .find(query, {
          projection: q.trim() ? { _id: 0, score: { $meta: "textScore" } } : { _id: 0 },
          sort: q.trim() ? { score: { $meta: "textScore" } } : { name: 1 },
        })
        .limit(30)
        .toArray();
    },
    async getLandmarkById(id) {
      return getLandmark(id);
    },
    async createLandmark(landmark) {
      const nextLandmark = enrichLandmark({
        ...landmark,
        id: landmark.id || createSlug(landmark.name),
      });

      await landmarksCollection.insertOne(nextLandmark);
      return nextLandmark;
    },
    async getCreatorStats(creatorId) {
      const creatorLandmarks = await landmarksCollection
        .find({ createdBy: creatorId }, { projection: { _id: 0, id: 1 } })
        .toArray();
      const creatorLandmarkIds = creatorLandmarks.map((landmark) => landmark.id);
      const [totalViews, totalBookings, recentActivity] = await Promise.all([
        trackingCollection.countDocuments({
          type: "landmark_view",
          landmarkId: { $in: creatorLandmarkIds },
        }),
        bookingsCollection.countDocuments({
          status: "confirmed",
          landmarkId: { $in: creatorLandmarkIds },
        }),
        trackingCollection
          .find(
            {
              type: "landmark_view",
              landmarkId: { $in: creatorLandmarkIds },
            },
            { projection: { _id: 0 } }
          )
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray(),
      ]);

      return {
        monumentCount: creatorLandmarks.length,
        totalViews,
        totalBookings,
        recentActivity: recentActivity.map((event) => ({
          ...event,
          timestamp: event.createdAt,
        })),
      };
    },
    async updateLandmark(id, updates) {
      const current = await getLandmark(id);

      if (!current) {
        throw new Error("LANDMARK_NOT_FOUND");
      }

      const nextLandmark = enrichLandmark({ ...current, ...updates, id });
      const result = await landmarksCollection.findOneAndUpdate(
        { id },
        { $set: nextLandmark },
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
    async createBooking(booking) {
      const [landmark, event, user] = await Promise.all([
        getLandmark(booking.landmarkId),
        getEvent(booking.eventId),
        getUserByIdInternal(booking.userId),
      ]);
      const document = {
        bookingCode: `TRV${Math.floor(100000 + Math.random() * 900000)}`,
        status: "pending",
        currency: "inr",
        landmarkName: landmark?.name ?? booking.landmarkName,
        landmarkImage: landmark?.image,
        eventName: event?.eventName ?? booking.eventName,
        userName: user?.name ?? booking.userName,
        userEmail: user?.email ?? booking.userEmail,
        userAvatar: user?.avatarUrl,
        createdAt: toIso(),
        ...booking,
      };

      const result = await bookingsCollection.insertOne(document);
      return { id: result.insertedId.toString(), ...document };
    },
    async updateBooking(id, updates) {
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const result = await bookingsCollection.findOneAndUpdate(
        query,
        { $set: { ...updates, updatedAt: toIso() } },
        { returnDocument: "after" }
      );
      if (!result) throw new Error("BOOKING_NOT_FOUND");
      return { id: result._id.toString(), ...result };
    },
    async confirmBookingByStripeSession(stripeSessionId, updates = {}) {
      const result = await bookingsCollection.findOneAndUpdate(
        { stripeSessionId },
        {
          $set: {
            ...updates,
            status: "confirmed",
            paidAt: toIso(),
            updatedAt: toIso(),
          },
        },
        { returnDocument: "after" }
      );

      if (!result) return null;

      await trackingCollection.insertOne({
        type: "event_booking",
        landmarkId: result.landmarkId,
        userId: result.userId,
        metadata: { bookingId: result._id.toString() },
        createdAt: toIso(),
      });

      return { id: result._id.toString(), ...result };
    },
    async listBookingsByUser(userId) {
      const bookings = await bookingsCollection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

      return bookings.map((booking) => ({
        id: booking._id.toString(),
        ...booking,
        _id: undefined,
      }));
    },
    async listCreatorPendingBookings(creatorId) {
      const bookings = await bookingsCollection
        .find(
          {
            creatorId,
            status: { $in: ["pending-approval", "pending"] },
          },
          { projection: { _id: 0 } }
        )
        .sort({ createdAt: -1 })
        .toArray();

      return bookings;
    },
    async approveBooking(id, updates = {}) {
      const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
      const result = await bookingsCollection.findOneAndUpdate(
        query,
        {
          $set: {
            ...updates,
            status: "confirmed",
            approvalStatus: "approved",
            approvedAt: toIso(),
            updatedAt: toIso(),
          },
        },
        { returnDocument: "after" }
      );
      if (!result) throw new Error("BOOKING_NOT_FOUND");

      await trackingCollection.insertOne({
        type: "event_booking",
        landmarkId: result.landmarkId,
        userId: result.userId,
        metadata: { bookingId: result._id.toString() },
        createdAt: toIso(),
      });

      return { id: result._id.toString(), ...result };
    },
    async calculateBookingQuote({
      landmarkId,
      eventId,
      adults = 1,
      students = 0,
      children = 0,
      discountPercent = 0,
    }) {
      const [landmark, event] = await Promise.all([getLandmark(landmarkId), getEvent(eventId)]);
      const base = Number(event?.ticketPrice) || parseEntryFee(landmark?.entryFee);
      const discountMultiplier = Math.max(0, 1 - Number(discountPercent || 0) / 100);
      const lineItems = [
        {
          label: "Adults",
          quantity: Number(adults) || 0,
          unitAmount: Math.round(base * discountMultiplier),
        },
        {
          label: "Students",
          quantity: Number(students) || 0,
          unitAmount: Math.round(base * 0.7 * discountMultiplier),
        },
        {
          label: "Children",
          quantity: Number(children) || 0,
          unitAmount: Math.round(base * 0.5 * discountMultiplier),
        },
      ].filter((item) => item.quantity > 0);
      const totalAmount = lineItems.reduce(
        (total, item) => total + item.quantity * item.unitAmount,
        0
      );

      return { landmark, event, lineItems, totalAmount, discountPercent: Number(discountPercent || 0) };
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
