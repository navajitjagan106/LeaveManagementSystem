import { pool } from "../config/db";

export const fetchUserPermissions = async (userId: number) => {
    const permResult = await pool.query(
        `SELECT page_key, can_view, can_edit, can_delete
        FROM user_page_permissions WHERE user_id = $1`,
        [userId]
    );

    const permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }> = {};
    permResult.rows.forEach((p) => {
        permissions[p.page_key] = { 
            can_view: p.can_view, 
            can_edit: p.can_edit, 
            can_delete: p.can_delete 
        };
    });

    return permissions;
};
