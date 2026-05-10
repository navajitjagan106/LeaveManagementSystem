import { pool } from "../config/db";

/**
 * Simple in-memory cache for role permissions.
 * Keyed by roleId, stores the full permissions object.
 * Auto-expires entries after TTL_MS.
 */
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const permCache = new Map<number, { data: any; expires: number }>();

const getCached = (roleId: number) => {
    const entry = permCache.get(roleId);
    if (entry && Date.now() < entry.expires) return entry.data;
    if (entry) permCache.delete(roleId); // expired
    return null;
};

const setCache = (roleId: number, data: any) => {
    permCache.set(roleId, { data, expires: Date.now() + CACHE_TTL_MS });
};

export const fetchUserPermissions = async (userId: number, roleId?: number) => {
    let userRoleId = roleId;

    // 1. Resolve role_id if not passed
    if (!userRoleId) {
        const userRes = await pool.query("SELECT r.id as role_id FROM users u JOIN roles r ON u.role = r.name WHERE u.id = $1", [userId]);
        if (userRes.rows.length > 0) {
            userRoleId = userRes.rows[0].role_id;
        }
    }

    const permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }> = {};
    if (!userRoleId) return permissions;

    // 2. Check in-memory cache
    const cached = getCached(userRoleId);
    if (cached) return cached;

    // 3. Fetch role-based permission rows from DB
    const permResult = await pool.query(
        `SELECT page_key, can_view, can_edit, can_delete
        FROM role_permissions WHERE role_id = $1`,
        [userRoleId]
    );

    permResult.rows.forEach((p) => {
        permissions[p.page_key] = {
            can_view: p.can_view,
            can_edit: p.can_edit,
            can_delete: p.can_delete
        };
    });

    // 4. Store in cache
    setCache(userRoleId, permissions);

    return permissions;
};

/**
 * Invalidate the cached permissions for a specific role.
 * Call this whenever role_permissions are updated or a role is deleted.
 */
export const invalidatePermissionCache = (roleId: number) => {
    permCache.delete(roleId);
};
