import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";
import { requirePageAccess, requireAnyPageAccess } from "../middleware/pageAccessMiddleware";
import {
    getAllEmployees, updateEmployee, deleteEmployee,
    createLeaveType, updateLeaveType, deleteLeaveType, addHoliday,
    deleteHoliday, updateHoliday, getAllLeaves, getUserLeaveBalance, updateLeaveBalance, exportLeaves,
    getAdminDashboardStats,
} from "../controllers/managementController";
import { sendInvitation, getInvitations, resendInvitation, cancelInvitation, bulkUpload } from "../controllers/invitationController";
import { getPolicies, createPolicy, deletePolicy, getPolicyRules, setPolicyRules, reassignPolicy, resetLeaveBalance, updatePolicy } from "../controllers/leavePolicyController";
import { getPageDefinitions, getRolePermissions, setRolePermissions, getAvailableRoles, deleteRole, createRole } from "../controllers/permissionController";

const router = express.Router();

// ── Permissions management
router.get("/pages", requirePageAccess("manage_permissions", "view"), getPageDefinitions);
router.get("/roles", requirePageAccess("manage_permissions", "view"), getAvailableRoles);
router.post("/roles", requirePageAccess("manage_permissions", "edit"), createRole);
router.get("/roles/:role/permissions", requirePageAccess("manage_permissions", "view"), getRolePermissions);
router.put("/roles/:role/permissions", requirePageAccess("manage_permissions", "edit"), setRolePermissions);
router.delete("/roles/:role", requirePageAccess("manage_permissions", "delete"), deleteRole);

// ── Invitations 
router.post("/invitations", requirePageAccess("manage_invitations", "edit"), sendInvitation);
router.get("/invitations", requirePageAccess("manage_invitations", "view"), getInvitations);
router.post("/invitations/:id/resend", requirePageAccess("manage_invitations", "edit"), resendInvitation);
router.delete("/invitations/:id", requirePageAccess("manage_invitations", "delete"), cancelInvitation);
router.post("/bulk-upload", requirePageAccess("bulk_upload", "edit"), bulkUpload);

// ── Employees 
router.get("/users", requirePageAccess("manage_employees", "view"), getAllEmployees);
router.patch("/users/:id", requirePageAccess("manage_employees", "edit"), updateEmployee);
router.delete("/users/:id", requirePageAccess("manage_employees", "delete"), deleteEmployee);
router.patch("/users/:id/policy", requirePageAccess("manage_employees", "edit"), reassignPolicy);
router.post("/users/:id/reset-balance", requirePageAccess("manage_employees", "edit"), resetLeaveBalance);

// ── Leave types 
router.post("/leave-types", requirePageAccess("manage_leave_types", "edit"), createLeaveType);
router.patch("/leave-types/:id", requirePageAccess("manage_leave_types", "edit"), updateLeaveType);
router.delete("/leave-types/:id", requirePageAccess("manage_leave_types", "edit"), deleteLeaveType);

// ── Policies 
router.get("/policies", requireAnyPageAccess([{ pageKey: "manage_policies", action: "view" }, { pageKey: "manage_employees", action: "view" }]), getPolicies);
router.post("/policies", requirePageAccess("manage_policies", "edit"), createPolicy);
router.patch("/policies/:id", requirePageAccess("manage_policies", "edit"), updatePolicy);
router.delete("/policies/:id", requirePageAccess("manage_policies", "delete"), deletePolicy);
router.get("/policies/:id/rules", requirePageAccess("manage_policies", "view"), getPolicyRules);
router.put("/policies/:id/rules", requirePageAccess("manage_policies", "edit"), setPolicyRules);

// ── Holidays 
router.post("/holidays", requirePageAccess("manage_holidays", "edit"), addHoliday);
router.patch("/holidays/:id", requirePageAccess("manage_holidays", "edit"), updateHoliday);
router.delete("/holidays/:id", requirePageAccess("manage_holidays", "delete"), deleteHoliday);

// ── Leaves / balance / export (admin-only, no delegation needed) 
router.get("/leaves", requirePageAccess("manage_leave_records", "view"), getAllLeaves);
router.get("/user-balance/:id", requireAnyPageAccess([{ pageKey: "manage_leave_records", action: "view" }, { pageKey: "manage_employees", action: "view" }]), getUserLeaveBalance);
router.patch("/user-balance", requirePageAccess("manage_leave_records", "edit"), updateLeaveBalance);
router.get("/export", requirePageAccess("manage_leave_records", "view"), exportLeaves);
router.get("/dashboard-stats", requirePageAccess("admin_dashboard", "view"), getAdminDashboardStats);

export default router;
