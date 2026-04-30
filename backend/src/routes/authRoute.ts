import express from "express";
import { login, verifyOtp, logout } from "../controllers/authController";
import { getInvitationByToken, acceptInvitation } from "../controllers/invitationController";

const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logout);
router.get("/invitation/:token", getInvitationByToken);
router.post("/accept-invitation/:token", acceptInvitation);

export default router;
