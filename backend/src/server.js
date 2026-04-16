import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import { Server as SocketServer } from "socket.io";
import Redis from "ioredis";
import multer from "multer";
import { createDataStore } from "./db.js";



const port = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);

console.log("MONGODB_URI =", process.env.MONGODB_URI);
const store = await createDataStore();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET || "dev-only-change-this-jwt-secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES) || 8 * 1024 * 1024 },
});

if (process.env.NODE_ENV === "production" && jwtSecret.includes("dev-only")) {
  throw new Error("JWT_SECRET must be set to a strong value in production.");
}

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  frontendUrl,
  "http://localhost:5173",
  "https://travelverse-startup101-z5jn.vercel.app",
].filter(Boolean);

const allowedOriginPatterns = [
  /^https:\/\/travelverse-startup101-z5jn(?:-[a-z0-9-]+)?\.vercel\.app$/,
];

const corsOptions = {
  origin(origin, callback) {
    const isAllowedPattern = allowedOriginPatterns.some((pattern) =>
      pattern.test(origin ?? "")
    );

    if (!origin || allowedOrigins.includes(origin) || isAllowedPattern) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
};

app.use(cors(corsOptions));

const io = new SocketServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on("error", (error) => {
    console.warn("Redis unavailable, using in-memory crowd cache:", error.message);
  });
  redis.connect().catch((error) => {
    console.warn("Redis connection failed, using in-memory crowd cache:", error.message);
  });
}

const sendValidationError = (response, message) =>
  response.status(400).json({ error: message });

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

const verifyToken = async (request, response, next) => {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await store.getUserById(payload.sub);

    if (!user) {
      response.status(401).json({ error: "Invalid session." });
      return;
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json({ error: "Invalid or expired session." });
  }
};

const attachOptionalUser = async (request, _response, next) => {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    request.user = await store.getUserById(payload.sub);
  } catch {
    request.user = null;
  }

  next();
};

