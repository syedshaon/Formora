import express from "express";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleClerkWebhook } from "./webhooks.js";
import routes from "./routes/allRoutes"; // This will import from routes/index

import { getValidAccessToken } from "./lib/onedrive-token";
// @ts-ignore
import keepServerAlive from "keep-alive-package";
// @ts-ignore
// import statusMonitor from "express-status-monitor";
import { createServer } from "http";
import { setupWebSocket } from "./websocket";
import "./lib/refreshView";

dotenv.config();

const app = express();

const server = createServer(app);

app.set("trust proxy", 1);
// app.use(statusMonitor()); // Enable monitoring
app.use(clerkMiddleware());
const PORT = parseInt(process.env.PORT || "3000", 10);

// Setup WebSocket server
setupWebSocket(server);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Webhook handler - must come before json middleware
app.post("/api/webhooks/clerk", express.raw({ type: "application/json" }), (req, res, next) => {
  handleClerkWebhook(req, res, next).catch(next);
});

// Standard middleware
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the API!",
    documentation: "Check /health for service status",
    status: "running",
  });
});
keepServerAlive("https://taskseven-lmgn.onrender.com", "1m");

// Use all routes
app.use("/api", routes);

setInterval(async () => {
  try {
    const token = await getValidAccessToken();
    console.log("Refreshed OneDrive token:", token.slice(0, 10) + "...");
  } catch (err) {
    console.error("Token refresh failed:", err);
  }
}, 3000 * 1000);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
