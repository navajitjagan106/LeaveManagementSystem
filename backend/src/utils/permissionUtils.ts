import { pool } from "../config/db";

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

    // 2. Fetch role-based permission rows
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

    return permissions;
};
