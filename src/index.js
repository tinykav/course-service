require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());
app.use(cors());

// ── Swagger Setup ─────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Course Service API",
      version: "1.0.0",
      description: "API documentation for Course Service"
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || "http://localhost:3000"
      }
    ]
  },
  apis: ["./index.js"] // change if your file name is different
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── MongoDB Schema ────────────────────────────────────────────────
const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    capacity: { type: Number, required: true, default: 30 },
    credits: { type: Number, required: true, default: 3 }
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

// ── Connect to MongoDB ────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

// ── Middleware ────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ── Routes ────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is running
 */
// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "course-service" });
});

// POST /courses — Create course (admin only)
app.post("/courses", authenticate, adminOnly, async (req, res) => {
  const { name, description, capacity, credits } = req.body;
  if (!name || !capacity || !credits) {
    return res
      .status(400)
      .json({ error: "name, capacity, and credits are required" });
  }
  try {
    const course = await Course.create({
      name,
      description,
      capacity,
      credits
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /courses — Get all courses (public)
app.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /courses/:id — Get course by ID (public)
app.get("/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /courses/:id — Update course info (admin only)
app.put("/courses/:id", authenticate, adminOnly, async (req, res) => {
  const { name, description, credits } = req.body;
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(credits && { credits })
      },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /courses/:id/capacity — Called by Enrollment Service
app.put("/courses/:id/capacity", async (req, res) => {
  const { action } = req.body; // "increment" or "decrement"
  if (!["increment", "decrement"].includes(action)) {
    return res
      .status(400)
      .json({ error: "action must be 'increment' or 'decrement'" });
  }
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (action === "decrement" && course.capacity <= 0) {
      return res
        .status(400)
        .json({ error: "Course is full — no available capacity" });
    }
    course.capacity += action === "increment" ? 1 : -1;
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Course Service running on port ${PORT}`);
  });
  return server;
};

if (require.main === module) {
  start();
}

module.exports = { app, Course };
