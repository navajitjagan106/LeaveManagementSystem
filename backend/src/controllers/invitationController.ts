import { Request, Response } from "express";
import { pool } from "../config/db";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { setAuthCookies } from "../utils/authUtils";
import { fetchUserPermissions } from "../utils/permissionUtils";
import { sendInvitationEmail } from "../utils/emailService";

const MIN_EXPIRY_HOURS = 1;
const MAX_EXPIRY_HOURS = 168;

export const sendInvitation = async (req: Request, res: Response) => {
    try {
        const { name, email, role, department, manager_id, policy_id, expires_in_hours } = req.body;
        const invitedBy = (req as any).user.id;

        if (!name || !email || !role)
            return res.status(400).json({ error: "Name, email and role are required" });

        const normalizedRole = role.toLowerCase().trim();

        // Validate role exists in roles table
        const validRolesRes = await pool.query("SELECT id, name FROM roles");
        const roleMap = new Map<string, number>();
        validRolesRes.rows.forEach(r => roleMap.set(r.name.toLowerCase().trim(), r.id));

        if (!roleMap.has(normalizedRole)) {
            return res.status(400).json({ 
                error: `Invalid role '${role}'. Available roles in the system: ${Array.from(roleMap.keys()).join(", ")}` 
            });
        }
        const targetRoleId = roleMap.get(normalizedRole);

        const expiryHours = Number(expires_in_hours) || 48;
        if (expiryHours < MIN_EXPIRY_HOURS || expiryHours > MAX_EXPIRY_HOURS)
            return res.status(400).json({ error: `Expiry must be between ${MIN_EXPIRY_HOURS} and ${MAX_EXPIRY_HOURS}` });

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1", [email]
        );
        if (existingUser.rows.length > 0)
            return res.status(400).json({ error: "User already exists" });

        const existingInv = await pool.query(
            "SELECT id FROM invitations WHERE email = $1 AND status = 'pending'", [email]
        );
        if (existingInv.rows.length > 0)
            return res.status(400).json({ error: "Pending invitation already exists" });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        const result = await pool.query(
            `INSERT INTO invitations 
            (name, email, role, role_id, department, manager_id, policy_id, token, expires_at, invited_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [name, email, normalizedRole, targetRoleId, department || null, manager_id || null, policy_id || null, token, expiresAt, invitedBy]
        );

        try {
    await sendInvitationEmail({
        name, email, token,
        inviterName: (req.user as any)?.name || "Admin",
        role, department: department || undefined
    });
} catch (emailErr) {
    console.error("Invitation email failed, but invitation was saved. Admin can resend:", emailErr);
}

        res.json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send invitation" });
    }
};

export const getInvitations = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const queryParams: any[] = [];

        let query = `
            SELECT i.*,
            u.name as inviter_name, u.email as inviter_email,
            m.name as manager_name, m.email as manager_email,
            p.name as policy_name,
            CASE 
                WHEN i.expires_at < NOW() AND i.status = 'pending' THEN 'expired'
                ELSE i.status
            END AS derived_status
            FROM invitations i
            LEFT JOIN users u ON i.invited_by = u.id
            LEFT JOIN users m ON i.manager_id = m.id
            LEFT JOIN leave_policies p ON i.policy_id = p.id
        `;

        if (status) {
            queryParams.push(status);
            query += ` WHERE i.status = $1`;
        }

        query += " ORDER BY i.created_at DESC";

        const result = await pool.query(query, queryParams);
        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch invitations" });
    }
};

export const resendInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const inv = await pool.query(
            `SELECT i.*
             FROM invitations i
             WHERE i.id = $1 AND i.status = 'pending'`, [id]
        );

        if (inv.rows.length === 0)
            return res.status(404).json({ error: "Invitation not found" });

        const invitation = inv.rows[0];

        const newToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        await pool.query(
            "UPDATE invitations SET token=$1, expires_at=$2 WHERE id=$3",
            [newToken, expiresAt, id]
        );

        await sendInvitationEmail({
            name: invitation.name,
            email: invitation.email,
            token: newToken,
            inviterName: (req.user as any)?.name || "Admin",
            role: invitation.role,
            department: invitation.department
        });

        res.json({ success: true });

    } catch {
        res.status(500).json({ error: "Failed to resend invitation" });
    }
};

export const cancelInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await pool.query(
            "UPDATE invitations SET status='cancelled' WHERE id=$1",
            [id]
        );

        res.json({ success: true });

    } catch {
        res.status(500).json({ error: "Failed to cancel invitation" });
    }
};

export const getInvitationByToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const result = await pool.query(
            `SELECT * FROM invitations 
            WHERE token=$1 AND status='pending' AND expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Invitation not found or expired" });

        res.json({ success: true, data: result.rows[0] });

    } catch {
        res.status(500).json({ error: "Failed to fetch invitation" });
    }
};

