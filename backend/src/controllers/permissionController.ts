import { Request, Response } from "express";
import { pool } from "../config/db";
import { invalidatePermissionCache } from "../utils/permissionUtils";
import { invalidatePageAccessCache } from "../middleware/pageAccessMiddleware";

export const getPageDefinitions = async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT key, label, description FROM page_definitions ORDER BY id`
        );
        res.json({ success: true, data: result.rows });
    } catch {
        res.status(500).json({ error: "Failed to fetch page definitions" });
    }
};

export const getAvailableRoles = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT id, name, label, description FROM roles ORDER BY id`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch available roles" });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, label, description } = req.body;
        if (!name || !label) {
            return res.status(400).json({ error: "Name and label are required" });
        }

        // Ensure name is clean (lowercase, no spaces)
        const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        await pool.query(
            `INSERT INTO roles (name, label, description) VALUES ($1, $2, $3)`,
            [cleanName, label, description || ""]
        );
        res.json({ success: true, data: { name: cleanName, label, description } });
    } catch (err: any) {
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: "A role with this internal name already exists" });
        }
        res.status(500).json({ error: "Failed to create role" });
    }
};

export const getRolePermissions = async (req: Request, res: Response) => {
    try {
        const { role } = req.params; // e.g. manager, hr, employee, admin
        const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
        if (roleRes.rows.length === 0) {
            return res.status(404).json({ error: `Role '${role}' not found` });
        }
        const roleId = roleRes.rows[0].id;

        const result = await pool.query(
            `SELECT page_key, can_view, can_edit, can_delete, scope
            FROM role_permissions
            WHERE role_id = $1`,
            [roleId]
        );

        const permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean; scope: string }> = {};
        result.rows.forEach((row) => {
            permissions[row.page_key] = {
                can_view: row.can_view,
                can_edit: row.can_edit,
                can_delete: row.can_delete,
                scope: row.scope || "sub",
            };
        });

        res.json({ success: true, data: permissions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch role permissions" });
    }
};

export const setRolePermissions = async (req: Request, res: Response) => {
    try {
        const { role } = req.params;
        const { permissions } = req.body as {
            permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean; scope?: string }>;
        };

        if (!permissions || typeof permissions !== "object") {
            return res.status(400).json({ error: "Invalid permissions payload" });
        }

        const roleKey = role as string;
        let roleId;

        const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [roleKey]);
        if (roleRes.rows.length > 0) {
            roleId = roleRes.rows[0].id;
        } else {
            const roleLabel = roleKey.split(/[-_]/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            const insertRes = await pool.query(
                `INSERT INTO roles (name, label, description)
                VALUES ($1, $2, $3) RETURNING id`,
                [roleKey, roleLabel, "Custom corporate role"]
            );
            roleId = insertRes.rows[0].id;
        }

        // Delete existing settings for this specific role
        await pool.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);

        const entries = Object.entries(permissions);

        if (entries.length > 0) {
            const values = entries
                .map((_, i) => `($1, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, $${i * 5 + 6})`)
                .join(", ");

            const params: any[] = [roleId];
            entries.forEach(([key, v]) => {
                params.push(key, v.can_view, v.can_edit, v.can_delete, v.scope || "sub");
            });

            await pool.query(
                `INSERT INTO role_permissions (role_id, page_key, can_view, can_edit, can_delete, scope)
                VALUES ${values}`,
                params
            );
        }

        // Bust in-memory caches so changes take effect immediately
        invalidatePermissionCache(roleId);
        invalidatePageAccessCache(roleId);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save role permissions" });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const role = req.params.role as string;
        const protectedRoles = ["admin", "manager", "employee"];
        if (protectedRoles.includes(role.toLowerCase())) {
            return res.status(400).json({ error: "Cannot delete built-in system roles" });
        }

        const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [role]);
        if (roleRes.rows.length === 0) {
            return res.status(404).json({ error: `Role '${role}' not found` });
        }
        const roleId = roleRes.rows[0].id;

        const empRes = await pool.query("SELECT id FROM roles WHERE name = 'employee'");
        const empRoleId = empRes.rows.length > 0 ? empRes.rows[0].id : 4;

        // 1. Set any users who currently hold this custom role to standard "employee"
        await pool.query(`UPDATE users SET role_id = $1 WHERE role_id = $2`, [empRoleId, roleId]);

        // 2. Set any invitations that hold this custom role to "employee"
        await pool.query(`UPDATE invitations SET role_id = $1 WHERE role_id = $2`, [empRoleId, roleId]);

        // 3. Delete from roles table (this cascades and deletes permissions due to foreign key ON DELETE CASCADE)
        await pool.query(`DELETE FROM roles WHERE id = $1`, [roleId]);

        // Bust in-memory caches for the deleted role
        invalidatePermissionCache(roleId);
        invalidatePageAccessCache(roleId);

        res.json({ success: true, message: `Role '${role}' deleted successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete role" });
    }
};