const requireRoles = (...roles) => [
  verifyToken,
  (request, response, next) => {
    const allowedRoles = new Set([...roles, "admin"]);

    if (!allowedRoles.has(request.user?.role)) {
      response.status(403).json({ error: "You do not have access to this action." });
      return;
    }

    next();
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const generateTicketCode = () =>
  `TV-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now()
    .toString()
    .slice(-4)}`;

const isConcertEvent = (event = {}) =>
  String(event.category ?? "").toLowerCase() === "concert" ||
  String(event.eventName ?? "").toLowerCase().includes("concert");

const getPassDiscountPercent = (user, event) => {
  if (user?.role !== "traveler") return 0;
  if (user?.subscription?.status !== "active") return 0;
  return isConcertEvent(event) ? 10 : 0;
};

const buildTicketPayload = ({ booking, quote, visitDate, slotTime, paymentMethod }) => ({
  ticketCode: generateTicketCode(),
  bookingCode: booking.bookingCode,
  eventName: quote.event?.eventName ?? booking.eventName,
  landmarkName: quote.landmark?.name ?? booking.landmarkName,
  visitDate,
  slotTime,
  totalAmount: quote.totalAmount,
  issuedAt: new Date().toISOString(),
  paymentMethod,
});

const getCrowdLevel = (percentage) => {
  if (percentage < 35) return "Low";
  if (percentage < 70) return "Moderate";
  return "High";
};

const simulateCrowd = (landmarkId, previousPercentage) => {
  const now = new Date();
  const seed = landmarkId
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const commutePulse = Math.sin((now.getHours() / 24) * Math.PI * 2) * 18;
  const weekendPulse = [0, 6].includes(now.getDay()) ? 14 : 0;
  const noise = ((seed + now.getMinutes() * 11 + now.getSeconds() * 3) % 18) - 9;
  const baseline = previousPercentage ?? ((seed + now.getHours() * 17) % 70) + 18;
  const percentage = Math.round(clamp(baseline * 0.62 + 28 + commutePulse + weekendPulse + noise, 8, 96));
  const level = getCrowdLevel(percentage);

  return {
    landmarkId,
    level,
    percentage,
    bestSlot: level === "High" ? "Tomorrow before 9:00 AM" : "Next 2 hours",
    source: redis ? "Redis live visitor simulation" : "In-memory live visitor simulation",
    refreshesAt: new Date(Date.now() + 30 * 1000).toISOString(),
    updatedAt: now.toISOString(),
  };
};

const memoryCrowdCache = new Map();

const getCrowd = async (landmarkId) => {
  const key = `crowd:${landmarkId}`;

  if (redis?.status === "ready") {
    try {
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn("Redis crowd read failed:", error.message);
    }
  }

  const previous = memoryCrowdCache.get(landmarkId);
  const crowd = simulateCrowd(landmarkId, previous?.percentage);
  memoryCrowdCache.set(landmarkId, crowd);

  if (redis?.status === "ready") {
    try {
      await redis.set(key, JSON.stringify(crowd), "EX", 45);
    } catch (error) {
      console.warn("Redis crowd write failed:", error.message);
    }
  }

  return crowd;
};

const refreshCrowd = async () => {
  try {
    const landmarks = await store.listLandmarks();
    const crowdUpdates = await Promise.all(
      landmarks.map(async (landmark) => {
        const current = await getCrowd(landmark.id);
        const updated = simulateCrowd(landmark.id, current.percentage);
        memoryCrowdCache.set(landmark.id, updated);

        if (redis?.status === "ready") {
          await redis
            .set(`crowd:${landmark.id}`, JSON.stringify(updated), "EX", 45)
            .catch((error) => console.warn("Redis crowd refresh failed:", error.message));
        }

        io.to(`landmark:${landmark.id}`).emit("crowd:update", updated);
        return updated;
      })
    );

    io.emit("crowd:bulk", crowdUpdates);
  } catch (error) {
    console.warn("Crowd refresh failed:", error.message);
  }
};

io.on("connection", (socket) => {
  socket.on("crowd:watch", async (landmarkId) => {
    if (!landmarkId) return;
    socket.join(`landmark:${landmarkId}`);
    socket.emit("crowd:update", await getCrowd(landmarkId));
  });

  socket.on("crowd:unwatch", (landmarkId) => {
    if (landmarkId) {
      socket.leave(`landmark:${landmarkId}`);
    }
  });
});

setInterval(refreshCrowd, Number(process.env.CROWD_REFRESH_MS) || 30 * 1000);

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    if (!stripe || !stripeWebhookSecret) {
      response.status(500).json({ error: "Stripe webhook is not configured." });
      return;
    }

    const signature = request.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        stripeWebhookSecret
      );
    } catch (error) {
      response.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await store.confirmBookingByStripeSession(session.id, {
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
      });
    }

    response.json({ received: true });
  }
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    version: "2.0",
    datastore: store.mode,
    realtime: "socket.io",
    redis: redis?.status === "ready" ? "connected" : "memory-fallback",
    stripe: stripe ? "configured" : "missing",
  });
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
      token: signToken(user),
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
      token: signToken(user),
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

app.get("/api/auth/me", verifyToken, (request, response) => {
  response.json({ user: request.user });
});

app.get("/api/users/me", verifyToken, (request, response) => {
  response.json(request.user);
});

app.get("/api/landmarks", async (_request, response) => {
  const landmarks = await store.listLandmarks();
  response.json(landmarks);
});

app.get("/api/search/landmarks", async (request, response) => {
  const results = await store.searchLandmarks({
    q: String(request.query.q ?? ""),
    city: String(request.query.city ?? ""),
    type: String(request.query.type ?? ""),
  });

  if (!request.query.crowd) {
    response.json(results);
    return;
  }

  const crowdLevel = String(request.query.crowd).toLowerCase();
  const withCrowd = await Promise.all(
    results.map(async (landmark) => ({
      ...landmark,
      crowd: await getCrowd(landmark.id),
    }))
  );

  response.json(
    withCrowd.filter((landmark) =>
      crowdLevel ? landmark.crowd.level.toLowerCase() === crowdLevel : true
    )
  );
});

