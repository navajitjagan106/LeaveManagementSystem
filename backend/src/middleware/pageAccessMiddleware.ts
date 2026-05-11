import { Request, Response, NextFunction } from "express";
import { pool } from "../config/db";

type Action = "view" | "edit" | "delete";

/**
 * Simple in-memory cache for per-page permission lookups.
 * Keyed by "roleId:pageKey", stores the DB row (or null for misses).
 */
const PAGE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const pageCache = new Map<string, { data: any; expires: number }>();

const getPageCached = (roleId: number, pageKey: string) => {
    const key = `${roleId}:${pageKey}`;
    const entry = pageCache.get(key);
    if (entry && Date.now() < entry.expires) return { hit: true, data: entry.data };
    if (entry) pageCache.delete(key);
    return { hit: false, data: null };
};

const setPageCache = (roleId: number, pageKey: string, data: any) => {
    pageCache.set(`${roleId}:${pageKey}`, { data, expires: Date.now() + PAGE_CACHE_TTL_MS });
};


export const invalidatePageAccessCache = (roleId: number) => {
    const prefix = `${roleId}:`;
    for (const key of pageCache.keys()) {
        if (key.startsWith(prefix)) pageCache.delete(key);
    }
};

/**
 * Fetch a single page's permission row for a role, with in-memory cache.
 */
const getCachedPagePerm = async (roleId: number, pageKey: string) => {
    const cached = getPageCached(roleId, pageKey);
    if (cached.hit) return cached.data;

    const result = await pool.query(
        `SELECT can_view, can_edit, can_delete, scope
        FROM role_permissions WHERE role_id = $1 AND page_key = $2`,
        [roleId, pageKey]
    );

    const row = result.rows.length > 0 ? result.rows[0] : null;
    setPageCache(roleId, pageKey, row);
    return row;
};

export const authorizeApprovals = (action: "view" | "edit") =>
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role_id === 1) {
            (req as any).fullApprovalAccess = true;
            return next();
        }

        const reporteesCheck = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM users WHERE manager_id = $1) AS has_reportees",
            [req.user.id]
        );
        const hasReportees = reporteesCheck.rows[0]?.has_reportees === true;

        const perm = await getCachedPagePerm(req.user.role_id, "approvals");

        let allowedByPerm = false;
        let isScopeAll = false;

        if (perm) {
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

        if (req.user.role_id === 1) return next();

        const perm = await getCachedPagePerm(req.user.role_id, pageKey);

        if (!perm) {
            return res.status(403).json({ error: "Access denied" });
        }

        const allowed = action === "view" ? perm.can_view
            : action === "edit" ? perm.can_edit
                : perm.can_delete;

        if (!allowed) return res.status(403).json({ error: "Access denied" });

        next();
    };
};

export const requireAnyPageAccess = (checks: { pageKey: string; action: Action }[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role_id === 1) return next();

        for (const check of checks) {
            const perm = await getCachedPagePerm(req.user.role_id, check.pageKey);
            if (perm) {
                const allowed = check.action === "view" ? perm.can_view
                    : check.action === "edit" ? perm.can_edit
                        : perm.can_delete;
                if (allowed) {
                    return next();
                }
            }
        }

        return res.status(403).json({ error: "Access denied" });
    };
};

export const authorizeTeamAccess = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        if (req.user.role_id === 1) {
            (req as any).directoryScope = "all";
            return next();
        }

        const perm = await getCachedPagePerm(req.user.role_id, "manage_employees");

        if (perm && perm.can_view) {
            (req as any).directoryScope = perm.scope || "sub";
            return next();
        }

        return res.status(403).json({ error: "Access denied" });
    };
};
