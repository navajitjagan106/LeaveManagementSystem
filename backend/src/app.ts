import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import leaveRoutes from "./routes/leaveRoute"
import authRoutes from "./routes/authRoute";
import { authenticate } from "./middleware/authMiddleware";
import managementRoute from "./routes/managementRoute";

const app = express();

app.use(cors({
  origin: [
    "https://leavemsystem.netlify.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(cookieParser());
app.use(express.json());
app.get("/", (_req, res) => {
  res.send("API is running");
});

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/auth", authRoutes);


app.use("/api/management", authenticate, managementRoute);


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(" Express Global Error Handler:", err);
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: err.message || "An unexpected internal server error occurred"
  });
});

process.on("uncaughtException", (err) => {
  console.error(" CRITICAL UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(" UNHANDLED PROMISE REJECTION AT:", promise, "REASON:", reason);
});

import { pool } from "./config/db";

const ensurePageDefinitions = async () => {
  try {
    const res = await pool.query("SELECT id FROM page_definitions WHERE key = 'manage_permissions'");
    if (res.rows.length === 0) {
      console.log("Seeding missing 'manage_permissions' page definition...");
      await pool.query(
        "INSERT INTO page_definitions (key, label, description) VALUES ('manage_permissions', 'Manage Permissions', 'Configure page roles and permissions')"
      );
    }
  } catch (err) {
    console.error("Error ensuring page definitions:", err);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await ensurePageDefinitions();
});