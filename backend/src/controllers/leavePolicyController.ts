import { Request, Response } from "express";
import { pool } from "../config/db";

export const getPolicies = async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT p.*, COUNT(r.id)::int AS rule_count
            FROM leave_policies p
            LEFT JOIN leave_policy_rules r ON r.policy_id = p.id
            GROUP BY p.id
            ORDER BY p.created_at ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch {
        res.status(500).json({ error: "Failed to fetch policies" });
    }
};

export const createPolicy = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });
        const result = await pool.query(
            `INSERT INTO leave_policies (name, description) VALUES ($1, $2) RETURNING *`,
            [name, description || null]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        if (err.code === "23505") return res.status(400).json({ error: "Policy name already exists" });
        res.status(500).json({ error: "Failed to create policy" });
    }
};

export const deletePolicy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const used = await pool.query("SELECT id FROM users WHERE policy_id = $1 LIMIT 1", [id]);
        if (used.rows.length > 0)
            return res.status(400).json({ error: "Policy is assigned to employees — reassign them first" });
        await pool.query("DELETE FROM leave_policies WHERE id = $1", [id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Failed to delete policy" });
    }
};

export const getPolicyRules = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT r.id, r.leave_type_id, r.total_allocated, lt.name AS leave_type_name
            FROM leave_policy_rules r
            JOIN leave_types lt ON lt.id = r.leave_type_id
            WHERE r.policy_id = $1
            ORDER BY lt.name
        `, [id]);
        res.json({ success: true, data: result.rows });
    } catch {
        res.status(500).json({ error: "Failed to fetch rules" });
    }
};

export const setPolicyRules = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { rules } = req.body; // [{ leave_type_id, total_allocated }]

        await pool.query("DELETE FROM leave_policy_rules WHERE policy_id = $1", [id]);

        if (rules && rules.length > 0) {
            for (const rule of rules) {
                await pool.query(
                    `INSERT INTO leave_policy_rules (policy_id, leave_type_id, total_allocated)
                     VALUES ($1, $2, $3)`,
                    [id, rule.leave_type_id, rule.total_allocated]
                );
            }
        }

        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Failed to update rules" });
    }
};

// Reassign a policy to an employee — upserts leave_balances
export const reassignPolicy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { policy_id } = req.body;

        await pool.query("UPDATE users SET policy_id = $1 WHERE id = $2", [policy_id || null, id]);
        await pool.query("DELETE FROM leave_balances WHERE user_id = $1", [id]);

        if (policy_id) {
            const rules = await pool.query(
                "SELECT leave_type_id, total_allocated FROM leave_policy_rules WHERE policy_id = $1",
                [policy_id]
            );
            for (const rule of rules.rows) {
                await pool.query(
                    `INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used) VALUES ($1, $2, $3, 0)`,
                    [id, rule.leave_type_id, rule.total_allocated]
                );
            }
        }

        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Failed to reassign policy" });
    }
};

export const resetLeaveBalance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE leave_balances SET used = 0 WHERE user_id = $1", [id]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Failed to reset leave balance" });
    }
};
