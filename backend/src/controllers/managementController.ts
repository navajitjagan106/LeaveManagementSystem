import { Request, Response } from "express";
import { pool } from "../config/db";
import { invalidateCache } from "../utils/cacheUtils";



export const getAllEmployees = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { role_id } = req.user;

        let result;
        if (role_id !== 1) {
            result = await pool.query(`
                SELECT u.id, u.name, u.email, u.department, u.manager_id, u.policy_id, u.email_verified, u.phone, u.gender, u.date_of_birth, u.location, u.created_at, r.name AS role, r.id AS role_id, m.name AS manager_name, p.name AS policy_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN users m ON u.manager_id = m.id
                LEFT JOIN leave_policies p ON u.policy_id = p.id
                WHERE r.name <> 'admin'
            `);
        } else {
            result = await pool.query(`
                SELECT u.id, u.name, u.email, u.department, u.manager_id, u.policy_id, u.email_verified, u.phone, u.gender, u.date_of_birth, u.location, u.created_at, r.name AS role, r.id AS role_id, m.name AS manager_name, p.name AS policy_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN users m ON u.manager_id = m.id
                LEFT JOIN leave_policies p ON u.policy_id = p.id
            `);
        }
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { role_id } = (req as any).user;
        
        if (!q) return res.json({ success: true, data: [] });

        const searchTerm = `%${String(q).toLowerCase()}%`;
        
        let query;
        const params = [searchTerm];

        if (role_id === 1) {
            // Admin can search everyone
            query = `
                SELECT u.id, u.name, u.email, r.name as role, u.department
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE (LOWER(u.name) LIKE $1 OR LOWER(u.email) LIKE $1)
                LIMIT 10
            `;
        } else {
            // Employees cannot see admins
            query = `
                SELECT u.id, u.name, u.email, r.name as role, u.department
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE (LOWER(u.name) LIKE $1 OR LOWER(u.email) LIKE $1)
                AND r.name <> 'admin'
                LIMIT 10
            `;
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Search failed" });
    }
};//

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { role, manager_id, department } = req.body;

        if (manager_id) {
            if (Number(manager_id) === Number(id)) {
                return res.status(400).json({ error: "An employee cannot be their own manager" });
            }
            const loopCheck = await pool.query(`
                WITH RECURSIVE chain AS (
                    SELECT id, manager_id FROM users WHERE id = $1
                    UNION ALL
                    SELECT u.id, u.manager_id FROM users u
                    JOIN chain c ON u.id = c.manager_id
                )
                SELECT id FROM chain WHERE id = $2
            `, [manager_id, id]);
            if (loopCheck.rows.length > 0) {
                return res.status(400).json({ error: "Circular manager assignment detected (this manager reports up to the employee)" });
            }
        }

        const normalizedRole = role ? role.toLowerCase().trim() : undefined;
        if (normalizedRole) {
            const validRolesRes = await pool.query("SELECT name FROM roles");
            const validRoles = validRolesRes.rows.map(r => r.name.toLowerCase().trim());
            if (!validRoles.includes(normalizedRole)) {
                return res.status(400).json({ 
                    error: `Invalid role '${role}'. Available roles in the system: ${validRoles.join(", ")}` 
                });
            }
        }

        let targetRoleId = null;
        if (normalizedRole) {
            const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1", [normalizedRole]);
            if (roleRes.rows.length > 0) {
                targetRoleId = roleRes.rows[0].id;
            }
        }

        await pool.query(
            `UPDATE users
            SET role_id = COALESCE($1, role_id), manager_id = $2, department = $3
            WHERE id = $4`,
            [targetRoleId, manager_id, department, id]
        );

        const userRes = await pool.query(
            `SELECT u.id, u.name, u.email, u.department, u.manager_id, u.policy_id, u.email_verified, u.phone, u.gender, u.date_of_birth, u.location, u.created_at, r.id as role_id, r.name as role FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = $1`, 
            [id]
        );

        res.json({ success: true, data: userRes.rows[0] });
        invalidateCache('role:', true); // Invalidate all role-based caches as employee list might change
        invalidateCache('user:', true); // Invalidate user caches as manager/department might change
    } catch (err) {
        res.status(500).json({ error: "Failed to update employee" });
    }
};

