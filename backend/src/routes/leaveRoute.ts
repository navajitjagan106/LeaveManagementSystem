import express from "express";
import {
    applyLeave, approveLeave, calculateDays, cancelLeave,
    getDashboardData, getHolidays, getLeaveBalance, getLeaveHistory,
    getLeaveInitData, getLeaveTypes, getManagerLeaves, getTeamOnLeave,
    getNotifications, getTeamLeaves, markNotificationsRead,
    getNotificationCount,
    getTeamMembers, getTeamBalanceSummary, getLeaveTrendByType,
    updateUserProfile, getTeamMemberProfileData,
    getOrgChart, getOrgChildren,
} from "../controllers/leaveController";
import { authorizeApprovals, authorizeTeamAccess } from "../middleware/pageAccessMiddleware";
import { restrictAdmin } from "../middleware/roleMiddleware";
import { apiCache } from "../middleware/cacheMiddleware";

const router = express.Router();
router.patch("/approve/:id", authorizeApprovals("edit"), approveLeave);
router.post("/apply", restrictAdmin, applyLeave);
router.get('/types', apiCache(600, 'global'), getLeaveTypes);
router.get("/holidays", apiCache(600, 'global'), getHolidays)
router.get("/history", restrictAdmin, getLeaveHistory);
router.get("/pending", authorizeApprovals("view"), getManagerLeaves)
router.get("/balance", restrictAdmin, apiCache(300, 'user'), getLeaveBalance);
router.get("/team", getTeamLeaves)
router.get("/teamonleave", getTeamOnLeave);
router.get("/dashboard", restrictAdmin, apiCache(300, 'user'), getDashboardData)
router.patch("/profile", updateUserProfile)
router.patch("/getuserdata", updateUserProfile)
router.post("/calculatedays", calculateDays)
router.get("/getinitdata", restrictAdmin, apiCache(600, 'user'), getLeaveInitData)
router.get("/notifications", getNotifications);
router.get("/notifications/count", apiCache(30, 'user'), getNotificationCount);
router.patch("/notifications/read", markNotificationsRead);
router.delete("/cancel/:id", cancelLeave);
router.get("/team-members", authorizeTeamAccess(), getTeamMembers);
router.get("/team-balance-summary", authorizeTeamAccess(), getTeamBalanceSummary);
router.get("/leave-trend", authorizeTeamAccess(), getLeaveTrendByType);
router.get("/team-member-profile/:id", authorizeTeamAccess(), getTeamMemberProfileData);
router.get("/org-chart", getOrgChart);
router.get("/org-children", getOrgChildren);

export default router;