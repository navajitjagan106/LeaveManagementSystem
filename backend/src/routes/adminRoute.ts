import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";
import { requirePageAccess } from "../middleware/pageAccessMiddleware";
import {
    getAllEmployees, updateEmployee, deleteEmployee,
    updateManager, createLeaveType, updateLeaveType, addHoliday,
    deleteHoliday, getAllLeaves, getUserLeaveBalance, updateLeaveBalance, exportLeaves,
} from "../controllers/adminController";
import { sendInvitation, getInvitations, resendInvitation, cancelInvitation } from "../controllers/invitationController";
import { getPolicies, createPolicy, deletePolicy, getPolicyRules, setPolicyRules, reassignPolicy, resetLeaveBalance } from "../controllers/leavePolicyController";
import { getPageDefinitions, getUserPermissions, setUserPermissions } from "../controllers/permissionController";

const router = express.Router();

// ── Permissions management (admin only) 
router.get("/pages", authorizeRoles("admin"), getPageDefinitions);
router.get("/users/:id/permissions", authorizeRoles("admin"), getUserPermissions);
router.put("/users/:id/permissions", authorizeRoles("admin"), setUserPermissions);

// ── Invitations 
router.post("/invitations", requirePageAccess("admin_invitations", "edit"), sendInvitation);
router.get("/invitations", requirePageAccess("admin_invitations", "view"), getInvitations);
router.post("/invitations/:id/resend", requirePageAccess("admin_invitations", "edit"), resendInvitation);
router.delete("/invitations/:id", requirePageAccess("admin_invitations", "delete"), cancelInvitation);

// ── Employees 
router.get("/users", requirePageAccess("admin_employees", "view"), getAllEmployees);
router.patch("/users/:id", requirePageAccess("admin_employees", "edit"), updateEmployee);
router.delete("/users/:id", requirePageAccess("admin_employees", "delete"), deleteEmployee);
router.patch("/users/:id/manager", requirePageAccess("admin_employees", "edit"), updateManager);
router.patch("/users/:id/policy", requirePageAccess("admin_employees", "edit"), reassignPolicy);
router.post("/users/:id/reset-balance", requirePageAccess("admin_employees", "edit"), resetLeaveBalance);

// ── Leave types 
router.post("/leave-types", requirePageAccess("admin_leave_types", "edit"), createLeaveType);
router.patch("/leave-types/:id", requirePageAccess("admin_leave_types", "edit"), updateLeaveType);

// ── Policies 
router.get("/policies", requirePageAccess("admin_policies", "view"), getPolicies);
router.post("/policies", requirePageAccess("admin_policies", "edit"), createPolicy);
router.delete("/policies/:id", requirePageAccess("admin_policies", "delete"), deletePolicy);
router.get("/policies/:id/rules", requirePageAccess("admin_policies", "view"), getPolicyRules);
router.put("/policies/:id/rules", requirePageAccess("admin_policies", "edit"), setPolicyRules);

// ── Holidays 
router.post("/holidays", requirePageAccess("admin_holidays", "edit"), addHoliday);
router.delete("/holidays/:id", requirePageAccess("admin_holidays", "delete"), deleteHoliday);

// ── Leaves / balance / export (admin-only, no delegation needed) 
router.get("/leaves", authorizeRoles("admin"), getAllLeaves);
router.get("/user-balance/:id", authorizeRoles("admin"), getUserLeaveBalance);
router.patch("/user-balance", authorizeRoles("admin"), updateLeaveBalance);
router.get("/export", authorizeRoles("admin"), exportLeaves);

export default router;