app.get("/api/landmarks/:id", async (request, response) => {
  const landmark = await store.getLandmarkById(request.params.id);

  if (!landmark) {
    response.status(404).json({ error: "Landmark not found." });
    return;
  }

  response.json(landmark);
});

app.get("/api/landmarks/:id/crowd", async (request, response) => {
  const landmark = await store.getLandmarkById(request.params.id);

  if (!landmark) {
    response.status(404).json({ error: "Landmark not found." });
    return;
  }

  response.json(await getCrowd(request.params.id));
});

app.get("/api/landmarks/:id/events", async (request, response) => {
  const events = await store.listEventsByLandmark(request.params.id);
  response.json(events);
});

app.get("/api/events", async (_request, response) => {
  const events = await store.listEvents();
  response.json(events);
});

app.get("/api/events/:id/registrations", verifyToken, async (request, response) => {
  const registrations = await store.listRegistrationsByEvent(request.params.id);
  response.json(registrations);
});

app.get("/api/users/discover", verifyToken, async (request, response) => {
  response.json(await store.listDiscoverableUsers(request.user.id));
});

app.post("/api/friends/follow/:userId", verifyToken, async (request, response) => {
  response.status(201).json(
    await store.followUser({
      followerId: request.user.id,
      followingId: request.params.userId,
    })
  );
});

app.get("/api/friends/activity", attachOptionalUser, async (request, response) => {
  const userEmail = request.user?.email ?? String(request.query.userEmail ?? "").trim().toLowerCase();
  const activity = await store.listFriendActivity(request.user?.id ?? "", userEmail);
  response.json(activity);
});

app.post("/api/checkins", verifyToken, async (request, response) => {
  const { landmarkId = "", note = "", image = "" } = request.body ?? {};

  if (!landmarkId.trim()) {
    sendValidationError(response, "Landmark is required for check-in.");
    return;
  }

  const checkIn = await store.createCheckIn({
    userId: request.user.id,
    landmarkId: landmarkId.trim(),
    note: note.trim(),
    image: image.trim(),
  });

  response.status(201).json(checkIn);
});

app.get("/api/plans", (_request, response) => {
  response.json([
    {
      id: "free",
      name: "Explorer",
      price: 0,
      billing: "month",
      audience: "Guests and casual travelers",
      role: "traveler",
      perks: [
        "Browse all landmarks",
        "Basic landmark info",
        "Crowd level indicators",
        "Friend activity feed",
        "3 bookings per month",
      ],
    },
    {
      id: "monthly",
      name: "Premium",
      price: 299,
      billing: "month",
      audience: "Travelers who want full access",
      role: "traveler",
      perks: [
        "All audio guides",
        "PDF ticket download",
        "Priority booking",
        "10% discount on concerts",
        "Unlimited bookings",
      ],
    },
    {
      id: "annual",
      name: "Premium Annual",
      price: 1999,
      billing: "year",
      audience: "Frequent premium travelers",
      role: "traveler",
      perks: [
        "Everything in Premium",
        "10% discount on concerts",
        "Exclusive annual badge",
        "Priority support",
      ],
    },
  ]);
});

app.get("/api/subscription/me", verifyToken, (request, response) => {
  response.json({
    subscription: request.user.subscription ?? null,
    eligible: request.user.role === "traveler",
  });
});

