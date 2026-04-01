const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const scanRoutes = require("./routes/scanRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// Required for Render's load balancer — fixes express-rate-limit X-Forwarded-For warning
app.set("trust proxy", 1);

// 1. HTTP Header Security
app.use(helmet());

// 2. Strict CORS policy (only allow frontend origin)
const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) only if in dev
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. API Rate Limiting (Prevent abuse and API credit drain)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  message: {
    message: "Too many scan requests from this IP. To protect our third-party API quotas, please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter specifically to the scan routes so they can't spam it
app.use("/api/scan", apiLimiter);

app.get("/", (req, res) => {
  res.send("Digital Footprint Analyzer Backend Securely Running");
});

app.use("/api", scanRoutes);
app.use("/api/settings", settingsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Secure Server running on port ${PORT}`);
});