export const deleteEmployee = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        if (req.user && String(req.user.id) === String(id)) {
            return res.status(400).json({ error: "You cannot delete your own account." });
        }

        // 1. Check if the user is a manager with active reportees
        const reporteesCheck = await client.query(
            "SELECT COUNT(*) FROM users WHERE manager_id = $1",
            [id]
        );
        const reporteesCount = parseInt(reporteesCheck.rows[0].count, 10);
        if (reporteesCount > 0) {
            return res.status(400).json({
                error: `This employee cannot be deleted because they are assigned as a manager to ${reporteesCount} active reportee(s). Please reassign their reportees first.`
            });
        }

        // 2. Perform cascade cleanup in a transaction
        await client.query("BEGIN");

        await client.query("DELETE FROM leave_balances WHERE user_id = $1", [id]);
        await client.query("UPDATE leaves SET applied_to = NULL WHERE applied_to = $1", [id]);
        await client.query("UPDATE leaves SET approved_by = NULL WHERE approved_by = $1", [id]);
        await client.query("DELETE FROM leaves WHERE user_id = $1", [id]);
        
        const deleteRes = await client.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);
        
        await client.query("COMMIT");

        if (deleteRes.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json({ success: true, message: "Employee and all associated records deleted successfully." });
        invalidateCache('role:', true);
        invalidateCache('user:', true);
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("DELETE EMPLOYEE ERROR:", err);
        res.status(500).json({ 
            error: "Failed to delete employee", 
            details: err instanceof Error ? err.message : String(err) 
        });
    } finally {
        client.release();
    }
};


export const createLeaveType = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });
        const result = await pool.query(
            `INSERT INTO leave_types (name, description) VALUES ($1, $2) RETURNING *`,
            [name, description || null]
        );
        res.json({ success: true, data: result.rows[0] });
        invalidateCache('global:/api/leaves/types', true);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create leave type" });
    }
};//


export const getAllLeaves = async (req: Request, res: Response) => {
    try {
        const { page, limit } = req.query;

        let query = `
            SELECT 
                l.id,
                l.from_date,
                l.to_date,
                l.total_days,
                l.status,
                l.created_at,
                u.name as employee_name,
                COALESCE(lt.name, 'Unknown Leave Type') as leave_type
        `;

        if (page && limit) {
            query += `, COUNT(*) OVER() AS total_count `;
        }

        query += `
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
            ORDER BY l.created_at DESC
        `;
        const values: any[] = [];

        if (page && limit) {
            const pageNum = parseInt(page as string, 10) || 1;
            const limitNum = parseInt(limit as string, 10) || 10;
            const offset = (pageNum - 1) * limitNum;
            query += ` LIMIT $1 OFFSET $2`;
            values.push(limitNum, offset);

            const result = await pool.query(query, values);
            const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;

            return res.json({
                success: true,
                data: result.rows.map(row => {
                    const { total_count, ...rest } = row;
                    return rest;
                }),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });
        }

        const result = await pool.query(query);
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
        const { name, description } = req.body;
        const result = await pool.query(
            `UPDATE leave_types SET name = $1, description = COALESCE($2, description) WHERE id = $3 RETURNING *`,
            [name, description || null, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Leave type not found" });
        res.json({ success: true, data: result.rows[0] });
        invalidateCache('global:/api/leaves/types', true);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update leave type" });
    }
};//

export const deleteLeaveType = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Loss of Pay (ID: 7) should not be deletable as it's the absolute default
        if (Number(id) === 7) {
            return res.status(400).json({ error: "Cannot delete Loss of Pay as it is the system's absolute fallback leave type." });
        }

        // 1. Check if there are any pending or upcoming approved leave requests for this leave type
        const checkQuery = await client.query(`
            SELECT id FROM leaves 
            WHERE leave_type_id = $1 
              AND (
                  status = 'pending' 
                  OR (status = 'approved' AND to_date >= CURRENT_DATE)
              )
            LIMIT 1
        `, [id]);

        if (checkQuery.rows.length > 0) {
            return res.status(400).json({ 
                error: "Cannot delete leave type because there are active pending or upcoming approved leave requests associated with it." 
            });
        }

        // Begin SQL Transaction to delete rules, balances, and update past leaves to NULL
        await client.query("BEGIN");

        // Set leave_type_id to NULL on past or rejected leaves so they remain as "unknown" type
        await client.query("UPDATE leaves SET leave_type_id = NULL WHERE leave_type_id = $1", [id]);

        // Delete leave balances associated with this leave type
        await client.query("DELETE FROM leave_balances WHERE leave_type_id = $1", [id]);

        // Delete policy rules associated with this leave type
        await client.query("DELETE FROM leave_policy_rules WHERE leave_type_id = $1", [id]);

        // Delete the leave type itself
        const deleteRes = await client.query("DELETE FROM leave_types WHERE id = $1 RETURNING *", [id]);

        if (deleteRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Leave type not found" });
        }

        await client.query("COMMIT");
        res.json({ success: true, message: "Leave type successfully deleted" });
        invalidateCache('global:/api/leaves/types', true);
    } catch (err: any) {
        await client.query("ROLLBACK");
        console.error("Error in deleteLeaveType:", err);
        res.status(500).json({ error: "Failed to delete leave type" });
    } finally {
        client.release();
    }
};//


