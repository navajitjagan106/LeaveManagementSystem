// src/routes/leaveRoutes.ts
import express from "express";
import { applyLeave ,approveLeave,calculateDays,getDashboardData,getHolidays,getLeaveBalance,getLeaveHistory, getLeaveInitData, getLeaveTypes, getManager, getPendingLeaves, getTeamLeaves, getuserdetails} from "../controllers/leaveController";
import { authorizeRoles } from "../middleware/roleMiddleware";
import { authenticate  } from "../middleware/authMiddleware";

const router = express.Router();
router.patch("/approve/:id",authorizeRoles("manager"), approveLeave);
router.post("/apply",authorizeRoles("employee"), applyLeave);
router.get('/types', getLeaveTypes);
router.get('/users/manager',  getManager);
router.get("/holidays",getHolidays)
router.get("/history", getLeaveHistory);
router.get("/pending",authorizeRoles("manager"),getPendingLeaves)
router.get("/balance", getLeaveBalance);
router.get("/team",getTeamLeaves)
router.get("/dashboard",authenticate,getDashboardData)
router.get("/getuserdata",getuserdetails)
router.post("/calculatedays",calculateDays)
router.get("/getinitdata",getLeaveInitData)

export default router;