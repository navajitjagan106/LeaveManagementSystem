import { Request, Response } from "express";
import { pool } from "../config/db";
import { invalidateCache } from "../utils/cacheUtils";
import { calculateWorkingDays } from "../utils/calculateWorkingDays";
import { getHolidaysinRange } from "../utils/getHolidaysinRange";
import { sendLeaveApplicationEmail, sendLeaveStatusEmail } from "../utils/emailService";

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;
        const userManagerRes = await pool.query("SELECT manager_id FROM users WHERE id = $1", [user_id]);
        const manager_id = userManagerRes.rows[0]?.manager_id || null;

        const [
            balanceResult,
            pendingCount,
            approvedCount,
            teamLeaves
        ] = await Promise.all([

            pool.query(
                `SELECT
                lt.name, lb.total_allocated, lb.used,
                (lb.total_allocated - lb.used) AS remaining,
                lt.is_unlimited
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
                name: row.name,
                total_allocated: Number(row.total_allocated),
                used: Number(row.used),
                remaining: Number(row.remaining),
                is_unlimited: Boolean(row.is_unlimited),
            })),
            pending_requests: Number(pendingCount.rows[0].count),
            approved_requests: Number(approvedCount.rows[0].count),
            team_on_leave: teamLeaves.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
}; // 

export const getLeaveInitData = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;

        const leaveDataRes = await pool.query(
            `SELECT lt.id, lt.name, lt.description, 
            lt.is_unlimited, lb.leave_type_id, lb.total_allocated, 
            lb.used, (lb.total_allocated - lb.used) AS remaining
            FROM leave_balances lb
            JOIN leave_types lt ON lt.id = lb.leave_type_id
            WHERE lb.user_id = $1
            ORDER BY lt.id`,
            [user_id]
        );

        res.json({
            success: true,
            data: {
                leaveTypes: leaveDataRes.rows.map(r => ({ id: r.id, name: r.name, description: r.description, is_unlimited: r.is_unlimited })),
                balances: leaveDataRes.rows.map(r => ({ leave_type_id: r.leave_type_id, type: r.name, total_allocated: r.total_allocated, used: r.used, remaining: r.remaining })),
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch init data" });
    }
}; //

export const applyLeave = async (req: Request, res: Response) => {
    try {
        const { leave_type_id, from_date, to_date, reason, duration_type } = req.body;

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!leave_type_id || !from_date || !to_date || !reason) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (typeof reason !== "string" || reason.trim().length > 500) {
            return res.status(400).json({ error: "Reason must be at most 500 characters." });
        }

        const start = new Date(from_date);
        const end = new Date(to_date);

        if (end < start) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        const user_id = req.user.id;

        const holidaysPromise = getHolidaysinRange(from_date, to_date, pool);
        const balancePromise = pool.query(
            `SELECT lb.total_allocated, lb.used, lt.name AS leave_type_name, lt.is_unlimited
            FROM leave_balances lb
            JOIN leave_types lt ON lt.id = lb.leave_type_id
            WHERE lb.user_id = $1 AND lb.leave_type_id = $2`,
            [user_id, leave_type_id]
        );

        const [holidays, balanceRes] = await Promise.all([holidaysPromise, balancePromise]);

        if (balanceRes.rows.length === 0) {
            return res.status(404).json({ error: "Leave balance not found" });
        }

        const { total_allocated, used, leave_type_name, is_unlimited } = balanceRes.rows[0];
        const remaining = total_allocated - used;

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

        if (!is_unlimited && total_days > remaining) {
            return res.status(400).json({
                error: `Insufficient leave balance. Remaining: ${remaining}`
            });
        }

        const applicantRes = await pool.query(
            `SELECT u.name AS applicant_name, m.id AS manager_id, m.name AS manager_name, m.email AS manager_email
             FROM users u
             LEFT JOIN users m ON u.manager_id = m.id
             WHERE u.id = $1`,
            [user_id]
        );

        if (applicantRes.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const applicantName = applicantRes.rows[0].applicant_name || "";

        let finalManagerId = applicantRes.rows[0]?.manager_id || null;
        let finalManagerEmail = applicantRes.rows[0]?.manager_email || "";
        let finalManagerName = applicantRes.rows[0]?.manager_name || "";

        if (!finalManagerId) {
            const adminRes = await pool.query(
                `SELECT u.id, u.email, u.name FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'admin' LIMIT 1`
            );
            if (adminRes.rows.length > 0) {
                finalManagerId = adminRes.rows[0].id;
                finalManagerEmail = adminRes.rows[0].email;
                finalManagerName = adminRes.rows[0].name;
            } else {
                return res.status(400).json({ error: "No manager assigned, and no admin fallback available in the system" });
            }
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
            [user_id, leave_type_id, from_date, to_date, total_days, reason, finalManagerId, duration_type]
        );
         await pool.query(
            `INSERT INTO notifications (user_id, message)
            VALUES ($1, $2)`,
            [
                finalManagerId,
                `${applicantName} has applied for leave from ${new Date(from_date).toLocaleDateString("en-GB")} to ${new Date(to_date).toLocaleDateString("en-GB")} (${total_days} day${total_days === 1 ? "" : "s"}).`
            ]
        );

        void sendLeaveApplicationEmail({
            managerEmail: finalManagerEmail,
            managerName: finalManagerName,
            employeeName: applicantName,
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
        
        // Invalidate relevant user caches
        await invalidateCache(`user:${user_id}:/api/leaves/dashboard`, true);
        await invalidateCache(`user:${user_id}:/api/leaves/history`, true);
        await invalidateCache(`user:${user_id}:/api/leaves/team`, true);
        await invalidateCache(`user:${user_id}:/api/leaves/teamonleave`, true);

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).json({ error: "Failed to apply leave" });
    }
};//

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
            `UPDATE leaves SET status = 'cancelled' WHERE id = $1`,
            [id]
        );

        res.json({ success: true });
        
        // Invalidate relevant user caches
        await invalidateCache(`user:${req.user.id}:/api/leaves/dashboard`, true);
        await invalidateCache(`user:${req.user.id}:/api/leaves/history`, true);
        await invalidateCache(`user:${req.user.id}:/api/leaves/team`, true);
        await invalidateCache(`user:${req.user.id}:/api/leaves/teamonleave`, true);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to cancel leave" });
    }
};//

export const getLeaveHistory = async (req: Request, res: Response) => {
    try {
        const { status, leave_type_id, search, from_date, to_date, page = 1, limit = 10 } = req.query;
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user_id = req.user.id;
        let query = `
        SELECT l.*, COALESCE(lt.name, 'Unknown Leave Type') as leave_type, u.name as user_name,
        m.name as approved_by_name,
        COUNT(*) OVER() AS total_count
        FROM leaves l
        LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
        JOIN users u ON l.user_id = u.id
        LEFT JOIN users m ON l.approved_by = m.id
        WHERE l.user_id = $1
        `;

        const values: any[] = [user_id];
        let index = 2;

        if (status) {
            query += ` AND l.status = $${index}`;
            values.push(status);
            index++;
        }

        if (leave_type_id) {
            query += ` AND l.leave_type_id = $${index}`;
            values.push(leave_type_id);
            index++;
        }

        if (search) {
            query += ` AND l.reason ILIKE $${index}`;
            values.push(`%${search}%`);
            index++;
        }

        if (from_date && to_date) {
            query += ` AND l.from_date <= $${index} AND l.to_date >= $${index + 1}`;
            values.push(to_date, from_date);
            index += 2;
        }

        const offset = (Number(page) - 1) * Number(limit);

        query += ` ORDER BY l.created_at DESC LIMIT $${index} OFFSET $${index + 1}`;
        values.push(limit, offset);

        const dataResult = await pool.query(query, values);
        const total = dataResult.rows.length > 0 ? Number(dataResult.rows[0].total_count) : 0;

        res.json({
            success: true,
            data: dataResult.rows,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave history" });
    }
};//

export const getLeaveTypes = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            "SELECT id, name FROM leave_types ORDER BY id"
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave types" });
    }
};//

export const getTeamLeaves = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user_id = req.user.id;
        const { role_id } = req.user;

        // Fetch manager_id and role permissions in parallel
        const userPromise = pool.query("SELECT manager_id FROM users WHERE id = $1", [user_id]);
        const permPromise = pool.query(
            "SELECT can_view, scope FROM role_permissions WHERE role_id = $1 AND page_key = 'manage_employees'",
            [role_id]
        );

        const [userResult, permRes] = await Promise.all([userPromise, permPromise]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const role = (req.user as any).role || "employee";
        let scope = 'sub';

        if (role_id === 1) {
            scope = 'all';
        } else if (permRes.rows.length > 0 && permRes.rows[0].can_view) {
            scope = permRes.rows[0].scope || 'sub';
        }

        const manager_id = userResult.rows[0].manager_id;

        let selectFields = `
        l.id,
        u.name,
        COALESCE(lt.name, 'Unknown Leave Type') as leave_type,
        l.from_date,
        l.to_date,
        l.duration_type,
        l.user_id,
        u.manager_id,
        l.status`;

        if (scope === 'all') {
            selectFields += `, l.reason`;
        }

        let query = `
        SELECT ${selectFields}
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
        WHERE (l.status = 'approved' OR (l.user_id = $1 AND l.status = 'pending'))`;

        const values: any[] = [user_id];
        let index = 2;

        if (scope === 'sub') {
            //my teammates data , if am a maanger my sub data and my data
            query += ` AND (u.manager_id = $1 OR u.manager_id = $${index} OR l.user_id = $1)`;
            values.push(manager_id);
        }

        const result = await pool.query(query, values);

        const events = result.rows.map((row) => {

            let category = 'organization';

            if (Number(row.user_id) === Number(user_id)) {
                category = 'self';
            }
            else if (Number(row.manager_id) === Number(user_id)) {
                category = 'reportee';
            }
            else if (manager_id && Number(row.manager_id) === Number(manager_id)) {
                category = 'teammate';
            }



            return {
                id: row.id,
                name: row.name,
                leave_type: row.leave_type,
                from_date: row.from_date,
                to_date: row.to_date,
                duration_type: row.duration_type,
                user_id: row.user_id,
                manager_id: row.manager_id,
                status: row.status,
                category,
                ...(scope === 'all' && { reason: row.reason })
            };
        });

        res.json({ events, role });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch team leaves" });
    }
};//

export const getManagerLeaves = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const fullAccess: boolean = (req as any).fullApprovalAccess === true;
        const caller_id = req.user.id;
        const { status, search, date, page = 1, limit = 10 } = req.query;

        const values: any[] = [];
        let index = 1;

        let baseWhere: string;
        if (fullAccess) {
            baseWhere = `WHERE 1=1`;
        } else {
            baseWhere = `WHERE l.applied_to = $${index}`;
            values.push(caller_id);
            index++;
        }

        let query = `
        SELECT
            l.id, u.name AS employee_name, u.department,
            COALESCE(lt.name, 'Unknown Leave Type') AS leave_type, l.from_date, l.to_date,
            l.total_days, l.reason, l.status, l.rejection_reason, l.approved_at,
            l.created_at AS applied_at,
            l.duration_type,
            l.approved_by,
            au.name AS approved_by_name,
            l.applied_to AS manager_id,
            mu.name AS manager_name,
            COUNT(*) OVER() AS total_count
        FROM leaves l
        JOIN users u  ON l.user_id      = u.id
        LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
        LEFT JOIN users au ON l.approved_by = au.id
        LEFT JOIN users mu ON l.applied_to = mu.id
        ${baseWhere}`;

        if (status) {
            query += ` AND l.status = $${index}`;
            values.push(status);
            index++;
        }
        if (search) {
            query += ` AND u.name ILIKE $${index}`;
            values.push(`%${search}%`);
            index++;
        }
        if (date) {
            query += ` AND l.from_date <= $${index} AND l.to_date >= $${index}`;
            values.push(date);
            index++;
        }

        const offset = (Number(page) - 1) * Number(limit);
        query += `
        ORDER BY
            CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END ASC,
            l.created_at ASC
        LIMIT $${index} OFFSET $${index + 1}`;
        values.push(limit, offset);

        const dataResult = await pool.query(query, values);
        const total = dataResult.rows.length > 0 ? Number(dataResult.rows[0].total_count) : 0;

        res.json({
            success: true,
            data: dataResult.rows,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch pending leaves" });
    }
};//

export const approveLeave = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const fullAccess: boolean = (req as any).fullApprovalAccess === true;
        const leaveId = req.params.id;
        const { status, rejection_reason: rejectionReason } = req.body;
        const manager_id = req.user.id;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        await client.query("BEGIN");

        const leave = await client.query(
            `SELECT l.*, u.email AS employee_email, u.name AS employee_name, lt.name AS leave_type_name, lt.is_unlimited
            FROM leaves l
            JOIN users u ON u.id = l.user_id
            JOIN leave_types lt ON lt.id = l.leave_type_id
            WHERE l.id = $1`,
            [leaveId]
        );

        if (leave.rows.length === 0) {
            const err: any = new Error("Leave not found");
            err.statusCode = 404;
            throw err;
        }

        const leaveData = leave.rows[0];

        if (!fullAccess && leaveData.applied_to !== manager_id) {
            const err: any = new Error("Not authorized");
            err.statusCode = 403;
            throw err;
        }

        if (leaveData.status !== "pending") {
            const err: any = new Error("Already processed");
            err.statusCode = 409;
            throw err;
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
            if (!leaveData.is_unlimited) {
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
                [correctDays, leaveData.user_id, leaveData.leave_type_id]
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

        const emailPromise = sendLeaveStatusEmail({
            employeeEmail,
            employeeName,
            leaveType: leave_type_name,
            status: status as "approved" | "rejected",
            fromDate: leaveData.from_date,
            toDate: leaveData.to_date,
            rejectionReason: status === "rejected" ? (rejectionReason || "No reason provided") : undefined,
        });
        void emailPromise.catch((emailErr: any) => console.error("Failed to send leave decision email:", emailErr));
        res.json({
            success: true,
            data: result.rows[0]
        });
        
        // Invalidate relevant user caches
        await invalidateCache(`user:${leaveData.user_id}:/api/leaves/balance`, true);
        await invalidateCache(`user:${leaveData.user_id}:/api/leaves/dashboard`, true);
        await invalidateCache(`user:${leaveData.user_id}:/api/leaves/history`, true);
        await invalidateCache(`user:${leaveData.user_id}:/api/leaves/team`, true);
        await invalidateCache(`user:${leaveData.user_id}:/api/leaves/teamonleave`, true);
        
        // Invalidate manager/teammate views (clearing role prefix is a broad but safe fallback)
        await invalidateCache('role:', true); 

    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error(err);

        res.status(err.statusCode ?? 400).json({
            error: err.message || "Failed to update leave"
        });

    } finally {
        client.release();
    }
};//

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
                (lb.total_allocated - lb.used) AS remaining,
                lt.is_unlimited
                FROM leave_balances lb
                JOIN leave_types lt ON lb.leave_type_id = lt.id
                WHERE lb.user_id = $1`,
                [user_id]
            ),

            pool.query(
                `
                SELECT
                EXTRACT(DOW FROM d)::int AS day,
                SUM(CASE WHEN l.duration_type = 'half' THEN 0.5 ELSE 1.0 END) AS count
                FROM leaves l,
                GENERATE_SERIES(l.from_date::date, l.to_date::date, INTERVAL '1 day') AS d
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
}; // //

export const getHolidays = async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT id, date, name FROM holidays ORDER BY date")
        res.json(result.rows)

    }
    catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to fetch holidays" })
    }
}//

export const calculateDays = async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, duration_type } = req.body;

        if (!from_date || !to_date) {
            return res.status(400).json({ error: "from_date and to_date are required" });
        }

        if (new Date(to_date) < new Date(from_date)) {
            return res.status(400).json({ error: "to_date must be on or after from_date" });
        }

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
};//

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
};//

export const getNotificationCount = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const result = await pool.query(
            "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false",
            [req.user.id]
        );

        res.json({ success: true, count: result.rows[0].count });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notification count" });
    }
};//

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
};//

export const getTeamOnLeave = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { from_date, to_date } = req.query;
        if (!from_date || !to_date) return res.json({ data: [] });

        const permRes = await pool.query(
            "SELECT scope FROM role_permissions WHERE role_id = $1 AND page_key = 'manage_employees'",
            [req.user.role_id]
        );
        let scope = 'sub';
        if (req.user.role_id === 1) {
            scope = 'all';
        } else if (permRes.rows.length > 0 && permRes.rows[0].scope === 'all') {
            scope = 'all';
        }

        let query = `
            SELECT u.id, u.name,
                TO_CHAR(l.from_date, 'DD Mon YYYY') AS from_date,
                TO_CHAR(l.to_date,   'DD Mon YYYY') AS to_date,
                lt.name AS leave_type
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            JOIN leave_types lt ON lt.id = l.leave_type_id
            WHERE l.status = 'approved'
            AND l.from_date <= $2
            AND l.to_date >= $1
            AND l.user_id != $3
        `;

        if (scope === 'sub') {
            query += ` AND (u.manager_id = (SELECT manager_id FROM users WHERE id = $3) OR u.manager_id = $3)`;
        }

        const result = await pool.query(query, [from_date, to_date, req.user.id]);

        res.json({ data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch team on leave" });
    }
};//

export const getTeamMembers = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { id: userId, role_id: roleId } = req.user;

        const scope = (req as any).directoryScope;

        let result;
        if (scope === "all") {
            if (roleId !== 1) {
                //has access but shud not show admin
                result = await pool.query(
                    `SELECT u.id, u.name, u.email, r.name AS role, u.department,
                            u.phone, u.gender, u.date_of_birth, u.location,
                            u.manager_id, u.policy_id,
                            m.name AS manager_name, p.name AS policy_name
                    FROM users u
                    JOIN roles r ON u.role_id = r.id
                    LEFT JOIN users m ON u.manager_id = m.id
                    LEFT JOIN leave_policies p ON u.policy_id = p.id
                    WHERE r.name <> 'admin'
                    ORDER BY u.name`
                );
            } else {
                //admin
                result = await pool.query(
                    `SELECT u.id, u.name, u.email, r.name AS role, u.department,
                            u.phone, u.gender, u.date_of_birth, u.location,
                            u.manager_id, u.policy_id,
                            m.name AS manager_name, p.name AS policy_name
                    FROM users u
                    JOIN roles r ON u.role_id = r.id
                    LEFT JOIN users m ON u.manager_id = m.id
                    LEFT JOIN leave_policies p ON u.policy_id = p.id
                    ORDER BY u.name`
                );
            }
        } else {
            //manager or reportees
            result = await pool.query(
                `SELECT u.id, u.name, u.email, r.name AS role, u.department,
                        u.phone, u.gender, u.date_of_birth, u.location,
                        u.manager_id, u.policy_id,
                        m.name AS manager_name, p.name AS policy_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN users m ON u.manager_id = m.id
                LEFT JOIN leave_policies p ON u.policy_id = p.id
                WHERE u.manager_id = $1 ORDER BY u.name`,
                [userId]
            );
        }

        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch team members" });
    }
};



export const getLeaveTrendByType = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id: userId } = req.user;
        const months = Number(req.query.months) || 12;
        const scope = (req as any).directoryScope;

        let query = `
        SELECT
            d::date AS date,
            COALESCE(lt.name, 'Unknown Leave Type') AS type,
            COUNT(*)::int AS count,
            ARRAY_AGG(DISTINCT u.name) AS employees
        FROM leaves l
        CROSS JOIN LATERAL generate_series(
            GREATEST(l.from_date, (NOW() - CAST($1 || ' months' AS INTERVAL))::date),
            l.to_date,
            '1 day'::interval
        ) AS d
        LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
        JOIN users u ON l.user_id = u.id
        WHERE l.status = 'approved'
        AND l.to_date >= (NOW() - CAST($1 || ' months' AS INTERVAL))::date
        `;

        const values: any[] = [`${months}`];

        if (scope === "sub") {
            query += ` AND u.manager_id = $2`;
            values.push(userId);
        }

        query += `
        GROUP BY d::date, lt.name
        ORDER BY d::date, lt.name
        `;

        const result = await pool.query(query, values);

        const aggregatedData = result.rows.map((row: any) => ({
            date: row.date.toISOString().split("T")[0],
            type: row.type,
            count: row.count,
            employees: row.employees
        }));

        res.json({
            success: true,
            data: aggregatedData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch leave trend" });
    }
};//



export const getTeamBalanceSummary = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { id: userId } = req.user;

        const scope = (req as any).directoryScope;

        const result = (scope === "all")
            ? await pool.query(
                `SELECT u.id, u.name,
                        COALESCE(SUM(lb.total_allocated), 0) AS total_allocated,
                        COALESCE(SUM(lb.used), 0)            AS used,
                        COALESCE(SUM(lb.total_allocated - lb.used), 0) AS remaining
                FROM users u
                LEFT JOIN leave_balances lb ON lb.user_id = u.id
                GROUP BY u.id, u.name
                ORDER BY u.name`)
            : await pool.query(
                `SELECT u.id, u.name,
                        COALESCE(SUM(lb.total_allocated), 0) AS total_allocated,
                        COALESCE(SUM(lb.used), 0)            AS used,
                        COALESCE(SUM(lb.total_allocated - lb.used), 0) AS remaining
                FROM users u
                LEFT JOIN leave_balances lb ON lb.user_id = u.id
                WHERE u.manager_id = $1
                GROUP BY u.id, u.name
                ORDER BY u.name`,
                [userId]);

        res.json({
            success: true,
            data: result.rows.map(r => ({
                id: r.id,
                name: r.name,
                total_allocated: Number(r.total_allocated),
                used: Number(r.used),
                remaining: Number(r.remaining),
            })),
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch team balance summary" });
    }
};

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const user_id = req.user.id;
        const { phone, gender, date_of_birth, location } = req.body;

        await pool.query(
            `UPDATE users
             SET phone = $1, gender = $2, date_of_birth = $3, location = $4
             WHERE id = $5`,
            [phone || null, gender || null, date_of_birth || null, location || null, user_id]
        );

        const updatedUser = await pool.query(
            `SELECT u.id, u.name, u.email, r.id AS role_id, r.name AS role, u.department, u.phone, u.gender, u.date_of_birth, u.location
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = $1`,
            [user_id]
        );

        res.json({ success: true, data: updatedUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
    }
};//

export const getTeamMemberProfileData = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { id: userId } = req.user;
        const targetId = Number(req.params.id);
        const scope = (req as any).directoryScope;

        if (scope === "sub") {
            const check = await pool.query(
                "SELECT id FROM users WHERE id = $1 AND manager_id = $2",
                [targetId, userId]
            );
            if (check.rows.length === 0)
                return res.status(403).json({ error: "Not your team member" });
        }

        // NEW: Restrict employees from viewing Admins
        const targetUserRole = await pool.query(
            "SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
            [targetId]
        );

        if (targetUserRole.rows.length > 0) {
            const isAdminTarget = targetUserRole.rows[0].name === 'admin';
            const isRequesterAdmin = (req as any).user.role_id === 1;

            if (isAdminTarget && !isRequesterAdmin) {
                return res.status(403).json({ error: "FORBIDDEN ACCESS: You don't have permission to view this profile." });
            }
        }

        const [empResult, balanceResult, monthlyResult] = await Promise.all([
            pool.query(
                `SELECT u.id, u.name, u.email, r.name AS role, u.department,
                        u.phone, u.gender, u.date_of_birth, u.location,
                        m.name AS manager_name, p.name AS policy_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN users m ON u.manager_id = m.id
                LEFT JOIN leave_policies p ON u.policy_id = p.id
                WHERE u.id = $1`,
                [targetId]
            ),
            pool.query(
                `SELECT lb.leave_type_id, lt.name AS type,
                        lb.total_allocated, lb.used,
                        (lb.total_allocated - lb.used) AS remaining
                FROM leave_balances lb
                JOIN leave_types lt ON lb.leave_type_id = lt.id
                WHERE lb.user_id = $1
                ORDER BY lb.leave_type_id`,
                [targetId]
            ),
            pool.query(
                `SELECT
                    TO_CHAR(DATE_TRUNC('month', from_date), 'Mon') AS month,
                    EXTRACT(MONTH FROM from_date)::int AS month_num,
                    SUM(total_days) AS days
                FROM leaves
                WHERE status = 'approved'
                AND user_id = $1
                AND EXTRACT(YEAR FROM from_date) = EXTRACT(YEAR FROM NOW())
                GROUP BY EXTRACT(MONTH FROM from_date), TO_CHAR(DATE_TRUNC('month', from_date), 'Mon')
                ORDER BY month_num`,
                [targetId]
            ),
        ]);

        if (empResult.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json({
            success: true,
            employee: empResult.rows[0],
            balances: balanceResult.rows.map(r => ({
                ...r,
                total_allocated: Number(r.total_allocated),
                used: Number(r.used),
                remaining: Number(r.remaining),
            })),
            monthly: monthlyResult.rows.map(r => ({
                month: r.month,
                days: Number(r.days)
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch team member profile data" });
    }
};//
export const getOrgChart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // 1. Get the user's direct reports (downward)
        const reportsResult = await pool.query(`
            SELECT u.id, u.name, u.email, u.department, u.manager_id, r.label as role,
                   (SELECT COUNT(*) FROM users WHERE manager_id = u.id) > 0 AS has_children
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.manager_id = $1 AND r.name != 'admin'
        `, [userId]);

        // 2. Get the user's manager chain (upward)
        // We can do this with a recursive CTE
        const chainResult = await pool.query(`
            WITH RECURSIVE manager_chain AS (
                SELECT id, name, email, department, manager_id, role_id, 1 as level
                FROM users
                WHERE id = $1
                UNION ALL
                SELECT u.id, u.name, u.email, u.department, u.manager_id, u.role_id, mc.level + 1
                FROM users u
                INNER JOIN manager_chain mc ON u.id = mc.manager_id
            )
            SELECT mc.*, r.label as role,
                   (SELECT COUNT(*) FROM users WHERE manager_id = mc.id) > 0 AS has_children
            FROM manager_chain mc
            LEFT JOIN roles r ON mc.role_id = r.id
            WHERE r.name != 'admin' OR mc.id = $1
            ORDER BY level DESC
        `, [userId]);

        res.json({
            success: true,
            data: {
                chain: chainResult.rows,
                reports: reportsResult.rows
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch org chart" });
    }
};

export const getOrgChildren = async (req: Request, res: Response) => {
    try {
        const { managerId } = req.query;
        if (!managerId) return res.status(400).json({ error: "managerId is required" });

        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.department, u.manager_id, r.label as role,
                   (SELECT COUNT(*) FROM users WHERE manager_id = u.id) > 0 AS has_children
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.manager_id = $1 AND r.name != 'admin'
            ORDER BY u.name ASC
        `, [managerId]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch children" });
    }
};
