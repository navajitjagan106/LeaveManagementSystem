import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcrypt";



export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT u.*, m.name AS manager_name, p.name AS policy_name
            FROM users u
            LEFT JOIN users m ON u.manager_id = m.id
            LEFT JOIN leave_policies p ON u.policy_id = p.id
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};


export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { role, manager_id, department } = req.body;
        const result = await pool.query(
            `UPDATE users
            SET role = $1, manager_id = $2, department = $3
            WHERE id = $4
            RETURNING *`,
            [role, manager_id, department, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to update employee" });
    }
};

export const deleteEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete employee" });
    }
};

export const updateManager = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { manager_id } = req.body;

        const result = await pool.query(
            `UPDATE users
            SET manager_id = $1
            WHERE id = $2
            RETURNING *`,
            [manager_id, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to update manager" });
    }
}

export const createLeaveType = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });
        const result = await pool.query(
            `INSERT INTO leave_types (name, description) VALUES ($1, $2) RETURNING *`,
            [name, description || null]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch {
        res.status(500).json({ error: "Failed to create leave type" });
    }
};


export const getAllLeaves = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.id,
                l.from_date,
                l.to_date,
                l.total_days,
                l.status,
                l.created_at,
                u.name as employee_name,
                lt.name as leave_type
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            JOIN leave_types lt ON l.leave_type_id = lt.id
            ORDER BY l.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leaves" });
    }
};

export const updateLeaveType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const result = await pool.query(
            `UPDATE leave_types SET name = $1 WHERE id = $2 RETURNING *`,
            [name, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Leave type not found" });
        res.json({ success: true, data: result.rows[0] });
    } catch {
        res.status(500).json({ error: "Failed to update leave type" });
    }
};


export const addHoliday = async (req: Request, res: Response) => {
    try {
        const { name, date } = req.body;

        if (!name || !date) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const result = await pool.query(
            `INSERT INTO holidays (name, date)
            VALUES ($1, $2)
            RETURNING *`,
            [name, date]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to add holiday" });
    }
};


export const deleteHoliday = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await pool.query(
            `DELETE FROM holidays WHERE id = $1`,
            [id]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ error: "Failed to delete holiday" });
    }
};

export const getUserLeaveBalance = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const requesterId = req.user.id;
        const role = req.user.role;
        const targetUserId = Number(req.params.id);

        if (!["admin"].includes(role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (role === "manager") {
            const check = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND manager_id = $2",
                [targetUserId, requesterId]
            );

            if (check.rows.length === 0) {
                return res.status(403).json({ error: "Not your team member" });
            }
        }

        const result = await pool.query(
            `SELECT 
                lb.leave_type_id,
                lt.name as type,
                lb.total_allocated,
                lb.used,
                (lb.total_allocated - lb.used) AS remaining
            FROM leave_balances lb
            JOIN leave_types lt ON lb.leave_type_id = lt.id
            WHERE lb.user_id = $1
            ORDER BY lb.leave_type_id`,
            [targetUserId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave balance" });
    }
};

export const updateLeaveBalance = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const role = req.user.role;

        const { user_id, leave_type_id, change } = req.body;

        if (!["admin"].includes(role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const balance = await pool.query(
            `SELECT total_allocated, used 
            FROM leave_balances
            WHERE user_id = $1 AND leave_type_id = $2`,
            [user_id, leave_type_id]
        );

        if (balance.rows.length === 0) {
            return res.status(404).json({ error: "Leave type not found" });
        }

        const { total_allocated, used } = balance.rows[0];

        const newTotal = Number(total_allocated) + Number(change);

        if (newTotal < Number(used)) {
            return res.status(400).json({
                error: "Cannot reduce below used leaves"
            });
        }

        if (newTotal < 0) {
            return res.status(400).json({
                error: "Invalid leave balance"
            });
        }

        const result = await pool.query(
            `UPDATE leave_balances
            SET total_allocated = $1
            WHERE user_id = $2 AND leave_type_id = $3
             RETURNING *`,
            [newTotal, user_id, leave_type_id]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update leave balance" });
    }
};

export const exportLeaves = async (req: Request, res: Response) => {
    try {
        const { status, from_date, to_date, department } = req.query;

        const values: any[] = [];
        let index = 1;
        let where = 'WHERE 1=1';

        if (status) { where += ` AND l.status = $${index++}`; values.push(status); }
        if (department) { where += ` AND u.department = $${index++}`; values.push(department); }
        if (from_date) { where += ` AND l.from_date >= $${index++}`; values.push(from_date); }
        if (to_date) { where += ` AND l.to_date <= $${index++}`; values.push(to_date); }

        const result = await pool.query(`
            SELECT
                u.name AS employee,
                u.department,
                lt.name  AS leave_type,
                l.from_date,
                l.to_date,
                l.total_days,
                l.status,
                l.reason,
                l.rejection_reason,
                m.name          AS reviewed_by,
                l.approved_at,
                l.created_at    AS applied_on
            FROM leaves l
            JOIN users u       ON l.user_id     = u.id
            JOIN leave_types lt ON l.leave_type_id = lt.id
            LEFT JOIN users m  ON l.approved_by  = m.id
            ${where}
            ORDER BY l.created_at DESC
        `, values);

        const headers = ['Employee', 'Department', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Reason', 'Manager Note', 'Reviewed By', 'Reviewed At', 'Applied On'];

        const escape = (v: any) => {
            if (v == null) return '';
            const s = String(v).replace(/"/g, '""');
            return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
        };

        const fmt = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

        const rows = result.rows.map(r => [
            r.employee, r.department, r.leave_type,
            fmt(r.from_date), fmt(r.to_date), r.total_days,
            r.status, r.reason, r.rejection_reason,
            r.reviewed_by, fmt(r.approved_at), fmt(r.applied_on),
        ].map(escape).join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leaves_export.csv"');
        res.send(csv);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to export leaves' });
    }
};

