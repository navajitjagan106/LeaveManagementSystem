import { Request, Response } from "express";
import { pool } from "../config/db";
import { calculateWorkingDays } from "../utils/calculateWorkingDays";
import { getHolidaysinRange } from "../utils/getHolidaysinRange";
import { sendLeaveApplicationEmail, sendLeaveApprovedEmail, sendLeaveRejectedEmail } from "../utils/emailService";

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;


        const userResult = await pool.query(
            "SELECT manager_id FROM users WHERE id = $1",
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const { manager_id } = userResult.rows[0];

        const [
            balanceResult,
            pendingCount,
            approvedCount,
            teamLeaves
        ] = await Promise.all([


            pool.query(
                `SELECT 
                lt.name, lb.total_allocated, lb.used, (lb.total_allocated - lb.used) AS remaining
                FROM leave_balances lb JOIN leave_types lt ON lb.leave_type_id = lt.id
                WHERE lb.user_id = $1`,
                [user_id]
            ),


            pool.query(
                `SELECT COUNT(*) 
                FROM leaves 
                WHERE user_id = $1 AND status = 'pending'`,
                [user_id]
            ),


            pool.query(
                `SELECT COUNT(*) 
                FROM leaves 
                WHERE user_id = $1 AND status = 'approved'`,
                [user_id]
            ),

            pool.query(
                `SELECT u.name, l.from_date, l.to_date
                FROM leaves l
                JOIN users u ON l.user_id = u.id
                WHERE u.manager_id = $1
                AND l.status = 'approved'
                AND CURRENT_DATE BETWEEN l.from_date AND l.to_date`,
                [manager_id || user_id]
            )
        ]);


        res.json({
            leave_balance: balanceResult.rows.map(row => ({
                ...row, total_allocated: Number(row.total_allocated),
                used: Number(row.used),
                remaining: Number(row.remaining)
            })),
            pending_requests: Number(pendingCount.rows[0].count),
            approved_requests: Number(approvedCount.rows[0].count),
            team_on_leave: teamLeaves.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};

export const getLeaveInitData = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;

        const [managerRes, leaveDataRes] = await Promise.all([
            pool.query(
                `SELECT u.id, u.name, u.email 
                FROM users u
                JOIN users emp ON emp.manager_id = u.id
                WHERE emp.id = $1`,
                [user_id]
            ),


            pool.query(
            `SELECT 
            lt.id, lt.name, lt.max_days,
            lb.leave_type_id,
            lb.total_allocated,
            lb.used,
            (lb.total_allocated - lb.used) AS remaining
            FROM leave_balances lb
            JOIN leave_types lt ON lt.id = lb.leave_type_id
            WHERE lb.user_id = $1
            ORDER BY lt.id`,
            [user_id]
            )
        ]);

        res.json({
            success: true,
            data: {
                manager: managerRes.rows[0] || null,
                leaveTypes: leaveDataRes.rows.map(r => ({ id: r.id, name: r.name, max_days: r.max_days })),
                balances: leaveDataRes.rows.map(r => ({ leave_type_id: r.leave_type_id, type: r.name, total_allocated: r.total_allocated, used: r.used, remaining: r.remaining }))
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch init data" });
    }
};

export const applyLeave = async (req: Request, res: Response) => {
    try {
        const { leave_type_id, from_date, to_date, reason, duration_type } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!leave_type_id || !from_date || !to_date || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const user_id = req.user.id;

        const holidays = await getHolidaysinRange(from_date, to_date, pool);

        const data = await pool.query(
            `SELECT
            u.manager_id,
            lb.total_allocated,
            lb.used,
            m.email AS manager_email,
            m.name  AS manager_name,
            lt.name AS leave_type_name
            FROM users u
            JOIN leave_balances lb ON lb.user_id = u.id AND lb.leave_type_id = $2
            LEFT JOIN users m ON m.id = u.manager_id
            JOIN leave_types lt ON lt.id = $2
            WHERE u.id = $1`,
            [user_id, leave_type_id]
        );

        if (data.rows.length === 0) {
            return res.status(404).json({ error: "Data not found" });
        }

        const { manager_id, total_allocated, used, manager_email, manager_name, leave_type_name } = data.rows[0];
        const remaining = total_allocated - used;

        if (!manager_id) {
            return res.status(400).json({ error: "No manager assigned" });
        }

        const start = new Date(from_date);
        const end = new Date(to_date);

        if (end < start) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        const total_days = calculateWorkingDays(
            from_date,
            to_date,
            holidays,
            duration_type
        );
        if (total_days === 0) {
            return res.status(400).json({
                error: "Selected dates contain only weekends/holidays"
            });
        }

        if (total_days > remaining) {
            return res.status(400).json({
                error: `Insufficient leave balance. Remaining: ${remaining}`
            });
        }
        const overlapCheck = await pool.query(
            `SELECT * FROM leaves 
            WHERE user_id = $1
            AND status IN ('pending', 'approved')
            AND (
            (from_date <= $3 AND to_date >= $2)
            )`,
            [user_id, from_date, to_date]
        );

        if (overlapCheck.rows.length > 0) {
            return res.status(400).json({
                error: "You already have a leave request for selected dates"
            });
        }

        const result = await pool.query(
            `INSERT INTO leaves 
            (user_id, leave_type_id, from_date, to_date, total_days, reason, applied_to,duration_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [user_id, leave_type_id, from_date, to_date, total_days, reason, manager_id, duration_type]
        );
        await pool.query(
            `INSERT INTO notifications (user_id, message)
            VALUES ($1, $2)`,
            [
                manager_id,
                `${req.user.name} has applied for leave from ${new Date(from_date).toLocaleDateString("en-GB")} to ${new Date(to_date).toLocaleDateString("en-GB")} (${total_days} day${total_days === 1 ? "" : "s"}).`
            ]
        );

        void sendLeaveApplicationEmail({
            managerEmail: manager_email,
            managerName: manager_name,
            employeeName: req.user.name,
            leaveType: leave_type_name,
            fromDate: from_date,
            toDate: to_date,
            totalDays: total_days,
            reason,
        }).catch((emailErr) => console.error("Failed to send leave application email:", emailErr));

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "Failed to apply leave" });
    }
};

export const cancelLeave = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM leaves WHERE id = $1 AND user_id = $2`,
            [id, req.user.id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Leave not found" });

        if (result.rows[0].status !== 'pending')
            return res.status(400).json({ error: "Only pending leaves can be cancelled" });

        await pool.query(
            `DELETE FROM leaves WHERE id = $1`,
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel leave" });
    }
};

export const getLeaveHistory = async (req: Request, res: Response) => {
    try {
        const { status, leave_type_id, search, from_date, to_date, page = 1, limit = 10 } = req.query;
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;
        let query = `
        SELECT l.*, lt.name as leave_type,u.name as user_name
        FROM leaves l
        JOIN leave_types lt ON l.leave_type_id = lt.id
        JOIN users u ON l.user_id=u.id
        WHERE l.user_id = $1
        `;

        let countQuery = `
            SELECT COUNT(*) FROM leaves l WHERE l.user_id = $1
        `;


        const values: any[] = [user_id];
        let index = 2;

        if (status) {
            query += ` AND l.status = $${index}`;
            countQuery += ` AND l.status=$${index} `
            values.push(status);
            index++;
        }

        if (leave_type_id) {
            query += ` AND l.leave_type_id = $${index}`;
            countQuery += ` AND l.leave_type_id=$${index} `
            values.push(leave_type_id);
            index++;
        }

        if (search) {
            query += ` AND l.reason ILIKE $${index}`;
            countQuery += ` AND l.reason ILIKE $${index} `
            values.push(`%${search}%`);
            index++;
        }

        if (from_date && to_date) {
            query += ` AND l.from_date <= $${index} AND l.to_date >= $${index + 1}`;
            countQuery += ` AND l.from_date <= $${index} AND l.to_date >= $${index + 1}`;
            values.push(to_date, from_date);
            index += 2;
        }

        const offset = (Number(page) - 1) * Number(limit);


        query += ` ORDER BY l.created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
        values.push(limit, offset);
        const [dataResult, countResult] = await Promise.all([
            pool.query(query, values),
            pool.query(countQuery, values.slice(0, index - 1))
        ]);

        res.json({
            success: true,
            data: dataResult.rows,
            total: Number(countResult.rows[0].count),
            page: Number(page),
            totalPages: Math.ceil(countResult.rows[0].count / Number(limit))
        });


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave history" });
    }
};

export const getLeaveTypes = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            "SELECT id, name, max_days FROM leave_types ORDER BY id"
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave types" });
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

        let selectFields = `
        l.id,
        u.name,
        lt.name as leave_type,
        l.from_date,
        l.to_date,
        l.duration_type`;

        if (role === "manager") {
            selectFields += `, l.reason`;
        }

        let query = `
        SELECT ${selectFields}
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        JOIN leave_types lt ON l.leave_type_id = lt.id
        WHERE l.status = 'approved'`;

        const values: any[] = [];
        let index = 1;

        if (role === "employee") {
            query += ` AND u.manager_id = $${index}`;
            values.push(manager_id);
        }

        else if (role === "manager") {
            const parentRes = await pool.query("SELECT manager_id from users where id=$1", [user_id])
            const parentManagerId = parentRes.rows[0]?.manager_id
            query += `AND (u.manager_id =$${index} OR u.manager_id=$${index + 1})`
            values.push(user_id, parentManagerId);
        }

        const result = await pool.query(query, values);

        const events = result.rows.map((row) => ({
            name: row.name,
            leave_type: row.leave_type,
            from_date: row.from_date,
            to_date: row.to_date,
            duration_type: row.duration_type
        }));

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch team leaves" });
    }
};

export const getManagerLeaves = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({ error: "Forbidden" });
        }


        const manager_id = req.user.id;
        const { status, search, page = 1, limit = 10 } = req.query;

        let query = `
            SELECT
                l.id, u.name as employee_name, u.department,
                lt.name as leave_type, l.from_date, l.to_date,
                l.total_days, l.reason, l.status,l.rejection_reason, l.approved_at
                FROM leaves l
                JOIN users u ON l.user_id = u.id
                JOIN leave_types lt ON l.leave_type_id = lt.id
                WHERE l.applied_to = $1
                `;

        let countQuery = `
        SELECT COUNT(*) FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE l.applied_to = $1
        `;

        const values: any[] = [manager_id];
        let index = 2;

        if (status) {
            query += ` AND l.status = $${index}`;
            countQuery += ` AND l.status = $${index}`;
            values.push(status);
            index++;
        }
        if (search) {
            query += ` AND u.name ILIKE $${index}`;
            countQuery += ` AND u.name ILIKE $${index}`;
            values.push(`%${search}%`);
            index++;
        }

        const offset = (Number(page) - 1) * Number(limit);
        query += ` ORDER BY 
    CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END,
    CASE WHEN l.status = 'pending' THEN l.created_at END ASC,
    CASE WHEN l.status!='pending' THEN l.created_at END DESC
    LIMIT $${index} OFFSET $${index + 1}`;
        values.push(limit, offset);

        const [dataResult, countResult] = await Promise.all([
            pool.query(query, values),
            pool.query(countQuery, values.slice(0, index - 1))
        ]);

        res.json({
            success: true,
            data: dataResult.rows,
            total: Number(countResult.rows[0].count),
            page: Number(page),
            totalPages: Math.ceil(countResult.rows[0].count / Number(limit))
        });


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pending leaves" });
    }
};

export const approveLeave = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({ error: "Only managers can approve" });
        }

        const leaveId = req.params.id;
        const { status, rejection_reason: rejectionReason } = req.body;
        const manager_id = req.user.id;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await client.query("BEGIN");

        const leave = await client.query(
            `SELECT l.*, u.email AS employee_email, u.name AS employee_name, lt.name AS leave_type_name
             FROM leaves l
             JOIN users u ON u.id = l.user_id
             JOIN leave_types lt ON lt.id = l.leave_type_id
             WHERE l.id = $1`,
            [leaveId]
        );

        if (leave.rows.length === 0) {
            throw new Error("Leave not found");
        }

        const leaveData = leave.rows[0];

        if (leaveData.applied_to !== manager_id) {
            throw new Error("Not authorized");
        }

        if (leaveData.status !== "pending") {
            throw new Error("Already processed");
        }

        let correctDays = leaveData.total_days
        if (status === "approved") {
            const holidays = await getHolidaysinRange(leaveData.from_date, leaveData.to_date, pool);


            correctDays = calculateWorkingDays(
                leaveData.from_date,
                leaveData.to_date,
                holidays,
                leaveData.duration_type || "full"
            );

            if (correctDays === 0) {
                throw new Error("Leave falls only on holidays/weekends");
            }
            const balanceRes = await client.query(
                `SELECT total_allocated, used 
                FROM leave_balances 
                WHERE user_id = $1 AND leave_type_id = $2`,
                [leaveData.user_id, leaveData.leave_type_id]
            );

            const { total_allocated, used } = balanceRes.rows[0];
            const remaining = Number(total_allocated) - Number(used);

            if (correctDays > remaining) {
                throw new Error(`Insufficient leave balance. Employee has ${remaining} day(s) remaining but requested ${correctDays}.`);
            }
        }


        const result = await client.query(
            `UPDATE leaves 
            SET status = $1, approved_by = $2, total_days = $3 , approved_at= NOW() ,rejection_reason = CASE WHEN $6 = 'rejected' THEN $5 ELSE NULL END
            WHERE id = $4
            RETURNING *`,
            [status, manager_id, correctDays, leaveId, rejectionReason ?? null, status]
        );

        if (status === "approved") {
            await client.query(
                `UPDATE leave_balances
                SET used = used + $1
                WHERE user_id = $2 AND leave_type_id = $3`,
                [
                    correctDays,
                    leaveData.user_id,
                    leaveData.leave_type_id
                ]
            );
        }

        await client.query("COMMIT");

        const { employee_email: employeeEmail, employee_name: employeeName, leave_type_name } = leaveData;

        try {
            await pool.query(
                `INSERT INTO notifications (user_id, message)
                VALUES ($1, $2)`,
                [leaveData.user_id,
                status === "approved"
                    ? `Your leave request from ${new Date(leaveData.from_date).toLocaleDateString("en-GB")} to ${new Date(leaveData.to_date).toLocaleDateString("en-GB")} has been approved.`
                    : `Your leave request from ${new Date(leaveData.from_date).toLocaleDateString("en-GB")} to ${new Date(leaveData.to_date).toLocaleDateString("en-GB")} was rejected. Reason: ${rejectionReason || "No reason provided"}`
                ]
            );
        }
        catch (notifErr) {
            console.error("Failed to insert notification:", notifErr);
        }

        const emailPromise = status === "approved"
            ? sendLeaveApprovedEmail({
                employeeEmail,
                employeeName,
                managerName: req.user!.name,
                leaveType: leave_type_name,
                fromDate: leaveData.from_date,
                toDate: leaveData.to_date,
                totalDays: correctDays,
            })
            : sendLeaveRejectedEmail({
                employeeEmail,
                employeeName,
                managerName: req.user!.name,
                leaveType: leave_type_name,
                fromDate: leaveData.from_date,
                toDate: leaveData.to_date,
                totalDays: correctDays,
                rejectionReason: rejectionReason || "No reason provided",
            });
        void emailPromise.catch((emailErr) => console.error("Failed to send leave decision email:", emailErr));
        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error(err);

        res.status(400).json({
            error: err.message || "Failed to update leave"
        });

    } finally {
        client.release();
    }
};

export const getLeaveBalance = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;

        const [balanceResult, weeklyResult] = await Promise.all([

            pool.query(
                `SELECT 
                    lb.leave_type_id,          
                    lt.name as type,
                    lb.total_allocated,
                    lb.used,
                    (lb.total_allocated - lb.used) AS remaining
                FROM leave_balances lb
                JOIN leave_types lt ON lb.leave_type_id = lt.id
                WHERE lb.user_id = $1`,
                [user_id]
            ),

            pool.query(
                `
                SELECT
                    EXTRACT(DOW FROM d)::int AS day,
                    COUNT(*) as count
                FROM leaves l,
                GENERATE_SERIES(l.from_date, l.to_date, INTERVAL '1 day') AS d
                WHERE l.user_id = $1
                AND l.status = 'approved'
                AND EXTRACT(DOW FROM d) NOT IN (0, 6)
                AND d::date NOT IN (SELECT date FROM holidays)
                GROUP BY day
                ORDER BY day;
                `,
                [user_id]
            )
        ]);


        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const weeklyPattern = daysMap.map((day, i) => ({
            day,
            value: 0
        }));

        weeklyResult.rows.forEach((row: any) => {
            weeklyPattern[row.day].value = Number(row.count);
        });
        res.json({
            leaveBalances: balanceResult.rows,
            weeklyPattern
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave balance" });
    }
};

export const getuserdetails = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user_id = req.user.id
        const result = await pool.query(
            `SELECT 
        u.name,
        u.email,
        u.role,
        u.department,
        m.name AS manager_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        WHERE u.id = $1`,
            [user_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });


    }
    catch (err) {
        res.status(500).json({ error: "Cannot fetch user details" })
    }
}

export const getHolidays = async (req: Request, res: Response) => {
    try {
        const result = await pool.query("Select date,name from holidays order by date")
        res.json(result.rows)

    }
    catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch holidays" })
    }
}

export const getManager = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(
            `SELECT u.id, u.name, u.email 
            FROM users u
            JOIN users emp ON emp.manager_id = u.id
            WHERE emp.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Manager not found" });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch manager" });
    }
};

export const calculateDays = async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, duration_type } = req.body;

        const holidayRes = await pool.query(
            `SELECT date FROM holidays WHERE date BETWEEN $1 AND $2`,
            [from_date, to_date]
        );

        const holidays = holidayRes.rows.map(r =>
            r.date.toISOString().split("T")[0]
        );

        const total_days = calculateWorkingDays(
            from_date,
            to_date,
            holidays,
            duration_type
        );

        res.json({ days: total_days });

    } catch (err) {
        res.status(500).json({ error: "Failed to calculate days" });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const result = await pool.query(
            `SELECT id, message, is_read, created_at 
            FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT 20`,
            [req.user.id]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [req.user.id]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to mark notifications as read" });
    }
};