app.post("/api/subscriptions/purchase", verifyToken, async (request, response) => {
  if (request.user.role !== "traveler") {
    response.status(403).json({ error: "Only travelers can purchase passes." });
    return;
  }

  const { planId = "", paymentMethod = "rupay-demo" } = request.body ?? {};
  const plans = [
    { id: "student", name: "Student Pass", price: 49 },
    { id: "premium-traveler", name: "Traveler Premium Pass", price: 99 },
  ];
  const plan = plans.find((item) => item.id === planId);

  if (!plan) {
    sendValidationError(response, "A valid traveler plan is required.");
    return;
  }

  const subscription = {
    planId: plan.id,
    planName: plan.name,
    status: "active",
    price: plan.price,
    paymentMethod: paymentMethod.trim() || "rupay-demo",
    passCode: `PASS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    purchasedAt: new Date().toISOString(),
  };

  const user = await store.updateUserSubscription(request.user.id, subscription);

  await store.createTrackingEvent({
    type: "plan_purchase",
    userId: request.user.id,
    userEmail: request.user.email,
    metadata: { planId: plan.id, paymentMethod: subscription.paymentMethod },
  });

  response.status(201).json({
    message: "Traveler pass activated.",
    subscription,
    user,
  });
});

app.post("/api/users/upgrade", verifyToken, async (request, response) => {
  if (request.user.role !== "traveler") {
    response.status(403).json({ error: "Only travelers can upgrade to premium." });
    return;
  }

  const { plan = "monthly" } = request.body ?? {};
  const planMap = {
    monthly: { planId: "monthly", planName: "Premium Monthly", price: 299 },
    annual: { planId: "annual", planName: "Premium Annual", price: 1999 },
  };
  const chosenPlan = planMap[plan];

  if (!chosenPlan) {
    sendValidationError(response, "A valid premium plan is required.");
    return;
  }

  const subscription = {
    planId: chosenPlan.planId,
    planName: chosenPlan.planName,
    status: "active",
    price: chosenPlan.price,
    paymentMethod: "card-demo",
    passCode: `PASS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    purchasedAt: new Date().toISOString(),
    premiumSince: new Date().toISOString(),
    premiumPlan: chosenPlan.planId,
  };

  const user = await store.updateUserSubscription(request.user.id, subscription);

  response.json({
    message: "Welcome to Premium!",
    user,
  });
});

app.get("/api/creator/monuments", ...requireRoles("content-manager"), async (request, response) => {
  response.json(await store.listCreatorLandmarks(request.user.id));
});

app.get("/api/creator/stats", ...requireRoles("content-manager"), async (request, response) => {
  response.json(await store.getCreatorStats(request.user.id));
});

app.get("/api/creator/bookings/pending", ...requireRoles("content-manager"), async (request, response) => {
  response.json(await store.listCreatorPendingBookings(request.user.id));
});

