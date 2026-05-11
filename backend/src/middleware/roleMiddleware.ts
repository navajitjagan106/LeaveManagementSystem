import { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

export const authorizeRoles = (...roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const roleRes = await pool.query("SELECT name FROM roles WHERE id = $1", [req.user.role_id]);
        if (roleRes.rows.length === 0) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const userRole = roleRes.rows[0].name;

        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        next();
    };
};

export const restrictAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.role_id === 1) {
        return res.status(403).json({ error: "Administrators do not have leave entitlements or dashboard operations." });
    }
    next();
};