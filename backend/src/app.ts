import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import leaveRoutes from "./routes/leaveRoute"
import authRoutes from "./routes/authRoute";
import { authenticate } from "./middleware/authMiddleware";
import adminRoute from "./routes/adminRoute";
dotenv.config();

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

app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/auth", authRoutes);


app.use("/api/admin", authenticate, adminRoute);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});