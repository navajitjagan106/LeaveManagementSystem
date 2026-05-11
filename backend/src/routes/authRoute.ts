import express from "express";
import { login, verifyOtp, logout, getMe, forgotPassword, resetPassword, changePassword } from "../controllers/authController";
import { getInvitationByToken, acceptInvitation } from "../controllers/invitationController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.get("/invitation/:token", getInvitationByToken);
router.post("/accept-invitation/:token", acceptInvitation);

// ── Password management endpoints
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);

export default router;
