import { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

type Action = "view" | "edit" | "delete";

export const authorizeApprovals = (action: "view" | "edit") =>
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role === "admin") {
            (req as any).fullApprovalAccess = true;
            return next();
        }

        const permResult = await pool.query(
            `SELECT can_view, can_edit FROM user_page_permissions
            WHERE user_id = $1 AND page_key = 'approvals'`,
            [req.user.id]
        );

        if (permResult.rows.length > 0) {
            const perm = permResult.rows[0];
            const allowed = action === "view" ? perm.can_view : perm.can_edit;
            if (allowed) {
                (req as any).fullApprovalAccess = true;
                return next();
            }
        }

        if (req.user.role === "manager") {
            (req as any).fullApprovalAccess = false;
            return next();
        }

        return res.status(403).json({ error: "Access denied" });
    };

export const requirePageAccess = (pageKey: string, action: Action) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role === "admin") return next();

        const result = await pool.query(
            `SELECT can_view, can_edit, can_delete
            FROM user_page_permissions
            WHERE user_id = $1 AND page_key = $2`,
            [req.user.id, pageKey]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Access denied" });
        }

        const perm = result.rows[0];
        const allowed = action === "view" ? perm.can_view
            : action === "edit" ? perm.can_edit
                : perm.can_delete;

        if (!allowed) return res.status(403).json({ error: "Access denied" });

        next();
    };
};

export const authorizeEmployeeDirectory = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role === "admin" || req.user.role === "manager") {
            return next();
        }

        const result = await pool.query(
            `SELECT can_view
            FROM user_page_permissions
            WHERE user_id = $1 AND page_key = 'employee_directory'`,
            [req.user.id]
        );

        if (result.rows.length > 0 && result.rows[0].can_view) {
            return next();
        }

        return res.status(403).json({ error: "Access denied" });
    };
};
