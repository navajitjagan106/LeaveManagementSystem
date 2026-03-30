import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/db";
import leaveRoutes from "./routes/leaveRoute"
import authRoutes from "./routes/authRoute";
import { authenticate } from "./middleware/authMiddleware";
import notificationRoute from "./routes/notificationRoute"

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

// test route
app.get("/", async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
});
app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notification", authenticate, notificationRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});