export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password)
            return res.status(400).json({ error: "Password is required" });

        const inv = await pool.query(
            `SELECT * FROM invitations 
            WHERE token=$1 AND status='pending' AND expires_at > NOW()`,
            [token]
        );

        if (inv.rows.length === 0)
            return res.status(400).json({ error: "Invalid or expired invitation" });

        const invitation = inv.rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await pool.query(
            `INSERT INTO users 
            (name, email, password, role, role_id, department, manager_id, policy_id, email_verified)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING *`,
            [
                invitation.name,
                invitation.email,
                hashedPassword,
                invitation.role,
                invitation.role_id,
                invitation.department,
                invitation.manager_id,
                invitation.policy_id
            ]
        );

        const userId = user.rows[0].id;

        if (invitation.policy_id) {
            const rules = await pool.query(
                "SELECT leave_type_id, total_allocated FROM leave_policy_rules WHERE policy_id = $1",
                [invitation.policy_id]
            );

            for (const rule of rules.rows) {
                await pool.query(
                    `INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used) 
                    VALUES ($1, $2, $3, 0)`,
                    [userId, rule.leave_type_id, rule.total_allocated]
                );
            }

            await pool.query(
                `INSERT INTO leave_balances (user_id, leave_type_id, total_allocated, used) 
                VALUES ($1, 7, 0, 0)`,
                [userId]
            );
        }

        await pool.query(
            `UPDATE invitations 
            SET status='accepted', accepted_at=NOW() 
            WHERE id=$1`,
            [invitation.id]
        );



        // Update other invitations waiting on this user to be their manager
        await pool.query(
            `UPDATE invitations 
            SET manager_id = $1, temp_manager_email = NULL 
            WHERE temp_manager_email = $2`,
            [userId, invitation.email]
        );

        // Auto-login the user
        const dbUserResult = await pool.query(
            `SELECT u.*, r.id as role_id FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = $1`, 
            [user.rows[0].id]
        );
        const dbUser = dbUserResult.rows[0];
        const tokenForUser = jwt.sign(
            { 
                id: dbUser.id, 
                role_id: dbUser.role_id, 
                role: dbUser.role, 
                name: dbUser.name, 
                email: dbUser.email,
                manager_id: dbUser.manager_id,
                department: dbUser.department
            },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN as any }
        );

        const permissions = await fetchUserPermissions(dbUser.id, dbUser.role_id);

        const userData = {
            id: dbUser.id, name: dbUser.name, email: dbUser.email,
            role: dbUser.role, manager_id: dbUser.manager_id, department: dbUser.department,
            permissions,
        };

        setAuthCookies(res, tokenForUser);

        res.json({ success: true, user: userData });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to accept invitation" });
    }
};

