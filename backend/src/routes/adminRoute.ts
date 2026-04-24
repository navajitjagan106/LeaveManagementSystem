import express from "express";
import { authorizeRoles } from "../middleware/roleMiddleware";
import {
    getAllEmployees, updateEmployee, deleteEmployee,
    updateManager, createLeaveType, updateLeaveType, addHoliday,
    deleteHoliday, getAllLeaves, getUserLeaveBalance, updateLeaveBalance, exportLeaves,
} from "../controllers/adminController";
import { sendInvitation, getInvitations, resendInvitation, cancelInvitation } from "../controllers/invitationController";
import { getPolicies, createPolicy, deletePolicy, getPolicyRules, setPolicyRules, reassignPolicy, resetLeaveBalance } from "../controllers/leavePolicyController";

const router = express.Router();
router.use(authorizeRoles("admin"));

router.post("/invitations", sendInvitation);
router.get("/invitations", getInvitations);
router.post("/invitations/:id/resend", resendInvitation);
router.delete("/invitations/:id", cancelInvitation);

router.get("/users", getAllEmployees);
router.patch("/users/:id", updateEmployee);
router.delete("/users/:id", deleteEmployee);
router.patch("/users/:id/manager", updateManager);
router.patch("/users/:id/policy", reassignPolicy);
router.post("/users/:id/reset-balance", resetLeaveBalance);

router.post("/leave-types", createLeaveType);
router.patch("/leave-types/:id", updateLeaveType);

router.get("/policies", getPolicies);
router.post("/policies", createPolicy);
router.delete("/policies/:id", deletePolicy);
router.get("/policies/:id/rules", getPolicyRules);
router.put("/policies/:id/rules", setPolicyRules);

router.post("/holidays", addHoliday);
router.delete("/holidays/:id", deleteHoliday);
router.get("/leaves", getAllLeaves);
router.get("/user-balance/:id", getUserLeaveBalance);
router.patch("/user-balance", updateLeaveBalance);
router.get("/export", exportLeaves);

export default router;