app.post("/api/creator/bookings/:id/approve", ...requireRoles("content-manager"), async (request, response) => {
  try {
    const pendingBookings = await store.listCreatorPendingBookings(request.user.id);
    const booking = pendingBookings.find((item) => item.id === request.params.id);

    if (!booking) {
      response.status(404).json({ error: "Booking not found." });
      return;
    }

    const quote = await store.calculateBookingQuote({
      eventId: booking.eventId,
      landmarkId: booking.landmarkId,
      adults: booking.adults,
      students: booking.students,
      children: booking.children,
      discountPercent: booking.discountPercent ?? 0,
    });

    const ticket = buildTicketPayload({
      booking,
      quote,
      visitDate: booking.visitDate,
      slotTime: booking.slotTime,
      paymentMethod: booking.paymentMethod ?? "rupay-demo",
    });

    const approvedBooking = await store.approveBooking(request.params.id, {
      approvedBy: request.user.id,
      ticket,
      paymentStatus: booking.paymentStatus ?? "paid",
    });

    response.json({
      message: "Booking approved successfully.",
      booking: approvedBooking,
    });
  } catch (error) {
    if (error.message === "BOOKING_NOT_FOUND") {
      response.status(404).json({ error: "Booking not found." });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Unable to approve booking." });
  }
});

app.post("/api/uploads", ...requireRoles("content-manager"), upload.single("file"), (request, response) => {
  if (!request.file) {
    sendValidationError(response, "Upload file is required.");
    return;
  }

  response.status(201).json({
    fileName: request.file.originalname,
    mimeType: request.file.mimetype,
    size: request.file.size,
    url: `data:${request.file.mimetype};base64,${request.file.buffer.toString("base64")}`,
  });
});

app.post("/api/landmarks", ...requireRoles("content-manager"), async (request, response) => {
  const {
    name = "",
    location = "",
    city = "",
    entryFee = "",
    bestTime = "",
    description = "",
    image = "",
    audioGuide = "",
    interestingFacts = [],
    type = "heritage",
  } = request.body ?? {};

  if (!name.trim() || !location.trim() || !String(description).trim()) {
    sendValidationError(response, "Name, location, and description are required.");
    return;
  }

  const landmark = await store.createLandmark({
    name: name.trim(),
    location: location.trim(),
    city: city.trim() || location.trim(),
    type: type.trim() || "heritage",
    entryFee: entryFee.trim(),
    bestTime: bestTime.trim(),
    description,
    image: image.trim(),
    audioGuide: audioGuide.trim(),
    interestingFacts: Array.isArray(interestingFacts)
      ? interestingFacts.filter(Boolean)
      : [],
    createdBy: request.user.id,
    createdAt: new Date().toISOString(),
  });

  response.status(201).json(landmark);
});

app.post("/api/events", ...requireRoles("content-manager"), async (request, response) => {
  const {
    landmarkId = "",
    eventName = "",
    date = "",
    time = "",
    ticketPrice = "",
    description = "",
    category = "festival",
  } = request.body ?? {};

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
    category: category.trim() || "festival",
    createdBy: request.user.id,
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

app.post("/api/bookings/checkout", verifyToken, async (request, response) => {
  const {
    eventId = "",
    landmarkId = "",
    visitDate = "",
    slotTime = "",
    adults = 1,
    students = 0,
    children = 0,
  } = request.body ?? {};

  if (!eventId.trim() || !landmarkId.trim() || !visitDate.trim() || !slotTime.trim()) {
    sendValidationError(response, "Event, landmark, visit date, and slot time are required.");
    return;
  }

  if (!stripe) {
    response.status(503).json({ error: "Stripe is not configured on this server." });
    return;
  }

  const previewQuote = await store.calculateBookingQuote({
    eventId: eventId.trim(),
    landmarkId: landmarkId.trim(),
  });
  const discountPercent = getPassDiscountPercent(request.user, previewQuote.event);
  const quote = await store.calculateBookingQuote({
    eventId: eventId.trim(),
    landmarkId: landmarkId.trim(),
    adults,
    students,
    children,
    discountPercent,
  });

  if (!quote.landmark || !quote.event) {
    response.status(404).json({ error: "Booking item not found." });
    return;
  }

  if (quote.totalAmount <= 0) {
    sendValidationError(response, "At least one traveler is required.");
    return;
  }

  const booking = await store.createBooking({
    userId: request.user.id,
    eventId: quote.event.id,
    landmarkId: quote.landmark.id,
    visitDate,
    slotTime,
    adults: Number(adults) || 0,
    students: Number(students) || 0,
    children: Number(children) || 0,
    lineItems: quote.lineItems,
    totalAmount: quote.totalAmount,
    creatorId: quote.event.createdBy,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: request.user.email,
    line_items: quote.lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "inr",
        unit_amount: item.unitAmount * 100,
        product_data: {
          name: `${quote.event.eventName} - ${item.label}`,
          description: `${quote.landmark.name} visit on ${visitDate} at ${slotTime}`,
        },
      },
    })),
    metadata: {
      bookingId: booking.id,
      userId: request.user.id,
      landmarkId: quote.landmark.id,
      eventId: quote.event.id,
      discountPercent,
    },
    success_url: `${frontendUrl}/dashboard/traveler?booking=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/landmark/${quote.landmark.id}?booking=cancelled`,
  });

  const updatedBooking = await store.updateBooking(booking.id, {
    stripeSessionId: session.id,
    checkoutUrl: session.url,
  });

  await store.createTrackingEvent({
    type: "booking_start",
    landmarkId: quote.landmark.id,
    userId: request.user.id,
    userEmail: request.user.email,
    metadata: {
      bookingId: booking.id,
      eventId: quote.event.id,
      totalAmount: quote.totalAmount,
      discountPercent,
    },
  });

  response.status(201).json({
    booking: updatedBooking,
    checkoutUrl: session.url,
    sessionId: session.id,
  });
});

