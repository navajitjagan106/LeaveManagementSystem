import express from "express";
import {
    applyLeave, approveLeave, calculateDays, cancelLeave,
    getDashboardData, getHolidays, getLeaveBalance, getLeaveHistory,
    getLeaveInitData, getLeaveTypes, getManagerLeaves, getTeamOnLeave,
    getNotifications, getTeamLeaves, getuserdetails, markNotificationsRead,
    getTeamMembers, getTeamMemberBalance, getTeamBalanceSummary, getLeaveTrendByType,
    getTeamMemberMonthly, updateUserProfile,
} from "../controllers/leaveController";
import { authorizeRoles } from "../middleware/roleMiddleware";
import { authorizeApprovals, authorizeEmployeeDirectory } from "../middleware/pageAccessMiddleware";

const router = express.Router();
router.patch("/approve/:id", authorizeApprovals("edit"), approveLeave);
router.post("/apply", authorizeRoles("employee", "manager"), applyLeave);
router.get('/types', getLeaveTypes);
router.get("/holidays", getHolidays)
router.get("/history", getLeaveHistory);
router.get("/pending", authorizeApprovals("view"), getManagerLeaves)
router.get("/balance", getLeaveBalance);
router.get("/team", getTeamLeaves)
router.get("/teamonleave", getTeamOnLeave);
router.get("/dashboard", getDashboardData)
router.get("/getuserdata", getuserdetails)
router.patch("/getuserdata", updateUserProfile)
router.post("/calculatedays", calculateDays)
router.get("/getinitdata", getLeaveInitData)
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);
router.delete("/cancel/:id", authorizeRoles("employee", "manager"), cancelLeave);
router.get("/team-members", authorizeEmployeeDirectory(), getTeamMembers);
router.get("/team-member-balance/:id", authorizeEmployeeDirectory(), getTeamMemberBalance);
router.get("/team-balance-summary", authorizeEmployeeDirectory(), getTeamBalanceSummary);
router.get("/leave-trend", authorizeEmployeeDirectory(), getLeaveTrendByType);
router.get("/team-member-monthly/:id", authorizeEmployeeDirectory(), getTeamMemberMonthly);

export default router;