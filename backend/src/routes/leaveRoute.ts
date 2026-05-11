import express from "express";
import {
    applyLeave, approveLeave, calculateDays, cancelLeave,
    getDashboardData, getHolidays, getLeaveBalance, getLeaveHistory,
    getLeaveInitData, getLeaveTypes, getManagerLeaves, getTeamOnLeave,
    getNotifications, getTeamLeaves, markNotificationsRead,
    getTeamMembers, getTeamBalanceSummary, getLeaveTrendByType,
    updateUserProfile, getTeamMemberProfileData,
} from "../controllers/leaveController";
import { authorizeApprovals, authorizeTeamAccess } from "../middleware/pageAccessMiddleware";
import { restrictAdmin } from "../middleware/roleMiddleware";

const router = express.Router();
router.patch("/approve/:id", authorizeApprovals("edit"), approveLeave);
router.post("/apply", restrictAdmin, applyLeave);
router.get('/types', getLeaveTypes);
router.get("/holidays", getHolidays)
router.get("/history", restrictAdmin, getLeaveHistory);
router.get("/pending", authorizeApprovals("view"), getManagerLeaves)
router.get("/balance", restrictAdmin, getLeaveBalance);
router.get("/team", getTeamLeaves)
router.get("/teamonleave", getTeamOnLeave);
router.get("/dashboard", restrictAdmin, getDashboardData)
router.patch("/getuserdata", updateUserProfile)
router.post("/calculatedays", calculateDays)
router.get("/getinitdata", restrictAdmin, getLeaveInitData)
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);
router.delete("/cancel/:id", cancelLeave);
router.get("/team-members", authorizeTeamAccess(), getTeamMembers);
router.get("/team-balance-summary", authorizeTeamAccess(), getTeamBalanceSummary);
router.get("/leave-trend", authorizeTeamAccess(), getLeaveTrendByType);
router.get("/team-member-profile/:id", authorizeTeamAccess(), getTeamMemberProfileData);

export default router;