app.post("/api/bookings/simulate-payment", verifyToken, async (request, response) => {
  const {
    eventId = "",
    landmarkId = "",
    visitDate = "",
    slotTime = "",
    adults = 1,
    students = 0,
    children = 0,
    paymentMethod = "rupay",
  } = request.body ?? {};

  if (!eventId.trim() || !landmarkId.trim() || !visitDate.trim() || !slotTime.trim()) {
    sendValidationError(response, "Event, landmark, visit date, and slot time are required.");
    return;
  }

  const previewQuote = await store.calculateBookingQuote({
    eventId: eventId.trim(),
    landmarkId: landmarkId.trim(),
  });
  const discountPercent = getPassDiscountPercent(request.user, previewQuote.event);
  const quote = await store.calculateBookingQuote({
    eventId: eventId.trim(),
    landmarkId: landmarkId.trim(),
    adults,
    students,
    children,
    discountPercent,
  });

  if (!quote.landmark || !quote.event) {
    response.status(404).json({ error: "Booking item not found." });
    return;
  }

  if (quote.totalAmount <= 0) {
    sendValidationError(response, "At least one traveler is required.");
    return;
  }

  const booking = await store.createBooking({
    userId: request.user.id,
    eventId: quote.event.id,
    landmarkId: quote.landmark.id,
    visitDate,
    slotTime,
    adults: Number(adults) || 0,
    students: Number(students) || 0,
    children: Number(children) || 0,
    lineItems: quote.lineItems,
    totalAmount: quote.totalAmount,
    creatorId: quote.event.createdBy,
    paymentStatus: "paid",
    approvalStatus: "pending",
    paymentMethod: paymentMethod.trim() || "rupay",
    paidAt: new Date().toISOString(),
  });
  const pendingBooking = await store.updateBooking(booking.id, {
    status: "pending-approval",
    paymentReference: `SIM-${Date.now()}`,
    discountPercent,
  });

  await store.createTrackingEvent({
    type: "booking_start",
    landmarkId: quote.landmark.id,
    userId: request.user.id,
    userEmail: request.user.email,
    metadata: {
      bookingId: booking.id,
      eventId: quote.event.id,
      totalAmount: quote.totalAmount,
      source: "simulated_payment",
      discountPercent,
    },
  });

  await store.createTrackingEvent({
    type: "booking_pending_approval",
    landmarkId: quote.landmark.id,
    userId: request.user.id,
    userEmail: request.user.email,
    metadata: {
      bookingId: booking.id,
      eventId: quote.event.id,
      totalAmount: quote.totalAmount,
      paymentMethod: paymentMethod.trim() || "rupay",
      discountPercent,
    },
  });

  response.status(201).json({
    message: "Payment captured. Your booking is pending creator approval.",
    booking: pendingBooking,
    discountPercent,
  });
});

app.get("/api/bookings/history", verifyToken, async (request, response) => {
  response.json(await store.listBookingsByUser(request.user.id));
});

app.delete("/api/events/:id", ...requireRoles("content-manager"), async (request, response) => {
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

app.put("/api/landmarks/:id", ...requireRoles("content-manager"), async (request, response) => {
  const { requesterRole: _requesterRole, ...updates } = request.body ?? {};

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

app.delete("/api/landmarks/:id", ...requireRoles("content-manager"), async (request, response) => {
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

app.post("/api/track", attachOptionalUser, async (request, response) => {
  const {
    type = "",
    landmarkId = "",
    userEmail = "",
    feedback = "",
    metadata = {},
  } = request.body ?? {};

  if (!type.trim()) {
    sendValidationError(response, "Tracking type is required.");
    return;
  }

  await store.createTrackingEvent({
    type: type.trim(),
    landmarkId: landmarkId.trim(),
    userId: request.user?.id,
    userEmail: request.user?.email ?? userEmail.trim().toLowerCase(),
    feedback: feedback.trim(),
    metadata: typeof metadata === "object" && metadata !== null ? metadata : {},
    userAgent: request.headers["user-agent"],
    ip:
      request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
      request.socket.remoteAddress,
  });

  response.status(201).json({ success: true });
});

app.get("/api/stats/summary", async (_request, response) => {
  const summary = await store.getSummary();
  response.json(summary);
});

server.listen(port, () => {
  console.log(`TravelVerse V2 backend running on http://localhost:${port}`);
  console.log(`Datastore mode: ${store.mode}`);
});
