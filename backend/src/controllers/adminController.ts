import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcrypt";

// ➕ Add Employee
export const createEmployee = async (req: Request, res: Response) => {
    try {
        const { name, password, email, role, manager_id, department } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name,password, email, role, manager_id, department)
             VALUES ($1, $2, $3, $4, $5,$6)
             RETURNING *`,
            [name, hashedPassword, email, role, manager_id || null, department]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to create employee" });
    }
};

// 📋 Get all employees
export const getAllEmployees = async (_: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT u.*, m.name AS manager_name
            FROM users u
            LEFT JOIN users m ON u.manager_id = m.id
        `);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};

// ✏️ Update employee
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

// ❌ Delete employee
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
        const { name, max_days } = req.body;

        const result = await pool.query(
            `INSERT INTO leave_types (name, max_days)
             VALUES ($1, $2)
             RETURNING *`,
            [name, max_days]
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
    const { id } = req.params;
    const { max_days } = req.body;

    const result = await pool.query(
        `UPDATE leave_types
     SET max_days = $1
     WHERE id = $2
     RETURNING *`,
        [max_days, id]
    );

    res.json({ success: true, data: result.rows[0] });
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