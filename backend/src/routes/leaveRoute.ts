// src/routes/leaveRoutes.ts
import express from "express";
import { applyLeave ,approveLeave,getDashboardData,getLeaveBalance,getLeaveHistory, getPendingLeaves, getTeamLeaves} from "../controllers/leaveController";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = express.Router();
router.patch("/approve/:id",authorizeRoles("manager"), approveLeave);
router.post("/apply",authorizeRoles("employee"), applyLeave);
router.get("/history", getLeaveHistory);
router.get("/pending",authorizeRoles("manager"),getPendingLeaves)
router.get("/balance", getLeaveBalance);
router.get("/team",getTeamLeaves)
router.get("/dashboard",getDashboardData)

export default router;