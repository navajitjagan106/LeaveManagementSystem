import { Request, Response } from "express";
import { pool } from "../config/db";

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

export const getUserPermissions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT page_key, can_view, can_edit, can_delete
            FROM user_page_permissions
            WHERE user_id = $1`,
            [id]
        );

        const permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }> = {};
        result.rows.forEach((row) => {
            permissions[row.page_key] = {
                can_view: row.can_view,
                can_edit: row.can_edit,
                can_delete: row.can_delete,
            };
        });

        res.json({ success: true, data: permissions });
    } catch {
        res.status(500).json({ error: "Failed to fetch permissions" });
    }
};

export const setUserPermissions = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body as {
            permissions: Record<string, { can_view: boolean; can_edit: boolean; can_delete: boolean }>;
        };

        if (!permissions || typeof permissions !== "object") {
            return res.status(400).json({ error: "Invalid permissions payload" });
        }

        await pool.query(`DELETE FROM user_page_permissions WHERE user_id = $1`, [id]);

        const entries = Object.entries(permissions).filter(
            ([, v]) => v.can_view || v.can_edit || v.can_delete
        );

        if (entries.length > 0) {
            const values = entries
                .map((_, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`)
                .join(", ");

            const params: any[] = [id];
            entries.forEach(([key, v]) => {
                params.push(key, v.can_view, v.can_edit, v.can_delete);
            });

            await pool.query(
                `INSERT INTO user_page_permissions (user_id, page_key, can_view, can_edit, can_delete)
                VALUES ${values}`,
                params
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save permissions" });
    }
};
