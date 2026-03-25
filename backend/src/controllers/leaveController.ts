import { Request, Response } from "express";
import { pool } from "../config/db";
import { createNotification } from "../utils/notifications"
export const getDashboardData = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;

        // 1️⃣ Get manager_id + department
        const userResult = await pool.query(
            "SELECT manager_id, department FROM users WHERE id = $1",
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const { manager_id, department } = userResult.rows[0];

        // 🔥 Run queries in parallel
        const [
            balanceResult,
            pendingCount,
            approvedCount,
            teamLeaves
        ] = await Promise.all([

            // 2️⃣ Leave balance
            pool.query(
                `SELECT 
          lt.name,
          lb.total_allocated,
          lb.used,
          (lb.total_allocated - lb.used) AS remaining
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         WHERE lb.user_id = $1`,
                [user_id]
            ),

            // 3️⃣ Pending requests count
            pool.query(
                `SELECT COUNT(*) 
         FROM leaves 
         WHERE user_id = $1 AND status = 'pending'`,
                [user_id]
            ),

            // 4️⃣ Approved requests count
            pool.query(
                `SELECT COUNT(*) 
         FROM leaves 
         WHERE user_id = $1 AND status = 'approved'`,
                [user_id]
            ),

            // 5️⃣ Team on leave today
            pool.query(
                `SELECT u.name, l.from_date, l.to_date
         FROM leaves l
         JOIN users u ON l.user_id = u.id
         WHERE u.manager_id = $1
         AND l.status = 'approved'
         AND CURRENT_DATE BETWEEN l.from_date AND l.to_date`,
                [manager_id || user_id] // fallback
            )
        ]);

        // 🎯 Final response
        res.json({
            leave_balance: balanceResult.rows,
            pending_requests: Number(pendingCount.rows[0].count),
            approved_requests: Number(approvedCount.rows[0].count),
            team_on_leave: teamLeaves.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};

export const approveLeave = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({ error: "Only managers can approve" });
        }

        const leaveId = req.params.id;
        const { status } = req.body;

        const manager_id = req.user.id; // 🔥 from JWT

        // validate status
        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }


        // 1. Get leave
        const leave = await pool.query(
            "SELECT * FROM leaves WHERE id = $1",
            [leaveId]
        );

        if (leave.rows.length === 0) {
            return res.status(404).json({ error: "Leave not found" });
        }

        const leaveData = leave.rows[0];
        if (status === "approved") {
            await pool.query(
                `UPDATE leave_balances
     SET used = used + $1
     WHERE user_id = $2 AND leave_type_id = $3`,
                [
                    leaveData.total_days,
                    leaveData.user_id,
                    leaveData.leave_type_id
                ]
            );
        }
        // 2. Check authorization
        if (leaveData.applied_to !== manager_id) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // 3. Prevent re-processing
        if (leaveData.status !== "pending") {
            return res.status(400).json({ error: "Leave already processed" });
        }

        // 4. Update
        const result = await pool.query(
            `UPDATE leaves 
       SET status = $1, approved_by = $2 
       WHERE id = $3
       RETURNING *`,
            [status, manager_id, leaveId]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

        await createNotification(
            leaveData.user_id,
            `Your leave request has been ${status}`
        );

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update leave" });
    }
};


export const getPendingLeaves = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const manager_id = req.user.id;

        const result = await pool.query(
            `SELECT 
        l.id,
        u.name as employee_name,
        lt.name as leave_type,
        l.from_date,
        l.to_date,
        l.reason,
        l.status
       FROM leaves l
       JOIN users u ON l.user_id = u.id
       JOIN leave_types lt ON l.leave_type_id = lt.id
       WHERE l.applied_to = $1 AND l.status = 'pending'`,
            [manager_id]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pending leaves" });
    }
};

export const applyLeave = async (req: Request, res: Response) => {

    try {
        const { leave_type_id, from_date, to_date, reason } = req.body;

        console.log("Incoming data:", req.body);

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;
        const user = await pool.query(
            "SELECT manager_id FROM users WHERE id = $1",
            [user_id]
        );

        console.log("User query result:", user.rows);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const manager_id = user.rows[0].manager_id;


        const start = new Date(from_date);
        const end = new Date(to_date);

        const diffTime = end.getTime() - start.getTime();
        const total_days = diffTime / (1000 * 60 * 60 * 24) + 1;

        const result = await pool.query(
            `INSERT INTO leaves 
    (user_id, leave_type_id, from_date, to_date, total_days, reason, applied_to)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
            [user_id, leave_type_id, from_date, to_date, total_days, reason, manager_id]
        );
        res.json({
            success: true,
            data: result.rows[0]
        });
        await createNotification(
            manager_id,
            `New leave request from user ${user_id}`
        );

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "Failed to apply leave" });
    }
};

export const getLeaveHistory = async (req: Request, res: Response) => {
    try {
        const { status, leave_type_id, search } = req.query;
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;
        let query = `
        SELECT l.*, lt.name as leave_type_name
        FROM leaves l
        JOIN leave_types lt ON l.leave_type_id = lt.id
        WHERE l.user_id = $1
    `;

        const values: any[] = [user_id];
        let index = 2;

        // filter by status
        if (status) {
            query += ` AND l.status = $${index}`;
            values.push(status);
            index++;
        }

        // filter by leave type
        if (leave_type_id) {
            query += ` AND l.leave_type_id = $${index}`;
            values.push(leave_type_id);
            index++;
        }

        // search (reason)
        if (search) {
            query += ` AND l.reason ILIKE $${index}`;
            values.push(`%${search}%`);
            index++;
        }

        query += ` ORDER BY l.created_at DESC`;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave history" });
    }
};

export const getLeaveBalance = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;

        const result = await pool.query(
            `SELECT 
        lt.name,
        lb.total_allocated,
        lb.used,
        (lb.total_allocated - lb.used) AS remaining
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE lb.user_id = $1`,
            [user_id]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave balance" });
    }
};

export const getTeamLeaves = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;
        const role = req.user.role;

        const userResult = await pool.query(
            "SELECT manager_id FROM users WHERE id = $1",
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const manager_id = userResult.rows[0].manager_id;

        // 🔥 dynamic fields
        let selectFields = `
      l.id,
      u.name,
      l.from_date,
      l.to_date
    `;

        if (role === "manager") {
            selectFields += `, l.reason`;
        }

        let query = `
      SELECT ${selectFields}
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'approved'
    `;

        const values: any[] = [];
        let index = 1;

        // 👤 Employee → teammates
        if (role === "employee") {
            query += ` AND u.manager_id = $${index}`;
            values.push(manager_id);
        }

        // 👨‍💼 Manager → direct reports
        else if (role === "manager") {
            query += ` AND u.manager_id = $${index}`;
            values.push(user_id);
        }

        const result = await pool.query(query, values);

        const events = result.rows.map((row) => ({
            title:
                role === "manager"
                    ? `${row.name} - ${row.reason}`
                    : `${row.name} - Leave`,
            start: row.from_date,
            end: row.to_date,
        }));

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch team leaves" });
    }
};