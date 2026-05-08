import express from "express";
import {
    applyLeave, approveLeave, calculateDays, cancelLeave,
    getDashboardData, getHolidays, getLeaveBalance, getLeaveHistory,
    getLeaveInitData, getLeaveTypes, getManagerLeaves, getTeamOnLeave,
    getNotifications, getTeamLeaves, markNotificationsRead,
    getTeamMembers, getTeamMemberBalance, getTeamBalanceSummary, getLeaveTrendByType,
    getTeamMemberMonthly, updateUserProfile,
} from "../controllers/leaveController";
import { authorizeApprovals, authorizeTeamAccess } from "../middleware/pageAccessMiddleware";

const router = express.Router();
router.patch("/approve/:id", authorizeApprovals("edit"), approveLeave);
router.post("/apply", applyLeave);
router.get('/types', getLeaveTypes);
router.get("/holidays", getHolidays)
router.get("/history", getLeaveHistory);
router.get("/pending", authorizeApprovals("view"), getManagerLeaves)
router.get("/balance", getLeaveBalance);
router.get("/team", getTeamLeaves)
router.get("/teamonleave", getTeamOnLeave);
router.get("/dashboard", getDashboardData)
router.patch("/getuserdata", updateUserProfile)
router.post("/calculatedays", calculateDays)
router.get("/getinitdata", getLeaveInitData)
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);
router.delete("/cancel/:id", cancelLeave);
router.get("/team-members", authorizeTeamAccess(), getTeamMembers);
router.get("/team-member-balance/:id", authorizeTeamAccess(), getTeamMemberBalance);
router.get("/team-balance-summary", authorizeTeamAccess(), getTeamBalanceSummary);
router.get("/leave-trend", authorizeTeamAccess(), getLeaveTrendByType);
router.get("/team-member-monthly/:id", authorizeTeamAccess(), getTeamMemberMonthly);

export default router;