export const bulkUpload = async (req: Request, res: Response) => {
    try {
        const { csvText } = req.body;
        if (!csvText) {
            return res.status(400).json({ error: "CSV data is required" });
        }

        const invitedBy = (req as any).user.id;

        const records = parseCSV(csvText);
        if (records.length === 0) {
            return res.status(400).json({ error: "CSV contains no valid records" });
        }

        // Fetch dynamic roles from db roles table
        const validRolesRes = await pool.query("SELECT id, name FROM roles");
        const roleMap = new Map<string, number>();
        validRolesRes.rows.forEach(r => roleMap.set(r.name.toLowerCase().trim(), r.id));

        // Fetch all current user emails
        const dbUsersRes = await pool.query("SELECT LOWER(email) as email FROM users");
        const dbUserEmails = new Set(dbUsersRes.rows.map((row: any) => row.email));

        const emailToRecord = new Map<string, any>();
        records.forEach(r => {
            if (r.email) {
                emailToRecord.set(r.email.toLowerCase().trim(), r);
            }
        });

        // 1. Trace reporting cycles inside the CSV records
        const cyclicEmails = new Set<string>();
        records.forEach(r => {
            if (!r.email) return;
            const path = new Set<string>();
            let cur = r;
            while (cur && cur.manageremail) {
                const mgrEmail = cur.manageremail.toLowerCase().trim();
                if (path.has(mgrEmail)) {
                    path.forEach(e => cyclicEmails.add(e));
                    break;
                }
                path.add(cur.email.toLowerCase().trim());
                cur = emailToRecord.get(mgrEmail);
            }
        });

        // 2. Group records into valid and invalid classes
        const validRecords: any[] = [];
        const invalidRecords: any[] = [];

        for (const record of records) {
            const name = record.name?.trim() || "";
            const email = record.email?.toLowerCase().trim() || "";
            const role = record.role?.toLowerCase().trim() || "";
            const managerEmail = record.manageremail?.toLowerCase().trim() || "";

            if (!name || !email || !role) {
                invalidRecords.push({
                    name,
                    email,
                    role,
                    status: "failed",
                    error: "Missing required fields (name, email, or role)"
                });
                continue;
            }

            if (!roleMap.has(role)) {
                invalidRecords.push({
                    name,
                    email,
                    role,
                    status: "failed",
                    error: `Invalid role '${role}'. Available roles in the system: ${Array.from(roleMap.keys()).join(", ")}`
                });
                continue;
            }

            if (cyclicEmails.has(email)) {
                invalidRecords.push({
                    name,
                    email,
                    role,
                    status: "failed",
                    error: "Cannot invite: circular reporting loop / dependency cycle detected"
                });
                continue;
            }

            if (managerEmail && !dbUserEmails.has(managerEmail) && !emailToRecord.has(managerEmail)) {
                invalidRecords.push({
                    name,
                    email,
                    role,
                    status: "failed",
                    error: `Cannot invite: Manager email '${record.manageremail}' does not exist in the system and is not present in this upload`
                });
                continue;
            }

            validRecords.push(record);
        }

        // 3. Sort remaining valid entries topologically
        let sortedRecords: any[] = [];
        if (validRecords.length > 0) {
            try {
                sortedRecords = topologicalSort(validRecords);
            } catch {
                sortedRecords = validRecords;
            }
        }

        const processedList: any[] = [...invalidRecords];
        let successCount = 0;
        let failedCount = invalidRecords.length;

        if (sortedRecords.length > 0) {
            const policyCache = new Map<string, number>();
            const BATCH_SIZE = 5; // Process 5 records at a time to avoid pool/rate-limit exhaustion

            for (let i = 0; i < sortedRecords.length; i += BATCH_SIZE) {
                const batch = sortedRecords.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (record) => {
                    const { name, email, role, department } = record;
                    const managerEmail = record.manageremail || "";
                    const policyName = record.policyname || "";

                    try {
                        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
                        if (existingUser.rows.length > 0) {
                            throw new Error("User with this email already exists");
                        }

                        const existingInv = await pool.query(
                            "SELECT id FROM invitations WHERE email = $1 AND status = 'pending'",
                            [email]
                        );
                        if (existingInv.rows.length > 0) {
                            throw new Error("Pending invitation already exists for this email");
                        }

                        let policy_id: number | null = null;
                        if (policyName) {
                            const normPolicyName = policyName.trim();
                            if (policyCache.has(normPolicyName.toLowerCase())) {
                                policy_id = policyCache.get(normPolicyName.toLowerCase())!;
                            } else {
                                const policyRes = await pool.query(
                                    "SELECT id FROM leave_policies WHERE name ILIKE $1",
                                    [normPolicyName]
                                );
                                if (policyRes.rows.length > 0) {
                                    policy_id = policyRes.rows[0].id;
                                    policyCache.set(normPolicyName.toLowerCase(), policy_id!);
                                }
                            }
                        }

                        let manager_id: number | null = null;
                        let temp_manager_email: string | null = null;

                        if (managerEmail) {
                            const normMgrEmail = managerEmail.trim().toLowerCase();
                            const mgrUserRes = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [normMgrEmail]);
                            if (mgrUserRes.rows.length > 0) {
                                manager_id = mgrUserRes.rows[0].id;
                            } else {
                                temp_manager_email = normMgrEmail;
                            }
                        }

                        const token = crypto.randomBytes(32).toString("hex");
                        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

                        const targetRoleId = roleMap.get(role.toLowerCase().trim()) || null;

                        await pool.query(
                            `INSERT INTO invitations 
                            (name, email, role, role_id, department, manager_id, temp_manager_email, policy_id, token, expires_at, invited_by)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                            [
                                name,
                                email,
                                role.toLowerCase().trim(),
                                targetRoleId,
                                department || null,
                                manager_id,
                                temp_manager_email,
                                policy_id,
                                token,
                                expiresAt,
                                invitedBy
                            ]
                        );

                        // Send email invitation
                        await sendInvitationEmail({
                            name,
                            email,
                            token,
                            inviterName: (req.user as any)?.name || "HR Admin",
                            role,
                            department: department || undefined
                        });

                        successCount++;
                        processedList.push({ name, email, role, status: "invited" });
                    } catch (err: any) {
                        failedCount++;
                        processedList.push({ name, email, role, status: "failed", error: err.message });
                    }
                }));
            }
        }

        return res.json({
            success: true,
            summary: {
                total: records.length,
                successCount,
                failedCount,
                processed: processedList
            }
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: err.message || "Failed to process bulk upload" });
    }
};

// Helper parsing/sorting functions
function parseCSV(text: string) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    const headers = splitCSVLine(lines[0]);
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = splitCSVLine(line);
        const record: any = {};
        headers.forEach((header, index) => {
            const cleanHeader = header.toLowerCase().replace(/_/g, "").trim();
            record[cleanHeader] = values[index]?.trim();
        });
        records.push(record);
    }
    return records;
}

function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(val => val.replace(/^"|"$/g, "").trim());
}

function topologicalSort(records: any[]): any[] {
    const emailToRecord = new Map<string, any>();
    records.forEach(r => emailToRecord.set(r.email.toLowerCase(), r));

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: any[] = [];

    function visit(email: string) {
        const lowerEmail = email.toLowerCase();
        if (visited.has(lowerEmail)) return;
        if (visiting.has(lowerEmail)) {
            return;
        }

        visiting.add(lowerEmail);

        const record = emailToRecord.get(lowerEmail);
        if (record && record.manageremail) {
            const mgrEmail = record.manageremail.toLowerCase();
            if (emailToRecord.has(mgrEmail)) {
                visit(mgrEmail);
            }
        }

        visiting.delete(lowerEmail);
        visited.add(lowerEmail);
        if (record) {
            sorted.push(record);
        }
    }

    records.forEach(r => {
        visit(r.email);
    });

    return sorted;
}