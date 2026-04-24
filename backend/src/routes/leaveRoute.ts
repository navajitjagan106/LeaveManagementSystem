import express from "express";
import {
    applyLeave, approveLeave, calculateDays, cancelLeave,
    getDashboardData, getHolidays, getLeaveBalance, getLeaveHistory,
    getLeaveInitData, getLeaveTypes, getManagerLeaves, getTeamOnLeave,
    getNotifications, getTeamLeaves, getuserdetails, markNotificationsRead,
    getTeamMembers, getTeamMemberBalance, getTeamBalanceSummary, getLeaveTrendByType,
} from "../controllers/leaveController";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = express.Router();
router.patch("/approve/:id", authorizeRoles("manager", "admin"), approveLeave);
router.post("/apply", authorizeRoles("employee", "manager"), applyLeave);
router.get('/types', getLeaveTypes);
router.get("/holidays", getHolidays)
router.get("/history", getLeaveHistory);
router.get("/pending", authorizeRoles("manager"), getManagerLeaves)
router.get("/balance", getLeaveBalance);
router.get("/team", getTeamLeaves)
router.get("/teamonleave", getTeamOnLeave);
router.get("/dashboard", getDashboardData)
router.get("/getuserdata", getuserdetails)
router.post("/calculatedays", calculateDays)
router.get("/getinitdata", getLeaveInitData)
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);
router.delete("/cancel/:id", authorizeRoles("employee", "manager"), cancelLeave);
router.get("/team-members", authorizeRoles("manager", "admin"), getTeamMembers);
router.get("/team-member-balance/:id", authorizeRoles("manager", "admin"), getTeamMemberBalance);
router.get("/team-balance-summary", authorizeRoles("manager", "admin"), getTeamBalanceSummary);
router.get("/leave-trend", authorizeRoles("manager", "admin"), getLeaveTrendByType);

export default router;