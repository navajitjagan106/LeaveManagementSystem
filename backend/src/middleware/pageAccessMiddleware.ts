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

        const reporteesCheck = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM users WHERE manager_id = $1) AS has_reportees",
            [req.user.id]
        );
        const hasReportees = reporteesCheck.rows[0]?.has_reportees === true;

        const permResult = await pool.query(
            `SELECT can_view, can_edit, scope FROM role_permissions
            WHERE role_id = $1 AND page_key = 'approvals'`,
            [req.user.role_id]
        );

        let allowedByPerm = false;
        let isScopeAll = false;

        if (permResult.rows.length > 0) {
            const perm = permResult.rows[0];
            const allowed = action === "view" ? perm.can_view : perm.can_edit;
            if (allowed) {
                allowedByPerm = true;
                isScopeAll = (perm.scope || "sub") === "all";
            }
        }

        if (hasReportees || allowedByPerm) {
            (req as any).fullApprovalAccess = isScopeAll;
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
            FROM role_permissions
            WHERE role_id = $1 AND page_key = $2`,
            [req.user.role_id, pageKey]
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

export const authorizeTeamAccess = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role === "admin") {
            (req as any).directoryScope = "all";
            return next();
        }

        const result = await pool.query(
            `SELECT can_view, scope
            FROM role_permissions
            WHERE role_id = $1 AND page_key = 'team_access'`,
            [req.user.role_id]
        );

        if (result.rows.length > 0 && result.rows[0].can_view) {
            (req as any).directoryScope = result.rows[0].scope || "sub";
            return next();
        }

        return res.status(403).json({ error: "Access denied" });
    };
};
