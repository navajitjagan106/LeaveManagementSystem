import express from "express";
import { login, register, verifyOtp } from "../controllers/authController";
import { getInvitationByToken, acceptInvitation } from "../controllers/invitationController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/invitation/:token", getInvitationByToken);
router.post("/accept-invitation/:token", acceptInvitation);

export default router;
