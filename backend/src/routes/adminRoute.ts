import express from "express";
import { authenticate } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";
import {
    createEmployee,
    getAllEmployees,
    updateEmployee,
    deleteEmployee,
    updateManager,
    createLeaveType,
    addHoliday,
    deleteHoliday,
    updateLeaveType,
    getAllLeaves,
    getUserLeaveBalance,
    updateLeaveBalance
} from "../controllers/adminController";

const router = express.Router();

router.use(authenticate, authorizeRoles("admin"));

router.post("/users", createEmployee);
router.get("/users", getAllEmployees);
router.patch("/users/:id", updateEmployee);
router.delete("/users/:id", deleteEmployee);
router.patch("/users/:id/manager", updateManager);
router.post("/leave-types", createLeaveType);
router.patch("/leave-types/:id", updateLeaveType);
router.post("/holidays", addHoliday);
router.delete("/holidays/:id", deleteHoliday);
router.get("/leaves",getAllLeaves)
router.get("/user-balance/:id",getUserLeaveBalance)
router.patch("/user-balance",updateLeaveBalance)

export default router;