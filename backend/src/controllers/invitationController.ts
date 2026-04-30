import { Request, Response } from "express";
import { pool } from "../config/db";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendInvitationEmail } from "../utils/emailService";

const MIN_EXPIRY_HOURS = 1;
const MAX_EXPIRY_HOURS = 168;

export const sendInvitation = async (req: Request, res: Response) => {
    try {
        const { name, email, role, department, manager_id, policy_id, expires_in_hours } = req.body;
        const invitedBy = (req as any).user.id;

        if (!name || !email || !role)
            return res.status(400).json({ error: "Name, email and role are required" });

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
            (name, email, role, department, manager_id, policy_id, token, expires_at, invited_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [name, email, role, department || null, manager_id || null, policy_id || null, token, expiresAt, invitedBy]
        );

        await sendInvitationEmail({
            name,
            email,
            token,
            inviterName: "Admin",
            role,
            frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
        });

        res.json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send invitation" });
    }
};

export const getInvitations = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT *,
            CASE 
                WHEN expires_at < NOW() AND status = 'pending' THEN 'expired'
                ELSE status
            END AS derived_status
            FROM invitations
        `;

        if (status) {
            query += ` WHERE status = '${status}'`;
        }

        query += " ORDER BY created_at DESC";

        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });

    } catch {
        res.status(500).json({ error: "Failed to fetch invitations" });
    }
};

export const resendInvitation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const inv = await pool.query(
            "SELECT * FROM invitations WHERE id = $1 AND status = 'pending'", [id]
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
            inviterName: "Admin",
            role: invitation.role,
            frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
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

        // CREATE USER (MAIN CHANGE)
        const user = await pool.query(
            `INSERT INTO users 
            (name, email, password, role, department, manager_id, policy_id, email_verified)
            VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING *`,
            [
                invitation.name,
                invitation.email,
                hashedPassword,
                invitation.role,
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

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to accept invitation" });
    }
};