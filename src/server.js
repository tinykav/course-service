require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const courseRoutes = require('./routes/courseRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// ── Swagger UI ────────────────────────────────────────────────────
const swaggerDoc = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// ── Routes ────────────────────────────────────────────────────────
app.use('/courses', courseRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'course-service',
    integrations: {
      auth_service:       process.env.AUTH_SERVICE_URL       || 'not configured',
      enrollment_service: process.env.ENROLLMENT_SERVICE_URL || 'not configured'
    }
  });
});

// ── MongoDB ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Course Service running on port ${PORT}`);
    console.log(`📄 Swagger docs: http://localhost:${PORT}/api-docs`);
  });
  return server;
};

if (require.main === module) {
  start();
}

module.exports = { app };
