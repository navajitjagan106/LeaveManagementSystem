import express from "express";
import {
    applyLeave, approveLeave, calculateDays, getDashboardData, getHolidays, getLeaveBalance, getLeaveHistory, getLeaveInitData,
    getLeaveTypes, getManager, getManagerLeaves, getNotifications, getTeamLeaves, getuserdetails, markNotificationsRead
} from "../controllers/leaveController";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = express.Router();
router.patch("/approve/:id", authorizeRoles("manager"), approveLeave);
router.post("/apply", authorizeRoles("employee", "manager"), applyLeave);
router.get('/types', getLeaveTypes);
router.get('/users/manager', getManager);
router.get("/holidays", getHolidays)
router.get("/history", getLeaveHistory);
router.get("/pending", authorizeRoles("manager"), getManagerLeaves)
router.get("/balance", getLeaveBalance);
router.get("/team", getTeamLeaves)
router.get("/dashboard", getDashboardData)
router.get("/getuserdata", getuserdetails)
router.post("/calculatedays", calculateDays)
router.get("/getinitdata", getLeaveInitData)
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);

export default router;