export const addHoliday = async (req: Request, res: Response) => {
    try {
        const { name, date } = req.body;

        if (!name || !date) {
            return res.status(400).json({ error: "Missing fields" });
        }

        if (typeof name !== "string" || name.trim().length > 100) {
            return res.status(400).json({ error: "Holiday name must be at most 100 characters." });
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
        invalidateCache('global:/api/leaves/holidays', true);

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
        invalidateCache('global:/api/leaves/holidays', true);

    } catch (err) {
        res.status(500).json({ error: "Failed to delete holiday" });
    }
};

export const updateHoliday = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, date } = req.body;

        if (!name || !date) {
            return res.status(400).json({ error: "Missing fields" });
        }

        if (typeof name !== "string" || name.trim().length > 100) {
            return res.status(400).json({ error: "Holiday name must be at most 100 characters." });
        }

        const result = await pool.query(
            `UPDATE holidays 
             SET name = $1, date = $2 
             WHERE id = $3 
             RETURNING *`,
            [name, date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Holiday not found" });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
        invalidateCache('global:/api/leaves/holidays', true);

    } catch (err) {
        res.status(500).json({ error: "Failed to update holiday" });
    }
};


export const getUserLeaveBalance = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const requesterId = req.user.id;
        const role_id = req.user.role_id;
        const targetUserId = Number(req.params.id);

        const permResult = await pool.query(
            "SELECT scope FROM role_permissions WHERE role_id = $1 AND page_key = 'manage_employees' LIMIT 1",
            [req.user.role_id]
        );
        const scope = permResult.rows.length > 0 ? permResult.rows[0].scope : 'sub';

        if (role_id !== 1 && requesterId !== targetUserId && scope === "sub") {
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

        const { user_id, leave_type_id, change } = req.body;

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
        invalidateCache(`user:${user_id}:/api/leaves/balance`, true);
        invalidateCache(`user:${user_id}:/api/leaves/dashboard`, true);

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
                COALESCE(lt.name, 'Unknown Leave Type')  AS leave_type,
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
            LEFT JOIN leave_types lt ON l.leave_type_id = lt.id
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

export const getOrgTree = async (req: Request, res: Response) => {
    try {
        const { managerId } = req.query;

        let query = `
            SELECT u.id, u.name, u.email, u.department, u.manager_id, r.label as role,
                   (SELECT COUNT(*) FROM users WHERE manager_id = u.id) > 0 AS has_children
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
        `;

        const values: any[] = [];
        if (managerId) {
            query += ` WHERE u.manager_id = $1`;
            values.push(managerId);
        } else {
            query += ` WHERE u.manager_id IS NULL`;
        }

        query += ` ORDER BY u.name ASC`;

        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch organization tree" });
    }
};

export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const [
            empCountResult,
            invCountResult,
            leaveCountResult,
            holCountResult,
            leavesResult,
        ] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM users"),
            pool.query("SELECT COUNT(*)::int AS count FROM invitations WHERE status = 'pending'"),
            pool.query("SELECT COUNT(*)::int AS count FROM leaves WHERE status = 'pending'"),
            pool.query("SELECT COUNT(*)::int AS count FROM holidays WHERE date >= CURRENT_DATE"),
            pool.query(`
                SELECT l.id, l.from_date, l.status
                FROM leaves l
                WHERE l.status = 'approved'
            `),
        ]);

        res.json({
            success: true,
            stats: {
                employees: empCountResult.rows[0]?.count || 0,
                pendingInvites: invCountResult.rows[0]?.count || 0,
                pendingLeaves: leaveCountResult.rows[0]?.count || 0,
                holidays: holCountResult.rows[0]?.count || 0,
            },
            leaves: leavesResult.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch admin dashboard statistics" });
    }
};//

