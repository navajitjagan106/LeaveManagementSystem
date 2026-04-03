import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import leaveRoutes from "./routes/leaveRoute"
import authRoutes from "./routes/authRoute";
import { authenticate } from "./middleware/authMiddleware";
import adminRoute from "./routes/adminRoute";
dotenv.config();

const app = express();

app.use(cors({
    origin: ["http://localhost:3000",
        "https://leavemsystem.netlify.app/"],
    credentials: true
}));
app.use(express.json());
app.get("/", (req, res) => {
    res.send("API is running");
});

app.use("/api/leaves", authenticate, leaveRoutes);
app.use("/api/auth", authRoutes);


app.use("/api/admin", authenticate, adminRoute);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});